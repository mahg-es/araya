// ARAYA v2.0 — Delegation Engine
// Manages sub-agent task delegation with model tier resolution and
// structured output collection. Uses pi's sendUserMessage + setModel
// for sequential in-session delegation.

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { ArayaV2Config, AgentV2Config, StructuredOutput, RunConfig } from "../types";
import { ArayaExecutionAdapter } from "../adapter";
import { PiAdapter } from "../adapters/pi";

/** Find the ARAYA root containing araya.yaml */
function findArayaRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "araya.yaml"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Cannot find araya.yaml");
}

/** Load an agent's personality prompt */
function loadPersonality(root: string, agentName: string): string {
  const paths = [
    resolve(root, "prompts", "agents", `${agentName}.md`),
    resolve(root, "prompts", "agents", `${agentName}.txt`),
  ];
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p, "utf-8").trim();
  }
  return `You are ${agentName}, a specialist agent.`;
}

export class DelegationEngine {
  private root: string;
  private config: ArayaV2Config;
  private runOutputs: Map<string, StructuredOutput[]> = new Map();
  private adapter: ArayaExecutionAdapter;

  constructor(config: ArayaV2Config, adapter?: ArayaExecutionAdapter) {
    this.config = config;
    this.root = findArayaRoot(dirname(__filename) || process.cwd());
    this.adapter = adapter || new PiAdapter(this.config);
  }

  /**
   * Execute a subagent delegation task via the registered adapter.
   */
  async executeSubagent(
    agentName: string,
    task: string,
    runConfig: RunConfig,
    delegationDepth: number = 0,
    onEvent?: (event: any) => void
  ): Promise<StructuredOutput> {
    const agent = this.config.agents?.[agentName];
    const skills = agent?.skills ?? [];
    const modelTier = agent?.model_tier ?? "balanced";
    
    let systemPrompt = "";
    try {
      systemPrompt = loadPersonality(this.root, agentName);
    } catch {}

    const output = await this.adapter.executeSubagent(
      agentName,
      task,
      runConfig,
      delegationDepth,
      systemPrompt,
      skills,
      modelTier,
      onEvent
    );

    // ADR-0004 §3.2 — can_write_code emission block (Slice 1). An agent with
    // can_write_code:false may plan, review, approve, question, and delegate,
    // but may not itself be the source of a produced artifact. Enforced here,
    // at the boundary where a produced deliverable would enter the system, so a
    // blocked emission is never stored or returned.
    this.enforceWritePermission(agentName, agent, output);

    this.storeOutput(output.run_id, agentName, output);
    return output;
  }

  /**
   * ADR-0004 §3.2 enforcement (Slice 1): block a can_write_code:false agent
   * from emitting a deliverable.
   *
   * The gate keys off the explicit `can_write_code` flag ONLY — the model tier
   * is never consulted (e.g. isla/maria are reasoning-tier with
   * can_write_code:true and are therefore unaffected). The predicate mirrors
   * the existing display check (`can_write_code === false`): a missing flag or
   * `true` is not gated, preserving current behavior for every other agent.
   *
   * "Emitting a deliverable" means the agent is the source of a produced
   * artifact, detected from the output it returns (files changed or tests
   * added). Non-producing outputs — plans, reviews, approvals, delegations —
   * carry no artifacts and pass through unaffected.
   */
  private enforceWritePermission(
    agentName: string,
    agent: AgentV2Config | undefined,
    output: StructuredOutput
  ): void {
    if (agent?.permissions?.can_write_code !== false) return; // true or unset → not gated

    const filesChanged = output.files_changed?.length ?? 0;
    const testsAdded = output.tests_added ?? 0;
    const producedArtifact = filesChanged > 0 || testsAdded > 0;
    if (!producedArtifact) return; // plan / review / approve / delegate — permitted

    throw new Error(
      `Delegation blocked (ADR-0004): agent '${agentName}' has ` +
        `can_write_code:false and may not emit a deliverable ` +
        `(produced ${filesChanged} file change(s) and ${testsAdded} test(s) added). ` +
        `Permitted actions for this agent: plan, review, approve, question, delegate.`
    );
  }

