# Teresa — Independent Test Gate Report

**PR:** #87
**Branch:** `feature/governed-operations-baseline`
**Candidate SHA:** `b4ef4ebad882e1277237e35c1990169754fca1e6` (full 40-char)
**Gate Date:** 2026-07-26T11:34Z
**Agent:** Teresa (TEST_GATE)
**Runtime Model:** deepseek-v4-pro (provider: deepseek, as reported by Pi runtime)

---

## Step 1: Identity Verification

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `b4ef4ebad882e1277237e35c1990169754fca1e6` |
| `git status --short` | Clean (no tracked-file modifications) |

---

## Step 2: Build & Test Suite Results

### Build
| Command | Exit | Result |
|---------|------|--------|
| `rm -rf dist && npx tsc --skipLibCheck` | 0 | PASS |
| `npx tsx src/araya/generate/index.ts --check` | 0 | PASS (all profiles clean, no drift) |

### Node.js Test Suites (12 suites)
| Suite | Passed | Failed | Exit |
|-------|--------|--------|------|
| `tests/operations-test.js` | 51 | 0 | 0 |
| `tests/operation-first-skill-test.js` | 63 | 0 | 0 |
| `tests/test-operations-test.js` | 27 | 0 | 0 |
| `tests/git-operations-test.js` | 18 | 0 | 0 |
| `tests/pi-adapters-test.js` | 32 | 0 | 0 |
| `tests/catalog-test.js` | 43 | 0 | 0 |
| `tests/req-043-test.js` | 31 | 0 | 0 |
| `tests/skill-frontmatter-test.js` | 642 | 0 | 0 |
| `tests/capsule-set-test.js` | 88 | 0 | 0 |
| `tests/broker-test.js` | 86 | 0 | 0 |
| `tests/man-test.js` | 56 | 0 | 0 |
| `tests/ax3-test.js` | 16 | 0 | 0 |

**Node.js subtotal: 1,153 passed, 0 failed**

### Python Test Suites (4 suites)
| Suite | Passed | Failed | Exit |
|-------|--------|--------|------|
| `tests/test_giskard_retirement.py` | 16 | 0 | 0 |
| `tests/test_postoffice_loop.py` | 18 | 0 | 0 |
| `tests/test_session_identity.py` | 28 | 0 | 0 |
| `tests/test_sync_postoffice.py` | 8 | 0 | 0 |

**Python subtotal: 70 passed, 0 failed**

### Operational Reference Validator
| Command | Exit | Result |
|---------|------|--------|
| `python3 src/operational_reference_validator.py` | 0 | PASS (zero active retired-agent references) |

---

## Step 3: Live Probes

| Probe | Command | Expected | Actual | Exit |
|-------|---------|----------|--------|------|
| (a) Intent resolution | `operation resolve "run relay behavior suite" --json` | Match `test.relay-behavior`, `passed=true` | ✅ matched, confidence=1 | 0 |
| (b) Test relay-unit | `test test.relay-unit --json` | `passed=true` | ✅ passed, 18/18 tests | 0 |
| (c) Static: `tdd: "clara"` present | `grep 'tdd: "clara"' extensions/araya/index.ts` | Found at line 467 | ✅ `tdd: "clara"` present | 0 |
| (c) Static: `tdd: "teresa"` absent | `grep 'tdd: "teresa"' extensions/araya/index.ts` | No match (exit 1) | ✅ Teresa is NOT tdd gate | 1 |
| (d) `NOT_IMPLEMENTED` audit | `grep -rn NOT_IMPLEMENTED src/` | Type definition + handler only | ✅ Used as ResultStatus enum value (`types.ts:18`), type const (`types.ts:68`), and handler override (`misc-handlers.ts:61`). No broken stubs. | 0 |
| (e) Build artifact | `test -f dist/araya/operations/registry.js` | File exists | ✅ EXISTS | — |

---

## Aggregate Summary

| Metric | Value |
|--------|-------|
| **Total tests executed** | **1,223** |
| **Passed** | **1,223** |
| **Failed** | **0** |
| **Build** | ✅ PASS |
| **Generation drift** | ✅ None |
| **Live probes** | ✅ 6/6 |
| **Operational references** | ✅ PASS |
| **Working tree** | Clean |

---

## Disposition: PASS ✅

All 1,223 tests pass with zero failures. Build compiles cleanly. All adapter profiles match canonical sources. All five live probes pass — intent resolution matches `test.relay-behavior`, `test.relay-unit` executes and reports 18/18, `tdd: "clara"` is the sole tdd gate in index.ts, `NOT_IMPLEMENTED` is present only as a valid ResultStatus enum member (no dead stubs), and `dist/araya/operations/registry.js` exists post-build. Operational reference validator confirms zero active retired-agent references.

**Candidate `b4ef4ebad882e1277237e35c1990169754fca1e6` is cleared by the TEST_GATE.**
