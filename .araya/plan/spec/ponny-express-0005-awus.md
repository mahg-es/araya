# ponny-express-0005 + 0006 — AWU Package
## Sonia — PM Head Orchestrator
**Date**: 2026-07-22
**Status**: AWUs EMITTED — awaiting specialist execution
**Delivery Mode**: repair (tests + validation) + standard (canon-rule-001 implementation)
**Policy**: balanced

---

## Pre-flight Diagnostics

| Check | Result |
|-------|--------|
| ax3-test.js from main repo | ✅ 15/15 PASSED |
| ax3-test.js from worktree | ❌ 14/15 — 1 failure |
| canon-rule-001 artifacts | ❌ 0 artifacts — no existe |
| Worktree hygiene | 🔴 1 stale worktree, 2 orphan stashes |

### Failing Test Detail

```
Test: findProjectRoot returns this repo
Expected: .../araya
Got:      /home/thedataprofessor/github/mahg-es/worktrees/araya/ponny-express-0002-governance-recovery
```

**Root cause**: Test assertion checks directory basename (`endsWith("araya")`) instead of verifying project root resolution by `araya.yaml` presence. The `findProjectRoot` function itself is correct — it resolves by `araya.yaml` or `.git`. The test is what's wrong.

**Fix**: Replace `assert.ok(root.endsWith("araya"))` with `assert.ok(existsSync(join(root, "araya.yaml")))` and add 3 scenario tests covering main repo, worktree with different name, and detached worktree.

---

## AWU 1: Corregir ax3-test.js → 349/349 assertions

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-001 |
| **Agent** | Valentina (Backend Developer) — `can_write_code: true` |
| **Branch** | `feature/ponny-express-0005-ax3-test-fix` |
| **Worktree** | `~/github/mahg-es/worktrees/araya/ponny-express-0005-ax3-test-fix` |
| **Skills required** | unit-test, ax3 |
| **Source file** | `tests/ax3-test.js` (lines 16-19) |
| **Dist rebuild** | Required — run `npm run build` or `tsc` after source changes if resolver.ts is touched |

### Task Specification

#### 1. Fix the failing test assertion

**File**: `tests/ax3-test.js`
**Section**: (a) Root Discovery — test "findProjectRoot returns this repo"

**Current code** (lines 16-19):
```javascript
test("findProjectRoot returns this repo", () => {
  const root = findProjectRoot(__dirname);
  assert.ok(root.endsWith("araya"), `Expected .../araya, got ${root}`);
  assert.ok(existsSync(join(root, "araya.yaml")), "araya.yaml not found at root");
});
```

**Required change**: The `endsWith("araya")` assertion must be removed and replaced with verification that `findProjectRoot` resolves by `araya.yaml` presence, NOT by directory name:

```javascript
test("findProjectRoot returns this repo", () => {
  const root = findProjectRoot(__dirname);
  // Verify resolution by araya.yaml, not by directory name
  assert.ok(existsSync(join(root, "araya.yaml")), "araya.yaml not found at root");
  assert.ok(existsSync(join(root, ".git")), ".git not found at root");
});
```

#### 2. Add worktree scenario tests

Add these 3 new tests in section (a) Root Discovery:

