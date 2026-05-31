# Consolidated Constitutional Amendment — Capability & Organization

**Author:** R. Daneel Olivaw (synthesis of 4 audits)
**Artifact ID:** amendment-consolidated-capability-001
**Date:** 2026-05-31 21:00 +0200
**Status:** Proposed — Awaiting The Data Professor's Approval
**Scope:** Aurora role, Neo & Trinity, activation governance, four-pillar structure

---

## Part 0: Audit Synthesis

### What to Adopt

| Proposal | Source | Verdict |
|----------|--------|:------:|
| Aurora → Capability Officer | Audit 1 | ✅ Adopt |
| Neo & Trinity → Dynamic Capability Agents | Audit 2 | ✅ Adopt — 90-day pilot |
| Pipeline activation model | Audit 3 | ✅ Adopt — replaces 2-of-3 voting |
| Four-pillar organizational structure | Audit 4 | ✅ Adopt |

### What to Modify

| Original | Modification | Reason |
|----------|-------------|--------|
| PMO-001, PMO-007 | Superseded by AUTH-003. PMO rules become operational detail under Delivery Authority. | Avoid duplication. |
| TMP-008 (original) | Replaced by pipeline model in AUTH-009. | Voting model rejected. |
| Aurora skills: 6 → 8 | Remove pm-plan, project-planning. Add 4 new. | Overlap with Sonia resolved. |
| Agent roster: 26 → 28 | Add Neo and Trinity as dormant. | Only count toward capacity when activated. |

### What to Reject

| Proposal | Reason |
|----------|--------|
| 2-of-3 voting model | Allows activation without mission sponsor. Pipeline model adopted instead. |
| Aurora retaining pm-plan and project-planning | Overlaps with Sonia. Creates confusion about who plans what. |

---

## Part 1: Consolidated Constitutional Rules

### New Domain: Organizational Authority (AUTH) — 8 rules

| ID | Type | Rule |
|----|------|------|
| AUTH-001 | OBLIGATION | ARAYA SHALL operate under four organizational authorities: Product Authority (Manu), Delivery Authority (Sonia), Capability Authority (Aurora), Reality Authority (Daneel) |
| AUTH-002 | OBLIGATION | Product Authority SHALL own: product vision, requirements, acceptance criteria, backlog, roadmap, release scope |
| AUTH-003 | OBLIGATION | Delivery Authority SHALL own: delivery governance, workstream coordination, risk management, delivery standards, program reporting, constitutional interpretation and enforcement |
| AUTH-004 | OBLIGATION | Capability Authority SHALL own: capability registry, gap analysis, workforce planning, hiring recommendations, skills lifecycle, dynamic agent activation, SPOF detection, knowledge concentration monitoring |
| AUTH-005 | OBLIGATION | Reality Authority SHALL own: independent verification, organizational audits, repository truth validation. Reality Authority SHALL NOT override other authorities. |
| AUTH-006 | OBLIGATION | Pillar authority conflicts SHALL escalate to The Data Professor with each pillar's documented rationale |
| AUTH-007 | OBLIGATION | Domain authorities (Security, Architecture, Platform) SHALL operate within workstreams and report to the Delivery Authority for operational matters. Security-critical escalations SHALL bypass the pillar chain per ESC-002. |
| AUTH-008 | OBLIGATION | Multi-pillar decisions (hiring, dynamic agent activation, constitutional amendments) SHALL follow defined pipelines where each pillar answers a distinct question. No pillar SHALL be overruled on its domain question. |

### Extended Domain: Human Resources (HR) — 4 rules

| ID | Type | Rule |
|----|------|------|
| HR-006 | OBLIGATION | The Capability Officer SHALL maintain the organizational capability registry as the single source of truth for agent skills and domain coverage |
| HR-007 | OBLIGATION | The Capability Officer SHALL conduct quarterly capability reviews and report gaps to the Delivery Authority |
| HR-008 | OBLIGATION | The Capability Officer SHALL monitor single-point-of-failure risks and knowledge concentration across all domains |
| HR-009 | PERMISSION | The Capability Officer MAY propose new agent profiles, skill additions, and skill retirements to The Data Professor |

### New Domain: Temporary Agents (TMP) — 8 rules

| ID | Type | Rule |
|----|------|------|
| TMP-001 | PERMISSION | ARAYA MAY deploy Dynamic Capability Agents (Neo, Trinity) for mission-scoped capability gap filling. Agents are dormant until activated. |
| TMP-002 | OBLIGATION | Dynamic Capability Agents SHALL have no permanent skills, no permanent domain, no governance authority, and no ownership authority |
| TMP-003 | OBLIGATION | Every activation SHALL define: mission, duration (max 14 days), assigned skills, mission sponsor, deliverable |
| TMP-004 | OBLIGATION | Skills SHALL be automatically revoked upon mission completion or expiration. The Capability Officer SHALL audit revocation within 24 hours. |
| TMP-005 | OBLIGATION | Dynamic Capability Agents SHALL be subject to all constitutional rules including the Mandatory Review Matrix (REV-002). No governance exceptions for temporary agents. |
| TMP-006 | OBLIGATION | The mission sponsor SHALL inherit ownership of all artifacts produced upon mission close |
| TMP-007 | OBLIGATION | If the same capability gap is filled by Dynamic Capability Agents three or more times within six months, the Capability Officer SHALL propose a permanent hire |
| TMP-008 | OBLIGATION | Activation SHALL follow the pipeline: (1) Capability Officer assesses gap and proposes activation, (2) Delivery Authority confirms capacity and assigns sponsor, (3) Product Authority confirms alignment. Each step MAY block. Pipeline SHALL be documented. |

### Superseded Rules

