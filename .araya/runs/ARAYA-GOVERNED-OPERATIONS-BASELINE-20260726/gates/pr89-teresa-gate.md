# Teresa Gate — PR #89 (Records-Only Final Report)

**Gate:** TEST_GATE (Independent Test Gate, ARAYA)
**Artifact:** mahg-es/araya, PR #89 — records-only: final report + entry-gate result
**Cycle:** ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

## Runtime Declaration
- **Provider:** poolside (supplied by Pi runtime)
- **Model ID:** poolside/laguna-s-2.1 (supplied by Pi runtime)

## Verified SHA
- `verified_sha`: `d6fd544cdb9ad4bd27ba730b6b89cc1d3276598d` (full, exact; `git rev-parse HEAD`)

## Commands & Exit Codes

| # | Command | Exit Code | Result |
|---|---|---|---|
| 1 | `git rev-parse HEAD` | 0 | `d6fd544cdb9ad4bd27ba730b6b89cc1d3276598d` |
| 2 | `python3 -c "import json; d=json.load(open('.araya/runs/ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726/operational-acceptance-entry-gate-result.json')); assert d['passed'] is True and len([c for c in d['checks'] if c['passed']]) == 9 and not d['failed_checks']; print('entry-gate result valid: passed=true, 9/9')"` | 0 | `entry-gate result valid: passed=true, 9/9` |
| 3 | `find . -name 08-final-report.md` | 0 | Found at `.araya/runs/ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726/08-final-report.md` |
| 4 | `git cat-file -t 46306c2` | 0 | `commit` (ary a repo) |
| 5 | `git cat-file -t ca6b0b0` | 0 | `commit` (ary a repo) |
| 6 | `git cat-file -t 96fb9c1` | 0 | `commit` (ary a repo) |
| 7 | `git -C ~/github/mahg-es/araya-project-coordinator cat-file -t e1963b7` | 0 | `commit` (araya-project-coordinator) |
| 8 | `node tests/operations-test.js` | 0 | `51 passed, 0 failed, 51 total` |

## Evidence Summary

**Entry-gate result (JSON):** `operational-acceptance.entry-gate` v1.0.0 — `passed: true`, `status: PASS`, 9/9 blocking checks green, 0 failed_checks, 0 blocking_reasons. Checks: framework_giskard_zero, portfolio_giskard_zero, postoffice_source_drift_zero, installed_runtime_drift_zero, operation_catalog_valid, mandatory_operation_skill, merge_gate_operational, test_operations_operational, main_untouched.

**Merge SHAs (from 08-final-report.md gates table):** `46306c2` (PR #88), `ca6b0b0` (PR #87), `96fb9c1` (PR #86), `e1963b7` (PR #296, araya-project-coordinator) — all verified as commits in their respective repositories.

**Test suite:** `tests/operations-test.js` — Operation Contract + Catalog tests. 51 passed, 0 failed. Exit 0.

## Disposition

**PASS**

All four protocol gates satisfied: (1) full SHA verified, (2) preserved entry-gate result validated (passed=true, 9/9, exit 0), (3) final report exists and all four stated merge SHAs exist as commits in git, (4) `node tests/operations-test.js` exits 0 with 51/51 passing. No failures, no skips, no modifications made.