**Test A: Worktree with different directory name**
```javascript
test("findProjectRoot works from worktree with non-standard directory name", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-worktree-"));
  try {
    // Create main repo
    const mainRepo = join(work, "main-repo");
    mkdirSync(join(mainRepo, ".git"));
    writeFileSync(join(mainRepo, "araya.yaml"), "version: 1.0.0");
    writeFileSync(join(mainRepo, AX3_FILENAME), "# Main Repo\n\n## Purpose\nMain");

    // Create worktree with DIFFERENT name
    const worktreeDir = join(work, "my-custom-worktree-name");
    mkdirSync(worktreeDir);
    // Simulate git worktree .git file
    writeFileSync(join(worktreeDir, ".git"), `gitdir: ${join(mainRepo, ".git", "worktrees", "custom")}\n`);
    // Copy araya.yaml (as worktrees do)
    writeFileSync(join(worktreeDir, "araya.yaml"), "version: 1.0.0");
    mkdirSync(join(worktreeDir, "src"));

    // findProjectRoot from inside worktree should resolve to worktree dir,
    // NOT the main repo — because araya.yaml is in the worktree
    const root = findProjectRoot(join(worktreeDir, "src"));
    assert.ok(existsSync(join(root, "araya.yaml")), "Should find araya.yaml at resolved root");
    // The worktree IS its own project root (it has araya.yaml)
    assert.strictEqual(root, worktreeDir, "Worktree with araya.yaml should be its own project root");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
```

**Test B: Worktree in detached HEAD state**
```javascript
test("findProjectRoot works from worktree in detached HEAD", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-detached-"));
  try {
    // Create main repo
    const mainRepo = join(work, "main-repo");
    mkdirSync(join(mainRepo, ".git"));
    writeFileSync(join(mainRepo, "araya.yaml"), "version: 1.0.0");

    // Create worktree (detached HEAD — no branch)
    const detachedDir = join(work, "detached-worktree");
    mkdirSync(detachedDir);
    writeFileSync(join(detachedDir, ".git"), `gitdir: ${join(mainRepo, ".git", "worktrees", "detached")}\n`);
    writeFileSync(join(detachedDir, "araya.yaml"), "version: 1.0.0");

    // Should still resolve correctly in detached state
    const root = findProjectRoot(detachedDir);
    assert.ok(existsSync(join(root, "araya.yaml")), "Should find araya.yaml in detached worktree");
    assert.strictEqual(root, detachedDir, "Detached worktree should resolve to itself");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
```

**Test C: findProjectRoot prefers araya.yaml over .git**
```javascript
test("findProjectRoot resolves by araya.yaml, not directory basename", () => {
  const work = mkdtempSync(join(tmpdir(), "ax3-basename-"));
  try {
    // Create a project with araya.yaml in a non-obvious directory name
    const projectDir = join(work, "random-project-name-xyz");
    mkdirSync(join(projectDir, ".git"));
    writeFileSync(join(projectDir, "araya.yaml"), "version: 1.0.0");
    mkdirSync(join(projectDir, "deep"));
    mkdirSync(join(projectDir, "deep", "nested"));

    // Resolve from deep nested path
    const root = findProjectRoot(join(projectDir, "deep", "nested"));
    assert.ok(existsSync(join(root, "araya.yaml")), "Should find araya.yaml regardless of directory name");
    // The root should be projectDir, not based on any name convention
    assert.strictEqual(root, projectDir, "Root should be where araya.yaml lives");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
```

### Acceptance Criteria
- [ ] `node tests/ax3-test.js` from main repo: all tests pass
- [ ] `node tests/ax3-test.js` from worktree with different name: all tests pass
- [ ] `node tests/ax3-test.js` from detached worktree: all tests pass
- [ ] Old assertion `root.endsWith("araya")` is removed
- [ ] Resolution verified by `existsSync(join(root, "araya.yaml"))` in all relevant tests
- [ ] Total tests: 18 (15 existing + 3 new, minus the fix)
- [ ] All assertions pass (349 target)
- [ ] No changes to source resolver.ts required (function logic is correct)

### Estimated AWU Cost
- Complexity: Low (test-only fix + 3 new tests)
- Estimated tokens: ~3,000
- Estimated time: 5 minutes

---

## AWU 2: Implementar canon-rule-001 en Framework (araya)

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-002 |
| **Agent** | Daneel (Delegated Executor) → routes to Valentina (code) + Priscila (docs) |
| **Branch** | `feature/canon-rule-001-worktree-hygiene` |
| **Worktree** | `~/github/mahg-es/worktrees/araya/canon-rule-001-worktree-hygiene` |
| **Skills required** | ax3, api-design (validators), project-planning |
| **Repo** | `mahg-es/araya` |
| **PR target** | `dev-mahg` |

