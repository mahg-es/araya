#!/usr/bin/env node
// ARAYA S1 — boundary continuation regression tests (pe-araya-2609-47, DEFECT_B).
//
// Reproduces the previously observed Pi error condition
//   "agent_before_settle requested continuation without runnable model context"
// and proves it no longer occurs, by driving the ACTUAL lifecycle hook
// (the `agent_before_settle` handler registered by extensions/araya/index.ts),
// not merely calling enforcePreDisposition() directly.
//
// Run with: npx tsx tests/boundary-continuation-test.js
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.join(__dirname, "..");
const AUDIT_PATH = path.join(ROOT, ".araya", "operating-model", "S6-CUTOVER-READINESS-AUDIT.md");
const ADOPTION_PATH = path.join(ROOT, ".araya", "operating-model", "ADOPTION-RECORD.md");

let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}

// ── Build a mock Pi runtime that only captures lifecycle handlers ─────────
// The extension factory only touches pi.on / pi.registerCommand / pi.registerTool
// at load time; everything else is lazy inside command handlers.
function buildMockPi() {
  const handlers = {};
  const pi = {
    on(event, fn) { (handlers[event] = handlers[event] || []).push(fn); return () => {}; },
    registerCommand() {},
    registerTool() {},
    registerShortcut() {},
    registerFlag() {},
    registerProvider() {},
    sendUserMessage() {},
    sendMessage() {},
    appendEntry() {},
    exec: async () => ({ stdout: "", stderr: "" }),
    events: {},
    ui: { notify() {}, confirm: async () => true },
  };
  return { pi, handlers };
}

// ── Load the real extension and return the agent_before_settle handler ────
async function loadBeforeSettleHandler() {
  const { pi, handlers } = buildMockPi();
  const mod = await import(path.join(ROOT, "extensions", "araya", "index.ts"));
  const factory = mod.default && typeof mod.default === "function"
    ? mod.default
    : (mod.default && typeof mod.default.default === "function" ? mod.default.default : mod.default);
  if (typeof factory !== "function") throw new Error(`extension default export not a function: ${typeof factory}`);
  factory(pi);
  const list = handlers["agent_before_settle"];
  if (!list || list.length === 0) throw new Error("agent_before_settle handler not registered");
  return list[0];
}

// The extension imports the DIST runtime-enforcement module (same resolved path),
// so resetting the transient continuation guard here targets that exact instance.
async function resetGuard() {
  const { resetContinuationGuard } = await import(path.join(ROOT, "dist", "araya", "operating-model", "runtime-enforcement.js"));
  resetContinuationGuard();
}

const ADOPTION_OK = "# ADOPTION-RECORD\nStatus: ADOPTED / ACTIVE CANONICAL\n";
const AUDIT_NEXT = [
  "# S6 audit",
  "Authority boundary: E-4 (Stage 3 authorized)",
  "",
  "S0 = PASS",
  "S1 = PASS",
  "S2 = PASS",
  "S3a = PASS",
  "S3b = PASS",
  "S4 = PENDING",
  "S5 = PENDING",
  "S6 = PENDING",
  "",
].join("\n");
const AUDIT_DONE = [
  "# S6 audit",
  "Authority boundary: E-4 (Stage 3 authorized)",
  "",
  "S0 = PASS",
  "S1 = PASS",
  "S2 = PASS",
  "S3a = PASS",
  "S3b = PASS",
  "S4 = PASS",
  "S5 = PASS",
  "S6 = PASS",
  "S7 = NOT AUTHORIZED",
  "",
].join("\n");
const AUDIT_BLOCKER = [
  "# S6 audit",
  "Authority boundary: E-4 (Stage 3 authorized)",
  "",
  "S0 = PASS",
  "S1 = PASS",
  "S2 = PASS",
  "S3a = PASS",
  "S3b = PASS",
  "S4 = BLOCK",
  "S5 = PENDING",
  "S6 = PENDING",
  "",
].join("\n");

