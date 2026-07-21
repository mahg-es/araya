// ARAYA Help Provider — /araya:man System
// WS-09: Implements the man/help system consuming the canonical catalog
// Author: Valentina (Backend Developer)
// Date: 2026-07-22

import { getCatalog, searchCatalog, SearchOptions } from "./index";
import { Catalog, CommandEntry, SkillEntry, AgentEntry, Domain } from "./types";

// ─── Fuzzy Matching ───────────────────────────────────────────────────────

/**
 * Levenshtein distance for fuzzy match suggestions.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Returns the top-N closest name matches using normalized Levenshtein similarity.
 * Lower score = better match.
 */
function fuzzyFind(query: string, candidates: string[], limit = 5): string[] {
  const q = query.toLowerCase();
  const scored = candidates.map((c) => ({
    name: c,
    score: levenshtein(q, c.toLowerCase()),
  }));
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.name);
}

// ─── Formatting Utilities ─────────────────────────────────────────────────

function section(title: string): string {
  return `\n**${title}**\n`;
}

function bullet(items: string[]): string {
  return items.map((i) => `  - ${i}`).join("\n");
}

function badge(value: string, color: "green" | "yellow" | "red" | "blue" = "blue"): string {
  const colors: Record<string, string> = {
    green: "🟢",
    yellow: "🟡",
    red: "🔴",
    blue: "🔵",
  };
  return `${colors[color]} ${value}`;
}

function statusBadge(status: string): string {
  switch (status) {
    case "enabled":
    case "active":
      return badge("Active", "green");
    case "disabled":
      return badge("Disabled", "red");
    case "deprecated":
      return badge("Deprecated", "yellow");
    case "dormant":
      return badge("Dormant", "yellow");
    case "bare":
      return badge("Bare (minimal skills)", "red");
    case "provisioned":
      return badge("Provisioned", "blue");
    default:
      return status;
  }
}

function truncate(text: string, maxLen = 120): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

// ─── Format: Command ──────────────────────────────────────────────────────

export function formatCommand(cmd: CommandEntry): string {
  const lines: string[] = [];

  lines.push(`## ${cmd.slash_command}`);
  lines.push("");
  lines.push(`**Purpose:** ${cmd.purpose || cmd.short_help}`);
  lines.push(`**Status:** ${statusBadge(cmd.status)} | **Domain:** \`${cmd.domain}\``);

  if (cmd.syntax) {
    lines.push(section("Syntax"));
    lines.push(`\`\`\`\n${cmd.syntax}\n\`\`\``);
  }

  if (cmd.arguments.length > 0) {
    lines.push(section("Arguments"));
    for (const arg of cmd.arguments) {
      const req = arg.required ? " (required)" : " (optional)";
      lines.push(`  - \`${arg.name}\` [${arg.type}]${req}: ${arg.description}`);
    }
  }

  if (cmd.flags.length > 0) {
    lines.push(section("Flags"));
    for (const f of cmd.flags) {
      const short = f.short ? ` \`${f.short}\`` : "";
      lines.push(`  - \`${f.flag}\`${short}: ${f.description}`);
    }
  }

  if (cmd.examples.length > 0) {
    lines.push(section("Examples"));
    for (const ex of cmd.examples) {
      lines.push(`  \`${ex.command}\` — ${ex.description}`);
    }
  }

  if (cmd.delegated_agent) {
    lines.push(section("Execution"));
    lines.push(`  - **Handler:** ${cmd.handler_type}`);
    lines.push(`  - **Delegated to:** ${cmd.delegated_agent}`);
  }

  if (cmd.usage_notes.length > 0) {
    lines.push(section("Usage Notes"));
    lines.push(bullet(cmd.usage_notes));
  }

  if (cmd.risks.length > 0) {
    lines.push(section("⚠️ Risks"));
    lines.push(bullet(cmd.risks));
  }

  if (cmd.alternatives.length > 0) {
    lines.push(section("Alternatives"));
    lines.push(bullet(cmd.aliases));
  }

  if (cmd.related.length > 0) {
    lines.push(section("Related"));
    lines.push(bullet(cmd.related));
  }

  lines.push("");
  lines.push(`*Catalog entry: \`${cmd.id}\` — last validated ${cmd.last_validated}*`);

  return lines.join("\n");
}

// ─── Format: Agent ────────────────────────────────────────────────────────

