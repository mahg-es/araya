# Dynamic Capability Agents — Governance Review

**Reviewer:** R. Daneel Olivaw
**Artifact ID:** review-dynamic-agents-001
**Date:** 2026-05-31 20:15 +0200
**Scope:** Neo & Trinity — mission-scoped temporary agents

---

## Part 1: Proposal Summary

Two dormant agents (Neo, Trinity) that:
- Have no permanent skills
- Have no permanent domain
- Have no governance or ownership authority
- Are activated for a specific mission with assigned skills
- Have skills revoked upon mission completion

---

## Part 2: Benefits

| Benefit | Mechanism |
|---------|-----------|
| **Capability gap bridging** | When ARAYA lacks a specific skill combination, activate a temporary agent instead of hiring permanently |
| **Surge capacity** | When two projects need the same specialist simultaneously |
| **Experimentation** | Test a new skill or role before creating a permanent agent |
| **Risk-free specialization** | Assign high-risk or experimental work to agents with no organizational permanence |
| **Aurora's toolkit** | Gives the Capability Officer a mechanism beyond "hire or do without" |
| **No permanent overhead** | No charter maintenance, no skill updates, no quarterly reviews for dormant agents |

---

## Part 3: Risks

### Risk Matrix

| Risk | Severity | Likelihood | Mitigation |
|------|:--------:|:----------:|------------|
| Temporary agents become permanent by default | 🔴 High | High | Maximum activation duration. Automatic deactivation. |
| Skill revocation failure | 🔴 High | Medium | Automated skill removal on mission close. Aurora audits. |
| Accountability gap — who owns their output? | 🟡 Medium | Medium | Mission sponsor (Sonia or workstream lead) owns output quality |
| Coordination overhead — onboarding each time | 🟡 Medium | High | Standard activation protocol. Context injection at start. |
| Governance bypass — used to avoid review matrix | 🔴 High | Medium | Temporary agents subject to same REV rules as permanent agents |
| Abuse — used instead of hiring for permanent gaps | 🔴 High | Medium | Aurora must approve activation. If same gap filled 3+ times, hiring required. |
| Identity confusion | 🟡 Low | Low | Clear naming convention. "Mission Agent" prefix in all communications. |
| Quality risk — no institutional knowledge | 🟡 Medium | High | First mission per agent type has review overhead. Improves with reuse. |
| Artifact ownership ambiguity | 🟡 Medium | Medium | ART-004: artifacts carry "Mission Agent: Neo/Trinity, Sponsor: [name]" |
| Team cohesion impact | 🟡 Low | Low | Temporary agents are clearly temporary. No expectation of permanence. |

---

## Part 4: Failure Scenarios

### Scenario 1: The Permanent Temp

Neo is activated for a "temporary" billing fix. The fix becomes a feature. The feature becomes a product. Neo has been active for 3 months with no deactivation.

**Prevention:** Maximum activation duration of 2 weeks. Automatic deactivation and skill revocation at deadline. Extension requires Aurora + Sonia approval.

### Scenario 2: The Governance Shortcut

A workstream lead activates Trinity to implement a capability without going through the review matrix. "She's temporary, we don't need full review."

**Prevention:** REV-002 applies to ALL agents, temporary or permanent. No exceptions.

### Scenario 3: The Abandoned Artifact

Neo completes a mission. Skills are revoked. But Neo's code and documentation have no permanent owner. Six months later, no one knows how it works.

**Prevention:** Mission sponsor inherits ownership of all artifacts on mission close. Transfer documented.

### Scenario 4: The Hiring Replacement

Aurora identifies a permanent capability gap. Instead of proposing Clara-like hiring, she activates Neo repeatedly. The organization never fills the gap.

**Prevention:** Three-activation rule. If the same skill combination is activated 3 times within 6 months, Aurora MUST propose a permanent hire.

---

## Part 5: Abuse Scenarios

### Abuse 1: Avoiding Review

A workstream lead uses Neo to build something without architecture review. "He's not Aisha, he doesn't need architecture sign-off."

**Counter:** REV-002 is agent-agnostic. Neo's work requires the same blocker reviews as Valentina's.

### Abuse 2: Avoiding Accountability

Sonia delegates a failing project to Trinity. If Trinity fails, "she was temporary."

**Counter:** Mission sponsor is accountable for mission outcome. Trinity is the tool, not the owner.

### Abuse 3: Infinite Capacity

A workstream lead activates Neo and Trinity simultaneously for 5 different missions. 26 agents become effectively 50.

**Counter:** Maximum 2 simultaneous activations. Aurora controls activation. Sonia controls mission assignment.

---

## Part 6: Governance Implications

### Constitutional Gaps