### Background

The ponny-express-0002 incident demonstrated that without automated enforcement, governance rules (BRANCH-002: no direct commits on main) can be bypassed. `canon-rule-001` codifies **worktree hygiene** as the standard isolation mechanism for all feature work, enforced at multiple layers:

1. Documentation (AGENTS.md, AX3 root)
2. Policy (canonical rule spec)
3. Automated enforcement (pre-commit hook, validators)
4. Verification (tests)

### Task Specification

#### 2.1 AGENTS.md — Add Worktree Hygiene Section

**File**: `AGENTS.md`
**Location**: After "ARAYA Cross-Cutting Skills" section, before "Related Commands"

Add new section:

```markdown
## Worktree Hygiene (canon-rule-001)

**Every feature, fix, or change MUST be developed in a git worktree, never directly in the main repository working directory.**

### Rules

1. **Isolation Mandatory** — All feature/fix work happens in `~/github/mahg-es/worktrees/araya/<branch-name>/`
2. **Branch Per Feature** — One feature branch per worktree: `feature/<description>`
3. **No Direct Commits** — Never commit directly to `main` or `dev-mahg` (BRANCH-002)
4. **Worktree Naming** — `feature/<task-id>-<short-description>` (e.g., `feature/req-004-add-auth`)
5. **Cleanup** — Remove worktree after PR merge: `git worktree remove <path>`
6. **Pre-commit Guard** — Hook blocks commits outside worktrees or on protected branches

### Worktree Lifecycle

```
git worktree add ~/github/mahg-es/worktrees/araya/<branch> <branch>
cd ~/github/mahg-es/worktrees/araya/<branch>
# ... develop, test, commit ...
git push origin <branch>
# Create PR → merge → cleanup
git worktree remove ~/github/mahg-es/worktrees/araya/<branch>
```

### Verification

- Pre-commit hook validates worktree hygiene
- `/araya:ax3 --check` includes worktree hygiene in drift detection
- CI gate blocks PRs that don't originate from worktree branches
```

#### 2.2 Root AX3.md — Add canon-rule-001 to Local Contracts

**File**: `AX3.md`
**Section**: "Local Contracts"

Add to the existing list:
```markdown
- All feature work MUST use git worktrees (canon-rule-001: Worktree Hygiene)
- Worktree path convention: `~/github/mahg-es/worktrees/araya/<branch-name>/`
```

#### 2.3 Policy Document

**Create**: `.araya/governance/policies/canon-rule-001-worktree-hygiene.md`

Content:
```markdown
# canon-rule-001 — Worktree Hygiene

**Status**: ACTIVE
**Authority**: ARAYA Governance Framework
**Enforcement**: Pre-commit hook + CI gate + AX3 --check
**Adopted**: 2026-07-22
**Supersedes**: None
**Superseded by**: None

## Purpose

Ensure complete isolation of feature work from integration and production branches through mandatory git worktree usage. This rule prevents direct commits on `main` and `dev-mahg` by physically separating working directories.

## Rule

ALL code changes MUST be developed in a dedicated git worktree located at:
`~/github/mahg-es/worktrees/araya/<branch-name>/`

The main repository working directory (`~/github/mahg-es/araya/`) is reserved for:
- Checking out `main` or `dev-mahg` for read-only inspection
- Running orchestration commands (`/araya:*`)
- Pulling latest changes
- Worktree management operations

## Scope

- **Applies to**: All agents, all adapters, all projects in the ARAYA portfolio
- **Exceptions**: Hotfixes with explicit PO authorization (still requires worktree but with expedited workflow)
- **Repository types**: All governed repositories (araya, araya-project-coordinator, and all delivery projects)

## Enforcement Layers

| Layer | Mechanism | What it blocks |
|-------|-----------|----------------|
| **Pre-commit** | `.araya/hooks/pre-commit` | Commits on `main`/`dev-mahg` from main working directory |
| **AX3 --check** | `ax3 check()` extended | Detects worktree hygiene violations as drift |
| **CI Gate** | GitHub Actions | PRs from non-worktree branches flagged |
| **Agent Prompt** | AGENTS.md | Agent-level awareness and self-enforcement |

## Violations

| Severity | Example | Response |
|----------|---------|----------|
| 🔴 CRITICAL | Direct commit on `main` | HALT — incident report, revert, root cause analysis |
| 🟠 HIGH | Direct commit on `dev-mahg` | Block — revert, create proper worktree PR |
| 🟡 MEDIUM | Worktree not following naming convention | Warning — rename before merge |
| ⚪ LOW | Stale worktree not cleaned up | Notice — clean up within 24h |

## Related

- BRANCH-002: No direct commits on main
- ponny-express-0002: Incident report (governance bypass)
- ADR-008: Agent tool access
```

