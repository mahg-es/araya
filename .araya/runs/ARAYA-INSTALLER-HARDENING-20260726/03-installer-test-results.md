# 03 — Installer Test Results

**Run:** ARAYA-INSTALLER-HARDENING-20260726
**Date:** 2026-07-26
**Test harness:** `tests/installer-test.sh`

## Test Summary

```
==============================================
 TEST SUMMARY
==============================================
  PASS: 21
  FAIL: 0
  TOTAL: 21

ALL TESTS PASSED
```

## Individual Results

### T-001: Clean installation into empty temp HOME
- **PASS** — `--check` passes on empty HOME (exit 0, CLEAN)
- **PASS** — `--dry-run` succeeds and makes no filesystem changes
- Preflight correctly reports: no legacy, no canonical, no deps

### T-002: Idempotent reinstall
- **PASS** — Second dry-run does not detect DUPLICATE registrations
- **PASS** — Output shows SKIP for existing items

### T-003: Legacy araya.ts symlink migration
- **PASS** — Legacy symlink created in test environment
- **PASS** — Preflight detects legacy araya.ts with WARN

### T-004: Both legacy and canonical present
- **PASS** — Both symlinks created in test environment
- **PASS** — Preflight detects DUPLICATE registrations

### T-005: Broken legacy symlink
- **PASS** — Broken symlink created (target nonexistent)
- **PASS** — Preflight detects BROKEN symlink (uses `-L` test, not `-e`)

### T-006: Preservation of unrelated settings
- **PASS** — auth.json unchanged
- **PASS** — models.json unchanged
- **PASS** — settings.json unchanged

### T-007: Dependency detection
- **PASS** — Preflight detects missing js-yaml dependency
- **PASS** — Repository `package.json` exists with js-yaml + argparse

### T-008: Exactly one ARAYA extension
- **PASS** — After install, exactly 1 extension (canonical only)

### T-009: Installed source matches repository
- **PASS** — Symlink resolves to repository artifact
- **PASS** — Content identical (diff -q passes)

### T-010: Failed install leaves no duplicates
- **PASS** — After `--check` on pre-installed canonical, still exactly 1 extension

## Static Analysis

- `bash -n araya-setup.sh`: **PASS** (no syntax errors)
- `bash -n tests/installer-test.sh`: **PASS** (no syntax errors)
- `shellcheck`: **NOT AVAILABLE** on this system (not installed)

## Test Isolation

All tests use `mktemp -d` for temporary HOME directories. No tests touch the
real `~/.pi/agent/` directory. Cleanup via `trap ... RETURN` on each test.
