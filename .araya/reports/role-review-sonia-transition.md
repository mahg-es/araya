# Sonia Role Transition — From Task Coordinator to Organizational Leader

**Reviewer:** R. Daneel Olivaw
**Artifact ID:** role-review-sonia-001
**Created:** 2026-05-31 17:15 +0200

---

## 1. Current State Assessment

### Sonia Today — PM Head Orchestrator

| Attribute | Value |
|-----------|-------|
| Role | PM Head Orchestrator |
| Skills | 11 |
| Model tier | reasoning (high effort) |
| Max turns | 40 |
| Can approve reviews | ✅ |
| Can write code | ❌ |

**Current skills:**
```
pm-plan              → Sprint/project planning
pm-decompose         → Task breakdown
pm-dependencies      → Dependency mapping
pm-risk              → Risk management
pm-status            → Status reporting
project-planning     → Project-level planning
drr-create           → Delivery review reports
iar-generate         → Impact analysis
cr-generate          → Change requests
ai-routing           → AI task routing
autonomous-execution → Autonomous triggers
```

### What Sonia Actually Does

| Layer | Activity | % of time |
|-------|----------|:---------:|
| **Strategic** | Program planning, risk management, dependency mapping | ~30% |
| **Tactical** | Task decomposition, status reporting, DRR/IAR/CR | ~50% |
| **Operational** | AI routing, autonomous execution triggers | ~20% |

**Finding:** Sonia spends 70% of her time on tactical and operational work. Only 30% is strategic — where her reasoning tier and 40-turn budget are most valuable.

---

## 2. Role Identity Analysis

### What Sonia Is Acting As

| Role | Evidence | Fit? |
|------|----------|:----:|
| **Project Manager** | pm-plan, pm-decompose, sprint execution | ✅ Current |
| **Program Manager** | project-planning, cross-project dependencies | 🟡 Partial |
| **PMO Head** | governance capability listed, not exercised | 🟡 Aspirational |
| **Delivery Director** | drr-create, iar-generate, cr-generate | 🟡 Partial |
| **Chief Operating Officer** | No COO-level responsibilities | ❌ Not yet |

**Finding:** Sonia is acting as a **Project Manager** with aspirations toward **PMO Head**. She has the reasoning capacity and governance authority for the higher role but is anchored by tactical execution.

---

## 3. Recommended Transition

### New Role: Program Director & PMO Head

| From | To |
|------|----|
| PM Head Orchestrator | Program Director & PMO Head |
| Task coordinator | Organizational leader |
| Project-level | Program-level (all projects) |
| Reports delivery status | Owns delivery governance |

### Responsibilities to Remove (→ Elena)

| Skill | Reason |
|-------|--------|
| pm-decompose | Task breakdown is sprint-level execution. Elena already does sprint-planning. |
| pm-status (tactical) | Sprint-level status reporting. Elena runs daily standups. |
| ai-routing | Operational. Can be automated or delegated. |
| autonomous-execution | Operational trigger. Can be standardized. |

### Responsibilities to Add

| New Responsibility | Description |
|--------------------|-------------|
| Program governance | Owns delivery standards, quality gates, and process compliance across all projects |
| Cross-project dependency management | Sees dependencies between mahg-pms, mahg-certified-professional, araya, and future projects |
| Organizational risk register | Maintains and reviews risk register at program level |
| Capacity planning | Matches workforce capability to incoming demand across all projects |
| Delivery standards | Defines and enforces delivery standards (SDD, BDD, TDD, review, validation) |
| PMO reporting | Reports program health, velocity, and risks to The Data Professor |
| Escalation authority | Authority to block or escalate any delivery that violates governance |
| Resource conflict resolution | Resolves conflicts when two projects need the same specialist |

### Responsibilities to Retain

