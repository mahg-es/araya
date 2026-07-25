// ARAYA Runtime Generator
// REQ-043 Slice A: Generate runtime profiles from canonical sources
// Author: Valentina (Backend Developer)
// Date: 2026-07-25
//
// Usage:
//   npx ts-node src/araya/generate/index.ts              # Generate all profiles
//   npx ts-node src/araya/generate/index.ts --check       # Drift detection only
//   npx ts-node src/araya/generate/index.ts --dry-run     # Preview without writing
//   npx ts-node src/araya/generate/index.ts --adapter pi  # Specific adapter only

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { load as loadYaml } from "js-yaml";
import {
  CanonicalAgent,
  CanonicalSkill,
  SourceManifest,
  RuntimeProfile,
  GenerationResult,
  GenerateOptions,
  AdapterFn,
} from "./types";
import {
  buildSourceManifest,
  computeSourceHash,
  validateProfiles,
  piAdapterValidator,
} from "./validator";

// ─── Constants ─────────────────────────────────────────────────────────────

const GENERATOR_NAME = "araya-runtime-generator";
const GENERATOR_VERSION = "2.1.0";
const DO_NOT_EDIT_MARKER = "# GENERATED — DO NOT EDIT";
const DEFAULT_ADAPTERS = ["pi", "codex", "claude-cli", "agy"];

// ─── CLI Entry Point ──────────────────────────────────────────────────────

export async function main(args: string[] = process.argv.slice(2)): Promise<void> {
  const options = parseArgs(args);
  const root = options.root;

  // Step 1: Load canonical sources
  const arayaYaml = loadArayaYaml(root);
  const agents = extractAgents(arayaYaml);
  const skills = loadAllSkills(root);

  // Step 2: Collect all source files
  const sourceFiles = collectSourceFiles(root, agents, skills);
  const manifest = buildSourceManifest(root, sourceFiles);

  // Step 3: Check mode
  if (options.check) {
    await checkDrift(agents, skills, root, options, manifest);
    return;
  }

  // Step 4: Generate profiles
  const adapters = options.adapters.length > 0 ? options.adapters : DEFAULT_ADAPTERS;
  const results: GenerationResult[] = [];

  for (const adapter of adapters) {
    const filter = options.agent_filter.length > 0 ? options.agent_filter : undefined;
    const result = generateProfiles(agents, skills, root, adapter, manifest, options.dry_run, filter);
    results.push(result);
  }

  // Sync .pi/agents/ from generated pi adapter output
  if (!options.dry_run && adapters.includes("pi")) {
    const piAgentsDir = path.join(root, ".pi", "agents");
    fs.mkdirSync(piAgentsDir, { recursive: true });
    const piGenDir = path.join(root, ".araya", "generated", "pi");
    for (const agent of agents) {
      if (agent.runtime?.targets && !agent.runtime.targets.includes("pi")) continue;
      const srcFile = path.join(piGenDir, `${agent.name}.md`);
      if (!fs.existsSync(srcFile)) continue;
      const dstFile = path.join(piAgentsDir, `${agent.name}.md`);
      const content = fs.readFileSync(srcFile, "utf-8");
      const tmpPath = dstFile + ".tmp";
      fs.writeFileSync(tmpPath, content, "utf-8");
      fs.renameSync(tmpPath, dstFile);
    }
    console.log(`  ✓ .pi/agents/ synced`);
  }

  // Step 5: Report
  reportResults(results, options.dry_run);

  // Exit non-zero if any errors
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  if (totalErrors > 0) {
    process.exit(1);
  }
}

// ─── Parse CLI Args ───────────────────────────────────────────────────────

