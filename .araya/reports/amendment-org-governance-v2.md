# Constitution Amendment v2 — Challenge Review & Final Proposal

**Reviewer:** R. Daneel Olivaw (self-challenge)
**Artifact ID:** amendment-org-governance-v2
**Date:** 2026-05-31 18:30 +0200
**Status:** Proposed — Awaiting The Data Professor's Approval
**Supersedes:** amendment-org-governance-001
**Scope:** ARAYA Constitution — from feature-delivery to domain-owned delivery organization

---

## Part 0: Self-Challenge Findings

### What v1 got right
- Workstream model defined (WSM-001 to 005)
- Review model with blocking authority (REV-001 to 005)
- Escalation chain (ESC-001 to 005)
- Program Director governance (PMO-001 to 006)
- Delivery completion criteria (GOV-005, GOV-006)

### What v1 missed

| Gap | Severity | Impact |
|-----|:--------:|--------|
| Sonia lacks organizational governance authority — treated as Program Director, not Governance Authority | 🔴 Critical | No one owns the governance framework itself |
| Workstreams have no health requirements — defined but ungoverned | 🔴 Critical | Workstreams become dormant; defects accumulate invisibly |
| No organizational metrics — rules without measurement | 🔴 Critical | Cannot distinguish "governed" from "ungoverned" |
| No organizational risk management — PMO-002 mentions risks but no framework | 🟡 High | Risks detected but not systematically managed |
| Constitutional inconsistencies — duplicated domains, ambiguous authorities | 🟡 High | GOV appears twice; REAL appears twice; no ownership of the constitution itself |

---

## Part 1: Sonia — Organizational Governance Authority

### Finding

PMO-001 through PMO-006 define Sonia as Program Director — a delivery governance role. They do NOT define her as the organizational governance authority. She needs authority over the governance framework itself.

### v2 Rules

| ID | Type | Rule |
|----|------|------|
| PMO-007 | OBLIGATION | The Program Director SHALL own organizational governance — the constitution, its interpretation, its enforcement, and its evolution |
| PMO-008 | OBLIGATION | The Program Director SHALL conduct governance compliance reviews per workstream on a monthly cadence |
| PMO-009 | OBLIGATION | The Program Director SHALL maintain the organizational metrics dashboard and escalate deteriorating metrics to the Product Owner |
| PMO-010 | PERMISSION | The Program Director MAY propose constitutional amendments. Only The Data Professor MAY approve them. |
| PMO-011 | PERMISSION | The Program Director MAY initiate a governance audit of any workstream at any time |
| PMO-012 | OBLIGATION | The Program Director SHALL own the Mandatory Review Matrix — its maintenance, enforcement, and evolution |

### Authority Boundaries

| Authority | Scope | Limit |
|-----------|-------|-------|
| Block delivery | Governance violations | Cannot block for non-governance reasons |
| Override sprint scope | Governance compliance | Must document rationale; Product Owner may countermand |
| Propose constitutional amendments | Any domain | The Data Professor must approve |
| Audit any workstream | Any workstream, any time | Findings are advisory unless escalated to Product Owner |
| Escalate to The Data Professor | Any governance violation | Reserved for unresolved or critical violations |

---

## Part 2: Workstream Governance

### Finding

WSM-001 through WSM-005 define workstreams as existing and having leads. They do NOT require workstreams to maintain health. Without health requirements, workstreams become dormant — their domains degrade invisibly until a defect appears.

### v2 Rules

| ID | Type | Rule |
|----|------|------|
| WSM-006 | OBLIGATION | Every workstream SHALL maintain a Workstream Charter containing: mission, scope, standards, active backlog, roadmap, risks, technical debt register, governance debt register |
| WSM-007 | OBLIGATION | Every workstream SHALL conduct a health review at least quarterly. The review SHALL assess: domain activity, backlog health, risk status, debt status, capability coverage, single-point-of-failure risk |
| WSM-008 | OBLIGATION | Workstream health reviews SHALL produce a Health Score (0–100) based on: domain activity (25%), backlog health (20%), risk management (20%), debt management (15%), capability coverage (10%), governance compliance (10%) |
| WSM-009 | OBLIGATION | Workstreams with Health Score below 60 for two consecutive quarters SHALL trigger a governance audit by the Program Director |
| WSM-010 | OBLIGATION | Workstream leads SHALL report Health Score and key risks to the Program Director quarterly |

