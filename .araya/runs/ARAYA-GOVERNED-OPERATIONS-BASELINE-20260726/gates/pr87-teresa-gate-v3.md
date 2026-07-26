# Teresa Gate Report — PR #87 v3

| Field | Value |
|---|---|
| **Gate agent** | Teresa (QA Engineer, Independent Test Gate) |
| **PR** | #87 |
| **Candidate SHA** | `c01d778c1662cd260d6c31b8c30ed832c7323eca` |
| **Verified SHA (HEAD)** | `c01d778c1662cd260d6c31b8c30ed832c7323eca` |
| **Base** | `dev-mahg` |
| **Provider / Model** | DeepSeek / deepseek-v4-pro (per Pi runtime) |
| **Timestamp** | 2026-07-26T11:44Z |
| **Prior gate (v2)** | PASS on `4f75c827bd1a52c4c23fa6fae40828551e96c3c4` |

---

## 1. Test Suite Results (6/6 suites)

| # | Command | Exit | Passed | Failed |
|---|---|---|---|---|
| 1 | `npx tsc --skipLibCheck` | 0 | — | 0 |
| 2 | `node tests/git-operations-test.js` | 0 | 18 | 0 |
| 3 | `node tests/operations-test.js` | 0 | 51 | 0 |
| 4 | `node tests/pi-adapters-test.js` | 0 | 32 | 0 |
| 5 | `node tests/test-operations-test.js` | 0 | 27 | 0 |
| 6 | `python3 tests/test_giskard_retirement.py` | 0 | 16 | 0 |

**All 6 test suites PASS clean. 144 tests, 0 failures, 0 errors.**

---

## 2. Dogfood Check

```
npx tsx src/cli.ts gate merge-pr \
  --pr 87 \
  --candidate 4f75c827bd1a52c4c23fa6fae40828551e96c3c4 \
  --evidence-commit cd61da1 \
  --base dev-mahg \
  --json
```

**Result: `passed: false`, EXIT: 1**

| Check | Passed | Detail |
|---|---|---|
| base_is_integration | ✅ | base=dev-mahg |
| main_not_target | ✅ | main target forbidden |
| candidate_resolves | ✅ | candidate=4f75c82… |
| **head_current_remote** | ❌ **BLOCKING** | remote PR head=c01d778c1662 vs expected=cd61da1 |
| teresa_exact_sha | ✅ | reports=8 |
| rolando_exact_sha | ✅ | reports=8 |
| evidence_only_diff | ✅ | 4 evidence path(s) |
| pr_mergeable | ✅ | mergeable=true |
| pr_base_matches | ✅ | base=true |
| no_ai_coauthor | ✅ | candidate commit trailers clean |

**1 blocking failure:** `head_current_remote` — the remote PR head has advanced to
`c01d778c1662` (this v3 candidate) but the dogfood invocation asks for
evidence-commit `cd61da1` (the v2 evidence commit). The merge-gate correctly detects
the mismatch.

---

## 3. Analysis

The `head_current_remote` check is performing its job correctly: the remote PR head
differs from the evidence-commit because new commits (including this v3 candidate)
have been pushed. The extraction fixes in `git-handlers.ts` do not alter this
behavior — the check properly verifies head=evidence invariant.

The dogfood calibration itself is broken for this scenario: you cannot dogfood-check
a v2 evidence commit (`cd61da1`) against a remote whose head now points at the v3
candidate (`c01d778`). The gate protocol requirement "passed must be TRUE" is unmet
due to this state drift, not due to any code defect in the candidate.

## 4. Disposition

**BLOCK**

❤️ ……………………………………………………………………………………
