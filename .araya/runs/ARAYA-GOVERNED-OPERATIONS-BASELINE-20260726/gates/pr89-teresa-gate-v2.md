# Teresa — Independent Test Gate v2 (FINAL)

**Gate:** TEST_GATE · **Artifact:** mahg-es/araya PR #89 · **Candidate SHA:** 5eba4b6
**Executor:** Teresa (Independent Test Gate, TEST_GATE authority)
**Model/Vendor (Pi-runtime supplied):** provider=poolside, model=poolside/laguna-s-2.1

## Verified SHA
```
5eba4b67b0046326472d1b7bcf16195dc6a5bf0b
```

## Protocol Execution
### 1. HEAD SHA + diff scope (46306c2..HEAD)
```
$ git rev-parse HEAD
5eba4b67b0046326472d1b7bcf16195dc6a5bf0b
$ git diff --name-only 46306c2..HEAD
.araya/runs/ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726/08-final-report.md
.araya/runs/ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726/operational-acceptance-entry-gate-result.json
```
**Result:** EXACTLY the two expected report files — no product-code changes. EXIT 0.

### 2. Delta vs previously PASSed d6fd544
```
$ git diff --name-only d6fd544..HEAD
.pi/loops.json
```
Only `.pi/loops.json` changed — a timestamp revert (12:28:05Z → 12:18:57Z), the
finding-class nit flagged in gate-v1 and now corrected. No functional delta.

### 3. Entry-gate JSON verification (python3 assert)
```
$ python3 -c "assert d['passed']==True and len(d['checks'])==9 and all(c['passed'] for c in d['checks']) and d['failed_checks']==[]"
ASSERT OK: passed=true, 9/9 checks, failed_checks empty
EXIT_CODE=0
```
Checks: framework_giskard_zero, portfolio_giskard_zero, postoffice_source_drift_zero,
installed_runtime_drift_zero, operation_catalog_valid, mandatory_operation_skill,
merge_gate_operational, test_operations_operational, main_untouched — all PASS.

### 4. Node test suite
```
$ node tests/operations-test.js
Results: 51 passed, 0 failed, 51 total
EXIT_CODE=0
```

## Evidence Summary
| Check | Result |
|---|---|
| HEAD SHA exact | 5eba4b67b0046326472d1b7bcf16195dc6a5bf0b |
| Diff scope (46306c2..HEAD) | Only 08-final-report.md + entry-gate JSON |
| Delta vs d6fd544 | Only .pi/loops.json timestamp revert |
| Entry-gate JSON | passed=true, 9/9, failed_checks=[] (assert exit 0) |
| node tests/operations-test.js | 51 passed, 0 failed (exit 0) |

## Disposition
**PASS** — All required gates green. No product code modified by this gate. Candidate 5eba4b6
is cleared for operational acceptance (Manu).
