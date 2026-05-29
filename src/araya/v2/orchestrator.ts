// ARRAYA v2 — Main Orchestrator
// Ties together all engines and manages the run lifecycle.

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { load } from "js-yaml";
import { randomUUID } from "node:crypto";
import type {
  ArayaV2Config,
  RunConfig,
  RunState,
  StructuredOutput,
  DeliveryModeName,
  WorkflowPolicyName,
  ExecutionModeName,
} from "./types";
import { WorkflowPolicyEngine } from "./engines/workflow-policy";
import { ModelSelectionEngine } from "./engines/model-selection";
import { QualityGateEngine } from "./engines/quality-gate";
import { ExecutionBudgetEngine } from "./engines/execution-budget";
import { CircuitBreakerEngine } from "./engines/circuit-breaker";

export class ArayaOrchestrator {
  public config: ArayaV2Config;
  public workflow: WorkflowPolicyEngine;
  public models: ModelSelectionEngine;
  public gates: QualityGateEngine;
  public budget: ExecutionBudgetEngine;
  public circuits: CircuitBreakerEngine;

  private activeRun: RunState | null = null;

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
    this.workflow = new WorkflowPolicyEngine(this.config);
    this.models = new ModelSelectionEngine(this.config);
    this.gates = new QualityGateEngine(this.config);
    this.budget = new ExecutionBudgetEngine(this.config);
    this.circuits = new CircuitBreakerEngine(this.config);
  }

  /** Load configuration from araya.v2.yaml */
  private loadConfig(configPath?: string): ArayaV2Config {
    if (!configPath) {
      // Find araya.v2.yaml by walking up from the orchestrator file
      let dir = __dirname;
      for (let i = 0; i < 10; i++) {
        const candidate = resolve(dir, "araya.v2.yaml");
        const { existsSync } = require("node:fs");
        if (existsSync(candidate)) {
          configPath = candidate;
          break;
        }
        const parent = resolve(dir, "..");
        if (parent === dir) break;
        dir = parent;
      }
    }

    if (!configPath) {
      throw new Error("ARAYA v2: Cannot find araya.v2.yaml");
    }

    const raw = readFileSync(configPath, "utf-8");
    return load(raw) as ArayaV2Config;
  }

  /** Create a new run. */
  createRun(config: RunConfig): RunState {
    const run_id = `araya-run-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15)}-${randomUUID().slice(0, 8)}`;
    const trace_id = `trace-${randomUUID().slice(0, 12)}`;

    this.budget.start();
    this.circuits.reset();

    this.activeRun = {
      run_id,
      trace_id,
      config,
      start_time: Date.now(),
      phases_completed: [],
      current_phase: "init",
      failures: 0,
      retries: 0,
      cost_accumulated: 0,
      tokens_used: 0,
      agent_outputs: new Map(),
      circuit_breaker_tripped: false,
      budget_exceeded: false,
    };

    return this.activeRun;
  }

  /** Get the phases for the current run's mode + policy. */
  getPhases(run?: RunState): string[] {
    const r = run ?? this.activeRun;
    if (!r) throw new Error("No active run");
    return this.workflow.resolve(r.config.mode, r.config.policy);
  }

  /** Record an agent's output and validate it. */
  recordOutput(
    agentName: string,
    output: StructuredOutput,
    run?: RunState
  ): { passed: boolean; checks: string } {
    const r = run ?? this.activeRun;
    if (!r) throw new Error("No active run");

    // Store output
    r.agent_outputs.set(agentName, output);

    // Update tracking
    r.cost_accumulated += output.cost_estimate_usd ?? 0;
    r.tokens_used += output.input_tokens + output.output_tokens + output.reasoning_tokens;

    // Track failures
    if (output.status !== "completed") {
      r.failures++;
      this.circuits.recordFailure(r.current_phase);
    }

    // Run quality gates
    const gateResult = this.gates.evaluate(output, r.config);

    // Check circuit breakers
    if (this.gates.isSecurityFailure(output)) {
      this.circuits.onSecurityFailure();
    }
    if (this.gates.isSchemaRisk(output)) {
      this.circuits.onSchemaRisk();
    }

    // Check budgets
    if (this.budget.isBudgetExceeded()) {
      this.circuits.onCostThresholdExceeded();
      r.budget_exceeded = true;
    }

    r.circuit_breaker_tripped = this.circuits.isTripped();

    return {
      passed: gateResult.passed,
      checks: gateResult.summary,
    };
  }

  /** Build the standard structured output contract. */
  buildOutput(
    agentName: string,
    status: StructuredOutput["status"],
    overrides: Partial<StructuredOutput> = {},
    run?: RunState
  ): StructuredOutput {
    const r = run ?? this.activeRun;
    const agent = this.config.agents[agentName];

    return {
      run_id: r?.run_id ?? "",
      trace_id: r?.trace_id ?? "",
      delegation_depth: overrides.delegation_depth ?? 0,
      agent: agentName,
      role: agent?.role ?? "",
      status,
      mode: r?.config.mode ?? "standard",
      policy: r?.config.policy ?? "balanced",
      execution_mode: r?.config.execution_mode ?? "adaptive",
      confidence: overrides.confidence ?? 0.95,
      low_confidence_items: overrides.low_confidence_items ?? [],
      escalation_reason: overrides.escalation_reason ?? null,
      requires_human_approval: overrides.requires_human_approval ?? false,
      approval_reason: overrides.approval_reason ?? null,
      model_provider: overrides.model_provider ?? "deepseek",
      model_used: overrides.model_used ?? "resolved-at-runtime",
      model_tier: agent?.model_tier ?? "balanced",
      reasoning_effort: agent?.reasoning_effort ?? "medium",
      fallback_provider_used: overrides.fallback_provider_used ?? null,
      fallback_reason: overrides.fallback_reason ?? null,
      input_tokens: overrides.input_tokens ?? 0,
      output_tokens: overrides.output_tokens ?? 0,
      reasoning_tokens: overrides.reasoning_tokens ?? 0,
      cost_estimate_usd: overrides.cost_estimate_usd ?? null,
      execution_time_ms: overrides.execution_time_ms ?? 0,
      retry_count: overrides.retry_count ?? 0,
      files_changed: overrides.files_changed ?? [],
      tests_added: overrides.tests_added ?? 0,
      tests_run: overrides.tests_run ?? 0,
      tests_passed: overrides.tests_passed ?? true,
      coverage_percent: overrides.coverage_percent ?? null,
      risks: overrides.risks ?? [],
      blockers: overrides.blockers ?? [],
      pending_items: overrides.pending_items ?? [],
      recommendation: overrides.recommendation ?? "proceed",
      evidence: overrides.evidence ?? {
        logs: [],
        screenshots: [],
        reports: [],
        coverage_files: [],
        benchmarks: [],
        audit_trail: [],
      },
      summary: overrides.summary ?? "",
      next_phase: overrides.next_phase ?? "done",
      capabilities_used: overrides.capabilities_used ?? agent?.capabilities ?? [],
    };
  }

  /** Get the active run state. */
  getActiveRun(): RunState | null {
    return this.activeRun;
  }

  /** Check if the active run can continue. */
  canContinue(): { ok: boolean; reason?: string } {
    if (!this.activeRun) {
      return { ok: false, reason: "No active run" };
    }

    if (this.circuits.isTripped()) {
      return {
        ok: false,
        reason: `Circuit breaker tripped: ${this.circuits.getTripReason()}`,
      };
    }

    if (this.budget.isBudgetExceeded()) {
      return { ok: false, reason: "Execution budget exceeded" };
    }

    return { ok: true };
  }

  /** Get a summary report of the active run. */
  getRunReport(): string {
    if (!this.activeRun) return "No active run.";

    const r = this.activeRun;
    const budgetStatus = this.budget.getStatus();
    const phaseList = this.getPhases(r);
    const completedPhases = r.phases_completed.join(", ") || "none";
    const agentCount = r.agent_outputs.size;

    return [
      `# Run Report — ${r.run_id}`,
      ``,
      `**Mode:** ${r.config.mode} | **Policy:** ${r.config.policy} | **Execution:** ${r.config.execution_mode}`,
      `**Safe Mode:** ${r.config.safe_mode ? "ON" : "OFF"}`,
      ``,
      `## Phases`,
      `Required: ${phaseList.join(" → ")}`,
      `Completed: ${completedPhases}`,
      `Current: ${r.current_phase}`,
      ``,
      `## Budget`,
      `Cost: $${budgetStatus.cost.used.toFixed(4)} / $${budgetStatus.cost.max.toFixed(2)} ${budgetStatus.cost.exceeded ? "⚠️ EXCEEDED" : ""}`,
      `Time: ${budgetStatus.time.elapsed_min.toFixed(1)}min / ${budgetStatus.time.max_min}min ${budgetStatus.time.exceeded ? "⚠️ EXCEEDED" : ""}`,
      `Tokens: ${budgetStatus.tokens.used}`,
      ``,
      `## Agents`,
      `${agentCount} agent(s) produced output`,
      `Failures: ${r.failures} | Retries: ${r.retries}`,
      `Circuit breaker: ${r.circuit_breaker_tripped ? "TRIPPED 🔴" : "OK 🟢"}`,
    ].join("\n");
  }
}
