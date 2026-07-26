# 008 — Active Initiatives (Post-Batch Dashboard) — v2
> Capsule ID: 008 | Initiative: active-initiatives | Status: LIVE
> Session: 2026-07-26-v2 | Framework: dev-mahg 38197e6 | Portfolio: dev-araya-portfolio ae4cc2d

| # | Initiative | Status | % | Evidence / Blocker |
|---|---|---|---|---|
| 1 | AX3 Contract Hierarchy (framework) | 🟢 CANONICAL | 100% | tests/ax3-test.js exit 0 @4073e3e |
| 2 | AX3 tree (portfolio) | 🟢 OPERATIONAL | 100% | 26/26 complete, PR #295 (`ae4cc2d`), test enforced |
| 3 | Skill System + Pi 0.82.1 contract | 🟢 OPERATIONAL | 100% | 127 skills, frontmatter enforced (637 checks, PR #82) |
| 4 | Branch Governance | 🟢 CANONICAL | 100% | hooks installer delivered; activation pending (Professor) |
| 5 | ADR-008 Tool Access | 🟢 CANONICAL | 100% | — |
| 6 | REQ-001/002/003 | 🟢 COMPLETED | 100% | Q2: one cited Teresa report absent |
| 7 | REQ-041 Relay design | 🟢 DELIVERED | 100% | PR #78/#79; gates on record |
| 8 | REQ-043 Source Hierarchy | 🟡 DELIVERED-IN-DEV | 90% | PR #80/#81/#82; blockers: Manu SPEC_APPROVED, per-SHA gates on 0902ac6, not in main |
| 9 | REQ-042 Relay Motor | 🟡 REGISTERED | 10% | blocked: REQ-043 crit. 24 + PE-0007 formal closure |
| 10 | PE-0007 Aurora+Rolando | 🟡 REMEDIATED — closure pending | 95% | B1-B4 all remediated (above); formal closure needs Rolando re-evaluation + re-routing decision (Q7) |
| 11 | PE-0005 AWUs | 🟡 SPEC | 40% | spec preserved (PR-F2); no implementation |
| 12 | Agent Contract v1.0.0 | 🟢 PUBLISHED | 100% | gates 4/8 now green; Gate 9 (Sofia bare) open |
| 13 | REQ-044 Capability Activation | 🟡 REGISTERED | 5% | PR #293; Neo/Trinity dormant verified |
| 14 | REQ-045 Compress/Compact | 🟡 REGISTERED | 25% | PR #293; capsule set v2 (this set) pending acceptance |
| 15 | ADR-009 actor_role | 📝 DRAFT | — | decision: The Data Professor |
| 16 | Hooks governance (PE-0007-B2) | 🟡 DELIVERED — activation pending | 90% | installer + 8/8 sandbox + docs (PR #295) |

## Critical path (post-batch)

```
Manu SPEC_APPROVED (REQ-043) ─┐
ADR-009 decision (Professor) ─┼─→ REQ-043 acceptance ─→ REQ-042 motor start
PE-0007 formal closure (Q7) ──┘
Hooks activation (Professor) ─→ PE-0007-B2 fully closed
```

## Batch deliveries merged tonight

| PR | Repo | Merge SHA | Content |
|---|---|---|---|
| #294 | portfolio | `7e3d357` | REQ-04x traceability + index repair |
| #82 | framework | `38197e6` | Pi 0.82.1 + Clara/Teresa + Giskard retirement + ADR-009 |
| #295 | portfolio | `ae4cc2d` | AX3 tree (26) + hooks installer + canon-rule-001 tracking |
| PR-F2 | framework | (pending gates at capsule write time) | evidence preservation + this capsule set |

> v2 source: git log both repos 2026-07-26, gate reports in `.araya/runs/BATCH-TRUTH-CONTINUITY-20260726/`.
