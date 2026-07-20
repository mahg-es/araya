#!/usr/bin/env node
/**
 * ARAYA v2.0 — Headless-CLI execution adapter test (AX Slice 10), per ADR-0014.
 *
 * The CLI invocation is MOCKED via an injected BackendDescriptor — NO real, billed
 * claude calls. The proofs are about the adapter's evidence handling and the
 * verifier (daneel) gating the backend's claim, run through the REAL DelegationEngine
 * + Verifier path (no parallel stack).
 *
 * Proves:
 *  (factory) resolveAdapter("claude-code"/"headless-cli") yields a HeadlessCliAdapter
 *            (a new impl of the existing ArayaExecutionAdapter interface).
 *  (a) a unit WITH tests, backend returns a passing test result + file delta -> routes
 *      to the verifier -> daneel emits the success; emitter = daneel, producer = the
 *      external backend (emitter != producer); recorded.
 *  (b) THE HONESTY PROOF — backend changed files but the test result is FAILING ->
 *      daneel does NOT emit SUCCESS, it yields ASK (file delta alone is not
 *      substantiation).
 *  (c) backend self-reports "success" (exit 0) with NO substantiating evidence ->
 *      ASK, never a self-emitted SUCCESS (external backend is producer, never emitter).
 *  (d) CLI failure (non-zero exit) and timeout are first-class non-success
 *      dispositions (FIX / BLOCK), not crashes.
 *  (guard) across the whole ledger, no success line ever has emitter === producer.
 *
 * Uses temp ledgers. Usage: node tests/headless-cli-adapter-test.js
 */

const { DelegationEngine, DispositionEngine, ScoreLedger, Verifier, VERIFIER_IDENTITY } = require("../dist/araya/v2/index.js");
const { HeadlessCliAdapter } = require("../dist/araya/v2/adapters/headless-cli/index.js");
const { resolveAdapter } = require("../dist/araya/v2/adapters/factory.js");
const { existsSync, readFileSync, mkdtempSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

let passed = 0, failed = 0;
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };
async function test(name, fn) {
  try { await fn(); console.log(`  ok  ${name}`); passed++; }
  catch (e) { console.log(`  FAIL  ${name}: ${e.message}`); failed++; }
}
const work = mkdtempSync(join(tmpdir(), "ax-s10-"));
const ledgerLines = (p) => existsSync(p) ? readFileSync(p, "utf-8").split("\n").filter(Boolean).map(JSON.parse) : [];
const BACKEND = "claude-code-cli";
const RUN_ID = "claude-code-cli-standard"; // adapter run_id = `${id}-${mode}`
const config = { agents: {} };
const runConfig = { mode: "standard", policy: "balanced", execution_mode: "adaptive" };

/** A mocked backend descriptor — never spawns a real CLI. */
function mockDescriptor({ exitCode = 0, timedOut = false, delta = [], tests = null } = {}) {
  return {
    id: BACKEND,
    runCli: () => ({ stdout: "backend reports: done", stderr: "", exitCode, timedOut }),
    observeDelta: () => delta,
    runTests: () => tests, // null = genuinely test-less; {run,passed} = real test result
  };
}
function engineWith(ledgerPath, descriptor) {
  const adapter = new HeadlessCliAdapter({ descriptor });
  return new DelegationEngine(config, adapter, ledgerPath, new Verifier(new DispositionEngine(new ScoreLedger(ledgerPath))));
}

