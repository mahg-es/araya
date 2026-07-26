#!/usr/bin/env node
// ARAYA Sonia Role-Mapping Tests
// Per ponny-express-10007 FASE 3.2 canonical state:
//   Clara = Test Automation Engineer (TEST_AUTOMATION, Relay EXECUTING, writes/executes tests, never PASS/FAIL)
//   Teresa = Independent Test Gate (TEST_GATE, Relay TESTING, binding PASS/FAIL, never implements)
// Sonia's prompt (roster, phase map, delegation examples, tool permissions, quality gates)
// must deploy Clara for test authoring/execution and Teresa only as the independent gate.
// Author: Daneel (Relay Controller) — BATCH-TRUTH-CONTINUITY-20260726

const fs = require("node:fs");
const path = require("node:path");

const SONIA = path.join(__dirname, "..", "prompts", "agents", "sonia.md");
const text = fs.readFileSync(SONIA, "utf-8");

let passed = 0;
let failed = 0;
const failures = [];

function check(label, cond) {
  if (cond) passed++;
  else { failed++; failures.push(label); }
}

console.log("Sonia Role-Mapping Validation");
console.log("=============================");

// Clara present and correctly positioned
check("roster: Clara listed as Test Automation Engineer", /\|\s*\*\*Clara\*\*\s*\|\s*Test Automation Engineer/.test(text));
check("roster: Clara carries test-authoring skills", /Clara[\s\S]{0,220}tdd-generate/.test(text));
check("roster: Clara scoped to TEST_AUTOMATION / EXECUTING", /Clara[\s\S]{0,400}TEST_AUTOMATION[\s\S]{0,80}EXECUTING/.test(text));
check("roster: Clara never emits PASS/FAIL (stated)", /Clara[\s\S]{0,400}never emits PASS\/FAIL/.test(text));

// Teresa repositioned as gate only
check("roster: Teresa listed as Independent Test Gate", /\|\s*\*\*Teresa\*\*\s*\|\s*Independent Test Gate/.test(text));
check("roster: Teresa scoped to TEST_GATE / TESTING", /Teresa[\s\S]{0,400}TEST_GATE[\s\S]{0,80}TESTING/.test(text));
check("roster: Teresa emits binding PASS/FAIL (stated)", /Teresa[\s\S]{0,400}binding PASS\/FAIL/.test(text));
check("roster: Teresa never implements (stated)", /Teresa[\s\S]{0,400}[Nn]ever implements/.test(text));
check("roster: no stale 'Teresa | QA Engineer' row", !/\|\s*\*\*Teresa\*\*\s*\|\s*QA Engineer/.test(text));

// Phase map + delegation examples
check("phase map: tdd/tests routes to clara", /\|\s*tdd \/ tests\s*\|\s*clara\s*\|/.test(text));
check("phase map: Relay TESTING gate routes to teresa", /\|\s*Relay TESTING gate\s*\|\s*teresa\s*\|/.test(text));
check("delegation example: 'Use clara to generate tests'", /Use clara to generate tests/.test(text));
check("delegation example: no 'Use teresa to generate tests'", !/Use teresa to generate tests/i.test(text));
check("monitoring example: Clara completed tests", /Sonia monitoring: Clara completed tests/.test(text));

// Tool permissions + quality gates
check("full-access list includes Clara", /full-access agents:[^\n]*Clara/.test(text));
check("full-access list excludes Teresa", !/full-access agents:[^\n]*Teresa/.test(text));
check("quality gate: ACs verified by Clara/Priya", /QA Verified ACs\*\*: Clara\/Priya/.test(text));

console.log("");
if (failures.length > 0) {
  console.log("Failures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");

if (failed > 0) {
  console.log("\nSonia role-mapping validation FAILED.");
  process.exit(1);
}
console.log("\nSonia prompt aligned with Clara=TEST_AUTOMATION, Teresa=TEST_GATE.");
process.exit(0);
