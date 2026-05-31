import type { ArayaExecutionAdapter, ExecutionEvent, HostCapabilities } from "../adapter";
import type { StructuredOutput, RunConfig } from "../types";
import { ProviderRegistry } from "../providers/registry";
import { ToolRegistry } from "../tools/registry";
import { WorktreeSandboxManager } from "../sandbox/worktree";

export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_calls?: any[];
}

export interface CompletionResponse {
  message: Message;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    reasoning_tokens?: number;
  };
}

export interface MockCompletionProvider {
  createCompletion(messages: Message[]): Promise<CompletionResponse>;
}

export class TerminalApiAdapter implements ArayaExecutionAdapter {
  private config: any;
  private providerRegistry: ProviderRegistry;
  private mockProvider: MockCompletionProvider;
  private sandboxManager?: WorktreeSandboxManager;
  private activeSandbox?: { path: string; branch: string };
  private allowSandbox: boolean;

  // Custom requestApproval callback to hook into CLI or tests
  public onApprovalRequest?: (action: string, reason: string) => Promise<boolean>;

  constructor(
    config: any,
    mockProvider: MockCompletionProvider,
    allowSandbox: boolean = false,
    sandboxManager?: WorktreeSandboxManager
  ) {
    this.config = config;
    this.providerRegistry = new ProviderRegistry(config);
    this.mockProvider = mockProvider;
    this.allowSandbox = allowSandbox;
    this.sandboxManager = sandboxManager;
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
    
    // 1. Resolve Provider & Pricing Mappings
    const agentConfig = this.config.agents?.[agentName];
    const providerName = agentConfig?.primary_provider ?? "pi.dev";
    const tier = modelTier ?? agentConfig?.model_tier ?? "balanced";
    
    const resolvedModel = this.providerRegistry.resolveModel(providerName, tier);
    const rates = this.providerRegistry.resolveCostRates(providerName, resolvedModel);
    
    if (onEvent) {
      onEvent({
        type: "log",
        agent: agentName,
        payload: { message: `Initializing TerminalApiAdapter session for agent: "${agentName}" using model: "${resolvedModel}"` }
      });
    }

    // 2. Setup Sandbox isolation if active
    let workspaceRoot = process.cwd();
    let sandboxRunId = `run-${Date.now()}`;
    if (this.allowSandbox && this.sandboxManager) {
      if (onEvent) {
        onEvent({
          type: "log",
          agent: agentName,
          payload: { message: `Spinning up isolated Git worktree sandbox for run: "${sandboxRunId}"` }
        });
      }
      try {
        this.activeSandbox = await this.sandboxManager.createWorktree(sandboxRunId, agentName);
        workspaceRoot = this.activeSandbox.path;
      } catch (err: any) {
        throw new Error(`Failed to initialize sandbox workspace: ${err.message}`);
      }
    }

    // Initialize registries relative to sandbox workspace path
    const toolRegistry = new ToolRegistry(workspaceRoot, ["npm test", "npm run test"], false);

    // 3. Initialize Conversation History
    const messages: Message[] = [
      {
        role: "system",
        content: `${systemPrompt || `You are ${agentName}, a specialist agent.`}\nSkills: ${skills ? skills.join(", ") : ""}`
      },
      {
        role: "user",
        content: task
      }
    ];

    let turnsCount = 0;
    const maxTurns = 30;
    let retries = 0;
    const maxRetries = 3;
    
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    let finalOutput: StructuredOutput | null = null;

    while (turnsCount < maxTurns) {
      turnsCount++;

      if (onEvent) {
        onEvent({
          type: "token",
          agent: agentName,
          payload: { token: "..." }
        });
      }
      
      const response = await this.mockProvider.createCompletion(messages);
      
      if (response.usage) {
        totalInputTokens += response.usage.input_tokens;
        totalOutputTokens += response.usage.output_tokens;
      }

      const responseMsg = response.message;
      messages.push(responseMsg);

      // Handle tool calls
      if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
        for (const toolCall of responseMsg.tool_calls) {
          const { name, arguments: args } = toolCall;
          
          if (onEvent) {
            onEvent({
              type: "tool_start",
              agent: agentName,
              payload: { tool: name, arguments: args }
            });
          }

          // Request approval before write_file or run_tests
          if (name === "write_file" || name === "run_tests") {
            const approved = await this.requestApproval(name, `Executing tool "${name}"`);
            if (!approved) {
              const rejectMsg = `Access denied: Action blocked by human-in-the-loop security gate.`;
              messages.push({
                role: "tool",
                name: name,
                content: JSON.stringify({ success: false, output: "", error: rejectMsg })
              });
              if (onEvent) {
                onEvent({
                  type: "tool_end",
                  agent: agentName,
                  payload: { tool: name, status: "rejected" }
                });
              }
              continue;
            }
          }

          // Execute tool via tool registry
          const toolResult = await toolRegistry.executeTool(name, args);
          
          messages.push({
            role: "tool",
            name: name,
            content: JSON.stringify(toolResult)
          });

          if (onEvent) {
            onEvent({
              type: "tool_end",
              agent: agentName,
              payload: { tool: name, status: toolResult.success ? "success" : "failed" }
            });
          }
        }
        continue;
      }

      // Parse Structured Text
      const text = responseMsg.content;
      try {
        finalOutput = this.parseStructuredOutput(text);
        break; 
      } catch (err: any) {
        retries++;
        if (onEvent) {
          onEvent({
            type: "log",
            agent: agentName,
            payload: { message: `Structured Output parsing failed (Attempt ${retries}/${maxRetries}): ${err.message}` }
          });
        }

        if (retries > maxRetries) {
          throw new Error(`Max structured output parsing retries exceeded. Failed to gather clean JSON block.`);
        }

        messages.push({
          role: "user",
          content: `Validation failed: ${err.message}. Please correct your output and return only the valid JSON StructuredOutput enclosed in a single markdown code block.`
        });
      }
    }

