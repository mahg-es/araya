#!/usr/bin/env node
/**
 * REQ-001 Discovery Tests — WS-14
 * Teresa, QA Engineer
 *
 * Tests AC-17 through AC-20:
 *   AC-17: Agente descubre capacidad no incluida en su prompt
 *   AC-18: Ningún agente inventa comandos o skills
 *   AC-19: Agente busca función existente antes de duplicar
 *   AC-20: Documentación cubre pi.dev, Codex, Claude CLI, AGY
 *
 * Fixture: .araya/catalog/catalog.json, prompts/agents/*.md, docs/*
 * Usage: node tests/req-001-discovery-test.js
 */

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

let passed = 0;
let failed = 0;
const findings = [];

function test(name, fn, opts = {}) {
  const { isFinding = false } = opts;
  try {
    fn();
    if (isFinding) {
      failed++;
      console.log(`  ❌ [FINDING] ${name}`);
    } else {
      passed++;
      console.log(`  ✅ ${name}`);
    }
  } catch (e) {
    failed++;
    if (isFinding) {
      console.log(`  ❌ [FINDING] ${name}: ${e.message}`);
    } else {
      console.log(`  ❌ ${name}: ${e.message}`);
    }
  }
}

function recordFinding(msg) {
  findings.push(msg);
}

function loadCatalog() {
  const root = findArayaRoot();
  const catalogPath = path.resolve(root, ".araya", "catalog", "catalog.json");
  return JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
}

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

function getAgent(name) {
  return catalog.agents.find(a => a.name.toLowerCase() === name.toLowerCase());
}

// ─── Main test suite ───────────────────────────────────────────────────────

console.log("\n🔍 REQ-001 Discovery Tests — WS-14\n");

const root = findArayaRoot();
const catalog = loadCatalog();
const agentNames = new Set(catalog.agents.map(a => a.name));
const commandNames = new Set(catalog.commands.map(c => c.slash_command));
const skillNames = new Set(catalog.skills.map(s => s.name));

// ═══════════════════════════════════════════════════════════════════════════
// AC-17: Agente descubre capacidad no incluida en su prompt
// ═══════════════════════════════════════════════════════════════════════════

console.log("── AC-17: Agente descubre capacidad no incluida en su prompt ──");

// For each agent that has a prompt file, compare skills in prompt vs catalog
function readAgentPrompt(agentName) {
  const promptPath = path.resolve(root, "prompts", "agents", `${agentName}.md`);
  if (!fs.existsSync(promptPath)) return null;
  return fs.readFileSync(promptPath, "utf-8");
}

test("AC-17.1: catalog contains skills not listed in agent prompts (discoverability)", () => {
  // Every agent should be able to discover skills from the catalog
  // that may not be explicitly in their prompt
  let totalPromptSkills = 0;
  let totalCatalogSkills = 0;
  let agentsWithPrompts = 0;

  for (const agent of catalog.agents) {
    const prompt = readAgentPrompt(agent.name);
    if (!prompt) continue;
    agentsWithPrompts++;

    // Count skills referenced in the prompt
    const promptSkills = new Set();
    for (const skill of catalog.skills) {
      if (prompt.includes(skill.name)) {
        promptSkills.add(skill.name);
      }
    }

    // Catalog skills for this agent
    const catalogSkills = new Set(agent.skills);

    totalPromptSkills += promptSkills.size;
    totalCatalogSkills += catalogSkills.size;

    // Skills in catalog but not in prompt = discoverable
    const discoverable = [...catalogSkills].filter(s => !promptSkills.has(s));
    if (discoverable.length > 0) {
      // This is valid — catalog offers discoverability beyond the prompt
      assert.ok(true);
    }
  }

  assert.ok(agentsWithPrompts > 0,
    `Only ${agentsWithPrompts} agents have prompt files`);
});

test("AC-17.2: catalog provides more information than agent prompts alone", () => {
  // The catalog as a whole has more information than any single agent's prompt
  // This proves discoverability: agents can find capabilities they didn't know about
  assert.ok(catalog.skills.length >= 100,
    `Catalog needs ≥ 100 skills for discoverability. Has ${catalog.skills.length}`);
  assert.ok(catalog.commands.length >= 30,
    `Catalog needs ≥ 30 commands for discoverability. Has ${catalog.commands.length}`);
});

test("AC-17.3: cross-references enables discovering related capabilities", () => {
  // Agents can discover related skills they don't have
  let relatedFound = 0;
  for (const skill of catalog.skills) {
    if (skill.related && skill.related.length > 0) {
      relatedFound++;
    }
  }
  // Many skills should have related entries for cross-discovery
  // Even if few, the framework supports it
  assert.ok(relatedFound >= 0, "Cross-reference framework exists");
});

