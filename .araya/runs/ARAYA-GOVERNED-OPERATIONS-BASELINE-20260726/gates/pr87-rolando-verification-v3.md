# Rolando — Reality Verification Report v3

**PR:** #87 (feature/governed-operations-baseline)
**Verified SHA (FULL):** `c01d778c1662cd260d6c31b8c30ed832c7323eca`
**Disposition:** ✅ **VERIFIED**
**Date:** 2026-07-26
**Model/Vendor:** DeepSeek v4 Pro (via Pi runtime) — as reported by Pi ExtensionContext.ctx.model
**Authority:** Rolando 🛡️ — Reality Authority, ARAYA
**Supersedes:** v2 VERIFIED at `4f75c827bd1a52c4c23fa6fae40828551e96c3c4`

---

## Context

GATE RE-VERIFY v3 on candidate SHA `c01d778`. The v2 VERIFIED disposition on
`4f75c82` stands. The delta between `4f75c82` and `c01d778` is the merge-gate
extraction fix (`git-handlers.ts` line-based SHA + disposition code) plus the
v2 dogfood result file and supporting gate reports. No content code changed
beyond the extraction logic.

---

## Per-Item Results

### 1. HEAD SHA, Diff Scope

| Sub-check | Result | Evidence |
|-----------|--------|----------|
| HEAD full SHA | ✅ `c01d778c1662cd260d6c31b8c30ed832c7323eca` | `git rev-parse HEAD` |
| Branch | `feature/governed-operations-baseline` | `git branch --show-current` |
| Remote | `git@github.com:mahg-es/araya.git` | `git remote -v` |

**`git diff 4f75c82..HEAD --stat`:**

```
 .araya/catalog/catalog.json                        | 474 ++++++++++-----------
 .../gates/pr87-merge-gate-result.json              | 109 +++++
 .../gates/pr87-rolando-verification-v2.md          |  89 ++++
 .../gates/pr87-rolando-verification.md             | 104 +++++
 .../gates/pr87-teresa-gate-v2.md                   |  90 ++++
 .../gates/pr87-teresa-gate.md                      |  96 +++++
 .pi/loops.json                                     |   2 +-
 src/araya/operations/git-handlers.ts               |  34 +-
 8 files changed, 756 insertions(+), 242 deletions(-)
```

**Scope breakdown:**

| File | Classification | Notes |
|------|---------------|-------|
| `src/araya/operations/git-handlers.ts` | **The extraction fix** (34 lines) | Line-based SHA + disposition extraction in `findGateReports()` |
| `.araya/runs/.../gates/pr87-merge-gate-result.json` | Dogfood result artifact (109 new) | v2 preserved gate result |
| `.araya/runs/.../gates/pr87-rolando-verification*.md` | Gate reports (v1 + v2) | My own prior reports |
| `.araya/runs/.../gates/pr87-teresa-gate*.md` | Gate reports (v1 + v2) | Teresa's prior reports |
| `.araya/catalog/catalog.json` | **Noise** — reformat + timestamp bump | `generated_at` and `last_validated` timestamps only; 237 ins / 237 dels (reformat) |
| `.pi/loops.json` | **Noise** — timestamp bump | `updatedAt` changed from `2026-07-26T11:22:10.942Z` → `2026-07-26T11:38:35.872Z`; `loops: []` unchanged |

**Conclusion:** The only substantive code change is `git-handlers.ts`. All other changes are gate report artifacts or timestamp noise. ✅

---

### 2. Extraction Fix Verification (PR #84 a6369d7 regression check)

**Command:** `npx tsx src/cli.ts gate merge-pr --pr 84 --candidate a6369d73125935ca3b95fe0ce28b7e696a5a0984 --base dev-mahg --json`

| Check | Result | Detail |
|-------|--------|--------|
| `teresa_exact_sha` | ✅ **passed=true** | reports=8 |
| `rolando_exact_sha` | ✅ **passed=true** | reports=8 |

**Evidence:** Both extraction checks pass against the historical a6369d7 gate
reports. The new line-based SHA extraction correctly finds the 40-hex SHA from
report files with markdown/emoji formatting. The line-based disposition
extraction correctly finds the disposition vocabulary (VERIFIED, PASS, etc.)
tolerating markdown and emoji noise. **No regression** for the a6369d7 formats. ✅

Other checks (`head_current_remote`, `pr_mergeable`) fail as expected — PR #84
is already merged, remote head has moved on, mergeable=false. These are correct
temporal failures unrelated to the extraction fix.

---

### 3. Dogfood — PR #87 (v2 params) vs Preserved Result

**Command:** `npx tsx src/cli.ts gate merge-pr --pr 87 --candidate 4f75c827bd1a52c4c23fa6fae40828551e96c3c4 --evidence-commit cd61da1 --base dev-mahg --json`

**Semantic comparison:** Live dogfood JSON vs preserved `pr87-merge-gate-result.json`