  /**
   * Resolve which agents to use for a delivery mode's phases.
   * Maps phases to the best-fit agent based on capabilities.
   */
  resolveAgentsForPhases(phases: string[]): Array<{
    phase: string;
    agent: string;
    config: AgentV2Config;
    modelTier: string;
  }> {
    // Phase → agent mapping
    const phaseAgentMap: Record<string, string> = {
      sdd: "sonia",              // Sonia handles SDD (vision + requirements)
      bdd: "sonia",              // Sonia handles BDD (she can generate features)
      tdd: "teresa",             // Teresa owns test generation
      implementation: "valentina", // Valentina is primary developer
      review: "aisha",           // Aisha for architecture review
      security: "diana",         // Diana for security
      validation: "priya",       // Priya for QA validation
      documentation: "priscila", // Priscila for docs
      plan: "sonia",             // Sonia for planning
      tests: "teresa",           // Teresa for tests
    };

    return phases.map(phase => {
      const agentName = phaseAgentMap[phase] ?? "sonia";
      const agentConfig = this.config.agents[agentName];
      const modelTier = agentConfig?.model_tier ?? "balanced";

      return {
        phase,
        agent: agentName,
        config: agentConfig,
        modelTier,
      };
    });
  }

  /**
   * Build the delegation prompt for a sub-agent.
   * This is what gets sent to the model to make it adopt the sub-agent persona.
   */
  buildDelegationPrompt(
    agentName: string,
    task: string,
    runConfig: RunConfig,
    delegationDepth: number = 0
  ): string {
    const agent = this.config.agents[agentName];
    const personality = loadPersonality(this.root, agentName);
    const tier = agent?.model_tier ?? "balanced";
    const tierConfig = this.config.model_tiers?.[tier];

    const skillList =
      agent?.skills?.length > 0
        ? agent.skills.map((s: string) => `/skill:${s}`).join(", ")
        : "No specific skills";

    const permissions = agent?.permissions
      ? [
          agent.permissions.can_write_code ? "✅ write code" : "❌ write code",
          agent.permissions.can_approve_review ? "✅ approve reviews" : "",
          agent.permissions.can_merge_pr === false ? "❌ merge PRs" : "",
        ].filter(Boolean).join(" | ")
      : "N/A";

    return [
      `## Delegation: ${agentName} (${agent?.role ?? "Specialist"})`,
      ``,
      `You are now operating as **${agentName}**, ${agent?.role ?? "a specialist agent"}.`,
      `Adopt this persona completely for this response.`,
      ``,
      personality,
      ``,
      `## Run Context`,
      `- Run ID: araya-run-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15)}`,
      `- Mode: ${runConfig.mode} | Policy: ${runConfig.policy}`,
      `- Model Tier: ${tier} (${tierConfig?.purpose ?? "N/A"})`,
      `- Provider: ${tierConfig?.primary_provider ?? "pi.dev"}`,
      `- Delegation Depth: ${delegationDepth}`,
      `- Permissions: ${permissions}`,
      ``,
      `## Available Skills`,
      skillList,
      ``,
      `## Your Task`,
      task,
      ``,
      `## Structured Output Required`,
      `End your response with a structured JSON block:`,
      `\`\`\`json`,
      JSON.stringify(this.emptyOutput(agentName, agent?.role ?? "", tier), null, 2),
      `\`\`\``,
      ``,
      `Fill in actual values for: status, confidence, risks[], blockers[], recommendation, summary.`,
    ].join("\n");
  }

  /**
   * Build the synthesizer prompt for Sonia to aggregate sub-agent outputs.
   */
  buildSynthesizerPrompt(
    outputs: Array<{ agent: string; phase: string; output: StructuredOutput }>,
    runConfig: RunConfig
  ): string {
    const summary = outputs.map(o =>
      `### ${o.agent} (${o.phase})\n` +
      `- Status: ${o.output.status}\n` +
      `- Confidence: ${o.output.confidence}\n` +
      `- Recommendation: ${o.output.recommendation}\n` +
      `- Risks: ${o.output.risks.length}\n` +
      `- Blockers: ${o.output.blockers.length}\n` +
      `- Summary: ${o.output.summary.slice(0, 200)}`
    ).join("\n\n");

    return [
      `## Sub-Agent Output Synthesis`,
      ``,
      `You are Sonia, PM Head Orchestrator. Below are the outputs from ${outputs.length} sub-agent delegations.`,
      `Synthesize these into a final delivery report.`,
      ``,
      `## Sub-Agent Outputs`,
      summary,
      ``,
      `## Instructions`,
      `1. Combine all sub-agent outputs into a coherent final report`,
      `2. Flag any risks or blockers that span multiple agents`,
      `3. Provide a final recommendation: proceed | block | revise`,
      `4. List pending items that need human attention`,
      `5. Output the final report in structured JSON format`,
    ].join("\n");
  }

