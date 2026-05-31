# Aurora Role Audit — Chief Human Resources Officer

**Auditor:** R. Daneel Olivaw
**Artifact ID:** audit-aurora-001
**Date:** 2026-05-31 20:00 +0200
**Scope:** Aurora's current role, utilization, and target operating model

---

## Part 1: Current State

### Configuration

| Attribute | Value |
|-----------|-------|
| Role | Chief Human Resources Officer |
| Skills | 6 (capability-registry, gap-analysis, workforce-planning, pm-plan, project-planning, agent-topology) |
| Model tier | reasoning |
| Max turns | 30 |
| Can approve reviews | ✅ |
| Can write code | ❌ |
| Capabilities | workforce_planning, capability_management, skills_governance, gap_analysis, hiring |

### Actual Workload

| Trigger | Frequency | What she does |
|---------|:---------:|---------------|
| `/araya team recommend` | Rare | Recommends team for a task |
| `/araya team assemble` | Rare | Assembles team with roles |
| `/araya team risk` | Rare | Analyzes workforce risks |
| `/araya team list` | Rare | Lists active team formations |
| Governance pilot | Once | 1 mention in 200+ lines of MAHG-PMS governance docs |
| Constitutional duties | Never | No constitutional rule assigns her responsibility |

**Finding:** Aurora is invoked approximately 0 times per day in normal operations. Her 30-turn reasoning budget is never consumed. She is the most underutilized reasoning-tier agent in ARAYA.

---

## Part 2: Skill Analysis

### Skill Utilization

| Skill | Used? | Owner | Assessment |
|-------|:-----:|-------|------------|
| capability-registry | ❌ | Aurora | Exists as skill, never exercised. No capability registry exists. |
| gap-analysis | ❌ | Aurora | Exists as skill, never exercised. Gap analysis happens ad-hoc by Sonia. |
| workforce-planning | ❌ | Aurora | Exists as skill, never exercised. Workforce planning doesn't happen. |
| pm-plan | 🟡 | **Sonia does this** | Overlap. Sonia owns delivery planning. Aurora shouldn't plan sprints. |
| project-planning | 🟡 | **Sonia does this** | Overlap. Sonia owns project planning. Aurora shouldn't plan projects. |
| agent-topology | ❌ | Aurora | Exists as skill, never exercised. Team assembly is manual. |

**Finding:** 4 of 6 skills are never used. The 2 that COULD be used (pm-plan, project-planning) overlap with Sonia's domain and create confusion about who plans what.

---

## Part 3: Decision Authority

| Authority | Current | Should have |
|-----------|:------:|:----------:|
| Recommend workforce changes | ✅ | ✅ |
| Approve workforce changes | ❌ | 🟡 (recommend to Professor) |
| Block delivery on capability gaps | ❌ | ❌ (escalate to Sonia, not block) |
| Initiate gap analysis | ❌ | ✅ |
| Propose new agent profiles | 🟡 | ✅ |
| Retire obsolete skills | ❌ | ✅ |
| Evaluate agent performance | ❌ | ❌ (Sonia evaluates delivery, Manu evaluates product) |
| Own capability registry | ❌ | ✅ |

**Finding:** Aurora has recommend authority (team:recommend) but no proactive authority. She waits to be asked. A CHRO should not wait to be asked whether the organization has the right capabilities.

---

## Part 4: Overlap Analysis

### Overlap with Manu (Product Owner)

| Domain | Who should own | Current state |
|--------|:------------:|---------------|
| Product requirements | Manu | ✅ Clear |
| Acceptance criteria | Manu | ✅ Clear |
| Workforce requirements | Aurora | ❌ Undefined |

**No significant overlap.** Manu defines what gets built. Aurora defines who can build it.

### Overlap with Sonia (Program Director)

| Domain | Who should own | Current state |
|--------|:------------:|---------------|
| Project planning | Sonia | ✅ Clear |
| Sprint planning | Sonia | ✅ Clear |
| Workforce planning | **Aurora** | ❌ Sonia does this implicitly |
| Capability assessment | **Aurora** | ❌ Sonia does this ad-hoc |
| Gap analysis | **Aurora** | ❌ Sonia identifies gaps during delivery |

