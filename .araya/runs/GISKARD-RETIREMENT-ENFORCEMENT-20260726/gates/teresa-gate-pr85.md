# Teresa Gate Report — PR #85 (`feature/postoffice-message-paths-canonical-filter`)

**Date:** 2026-07-26
**Gate Agent:** Teresa (TEST_GATE)
**Model:** `deepseek-v4-pro` via DeepSeek (supplied by Pi runtime)
**SHA Under Test:** `dcdc1249dba2a33da2ca11f2d85639754d9eb325`
**Disposition:** ✅ **PASS**

---

## Scope Confirmation

`git diff b772969..HEAD` confirms exactly:
- `src/postoffice_loop.py`: `message_paths()` — added `ID_RE.match(p.stem)` guard so that annotation records (`*.discrepancy-record.md`) are excluded from message scans.
- `tests/test_postoffice_loop.py`: 4 new tests in `AnnotationRecordToleranceTests`.

## Test Suite Results

| Suite | Tests | Result |
|---|---|---|
| `tests/test_postoffice_loop.py` | 18 | **OK** (0.090s) |
| `tests/test_session_identity.py` | 28 | **OK** (2.627s) |
| `tests/test_sync_postoffice.py` | 8 | **OK** (0.695s) |
| `src/operational_reference_validator.py` | — | **PASS** |

All 4 new `AnnotationRecordToleranceTests` pass:
- `test_summary_ignores_annotation_records`
- `test_list_ignores_annotation_records`
- `test_pending_ignores_annotation_records`
- `test_allocate_seq_ignores_annotation_records`

## Live-Fire Results (Real Repo State)

| Command | Exit | Expected | Actual | Match |
|---|---|---|---|---|
| `--no-sync summary` | 0 | `counts.messages = 2` | `2` | ✅ |
| `--no-sync list` | 0 | 2 items | 2 items | ✅ |
| `--no-sync pending --to daneel` | 0 | 1 item | 1 item | ✅ |
| `--no-sync pending --to giskard` | 0 | 0 items | 0 items | ✅ |

## Regression Probe — Evidence Preservation

```
.araya/postoffice/outbox/
├── MSG-20260725-183610-271c5427.md                   ← canonical (superseded)
├── MSG-20260725-183610-271c5427.discrepancy-record.md ← annotation record
├── MSG-20260726-083823-4d3ad179.md                    ← re-routed (new, to daneel)
└── .gitkeep
```

✅ Both the canonical message and the discrepancy record are preserved — no rename, no deletion. The filter correctly excludes the annotation record (`.discrepancy-record.md`) while keeping the canonical message (`MSG-*.md` with valid ID stem) visible in all commands.

## Summary

- **One-line source fix**: `ID_RE.match(p.stem)` in `message_paths()` — minimal, correct.
- **4 regression tests**: cover the exact failure modes from the PR #84 post-merge audit.
- **Zero regressions**: all 54 existing tests continue to pass.
- **Live-fire confirms**: annotation records ignored; canonical messages counted and listed correctly; evidence preserved on disk.
- **Validator**: no active retired-agent references — clean.

**Gate Decision: PASS. This candidate is safe to merge.**
