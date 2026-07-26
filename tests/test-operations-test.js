#!/usr/bin/env node
// ARAYA test.* wrapper operations tests (ponny-express-10010 PHASE 11).
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}
function cli(args) {
  try {
    const out = execFileSync("npx", ["tsx", "src/cli.ts", ...args], { cwd: ROOT, encoding: "utf-8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout ?? "") + String(e.stderr ?? "") };
  }
}
function jsonOut(r) {
  const t = r.out;
  const starts = ["{", "["].map((c) => t.indexOf(c)).filter((i) => i >= 0);
  const start = Math.min(...starts);
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  return JSON.parse(t.slice(start, end + 1));
}

console.log("test.* Wrapper Operations Tests");
console.log("===============================");

const suites = [
  { id: "test.relay-unit", minTotal: 10 },
  { id: "test.relay-integration", minTotal: 20 },
  { id: "test.relay-behavior", minTotal: 15 },
  { id: "test.relay-recovery", minTotal: 5 },
  { id: "test.relay-idempotency", minTotal: 15 },
];

for (const s of suites) {
  const r = cli(["test", s.id, "--json"]);
  const o = jsonOut(r);
  check(`${s.id}: passed`, o.passed === true, o.failed_checks?.join(","));
  check(`${s.id}: exit 0`, r.code === 0);
  check(`${s.id}: counts reported (total >= ${s.minTotal})`, (o.subject?.total ?? 0) >= s.minTotal, `total=${o.subject?.total}`);
  check(`${s.id}: tested_sha recorded (40 hex)`, /^[0-9a-f]{40}$/.test(o.evaluated_sha ?? o.subject?.tested_sha ?? ""));
  check(`${s.id}: evidence carries commands+exits`, Array.isArray(o.evidence) && o.evidence.length > 0 && o.evidence.every((e) => /exit=\d+/.test(e)));
}

// underlying failure → passed=false (run a wrapper against a broken suite path)
const bad = cli(["operation", "execute", "test.relay-unit", "repo=/tmp/nonexistent-repo-xyz", "--json"]);
const badO = jsonOut(bad);
check("failed underlying command returns passed=false", badO.passed === false);
check("failed wrapper exit 1", bad.code === 1);

console.log("");
if (failures.length) {
  console.log("Failures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");
process.exit(failed ? 1 : 0);