#### 2.4 Pre-commit Hook

**Create**: `.araya/hooks/pre-commit`

```bash
#!/usr/bin/env bash
# canon-rule-001: Worktree Hygiene Pre-commit Hook
# Blocks commits on main/dev-mahg from the main working directory.

set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null || echo "")
CURRENT_DIR=$(pwd)

# Determine if we're in a worktree or main repo
if [[ "$GIT_DIR" == ".git" ]]; then
  # Main repository — .git is a directory
  if [[ "$BRANCH" == "main" || "$BRANCH" == "dev-mahg" ]]; then
    echo "❌ canon-rule-001: Direct commits on '$BRANCH' from main working directory are blocked."
    echo "   Create a worktree: git worktree add ~/github/mahg-es/worktrees/araya/feature/<name> <base-branch>"
    echo "   See .araya/governance/policies/canon-rule-001-worktree-hygiene.md"
    exit 1
  fi
elif [[ "$GIT_DIR" == gitdir:* || "$GIT_DIR" == /* ]]; then
  # Worktree — .git is a file or an absolute path
  # Allow commits on feature branches
  if [[ "$BRANCH" == "main" || "$BRANCH" == "dev-mahg" ]]; then
    echo "❌ canon-rule-001: Commits on '$BRANCH' are blocked, even from worktrees."
    exit 1
  fi
fi

# Verify worktree path convention (warning only)
if [[ "$GIT_DIR" == gitdir:* ]] && [[ ! "$CURRENT_DIR" =~ worktrees/araya/ ]]; then
  echo "⚠️  canon-rule-001: Worktree should be under ~/github/mahg-es/worktrees/araya/"
  echo "   Current: $CURRENT_DIR"
fi

echo "✅ canon-rule-001: Worktree hygiene check passed"
exit 0
```

**Install hook**:
```bash
chmod +x .araya/hooks/pre-commit
ln -sf ../../.araya/hooks/pre-commit .git/hooks/pre-commit
```

#### 2.5 AX3 Validator Extension

**File**: `src/araya/v2/ax3/validator.ts` (NEW)

Add a worktree hygiene validator that `check()` calls:

```typescript
export function validateWorktreeHygiene(projectRoot: string): CheckViolation[] {
  // Check if we're in a worktree
  // Verify the worktree path follows convention
  // Return violations if found
}
```

Extend `check()` in `reconciler.ts` to call this validator.

#### 2.6 Tests for canon-rule-001

**File**: `tests/canon-rule-001-test.js` (NEW)

Test cases:
1. Pre-commit hook blocks commit on main from main repo
2. Pre-commit hook blocks commit on dev-mahg from main repo
3. Pre-commit hook allows commit on feature branch from worktree
4. Pre-commit hook warns on non-standard worktree path
5. AX3 --check detects worktree hygiene violations
6. Validator identifies missing worktree for active feature branch

