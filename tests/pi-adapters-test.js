#!/usr/bin/env node
// ARAYA Pi adapter tests (ponny-express-10010 PHASE 9/10/11).
// Verifies registration, delegation (no reimplemented logic), runtime loading
// via the same dist path the tools use, and PHASE 10 corrections.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}

console.log("Pi Adapter + Runtime Corrections Tests");
console.log("======================================");

const ext = fs.readFileSync(path.join(ROOT, "extensions", "araya", "index.ts"), "utf-8");

// ─── Registration ─────────────────────────────────────────────────────
for (const tool of ["araya_operation_resolve", "araya_operation_describe", "araya_git_merge_gate", "araya_git_repository_sanity", "araya_test_run"]) {
  check(`tool registered: ${tool}`, ext.includes(`name: "${tool}"`));
}
for (const cmd of ['"araya:operation"', '"araya:gate"', '"araya:git"', '"araya:test"']) {
  check(`slash command registered: ${cmd}`, ext.includes(`registerCommand(${cmd}`));
}
check("man --list operations flag", ext.includes('"--list operations"'));
check("man --operation flag", ext.includes('raw.startsWith("--operation ")'));
check("man --search extended with operations", /manSearch\(keyword\)[\s\S]{0,600}registry\.search\(keyword\)/.test(ext));

// ─── Delegation (no reimplemented gate logic) ─────────────────────────
const opsBlock = ext.slice(ext.indexOf("Governed Operations (ponny-express-10010)"));
check("tools delegate to registry.execute (merge-gate)", /araya_git_merge_gate[\s\S]{0,1500}registry\.execute\("git\.merge-gate"/.test(opsBlock));
check("tools delegate to registry.execute (sanity)", /araya_git_repository_sanity[\s\S]{0,900}registry\.execute\("git\.repository-sanity"/.test(opsBlock));
check("tools delegate to registry.execute (test suite)", /araya_test_run[\s\S]{0,900}registry\.execute\(params\.suite/.test(opsBlock));
check("tools delegate to registry.resolve (resolve)", /araya_operation_resolve[\s\S]{0,700}registry\.resolve\(params\.intent\)/.test(opsBlock));
check("operations block has NO execFileSync", !/execFileSync/.test(opsBlock));
check("operations block has NO direct git( calls", !/git\(root,/.test(opsBlock));

// ─── Runtime loading via the tools' own dist path ─────────────────────
(async () => {
  const registryPath = path.join(ROOT, "dist", "araya", "operations", "registry.js");
  check("dist registry exists (built)", fs.existsSync(registryPath));
  if (fs.existsSync(registryPath)) {
    const mod = await import(registryPath);
    const registry = new mod.OperationRegistry(ROOT);
    const { loaded, errors } = registry.load();
    check("registry loads via dist path (no errors)", errors.length === 0 && loaded === 18, errors.join(";").slice(0, 150));
    const r = registry.resolve("can I merge this PR");
    check("resolve via dist path returns git.merge-gate", r.operation_id === "git.merge-gate" && r.confidence === 1);
  }

  // ─── PHASE 10 corrections ─────────────────────────────────────────
  check("/araya run: tdd maps to clara", ext.includes('tdd: "clara"'));
  check("/araya run: no tdd/tests to teresa", !ext.includes('tdd: "teresa"') && !ext.includes('tests: "teresa"'));

  const persona = fs.readFileSync(path.join(ROOT, "extensions", "daneel-persona.ts"), "utf-8");
  check("persona: Daneel = Relay Controller / COORDINATOR", persona.includes("Role: Relay Controller (COORDINATOR)"));
  check("persona: no stale Independent Reality Verification Officer role", !persona.includes("Independent Reality Verification Officer"));
  check("persona: Teresa = Independent Test Gate", persona.includes("Teresa** — Independent Test Gate (TEST_GATE)"));
  check("persona: Giskard marked retired", /Giskard\*\* = retired/.test(persona));

  check("trace --validate: no hardcoded hasOrphans=false success", !ext.includes("const hasOrphans = false"));
  check("trace --validate: reports NOT_IMPLEMENTED", ext.includes("NOT_IMPLEMENTED — orphan detection is not implemented"));

  check("version: no hardcoded '120 skills | 25 agents'", !ext.includes("120 skills | 25 agents"));
  check("version: computes counts", ext.includes("computedAgents") && ext.includes("computedSkills"));
  check("version: labels static docs explicitly", ext.includes("Static documentation"));

  console.log("");
  if (failures.length) {
    console.log("Failures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
  }
  console.log("\n══════════════════════════════════════════════════");
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log("══════════════════════════════════════════════════");
  process.exit(failed ? 1 : 0);
})();