function parseArgs(args: string[]): GenerateOptions {
  const root = findArayaRoot();
  const options: GenerateOptions = {
    root,
    check: false,
    dry_run: false,
    adapters: [],
    agent_filter: [],
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--check":
        options.check = true;
        break;
      case "--dry-run":
        options.dry_run = true;
        break;
      case "--adapter":
        if (args[i + 1]) options.adapters.push(args[++i]);
        break;
      case "--agent":
        if (args[i + 1]) options.agent_filter.push(args[++i]);
        break;
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`${GENERATOR_NAME} v${GENERATOR_VERSION}`);
  console.log("");
  console.log("Usage:");
  console.log("  npx ts-node src/araya/generate/index.ts [options]");
  console.log("");
  console.log("Options:");
  console.log("  --check         Detect drift: exit 0 if clean, 1 if drift");
  console.log("  --dry-run       Preview changes without writing");
  console.log("  --adapter <id>  Target adapter: pi, codex, claude-cli, agy (repeatable)");
  console.log("  --agent <name>  Filter to specific agent (repeatable)");
  console.log("  --help          Show this help");
}

// ─── Canonical Source Loader ──────────────────────────────────────────────

interface ArayaYaml {
  version: string;
  agents: Record<string, any>;
}

function loadArayaYaml(root: string): ArayaYaml {
  const yamlPath = path.resolve(root, "araya.yaml");
  if (!fs.existsSync(yamlPath)) {
    throw new Error(`araya.yaml not found at ${yamlPath}`);
  }
  const raw = fs.readFileSync(yamlPath, "utf-8");
  return loadYaml(raw) as ArayaYaml;
}

function extractAgents(yaml: ArayaYaml): CanonicalAgent[] {
  const agents: CanonicalAgent[] = [];

  for (const [name, raw] of Object.entries(yaml.agents)) {
    if (!raw || typeof raw !== "object") continue;

    const agent: CanonicalAgent = {
      name,
      version: yaml.version,
      status: raw.status || "active",
      emoji: raw.emoji || "",
      role: {
        title: raw.role || name,
        authority: inferAuthority(raw.role || "", name),
      },
      model: {
        tier: raw.model_tier || "balanced",
        primary_provider: raw.primary_provider,
        provider_policy: "framework-default",
        reasoning_effort: raw.reasoning_effort,
      },
      max_turns: raw.max_turns || 30,
      execution_mode: raw.execution_mode,
      permissions: {
        can_write_code: raw.permissions?.can_write_code ?? false,
        can_approve_review: raw.permissions?.can_approve_review,
        can_merge_pr: raw.permissions?.can_merge_pr,
        can_emit_binding: raw.permissions?.can_emit_binding,
        can_produce_deliverables: raw.permissions?.can_produce_deliverables,
      },
      capabilities: raw.capabilities || [],
      skills: raw.skills || [],
      description: raw.description,
      runtime: {
        targets: DEFAULT_ADAPTERS,
        generated: true,
      },
      provenance: {
        registry: "araya.yaml",
        narrative: `prompts/agents/${name}.md`,
        generated_hash: null,
      },
    };

    // Infer relay section from role
    agent.relay = inferRelay(agent);

    agents.push(agent);
  }

  return agents;
}

function inferAuthority(role: string, name: string): string {
  const lower = role.toLowerCase();

  if (lower.includes("product owner") || lower.includes("product authority")) return "PRODUCT_AUTHORITY";
  if (lower.includes("capability officer") || lower.includes("chro") || lower.includes("capability authority")) return "CAPABILITY_AUTHORITY";
  if (lower.includes("program director") || lower.includes("pmo") || lower.includes("planning authority")) return "PLANNING_AUTHORITY";
  if (lower.includes("delegated executor") || lower.includes("controller")) return "COORDINATOR";
  if (lower.includes("test automation")) return "TEST_AUTOMATION";
  if (lower.includes("qa lead") || lower.includes("quality architect")) return "QUALITY_ARCHITECT";
  if (lower.includes("test gate") || lower.includes("independent test")) return "TEST_GATE";
  if (lower.includes("reality authority") || lower.includes("verifier")) return "REALITY_AUTHORITY";
  if (lower.includes("scrum master") || lower.includes("pm auditor") || lower.includes("process auditor") || lower.includes("process audit")) return "PROCESS_AUDITOR";
  if (lower.includes("knowledge officer") || lower.includes("graph steward") || lower.includes("cko")) return "KNOWLEDGE_STEWARD";
  if (lower.includes("backend") || lower.includes("frontend") || lower.includes("developer") ||
      lower.includes("engineer") || lower.includes("specialist") || lower.includes("architect") ||
      lower.includes("data") || lower.includes("ai/ml") || lower.includes("content") ||
      lower.includes("writer") || lower.includes("designer") || lower.includes("security") ||
      lower.includes("brand") || lower.includes("bi") || lower.includes("analytics") ||
      lower.includes("finops")) return "SPECIALIST";
  if (name === "manu") return "PRODUCT_AUTHORITY";
  if (name === "aurora") return "CAPABILITY_AUTHORITY";
  if (name === "sonia") return "PLANNING_AUTHORITY";

  return "SPECIALIST";
}

