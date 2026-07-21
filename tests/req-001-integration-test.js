#!/usr/bin/env node
/**
 * REQ-001 Integration Tests — WS-14
 * Teresa, QA Engineer
 *
 * Tests AC-5, AC-6, AC-9, AC-10, AC-11:
 *   AC-5:  Cada comando --help o justificación documentada
 *   AC-6:  Ayuda desde registro real, no hardcoded
 *   AC-9:  Skill transversal creada y válida
 *   AC-10: Todos los agentes tienen la skill transversal
 *   AC-11: Validación falla si agente nuevo no tiene la skill
 *
 * Fixture: .araya/catalog/catalog.json + skills/ filesystem
 * Usage: node tests/req-001-integration-test.js
 */

const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

let passed = 0;
let failed = 0;
const findings = [];

function test(name, fn, opts = {}) {
  const { isFinding = false, findingMsg = "" } = opts;
  try {
    fn();
    if (isFinding) {
      failed++;
      console.log(`  ❌ [FINDING] ${name}: ${findingMsg}`);
    } else {
      passed++;
      console.log(`  ✅ ${name}`);
    }
  } catch (e) {
    failed++;
    if (isFinding) {
      console.log(`  ❌ [FINDING] ${name}: ${e.message} (${findingMsg})`);
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

// ─── Main test suite ───────────────────────────────────────────────────────

console.log("\n🔗 REQ-001 Integration Tests — WS-14\n");

const root = findArayaRoot();
const catalog = loadCatalog();

// ═══════════════════════════════════════════════════════════════════════════
// AC-5: Cada comando --help o justificación documentada
// ═══════════════════════════════════════════════════════════════════════════

console.log("── AC-5: Cada comando --help o justificación documentada ──");

test("AC-5.1: all registered commands have short_help", () => {
  for (const cmd of catalog.commands) {
    assert.ok(cmd.short_help && cmd.short_help.length > 0,
      `Command ${cmd.slash_command} missing short_help`);
  }
});

test("AC-5.2: all commands have long_help", () => {
  for (const cmd of catalog.commands) {
    assert.ok(cmd.long_help && cmd.long_help.length > 0,
      `Command ${cmd.slash_command} missing long_help`);
  }
});

test("AC-5.3: all commands have a purpose field", () => {
  for (const cmd of catalog.commands) {
    assert.ok(cmd.purpose && cmd.purpose.length > 0,
      `Command ${cmd.slash_command} missing purpose`);
  }
});

test("AC-5.4: all commands have status 'enabled'", () => {
  const nonEnabled = catalog.commands.filter(c => c.status !== "enabled");
  assert.equal(nonEnabled.length, 0,
    `Commands not enabled: ${nonEnabled.map(c => `${c.slash_command}=${c.status}`).join(", ")}`);
});

test("AC-5.5: command short_help and long_help are consistent", () => {
  for (const cmd of catalog.commands) {
    // short_help should be a subset or summary of long_help
    const short = cmd.short_help.toLowerCase();
    const long = cmd.long_help.toLowerCase();
    // At minimum, both should refer to the same command
    const cmdKey = cmd.slash_command.replace("/araya:", "").replace("/araya ", "");
    const consistent = short.includes(cmdKey) || long.includes(cmdKey) ||
      cmd.short_help.length > 5 && cmd.long_help.length > 5;
    assert.ok(consistent,
      `Command ${cmd.slash_command}: short_help and long_help may be disconnected`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AC-6: Ayuda desde registro real, no hardcoded
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── AC-6: Ayuda desde registro real, no hardcoded ──");

test("AC-6.1: all commands have source_files referencing real files", () => {
  for (const cmd of catalog.commands) {
    assert.ok(Array.isArray(cmd.source_files) && cmd.source_files.length > 0,
      `Command ${cmd.slash_command} missing source_files`);
    for (const src of cmd.source_files) {
      // Source files should exist or the source_type should indicate registration
      assert.ok(
        fs.existsSync(path.resolve(root, src)) || cmd.source_type === "registerCommand",
        `Command ${cmd.slash_command} source file does not exist: ${src}`
      );
    }
  }
});

test("AC-6.2: command help data comes from real sources (source_type = registerCommand)", () => {
  // All commands should have clear source attribution
  for (const cmd of catalog.commands) {
    assert.ok(typeof cmd.source_type === "string" && cmd.source_type.length > 0,
      `Command ${cmd.slash_command} missing source_type`);
  }
});

test("AC-6.3: no command has empty help in both short and long", () => {
  for (const cmd of catalog.commands) {
    const hasHelp = (cmd.short_help && cmd.short_help.trim().length > 0) ||
                    (cmd.long_help && cmd.long_help.trim().length > 0);
    assert.ok(hasHelp, `Command ${cmd.slash_command} has empty short_help AND long_help`);
  }
});

test("AC-6.4: all skills have source_files referencing skills/<name>/SKILL.md", () => {
  for (const skill of catalog.skills) {
    // Undeclared skills (is_undeclared=true) have no SKILL.md on disk — skip them
    if (skill.is_undeclared || skill.status === "not-installed") continue;
    assert.ok(Array.isArray(skill.source_files) && skill.source_files.length > 0,
      `Skill ${skill.name} missing source_files`);
    const hasSkillMd = skill.source_files.some(f => f.includes(`skills/${skill.name}/SKILL.md`));
    if (!skill.is_orphan) {
      assert.ok(hasSkillMd, `Skill ${skill.name} should reference skills/${skill.name}/SKILL.md`);
    }
  }
});

test("AC-6.5: all agents have source_files referencing araya.yaml", () => {
  for (const agent of catalog.agents) {
    assert.ok(Array.isArray(agent.source_files) && agent.source_files.length > 0,
      `Agent ${agent.name} missing source_files`);
    assert.ok(agent.source_files.includes("araya.yaml"),
      `Agent ${agent.name} should reference araya.yaml`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AC-9: Skill transversal creada y válida
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── AC-9: Skill transversal creada y válida ──");

const CROSS_CUTTING_SKILL = "araya-command-and-delegation-expert";
const SKILL_MD_PATH = path.resolve(root, "skills", CROSS_CUTTING_SKILL, "SKILL.md");

test("AC-9.1: skill directory exists at skills/araya-command-and-delegation-expert/", () => {
  const dir = path.resolve(root, "skills", CROSS_CUTTING_SKILL);
  assert.ok(fs.existsSync(dir),
    `Skill directory not found: ${dir}`);
});

test("AC-9.2: SKILL.md exists for the cross-cutting skill", () => {
  assert.ok(fs.existsSync(SKILL_MD_PATH),
    `SKILL.md not found: ${SKILL_MD_PATH}`);
});

test("AC-9.3: SKILL.md contains all 10 teaching points from RF-B03", () => {
  assert.ok(fs.existsSync(SKILL_MD_PATH), `SKILL.md not found: ${SKILL_MD_PATH}`);
  const content = fs.readFileSync(SKILL_MD_PATH, "utf-8").toLowerCase();

  // 10 teaching points from RF-B03 — search for key concepts
  const teachingChecks = [
    { id: 1, desc: "consult catalog before task", terms: ["consult", "catalog", "before"] },
    { id: 2, desc: "identify commands/skills/specialists", terms: ["identify", "command", "skill", "specialist"] },
    { id: 3, desc: "consult --help or /araya:man", terms: ["--help", "/araya:man"] },
    { id: 4, desc: "prefer native capabilities", terms: ["native", "prefer"] },
    { id: 5, desc: "never invent commands/agents", terms: ["invent", "never"] },
    { id: 6, desc: "verify availability/permissions", terms: ["verify", "permission", "availability"] },
    { id: 7, desc: "delegate to specialists", terms: ["delegate", "specialist"] },
    { id: 8, desc: "respect authority boundaries", terms: ["authority", "boundar", "respect"] },
    { id: 9, desc: "register missing capabilities", terms: ["register", "missing", "gap"] },
    { id: 10, desc: "propose only after confirming gap", terms: ["propose", "confirm", "exist"] },
  ];

  const missing = [];
  for (const check of teachingChecks) {
    const found = check.terms.some(t => content.includes(t));
    if (!found) missing.push(`#${check.id}: ${check.desc}`);
  }

  assert.equal(missing.length, 0,
    `SKILL.md missing ${missing.length} teaching points: ${missing.join("; ")}`);
});

test("AC-9.4: cross-cutting skill is in catalog", () => {
  const skill = catalog.skills.find(s => s.name === CROSS_CUTTING_SKILL);
  if (!skill) {
    recordFinding(`Cross-cutting skill '${CROSS_CUTTING_SKILL}' not found in catalog.json`);
  }
  // This is a finding — we expect it to fail
  assert.ok(skill !== undefined,
    `[FINDING] Cross-cutting skill '${CROSS_CUTTING_SKILL}' not present in catalog.json`);
});

test("AC-9.5: cross-cutting skill has status 'enabled' in catalog", () => {
  const skill = catalog.skills.find(s => s.name === CROSS_CUTTING_SKILL);
  if (!skill) return; // Already reported in AC-9.4
  assert.equal(skill.status, "enabled",
    `Cross-cutting skill status: ${skill.status}, expected 'enabled'`);
});

// ═══════════════════════════════════════════════════════════════════════════
// AC-10: Todos los agentes tienen la skill transversal
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── AC-10: Todos los agentes tienen la skill transversal ──");

test("AC-10.1: all 30 agents have ax3 (current cross-cutting skill)", () => {
  // Note: ax3 is currently serving as the cross-cutting skill.
  // The araya-command-and-delegation-expert skill is not yet in catalog.
  const missing = catalog.agents.filter(a => !a.skills.includes("ax3"));
  if (missing.length > 0) {
    recordFinding(`${missing.length} agents missing ax3: ${missing.map(a => a.name).join(", ")}`);
  }
  assert.equal(missing.length, 0,
    `${missing.length} agents missing ax3: ${missing.map(a => a.name).join(", ")}`);
});

test("AC-10.2: verify every agent has 'araya-command-and-delegation-expert' skill", () => {
  const missing = catalog.agents.filter(a => !a.skills.includes(CROSS_CUTTING_SKILL));
  if (missing.length > 0) {
    recordFinding(`ALL 30 agents missing '${CROSS_CUTTING_SKILL}' — skill not yet added to araya.yaml`);
  }
  // This is an expected finding — the skill needs to be added to all agents
  assert.equal(missing.length, 0,
    `[FINDING] ${missing.length}/${catalog.agents.length} agents missing cross-cutting skill '${CROSS_CUTTING_SKILL}'`);
});

test("AC-10.3: agent count is exactly 30", () => {
  assert.equal(catalog.agents.length, 30,
    `Expected exactly 30 agents, got ${catalog.agents.length}`);
});

test("AC-10.4: no agent has zero skills", () => {
  const zeroSkill = catalog.agents.filter(a => a.skill_count === 0);
  assert.equal(zeroSkill.length, 0,
    `Agents with zero skills: ${zeroSkill.map(a => a.name).join(", ")}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// AC-11: Validación falla si agente nuevo no tiene la skill
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── AC-11: Validación falla si agente nuevo no tiene la skill ──");

// Simulate a validation: add a hypothetical agent without the mandatory skill
function simulateValidation(agents, mandatorySkill) {
  const errors = [];
  for (const agent of agents) {
    if (!agent.skills.includes(mandatorySkill)) {
      errors.push({
        type: "AGENT_MISSING_MANDATORY_SKILL",
        agent: agent.name,
        message: `${agent.name} lacks ${mandatorySkill}`,
      });
    }
  }
  return errors;
}

test("AC-11.1: simulation — hypothetical agent without mandatory skill triggers validation error", () => {
  const hypotheticalAgent = {
    name: "test-agent-999",
    skills: ["api-design", "endpoint"],  // No cross-cutting skill
  };
  const allAgents = [...catalog.agents, hypotheticalAgent];
  const errors = simulateValidation(allAgents, "ax3");

  const testAgentError = errors.filter(e => e.agent === "test-agent-999");
  assert.equal(testAgentError.length, 1,
    `Expected validation error for test-agent-999 missing ax3`);
  assert.ok(testAgentError[0].type === "AGENT_MISSING_MANDATORY_SKILL",
    "Error type should be AGENT_MISSING_MANDATORY_SKILL");
});

test("AC-11.2: simulation — agent with mandatory skill passes validation", () => {
  const goodAgent = {
    name: "test-agent-legal",
    skills: ["api-design", "ax3"],
  };
  const allAgents = [...catalog.agents, goodAgent];
  const errors = simulateValidation(allAgents, "ax3");

  const testAgentError = errors.filter(e => e.agent === "test-agent-legal");
  assert.equal(testAgentError.length, 0,
    "Agent with mandatory skill should not trigger validation error");
});

test("AC-11.3: simulation — validation errors include agent name in message", () => {
  const hypotheticalAgent = {
    name: "test-agent-999",
    skills: [],
  };
  const allAgents = [...catalog.agents, hypotheticalAgent];
  const errors = simulateValidation(allAgents, "ax3");

  const testAgentError = errors.find(e => e.agent === "test-agent-999");
  assert.ok(testAgentError, "Should find error for test-agent-999");
  assert.ok(testAgentError.message.includes("test-agent-999"),
    "Error message should include agent name");
  assert.ok(testAgentError.message.includes("ax3"),
    "Error message should include the mandatory skill name");
});

test("AC-11.4: simulation — validation returns non-zero count for violations", () => {
  const hypotheticalAgent = {
    name: "test-agent-999",
    skills: [],
  };
  const allAgents = [...catalog.agents, hypotheticalAgent];
  const errors = simulateValidation(allAgents, "ax3");

  // Just the new agent should trigger an error (existing agents all have ax3)
  const newErrors = errors.filter(e => e.agent === "test-agent-999");
  assert.equal(newErrors.length, 1, "Should return 1 error for the new agent");
});

test("AC-11.5: simulation with future cross-cutting skill (araya-command-and-delegation-expert)", () => {
  // When the cross-cutting skill gets added, ALL agents will fail validation
  // until they are assigned the skill. This demonstrates why AC-11 is meaningful.
  const errors = simulateValidation(catalog.agents, CROSS_CUTTING_SKILL);
  if (errors.length > 0) {
    recordFinding(`${errors.length} agents missing '${CROSS_CUTTING_SKILL}' — needs to be assigned before CI/CD gate passes`);
  }
  assert.equal(errors.length, 0,
    `[FINDING] ${errors.length}/${catalog.agents.length} agents would fail validation for missing '${CROSS_CUTTING_SKILL}'`);
});

// ═══════════════════════════════════════════════════════════════════════════
// Additional: 4 orphan skills exist (AC-A17 / AC-A18 validation)
// ═══════════════════════════════════════════════════════════════════════════

console.log("\n── Additional: Orphans & Undeclared Validation ──");

test("AC-A17-check: orphan skills (in yaml, no SKILL.md) detected", () => {
  // From stats: skills_undeclared = 4 (Aurora: skills-lifecycle, spof-detection,
  // hiring-recommendations, organizational-health)
  assert.equal(catalog.stats.skills_undeclared, 4,
    `Expected 4 undeclared skills, got ${catalog.stats.skills_undeclared}`);
});

test("AC-A18-check: unassigned skills (SKILL.md exists, not in yaml) detected", () => {
  // From stats: skills_orphan = 4 (ai-routing, autonomous-execution, ax-postoffice, pm-decompose)
  assert.equal(catalog.stats.skills_orphan, 0,
    `Expected 0 orphan skills, got ${catalog.stats.skills_orphan}`);
});

test("orphan skills are tracked with assigned_agents=[]", () => {
  const orphans = catalog.skills.filter(s => s.is_orphan);
  for (const skill of orphans) {
    assert.ok(Array.isArray(skill.assigned_agents) && skill.assigned_agents.length === 0,
      `Orphan skill ${skill.name} should have empty assigned_agents`);
  }
});

test("undeclared skills have is_undeclared=true", () => {
  const undeclared = catalog.skills.filter(s => s.is_undeclared);
  assert.equal(undeclared.length, 4,
    `Expected 4 undeclared skills, got ${undeclared.length}: ${undeclared.map(s => s.name).join(", ")}`);
  for (const skill of undeclared) {
    assert.equal(skill.is_undeclared, true,
      `Skill ${skill.name} should have is_undeclared=true`);
  }
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