### Deliverables Checklist
- [ ] AGENTS.md updated with Worktree Hygiene section
- [ ] Root AX3.md Local Contracts updated
- [ ] `.araya/governance/policies/canon-rule-001-worktree-hygiene.md` created
- [ ] `.araya/hooks/pre-commit` created and executable
- [ ] Pre-commit hook symlinked to `.git/hooks/pre-commit`
- [ ] `src/araya/v2/ax3/validator.ts` created with worktree hygiene validator
- [ ] `check()` extended to call validator
- [ ] `tests/canon-rule-001-test.js` created with 6 test cases
- [ ] All tests pass: `node tests/canon-rule-001-test.js`
- [ ] Full AX3 test suite still passes: `node tests/ax3-test.js`
- [ ] Dist rebuilt: `npm run build`
- [ ] PR created against `dev-mahg`

### Estimated AWU Cost
- Complexity: Medium-High (multi-file, new policy, hook, validator, tests)
- Estimated tokens: ~8,000
- Estimated time: 15 minutes

---

## AWU 3: Implementar canon-rule-001 en Portfolio (araya-project-coordinator)

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-003 |
| **Agent** | Daneel → Valentina |
| **Branch** | `feature/canon-rule-001-worktree-hygiene` |
| **Worktree** | `~/github/mahg-es/worktrees/araya-project-coordinator/canon-rule-001-worktree-hygiene` |
| **Skills required** | ax3 |
| **Repo** | `mahg-es/araya-project-coordinator` |
| **PR target** | `dev-araya-portfolio` |

### Task Specification

Mirror the canon-rule-001 implementation from AWU-002 into the portfolio repo:

1. **AGENTS.md** — Add Worktree Hygiene section (same content, repo-adjusted)
2. **Root AX3.md** — Add canon-rule-001 to Local Contracts, worktree path convention:
   `~/github/mahg-es/worktrees/araya-project-coordinator/<branch-name>/`
3. **Policy** — `.araya/governance/policies/canon-rule-001-worktree-hygiene.md` (repo-adjusted paths)
4. **Pre-commit hook** — `.araya/hooks/pre-commit` + symlink (same logic, different repo paths)
5. **AX3 update** — Ensure AX3 chain reflects the new policy

### Repo-Specific Adjustments

| Item | Framework (araya) | Portfolio (araya-project-coordinator) |
|------|-------------------|---------------------------------------|
| Worktree base | `~/github/mahg-es/worktrees/araya/` | `~/github/mahg-es/worktrees/araya-project-coordinator/` |
| Protected branches | `main`, `dev-mahg` | `main`, `dev-araya-portfolio` |
| PR target | `dev-mahg` | `dev-araya-portfolio` |
| AX3 check command | Same | Same |

### Deliverables Checklist
- [ ] AGENTS.md updated
- [ ] Root AX3.md updated
- [ ] Policy document created
- [ ] Pre-commit hook created and installed
- [ ] AX3 tree reconciled (`/araya:ax3`)
- [ ] PR created against `dev-araya-portfolio`

### Estimated AWU Cost
- Complexity: Medium (mirror with adjustments)
- Estimated tokens: ~4,000
- Estimated time: 8 minutes

---

## AWU 4–7: Gates (Post-Merge Validation)

**PRECONDITION**: AWU-001, AWU-002, AWU-003 PRs merged.

### AWU 4: Teresa — QA Validation

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-004 |
| **Agent** | Clara (QA Engineer) |
| **Skills** | unit-test, integration-test, tdd-execute |
| **Task** | Execute full test suite across both repos, verify 349/349 assertions, validate canon-rule-001 tests |
| **Gate** | Block if any test fails |

### AWU 5: Elena — Process Audit

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-005 |
| **Agent** | Elena (Scrum Master + PM Auditor) |
| **Skills** | sprint-planning, definition-of-done, reality-verification |
| **Task** | Verify all DoD checklists complete, process compliance, worktree hygiene enforcement in place |
| **Gate** | Block if process gaps found |

