# AX3 — Workstream Definition & Dependency DAG
## Sonia (PM Head Orchestrator) — Execution Plan

**Date**: 2026-06-16
**Status**: Ready for Execution
**Confidence**: 0.95
**Mode**: Review (code already exists in feature/ax3-integration)

---

## Workstream Definitions

### WS-01: Manu — Product Ownership (Spec Gate)
| Attribute | Value |
|-----------|-------|
| **Agent** | Manu 👑 |
| **Tier** | balanced |
| **AWU** | 1.0 |
| **Input** | req-001.md, existing AX3 codebase |
| **Output** | `ax3-vision.md`, `ax3-requirements.md` (15 RFs, 10 RNFs, 15 ACs) |
| **Phase** | sdd |
| **Status** | ✅ COMPLETED |

### WS-02: Aurora — Capability Coverage
| Attribute | Value |
|-----------|-------|
| **Agent** | Aurora 🌟 |
| **Tier** | reasoning |
| **AWU** | 0.5 |
| **Input** | WS-01 outputs, araya.yaml |
| **Output** | `ax3-capability-coverage.md` (9 workstreams, 1 gap) |
| **Phase** | plan |
| **Status** | ✅ COMPLETED |

### WS-03: Sonia — Workstream Definition
| Attribute | Value |
|-----------|-------|
| **Agent** | Sonia 📋 (yo) |
| **Tier** | reasoning |
| **AWU** | 0.5 |
| **Input** | WS-01 + WS-02 |
| **Output** | This document (DAG, batches, sequence) |
| **Phase** | plan |
| **Status** | ✅ IN PROGRESS |

### WS-04: Aisha — Architecture Review
| Attribute | Value |
|-----------|-------|
| **Agent** | Aisha 🏗️ |
| **Tier** | reasoning |
| **AWU** | 1.5 |
| **Input** | WS-01 (requirements), existing `src/araya/v2/ax3/` code |
| **Output** | Architecture validation report: contract correctness, module placement, API surface, relationship to AGENTS.md (ADR-0010), adapter integration review |
| **Phase** | review |
| **Dependencies** | WS-01 |
| **Permissions** | read-only |

### WS-05: Valentina — Implementation Review
| Attribute | Value |
|-----------|-------|
| **Agent** | Valentina 💻 |
| **Tier** | balanced |
| **AWU** | 1.5 |
| **Input** | WS-04 (architecture), existing `src/araya/v2/ax3/*.ts`, `extensions/araya/index.ts` (command registration) |
| **Output** | Implementation review: runtime hooks (preflight/postflight), command registration, TypeScript correctness, error handling, edge cases |
| **Phase** | review |
| **Dependencies** | WS-04 |
| **Permissions** | full-access |

### WS-06: Teresa — Testing
| Attribute | Value |
|-----------|-------|
| **Agent** | Teresa 🧪 |
| **Tier** | balanced |
| **AWU** | 2.0 |
| **Input** | WS-01 (ACs), WS-05 (implementation), existing `tests/ax3-test.js` |
| **Output** | Test execution report: 17 existing tests, coverage gaps, additional tests (monorepo, moves, conflicts, `--scope`, `--repair`, error paths) |
| **Phase** | validation |
| **Dependencies** | WS-05 |
| **Permissions** | full-access |

### WS-07: Diana — Security Review
| Attribute | Value |
|-----------|-------|
| **Agent** | Diana 🔒 |
| **Tier** | reasoning |
| **AWU** | 1.0 |
| **Input** | `src/araya/v2/ax3/*.ts` (resolver.ts [symlinks], reconciler.ts [writes], types.ts [contract]) |
| **Output** | Security audit: path traversal vectors, symlink safety, write containment, managed marker injection risks, filesystem race conditions |
| **Phase** | security |
| **Dependencies** | WS-05 (implementation must be reviewed first) |
| **Permissions** | read-only |

### WS-08: Priscila — Documentation
| Attribute | Value |
|-----------|-------|
| **Agent** | Priscila 📝 |
| **Tier** | balanced |
| **AWU** | 1.0 |
| **Input** | WS-04 (architecture), WS-05 (implementation), existing `skills/ax3/SKILL.md` |
| **Output** | Documentation: command reference, agent integration guide, usage examples, architecture diagram |
| **Phase** | docs |
| **Dependencies** | WS-04 (architecture) + WS-05 (implementation) |
| **Permissions** | full-access |

### WS-09: Rolando — Independent Audit
| Attribute | Value |
|-----------|-------|
| **Agent** | Rolando 🛡️ (aka Daneel Reality Authority) |
| **Tier** | reasoning |
| **AWU** | 1.5 |
| **Input** | ALL previous outputs, repository truth (branch, files, commits, tests) |
| **Output** | Reality verification report: claims vs. evidence, 5-tier state, disposition |
| **Phase** | validation |
| **Dependencies** | WS-04, WS-05, WS-06, WS-07, WS-08 |
| **Permissions** | read-only |

