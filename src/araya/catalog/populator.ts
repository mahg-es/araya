// ARAYA Catalog Populator
// WS-07: Auto-generates catalog.json from repository sources of truth
// Algorithm: 10-step populate() per req-001-catalog-schema.md §3.2
// Author: Valentina (Backend Developer)
// Date: 2026-07-22

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { load as loadYaml } from "js-yaml";
import {
  Catalog, CatalogStats, CatalogEntryBase,
  CommandEntry, SkillEntry, AgentEntry,
  CommandArgument, CommandFlag, CommandExample,
  CrossReference, PermissionRequirement,
  Domain, EntryStatus,
} from "./types";

// ─── Constants ─────────────────────────────────────────────────────────────

const CATALOG_VERSION = "1.0.0";
const AX_SKILLS = new Set(["ax3", "ax-postoffice", "autonomous-execution", "ai-routing", "token-efficiency"]);

// Domain → skill mapping (from req-001-catalog-schema.md Appendix A)
const DOMAIN_SKILL_MAP: Record<string, Domain> = {};
function buildDomainMap(): void {
  const map: [Domain, string[]][] = [
    [Domain.BACKEND, ["api-design", "api-document", "api-gateway", "api-integration", "auth-middleware", "db-optimization", "db-schema", "endpoint", "error-handling"]],
    [Domain.FRONTEND, ["accessibility", "animation", "component", "component-arch", "form-design", "page-route", "performance", "responsive", "state-management"]],
    [Domain.ARCHITECTURE, ["adr-write", "architecture-diagram", "cache-strategy", "message-queue", "microservice"]],
    [Domain.QA_TESTING, ["bdd-feature", "cicd-quality", "coverage", "e2e-strategy", "integration-test", "performance-test", "regression", "tdd-execute", "tdd-generate", "test-case", "uat-generate", "uat-review", "unit-test"]],
    [Domain.SECURITY, ["compliance", "pentest", "secrets", "secure-arch", "secure-code", "threat-model"]],
    [Domain.INFRA_DEVOPS, ["cicd-pipeline", "cloud-deploy", "cloud-provision", "deployment-automation", "docker", "kubernetes", "monitoring"]],
    [Domain.DATA_AI, ["agent-design", "data-governance", "data-lakehouse-design", "data-modeling", "data-quality", "etl-orchestration", "llm-local-deploy", "medallion-architecture", "model-fine-tuning", "rag-pipeline", "spark-pipeline", "vector-search"]],
    [Domain.BI_ANALYTICS, ["analytics-report", "dashboard-design", "data-visualization", "kpi-framework"]],
    [Domain.FINOPS, ["budget-forecasting", "cost-analysis", "resource-rightsizing", "token-efficiency", "usage-metering"]],
    [Domain.PROFITABILITY, ["abc-costing-model", "cost-to-serve", "profitability-lineage", "whale-curve-analyze"]],
    [Domain.EDUCATION, ["curriculum-planning", "lab-scenario-design", "student-assessment", "training-module"]],
    [Domain.CONTENT_BRAND, ["asset-management", "brand-audit", "brand-compliance", "content-calendar", "geo-branding", "multi-platform-publish", "seo-optimize", "theme-design", "visual-identity"]],
    [Domain.DOCUMENTATION, ["api-document", "architecture-diagram", "slide-deck-generate", "static-site-generate", "technical-book"]],
    [Domain.GOVERNANCE_PM, ["cr-generate", "daily-standup", "definition-of-done", "drr-create", "iar-generate", "impediment", "pm-decompose", "pm-dependencies", "pm-plan", "pm-risk", "pm-status", "project-planning", "reality-verification", "retrospective", "sprint-planning", "velocity"]],
    [Domain.KNOWLEDGE, ["daily-note", "knowledge-graph", "organizational-knowledge", "pkm-workflow", "trajectory-management"]],
    [Domain.CHRO, ["agent-topology", "capability-registry", "gap-analysis", "hiring-recommendations", "organizational-health", "skills-lifecycle", "spof-detection", "workforce-planning"]],
    [Domain.AX, ["ai-routing", "autonomous-execution", "ax-postoffice", "ax3", "token-efficiency"]],
  ];
  for (const [domain, skills] of map) {
    for (const s of skills) {
      DOMAIN_SKILL_MAP[s] = domain;
    }
  }
}

// ─── YAML Config Types ────────────────────────────────────────────────────

