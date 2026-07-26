# 04 — Tests — GISKARD-RETIREMENT-ENFORCEMENT-20260726

Tested SHA: candidate (see `05-gates.md`). Logs with exact command, exit code, stdout, stderr, timestamp, SHA: `test-logs/` (15 files). PASS/FAIL decided by exit codes only.

## New retirement suite — `tests/test_giskard_retirement.py` (15/15 OK)

| # | Mandated case | Result |
|---|---|---|
| 1 | Active message to Giskard rejected (no file written) | OK |
| 2 | New task/message FROM Giskard rejected | OK |
| 3 | `next_owner: giskard` rejected | OK |
| 4 | `reports_to Giskard` in active profile rejected | OK |
| 5 | Generated runtime cannot include operational Giskard (`generate --check` guard) | OK |
| 6 | Historical archived/superseded evidence accepted | OK |
| 7 | Memorial reference (marked) accepted | OK |
| 8 | Negative fixture accepted only in test scope | OK |
| 9 | Superseded message cannot be claimed | OK |
| 10 | Superseded message cannot be processed (no transitions) | OK |
| 11 | Replacement preserves original sender + evidence hash | OK |
| 12 | Replacement routes to Daneel | OK |
| 13 | Daneel routes each BLOCK by authority type | OK |
| 14 | Unknown/empty recipient fails closed | OK |
| 15 | Repository has zero active Giskard recipients | OK |

## Regression battery (all exit 0)

| Suite | Result |
|---|---|
| `rm -rf dist && npx tsc --skipLibCheck` | exit 0 |
| `npx tsx src/araya/generate/index.ts --check` | exit 0 (guard active, no drift) |
| `python3 tests/test_postoffice_loop.py` | 14/14 OK |
| `python3 tests/test_session_identity.py` | OK |
| `python3 tests/test_sync_postoffice.py` | OK |
| `python3 src/operational_reference_validator.py` | PASS, 0 violations |
| `node tests/catalog-test.js` | OK |
| `node tests/req-043-test.js` | 31/31 |
| `node tests/skill-frontmatter-test.js` | 637/637 |
| `node tests/sonia-role-mapping-test.js` | 17/17 |
| `node tests/canonical-context-test.js` | 13/13 |
| `node tests/capsule-set-test.js` | 88/88 |
| `node tests/broker-test.js` | 86/86 |
| `node tests/man-test.js` | 56/56 |
| `node tests/ax3-test.js` | OK |
