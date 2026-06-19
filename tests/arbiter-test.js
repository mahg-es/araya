#!/usr/bin/env node
/**
 * ARAYA v2.0 — Arbiter Test (AX Slice 3, ADR-0008) — ADVERSARIAL.
 *
 * The arbiter can only be proven by making it fire. These tests deliberately
 * trip it:
 *   (a) a single illegal transition records one strike with the full schema;
 *   (b) reaching a standard gate's max_strikes (3) triggers ESCALATE-and-remove;
 *   (c) a zero-tolerance gate (producer-is-emitter) strikes out on the FIRST
 *       violation, under a simulated (culpable) emitter;
 *   (d) PROPERTY A — a manufactured flaky failure routes to strike_delta:0,
 *       zero strike (and a deterministic failure does count);
 *   (e) PROPERTY B — a struck-out identity is removed and cannot take the next
 *       attempt; a DIFFERENT identity (or the protocol/human) receives it;
 *   (f) strikes are scoped per agent per slice and reset across slices;
 *   (g) the arbiter writes ONLY to arbiter.ndjson, never score.ndjson;
 *   (h) the live ADR-0007 B-2 deferral is UNTOUCHED — the live loop still defers
 *       producer-is-emitter and records NO strike (no arbiter wired in-loop).
 *
 * Uses temp ledger paths — never the real ledgers (constraint 2).
 * Usage: node tests/arbiter-test.js   (after `npm run build`)
 */

const {
  DispositionEngine, ScoreLedger, ArbiterEngine, ArbiterLedger,
  DelegationEngine, PROTOCOL_HUMAN, MAX_STRIKES,
} = require("../dist/araya/v2/index.js");
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
function assert(c, m) { if (!c) throw new Error(m || "assertion failed"); }

const ARB = join(__dirname, ".tmp-arbiter.ndjson");
const SCORE = join(__dirname, ".tmp-arbiter-score.ndjson");
function fresh() { for (const p of [ARB, SCORE]) if (existsSync(p)) rmSync(p); }
function lines(p) { return existsSync(p) ? readFileSync(p, "utf-8").split("\n").filter(Boolean).map(l => JSON.parse(l)) : []; }
function arb() { return lines(ARB); }
function score() { return lines(SCORE); }

/** A DispositionEngine wired to a fresh arbiter at the temp paths. */
function wired(scope = "slice-3-test") {
  const arbiter = new ArbiterEngine({ ledgerPath: ARB });
  const disp = new DispositionEngine(new ScoreLedger(SCORE), arbiter);
  disp.setArbiterScope(scope);
  return { disp, arbiter };
}
const single = { unit: "leaf", declaredGates: ["g1"], producer: "valentina" };
const multi = { unit: "node", declaredGates: ["g1", "g2"], producer: "valentina" };
function move(over = {}) {
  return { timestamp: "2026-06-15T00:00:00Z", spec: "ax", slice: "slice-3", adr_ids: [], contract_ids: [], commit: "test", skillset: [], evidence_ref: "test", ...over };
}
const SCHEMA_KEYS = ["timestamp","slice","unit","agent","gate","severity","violation_type","rule_violated","strike_number","max_strikes","strike_delta","action_taken","evidence_ref"];

