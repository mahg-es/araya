import type { ArayaExecutionAdapter } from "../adapter";
import type { StructuredOutput, RunConfig } from "../types";

function findArayaRoot(startDir: string): string {
  const { existsSync } = require("node:fs");
  const { resolve } = require("node:path");
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "araya.yaml"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Cannot find araya.yaml");
}

export class PiAdapter implements ArayaExecutionAdapter {
  private config: any;
  private pi: any;

  constructor(config: any, pi?: any) {
    this.config = config;
    this.pi = pi;
  }

  async executeSubagent(
    agentName: string,
    task: string,
    runConfig: RunConfig,
    delegationDepth: number = 0
  ): Promise<StructuredOutput> {
    // If the host pi API is available and supports callTool, attempt to use the subagent tool
    if (this.pi && typeof this.pi.callTool === "function") {
      try {
        const result = await this.pi.callTool("subagent", {
          agent: agentName,
          task: task,
          agentScope: "both"
        });
        
        // Parse structured output block
        const outputText = typeof result === "string" ? result : JSON.stringify(result);
        return this.parseStructuredOutput(outputText, agentName, runConfig, delegationDepth);
      } catch (err) {
        // Fall back to process spawning if tool call fails
      }
    }

    return this.spawnPiProcess(agentName, task, runConfig, delegationDepth);
  }

  private parseStructuredOutput(
    text: string,
    agentName: string,
    runConfig: RunConfig,
    delegationDepth: number
  ): StructuredOutput {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]) as StructuredOutput;
    }
    throw new Error(`Could not parse structured JSON output from tool result.`);
  }

  private async spawnPiProcess(
    agentName: string,
    task: string,
    runConfig: RunConfig,
    delegationDepth: number
  ): Promise<StructuredOutput> {
    const { spawn } = require("node:child_process");
    const { writeFileSync, unlinkSync, existsSync, readFileSync } = require("node:fs");
    const { join } = require("node:path");
    const { tmpdir } = require("node:os");

    const agent = this.config.agents?.[agentName];
    
    // Resolve personality system prompt
    let personality = "";
    try {
      const root = findArayaRoot(process.cwd());
      const path = join(root, "prompts", "agents", `${agentName}.md`);
      if (existsSync(path)) {
        personality = readFileSync(path, "utf-8");
      }
    } catch {}

    const args: string[] = ["--mode", "json", "-p", "--no-session"];
    
    // Write system prompt to temp file
    let tmpPromptPath = "";
    if (personality.trim()) {
      tmpPromptPath = join(tmpdir(), `araya-prompt-${agentName}-${Date.now()}.md`);
      writeFileSync(tmpPromptPath, personality, "utf-8");
      args.push("--append-system-prompt", tmpPromptPath);
    }

    if (agent?.model_tier) {
      const tierConfig = this.config.model_tiers?.[agent.model_tier];
      if (tierConfig && tierConfig.primary_provider === "pi.dev") {
        args.push("--model", tierConfig.primary_capability);
      }
    }

    args.push(`Task: ${task}`);

    return new Promise((resolve, reject) => {
      const proc = spawn("pi", args, {
        cwd: process.cwd(),
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdoutBuffer = "";
      let stderrBuffer = "";

      proc.stdout.on("data", (data: any) => {
        stdoutBuffer += data.toString();
      });

      proc.stderr.on("data", (data: any) => {
        stderrBuffer += data.toString();
      });

      proc.on("close", (code: number) => {
        // Clean up temp file
        if (tmpPromptPath) {
          try { unlinkSync(tmpPromptPath); } catch {}
        }

        if (code !== 0) {
          reject(new Error(`pi process exited with code ${code}. Stderr: ${stderrBuffer}`));
          return;
        }

        try {
          const parsed = this.parseStructuredOutput(stdoutBuffer, agentName, runConfig, delegationDepth);
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse structured output: ${(err as Error).message}. Stdout: ${stdoutBuffer}`));
        }
      });
    });
  }
}