### AWU 6: Rolando — Reality Verification

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-006 |
| **Agent** | Rolando (Reality Authority) |
| **Skills** | reality-verification |
| **Task** | Verify all claims: test passes are real, files exist, hooks are installed, policies are valid |
| **Gate** | Block if reality mismatch detected |

### AWU 7: Manu — PO Final Approval

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-007 |
| **Agent** | Manu (Product Owner) |
| **Skills** | sdd-requirements, uat-review, definition-of-done |
| **Task** | Final PO validation: verify acceptance criteria, approve delivery |
| **Gate** | FINAL — delivery ships only after Manu approval |

---

## AWU 8: Limpieza (Hygiene)

| Field | Value |
|-------|-------|
| **AWU ID** | AWU-008 |
| **Agent** | Isla (Infra Architect) or Sonia directly |
| **Task** | Clean up post-delivery artifacts |

### Cleanup Checklist
- [ ] Drop stash `stash@{0}` (WIP on dev-mahg: bbd312b) — investigate if evidence needed first
- [ ] Drop stash `stash@{1}` (WIP on dev-mahg: 9a544aa from ponny-express-0002)
- [ ] Remove worktree `ponny-express-0002-governance-recovery` after evidence archived
- [ ] Remove worktree `ponny-express-0005-ax3-test-fix` after PR merged
- [ ] Remove worktree `canon-rule-001-worktree-hygiene` after PR merged

---

## Dependency DAG

```
AWU-001 (fix ax3-test)
├── → AWU-004 (Teresa QA)
│
AWU-002 (canon-rule-001: Framework) ───┐
AWU-003 (canon-rule-001: Portfolio) ───┤
                                        ├── → AWU-005 (Elena) ──┐
                                        ├── → AWU-006 (Rolando) ─┤
                                        │                        ├── → AWU-007 (Manu)
                                        └── → AWU-004 (Teresa) ─┘
                                                                      │
                                                                      └── → AWU-008 (Limpieza)
```

**Parallelizable**: AWU-001 can run in parallel with AWU-002+AWU-003.
**Parallelizable**: AWU-002 and AWU-003 can run in parallel.
**Sequential**: Gates (AWU-004 through AWU-007) run after all implementation AWUs merge.

---

## Summary

| AWU | Agent | Phase | Dependency | Cost Est. |
|-----|-------|-------|------------|-----------|
| 001 | Valentina | Fix ax3-test.js | None | 3K tokens |
| 002 | Daneel→Valentina+Priscila | canon-rule-001 Framework | None | 8K tokens |
| 003 | Daneel→Valentina | canon-rule-001 Portfolio | None | 4K tokens |
| 004 | Clara | QA Gate | 001+002+003 merged | 3K tokens |
| 005 | Elena | Process Audit | 001+002+003 merged | 2K tokens |
| 006 | Rolando | Reality Verification | 001+002+003 merged | 2K tokens |
| 007 | Manu | PO Approval | 004+005+006 | 2K tokens |
| 008 | Isla/Sonia | Cleanup | 007 | 1K tokens |

**Total estimated**: ~25K tokens (within 50K budget)
**Parallel groups**: AWU-001 ∥ AWU-002 ∥ AWU-003 → then gates

---

## Approval Required

Professor, antes de emitir estas AWUs a los especialistas, necesito su confirmación en:

1. **AWU-002 scope**: ¿Incluyo el validator TypeScript en `src/araya/v2/ax3/validator.ts` o solo documentación + hook? El validator implicaría modificar el reconciler y rebuild del dist.

2. **AWU-008 Stashes**: ¿Los 2 stashes contienen evidencia que debe preservarse, o se droppean directamente?

3. **Orden de ejecución**: ¿Lanzo AWU-001 + AWU-002 + AWU-003 en paralelo inmediatamente, o prefiere ver los PRs de implementación uno por uno?

---

— Sonia 👩‍💼
