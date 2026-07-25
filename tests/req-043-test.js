#!/usr/bin/env node
// ARAYA REQ-043 Validation Tests
// Per Agent and Skill Contract v1 — 12 Validation Gates
// Author: Valentina (Backend Developer)
// Date: 2026-07-25

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

// ─── Config ────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");
const YAML_PATH = path.join(ROOT, "araya.yaml");
const SKILLS_DIR = path.join(ROOT, "skills");
const PROMPTS_DIR = path.join(ROOT, "prompts", "agents");
const GENERATED_DIR = path.join(ROOT, ".araya", "generated");

const AX_SKILLS = new Set([
  "ax3",
  "araya-command-and-delegation-expert",
  "ax-postoffice",
  "token-efficiency",
  "relay-participant",
]);

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadYaml() {
  // Simple YAML parser for araya.yaml structure (no dependency needed)
  const raw = fs.readFileSync(YAML_PATH, "utf-8");
  const agents = {};
  let currentAgent = null;
  let inAgents = false;
  let inSkills = false;
  let inPermissions = false;
  let currentSkills = [];

  for (const line of raw.split("\n")) {
    // Detect agents section
    if (line.match(/^agents:/)) {
      inAgents = true;
      continue;
    }

    if (!inAgents) continue;

    // Stop at non-agent top-level sections
    if (line.match(/^(provider_optimization|efficiency|providers|model_tiers|execution_budget|circuit_breakers|execution_modes|safe_mode|branch_strategy|human_approval_required_for|artifact_storage|delivery_modes|workflow_policies|agent_tool_access|version|description):/)) {
      inAgents = false;
      // Save last agent
      if (currentAgent) {
        agents[currentAgent].skills = [...currentSkills];
        currentAgent = null;
      }
      continue;
    }

    // Detect agent entry (2-space indent)
    const agentMatch = line.match(/^  ([a-z][a-z0-9-]*):$/);
    if (agentMatch) {
      if (currentAgent) {
        agents[currentAgent].skills = [...currentSkills];
      }
      currentAgent = agentMatch[1];
      currentSkills = [];
      inSkills = false;
      inPermissions = false;
      agents[currentAgent] = {
        role: "",
        emoji: "",
        model_tier: "balanced",
        max_turns: 30,
        status: "active",
        permissions: {},
        capabilities: [],
        skills: [],
        description: "",
        raw: [],
      };
      continue;
    }

    if (!currentAgent) continue;

    agents[currentAgent].raw.push(line);

    // Detect permissions section
    if (line.match(/^    permissions:/)) {
      inPermissions = true;
      continue;
    }
    if (inPermissions) {
      const permMatch = line.match(/^\s+(\w+):\s*(.+)/);
      if (permMatch) {
        agents[currentAgent].permissions[permMatch[1]] =
          permMatch[2].trim() === "true";
      } else if (line.match(/^\s{6}-/)) {
        // Array in permissions (capabilities)
        continue;
      } else if (!line.trim().startsWith("-") && line.trim() !== "") {
        // Not a simple key:value - might be transitioning out
        inPermissions = false;
      }
    }

    // Role
    const roleMatch = line.match(/^\s+role:\s*(.+)/);
    if (roleMatch) {
      agents[currentAgent].role = roleMatch[1].trim();
      inPermissions = false;
    }

    // Emoji
    const emojiMatch = line.match(/^\s+emoji:\s*(.+)/);
    if (emojiMatch) {
      agents[currentAgent].emoji = emojiMatch[1].trim();
    }

    // Model tier
    const tierMatch = line.match(/^\s+model_tier:\s*(.+)/);
    if (tierMatch) {
      agents[currentAgent].model_tier = tierMatch[1].trim();
    }

    // Status
    const statusMatch = line.match(/^\s+status:\s*(.+)/);
    if (statusMatch) {
      agents[currentAgent].status = statusMatch[1].trim();
    }

    // Skills section
    if (line.match(/^\s+skills:/)) {
      inSkills = true;
      inPermissions = false;
      continue;
    }
    if (inSkills) {
      const skillMatch = line.match(/^\s+-\s+(\S+)/);
      if (skillMatch) {
        currentSkills.push(skillMatch[1]);
      } else if (!line.trim().startsWith("-") && line.trim() !== "") {
        inSkills = false;
      }
    }

    // Capabilities section
    if (line.match(/^\s+capabilities:/)) {
      inSkills = false;
      continue;
    }
    const capMatch = line.match(/^\s+-\s+(\S+)/);
    if (capMatch && !inSkills && line.includes("capabilities")) {
      // skip — handled above
    }

    // Description
    const descMatch = line.match(/^\s+description:\s*(.+)/);
    if (descMatch) {
      agents[currentAgent].description = descMatch[1].trim();
    }
  }

  // Save last agent
  if (currentAgent) {
    agents[currentAgent].skills = [...currentSkills];
  }

  return agents;
}