export function formatAgent(agent: AgentEntry): string {
  const lines: string[] = [];

  lines.push(`## ${agent.emoji} ${agent.name} — ${agent.role}`);
  lines.push("");

  lines.push(`**Purpose:** ${agent.purpose}`);
  lines.push(`**Status:** ${statusBadge(agent.agent_status)} | **Tier:** \`${agent.model_tier}\` | **Provider:** ${agent.primary_provider}`);

  lines.push(section("Capabilities"));
  if (agent.capabilities.length > 0) {
    lines.push(bullet(agent.capabilities));
  } else {
    lines.push("  *(none declared)*");
  }

  lines.push(section("Skills"));
  if (agent.skills.length > 0) {
    lines.push(bullet(agent.skills.map((s) => `\`${s}\``)));
  } else {
    lines.push("  *(no skills assigned)*");
  }

  lines.push(section("Permissions"));
  const perms: string[] = [];
  perms.push(agent.can_write_code ? "✅ Can write code" : "❌ Cannot write code");
  perms.push(agent.can_approve_review ? "✅ Can approve reviews" : "❌ Cannot approve reviews");
  perms.push(agent.can_merge_pr ? "✅ Can merge PRs" : "❌ Cannot merge PRs");
  if (agent.execution_mode) perms.push(`**Execution mode:** ${agent.execution_mode}`);
  perms.push(`**Max turns:** ${agent.max_turns}`);
  lines.push(bullet(perms));

  if (agent.tasks_must_not_execute.length > 0) {
    lines.push(section("🚫 Tasks This Agent MUST NOT Execute"));
    lines.push(bullet(agent.tasks_must_not_execute));
  }

  if (agent.must_delegate_to.length > 0) {
    lines.push(section("🔀 Must Delegate To"));
    lines.push(bullet(agent.must_delegate_to));
  }

  if (agent.tasks_must_delegate.length > 0) {
    lines.push(section("📤 Task Categories That Must Be Delegated"));
    lines.push(bullet(agent.tasks_must_delegate));
  }

  if (agent.bare_risk) {
    const riskIcon = agent.bare_risk === "high" ? "🔴" : agent.bare_risk === "low" ? "🟡" : "🟢";
    lines.push(section("⚠️ Bare Agent Risk"));
    lines.push(`  ${riskIcon} **Risk level:** ${agent.bare_risk} (${agent.skill_count} skills)`);
  }

  if (agent.never_delegate_from.length > 0) {
    lines.push(section("Never Delegate From"));
    lines.push(bullet(agent.never_delegate_from));
  }

  lines.push("");
  lines.push(`*Catalog entry: \`${agent.id}\` — last validated ${agent.last_validated}*`);

  return lines.join("\n");
}

// ─── Format: Skill ────────────────────────────────────────────────────────

export function formatSkill(skill: SkillEntry): string {
  const lines: string[] = [];

  lines.push(`## /skill:${skill.name}`);
  lines.push("");

  lines.push(`**Purpose:** ${skill.purpose}`);
  lines.push(`**Domain:** \`${skill.domain}\` | **Status:** ${statusBadge(skill.status)}`);

  if (skill.is_ax) {
    lines.push(`**🔀 Cross-cutting (AX):** Yes`);
  }
  if (skill.is_mandatory) {
    lines.push(`**⚠️ Mandatory:** All agents must have this skill`);
  }

  if (skill.problem_solved) {
    lines.push(section("Problem Solved"));
    lines.push(skill.problem_solved);
  }

  if (skill.when_to_use) {
    lines.push(section("When to Use"));
    lines.push(skill.when_to_use);
  }

  if (skill.input_description) {
    lines.push(section("Input"));
    lines.push(skill.input_description);
  }

  if (skill.output_description) {
    lines.push(section("Output"));
    lines.push(skill.output_description);
  }

  if (skill.assigned_agents.length > 0) {
    lines.push(section(`Assigned Agents (${skill.assigned_agent_count})`));
    lines.push(bullet(skill.assigned_agents));
  } else if (skill.is_orphan) {
    lines.push(section("⚠️ Orphan Skill"));
    lines.push("  This skill exists in skills/ but is not assigned to any agent.");
  }

  if (skill.is_undeclared) {
    lines.push(section("⚠️ Undeclared Skill"));
    lines.push("  An agent declares this skill but no skills/ directory exists.");
  }

  if (skill.requires.length > 0) {
    lines.push(section("Prerequisites"));
    lines.push(bullet(skill.requires));
  }

  lines.push("");
  lines.push(`*Catalog entry: \`${skill.id}\` — directory: ${skill.skill_dir}*`);

  return lines.join("\n");
}

