#!/usr/bin/env node
/**
 * ARAYA v2.0 — Verifier / structural emitter test (AX Slice 8), per ADR-0011.
 *
 * Proves, both directions:
 *  (a) a producer self-proposing SUCCESS is routed to the verifier; with valid
 *      attached evidence the verifier emits the success under ITS identity
 *      (emitter ≠ producer, by roster) and it records;
 *  (b1) the producer attempting to emit its OWN success is structurally refused
 *       (producer-is-emitter) — a machine guarantee, not protocol;
 *  (b2) the verifier with NO evidence CANNOT emit SUCCESS (no evidence → no
 *       success); it emits a non-success instead;
 *  (c) live zero-tolerance producer-is-emitter striking is default-OFF
 *      (built-but-not-armed) — a live producer-is-emitter event fires no strike.
 *
 * Uses temp ledgers — never the real one. Usage: node tests/verifier-emitter-test.js
 */

const {
  DelegationEngine, DispositionEngine, ScoreLedger,
  Verifier, VERIFIER_IDENTITY, PRODUCER_IS_EMITTER_STRIKE_ARMED,
} = require("../dist/araya/v2/index.js");
const { existsSync, readFileSync, mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

let passed = 0, failed = 0;
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
async function test(name, fn) {
  try { await fn(); console.log(`  ok  ${name}`); passed++; }
  catch (e) { console.log(`  FAIL  ${name}: ${e.message}`); failed++; }
}

const work = mkdtempSync(join(tmpdir(), "ax-s8-"));
const ledgerLines = (p) => existsSync(p) ? readFileSync(p, "utf-8").split("\n").filter(Boolean).map(JSON.parse) : [];
const config = { agents: { valentina: { role: "Developer", model_tier: "balanced", skills: ["impl"], permissions: { can_write_code: true } } } };
const runConfig = { mode: "standard", policy: "balanced", execution_mode: "adaptive" };

function baseOutput(agentName, { tests_run = 0, tests_passed = true } = {}) {
  return {
    run_id: `${agentName}-run`, trace_id: "t", delegation_depth: 0, agent: agentName, role: "R",
    status: "completed", mode: "standard", policy: "balanced", execution_mode: "adaptive",
    confidence: 0.95, low_confidence_items: [], escalation_reason: null, requires_human_approval: false,
    approval_reason: null, model_provider: "t", model_used: "t", model_tier: "balanced", reasoning_effort: "medium",
    fallback_provider_used: null, fallback_reason: null, input_tokens: 0, output_tokens: 0, reasoning_tokens: 0,
    cost_estimate_usd: null, execution_time_ms: 0, retry_count: 0, files_changed: [], tests_added: 0,
    tests_run, tests_passed, coverage_percent: null, risks: [], blockers: [], pending_items: [],
    recommendation: "proceed",
    evidence: { logs: [], screenshots: [], reports: [], coverage_files: [], benchmarks: [], audit_trail: [] },
    summary: "s", next_phase: "done", capabilities_used: [],
  };
}
const adapter = (opts) => ({ async executeSubagent(name) { return baseOutput(name, opts); } });
const engineWithVerifier = (ledger, opts) =>
  new DelegationEngine(config, adapter(opts), ledger, new Verifier(new DispositionEngine(new ScoreLedger(ledger))));

(async () => {
  console.log("Verifier / structural emitter (ADR-0011):");

  await test("verifier unit: substantiation is honest (no evidence → false)", async () => {
    const v = new Verifier(new DispositionEngine(new ScoreLedger(join(work, "u.ndjson"))));
    assert(v.substantiatesSuccess({ tests: { run: 3, passed: true } }) === true, "passing tests substantiate");
    assert(v.substantiatesSuccess({ certification: { passed: 1, failed: 0, exitCode: 0 } }) === true, "clean cert substantiates");
    assert(v.substantiatesSuccess({ dorVerdict: { disposition: "SUCCESS" } }) === true, "DoR SUCCESS substantiates");
    assert(v.substantiatesSuccess(undefined) === false, "no evidence → false");
    assert(v.substantiatesSuccess({ tests: { run: 3, passed: false } }) === false, "failing tests → false");
    assert(v.substantiatesSuccess({ certification: { passed: 1, failed: 2, exitCode: 1 } }) === false, "failing cert → false");
  });

  const aLedger = join(work, "a.ndjson");
  let aExit;
  await test("(a) producer-proposed success + evidence → verifier emits SUCCESS under daneel (emitter≠producer)", async () => {
    const engine = engineWithVerifier(aLedger, { tests_run: 5, tests_passed: true });
    await engine.executeSubagent("valentina", "work", runConfig);
    aExit = engine.getUnitExits("valentina-run")[0];
    assert(aExit.emitted === true, "the binding success was emitted");
    assert(aExit.emittedBy === VERIFIER_IDENTITY, `emitter is the verifier (${VERIFIER_IDENTITY}), got ${aExit.emittedBy}`);
    assert(aExit.emittedBy !== aExit.producer, "emitter ≠ producer, by roster identity");
    assert(aExit.verified === true, "the verifier found substantiating evidence");
    assert(aExit.emittedDisposition === "PASS", `single-gate success is PASS, got ${aExit.emittedDisposition}`);
    const success = ledgerLines(aLedger).find(l => l.disposition === "PASS");
    assert(success && success.emitter === VERIFIER_IDENTITY && success.producer === "valentina",
      "the recorded success carries emitter=daneel, producer=valentina");
  });

  await test("(b1) producer's own success is structurally refused (producer-is-emitter), never self-emitted", async () => {
    assert(aExit.rejection && aExit.rejection.kind === "producer-is-emitter",
      "the producer-not-emitter check fired in-loop (machine guarantee)");
    const selfEmitted = ledgerLines(aLedger).some(l => l.disposition === "PASS" && l.emitter === l.producer);
    assert(!selfEmitted, "no success was ever emitted by the producer itself");
  });

  const bLedger = join(work, "b.ndjson");
  await test("(b2) producer-proposed success + NO evidence → verifier refuses SUCCESS (emits ASK)", async () => {
    const engine = engineWithVerifier(bLedger, { tests_run: 0 });
    await engine.executeSubagent("valentina", "work", runConfig);
    const exit = engine.getUnitExits("valentina-run")[0];
    assert(exit.verified === false, "no substantiating evidence");
    assert(exit.emittedDisposition !== "PASS" && exit.emittedDisposition !== "SUCCESS",
      `must NOT emit a success without evidence, got ${exit.emittedDisposition}`);
    assert(exit.emittedDisposition === "ASK", `refusal emits ASK, got ${exit.emittedDisposition}`);
    const lines = ledgerLines(bLedger);
    assert(!lines.some(l => l.disposition === "PASS" || l.disposition === "SUCCESS"),
      "no success disposition recorded for an unevidenced unit");
    assert(lines.some(l => l.disposition === "ASK" && l.emitter === VERIFIER_IDENTITY), "the verifier recorded an ASK");
  });

  await test("(c) live producer-is-emitter striking is default-OFF (built-but-not-armed)", async () => {
    assert(PRODUCER_IS_EMITTER_STRIKE_ARMED === false, "the strike flag defaults off");
    const cLedger = join(work, "c.ndjson");
    const engine = engineWithVerifier(cLedger, { tests_run: 5, tests_passed: true });
    assert(engine.producerIsEmitterStrikeArmed === false, "the engine exposes the flag as off");
    await engine.executeSubagent("valentina", "work", runConfig);
    assert(!existsSync(join(work, "arbiter.ndjson")), "no arbiter/strike ledger is written in-loop");
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