**Significant overlap.** Aurora carries skills Sonia already covers better (pm-plan, project-planning) while neglecting skills only she can do (capability-registry, workforce-planning, gap-analysis, agent-topology).

### Overlap with Other Agents

| Agent | Overlap | Resolution |
|-------|---------|------------|
| Esteban (CKO) | Knowledge concentration tracking | Aurora tracks WHO knows WHAT. Esteban tracks WHAT is known. |
| Elena (Scrum Master) | None | Elena manages process. Aurora manages people. |
| Clara (QA Engineer) | None | Clara is an example of Aurora's hiring function working — but Aurora wasn't involved. |

---

## Part 5: Organizational Value Assessment

### What Aurora uniquely provides

| Value | Current state | Constitutional need |
|-------|:------------:|--------------------|
| Capability registry | ❌ Doesn't exist | MET-006: Unowned domain count needs a capability baseline |
| Gap analysis | ❌ Ad-hoc | WSM-005: Quarterly capability review requires gap analysis |
| Workforce planning | ❌ Doesn't happen | RSK-005: SPOF detection requires workforce planning |
| Agent topology | ❌ Not exercised | Phase 4: Agent evolution requires topology analysis |
| Skills lifecycle | ❌ Doesn't exist | Phase 4: Skills review requires lifecycle management |
| Hiring recommendations | 🟡 Reactive | Clara hiring happened without Aurora's formal input |

**Finding:** Aurora's unique value proposition — knowing what capabilities the organization has and what it needs — is almost entirely unexercised. Meanwhile, the constitutional amendment created 6 new rules (MET, RSK, WSM) that require exactly her capabilities.

---

## Part 6: Aurora is Underutilized

**Verdict: YES. Severely.**

| Metric | Evidence |
|--------|----------|
| Daily invocations | ~0 (only reactive `/araya team` commands) |
| Skill utilization | 2 of 6 skills overlap with Sonia; 4 never exercised |
| Constitutional duties | 0 rules assign her responsibility |
| Reasoning budget | 30 turns, never consumed |
| Pilot participation | 1 mention in 12 documents |
| Unique value delivered | 0 artifacts created |

---

## Part 7: Target Operating Model

### Future Role: Capability Officer

Aurora should transition from "HR administrator who waits to be asked" to "Capability Officer who proactively ensures organizational readiness."

### Responsibilities to Remove

| Skill | Reason |
|-------|--------|
| pm-plan | Sonia's domain. Creates confusion about who plans what. |
| project-planning | Sonia's domain. Aurora should not plan projects. |

### Responsibilities to Add

| New Responsibility | Description | Constitutional Basis |
|--------------------|-------------|---------------------|
| **Capability registry ownership** | Maintain the single source of truth for what ARAYA can do | MET-006, WSM-005 |
| **Gap analysis authority** | Proactively identify capability gaps before projects need them | HR-002, WSM-005 |
| **Workforce planning** | Match organizational capacity to incoming demand across all projects | RSK-005, PMO-002 |
| **Agent topology design** | Design optimal team structures for project types | TOPO-001 to 005 |
| **Skills lifecycle management** | Propose new skills, identify obsolete skills, maintain the 120-skill catalog | Phase 4 roadmap |
| **Hiring recommendations** | When, what profile, why. Formal charter for new agent proposals | Clara hiring template |
| **SPOF detection** | Flag domains where one agent is the sole capable resource | RSK-005 |
| **Knowledge concentration monitoring** | Track who knows what across the organization | MET-007 |
| **Quarterly capability review** | Lead the WSM-005 review cycle | WSM-005 |
| **Organizational health reporting** | Report workforce health to Sonia (PMO) | PMO-004 |

### Responsibilities to Retain

| Skill | Why |
|-------|-----|
| capability-registry | Core function |
| gap-analysis | Core function |
| workforce-planning | Core function |
| agent-topology | Core function |

### Skills After Transition

