#!/usr/bin/env node
/**
 * ARAYA v2.0 — Tool Registry Validation Test (Phase 3.2)
 *
 * Verifies:
 * 1. read_file reads an allowed file.
 * 2. write_file writes inside allowed workspace path.
 * 3. list_directory lists allowed directory.
 * 4. path traversal is blocked.
 * 5. writes to .git are blocked.
 * 6. writes to .env are blocked.
 * 7. writes to node_modules are blocked.
 * 8. arbitrary shell command is rejected.
 * 9. run_tests accepts configured aliases only.
 * 10. run_tests rejects arbitrary arguments.
 *
 * Usage: node tests/tool-registry-test.js
 */

const { mkdirSync, rmSync, writeFileSync, existsSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { ToolRegistry } = require("../dist/araya/v2/index.js");

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

async function testAsync(name, fn) {
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
  if (!condition) throw new Error(message || "Assertion failed");
}

console.log("\n🧪 ARAYA v2.0 — Tool Registry Validation & Safety Test (Phase 3.2)\n");

const workspaceRoot = resolve(__dirname, "..");
const sandboxDir = join(workspaceRoot, "tmp-tool-sandbox");

// Setup temporary sandbox folder
if (existsSync(sandboxDir)) {
  rmSync(sandboxDir, { recursive: true, force: true });
}
mkdirSync(sandboxDir, { recursive: true });

// Create some test assets
writeFileSync(join(sandboxDir, "allowed-file.txt"), "hello from sandbox", "utf-8");

(async () => {
  const registry = new ToolRegistry(workspaceRoot, ["npm test", "npm run test"], false);

  // 1. read_file reads an allowed file
  await testAsync("read_file reads an allowed file", async () => {
    const relativePath = join("tmp-tool-sandbox", "allowed-file.txt");
    const result = await registry.executeTool("read_file", { path: relativePath });
    assert(result.success === true, `Expected success, got: ${result.error}`);
    assert(result.output === "hello from sandbox", `Expected file content, got: "${result.output}"`);
  });

  // 2. write_file writes inside allowed workspace path
  await testAsync("write_file writes inside allowed workspace path", async () => {
    const relativePath = join("tmp-tool-sandbox", "write-test.txt");
    const result = await registry.executeTool("write_file", { path: relativePath, content: "sandbox write content" });
    assert(result.success === true, `Expected success, got: ${result.error}`);
    assert(existsSync(join(sandboxDir, "write-test.txt")), "File should exist in sandbox");
  });

  // 3. list_directory lists allowed directory
  await testAsync("list_directory lists allowed directory", async () => {
    const relativePath = "tmp-tool-sandbox";
    const result = await registry.executeTool("list_directory", { path: relativePath });
    assert(result.success === true, `Expected success, got: ${result.error}`);
    const files = JSON.parse(result.output);
    assert(files.includes("allowed-file.txt"), "Expected directory list to contain allowed-file.txt");
  });

  // 4. path traversal is blocked
  await testAsync("path traversal is blocked (read_file)", async () => {
    const badPath = "../../../etc/passwd";
    const result = await registry.executeTool("read_file", { path: badPath });
    assert(result.success === false, "Path traversal should fail");
    assert(result.error.includes("Path traversal blocked"), `Expected traversal error message, got: ${result.error}`);
  });

  await testAsync("path traversal is blocked (write_file)", async () => {
    const badPath = join("..", "traversal-test.txt");
    const result = await registry.executeTool("write_file", { path: badPath, content: "traversal" });
    assert(result.success === false, "Path traversal write should fail");
    assert(result.error.includes("Path traversal blocked"), `Expected traversal error message, got: ${result.error}`);
  });

  // 5. writes to .git are blocked
  await testAsync("writes to .git are blocked", async () => {
    const gitPath = join(".git", "config");
    const result = await registry.executeTool("write_file", { path: gitPath, content: "malicious write" });
    assert(result.success === false, "Writes to .git should fail");
    assert(result.error.includes("Access denied"), `Expected access denied, got: ${result.error}`);
  });

  // 6. writes to .env are blocked
  await testAsync("writes to .env are blocked", async () => {
    const envPath = ".env";
    const result = await registry.executeTool("write_file", { path: envPath, content: "KEY=value" });
    assert(result.success === false, "Writes to .env should fail");
    assert(result.error.includes("Access denied"), `Expected access denied, got: ${result.error}`);
  });

  // 7. writes to node_modules are blocked
  await testAsync("writes to node_modules are blocked", async () => {
    const depPath = join("node_modules", "some-dep", "index.js");
    const result = await registry.executeTool("write_file", { path: depPath, content: "hacked" });
    assert(result.success === false, "Writes to node_modules should fail");
    assert(result.error.includes("Access denied"), `Expected access denied, got: ${result.error}`);
  });

  // 8. writes to package-lock.json block check
  await testAsync("writes to package-lock.json are blocked by default", async () => {
    const lockPath = "package-lock.json";
    const result = await registry.executeTool("write_file", { path: lockPath, content: "{}" });
    assert(result.success === false, "Writes to package-lock.json should fail by default");
    assert(result.error.includes("Access denied"), `Expected access denied, got: ${result.error}`);
  });

  await testAsync("writes to package-lock.json are allowed if explicit flag enabled", async () => {
    const explicitRegistry = new ToolRegistry(workspaceRoot, ["npm test"], true);
    // Write inside sandbox relative path
    const sandboxLock = join("tmp-tool-sandbox", "package-lock.json");
    const result = await explicitRegistry.executeTool("write_file", { path: sandboxLock, content: "{}" });
    assert(result.success === true, `Expected success since lock write is explicitly enabled. Got error: ${result.error}`);
  });

  // 9. arbitrary shell command is rejected
  await testAsync("arbitrary shell command is rejected", async () => {
    const result = await registry.executeTool("run_tests", { command: "rm -rf tmp-tool-sandbox" });
    assert(result.success === false, "Arbitrary shell command should be rejected");
    assert(result.error.includes("Security violation"), `Expected security violation, got: ${result.error}`);
  });

  // 10. run_tests accepts configured aliases only
  await testAsync("run_tests accepts configured aliases only", async () => {
    const result = await registry.executeTool("run_tests", { command: "npm test" });
    // Note: Since npm test runs our test script which runs, this will execute successfully
    // We check if it attempted command run or exited correctly
    assert(result.success === true || result.error.includes("Command failed"), `Expected command to trigger. Got success: ${result.success}, error: ${result.error}`);
  });

  // 11. run_tests rejects arbitrary arguments
  await testAsync("run_tests rejects commands with arbitrary arguments", async () => {
    const result = await registry.executeTool("run_tests", { command: "npm test -- --inject-bad-flag" });
    assert(result.success === false, "run_tests with args should be rejected if not in aliases list");
    assert(result.error.includes("Security violation"), `Expected security violation, got: ${result.error}`);
  });

  // Clean up
  if (existsSync(sandboxDir)) {
    rmSync(sandboxDir, { recursive: true, force: true });
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"═".repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
})();
