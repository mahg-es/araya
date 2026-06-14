#!/usr/bin/env node
/**
 * ARAYA v2.0 — can_write_code Emission Block Unit Test (AX Slice 1)
 *
 * Verifies ADR-0004 §3.2: an agent with can_write_code:false is blocked from
 * emitting a deliverable, while legitimate flows remain unaffected.
 *
 * 1. (a) BLOCK   — can_write_code:false agent that produces an artifact is blocked.
 * 2. (b) ALLOW   — can_write_code:true agent producing an artifact emits normally
 *                  (the legitimate flow is unaffected — No Big Bang).
 * 3. (d) ALLOW   — can_write_code:false agent doing a plan/review (no produced
 *                  artifact) is permitted; it may plan, review, approve, delegate.
 * 4. (e) TIER    — a reasoning-tier agent with can_write_code:true (isla/maria
 *                  case) is NOT blocked: the gate keys off the flag, never the
 *                  tier. Guards the finding-2 trap.
 * 5. (f) BLOCK   — tests_added (not just files_changed) counts as a produced
 *                  artifact for a can_write_code:false agent.
 * 6. (c) DEFER   — producer-not-emitter (ADR-0004 §3.1) has no hook today; it
 *                  depends on the Slice 2 disposition machine. Reported as a
 *                  documented deferral, NOT asserted via a fake passing check.
 *
 * Usage: node tests/can-write-code-enforcement-test.js   (after `npm run build`)
 */

const { DelegationEngine } = require("../dist/araya/v2/index.js");

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

async function assertRejects(promise, message) {
  let threw = false;
  try {
    await promise;
  } catch (_e) {
    threw = true;
  }
  assert(threw, message || "expected promise to reject");
}

// Minimal config: three agents covering the flag/tier matrix.
const config = {
  agents: {
    valentina: { role: "Developer", model_tier: "balanced", permissions: { can_write_code: true } },
    manu: { role: "Product Owner", model_tier: "reasoning", permissions: { can_write_code: false } },
    isla: { role: "Infra Architect", model_tier: "reasoning", permissions: { can_write_code: true } },
  },
};

const runConfig = { mode: "standard", policy: "balanced", execution_mode: "adaptive" };

// Adapter that returns a controllable output, so we can simulate an agent
// producing (or not producing) an artifact regardless of the agent.
function adapterReturning({ files_changed = [], tests_added = 0 }) {
  return {
    async executeSubagent(agentName) {
      return {
        run_id: "test-run",
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
        files_changed,
        tests_added,
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
    },
  };
}

function engineWith(output) {
  return new DelegationEngine(config, adapterReturning(output));
}

(async () => {
  console.log("can_write_code emission block (ADR-0004 §3.2 — Slice 1)\n");

  // (a) BLOCK: can_write_code:false agent that produces an artifact.
  await test("(a) can_write_code:false agent producing an artifact is BLOCKED", async () => {
    const engine = engineWith({ files_changed: ["src/feature.ts"] });
    await assertRejects(
      engine.executeSubagent("manu", "write the feature", runConfig),
      "expected manu (can_write_code:false) to be blocked from emitting a deliverable"
    );
    // Blocked emission must not be stored.
    assert(engine.getRunOutputs("test-run").length === 0, "blocked deliverable must not be stored");
  });

  // (b) ALLOW: can_write_code:true agent producing an artifact — legitimate flow.
  await test("(b) can_write_code:true agent producing an artifact emits normally", async () => {
    const engine = engineWith({ files_changed: ["src/feature.ts"] });
    const out = await engine.executeSubagent("valentina", "implement the feature", runConfig);
    assert(out && out.agent === "valentina", "valentina's deliverable should emit unaffected");
    assert(engine.getRunOutputs("test-run").length === 1, "legitimate deliverable should be stored");
  });

  // (d) ALLOW: can_write_code:false agent doing a non-producing plan/review.
  await test("(d) can_write_code:false agent with no produced artifact (a plan) is ALLOWED", async () => {
    const engine = engineWith({ files_changed: [], tests_added: 0 });
    const out = await engine.executeSubagent("manu", "plan the work", runConfig);
    assert(out && out.agent === "manu", "manu may plan/review/approve/delegate (no artifact produced)");
  });

  // (e) TIER: reasoning-tier agent with can_write_code:true is NOT blocked.
  await test("(e) reasoning-tier agent with can_write_code:true is NOT blocked (flag, not tier)", async () => {
    const engine = engineWith({ files_changed: ["infra/main.tf"] });
    const out = await engine.executeSubagent("isla", "provision infra", runConfig);
    assert(out && out.agent === "isla", "isla is reasoning-tier but can_write_code:true — must emit normally");
  });

  // (f) BLOCK: tests_added also counts as a produced artifact.
  await test("(f) can_write_code:false agent adding tests (no files) is BLOCKED", async () => {
    const engine = engineWith({ files_changed: [], tests_added: 3 });
    await assertRejects(
      engine.executeSubagent("manu", "add tests", runConfig),
      "tests_added > 0 is a produced artifact and must be blocked for can_write_code:false"
    );
  });

  // (c) DEFER: producer-not-emitter — honest deferral, not a fake assertion.
  console.log(
    "  ⏭️  (c) producer-not-emitter (ADR-0004 §3.1) DEFERRED to Slice 2 — " +
      "no emitter identity / disposition state machine / arbiter ledger exists in src today; " +
      "not stubbed as an always-pass check."
  );

  console.log(`\n${passed} passed, ${failed} failed (1 deferred)`);
  process.exit(failed === 0 ? 0 : 1);
})();