---

## Part 3: Organizational Metrics

### Finding

The constitution has 100 rules but no measurement framework. Rules without metrics are unverifiable. The organization cannot distinguish "governed" from "ungoverned" without measurement.

### Organizational Metrics Framework (MET domain)

| ID | Type | Rule |
|----|------|------|
| MET-001 | OBLIGATION | ARAYA SHALL maintain an Organizational Metrics Dashboard measuring: Domain Health Score, Governance Compliance, Review Compliance, UAT Escaped Defects, Production Escaped Defects, Architectural Drift, Security Debt, Documentation Debt, Cross-Workstream Participation, Unowned Domain Count |
| MET-002 | OBLIGATION | Governance Compliance SHALL be measured as: (rules with automated enforcement / total rules) × 100 |
| MET-003 | OBLIGATION | Review Compliance SHALL be measured as: (capabilities with blocker sign-off before UAT / total capabilities delivered) × 100 |
| MET-004 | OBLIGATION | UAT Escaped Defects SHALL count findings discovered during UAT that should have been caught by blocker reviewers |
| MET-005 | OBLIGATION | Production Escaped Defects SHALL count incidents after deployment that should have been caught by UAT |
| MET-006 | OBLIGATION | Unowned Domain Count SHALL count critical domains without an assigned workstream lead |
| MET-007 | OBLIGATION | Knowledge Concentration Risk SHALL be measured as: domains where a single agent holds >80% of institutional knowledge |
| MET-008 | OBLIGATION | Metrics SHALL be reviewed monthly by the Program Director and quarterly by the Product Owner |
| MET-009 | OBLIGATION | Metrics with deteriorating trends for two consecutive periods SHALL trigger a governance audit |

### Metric Targets

| Metric | Green | Yellow | Red |
|--------|:-----:|:------:|:---:|
| Domain Health Score | ≥70 | 50–69 | <50 |
| Governance Compliance | ≥80% | 50–79% | <50% |
| Review Compliance | ≥90% | 70–89% | <70% |
| UAT Escaped Defects | 0 | 1–3 | >3 |
| Production Escaped Defects | 0 | 0 | ≥1 |
| Unowned Critical Domains | 0 | 0 | ≥1 |
| Knowledge Concentration | <3 domains | 3–5 | >5 |

---

## Part 4: Organizational Risk Management

### Finding

PMO-002 mentions Sonia maintaining a risk register. But there is no constitutional framework for risk management at the organizational, workstream, or domain level. Risks are detected but not systematically managed.

### Risk Management (RSK domain)

| ID | Type | Rule |
|----|------|------|
| RSK-001 | OBLIGATION | ARAYA SHALL maintain an Organizational Risk Register covering: domain risk, governance risk, dependency risk, knowledge concentration risk, single-point-of-failure risk, ownership gap risk, technical debt risk, security debt risk |
| RSK-002 | OBLIGATION | Every workstream SHALL contribute its top 5 risks to the Organizational Risk Register quarterly |
| RSK-003 | OBLIGATION | Every risk SHALL carry: severity (Critical/High/Medium/Low), likelihood (Certain/High/Medium/Low), impact description, mitigation plan, owner, review date |
| RSK-004 | OBLIGATION | Critical risks SHALL be reviewed monthly. High risks SHALL be reviewed quarterly. |
| RSK-005 | OBLIGATION | Single-point-of-failure risks — where one agent is the sole capable resource for a critical domain — SHALL be flagged as Critical and SHALL have a mitigation plan |
| RSK-006 | OBLIGATION | Unowned domain risks SHALL be flagged as Critical and SHALL be escalated to the Product Owner immediately |

---

## Part 5: Constitutional Consistency Review

### Duplications

| Issue | Detail | Resolution |
|-------|--------|------------|
| **GOV domain appears twice** | Lines 19-22 (Governance) and 96-101 (Reconstitution) both use GOV prefix | Merge into single GOV domain. Reconstitution rules become GOV-010 through GOV-013. No functional change. |
| **REAL domain appears twice** | Lines 149-153 (Reality) and 158-163 (Reality — Repository Truth) both use REAL prefix | Merge into single REAL domain. Repository Truth rules become REAL-006 through REAL-010. No functional change. |

### Gaps