(async () => {
  console.log("arbiter — strikes, quarantine, ESCALATE-and-remove (ADR-0008 — Slice 3)\n");

  // (a) one illegal transition → one strike with the full schema.
  await test("(a) a single illegal transition records one strike with the ADR-0008 schema", async () => {
    fresh();
    const { disp } = wired();
    // SUCCESS proposed on a single-gate unit → illegal-by-shape (standard).
    const r = disp.emit(single, "SUCCESS", "valentina", move());
    assert(!r.ok && r.rejection.kind === "illegal-transition", "expected an illegal-by-shape rejection");
    const e = arb();
    assert(e.length === 1, `expected exactly one arbiter line, got ${e.length}`);
    for (const k of SCHEMA_KEYS) assert(k in e[0], `arbiter entry missing schema key '${k}'`);
    assert(e[0].violation_type === "illegal-transition" && e[0].severity === "standard", "illegal-by-shape is standard");
    assert(e[0].strike_number === 1 && e[0].max_strikes === 3 && e[0].strike_delta === 1, "first standard strike: 1/3, delta 1");
    assert(e[0].action_taken === "reject-and-return", "a non-terminal strike rejects-and-returns");
    assert(e[0].agent === "valentina" && e[0].gate === "leaf" && e[0].slice === "slice-3-test", "identity/gate/slice recorded");
  });

  // (b) reaching a standard gate's max_strikes (3) → ESCALATE-and-remove.
  await test("(b) reaching a standard gate's max_strikes (3) triggers ESCALATE-and-remove", async () => {
    fresh();
    const { disp, arbiter } = wired();
    for (let i = 0; i < 3; i++) disp.emit(single, "SUCCESS", "valentina", move());
    const e = arb();
    assert(e.length === 3, `expected 3 strikes, got ${e.length}`);
    assert(e[2].strike_number === 3 && e[2].action_taken === "tripped-escalate-and-remove", "3rd standard strike trips the terminal action");
    assert(arbiter.canAttempt("slice-3-test", "leaf", "leaf", "valentina") === false, "after strikeout the agent is removed");
  });

  // (c) zero-tolerance (producer-is-emitter) strikes out on the FIRST violation,
  //     under a SIMULATED culpable emitter (vs the live B-2 deferral — test h).
  await test("(c) producer-is-emitter is zero-tolerance — first violation strikes out (simulated emitter)", async () => {
    fresh();
    const { disp, arbiter } = wired();
    // multi-gate SUCCESS with emitter === producer → producer-is-emitter.
    const r = disp.emit(multi, "SUCCESS", "valentina", move());
    assert(!r.ok && r.rejection.kind === "producer-is-emitter", "expected a producer-is-emitter rejection");
    const e = arb();
    assert(e.length === 1, "one strike");
    assert(e[0].violation_type === "producer-is-emitter" && e[0].severity === "zero_tolerance", "self-certification is zero-tolerance");
    assert(e[0].max_strikes === 1 && e[0].strike_number === 1 && e[0].action_taken === "tripped-escalate-and-remove", "zero-tolerance strikes out on the first attempt");
    assert(arbiter.canAttempt("slice-3-test", "node", "node", "valentina") === false, "struck out on the first self-certification");
  });

  // (d) PROPERTY A — flaky quarantine is real.
  await test("(d) PROPERTY A: a manufactured flaky failure routes to strike_delta:0, ZERO strike", async () => {
    fresh();
    const arbiter = new ArbiterEngine({ ledgerPath: ARB });
    const gv = { slice: "run-1", unit: "u1", agent: "teresa", gate: "ui-test", violation_type: "gate-failure", rule_violated: "ui test failed" };
    // fails, then PASSES on rerun within budget → flaky.
    const flaky = arbiter.recordGateFailure(gv, [true]);
    assert(flaky.recorded.strike_delta === 0 && flaky.recorded.action_taken === "quarantined", "a flaky failure is quarantined with strike_delta 0");
    assert(flaky.struckOut === false, "a flaky failure never strikes out");
    assert(arbiter.strikeCount("run-1", "teresa", "ui-test") === 0, "PROPERTY A: zero strike for a flaky (infra) failure");
    // contrast: all reruns fail within budget → deterministic → a real strike.
    const det = arbiter.recordGateFailure(gv, [false, false]);
    assert(det.recorded.strike_delta === 1 && arbiter.strikeCount("run-1", "teresa", "ui-test") === 1, "a deterministic failure does count one strike");
  });

  // (e) PROPERTY B — ESCALATE-and-remove genuinely removes + reassigns.
  await test("(e) PROPERTY B: a struck-out identity is removed; a DIFFERENT identity receives the next attempt", async () => {
    fresh();
    const arbiter = new ArbiterEngine({ ledgerPath: ARB });
    const v = { slice: "run-2", unit: "feature-x", agent: "valentina", gate: "impl", violation_type: "illegal-transition", rule_violated: "x" };
    for (let i = 0; i < MAX_STRIKES.standard; i++) arbiter.recordViolation(v); // drive valentina to her limit (3)
    assert(arbiter.canAttempt("run-2", "feature-x", "impl", "valentina") === false, "the struck-out agent CANNOT keep attempting");
    const next = arbiter.nextAssignee("run-2", "feature-x", "impl", ["valentina", "diana"]);
    assert(next === "diana", `reassignment must go to a DIFFERENT identity, got ${next}`);
    assert(next !== "valentina", "the struck-out agent must NOT receive the reassignment");
    // no other capable identity → protocol/human, never the struck-out agent.
    const none = arbiter.nextAssignee("run-2", "feature-x", "impl", ["valentina"]);
    assert(none === PROTOCOL_HUMAN, "with no different capable identity, escalate to protocol/human — never the struck-out agent");
  });

  // (f) per agent per slice; reset across slices.
  await test("(f) strikes are scoped per agent per slice and reset across slices", async () => {
    fresh();
    const arbiter = new ArbiterEngine({ ledgerPath: ARB });
    const mk = (slice, agent) => ({ slice, unit: "u", agent, gate: "g", violation_type: "illegal-transition", rule_violated: "x" });
    arbiter.recordViolation(mk("run-A", "v")); arbiter.recordViolation(mk("run-A", "v")); // v: 2 in run-A
    arbiter.recordViolation(mk("run-B", "v")); // v: 1 in run-B (independent slice)
    arbiter.recordViolation(mk("run-A", "d")); // d: 1 in run-A (independent agent)
    assert(arbiter.strikeCount("run-A", "v", "g") === 2, "per-slice count for run-A/v");
    assert(arbiter.strikeCount("run-B", "v", "g") === 1, "run-B is independent of run-A (per slice)");
    assert(arbiter.strikeCount("run-A", "d", "g") === 1, "run-A/d is independent of run-A/v (per agent)");
    arbiter.resetSlice("run-A");
    assert(arbiter.strikeCount("run-A", "v", "g") === 0 && arbiter.strikeCount("run-A", "d", "g") === 0, "reset clears run-A");
    assert(arbiter.strikeCount("run-B", "v", "g") === 1, "reset across slices does NOT touch run-B");
  });

  // (g) arbiter writes ONLY to arbiter.ndjson, never score.ndjson.
  await test("(g) the arbiter writes only to arbiter.ndjson; legal moves go to score.ndjson; the two stay distinct", async () => {
    fresh();
    const { disp } = wired();
    disp.emit(single, "SUCCESS", "valentina", move()); // illegal → arbiter only
    disp.emit(multi, "SUCCESS", "valentina", move());   // producer-is-emitter → arbiter only
    assert(arb().length === 2, "two violations recorded to the arbiter ledger");
    assert(score().length === 0, "NO arbiter strike ever writes to the score ledger");
    // a legal move writes to the score ledger, not the arbiter ledger.
    const ok = disp.emit(multi, "SUCCESS", "daneel", move()); // distinct emitter → legal SUCCESS
    assert(ok.ok && ok.disposition === "SUCCESS", "a legal SUCCESS is emitted");
    assert(score().length === 1, "the legal move is recorded to the score ledger");
    assert(arb().length === 2, "the legal move does NOT touch the arbiter ledger");
  });

  // (h) the live ADR-0007 B-2 deferral is UNTOUCHED — no arbiter wired in-loop.
  await test("(h) the live B-2 deferral is untouched: producer-is-emitter still defers, records NO strike", async () => {
    fresh();
    const config = { agents: { valentina: { role: "Dev", model_tier: "balanced", skills: [], permissions: { can_write_code: true } } } };
    const adapter = { async executeSubagent(agentName) {
      return { run_id: "live-run", trace_id: "t", delegation_depth: 0, agent: agentName, role: "Dev", status: "completed",
        mode: "standard", policy: "balanced", execution_mode: "adaptive", confidence: 0.95, low_confidence_items: [],
        escalation_reason: null, requires_human_approval: false, approval_reason: null, model_provider: "t", model_used: "t",
        model_tier: "balanced", reasoning_effort: "medium", fallback_provider_used: null, fallback_reason: null,
        input_tokens: 0, output_tokens: 0, reasoning_tokens: 0, cost_estimate_usd: null, execution_time_ms: 0, retry_count: 0,
        files_changed: [], tests_added: 0, tests_run: 0, tests_passed: true, coverage_percent: null, risks: [], blockers: [],
        pending_items: [], recommendation: "proceed", evidence: { logs: [], screenshots: [], reports: [], coverage_files: [], benchmarks: [], audit_trail: [] },
        summary: "ok", next_phase: "done", capabilities_used: [] };
    }};
    // The live DelegationEngine wires NO arbiter (Option A). Even with ARB on disk,
    // a successful delivery must defer (Slice-2 behavior) and write zero strikes.
    const engine = new DelegationEngine(config, adapter, SCORE);
    await engine.executeSubagent("valentina", "do work", { mode: "standard", policy: "balanced", execution_mode: "adaptive" });
    const exit = engine.getUnitExits("live-run")[0];
    assert(exit && exit.proposed === "PASS", "the live success still proposes PASS by shape");
    assert(exit.emitted === false && exit.pendingIndependentEmitter === true, "the live success is still DEFERRED (B-2), unchanged");
    assert(arb().length === 0, "the live B-2 deferral records NO arbiter strike — it is not wired in-loop");
  });

  fresh();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
})();
