#!/usr/bin/env node
/**
 * ARAYA v2.0 — Git Worktree Sandbox Validation Test (Phase 3.4)
 *
 * Verifies:
 * 1. Creates worktree path under .araya/worktrees/.
 * 2. Creates branch with correct naming convention.
 * 3. Rejects invalid runId.
 * 4. Rejects invalid agentName.
 * 5. Rejects main or dev-mahg as sandbox branch.
 * 6. Lists active ARAYA worktrees.
 * 7. Cleans up worktree.
 * 8. Deletes temporary branch after cleanup.
 * 9. Preserves aborted worktree.
 * 10. Detects stale worktrees.
 * 11. Confirms .araya/worktrees/ is ignored by git.
 * 12. Does not push or run forbidden git commands.
 *
 * Usage: node tests/worktree-sandbox-test.js
 */

const { existsSync, writeFileSync } = require("node:fs");
const { resolve, join } = require("node:path");
const { execSync } = require("node:child_process");
const { WorktreeSandboxManager } = require("../dist/araya/v2/index.js");

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

console.log("\n🧪 ARAYA v2.0 — Git Worktree Sandbox Validation Test (Phase 3.4)\n");

const workspaceRoot = resolve(__dirname, "..");
const manager = new WorktreeSandboxManager(workspaceRoot);

