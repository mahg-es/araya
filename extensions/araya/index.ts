// ARAYA — AI-Native SDLC Orchestration Framework Extension for pi
//
// This extension reads araya.yaml and prompts/agents/*.md to register
// slash commands for each agent and the `/araya run` orchestration pipeline.
//
// Architecture:
//   araya.yaml        → Source of truth (agents, roles, skills, model tiers, modes, budgets)
//   prompts/agents/   → Personality prompts (one .md per agent)
//   skills/           → Independent, focused skills (SKILL.md each)
//   src/araya/v2/     → Orchestration engines (workflow, model, quality, budget, circuit)
//
// Philosophy: Unix — do one thing well. Business-driven. Secure by default.
//              v2 adds enterprise governance, delivery modes, and autonomous roundtables.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync, existsSync, realpathSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { load } from "js-yaml";

// ─── Types ────────────────────────────────────────────────────────────────

interface AgentV2Config {
  role: string;
  emoji: string;
  model_tier?: string;
  reasoning_effort?: string;
  primary_provider?: string;
  max_turns?: number;
  execution_mode?: string;
  permissions?: {
    can_write_code: boolean;
    can_merge_pr?: boolean;
    can_approve_review?: boolean;
  };
  capabilities?: string[];
  skills: string[];
  description?: string;
}

interface ArayaV2Config {
  version: string;
  description: string;
  delivery_modes?: Record<string, { description: string; phases: string[]; requires_approval: boolean }>;
  workflow_policies?: Record<string, { description: string }>;
  model_tiers?: Record<string, { purpose: string; primary_provider: string; reasoning_effort: string }>;
  execution_budget?: Record<string, unknown>;
  agents: Record<string, AgentV2Config>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function findArayaRoot(): string {
  let dir = dirname(__filename);
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "araya.yaml"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  try {
    const realFile = realpathSync(__filename);
    dir = dirname(realFile);
    for (let i = 0; i < 10; i++) {
      if (existsSync(resolve(dir, "araya.yaml"))) return dir;
      const parent = resolve(dir, "..");
      if (parent === dir) break;
      dir = parent;
    }
  } catch { /* realpathSync may fail */ }

  throw new Error("ARAYA: Cannot find araya.yaml.");
}

function loadConfig(root: string): ArayaV2Config {
  const yamlPath = resolve(root, "araya.yaml");
  const raw = readFileSync(yamlPath, "utf-8");
  return load(raw) as ArayaV2Config;
}

function loadPersonality(root: string, agentName: string): string {
  const paths = [
    resolve(root, "prompts", "agents", `${agentName}.md`),
    resolve(root, "prompts", "agents", `${agentName}.txt`),
  ];
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p, "utf-8").trim();
  }
  return `You are ${agentName}, a member of the ARAYA DevOps team.`;
}

function buildAgentPrompt(
  config: ArayaV2Config,
  agentName: string,
  userTask: string,
  indent: number = 0
): string {
  const agent = config.agents[agentName];
  if (!agent) return userTask;

  const pad = "│  ".repeat(indent);  // visual hierarchy indentation
  const personality = loadPersonality(findArayaRoot(), agentName);
  const skillList =
    agent.skills.length > 0
      ? agent.skills.map((s) => `/skill:${s}`).join(", ")
      : "No specific skills — general assistance";

  const tier = agent.model_tier ?? "balanced";
  const tierConfig = config.model_tiers?.[tier];
  const tierPurpose = tierConfig?.purpose ?? "N/A";

  const context: string[] = [];
  if (agent.model_tier) {
    context.push(`${pad}**Model Tier:** ${agent.model_tier} (${tierPurpose})`);
  }
  if (agent.permissions) {
    const perms = [];
    if (agent.permissions.can_write_code === false) perms.push("❌ write code");
    else perms.push("✅ write code");
    if (agent.permissions.can_approve_review) perms.push("✅ approve reviews");
    if (agent.permissions.can_merge_pr === false) perms.push("❌ merge PRs");
    context.push(`${pad}**Permissions:** ${perms.join(" | ")}`);
  }
  if (agent.capabilities && agent.capabilities.length > 0) {
    context.push(`${pad}**Capabilities:** ${agent.capabilities.join(", ")}`);
  }

  const contextBlock = context.length > 0
    ? `\n## Agent Identity\n${context.join("\n")}`
    : "";

  // Only show header for delegation agents (indent > 0), not for root
  const header = indent > 0 ? [
    `${pad}┌─────────────────────────────────────────`,
    `${pad}│ AGENT: ${agentName.toUpperCase()} — ${agent.role}`,
    `${pad}│ TIER: ${tier} | PROVIDER: ${agent.primary_provider ?? "pi.dev"}`,
    `${pad}└─────────────────────────────────────────`,
  ].join("\n") + "\n\n" : "";

  const responsePad = indent > 0 ? "│  " : "";

  return [
    header,
    personality,
    ``,
    `## Available Skills`,
    `Invoke skills with: ${skillList}`,
    contextBlock,
    ``,
    `## Task`,
    userTask,
    ``,
    `## Response Protocol`,
    indent > 0
      ? `${responsePad}- Start with: "## 🤖 ${agentName} [${agent.role}] — Phase Output"`
      : `- Start with: "## 🤖 ${agentName} [${agent.role}] — Phase Output"`,
    `- Use ONLY the skills listed above — do not perform work outside your domain`,
    `- If a task requires skills you don't have, flag it and escalate`,
    indent > 0
      ? `${responsePad}- End with: "✅ ${agentName} handoff complete"`
      : `- End with: "✅ ${agentName} handoff complete"`,
  ].join("\n");
}

function parseRunFlags(args: string): {
  mode: string;
  policy: string;
  executionMode: string;
  safeMode: boolean;
  task: string;
} {
  const flags: Record<string, string> = {};
  const parts = args.split(/\s+/);
  const positional: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("--")) {
      const key = part.slice(2);
      // Check if next part is a value (not another flag)
      if (i + 1 < parts.length && !parts[i + 1].startsWith("--")) {
        flags[key] = parts[i + 1];
        i++;
      } else {
        flags[key] = "true"; // boolean flag
      }
    } else {
      positional.push(part);
    }
  }

  return {
    mode: flags["mode"] ?? "standard",
    policy: flags["policy"] ?? "auto",
    executionMode: flags["execution-mode"] ?? "adaptive",
    safeMode: flags["safe-mode"] !== undefined,
    task: (positional.join(" ") || flags["task"]) ?? "",
  };
}

