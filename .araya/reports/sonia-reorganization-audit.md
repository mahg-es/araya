# ARAYA Organizational Audit — Sonia Responsibility Analysis

**Date:** 2026-05-30
**Assessor:** R. Daneel Olivaw
**Evidence:** araya.yaml, agent prompts, constitution

---

## 1. Sonia's 24 Skills — Domain Analysis

| Skill | Domain | Should Belong To | Reason |
|-------|--------|-----------------|--------|
| pm-plan | PMO | **Sonia** ✅ | Core PM function |
| pm-decompose | PMO | **Sonia** ✅ | Core PM function |
| pm-dependencies | PMO | **Sonia** ✅ | Core PM function |
| pm-risk | PMO | **Sonia** ✅ | Core PM function |
| pm-status | PMO | **Sonia** ✅ | Core PM function |
| project-planning | PMO | **Sonia** ✅ | Core PM function |
| sprint-planning | PMO | **Elena** | Scrum Master owns sprint ceremonies |
| daily-standup | PMO | **Elena** | Scrum Master owns standups |
| daily-note | Knowledge | **Esteban** | CKO owns knowledge capture |
| retrospective | PMO | **Elena** | Scrum Master owns retros |
| impediment | PMO | **Elena** | Scrum Master owns blocker removal |
| velocity | PMO | **Elena** | Scrum Master owns velocity tracking |
| content-calendar | Content | **Lucas** | Content Strategist owns calendar |
| sdd-vision | Product | **Manu** | PO owns vision |
| definition-of-done | Governance | **Elena** | PM Auditor owns DoD enforcement |
| drr-create | Review | **Sonia** ✅ | PM owns delivery review coordination |
| iar-generate | Review | **Sonia** ✅ | PM owns impact analysis |
| cr-generate | Review | **Sonia** ✅ | PM owns change request generation |
| uat-generate | Quality | **Teresa** | QA owns UAT generation |
| uat-review | Quality | **Teresa** | QA owns UAT review |
| token-efficiency | Operations | **Mateo** | FinOps owns efficiency/cost |
| ai-routing | Operations | **Sonia** ✅ | PM owns delegation routing |
| autonomous-execution | Operations | **Sonia** ✅ | PM owns execution triggers |
| reality-verification | Governance | **Elena** | PM Auditor owns reality checks |

### Summary

| Keep with Sonia | 11 skills (core PM + execution) |
|---|---|
| Move to Elena (Scrum Master) | 6 skills (sprint-planning, daily-standup, retrospective, impediment, velocity, definition-of-done) |
| Move to Manu (PO) | 1 skill (sdd-vision) |
| Move to Teresa (QA) | 2 skills (uat-generate, uat-review) |
| Move to Esteban (CKO) | 1 skill (daily-note) |
| Move to Lucas (Content) | 1 skill (content-calendar) |
| Move to Mateo (FinOps) | 1 skill (token-efficiency) |
| Move to Elena (PM Auditor) | 1 skill (reality-verification) |

---

## 2. Current Violations

### Separation of Duties Violations

Sonia currently combines:
- PMO (planning, decomposition, dependencies, risk, status)
- Scrum Master (sprint planning, standups, retros, impediments, velocity)
- Product Owner (sdd-vision)
- QA (UAT generation, UAT review)
- Knowledge Management (daily-note)
- Content Strategy (content-calendar)
- FinOps (token-efficiency)
- Governance (definition-of-done, reality-verification)
- Delivery Review (drr, iar, cr)
- Execution (ai-routing, autonomous-execution)

**10 domains controlled by one agent.** This violates:
- UNIX philosophy (small responsibilities, minimal overlap)
- Organizational principle (no "God Agent")
- Separation of duties (PMO ≠ QA ≠ FinOps ≠ Governance)

---

## 3. RACI Matrix — Key Capabilities

| Capability | R (Does) | A (Approves) | C (Consulted) | I (Informed) |
|-----------|----------|-------------|---------------|-------------|
| Sprint Planning | **Elena** | Sonia | Manu | All agents |
| Daily Standup | **Elena** | Sonia | — | All agents |
| Retrospective | **Elena** | Sonia | — | All agents |
| Blocker Removal | **Elena** | Sonia | Affected agent | Manu |
| Velocity Tracking | **Elena** | Sonia | — | Manu |
| Project Planning | **Sonia** | Manu | Aisha, Diana | Elena |
| Risk Management | **Sonia** | Manu | Diana | Elena |
| Status Reporting | **Sonia** | Manu | — | All agents |
| Product Vision | **Manu** | Manu | Sonia, Aisha | All agents |
| UAT Generation | **Teresa** | Manu | Priya | Sonia |
| UAT Review | **Teresa** | Manu | Priya | Sonia |
| DoD Enforcement | **Elena** | Manu | Teresa | Sonia |
| Reality Check | **Elena** | Manu | Sonia | All agents |
| Token Efficiency | **Mateo** | Aurora | Sonia | Manu |
| Content Calendar | **Lucas** | Manu | Dorcas | Sonia |
| Daily Knowledge | **Esteban** | — | — | Aurora |
| Delivery Review | **Sonia** | Manu | Elena | All agents |
| AI Routing | **Sonia** | Aurora | Aisha | Manu |
| Autonomous Exec | **Sonia** | Manu | Elena | — |

---

## 4. Proposed Reorganization

### Target State — Sonia: 11 skills (reduced from 24)

**Core PM Head Orchestrator:**
- pm-plan, pm-decompose, pm-dependencies, pm-risk, pm-status
- project-planning
- drr-create, iar-generate, cr-generate
- ai-routing, autonomous-execution

### Redistributed Responsibilities

| Receiving Agent | New Skills | Total After |
|---|---|---|
| **Elena** (Scrum Master) | +6: sprint-planning, daily-standup, retrospective, impediment, velocity, definition-of-done, reality-verification | 12 |
| **Teresa** (QA Engineer) | +2: uat-generate, uat-review | 11 |
| **Manu** (PO) | +1: sdd-vision | 12 |
| **Esteban** (CKO) | +1: daily-note | 7 |
| **Lucas** (Content) | +1: content-calendar | 5 |
| **Mateo** (FinOps) | +1: token-efficiency | 5 |

---

## 5. Migration Plan

### Phase 1 — Skill Transfer (v0.6.5)
1. Move 13 skills from Sonia to target agents in araya.yaml
2. Update agent prompts for Elena, Teresa, Manu, Esteban, Lucas, Mateo
3. Update Sonia's prompt — remove transferred responsibilities
4. Run full test suite
5. No breaking changes — skills exist, just ownership changes

### Phase 2 — Prompt Alignment (v0.6.5)
1. Each receiving agent's prompt explicitly claims new responsibility
2. Sonia's prompt explicitly defers to specialists
3. Cross-reference updates in RACI documentation

### Phase 3 — Validation (v0.6.5)
1. Run ATWP-style project to validate new organization
2. Verify no capability gaps
3. Verify God Agent pattern eliminated

---

## 6. Updated Organizational Principle

```
UNIX Organization:
- Small responsibilities per agent
- Clear single owner per capability
- Explicit interfaces between agents
- Minimal skill overlap
- No agent exceeds 12 skills
```

---

## Recommendation

**APPROVE reorganization.** Sonia should retain 11 core PM skills. 13 skills should transfer to their natural specialist owners. Elena becomes the primary beneficiary (gaining 6 Scrum Master skills currently sitting on Sonia). This aligns ARAYA with its own UNIX philosophy and eliminates the God Agent anti-pattern.
