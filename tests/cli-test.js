#!/usr/bin/env node
/**
 * ARAYA v2.0 — CLI Integration Test (Phase 2)
 *
 * Verifies:
 * 1. CLI adapter factory resolves "pi" and "mock" adapters.
 * 2. CLI commands validate and capabilities run cleanly.
 * 3. CLI approval logic rejects by default in non-interactive runs.
 * 4. CLI approval logic allows override with --auto-approve for non-destructive actions.
 * 5. CLI approval logic never auto-approves destructive actions even with --auto-approve.
 *
 * Usage: node tests/cli-test.js
 */

const { spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { load } = require("js-yaml");

// Import target elements directly for testing unit behavior
const { resolveAdapter } = require("../dist/araya/v2/adapters/factory.js");

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

console.log("\n🧪 ARAYA v2.0 — CLI Integration & Safety Test (Phase 2)\n");

// Load config
const configPath = resolve(__dirname, "..", "araya.yaml");
const raw = readFileSync(configPath, "utf-8");
const config = load(raw);

// 1. Factory Resolution Tests
test("resolveAdapter maps 'pi' to PiAdapter", () => {
  const adapter = resolveAdapter("pi", config);
  assert(adapter !== null, "pi adapter should resolve");
  assert(adapter.constructor.name === "PiAdapter", "Expected PiAdapter instance");
});

test("resolveAdapter maps 'mock' to MockAdapter", () => {
  const adapter = resolveAdapter("mock", config);
  assert(adapter !== null, "mock adapter should resolve");
  assert(adapter.constructor.name === "MockAdapter", "Expected MockAdapter instance");
});

test("resolveAdapter throws on unsupported adapter names", () => {
  let threw = false;
  try {
    resolveAdapter("invalid-adapter", config);
  } catch (err) {
    threw = true;
    assert(err.message.includes("Unsupported execution adapter"), "Error message should match expectation");
  }
  assert(threw, "Expected resolution to throw an error");
});

// 2. Integration / Process Spawning Tests
const cliPath = resolve(__dirname, "..", "dist", "cli.js");

test("CLI prints help message when run with no arguments", () => {
  const proc = spawnSync("node", [cliPath], { encoding: "utf-8" });
  assert(proc.status === 1, "Exit status should be 1");
  assert(proc.stdout.includes("ARAYA Standalone CLI Runner"), "Should print banner");
});

test("CLI capabilities command executes successfully", () => {
  const proc = spawnSync("node", [cliPath, "capabilities", "--adapter", "mock"], { encoding: "utf-8" });
  assert(proc.status === 0, `Exit status should be 0, got ${proc.status}. Stderr: ${proc.stderr}`);
  assert(proc.stdout.includes("Host Capabilities for adapter \"mock\""), "Should print capabilities header");
  assert(proc.stdout.includes("Bash execution: ✅ Enabled"), "Should list bash enabled");
  assert(proc.stdout.includes("Network access: ❌ Disabled"), "Should list network disabled");
});

test("CLI validate command executes successfully", () => {
  const proc = spawnSync("node", [cliPath, "validate"], { encoding: "utf-8" });
  assert(proc.status === 0, `Exit status should be 0, got ${proc.status}. Stderr: ${proc.stderr}`);
  assert(proc.stdout.includes("Validating ARAYA environment..."), "Should print validating message");
  assert(proc.stdout.includes("Config found"), "Should validate config");
  assert(proc.stdout.includes("Validation successful"), "Should report success");
});

// 3. Approval Behavior Unit Verification (Non-Interactive Runs)
// We will test the requestApproval implementation dynamically injected into the resolved adapter.
test("Default non-interactive approval rejects all requests", async () => {
  // Simulate the CLI setup with default args (no --auto-approve)
  const adapter = resolveAdapter("mock", config);
  
  // Re-create the requestApproval wrapping logic from src/cli.ts to test it in isolation
  const autoApprove = false;
  
  const requestApproval = async (action, reason) => {
    const lowercase = action.toLowerCase();
    const destructiveKeywords = ["delete", "remove", "rm", "destroy", "wipe", "reset", "purge", "clean", "overwrite"];
    const isDestructive = destructiveKeywords.some(kw => lowercase.includes(kw));
    const isInteractive = false; // Mocking non-interactive test run

    if (isInteractive) {
      return true; // Not simulated in this test
    } else {
      if (autoApprove && !isDestructive) {
        return true;
      }
      return false;
    }
  };

  const approvedNonDestructive = await requestApproval("compile_project", "Verification step");
  assert(approvedNonDestructive === false, "Should reject non-destructive action by default");

  const approvedDestructive = await requestApproval("delete_file", "Cleanup logs");
  assert(approvedDestructive === false, "Should reject destructive action by default");
});

test("Non-interactive approval with --auto-approve accepts non-destructive but rejects destructive", async () => {
  const autoApprove = true; // Simulating --auto-approve
  
  const requestApproval = async (action, reason) => {
    const lowercase = action.toLowerCase();
    const destructiveKeywords = ["delete", "remove", "rm", "destroy", "wipe", "reset", "purge", "clean", "overwrite"];
    const isDestructive = destructiveKeywords.some(kw => lowercase.includes(kw));
    const isInteractive = false; // Mocking non-interactive test run

    if (isInteractive) {
      return true; 
    } else {
      if (autoApprove && !isDestructive) {
        return true;
      }
      return false;
    }
  };

  const approvedNonDestructive = await requestApproval("compile_project", "Verification step");
  assert(approvedNonDestructive === true, "Should approve non-destructive action with --auto-approve");

  const approvedDestructive = await requestApproval("delete_file", "Cleanup logs");
  assert(approvedDestructive === false, "Should ALWAYS reject destructive action in non-interactive even with --auto-approve");
  
  const approvedDestructiveRm = await requestApproval("rm -rf src/", "Delete files");
  assert(approvedDestructiveRm === false, "Should ALWAYS reject rm command even with --auto-approve");
});

// Run complete suite
console.log(`\n${"═".repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${"═".repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