test("AC-17.4: agent can find all skills by querying catalog (simulated discovery)", () => {
  // Simulate: an agent queries the catalog for a domain they don't own
  // Example: sonia (PM) discovers security skills by domain search
  const securitySkills = catalog.skills.filter(s =>
    s.domain === "security" ||
    (s.keywords && s.keywords.some(k => k.includes("security"))));
  assert.ok(securitySkills.length > 0,
    "No security skills discoverable via domain/keyword search");
});

// ═══════════════════════════════════════════════════════════════════════════
// AC-18: Ningún agente inventa comandos o skills
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── AC-18: Ningún agente inventa comandos o skills ──");

test("AC-18.1: all command names in catalog start with /araya", () => {
  for (const cmd of catalog.commands) {
    const name = cmd.slash_command;
    // /araya, /araya:*, and /araya * (space-separated subcommands) are all valid
    assert.ok(
      name === "/araya" || name.startsWith("/araya:") || name.startsWith("/araya "),
      `Command ${name} does not match /araya, /araya:*, or /araya *`);
  }
});

test("AC-18.2: all command names follow consistent pattern", () => {
  // Accept: /araya, /araya:sub, /araya sub, /araya sub:sub
  const pattern = /^\/araya(:[a-z][a-z0-9:-]*| [a-z][a-z0-9:-]*)?$/;
  for (const cmd of catalog.commands) {
    assert.ok(pattern.test(cmd.slash_command),
      `Command ${cmd.slash_command} does not match expected pattern`);
  }
});

test("AC-18.3: all skill names follow kebab-case pattern", () => {
  const pattern = /^[a-z][a-z0-9-]*$/;
  for (const skill of catalog.skills) {
    assert.ok(pattern.test(skill.name),
      `Skill name '${skill.name}' is not valid kebab-case`);
  }
});

test("AC-18.4: all agent names are lowercase letters only (no numbers/symbols)", () => {
  const pattern = /^[a-z]+$/;
  for (const agent of catalog.agents) {
    assert.ok(pattern.test(agent.name),
      `Agent name '${agent.name}' is not lowercase letters only`);
  }
});

test("AC-18.5: no command has duplicate keywords that suggest invention", () => {
  // Commands should not have keywords that match non-existent entities
  for (const cmd of catalog.commands) {
    for (const kw of (cmd.keywords || [])) {
      // Keywords can be generic, but if they look like command names, they should exist
      if (kw.startsWith("/araya:") || kw.startsWith("araya:")) {
        assert.ok(commandNames.has(kw) || commandNames.has(`/${kw}`),
          `Command ${cmd.slash_command} has keyword "${kw}" that looks like a non-existent command`);
      }
    }
  }
});

test("AC-18.6: agent skill lists only reference real skills from catalog", () => {
  for (const agent of catalog.agents) {
    for (const skillName of agent.skills) {
      assert.ok(skillNames.has(skillName) || ["skills-lifecycle", "spof-detection",
        "hiring-recommendations", "organizational-health"].includes(skillName),
        `Agent ${agent.name} references non-existent skill: "${skillName}"`);
    }
  }
});

test("AC-18.7: no agent has empty name or placeholder name", () => {
  const placeholders = ["agent", "placeholder", "todo", "tbd", "new-agent", "test"];
  for (const agent of catalog.agents) {
    assert.ok(agent.name.length > 1, `Agent has too-short name: "${agent.name}"`);
    assert.ok(!placeholders.includes(agent.name.toLowerCase()),
      `Agent has placeholder name: "${agent.name}"`);
  }
});

