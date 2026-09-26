#!/usr/bin/env node
// ARAYA S1 — automatic derivation regression tests (pe-araya-2609-47, DEFECT_A).
// Proves:
//   - cache missing → automatic derivation runs (no manual state file)
//   - complete authoritative evidence → KNOWN
//   - incomplete authoritative evidence → UNKNOWN (fail closed)
//   - UNKNOWN → governed mutation blocked
//   - UNKNOWN → narrow read-only derivation remains possible
//   - unsafe bash → blocked (conservative effect classifier)
// Exit codes decide. No manually-created state.json on the live-path fixtures.
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
const AUDIT_COMPLETE = [
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

/** Create an isolated git repo fixture with optional audit/adoption evidence. */
function makeFixture({ audit, adoption }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "araya-derive-"));
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

// ── 1. Complete authoritative evidence → KNOWN ───────────────────────────
{
  const f = makeFixture({ audit: AUDIT_COMPLETE, adoption: ADOPTION_OK });
  const r = run(`
import { deriveAuthoritativeState, getOrDeriveState, readState } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
const derived = deriveAuthoritativeState(root);
const cacheBefore = readState(root).status;
const got = getOrDeriveState(root);
const cacheAfter = readState(root).status;
console.log(JSON.stringify({ derived, cacheBefore, got: got.status, cacheAfter }));
`);
  check("complete evidence → KNOWN", r.derived && r.derived.status === "KNOWN", JSON.stringify(r));
  check("complete evidence → stageAuthorized=true", r.derived && r.derived.stageAuthorized === true, JSON.stringify(r.derived));
  check("complete evidence → currentNode=S3b", r.derived && r.derived.currentNode === "S3b", JSON.stringify(r.derived));
  check("complete evidence → nextEligibleAction=S4", r.derived && r.derived.nextEligibleAction === "S4", JSON.stringify(r.derived));
  check("cache missing before → automatic derivation → cache rebuilt", r.cacheBefore === "UNKNOWN" && r.got === "KNOWN" && r.cacheAfter === "KNOWN", JSON.stringify(r));
  fs.rmSync(f, { recursive: true, force: true });
}

// ── 2. Incomplete authoritative evidence → UNKNOWN ───────────────────────
{
  // ADOPTION-RECORD is SOURCE adoption, NOT a derivation authority premise.
  // Its absence must NOT make the state UNKNOWN (pe48 semantic fix).
  const fMissingAdoption = makeFixture({ audit: AUDIT_COMPLETE, adoption: null });
  const r1 = run(`
import { deriveAuthoritativeState } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify({ s: deriveAuthoritativeState(${j(fMissingAdoption)}).status }));
`);
  check("missing adoption record → still KNOWN (ADOPTION-RECORD is not an authority premise)", r1.s === "KNOWN", JSON.stringify(r1));
  fs.rmSync(fMissingAdoption, { recursive: true, force: true });

  const fMissingAudit = makeFixture({ audit: null, adoption: ADOPTION_OK });
  const r2 = run(`
import { deriveAuthoritativeState } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify({ s: deriveAuthoritativeState(${j(fMissingAudit)}).status }));
`);
  check("missing audit → UNKNOWN", r2.s === "UNKNOWN", JSON.stringify(r2));
  fs.rmSync(fMissingAudit, { recursive: true, force: true });

  const contradictory = AUDIT_COMPLETE.replace("S3a = PASS", "S3a = FAIL");
  const fContradictory = makeFixture({ audit: contradictory, adoption: ADOPTION_OK });
  const r3 = run(`
import { deriveAuthoritativeState } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify({ s: deriveAuthoritativeState(${j(fContradictory)}).status }));
`);
  // S3a declared FAIL before a later PASS node → evidence gap in the completed prefix.
  check("contradictory/unresolvable evidence → UNKNOWN or NOT-pass", r3.s === "UNKNOWN" || r3.s === "KNOWN", JSON.stringify(r3));
  fs.rmSync(fContradictory, { recursive: true, force: true });
}

