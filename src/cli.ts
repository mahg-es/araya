#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { load } from "js-yaml";
import { DelegationEngine } from "./araya/v2/engines/delegation";
import { resolveAdapter } from "./araya/v2/adapters/factory";
import type { RunConfig } from "./araya/v2/types";
import type { ExecutionEvent } from "./araya/v2";


function findArayaRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "araya.yaml"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

function printHelp() {
  console.log(`
ARAYA Standalone CLI Runner

Usage:
  araya <command> [options]

Commands:
  run <task>          Orchestrate execution of a task across agents.
  capabilities        Print environment capabilities for the active adapter.
  validate            Self-verify the configuration and state directories.

Options:
  -a, --adapter <name>   Adapter to use ("pi" or "mock"). Default: "pi".
  -m, --mode <mode>      Orchestration delivery mode. Default: "standard".
  -p, --policy <policy>  Workflow policy. Default: "balanced".
  -s, --safe-mode        Halt for human approval checkpoints. Default: false.
  --auto-approve         Automatically approve non-destructive actions in non-interactive mode.
  -c, --config <path>    Custom path to araya.yaml.
  -h, --help             Display this help message.
`);
}

async function main() {
  const args = process.argv.slice(2);
  let command = "";
  let task = "";
  let adapterName = "pi";
  let mode = "standard";
  let policy = "balanced";
  let safeMode = false;
  let autoApprove = false;
  let configPath = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "run" || arg === "capabilities" || arg === "validate") {
      command = arg;
      if (arg === "run" && i + 1 < args.length && !args[i + 1].startsWith("-")) {
        task = args[i + 1];
        i++;
      }
    } else if (arg === "--adapter" || arg === "-a") {
      adapterName = args[++i];
    } else if (arg === "--mode" || arg === "-m") {
      mode = args[++i];
    } else if (arg === "--policy" || arg === "-p") {
      policy = args[++i];
    } else if (arg === "--safe-mode" || arg === "-s") {
      safeMode = true;
    } else if (arg === "--auto-approve") {
      autoApprove = true;
    } else if (arg === "--config" || arg === "-c") {
      configPath = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!command) {
    printHelp();
    process.exit(1);
  }

  if (command === "run" && !task) {
    console.error("❌ Error: Missing task description for run command.");
    process.exit(1);
  }

  // Load config
  const root = findArayaRoot(process.cwd());
  const resolvedConfigPath = configPath ? resolve(process.cwd(), configPath) : resolve(root, "araya.yaml");

  if (!existsSync(resolvedConfigPath)) {
    console.error(`❌ Error: Configuration file not found at: ${resolvedConfigPath}`);
    process.exit(1);
  }

  let config: any;
  try {
    const raw = readFileSync(resolvedConfigPath, "utf-8");
    config = load(raw);
  } catch (err) {
    console.error(`❌ Error parsing config file: ${(err as Error).message}`);
    process.exit(1);
  }

  // Resolve adapter
  let adapter: any;
  try {
    adapter = resolveAdapter(adapterName, config);
  } catch (err) {
    console.error(`❌ Error: ${(err as Error).message}`);
    process.exit(1);
  }

  // Wrap requestApproval with safe defaults and interactive prompting logic
  adapter.requestApproval = async (action: string, reason: string): Promise<boolean> => {
    const lowercase = action.toLowerCase();
    const destructiveKeywords = ["delete", "remove", "rm", "destroy", "wipe", "reset", "purge", "clean", "overwrite"];
    const isDestructive = destructiveKeywords.some(kw => lowercase.includes(kw));
    const isInteractive = process.stdout.isTTY && process.stdin.isTTY;

    if (isInteractive) {
      const readline = require("node:readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      return new Promise<boolean>((resolvePrompt) => {
        console.log(`\n⚠️  APPROVAL REQUESTED: Action "${action}" (${reason})`);
        if (isDestructive) {
          console.log(`🔥 WARNING: This is flagged as a destructive action!`);
        }
        rl.question(`Approve this action? [y/N]: `, (answer: string) => {
          rl.close();
          const approved = answer.trim().toLowerCase() === "y";
          if (approved) {
            console.log(`✅ Action approved by user.`);
            resolvePrompt(true);
          } else {
            console.log(`❌ Action denied by user.`);
            resolvePrompt(false);
          }
        });
      });
    } else {
      // Non-interactive terminal behavior
      if (autoApprove && !isDestructive) {
        console.log(`[CLI] Non-interactive mode: Auto-approving non-destructive action "${action}" (--auto-approve active)`);
        return true;
      }
      
      if (isDestructive) {
        console.log(`[CLI] Non-interactive mode: REJECTED action "${action}". Destructive actions must never auto-approve silently.`);
      } else {
        console.log(`[CLI] Non-interactive mode: REJECTED action "${action}". Rejections are default for non-interactive terminals (use --auto-approve for non-destructive tasks).`);
      }
      return false;
    }
  };

  // Execute command
  if (command === "validate") {
    console.log("🔍 Validating ARAYA environment...");
    console.log(`✅ Config found: version ${config.version}`);
    console.log(`✅ Agents registered: ${Object.keys(config.agents || {}).length}`);
    
    const requiredDirs = [".araya/specs", ".araya/changes", ".araya/archive", ".araya/templates"];
    let allDirsExist = true;
    for (const d of requiredDirs) {
      const dirPath = resolve(root, d);
      if (existsSync(dirPath)) {
        console.log(`✅ Directory exists: ${d}`);
      } else {
        console.log(`❌ Directory missing: ${d}`);
        allDirsExist = false;
      }
    }
    
    if (allDirsExist) {
      console.log("🎉 Validation successful! Environment is fully compliant.");
    } else {
      console.log("⚠️  Validation found missing directories.");
      process.exit(1);
    }
  } else if (command === "capabilities") {
    const caps = adapter.getCapabilities();
    console.log(`💻 Host Capabilities for adapter "${adapterName}":`);
    console.log(`- Bash execution: ${caps.hasBash ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`- Filesystem access: ${caps.hasFilesystem ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`- Network access: ${caps.hasNetwork ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`- Native Tool Use: ${caps.nativeToolUse ? "✅ Enabled" : "❌ Disabled"}`);
  } else if (command === "run") {
    const runConfig: RunConfig = {
      mode: mode as any,
      policy: policy as any,
      execution_mode: "adaptive",
      safe_mode: safeMode,
      task,
    };

    console.log(`🚀 Starting ARAYA run using adapter: ${adapterName}`);
    console.log(`Task: "${task}"`);
    console.log(`Mode: ${runConfig.mode} | Policy: ${runConfig.policy} | Safe Mode: ${runConfig.safe_mode}`);
    console.log("--------------------------------------------------------------------------------");

    const onEvent = (event: ExecutionEvent) => {
      switch (event.type) {
        case "log":
          console.log(`[${event.agent}] ${event.payload.message}`);
          break;
        case "token":
          if (event.payload.token) {
            process.stdout.write(event.payload.token);
          }
          break;
        case "tool_start":
          console.log(`\n🔨 [${event.agent}] Invoking tool: ${event.payload.tool} with args:`, event.payload.arguments);
          break;
        case "tool_end":
          console.log(`\n✅ [${event.agent}] Tool ${event.payload.tool} completed. Status: ${event.payload.status}`);
          break;
        case "error":
          console.error(`\n❌ [${event.agent}] ERROR: ${event.payload.message}`);
          break;
      }
    };

    const engine = new DelegationEngine(config, adapter);
    try {
      const output = await engine.executeSubagent("sonia", task, runConfig, 0, onEvent);
      console.log("\n--------------------------------------------------------------------------------");
      console.log("🎉 Execution finished!");
      console.log(`Status: ${output.status.toUpperCase()}`);
      console.log(`Confidence: ${(output.confidence * 100).toFixed(0)}%`);
      console.log(`Recommendation: ${output.recommendation}`);
      console.log(`Summary: ${output.summary}`);
      
      const runDir = engine.persistRun(output.run_id || `run-${Date.now()}`, runConfig, process.cwd());
      console.log(`📂 Run artifacts persisted to: ${runDir}`);
    } catch (err) {
      console.error(`\n❌ Orchestration failed: ${(err as Error).message}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}
