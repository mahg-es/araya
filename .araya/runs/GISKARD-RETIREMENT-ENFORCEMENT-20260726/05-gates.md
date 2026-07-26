# 05 — Gates — GISKARD-RETIREMENT-ENFORCEMENT-20260726

## PR #84 (enforcement)

| Round | Candidate | Teresa | Rolando | Outcome |
|---|---|---|---|---|
| v1 | `966f9e5e5f79e41451894380bbdd27906575ac84` | **FAIL** (3b: replacement supersede-able without `--by`) | **VERIFIED** (11/11) | fix required |
| v2 | `a6369d73125935ca3b95fe0ce28b7e696a5a0984` | **PASS** (16 suites exit 0; 16/16; adversarial 4a/4b/4c/4d) | **VERIFIED** (8/8; zero-counts confirmed) | merged `b772969` |

Teresa's v1 FAIL produced the supersession chain-integrity guard (`--by` required when superseding a replacement; test_16). No gate override occurred; the fix was gated again from scratch. v1 reports preserved inside commit `a6369d7`; v2 reports in evidence commit `71cc401`. X..Y evidence-only verified.

## PR #85 (post-merge audit fix)

| Round | Candidate | Teresa | Rolando | Outcome |
|---|---|---|---|---|
| v1 | `dcdc1249dba2a33da2ca11f2d85639754d9eb325` | **PASS** (54 tests; live-fire on real state) | **VERIFIED** (5/5) | merged (see git log) |

Note: Rolando's PR #85 summary sentence says "merge to main" — drafting slip; the PR base was verified `dev-mahg` at creation and at merge. Recorded for accuracy.

## Gate-agent reliability note (carried from prior batch Q10)

Gate instructions now include "write report as FINAL action" + explicit worktree-only writes. No persistence failures this cycle.
