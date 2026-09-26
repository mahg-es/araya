#!/usr/bin/env node
// ARAYA S1 — REAL runtime enforcement test (ADR-0021 / REQ-051).
// Exercises the actual agent-lifecycle hook handlers (agent_before_settle /
// tool_call path) against AUTOMATIC state derivation (pe-araya-2609-47).
//
// State is DERIVED from authoritative Repository Truth (tracked audit +
// adoption record + git HEAD) — never from a manually-created state.json.
// Isolated git fixtures are used so no operator or test hand-creates state.json.
// UNKNOWN state must FAIL CLOSED; read-only derivation must remain possible.
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

const ROOT = path.join(__dirname, "..");
let passed = 0, failed = 0;
const failures = [];
function check(label, cond, detail) {
  if (cond) passed++;
  else { failed++; failures.push(`${label}${detail ? ` — ${detail}` : ""}`); }
}

function run(code) {
  try {
    const out = execFileSync("npx", ["--yes", "tsx", "-e", code], { cwd: ROOT, encoding: "utf-8" });
    const line = out.split("\n").filter((l) => l.trim() && !l.includes("npm notice") && l.trim().startsWith("{")).pop();
    return line ? JSON.parse(line) : { parseError: out };
  } catch (e) {
    const stdout = String(e.stdout ?? "");
    const line = stdout.split("\n").filter((l) => l.trim() && !l.includes("npm notice") && l.trim().startsWith("{")).pop();
    if (line) { try { return JSON.parse(line); } catch {} }
    return { parseError: stdout || String(e.message ?? "") };
  }
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
const AUDIT_NOT_AUTHORIZED = AUDIT_NEXT.replace("Stage 3 authorized", "Stage 3 NOT authorized");

function makeFixture({ audit, adoption }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "araya-rte-"));
  execFileSync("git", ["init", "-q", dir]);
  execFileSync("git", ["-C", dir, "config", "user.email", "test@araya.invalid"]);
  execFileSync("git", ["-C", dir, "config", "user.name", "test"]);
  fs.writeFileSync(path.join(dir, "README.md"), "fixture\n");
  execFileSync("git", ["-C", dir, "add", "README.md"]);
  execFileSync("git", ["-C", dir, "commit", "-qm", "init"]);
  const om = path.join(dir, ".araya", "operating-model");
  fs.mkdirSync(om, { recursive: true });
  if (audit != null) fs.writeFileSync(path.join(om, "S6-CUTOVER-READINESS-AUDIT.md"), audit);
  if (adoption != null) fs.writeFileSync(path.join(om, "ADOPTION-RECORD.md"), adoption);
  return dir;
}
const j = (v) => JSON.stringify(v);

// ── §5: UNKNOWN state fails CLOSED (automatic derivation, no manual file) ──
{
  const f = makeFixture({ audit: null, adoption: null }); // no evidence → UNKNOWN
  const r = run(`
import { enforcePreDisposition, enforcePreAction } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
console.log(JSON.stringify({
  disposition: enforcePreDisposition(root, { context: { canContinue: true } }) ?? null,
  bash: enforcePreAction(root, "bash", "git status") ?? null,
  write: enforcePreAction(root, "write") ?? null,
}));
`);
  // UNKNOWN + canContinue=true → continuation requested (settlement refused, fail closed),
  // but NEVER a bare invalid continue:true — a runnable context must be present.
  check("UNKNOWN state: terminal settlement BLOCKED (continuation requested)", r.disposition && r.disposition.continue === true, JSON.stringify(r.disposition));
  check("UNKNOWN state: read-only bash NOT blocked (deadlock removed)", r.bash === null, JSON.stringify(r.bash));
  check("UNKNOWN state: write BLOCKED (fail closed)", r.write && r.write.block === true, JSON.stringify(r.write));
  fs.rmSync(f, { recursive: true, force: true });
}

// ── Pre-disposition enforcement: the real termination boundary ──────────
{
  const f = makeFixture({ audit: AUDIT_NEXT, adoption: ADOPTION_OK });
  const r = run(`
import { enforcePreDisposition } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
console.log(JSON.stringify(enforcePreDisposition(root, { context: { canContinue: true } }) ?? null));
`);
  check("premature terminal (next=S4, authorized, no blocker, canContinue) → continue:true", r && r.continue === true, JSON.stringify(r));

  const rNoContext = run(`
import { enforcePreDisposition } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
console.log(JSON.stringify(enforcePreDisposition(root, { context: { canContinue: false } }) ?? null));
`);
  check("premature terminal without runnable context → queued continuation entry (no bare continue:true)", rNoContext && rNoContext.continue === true && Array.isArray(rNoContext.entries) && rNoContext.entries.length > 0, JSON.stringify(rNoContext));
  fs.rmSync(f, { recursive: true, force: true });

  const fDone = makeFixture({ audit: AUDIT_DONE, adoption: ADOPTION_OK });
  const r2 = run(`
import { enforcePreDisposition } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify(enforcePreDisposition(${j(fDone)}, { context: { canContinue: true } }) ?? null));
`);
  check("legitimate terminal (no next eligible) → no continuation", r2 === null || r2.continue !== true, JSON.stringify(r2));
  fs.rmSync(fDone, { recursive: true, force: true });
}

// ── Pre-action enforcement: stage boundary ───────────────────────────────
{
  const f = makeFixture({ audit: AUDIT_NOT_AUTHORIZED, adoption: ADOPTION_OK });
  const r = run(`
import { enforcePreAction } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
console.log(JSON.stringify({ bash: enforcePreAction(root, "bash", "git commit -m x") ?? null, read: enforcePreAction(root, "read") ?? null }));
`);
  check("stage NOT authorized: mutating bash BLOCKED", r.bash && r.bash.block === true, JSON.stringify(r.bash));
  check("stage NOT authorized: read NOT blocked", r.read === null, JSON.stringify(r.read));
  fs.rmSync(f, { recursive: true, force: true });

  const fAuth = makeFixture({ audit: AUDIT_NEXT, adoption: ADOPTION_OK });
  const r2 = run(`
import { enforcePreAction } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(fAuth)};
console.log(JSON.stringify({ bash: enforcePreAction(root, "bash", "git commit -m x") ?? null }));
`);
  check("stage authorized: mutating bash ALLOWED", r2.bash === null, JSON.stringify(r2));
  fs.rmSync(fAuth, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) { console.log(failures.join("\n")); process.exit(1); }
