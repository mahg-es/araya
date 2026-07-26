# 06 — Gate Summary

**Run:** ARAYA-INSTALLER-HARDENING-20260726  
**Agent:** Isla (Infra Architect)  
**Date:** 2026-07-26  
**Status:** ✅ ALL GATES PASSED  

## Gate Matrix

| Gate | Description | Status | Evidence |
|------|-------------|--------|----------|
| G-SYNTAX | Installer syntax valid | ✅ PASS | `bash -n` clean |
| G-TEST | All 21 test scenarios pass | ✅ PASS | `tests/installer-test.sh` |
| G-CANONICAL | Exactly one canonical registration | ✅ PASS | `araya/index.ts` symlink only |
| G-LEGACY | No legacy `araya.ts` | ✅ PASS | Verified absent |
| G-DEPS | Dependencies present | ✅ PASS | js-yaml + argparse in node_modules |
| G-SOURCE | Installed matches repository | ✅ PASS | SHA-256 identical, symlink verified |
| G-SETTINGS | User settings preserved | ✅ PASS | auth/models/models-store unchanged |
| G-SECRETS | No secrets printed | ✅ PASS | Installer output inspected |
| G-IDEMPOTENT | Second install produces same result | ✅ PASS | T-002 confirmed |
| G-DRYRUN | Dry-run makes no changes | ✅ PASS | T-001 confirmed |
| G-BROKEN | Broken legacy symlink handled | ✅ PASS | T-005 confirmed |
| G-DUPLICATE | No duplicate registrations | ✅ PASS | T-004/T-008/T-010 confirmed |
| G-REAL | Real installation validated | ✅ PASS | Post-install verification passed |
| G-BACKUP | Backup created before changes | ✅ PASS | `~/.pi/agent/.araya-backup-*` exists |
| G-README | README updated | ✅ PASS | Install section rewritten |
| G-PKGJSON | Repository package.json created | ✅ PASS | `extensions/araya/package.json` |

## Deliverables

| # | File | Phase |
|---|------|-------|
| 1 | `araya-setup.sh` (rewritten) | Phase 5 |
| 2 | `extensions/araya/package.json` (new) | Phase 5 |
| 3 | `README.md` (updated install section) | Phase 6 |
| 4 | `tests/installer-test.sh` (new) | Phase 7 |
| 5 | Real installation validated | Phase 8 |
| 6 | Evidence documents (01-06) | Phase 9 |

## Changes Summary

### `araya-setup.sh`
- Removed legacy `araya.ts` creation entirely
- Created only canonical `araya/index.ts` symlink
- Added flags: `--check`, `--dry-run`, `--force`, `--uninstall`
- Added preflight inventory with broken symlink detection (`-L`)
- Added backup staging with automatic restore on failure
- Added post-install verification (6 checks)
- Added npm dependency installation (js-yaml + argparse)
- Added user-data protection (never touches auth/models/settings)
- Fixed `[ -e ]` vs `[ -L ]` for broken symlink detection

### `extensions/araya/package.json` (NEW)
- Declares js-yaml ^4.1.0 and argparse ^2.0.1

### `README.md`
- Added Prerequisites section
- Added Canonical Extension Location section
- Added Verify Installation section
- Added Confirm Commands Do Not Contain :1/:2 section
- Added Upgrade Procedure section
- Added Legacy Migration Behavior table
- Added Backup and Rollback section
- Added Safe Uninstall section
- Added Troubleshooting Duplicate Commands section
- Added Known Limitations section

### `tests/installer-test.sh` (NEW)
- 10 scenarios, 21 individual checks
- All tests pass
- Isolated via mktemp — never touches real ~/.pi

## Open Items

- `shellcheck` not available on this system — recommended to run in CI
- Full `/reload` + command verification in pi requires interactive session
- The `--project` flag behavior is preserved unchanged from prior version

## Recommendation

✅ **READY for merge into `feature/v0.10.0-installer-hardening`**