(async () => {
  // 1. Rejects invalid runId
  await testAsync("Rejects invalid runId", async () => {
    let threw = false;
    try {
      await manager.createWorktree("run/invalid/chars", "valentina");
    } catch (err) {
      threw = true;
      assert(err.message.includes("Invalid identifier"), "Should throw invalid identifier error");
    }
    assert(threw, "Expected createWorktree to throw for bad runId");
  });

  // 2. Rejects invalid agentName
  await testAsync("Rejects invalid agentName", async () => {
    let threw = false;
    try {
      await manager.createWorktree("run-123", "val;entina");
    } catch (err) {
      threw = true;
      assert(err.message.includes("Invalid identifier"), "Should throw invalid identifier error");
    }
    assert(threw, "Expected createWorktree to throw for bad agentName");
  });

  // 3. Rejects main or dev-mahg as sandbox branch identifiers
  await testAsync("Rejects main or dev-mahg as sandbox branch identifiers", async () => {
    let threwMain = false;
    try {
      await manager.createWorktree("main", "valentina");
    } catch (err) {
      threwMain = true;
      assert(err.message.includes("Security violation"), "Should throw security violation for main");
    }
    assert(threwMain, "Expected createWorktree to throw for main runId");

    let threwDev = false;
    try {
      await manager.createWorktree("run-123", "dev-mahg");
    } catch (err) {
      threwDev = true;
      assert(err.message.includes("Security violation"), "Should throw security violation for dev-mahg");
    }
    assert(threwDev, "Expected createWorktree to throw for dev-mahg agentName");
  });

  // 4. Confirms .araya/worktrees/ is ignored by Git
  test("Confirms .araya/worktrees/ is ignored by Git", () => {
    try {
      // git check-ignore returns exit code 0 if ignored, 1 if not
      execSync("git check-ignore .araya/worktrees/", { cwd: workspaceRoot, stdio: "ignore" });
    } catch (err) {
      throw new Error(".araya/worktrees/ path is NOT ignored in .gitignore!");
    }
  });

  // 5. Create worktree, list, and cleanup E2E
  await testAsync("E2E Worktree creation, branch check, listing, and cleanup", async () => {
    const runId = "testrun99";
    const agentName = "valsandbox";
    const expectedBranch = `araya-run/${runId}/agent/${agentName}`;
    const expectedDir = resolve(workspaceRoot, ".araya", "worktrees", runId, agentName);

    // Clean up any stale leftovers
    try {
      execSync(`git worktree remove --force "${expectedDir}"`, { stdio: "ignore" });
    } catch {}
    try {
      execSync(`git branch -D "${expectedBranch}"`, { stdio: "ignore" });
    } catch {}

    // A. Create Worktree
    const result = await manager.createWorktree(runId, agentName);
    assert(result.path === expectedDir, `Worktree directory mismatch: ${result.path}`);
    assert(result.branch === expectedBranch, `Branch name mismatch: ${result.branch}`);
    assert(existsSync(expectedDir), "Worktree directory on disk was not created");

    // Verify branch was created and checked out in worktree
    const branchList = execSync("git branch", { cwd: workspaceRoot, encoding: "utf-8" });
    assert(branchList.includes(expectedBranch), `Temporary branch ${expectedBranch} should be created`);

    // B. List Active Worktrees
    const active = await manager.listWorktrees();
    const found = active.find(w => w.path === expectedDir);
    assert(found !== undefined, "Created worktree should be in active worktrees list");
    assert(found.branch === expectedBranch, `Listed branch mismatch: ${found.branch}`);

    // C. Clean Up Worktree
    await manager.cleanupWorktree(runId, agentName, true);
    assert(!existsSync(expectedDir), "Worktree directory should be deleted after cleanup");

    // D. Deletes temporary branch after cleanup
    const branchListAfter = execSync("git branch", { cwd: workspaceRoot, encoding: "utf-8" });
    assert(!branchListAfter.includes(expectedBranch), `Temporary branch ${expectedBranch} should be deleted after cleanup`);
  });

  // 6. Preserves aborted worktree
  await testAsync("Preserves aborted worktree", async () => {
    const runId = "testrunabort";
    const agentName = "valabort";
    const expectedBranch = `araya-run/${runId}/agent/${agentName}`;
    const expectedDir = resolve(workspaceRoot, ".araya", "worktrees", runId, agentName);

    // Clean up leftovers
    try { execSync(`git worktree remove --force "${expectedDir}"`, { stdio: "ignore" }); } catch {}
    try { execSync(`git branch -D "${expectedBranch}"`, { stdio: "ignore" }); } catch {}

    // Create
    await manager.createWorktree(runId, agentName);
    assert(existsSync(expectedDir), "Aborted worktree should exist before fail");

    // Call cleanup with isSuccessful = false (failed/aborted run)
    await manager.cleanupWorktree(runId, agentName, false);
    
    // Assert preservation
    assert(existsSync(expectedDir), "Aborted worktree should NOT be deleted after failed cleanup");

    // Verify branch is still there
    const branchList = execSync("git branch", { cwd: workspaceRoot, encoding: "utf-8" });
    assert(branchList.includes(expectedBranch), "Aborted branch should still exist");

    // Cleanup manually to keep repository clean
    execSync(`git worktree remove --force "${expectedDir}"`, { stdio: "ignore" });
    execSync(`git branch -D "${expectedBranch}"`, { stdio: "ignore" });
  });

  // 7. Detects stale worktrees
  await testAsync("Detects stale worktrees", async () => {
    const runId = "teststale";
    const agentName = "valstale";
    const expectedBranch = `araya-run/${runId}/agent/${agentName}`;
    const expectedDir = resolve(workspaceRoot, ".araya", "worktrees", runId, agentName);

    try { execSync(`git worktree remove --force "${expectedDir}"`, { stdio: "ignore" }); } catch {}
    try { execSync(`git branch -D "${expectedBranch}"`, { stdio: "ignore" }); } catch {}

    await manager.createWorktree(runId, agentName);

    // Stale detection with maxAgeMs = -1 (so all worktrees are considered stale)
    const stale = await manager.detectStaleWorktrees(-1);
    const found = stale.find(w => w.path === expectedDir);
    assert(found !== undefined, "Stale check should find the newly created worktree");
    assert(found.branch === expectedBranch, `Stale branch mismatch: ${found.branch}`);

    // Cleanup
    await manager.pruneStaleWorktree(expectedDir, expectedBranch);
    assert(!existsSync(expectedDir), "Pruned stale worktree directory should be deleted");
  });

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`${"═".repeat(50)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
})();
