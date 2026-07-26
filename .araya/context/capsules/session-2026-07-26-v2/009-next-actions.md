# 009 — Next Actions (Post-Batch Priorities) — v2
> Capsule ID: 009 | Initiative: next-actions | Status: LIVE
> Session: 2026-07-26-v2 | Framework: dev-mahg 38197e6 | Portfolio: dev-araya-portfolio ae4cc2d

## Priority 1 — Professor decisions (cannot proceed without him)

1. **Manu SPEC_APPROVED — REQ-043 Aisha architecture.** Spec: `.araya/plan/spec/req-043-aisha-architecture.md` (DRAFT — PENDING MANU REVIEW). Also covers retroactive approval of the Slice A realignment (Q1). Options: [1] approve as-is, [2] approve with modifications, [3] request revisions.
2. **ADR-009 — actor_role semantics.** `.araya/governance/adrs/adr-009-relay-actor-role-semantics.md` (Draft). Recommendation: Option A (functional role class; no enum change; F-004 closes as by-design).
3. **PE-0007 re-routing (Q7).** Original BLOCK dispatch went to retired Giskard. Choose recipient: [A] Professor (governance), [B] Sonia (operational), [C] split per BLOCK. Then Rolando re-evaluates the incident for formal closure.
4. **Hooks activation.** Run `ops/install/install-git-hooks.sh --repo <path> --integration-branch <branch>` on both canonical repos (portfolio: dev-araya-portfolio; framework: dev-mahg). Installer sandbox-verified 8/8; reversible.
5. **Canonical checkout hygiene (Q5).** After PR-F2 merges: untracked duplicates of now-tracked evidence remain in the framework canonical checkout; portfolio canonical checkout holds untracked requirement copies + `REQ-043-044.md` + ponny-express-1000x files + a stray gate report copy. Cleanup needs explicit instruction.
6. **REQ-043-044.md (Q6).** Untracked Neo/Trinity lifecycle instruction — register as requirement, fold into REQ-044, or discard: Professor/Manu call.

## Priority 2 — Agent-executable (after decisions)

7. **REQ-043 acceptance closure:** Teresa PASS + Rolando VERIFIED against the exact SHA Manu approves (likely `0902ac6` lineage or current dev-mahg HEAD) → then mark acceptance criteria 20/21.
8. **REQ-042 start gate:** verify REQ-043 crit. 24 + PE-0007 closure, then schedule motor MVP (6 commands, 33 acceptance tests).
9. **F-005 Sofia:** Aurora capability review — assign domain skills or set dormant.
10. **Branch hygiene (Q3):** delete local stale feature branches (framework 5, portfolio several with gone remotes) — needs authorization scope beyond this batch.

## Priority 3 — Continuous

11. **Capsule set maintenance:** v2 becomes the session baseline; run `tests/capsule-set-test.js` after any state change that capsules assert.
12. **req-040 metadata:** fill placeholder Agent Metadata (Teresa observation, PR #294).

## Explicitly NOT done tonight (registered)

- No PostOffice messages sent (no valid recipient for governance acts without Q7).
- No hooks activated. No main/tags/releases touched. No remote branches deleted. No evidence deleted. No untracked canonical-checkout files cleaned. `~/.pi/agent/skills/` global copies not modified (repo is the corrected source; sync on next install).

> v2 source: run records `.araya/runs/BATCH-TRUTH-CONTINUITY-20260726/` (00-05), gate reports, ADR-009.
