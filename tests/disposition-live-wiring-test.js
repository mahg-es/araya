#!/usr/bin/env node
/**
 * ARAYA v2.0 — Disposition Live-Wiring Test (AX, ADR-0007)
 *
 * Proves the disposition machine is wired as the canonical exit of the LIVE
 * delivery loop (DelegationEngine.executeSubagent), additively and honestly.
 *
 * (a) the live delivery loop exits through a typed disposition (one per unit),
 *     and status:"completed" is preserved untouched for the downstream readers.
 * (b) the typed exit is recorded to the ledger (TEST path) — one entry per
 *     non-success unit (a producer may flag its own non-success exit).
 * (c) an illegal transition is rejected in the live path and writes nothing.
 * (d) HONESTY (ADR-0007 §3b, constraint 6): the live loop does NOT auto-emit
 *     SUCCESS for the producing agent. The producer-not-emitter check fires live
 *     (producer-is-emitter), no emitter is fabricated, and the binding success
 *     is deferred to an independent emitter via the named Slice-8 seam.
 *
 * Uses a temp ledger path — never the real ledger (constraint 2).
 * Usage: node tests/disposition-live-wiring-test.js   (after `npm run build`)
 */

const { DelegationEngine, DISPOSITIONS } = require("../dist/araya/v2/index.js");
const { existsSync, rmSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
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

const LEDGER = join(__dirname, ".tmp-live-wiring-score.ndjson");
function freshLedger() {
  if (existsSync(LEDGER)) rmSync(LEDGER);
}
function ledgerLines() {
  if (!existsSync(LEDGER)) return [];
  return readFileSync(LEDGER, "utf-8").split("\n").filter(Boolean).map(l => JSON.parse(l));
}

// can_write_code:true so the Slice-1 emission block never interferes; outputs
// carry no artifacts anyway.
const config = {
  agents: {
    valentina: { role: "Developer", model_tier: "balanced", skills: ["impl"], permissions: { can_write_code: true } },
    diana: { role: "Security", model_tier: "reasoning", skills: ["sec"], permissions: { can_write_code: true } },
  },
};

const runConfig = { mode: "standard", policy: "balanced", execution_mode: "adaptive" };

function baseOutput(agentName) {
  return {
    run_id: `${agentName}-run`,
    trace_id: "test-trace",
    delegation_depth: 0,
    agent: agentName,
    role: "Test Role",
    status: "completed",
    mode: "standard",
    policy: "balanced",
    execution_mode: "adaptive",
    confidence: 0.95,
    low_confidence_items: [],
    escalation_reason: null,
    requires_human_approval: false,
    approval_reason: null,
    model_provider: "test",
    model_used: "test",
    model_tier: "balanced",
    reasoning_effort: "medium",
    fallback_provider_used: null,
    fallback_reason: null,
    input_tokens: 0,
    output_tokens: 0,
    reasoning_tokens: 0,
    cost_estimate_usd: null,
    execution_time_ms: 0,
    retry_count: 0,
    files_changed: [],
    tests_added: 0,
    tests_run: 0,
    tests_passed: true,
    coverage_percent: null,
    risks: [],
    blockers: [],
    pending_items: [],
    recommendation: "proceed",
    evidence: { logs: [], screenshots: [], reports: [], coverage_files: [], benchmarks: [], audit_trail: [] },
    summary: "test output",
    next_phase: "done",
    capabilities_used: [],
  };
}

// Adapter that returns a controllable output, so we can drive the LIVE loop with
// a chosen status and (optionally) a producer-proposed disposition.
function adapterReturning({ status = "completed", proposed_disposition } = {}) {
  return {
    async executeSubagent(agentName) {
      const o = { ...baseOutput(agentName), status };
      if (proposed_disposition !== undefined) o.proposed_disposition = proposed_disposition;
      return o;
    },
  };
}

(async () => {
  console.log("disposition live-wiring at the real exit (ADR-0007 — Option A / B-2)\n");

  // (a) typed exit per unit + status preserved.
  await test("(a) the live loop exits through one typed disposition per unit; status preserved", async () => {
    freshLedger();
    const engine = new DelegationEngine(config, adapterReturning({ status: "completed" }), LEDGER);
    const out = await engine.executeSubagent("valentina", "do work", runConfig);
    const exits = engine.getUnitExits("valentina-run");
    assert(exits.length === 1, "exactly one typed exit per delegated unit");
    assert(DISPOSITIONS.includes(exits[0].proposed), `exit must be a typed disposition, got ${exits[0].proposed}`);
    assert(out.status === "completed", "status:'completed' must be preserved untouched for downstream readers");
  });

  // (b) one ledger entry per non-success unit (producer may flag its own defect).
  await test("(b) a non-success exit records exactly one ledger move per unit", async () => {
    freshLedger();
    const engine = new DelegationEngine(config, adapterReturning({ status: "blocked" }), LEDGER);
    await engine.executeSubagent("valentina", "x", runConfig);
    await engine.executeSubagent("diana", "y", runConfig);
    const lines = ledgerLines();
    assert(lines.length === 2, `expected one entry per non-success unit (2), got ${lines.length}`);
    assert(lines.every(l => l.disposition === "BLOCK"), "status 'blocked' maps to a BLOCK disposition");
    assert(new Set(lines.map(l => l.unit)).size === 2, "two distinct units must be recorded");
    assert(engine.getUnitExits("valentina-run")[0].emitted === true, "a non-success move is emitted and recorded");
  });

  // (c) illegal transition rejected in the live path; writes nothing.
  await test("(c) an illegal transition (producer proposes SUCCESS on a single-gate unit) is rejected live", async () => {
    freshLedger();
    const engine = new DelegationEngine(config, adapterReturning({ status: "completed", proposed_disposition: "SUCCESS" }), LEDGER);
    await engine.executeSubagent("valentina", "x", runConfig);
    const exit = engine.getUnitExits("valentina-run")[0];
    assert(exit.emitted === false, "an illegal proposal must not be emitted");
    assert(exit.rejection && exit.rejection.kind === "illegal-transition", `expected illegal-transition, got ${exit.rejection && exit.rejection.kind}`);
    assert(ledgerLines().length === 0, "a rejected illegal transition writes no ledger line");
  });

  // (d) HONESTY: the live loop does NOT auto-emit SUCCESS for the producing agent.
  await test("(d) the live loop does NOT auto-emit the producer's own success (no fabricated emitter)", async () => {
    freshLedger();
    const engine = new DelegationEngine(config, adapterReturning({ status: "completed" }), LEDGER);
    await engine.executeSubagent("valentina", "x", runConfig);
    const exit = engine.getUnitExits("valentina-run")[0];
    assert(exit.proposed === "PASS", `a completed single-gate (leaf) unit proposes PASS by shape, got ${exit.proposed}`);
    assert(exit.emitted === false, "the producer's own success must NOT be auto-emitted in-loop");
    assert(exit.rejection && exit.rejection.kind === "producer-is-emitter", "the producer-not-emitter check must fire live (no fabricated emitter)");
    assert(exit.pendingIndependentEmitter === true, "the binding success is deferred to an independent emitter (Slice-8 seam)");
    assert(exit.producer === "valentina", "the producer is the producing agent");
    assert(ledgerLines().length === 0, "no PASS/SUCCESS is written for the producer's own run");
  });

  freshLedger();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
