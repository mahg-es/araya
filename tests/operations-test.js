#!/usr/bin/env node
// ARAYA Operation Contract + Catalog + Adapter tests (ponny-express-10010 PHASE 11).
// Exit codes decide. No pipelines decide PASS/FAIL.
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}
function tsx(args) {
  try {
    const out = execFileSync("npx", ["tsx", ...args], { cwd: ROOT, encoding: "utf-8" });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout ?? "") + String(e.stderr ?? "") };
  }
}


function extractJson(t) {
  const starts = ["{", "["].map((c) => t.indexOf(c)).filter((i) => i >= 0);
  const start = Math.min(...starts);
  const end = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  return JSON.parse(t.slice(start, end + 1));
}

console.log("Operation Contract + Catalog Tests");
console.log("==================================");

// Contract validation via registry load (CLI list exercises it)
const list = tsx(["src/cli.ts", "operation", "list", "--json"]);
check("catalog loads without errors", list.code === 0, list.out.slice(0, 200));
let ops = [];
try { ops = extractJson(list.out); } catch { /* handled below */ }
check("list emits JSON array", Array.isArray(ops) && ops.length >= 16, `got ${ops.length}`);
check("12 active operations", ops.filter((o) => o.status === "active").length === 12);
check("6 design-only operations", ops.filter((o) => o.status === "design-only").length === 6);

// every operation has required contract fields
for (const o of ops) {
  check(`${o.operation_id}: has canonical_handler`, typeof o.canonical_handler === "string" && o.canonical_handler.length > 0);
}
for (const o of ops) {
  check(`${o.operation_id}: side_effects declared (array)`, Array.isArray(o.side_effects));
}

// describe returns exact contract
const desc = tsx(["src/cli.ts", "operation", "describe", "git.merge-gate", "--json"]);
const descObj = extractJson(desc.out);
check("describe returns exact operation", descObj.operation_id === "git.merge-gate" && descObj.version === "1.0.0");

// unknown describe fails
const descBad = tsx(["src/cli.ts", "operation", "describe", "git.no-such-op", "--json"]);
check("unknown describe returns error + exit 1", descBad.code === 1);

// resolve: exact id
const r1 = tsx(["src/cli.ts", "operation", "resolve", "git.merge-gate", "--json"]);
const r1o = extractJson(r1.out);
check("resolve exact id confidence 1", r1o.matched_operation === "git.merge-gate" && r1o.confidence === 1 && r1o.via === "exact-id");

// resolve: alias
const r2 = tsx(["src/cli.ts", "operation", "resolve", "merge gate", "--json"]);
const r2o = extractJson(r2.out);
check("resolve alias confidence 1", r2o.matched_operation === "git.merge-gate" && r2o.via === "alias");

// resolve: declared intent
const r3 = tsx(["src/cli.ts", "operation", "resolve", "can I merge this PR", "--json"]);
const r3o = extractJson(r3.out);
check("resolve declared intent", r3o.matched_operation === "git.merge-gate" && r3o.via === "intent");

// resolve: unknown intent found=false exit 1
const r4 = tsx(["src/cli.ts", "operation", "resolve", "xyzzy-nonexistent-intent", "--json"]);
const r4o = extractJson(r4.out);
check("unknown intent found=false exit 1", r4.code === 1 && r4o.matched_operation === null && r4o.confidence === 0);

// design-only operations are not executable
const exDesign = tsx(["src/cli.ts", "operation", "execute", "release.tag-plan", "--json"]);
check("design-only operation not executable (fails closed)", exDesign.code === 1);

// duplicate operation IDs / aliases would fail load — catalog currently clean (covered by load check)

// CLI adapter parity: operation execute git.repository-sanity equals handler-shaped OperationResult
const sanity = tsx(["src/cli.ts", "git", "sanity", "--json"]);
const sanityObj = extractJson(sanity.out);
check("CLI result is OperationResult contract shape", typeof sanityObj.passed === "boolean" && Array.isArray(sanityObj.checks) && typeof sanityObj.operation_id === "string");
check("sanity passes on this repo", sanityObj.passed === true, sanityObj.failed_checks?.join(","));
check("JSON mode emits valid JSON (no ANSI)", !/\u001b\[/.test(sanity.out));

// exit codes match passed state
check("sanity exit code 0 on pass", sanity.code === 0);

console.log("");
if (failures.length) {
  console.log("Failures:");
  for (const f of failures) console.log(`  ✗ ${f}`);
}
console.log("\n══════════════════════════════════════════════════");
console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log("══════════════════════════════════════════════════");
process.exit(failed ? 1 : 0);
