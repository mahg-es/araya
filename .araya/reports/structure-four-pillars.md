# ARAYA Organizational Structure — Four-Pillar Model

**Reviewer:** R. Daneel Olivaw
**Artifact ID:** structure-four-pillars-001
**Date:** 2026-05-31 20:45 +0200
**Scope:** Organizational authority architecture

---

## Part 1: Current Structure

### Three Pillars (de facto)

```
        The Data Professor
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
  Manu       Sonia      Daneel
(Product)  (Delivery)  (Reality)
```

| Pillar | Authority | Constitutional Basis |
|--------|-----------|---------------------|
| Manu | Product Authority | GOV-001, GOV-002 (requirements, ACs) |
| Sonia | Delivery Authority | PMO-001 to PMO-012 (governance, delivery) |
| Daneel | Reality Authority | Charter (verification, audit, no override) |

### Proposed Fourth Pillar

| Pillar | Authority | Constitutional Basis |
|--------|-----------|---------------------|
| Aurora | Capability Authority | HR-006 to HR-009 (proposed), TMP-001 to TMP-010 (proposed) |

---

## Part 2: Organizational Balance Assessment

### Four-Pillar Model

```
              The Data Professor
                     │
      ┌──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │  Manu   │  │  Sonia  │  │ Aurora  │
  │ Product │  │Delivery │  │Capability│
  └─────────┘  └─────────┘  └─────────┘
      │              │              │
      │              │              │
      ▼              ▼              ▼
  What to build  How to build  Who can build
  
  ┌─────────────────────────────────────┐
  │              Daneel                  │
  │             Reality                  │
  │   (Independent — verifies all)       │
  └─────────────────────────────────────┘
```

### Balance Analysis

| Dimension | Assessment |
|-----------|------------|
| **Coverage** | What + How + Who = complete delivery triangle. Daneel verifies all three. ✅ |
| **Separation** | Product ≠ Delivery ≠ Capability. Distinct questions, distinct owners. ✅ |
| **Independence** | Daneel reports to none of the three — truly independent verification. ✅ |
| **Span of control** | Each pillar has 3–10 direct workstream/agent relationships. Manageable. ✅ |
| **Conflict resolution** | Two-pillar conflicts: escalate to Professor. 🟡 Defined but not constitutional. |

### What This Model Resolves

| Previous Gap | Resolution |
|--------------|------------|
| "Who decides what skills we need?" | Aurora (Capability Authority) |
| "Who decides if we should hire or temp-activate?" | Aurora proposes, Sonia confirms, Manu approves (pipeline) |
| "Who tracks SPOF risks?" | Aurora (RSK-005, MET-007) |
| "Who owns the capability registry?" | Aurora (HR-006) |
| "Who verifies the other three pillars?" | Daneel (independent) |

---

## Part 3: Missing Authorities

### Authorities NOT at the Pillar Level

These are important but should remain at the domain/workstream level, not organizational pillars:

| Authority | Current Owner | Why Not a Pillar |
|-----------|---------------|------------------|
| Security | Diana | Domain authority — operates within Security & Identity workstream. Reports to Sonia. Escalates security-critical issues directly to Professor. |
| Architecture | Aisha / Lin | Domain authority — operates within Architecture workstream. Reports to Sonia. |
| Platform | Isla | Domain authority — operates within Platform Engineering workstream. Reports to Sonia. |
| Financial | Mateo (partial) | No organizational financial authority exists. Budget decisions flow through Manu (product priority) and Sonia (delivery cost). |

### Gap: No Financial Authority

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No organizational budget authority | Mateo tracks costs but cannot approve/deny spend. Manu prioritizes product, Sonia manages delivery cost — but neither owns the budget. | Add Financial Authority as a domain role (not a fifth pillar). Mateo reports financial health to all three pillars. Budget approval remains with Professor. |

### Gap: No Pillar Conflict Resolution

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| What if two pillars irreconcilably disagree? | Example: Aurora says "hire a security architect." Sonia says "no capacity to onboard." Manu says "not a product priority." Deadlock. | Constitutional rule: unresolved pillar conflicts escalate to The Data Professor with each pillar's documented rationale. |

---

## Part 4: Conflicting Authorities

### Conflict Matrix