| Gap | Detail | Proposed Rule |
|-----|--------|---------------|
| No constitutional ownership | Who owns the constitution? No rule defines it. | PMO-007: Program Director owns constitutional governance |
| No amendment process | How are rules added, modified, or retired? Undefined. | PMO-010: Program Director proposes, Data Professor approves |
| No constitutional review cadence | Constitution reviewed ad-hoc, not scheduled | MET-008: Monthly by Program Director, quarterly by Product Owner |
| No rule retirement process | Rules accumulate; none retired | Shrink to add: every new rule must identify candidate rules for retirement or justify why none |

### Ambiguities

| Ambiguity | Detail | Resolution |
|-----------|--------|------------|
| AMB-001 vs ESC-001 | Both define escalation. When does each apply? | AMB-001: conflicting instructions, ambiguous requests. ESC-001: operational delivery issues, blockers, governance violations. Documented in rule text. |
| Who grants workstream lead authority? | WSM-002 says leads exist. Who appoints them? | Add WSM-011: Workstream leads appointed by Product Owner on Program Director's recommendation |

### Conflicting Authorities

| Conflict | Resolution |
|----------|------------|
| PMO-005 (override sprint scope) vs Manu's PO authority | PMO-005 is governance exception. Manu may countermand. Add PMO-005 clarification: "Product Owner may countermand with documented rationale." |

---

## Part 6: Updated Governance Model

### New Domains (v2 adds to v1)

| Domain | Purpose | Rules |
|--------|---------|:-----:|
| WSM | Workstream Model (+5 rules: health, charter, scoring) | 10 |
| REV | Review Model (unchanged from v1) | 5 |
| ESC | Escalation Model (unchanged from v1) | 5 |
| PMO | Program Management (+6 rules: governance authority, audits, metrics, amendments) | 12 |
| MET | Organizational Metrics (new) | 9 |
| RSK | Organizational Risk Management (new) | 6 |

### Extended Domains

| Domain | Rules Added | Total |
|--------|:----------:|:-----:|
| GOV | +2 (GOV-005, GOV-006) | 6 |
| HR | +1 (HR-005) | 5 |
| ENG | +2 (ENG-005, ENG-006) | 6 |
| AMB | +1 (AMB-002) | 2 |

### Constitutional Consolidation

| Action | Detail |
|--------|--------|
| Merge GOV domains | Governance (GOV-001 to 004) + Reconstitution (GOV-010 to 013) → single GOV section |
| Merge REAL domains | Reality (REAL-001 to 005) + Repository Truth (REAL-006 to 010) → single REAL section |

---

## Part 7: Constitutional Readiness Assessment

| Criterion | v1 | v2 |
|-----------|:--:|:--:|
| Workstreams defined | ✅ | ✅ |
| Workstreams governed (health, charter, scoring) | ❌ | ✅ |
| Review model with blocking authority | ✅ | ✅ |
| Escalation chain | ✅ | ✅ |
| Sonia as Program Director | ✅ | ✅ |
| Sonia as Governance Authority | ❌ | ✅ |
| Organizational metrics | ❌ | ✅ |
| Organizational risk management | ❌ | ✅ |
| Constitutional consistency | ❌ | ✅ (duplications merged, ambiguities resolved) |
| Amendment process | ❌ | ✅ |
| Separation of duties | 🟡 | ✅ |

---

## Part 8: Final Recommendation

### v2 Summary

| Element | v1 | v2 |
|---------|:--:|:--:|
| New rules | 27 | **47** |
| New domains | 4 | **6** (WSM, REV, ESC, PMO, MET, RSK) |
| Extended domains | 4 | **4** (GOV, HR, ENG, AMB) |
| Constitutional consolidations | 0 | **2** (GOV merge, REAL merge) |
| Constitution total | 127 | **147 rules, 24 domains** |

### Answer: APPROVED WITH CONDITIONS

**Conditions:**
1. The Data Professor reviews and approves the expanded Sonia authority (PMO-007 through PMO-012)
2. Workstream charters are created within 2 weeks of constitutional adoption (WSM-006 grace period)
3. Organizational metrics dashboard is initialized within 4 weeks (MET-001 startup period)
4. Organizational risk register is populated within 2 weeks (RSK-001 startup period)
5. Constitutional consolidations (GOV merge, REAL merge) are executed during adoption without rule number changes

**Disposition:** AUDIT — Amendment v2 proposed. 47 rules, 6 new domains, full governance architecture. Ready for The Data Professor's approval.