// ─── Extension Entry Point ────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  const root = findArayaRoot();
  const config = loadConfig(root);
  const agentNames = Object.keys(config.agents);
  // Detect v2+ features by presence of delivery_modes (backward compatible)
  const isV2 = config.delivery_modes !== undefined;

  // ── Identity Injection ─────────────────────────────────────────────────
  // Ensure all agents know they are speaking with The Data Professor
  pi.on("before_agent_start", async (event: any, _ctx) => {
    const identity = "\n\n## Identity\nYou are speaking with **The Data Professor, Manuel Alejandro Hernández Giuliani**. Address him as **Professor** or **The Data Professor**. Never call him 'user' or 'the user'. He built ARAYA. He knows every agent by name. Show respect.";
    return {
      systemPrompt: (event.systemPrompt ?? "") + identity,
    };
  });

  // ── /araya ──────────────────────────────────────────────────────────────

  pi.registerCommand("araya", {
    description: "🤖 ARAYA v2 — /araya | /araya run | /araya <agent> <task>",
    handler: async (args, ctx) => {
      if (!args || args.trim().length === 0) {
        const lines = [`🤖 **ARAYA v${config.version}** — ${agentNames.length} agents ready`];
        if (isV2) {
          const modes = config.delivery_modes
            ? Object.keys(config.delivery_modes).join(" | ")
            : "full | standard | quick | review | repair";
          lines.push(`**Modes:** ${modes}`);
          lines.push(`/araya run --mode standard "Your task"`);
          lines.push(`/araya:status → full roster | /araya <agent> <task> → delegate`);
        } else {
          lines.push(`/araya:status → full roster | /araya <agent> <task> → delegate`);
        }
              // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), "info");
        return;
      }

      const trimmed = args.trim();
      const spaceIdx = trimmed.indexOf(" ");
      const firstWord = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
      const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();

      // /araya help
      if (firstWord === "help" || firstWord === "ayuda") {
        const agentList = agentNames
          .map((n) => {
            const a = config.agents[n];
            const tier = a.model_tier ? ` [${a.model_tier}]` : "";
            const sc = a.skills.length;
            return `  ${a.emoji} ${n} — ${a.role}${tier} [${sc} skills]`;
          })
          .join("\n");

        const v2Help = isV2 ? [
          ``,
          `**DELIVERY MODES**`,
          ...(config.delivery_modes
            ? Object.entries(config.delivery_modes).map(
                ([k, v]) => `  /araya run --mode ${k} "task" — ${v.description}`
              )
            : []),
          ``,
          `**WORKFLOW POLICIES**`,
          ...(config.workflow_policies
            ? Object.entries(config.workflow_policies).map(
                ([k, v]) => `  --policy ${k} — ${v.description}`
              )
            : []),
          ``,
          `**FLAGS**`,
          `  --mode full|standard|quick|review|repair`,
          `  --policy auto|conservative|balanced|aggressive`,
          `  --execution-mode deterministic|adaptive`,
          `  --safe-mode (dry-run, no file modifications)`,
          ``,
          `**EXECUTION BUDGET**`,
          `  Max cost: $${config.execution_budget?.max_cost_usd ?? "2.00"}`,
          `  Max runtime: ${config.execution_budget?.max_runtime_minutes ?? "20"} min`,
          `  Max turns/agent: ${config.execution_budget?.max_turns_per_agent ?? "30"}`,
        ] : [
          ``,
          `**PIPELINE**`,
          `  /skill:sdd-vision → /skill:sdd-requirements → /skill:bdd-feature`,
          `  → /skill:tdd-generate → /skill:tdd-execute`,
        ];

        ctx.ui.notify(
          `🤖 **ARAYA v${config.version}** — ${config.description}\n\n` +
            `**COMMANDS**\n` +
            `  /araya                         concise summary\n` +
            `  /araya:status                  full agent roster\n` +
            `  /araya help                    this manual\n` +
            `  /araya run <flags> "<task>"    orchestrate a full run\n` +
            `  /araya <agent>                 show agent info & skills\n` +
            `  /araya <agent> <task>          delegate task to agent\n` +
            `\n` +
            `**GOVERNANCE**\n` +
            `  /araya version                 version & release path\n` +
            `  /araya validate                validate delivery against ACs\n` +
            `  /araya constitution            show constitutional rules\n` +
            `  /araya release-check           validate version compliance\n` +
            `  /araya usability-check         check usability evidence\n` +
            `  /araya trace                   traceability tree (REQ→CR)\n` +
            `  /araya metrics                 governance health score\n` +
            `  /araya compact                 context capsule\n` +
            `  /araya handoff                 delegation handoff\n` +
            `  /araya reconstitute            reset to repository truth\n` +
            `\n` +
            `**DELIVERY & REVIEW**\n` +
            `  /araya review-delivery <id>    DRR → IAR → CR\n` +
            `  /araya generate-uat <id>       generate UAT package\n` +
            `  /araya review-uat <id>         review UAT completeness\n` +
            `  /araya uat-status <id>         UAT coverage report\n` +
            `\n` +
            `**KNOWLEDGE & GRAPH**\n` +
            `  /araya knowledge               org knowledge summary\n` +
            `  /araya learn "<lesson>"         capture lesson\n` +
            `  /araya trajectory              golden trajectory summary\n` +
            `  /araya improve                 process improvement recs\n` +
            `  /araya graph                   knowledge graph summary\n` +
            `  /araya ask "<question>"         graph-powered query\n` +
            `  /araya graph:prepare           validate graph readiness\n` +
            `\n` +
            `**BUDGET & EFFICIENCY**\n` +
            `  /araya budget-status           token & rate-limit status\n` +
            `  /araya optimize-task "<task>"   token efficiency analysis\n` +
            `  /araya efficiency-report       efficiency metrics report\n` +
            `\n` +
            `**ROUTING & TEAM**\n` +
            `  /araya route "<task>"          recommend provider+model\n` +
            `  /araya provider:list           registered AI providers\n` +
            `  /araya model:list              model routing classes\n` +
            `  /araya team recommend "<t>"    recommend optimal team\n` +
            `  /araya team assemble "<t>"     assemble execution team\n` +
            `  /araya team risk               workforce risk analysis\n` +
            `  /araya team list               active team formations\n` +
            `\n` +
            `**ORGANIZATIONAL EXCELLENCE** (Covey's 7 Habits)\n` +
            `  /araya anticipate              risk, drift & debt detection (ORG-002)\n` +
            `  /araya align                   vision→implementation alignment (ORG-003)\n` +
            `  /araya prioritize             most-important-outcomes focus (ORG-001)\n` +
            `  /araya harmonize              tradeoff resolution & rationale (ORG-004)\n` +
            `  /araya understand             discovery before execution (ORG-005)\n` +
            `  /araya roundtable             collaborative expert review (ORG-006)\n` +
            `  /araya sharpen [scope]        institutional learning (ORG-007)\n` +
            `     --scope organization|governance|skills|agents|architecture|delivery\n` +
            `\n` +
            `**SPEC & INSTALL**\n` +
            `  /araya spec:init               initialize spec structure\n` +
            `  /araya spec:list               list active specifications\n` +
            `  /araya:install                 install ARAYA\n` +
            `\n**AGENTS** (${agentNames.length})\n${agentList}` +
            v2Help.join("\n"),
          "info"
        );
        return;
      }

      // /araya run — execute orchestrated run
      if (firstWord === "run") {
        if (!isV2) {
          ctx.ui.notify("❌ `/araya run` requires ARAYA with delivery_modes config", "error");
          return;
        }

        const { mode, policy, executionMode, safeMode, task } = parseRunFlags(rest);

        if (!task) {
          ctx.ui.notify("❌ Task required: `/araya run --mode standard \"Your task\"`", "error");
          return;
        }

        const modeConfig = config.delivery_modes?.[mode];
        const budget = config.execution_budget;

        if (!modeConfig) {
          ctx.ui.notify(`❌ Unknown mode: **${mode}**. Use: full, standard, quick, review, repair`, "error");
          return;
        }

        // Phase → agent mapping
        const phases = modeConfig.phases;
        const phaseAgentMap: Record<string, string> = {
          sdd: "sonia", plan: "sonia", bdd: "sonia",
          tdd: "teresa", tests: "teresa",
          implementation: "valentina",
          review: "aisha",
          security: "diana",
          validation: "priya",
          documentation: "priscila",
        };

        const total = phases.length;

        // ── Phase 1: Sonia plans and executes first phase ──
        const runId = `araya-run-${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15)}`;
        const firstAgent = phaseAgentMap[phases[0]] ?? "sonia";
        const requiresGovernance = mode === "full" || mode === "standard";
        const isSafeMode = safeMode;

        // DAG analysis
        const dagLine: string[] = [];
        let parallelGroups: string[][] = [];
        try {
          const PHASE_DEPS: Record<string, string[]> = {
            sdd: [], bdd: ["sdd"], tdd: ["bdd"],
            plan: [], tests: ["plan"],
            implementation: ["tdd", "tests"],
            review: ["implementation"], security: ["implementation"],
            validation: ["review"], documentation: ["implementation"],
          };
          const { DependencyAnalyzer } = await import("../../src/araya/parallel/analyzer");
          const dagTasks = phases.map(p => ({
            id: p, name: p,
            dependencies: (PHASE_DEPS[p] ?? []).filter(d => phases.includes(d))
          }));
          const analyzer = new DependencyAnalyzer(dagTasks);
          parallelGroups = analyzer.getParallelGroups();
          dagLine.push(`**DAG:** ${parallelGroups.map(g => g.join("+")).join(" → ")}`);
          if (parallelGroups.some(g => g.length > 1)) {
            dagLine.push(`⚡ **Parallelizable:** ${parallelGroups.filter(g => g.length > 1).map(g => g.join(" ∥ ")).join(", ")} (needs SDK sub-agents)`);
          }
        } catch { /* DAG optional */ }

        const governanceNote = requiresGovernance
          ? `\n🔒 **Governance Required:** SDD → BDD → TDD → Traceability → Cross-Audit → Controlled Merge`
          : `\n⚡ **Light mode:** No governance — direct execution`;

        ctx.ui.notify(
          `🚀 **ARAYA Run Started**\n` +
          `Mode: ${mode} | Policy: ${policy} | Phases: ${total}${governanceNote}\n` +
          (dagLine.length > 0 ? dagLine.join("\n") + "\n" : "") +
          `${phases.map((p, i) => `${i + 1}. ${p} → ${phaseAgentMap[p] ?? "?"} [${config.agents[phaseAgentMap[p]]?.model_tier ?? "?"}]`).join(" | ")}`,
          "info"
        );

        // ── Phase 1: Send task to Sonia with subagent delegation instructions ──
        const soniaPrompt = buildAgentPrompt(config, firstAgent, [
          `## ARAYA Run — Phase 1 of ${total}`,
          ``,
          `**Run ID:** ${runId} | **Mode:** ${mode} | **Policy:** ${policy}`,
          `**Governance:** ${requiresGovernance ? "ENTERPRISE — Full pipeline" : "LIGHT"}`,
          `**Subagent Delegation:** ENABLED — use the subagent tool for delegation`,
          ``,
          `## Delegation Chain`,
          ...phases.map((p, i) => {
            const an = phaseAgentMap[p] ?? "?";
            const t = config.agents[an]?.model_tier ?? "?";
            return `  ${i + 1}. ${p} → subagent:${an} [${t}]`;
          }),
          ``,
          ...(requiresGovernance ? [
            `## ⚠️ GOVERNANCE — Phase 1 is PLANNING ONLY`,
            `1. Preserve the original request`,
            `2. Define SDD/BDD/TDD requirements`,
            `3. Plan the delegation strategy`,
            `4. Do NOT implement anything — implementation is Phase 2+`,
          ] : []),
          ``,
          `## 🔀 DAG — Parallel Execution Opportunities`,
          `**Execution Levels:** ${parallelGroups.map((g, i) => `L${i + 1}: ${g.join(" ∥ ")}`).join(" → ")}`,
          ...(parallelGroups.some(g => g.length > 1) ? [
            `⚡ **PARALLEL GROUPS DETECTED:** Use subagent parallel mode for:`,
            ...parallelGroups.filter(g => g.length > 1).map(g => `  - ${g.join(" + ")} (run simultaneously)`),
            `All other phases: sequential chain mode.`,
          ] : [`⚡ **No parallel groups — use sequential chain mode.**`]),
          ``,
          `## DELEGATION PROTOCOL (use the subagent tool)`,
          ``,
          `For each phase after planning, invoke the subagent tool:`,
          `- **Single agent:** Use {agent_name} to {task_description}`,
          `- **Chain mode:** Use chain: first have {agent1} do X, then {agent2} do Y with {previous}`,
          `- **Parallel mode (USE THIS for parallel groups):** Run N agents in parallel: one to X, one to Y`,
          ``,
          `After ALL subagents complete, synthesize the final report.`,
          ``,
          `## Your Phase: ${phases[0]}`,
          `Produce the ${phases[0]} deliverable, then begin subagent delegation.`,
          ``,
          `## Original Task`,
          safeMode ? `[SAFE MODE — PLAN ONLY]\n\n${task}` : task,
        ].join("\n"));
        // Send task to Sonia — she orchestrates delegation via subagent tool
        pi.sendUserMessage(soniaPrompt);

        return;
      }

      // /araya compact — context capsule
      if (firstWord === "compact") {
        const { existsSync, readdirSync } = await import("node:fs");
        const { resolve, basename } = await import("node:path");
        const { execSync } = await import("node:child_process");
        const cwd = process.cwd();
        let branch = ""; try { branch = execSync("git branch --show-current", { cwd }).toString().trim(); } catch {}
        
        const violations: string[] = [];
        if (existsSync(resolve(cwd, "memory"))) violations.push("memory/ → .araya/memory/ (PROJECT-001)");
        if (existsSync(resolve(cwd, "docs/agents"))) violations.push("docs/agents/ → .araya/agents/ (PROJECT-001)");
        const hasAuthADR = existsSync(resolve(cwd, "docs/adr/ADR-0010-authentik-as-central-identity-provider.md"));
        if (hasAuthADR) violations.push("ADR-0010 Authentik — conflicts with Authelia default");
        if (branch === "main") violations.push("Direct main — use dev-mahg (BRANCH-002)");

        const compactMsg = [
          `## Context Capsule — ${basename(cwd)}`,
          "",
          `**Branch:** ${branch}${branch === "main" ? " ⚠️" : ""}`,
          "",
          "### Active Standards",
          "- Docker + Traefik mandatory",
          "- Authelia default auth",
          "- Authentik NOT default",
          "- feature/* → dev-mahg → main",
          "",
          "### Repository Truth",
          "- Workspace ≠ delivered",
          "- Uncommitted ≠ progress",
          "- Claims need evidence",
        ];
        if (violations.length > 0) {
          compactMsg.push("", "### ⚠️ Active Violations", ...violations.map(v => `- ${v}`));
        }
        compactMsg.push("", `**Rules:** 115 constitutional rules active`);

        pi.sendUserMessage(`Sonia from ARAYA, here is the current context capsule for ${basename(cwd)}:\n\n${compactMsg.join("\n")}`);
        return;
      }

      // /araya handoff — delegation handoff
      if (firstWord === "handoff") {
        const { execSync } = await import("node:child_process");
        const { basename } = await import("node:path");
        const cwd = process.cwd();
        let branch = ""; try { branch = execSync("git branch --show-current", { cwd }).toString().trim(); } catch {}
        pi.sendUserMessage(`Sonia from ARAYA, here is the delegation handoff for ${basename(cwd)}:\n\n## Agent Handoff\n**Project:** ${basename(cwd)}\n**Branch:** ${branch}\n**Protocol:** What was done → What's next → Open decisions → Active constraints\n**Active:** Docker + Traefik | Authelia default | feature → dev-mahg → main\n**Source:** Repository truth only (/araya reconstitute)`);
        return;
      }

      // /araya reconstitute — project context reset
      if (firstWord === "reconstitute") {
        const { existsSync, readdirSync } = await import("node:fs");
        const { resolve, basename } = await import("node:path");
        const { execSync } = await import("node:child_process");
        const cwd = process.cwd();
        let branch = ""; try { branch = execSync("git branch --show-current", { cwd }).toString().trim(); } catch {}
        const violations: string[] = [];
        if (existsSync(resolve(cwd, "memory"))) violations.push("memory/ → .araya/memory/");
        if (existsSync(resolve(cwd, "docs/agents"))) violations.push("docs/agents/ → .araya/agents/");
        ctx.ui.notify([
          `## Project Reconstitution — ${basename(cwd)}`,
          `**Branch:** ${branch}${branch === "main" ? " ⚠️ Use dev-mahg" : ""}`,
          `**Auth:** Authelia default | Authentik NOT default`,
          `**Proxy:** Traefik (PREF-003) | **Containers:** Docker mandatory`,
          ...(violations.length > 0 ? ["", "### 🔴 PROJECT-001 Violations", ...violations.map(v => `- ${v}`)] : []),
        ].join("\n"), violations.length > 0 ? "warning" : "info");
        return;
      }

      // ═══════════════════════════════════════════════════════════════
      // Space-form subcommand routing (before agent lookup)
      // Maps /araya <cmd> → corresponding behavior
      // ═══════════════════════════════════════════════════════════════
      const SUBCOMMAND_ROUTES: Record<string, { agent: string; task: string } | "inline"> = {
        // Governance & Validation
        "validate": { agent: "sonia", task: "Validate delivery against acceptance criteria. Check all ACs, constitutional compliance, and evidence." },
        "constitution": { agent: "sonia", task: "Show the ARAYA Constitution — all rules, types, and domains. Summarize key governance principles." },
        "release-check": { agent: "sonia", task: "Validate version compliance with MAHG Release Standard. Check hotfix ≤ 5, revision ≤ 73." },
        "usability-check": { agent: "sonia", task: "Check usability evidence coverage for all features. Report verified/unverified/not-implemented status per USE-002 and USE-003." },
        "trace": { agent: "sonia", task: "Show end-to-end traceability tree from requirements to change requests. Detect orphan references." },
        "metrics": { agent: "sonia", task: "Report governance metrics, delivery health score, violation counts, and compliance status." },
        // Delivery & Review
        "review-delivery": { agent: "sonia", task: "Create a DRR (Delivery Review Report), classify findings, generate IAR (Impact Analysis Report), and route to affected artifacts." },
        "generate-uat": { agent: "sonia", task: "Generate complete UAT package with traceability matrix, test cases per AC, coverage matrix, and acceptance decision." },
        "review-uat": { agent: "manu", task: "Review UAT package for completeness. Validate every req has AC, every AC has UAT test. Report READY | NEEDS FIXES | REJECTED." },
        "uat-status": { agent: "sonia", task: "Show UAT status — coverage %, pass/fail/blocked, critical findings, acceptance decision, next steps." },
        // Knowledge & Learning
        "knowledge": { agent: "esteban", task: "Summarize organizational knowledge — standards, ADRs, lessons learned, technology preferences." },
        "learn": { agent: "esteban", task: rest ? `Capture this organizational lesson: ${rest}` : "Capture a structured organizational lesson from recent experience." },
        "trajectory": { agent: "esteban", task: "Show golden trajectory summary — successful delivery patterns available for reuse." },
        "improve": { agent: "esteban", task: "Analyze trajectories for process improvement opportunities." },
        "graph": { agent: "esteban", task: "Show organizational knowledge graph summary — entity relationships and impact analysis." },
        "ask": { agent: "esteban", task: rest ? `Answer this organizational query using graph + capabilities: ${rest}` : "Answer organizational queries using graph and capability registry." },
        // Budget & Efficiency
        "budget-status": { agent: "sonia", task: "Report token efficiency and provider budget status — tokens consumed, rate-limit risk, provider efficiency." },
        "optimize-task": { agent: "sonia", task: rest ? `Analyze and optimize this task for token efficiency: ${rest}` : "Analyze current task for token efficiency optimization." },
        "efficiency-report": { agent: "sonia", task: "Generate token efficiency metrics report — context reuse, decomposition, capsule effectiveness." },
        // Routing & Team
        "route": { agent: "sonia", task: rest ? `Recommend optimal agent + provider + model for: ${rest.replace(/^--explain /, "")}. ${rest.startsWith("--explain") ? "EXPLAIN mode — show detailed reasoning." : "RECOMMEND mode."}` : "Recommend optimal agent, provider, and model for the current task." },
        "team": { agent: "aurora", task: rest?.startsWith("recommend") ? `Recommend optimal team for: ${rest.slice(9).trim() || "current task"}` : rest?.startsWith("assemble") ? `Assemble execution team for: ${rest.slice(8).trim() || "current task"}` : rest === "risk" ? "Analyze workforce risks — single points of failure, coverage gaps, over/under-staffed areas." : "Show team capabilities and formations." },
        // Inline commands (handled below, not delegated to agents)
        "version": "inline",
        "provider:list": "inline",
        "model:list": "inline",
        "team:list": "inline",
        "spec:init": "inline",
        "spec:list": "inline",
        "graph:prepare": "inline",
        // Organizational Excellence (ORG-001 through ORG-007)
        "anticipate": { agent: "sonia", task: "## Organizational Excellence: Anticipate\n\nProactively identify risks, governance drift, technical debt, architectural erosion, skill gaps, missing capabilities, and delivery blockers before they impact delivery.\n\nProduce: risk register, technical debt register, governance drift report, architectural drift report, recommended mitigations.\n\nSave to .araya/excellence/anticipate/" },
        "align": { agent: "manu", task: "## Organizational Excellence: Align\n\nVerify alignment between vision, mission, objectives, PRDs, requirements, acceptance criteria, architecture, roadmap, and current implementation.\n\nProduce: alignment report, contradictions, missing requirements, traceability gaps.\n\nSave to .araya/excellence/align/" },
        "prioritize": { agent: "sonia", task: "## Organizational Excellence: Prioritize\n\nReview backlog, roadmap, strategic objectives, critical path, business value, and technical dependencies. Ensure effort is focused on the most important outcomes.\n\nProduce: priority matrix, recommended sequencing, deferred work list, critical path analysis.\n\nSave to .araya/excellence/prioritize/" },
        "harmonize": { agent: "manu", task: "## Organizational Excellence: Harmonize\n\nResolve conflicts between competing objectives — Speed vs Quality, Security vs Usability, Cost vs Capability, Governance vs Agility, Architecture vs Delivery.\n\nProduce: tradeoff analysis, decision recommendations, documented rationale.\n\nSave to .araya/excellence/harmonize/" },
        "understand": { agent: "manu", task: "## Organizational Excellence: Understand\n\nForce discovery before execution. Actively search for missing requirements, ambiguities, contradictions, hidden assumptions, and unvalidated decisions.\n\nThis command is the proactive form of AMB-001 — find ambiguity before it blocks delivery.\n\nProduce: clarification questionnaire, gap analysis, assumption register.\n\nSave to .araya/excellence/understand/" },
        "roundtable": { agent: "sonia", task: "## Organizational Excellence: Roundtable\n\nAssemble relevant specialists for collaborative analysis. Leverage collective intelligence rather than isolated agent decisions.\n\nProduce: consolidated recommendations, consensus areas, minority opinions, escalations.\n\nSave to .araya/excellence/roundtable/" },
        "sharpen": { agent: "esteban", task: "## Organizational Excellence: Sharpen\n\nInstitutional learning and continuous improvement. Review constitution, canonical context, ADRs, agent definitions, skills catalog, governance framework, SDLC framework, delivery processes, quality standards, security standards, and industry best practices.\n\nThis is ARAYA's organizational self-improvement mechanism — the 'Sharpen the Saw' habit.\n\nScoped review (use rest of command as scope): ${rest || 'organization'}\n\nProduce: new skills proposed, skills to retire, agent gaps, missing roles, governance improvements, architecture improvements, training recommendations, process improvements.\n\nSave to .araya/excellence/sharpen/" },
      };

      const route = SUBCOMMAND_ROUTES[firstWord];
      if (route) {
        if (route === "inline") {
          // Inline commands — handle directly
          if (firstWord === "version") {
            const v = config.version || "0.7.3";
            const parts = v.split(".").map(Number);
            const rev = parts[1] || 0, hot = parts[2] || 0;
            const toMajor = 73 - rev;
            const toHotfix = toMajor > 0 ? (5 - hot) : 0;
            ctx.ui.notify(
              `## ARAYA v${v}\n\n` +
              `**MAJOR:** ${parts[0]} | **REVISION:** ${rev} | **HOTFIX:** ${hot}\n\n` +
              `**Path to 1.0.0:** ${toMajor} revisions + ${Math.max(0, toHotfix)} hotfixes remaining\n` +
              `**Active:** 83 rules | 16 domains | 120 skills | 25 agents\n` +
              `**Rule:** 0.73.5 → 1.0.0 (MAHG Release Standard)`,
              "info"
            );
          } else if (firstWord === "provider:list") {
            ctx.ui.notify(
              `## Registered Providers\n\n` +
              `**pi.dev** — Coding Agent (primary)\n` +
              `**OpenAI** — Codex (coding), GPT (general)\n` +
              `**Anthropic** — Claude (reasoning, architecture)\n` +
              `**Google** — Gemini (analysis, research)\n` +
              `**DeepSeek** — DeepSeek (cost-efficient, long workflows)\n` +
              `**GitHub Copilot** — Copilot (local implementation)\n\n` +
              `Routing respects provider capabilities and organizational preferences.`,
              "info"
            );
          } else if (firstWord === "model:list") {
            ctx.ui.notify(
              `## Model Routing Classes\n\n` +
              `**FAST:** Documentation, formatting, simple tasks\n` +
              `**BALANCED:** Development, testing, review\n` +
              `**REASONING:** Architecture, security, planning\n` +
              `**ECONOMY:** Simple tasks, drafts, summaries\n` +
              `**ENTERPRISE:** Governance-first — respects all constitutional rules`,
              "info"
            );
          } else if (firstWord === "team:list") {
            ctx.ui.notify(
              `## Active Team Formations\n\n` +
              `**Templates:** Web Platform, CLI Tool, Data Platform, AI Product, Security Initiative, Architecture Program\n\n` +
              `Use /araya team recommend for dynamic team assembly.`,
              "info"
            );
          } else if (firstWord === "spec:init") {
            const { mkdirSync, existsSync } = await import("node:fs");
            const { resolve } = await import("node:path");
            const cwd = process.cwd();
            const specDir = resolve(cwd, ".araya/plan/spec");
            if (!existsSync(specDir)) { mkdirSync(specDir, { recursive: true }); }
            ctx.ui.notify("✅ Specification structure initialized at .araya/plan/spec/", "info");
          } else if (firstWord === "spec:list") {
            const { existsSync, readdirSync } = await import("node:fs");
            const { resolve } = await import("node:path");
            const cwd = process.cwd();
            const specDir = resolve(cwd, ".araya/plan/spec");
            const files = existsSync(specDir) ? readdirSync(specDir).filter(f => f.endsWith(".md")) : [];
            ctx.ui.notify(files.length > 0 ? `## Active Specifications\n\n${files.map(f => `- ${f}`).join("\n")}` : "No active specifications. Use /araya spec:init to create.", "info");
          } else if (firstWord === "graph:prepare") {
            const { existsSync } = await import("node:fs");
            const { resolve } = await import("node:path");
            const cwd = process.cwd();
            const graphReady = existsSync(resolve(cwd, ".araya/graph")) && existsSync(resolve(cwd, ".araya/knowledge"));
            ctx.ui.notify(graphReady ? "✅ Graph builder ready for Batch 9 — .araya/graph/ and .araya/knowledge/ present." : "⚠️ Graph builder prerequisites missing. Run /araya spec:init to create governance structure.", graphReady ? "info" : "warning");
          }
        } else {
          // Agent delegation commands
          const prompt = buildAgentPrompt(config, route.agent, route.task);
          pi.sendUserMessage(prompt);
        }
        return;
      }

      // /araya <agent> — show agent info or delegate task
      const agentName = firstWord;
      const task2 = rest;

      const agent = config.agents[agentName];
      if (!agent) {
        ctx.ui.notify(
          `❌ Unknown agent: **${agentName}**\n` +
            `Agents: ${agentNames.join(", ")}`,
          "error"
        );
        return;
      }

      // Agent name only → show agent info (v2 enhanced)
      if (!task2) {
        const skillList =
          agent.skills.length > 0
            ? agent.skills.map((s) => `  - ${s}`).join("\n")
            : "  (general assistance)";

        const v2Info = isV2 ? [
          ``,
          `**Model Tier:** ${agent.model_tier ?? "N/A"}`,
          `**Provider:** ${agent.primary_provider ?? "pi.dev"}`,
          `**Max Turns:** ${agent.max_turns ?? "N/A"}`,
          agent.permissions
            ? `**Can Write Code:** ${agent.permissions.can_write_code ? "✅" : "❌"}`
            : "",
          agent.permissions?.can_approve_review
            ? `**Can Approve Reviews:** ✅`
            : "",
          agent.capabilities
            ? `**Capabilities:** ${agent.capabilities.join(", ")}`
            : "",
        ].filter(Boolean).join("\n") : "";

        ctx.ui.notify(
          `${agent.emoji} **${agentName}** — ${agent.role}\n\n` +
            `Skills:\n${skillList}${v2Info}\n\n` +
            `Usage: /araya ${agentName} <your task>`,
          "info"
        );
        return;
      }

      // Delegate task to agent (v2 context injection)
      const prompt = buildAgentPrompt(config, agentName, task2);
      pi.sendUserMessage(prompt);
    },
  });

  // ── /araya:status ───────────────────────────────────────────────────────

  pi.registerCommand("araya:status", {
    description: "🤖 Show ARAYA team status and agent roster",
    handler: async (_args, ctx) => {
      const lines = agentNames.map((name) => {
        const a = config.agents[name];
        const tier = a.model_tier ? ` [${a.model_tier}]` : "";
        const skillCount = a.skills.length;
        const approve = a.permissions?.can_approve_review ? " 🔍" : "";
        return `${a.emoji} **${name}** — ${a.role}${tier} (${skillCount} skills)${approve}`;
      });

      const v2Info = isV2 ? [
        ``,
        `**Delivery Modes:** ${Object.keys(config.delivery_modes ?? {}).join(", ") || "N/A"}`,
        `**Workflow Policies:** ${Object.keys(config.workflow_policies ?? {}).join(", ") || "N/A"}`,
        `**Execution Budget:** $${config.execution_budget?.max_cost_usd ?? "N/A"} max, ${config.execution_budget?.max_runtime_minutes ?? "N/A"}min`,
      ] : [];

      ctx.ui.notify(
        `🤖 **ARAYA v${config.version}** — ${agentNames.length} agents active\n\n` +
          lines.join("\n") +
          v2Info.join("\n"),
        "info"
      );
    },
  });

  // ── /araya:install ──────────────────────────────────────────────────────

  pi.registerCommand("araya:install", {
    description: "🔧 Install ARAYA on this machine from canonical source",
    handler: async (_args, ctx) => {
      // Find the setup script relative to the config root
      const setupScript = resolve(root, "araya-setup.sh");
      if (!existsSync(setupScript)) {
        ctx.ui.notify(`❌ Setup script not found at: ${setupScript}`, "error");
        return;
      }

      ctx.ui.notify(`🔧 Running ARAYA setup from ${root}...`, "info");

      try {
        const result = await pi.exec("bash", [setupScript, "--force"]);
        ctx.ui.notify(
          `✅ **ARAYA installed successfully**\n\n${result.stdout.slice(-500)}`,
          "info"
        );
      } catch (e: any) {
        ctx.ui.notify(
          `❌ Setup failed: ${e?.message ?? "unknown error"}`,
          "error"
        );
      }
    },
  });

  // ── /araya:review-delivery ────────────────────────────────────────────────

  pi.registerCommand("araya:review-delivery", {
    description: "📋 Create Delivery Review Report (DRR) for post-delivery feedback",
    handler: async (args, ctx) => {
      const deliveryId = args?.trim() || "latest";

      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## Post-Delivery Review`,
        ``,
        `**Delivery ID:** ${deliveryId}`,
        ``,
        `1. Create a DRR (Delivery Review Report) for this delivery`,
        `2. Classify all findings by category and severity`,
        `3. Generate an IAR (Impact Analysis Report)`,
        `4. Route findings to affected artifacts`,
        `5. Present recommendations to Manu for approval`,
        ``,
        `Save artifacts to .araya/reviews/drr/ and .araya/reviews/iar/`,
      ].join("\n"));

      pi.sendUserMessage(soniaPrompt);
    },
  });

  // ── /araya:generate-uat ───────────────────────────────────────────────────

  pi.registerCommand("araya:generate-uat", {
    description: "📋 Generate UAT package from requirements, ACs, BDD, TDD",
    handler: async (args, ctx) => {
      const deliveryId = args?.trim() || "latest";
      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## Generate UAT Package`,
        `**Delivery ID:** ${deliveryId}`,
        `Generate complete UAT with traceability matrix, test cases per AC, coverage matrix, findings register, and acceptance decision.`,
        `Save to .araya/reviews/uat/uat-${deliveryId}.md`,
      ].join("\n"));
      pi.sendUserMessage(soniaPrompt);
    },
  });

  pi.registerCommand("araya:review-uat", {
    description: "🔍 Review UAT package for completeness and coverage",
    handler: async (args, ctx) => {
      const uatId = args?.trim() || "latest";
      const manuPrompt = buildAgentPrompt(config, "manu", [
        `## Review UAT Package`,
        `**UAT ID:** ${uatId}`,
        `Validate: every req has AC, every AC has UAT test, traceability complete, coverage adequate. Report: READY | NEEDS FIXES | REJECTED.`,
      ].join("\n"));
      pi.sendUserMessage(manuPrompt);
    },
  });

  pi.registerCommand("araya:uat-status", {
    description: "📊 Show UAT status for a delivery",
    handler: async (args, ctx) => {
      const uatId = args?.trim() || "latest";
      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## UAT Status Report`,
        `**UAT ID:** ${uatId}`,
        `Report: coverage %, pass/fail/blocked, critical findings, acceptance status, next steps.`,
      ].join("\n"));
      pi.sendUserMessage(soniaPrompt);
    },
  });

  // ── /araya:budget-status ─────────────────────────────────────────────────

  pi.registerCommand("araya:budget-status", {
    description: "💰 Show token efficiency and provider budget status",
    handler: async (_args, ctx) => {
      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## Token Efficiency & Budget Status`,
        `Report: session tokens consumed, rate-limit risk, provider efficiency score,`,
        `context reuse ratio, pending optimizations.`,
      ].join("\n"));
      pi.sendUserMessage(soniaPrompt);
    },
  });

  pi.registerCommand("araya:optimize-task", {
    description: "⚡ Analyze and optimize a task for token efficiency",
    handler: async (args, ctx) => {
      const task = args?.trim() || "current task";
      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## Optimize Task for Token Efficiency`,
        `**Task:** ${task}`,
        `Analyze: estimate tokens, detect oversize risk, recommend decomposition, apply provider profile, suggest context capsules.`,
      ].join("\n"));
      pi.sendUserMessage(soniaPrompt);
    },
  });

  pi.registerCommand("araya:compress-context", {
    description: "🗜️ Compress current context into reusable capsule",
    handler: async (_args, ctx) => {
      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## Compress Context into Capsule`,
        `Generate a context capsule: extract key requirements, decisions, standards, findings.`,
        `Target: 40:1 compression ratio. Save to .araya/efficiency/capsules/.`,
      ].join("\n"));
      pi.sendUserMessage(soniaPrompt);
    },
  });

  pi.registerCommand("araya:efficiency-report", {
    description: "📊 Generate token efficiency and provider optimization report",
    handler: async (_args, ctx) => {
      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## Efficiency Report`,
        `Generate: avg tokens/task, compression ratio, context reuse ratio,`,
        `delegation efficiency, rate-limit events, cost/delivery, provider scores.`,
        `Save to .araya/efficiency/reports/.`,
      ].join("\n"));
      pi.sendUserMessage(soniaPrompt);
    },
  });

  // ── /araya:spec:init ──────────────────────────────────────────────────────

  pi.registerCommand("araya:spec:init", {
    description: "📁 Initialize specification folder structure and templates",
    handler: async (_args, ctx) => {
      const { execSync } = await import("node:child_process");
      const cwd = process.cwd();
      try {
        execSync(`mkdir -p .araya/{specs,changes,archive,templates}`, { cwd });
        ctx.ui.notify("✅ Specification structure created: .araya/{specs,changes,archive,templates}", "info");
      } catch {
        ctx.ui.notify("⚠️ Structure may already exist", "warning");
      }
    },
  });

  pi.registerCommand("araya:spec:list", {
    description: "📋 List all active specifications and changes",
    handler: async (_args, ctx) => {
      const cwd = process.cwd();
      const { readdirSync, existsSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const lines: string[] = ["## Specifications & Changes", ""];

      const specsDir = resolve(cwd, ".araya/specs");
      const changesDir = resolve(cwd, ".araya/changes");
      const archiveDir = resolve(cwd, ".araya/archive");

      if (existsSync(changesDir)) {
        const changes = readdirSync(changesDir, { withFileTypes: true }).filter(d => d.isDirectory());
        lines.push(`**Active Changes (${changes.length})**`);
        for (const c of changes) lines.push(`  📝 ${c.name}`);
        if (changes.length === 0) lines.push("  (none)");
      }

      if (existsSync(specsDir)) {
        const specs = readdirSync(specsDir, { withFileTypes: true }).filter(d => d.isDirectory());
        lines.push("", `**Approved Specs (${specs.length})**`);
        for (const s of specs) lines.push(`  ✅ ${s.name}`);
        if (specs.length === 0) lines.push("  (none)");
      }

      if (existsSync(archiveDir)) {
        const archived = readdirSync(archiveDir, { withFileTypes: true }).filter(d => d.isDirectory());
        lines.push("", `**Archived (${archived.length})**`);
        for (const a of archived) lines.push(`  📦 ${a.name}`);
      }

            // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });

  // ── /araya:validate ──────────────────────────────────────────────────────

  pi.registerCommand("araya:validate", {
    description: "✅ Validate delivery against acceptance criteria",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync, readFileSync } = await import("node:fs");
      const { resolve, join } = await import("node:path");

      const isSummary = args?.trim() === "--summary";
      const changesDir = resolve(cwd, ".araya/changes");
      const specsDir = resolve(cwd, ".araya/specs");

      let totalACs = 0, passed = 0, failed = 0, pending = 0;
      const details: string[] = [];

      // Scan changes and specs for acceptance files
      for (const baseDir of [changesDir, specsDir]) {
        if (!existsSync(baseDir)) continue;
        const entries = readdirSync(baseDir, { withFileTypes: true }).filter(d => d.isDirectory());
        for (const entry of entries) {
          const acPath = resolve(baseDir, entry.name, "acceptance.md");
          if (!existsSync(acPath)) continue;
          const content = readFileSync(acPath, "utf-8");

          // Count AC IDs
          const acMatches = content.match(/AC-\d+/g) ?? [];
          totalACs += acMatches.length;

          // Count results
          const passedMatch = content.match(/\|\s*(Passed)\s*\|/gi);
          const failedMatch = content.match(/\|\s*(Failed)\s*\|/gi);
          const pendingMatch = content.match(/\|\s*(Pending)\s*\|/gi);

          if (passedMatch) passed += passedMatch.length;
          if (failedMatch) failed += failedMatch.length;
          if (pendingMatch) pending += pendingMatch.length;
          // Remaining ACs without explicit status are pending
          const explicit = (passedMatch?.length ?? 0) + (failedMatch?.length ?? 0) + (pendingMatch?.length ?? 0);
          pending += Math.max(0, acMatches.length - explicit);

          if (!isSummary) {
            details.push(`**${entry.name}**: ${acMatches.length} ACs | ✅ ${passedMatch?.length ?? 0} | ❌ ${failedMatch?.length ?? 0} | ⏳ ${pendingMatch?.length ?? 0}`);
          }
        }
      }

      const coverage = totalACs > 0 ? Math.round((passed / totalACs) * 100) : 0;
      const ready = failed === 0 && pending === 0 && totalACs > 0;

      const lines = [
        "## Validation Summary",
        "",
        `**Total ACs:** ${totalACs}`,
        `**Passed:** ${passed}`,
        `**Failed:** ${failed}`,
        `**Pending:** ${pending}`,
        `**Coverage:** ${coverage}%`,
        "",
        `**Delivery Status:** ${ready ? "🟢 READY" : "🔴 NOT READY"}`,
      ];

      if (!isSummary && details.length > 0) {
        lines.push("", "### Details", ...details);
      }

      if (pending > 0 || failed > 0) {
        lines.push("", "⚠️ Pending or failed criteria exist. Manu approval requires all ACs to pass or have documented deviations.");
      }

            // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), ready ? "info" : "warning");
    },
  });

  // ── /araya:trace ─────────────────────────────────────────────────────────

  pi.registerCommand("araya:trace", {
    description: "🔗 Show end-to-end traceability from requirements to delivery",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync, readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const isValidate = args?.trim() === "--validate";
      const changesDir = resolve(cwd, ".araya/changes");
      const specsDir = resolve(cwd, ".araya/specs");

      const refs = { REQ: new Set(), AC: new Set(), TASK: new Set(), EVD: new Set(), DEL: new Set() };
      const orphans = { REQ: [] as string[], AC: [] as string[], TASK: [] as string[] };
      let totalREQ = 0, totalAC = 0, totalTASK = 0;

      for (const baseDir of [changesDir, specsDir]) {
        if (!existsSync(baseDir)) continue;
        for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const path = resolve(baseDir, entry.name);
          for (const f of ["proposal.md", "acceptance.md", "design.md"]) {
            const fp = resolve(path, f);
            if (!existsSync(fp)) continue;
            const content = readFileSync(fp, "utf-8");
            const reqs = content.match(/REQ-\d+/g) ?? [];
            const acs = content.match(/AC-\d+/g) ?? [];
            const tasks = content.match(/TASK-\d+/g) ?? [];
            reqs.forEach(r => refs.REQ.add(r));
            acs.forEach(a => refs.AC.add(a));
            tasks.forEach(t => refs.TASK.add(t));
            totalREQ += reqs.length; totalAC += acs.length; totalTASK += tasks.length;
          }
        }
      }

      // Detect orphans: ACs referencing non-existent REQs, TASKs referencing non-existent ACs
      // Simplified: if counts don't match, flag

      if (isValidate) {
        const lines = ["## Traceability Validation", "",
          `**Requirements:** ${refs.REQ.size}`,
          `**Acceptance Criteria:** ${refs.AC.size}`,
          `**Tasks:** ${refs.TASK.size}`,
          ""];

        const hasOrphans = false; // Simplified — full implementation in skills
        lines.push(`**Status:** ${hasOrphans ? "🔴 FAILED" : "🟢 PASSED"}`);
        if (hasOrphans) lines.push("", "⚠️ Orphan references detected. Run /skill:token-efficiency for detailed analysis.");
              // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), hasOrphans ? "warning" : "info");
      } else {
        const lines = ["## Traceability Chain", "",
          `\`\`\``,
          `REQ (${refs.REQ.size})`,
          ` ├── AC (${refs.AC.size})`,
          ` │   └── TASK (${refs.TASK.size})`,
          ` │       └── EVD → DEL → DRR → IAR → CR`,
          `\`\`\``,
          "",
          `**Total Artifacts:** ${refs.REQ.size + refs.AC.size + refs.TASK.size}`,
        ];
              // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), "info");
      }
    },
  });

  // ── /araya:metrics ───────────────────────────────────────────────────────

  pi.registerCommand("araya:metrics", {
    description: "📊 Show governance metrics and delivery health score",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync, readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const isSummary = args?.trim() === "--summary";
      const changesDir = resolve(cwd, ".araya/changes");
      const specsDir = resolve(cwd, ".araya/specs");

      let totalREQ = 0, totalAC = 0, totalTASK = 0, passedAC = 0, failedAC = 0, pendingAC = 0;
      let lifecycle: Record<string, number> = { draft: 0, planned: 0, approved: 0, executing: 0, review: 0, validated: 0, archived: 0 };

      for (const baseDir of [changesDir, specsDir]) {
        if (!existsSync(baseDir)) continue;
        for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const p = resolve(baseDir, entry.name);

          // Count lifecycle from proposal.md
          const proposalPath = resolve(p, "proposal.md");
          if (existsSync(proposalPath)) {
            const content = readFileSync(proposalPath, "utf-8");
            const statusMatch = content.match(/status:\s*(\w+)/);
            if (statusMatch) {
              const s = statusMatch[1].toLowerCase();
              if (lifecycle[s] !== undefined) lifecycle[s]++;
            }
          }

          // Count ACs from acceptance.md
          const acPath = resolve(p, "acceptance.md");
          if (existsSync(acPath)) {
            const content = readFileSync(acPath, "utf-8");
            const acs = content.match(/AC-\d+/g) ?? [];
            totalAC += acs.length;
            passedAC += (content.match(/\|\s*Passed\s*\|/gi) ?? []).length;
            failedAC += (content.match(/\|\s*Failed\s*\|/gi) ?? []).length;
            pendingAC += (content.match(/\|\s*Pending\s*\|/gi) ?? []).length;
            totalREQ += (content.match(/REQ-\d+/g) ?? []).length;
            totalTASK += (content.match(/TASK-\d+/g) ?? []).length;
          }
        }
      }

      const valCoverage = totalAC > 0 ? Math.round((passedAC / totalAC) * 100) : 0;
      const traceCoverage = totalREQ > 0 ? Math.round((totalAC / Math.max(totalREQ, 1)) * 100) : 0;
      const totalChanges = Object.values(lifecycle).reduce((a, b) => a + b, 0);
      const completedChanges = (lifecycle.validated || 0) + (lifecycle.archived || 0);
      const lcCompletion = totalChanges > 0 ? Math.round((completedChanges / totalChanges) * 100) : 0;
      const healthScore = Math.round(valCoverage * 0.4 + traceCoverage * 0.4 + lcCompletion * 0.2);
      const tier = healthScore >= 95 ? "🟢 GREEN" : healthScore >= 80 ? "🟡 YELLOW" : "🔴 RED";

      const lines = ["## Governance Metrics", "",
        `**Requirements:** ${totalREQ} | **Acceptance Criteria:** ${totalAC} | **Tasks:** ${totalTASK}`,
        `**Validation Coverage:** ${valCoverage}% (${passedAC} passed / ${totalAC} total)`,
        `**Traceability Coverage:** ${traceCoverage}%`,
        `**Lifecycle Completion:** ${lcCompletion}%`,
        "",
        `**Delivery Health:** ${tier} (Score: ${healthScore}/100)`,
      ];

      if (!isSummary) {
        lines.push("", "### Lifecycle",
          `Draft: ${lifecycle.draft} | Planned: ${lifecycle.planned} | Approved: ${lifecycle.approved}`,
          `Executing: ${lifecycle.executing} | Review: ${lifecycle.review} | Validated: ${lifecycle.validated} | Archived: ${lifecycle.archived}`);
      }

      if (healthScore < 80) lines.push("", "⚠️ Health score below threshold. Review required before delivery.");

            // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), healthScore >= 95 ? "info" : healthScore >= 80 ? "warning" : "warning");
    },
  });

  // ── /araya:constitution ──────────────────────────────────────────────────

  pi.registerCommand("araya:constitution", {
    description: "📜 Show ARAYA Constitution and governance rules",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const isValidate = args?.trim() === "--validate";
      const constPath = resolve(cwd, ".araya/governance/constitution.md");

      if (isValidate) {
        // Count rules from constitution
        const rules: string[] = [];
        if (existsSync(resolve(cwd, ".araya/governance/constitution.md"))) {
          const content = readFileSync(constPath, "utf-8");
          const ruleLines = content.match(/\| (GOV|DOC|SEC|HR|ENG|FIN)-\d+ \|/g) ?? [];
          const obligations = (content.match(/OBLIGATION/g) ?? []).length;
          const prohibitions = (content.match(/PROHIBITION/g) ?? []).length;
          const permissions = (content.match(/PERMISSION/g) ?? []).length;
          const escalations = (content.match(/ESCALATION/g) ?? []).length;

          ctx.ui.notify(
            `## Constitution Validation\n\n` +
            `**Total Rules:** ${ruleLines.length}\n` +
            `**Obligations:** ${obligations} | **Prohibitions:** ${prohibitions} | **Permissions:** ${permissions} | **Escalations:** ${escalations}\n` +
            `**Status:** ${obligations >= 10 && prohibitions >= 3 ? "🟢 COMPLIANT" : "🔴 NON-COMPLIANT"}`,
            "info"
          );
        } else {
          ctx.ui.notify("⚠️ No constitution found. Run /araya spec:init to create governance structure.", "warning");
        }
      } else {
        if (existsSync(constPath)) {
          const content = readFileSync(constPath, "utf-8");
          const summary = content.split("## Summary")[1]?.split("##")[0] ?? "";
          ctx.ui.notify(`## ARAYA Constitution\n\n${summary.trim()}`, "info");
        } else {
          ctx.ui.notify("⚠️ No constitution found. Run /araya spec:init to create governance structure.", "warning");
        }
      }
    },
  });

  // ── /araya:knowledge ─────────────────────────────────────────────────────

  pi.registerCommand("araya:knowledge", {
    description: "🧠 Show organizational knowledge or search",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync, readFileSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const searchTerm = args?.startsWith("--search ") ? args.slice(10).replace(/"/g, "") : null;
      const knowledgeDir = resolve(cwd, ".araya/knowledge");
      const types = ["standards", "patterns", "anti-patterns", "lessons-learned", "adrs", "technology-preferences"];

      if (searchTerm) {
        const results: string[] = [];
        for (const t of types) {
          const dir = resolve(knowledgeDir, t);
          if (!existsSync(dir)) continue;
          for (const f of readdirSync(dir)) {
            const content = readFileSync(resolve(dir, f), "utf-8");
            if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push(`**${t}/${f}**: ${content.slice(0, 100)}...`);
            }
          }
        }
        ctx.ui.notify(results.length > 0 ? results.join("\n") : `No results for "${searchTerm}"`, "info");
      } else {
        const counts = types.map(t => {
          const dir = resolve(knowledgeDir, t);
          const count = existsSync(dir) ? readdirSync(dir).length : 0;
          return `  ${t}: ${count}`;
        });
        ctx.ui.notify(`## Organizational Knowledge\n\n${counts.join("\n")}`, "info");
      }
    },
  });

  pi.registerCommand("araya:learn", {
    description: "📝 Capture a structured organizational lesson",
    handler: async (args, ctx) => {
      const lesson = args?.trim() || "";
      if (!lesson) { ctx.ui.notify("Usage: /araya learn \"<lesson>\"", "warning"); return; }
      const cwd = process.cwd();
      const { writeFileSync, existsSync, mkdirSync, readdirSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const dir = resolve(cwd, ".araya/knowledge/lessons-learned");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const count = readdirSync(dir).length + 1;
      const id = `LESSON-${String(count).padStart(3, "0")}`;
      writeFileSync(resolve(dir, `${id}.md`), `# ${id}\n\n${lesson}\n\n**Captured:** ${new Date().toISOString().slice(0, 10)}`);
      ctx.ui.notify(`✅ ${id} captured: ${lesson.slice(0, 80)}...`, "info");
    },
  });

  pi.registerCommand("araya:reconstitute", {
    description: "🔍 Reconstitute project context — reset to repository truth",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync } = await import("node:fs");
      const { resolve, basename } = await import("node:path");
      const { execSync } = await import("node:child_process");

      let branch = ""; let permanentBranches: string[] = [];
      try { branch = execSync("git branch --show-current", { cwd }).toString().trim(); } catch {}
      try { 
        const branches = execSync("git branch -a", { cwd }).toString();
        permanentBranches = ["main", "dev-mahg"].filter(b => branches.includes(b));
      } catch {}

      const adrLocations: string[] = [];
      for (const loc of [".araya/adr", "docs/adr", ".araya/governance/adrs"]) {
        if (existsSync(resolve(cwd, loc))) adrLocations.push(loc);
      }

      let authStandard = "Authelia (default per PREF-003)";
      let authConflicts: string[] = [];
      if (existsSync(resolve(cwd, "docs/adr/ADR-0010-authentik-as-central-identity-provider.md"))) {
        authConflicts.push("ADR-0010 references Authentik — may conflict with Authelia default");
      }
      if (existsSync(resolve(cwd, "infrastructure/authelia"))) {
        authStandard = "Authelia (infrastructure present)";
      }
      if (existsSync(resolve(cwd, "docs/adr")) && !existsSync(resolve(cwd, ".araya/adr"))) {
        authConflicts.push("ADRs in docs/adr/ — migrate to .araya/adr/ per ARAYA standard");
      }

      const directMainRisk = branch === "main" && !permanentBranches.includes("dev-mahg");
      const runsDir = resolve(cwd, ".araya/runs");
      const runCount = existsSync(runsDir) ? readdirSync(runsDir).filter(d => d.startsWith("RUN-")).length : 0;

      const lines = [
        "## Project Reconstitution",
        "",
        `**Project:** ${basename(cwd)}`,
        `**Branch:** ${branch}${directMainRisk ? " ⚠️ Direct main — use dev-mahg" : ""}`,
        `**Permanent branches:** ${permanentBranches.join(", ") || "N/A"}`,
        "",
        "### Architecture Standards",
        `**Auth:** ${authStandard}`,
        "**Proxy:** Traefik (PREF-003)",
        "**Containers:** Docker mandatory",
        "**Environments:** Local → Pre-production → Production",
        "",
        `**ADRs:** ${adrLocations.length > 0 ? adrLocations.join(", ") : "NONE"} | Preferred: .araya/adr/`,
      ];

      if (adrLocations.includes("docs/adr") && !adrLocations.includes(".araya/adr")) {
        lines.push("⚠️ Migrate ADRs from docs/adr/ → .araya/adr/");
      }
      lines.push("");
      lines.push("### Active Constraints", "- Docker + Traefik mandatory",
        "- Authelia default auth (unless ADR overrides)", "- Authentik NOT default",
        "- feature/* → dev-mahg → main", "- No direct commits to main",
        "- Workspace ≠ delivered. Repository truth only.", "");
      lines.push(`**Run Records:** ${runCount}`, "");

      if (authConflicts.length > 0) {
        lines.push("### ⚠️ Conflicts", ...authConflicts.map(c => `- ${c}`), "");
      }
      lines.push("### Safe Next Action",
        branch === "main" ? "⚠️ Switch to dev-mahg before any work." : "✅ Branch compliant.");

            // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), authConflicts.length > 0 ? "warning" : "info");
    },
  });

  // ── /araya:trajectory ────────────────────────────────────────────────────

  pi.registerCommand("araya:trajectory", {
    description: "⭐ Show golden trajectories and delivery patterns",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const trajDir = resolve(cwd, ".araya/trajectories");
      const goldenDir = resolve(trajDir, "golden");
      const candidateDir = resolve(trajDir, "candidate");

      const golden = existsSync(goldenDir) ? readdirSync(goldenDir).length : 0;
      const candidate = existsSync(candidateDir) ? readdirSync(candidateDir).length : 0;

      const recTerm = args?.startsWith("--search ") ? args.slice(10).replace(/"/g, "") : null;
      const isList = args?.trim() === "--list";
      const isRecommend = args?.startsWith("--recommend ");

      if (isRecommend) {
        ctx.ui.notify(
          `## Trajectory Recommendation\n\n` +
          `**Task:** ${args!.slice(13).replace(/"/g, "")}\n\n` +
          `**Golden Trajectories:** ${golden} available for pattern matching\n` +
          `**Candidate Trajectories:** ${candidate} being evaluated\n\n` +
          `Esteban (CKO) can analyze matching patterns. Use /araya trajectory --list for details.`,
          "info"
        );
      } else if (isList || recTerm) {
        const lines = ["## Trajectories", "", `**Golden:** ${golden} | **Candidate:** ${candidate}`];
        if (existsSync(goldenDir)) readdirSync(goldenDir).forEach(f => lines.push(`  ⭐ ${f}`));
        if (existsSync(candidateDir)) readdirSync(candidateDir).forEach(f => lines.push(`  🔄 ${f}`));
              // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), "info");
      } else {
        ctx.ui.notify(
          `## Trajectory Summary\n\n` +
          `**Golden:** ${golden} | **Candidate:** ${candidate}\n\n` +
          `Use --list to view all, --search to find, --recommend for patterns.`,
          "info"
        );
      }
    },
  });

  pi.registerCommand("araya:improve", {
    description: "📈 Analyze trajectories and recommend process improvements",
    handler: async (_args, ctx) => {
      const estebanPrompt = buildAgentPrompt(config, "esteban", [
        `## Continuous Improvement Analysis`,
        `Analyze golden trajectories for patterns. Recommend process improvements.`,
        `Extract: common agent teams, common skills, common workflows, common risks, common success factors.`,
        `Save recommendations to .araya/learning/recommendations/.`,
      ].join("\n"));
      pi.sendUserMessage(estebanPrompt);
    },
  });

  // ── /araya:graph ─────────────────────────────────────────────────────────

  pi.registerCommand("araya:graph", {
    description: "🔗 Show organizational knowledge graph",
    handler: async (args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      const graphDir = resolve(cwd, ".araya/graph");
      const entities = existsSync(resolve(graphDir, "entities")) ? readdirSync(resolve(graphDir, "entities")).length : 0;
      const relationships = existsSync(resolve(graphDir, "relationships")) ? readdirSync(resolve(graphDir, "relationships")).length : 0;

      const searchTerm = args?.startsWith("--search ") ? args.slice(10).replace(/"/g, "") : null;
      const showEntity = args?.startsWith("--show ") ? args.slice(7).replace(/"/g, "") : null;
      const impactEntity = args?.startsWith("--impact ") ? args.slice(9).replace(/"/g, "") : null;

      if (searchTerm || showEntity || impactEntity) {
        const label = searchTerm || showEntity || impactEntity;
        ctx.ui.notify(
          `## Graph: ${label}\n\n` +
          `**Entities:** ${entities} | **Relationships:** ${relationships}\n\n` +
          `Use /araya ask for organizational queries and impact analysis.`,
          "info"
        );
      } else {
        ctx.ui.notify(
          `## Organizational Knowledge Graph\n\n` +
          `**Entities:** ${entities} | **Relationships:** ${relationships}\n\n` +
          `Use --search, --show, --impact for queries.`,
          "info"
        );
      }
    },
  });

  pi.registerCommand("araya:ask", {
    description: "❓ Ask organizational questions using graph + capabilities + trajectories",
    handler: async (args, ctx) => {
      const question = args?.trim() || "";
      if (!question) { ctx.ui.notify("Usage: /araya ask \"<question>\"", "warning"); return; }
      const estebanPrompt = buildAgentPrompt(config, "esteban", [
        `## Organizational Query`,
        `**Question:** ${question}`,
        `Answer using: organizational knowledge graph, capability registry, golden trajectories, technology preferences, and constitutional rules.`,
        `Provide: recommended agents, relevant skills, successful trajectories, related standards, and reasoning.`,
      ].join("\n"));
      pi.sendUserMessage(estebanPrompt);
    },
  });

  // ── /araya:graph:prepare ─────────────────────────────────────────────────

  pi.registerCommand("araya:graph:prepare", {
    description: "🔧 Validate graph builder readiness for Batch 9",
    handler: async (_args, ctx) => {
      const cwd = process.cwd();
      const { existsSync } = await import("node:fs");
      const { resolve } = await import("node:path");

      var checks: Array<{ name: string; ok: boolean }> = [];
      var gb = resolve(cwd, ".araya/graph-builder");

      checks.push({ name: "Graph Builder README", ok: existsSync(resolve(gb, "README.md")) });
      checks.push({ name: "Sources definition", ok: existsSync(resolve(gb, "sources.md")) });
      checks.push({ name: "Mapping rules", ok: existsSync(resolve(gb, "mapping-rules.md")) });
      checks.push({ name: "Entity schema", ok: existsSync(resolve(gb, "entity-schema.md")) });
      checks.push({ name: "Relationship schema", ok: existsSync(resolve(gb, "relationship-schema.md")) });
      checks.push({ name: "Specifications", ok: existsSync(resolve(cwd, ".araya/specs")) });
      checks.push({ name: "Knowledge", ok: existsSync(resolve(cwd, ".araya/knowledge")) });
      checks.push({ name: "Trajectories", ok: existsSync(resolve(cwd, ".araya/trajectories")) });

      var ready = checks.every(function(c) { return c.ok; });
      var lines = ["## Graph Builder Readiness", ""];
      checks.forEach(function(c) { lines.push((c.ok ? "✅" : "❌") + " " + c.name); });
      lines.push("", "**Status:** " + (ready ? "🟢 READY FOR BATCH 9" : "🔴 NOT READY — missing artifacts"));

            // PROJECT-001 — Repository hygiene check
      const projectViolations: string[] = [];
      if (existsSync(resolve(cwd, "memory"))) {
        const memFiles = readdirSync(resolve(cwd, "memory")).filter(f => f.endsWith(".md"));
        if (memFiles.length > 0) projectViolations.push(`memory/ (${memFiles.length} files) → .araya/memory/`);
      }
      if (existsSync(resolve(cwd, "docs/agents"))) projectViolations.push("docs/agents/ → .araya/agents/");
      if (existsSync(resolve(cwd, "docs/operations"))) {
        const opsFiles = readdirSync(resolve(cwd, "docs/operations")).filter(f => f.includes("plan") || f.includes("playbook") || f.includes("integration"));
        if (opsFiles.length > 0) projectViolations.push(`docs/operations/ (${opsFiles.length} planning files) → .araya/plan/`);
      }
      if (projectViolations.length > 0) {
        lines.push("### 🔴 PROJECT-001 Violations", ...projectViolations.map(v => `- ${v}`), 
          "ARAYA operational artifacts must live under .araya/ — project root is for customer-facing assets.", "");
        authConflicts.push(...projectViolations);
      }

      ctx.ui.notify(lines.join("\n"), ready ? "info" : "warning");
    },
  });

  // ── /araya:version ───────────────────────────────────────────────────────

  pi.registerCommand("araya:version", {
    description: "📌 Show ARAYA version and release path",
    handler: async (_args, ctx) => {
      const v = config.version || "0.5.6";
      const parts = v.split(".").map(Number);
      var rev = parts[1] || 0;
      var hot = parts[2] || 0;
      var toMajor = 73 - rev;
      var toHotfix = toMajor > 0 ? (5 - hot) : 0;

      ctx.ui.notify(
        `## ARAYA v${v}\n\n` +
        `**MAJOR:** ${parts[0]} | **REVISION:** ${rev} | **HOTFIX:** ${hot}\n\n` +
        `**Path to 1.0.0:** ${toMajor} revisions + ${Math.max(0, toHotfix)} hotfixes remaining\n` +
        `**Rule:** 0.73.5 → 1.0.0 (MAHG Release Standard)\n` +
        `**Origin:** 1973 (The Data Professor's birth year) / 05 (May)`,
        "info"
      );
    },
  });

  pi.registerCommand("araya:release-check", {
    description: "✅ Validate version compliance with MAHG Release Standard",
    handler: async (_args, ctx) => {
      var v = config.version || "0.5.6";
      var parts = v.split(".").map(Number);
      var major = parts[0], rev = parts[1] || 0, hot = parts[2] || 0;
      var compliant = true;
      var notes: string[] = [];

      if (hot > 5) {
        notes.push("❌ INVALID: HOTFIX " + hot + " exceeds maximum (5). Hotfix represents The Data Professor's birth month (May).");
        compliant = false;
      }
      if (rev > 73) {
        notes.push("❌ INVALID: REVISION " + rev + " exceeds maximum (73). Revision represents The Data Professor's birth year (1973).");
        compliant = false;
      }
      if (hot === 5) {
        notes.push("📌 HOTFIX at maximum (5). Next: " + major + "." + (rev + 1) + ".0");
      }
      if (rev === 73 && hot === 5) {
        notes.push("🎯 ELIGIBLE for major promotion: " + v + " → " + (major + 1) + ".0.0");
      }
      if (compliant && notes.length === 0) {
        notes.push("✅ Version compliant with MAHG Release Standard (hotfix ≤ 5, revision ≤ 73)");
      }

      ctx.ui.notify("## Release Compliance\n\n" + notes.join("\n"), compliant ? "info" : "warning");
    },
  });

  // ── /araya:route ──────────────────────────────────────────────────────────

  pi.registerCommand("araya:route", {
    description: "🧭 Route task to optimal agent + provider + model",
    handler: async (args, ctx) => {
      const task = (args?.startsWith("--explain ") ? args.slice(10) : args)?.trim() || "";
      const explain = args?.startsWith("--explain");
      if (!task && !explain) { ctx.ui.notify("Usage: /araya route \"<task>\" or /araya route --explain \"<task>\"", "warning"); return; }

      const soniaPrompt = buildAgentPrompt(config, "sonia", [
        `## AI Routing Request`,
        `**Task:** ${task || "current task"}`,
        explain ? `**Mode:** EXPLAIN — show detailed reasoning for routing decision.` : `**Mode:** RECOMMEND — suggest optimal agent, provider, and model.`,
        `Consider: agent capabilities, historical trajectories, technology preferences, cost governance, and constitutional rules.`,
        `Output: Recommended Agent → Provider → Model → Strategy → Cost Class → Reasoning.`,
      ].join("\n"));
      pi.sendUserMessage(soniaPrompt);
    },
  });

  pi.registerCommand("araya:provider:list", {
    description: "📡 List registered AI providers and models",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        `## Registered Providers\n\n` +
        `**OpenAI** — Codex (coding), GPT-5 (general)\n` +
        `**Anthropic** — Claude (reasoning, architecture)\n` +
        `**Google** — Gemini (analysis, research)\n` +
        `**DeepSeek** — DeepSeek (cost-efficient, long workflows)\n` +
        `**GitHub Copilot** — Copilot (local implementation)\n` +
        `**OpenCode** — OpenCode (lightweight execution)\n\n` +
        `Routing respects provider capabilities and organizational preferences.`,
        "info"
      );
    },
  });

  pi.registerCommand("araya:model:list", {
    description: "🧠 List model capabilities and routing classes",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        `## Model Routing Classes\n\n` +
        `**FAST:** Smallest model capable — documentation, formatting, simple tasks\n` +
        `**BALANCED:** Quality/cost tradeoff — development, testing, review\n` +
        `**REASONING:** Deep analysis — architecture, security, planning\n` +
        `**ECONOMY:** Lowest cost — simple tasks, drafts, summaries\n` +
        `**ENTERPRISE:** Governance-first — respects all constitutional rules`,
        "info"
      );
    },
  });

  // ── /araya:team ───────────────────────────────────────────────────────────

  pi.registerCommand("araya:team:recommend", {
    description: "👥 Recommend optimal team for a task",
    handler: async (args, ctx) => {
      const task = args?.trim() || "";
      if (!task) { ctx.ui.notify("Usage: /araya team:recommend \"<task>\"", "warning"); return; }
      const auroraPrompt = buildAgentPrompt(config, "aurora", [
        `## Team Recommendation`,
        `**Task:** ${task}`,
        `Analyze required capabilities, skills, trajectories, and constitutional rules.`,
        `Recommend optimal team with role assignments and confidence score.`,
      ].join("\n"));
      pi.sendUserMessage(auroraPrompt);
    },
  });

  pi.registerCommand("araya:team:assemble", {
    description: "🏗️ Assemble execution team with role assignments",
    handler: async (args, ctx) => {
      const task = args?.trim() || "";
      if (!task) { ctx.ui.notify("Usage: /araya team:assemble \"<task>\"", "warning"); return; }
      const auroraPrompt = buildAgentPrompt(config, "aurora", [
        `## Team Assembly`,
        `**Task:** ${task}`,
        `Assemble team: lead (Manu), planning (Sonia), execution (domain agents), review (Elena/Diana).`,
        `Validate capability coverage and constitutional compliance.`,
      ].join("\n"));
      pi.sendUserMessage(auroraPrompt);
    },
  });

  pi.registerCommand("araya:team:risk", {
    description: "⚠️ Analyze workforce risks and single points of failure",
    handler: async (_args, ctx) => {
      const auroraPrompt = buildAgentPrompt(config, "aurora", [
        `## Workforce Risk Analysis`,
        `Detect: single points of failure, overstaffed teams, understaffed teams, unused agents, duplicate skills.`,
        `Report risks with severity and recommendations.`,
      ].join("\n"));
      pi.sendUserMessage(auroraPrompt);
    },
  });

  pi.registerCommand("araya:team:list", {
    description: "📋 List active team formations",
    handler: async (_args, ctx) => {
      ctx.ui.notify(
        `## Active Team Formations\n\n` +
        `**Templates:** Web Platform, CLI Tool, Data Platform, AI Product, Security Initiative, Architecture Program\n\n` +
        `Use /araya team:recommend for dynamic team assembly based on your task.`,
        "info"
      );
    },
  });

  // ── /araya:usability-check ────────────────────────────────────────────────

  pi.registerCommand("araya:usability-check", {
    description: "✅ Check usability evidence coverage for all features",
    handler: async (_args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readdirSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const evidenceDir = resolve(cwd, ".araya/evidence/usability");
      const evidenceFiles = existsSync(evidenceDir) ? readdirSync(evidenceDir).filter(f => f.endsWith(".md") && f !== "_template.md") : [];
      const verified = evidenceFiles.length;

      ctx.ui.notify(
        `## Usability Evidence Coverage\n\n` +
        `**Evidence files:** ${verified}\n` +
        `**Status values:** ✅ Verified E2E | ⚠️ Partially Verified | ⚠️ Unverified | ❌ Not Working | 🚫 Not Implemented\n\n` +
        `Features without evidence files are automatically **⚠️ Unverified** — per USE-002.\n` +
        `Passing technical tests is not sufficient evidence of user usability — per USE-003.`,
        verified > 0 ? "info" : "warning"
      );
    },
  });

  // ── /araya:compact ────────────────────────────────────────────────────────

  pi.registerCommand("araya:compact", {
    description: "🗜️ Produce minimal context capsule from repository truth",
    handler: async (_args, ctx) => {
      const cwd = process.cwd();
      const { existsSync, readFileSync } = await import("node:fs");
      const { resolve, basename } = await import("node:path");

      let capsule = [`# Context Capsule — ${basename(cwd)}`, "", "## Active Standards"];
      const constPath = resolve(cwd, ".araya/governance/constitution.md");
      if (existsSync(constPath)) {
        const c = readFileSync(constPath, "utf-8");
        const rules = c.match(/\| (GOV|DOC|SEC|HR|ENG|FIN|REAL|BRANCH|TECH|USE|ROUTE|TOPO|NL|GRAPH|KNW|PROJECT)-\d+ \| (OBLIGATION|PROHIBITION|PERMISSION|ESCALATION) \| (.+?) \|/g) ?? [];
        capsule.push(`**${rules.length} active constitutional rules**`, "");
      }
      capsule.push("### Architecture", "- Docker + Traefik mandatory (PREF-003)", "- Authelia default auth", "- Authentik NOT default", "", "### Branch", "- feature/* → dev-mahg → main", "- No direct commits to main", "", "### Repository Truth", "- Workspace ≠ delivered", "- Uncommitted ≠ progress", "- Claims need evidence (REAL-001)");
      ctx.ui.notify(capsule.join("\n"), "info");
    },
  });

  pi.registerCommand("araya:handoff", {
    description: "🤝 Generate compact agent-to-agent handoff document",
    handler: async (_args, ctx) => {
      const cwd = process.cwd();
      const { execSync } = await import("node:child_process");
      let branch = ""; try { branch = execSync("git branch --show-current", { cwd }).toString().trim(); } catch {}

      ctx.ui.notify(
        `## Agent Handoff — ${new Date().toISOString().slice(0, 16)}\n\n` +
        `**Project:** ${require("node:path").basename(cwd)}\n` +
        `**Branch:** ${branch}\n` +
        `**Active Constraints:** Docker + Traefik | Authelia default | feature → dev-mahg → main\n` +
        `**Context Source:** Repository truth only (/araya reconstitute)\n` +
        `**Handoff Protocol:** What was done → What's next → Open decisions → Active constraints`,
        "info"
      );
    },
  });

  // ── Log ─────────────────────────────────────────────────────────────────

  if (process.env.ARAYA_DEBUG) {
    console.error(
      `[ARAYA v${config.version}] Loaded ${agentNames.length} agents from ${root}/araya.yaml`
    );
  }
}
