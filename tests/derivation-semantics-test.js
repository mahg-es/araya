#!/usr/bin/env node
// ARAYA S1 — semantic state-derivation regression tests (pe-araya-2609-48).
//
// Proves the derivation no longer bootstraps S6 acceptance from the S6 audit
// itself, and no longer infers target canonical cutover from the SOURCE
// ADOPTION-RECORD "ADOPTED / ACTIVE CANONICAL" marker.
//
//   audit says S6=PASS but no independent durable S6 acceptance
//     → currentNode MUST NOT become S6
//   audit says S6=PASS but live proof missing
//     → nextEligibleAction remains S6 (pre-S6 state)
//   source ADOPTION-RECORD says ACTIVE CANONICAL but target cutover not authorized
//     → target ACTIVE_CANON remains NO (S7 not authorized; nextEligibleAction = S6, not null)
//   S0-S5 independently accepted + E4 valid
//     → currentNode=S5, nextEligibleAction=S6
//   valid independent S6 acceptance + durable publication
//     → currentNode=S6, nextEligibleAction=null
//   contradictory target/coordinator evidence
//     → UNKNOWN
//
// No test hand-creates state.json. The S6 audit is NEVER the fixture that
// proves S6 acceptance — S6 acceptance is only ever proven by a coordinator
// independent S6-acceptance record.
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

const j = (v) => JSON.stringify(v);

// ── Fixture builders ────────────────────────────────────────────────────────

function gitInit(dir) {
  fs.mkdirSync(dir, { recursive: true });
  execFileSync("git", ["init", "-q", dir]);
  execFileSync("git", ["-C", dir, "config", "user.email", "test@araya.invalid"]);
  execFileSync("git", ["-C", dir, "config", "user.name", "test"]);
  fs.writeFileSync(path.join(dir, "README.md"), "fixture\n");
  execFileSync("git", ["-C", dir, "add", "README.md"]);
  execFileSync("git", ["-C", dir, "commit", "-qm", "init"]);
}

/** Target repo fixture: git HEAD + S6 audit + (optional) ADOPTION-RECORD. */
function makeTarget({ auditBody, adoption }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "araya-tgt48-"));
  gitInit(dir);
  const om = path.join(dir, ".araya", "operating-model");
  fs.mkdirSync(om, { recursive: true });
  fs.writeFileSync(path.join(om, "S6-CUTOVER-READINESS-AUDIT.md"), auditBody);
  if (adoption !== undefined) {
    fs.writeFileSync(path.join(om, "ADOPTION-RECORD.md"), adoption);
  }
  return dir;
}

/** Coordinator repo fixture: status-checkpoint + optional independent S6 record. */
function makeCoordinator({ e4Authorized, s6Accepted }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "araya-crd48-"));
  gitInit(dir);
  const pc = path.join(dir, "planning", "current");
  fs.mkdirSync(pc, { recursive: true });
  const e4Line = e4Authorized ? "Owner E-4: AUTHORIZED (pe-araya-2609-34)" : "Owner E-4: NOT GRANTED";
  fs.writeFileSync(path.join(pc, "status-checkpoint.md"), `# status\n${e4Line}\nv0.5.0 ACTIVE_CANON: NO\n`);
  if (s6Accepted) {
    fs.writeFileSync(path.join(pc, "s6-live-proof-accepted.md"), "# S6\nS6 = ACCEPTED\nLIVE_ARAYA_EXTENSION_LOADED = PASS\n");
  }
  return dir;
}

// ── Audit bodies ────────────────────────────────────────────────────────────

const AUDIT_S6_PASS = [
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
  "S6 = PASS  (this audit)",
  "S7 = NOT AUTHORIZED",
  "",
].join("\n");

const ADOPTION_ACTIVE_CANONICAL = "# ADOPTION-RECORD\nStatus: ADOPTED / ACTIVE CANONICAL\n";

function deriveCode(tgt, crd) {
  return `
import { deriveAuthoritativeState } from "./src/araya/operating-model/runtime-enforcement";
console.log(JSON.stringify(deriveAuthoritativeState(${j(tgt)}, ${crd ? j(crd) : "undefined"})));
`;
}

