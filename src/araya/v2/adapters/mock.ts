import type { ArayaExecutionAdapter, ExecutionEvent, HostCapabilities } from "../adapter";
import type { StructuredOutput, RunConfig } from "../types";

export class MockAdapter implements ArayaExecutionAdapter {
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
    if (onEvent) {
      onEvent({
        type: "log",
        agent: agentName,
        payload: { message: `Mock execution started for ${agentName}` }
      });
    }

    return {
      run_id: "mock-run-id",
      trace_id: "mock-trace-id",
      delegation_depth: delegationDepth,
      agent: agentName,
      role: "Mock Role",
      status: "completed",
      mode: runConfig.mode,
      policy: runConfig.policy,
      execution_mode: runConfig.execution_mode,
      confidence: 0.95,
      low_confidence_items: [],
      escalation_reason: null,
      requires_human_approval: false,
      approval_reason: null,
      model_provider: "mock-provider",
      model_used: "mock-model",
      model_tier: "balanced",
      reasoning_effort: "medium",
      fallback_provider_used: null,
      fallback_reason: null,
      input_tokens: 100,
      output_tokens: 200,
      reasoning_tokens: 50,
      cost_estimate_usd: 0.005,
      execution_time_ms: 150,
      retry_count: 0,
      files_changed: [],
      tests_added: 0,
      tests_run: 0,
      tests_passed: true,
      coverage_percent: 100,
      risks: [],
      blockers: [],
      pending_items: [],
      recommendation: "proceed",
      evidence: {
        logs: ["Mock log entry"],
        screenshots: [],
        reports: [],
        coverage_files: [],
        benchmarks: [],
        audit_trail: [],
      },
      summary: `Mock execution of ${agentName} for task: ${task}`,
      next_phase: "done",
      capabilities_used: [],
    };
  }

  async requestApproval(action: string, reason: string): Promise<boolean> {
    return true;
  }

  getCapabilities(): HostCapabilities {
    return {
      hasBash: true,
      hasFilesystem: true,
      hasNetwork: false,
      nativeToolUse: false,
    };
  }
}
