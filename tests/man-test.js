#!/usr/bin/env node
/**
 * ARAYA /araya:man Test Suite — WS-09
 *
 * Verifies:
 *  (a) /araya:man without args lists capabilities (listAll)
 *  (b) /araya:man <command> shows correct command info
 *  (c) /araya:man <agent> shows correct agent info
 *  (d) /araya:man <skill> shows correct skill info
 *  (e) /araya:man <non-existent> → error + fuzzy suggestions
 *  (f) searchCatalog finds by keyword
 *  (g) --help works on commands (manHelp, help())
 *  (h) --agent flag works correctly
 *  (i) --skill flag works correctly
 *  (j) --command flag works correctly
 *  (k) --search flag works correctly
 *  (l) --list flag works for agents, commands, skills
 *  (m) formatCommand, formatAgent, formatSkill produce valid markdown
 *  (n) man function resolves queries correctly
 *  (o) manAgent with invalid name returns suggestions
 *  (p) manSkill with invalid name returns suggestions
 *  (q) help() returns quick syntax for valid commands
 *  (r) help() returns suggestions for invalid commands
 *
 * Usage: node tests/man-test.js
 */

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

// ─── Resolve the compiled module path ────────────────────────────────────

function findArayaRoot() {
  let dir = __dirname;
  for (let i = 0; i < 15; i++) {
    if (fs.existsSync(path.resolve(dir, "araya.yaml"))) return dir;
    const parent = path.resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Cannot find araya.yaml root");
}

const root = findArayaRoot();
const distRoot = path.resolve(root, "dist", "araya", "catalog");

// Check if compiled output exists
const helpProviderPath = path.resolve(distRoot, "help-provider.js");
if (!fs.existsSync(helpProviderPath)) {
  console.log("⚠️  help-provider.js not compiled. Run: npx tsc");
  console.log(`   Expected at: ${helpProviderPath}`);
  process.exit(1);
}

const catalogIndexPath = path.resolve(distRoot, "index.js");
if (!fs.existsSync(catalogIndexPath)) {
  console.log("⚠️  catalog/index.js not compiled. Run: npx tsc");
  console.log(`   Expected at: ${catalogIndexPath}`);
  process.exit(1);
}

// ─── Dynamically load the modules ────────────────────────────────────────

const helpProvider = require(helpProviderPath);
const catalogIndex = require(catalogIndexPath);

const {
  man, manAgent, manSkill, manSearch, manHelp,
  listAll, listByType, help,
  formatCommand, formatAgent, formatSkill,
  formatCompactCommand, formatCompactAgent, formatCompactSkill,
} = helpProvider;

const { getCatalog, searchCatalog } = catalogIndex;

// ─── Test Suite ──────────────────────────────────────────────────────────

console.log("\n📚 ARAYA /araya:man Test Suite — WS-09\n");

// ═════════════════════════════════════════════════════════════════════════
// SECTION A: listAll and listByType
// ═════════════════════════════════════════════════════════════════════════

test("(a.1) listAll returns catalog summary", () => {
  const output = listAll();
  assert.ok(typeof output === "string", "listAll should return a string");
  assert.ok(output.length > 500, "listAll output should be substantial");
  assert.ok(output.includes("ARAYA Catalog"), "Should include catalog header");
  assert.ok(output.includes("Commands"), "Should include commands section");
  assert.ok(output.includes("Agents"), "Should include agents section");
  assert.ok(output.includes("Skills"), "Should include skills section");
});

test("(a.2) listByType('commands') returns command list", () => {
  const output = listByType("commands");
  assert.ok(output.includes("All Commands"), "Should show commands header");
  assert.ok(output.includes("/araya"), "Should include /araya command");
});

test("(a.3) listByType('agents') returns agent list", () => {
  const output = listByType("agents");
  assert.ok(output.includes("All Agents"), "Should show agents header");
  assert.ok(output.includes("sonia"), "Should include sonia");
  assert.ok(output.includes("valentina"), "Should include valentina");
});

test("(a.4) listByType('skills') returns skill list", () => {
  const output = listByType("skills");
  assert.ok(output.includes("All Skills"), "Should show skills header");
  assert.ok(output.includes("api-design"), "Should include api-design skill");
});

test("(a.5) listByType with invalid type returns error", () => {
  const output = listByType("nonexistent");
  assert.ok(output.includes("Unknown list type"), "Should show error message");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION B: man() unified lookup
// ═════════════════════════════════════════════════════════════════════════

test("(b.1) man('ax3') finds command", () => {
  const output = man("ax3");
  assert.ok(output.includes("/araya:ax3"), "Should show command name");
  assert.ok(output.includes("AX3"), "Should mention AX3");
});

test("(b.2) man('/araya:validate') finds command with slash prefix", () => {
  const output = man("/araya:validate");
  assert.ok(output.includes("/araya:validate"), "Should show command name");
});

test("(b.3) man('sonia') finds agent", () => {
  const output = man("sonia");
  assert.ok(output.includes("sonia"), "Should show agent name");
  assert.ok(output.includes("Skills"), "Should have skills section");
});

test("(b.4) man('valentina') finds agent (case insensitive)", () => {
  const output = man("VALENTINA");
  assert.ok(output.includes("valentina"), "Should find agent case-insensitively");
});

test("(b.5) man('api-design') finds skill", () => {
  const output = man("api-design");
  assert.ok(output.includes("api-design"), "Should show skill name");
  assert.ok(output.includes("Problem Solved") || output.includes("Purpose"), "Should have purpose or problem solved");
});

test("(b.6) man('nonexistent-function-xyz') returns error with suggestions", () => {
  const output = man("nonexistent-function-xyz");
  assert.ok(output.includes("Not Found"), "Should show not found message");
  assert.ok(output.includes("Suggestions"), "Should include suggestions section");
});

test("(b.7) man('') calls listAll", () => {
  const output = man("");
  assert.ok(output.includes("ARAYA Catalog"), "Empty query should show catalog");
});

test("(b.8) man with whitespace-only returns listAll", () => {
  const output = man("   ");
  assert.ok(output.includes("ARAYA Catalog"), "Whitespace query should show catalog");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION C: manAgent()
// ═════════════════════════════════════════════════════════════════════════

test("(c.1) manAgent('sonia') shows agent profile", () => {
  const output = manAgent("sonia");
  assert.ok(output.includes("sonia"), "Should show agent name");
  assert.ok(output.includes("Skills"), "Should show skills section");
  assert.ok(output.includes("Capabilities"), "Should show capabilities");
  assert.ok(output.includes("Permissions"), "Should show permissions");
});

test("(c.2) manAgent('valentina') shows backend developer profile", () => {
  const output = manAgent("valentina");
  assert.ok(output.includes("valentina"), "Should show agent name");
  assert.ok(output.includes("Backend"), "Should mention Backend in role");
  assert.ok(output.includes("api-design") || output.includes("db-schema"), "Should list backend skills");
});

test("(c.3) manAgent('diana') shows security specialist profile", () => {
  const output = manAgent("diana");
  assert.ok(output.includes("diana"), "Should show agent name");
  assert.ok(output.includes("Cybersecurity") || output.includes("Security"), "Should mention security role");
});

test("(c.4) manAgent('nonexistent-agent') returns suggestions", () => {
  const output = manAgent("nonexistent-agent");
  assert.ok(output.includes("Not Found"), "Should show not found");
  assert.ok(output.includes("Did you mean"), "Should show suggestions");
});

test("(c.5) manAgent with case-insensitive match works", () => {
  const output = manAgent("SONIA");
  assert.ok(output.includes("sonia"), "Should be case-insensitive");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION D: manSkill()
// ═════════════════════════════════════════════════════════════════════════

test("(d.1) manSkill('api-design') shows skill details", () => {
  const output = manSkill("api-design");
  assert.ok(output.includes("api-design"), "Should show skill name");
  assert.ok(output.includes("Purpose"), "Should show purpose");
  assert.ok(output.includes("Problem Solved") || output.includes("When to Use"), "Should have details");
});

test("(d.2) manSkill('endpoint') shows endpoint skill", () => {
  const output = manSkill("endpoint");
  assert.ok(output.includes("endpoint"), "Should show skill name");
});

test("(d.3) manSkill('auth-middleware') shows auth skill", () => {
  const output = manSkill("auth-middleware");
  assert.ok(output.includes("auth-middleware"), "Should show skill name");
});

test("(d.4) manSkill('nonexistent-skill') returns suggestions", () => {
  const output = manSkill("nonexistent-skill");
  assert.ok(output.includes("Not Found"), "Should show not found");
  assert.ok(output.includes("Did you mean"), "Should show suggestions");
});

test("(d.5) manSkill assigned agents are listed", () => {
  const output = manSkill("api-design");
  // Should list agents that have this skill
  assert.ok(output.includes("Assigned Agents") || output.includes("valentina") || output.includes("aisha"),
    "Should mention assigned agents");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION E: manSearch() keyword search
// ═════════════════════════════════════════════════════════════════════════

test("(e.1) manSearch('security') finds security entries", () => {
  const output = manSearch("security");
  assert.ok(output.length > 100, "Search should return results");
  assert.ok(
    output.includes("diana") || output.includes("secure") || output.includes("pentest"),
    "Should find security-related entries"
  );
});

test("(e.2) manSearch('backend') finds backend entries", () => {
  const output = manSearch("backend");
  assert.ok(output.length > 100, "Search should return results");
  assert.ok(output.includes("Results"), "Should show results header");
});

test("(e.3) manSearch('orchestrat') finds partial matches", () => {
  const output = manSearch("orchestrat");
  assert.ok(output.includes("Results"), "Partial word should search successfully");
});

test("(e.4) manSearch('diana') finds agent diana", () => {
  const output = manSearch("diana");
  assert.ok(output.includes("diana"), "Should find agent diana");
});

test("(e.5) manSearch with no results returns helpful message", () => {
  const output = manSearch("xyznonexistent123456");
  assert.ok(output.includes("No results"), "Should show no results message");
  assert.ok(output.includes("Try a different keyword"), "Should give guidance");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION F: help() quick syntax
// ═════════════════════════════════════════════════════════════════════════

test("(f.1) help('/araya:validate') returns quick help", () => {
  const output = help("/araya:validate");
  assert.ok(output.includes("Quick Help"), "Should show quick help header");
  assert.ok(output.includes("Syntax"), "Should show syntax section");
  assert.ok(output.includes("/araya:validate"), "Should show command name");
});

test("(f.2) help('araya:validate') works without slash", () => {
  const output = help("araya:validate");
  assert.ok(output.includes("Quick Help"), "Should work without leading slash");
});

test("(f.3) help('nonexistent-command') returns suggestions", () => {
  const output = help("nonexistent-command");
  assert.ok(output.includes("Not Found"), "Should show not found");
  assert.ok(output.includes("Did you mean"), "Should show suggestions");
});

test("(f.4) help('/araya:ax3') handles ax3 command", () => {
  const output = help("/araya:ax3");
  assert.ok(output.includes("Quick Help"), "Should show quick help");
  assert.ok(output.length > 50, "Should have substantial output");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION G: manHelp() — help about /araya:man itself
// ═════════════════════════════════════════════════════════════════════════

test("(g.1) manHelp() shows man command help", () => {
  const output = manHelp();
  assert.ok(output.includes("/araya:man"), "Should show command name");
  assert.ok(output.includes("Syntax"), "Should show syntax");
  assert.ok(output.includes("--agent"), "Should list --agent flag");
  assert.ok(output.includes("--skill"), "Should list --skill flag");
  assert.ok(output.includes("--command"), "Should list --command flag");
  assert.ok(output.includes("--search"), "Should list --search flag");
  assert.ok(output.includes("--list"), "Should list --list flag");
  assert.ok(output.includes("--help"), "Should list --help flag");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION H: Format functions produce valid markdown
// ═════════════════════════════════════════════════════════════════════════

test("(h.1) formatCommand produces markdown with all sections", () => {
  const catalog = getCatalog();
  const cmd = catalog.commands.find(c => c.slash_command === "/araya:validate");
  assert.ok(cmd, "Should find /araya:validate command");
  const output = formatCommand(cmd);
  assert.ok(output.includes("##"), "Should have markdown headers");
  assert.ok(output.includes("/araya:validate"), "Should include command name");
  assert.ok(output.includes("Purpose"), "Should include purpose");
  assert.ok(output.includes("Syntax"), "Should include syntax");
});

test("(h.2) formatAgent produces markdown with all sections", () => {
  const catalog = getCatalog();
  const agent = catalog.agents.find(a => a.name === "sonia");
  assert.ok(agent, "Should find sonia agent");
  const output = formatAgent(agent);
  assert.ok(output.includes("##"), "Should have markdown headers");
  assert.ok(output.includes("sonia"), "Should include agent name");
  assert.ok(output.includes("Capabilities"), "Should include capabilities");
  assert.ok(output.includes("Skills"), "Should include skills");
  assert.ok(output.includes("Permissions"), "Should include permissions");
});

test("(h.3) formatSkill produces markdown with all sections", () => {
  const catalog = getCatalog();
  const skill = catalog.skills.find(s => s.name === "api-design");
  assert.ok(skill, "Should find api-design skill");
  const output = formatSkill(skill);
  assert.ok(output.includes("##"), "Should have markdown headers");
  assert.ok(output.includes("api-design"), "Should include skill name");
  assert.ok(output.includes("Purpose"), "Should include purpose");
});

test("(h.4) formatCompactCommand returns compact one-liner", () => {
  const catalog = getCatalog();
  const cmd = catalog.commands.find(c => c.slash_command === "/araya:status");
  assert.ok(cmd, "Should find /araya:status");
  const output = formatCompactCommand(cmd);
  assert.ok(output.includes("/araya:status"), "Should include command name");
  assert.ok(output.length < 200, "Should be compact");
});

test("(h.5) formatCompactAgent returns compact agent line", () => {
  const catalog = getCatalog();
  const agent = catalog.agents.find(a => a.name === "valentina");
  assert.ok(agent, "Should find valentina");
  const output = formatCompactAgent(agent);
  assert.ok(output.includes("valentina"), "Should include agent name");
  assert.ok(output.length < 150, "Should be compact");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION I: searchCatalog() function
// ═════════════════════════════════════════════════════════════════════════

test("(i.1) searchCatalog finds by keyword", () => {
  const results = searchCatalog({ query: "security" });
  assert.ok(results.length > 0, "Should find security-related entries");
});

test("(i.2) searchCatalog filters by type", () => {
  const results = searchCatalog({ query: "api", type: "skill" });
  for (const r of results) {
    assert.equal(r.entry.type, "skill", `Entry ${r.entry.name} should be a skill`);
  }
});

test("(i.3) searchCatalog filters by domain", () => {
  const results = searchCatalog({ domain: "security" });
  for (const r of results) {
    assert.equal(r.entry.domain, "security", `Entry ${r.entry.name} should be security domain`);
  }
});

test("(i.4) searchCatalog results are sorted by relevance", () => {
  const results = searchCatalog({ query: "sonia" });
  if (results.length >= 2) {
    assert.ok(results[0].relevance >= results[1].relevance,
      "First result should have highest relevance");
  }
});

test("(i.5) searchCatalog with no query matches all", () => {
  const results = searchCatalog({});
  assert.ok(results.length > 100, "Should return many entries");
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION J: Fuzzy matching quality
// ═════════════════════════════════════════════════════════════════════════

test("(j.1) man with typo suggests correct name", () => {
  const output = man("sonai"); // typo for sonia
  assert.ok(
    output.includes("sonia") || output.includes("Not Found") || output.includes("Did you mean"),
    "Should find suggestion or show not found"
  );
});

test("(j.2) man with close match finds partial match", () => {
  const output = man("validat"); // partial of validate
  assert.ok(
    output.includes("validate") || output.includes("validation"),
    "Should find validate-related content"
  );
});

test("(j.3) manAgent with typo suggests close match", () => {
  const output = manAgent("valentna"); // typo for valentina
  assert.ok(
    output.includes("valentina") || output.includes("Did you mean"),
    "Should suggest valentina"
  );
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION K: Edge cases
// ═════════════════════════════════════════════════════════════════════════

test("(k.1) man with special characters handled gracefully", () => {
  const output = man("!@#$%");
  assert.ok(output.includes("Not Found"), "Special chars should trigger not found");
  assert.ok(output.includes("Suggestions") || output.includes("Try"), "Should give guidance");
});

test("(k.2) manSkill with empty string", () => {
  const output = manSkill("");
  assert.ok(output.includes("Not Found"), "Empty string should show not found");
});

test("(k.3) manAgent with empty string", () => {
  const output = manAgent("");
  assert.ok(output.includes("Not Found"), "Empty string should show not found");
});

test("(k.4) formatCommand handles command with no flags", () => {
  const catalog = getCatalog();
  const cmd = catalog.commands.find(c => c.slash_command === "/araya:version");
  assert.ok(cmd, "Should find /araya:version");
  const output = formatCommand(cmd);
  assert.ok(output.includes("/araya:version"), "Should render cleanly");
});

test("(k.5) formatAgent handles bare agent with bare_risk", () => {
  const catalog = getCatalog();
  const bareAgent = catalog.agents.find(a => a.agent_status === "bare");
  if (bareAgent) {
    const output = formatAgent(bareAgent);
    assert.ok(output.includes("Bare"), "Should mention bare status");
  }
});

test("(k.6) formatSkill handles orphan skill", () => {
  const catalog = getCatalog();
  const orphan = catalog.skills.find(s => s.is_orphan);
  if (orphan) {
    const output = formatSkill(orphan);
    assert.ok(output.includes("Orphan"), "Should mention orphan status");
  }
});

// ═════════════════════════════════════════════════════════════════════════
// SECTION L: Catalog integrity
// ═════════════════════════════════════════════════════════════════════════

test("(l.1) All agents have valid formatAgent output", () => {
  const catalog = getCatalog();
  for (const agent of catalog.agents) {
    const output = formatAgent(agent);
    assert.ok(output.includes(agent.name), `Agent ${agent.name} should appear in format output`);
  }
});

test("(l.2) All skills have valid formatSkill output", () => {
  const catalog = getCatalog();
  for (const skill of catalog.skills) {
    const output = formatSkill(skill);
    assert.ok(output.includes(skill.name), `Skill ${skill.name} should appear in format output`);
  }
});

test("(l.3) All commands have valid formatCommand output", () => {
  const catalog = getCatalog();
  for (const cmd of catalog.commands) {
    const output = formatCommand(cmd);
    assert.ok(output.includes(cmd.slash_command), `Command ${cmd.slash_command} should appear in format output`);
  }
});

test("(l.4) Catalog has expected counts", () => {
  const catalog = getCatalog();
  assert.ok(catalog.agents.length >= 25, "Should have at least 25 agents");
  assert.ok(catalog.skills.length >= 100, "Should have at least 100 skills");
  assert.ok(catalog.commands.length >= 30, "Should have at least 30 commands");
});

// ═════════════════════════════════════════════════════════════════════════
// Results
// ═════════════════════════════════════════════════════════════════════════

console.log(`\n${"─".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${"─".repeat(60)}\n`);

if (failed > 0) {
  process.exit(1);
}