| Gap | Resolution |
|-----|------------|
| Constitution assumes permanent agents | New rules: temporary agents with lifecycle |
| WSM-002: one accountable lead per workstream | Temporary agents report to workstream lead, not own a workstream |
| ART-004: mandatory metadata per artifact | Extended: "Owner: Mission Agent Neo, Sponsor: Diana" |
| HR rules cover hiring only | Extended: HR rules cover activation and deactivation |
| MET-007: knowledge concentration | Temporary agents don't count toward concentration (they have no permanent knowledge) |

### Required Constitutional Rules (TMP domain)

| ID | Type | Rule |
|----|------|------|
| TMP-001 | PERMISSION | ARAYA MAY deploy Dynamic Capability Agents (Neo, Trinity) for mission-scoped capability gap filling |
| TMP-002 | OBLIGATION | Dynamic Capability Agents SHALL have no permanent skills, no permanent domain, no governance authority, and no ownership authority |
| TMP-003 | OBLIGATION | Every activation SHALL define: mission, duration (max 14 days), assigned skills, mission sponsor, deliverable |
| TMP-004 | OBLIGATION | Skills SHALL be automatically revoked upon mission completion or expiration. The Capability Officer SHALL audit revocation. |
| TMP-005 | OBLIGATION | Dynamic Capability Agents SHALL be subject to all constitutional rules including the Mandatory Review Matrix (REV-002) |
| TMP-006 | OBLIGATION | The mission sponsor SHALL inherit ownership of all artifacts produced by the Dynamic Capability Agent upon mission close |
| TMP-007 | OBLIGATION | If the same capability gap is filled by Dynamic Capability Agents three or more times within six months, the Capability Officer SHALL propose a permanent hire |
| TMP-008 | PERMISSION | The Capability Officer (Aurora) SHALL control activation. The Program Director (Sonia) SHALL assign missions. |
| TMP-009 | OBLIGATION | Maximum two Dynamic Capability Agents MAY be active simultaneously |
| TMP-010 | OBLIGATION | Every activation SHALL produce a mission close report documenting: skills used, output produced, defects found, lessons learned |

### Impact on Existing Rules

| Rule | Impact |
|------|--------|
| HR-001 to HR-005 | Unchanged. Temporary agents don't affect permanent workforce rules. |
| WSM-001 to WSM-010 | Temporary agents report to workstream leads. Don't own workstreams. |
| REV-001 to REV-005 | Fully applicable. Temporary agents get same review treatment. |
| ART-001 to ART-010 | Artifacts carry "Mission Agent" in owner field. |
| MET domain | Temporary agents excluded from knowledge concentration and SPOF metrics. |

---

## Part 7: Organizational Implications

### Aurora's New Capability

Dynamic Capability Agents become a tool in Aurora's Capability Officer toolkit:

```
Aurora detects capability gap
    │
    ├─ Permanent gap? → Propose hire (Clara model)
    │
    ├─ Temporary/surge gap? → Propose Neo/Trinity activation
    │
    └─ Unknown gap? → Activate Neo/Trinity as experiment, evaluate after mission
```

### Activation Protocol

```
1. Aurora identifies capability gap
2. Aurora proposes activation: which agent, which skills, which mission
3. Sonia approves mission assignment
4. Agent activated with assigned skills and mission brief
5. Context injected automatically (per Phase 3 roadmap)
6. Agent delivers under standard governance (review matrix, tests, DoD)
7. Mission close: skills revoked, artifacts transferred, report filed
8. Aurora updates capability registry
```

### Who Can Activate

| Role | Authority |
|------|-----------|
| Aurora (Capability Officer) | Proposes activation |
| Sonia (Program Director) | Approves mission assignment |
| Workstream lead | Requests activation |
| The Data Professor | Veto power |

---

## Part 8: Recommendation

**APPROVED WITH CONDITIONS.**

Neo and Trinity fill a genuine gap in ARAYA's organizational design: the space between "we don't have this capability" and "we should hire for this capability." They provide flexibility without permanent overhead. They give Aurora a tool beyond binary hire/don't-hire decisions.

The conditions:

1. **10 constitutional rules (TMP-001 to TMP-010)** govern their existence
2. **Aurora controls activation** — no workstream lead can activate independently
3. **Maximum 14-day activation** — automatic deactivation at deadline
4. **Three-activation rule** — if the same gap is filled 3 times, permanent hiring is mandatory
5. **Full governance applies** — review matrix, tests, DoD, artifact standards
6. **No governance or ownership authority** — they execute, they don't decide
7. **Maximum 2 simultaneous activations** — prevents infinite capacity illusion
8. **Mission close report required** — ensures learning from each activation
9. **Pilot for 90 days** — evaluate abuse/failure scenarios before making permanent
10. **Not a replacement for Clara** — permanent gaps require permanent hires

**Disposition:** AUDIT — review complete. Neo and Trinity are approved with 10 conditions and a 90-day pilot period. Ready for your decision, Professor.
