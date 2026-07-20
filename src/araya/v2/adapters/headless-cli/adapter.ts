// ARAYA v2.0 — HeadlessCliAdapter (AX Slice 10), per Accepted ADR-0014.
//
// A NEW ArayaExecutionAdapter implementation (§3.2) that dispatches a unit of work
// to an external coding CLI in headless mode and returns the result to ARAYA as a
// subagent's StructuredOutput — resolved via the existing resolveAdapter factory,
// alongside pi/mock/terminal-api. NO parallel execution stack: the delegation /
// disposition / verifier path is unchanged; this adapter just feeds it.
//
// THE EVIDENCE CONTRACT (§3.1, load-bearing). The external CLI is a black box, so
// its output is a PRODUCER'S CLAIM, never accepted at face value:
//   * status is derived from the CLI's own exit/timeout ONLY — the backend's claim
//     of "done" (exit 0) is carried as status:"completed", nothing more;
//   * the EVIDENCE attached is observed independently — the real working-tree delta
//     and, when the unit has tests, the REAL test result (run + pass/fail) — never
//     the CLI's self-report.
// The downstream verifier (daneel) then gates the claim against that evidence
// (delegation.buildEvidence reads tests_run/tests_passed): a passing test result
// substantiates the success; a failing or absent test result on a unit that has
// tests substantiates nothing -> ASK, not SUCCESS. A file delta alone never
// substantiates. The backend is stamped producer and can never be the emitter.

import type { ArayaExecutionAdapter, ExecutionEvent, HostCapabilities } from "../../adapter";
import type { StructuredOutput, RunConfig } from "../../types";
import { claudeCodeDescriptor } from "./invocation";
import type { BackendDescriptor } from "./invocation";

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes; failure/timeout is first-class.

export interface HeadlessCliAdapterOptions {
  /**
   * The backend descriptor (the isolated, version-fragile invocation surface).
   * Defaults to the Claude Code pilot backend. Injectable so tests can mock the
   * CLI invocation (no real, billed calls) and so future backends (Codex,
   * Antigravity) are added as descriptors without touching this core.
   */
  descriptor?: BackendDescriptor;
  /** Working directory the backend runs in (default: process cwd). */
  cwd?: string;
  /** Hard timeout for a CLI invocation, in ms. */
  timeoutMs?: number;
  /** Extra environment for the child process. */
  env?: NodeJS.ProcessEnv;
}

export class HeadlessCliAdapter implements ArayaExecutionAdapter {
  private readonly descriptor: BackendDescriptor;
  private readonly cwd: string;
  private readonly timeoutMs: number;
  private readonly env?: NodeJS.ProcessEnv;

  constructor(opts: HeadlessCliAdapterOptions = {}) {
    this.descriptor = opts.descriptor ?? claudeCodeDescriptor();
    this.cwd = opts.cwd ?? process.cwd();
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.env = opts.env;
  }

  /** The backend identity stamped as the unit's producer. */
  get backendId(): string {
    return this.descriptor.id;
  }

  async executeSubagent(
    agentName: string,
    task: string,
    runConfig: RunConfig,
    delegationDepth: number = 0,
    systemPrompt?: string,
    skills?: string[],
    modelTier?: string,
    onEvent?: (event: ExecutionEvent) => void
  ): Promise<StructuredOutput> {
    const opts = { cwd: this.cwd, task, timeoutMs: this.timeoutMs, env: this.env };
    const log = (message: string) =>
      onEvent?.({ type: "log", agent: agentName, payload: { message } });

    log(`Dispatching unit to headless backend '${this.descriptor.id}'`);
    const run = this.descriptor.runCli(opts);

    // Status derives from the CLI's own exit/timeout ONLY — a producer's claim,
    // not a verdict. Failure and timeout are first-class non-successes (§3.3).
    let status: StructuredOutput["status"];
    if (run.timedOut) status = "timeout";
    else if (run.exitCode !== 0) status = "failed";
    else status = "completed"; // the backend CLAIMS success — the verifier will gate it.

    // Evidence is observed independently of the CLI's self-report (§3.1).
    const filesChanged = status === "timeout" ? [] : this.descriptor.observeDelta(opts);
    const testResult = status === "completed" ? this.descriptor.runTests(opts) : null;
    const hasTests = testResult !== null;
    if (run.exitCode !== null) log(`backend exit ${run.exitCode}; files changed: ${filesChanged.length}` +
      (hasTests ? `; tests: ${testResult.run} run, ${testResult.passed ? "passed" : "FAILED"}` : "; no test result (test-less unit)"));

    return {
      run_id: `${this.descriptor.id}-${runConfig.mode ?? "run"}`,
      trace_id: `${this.descriptor.id}-trace`,
      delegation_depth: delegationDepth,
      agent: agentName,
      role: "Headless CLI Backend",
      status,
      mode: runConfig.mode,
      policy: runConfig.policy,
      execution_mode: runConfig.execution_mode,
      confidence: status === "completed" ? 0.9 : 0.3,
      low_confidence_items: [],
      escalation_reason: null,
      requires_human_approval: false,
      approval_reason: null,
      model_provider: this.descriptor.id,
      model_used: this.descriptor.id,
      model_tier: modelTier ?? "balanced",
      reasoning_effort: "medium",
      fallback_provider_used: null,
      fallback_reason: null,
      input_tokens: 0,
      output_tokens: 0,
      reasoning_tokens: 0,
      cost_estimate_usd: null, // cost is the operator's concern, not metered here (§3.4)
      execution_time_ms: 0,
      retry_count: 0,
      // ---- the independently-observed evidence the verifier gates on ----
      files_changed: filesChanged,
      tests_added: 0,
      tests_run: hasTests ? testResult.run : 0, // 0 => no test signal => no substantiation
      tests_passed: hasTests ? testResult.passed : false,
      coverage_percent: null,
      risks: [],
      blockers:
        status === "completed"
          ? []
          : [{ id: `backend-${status}`, description: `headless backend ${status}`, requires: "operator" }],
      pending_items: [],
      recommendation: status === "completed" ? "proceed" : "block",
      evidence: {
        logs: [run.stdout, run.stderr].filter((s) => s && s.length > 0),
        screenshots: [],
        reports: [],
        coverage_files: [],
        benchmarks: [],
        audit_trail: [
          `backend=${this.descriptor.id} exit=${run.exitCode} timedOut=${run.timedOut} ` +
            `files_changed=${filesChanged.length} tests=${hasTests ? `${testResult.run}/${testResult.passed}` : "none"}`,
        ],
      },
      summary: `Headless backend '${this.descriptor.id}' ${status} for task: ${task.slice(0, 80)}`,
      next_phase: status === "completed" ? "verify" : "fix",
      capabilities_used: ["headless-cli"],
    };
  }

  async requestApproval(_action: string, _reason: string): Promise<boolean> {
    // The pilot brokers no approvals of its own; approval stays with the operator.
    return false;
  }

  getCapabilities(): HostCapabilities {
    return { hasBash: true, hasFilesystem: true, hasNetwork: true, nativeToolUse: true };
  }
}