function inferRelay(agent: CanonicalAgent): CanonicalAgent["relay"] | undefined {
  const auth = agent.role.authority;

  switch (auth) {
    case "PRODUCT_AUTHORITY":
      return {
        can_receive_states: ["ACCEPTING"],
        allowed_results: ["ACCEPT", "REJECT", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "CAPABILITY_AUTHORITY":
      return {
        can_receive_states: ["DISPATCH"],
        allowed_results: ["DONE", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "PLANNING_AUTHORITY":
      return {
        can_receive_states: ["INTENT", "CLOSING"],
        allowed_results: ["DONE", "CLOSE", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "COORDINATOR":
      return {
        can_receive_states: [],
        allowed_results: ["ASSIGN", "CLAIM", "ACK", "RELEASE", "EXPIRE", "ESCALATE", "RESOLVE", "NOTE"],
        cannot_select_next_owner: false, // Daneel CAN select next owner
        evidence_required: false,
      };
    case "TEST_AUTOMATION":
      return {
        can_receive_states: ["EXECUTING"],
        allowed_results: ["DONE", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "SPECIALIST":
      return {
        can_receive_states: ["EXECUTING"],
        allowed_results: ["DONE", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "TEST_GATE":
      return {
        can_receive_states: ["TESTING"],
        allowed_results: ["PASS", "FAIL", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "REALITY_AUTHORITY":
      return {
        can_receive_states: ["VERIFYING"],
        allowed_results: ["VERIFIED", "DISCREPANCY", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "PROCESS_AUDITOR":
      return {
        can_receive_states: ["AUDITING"],
        allowed_results: ["DONE", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    case "KNOWLEDGE_STEWARD":
      return {
        can_receive_states: ["KNOWLEDGE"],
        allowed_results: ["DONE", "ASK", "BLOCK"],
        cannot_select_next_owner: true,
        evidence_required: true,
      };
    default:
      return undefined;
  }
}

function loadAllSkills(root: string): CanonicalSkill[] {
  const skillsDir = path.resolve(root, "skills");
  if (!fs.existsSync(skillsDir)) return [];

  const skills: CanonicalSkill[] = [];
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(skillsDir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;

    const raw = fs.readFileSync(skillPath, "utf-8");
    const parsed = parseSkillMarkdown(entry.name, raw);
    if (parsed) skills.push(parsed);
  }

  return skills;
}

function parseSkillMarkdown(name: string, raw: string): CanonicalSkill | null {
  try {
    const meta: Record<string, any> = {};
    const lines = raw.split("\n");

    // Parse YAML-like frontmatter from markdown list items
    let inHeader = true;
    for (const line of lines) {
      if (!inHeader) break;
      if (line.startsWith("## ") && !line.startsWith("## Purpose")) {
        inHeader = false;
        continue;
      }

      const match = line.match(/^-\s+\*\*([^:]+)\*\*:\s*(.+)/);
      if (match) {
        meta[match[1].trim().toLowerCase()] = match[2].trim();
      }
    }

    // Extract purpose section
    let problem = "";
    let outcome = "";
    let inProblem = false;
    let inOutcome = false;
    for (const line of lines) {
      if (line.includes("**Problem:**")) inProblem = true;
      else if (line.includes("**Outcome:**")) { inProblem = false; inOutcome = true; }
      else if (line.startsWith("## ") && (inProblem || inOutcome)) { inProblem = false; inOutcome = false; }
      else if (inProblem && line.trim() && !line.startsWith("**")) {
        problem += line.trim() + " ";
      } else if (inOutcome && line.trim() && !line.startsWith("**")) {
        outcome += line.trim() + " ";
      }
    }

    // Extract lists
    const whenToUse = extractListItems(raw, "When to Use");
    const whenNotToUse = extractListItems(raw, "When Not to Use");
    const requiredSkills = extractListItems(raw, "Required Skills");
    const requiredPerms = extractListItems(raw, "Required Permissions");
    const requiredInputs = extractListItems(raw, "Inputs (Required)");
    const requiredOutputs = extractListItems(raw, "Outputs (Required)");
    const evidence = extractListItems(raw, "Evidence Required");
    const sideEffects = extractListItems(raw, "Side Effects");
    const failureModes = extractListItems(raw, "Failure Modes");

    return {
      name,
      version: meta["version"] || "1.0.0",
      status: meta["status"] || "active",
      owner: meta["owner"] || "unknown",
      description: meta["description"] || "",
      model_tier: meta["model tier"] || "balanced",
      risk_level: meta["risk level"] || "medium",
      purpose: {
        problem: problem.trim() || meta["problem"] || "",
        outcome: outcome.trim() || meta["outcome"] || "",
      },
      when_to_use: whenToUse,
      when_not_to_use: whenNotToUse,
      requires: {
        skills: requiredSkills,
      },
      requires_skills: requiredSkills,
      permissions: {
        required: requiredPerms.length > 0 ? requiredPerms : ["read"],
      },
      inputs: {
        required: requiredInputs,
      },
      outputs: {
        required: requiredOutputs,
      },
      evidence_required: evidence,
      side_effects: sideEffects,
      failure_modes: failureModes,
      rollback: {
        strategy: "revert and notify controller",
      },
      handoff_to: {
        success: meta["success"] || "daneel",
        relay_result: meta["relay result"] || "DONE",
        blocked: meta["blocked"] || "daneel",
      },
    };
  } catch {
    console.warn(`Warning: could not parse skill: ${name}`);
    return null;
  }
}

function extractListItems(raw: string, sectionName: string): string[] {
  const lines = raw.split("\n");
  let inSection = false;
  const items: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ") && line.includes(sectionName)) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith("## ")) {
      break; // next section
    }
    if (inSection) {
      const match = line.match(/^-\s+(?:`([^`]+)`|(.+))/);
      if (match) {
        items.push((match[1] || match[2] || "").trim());
      }
    }
  }

  return items;
}

// ─── Source Collection ────────────────────────────────────────────────────

function collectSourceFiles(root: string, agents: CanonicalAgent[], skills: CanonicalSkill[]): string[] {
  const files = new Set<string>();

  // araya.yaml
  files.add("araya.yaml");

  // Agent prompts
  for (const agent of agents) {
    const promptPath = path.join("prompts", "agents", `${agent.name}.md`);
    if (fs.existsSync(path.resolve(root, promptPath))) {
      files.add(promptPath);
    }
  }

  // Skill files
  for (const skill of skills) {
    files.add(path.join("skills", skill.name, "SKILL.md"));
  }

  return [...files].sort();
}

// ─── Profile Generation ───────────────────────────────────────────────────

function generateProfiles(
  agents: CanonicalAgent[],
  skills: CanonicalSkill[],
  root: string,
  adapter: string,
  manifest: SourceManifest,
  dryRun: boolean,
  filter?: string[],
): GenerationResult {
  const result: GenerationResult = {
    adapter,
    agents: [],
    profiles_written: 0,
    source_hash: manifest.combined_hash,
    errors: [],
  };

  const adapterFn = getAdapterFn(adapter);
  if (!adapterFn) {
    result.errors.push(`Unknown adapter: ${adapter}`);
    return result;
  }

  // Determine output directory
  const outputDir = getOutputDir(root, adapter);

  for (const agent of agents) {
    if (filter && !filter.includes(agent.name)) continue;
    if (!agent.runtime.targets.includes(adapter)) continue;

    try {
      const narrativePath = path.join(root, "prompts", "agents", `${agent.name}.md`);
      const narrative = fs.existsSync(narrativePath)
        ? fs.readFileSync(narrativePath, "utf-8")
        : undefined;

      // Set provenance hash before adapter uses it
      if (!agent.provenance) agent.provenance = { registry: "araya.yaml" };
      agent.provenance.generated_hash = manifest.combined_hash;

      const profile = adapterFn(agent, skills, narrative, manifest.combined_hash);

      if (!dryRun) {
        // Atomic write: .tmp file then rename
        const tmpPath = path.join(outputDir, `${agent.name}.md.tmp`);
        const finalPath = path.join(outputDir, `${agent.name}.md`);

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(tmpPath, profile.content, "utf-8");
        fs.renameSync(tmpPath, finalPath);

        result.profiles_written++;
      }

      result.agents.push(agent.name);
    } catch (err: any) {
      result.errors.push(`${agent.name}: ${err.message}`);
    }
  }

  // Write source hash file
  if (!dryRun) {
    const hashFile = path.join(outputDir, ".source-hash");
    fs.writeFileSync(hashFile, manifest.combined_hash, "utf-8");
  }

  return result;
}

function getOutputDir(root: string, adapter: string): string {
  switch (adapter) {
    case "pi":
      return path.join(root, ".araya", "generated", "pi");
    case "codex":
      return path.join(root, ".araya", "generated", "codex");
    case "claude-cli":
      return path.join(root, ".araya", "generated", "claude-cli");
    case "agy":
      return path.join(root, ".araya", "generated", "agy");
    default:
      return path.join(root, ".araya", "generated", adapter);
  }
}

// ─── Adapter Functions ────────────────────────────────────────────────────

function getAdapterFn(adapter: string): AdapterFn | null {
  switch (adapter) {
    case "pi": return piAdapter;
    case "codex": return codexAdapter;
    case "claude-cli": return claudeCliAdapter;
    case "agy": return agyAdapter;
    default: return null;
  }
}

function piAdapter(agent: CanonicalAgent, skills: CanonicalSkill[], narrative: string | undefined, sourceHash: string): RuntimeProfile {
  const lines: string[] = [];

  lines.push(DO_NOT_EDIT_MARKER);
  lines.push(`# Source hash: ${agent.provenance.generated_hash || sourceHash}`);
  lines.push();
  lines.push(`# ${agent.emoji} ${agent.name} — ${agent.role.title}`);
  lines.push("");
  lines.push("> Auto-generated by ARAYA Runtime Generator. Do not edit manually.");
  lines.push(`> Source: ${agent.provenance.registry}`);
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`**Role:** ${agent.role.title}`);
  lines.push(`**Authority:** ${agent.role.authority}`);
  lines.push(`**Status:** ${agent.status}`);
  lines.push(`**Model Tier:** ${agent.model.tier}`);
  if (agent.model.primary_provider) {
    lines.push(`**Provider:** ${agent.model.primary_provider}`);
  }
  lines.push("");
  lines.push("## Permissions");
  lines.push("");
  lines.push(`- can_write_code: ${agent.permissions.can_write_code}`);
  if (agent.permissions.can_approve_review !== undefined) {
    lines.push(`- can_approve_review: ${agent.permissions.can_approve_review}`);
  }
  if (agent.permissions.can_merge_pr !== undefined) {
    lines.push(`- can_merge_pr: ${agent.permissions.can_merge_pr}`);
  }
  if (agent.permissions.can_emit_binding !== undefined) {
    lines.push(`- can_emit_binding: ${agent.permissions.can_emit_binding}`);
  }
  lines.push("");
  lines.push("## Skills");
  lines.push("");
  for (const skillName of agent.skills) {
    const skill = skills.find(s => s.name === skillName);
    const desc = skill ? ` — ${skill.description}` : "";
    lines.push(`- \`${skillName}\`${desc}`);
  }
  lines.push("");
  lines.push("## Capabilities");
  lines.push("");
  for (const cap of agent.capabilities) {
    lines.push(`- ${cap}`);
  }

  if (agent.relay) {
    lines.push("");
    lines.push("## Relay");
    lines.push("");
    lines.push(`- can_receive_states: [${agent.relay.can_receive_states.join(", ")}]`);
    lines.push(`- allowed_results: [${agent.relay.allowed_results.join(", ")}]`);
    lines.push(`- cannot_select_next_owner: ${agent.relay.cannot_select_next_owner}`);
    lines.push(`- evidence_required: ${agent.relay.evidence_required}`);
  }

  if (agent.description) {
    lines.push("");
    lines.push("## Description");
    lines.push("");
    lines.push(agent.description);
  }

  if (narrative) {
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push(narrative);
  }

  return {
    agent_name: agent.name,
    adapter: "pi",
    content: lines.join("\n") + "\n",
    source_hash: "",
    generated_at: new Date().toISOString(),
  };
}

function codexAdapter(agent: CanonicalAgent, skills: CanonicalSkill[], narrative: string | undefined, sourceHash: string): RuntimeProfile {
  // Codex uses YAML frontmatter
  const lines: string[] = [];
  lines.push(DO_NOT_EDIT_MARKER);
  lines.push(`# Source hash: ${agent.provenance.generated_hash || sourceHash}`);
  lines.push();
  lines.push("---");
  lines.push(`agent: ${agent.name}`);
  lines.push(`role: "${agent.role.title}"`);
  lines.push(`authority: ${agent.role.authority}`);
  lines.push(`status: ${agent.status}`);
  lines.push(`model_tier: ${agent.model.tier}`);
  lines.push(`can_write_code: ${agent.permissions.can_write_code}`);
  if (agent.model.primary_provider) {
    lines.push(`provider: ${agent.model.primary_provider}`);
  }
  lines.push("skills:");
  for (const s of agent.skills) lines.push(`  - ${s}`);
  if (agent.relay) {
    lines.push("relay:");
    lines.push(`  can_receive_states: [${agent.relay.can_receive_states.join(", ")}]`);
    lines.push(`  allowed_results: [${agent.relay.allowed_results.join(", ")}]`);
  }
  lines.push("---");

  if (narrative) {
    lines.push("");
    lines.push(narrative);
  }

  return {
    agent_name: agent.name,
    adapter: "codex",
    content: lines.join("\n") + "\n",
    source_hash: "",
    generated_at: new Date().toISOString(),
  };
}

function claudeCliAdapter(agent: CanonicalAgent, skills: CanonicalSkill[], narrative: string | undefined, sourceHash: string): RuntimeProfile {
  const lines: string[] = [];
  lines.push(DO_NOT_EDIT_MARKER);
  lines.push(`# Source hash: ${agent.provenance.generated_hash || sourceHash}`);
  lines.push();
  lines.push(`# Agent: ${agent.name} (${agent.role.title})`);
  lines.push(`# Authority: ${agent.role.authority} | Tier: ${agent.model.tier} | Status: ${agent.status}`);
  lines.push("");
  lines.push(`You are ${agent.name}, ${agent.role.title}.`);
  lines.push(`Permissions: can_write_code: ${agent.permissions.can_write_code}`);
  lines.push(`Skills: ${agent.skills.join(", ")}`);

  if (agent.relay) {
    lines.push(`Relay: receive=[${agent.relay.can_receive_states.join(", ")}] emit=[${agent.relay.allowed_results.join(", ")}]`);
  }

  if (narrative) {
    lines.push("");
    lines.push("## Full Contract");
    lines.push("");
    lines.push(narrative);
  }

  return {
    agent_name: agent.name,
    adapter: "claude-cli",
    content: lines.join("\n") + "\n",
    source_hash: "",
    generated_at: new Date().toISOString(),
  };
}

function agyAdapter(agent: CanonicalAgent, skills: CanonicalSkill[], narrative: string | undefined, sourceHash: string): RuntimeProfile {
  const lines: string[] = [];
  lines.push(DO_NOT_EDIT_MARKER);
  lines.push(`# Source hash: ${agent.provenance.generated_hash || sourceHash}`);
  lines.push();
  lines.push(`# ${agent.emoji} ${agent.name} — ${agent.role.title}`);
  lines.push("");
  lines.push("```yaml");
  lines.push(`agent: ${agent.name}`);
  lines.push(`role: ${agent.role.title}`);
  lines.push(`authority: ${agent.role.authority}`);
  lines.push(`status: ${agent.status}`);
  lines.push(`tier: ${agent.model.tier}`);
  lines.push(`can_write_code: ${agent.permissions.can_write_code}`);
  lines.push("skills:");
  for (const s of agent.skills) lines.push(`  - ${s}`);
  lines.push("```");

  if (narrative) {
    lines.push("");
    lines.push(narrative);
  }

  return {
    agent_name: agent.name,
    adapter: "agy",
    content: lines.join("\n") + "\n",
    source_hash: "",
    generated_at: new Date().toISOString(),
  };
}

// ─── Drift Check ──────────────────────────────────────────────────────────

async function checkDrift(
  agents: CanonicalAgent[],
  skills: CanonicalSkill[],
  root: string,
  options: GenerateOptions,
  manifest: SourceManifest,
): Promise<void> {
  const adapters = options.adapters.length > 0 ? options.adapters : DEFAULT_ADAPTERS;
  let totalClean = true;

  for (const adapter of adapters) {
    const genDir = path.join(root, ".araya", "generated");

    const report = validateProfiles(
      agents,
      skills,
      genDir,
      adapter,
      manifest,
      [piAdapterValidator],
    );

    if (!report.clean) {
      totalClean = false;
      console.log(`\n=== DRIFT DETECTED for adapter: ${adapter} ===`);

      const errors = report.entries.filter(e => e.severity === "error");
      const warnings = report.entries.filter(e => e.severity === "warning");

      for (const entry of errors) {
        console.log(`  ERROR   [${entry.agent}] ${entry.field}`);
        console.log(`          canonical: ${JSON.stringify(entry.canonical_value)}`);
        console.log(`          generated: ${JSON.stringify(entry.generated_value)}`);
      }
      for (const entry of warnings) {
        console.log(`  WARNING [${entry.agent}] ${entry.field}`);
      }

      if (errors.length === 0 && warnings.length === 0) {
        console.log("  (no entries found, but report is not clean — check directory existence)");
      }
    } else {
      console.log(`Adapter ${adapter}: clean`);
    }
  }

  if (totalClean) {
    console.log("\nAll profiles match canonical sources. No drift detected.");
    process.exit(0);
  } else {
    console.log(`\nSource hash: ${manifest.combined_hash}`);
    process.exit(1);
  }
}

// ─── Reports ──────────────────────────────────────────────────────────────

function reportResults(results: GenerationResult[], dryRun: boolean): void {
  const mode = dryRun ? "[DRY RUN]" : "";
  console.log(`\n${GENERATOR_NAME} v${GENERATOR_VERSION} ${mode}`);
  console.log("=" .repeat(60));

  for (const result of results) {
    const status = result.errors.length > 0 ? "⚠" : "✓";
    console.log(`  ${status} ${result.adapter}: ${result.profiles_written} profiles written, ${result.agents.length} agents`);
    for (const err of result.errors) {
      console.log(`    ERROR: ${err}`);
    }
  }

  const total = results.reduce((s, r) => s + r.profiles_written, 0);
  console.log(`\n  Total: ${total} profiles ${dryRun ? "would be" : ""} written`);
}

// ─── Root Finder ──────────────────────────────────────────────────────────

function findArayaRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 15; i++) {
    if (fs.existsSync(path.resolve(dir, "araya.yaml"))) {
      const realYaml = fs.realpathSync(path.resolve(dir, "araya.yaml"));
      const realDir = path.dirname(realYaml);
      if (!fs.existsSync(path.resolve(realDir, ".araya"))) {
        throw new Error(
          `SECURITY: araya.yaml found at ${dir} but .araya/ sentinel missing.`
        );
      }
      return realDir;
    }
    const parent = path.resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("ARAYA: Cannot find araya.yaml root");
}

// ─── Run ──────────────────────────────────────────────────────────────────
if (require.main === module) {
  main().catch(err => {
    console.error("FATAL:", err.message);
    process.exit(2);
  });
}