| Check | Live | Preserved | Match? | Notes |
|-------|------|-----------|--------|-------|
| `base_is_integration` | passed=true | passed=true | ✅ MATCH | |
| `main_not_target` | passed=true | passed=true | ✅ MATCH | |
| `candidate_resolves` | passed=true | passed=true | ✅ MATCH | |
| `head_current_remote` | **passed=false** | passed=true | ❌ DIFFER | **Temporal** — remote head was `cd61da1` at v2 time, is now `c01d778` |
| `teresa_exact_sha` | passed=true | passed=true | ✅ MATCH | Live found 9 reports (includes v3), preserved had 8 |
| `rolando_exact_sha` | passed=true | passed=true | ✅ MATCH | reports=8 both |
| `evidence_only_diff` | passed=true | passed=true | ✅ MATCH | 4 evidence path(s) both |
| `pr_mergeable` | passed=true | passed=true | ✅ MATCH | (Note: GitHub API flaky — earlier run returned false) |
| `pr_base_matches` | passed=true | passed=true | ✅ MATCH | |
| `no_ai_coauthor` | passed=true | passed=true | ✅ MATCH | |

**Overall:** Live = FAIL (head_current_remote), Preserved = PASS

**Analysis of the DIFFER:**

The sole difference is `head_current_remote`. At the time v2 was run, the
remote PR head was `cd61da1b6f77`, which matched `evidence-commit cd61da1`.
Since then, this branch (`feature/governed-operations-baseline`) has been
pushed with commit `c01d778`, updating the remote PR head to `c01d778c1662`.

The new extraction code correctly identifies this mismatch. This is **correct
gate behavior** — the gate is faithfully reporting that the remote head has
moved on from the evidence commit. This is NOT a regression in the extraction
fix; it is the gate working as designed.

**All extraction-related checks MATCH between live and preserved:**
- `teresa_exact_sha`: extraction logic produces identical result ✅
- `rolando_exact_sha`: extraction logic produces identical result ✅
- `evidence_only_diff`: extraction logic produces identical result ✅

---

### 4. Test Suite — git-operations-test.js

**Command:** `node tests/git-operations-test.js`

```
Results: 18 passed, 0 failed, 18 total
```

**Exit code:** 0 ✅

All 18 git operations tests pass, including edge cases:
- `merge-pr` with bogus SHA → correct rejection
- `merge-pr` with base=main → correct rejection
- `merge-pr` with evidence-commit → correct expected-head logic
- `merge-pr` with valid candidate → correct extraction

---

### 5. Extraction Fix Code Audit (read-only verification)

Verified in `src/araya/operations/git-handlers.ts` at HEAD (`c01d778`):

**Line-based SHA extraction** (lines ~114-125):
- Iterates each line of the report file
- Matches lines containing `verified sha`, `candidate sha`, `evaluated sha`, or `**sha**` (case-insensitive, tolerates markdown separators)
- Extracts first 40-hex match on matched line
- Falls back to legacy regex if no line match found

**Line-based disposition extraction** (lines ~127-138):
- Finds a line containing "disposition" (case-insensitive)
- Scans that line and up to 2 following lines for disposition vocabulary: `PASS`, `FAIL`, `BLOCK`, `VERIFIED WITH OBSERVATION`, `VERIFIED`, `DISCREPANCY`
- Returns the first match found

**Code quality assessment:**
- ✅ Fallback path preserved (no breaking change)
- ✅ Tolerant of markdown/emoji formatting
- ✅ Exact 40-hex match (no truncation risk)
- ✅ Disposition vocabulary matches ARAYA standards
- ✅ Read-only — no side effects

---

## Disposition

✅ **VERIFIED**

### Rationale

1. **The extraction fix is correct.** The line-based SHA and disposition
   extraction in `findGateReports()` works for all tested formats: the
   historical a6369d7 reports (PR #84), the v2 reports (4f75c82), and the
   current v3 environment. Fallback to legacy regex preserved.

2. **No regression.** `teresa_exact_sha` and `rolando_exact_sha` both return
   `passed=true` with the correct report count for PR #84 (a6369d7). Same for
   PR #87.

3. **The sole dogfood DIFFER is temporal, not a code defect.** The
   `head_current_remote` check fails because the remote PR head has legitimately
   moved from `cd61da1` (at v2 time) to `c01d778` (current). The gate correctly
   detects this. All extraction-related checks match exactly between live and
   preserved.

4. **Tests pass.** 18/18 git-operations-test.js, exit 0.

5. **Noise accounted for.** `loops.json` (timestamp only), `catalog.json`
   (reformat + timestamps). Neither affects gate logic.

6. **Content identity with v2 preserved.** The extraction logic at `c01d778`,
   when fed the same input reports, produces semantically equivalent results as
   the preserved v2 gate result for all extraction-related fields.

The v2 VERIFIED on `4f75c82` stands. The v3 delta on `c01d778` is the
extraction fix in `git-handlers.ts` plus dogfood artifacts, all of which verify
cleanly. No new discrepancies detected.

---

*Report generated by Rolando (Reality Authority) using DeepSeek v4 Pro via Pi
runtime. All findings backed by direct inspection of repository state at commit
`c01d778c1662cd260d6c31b8c30ed832c7323eca`. Read-only verification — no files
modified.*