| Conflict | Resolution |
|----------|------------|
| Aurora vs Sonia (hire vs capacity) | Aurora proposes hire. Sonia confirms capacity. If Sonia blocks, Aurora escalates to Professor with gap analysis evidence. |
| Aurora vs Manu (hire vs priority) | Manu confirms product alignment. If Manu blocks, Aurora records the gap and monitors for impact. |
| Sonia vs Manu (governance vs scope) | PMO-005: Sonia can override scope for governance. Manu can countermand with rationale. |
| Daneel vs Anyone (reality vs claim) | Daneel reports. Does not override. Professor decides. |
| Domain lead vs Pillar | Domain lead escalates to their pillar. Pillar resolves or escalates to Professor. |

### New Conflicts Introduced by Aurora

| Conflict | Mitigation |
|----------|------------|
| Aurora says "hire," budget doesn't exist | Aurora's proposal includes capability gap impact if unfilled. Manu prioritizes against other product needs. |
| Aurora says "gap," workstream lead says "we're fine" | Aurora's gap analysis is evidence-based. Workstream lead can dispute with counter-evidence. Sonia resolves. |
| Aurora activates Neo/Trinity, Sonia has no mission | Pipeline prevents this. Sonia must confirm capacity and assign sponsor. |

---

## Part 5: Escalation Paths

### Current

```
Agent → Workstream Lead → Sonia → Manu → Professor
```

### Proposed

```
Agent → Workstream Lead → Pillar Lead → Professor
                                │
                          ┌─────┼─────┐
                          ▼     ▼     ▼
                        Manu  Sonia  Aurora
                       (Product)(Delivery)(Capability)

Special paths:
  Security critical → Diana → Professor (bypasses pillars)
  Reality finding → Daneel → Professor (independent, no pillar)
  Pillar conflict → Each pillar documents → Professor resolves
```

### Escalation Rules

| Rule | Path |
|------|------|
| Agent blocked | Agent → Workstream Lead → Pillar Lead |
| Workstream dispute | Either lead → Pillar Lead |
| Pillar dispute | Pillar Lead → The Data Professor (with documented rationale from both pillars) |
| Security critical | Diana → Professor (ESC-002) |
| Reality divergence | Daneel → Professor |
| Capability emergency | Aurora → Professor (if Sonia and Manu both unavailable) |

---

## Part 6: Decision Ownership

| Decision | Owner | Can be overridden by |
|----------|-------|---------------------|
| What to build | Manu | Professor |
| Acceptance criteria | Manu | Professor |
| Delivery standards | Sonia | Professor (PMO-010 amendment) |
| Sprint scope | Sonia | Manu (PMO-005 countermand) |
| Delivery block (governance) | Sonia | Professor |
| Capability assessment | Aurora | Sonia + Manu jointly (pipeline override) |
| Hire recommendation | Aurora | Professor (HR-009) |
| Skill addition/retirement | Aurora proposes | Professor approves |
| Dynamic agent activation | Pipeline (Aurora→Sonia→Manu) | Professor |
| Budget allocation | Professor | — |
| Constitutional amendment | Professor | — |
| Reality verification | Daneel reports | Professor decides |

---

## Part 7: Long-Term Maintainability

### Scalability

The four-pillar model scales to any number of projects and agents:

```
Pillars (4): stable, rarely changes
Workstreams (10): evolves with domain needs
Agents (26+): hired, retired, promoted
```

Adding a fifth pillar (e.g., Financial Authority) would be structurally clean — same pattern, new domain. The model doesn't break at 5, 6, or 7 pillars. But 4 is the right number today.

### Bus Factor

| Pillar | Bus Factor | Mitigation |
|--------|:--------:|------------|
| Manu | 1 | Professor is ultimate product authority |
| Sonia | 1 | Elena (Scrum Master) can cover tactical. Professor covers strategic. |
| Aurora | 1 | New role. No deputy. Risk identified. |
| Daneel | 1 | Charter exists. Extension self-loads. Professor can verify directly. |

**Finding:** All four pillars have bus factor of 1. This is acceptable for a solo-founder organization but should be monitored per RSK-005.

---

## Part 8: Constitutional Amendment Proposal

### New Domain: Organizational Authority (AUTH)