// ─── Format: Compact / Quick Help ─────────────────────────────────────────

export function formatCompactCommand(cmd: CommandEntry): string {
  const flags = cmd.flags.map((f) => f.flag).join(" ");
  return `**${cmd.slash_command}** ${flags}  \n  ${truncate(cmd.purpose, 100)}`;
}

export function formatCompactAgent(agent: AgentEntry): string {
  return `**${agent.emoji} ${agent.name}** — ${agent.role} [${agent.model_tier}] (${agent.skill_count} skills)`;
}

export function formatCompactSkill(skill: SkillEntry): string {
  const agents = skill.assigned_agents.length > 0
    ? ` | Agents: ${skill.assigned_agents.join(", ")}`
    : " | ⚠️ Orphan";
  return `**/skill:${skill.name}** — ${truncate(skill.purpose, 80)}${agents}`;
}

// ─── Main API ─────────────────────────────────────────────────────────────

/**
 * man(query) — unified lookup. Tries command first, then agent, then skill.
 * Returns formatted markdown string.
 */
export function man(query: string): string {
  const catalog = getCatalog();
  const q = query.trim();

  if (!q) {
    return listAll();
  }

  // Strip leading / if present
  const cleanQuery = q.startsWith("/") ? q.slice(1) : q;
  const cleanQuerySlash = cleanQuery.startsWith("araya:") ? `/${cleanQuery}` : cleanQuery;
  const slashQuery = q.startsWith("/") ? q : `/${q}`;

  // 1. Try exact command match (by slash_command)
  let cmd = catalog.commands.find(
    (c) => c.slash_command === slashQuery || c.slash_command === `/${cleanQuerySlash}`
  );
  if (!cmd) {
    // Try by name (without /)
    cmd = catalog.commands.find(
      (c) => c.name === slashQuery || c.name === `/${cleanQuerySlash}`
    );
  }
  if (!cmd) {
    // Try by id
    cmd = catalog.commands.find((c) => c.id === `cmd:${cleanQuery}`);
  }
  if (cmd) {
    return formatCommand(cmd);
  }

  // 2. Try exact agent match
  const agent = catalog.agents.find(
    (a) => a.name.toLowerCase() === cleanQuery.toLowerCase()
  );
  if (agent) {
    return formatAgent(agent);
  }

  // 3. Try exact skill match
  const skill = catalog.skills.find(
    (s) => s.name.toLowerCase() === cleanQuery.toLowerCase()
  );
  if (skill) {
    return formatSkill(skill);
  }

  // 4. Try partial match by name
  const partialCmd = catalog.commands.find(
    (c) => c.slash_command.toLowerCase().includes(cleanQuery.toLowerCase())
  );
  if (partialCmd) {
    return `## ⚠️ Exact match not found for "${query}"\n\nDid you mean?\n\n${formatCommand(partialCmd)}`;
  }

  const partialAgent = catalog.agents.find(
    (a) => a.name.toLowerCase().includes(cleanQuery.toLowerCase())
  );
  if (partialAgent) {
    return `## ⚠️ Exact match not found for "${query}"\n\nDid you mean?\n\n${formatAgent(partialAgent)}`;
  }

  const partialSkill = catalog.skills.find(
    (s) => s.name.toLowerCase().includes(cleanQuery.toLowerCase())
  );
  if (partialSkill) {
    return `## ⚠️ Exact match not found for "${query}"\n\nDid you mean?\n\n${formatSkill(partialSkill)}`;
  }

  // 5. Fuzzy match suggestions
  const allNames = [
    ...catalog.commands.map((c) => c.name),
    ...catalog.commands.map((c) => c.slash_command),
    ...catalog.agents.map((a) => a.name),
    ...catalog.skills.map((s) => s.name),
  ];
  const suggestions = fuzzyFind(cleanQuery, [...new Set(allNames)], 5);

  const lines = [
    `## ❌ Not Found: "${query}"`,
    "",
    `The command, agent, or skill you searched for does not exist in the catalog.`,
    "",
    "### 💡 Suggestions",
    ...(suggestions.length > 0
      ? suggestions.map((s) => `  - \`${s}\``)
      : ["  *(no suggestions — try a different query)*"]),
    "",
    "### How to Search",
    "  - `/araya:man --search <keyword>` — search by keyword",
    "  - `/araya:man --command <name>` — look up a command",
    "  - `/araya:man --agent <name>` — look up an agent",
    "  - `/araya:man --skill <name>` — look up a skill",
    "  - `/araya:man` — list all capabilities",
  ];

  return lines.join("\n");
}

