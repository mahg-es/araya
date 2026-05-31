#!/usr/bin/env node
/**
 * ARAYA v2.0 — Provider Registry Unit Test (Phase 3.6)
 *
 * Verifies:
 * 1. Resolves default pi.dev provider.
 * 2. Resolves configured provider by name.
 * 3. Resolves fast/balanced/reasoning model tiers.
 * 4. Rejects unknown provider.
 * 5. Rejects unknown model tier.
 * 6. Detects missing API key env var without printing value.
 * 7. Reads cost rates.
 * 8. Reads provider capabilities.
 * 9. Preserves backward compatibility with existing araya.yaml (empty config fallback).
 * 10. Does not require external network.
 *
 * Usage: node tests/provider-registry-test.js
 */

const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { load } = require("js-yaml");
const { ProviderRegistry } = require("../dist/araya/v2/index.js");

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

console.log("\n🧪 ARAYA v2.0 — Provider Registry Validation Test (Phase 3.6)\n");

// Load live config
const configPath = resolve(__dirname, "..", "araya.yaml");
const raw = readFileSync(configPath, "utf-8");
const config = load(raw);

const registry = new ProviderRegistry(config);

// 1. Resolves default pi.dev provider
test("Resolves default pi.dev / pi provider details", () => {
  const providerPi = registry.resolveProvider("pi");
  assert(providerPi !== null, "pi provider configuration should resolve");
  assert(providerPi.api_key_env === "PI_API_KEY", "Expected correct API key env variable configuration");

  const providerPiDev = registry.resolveProvider("pi.dev");
  assert(providerPiDev !== null, "pi.dev alias should map to pi and resolve");
  assert(providerPiDev.api_key_env === "PI_API_KEY", "Expected correct API key env variable mapping for pi.dev");
});

// 2. Resolves configured provider by name
test("Resolves configured provider 'openai' by name", () => {
  const provider = registry.resolveProvider("openai");
  assert(provider !== null, "openai provider should resolve");
  assert(provider.api_key_env === "OPENAI_API_KEY", "Expected correct API key env");
});

// 3. Resolves model tiers
test("Resolves fast/balanced/reasoning model tiers for 'openai'", () => {
  const fast = registry.resolveModel("openai", "fast");
  assert(fast === "gpt-4o-mini", `Expected gpt-4o-mini, got: ${fast}`);

  const balanced = registry.resolveModel("openai", "balanced");
  assert(balanced === "gpt-4o", `Expected gpt-4o, got: ${balanced}`);

  const reasoning = registry.resolveModel("openai", "reasoning");
  assert(reasoning === "o1-preview", `Expected o1-preview, got: ${reasoning}`);
});

// 4. Rejects unknown provider
test("Rejects unknown provider names", () => {
  let threw = false;
  try {
    registry.resolveProvider("unknown-provider");
  } catch (err) {
    threw = true;
    assert(err.message.includes("Unsupported provider"), "Expected unsupported provider error message");
  }
  assert(threw, "Expected resolver to throw an error for bad provider name");
});

// 5. Rejects unknown model tier
test("Rejects unknown model tiers with security violation", () => {
  let threw = false;
  try {
    registry.resolveModel("openai", "ultra-reasoning");
  } catch (err) {
    threw = true;
    assert(err.message.includes("Security violation"), "Expected security violation message");
  }
  assert(threw, "Expected resolver to throw an error for unsupported tier");
});

// 6. Detects missing API key env var without printing value
test("Detects missing API key env var without printing value", () => {
  // Clear any temporary env vars if they exist
  const backupKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  let threw = false;
  try {
    registry.validateApiKey("openai");
  } catch (err) {
    threw = true;
    assert(err.message.includes("Configuration error"), "Expected configuration error message");
    assert(err.message.includes("OPENAI_API_KEY"), "Expected env var name to be printed in message");
    assert(!err.message.includes("secret"), "Message must not print secret values");
  }
  
  // Restore backup
  if (backupKey) {
    process.env.OPENAI_API_KEY = backupKey;
  }

  assert(threw, "Expected validateApiKey to throw if key env var is absent");
});

// 7. Reads cost rates
test("Reads cost rates correctly", () => {
  const ratesMini = registry.resolveCostRates("openai", "gpt-4o-mini");
  assert(ratesMini.input_rate_1m === 0.15, `Expected 0.15, got: ${ratesMini.input_rate_1m}`);
  assert(ratesMini.output_rate_1m === 0.60, `Expected 0.60, got: ${ratesMini.output_rate_1m}`);

  const ratesO1 = registry.resolveCostRates("openai", "o1-preview");
  assert(ratesO1.input_rate_1m === 15.00, `Expected 15.00, got: ${ratesO1.input_rate_1m}`);
  assert(ratesO1.output_rate_1m === 60.00, `Expected 60.00, got: ${ratesO1.output_rate_1m}`);
});

// 8. Reads provider capabilities
test("Reads provider capabilities", () => {
  const capsPi = registry.resolveCapabilities("pi");
  assert(capsPi.hasBash === true, "pi should support bash");
  assert(capsPi.hasFilesystem === true, "pi should support filesystem");

  const capsOpenAi = registry.resolveCapabilities("openai");
  assert(capsOpenAi.hasBash === false, "openai should not support bash");
  assert(capsOpenAi.hasFilesystem === false, "openai should not support filesystem");
  assert(capsOpenAi.nativeToolUse === true, "openai should support native tool use");
});

// 9. Preserves backward compatibility with existing araya.yaml (empty config fallback)
test("Preserves backward compatibility with empty configuration", () => {
  const emptyRegistry = new ProviderRegistry({});
  const provider = emptyRegistry.resolveProvider("pi");
  assert(provider !== null, "pi should fall back to defaults under empty configuration");
  assert(provider.api_key_env === "PI_API_KEY", "Default key env var should match");

  const caps = emptyRegistry.resolveCapabilities("pi.dev");
  assert(caps.hasBash === true, "Default capabilities should support bash");
});

console.log(`\n${"═".repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${"═".repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
