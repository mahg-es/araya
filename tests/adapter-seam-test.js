#!/usr/bin/env node
/**
 * ARAYA v2.0 — Adapter Seam Integration Test (Phase 1.6)
 *
 * Verifies:
 * 1. DelegationEngine defaults to PiAdapter for backward compatibility.
 * 2. PiAdapter and MockAdapter implement getCapabilities() correctly.
 * 3. PiAdapter and MockAdapter implement requestApproval() correctly.
 * 4. executeSubagent supports optional onEvent callbacks.
 *
 * Usage: node tests/adapter-seam-test.js
 */

const { readFileSync } = require("node:fs");
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

console.log("\n🧪 ARAYA v2.0 — Adapter Seam Integration Test (Phase 1.6)\n");

// Load config
const configPath = resolve(__dirname, "..", "araya.yaml");
const raw = readFileSync(configPath, "utf-8");
const config = load(raw);

// Sync Tests
test("DelegationEngine constructor still defaults to PiAdapter", () => {
  const engine = new DelegationEngine(config);
  assert(engine.adapter !== undefined, "Expected adapter property to exist");
  assert(engine.adapter instanceof PiAdapter, "Expected default adapter to be PiAdapter instance");
});

test("PiAdapter getCapabilities returns expected defaults", () => {
  const adapter = new PiAdapter(config);
  const caps = adapter.getCapabilities();
  assert(caps.hasBash === true, "PiAdapter should support bash");
  assert(caps.hasFilesystem === true, "PiAdapter should support filesystem");
  assert(caps.hasNetwork === true, "PiAdapter should support network");
  assert(caps.nativeToolUse === true, "PiAdapter should support native tool use");
});

test("MockAdapter getCapabilities returns expected defaults", () => {
  const adapter = new MockAdapter();
  const caps = adapter.getCapabilities();
  assert(caps.hasBash === true, "MockAdapter should support bash");
  assert(caps.hasFilesystem === true, "MockAdapter should support filesystem");
  assert(caps.hasNetwork === false, "MockAdapter should not support network");
  assert(caps.nativeToolUse === false, "MockAdapter should not support native tool use");
});

// Run Async Tests
(async () => {
  const runConfig = {
    mode: "standard",
    policy: "balanced",
    execution_mode: "adaptive",
    safe_mode: false,
    task: "Validation task for Phase 1.6",
  };

  // 1. requestApproval Validation
  try {
    const mock = new MockAdapter();
    const approved = await mock.requestApproval("delete_file", "Cleanup logs");
    assert(approved === true, "MockAdapter requestApproval should resolve to true");
    console.log("  ✅ MockAdapter requestApproval works as expected");
    passed++;
  } catch (e) {
    console.log("  ❌ MockAdapter requestApproval failed: " + e.message);
    failed++;
  }

  try {
    const pi = new PiAdapter(config);
    const approved = await pi.requestApproval("run_tests", "Verification phase");
    assert(approved === true, "PiAdapter requestApproval should fallback to true when headless");
    console.log("  ✅ PiAdapter requestApproval works with default fallback");
    passed++;
  } catch (e) {
    console.log("  ❌ PiAdapter requestApproval failed: " + e.message);
    failed++;
  }

  // 2. executeSubagent without callback (optional check)
  try {
    const mock = new MockAdapter();
    const engine = new DelegationEngine(config, mock);
    const output = await engine.executeSubagent("sonia", "Direct test task", runConfig, 1);
    assert(output.agent === "sonia", "Expected agent to be sonia");
    assert(output.status === "completed", "Expected status to be completed");
    console.log("  ✅ executeSubagent executes without onEvent callback");
    passed++;
  } catch (e) {
    console.log("  ❌ executeSubagent without callback failed: " + e.message);
    failed++;
  }

  // 3. executeSubagent with onEvent callback
  try {
    const mock = new MockAdapter();
    const engine = new DelegationEngine(config, mock);
    
    let eventReceived = null;
    const callback = (event) => {
      eventReceived = event;
    };

    const output = await engine.executeSubagent("sonia", "Task with callback", runConfig, 1, callback);
    
    assert(output.agent === "sonia", "Expected agent to be sonia");
    assert(eventReceived !== null, "Expected callback to have been executed");
    assert(eventReceived.type === "log", "Expected log event type");
    assert(eventReceived.agent === "sonia", "Expected event agent to be sonia");
    assert(eventReceived.payload.message.includes("Mock execution started"), "Expected message payload");

    console.log("  ✅ executeSubagent executes with optional onEvent callback");
    passed++;
  } catch (e) {
    console.log("  ❌ executeSubagent with callback failed: " + e.message);
    failed++;
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"═".repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
})();