    if (!finalOutput) {
      throw new Error(`Failed to generate StructuredOutput within max turns.`);
    }

    // 4. Update Cost Estimation
    const accumulatedCost = ((totalInputTokens * rates.input_rate_1m) + (totalOutputTokens * rates.output_rate_1m)) / 1000000;
    
    if (this.allowSandbox) {
      finalOutput.run_id = sandboxRunId;
    } else {
      finalOutput.run_id = finalOutput.run_id || sandboxRunId;
    }
    finalOutput.input_tokens = totalInputTokens;
    finalOutput.output_tokens = totalOutputTokens;
    finalOutput.cost_estimate_usd = accumulatedCost;

    // 5. Cleanup sandbox workspace if active
    if (this.allowSandbox && this.activeSandbox && this.sandboxManager) {
      if (onEvent) {
        onEvent({
          type: "log",
          agent: agentName,
          payload: { message: `Cleaning up Git worktree sandbox at: ${this.activeSandbox.path}` }
        });
      }
      try {
        await this.sandboxManager.cleanupWorktree(sandboxRunId, agentName, finalOutput.status === "completed");
      } catch (err: any) {
        // Warning log but don't crash
      }
    }

    return finalOutput;
  }

  async requestApproval(action: string, reason: string): Promise<boolean> {
    if (this.onApprovalRequest) {
      return this.onApprovalRequest(action, reason);
    }
    return true;
  }

  getCapabilities(): HostCapabilities {
    return {
      hasBash: false,
      hasFilesystem: false,
      hasNetwork: false,
      nativeToolUse: true
    };
  }

  private parseStructuredOutput(text: string): StructuredOutput {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      const required = ["run_id", "trace_id", "status", "confidence", "recommendation", "summary"];
      for (const req of required) {
        if (parsed[req] === undefined) {
          throw new Error(`Missing mandatory StructuredOutput property: "${req}".`);
        }
      }
      return parsed as StructuredOutput;
    }
    throw new Error(`Failed to locate structured JSON block in model response.`);
  }
}
