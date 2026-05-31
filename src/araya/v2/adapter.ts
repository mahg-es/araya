import type { StructuredOutput, RunConfig } from "./types";

export interface ArayaExecutionAdapter {
  /**
   * Executes a task using a specific agent.
   * Resolves the agent's persona prompt, skills, and invokes the underlying host.
   */
  executeSubagent(
    agentName: string,
    task: string,
    runConfig: RunConfig,
    delegationDepth?: number
  ): Promise<StructuredOutput>;
}