| ID | Type | Rule |
|----|------|------|
| AUTH-001 | OBLIGATION | ARAYA SHALL operate under four organizational authorities: Product Authority (Manu), Delivery Authority (Sonia), Capability Authority (Aurora), and Reality Authority (Daneel) |
| AUTH-002 | OBLIGATION | Product Authority SHALL own: product vision, requirements, acceptance criteria, backlog, roadmap, release scope |
| AUTH-003 | OBLIGATION | Delivery Authority SHALL own: delivery governance, workstream coordination, risk management, delivery standards, program reporting |
| AUTH-004 | OBLIGATION | Capability Authority SHALL own: capability registry, gap analysis, workforce planning, hiring recommendations, skills lifecycle, dynamic agent activation |
| AUTH-005 | OBLIGATION | Reality Authority SHALL own: independent verification, organizational audits, repository truth validation. Reality Authority SHALL NOT override other authorities. |
| AUTH-006 | OBLIGATION | Pillar authority conflicts SHALL escalate to The Data Professor with each pillar's documented rationale |
| AUTH-007 | OBLIGATION | Domain authorities (Security, Architecture, Platform) SHALL operate within workstreams and report to the Delivery Authority for operational matters |
| AUTH-008 | OBLIGATION | Security-critical escalations SHALL bypass the pillar chain and route directly to The Data Professor |

### Rules Superseded

| Old Rule | Superseded By | Reason |
|----------|:-----------:|--------|
| PMO-001 (Sonia owns delivery governance) | AUTH-003 | Same authority, now in organizational authority domain |
| PMO-007 (Sonia owns organizational governance) | AUTH-003 | Clarified: Sonia owns delivery governance. Professor owns organizational governance. |

### Rules Clarified

| Rule | Clarification |
|------|---------------|
| PMO-010 (Sonia proposes amendments) | Remains valid. Sonia proposes. Professor approves per AUTH-006. |
| HR-006 to HR-009 (Aurora capability rules) | Remain valid. Now under AUTH-004 umbrella. |
| TMP-008 (Activation pipeline) | Remains valid. Pipeline respects AUTH-002, AUTH-003, AUTH-004. |

### Migration Plan

| Step | Action | Impact |
|:----:|--------|--------|
| 1 | Add AUTH domain to constitution | 8 new rules |
| 2 | Update PMO-001 and PMO-007 references | Clarify Sonia's scope |
| 3 | No agent changes required | Authorities already align with agent roles |
| 4 | No process changes required | Pipeline model already designed |
| 5 | Daneel charter updated | Reference AUTH-005 |

### Risks

| Risk | Mitigation |
|------|-----------|
| Pillar conflict deadlocks without Professor available | AUTH-006: escalate with rationale. If Professor unavailable, status quo prevails. |
| Aurora's authority undermined by workstream leads | AUTH-007: workstream leads report through Delivery Authority. Aurora owns capability assessment independently. |
| Four pillars feel top-heavy for 26 agents | Pillars are governance roles, not management layers. Day-to-day work unaffected. |

---

## Part 9: Final Recommended Structure

```
                    The Data Professor
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │  MANU   │       │  SONIA  │       │ AURORA  │
   │ Product │       │Delivery │       │Capability│
   │ Authority│      │Authority│       │Authority │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                 │                 │
   What to build     How to build     Who can build
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    10 Workstreams
                          │
                    26+ Agents

   ┌─────────────────────────────────────────────┐
   │                  DANEEL                      │
   │              Reality Authority               │
   │   Independent. Verifies. Reports.            │
   │   Does not override.                         │
   └─────────────────────────────────────────────┘
```

### Four Pillars

| Pillar | Question | Scope | Reports to |
|--------|----------|-------|------------|
| **Manu** | What should we build? | Product direction, requirements, acceptance | Professor |
| **Sonia** | How should we deliver? | Governance, workstreams, delivery standards | Professor |
| **Aurora** | Who can build it? | Capabilities, skills, workforce, hiring | Professor |
| **Daneel** | Is the story true? | Verification, audit, repository truth | Professor |

---

## Part 10: Recommendation

**ADOPT the Four-Pillar Model.** 8 constitutional rules (AUTH-001 to AUTH-008). The model completes the delivery triangle (What + How + Who) with independent verification (Daneel). It resolves the organizational authority gaps identified in the maturity audit without adding unnecessary complexity. Four pillars for 26 agents is appropriate — lean enough to be agile, structured enough to be governed.

**Disposition:** AUDIT — four-pillar model proposed. 8 new rules. Ready for your decision, Professor.
