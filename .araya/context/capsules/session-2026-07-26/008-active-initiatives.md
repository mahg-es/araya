# 008 — Active Initiatives (Current Status)
> Capsule ID: 008 | Initiative: active-initiatives | Status: LIVE
> Session: 2026-07-26 | Framework HEAD: 0902ac6 | Token budget: ~3000

---

## Initiative Status Dashboard

| # | Initiative | Status | % | Blocker | Owner |
|---|-----------|--------|----|---------|-------|
| 1 | **AX3 Contract Hierarchy** | 🟢 CANONICAL | 100% | — | All agents |
| 2 | **Skill System (127 entries)** | 🟢 OPERATIONAL | 100% | — | Aurora |
| 3 | **Branch Governance** | 🟢 CANONICAL | 100% | — | Sonia |
| 4 | **ADR-008 Tool Access** | 🟢 CANONICAL | 100% | — | Professor |
| 5 | **REQ-001 (Command/Delegation)** | 🟢 COMPLETED | 100% | 3 non-blocking | Sonia |
| 6 | **REQ-003 (Transversal Tools)** | 🟢 COMPLETED | 100% | — | Isla |
| 7 | **REQ-043 (Source Hierarchy)** | 🟢 DELIVERED | 100% | Manu SPEC_APPROVED pending | Aisha + Priscila |
| 8 | **Relay Protocol Design** | 🟡 IMPLEMENTATION-READY | 85% | Motor not built | Daneel |
| 9 | **REQ-042 (Relay Motor MVP)** | 🟡 REGISTERED | 10% | F-001, F-003, PE-0007 | Daneel |
| 10 | **PE-0007 (Aurora+Rolando)** | 🔴 BLOCKED | 60% | 4 BLOCKs active | Daneel |
| 11 | **PE-0005 (AWUs)** | 🟡 SPEC | 40% | Spec drafted, no implementation | Sonia |
| 12 | **PE-0012 (Closure)** | 🟢 CLOSED | 100% | — | Rolando |
| 13 | **Agent Contract v1.0.0** | 🟢 PUBLISHED | 100% | Gates 4, 8, 9 pending | Priscila |

---

## Completed (4)

| Initiative | Evidence |
|-----------|----------|
| **AX3 Contract Hierarchy** | 10 AX3.md files: root + 9 children. Self-describing contract system active. |
| **Skill System** | 123 SKILL.md files on disk, 127 catalog entries. YAML frontmatter canonical. |
| **REQ-001** | 8 suites, 349 tests, 100% PASS. PR #77 merged. |
| **REQ-003** | Elena process audit verified. Tools in `~/.pi/agent/tools/`. |

---

## Canonical / Published (3)

| Initiative | Artifacts |
|-----------|----------|
| **Branch Governance** | `branch-governance.md` — 10 sections, pre-commit hooks, PR requirements |
| **ADR-008** | Constitution TOOL section + agent-tool-access-standard.md |
| **Agent Contract v1.0.0** | 16 sections, 12 validation gates, machine-validatable fields |

---

## In Progress / Delivered (1)

| Initiative | Detail |
|-----------|--------|
| **REQ-043** | DELIVERED (PR #81, 381/381 tests). Manu SPEC_APPROVED still pending for Aisha architecture. F-001, F-003 unresolved. |

---

## Design Complete — Implementation Pending (1)

| Initiative | Detail |
|-----------|--------|
| **Relay Protocol** | 9 artifacts, 33 acceptance tests, Teresa review (FIX→resolved), Rolando VERIFIED WITH OBSERVATION. Motor not built (REQ-042). |

---

## Registered — Blocked by Dependencies (1)

| Initiative | Detail |
|-----------|--------|
| **REQ-042** | PR #291 merged. 57-line requirement file. Depends on: F-001 resolution, F-003 resolution, PE-0007 clearance. |

---

## Blocked (1)

| Initiative | Detail |
|-----------|--------|
| **PE-0007** | 4 BLOCKs from Rolando. B1 (/tmp worktrees), B2 (hook inactive), B3 (empty AX3.md), B4 (portfolio governance). 285/286 tests pass. Daneel falsely reported "hook active." |

---

## Spec-Only (1)

| Initiative | Detail |
|-----------|--------|
| **PE-0005** | AWU spec drafted. Defines format, lifecycle, Relay traceability. No implementation timeline. |

---

## Dependency Graph (Critical Path)

```
F-001 (Teresa/Clara) ──→ Relay TESTING state ──→ REQ-042 Motor
F-003 (Giskard refs)  ──→ Relay T-030 ──→ REQ-042 Motor
PE-0007 BLOCKs ──→ Portfolio governance ──→ REQ-042 Motor
F-002 (Aurora skills) ──→ Aurora capability ──→ Workforce planning
Manu SPEC_APPROVED ──→ REQ-043 closure ──→ REQ-042 Motor
```

**Critical path:** F-001 + F-003 + PE-0007 → REQ-042 Motor MVP

---

> **Capsule generated:** 2026-07-26 | Sonia (PM Head Orchestrator)
> **Sources:** All capsule sources, initiative dashboard from session-2026-07-26 capsule