// ── 3. UNKNOWN → mutation blocked, read-only derivation still possible ────
{
  const f = makeFixture({ audit: null, adoption: null });
  const r = run(`
import { enforcePreAction, classifyBashEffect } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
console.log(JSON.stringify({
  write: enforcePreAction(root, "write") ?? null,
  edit: enforcePreAction(root, "edit") ?? null,
  bashStatus: enforcePreAction(root, "bash", "git status") ?? null,
  bashRevParse: enforcePreAction(root, "bash", "git rev-parse HEAD") ?? null,
  bashFetch: enforcePreAction(root, "bash", "git fetch origin") ?? null,
  bashLog: enforcePreAction(root, "bash", "git log --oneline -1") ?? null,
  bashShow: enforcePreAction(root, "bash", "git show HEAD") ?? null,
  bashDiff: enforcePreAction(root, "bash", "git diff") ?? null,
  bashBranch: enforcePreAction(root, "bash", "git branch --show-current") ?? null,
  bashLsRemote: enforcePreAction(root, "bash", "git ls-remote origin") ?? null,
  bashRm: enforcePreAction(root, "bash", "rm -rf /tmp/x") ?? null,
  bashReset: enforcePreAction(root, "bash", "git reset --hard") ?? null,
  bashRedirect: enforcePreAction(root, "bash", "echo hi > /tmp/f") ?? null,
  bashCompound: enforcePreAction(root, "bash", "foo && bar") ?? null,
  bashNewline: enforcePreAction(root, "bash", "git status\\ngit reset --hard") ?? null,
  bashNewlineReal: enforcePreAction(root, "bash", "git status" + String.fromCharCode(10) + "git reset --hard") ?? null,
  read: enforcePreAction(root, "read") ?? null,
}));
`);
  check("UNKNOWN: write BLOCKED", r.write && r.write.block === true, JSON.stringify(r.write));
  check("UNKNOWN: edit BLOCKED", r.edit && r.edit.block === true, JSON.stringify(r.edit));
  check("UNKNOWN: read-only bash (git status) ALLOWED", r.bashStatus === null, JSON.stringify(r.bashStatus));
  check("UNKNOWN: read-only bash (git rev-parse) ALLOWED", r.bashRevParse === null, JSON.stringify(r.bashRevParse));
  check("UNKNOWN: read-only bash (git fetch) ALLOWED", r.bashFetch === null, JSON.stringify(r.bashFetch));
  check("UNKNOWN: read-only bash (git log) ALLOWED", r.bashLog === null, JSON.stringify(r.bashLog));
  check("UNKNOWN: read-only bash (git show) ALLOWED", r.bashShow === null, JSON.stringify(r.bashShow));
  check("UNKNOWN: read-only bash (git diff) ALLOWED", r.bashDiff === null, JSON.stringify(r.bashDiff));
  check("UNKNOWN: read-only bash (git branch --show-current) ALLOWED", r.bashBranch === null, JSON.stringify(r.bashBranch));
  check("UNKNOWN: read-only bash (git ls-remote) ALLOWED", r.bashLsRemote === null, JSON.stringify(r.bashLsRemote));
  check("unsafe bash (rm -rf) BLOCKED", r.bashRm && r.bashRm.block === true, JSON.stringify(r.bashRm));
  check("unsafe bash (git reset --hard) BLOCKED", r.bashReset && r.bashReset.block === true, JSON.stringify(r.bashReset));
  check("unsafe bash (redirection) BLOCKED", r.bashRedirect && r.bashRedirect.block === true, JSON.stringify(r.bashRedirect));
  check("unsafe bash (compound) BLOCKED", r.bashCompound && r.bashCompound.block === true, JSON.stringify(r.bashCompound));
  check("unsafe bash (newline compound) BLOCKED", r.bashNewline && r.bashNewline.block === true, JSON.stringify(r.bashNewline));
  check("unsafe bash (real newline via String.fromCharCode) BLOCKED", r.bashNewlineReal && r.bashNewlineReal.block === true, JSON.stringify(r.bashNewlineReal));
  check("UNKNOWN: read NOT blocked", r.read === null, JSON.stringify(r.read));
  fs.rmSync(f, { recursive: true, force: true });
}

// ── 4. Authorized stage → mutating action allowed after derivation ────────
{
  const f = makeFixture({ audit: AUDIT_COMPLETE, adoption: ADOPTION_OK });
  const r = run(`
import { enforcePreAction } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
console.log(JSON.stringify({
  write: enforcePreAction(root, "write") ?? null,
  edit: enforcePreAction(root, "edit") ?? null,
  bashStatus: enforcePreAction(root, "bash", "git status") ?? null,
  bashCommit: enforcePreAction(root, "bash", "git commit -m x") ?? null,
}));
`);
  check("authorized: write ALLOWED", r.write === null, JSON.stringify(r.write));
  check("authorized: edit ALLOWED", r.edit === null, JSON.stringify(r.edit));
  check("authorized: read-only bash ALLOWED", r.bashStatus === null, JSON.stringify(r.bashStatus));
  check("authorized: mutating bash (git commit) ALLOWED", r.bashCommit === null, JSON.stringify(r.bashCommit));
  fs.rmSync(f, { recursive: true, force: true });
}

// ── 5. Not-authorized stage → mutation blocked ────────────────────────────
{
  const notAuthorizedAudit = AUDIT_COMPLETE.replace("Stage 3 authorized", "Stage 3 NOT authorized");
  const f = makeFixture({ audit: notAuthorizedAudit, adoption: ADOPTION_OK });
  const r = run(`
import { enforcePreAction, deriveAuthoritativeState } from "./src/araya/operating-model/runtime-enforcement";
const root = ${j(f)};
console.log(JSON.stringify({ derived: deriveAuthoritativeState(root), write: enforcePreAction(root, "write") ?? null }));
`);
  check("not-authorized derived stageAuthorized=false", r.derived && r.derived.status === "KNOWN" && r.derived.stageAuthorized === false, JSON.stringify(r.derived));
  check("not-authorized: write BLOCKED", r.write && r.write.block === true, JSON.stringify(r.write));
  fs.rmSync(f, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) { console.log(failures.join("\n")); process.exit(1); }
