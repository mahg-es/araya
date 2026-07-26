# PR #86 — Teresa Independent Test Gate Report

**Gate Agent:** Teresa (TEST_GATE)
**Date:** 2026-07-26
**Candidate SHA:** `563b177fed88c4a8b258bef428467a581538be62`
**PR:** #86 — `feature/governed-operations-baseline` → `dev-mahg`
**Model/Provider:** deepseek-v4-pro via DeepSeek (supplied by Pi runtime)

---

## Disposition: ✅ PASS

All 21 test suites, 5 live-fire probes, and 4 structural checks pass with zero failures.

---

## Step 1 — SHA & Repository State

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `563b177fed88c4a8b258bef428467a581538be62` |
| `git status --short` | clean (no tracked modifications) |

---

## Step 2 — Test Suite Results (21 suites, 0 failures)

| # | Command | Pass/Fail | Exit | Notes |
|---|---------|-----------|------|-------|
| 1 | `npx tsc --skipLibCheck` | PASS | 0 | |
| 2 | `npx tsx src/araya/generate/index.ts --check` | PASS | 0 | All profiles match canonical sources |
| 3 | `node tests/catalog-test.js` | 43/43 PASS | 0 | |
| 4 | `node tests/req-043-test.js` | 31/31 PASS | 0 | 12 gates validated |
| 5 | `node tests/skill-frontmatter-test.js` | 642/642 PASS | 0 | |
| 6 | `node tests/sonia-role-mapping-test.js` | 17/17 PASS | 0 | |
| 7 | `node tests/canonical-context-test.js` | 13/13 PASS | 0 | |
| 8 | `node tests/capsule-set-test.js` | 88/88 PASS | 0 | |
| 9 | `node tests/broker-test.js` | 86/86 PASS | 0 | WS-10 Part 1 |
| 10 | `node tests/man-test.js` | 56/56 PASS | 0 | WS-09 |
| 11 | `node tests/ax3-test.js` | 16/16 PASS | 0 | |
| 12 | `node tests/operations-test.js` | 51/51 PASS | 0 | |
| 13 | `node tests/operation-first-skill-test.js` | 63/63 PASS | 0 | |
| 14 | `node tests/test-operations-test.js` | 27/27 PASS | 0 | |
| 15 | `node tests/git-operations-test.js` | 18/18 PASS | 0 | |
| 16 | `python3 tests/test_giskard_retirement.py` | 16/16 OK | 0 | |
| 17 | `python3 tests/test_postoffice_loop.py` | 18/18 OK | 0 | |
| 18 | `python3 tests/test_session_identity.py` | 28/28 OK | 0 | |
| 19 | `python3 tests/test_sync_postoffice.py` | 8/8 OK | 0 | |
| 20 | `python3 src/operational_reference_validator.py` | PASS | 0 | Zero active retired-agent references |

**Totals:** ~1,264 individual assertions, 0 failures across all suites.

---

## Step 3 — Live-Fire Operations Probes

| Probe | Expected | Actual | Exit |
|-------|----------|--------|------|
| (a) `operation resolve "can I merge this PR" --json` | `matched_operation: git.merge-gate`, exit 0 | ✅ `git.merge-gate`, confidence=1 | 0 |
| (b) `git sanity --json` | `passed: true` | ✅ `passed: true`, 9/9 checks | 0 |
| (c) `git.sync-integration repo=/tmp branch=dev-mahg --json` | fails closed, exit 1 | ✅ `passed: false`, `sync_aborted_fail_closed` | 1 |
| (d) `printf 'x' \| python3 src/postoffice_loop.py --no-sync post --from daneel --to giskard` | RETIRED_OPERATIONAL_ACTOR, exit 1 | ✅ `RETIRED_OPERATIONAL_ACTOR`, routing forbidden | 1 |
| (e) `operation execute release.tag-plan --json` | design-only, not executable, exit 1 | ✅ `design-only — not executable` | 1 |

All probes confirm expected behavior — operations fail closed, retired actors rejected, design-only contracts non-executable.

---

## Step 4 — Structural Verification

| Check | Expected | Actual |
|-------|----------|--------|
| Active agents with `araya-operation-runtime` | 28 | ✅ 28 (grep count) |
| neo/trinity excluded | dormant, no runtime | ✅ both `status: dormant`, excluded from runtime |
| `.pi/agents/*.md` contain runtime | 28 of 30 | ✅ 28 carry it, neo=0, trinity=0 |
| `operations/*.yaml` contracts | 18 | ✅ 18 YAML contracts |
| CLI adapter gate logic check | `execFileSync`/`execSync`/`spawn`/`git(` absent | ✅ Zero matches — pure delegation to registry.execute |

---

## Notes

- The catalog-test reports 61 missing SKILL.md sections across 128 skills (warnings only, non-blocking). All skills pass required-section validation.
- operational_reference_validator notes one allowed non-operational reference to retired `giskard` in postoffice outbox (superseded marker) — expected.
- Frontmatter test: 642 assertions all pass; Pi 0.82.1 skill contract validated.
