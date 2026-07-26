# Batch Truth and Continuity Recovery

**Run:** BATCH-TRUTH-CONTINUITY-20260726 (ponny-express-10007, night batch, autonomous)
**Executor:** Daneel (Relay Controller) — pi.dev 0.82.1, `kimi-k3`/`moonshotai` (Pi-runtime supplied)
**Date:** 2026-07-26

## Disposition
PARTIAL → trending SUCCESS: all safe work packages completed; closure items are Professor-decision-blocked, not execution-blocked (see Remaining Blockers).

## Repository State
| Repo | Branch | Local SHA | Remote SHA | Clean? |
|---|---|---|---|---|
| araya (canonical) | dev-mahg | 0902ac6 | origin/dev-mahg **38197e6** (post #82) | dirty (pre-existing untracked evidence — intentionally untouched; `M skills/relay-participant/SKILL.md`, `M .pi/loops.json`) |
| araya-project-coordinator (canonical) | dev-araya-portfolio | 59dfa17 | origin/dev-araya-portfolio **ae4cc2d** (post #295) | dirty (53 untracked entries — intentionally untouched; local 8 behind origin) |

## Evidence Preservation
- **Preserved (this PR):** 21 files (SHA-256 inventoried, `01-evidence-inventory.md`) — Teresa PE-0002 tests + 3 PE-0002 signoffs, Rolando PE-0012 verification + reality-audit-v2 + PE-0007 spec + BLOCK dispatch message, AWU spec, capsule set v1, efficiency capsules; plus Giskard-outbox discrepancy record, run records 00–05, capsule set v2 (9+manifest), `tests/capsule-set-test.js` (88 checks).
- **Excluded:** `.pi/loops.json` (timestamp-only, per rule).
- **Still at risk:** originals remain untracked in the framework canonical checkout (cleanup = Q5, Professor); portfolio canonical checkout untracked copies (REQ files, REQ-043-044.md, ponny-express-1000x, one stray gate-report copy).

## Requirements
- **REQ-042:** registered (PR #291), `new`, not implemented, not closed; blocked by REQ-043 crit. 24 + PE-0007 formal closure.
- **REQ-043:** registered (PR #292); implementation delivered-in-dev (PR #80 `788606d` + #81 `0902ac6`; hardening #82 `38197e6`); NOT accepted (criteria 20/21 gates on `0902ac6` never emitted; Manu SPEC_APPROVED pending); NOT in main.
- **REQ-044/045:** registered (PR #293), `new`; Neo/Trinity dormant verified; capsule set v2 produced (this PR), acceptance pending.
- Traceability restored: Agent Metadata + both indices + `req-04x-traceability-matrix.md` (PR #294).

## Pull Requests
| PR | Repo | Base | Head | Candidate SHA | Gates | Merge SHA |
|---|---|---|---|---|---|---|
| #294 | portfolio | dev-araya-portfolio | feature/req-043-045-traceability-recovery | `ce1f078` | Manu PASS, Teresa PASS, Rolando VERIFIED | `7e3d357` |
| #82 | framework | dev-mahg | feature/pi-082-authority-continuity | `4073e3e` | Teresa PASS, Rolando VERIFIED (v2 erratum) | `38197e6` |
| #295 | portfolio | dev-araya-portfolio | feature/ax3-hook-governance-recovery | `3f8f65c` | Teresa PASS, Rolando VERIFIED (observation fixed) | `ae4cc2d` |
| PR-F2 | framework | dev-mahg | feature/evidence-and-context-preservation | (this branch) | Teresa+Rolando on candidate | merge executed after gates; SHA via `git log origin/dev-mahg` |

## Pi 0.82.1
pi 0.82.1 verified; old `~/.pi/agent/tools/` absent; extensions loadable (araya, subagent, runtime-model-context); `libexec/araya` 4 helpers; skill frontmatter contract enforced repo-side (`tests/skill-frontmatter-test.js`, 637 checks); `.pi/agents` 30/30 regenerated, `--check` no drift; global `~/.pi/agent/skills/` untouched (repo = corrected source; sync on next install).

## Authority Alignment
| Agent | Expected | Actual | Test |
|---|---|---|---|
| Clara | TEST_AUTOMATION → EXECUTING | ✅ araya.yaml + .pi/agents + Sonia roster | req-043 31/31; sonia-role-mapping 17/17 |
| Teresa | TEST_GATE → TESTING | ✅ | same + teresa prompt rewritten |
| Rolando | REALITY_AUTHORITY → VERIFYING | ✅ | req-043 31/31 |
| Daneel | COORDINATOR, no functional ownership | ✅ `can_write_code: false` | req-043 gate; canonical-context 13/13 |
| Neo/Trinity | dormant | ✅ | req-043 gate |

## Capsule Set v2
`.araya/context/capsules/session-2026-07-26-v2/` — 9 capsules + manifest (framework `38197e6`/dev-mahg, portfolio `ae4cc2d`→manifest notes `7e3d357` at generation; supersedes v1 preserved). Verifier: `tests/capsule-set-test.js` — SHA existence, branch containment, evidence paths, requirement tracking, merge commits, authority-vs-araya.yaml: **88/88 PASS**.

## AX3
Portfolio: was 25 template-only + 1 partial → **26 complete** (register `pr-p2/ax3-classification.md`); enforcement `tests/test_ax3_nonempty.py` (5/5). Framework: root self-describing; `.araya/AX3.md` remains skeleton-with-index (registered, not repaired — framework AX3 repair was out of batch scope).

## Worktrees
- Original: 3 portfolio worktrees in `/tmp` (canon-rule-001 violation) + 1 canonical + canonical checkouts.
- Final: `/tmp` worktrees **removed** (safety proof: clean, no unique commits, SHAs ancestors of origin/main+dev; no --force). All batch worktrees under `~/github/mahg-es/worktrees/`. Rolando VERIFIED removal evidence (PR #295 gate).

## Hooks
- Configured: framework `.araya/hooks/` (pre-existing); portfolio none.
- Implemented: `ops/install/install-git-hooks.sh` + pre-commit/commit-msg templates (fixes latent Rule-4 position defect), backup + manifest + `--uninstall`.
- Tested: `tests/test_hooks_installer.py` 8/8 (sandboxed real git repos).
- Active: **nowhere** — activation = Professor decision (`ops/install/README-git-hooks.md` exact state).
- Reversible: yes (backup restore).

## Remaining Blockers
| ID | Evidence | Owner | Next action |
|---|---|---|---|
| Q1 | Aisha spec DRAFT PENDING MANU REVIEW | Professor/Manu | SPEC_APPROVED decision (covers Slice A retro-approval) |
| ADR-009 | draft in `.araya/governance/adrs/` | Professor | decide Option A/B/C |
| Q7 | outbox MSG to retired Giskard + discrepancy record | Professor | choose re-routing recipient; Rolando closes PE-0007 formally |
| Hooks activation | README-git-hooks.md | Professor | run installer on both repos |
| Q5/Q6 | untracked canonical-checkout files; REQ-043-044.md | Professor | cleanup + registration decisions |
| REQ-043 crit. 20/21 | gates on `0902ac6` absent | Teresa+Rolando (post-approval) | gates on the SHA Manu approves |
| Q2 | req-001 Teresa report absent | — | provenance investigation if required |

## Open Questions
See `02-open-questions.md` (Q1–Q11). None stopped the batch.

## Next Authorized Action
**The Professor decides Manu SPEC_APPROVED for the REQ-043 Aisha architecture** (unlocks REQ-043 acceptance gates and the REQ-042 start gate).
