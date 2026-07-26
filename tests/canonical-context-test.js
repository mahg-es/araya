#!/usr/bin/env node
// ARAYA Canonical-Context Giskard-Retirement Tests
// Per ponny-express-10007 FASE 3.3: .araya/CANONICAL-CONTEXT.md must not assert
// present-tense operational claims about Giskard (retired 2026-07-20).
// Historical mentions are allowed only when clearly marked retired/historical/
// superseded/non-operational.
// Author: Daneel (Relay Controller) — BATCH-TRUTH-CONTINUITY-20260726

const fs = require("node:fs");
const path = require("node:path");

const CTX = path.join(__dirname, "..", ".araya", "CANONICAL-CONTEXT.md");
const text = fs.readFileSync(CTX, "utf-8");

let passed = 0;
let failed = 0;
const failures = [];

function check(label, cond) {
  if (cond) passed++;
  else { failed++; failures.push(label); }
}

console.log("Canonical-Context Giskard-Retirement Validation");
console.log("===============================================");

// Operational claims that must be absent
check("no 'reports to Giskard'", !/reports to Giskard/i.test(text));
check("no \"Giskard's delegated executor\"", !/Giskard's delegated executor/i.test(text));
check("no 'Giskard is the single cross-project coordinator'", !/Giskard is the single cross-project coordinator/i.test(text));
check("no 'Giskard reviews/dispatches'", !/Giskard reviews\/dispatches/i.test(text));
check("no 'When Giskard needs the Professor'", !/When Giskard needs the Professor/i.test(text));

// Every remaining Giskard mention must be retirement-marked
const giskardLines = text.split("\n").filter((l) => /giskard/i.test(l));
check(
  "remaining Giskard mentions are marked retired/superseded/non-operational",
  giskardLines.every((l) => /retired|superseded|non-operational|historical/i.test(l))
);

// Expected current authority model present
check("authority: Professor=STRATEGIC", /Professor=STRATEGIC/.test(text));
check("authority: Daneel=COORDINATE (Relay Controller)", /Daneel=COORDINATE/.test(text));
check("authority: Clara=TEST_AUTOMATION", /Clara=TEST_AUTOMATION/.test(text));
check("authority: Teresa=TEST_GATE", /Teresa=TEST_GATE/.test(text));
check("authority: Rolando=REALITY_AUTHORITY", /Rolando=REALITY_AUTHORITY/.test(text));
check("authority: Giskard=retired", /Giskard=\*\*retired\*\*|Giskard=retired/i.test(text));
check("multi-project model: Daneel is the single cross-project coordinator", /Daneel is the single cross-project coordinator/.test(text));

console.log("");
if (failures.length > 0) {
  console.log("Failures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");

if (failed > 0) {
  console.log("\nCanonical-context Giskard-retirement validation FAILED.");
  process.exit(1);
}
console.log("\nCANONICAL-CONTEXT aligned: Giskard retired, current authority model canonical.");
process.exit(0);