interface AgentYamlConfig {
  role: string;
  emoji: string;
  model_tier?: string;
  reasoning_effort?: string;
  primary_provider?: string;
  max_turns?: number;
  execution_mode?: string;
  status?: string;
  permissions?: {
    can_write_code?: boolean;
    can_merge_pr?: boolean;
    can_approve_review?: boolean;
  };
  capabilities?: string[];
  skills?: string[];
  description?: string;
}

interface ArayaYamlConfig {
  version: string;
  description: string;
  agents: Record<string, AgentYamlConfig>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function findArayaRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 15; i++) {
    if (fs.existsSync(path.resolve(dir, "araya.yaml"))) {
      // H3 FIX: Resolve araya.yaml symlink to real repo, validate sentinel
      const realYaml = fs.realpathSync(path.resolve(dir, "araya.yaml"));
      const realDir = path.dirname(realYaml);
      if (!fs.existsSync(path.resolve(realDir, ".araya"))) {
        throw new Error(
          `SECURITY: araya.yaml found at ${dir} but .araya/ sentinel missing. ` +
          `Cowardly refusing to use a potentially symlink-hijacked root.`
        );
      }
      return realDir;
    }
    const parent = path.resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("ARAYA: Cannot find araya.yaml root from " + __dirname);
}

function sha256(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function isoNow(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function deriveKeywords(name: string, purpose: string, domain: Domain, aliases: string[], extra: string[] = []): string[] {
  const keywords = new Set<string>();

  // Tokenize name
  for (const token of name.split(/[-_\/:]/)) {
    if (token.length >= 2) keywords.add(token.toLowerCase());
  }

  // Significant words from purpose (≥ 4 chars, not common stop words)
  const stopWords = new Set(["this", "that", "with", "from", "what", "when", "your", "have", "been", "they", "will", "their", "them", "into", "also", "other", "more", "some", "such"]);
  for (const word of purpose.split(/\s+/)) {
    const clean = word.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    if (clean.length >= 4 && !stopWords.has(clean)) {
      keywords.add(clean);
    }
  }

  // Domain
  keywords.add(domain);

  // Aliases
  for (const a of aliases) keywords.add(a.toLowerCase());

  // Extra
  for (const e of extra) keywords.add(e.toLowerCase());

  // Agent name for skill entries (added during merge)
  return Array.from(keywords);
}

// ─── Frontmatter Parser ──────────────────────────────────────────────────

interface SkillFrontmatter {
  name?: string;
  description?: string;
  governance?: string;
}

function parseFrontmatter(content: string): { data: SkillFrontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const yamlBlock = match[1];
  const body = match[2];

  // Very simple YAML key: value parser for our specific keys
  // (avoids another dependency — we know exactly the keys we need)
  const data: SkillFrontmatter = {};
  const lines = yamlBlock.split("\n");
  for (const line of lines) {
    const kvMatch = line.match(/^(\w+):\s*["']?(.*)["']?\s*$/);
    if (kvMatch) {
      data[kvMatch[1] as keyof SkillFrontmatter] = kvMatch[2].replace(/["']$/, "");
    }
  }

  return { data, body };
}

function extractSection(body: string, heading: string): string {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = body.match(regex);
  if (!match) return "";
  return match[1].trim();
}

// ─── Step 1: Parse araya.yaml → AgentEntry[] ──────────────────────────────

function parseAgents(root: string, yamlPath: string): { agents: AgentEntry[]; agentSkillMap: Map<string, string[]> } {
  const raw = fs.readFileSync(yamlPath, "utf-8");
  const config = loadYaml(raw) as ArayaYamlConfig;
  const agents: AgentEntry[] = [];
  const agentSkillMap = new Map<string, string[]>();

  const now = isoNow();
  for (const [name, a] of Object.entries(config.agents)) {
    const skills = a.skills ?? [];
    const nonAxSkills = skills.filter(s => !AX_SKILLS.has(s));
    const tier = (a.model_tier ?? "balanced") as "fast" | "balanced" | "reasoning";
    const agentStatus = a.status === "dormant" ? "dormant" :
      nonAxSkills.length <= 1 ? "bare" : "active";

    // skip neo, trinity template agents (dormant with only ax3)
    // but include them with dormant status

    const entry: AgentEntry = {
      id: `agent:${name}`,
      type: "agent",
      name,
      display_name: a.role?.split("—")[0]?.split("(")[0]?.trim() ?? name,
      keywords: deriveKeywords(name, a.role ?? a.description ?? "", Domain.GOVERNANCE_PM, []),
      domain: Domain.GOVERNANCE_PM, // will be refined by skill domains below
      aliases: [],
      purpose: a.description ?? a.role ?? "",
      status: EntryStatus.ENABLED,
      tier,
      source_files: [path.relative(root, yamlPath)],
      source_type: "araya.yaml",
      is_auto_generated: true,
      related: [],
      alternatives: [],
      requires: [],
      preconditions: [],
      side_effects: [],
      risks: [],
      permissions: [],
      last_validated: now,

      emoji: a.emoji ?? "❓",
      role: a.role ?? "",
      model_tier: tier,
      primary_provider: a.primary_provider ?? "pi.dev",
      max_turns: a.max_turns ?? 25,
      execution_mode: a.execution_mode,

      can_write_code: a.permissions?.can_write_code ?? false,
      can_approve_review: a.permissions?.can_approve_review ?? false,
      can_merge_pr: a.permissions?.can_merge_pr ?? false,

      capabilities: a.capabilities ?? [],
      skills,
      skill_count: skills.length,

      has_prompt_file: false,
      prompt_path: undefined,

      must_delegate_to: [],
      never_delegate_from: [],
      tasks_must_delegate: [],
      tasks_must_not_execute: [],

      agent_status: agentStatus as "active" | "dormant" | "bare" | "provisioned",
      bare_risk: agentStatus === "bare" ? (nonAxSkills.length === 0 ? "high" : "low") : "none",
    };

    agents.push(entry);
    agentSkillMap.set(name, skills);
  }

  return { agents, agentSkillMap };
}

// ─── Step 2: Parse extensions/araya/index.ts → CommandEntry[] ──────────────

function parseCommands(root: string, indexTsPath: string): CommandEntry[] {
  const now = isoNow();
  const source = fs.readFileSync(indexTsPath, "utf-8");
  const commands: CommandEntry[] = [];
  const relPath = path.relative(root, indexTsPath);

  // Extract pi.registerCommand calls
  const regRegex = /pi\.registerCommand\("([^"]+)",\s*\{[\s\S]*?description:\s*"([^"]*)"/g;
  let match;
  const registeredCommands = new Map<string, string>();
  while ((match = regRegex.exec(source)) !== null) {
    registeredCommands.set(match[1], match[2]);
  }

  // Extract SUBCOMMAND_ROUTES entries (keys can contain hyphens)
  const routesRegex = /"([a-z][^"]*?)":\s*\{\s*agent:\s*"(\w+)"[\s\S]*?task:\s*"([^"]+?)"/g;
  const routes: Array<{ word: string; agent: string; task: string }> = [];
  while ((match = routesRegex.exec(source)) !== null) {
    routes.push({ word: match[1], agent: match[2], task: match[3] });
  }

  // Inline subcommand routes (keys can contain hyphens, colons)
  const inlineRegex = /"([a-z][^"]*?)":\s*"inline"/g;
  const inlines = new Set<string>();
  while ((match = inlineRegex.exec(source)) !== null) {
    inlines.add(match[1]);
  }

  // ── Build CommandEntry for each registered command ──
  for (const [cmdName, description] of registeredCommands) {
    const slashCommand = `/${cmdName}`;
    const handlerType = cmdName === "araya" ? "runtime_function" : "agent_delegation";

    // Determine delegated agent from the handler body
    let delegatedAgent: string | undefined;
    // Bounded search: only look in handler block, not global source
    const _hbStart = source.indexOf(`registerCommand("${cmdName}"`);
    const _hbEnd = _hbStart > -1 ? source.indexOf("registerCommand(", _hbStart + 30) : -1;
    const _hb = _hbStart > -1 ? source.slice(_hbStart, _hbEnd > -1 ? _hbEnd : undefined) : "";
    if (_hb) {
      const agentMatch = _hb.match(/buildAgentPrompt\(config,\s*"([^"]+)"/);
      if (agentMatch) delegatedAgent = agentMatch[1];
    }

    // Determine handler type more precisely
    let resolvedHandlerType: CommandEntry["handler_type"] = handlerType;
    if (cmdName === "araya") resolvedHandlerType = "runtime_function";
    else if (delegatedAgent) resolvedHandlerType = "agent_delegation";

    // Extract flags from handler body
    const flags: CommandFlag[] = [];
    const handlerBlock = _hb;

    if (handlerBlock) {
      const flagPatterns: Array<{ regex: RegExp; desc: string }> = [
        { regex: /--check/g, desc: "Check for drift without writing" },
        { regex: /--dry-run/g, desc: "Preview changes without writing" },
        { regex: /--summary/g, desc: "Show summary output only" },
        { regex: /--validate/g, desc: "Validate mode" },
        { regex: /--explain/g, desc: "Show detailed reasoning" },
        { regex: /--scope/g, desc: "Scope to specific path" },
        { regex: /--repair/g, desc: "Repair safe inconsistencies" },
        { regex: /--search/g, desc: "Search by keyword" },
        { regex: /--domain/g, desc: "Filter by domain" },
        { regex: /--agent/g, desc: "Filter by agent" },
        { regex: /--mode/g, desc: "Execution mode" },
        { regex: /--policy/g, desc: "Workflow policy" },
        { regex: /--execution-mode/g, desc: "Deterministic or adaptive" },
        { regex: /--safe-mode/g, desc: "Dry-run, no file modifications" },
        { regex: /--impact/g, desc: "Impact analysis" },
        { regex: /--show/g, desc: "Show entity details" },
        { regex: /--regenerate/g, desc: "Regenerate catalog" },
        { regex: /--recommend/g, desc: "Recommend patterns" },
        { regex: /--list/g, desc: "List mode" },
      ];

      for (const fp of flagPatterns) {
        if (fp.regex.test(handlerBlock)) {
          const flagName = fp.regex.source.replace(/\\/g, "").replace(/\/g$/, "");
          flags.push({ flag: flagName, type: "boolean", description: fp.desc });
        }
      }
    }

    const entry: CommandEntry = {
      id: `cmd:${cmdName}`,
      type: "command",
      name: slashCommand,
      display_name: slashCommand,
      keywords: deriveKeywords(cmdName, description, Domain.BACKEND, []),
      domain: Domain.BACKEND, // refined below
      aliases: [],
      purpose: description,
      status: EntryStatus.ENABLED,
      tier: null,
      source_files: [relPath],
      source_type: "registerCommand",
      is_auto_generated: true,
      related: [],
      alternatives: [],
      requires: [],
      preconditions: [],
      side_effects: [],
      risks: [],
      permissions: [],
      last_validated: now,

      registration_method: "registerCommand",
      slash_command: slashCommand,
      syntax: slashCommand,
      arguments: [],
      flags,
      examples: [],
      handler_type: resolvedHandlerType,
      delegated_agent: delegatedAgent,
      delegation_task_template: undefined,
      short_help: description,
      long_help: description,
      usage_notes: [],
    };

    commands.push(entry);
  }

  // ── Build CommandEntry for each subcommand route ──
  for (const route of routes) {
    const slashCommand = `/araya ${route.word}`;
    const entry: CommandEntry = {
      id: `cmd:araya:${route.word}`,
      type: "command",
      name: slashCommand,
      display_name: `araya ${route.word}`,
      keywords: deriveKeywords(route.word, route.task, Domain.BACKEND, [route.agent]),
      domain: Domain.BACKEND,
      aliases: [],
      purpose: route.task.slice(0, 120),
      status: EntryStatus.ENABLED,
      tier: null,
      source_files: [relPath],
      source_type: "registerCommand",
      is_auto_generated: true,
      related: [],
      alternatives: [],
      requires: [],
      preconditions: [],
      side_effects: [],
      risks: [],
      permissions: [],
      last_validated: now,

      registration_method: "subcommand_route",
      slash_command: slashCommand,
      parent_command: "/araya",
      syntax: slashCommand,
      arguments: [],
      flags: [],
      examples: [],
      handler_type: "agent_delegation",
      delegated_agent: route.agent,
      delegation_task_template: route.task,
      short_help: route.task.slice(0, 80),
      long_help: route.task,
      usage_notes: [],
    };

    commands.push(entry);
  }

  // ── Build CommandEntry for inline subcommand routes ──
  for (const word of inlines) {
    const slashCommand = `/araya ${word}`;
    const entry: CommandEntry = {
      id: `cmd:araya:${word}`,
      type: "command",
      name: slashCommand,
      display_name: `araya ${word}`,
      keywords: deriveKeywords(word, "", Domain.BACKEND, []),
      domain: Domain.BACKEND,
      aliases: [],
      purpose: `Inline handler for /araya ${word}`,
      status: EntryStatus.ENABLED,
      tier: null,
      source_files: [relPath],
      source_type: "registerCommand",
      is_auto_generated: true,
      related: [],
      alternatives: [],
      requires: [],
      preconditions: [],
      side_effects: [],
      risks: [],
      permissions: [],
      last_validated: now,

      registration_method: "inline_handler",
      slash_command: slashCommand,
      parent_command: "/araya",
      syntax: slashCommand,
      arguments: [],
      flags: [],
      examples: [],
      handler_type: "inline",
      short_help: `Inline: /araya ${word}`,
      long_help: `Inline handler in the /araya main handler for '${word}'`,
      usage_notes: [],
    };

    commands.push(entry);
  }

  // ── Assign domains to commands based on keywords ──
  for (const cmd of commands) {
    cmd.domain = inferDomain(cmd.name, cmd.purpose);
  }

  // ── Reconcile: registerCommand entries without delegated_agent inherit from subcommand routes ──
  const routeAgentMap = new Map<string, string>();
  for (const cmd of commands) {
    if (cmd.registration_method === "subcommand_route" && cmd.delegated_agent) {
      // Map word → agent: e.g., "validate" → "rolando"
      const word = cmd.name.replace(/^\/araya /, "");
      routeAgentMap.set(word, cmd.delegated_agent);
    }
  }
  for (const cmd of commands) {
    if (cmd.registration_method === "registerCommand" && !cmd.delegated_agent) {
      // Extract word from slash command: /araya:validate → validate
      const word = cmd.slash_command?.replace(/^\/araya:/, "");
      if (word && routeAgentMap.has(word)) {
        cmd.delegated_agent = routeAgentMap.get(word)!;
        cmd.handler_type = "agent_delegation";
      }
    }
  }

  return commands;
}

function inferDomain(name: string, purpose: string): Domain {
  const text = (name + " " + purpose).toLowerCase();

  if (/budget|token|efficien|cost|finops|optimize-task/.test(text)) return Domain.FINOPS;
  if (/profit|lidia|abc|whale|cost-to-serve/.test(text)) return Domain.PROFITABILITY;
  if (/security|threat|pentest|compliance|secret/.test(text)) return Domain.SECURITY;
  if (/deploy|cloud|infra|cicd|docker|kubernetes|provision/.test(text)) return Domain.INFRA_DEVOPS;
  if (/data|lakehouse|spark|etl|model.*fine|rag|vector|llm/.test(text)) return Domain.DATA_AI;
  if (/analytics|dashboard|visualization|kpi|metrics/.test(text)) return Domain.BI_ANALYTICS;
  if (/test|qa|uat|tdd|bdd|coverage|regression/.test(text)) return Domain.QA_TESTING;
  if (/edu|curriculum|training|student|lab/.test(text)) return Domain.EDUCATION;
  if (/content|brand|seo|geo|publish|visual|asset/.test(text)) return Domain.CONTENT_BRAND;
  if (/doc|slide|book|write|adr/.test(text)) return Domain.DOCUMENTATION;
  if (/govern|pm|plan|sprint|retrospective|standup|velocity|impediment|drr|iar|cr-/.test(text)) return Domain.GOVERNANCE_PM;
  if (/knowledge|graph|pkm|trajectory|learn|daily|note/.test(text)) return Domain.KNOWLEDGE;
  if (/chro|hiring|workforce|capability|gap|topology/.test(text)) return Domain.CHRO;
  if (/frontend|component|form|page|route|responsive|animation|accessibility|state/.test(text)) return Domain.FRONTEND;
  if (/backend|api|endpoint|gateway|error|auth|db-|schema/.test(text)) return Domain.BACKEND;
  if (/architect|microservice|message|cache/.test(text)) return Domain.ARCHITECTURE;
  if (/ax3|postoffice|autonomous|routing/.test(text)) return Domain.AX;

  return Domain.BACKEND; // default
}

// ─── Step 3: Walk skills/*/SKILL.md → SkillEntry[] ────────────────────────

function parseSkills(root: string, skillsDir: string): { skills: SkillEntry[]; skillDirMap: Map<string, string> } {
  const now = isoNow();
  const skills: SkillEntry[] = [];
  const skillDirMap = new Map<string, string>();

  if (!fs.existsSync(skillsDir)) return { skills, skillDirMap };

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillName = entry.name;
    const skillDir = path.join(skillsDir, skillName);
    const skmdPath = path.join(skillDir, "SKILL.md");
    const relDir = path.relative(root, skillDir);
    skillDirMap.set(skillName, relDir);

    if (!fs.existsSync(skmdPath)) continue;

    const content = fs.readFileSync(skmdPath, "utf-8");
    const { data: fm, body } = parseFrontmatter(content);

    const problemSolved = extractSection(body, "What problem this solves");
    const whenToUse = extractSection(body, "When to use");
    const inputDesc = extractSection(body, "Input");
    const outputDesc = extractSection(body, "Output");

    const name = fm.name ?? skillName;
    const purpose = fm.description ?? problemSolved.slice(0, 120);
    const domain = DOMAIN_SKILL_MAP[skillName] ?? Domain.BACKEND;
    const isAx = AX_SKILLS.has(skillName);
    const isMandatory = skillName === "ax3";

    const skillEntry: SkillEntry = {
      id: `skill:${skillName}`,
      type: "skill",
      name,
      display_name: name.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      keywords: deriveKeywords(name, purpose, domain, []),
      domain,
      aliases: [],
      purpose,
      status: EntryStatus.ENABLED,
      tier: null,
      source_files: [path.relative(root, skmdPath)],
      source_type: "skills/SKILL.md",
      is_auto_generated: true,
      related: [],
      alternatives: [],
      requires: [],
      preconditions: [],
      side_effects: [],
      risks: [],
      permissions: [],
      last_validated: now,

      skill_dir: relDir,
      has_skilling_md: true,
      assigned_agents: [],
      assigned_agent_count: 0,
      is_orphan: false,
      is_undeclared: false,
      problem_solved: problemSolved,
      when_to_use: whenToUse,
      input_description: inputDesc,
      output_description: outputDesc,
      usage_notes: whenToUse || `See skills/${relDir}/SKILL.md for usage guidance.`,
      is_ax: isAx,
      is_mandatory: isMandatory,
    };

    skills.push(skillEntry);
  }

  return { skills, skillDirMap };
}

// ─── Step 4: Parse prompts/agents/ → enrich AgentEntry[] ──────────────────

function enrichFromPrompts(root: string, promptsDir: string, agents: AgentEntry[], agentSkillMap: Map<string, string[]>): void {
  if (!fs.existsSync(promptsDir)) return;

  const agentIndex = new Map<string, AgentEntry>();
  for (const a of agents) agentIndex.set(a.name, a);

  const files = fs.readdirSync(promptsDir);
  for (const file of files) {
    const agentName = file.replace(/\.(md|txt)$/, "");
    // Skip AX3.md (not an agent prompt)
    if (agentName === "AX3") continue;

    const agent = agentIndex.get(agentName);
    if (!agent) continue;

    const promptPath = path.join(promptsDir, file);
    agent.has_prompt_file = true;
    agent.prompt_path = `prompts/agents/${file}`;
    agent.source_files.push(path.relative(root, promptPath));

    // Parse prompt for drift detection: skills listed in prompt vs araya.yaml
    const content = fs.readFileSync(promptPath, "utf-8");

    // Look for "## Available Skills" section to detect drift
    const skillsSection = content.match(/## Available Skills\n([\s\S]*?)(?=\n## |\n---|\n#)/i);
    if (skillsSection) {
      const promptedSkills = skillsSection[1]
        .split(/[\n,]/)
        .map(s => s.replace(/\/skill:/g, "").trim())
        .filter(s => s.length > 0 && !s.startsWith("Invoke") && !s.startsWith("Use"));

      const yamlSkills = new Set(agent.skills);

      // Skills in prompt but not in araya.yaml → drift
      for (const s of promptedSkills) {
        if (!yamlSkills.has(s) && s.length > 2 && !s.includes(" ")) {
          // Flag as potential drift
        }
      }
    }

    // Extract delegation language from prompt
    const delegateMatches = content.match(/must not (execute|perform|do)[\s\S]{0,200}/gi) ?? [];
    for (const m of delegateMatches) {
      agent.tasks_must_not_execute.push(m.trim().slice(0, 100));
    }
  }
}

// ─── Step 5-6: Merge, link skills ↔ agents, detect orphans ─────────────────

function mergeAndLink(
  agents: AgentEntry[],
  skills: SkillEntry[],
  agentSkillMap: Map<string, string[]>,
  skillDirMap: Map<string, string>
): void {
  const skillIndex = new Map<string, SkillEntry>();
  for (const s of skills) skillIndex.set(s.name, s);
  for (const s of skills) skillIndex.set(s.id.replace("skill:", ""), s);

  // All skill names declared by any agent (for undeclared detection)
  const allDeclaredSkills = new Set<string>();
  for (const [agentName, skillNames] of agentSkillMap) {
    for (const sn of skillNames) {
      allDeclaredSkills.add(sn);
    }
  }

  // Assign agents to skills
  for (const [agentName, skillNames] of agentSkillMap) {
    const agent = agents.find(a => a.name === agentName);
    if (!agent) continue;

    for (const sn of skillNames) {
      const skill = skillIndex.get(sn);
      if (skill) {
        skill.assigned_agents.push(agentName);
        skill.assigned_agent_count++;

        // Add agent name to skill keywords for search
        if (!skill.keywords.includes(agentName)) {
          skill.keywords.push(agentName);
        }
      } else {
        // Skill declared but no directory → undeclared
        // Create a placeholder
        const placeholder: SkillEntry = {
          id: `skill:${sn}`,
          type: "skill",
          name: sn,
          display_name: sn.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          keywords: [sn, agentName],
          domain: DOMAIN_SKILL_MAP[sn] ?? Domain.BACKEND,
          aliases: [],
          purpose: `Declared by agent '${agentName}' but no skills/${sn}/ directory exists`,
          status: EntryStatus.NOT_INSTALLED,
          tier: null,
          source_files: [],
          source_type: "araya.yaml",
          is_auto_generated: true,
          related: [],
          alternatives: [],
          requires: [],
          preconditions: [],
          side_effects: [],
          risks: ["Skill directory missing — agent capability is degraded"],
          permissions: [],
          last_validated: isoNow(),

          skill_dir: `skills/${sn}/`,
          has_skilling_md: false,
          assigned_agents: [agentName],
          assigned_agent_count: 1,
          is_orphan: false,
          is_undeclared: true,
          problem_solved: "",
          when_to_use: "",
          input_description: "",
          output_description: "",
          usage_notes: `Skill '${sn}' has no SKILL.md — declared by ${agentName}. Create skills/${sn}/SKILL.md for usage guidance.`,
          is_ax: AX_SKILLS.has(sn),
          is_mandatory: sn === "ax3",
        };
        skills.push(placeholder);
        skillIndex.set(sn, placeholder);
      }
    }
  }

  // Detect orphans: skills with directory but no agent assignment
  for (const skill of skills) {
    if (skill.assigned_agent_count === 0 && !skill.is_undeclared) {
      skill.is_orphan = true;
    }
  }

  // Compute agent domains from their skills
  for (const agent of agents) {
    const skillDomains = new Map<Domain, number>();
    for (const sn of agent.skills) {
      const domain = DOMAIN_SKILL_MAP[sn];
      if (domain) {
        skillDomains.set(domain, (skillDomains.get(domain) ?? 0) + 1);
      }
    }
    // Pick the domain with the most skills
    let bestDomain = Domain.BACKEND;
    let bestCount = 0;
    for (const [d, c] of skillDomains) {
      if (c > bestCount) {
        bestCount = c;
        bestDomain = d;
      }
    }
    agent.domain = bestDomain;
    // Add domain to keywords
    if (!agent.keywords.includes(bestDomain)) {
      agent.keywords.push(bestDomain);
    }
    // Add skill names as keywords for the agent
    for (const sn of agent.skills) {
      if (!agent.keywords.includes(sn)) {
        agent.keywords.push(sn);
      }
    }
  }
}

// ─── Step 7: Build cross_refs ──────────────────────────────────────────────

function buildCrossRefs(agents: AgentEntry[], skills: SkillEntry[], commands: CommandEntry[]): CrossReference[] {
  const refs: CrossReference[] = [];

  // agent ↔ skill (assignment)
  for (const agent of agents) {
    for (const sn of agent.skills) {
      refs.push({
        from_id: agent.id,
        to_id: `skill:${sn}`,
        relationship: "related",
        reason: `${agent.name} is assigned skill ${sn}`,
      });
    }
  }

  // command ↔ agent (delegation)
  for (const cmd of commands) {
    if (cmd.delegated_agent) {
      refs.push({
        from_id: cmd.id,
        to_id: `agent:${cmd.delegated_agent}`,
        relationship: "delegates_to",
        reason: `${cmd.slash_command} delegates to ${cmd.delegated_agent}`,
      });
    }
  }

  // command ↔ relevant skills from delegated agent
  for (const cmd of commands) {
    if (cmd.delegated_agent) {
      const agent = agents.find(a => a.name === cmd.delegated_agent);
      if (agent) {
        for (const sn of agent.skills) {
          refs.push({
            from_id: cmd.id,
            to_id: `skill:${sn}`,
            relationship: "related",
            reason: `${cmd.slash_command} uses skill ${sn} via agent ${cmd.delegated_agent}`,
          });
        }
      }
    }
  }

  return refs;
}

// ─── Step 8: Compute sources_hash ──────────────────────────────────────────

function computeSourcesHash(sourceFiles: string[]): string {
  const hasher = crypto.createHash("sha256");
  for (const file of [...sourceFiles].sort()) {
    if (fs.existsSync(file)) {
      hasher.update(fs.readFileSync(file, "utf-8"));
    }
  }
  return hasher.digest("hex");
}

// ─── Step 9: Compute CatalogStats ──────────────────────────────────────────

function computeStats(agents: AgentEntry[], skills: SkillEntry[], commands: CommandEntry[]): CatalogStats {
  const commandsEnabled = commands.filter(c => c.status === EntryStatus.ENABLED).length;
  const commandsDisabled = commands.filter(c => c.status === EntryStatus.DISABLED).length;
  const commandsDeprecated = commands.filter(c => c.status === EntryStatus.DEPRECATED).length;
  const skillsOrphan = skills.filter(s => s.is_orphan).length;
  const skillsUndeclared = skills.filter(s => s.is_undeclared).length;
  const agentsActive = agents.filter(a => a.agent_status === "active").length;
  const agentsDormant = agents.filter(a => a.agent_status === "dormant").length;
  const agentsBare = agents.filter(a => a.agent_status === "bare").length;

  return {
    total_entries: agents.length + skills.length + commands.length,
    commands_count: commands.length,
    commands_enabled: commandsEnabled,
    commands_disabled: commandsDisabled,
    commands_deprecated: commandsDeprecated,
    skills_count: skills.length,
    skills_orphan: skillsOrphan,
    skills_undeclared: skillsUndeclared,
    agents_count: agents.length,
    agents_active: agentsActive,
    agents_dormant: agentsDormant,
    agents_bare: agentsBare,
    orphans_total: skillsOrphan + skillsUndeclared,
    drift_detected: false,
    last_validated: isoNow(),
  };
}

// ─── Step 10: Write catalog.json ───────────────────────────────────────────

// ─── Public API: populate() ────────────────────────────────────────────────

export function populate(root?: string): Catalog {
  buildDomainMap();
  const arayaRoot = root ?? findArayaRoot();
  const yamlPath = path.resolve(arayaRoot, "araya.yaml");
  const indexTsPath = path.resolve(arayaRoot, "extensions", "araya", "index.ts");
  const skillsDir = path.resolve(arayaRoot, "skills");
  const promptsDir = path.resolve(arayaRoot, "prompts", "agents");

  // Validate sources exist
  if (!fs.existsSync(yamlPath)) throw new Error(`Missing araya.yaml at ${yamlPath}`);
  if (!fs.existsSync(indexTsPath)) throw new Error(`Missing extensions/araya/index.ts at ${indexTsPath}`);

  // Step 1: Parse agents
  const { agents, agentSkillMap } = parseAgents(arayaRoot, yamlPath);

  // Step 2: Parse commands
  const commands = parseCommands(arayaRoot, indexTsPath);

  // Step 3: Parse skills
  const { skills, skillDirMap } = parseSkills(arayaRoot, skillsDir);

  // Step 4: Enrich from prompts
  enrichFromPrompts(arayaRoot, promptsDir, agents, agentSkillMap);

  // Step 5-6: Merge and link
  mergeAndLink(agents, skills, agentSkillMap, skillDirMap);

  // Step 7: Build cross_refs
  const crossRefs = buildCrossRefs(agents, skills, commands);

  // Collect all source files for hash
  const sourceFilesForHash: string[] = [yamlPath, indexTsPath];
  for (const skill of skills) {
    if (skill.has_skilling_md) {
      sourceFilesForHash.push(path.resolve(arayaRoot, skill.skill_dir, "SKILL.md"));
    }
  }
  for (const agent of agents) {
    if (agent.prompt_path) {
      sourceFilesForHash.push(path.resolve(arayaRoot, agent.prompt_path));
    }
  }

  // Step 8: Compute sources_hash
  const sourcesHash = computeSourcesHash(sourceFilesForHash);

  // Step 9: Compute stats
  const stats = computeStats(agents, skills, commands);

  // All source files (relative)
  const allSources = sourceFilesForHash.map(f => path.relative(arayaRoot, f));

  const catalog: Catalog = {
    version: CATALOG_VERSION,
    generated_at: isoNow(),
    sources_hash: sourcesHash,
    source_files: allSources,
    stats,
    commands,
    skills,
    agents,
    cross_refs: crossRefs,
  };

  return catalog;
}

export function populateAndWrite(root?: string): Catalog {
  const catalog = populate(root);
  const arayaRoot = root ?? findArayaRoot();
  const outDir = path.resolve(arayaRoot, ".araya", "catalog");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, "catalog.json");
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), "utf-8");
  return catalog;
}