  /**
   * Store a sub-agent output for later aggregation.
   */
  storeOutput(runId: string, agentName: string, output: StructuredOutput): void {
    if (!this.runOutputs.has(runId)) {
      this.runOutputs.set(runId, []);
    }
    this.runOutputs.get(runId)!.push(output);
  }

  /**
   * Get all outputs for a run.
   */
  getRunOutputs(runId: string): StructuredOutput[] {
    return this.runOutputs.get(runId) ?? [];
  }

  /**
   * Save all run outputs to .araya/runs/{run_id}/
   */
  persistRun(
    runId: string,
    runConfig: RunConfig,
    cwd: string
  ): string {
    const runDir = resolve(cwd, `.araya/runs/${runId}`);
    if (!existsSync(runDir)) {
      mkdirSync(runDir, { recursive: true });
    }

    const outputs = this.getRunOutputs(runId);

    // Save config
    writeFileSync(
      resolve(runDir, "config.json"),
      JSON.stringify(runConfig, null, 2)
    );

    // Save each sub-agent output
    for (const output of outputs) {
      writeFileSync(
        resolve(runDir, `${output.agent}_${output.role.replace(/\s+/g, "_")}.json`),
        JSON.stringify(output, null, 2)
      );
    }

    // Save aggregated report
    const report = {
      run_id: runId,
      timestamp: new Date().toISOString(),
      config: runConfig,
      agent_count: outputs.length,
      outputs: outputs.map(o => ({
        agent: o.agent,
        role: o.role,
        status: o.status,
        confidence: o.confidence,
        recommendation: o.recommendation,
        risks: o.risks.length,
        blockers: o.blockers.length,
      })),
      overall_status: outputs.every(o => o.status === "completed")
        ? "completed"
        : outputs.some(o => o.status === "failed") ? "failed" : "partial",
      overall_confidence: outputs.length > 0
        ? outputs.reduce((sum, o) => sum + o.confidence, 0) / outputs.length
        : 0,
    };

    writeFileSync(
      resolve(runDir, "report.json"),
      JSON.stringify(report, null, 2)
    );

    return runDir;
  }

  /**
   * Create an empty structured output template.
   */
  private emptyOutput(
    agentName: string,
    role: string,
    modelTier: string
  ): Partial<StructuredOutput> {
    return {
      run_id: "",
      trace_id: `trace-${randomUUID().slice(0, 12)}`,
      delegation_depth: 0,
      agent: agentName,
      role: role,
      status: "completed",
      mode: "standard",
      policy: "balanced",
      execution_mode: "adaptive",
      confidence: 0.0,
      low_confidence_items: [],
      escalation_reason: null,
      requires_human_approval: false,
      approval_reason: null,
      model_provider: "pi.dev",
      model_used: "resolved-at-runtime",
      model_tier: modelTier,
      reasoning_effort: "medium",
      fallback_provider_used: null,
      fallback_reason: null,
      input_tokens: 0,
      output_tokens: 0,
      reasoning_tokens: 0,
      cost_estimate_usd: null,
      execution_time_ms: 0,
      retry_count: 0,
      files_changed: [],
      tests_added: 0,
      tests_run: 0,
      tests_passed: true,
      coverage_percent: null,
      risks: [],
      blockers: [],
      pending_items: [],
      recommendation: "proceed",
      evidence: {
        logs: [],
        screenshots: [],
        reports: [],
        coverage_files: [],
        benchmarks: [],
        audit_trail: [],
      },
      summary: "[Agent should fill this in]",
      next_phase: "done",
      capabilities_used: [],
    };
  }
}