| Old Rule | Superseded By | Reason |
|----------|:-----------:|--------|
| PMO-001 | AUTH-003 | Delivery governance authority consolidated into organizational authority domain |
| PMO-007 | AUTH-003 | Organizational governance ownership clarified: Delivery Authority owns delivery governance; The Data Professor owns organizational governance |
| HR-002 (Missing capabilities block execution) | AUTH-004 + HR-007 | Capability gap detection and reporting now formalized under Capability Authority |

---

## Part 2: Agent Configuration Changes

### Aurora — Capability Officer

```yaml
aurora:
  role: Capability Officer
  emoji: 🌟
  model_tier: reasoning
  primary_provider: pi.dev
  max_turns: 30
  permissions:
    can_write_code: false
    can_approve_review: true
  capabilities:
  - workforce_planning
  - capability_management
  - skills_governance
  - gap_analysis
  - hiring
  - organizational_health
  skills:
  - capability-registry
  - gap-analysis
  - workforce-planning
  - agent-topology
  - skills-lifecycle
  - spof-detection
  - hiring-recommendations
  - organizational-health
```

### Neo — Dynamic Capability Agent (Dormant)

```yaml
neo:
  role: Dynamic Capability Agent
  emoji: ⚡
  model_tier: balanced
  primary_provider: pi.dev
  max_turns: 25
  status: dormant
  permissions:
    can_write_code: true
    can_approve_review: false
  skills: []
  description: Mission-scoped temporary agent. Activated by Capability Officer pipeline.
```

### Trinity — Dynamic Capability Agent (Dormant)

```yaml
trinity:
  role: Dynamic Capability Agent
  emoji: ⚡
  model_tier: balanced
  primary_provider: pi.dev
  max_turns: 25
  status: dormant
  permissions:
    can_write_code: true
    can_approve_review: false
  skills: []
  description: Mission-scoped temporary agent. Activated by Capability Officer pipeline.
```

---

## Part 3: Migration Plan

### Phase 0: Constitutional Adoption (Day 1)

| Step | Action |
|:----:|--------|
| 1 | Add AUTH domain (8 rules) to constitution |
| 2 | Add HR-006 to HR-009 |
| 3 | Add TMP domain (8 rules) |
| 4 | Supersede PMO-001, PMO-007, HR-002 |
| 5 | Update constitution summary counts |

### Phase 1: Agent Configuration (Day 1)

| Step | Action |
|:----:|--------|
| 6 | Update Aurora: CHRO → Capability Officer, 6→8 skills |
| 7 | Add Neo: dormant dynamic agent |
| 8 | Add Trinity: dormant dynamic agent |
| 9 | Run araya-setup.sh |

### Phase 2: Operational Activation (Week 1)

| Step | Action |
|:----:|--------|
| 10 | Aurora produces initial capability registry |
| 11 | Aurora produces first gap analysis |
| 12 | Neo/Trinity pilot period begins (90 days) |
| 13 | First pipeline activation test (low-risk mission) |

### Phase 3: Review (90 days)

| Step | Action |
|:----:|--------|
| 14 | Evaluate Neo/Trinity activation frequency and outcomes |
| 15 | Aurora reports quarterly capability review |
| 16 | Decide: make permanent, modify, or retire dynamic agents |

---

## Part 4: Impact Summary

### Constitution

| Metric | Before | After |
|--------|:------:|:-----:|
| Total Rules | 147 | **167** |
| Domains | 24 | **26** (AUTH, TMP) |
| Obligations | 127 | **145** |
| Permissions | 7 | **9** |
| Escalations | 5 | **5** |
| Prohibitions | 9 | **9** |

### Agents

| Metric | Before | After |
|--------|:------:|:-----:|
| Active agents | 26 | **27** (Aurora activated; Neo, Trinity dormant) |
| Dormant agents | 0 | **2** (Neo, Trinity) |
| Total roster | 26 | **28** |
| Pillar authorities | 3 (de facto) | **4** (constitutional) |

### Aurora

| Metric | Before | After |
|--------|:------:|:-----:|
| Role | Chief Human Resources Officer | **Capability Officer** |
| Skills | 6 (2 unused, 2 overlapping) | **8** (all distinct, all actionable) |
| Daily invocations | ~0 | **Proactive** (quarterly reviews, pipeline participation) |
| Constitutional rules owning her | 0 | **12** (AUTH-004, HR-006–009, TMP-001–008) |

---

## Part 5: Risks

| Risk | Mitigation |
|------|-----------|
| Aurora overloaded with 12 constitutional responsibilities | Phased rollout. Phase 0: authority only. Phase 1: capability registry. Phase 2: quarterly reviews. |
| Neo/Trinity abused as hiring replacement | TMP-007: three-activation rule triggers mandatory hiring proposal |
| Pipeline too slow for urgent gaps | Emergency activation: Capability Officer + Delivery Authority (2 of 3). Post-hoc Product Authority review within 24 hours. |
| 167 rules feels excessive | Rules are additive — each closes a specific gap found in audit. No redundant rules. |

---

## Part 6: Recommendation

**ADOPT the consolidated amendment.** 20 new rules (AUTH: 8, HR: 4, TMP: 8). 3 rules superseded. Aurora activated as Capability Officer. Neo and Trinity created as dormant dynamic agents. Four-pillar organizational structure constitutionalized.

This amendment completes the organizational design work started in the maturity audit. ARAYA now has: defined authorities (AUTH), people management (HR), capability flexibility (TMP), and independent verification (Daneel charter). The organization can answer: what to build, how to build it, who can build it, and whether the story is true.

**Disposition:** AUDIT — consolidated amendment complete. 167 rules, 26 domains, 28 agents (2 dormant). Ready for your approval, Professor. This is the fifth of five.
