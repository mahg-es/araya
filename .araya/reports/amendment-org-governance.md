# Constitutional Amendment — Organizational Governance

**Proposed by:** R. Daneel Olivaw (by authority of The Data Professor)
**Artifact ID:** amendment-org-governance-001
**Date:** 2026-05-31 18:00 +0200
**Status:** Proposed — Awaiting The Data Professor's Approval
**Scope:** ARAYA Constitution
**Supersedes:** None directly. Extends GOV, HR, ENG, AMB. Adds WSM, REV, ESC, PMO.

---

## New Domains

### Workstream Model (WSM)

Transforms ARAYA from a flat agent roster into a domain-owned delivery organization.

| ID | Type | Rule |
|----|------|------|
| WSM-001 | OBLIGATION | ARAYA SHALL operate through 10 permanent workstreams: Product Direction, Delivery Management, Security & Identity, Platform Engineering, Architecture, Software Engineering, Quality Engineering, Knowledge & Learning, Business Operations, People & Process |
| WSM-002 | OBLIGATION | Every workstream SHALL have one accountable lead. Accountability SHALL NOT be shared. |
| WSM-003 | OBLIGATION | Workstream boundaries SHALL NOT overlap. No domain SHALL belong to two workstreams. |
| WSM-004 | OBLIGATION | Workstream leads SHALL report program-level status, risks, and dependencies to the Program Director |
| WSM-005 | OBLIGATION | Workstream capacity and capability SHALL be reviewed quarterly by People & Process |

### Review Model (REV)

Ensures material changes receive domain-expert review before reaching UAT.

| ID | Type | Rule |
|----|------|------|
| REV-001 | OBLIGATION | Every material capability SHALL have defined blocker reviewers per the Mandatory Review Matrix |
| REV-002 | OBLIGATION | Blocker reviewers MUST approve before UAT. No capability SHALL proceed to UAT with unresolved blocker findings. |
| REV-003 | OBLIGATION | Required reviewers MUST be notified before implementation begins |
| REV-004 | OBLIGATION | Advisory reviewers MAY be consulted at the workstream lead's discretion |
| REV-005 | OBLIGATION | The Mandatory Review Matrix SHALL be maintained as a living document — updated when new capabilities or domains emerge |

### Escalation Model (ESC)

Formalizes the path from execution-level issues to organizational decisions.

| ID | Type | Rule |
|----|------|------|
| ESC-001 | OBLIGATION | Escalation SHALL follow the chain: Agent → Workstream Lead → Program Director → Product Owner → The Data Professor |
| ESC-002 | OBLIGATION | Security escalations SHALL route directly to the Security & Identity workstream lead regardless of chain |
| ESC-003 | OBLIGATION | Any agent MAY escalate a governance violation directly to the Program Director |
| ESC-004 | OBLIGATION | The Program Director MAY block any delivery that violates constitutional governance |
| ESC-005 | OBLIGATION | Escalations SHALL be documented with rationale, timestamp, and resolution |

### Program Management (PMO)

Grants Sonia formal governance authority across all ARAYA-governed projects.

| ID | Type | Rule |
|----|------|------|
| PMO-001 | OBLIGATION | The Program Director SHALL own delivery governance across all ARAYA-governed projects |
| PMO-002 | OBLIGATION | The Program Director SHALL maintain the organizational risk register, capacity plan, and cross-project dependency map |
| PMO-003 | OBLIGATION | The Program Director SHALL define and enforce delivery standards (SDD, BDD, TDD, review, validation) |
| PMO-004 | OBLIGATION | The Program Director SHALL report program health, velocity, and risks to the Product Owner and The Data Professor |
| PMO-005 | PERMISSION | The Program Director MAY override sprint scope for governance compliance |
| PMO-006 | PERMISSION | The Program Director MAY escalate any delivery directly to The Data Professor |

---

## Delivery Governance (Additions to existing domains)

### Additions to Governance (GOV)

| ID | Type | Rule |
|----|------|------|
| GOV-005 | OBLIGATION | Delivery completion SHALL require: all acceptance criteria met, all blocker reviews signed off, test suite green, artifacts follow naming convention, artifacts carry timestamps, evidence committed to dev-mahg |
| GOV-006 | OBLIGATION | UAT entry SHALL require: implementation complete, self-review complete, blocker reviews complete, test suite green, documentation updated |

### Additions to Human Resources (HR)

| ID | Type | Rule |
|----|------|------|
| HR-005 | OBLIGATION | Separation of duties SHALL be preserved: QA executor SHALL NOT approve deliveries, architect SHALL NOT implement their own designs without review, security reviewer SHALL NOT review their own code |

### Additions to Engineering (ENG)

| ID | Type | Rule |
|----|------|------|
| ENG-005 | OBLIGATION | Engineering work SHALL reference the Mandatory Review Matrix before implementation begins |
| ENG-006 | OBLIGATION | Cross-workstream dependencies SHALL be mapped before parallel work begins on dependent capabilities |

### Additions to Ambiguity (AMB)

| ID | Type | Rule |
|----|------|------|
| AMB-002 | ESCALATION | If a workstream lead and a blocker reviewer disagree on a finding, the dispute SHALL escalate to the Program Director for resolution |

---

## Superseded Rules

| Old Rule | Superseded By | Reason |
|----------|:-----------:|--------|
| (none directly) | — | This amendment adds new domains; existing rules remain valid |

## Conflicts

| Potential Conflict | Resolution |
|--------------------|------------|
| ESC-001 escalation chain vs AMB-001 direct escalation | AMB-001 applies to ambiguous/conflicting instructions. ESC-001 applies to operational delivery issues. Both valid; different triggers. |
| PMO-005 (override sprint scope) vs GOV-001 (approved requirements) | PMO-005 is a governance exception mechanism. Normal flow: GOV-001 → approved requirements. Exception: PMO-005 → override for governance compliance. |
| REV-002 (blocker approval before UAT) vs delivery velocity | REV-002 takes precedence. Speed does not override governance. Blockers must be resolved. |

---

## Impact Summary

| Change | Rules Added | New Domains |
|--------|:----------:|:----------:|
| Workstream Model | 5 | WSM |
| Review Model | 5 | REV |
| Escalation Model | 5 | ESC |
| Program Management | 6 | PMO |
| Delivery Governance (GOV) | 2 | — |
| Human Resources (HR) | 1 | — |
| Engineering (ENG) | 2 | — |
| Ambiguity (AMB) | 1 | — |
| **Total** | **27** | **4** |

**Constitution after amendment: 127 rules, 22 domains.**

---

## Approval Required

This amendment SHALL be approved by The Data Professor before activation.

**Disposition:** AUDIT — constitutional amendment proposed. 27 new rules, 4 new domains, 0 conflicts requiring resolution. Ready for your decision, Professor.