function writeEvidence(audit) {
  fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
  fs.writeFileSync(AUDIT_PATH, audit);
  fs.writeFileSync(ADOPTION_PATH, ADOPTION_OK);
}

function restoreEvidence() {
  // Restore the tracked audit from git (worktree scratch is disposable; this
  // returns the tracked file to its committed state).
  try {
    execFileSync("git", ["-C", ROOT, "checkout", "--", ".araya/operating-model/S6-CUTOVER-READINESS-AUDIT.md", ".araya/operating-model/ADOPTION-RECORD.md"]);
  } catch { /* leave as-is */ }
  // Remove any disposable cache the live derivation may have written.
  try { fs.rmSync(path.join(ROOT, ".araya", "operating-model", "state.json"), { force: true }); } catch {}
}

(async () => {
  const handler = await loadBeforeSettleHandler();

  // ── Scenario 1: next eligible + canContinue=true → continue succeeds ────
  await resetGuard();
  writeEvidence(AUDIT_NEXT);
  const r1 = await handler({ type: "agent_before_settle", context: { canContinue: true } }, {});
  check("next eligible + canContinue=true → continue succeeds", r1 && r1.continue === true, JSON.stringify(r1));

  // ── Scenario 2: next eligible + canContinue=false → runnable context ─────
  // This is the exact previously-observed error condition: the old hook returned
  // a bare { continue: true } here, which Pi rejected with "<boundary>".
  await resetGuard();
  writeEvidence(AUDIT_NEXT);
  const r2 = await handler({ type: "agent_before_settle", context: { canContinue: false } }, {});
  check("next eligible + canContinue=false → creates runnable next-turn context (entries present)", r2 && Array.isArray(r2.entries) && r2.entries.length > 0, JSON.stringify(r2));
  check("next eligible + canContinue=false → continuation message queued", r2 && r2.entries && r2.entries.some((e) => e && e.type === "custom_message" && typeof e.content === "string" && e.content.length > 0), JSON.stringify(r2));
  check("next eligible + canContinue=false → NO bare continue:true (no <boundary> error)", !(r2 && r2.continue === true && (!r2.entries || r2.entries.length === 0)), JSON.stringify(r2));
  check("next eligible + canContinue=false → continuation is runnable (continue with queued entry)", r2 && r2.continue === true && Array.isArray(r2.entries) && r2.entries.length > 0, JSON.stringify(r2));

  // ── Scenario 3: no next eligible action → no continuation ────────────────
  await resetGuard();
  writeEvidence(AUDIT_DONE);
  const r3 = await handler({ type: "agent_before_settle", context: { canContinue: true } }, {});
  check("no next eligible action → settlement allowed (no continuation)", r3 === undefined || r3 === null || r3.continue !== true, JSON.stringify(r3));

  // ── Scenario 4: blocker exists → no unauthorized continuation ────────────
  await resetGuard();
  writeEvidence(AUDIT_BLOCKER);
  const r4 = await handler({ type: "agent_before_settle", context: { canContinue: true } }, {});
  check("blocker exists → no unauthorized continuation", r4 === undefined || r4 === null || r4.continue !== true, JSON.stringify(r4));

  // ── Scenario 5: continuation guard → no loop ─────────────────────────────
  await resetGuard();
  writeEvidence(AUDIT_NEXT);
  const first = await handler({ type: "agent_before_settle", context: { canContinue: true } }, {});
  const second = await handler({ type: "agent_before_settle", context: { canContinue: true } }, {});
  check("loop guard: first continuation allowed", first && first.continue === true, JSON.stringify(first));
  check("loop guard: second identical continuation refused (no loop)", !(second && second.continue === true), JSON.stringify(second));
  check("loop guard: INVALID_BOUNDARY_CONTINUATION observable", second && second.entries && second.entries.some((e) => e && e.customType === "araya_invalid_boundary_continuation"), JSON.stringify(second));

  restoreEvidence();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) { console.log(failures.join("\n")); process.exit(1); }
})().catch((e) => {
  restoreEvidence();
  console.error(e);
  process.exit(1);
});