```
Skills (8, from 6):
  + capability-registry     (retained)
  + gap-analysis            (retained)
  + workforce-planning      (retained)
  + agent-topology          (retained)
  + skills-lifecycle        (new)
  + spof-detection          (new — composite of topology + workforce)
  + hiring-recommendations  (new — exercised in Clara proposal)
  + organizational-health   (new — HR metrics for PMO-004)
  
  - pm-plan                (removed — Sonia's domain)
  - project-planning       (removed — Sonia's domain)
```

### Authority Boundaries

| Authority | Scope | Limit |
|-----------|-------|-------|
| Propose new agents | Any capability gap | The Data Professor approves |
| Propose skill changes | Any skill in catalog | Constitutional amendment if removing constitutional skills |
| Recommend team structures | Any project type | Sonia assigns agents to tasks |
| Flag capability gaps | Any project, any time | Cannot block delivery (escalates to Sonia) |
| Flag SPOF risks | Any domain | Cannot force mitigation (escalates to Sonia) |
| Own capability registry | Single source of truth | Updated quarterly minimum |

### Ownership Boundaries

| Domain | Aurora | Sonia | Manu |
|--------|:------:|:-----:|:----:|
| What to build | — | — | ✅ |
| How to deliver | — | ✅ | — |
| Who can deliver | ✅ | 🟡 (assigns) | — |
| What skills exist | ✅ | — | — |
| What skills are missing | ✅ | — | — |
| Who should we hire | ✅ | — | ✅ (approves) |
| Team structure | ✅ | 🟡 (executes) | — |

---

## Part 8: Benefits

| Benefit | Mechanism |
|---------|-----------|
| Proactive gap detection | Aurora identifies gaps before Sonia's delivery is blocked |
| SPOF visibility | Daneel is no longer the only person who knows about bus factors |
| Scientific hiring | Clara-like proposals become standard, not exceptional |
| Capability baseline | MET-006 (unowned domain count) becomes measurable |
| Workforce predictability | Sonia knows who's available before planning |
| Skills evolution | 120-skill catalog stays current, not stale |
| Reduced Sonia overload | Sonia focuses on delivery; Aurora focuses on readiness |

---

## Part 9: Risks

| Risk | Mitigation |
|------|-----------|
| Aurora's analysis is ignored | Constitutional basis (MET, RSK, WSM) makes it mandatory |
| Aurora becomes bottleneck | She recommends; Sonia/Manu decide. Not a gate. |
| Capability registry becomes stale | Automated from araya.yaml + periodic Aurora review |
| Overlap with Esteban (CKO) | Clear boundary: Aurora = WHO knows WHAT. Esteban = WHAT is known. |

---

## Part 10: Constitutional Impact

### New Rules Required

| ID | Type | Rule |
|----|------|------|
| HR-006 | OBLIGATION | The Capability Officer SHALL maintain the organizational capability registry as the single source of truth for agent skills and domain coverage |
| HR-007 | OBLIGATION | The Capability Officer SHALL conduct quarterly capability reviews and report gaps to the Program Director |
| HR-008 | OBLIGATION | The Capability Officer SHALL monitor single-point-of-failure risks and knowledge concentration across all domains |
| HR-009 | PERMISSION | The Capability Officer MAY propose new agent profiles, skill additions, and skill retirements to The Data Professor |

### Rules Superseded

None. HR-001 to HR-004 remain valid. HR-005 (separation of duties) remains valid.

---

## Part 11: Recommendation

**Aurora is the most underutilized reasoning-tier agent in ARAYA.** She has the skills to solve 6 of the organizational maturity gaps identified in the audit, but she's never asked to use them. Her 2 overlapping skills with Sonia (pm-plan, project-planning) create confusion and should be removed.

**Transition Aurora from CHRO to Capability Officer.** A proactive role that owns organizational readiness rather than a reactive role that waits for `/araya team` commands. This is not a title change — it's an activation of capabilities that already exist in her skill set but are never exercised.

**Disposition:** AUDIT — underutilization confirmed. Target operating model proposed. 4 new constitutional rules. Ready for your decision, Professor.