/**
 * manAgent(name) — detailed agent profile.
 */
export function manAgent(name: string): string {
  const catalog = getCatalog();
  const agent = catalog.agents.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );

  if (!agent) {
    const suggestions = fuzzyFind(
      name,
      catalog.agents.map((a) => a.name),
      5
    );
    const lines = [
      `## ❌ Agent Not Found: "${name}"`,
      "",
      "### 💡 Did you mean?",
      ...(suggestions.length > 0
        ? suggestions.map((s) => `  - \`${s}\``)
        : ["  *(no matching agents)*"]),
      "",
      `Use \`/araya:man --agent <name>\` or \`/araya:man\` to list all ${catalog.agents.length} agents.`,
    ];
    return lines.join("\n");
  }

  return formatAgent(agent);
}

/**
 * manSkill(name) — detailed skill profile.
 */
export function manSkill(name: string): string {
  const catalog = getCatalog();
  const skill = catalog.skills.find(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );

  if (!skill) {
    const suggestions = fuzzyFind(
      name,
      catalog.skills.map((s) => s.name),
      5
    );
    const lines = [
      `## ❌ Skill Not Found: "${name}"`,
      "",
      "### 💡 Did you mean?",
      ...(suggestions.length > 0
        ? suggestions.map((s) => `  - \`${s}\``)
        : ["  *(no matching skills)*"]),
      "",
      `Use \`/araya:man --skill <name>\` or \`/araya:man\` to list all ${catalog.skills.length} skills.`,
    ];
    return lines.join("\n");
  }

  return formatSkill(skill);
}

// ─── Search ───────────────────────────────────────────────────────────────

/**
 * searchCatalog(query) — keyword search across all catalog entries.
 */
export function manSearch(query: string): string {
  const options: SearchOptions = { query, type: "all" };
  const results = searchCatalog(options);

  if (results.length === 0) {
    return [
      `## 🔍 No results for: "${query}"`,
      "",
      "Try a different keyword, or use `/araya:man` to browse all capabilities.",
      "",
      "### Tips",
      "  - Search by domain: `/araya:man --search security`",
      "  - Search by agent: `/araya:man --agent sonia`",
      "  - List everything: `/araya:man`",
    ].join("\n");
  }

  const lines: string[] = [
    `## 🔍 Results for: "${query}" (${results.length} found)`,
    "",
  ];

  // Group by type
  const commands = results.filter((r) => r.entry.type === "command");
  const agents = results.filter((r) => r.entry.type === "agent");
  const skills = results.filter((r) => r.entry.type === "skill");

  if (commands.length > 0) {
    lines.push(`### Commands (${commands.length})`);
    for (const r of commands.slice(0, 10)) {
      lines.push(`  - ${formatCompactCommand(r.entry as CommandEntry)}`);
    }
    if (commands.length > 10) lines.push(`  ... and ${commands.length - 10} more`);
    lines.push("");
  }

  if (agents.length > 0) {
    lines.push(`### Agents (${agents.length})`);
    for (const r of agents.slice(0, 10)) {
      lines.push(`  - ${formatCompactAgent(r.entry as AgentEntry)}`);
    }
    if (agents.length > 10) lines.push(`  ... and ${agents.length - 10} more`);
    lines.push("");
  }

  if (skills.length > 0) {
    lines.push(`### Skills (${skills.length})`);
    for (const r of skills.slice(0, 10)) {
      lines.push(`  - ${formatCompactSkill(r.entry as SkillEntry)}`);
    }
    if (skills.length > 10) lines.push(`  ... and ${skills.length - 10} more`);
  }

  return lines.join("\n");
}

// ─── List All ─────────────────────────────────────────────────────────────

/**
 * listAll() — complete listing of all catalog entries (summary view).
 * Used when /araya:man is invoked with no arguments.
 */
