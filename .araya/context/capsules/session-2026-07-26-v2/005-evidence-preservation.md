# 005 — Evidence Preservation — v2
> Capsule ID: 005 | Initiative: evidence-preservation | Status: LIVE
> Session: 2026-07-26-v2 | Mechanism: PR-F2 (branch feature/evidence-and-context-preservation, evidence commit `4c9b3ad`)

## Preserved in Git (21 files, byte-identical, SHA-256 inventoried)
Inventory with full hashes: `.araya/runs/BATCH-TRUTH-CONTINUITY-20260726/01-evidence-inventory.md`.

- **Teresa:** `ponny-express-0002-teresa-tests.md` (PE-0002 test report). Already tracked from before: `ponny-express-0009-teresa-review.md`, gate suites `tests/req-043-test.js`.
- **Rolando:** `ponny-express-0012-rolando-verification.md` (PE-0012, 20/20), `rolando-reality-audit-v2.md` (the 4-BLOCK audit), `ponny-express-0007-aurora-rolando.md` (BLOCK spec), outbox `MSG-20260725-183610-271c5427.md` (BLOCK dispatch). Already tracked: commit `5696140`, `ponny-express-0009-rolando-verification.md`, `pr-80-reverify-rolando-report.md`.
- **Signoffs PE-0002:** daneel-final, elena-final, manu-final.
- **Capsules:** set v1 `session-2026-07-26/` (10 files incl. manifest) + `.araya/efficiency/capsules/` (2). v1 is HISTORICAL — superseded by v2, not deleted.
- **Spec:** `ponny-express-0005-awus.md` (AWUs).

## Annotated, not altered
`MSG-20260725-183610-271c5427.md` (to: giskard, retired) — preserved byte-identical + `MSG-20260725-183610-271c5427.discrepancy-record.md` (recipient retired; never processed; BLOCKs re-verified active; re-routing decision = Professor, Q7).

## Still at risk / unresolved
1. **Originals remain untracked** in the framework canonical checkout (batch rule: never clean them). After this PR merges, the checkout holds stale duplicates of now-tracked content — cleanup decision belongs to the Professor (Q5).
2. **Absent evidence:** `.araya/plan/spec/req-001-teresa-final-test-report.md` — cited by v1 capsule 003, does not exist anywhere (Q2). REQ-001's 349-test claim rests on commit messages + Teresa's preserved PE-0002 report + re-runnable suites.
3. **Portfolio-side untracked copies:** requirement files (REQ-042/043/044/045, REQ-043-044.md, ponny-express-10001→10007) in the portfolio canonical checkout remain untracked; the four registrations are tracked on origin via PRs #291-293. `REQ-043-044.md` (Neo/Trinity lifecycle instruction) has no merged registration — Q6.
4. `.pi/loops.json` timestamp-only diffs — excluded by rule, both repos.

## Rules kept during preservation
No historical message modified; no evidence converted into approval; no DISCREPANCY rewritten (PR #80 re-verify stays DISCREPANCY-in-time; PE-0007 audit stays BLOCK); nothing untracked presented as preserved — preservation completed only at merge to `origin/dev-mahg`.

> v2 sources: 01-evidence-inventory.md (SHA-256), git status canonical checkout 2026-07-26, PR-F2 branch.