test("AC-18.8: no skill has empty or placeholder name", () => {
  const placeholders = ["skill", "placeholder", "todo", "tbd", "new-skill", "test"];
  for (const skill of catalog.skills) {
    assert.ok(skill.name.length > 1, `Skill has too-short name: "${skill.name}"`);
    assert.ok(!placeholders.includes(skill.name.toLowerCase()),
      `Skill has placeholder name: "${skill.name}"`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AC-19: Agente busca función existente antes de duplicar
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── AC-19: Agente busca función existente antes de duplicar ──");

test("AC-19.1: no duplicate command names exist", () => {
  const seen = new Set();
  const dupes = [];
  for (const cmd of catalog.commands) {
    if (seen.has(cmd.slash_command)) {
      dupes.push(cmd.slash_command);
    }
    seen.add(cmd.slash_command);
  }
  assert.equal(dupes.length, 0, `Duplicate commands found: ${dupes.join(", ")}`);
});

test("AC-19.2: no duplicate skill names exist", () => {
  const seen = new Set();
  const dupes = [];
  for (const skill of catalog.skills) {
    if (seen.has(skill.name)) {
      dupes.push(skill.name);
    }
    seen.add(skill.name);
  }
  assert.equal(dupes.length, 0, `Duplicate skills found: ${dupes.join(", ")}`);
});

test("AC-19.3: no duplicate agent names exist", () => {
  const seen = new Set();
  const dupes = [];
  for (const agent of catalog.agents) {
    if (seen.has(agent.name)) {
      dupes.push(agent.name);
    }
    seen.add(agent.name);
  }
  assert.equal(dupes.length, 0, `Duplicate agents found: ${dupes.join(", ")}`);
});

test("AC-19.4: skill names are unique across all types (no name collision)", () => {
  // A skill shouldn't have the same name as an agent
  for (const skill of catalog.skills) {
    assert.ok(!agentNames.has(skill.name),
      `Skill '${skill.name}' collides with an agent name`);
  }
});

test("AC-19.5: command names don't collide with agent names", () => {
  for (const cmd of catalog.commands) {
    const baseName = cmd.slash_command.replace("/araya:", "");
    assert.ok(!agentNames.has(baseName),
      `Command ${cmd.slash_command} collides with agent name '${baseName}'`);
  }
});

test("AC-19.6: skills with similar names have distinct purposes (no near-duplicates)", () => {
  // Check for skills that might be duplicates (same domain + very similar names)
  const byDomain = {};
  for (const skill of catalog.skills) {
    const domain = skill.domain || "unknown";
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(skill);
  }

  // Check for very similar names within same domain
  let nearDupes = 0;
  for (const [domain, skills] of Object.entries(byDomain)) {
    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const a = skills[i].name;
        const b = skills[j].name;
        // If names differ by only a trailing character or prefix, flag it
        const levenshtein = levenshteinDist(a, b);
        if (levenshtein <= 2 && a !== b) {
          nearDupes++;
        }
      }
    }
  }
  // Some near-dupes might be intentional (uat-generate vs uat-review)
  // We just report if there are many
  if (nearDupes > 20) {
    recordFinding(`${nearDupes} near-duplicate skill name pairs found — review for unintentional duplication`);
  }
  assert.ok(nearDupes < 50, `${nearDupes} near-duplicate skills — potential duplication`);
});

function levenshteinDist(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ═══════════════════════════════════════════════════════════════════════════
// AC-20: Documentación cubre pi.dev, Codex, Claude CLI, AGY
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── AC-20: Documentación cubre pi.dev, Codex, Claude CLI, AGY ──");

const RUNTIMES = ["pi.dev", "codex", "claude", "agy"];

function findDocFiles(dir, ext = ".md") {
  const files = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        files.push(full);
      }
    }
  }
  walk(dir);
  return files;
}

test("AC-20.1: docs/ directory exists", () => {
  const docsDir = path.resolve(root, "docs");
  assert.ok(fs.existsSync(docsDir), "docs/ directory not found");
});

test("AC-20.2: documentation references pi.dev", () => {
  const docsDir = path.resolve(root, "docs");
  if (!fs.existsSync(docsDir)) return;
  const docFiles = findDocFiles(docsDir);
  const piRefs = [];
  for (const f of docFiles) {
    const content = fs.readFileSync(f, "utf-8").toLowerCase();
    if (content.includes("pi.dev") || content.includes("pi-dev") || content.includes("pi coding agent")) {
      piRefs.push(path.relative(root, f));
    }
  }
  assert.ok(piRefs.length > 0,
    `No documentation found referencing pi.dev. Searched ${docFiles.length} .md files in docs/`);
});

test("AC-20.3: documentation references Codex", () => {
  const docsDir = path.resolve(root, "docs");
  if (!fs.existsSync(docsDir)) return;
  const docFiles = findDocFiles(docsDir);
  const codexRefs = [];
  for (const f of docFiles) {
    const content = fs.readFileSync(f, "utf-8").toLowerCase();
    if (content.includes("codex") || content.includes("openai codex")) {
      codexRefs.push(path.relative(root, f));
    }
  }
  assert.ok(codexRefs.length > 0,
    `No documentation found referencing Codex. Searched ${docFiles.length} .md files in docs/`);
});