(async () => {
  console.log("Headless-CLI execution adapter (ADR-0014):");

  await test("(factory) resolveAdapter('claude-code'/'headless-cli') -> HeadlessCliAdapter (existing interface)", async () => {
    const a1 = resolveAdapter("claude-code", { descriptor: mockDescriptor() });
    const a2 = resolveAdapter("headless-cli", { descriptor: mockDescriptor() });
    assert(a1 instanceof HeadlessCliAdapter && a2 instanceof HeadlessCliAdapter, "both names resolve to the adapter");
    assert(typeof a1.executeSubagent === "function" && typeof a1.getCapabilities === "function",
      "implements the ArayaExecutionAdapter interface");
  });

  const aLedger = join(work, "a.ndjson");
  let aExit;
  await test("(a) unit WITH passing tests -> verifier emits success under daneel (emitter != producer)", async () => {
    const engine = engineWith(aLedger, mockDescriptor({ exitCode: 0, delta: ["src/x.ts"], tests: { run: 3, passed: true } }));
    await engine.executeSubagent(BACKEND, "implement x", runConfig);
    aExit = engine.getUnitExits(RUN_ID)[0];
    assert(aExit.emitted === true, "the binding success was emitted");
    assert(aExit.emittedBy === VERIFIER_IDENTITY, `emitter is daneel, got ${aExit.emittedBy}`);
    assert(aExit.producer === BACKEND, `producer is the external backend, got ${aExit.producer}`);
    assert(aExit.emittedBy !== aExit.producer, "emitter != producer (producer-not-emitter at the execution boundary)");
    assert(aExit.verified === true, "the verifier found substantiating test evidence");
    assert(aExit.emittedDisposition === "PASS", `single-gate success is PASS, got ${aExit.emittedDisposition}`);
    const success = ledgerLines(aLedger).find(l => l.disposition === "PASS");
    assert(success && success.emitter === "daneel" && success.producer === BACKEND,
      "recorded success carries emitter=daneel, producer=the backend");
  });

  await test("(b) changed files but FAILING tests -> daneel refuses SUCCESS, yields ASK", async () => {
    const bLedger = join(work, "b.ndjson");
    const engine = engineWith(bLedger, mockDescriptor({ exitCode: 0, delta: ["src/x.ts", "src/y.ts"], tests: { run: 3, passed: false } }));
    await engine.executeSubagent(BACKEND, "implement x", runConfig);
    const exit = engine.getUnitExits(RUN_ID)[0];
    assert(exit.verified === false, "failing tests do not substantiate a success");
    assert(exit.emittedDisposition === "ASK", `changed-files-but-failing-tests -> ASK, got ${exit.emittedDisposition}`);
    assert(exit.emittedBy === VERIFIER_IDENTITY, "the refusal is emitted by the verifier, not the backend");
    const lines = ledgerLines(bLedger);
    assert(!lines.some(l => l.disposition === "PASS" || l.disposition === "SUCCESS"),
      "no success recorded despite the file delta");
  });

  await test("(c) self-reported success with NO substantiating evidence -> ASK, never self-emitted", async () => {
    const cLedger = join(work, "c.ndjson");
    // exit 0 (backend claims done), a file delta, but NO test result (and not test-less by intent)
    const engine = engineWith(cLedger, mockDescriptor({ exitCode: 0, delta: ["src/z.ts"], tests: null }));
    await engine.executeSubagent(BACKEND, "do z", runConfig);
    const exit = engine.getUnitExits(RUN_ID)[0];
    assert(exit.emittedDisposition === "ASK", `no evidence -> ASK, got ${exit.emittedDisposition}`);
    assert(exit.emittedBy === VERIFIER_IDENTITY, "emitted by the verifier");
    const selfEmitted = ledgerLines(cLedger).some(l => (l.disposition === "PASS" || l.disposition === "SUCCESS") && l.emitter === l.producer);
    assert(!selfEmitted, "the external backend never self-emitted a binding success");
    const backendEmitted = ledgerLines(cLedger).some(l => l.emitter === BACKEND);
    assert(!backendEmitted, "the backend is never the emitter of any recorded move");
  });

  await test("(d) CLI failure (exit!=0) and timeout are first-class non-successes, not crashes", async () => {
    const fLedger = join(work, "fail.ndjson");
    const fEngine = engineWith(fLedger, mockDescriptor({ exitCode: 1, delta: [] }));
    await fEngine.executeSubagent(BACKEND, "broken", runConfig);
    const fExit = fEngine.getUnitExits(RUN_ID)[0];
    assert(fExit.proposed === "FIX", `non-zero exit -> FIX, got ${fExit.proposed}`);
    assert(fExit.emittedDisposition === "FIX" && fExit.emitted === true, "FIX recorded (a producer may record its own defect)");

    const tLedger = join(work, "timeout.ndjson");
    const tEngine = engineWith(tLedger, mockDescriptor({ exitCode: null, timedOut: true }));
    await tEngine.executeSubagent(BACKEND, "slow", runConfig);
    const tExit = tEngine.getUnitExits(RUN_ID)[0];
    assert(tExit.proposed === "BLOCK", `timeout -> BLOCK, got ${tExit.proposed}`);
    assert(tExit.emittedDisposition === "BLOCK", "BLOCK recorded; no crash, no silent success");
  });

  await test("(guard) no ledger across all runs has a success with emitter === producer", async () => {
    for (const f of ["a.ndjson", "b.ndjson", "c.ndjson", "fail.ndjson", "timeout.ndjson"]) {
      const bad = ledgerLines(join(work, f)).some(l => (l.disposition === "PASS" || l.disposition === "SUCCESS") && l.emitter === l.producer);
      assert(!bad, `${f} has a self-emitted success`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
