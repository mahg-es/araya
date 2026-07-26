# 06 — Gates — ARAYA-GOVERNED-OPERATIONS-BASELINE-20260726

| PR | Candidate | Teresa | Rolando | git.merge-gate | Merge SHA |
|---|---|---|---|---|---|
| #296 (portfolio) | `8a62f6c` | PASS | VERIFIED (124+3=127 reconciliation) | n/a (pre-operation) | `e1963b7` |
| #86 (PR-F1) | `563b177` | PASS (21 suites) | VERIFIED (10/10) | bootstrap manual (allowed once) | `96fb9c1` |
| #87 v1 (PR-F2) | `b4ef4eb` | PASS (1223 tests) | DISCREPANCY (ancestry) → content-identical merge | — | — |
| #87 v2 | `4f75c82` | PASS (9/9, tree identical) | VERIFIED (ancestry resolved) | — | — |
| #87 v3 | `c01d778` | BLOCK (stale dogfood params — instruction error; 144/144 green) | VERIFIED (no regression) | — | — |
| #87 v4 | `c01d778` | PASS (207/207) + dogfood passed:true | VERIFIED | **passed: true** (10/10) | `ca6b0b0` |
| PR-F3 (records) | (this PR) | pending | pending | dogfood required | — |

## Notable gate events

- **First machine-authorized merge:** PR #87 merged solely after `git.merge-gate` returned `passed: true` with checks + evidence (no prose authorization). Result preserved: `gates/pr87-merge-gate-result-final.json`.
- Rolando DISCREPANCY (v1) → ancestry fix via content-identical merge; re-gated.
- Teresa BLOCK (v3) → stale parameters supplied by coordinator (instruction error, recorded); v4 with correct parameters → PASS.
- Gate-agent reliability: no persistence failures this cycle (reports verified on disk before each evidence commit).
