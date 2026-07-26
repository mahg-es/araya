# Teresa Gate Report — PR #87 (v2 re-run)

**Gate:** Independent Test Gate (TEST_GATE)  
**Agent:** Teresa 👩‍🍳  
**Date:** 2026-07-26  
**Model:** DeepSeek v4 Pro (per Pi runtime)  
**Provider:** deepseek  

---

## Candidate

| Field | Value |
|-------|-------|
| **Verified SHA** (FULL 40-char) | `4f75c827bd1a52c4c23fa6fae40828551e96c3c4` |
| **Tree hash** | `f2e65f259f573bd971ce0627a4e81c6859a0bb66` |
| **Previous PASS SHA** | `b4ef4eb` |
| **Previous tree** | `f2e65f259f573bd971ce0627a4e81c6859a0bb66` |
| **Trees identical?** | YES — content-identical ancestry merge |
| **Repo** | mahg-es/araya |
| **Branch** | feature/governed-operations-baseline |

---

## Ancestry Gate

```
git merge-base --is-ancestor 96fb9c1 HEAD → YES
```

PR #87 now properly rooted in dev-mahg ancestry. ✅

---

## Suite Results

| # | Command | Exit | Passed | Failed |
|---|---------|------|--------|--------|
| 1 | `npx tsc --skipLibCheck` | 0 | — | — |
| 2 | `npx tsx src/araya/generate/index.ts --check` | 0 | all adapters clean | 0 |
| 3 | `node tests/pi-adapters-test.js` | 0 | 32 | 0 |
| 4 | `node tests/operations-test.js` | 0 | 51 | 0 |
| 5 | `node tests/git-operations-test.js` | 0 | 18 | 0 |
| 6 | `node tests/test-operations-test.js` | 0 | 27 | 0 |
| 7 | `node tests/operation-first-skill-test.js` | 0 | 63 | 0 |
| 8 | `python3 tests/test_giskard_retirement.py` | 0 | 16 | 0 |
| 9 | `python3 src/operational_reference_validator.py` | 0 | PASS (803 files) | 0 |

**Aggregate: 207 tests passed, 0 failed across all suites.**

---

## Suite Details

### 1. TypeScript Compilation
- Clean compile, no errors.

### 2. Adapter Profile Drift Check
- All 4 adapters (pi, codex, claude-cli, agy) match canonical sources.

### 3. pi-adapters-test.js
- 32/32 passed. Adapter + runtime corrections verified.

### 4. operations-test.js
- 51/51 passed. Operation contract, catalog, describe, resolve, execute, and git sanity.

### 5. git-operations-test.js
- 18/18 passed. git.sanity, git.sync-integration, git.feature-start (dry-run), gate merge-pr with evidence-commit.

### 6. test-operations-test.js
- 27/27 passed. test.relay-* wrapper operations including nonexsistent-repo error path.

### 7. operation-first-skill-test.js
- 63/63 passed. Operation-first skill generation and profile drift.

### 8. test_giskard_retirement.py
- 16/16 passed. Giskard retirement test suite.

### 9. operational_reference_validator.py
- PASS. 803 files scanned. One advisory note (non-operational retired-actor mention in postoffice outbox, allowed).

---

## Disposition

# ✅ PASS

All 9 suites pass with exit 0. 207 tests, 0 failures. Tree hash identical to previously-PASSed b4ef4eb. Ancestry gate satisfied. No regressions. No drift. Content-identical merge confirmed.

This candidate is cleared for merge.