### WS-10: Manu — Pre-Delivery Validation
| Attribute | Value |
|-----------|-------|
| **Agent** | Manu 👑 |
| **Tier** | balanced |
| **AWU** | 1.0 |
| **Input** | WS-09 (audit), all deliverables, AC-01 through AC-15 |
| **Output** | Validation report: AC compliance matrix, disposition (APPROVE/REVISE/BLOCK) |
| **Phase** | validation |
| **Dependencies** | WS-09 |
| **Permissions** | read-only |

---

## Dependency DAG

```
WS-01 (Manu: Spec) ─────────────────────────────────────────────────────────┐
     │                                                                       │
     ├──► WS-02 (Aurora: Coverage) ──► WS-03 (Sonia: Workstreams)           │
     │                                                                       │
     └──► WS-04 (Aisha: Architecture) ──► WS-05 (Valentina: Implementation)  │
                                              │                              │
                         ┌────────────────────┤                              │
                         │                    │                              │
                         ▼                    ▼                              │
                   WS-07 (Diana:       WS-06 (Teresa:                        │
                   Security)           Testing)                              │
                         │                    │                              │
                         └────────┬───────────┘                              │
                                  │                                          │
                                  ▼                                          │
                            WS-08 (Priscila: Docs)                           │
                                  │                                          │
                                  ▼                                          │
                            WS-09 (Rolando: Audit)                           │
                                  │                                          │
                                  ▼                                          │
                            WS-10 (Manu: Validation) ◄───────────────────────┘
```

---

## Batch Execution Plan

### Batch 0 (Pre-executed)
| WS | Agent | Phase | Status |
|----|-------|-------|--------|
| WS-01 | Manu | sdd | ✅ Done |
| WS-02 | Aurora | plan | ✅ Done |
| WS-03 | Sonia | plan | ✅ In Progress |

### Batch 1 — Parallel Group A (no mutual dependencies)
| WS | Agent | Phase | AWU |
|----|-------|-------|-----|
| WS-04 | Aisha | architecture review | 1.5 |

> **Note**: WS-04 is the only member of Batch 1 because WS-05 depends on it.

### Batch 2 — Sequential (depends on Batch 1)
| WS | Agent | Phase | AWU |
|----|-------|-------|-----|
| WS-05 | Valentina | implementation review | 1.5 |

### Batch 3 — Parallel Group B (both depend on WS-05)
| WS | Agent | Phase | AWU |
|----|-------|-------|-----|
| WS-06 | Teresa | testing | 2.0 |
| WS-07 | Diana | security | 1.0 |

> **Parallel mode**: Diana reads code (read-only) while Teresa executes tests (full-access). No resource contention.

### Batch 4 — Parallel Group C (depends on Batch 3 + WS-04/WS-05)
| WS | Agent | Phase | AWU |
|----|-------|-------|-----|
| WS-08 | Priscila | documentation | 1.0 |

### Batch 5 — Sequential (depends on all above)
| WS | Agent | Phase | AWU |
|----|-------|-------|-----|
| WS-09 | Rolando | independent audit | 1.5 |

### Batch 6 — Final Gate
| WS | Agent | Phase | AWU |
|----|-------|-------|-----|
| WS-10 | Manu | pre-delivery validation | 1.0 |

---

## Total Resource Estimation

| Metric | Value |
|--------|-------|
| **Total AWUs** | 12.5 |
| **Batches** | 7 (0 through 6) |
| **Parallel Groups** | 3 (Batch 1, Batch 3, Batch 4) |
| **Critical Path** | WS-01 → WS-04 → WS-05 → WS-06 → WS-08 → WS-09 → WS-10 |
| **Critical Path AWUs** | 9.5 |
| **Max Parallel Agents** | 2 (Batch 3: Teresa + Diana) |
| **Budget Risk** | LOW — all agents within execution budget |

---

## Risk Register

| ID | Risk | Probability | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R-01 | Rolando (Daneel) has no full prompt | Medium | High | Use reality-verification skill + charter | Aurora |
| R-02 | Tests fail against dist/ (compilation) | Low | Medium | Teresa can run against dist/ or src/ directly | Teresa |
| R-03 | Diana finds critical path traversal bug | Low | Critical | HALT, fix before proceeding | Diana |
| R-04 | Manu rejects at pre-delivery | Low | High | Address findings, re-route through SDLC | Sonia |
| R-05 | Symlink tests fail on CI | Low | Low | Graceful skip if platform doesn't support | Teresa |

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| WS-07 + WS-06 run in parallel (Batch 3) | Diana reads only, Teresa writes tests — no conflict |
| WS-01 and WS-02 pre-executed | Manu + Aurora outputs already produced in this run |
| Rolando not Daneel for audit | GAP-001: Daneel is now "Delegated Executor"; reality verification is Rolando |
| Architecture review before implementation | Code exists but contract must be validated before code review |