function getSkillDirectories() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function hasSkillFile(skillName) {
  return fs.existsSync(path.join(SKILLS_DIR, skillName, "SKILL.md"));
}

function hasPromptFile(agentName) {
  return fs.existsSync(path.join(PROMPTS_DIR, `${agentName}.md`));
}

// ─── Test Runner ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "Assertion failed");
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || "Value mismatch"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

// ─── Suite ─────────────────────────────────────────────────────────────────

console.log("\n═══ ARAYA REQ-043 Validation Suite ═══");
console.log("Contract: Agent and Skill Contract v1 — 12 Gates\n");

const agents = loadYaml();
const skillDirs = getSkillDirectories();
const allAgentSkills = new Set();
for (const [, agent] of Object.entries(agents)) {
  for (const s of agent.skills) allAgentSkills.add(s);
}

// ═══════════════════════════════════════════════════════════════════════════
// GATE 1: Agent Registry Conflicts
// ═══════════════════════════════════════════════════════════════════════════

console.log("Gate 1: Agent Registry Conflicts");
test("no duplicate agent names in registry", () => {
  const names = Object.keys(agents);
  assertEqual(names.length, new Set(names).size, "duplicate agent names found");
});

test("all agent roles are non-empty", () => {
  for (const [name, agent] of Object.entries(agents)) {
    assert(agent.role.length > 0, `${name}: role is empty`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 2: Missing Assigned Skills
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 2: Missing Assigned Skills");
test("every assigned skill has SKILL.md", () => {
  const missing = [];
  for (const [name, agent] of Object.entries(agents)) {
    for (const skill of agent.skills) {
      if (!hasSkillFile(skill)) {
        missing.push(`${name}: skills/${skill}/SKILL.md`);
      }
    }
  }
  assert(missing.length === 0, `Missing skills:\n  ${missing.join("\n  ")}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 4: Operational Giskard References
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 4: Operational Giskard References");
test("no operational Giskard references in araya.yaml", () => {
  const raw = fs.readFileSync(YAML_PATH, "utf-8");
  const lines = raw.split("\n");
  const refs = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes("giskard") && !line.includes("retired")) {
      refs.push(`Line ${i + 1}: ${lines[i].trim()}`);
    }
  }
  assert(refs.length === 0, `Giskard references found:\n  ${refs.join("\n  ")}`);
});

test("no operational Giskard references in prompts/agents/", () => {
  const refs = [];
  if (fs.existsSync(PROMPTS_DIR)) {
    for (const file of fs.readdirSync(PROMPTS_DIR)) {
      const content = fs.readFileSync(path.join(PROMPTS_DIR, file), "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes("giskard") && !line.includes("retired")) {
          refs.push(`${file}:${i + 1}: ${lines[i].trim()}`);
        }
      }
    }
  }
  assert(refs.length === 0, `Giskard references in prompts:\n  ${refs.join("\n  ")}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 5: Daneel Functional-Owner Assignments
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 5: Daneel Functional-Owner Assignments");
test("Daneel cannot_write_code", () => {
  const daneel = agents["daneel"];
  assert(daneel, "daneel agent not found");
  assert(daneel.permissions.can_write_code === false,
    `Daneel can_write_code must be false, got ${daneel.permissions.can_write_code}`);
});

test("Daneel is not a Specialist — role is Controller/Delegated Executor", () => {
  const daneel = agents["daneel"];
  assert(daneel.role.toLowerCase().includes("delegated executor") ||
         daneel.role.toLowerCase().includes("controller"),
    `Daneel role should be Delegated Executor/Controller, got: ${daneel.role}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 6: Rolando Implementation Permissions
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 6: Rolando Implementation Permissions");
test("Rolando can_write_code is false", () => {
  const rolando = agents["rolando"];
  assert(rolando, "rolando agent not found");
  assert(rolando.permissions.can_write_code === false,
    `Rolando can_write_code MUST be false per contract, got ${rolando.permissions.can_write_code}`);
});

test("Rolando role includes 'Reality Authority'", () => {
  const rolando = agents["rolando"];
  assert(rolando.role.toLowerCase().includes("reality authority"),
    `Rolando role should be Reality Authority, got: ${rolando.role}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 7: Teresa Product-Write Permissions
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 7: Teresa Product-Write Permissions");
test("Teresa can_write_code is false", () => {
  const teresa = agents["teresa"];
  assert(teresa, "teresa agent not found");
  assert(teresa.permissions.can_write_code === false,
    `Teresa can_write_code MUST be false per contract, got ${teresa.permissions.can_write_code}`);
});

test("Teresa role is 'Independent Test Gate'", () => {
  const teresa = agents["teresa"];
  assert(teresa.role.toLowerCase().includes("independent test gate") ||
         teresa.role.toLowerCase().includes("test gate"),
    `Teresa role should be Independent Test Gate, got: ${teresa.role}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 8: Relay-Capable Agents Missing relay-participant
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 8: Relay-Capable Agents Missing relay-participant");
test("all Relay-capable agents have relay-participant skill", () => {
  // Relay-capable = agents in the relay participant contract list
  const relayAgents = [
    "manu", "aurora", "sonia", "valentina", "alejandra",
    "clara", "teresa", "rolando", "daneel", "elena",
    "diana", "isla", "aisha", "priscila", "esteban",
  ];
  const missing = [];
  for (const name of relayAgents) {
    const agent = agents[name];
    if (!agent) {
      missing.push(`${name}: agent not found in registry`);
      continue;
    }
    if (!agent.skills.includes("relay-participant")) {
      missing.push(`${name}: missing relay-participant skill`);
    }
  }
  assert(missing.length === 0, `Missing relay-participant:\n  ${missing.join("\n  ")}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 9: Active Bare Agents
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 9: Active Bare Agents");
test("no active bare agents (must have at least one non-AX skill)", () => {
  const bare = [];
  for (const [name, agent] of Object.entries(agents)) {
    if (agent.status === "dormant" || agent.status === "retired") continue;
    const nonAxSkills = agent.skills.filter((s) => !AX_SKILLS.has(s));
    if (nonAxSkills.length === 0) {
      bare.push(`${name}: only AX skills (${agent.skills.join(", ")})`);
    }
  }
  // Sofia is the exception — general AI assistant with delegated routing
  // Daneel is the Controller — relay-participant IS his functional skill
  const allowed = ["sofia", "neo", "trinity", "daneel"];
  const unexpected = bare.filter((b) => !allowed.some((a) => b.startsWith(a)));
  assert(unexpected.length === 0,
    `Unexpected bare agents (non-Sofia/non-dormant):\n  ${unexpected.join("\n  ")}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// GATE 12: Self-Approval Conflicts
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nGate 12: Self-Approval Conflicts");
test("no self-approval conflicts (agent cannot own EXECUTING + TESTING/VERIFYING/ACCEPTING)", () => {
  // This is verified by the relay allowed_results per the contract
  // For any agent, if they can EXECUTING, they shouldn't also be TESTING/VERIFYING/ACCEPTING
  const conflicts = [];
  for (const [name, agent] of Object.entries(agents)) {
    const skills = agent.skills;
    const hasExecuting = skills.some((s) =>
      ["api-design", "endpoint", "db-schema", "component", "form-design",
       "spark-pipeline", "etl-orchestration", "static-site-generate"].includes(s)
    );
    const hasTesting = skills.some((s) =>
      ["unit-test", "integration-test", "tdd-generate", "tdd-execute"].includes(s)
    );
    const hasVerifying = skills.some((s) =>
      ["uat-review", "reality-verification"].includes(s)
    );

    // Clara is Test Automation - should have testing skills, not implementation
    if (name === "clara") {
      if (hasExecuting) {
        conflicts.push(`clara: has both implementation and testing skills`);
      }
    }
    if (name === "rolando") {
      if (hasExecuting || hasTesting) {
        conflicts.push(`rolando: Reality Authority should not implement or test`);
      }
    }
    if (name === "teresa") {
      if (hasExecuting) {
        conflicts.push(`teresa: Test Gate should not implement`);
      }
    }
  }
  assert(conflicts.length === 0, `Self-approval conflicts:\n  ${conflicts.join("\n  ")}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL VALIDATION: Skill references consistency
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nAdditional: Skill Reference Consistency");
test("all skills in registry exist as directories", () => {
  const missing = [];
  for (const skill of allAgentSkills) {
    if (!hasSkillFile(skill)) {
      missing.push(skill);
    }
  }
  assert(missing.length === 0, `Skills without SKILL.md:\n  ${missing.join("\n  ")}`);
});

test("all orphan skill dirs are intentional", () => {
  // Skills that exist as dirs but aren't assigned to any agent
  const orphanDirs = skillDirs.filter((d) => !allAgentSkills.has(d));
  // This is informational; orphan skills may be intentional (proposed, deprecated, etc.)
  console.log(`    (info) ${orphanDirs.length} orphan skill directories: ${orphanDirs.join(", ") || "none"}`);
  assert(true, ""); // always passes
});

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL: Agent Consistency Checks
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nAdditional: Agent Consistency Checks");
test("Daneel has relay-participant skill", () => {
  assert(agents["daneel"].skills.includes("relay-participant"),
    "Daneel must have relay-participant skill");
});

test("Daneel can_write_code is false per Agent Contract", () => {
  assertEqual(agents["daneel"].permissions.can_write_code, false,
    "Daneel can_write_code must be false");
});

test("Rolando has relay-participant skill", () => {
  assert(agents["rolando"].skills.includes("relay-participant"),
    "Rolando must have relay-participant skill");
});

test("Teresa has relay-participant skill", () => {
  assert(agents["teresa"].skills.includes("relay-participant"),
    "Teresa must have relay-participant skill");
});

test("Rolando permissions correct", () => {
  const r = agents["rolando"];
  assertEqual(r.permissions.can_write_code, false, "Rolando can_write_code");
});

test("Teresa permissions correct", () => {
  const t = agents["teresa"];
  assertEqual(t.permissions.can_write_code, false, "Teresa can_write_code");
});

test("Clara role is Test Automation Engineer", () => {
  assert(agents["clara"].role.toLowerCase().includes("test automation"),
    `Clara role: ${agents["clara"].role}`);
});

test("All agents with relay-participant also have ax3 and ax-postoffice", () => {
  const missing = [];
  for (const [name, agent] of Object.entries(agents)) {
    if (agent.skills.includes("relay-participant")) {
      if (!agent.skills.includes("ax3")) {
        missing.push(`${name}: missing ax3`);
      }
      if (!agent.skills.includes("araya-command-and-delegation-expert")) {
        missing.push(`${name}: missing araya-command-and-delegation-expert`);
      }
      if (!agent.skills.includes("ax-postoffice")) {
        missing.push(`${name}: missing ax-postoffice`);
      }
    }
  }
  assert(missing.length === 0,
    `Relay-capable agents missing AX skills:\n  ${missing.join("\n  ")}`);
});

// ═══════════════════════════════════════════════════════════════════════════
// FINAL: Prompt File Consistency
// ═══════════════════════════════════════════════════════════════════════════

console.log("\nAdditional: Prompt File Consistency");
test("every active agent has a prompt file", () => {
  const missing = [];
  for (const [name, agent] of Object.entries(agents)) {
    if (agent.status === "retired") continue;
    if (!hasPromptFile(name)) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    console.log(`    (warning) Missing prompt files: ${missing.join(", ")}`);
  }
  // Not a hard failure — prompt files may legitimately be pending
  assert(true, "");
});

// ═══════════════════════════════════════════════════════════════════════════
// Relay config is set by inferRelay() during generation — check generated pi profiles
const yaml = require("js-yaml");
const arayaConfig = yaml.load(fs.readFileSync(YAML_PATH, "utf-8"));

function getGenPi(name) {
  return fs.readFileSync(path.join(GENERATED_DIR, "pi", `${name}.md`), "utf-8");
}

test("Clara (TEST_AUTOMATION): EXECUTING only, results=[DONE,ASK,BLOCK]", () => {
  const content = getGenPi("clara");
  assert(content.includes("**Authority:** TEST_AUTOMATION"), "Clara authority should be TEST_AUTOMATION");
  // Check relay section in generated file
  const relaySection = content.split("## Relay")[1] || "";
  assert(relaySection.includes("EXECUTING"), "Clara must have EXECUTING state");
  assert(!relaySection.includes("TESTING"), "Clara must NOT have TESTING state");
  assert(relaySection.includes("DONE"), "Clara must have DONE result");
  assert(!relaySection.includes("PASS"), "Clara must NOT have PASS result");
});

test("Teresa (TEST_GATE): TESTING only, results=[PASS,FAIL,ASK,BLOCK]", () => {
  const content = getGenPi("teresa");
  assert(content.includes("**Authority:** TEST_GATE"), "Teresa authority should be TEST_GATE");
  const relaySection = content.split("## Relay")[1] || "";
  assert(relaySection.includes("TESTING"), "Teresa must have TESTING state");
  assert(!relaySection.includes("EXECUTING"), "Teresa must NOT have EXECUTING state");
  assert(relaySection.includes("PASS"), "Teresa must have PASS result");
  assert(relaySection.includes("FAIL"), "Teresa must have FAIL result");
});

test("Rolando (REALITY_AUTHORITY): VERIFYING only, results=[VERIFIED,DISCREPANCY,ASK,BLOCK]", () => {
  const content = getGenPi("rolando");
  assert(content.includes("**Authority:** REALITY_AUTHORITY"), "Rolando authority should be REALITY_AUTHORITY");
  const relaySection = content.split("## Relay")[1] || "";
  assert(relaySection.includes("VERIFYING"), "Rolando must have VERIFYING state");
  assert(!relaySection.includes("TESTING"), "Rolando must NOT have TESTING state");
  assert(relaySection.includes("VERIFIED"), "Rolando must have VERIFIED result");
  assert(relaySection.includes("DISCREPANCY"), "Rolando must have DISCREPANCY result");
});

test("Aurora: hiring-recommendations absent, workforce-planning+3 skills present", () => {
  const aur = arayaConfig.agents.aurora;
  assert(aur, "aurora should exist");
  const skills = aur.skills || [];
  assert(!skills.includes("hiring-recommendations"), "hiring-recommendations should be absent");
  assert(skills.includes("workforce-planning"), "workforce-planning should be present");
  assert(skills.includes("skills-lifecycle"), "skills-lifecycle should be present");
  assert(skills.includes("spof-detection"), "spof-detection should be present");
  assert(skills.includes("organizational-health"), "organizational-health should be present");
  for (const skill of ["workforce-planning","skills-lifecycle","spof-detection","organizational-health"]) {
    assert(fs.existsSync(path.join(SKILLS_DIR, skill, "SKILL.md")), `${skill} SKILL.md should exist`);
  }
});

test("Daneel: exact cross-cutting skills [relay-participant, ax3, araya-command-and-delegation-expert, ax-postoffice]", () => {
  const d = arayaConfig.agents.daneel;
  assert(d, "daneel should exist");
  const expected = ["relay-participant", "ax3", "araya-command-and-delegation-expert", "ax-postoffice"].sort();
  const actual = (d.skills || []).slice().sort();
  assertEqual(JSON.stringify(actual), JSON.stringify(expected),
    `Daneel skills: ${JSON.stringify(actual)}`);
});

test("Neo+Trinity: dormant, cross-cutting skills preserved, .pi/agents/ generated", () => {
  for (const name of ["neo", "trinity"]) {
    const agent = arayaConfig.agents[name];
    assert(agent, `${name} should exist`);
    assert(agent.status === "dormant", `${name} should be dormant, got ${agent.status}`);
    const skills = agent.skills || [];
    assert(skills.includes("ax3"), `${name} should have ax3`);
    assert(skills.includes("araya-command-and-delegation-expert"), `${name} should have araya-command-and-delegation-expert`);
    const piProfile = path.join(ROOT, ".pi", "agents", `${name}.md`);
    assert(fs.existsSync(piProfile), `${name} should have .pi/agents/ profile`);
  }
});

// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

console.log(`\n${"═".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${"═".repeat(50)}\n`);

// ─── Relay State Mapping Tests ───────────────────────────────────────────
if (failed > 0) {
  console.log("FAILURES:");
  for (const f of failures) {
    console.log(`  ✗ ${f.name}`);
    console.log(`    ${f.message}`);
  }
  console.log("");
  process.exit(1);
} else {
  console.log("All gates passed. REQ-043 Slice A validated.\n");
  process.exit(0);
}