| Skill | Why |
|-------|-----|
| pm-plan | Program-level planning — not sprint, but milestone and release |
| pm-dependencies | Cross-project dependency mapping is critical at program level |
| pm-risk | Organizational risk, not just project risk |
| pm-status (strategic) | Program health reporting, not sprint burndown |
| project-planning | Multi-project roadmap coordination |
| drr-create | Post-delivery review is a governance function |
| iar-generate | Impact analysis across projects |
| cr-generate | Change requests with organizational scope |

---

## 4. Authority Model

### Governance Authority

| Authority | Current | Proposed |
|-----------|:------:|:--------:|
| Approve review findings | ✅ | ✅ |
| Block delivery on governance violations | ❌ | ✅ |
| Escalate to The Data Professor | 🟡 Implicit | ✅ Explicit |
| Override sprint scope for governance | ❌ | ✅ |
| Define delivery standards | ❌ | ✅ |
| Reject non-compliant artifacts | ❌ | ✅ |

### Review Authority

| Review Type | Current | Proposed |
|-------------|:------:|:--------:|
| Sprint plan review | ✅ | ✅ (Elena executes, Sonia approves) |
| Delivery review (DRR) | ✅ | ✅ |
| Impact analysis (IAR) | ✅ | ✅ |
| Program health review | ❌ | ✅ |
| Cross-project dependency review | ❌ | ✅ |
| Capacity planning review | ❌ | ✅ |

### Escalation Authority

| Escalation | Current | Proposed |
|------------|:------:|:--------:|
| Agent → Sonia (blockers) | 🟡 Implicit | ✅ Formal |
| Sonia → Manu (scope) | 🟡 Implicit | ✅ Formal |
| Sonia → The Data Professor | ❌ | ✅ (governance violations) |
| Sonia → Security (Diana) | ❌ | ✅ (security blocks) |
| Sonia → Platform (Isla) | ❌ | ✅ (infrastructure blocks) |

---

## 5. Impact on Elena

Elena absorbs Sonia's tactical responsibilities:

| Skill | From | To |
|-------|------|----|
| pm-decompose | Sonia | Elena |
| sprint-planning | Shared | Elena (primary) |
| pm-status (tactical) | Sonia | Elena |

**Elena gains:**
- Task decomposition authority for sprint execution
- Daily tactical status ownership
- Primary sprint planning responsibility

**Elena already has:**
- daily-standup, retrospective, impediment, velocity, definition-of-done, reality-verification

---

## 6. Organizational Impact

### Before
```
Sonia: PM Head Orchestrator
  ├── Strategic (30%)
  ├── Tactical (50%)  ← overloaded
  └── Operational (20%)
  
Elena: Scrum Master
  └── Sprint rituals
```

### After
```
Sonia: Program Director & PMO Head
  ├── Program governance
  ├── Cross-project dependencies
  ├── Organizational risk
  ├── Capacity planning
  ├── Delivery standards
  └── PMO reporting
  
Elena: Scrum Master + Tactical Delivery
  ├── Sprint rituals (existing)
  ├── Task decomposition (new)
  ├── Tactical status (new)
  └── Primary sprint planning (new)
```

---

## 7. Risks

| Risk | Mitigation |
|------|-----------|
| Sonia's reasoning tier underused after transition | Strategic analysis (risk, dependencies, capacity) needs reasoning |
| Elena overloaded with tactical work | Sonia retains pm-plan at program level; Elena focuses on sprint execution |
| Gap between Sonia (program) and Elena (sprint) | Formal escalation path: Elena → Sonia for cross-sprint issues |
| Manu loses direct PM support | Sonia remains Manu's primary delivery partner at program level |

---

## 8. Recommendation

**Elevate Sonia to Program Director & PMO Head.** Remove 4 tactical/operational skills. Add 8 governance and leadership responsibilities. Transition tactical work to Elena. Grant Sonia formal escalation, governance, and review authority across all projects.

**Disposition:** AUDIT — role analysis complete. Ready for your decision, Professor.
