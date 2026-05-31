#!/usr/bin/env node
/**
 * ARAYA v2.0 — Adapter Seam Integration Test
 *
 * Verifies:
 * 1. DelegationEngine accepts custom adapter (e.g., MockAdapter)
 * 2. MockAdapter execution correctly populates state and run outputs
 * 3. DelegationEngine defaults to PiAdapter for backward compatibility
 *
 * Usage: node tests/adapter-seam-test.js
 */

const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { load } = require("js-yaml");

// Import from the built JS folder
const {
  DelegationEngine,
  MockAdapter,
  PiAdapter,
} = require("../dist/araya/v2/index.js");

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
  if (!condition) throw new Error(message || "Assertion failed");
}

console.log("\n🧪 ARAYA v2.0 — Adapter Seam Integration Test\n");

// Load config
const configPath = resolve(__dirname, "..", "araya.yaml");
const raw = readFileSync(configPath, "utf-8");
const config = load(raw);

test("MockAdapter executes and updates delegation outputs", async () => {
  const mockAdapter = new MockAdapter();
  const engine = new DelegationEngine(config, mockAdapter);

  const runConfig = {
    mode: "standard",
    policy: "balanced",
    execution_mode: "adaptive",
    safe_mode: false,
    task: "Test mock subagent execution",
  };

  const output = await engine.executeSubagent("sonia", "Orchestrate test plan", runConfig, 0);

  // Assertions on output
  assert(output.agent === "sonia", "Expected agent to be sonia");
  assert(output.status === "completed", "Expected status to be completed");
  assert(output.confidence === 0.95, "Expected confidence to be 0.95");
  assert(output.summary.includes("Orchestrate test plan"), "Expected task text in mock summary");

  // Assertions on stored outputs
  const runOutputs = engine.getRunOutputs(output.run_id);
  assert(runOutputs.length === 1, `Expected 1 stored output, got ${runOutputs.length}`);
  assert(runOutputs[0].agent === "sonia", "Expected stored agent output to be sonia");
});

test("DelegationEngine constructor defaults to PiAdapter", () => {
  const engine = new DelegationEngine(config);
  
  // Verify adapter property exists and is a PiAdapter instance
  assert(engine.adapter !== undefined, "Expected adapter property to exist");
  assert(engine.adapter instanceof PiAdapter, "Expected default adapter to be PiAdapter instance");
});

test("PiAdapter resolves and instantiates correctly", () => {
  const adapter = new PiAdapter(config);
  assert(adapter !== null, "PiAdapter failed to instantiate");
});

// Run async tests sequentially
(async () => {
  try {
    console.log("1. Running Adapter Seam Tests...");
    
    // We run async test manually to capture execution context correctly
    const mockAdapter = new MockAdapter();
    const engine = new DelegationEngine(config, mockAdapter);
    const runConfig = {
      mode: "standard",
      policy: "balanced",
      execution_mode: "adaptive",
      safe_mode: false,
      task: "Test mock subagent execution",
    };

    const output = await engine.executeSubagent("sonia", "Orchestrate test plan", runConfig, 0);
    assert(output.agent === "sonia", "Expected agent to be sonia");
    assert(output.status === "completed", "Expected status to be completed");
    assert(output.confidence === 0.95, "Expected confidence to 0.95");
    const runOutputs = engine.getRunOutputs(output.run_id);
    assert(runOutputs.length === 1, `Expected 1 stored output, got ${runOutputs.length}`);
    console.log("  ✅ MockAdapter executes and updates delegation outputs");
    passed++;
  } catch (e) {
    console.log("  ❌ MockAdapter executes and updates delegation outputs: " + e.message);
    failed++;
  }

  // Synchronous tests
  test("DelegationEngine constructor defaults to PiAdapter", () => {
    const engine = new DelegationEngine(config);
    assert(engine.adapter !== undefined, "Expected adapter property to exist");
    assert(engine.adapter instanceof PiAdapter, "Expected default adapter to be PiAdapter instance");
  });

  test("PiAdapter resolves and instantiates correctly", () => {
    const adapter = new PiAdapter(config);
    assert(adapter !== null, "PiAdapter failed to instantiate");
  });

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"═".repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
})();
