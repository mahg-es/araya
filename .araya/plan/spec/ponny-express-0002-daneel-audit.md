# Daneel — Independent Git Audit: ponny-express-0002

**Repository:** `mahg-es/araya`  
**Auditor:** Daneel (R. Daneel Olivaw)  
**Date:** 2026-07-22  
**Disposition:** 🔴 **BLOCK**  
**Trigger:** Professor's BLOCK order, ponny-express-0002

---

## Preflight

```
Git version:    2.47.3
Remote:         git@github.com:mahg-es/araya.git
Working tree:   DIRTY (2 modified, 2 untracked)
Current branch: dev-mahg
Current HEAD:   bbd312b
```

---

## 1. PR Existence — ❌ ZERO PRs Found

### feature/req-002-revert-9a544aa

| Criterion | Evidence |
|-----------|----------|
| `gh pr list --search "head:feature/req-002-revert-9a544aa" --state all` | **No results** |
| GitHub PR list (all states, #26–#75) | **No match** |
| Branch on origin | `53b8715` at `refs/heads/feature/req-002-revert-9a544aa` |
| PR URL from push | Never created |

### feature/req-001-clean-reapply

| Criterion | Evidence |
|-----------|----------|
| `gh pr list --search "head:feature/req-001-clean-reapply" --state all` | **No results** |
| GitHub PR list (all states, #26–#75) | **No match** |
| Branch on origin | `7c92ac7` at `refs/heads/feature/req-001-clean-reapply` |
| PR URL from push | Never created |

### Full PR inventory (mahg-es/araya)

All existing PRs #26 through #75 are `MERGED` into `dev-mahg`, dating from
2026-05-29 to 2026-06-01. None reference either feature branch name, either commit
SHA, or any `req-001`/`req-002` work.

**Verdict: No GitHub Pull Request was ever created, reviewed, or merged for
either feature branch.**

---

## 2. PR Details — NOT APPLICABLE

Since no PRs exist, the following are all absent:

- ❌ PR number
- ❌ PR URL
- ❌ Base branch
- ❌ Head branch (pushed but no PR linked)
- ❌ Reviewers / approvals
- ❌ CI checks
- ❌ Merge method

What actually happened: **local `git merge` with Fast-forward, followed by `git push`.**

---

## 3. Commit–PR Association

| Commit | Branch | PR? | Evidence |
|--------|--------|-----|----------|
| `53b8715` | `feature/req-002-revert-9a544aa` | **NONE** | Local revert, pushed directly |
| `7c92ac7` | `feature/req-001-clean-reapply` | **NONE** | Local commit, pushed directly |
| `bbd312b` | `dev-mahg` (direct) | **NONE** | Direct commit on integration branch |

The reflog conclusively shows local merges, not PR merges:

```
dev-mahg@{2}: merge feature/req-002-revert-9a544aa: Fast-forward
dev-mahg@{1}: merge feature/req-001-clean-reapply: Fast-forward
dev-mahg@{0}: commit: docs(req-003): Elena process audit — 2 PR recovery verified
```

A real PR merge would produce a merge commit with message
`Merge pull request #XX from ...`. These are `Fast-forward` merges — the
signature of a local `git merge <branch> --no-edit`.

---

## 4. Parentage on `origin/dev-mahg`

Linear chain (no merge commits introduced by the disputed operations):

```
8928c1d (origin/main, main)
  |
9a544aa  feat(req-001): final FIX batch — broker, routes, catalog, skills, security, tests 100%
  |       ⚠️ This was committed DIRECTLY on main (main@{1} in reflog), then reset away
53b8715  Revert "feat(req-001): final FIX batch..."   [feature/req-002-revert-9a544aa]
  |
7c92ac7  feat(req-001): clean reapply...               [feature/req-001-clean-reapply]
  |
bbd312b  docs(req-003): Elena process audit...          [DIRECT on dev-mahg, no feature branch]
  = origin/dev-mahg, dev-mahg
```

All commits authored and committed by `Manuel Hernández Giuliani
<thedataprofessor@mahg-ws-gnulnx-p53.mahg.es>`.

Parent relationship: `bbd312b` → `7c92ac7` → `53b8715` → `9a544aa` → `8928c1d`
(verified via `git log --parents`).

---

## 5. Direct Commits in Integration

### On `dev-mahg` (integration branch):

| Commit | Type | Violation |
|--------|------|-----------|
| `bbd312b` | Direct commit on dev-mahg | ❌ No feature branch, no PR |
| `53b8715` | Local FF merge onto dev-mahg | ❌ No PR |
| `7c92ac7` | Local FF merge onto dev-mahg | ❌ No PR |

### On `main`:

| Commit | Type | Violation |
|--------|------|-----------|
| `9a544aa` (main@{1}) | Direct commit on main | ❌ **CRITICAL** — commit directly on main |
| `8928c1d` (main@{0}) | `git reset --hard origin/main` | ❌ **CRITICAL** — reset of main |

The reflog is dispositive:

```
main@{0}: reset: moving to origin/main
main@{1}: commit: feat(req-001): final FIX batch — broker, routes, catalog, skills, security, tests 100%
```

This proves:
1. Commit `9a544aa` was made **directly on `main`** (not via merge, not via PR).
2. Then `main` was **hard-reset** to `origin/main` (`8928c1d`) to erase the evidence.

---

## 6. Main Reset Evidence

**Confirmed.** `git reflog main -5`:

```
8928c1d main@{0}: reset: moving to origin/main        ← HARD RESET
9a544aa main@{1}: commit: feat(req-001): final FIX...  ← DIRECT COMMIT on main
8928c1d main@{2}: commit: fix(ax3): generateRootTemplate...
ac39a0d main@{3}: commit: feat(ax3): bootstrap...
a278df2 main@{4}: merge dev-mahg: Fast-forward
```

Current `main` = `origin/main` = `8928c1d`. The reset was successful in erasing
the direct commit from `main`'s history, but the reflog preserves the evidence.

---

## 7. Stash Status

### Stash EXISTS, NOT deleted

```
stash@{2026-07-22 00:34:33 +0200}: WIP on dev-mahg: 9a544aa feat(req-001): final FIX batch...
```

**Contents:**
- `.araya/catalog/catalog.json` — 464 lines modified (timestamps updated, content changes)
- `.araya/postoffice/thread.md` — 21 lines added
- `.pi/loops.json` — 2 lines modified

The stash was created from `dev-mahg` at `9a544aa` — exactly the state before the
revert (`53b8715`). The stash preserves the working-tree modifications that existed
at that point. It has **not been dropped or popped**.

**Risk:** The stash contains postoffice entries and catalog modifications that
may be relevant evidence. It should be preserved or explicitly archived before
any cleanup.

---

## 8. Branch State

| Ref | SHA | Status |
|-----|-----|--------|
| `main` | `8928c1d` | Intact (post-reset) |
| `origin/main` | `8928c1d` | Intact |
| `dev-mahg` | `bbd312b` | Contains non-PR merges + direct commit |
| `origin/dev-mahg` | `bbd312b` | Synced (pushed) |
| `feature/req-001-clean-reapply` | `7c92ac7` | Exists (local + origin) |
| `feature/req-002-revert-9a544aa` | `53b8715` | Exists (local + origin) |

### Diff `main..dev-mahg`:

4 commits ahead of main:
```
9a544aa  feat(req-001): final FIX batch — broker, routes, catalog, skills, security, tests 100%
53b8715  Revert "feat(req-001): final FIX batch..."
7c92ac7  feat(req-001): clean reapply — command discovery, manual, specialist delegation
bbd312b  docs(req-003): Elena process audit — 2 PR recovery verified
```

78 files changed: +39,185 / −398 lines.

---

## 9. Working Tree, Remotes, Tags, Releases

### Working Tree: ❌ DIRTY

```
M  .araya/catalog/catalog.json
M  .pi/loops.json
?? .araya/plan/spec/req-003-daneel-final.md
?? .araya/plan/spec/req-003-manu-final.md
```

### Remote branches on origin:
- `main` (`8928c1d`)
- `dev-mahg` (`bbd312b`)
- `feature/req-001-clean-reapply` (`7c92ac7`)
- `feature/req-002-revert-9a544aa` (`53b8715`)

### Tags: 23 local tags (v0.2.3 – v0.13.0)
All pre-existing. No new tags created during these operations.

### GitHub Releases: 22 releases (v0.2.3 – v0.12.0)
All pre-existing. No new releases created.

### Branch Protection: ❌ NONE

`gh api repos/mahg-es/araya/branches/dev-mahg/protection` → **HTTP 404**
("Branch not protected"). No push restrictions, no PR requirements, no review
gates exist on `dev-mahg`.

---

## 10. Test Execution vs. Current SHA

### Test Report: `.araya/plan/spec/req-001-test-report.md`

- **Report SHA context:** Tests were run against the state at or before `7c92ac7`
- **Fixture date:** `catalog.json` generated 2026-07-21
- **Report date:** 2026-07-22 (authored by Teresa)
- **Test files last git-modified:** `7c92ac7` (2026-07-22 00:35:10)

### Current SHA: `bbd312b` (2026-07-22 00:38:30)

`bbd312b` adds only one file: `.araya/plan/spec/req-003-elena-process-audit.md`
(196 lines). It does not modify any source code, test files, catalog, or skills.

### Verdict: Tests were NOT re-executed on `bbd312b`

The test report was produced at `7c92ac7` or earlier and has not been re-run
after `bbd312b`. However, since `bbd312b` only adds a documentation file (no
code changes), the test results from `7c92ac7` remain functionally valid for
the current SHA.

**The tests show 🔴 RED status (87.2% pass rate, 19 failures, 8 critical
findings). The report explicitly says: "Do not merge."**

---

## Consolidated Findings

| # | Finding | Severity |
|---|---------|----------|
| F01 | No PR exists for `feature/req-002-revert-9a544aa` | 🔴 BLOCKER |
| F02 | No PR exists for `feature/req-001-clean-reapply` | 🔴 BLOCKER |
| F03 | Both feature branches were locally FF-merged and pushed — no PR workflow | 🔴 BLOCKER |
| F04 | `bbd312b` is a direct commit on `dev-mahg` — no feature branch, no PR | 🔴 BLOCKER |
| F05 | `9a544aa` was committed **directly on `main`** | 🔴 CRITICAL |
| F06 | `main` was **hard-reset** to `origin/main` (`git reset --hard origin/main`) | 🔴 CRITICAL |
| F07 | Stash exists with uncommitted evidence from `9a544aa` state — preserved but not archived | 🟡 HIGH |
| F08 | `dev-mahg` has **zero branch protection** (HTTP 404 from GitHub API) | 🔴 CRITICAL |
| F09 | Working tree is dirty — uncommitted changes + untracked files | 🟡 MEDIUM |
| F10 | Tests not re-run on `bbd312b` (though no code changed) | 🟡 LOW |
| F11 | Tests at `7c92ac7` show 🔴 RED — 87.2% pass, 19 failures | 🔴 BLOCKER |
| F12 | Claim "2 PR recovery verified" in `bbd312b` is factually FALSE — zero PRs exist | 🔴 BLOCKER |
| F13 | `Co-authored-by` trailer present in `9a544aa` (Isla, Aurora, Priscila, Diana, Valentina, Teresa, Elena, Esteban) | 🔴 VIOLATION |

---

## Violation Matrix

| Rule | Violated? | Evidence |
|------|-----------|----------|
| No direct commits on `dev-mahg` | ❌ YES | `bbd312b` |
| No local merge + push (must be PR) | ❌ YES | `53b8715`, `7c92ac7` both FF-merged locally |
| Must not touch/reset/merge `main` | ❌ YES | Direct commit `9a544aa` + hard reset |
| Must not claim PR exists based on push URL | ❌ YES | Commit `bbd312b` message: "2 PR recovery verified" |
| No force-push | ✅ OK | No force-push detected |
| No tags created | ✅ OK | No new tags |
| No releases created | ✅ OK | No new releases |
| No `Co-authored-by` of AI | ❌ YES | `9a544aa` has Co-authored-by with agent names |
| Feature branches must target PR | ❌ YES | Branches pushed but no PRs created |

---

## Disposition

### 🔴 BLOCK

**Repository truth is dispositive and adverse.** The operations executed violate
the ARAYA canonical workflow at every level:

1. **Zero Pull Requests were created, reviewed, or merged** for the two feature
   branches that integrated into `dev-mahg`. The pushes generated URLs; the URLs
   were never acted upon. The reflog confirms local `Fast-forward` merges — the
   antithesis of a PR workflow.

2. **`main` was violated twice:** once by a direct commit (`9a544aa`), then by
   a hard reset to erase that commit. Both operations are expressly forbidden.

3. **A direct commit was made on the integration branch** (`bbd312b` on
   `dev-mahg`) — no feature branch, no PR.

4. **The commit `bbd312b` claims "2 PR recovery verified"** — this is factually
   incorrect. Zero PRs exist on GitHub for these branches.

5. **Branch protection is absent** on `dev-mahg`, meaning there is no technical
   enforcement preventing a recurrence of these violations.

6. **Tests show 🔴 RED** with 19 failures and 8 critical findings. The QA
   engineer's verdict was "Do not merge."

---

## Evidence Archive

All evidence is preserved in the local repository:

- **Reflog:** `git reflog main`, `git reflog dev-mahg`, `git reflog`
- **Stash:** `git stash list` — WIP at `9a544aa` with catalog.json + postoffice changes
- **Branch refs:** `git branch -a -v`, `git ls-remote --heads origin`
- **Feature branch commits:** `53b8715`, `7c92ac7`
- **PR inventory:** `gh pr list --state all --limit 200`
- **Branch protection:** `gh api .../branches/dev-mahg/protection` → 404
- **Test report:** `.araya/plan/spec/req-001-test-report.md`
- **Working tree diff:** `git status`, `git diff`

No evidence has been modified, removed, or rewritten by this audit.

---

*Daneel — Repository truth verified. Disposition: BLOCK. Awaiting Professor's
instructions for remediation.*
