# 04 — PR Tracker — BATCH-TRUTH-CONTINUITY-20260726

| PR | Repo | Branch | Candidate SHA | Gates (on exact SHA) | Evidence commit | Merge SHA | State |
|---|---|---|---|---|---|---|---|
| #294 (PR-P1) | araya-portfolio | feature/req-043-045-traceability-recovery | `ce1f078` | Manu PASS, Teresa PASS (7/7), Rolando VERIFIED (6/6) | `1136603` | `7e3d357` | **MERGED** 2026-07-26 |
| #82 (PR-F1) | araya | feature/pi-082-authority-continuity | `4073e3e` | Teresa PASS (14/14 suites, 1048 tests), Rolando VERIFIED (8/8, v2 erratum) | `30cbe91` | `38197e6` | **MERGED** 2026-07-26 |
| #295 (PR-P2) | araya-portfolio | feature/ax3-hook-governance-recovery | `b855fe8` → `3f8f65c` (observation fix) | Teresa PASS ×2 (86+5+8+16), Rolando VERIFIED WITH OBSERVATION → VERIFIED (v2) | `c985401` + `a98e744` | `ae4cc2d` | **MERGED** 2026-07-26 |
| PR-F2 | araya | feature/evidence-and-context-preservation | (this branch) | pending at write time | — | — | OPEN |

Gate protocol notes:
- PR #82: Rolando v1 report carried a full-SHA transcription error; corrected via v2 with explicit erratum (no silent edit). Side-effect files (catalog timestamp, PostOffice entry, loops.json) captured in `pr-f1/thread-side-effect-capture.diff` and reverted from tracked state.
- PR #295: Rolando v2 report initially not persisted (agent claim ≠ disk); recovered verbatim from the canonical checkout where the agent had written it (boundary deviation — see Q10). X..Z diff remained evidence-only.
- Remote feature branches are NOT deleted post-merge (batch restriction forbids remote branch deletion; BRANCH-005 cleanup deferred — Q3).