export function listAll(): string {
  const catalog = getCatalog();
  const s = catalog.stats;

  const lines: string[] = [
    `## 📚 ARAYA Catalog — ${s.total_entries} entries`,
    "",
    `**Version:** ${catalog.version} | **Generated:** ${catalog.generated_at}`,
    "",
    `### Stats`,
    `  **Commands:** ${s.commands_count} (${s.commands_enabled} enabled, ${s.commands_deprecated} deprecated)`,
    `  **Skills:** ${s.skills_count} (${s.skills_orphan} orphans, ${s.skills_undeclared} undeclared)`,
    `  **Agents:** ${s.agents_count} (${s.agents_active} active, ${s.agents_dormant} dormant, ${s.agents_bare} bare)`,
    `  **Orphans total:** ${s.orphans_total}`,
    `  **Drift:** ${s.drift_detected ? "🔴 Detected" : "✅ Clean"}`,
    "",
    "### Usage",
    "  `/araya:man <query>` — look up a command, agent, or skill",
    "  `/araya:man --agent <name>` — agent profile",
    "  `/araya:man --skill <name>` — skill details",
    "  `/araya:man --command <name>` — command reference",
    "  `/araya:man --search <keyword>` — search by keyword",
    "  `/araya:man --list agents|commands|skills` — list by type",
    "",
    `### Commands (${s.commands_enabled} enabled)`,
  ];

  for (const cmd of catalog.commands.filter((c) => c.status === "enabled").slice(0, 20)) {
    lines.push(`  - ${formatCompactCommand(cmd)}`);
  }
  if (s.commands_enabled > 20) {
    lines.push(`  ... and ${s.commands_enabled - 20} more — use \`/araya:man --list commands\``);
  }

  lines.push("");
  lines.push(`### Agents (${s.agents_active} active)`);

  for (const agent of catalog.agents.filter((a) => a.agent_status === "active")) {
    lines.push(`  - ${formatCompactAgent(agent)}`);
  }

  if (s.agents_bare > 0 || s.agents_dormant > 0) {
    lines.push("");
    if (s.agents_bare > 0) {
      for (const agent of catalog.agents.filter((a) => a.agent_status === "bare")) {
        lines.push(`  - ${formatCompactAgent(agent)} ⚠️`);
      }
    }
    if (s.agents_dormant > 0) {
      for (const agent of catalog.agents.filter((a) => a.agent_status === "dormant")) {
        lines.push(`  - ${formatCompactAgent(agent)} 💤`);
      }
    }
  }

  lines.push("");
  lines.push(`### Skills (${s.skills_count} total) — use \`/araya:man --list skills\` for full list`);

  // Show first 15 skills
  for (const skill of catalog.skills.filter((sk) => sk.status === "enabled").slice(0, 15)) {
    lines.push(`  - ${formatCompactSkill(skill)}`);
  }
  if (catalog.skills.length > 15) {
    lines.push(`  ... and ${catalog.skills.length - 15} more`);
  }

  lines.push("");
  if (s.orphans_total > 0) {
    lines.push(`### ⚠️ Orphaned/Undeclared Skills (${s.orphans_total})`);
    const orphans = catalog.skills.filter((sk) => sk.is_orphan);
    const undeclared = catalog.skills.filter((sk) => sk.is_undeclared);
    if (orphans.length > 0) {
      lines.push(`  **Orphans (no agent assigned):** ${orphans.map((s) => `\`${s.name}\``).join(", ")}`);
    }
    if (undeclared.length > 0) {
      lines.push(`  **Undeclared (agent claims, no dir):** ${undeclared.map((s) => `\`${s.name}\``).join(", ")}`);
    }
  }

  lines.push("");
  lines.push("*Catalog is auto-generated from repository sources. Never hand-edit catalog.json.*");

  return lines.join("\n");
}

/**
 * listByType(type) — list entries filtered by type.
 */
export function listByType(type: string): string {
  const catalog = getCatalog();
  const t = type.toLowerCase();

  if (t === "commands" || t === "command") {
    const lines: string[] = [
      `## All Commands (${catalog.commands.length})`,
      "",
    ];
    for (const cmd of catalog.commands) {
      const status = cmd.status === "enabled" ? "" : ` [${cmd.status}]`;
      lines.push(`  - ${formatCompactCommand(cmd)}${status}`);
    }
    return lines.join("\n");
  }

  if (t === "agents" || t === "agent") {
    const lines: string[] = [
      `## All Agents (${catalog.agents.length})`,
      "",
    ];
    for (const agent of catalog.agents) {
      lines.push(`  - ${formatCompactAgent(agent)}`);
    }
    return lines.join("\n");
  }

  if (t === "skills" || t === "skill") {
    const lines: string[] = [
      `## All Skills (${catalog.skills.length})`,
      "",
    ];
    for (const skill of catalog.skills) {
      const status = skill.is_orphan ? " ⚠️ Orphan" : skill.is_undeclared ? " ⚠️ Undeclared" : "";
      lines.push(`  - ${formatCompactSkill(skill)}${status}`);
    }
    return lines.join("\n");
  }

  return `Unknown list type: "${type}". Use: agents, commands, skills.`;
}

