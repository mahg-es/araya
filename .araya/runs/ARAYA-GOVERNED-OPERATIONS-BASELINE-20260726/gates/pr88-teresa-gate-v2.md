# Teresa Gate Report v2 — PR #88 — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

- **Gate agent:** Teresa 👩‍🍳 (TEST_GATE)
- **Provider/model:** DeepSeek / deepseek-v4-pro (supplied by Pi runtime)
- **Verified SHA:** `79d9b87dae84522041927d98e47db2b15dc7526b`
- **Candidate:** `79d9b87` (PR #88, delta vs PASSed `0e00c74`)
- **Delta:** merge-gate SHA-extraction widening in `git-handlers.ts` (+4/−2)
- **Disposition:** ✅ **PASS**

---

## Step 1 — SHA & Tree

```
$ git rev-parse HEAD
79d9b87dae84522041927d98e47db2b15dc7526b
$ git status --short
(clean)
```

---

## Step 2 — Format-Matrix (SHA Extraction Widening)

Fix in `findGateReports()` (`src/araya/operations/git-handlers.ts`):

| Change | Before | After |
|--------|--------|-------|
| Line match | `verified.?sha\|candidate.?sha\|evaluated.?sha\|...` | adds bare `candidate`, `full.?sha`, tolerant `**` |
| SHA regex | `([0-9a-f]{40})` | `([0-9a-f]{40})(?![0-9a-f])` |

### PR #84: `teresa_exact_sha` = **true** (12 reports)
Covers table-row + `**Verified SHA:**` + `**Candidate:**` formats. ✅

### PR #85: `teresa_exact_sha` = **true** (12 reports)
Covers `**SHA Under Test:**` + `**Candidate:**` formats. ✅

All four report formats extracted correctly (Rolando `| Full SHA |` via `full.?sha`).

---

## Step 3 — Independent Test Suites

| Command | Exit | Result |
|---------|------|--------|
| `node tests/git-operations-test.js` | 0 | 18/18 ✅ |
| `node tests/operations-test.js` | 0 | 51/51 ✅ |
| `python3 tests/test_giskard_retirement.py` | 0 | 16/16 ✅ |

**85/85 passing, all exit 0.**

---

## Step 4 — Dogfood (PR #88)

```sh
npx tsx src/cli.ts gate merge-pr --pr 88 \
  --candidate 0e00c74d8c746798e03ace5bb14c1bc6c670c008 \
  --evidence-commit b7ad644 --base dev-mahg --json
```

Key results: `teresa_exact_sha: true`, `rolando_exact_sha: true`, `evidence_only_diff: true`, `pr_mergeable: true`, `candidate_resolves: true`, `base_is_integration: true`, `main_not_target: true`, `pr_base_matches: true`, `no_ai_coauthor: true`. Only `head_current_remote: false` (remote=79d9b87 vs expected=b7ad644) — temporal artifact: evidence committed before fix push. All SHA-extraction checks pass.

Top-level `passed: false` due solely to `head_current_remote`. Fix behavior confirmed correct.

---

## Step 5 — Delta

`git diff 0e00c74..HEAD -- src/araya/operations/git-handlers.ts`: +4/−2, regex widened + neg-lookahead. No other source changes. Gate evidence: 3 files added.

---

## Disposition

**PASS.** SHA-extraction widening extracts correct full SHAs across all four report formats. Format-matrix: both `teresa_exact_sha: true`. 85/85 tests pass. Dogfood's only failure is temporal (`head_current_remote`), unrelated to fix. No modifications. No commits. Final.

*— Teresa 👩‍🍳, Independent Test Gate, reporting to The Data Professor*
