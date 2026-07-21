#!/usr/bin/env node
/**
 * ARAYA v2 — AX3 Feature Test Suite
 *
 * Verifies:
 *  (a) Root discovery finds project root
 *  (b) AX3.md parsing extracts sections and child index
 *  (c) Chain resolution walks from root to target
 *  (d) Reconciliation creates root AX3.md when missing
 *  (e) Idempotence: second reconciliation produces no changes
 *  (f) Managed sections are updated, human content preserved
 *  (g) --check detects drift
 *  (h) --dry-run reports changes without writing
 *  (i) Exclusions are respected
 *  (j) Symlink path traversal is blocked
 *
 * Usage: node tests/ax3-test.js
 */

const assert = require("node:assert");
const { mkdtempSync, writeFileSync, mkdirSync, readFileSync, symlinkSync, rmSync, existsSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve, sep } = require("node:path");

// Load from compiled dist
const {
  findProjectRoot,
  findRootAx3,
  parseAx3,
  resolveAx3Chain,
  reconcile,
  check,
  dryRun,
  AX3_FILENAME,
  MANAGED_BEGIN,
  MANAGED_END,
} = require("../dist/araya/v2/ax3");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

console.log("\n🧪 ARAYA AX3 Feature Test Suite\n");

// ── (a) Root Discovery ──────────────────────────────────────────────────

console.log("(a) Root Discovery");

test("findProjectRoot returns this repo (works in worktrees with any name)", () => {
  const root = findProjectRoot(__dirname);
  // The root is found by araya.yaml, not by directory name — works in worktrees
  assert.ok(existsSync(join(root, "araya.yaml")), "araya.yaml not found at root");
  assert.ok(root.length > 0, "root should not be empty");
});

test("findProjectRoot works from worktree subdirectory", () => {
  const root = findProjectRoot(__dirname);
  const subDir = join(root, "src", "araya", "v2");
  if (existsSync(subDir)) {
    const fromSub = findProjectRoot(subDir);
    assert.equal(fromSub, root, "should find same root from subdirectory");
  }
});