// ─── Help (quick syntax) ──────────────────────────────────────────────────

/**
 * help(commandName) — quick syntax reference, equivalent to --help.
 */
export function help(commandName: string): string {
  const catalog = getCatalog();
  const q = commandName.trim();

  // Try to find the command
  const slashQuery = q.startsWith("/") ? q : `/${q}`;
  const cmd = catalog.commands.find(
    (c) => c.slash_command === slashQuery || c.name === slashQuery
  );

  if (!cmd) {
    const suggestions = fuzzyFind(
      q.replace("/", ""),
      catalog.commands.map((c) => c.slash_command),
      5
    );
    return [
      `## ❌ Command Not Found: "${commandName}"`,
      "",
      "### 💡 Did you mean?",
      ...suggestions.map((s) => `  - \`${s}\``),
      "",
      "Use `/araya:man` to browse all commands.",
    ].join("\n");
  }

  const lines: string[] = [
    `## ${cmd.slash_command} — Quick Help`,
    "",
    `**${cmd.short_help || cmd.purpose}**`,
    "",
    `### Syntax`,
    `\`\`\``,
    cmd.syntax || cmd.slash_command,
    `\`\`\``,
  ];

  if (cmd.flags.length > 0) {
    lines.push("");
    for (const f of cmd.flags) {
      lines.push(`  \`${f.flag}\` — ${f.description}`);
    }
  }

  if (cmd.arguments.length > 0) {
    lines.push("");
    lines.push("### Arguments");
    for (const a of cmd.arguments) {
      const req = a.required ? "**required**" : "optional";
      lines.push(`  \`${a.name}\` (${a.type}, ${req}) — ${a.description}`);
    }
  }

  if (cmd.examples.length > 0) {
    lines.push("");
    lines.push("### Examples");
    for (const ex of cmd.examples.slice(0, 5)) {
      lines.push(`  \`${ex.command}\` — ${ex.description}`);
    }
  }

  lines.push("");
  lines.push(`Use \`/araya:man --command ${cmd.slash_command}\` for the full manual.`);

  return lines.join("\n");
}

/**
 * manHelp() — show help about /araya:man itself.
 */
export function manHelp(): string {
  return [
    `## /araya:man — ARAYA Manual & Discovery System`,
    "",
    `**Purpose:** Browse, search, and inspect all ARAYA commands, agents, and skills.`,
    `**Powered by:** Canonical catalog (.araya/catalog/catalog.json)`,
    "",
    `### Syntax`,
    `\`\`\``,
    `/araya:man [query] [flags]`,
    `\`\`\``,
    "",
    `### Usage`,
    `  \`/araya:man\` — list all capabilities (summary)`,
    `  \`/araya:man <query>\` — lookup command, agent, or skill by name`,
    `  \`/araya:man --agent <name>\` — detailed agent profile`,
    `  \`/araya:man --skill <name>\` — detailed skill reference`,
    `  \`/araya:man --command <name>\` — detailed command reference`,
    `  \`/araya:man --search <keyword>\` — search by keyword`,
    `  \`/araya:man --list agents|commands|skills\` — list by type`,
    `  \`/araya:man --help\` — this help`,
    "",
    `### Examples`,
    `  \`/araya:man\` — show full catalog summary`,
    `  \`/araya:man ax3\` — find info about /araya:ax3`,
    `  \`/araya:man valentina\` — show Valentina's profile`,
    `  \`/araya:man api-design\` — show API design skill details`,
    `  \`/araya:man --search security\` — find security-related entries`,
    `  \`/araya:man --agent sonia\` — show Sonia's full profile`,
    `  \`/araya:man --command /araya:validate\` — validate command reference`,
    `  \`/araya:man --list agents\` — list all agents`,
    "",
    `### Non-existent functions`,
    `If you query something that doesn't exist, /araya:man will suggest`,
    `similar commands, agents, or skills using fuzzy matching.`,
  ].join("\n");
}
