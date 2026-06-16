#!/usr/bin/env node
/**
 * ARAYA v2.0 — Definition of Ready advisory gate test (AX Slice 5).
 *
 * Proves, as evidence, the ADR-0009 behavior — especially §4, the load-bearing
 * rule, in BOTH directions:
 *  (a) all machine gates pass AND human gates ruled pass -> SUCCESS (emitted+recorded)
 *  (b) machine gates pass but a human-judgment gate is UNRULED -> ASK, not SUCCESS
 *      (the honesty proof: the gate refuses to certify what no human ruled)
 *  (b2) a human "pass" with no named ruler collapses to unruled -> ASK (no bypass)
 *  (c) a machine gate fails -> FIX
 *  (d) every verdict is recorded through the EXISTING score ledger (no parallel path)
 *
 * Usage: node tests/definition-of-ready-gate-test.js
 */

const assert = require("node:assert");
const { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

const { DefinitionOfReadyGate } = require("../dist/araya/v2/engines/definition-of-ready-gate.js");
const { DispositionEngine } = require("../dist/araya/v2/engines/disposition.js");
const { ScoreLedger } = require("../dist/araya/v2/ledger/score-ledger.js");

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`  ok  ${name}`); };

// --- governance-agnostic fixtures (temp files; no private paths) ---
const work = mkdtempSync(join(tmpdir(), "ax-s5-dor-"));
const ledgerPath = join(work, "score.ndjson");
const acceptedAdr = join(work, "adr-accepted.md");
const proposedAdr = join(work, "adr-proposed.md");
const seamFile = join(work, "seam.ts");
writeFileSync(acceptedAdr, "# ADR\n**Status:** Accepted\n");
writeFileSync(proposedAdr, "# ADR\n**Status:** Proposed\n");
writeFileSync(seamFile, "export class DispositionEngine {}\n");

// machine gate: a real predicate over a caller-supplied path (engine evaluates it)
const fileContains = (id, path, pattern) => ({
  id, kind: "machine",
  evaluate() {
    const ok = existsSync(path) && new RegExp(pattern).test(readFileSync(path, "utf-8"));
    return { passed: ok, evidence: `${id}: /${pattern}/ in ${path} -> ${ok}` };
  },
});

const move = (slice) => ({
  timestamp: new Date().toISOString(),
  spec: "ax-migration", slice, adr_ids: ["ADR-0009"], contract_ids: [],
  commit: "araya@test", skillset: ["ax-governance"],
  evidence_ref: "DoR advisory gate test",
});

// Fresh gate sharing ONE DispositionEngine bound to ONE ScoreLedger — the gate
// gets no ledger of its own (reuse, not reinvention).
const ledger = new ScoreLedger(ledgerPath);
const gate = new DefinitionOfReadyGate(new DispositionEngine(ledger));

console.log("Definition of Ready advisory gate (ADR-0009):");

// (a) all machine pass + human ruled pass -> SUCCESS
let aOut;
check("(a) machine pass + human ruled pass -> SUCCESS, emitted+recorded", () => {
  aOut = gate.evaluate({
    unitId: "slice-pilot-a",
    producer: "sonia",
    gates: [
      fileContains("governing-adr-accepted", acceptedAdr, "Status:\\*\\* Accepted"),
      fileContains("seam-resolves", seamFile, "class DispositionEngine"),
      { id: "right-seam", kind: "human", ruling: "pass", ruledBy: "The Data Professor", evidence: "seam confirmed correct" },
      { id: "scope-bounded", kind: "human", ruling: "pass", ruledBy: "The Data Professor", evidence: "scope confirmed" },
    ],
    move: move("slice-pilot-a"),
  });
  assert.strictEqual(aOut.proposed, "SUCCESS", "expected SUCCESS");
  assert.strictEqual(aOut.emitted, true, "SUCCESS must be emitted (independent human emitter)");
  assert.strictEqual(aOut.pendingIndependentEmitter, false);
});

// (b) THE honesty proof: machine pass but a human gate unruled -> ASK, NOT SUCCESS
let bOut;
check("(b) machine pass + human UNRULED -> ASK, not SUCCESS", () => {
  bOut = gate.evaluate({
    unitId: "slice-pilot-b",
    producer: "sonia",
    gates: [
      fileContains("governing-adr-accepted", acceptedAdr, "Status:\\*\\* Accepted"),
      fileContains("seam-resolves", seamFile, "class DispositionEngine"),
      { id: "right-seam", kind: "human", ruling: "pass", ruledBy: "The Data Professor", evidence: "ok" },
      { id: "materially-block", kind: "human", ruling: "unruled", evidence: "no human ruling yet" },
    ],
    move: move("slice-pilot-b"),
  });
  assert.strictEqual(bOut.proposed, "ASK", "unruled human gate must yield ASK");
  assert.notStrictEqual(bOut.proposed, "SUCCESS", "must NOT be SUCCESS on an unruled human gate");
  assert.strictEqual(bOut.emitted, true, "ASK is a non-success exit and is recorded");
});

// (b2) a "pass" with no named human ruler collapses to unruled -> ASK (no bypass)
check("(b2) human pass without ruledBy -> treated unruled -> ASK", () => {
  const out = gate.evaluate({
    unitId: "slice-pilot-b2",
    producer: "sonia",
    gates: [
      fileContains("governing-adr-accepted", acceptedAdr, "Status:\\*\\* Accepted"),
      { id: "right-seam", kind: "human", ruling: "pass", /* no ruledBy */ evidence: "ruler-less" },
    ],
    move: move("slice-pilot-b2"),
  });
  assert.strictEqual(out.proposed, "ASK", "ruler-less pass must not reach SUCCESS");
});

// (c) a machine gate fails -> FIX
let cOut;
check("(c) machine gate fails -> FIX", () => {
  cOut = gate.evaluate({
    unitId: "slice-pilot-c",
    producer: "sonia",
    gates: [
      fileContains("governing-adr-accepted", proposedAdr, "Status:\\*\\* Accepted"), // Proposed, not Accepted -> fail
      { id: "right-seam", kind: "human", ruling: "pass", ruledBy: "The Data Professor", evidence: "ok" },
    ],
    move: move("slice-pilot-c"),
  });
  assert.strictEqual(cOut.proposed, "FIX", "a failed machine gate must yield FIX");
});

// (d) recorded through the EXISTING score ledger (no parallel path)
check("(d) verdicts recorded via the existing ScoreLedger, not a parallel path", () => {
  const entries = ledger.readAll();
  const byUnit = Object.fromEntries(entries.map(e => [e.unit, e]));
  assert.strictEqual(byUnit["slice-pilot-a"].disposition, "SUCCESS");
  assert.strictEqual(byUnit["slice-pilot-a"].emitter, "The Data Professor", "SUCCESS emitter is the human ruler");
  assert.strictEqual(byUnit["slice-pilot-a"].producer, "sonia");
  assert.strictEqual(byUnit["slice-pilot-b"].disposition, "ASK");
  assert.strictEqual(byUnit["slice-pilot-c"].disposition, "FIX");
  // The ledger the gate wrote to is the one we constructed — same NDJSON file.
  assert.ok(existsSync(ledgerPath), "writes to the supplied score ledger path");
  assert.ok(entries.length >= 4, "all verdicts recorded as ledger moves");
});

rmSync(work, { recursive: true, force: true });
console.log(`\nAll ${passed} checks passed.`);
