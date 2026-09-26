#!/usr/bin/env node
// ARAYA S1 — operating-model RUNTIME integration tests (ADR-0021/REQ-051).
// Exercises the actual operation CLI path (`operation execute ...`), not only
// direct function calls. Exit codes decide.
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}

function parseJson(txt) {
  const idx = txt.indexOf("{");
  if (idx < 0) return null;
  try { return JSON.parse(txt.slice(idx)); } catch { return null; }
}
function execute(op, kv) {
  try {
    const out = execFileSync("npx", ["--yes", "tsx", "src/cli.ts", "operation", "execute", op, ...kv, "--json"], { cwd: ROOT, encoding: "utf-8" });
    return parseJson(out) ?? { passed: false, parseError: out };
  } catch (e) {
    const stdout = String(e.stdout ?? "");
    const parsed = parseJson(stdout);
    if (parsed) return parsed;
    return { passed: false, parseError: stdout || String(e.message ?? "") };
  }
}

// ── Pre-disposition gate: the S3a regression ────────────────────────────
const pd1 = execute("operating-model.pre-disposition-gate", [
  "disposition=AUDIT", "next_eligible_action_exists=true", "stage_authorized=true", "blocker_exists=false",
]);
check("pd1 (AUDIT + next eligible + authorized + no blocker) → REJECTED", pd1.passed === false, JSON.stringify(pd1));
check("pd1 failed check = 'allowed'", (pd1.failed_checks || []).includes("allowed"), JSON.stringify(pd1.failed_checks));

const pd2 = execute("operating-model.pre-disposition-gate", [
  "disposition=STOP", "next_eligible_action_exists=true", "stage_authorized=true", "blocker_exists=false",
]);
check("pd2 (STOP + next eligible) → REJECTED", pd2.passed === false, JSON.stringify(pd2));

const pd3 = execute("operating-model.pre-disposition-gate", [
  "disposition=STOP", "next_eligible_action_exists=false", "stage_authorized=true", "blocker_exists=false",
]);
check("pd3 (STOP + no next eligible) → ALLOWED", pd3.passed === true, JSON.stringify(pd3));

// ── Pre-action gate: Requirement-First + authority + stale candidate ────
const pa1 = execute("operating-model.pre-action-gate", [
  "new_substantive_owner_intent=true", "requirement_in_repository_truth=false", "authority_class=REPOSITORY_TRUTH",
  "required_architecture_present=true", "required_dependency_satisfied=true", "candidate_identity_stale=false", "stage_authorized=true",
]);
check("pa1 (new intent + no REQ) → BLOCKED", pa1.passed === false, JSON.stringify(pa1));

const pa2 = execute("operating-model.pre-action-gate", [
  "new_substantive_owner_intent=false", "requirement_in_repository_truth=true", "authority_class=UNKNOWN",
  "required_architecture_present=true", "required_dependency_satisfied=true", "candidate_identity_stale=false", "stage_authorized=true",
]);
check("pa2 (authority UNKNOWN) → BLOCKED", pa2.passed === false, JSON.stringify(pa2));

const pa3 = execute("operating-model.pre-action-gate", [
  "new_substantive_owner_intent=false", "requirement_in_repository_truth=true", "authority_class=REPOSITORY_TRUTH",
  "required_architecture_present=true", "required_dependency_satisfied=true", "candidate_identity_stale=false", "stage_authorized=true",
]);
check("pa3 (all good) → ELIGIBLE", pa3.passed === true, JSON.stringify(pa3));

// ── verify-capability: persona-free ─────────────────────────────────────
const vc1 = execute("operating-model.verify-capability", [
  "producer_identity=Daneel", "verifier_identity=AX3", "candidate_sha=abc", "expected_sha=abc", "disposition=STOP", "evidence_durable=true",
]);
check("vc1 (producer!=verifier STOP exact SHA durable) → PASS", vc1.passed === true, JSON.stringify(vc1));

const vc2 = execute("operating-model.verify-capability", [
  "producer_identity=Daneel", "verifier_identity=Daneel", "candidate_sha=abc", "expected_sha=abc", "disposition=STOP", "evidence_durable=true",
]);
check("vc2 (producer==verifier) → FAIL", vc2.passed === false, JSON.stringify(vc2));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) { console.log(failures.join("\n")); process.exit(1); }