test("findRootAx3 returns null when no AX3.md exists", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-no-root-"));
  try {
    mkdirSync(join(work, ".git"));
    const result = findRootAx3(work);
    assert.strictEqual(result, null, "Should return null for project with no AX3.md");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("findRootAx3 finds root AX3.md", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-root-"));
  try {
    mkdirSync(join(work, ".git"));
    writeFileSync(join(work, AX3_FILENAME), "# Root AX3\n\n## Purpose\nTest root");
    const result = findRootAx3(work);
    assert.ok(result !== null, "Should find root AX3.md");
    assert.ok(result.endsWith(AX3_FILENAME), `Expected path to end with ${AX3_FILENAME}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (b) Parsing ─────────────────────────────────────────────────────────

console.log("\n(b) AX3.md Parsing");

test("parseAx3 extracts sections", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-parse-"));
  try {
    const content = `# Test Project\n\n## Purpose\nThis is a test project.\n\n## Ownership\nTest Owner\n\n## Local Contracts\n- Rule 1\n- Rule 2\n\n## Work Guidance\nFollow standards.\n\n## Verification\nRun tests.\n\n## Child AX3 Index\n${MANAGED_BEGIN} Child AX3 Index -->\n- \`src/module/AX3.md\` — Module\n${MANAGED_END}`;
    writeFileSync(join(work, AX3_FILENAME), content);

    const doc = parseAx3(join(work, AX3_FILENAME), true);

    assert.ok(doc.isRoot, "Should be root");
    assert.strictEqual(doc.sections["Purpose"], "This is a test project.");
    assert.strictEqual(doc.sections["Ownership"], "Test Owner");
    assert.strictEqual(doc.sections["Local Contracts"], "- Rule 1\n- Rule 2");
    assert.ok(doc.hasManagedSection, "Should have managed section");
    assert.strictEqual(doc.childIndex.length, 1, "Should have 1 child entry");
    assert.strictEqual(doc.childIndex[0].path, "src/module/AX3.md");
    assert.strictEqual(doc.childIndex[0].description, "Module");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("parseAx3 handles no managed section", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-nomanaged-"));
  try {
    const content = `# Test\n\n## Purpose\nTest\n\n## Child AX3 Index\n- manual entry`;
    writeFileSync(join(work, AX3_FILENAME), content);

    const doc = parseAx3(join(work, AX3_FILENAME), false);
    assert.ok(!doc.hasManagedSection, "Should not have managed section");
    assert.strictEqual(doc.childIndex.length, 1, "Should parse manual entries");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (c) Chain Resolution ────────────────────────────────────────────────

console.log("\n(c) Chain Resolution");

test("resolveAx3Chain finds root to target chain", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-chain-"));
  try {
    mkdirSync(join(work, ".git"));
    // Root AX3.md
    writeFileSync(join(work, AX3_FILENAME), `# Root\n\n## Purpose\nRoot level\n\n## Child AX3 Index\n${MANAGED_BEGIN} Child AX3 Index -->\n<!-- none -->\n${MANAGED_END}`);
    // Child AX3.md in src/
    mkdirSync(join(work, "src"));
    writeFileSync(join(work, "src", AX3_FILENAME), `# Src\n\n## Purpose\nSource code\n\n## Child AX3 Index\n${MANAGED_BEGIN} Child AX3 Index -->\n<!-- none -->\n${MANAGED_END}`);
    // Deep child in src/components/
    mkdirSync(join(work, "src", "components"));
    writeFileSync(join(work, "src", "components", AX3_FILENAME), `# Components\n\n## Purpose\nComponents\n\n## Child AX3 Index\n${MANAGED_BEGIN} Child AX3 Index -->\n<!-- none -->\n${MANAGED_END}`);

    const chain = resolveAx3Chain(work, [join(work, "src", "components", "Button.tsx")]);

    assert.strictEqual(chain.docs.length, 3, `Expected 3 docs, got ${chain.docs.length}`);
    assert.ok(chain.docs[0].isRoot, "First should be root");
    const nearestDoc = chain.nearest;
    assert.ok(nearestDoc !== null, "Nearest should not be null");
    assert.strictEqual(nearestDoc.sections["Purpose"], "Components", "Nearest should be components");
    assert.ok(chain.summary.includes("ROOT:"), "Summary should include ROOT");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (d) Reconciliation - Creates Root ───────────────────────────────────

console.log("\n(d) Reconciliation — Creates Root");

test("reconcile creates root AX3.md when missing", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-create-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, "src"));
    mkdirSync(join(work, "skills"));

    const result = reconcile(work);

    assert.ok(result.changed, "Should report changes");
    assert.ok(result.docCount >= 1, "Should have at least root doc");
    assert.ok(existsSync(join(work, AX3_FILENAME)), "Root AX3.md should exist");

    const rootContent = readFileSync(join(work, AX3_FILENAME), "utf-8");
    assert.ok(rootContent.includes("## Purpose"), "Root should have Purpose section");
    assert.ok(rootContent.includes(MANAGED_BEGIN), "Root should have managed section");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (e) Idempotence ─────────────────────────────────────────────────────

console.log("\n(e) Idempotence");

test("second reconciliation produces no changes", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-idem-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, "src"));

    // First reconciliation
    const result1 = reconcile(work);
    assert.ok(result1.changed, "First reconciliation should make changes");

    // Second reconciliation
    const result2 = reconcile(work);
    assert.strictEqual(result2.changes.length, 0, `Second reconciliation should have 0 changes, got ${result2.changes.length}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (f) Managed Section Preservation ────────────────────────────────────

console.log("\n(f) Managed Section vs Human Content");

test("human content is preserved during reconciliation", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-preserve-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, "src"));

    // Create root with human content
    const humanPurpose = "CUSTOM PURPOSE: This text was written by a human.";
    writeFileSync(join(work, AX3_FILENAME), `# Root\n\n## Purpose\n${humanPurpose}\n\n## Ownership\nHuman Owner\n\n## Child AX3 Index\n${MANAGED_BEGIN} Child AX3 Index -->\n<!-- none -->\n${MANAGED_END}`);

    // Reconcile
    reconcile(work);

    const after = readFileSync(join(work, AX3_FILENAME), "utf-8");
    assert.ok(after.includes(humanPurpose), "Human-authored Purpose should be preserved");
    assert.ok(after.includes("Human Owner"), "Human-authored Ownership should be preserved");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (g) --check Detects Drift ───────────────────────────────────────────

console.log("\n(g) --check Detects Drift");

test("check returns drift=false on clean tree", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-clean-"));
  try {
    mkdirSync(join(work, ".git"));
    // First reconcile
    reconcile(work);
    // Check
    const result = check(work);
    assert.strictEqual(result.drift, false, "Clean tree should have no drift");
    assert.strictEqual(result.violationCount, 0, "Should have 0 violations");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("check detects missing root AX3.md as drift", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-drift-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, "src"));
    // Don't create any AX3.md — check should detect drift
    const result = check(work);
    assert.strictEqual(result.drift, true, "Should detect drift when no root AX3.md");
    assert.ok(result.violationCount >= 1, `Should have at least 1 violation, got ${result.violationCount}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (h) --dry-run ───────────────────────────────────────────────────────

console.log("\n(h) --dry-run");

test("dry-run reports changes without writing", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-dry-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, "src"));

    const result = dryRun(work);
    assert.ok(result.changes.length > 0, "Dry-run should report changes");
    assert.ok(!existsSync(join(work, AX3_FILENAME)), "Dry-run should NOT create files");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (i) Exclusion Respect ───────────────────────────────────────────────

console.log("\n(i) Exclusion Respect");

test("node_modules is excluded from reconciliation", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-excl-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, "node_modules"));
    mkdirSync(join(work, "node_modules", "some-pkg"));
    mkdirSync(join(work, "src"));

    const result = reconcile(work);
    // Should create root + maybe src child, but not node_modules children
    for (const change of result.changes) {
      assert.ok(!change.path.includes("node_modules"), `Should not include node_modules: ${change.path}`);
    }
    assert.ok(!existsSync(join(work, "node_modules", AX3_FILENAME)), "node_modules should not get AX3.md");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (j) Symlink Path Traversal Blocked ──────────────────────────────────

console.log("\n(j) Symlink Safety");

test("symlinks outside project root are blocked", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-sym-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, "src"));
    // Create a symlink pointing outside the project
    const outside = mkdtempSync(join(tmpdir(), "ax3-outside-"));
    try {
      symlinkSync(outside, join(work, "src", "escape"));
      // Reconcile should succeed without following the symlink outside
      const result = reconcile(work);
      // Should not create AX3.md in outside directory
      assert.ok(!existsSync(join(outside, AX3_FILENAME)), "Should not create AX3.md outside project root");
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── (k) Hidden Dirs Excluded ────────────────────────────────────────────

console.log("\n(k) Hidden Directories");

test("hidden directories (except .araya) are excluded", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-hidden-"));
  try {
    mkdirSync(join(work, ".git"));
    mkdirSync(join(work, ".config"));
    mkdirSync(join(work, ".local"));
    mkdirSync(join(work, "src"));

    const result = reconcile(work);
    for (const change of result.changes) {
      const rel = change.path.replace(work, "");
      assert.ok(!rel.includes(".config"), `Should not include .config: ${change.path}`);
      assert.ok(!rel.includes(".local"), `Should not include .local: ${change.path}`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

// ── Summary ─────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log("❌ Some tests failed!");
  process.exit(1);
} else {
  console.log("✅ All AX3 tests passed!");
  process.exit(0);
}
