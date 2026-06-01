import type { StructuredOutput, RunConfig } from "./types";

export interface ExecutionEvent {
  type: "token" | "tool_start" | "tool_end" | "log" | "error";
  agent: string;
  payload: any;
}

export interface HostCapabilities {
  hasBash: boolean;
  hasFilesystem: boolean;
  hasNetwork: boolean;
  nativeToolUse: boolean;
}

export interface ArayaExecutionAdapter {
  /**
   * Executes a task using a specific agent.
   * Resolves the agent's persona prompt, skills, and invokes the underlying host.
   */
  executeSubagent(
    agentName: string,
    task: string,
    runConfig: RunConfig,
    delegationDepth?: number,
    systemPrompt?: string,
    skills?: string[],
    modelTier?: string,
    onEvent?: (event: ExecutionEvent) => void
  ): Promise<StructuredOutput>;

  /**
   * Request human approval for a sensitive operation.
   */
  requestApproval(
    action: string,
    reason: string
  ): Promise<boolean>;

  /**
   * Get host environment capabilities.
   */
  getCapabilities(): HostCapabilities;
}
