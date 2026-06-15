#!/usr/bin/env node
/**
 * ARAYA v2.0 — Disposition State Machine + Score Ledger Test (AX Slice 2)
 *
 * (a) a typed disposition is emitted on unit exit.
 * (b) success-by-shape: a single-gate unit may only PASS, a multi-gate unit may
 *     only SUCCESS, and a PASS proposed on a multi-gate unit is rejected as an
 *     illegal transition (and SUCCESS on a single-gate unit likewise).
 * (c) producer-not-emitter: a producer cannot emit a success disposition for
 *     work it produced; a distinct emitter can.
 * (d) score-ledger append: a move writes exactly one NDJSON line, prior entries
 *     are untouched (append-only), and a rejected move writes nothing.
 * (e) existing delivery flow still works unchanged (quality gate is untouched).
 *
 * Usage: node tests/disposition-and-score-ledger-test.js   (after `npm run build`)
 */

const { DispositionEngine, ScoreLedger, QualityGateEngine } = require("../dist/araya/v2/index.js");
const { existsSync, rmSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    console.error(e);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "assertion failed");
}

const LEDGER = join(__dirname, ".tmp-slice2-score.ndjson");
function freshLedger() {
  if (existsSync(LEDGER)) rmSync(LEDGER);
  return new ScoreLedger(LEDGER);
}
function lines() {
  return readFileSync(LEDGER, "utf-8").split("\n").filter(Boolean);
}
// A move's non-identity columns; emit() fills in unit/disposition/producer/emitter.
function move(over = {}) {
  return {
    timestamp: "2026-06-15T00:00:00Z",
    spec: "ax",
    slice: "slice-2",
    adr_ids: ["ADR-0002", "ADR-0003", "ADR-0004"],
    contract_ids: [],
    commit: "test",
    skillset: [],
    evidence_ref: "test",
    ...over,
  };
}

const single = { unit: "leaf", declaredGates: ["g1"], producer: "valentina" };
const multi = { unit: "node", declaredGates: ["g1", "g2", "g3"], producer: "valentina" };

console.log("disposition state machine + score ledger (ADR-0002/0003/0004 — Slice 2)\n");

// (a)
test("(a) a typed disposition is emitted on unit exit", () => {
  const r = new DispositionEngine().emit(multi, "SUCCESS", "daneel");
  assert(r.ok && r.disposition === "SUCCESS", "expected SUCCESS to be emitted");
});

// (b) success-by-shape
test("(b1) single-gate unit: PASS is the legal success", () => {
  assert(new DispositionEngine().emit(single, "PASS", "daneel").ok, "single-gate PASS should be legal");
});
test("(b2) single-gate unit: SUCCESS is an illegal transition", () => {
  const r = new DispositionEngine().emit(single, "SUCCESS", "daneel");
  assert(!r.ok && r.rejection.kind === "illegal-transition", "SUCCESS on a single-gate unit must be rejected");
});
test("(b3) multi-gate unit: SUCCESS is the legal success", () => {
  assert(new DispositionEngine().emit(multi, "SUCCESS", "daneel").ok, "multi-gate SUCCESS should be legal");
});
test("(b4) multi-gate unit: PASS is an illegal transition", () => {
  const r = new DispositionEngine().emit(multi, "PASS", "daneel");
  assert(!r.ok && r.rejection.kind === "illegal-transition", "PASS on a multi-gate unit must be rejected");
});

// (c) producer-not-emitter
test("(c1) a producer cannot emit a success disposition for its own work", () => {
  const r = new DispositionEngine().emit(multi, "SUCCESS", "valentina"); // emitter === producer
  assert(!r.ok && r.rejection.kind === "producer-is-emitter", "self-emission of success must be rejected");
});
test("(c2) a distinct emitter can emit the success disposition", () => {
  const r = new DispositionEngine().emit(multi, "SUCCESS", "daneel"); // emitter !== producer
  assert(r.ok && r.disposition === "SUCCESS", "an independent emitter should succeed");
});

// (d) score-ledger append
test("(d) a move appends exactly one NDJSON line; prior entries untouched; rejected moves write nothing", () => {
  const ledger = freshLedger();
  const eng = new DispositionEngine(ledger);

  eng.emit(multi, "SUCCESS", "daneel", move());
  const firstLine = lines()[0];
  assert(lines().length === 1, "first move must write exactly one line");

  eng.emit(single, "PASS", "daneel", move());
  assert(lines().length === 2, "second move appends a second line");
  assert(lines()[0] === firstLine, "prior entry must be byte-identical (append-only)");
  assert(JSON.parse(lines()[0]).disposition === "SUCCESS" && JSON.parse(lines()[0]).unit === "node", "line 1 records the SUCCESS move");
  assert(JSON.parse(lines()[1]).disposition === "PASS" && JSON.parse(lines()[1]).unit === "leaf", "line 2 records the PASS move");

  eng.emit(multi, "PASS", "daneel", move()); // illegal transition → rejected
  assert(lines().length === 2, "a rejected move writes no ledger line");

  rmSync(LEDGER);
});

// (e) existing delivery flow unchanged
test("(e) existing delivery (quality gate) still returns {passed, checks, summary}", () => {
  const gates = new QualityGateEngine({});
  const output = {
    status: "completed",
    confidence: 0.95,
    risks: [],
    blockers: [],
    tests_run: 0,
    tests_passed: true,
    requires_human_approval: false,
    files_changed: [],
    evidence: { logs: [], reports: [] },
  };
  const res = gates.evaluate(output, { mode: "standard" });
  assert(typeof res.passed === "boolean" && Array.isArray(res.checks) && typeof res.summary === "string", "quality gate must still return its existing shape");
  assert(res.passed === true, "a clean completed output should still pass");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
