#!/usr/bin/env node
// ARAYA S1 — REAL runtime enforcement test (ADR-0021 / REQ-051).
// Exercises the actual agent-lifecycle hook handlers (agent_before_settle /
// tool_call path). State is DERIVED via deriveAndCacheState — no test or
// operator hand-creates state.json. UNKNOWN state must FAIL CLOSED.
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const ROOT = path.join(__dirname, "..");
const STATE = path.join(ROOT, ".araya", "operating-model", "state.json");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}

function run(fn) {
  try {
    const out = execFileSync("npx", ["--yes", "tsx", "-e", fn], { cwd: ROOT, encoding: "utf-8" });
    const line = out.split("\n").filter((l) => l.trim() && !l.includes("npm notice") && l.trim().startsWith("{")).pop();
    return line ? JSON.parse(line) : { parseError: out };
  } catch (e) {
    const stdout = String(e.stdout ?? "");
    const line = stdout.split("\n").filter((l) => l.trim() && !l.includes("npm notice") && l.trim().startsWith("{")).pop();
    if (line) { try { return JSON.parse(line); } catch {} }
    return { parseError: stdout || String(e.message ?? "") };
  }
}

// Derive authoritative state via the automatic writer (never hand-write the file).
function deriveState(s) {
  fs.rmSync(STATE, { force: true });
  const code = `
import { deriveAndCacheState } from "./src/araya/operating-model/runtime-enforcement";
deriveAndCacheState(".", ${JSON.stringify(s)});
console.log(JSON.stringify({ ok: true }));
`;
  execFileSync("npx", ["--yes", "tsx", "-e", code], { cwd: ROOT, encoding: "utf-8" });
}

function clearState() {
  fs.rmSync(STATE, { force: true });
}

// ── §5: UNKNOWN state fails CLOSED (previously fail-open) ───────────────
clearState();
const rU1 = run(`
import { enforcePreDisposition } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify(enforcePreDisposition(".") ?? null));
`);
check("UNKNOWN state: terminal settlement BLOCKED (continue:true)", rU1 && rU1.continue === true, JSON.stringify(rU1));

const rU2 = run(`
import { enforcePreAction } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify({ bash: enforcePreAction(".", "bash") ?? null, read: enforcePreAction(".", "read") ?? null }));
`);
check("UNKNOWN state: mutating tool (bash) BLOCKED", rU2 && rU2.bash !== null, JSON.stringify(rU2));
check("UNKNOWN state: read NOT blocked", rU2 && rU2.read === null, JSON.stringify(rU2));

// ── Pre-disposition enforcement: the real termination boundary ──────────
deriveState({ stageAuthorized: true, currentNode: "S3a", nextEligibleAction: "S3b", blocker: false });
const r1 = run(`
import { enforcePreDisposition } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify(enforcePreDisposition(".") ?? null));
`);
check("premature terminal (next=S3b, authorized, no blocker) → continue:true", r1 && r1.continue === true, JSON.stringify(r1));

deriveState({ stageAuthorized: true, currentNode: "S6", nextEligibleAction: null, blocker: false });
const r2 = run(`
import { enforcePreDisposition } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify(enforcePreDisposition(".") ?? null));
`);
check("legitimate terminal (no next eligible) → no continuation", r2 === null || r2.continue !== true, JSON.stringify(r2));

// ── Pre-action enforcement: stage boundary (mutating tool blocked when stage NOT authorized) ──
deriveState({ stageAuthorized: false, currentNode: "S7", nextEligibleAction: "S7", blocker: false });
const r3 = run(`
import { enforcePreAction } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify({ bash: enforcePreAction(".", "bash") ?? null, read: enforcePreAction(".", "read") ?? null }));
`);
check("stage NOT authorized: mutating tool (bash) BLOCKED", r3 && r3.bash !== null, JSON.stringify(r3));
check("stage NOT authorized: read NOT blocked", r3 && r3.read === null, JSON.stringify(r3));

deriveState({ stageAuthorized: true, currentNode: "S3b", nextEligibleAction: "S3b", blocker: false });
const r4 = run(`
import { enforcePreAction } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify({ bash: enforcePreAction(".", "bash") ?? null }));
`);
check("stage authorized: mutating tool (bash) ALLOWED", r4 && r4.bash === null, JSON.stringify(r4));

// cleanup disposable cache (non-authoritative, safely disposable)
clearState();

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) { console.log(failures.join("\n")); process.exit(1); }