// ── 1. audit S6=PASS, no independent S6 acceptance → NOT S6 ───────────────
{
  const tgt = makeTarget({ auditBody: AUDIT_S6_PASS, adoption: ADOPTION_ACTIVE_CANONICAL });
  const crd = makeCoordinator({ e4Authorized: true, s6Accepted: false });
  const r = run(deriveCode(tgt, crd));
  check("audit S6=PASS + no independent S6 → currentNode != S6", r.status === "KNOWN" && r.currentNode !== "S6", JSON.stringify(r));
  check("…currentNode = S5 (pre-S6)", r.currentNode === "S5", JSON.stringify(r));
  check("…nextEligibleAction = S6 (live proof missing → S6 still next)", r.nextEligibleAction === "S6", JSON.stringify(r));
  check("…stageAuthorized = true (E4 valid)", r.stageAuthorized === true, JSON.stringify(r));
  check("…blocker = false", r.blocker === false, JSON.stringify(r));
  fs.rmSync(tgt, { recursive: true, force: true });
  fs.rmSync(crd, { recursive: true, force: true });
}

// ── 2. no coordinator at all → still S5 (audit corroborates E4 + S0-S5) ────
{
  const tgt = makeTarget({ auditBody: AUDIT_S6_PASS, adoption: ADOPTION_ACTIVE_CANONICAL });
  const r = run(deriveCode(tgt, null));
  check("no coordinator → currentNode=S5 (S6 not self-derived)", r.status === "KNOWN" && r.currentNode === "S5", JSON.stringify(r));
  check("no coordinator → nextEligibleAction=S6", r.nextEligibleAction === "S6", JSON.stringify(r));
  fs.rmSync(tgt, { recursive: true, force: true });
}

// ── 3. ADOPTION-RECORD ACTIVE CANONICAL ≠ target cutover ───────────────────
//    (S7 remains NOT AUTHORIZED: nextEligibleAction = S6, never null from adoption)
{
  const tgt = makeTarget({ auditBody: AUDIT_S6_PASS, adoption: ADOPTION_ACTIVE_CANONICAL });
  const crd = makeCoordinator({ e4Authorized: true, s6Accepted: false });
  const r = run(deriveCode(tgt, crd));
  check("ADOPTION-RECORD ACTIVE CANONICAL does NOT force S6 acceptance (nextEligibleAction=S6, not null)", r.nextEligibleAction === "S6" && r.currentNode === "S5", JSON.stringify(r));
  fs.rmSync(tgt, { recursive: true, force: true });
  fs.rmSync(crd, { recursive: true, force: true });
}

// ── 4. valid independent S6 acceptance + durable publication → S6 ──────────
{
  const tgt = makeTarget({ auditBody: AUDIT_S6_PASS, adoption: ADOPTION_ACTIVE_CANONICAL });
  const crd = makeCoordinator({ e4Authorized: true, s6Accepted: true });
  const r = run(deriveCode(tgt, crd));
  check("independent S6 acceptance → currentNode=S6", r.status === "KNOWN" && r.currentNode === "S6", JSON.stringify(r));
  check("independent S6 acceptance → nextEligibleAction=null (S7 NOT AUTHORIZED)", r.nextEligibleAction === null, JSON.stringify(r));
  check("independent S6 acceptance → blocker=false", r.blocker === false, JSON.stringify(r));
  fs.rmSync(tgt, { recursive: true, force: true });
  fs.rmSync(crd, { recursive: true, force: true });
}

// ── 5. contradictory target/coordinator evidence → UNKNOWN ─────────────────
{
  // Coordinator denies E4, but target audit says "Stage 3 authorized".
  const tgt = makeTarget({ auditBody: AUDIT_S6_PASS, adoption: ADOPTION_ACTIVE_CANONICAL });
  const crd = makeCoordinator({ e4Authorized: false, s6Accepted: false });
  const r = run(deriveCode(tgt, crd));
  check("contradictory E4 (coord denies, audit authorizes) → UNKNOWN", r.status === "UNKNOWN", JSON.stringify(r));
  fs.rmSync(tgt, { recursive: true, force: true });
  fs.rmSync(crd, { recursive: true, force: true });
}

// ── 6. E4 NOT authorized + no contradiction → stageAuthorized=false ────────
{
  const auditNoE4 = AUDIT_S6_PASS.replace("Stage 3 authorized", "Stage 3 NOT authorized");
  const tgt = makeTarget({ auditBody: auditNoE4, adoption: ADOPTION_ACTIVE_CANONICAL });
  const crd = makeCoordinator({ e4Authorized: false, s6Accepted: false });
  const r = run(deriveCode(tgt, crd));
  check("E4 NOT authorized (consistent) → stageAuthorized=false (KNOWN, fail-closed gate)", r.status === "KNOWN" && r.stageAuthorized === false, JSON.stringify(r));
  fs.rmSync(tgt, { recursive: true, force: true });
  fs.rmSync(crd, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) { console.log(failures.join("\n")); process.exit(1); }
