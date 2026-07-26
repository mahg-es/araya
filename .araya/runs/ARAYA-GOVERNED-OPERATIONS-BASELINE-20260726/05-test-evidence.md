# 05 — Test Evidence — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

Logs with exact command, exit code, stdout, stderr, timestamp, SHA: `test-logs/` (19 files from the PR-F1 battery). PR-F2 battery re-run inline (TSC clean + 18 suites exit 0). PASS/FAIL decided by exit codes only.

## New suites this cycle

| Suite | Checks | Result |
|---|---|---|
| tests/operations-test.js | 51 | PASS (contract, catalog, resolve, adapters, CLI parity, JSON/exit codes) |
| tests/operation-first-skill-test.js | 63 | PASS (28 active agents carry skill, dormant excluded, profiles contain it, OPERATION_GAP documented) |
| tests/test-operations-test.js | 27 | PASS (5 wrappers: counts, tested_sha, evidence, failure propagation) |
| tests/git-operations-test.js | 18 | PASS (sanity, sync fail-closed, feature-start guards+dry-run, merge-gate positive+negative) |
| tests/pi-adapters-test.js | 32 | PASS (registration, delegation, dist-path loading, PHASE 10) |

## Regression suites (exit 0)

tsc, generator --check, catalog (43), req-043 (31), skill-frontmatter (637), sonia-role-mapping (17), canonical-context (13), capsule-set (88), broker (86), man (56), ax3, giskard-retirement (16), postoffice (18), session-identity, sync-postoffice, operational-reference validator (PASS).

## Dogfood evidence

`gates/pr87-merge-gate-result-final.json` — git.merge-gate authorizing PR #87 with `passed: true` (10/10 checks). First merge in ARAYA authorized by the machine gate instead of prose.
