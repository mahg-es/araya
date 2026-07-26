# Teresa — Independent Test Gate Report

**Gate**: ponny-express-10008 FASE 6 (Giskard Retirement Enforcement)
**Candidate**: SHA `966f9e5e5f79e41451894380bbdd27906575ac84`
**Branch**: `feature/giskard-operational-retirement-enforcement`
**PR**: #84
**Model/Provider**: deepseek-v4-pro (deepseek, per Pi runtime)
**Date**: 2026-07-26

---

## Disposition: **FAIL**

Reason: 1 of 4 adversarial live-fire checks (Step 3b) did not produce the
protocol-expected result. All other gates pass cleanly.

---

## Step 1 — SHA & Working Tree

- **SHA**: `966f9e5e5f79e41451894380bbdd27906575ac84` (40-char, verified)
- **git status --short**: clean (no tracked modifications)
- **Result**: ✓

---

## Step 2 — Automated Test Suite (16 commands, all pass)

| Command | Exit | Result |
|---|---|---|
| `npx tsc --skipLibCheck` | 0 | Clean |
| `npx tsx src/araya/generate/index.ts --check` | 0 | All 4 adapters clean |
| `python3 tests/test_giskard_retirement.py` | 0 | 15/15 OK |
| `python3 tests/test_postoffice_loop.py` | 0 | 14/14 OK |
| `python3 tests/test_session_identity.py` | 0 | 28/28 OK |
| `python3 tests/test_sync_postoffice.py` | 0 | 8/8 OK |
| `python3 src/operational_reference_validator.py` | 0 | RESULT: PASS |
| `node tests/catalog-test.js` | 0 | 43/43 passed |
| `node tests/req-043-test.js` | 0 | 31/31 passed |
| `node tests/skill-frontmatter-test.js` | 0 | 637/637 passed |
| `node tests/sonia-role-mapping-test.js` | 0 | 17/17 passed |
| `node tests/canonical-context-test.js` | 0 | 13/13 passed |
| `node tests/capsule-set-test.js` | 0 | 88/88 passed |
| `node tests/broker-test.js` | 0 | 86/86 passed |
| `node tests/man-test.js` | 0 | 56/56 passed |
| `node tests/ax3-test.js` | 0 | 16/16 passed |

**Step 2 aggregate**: 15 commands, all EXIT 0, zero failures.

---

## Step 3 — Adversarial Live-Fire

### 3a: Retired-actor post rejection ✓
```
printf 'x' | python3 src/postoffice_loop.py --no-sync post --from daneel --to giskard --subject x --body-stdin
```
- **EXIT**: 1
- **Error code**: `RETIRED_OPERATIONAL_ACTOR`
- **Message**: "to: 'giskard' is retired — no operational role…"
- **MSG count before**: 3, **after**: 3 (no new file created)
- **Result**: ✓ PASS

### 3b: Supersede replacement-message rejection ✗
```
python3 src/postoffice_loop.py --no-sync supersede MSG-20260726-083823-4d3ad179 --reason test
```
- **Expected**: EXIT 1 (protocol: "MUST fail… transition superseded→superseded invalid")
- **Actual**: EXIT 0, `ok: true`, status changed `new` → `superseded`
- **Root cause**: MSG-20260726-083823-4d3ad179 was in `status: "new"` (not
  `superseded`). It IS a replacement message (has `supersedes` field), but the
  `supersede` command allows superseding a replacement that has not yet itself
  been superseded. The protocol expected this to be rejected, but the code
  permits the transition.
- **Note**: Tracked file edits were reverted after the test (`git checkout`).
- **Result**: ✗ FAIL

### 3c: Pending query for daneel ✓
```
python3 src/postoffice_loop.py --no-sync pending --to daneel
```
- **EXIT**: 0
- **Returns exactly**: `MSG-20260726-083823-4d3ad179` (the replacement message)
- **Result**: ✓ PASS

### 3d: MSG-20260725-183610-271c5427.md frontmatter integrity ✓
```
git diff 395f622..HEAD -- .araya/postoffice/outbox/MSG-20260725-183610-271c5427.md
```
- `status`: `"new"` → `"superseded"` ✓
- `superseded_by`: added (`MSG-20260726-083823-4d3ad179`) ✓
- `supersede_reason`: added ✓
- Body content: unchanged (no diff after `---` separator) ✓
- Only frontmatter edits in the diff ✓
- **Result**: ✓ PASS

**Step 3 aggregate**: 3/4 pass, 1 failure (3b).

---

## Step 4 — Structural Checks

| Check | Result |
|---|---|
| `.araya/governance/retired-agents.json` exists with `giskard` entry | ✓ |
| `tests/test_giskard_retirement.py` has 15 test methods | ✓ (exactly 15 `def test_`) |
| `test_postoffice_loop.py` — Giskard as actor | ✓ 0 hits |
| `test_session_identity.py` — Giskard as actor | ✓ 0 hits |
| `test_sync_postoffice.py` — Giskard as actor | ✓ 0 hits (1 false positive: commit message string `-m giskard`, not an actor reference) |

**Step 4 aggregate**: All structural checks pass.

---

## Summary

| Step | Status |
|---|---|
| Step 1 — SHA & clean tree | ✓ |
| Step 2 — 16 automated test suites | ✓ (all EXIT 0) |
| Step 3 — Adversarial live-fire | ✗ 3b (supersede of replacement message not rejected) |
| Step 4 — Structural checks | ✓ |

**Total**: 3/4 steps pass. Step 3b is the sole failure.

The failure is a semantic gap: the `supersede` subcommand allows superseding a
message that is itself a replacement (carries a `supersedes` field) while it is
still in `new` status. The protocol expected rejection, but the code permits
the transition. This is non-blocking for most operational flows but represents
a protocol enforcement gap.

**Disposition**: **FAIL** — with evidence. A single adversarial test (3b)
did not meet the protocol requirement. All automated suites and all other
checks pass.

---
*Teresa, Independent Test Gate of ARAYA*
*Model: deepseek-v4-pro (deepseek, per Pi runtime)*