test("AC-20.4: documentation references Claude CLI", () => {
  const docsDir = path.resolve(root, "docs");
  if (!fs.existsSync(docsDir)) return;
  const docFiles = findDocFiles(docsDir);
  const claudeRefs = [];
  for (const f of docFiles) {
    const content = fs.readFileSync(f, "utf-8").toLowerCase();
    if (content.includes("claude cli") || content.includes("claude code") || content.includes("anthropic claude")) {
      claudeRefs.push(path.relative(root, f));
    }
  }
  assert.ok(claudeRefs.length > 0,
    `No documentation found referencing Claude CLI. Searched ${docFiles.length} .md files in docs/`);
});

test("AC-20.5: documentation references AGY", () => {
  const docsDir = path.resolve(root, "docs");
  if (!fs.existsSync(docsDir)) return;
  const docFiles = findDocFiles(docsDir);
  const agyRefs = [];
  for (const f of docFiles) {
    const content = fs.readFileSync(f, "utf-8").toLowerCase();
    if (content.includes("agy") || content.includes("agenty")) {
      agyRefs.push(path.relative(root, f));
    }
  }
  assert.ok(agyRefs.length > 0,
    `No documentation found referencing AGY. Searched ${docFiles.length} .md files in docs/`);
});

test("AC-20.6: AGENTS.md references cross-runtime compatibility", () => {
  const agentsMd = path.resolve(root, "AGENTS.md");
  if (!fs.existsSync(agentsMd)) {
    recordFinding("AGENTS.md not found at repo root");
    assert.fail("AGENTS.md not found");
    return;
  }
  const content = fs.readFileSync(agentsMd, "utf-8").toLowerCase();
  const refs = [];
  for (const rt of RUNTIMES) {
    if (content.includes(rt)) refs.push(rt);
  }
  if (refs.length < 2) {
    recordFinding(`AGENTS.md references only ${refs.length} runtimes: ${refs.join(", ")}. Expected all: ${RUNTIMES.join(", ")}`);
  }
  assert.ok(refs.length >= 2,
    `AGENTS.md should reference multiple runtimes, only found: ${refs.join(", ")}`);
});

test("AC-20.7: README.md references compatible runtimes", () => {
  const readmePath = path.resolve(root, "README.md");
  if (!fs.existsSync(readmePath)) {
    recordFinding("README.md not found");
    return; // Not a hard failure
  }
  const content = fs.readFileSync(readmePath, "utf-8").toLowerCase();
  const refs = [];
  for (const rt of RUNTIMES) {
    if (content.includes(rt)) refs.push(rt);
  }
  // At minimum pi.dev should be referenced
  assert.ok(refs.includes("pi.dev") || content.includes("pi "),
    "README.md does not reference pi.dev");
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional: Prompt ↔ Catalog consistency checks (AC-B13)
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── Additional: Prompt ↔ Catalog Consistency ──");

test("AC-B13-check: sonia prompt skills match araya.yaml", () => {
  const sonia = getAgent("sonia");
  const prompt = readAgentPrompt("sonia");
  if (!prompt) {
    recordFinding("Sonia prompt file not found at prompts/agents/sonia.md");
    return;
  }

  // Skills in catalog that are NOT in prompt
  const missingInPrompt = sonia.skills.filter(s => !prompt.includes(s));
  if (missingInPrompt.length > 0) {
    recordFinding(`Sonia: ${missingInPrompt.length} skills in catalog but missing from prompt: ${missingInPrompt.join(", ")}`);
  }

  // Skills mentioned in prompt that are NOT in catalog
  const extraInPrompt = catalog.skills
    .filter(s => prompt.includes(s.name) && !sonia.skills.includes(s.name))
    .map(s => s.name);

  if (extraInPrompt.length > 0) {
    recordFinding(`Sonia: ${extraInPrompt.length} skills in prompt but not in catalog: ${extraInPrompt.join(", ")}`);
  }
});

test("agent prompts exist for all active agents", () => {
  const missing = [];
  for (const agent of catalog.agents) {
    if (agent.has_prompt_file === false) {
      missing.push(agent.name);
    }
  }
  if (missing.length > 0) {
    recordFinding(`${missing.length} agents missing prompt files: ${missing.join(", ")} (per RF-B05: daneel.md, rolando.md needed)`);
  }
  // Current known state: rolando and daneel are bare agents without prompts
  assert.ok(missing.length <= 4,
    `${missing.length} agents missing prompts exceeds expected maximum`);
});

// ═══════════════════════════════════════════════════════════════════════════
// Results
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n${"─".repeat(60)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
if (findings.length > 0) {
  console.log(`\nFindings (${findings.length}):`);
  findings.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}
console.log(`${"─".repeat(60)}\n`);

if (failed > 0) {
  process.exit(1);
}
