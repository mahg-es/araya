# Constitution Amendment v2 — Implementation & Adoption Roadmap

**Planner:** R. Daneel Olivaw
**Artifact ID:** roadmap-adoption-v2
**Date:** 2026-05-31 19:00 +0200
**Scope:** v2 rollout across ARAYA and MAHG-PMS

---

## Part 0: Rule Classification

### Classification Framework

| Class | Meaning | Timeline |
|-------|---------|:------:|
| **Immediate** | Activate now. No dependencies. High impact. | Day 1 |
| **Near-Term** | Activate within 2 weeks. Light dependencies. | Week 1–2 |
| **Deferred** | Activate within 4 weeks. Needs baseline data or tooling. | Week 3–4 |
| **Experimental** | Pilot first. Measure. Adjust. | Pilot period |

### Per-Rule Classification

| Rule | Class | Depends On | Effort | Impact |
|------|:-----:|------------|:------:|:------:|
| **WSM-001** Workstreams defined | Immediate | — | Low | High |
| **WSM-002** One accountable lead | Immediate | PMO-001 | Low | High |
| **WSM-003** No overlapping boundaries | Immediate | WSM-001 | Low | Medium |
| **WSM-004** Report to Program Director | Near-Term | PMO-007 | Low | Medium |
| **WSM-005** Quarterly capability review | Deferred | MET domain | Medium | Medium |
| **WSM-006** Workstream charters | Near-Term | WSM-001, PMO-007 | Medium | High |
| **WSM-007** Quarterly health reviews | Deferred | WSM-006, MET domain | Medium | Medium |
| **WSM-008** Health scoring | Deferred | WSM-007, MET domain | Medium | Low |
| **WSM-009** Low-score audit trigger | Deferred | WSM-008 | Low | Low |
| **WSM-010** Quarterly reporting | Deferred | WSM-004 | Low | Medium |
| **REV-001** Blocker reviewers defined | Immediate | — | Low | Critical |
| **REV-002** No UAT without sign-off | Immediate | REV-001 | Low | Critical |
| **REV-003** Notify reviewers before implementation | Immediate | REV-001 | Low | Medium |
| **REV-004** Advisory reviewers optional | Immediate | — | Low | Low |
| **REV-005** Matrix maintained as living document | Near-Term | REV-001 | Low | Medium |
| **ESC-001** Escalation chain | Immediate | PMO-001 | Low | High |
| **ESC-002** Security direct escalation | Immediate | — | Low | High |
| **ESC-003** Agent governance escalation | Immediate | — | Low | Medium |
| **ESC-004** Program Director blocks delivery | Near-Term | PMO-007 | Low | High |
| **ESC-005** Escalations documented | Near-Term | — | Low | Low |
| **PMO-001** Sonia owns delivery governance | Immediate | — | Low | Critical |
| **PMO-002** Risk register, capacity, dependencies | Near-Term | RSK domain | Medium | High |
| **PMO-003** Delivery standards | Immediate | — | Low | High |
| **PMO-004** Program health reporting | Near-Term | MET domain | Medium | Medium |
| **PMO-005** Override sprint scope | Near-Term | PMO-007 | Low | Medium |
| **PMO-006** Escalate to Professor | Immediate | — | Low | High |
| **PMO-007** Sonia owns organizational governance | Near-Term | — | Medium | Critical |
| **PMO-008** Monthly compliance reviews | Deferred | PMO-007, MET domain | Medium | Medium |
| **PMO-009** Metrics dashboard ownership | Deferred | MET domain | Medium | Medium |
| **PMO-010** Propose constitutional amendments | Near-Term | PMO-007 | Low | Medium |
| **PMO-011** Governance audit authority | Near-Term | PMO-007 | Low | Medium |
| **PMO-012** Owns review matrix | Near-Term | REV-001 | Low | Medium |
| **MET-001** Metrics dashboard | Deferred | PMO-007 | High | High |
| **MET-002** Governance compliance % | Deferred | MET-001 | Medium | High |
| **MET-003** Review compliance % | Deferred | MET-001 | Low | High |
| **MET-004** UAT escaped defects | Deferred | MET-001 | Low | High |
| **MET-005** Production escaped defects | Deferred | MET-001 | Low | Critical |
| **MET-006** Unowned domain count | Deferred | MET-001 | Low | Medium |
| **MET-007** Knowledge concentration | Deferred | MET-001 | Medium | High |
| **MET-008** Monthly/quarterly review | Deferred | MET-001 | Low | Low |
| **MET-009** Deteriorating trend triggers | Deferred | MET-008 | Low | Low |
| **RSK-001** Risk register | Near-Term | PMO-002 | Medium | Critical |
| **RSK-002** Top 5 risks per workstream | Near-Term | RSK-001, WSM-001 | Medium | High |
| **RSK-003** Risk metadata (severity, likelihood, etc.) | Near-Term | RSK-001 | Low | Medium |
| **RSK-004** Critical monthly, High quarterly | Deferred | RSK-001 | Low | Low |
| **RSK-005** SPOF flagged as Critical | Near-Term | RSK-001 | Low | Critical |
| **RSK-006** Unowned domains flagged Critical | Near-Term | RSK-001 | Low | Critical |
| **GOV-005** Delivery completion criteria | Immediate | — | Low | Critical |
| **GOV-006** UAT entry criteria | Immediate | — | Low | Critical |
| **HR-005** Separation of duties | Immediate | — | Low | High |
| **ENG-005** Reference review matrix | Immediate | REV-001 | Low | Medium |
| **ENG-006** Cross-workstream dependencies | Near-Term | WSM-001 | Low | Medium |
| **AMB-002** Dispute resolution | Near-Term | PMO-007 | Low | Medium |
| Constitutional merge (GOV) | Immediate | — | Low | Low |
| Constitutional merge (REAL) | Immediate | — | Low | Low |

---

## Part 1: Adoption Roadmap

### Phase 0: Foundation (Day 1)

**Objective:** Activate rules that require zero new tooling or agents. Maximum impact, minimum overhead.

| Action | Rules Activated | Owner |
|--------|:-------------:|-------|
| Constitutional consolidations | GOV merge, REAL merge | Daneel |
| Sonia transition formalized | PMO-001, PMO-003, PMO-006 | Professor |
| Review matrix live for mahg-pms | REV-001 through REV-005 | Sonia |
| Escalation chain active | ESC-001, ESC-002, ESC-003 | Sonia |
| Delivery completion criteria | GOV-005, GOV-006 | Sonia |
| Separation of duties enforced | HR-005 | Sonia + Priya |
| Workstreams defined, leads named | WSM-001, WSM-002, WSM-003 | Professor + Sonia |
| Engineering references review matrix | ENG-005 | Aisha + Lin |

**Quick wins:**
- mahg-pms consultant onboarding gap (UAT Round 2) would have been caught by REV-002
- Escalation chain gives agents a clear path for blockers
- Delivery completion criteria eliminate "done but not committed" ambiguity

**Success criteria:**
- [ ] Constitution updated to 147 rules, 24 domains
- [ ] Review matrix visible and referenced in mahg-pms delivery cycle
- [ ] First delivery completed under GOV-005/GOV-006
- [ ] Sonia operating as Program Director per PMO-001

---

### Phase 1: Structure (Week 1–2)

**Objective:** Activate workstream governance and Sonia's full authority. Requires agent coordination, no new tooling.

| Action | Rules Activated | Owner |
|--------|:-------------:|-------|
| Sonia governance authority | PMO-007, PMO-010, PMO-011, PMO-012 | Professor |
| Workstream charters created | WSM-006 | Workstream leads |
| Sonia maintains risk register | PMO-002, RSK-001, RSK-003 | Sonia |
| Top 5 risks per workstream | RSK-002 | Workstream leads |
| SPOF and unowned domain risks | RSK-005, RSK-006 | Sonia |
| Cross-workstream dependency mapping | ENG-006 | Sonia |
| Dispute resolution active | AMB-002 | Sonia |
| Sonia may override sprint scope | PMO-005 | Sonia |
| Sonia may block delivery on governance | ESC-004 | Sonia |

**Quick wins:**
- Workstream charters make domain ownership visible and auditable
- Risk register surfaces SPOFs (Daneel for releases, Sonia for everything) immediately
- RSK-006 immediately flags the 5 unowned critical domains from the domain audit

**Success criteria:**
- [ ] All 10 workstream charters created and committed
- [ ] Organizational risk register populated with ≥20 risks
- [ ] SPOF risks identified and mitigated (at minimum: release management, Sonia bus factor)
- [ ] First cross-workstream dependency map published for mahg-pms Sprint 4

---

### Phase 2: Measurement (Week 3–4)

**Objective:** Activate organizational metrics and automated health tracking. Requires tooling or manual dashboard.

| Action | Rules Activated | Owner |
|--------|:-------------:|-------|
| Metrics dashboard initialized | MET-001 | Sonia + Esteban |
| Governance compliance measured | MET-002 | Sonia |
| Review compliance measured | MET-003 | Sonia |
| UAT escaped defects tracked | MET-004 | Priya |
| Production escaped defects tracked | MET-005 | Priya + Isla |
| Unowned domain count measured | MET-006 | Sonia |
| Knowledge concentration measured | MET-007 | Aurora |
| Metrics reviewed monthly/quarterly | MET-008 | Sonia + Manu |
| Deteriorating trend triggers | MET-009 | Sonia |
| Monthly compliance reviews | PMO-008 | Sonia |
| Sonia owns metrics dashboard | PMO-009 | Sonia |
| Program health reporting | PMO-004 | Sonia |
| Quarterly workstream capability review | WSM-005 | Aurora |

**Quick wins:**
- MET-006 immediately shows the 5 unowned domains from the audit
- MET-007 identifies Daneel as single point of knowledge concentration for release management
- MET-002 shows the gap between rules defined (147) and rules enforced (~5)

**Success criteria:**
- [ ] Metrics dashboard operational (manual spreadsheet acceptable for Phase 2)
- [ ] Baseline measurements recorded for all 10 metrics
- [ ] First monthly compliance review completed
- [ ] First program health report delivered to Manu

---

### Phase 3: Optimization (Month 2+, Ongoing)

**Objective:** Full quarterly cadence, continuous improvement, maturity advancement.

| Action | Rules Activated | Owner |
|--------|:-------------:|-------|
| Workstream health reviews | WSM-007, WSM-008 | Workstream leads |
| Low-score audit triggers | WSM-009 | Sonia |
| Quarterly workstream reporting | WSM-010 | Workstream leads |
| Critical risk monthly review | RSK-004 | Sonia |
| Metrics trend analysis | MET-008, MET-009 | Sonia |
| Constitutional amendment proposals | PMO-010 | Sonia → Professor |
| Workstream charter updates | WSM-006 (ongoing) | Workstream leads |

**Success criteria:**
- [ ] First quarterly health review cycle complete
- [ ] Organizational maturity reaches Level 3 (Defined) per Phase 3 roadmap
- [ ] At least one constitutional amendment proposed and approved
- [ ] Metrics dashboard shows governance compliance trending upward

---

## Part 2: Pilot Recommendation — MAHG-PMS

### Why MAHG-PMS is the ideal pilot

| Factor | MAHG-PMS readiness |
|--------|-------------------|
| Active delivery | Sprint 4 — production deployment underway |
| Recent governance gap | UAT Round 2 found consultant onboarding security flaws — review matrix would have caught them |
| Clean working tree | Committed, 554 tests passing |
| All 12 capabilities defined in review matrix | Every capability has blocker reviewers |
| Real revenue at stake | First paying customer is the milestone |

### Pilot Scope

| v2 Rule Set | Pilot on MAHG-PMS? | Why |
|-------------|:---:|------|
| REV-001 to 005 (Review Matrix) | ✅ Yes | Most immediate impact — would have caught UAT Round 2 gaps |
| ESC-001 to 005 (Escalation) | ✅ Yes | Clear path for Sprint 4 blockers |
| GOV-005, GOV-006 (Delivery completion) | ✅ Yes | Defines when Sprint 4 is "done" |
| PMO-001, PMO-003, PMO-006 (Sonia authority) | ✅ Yes | Sonia needs authority for Sprint 4 governance |
| WSM-001 to 003 (Workstream definition) | ✅ Yes | MAHG-PMS capabilities map to workstreams |
| HR-005 (Separation of duties) | ✅ Yes | QA executor ≠ approver already practiced |
| ENG-005 (Reference review matrix) | ✅ Yes | Developers check matrix before implementation |
| MET domain (Metrics) | 🟡 Partial | Track UAT escaped defects and review compliance only |
| RSK domain (Risk) | 🟡 Partial | Track SPOF and unowned domain risks only |
| WSM-006 to 010 (Workstream health) | ⏸️ Defer | Full charters and scoring after pilot |
| PMO-007 to 012 (Governance authority) | ⏸️ Defer | Full authority model after pilot validation |

---

## Part 3: Governance Overhead Assessment

### Can ARAYA realistically adopt v2?

**Answer: YES, with measured rollout.**

| Concern | Reality |
|---------|---------|
| "47 rules is too many" | Phase 0 activates 20 rules with zero new effort — they formalize what already happens |
| "Metrics will slow us down" | Phase 2 metrics are a spreadsheet, not a platform — 30 min/month |
| "Workstream charters are bureaucracy" | WSM-006 charters replace tribal knowledge — 1 hour per workstream, once |
| "Risk register is overhead" | RSK-001 replaces "Sonia remembers the risks" — more reliable, less effort |
| "Health scoring is premature" | WSM-008 deferred to Phase 3 — only activate when baseline data exists |

### Overhead by Phase

| Phase | New weekly effort | Value |
|-------|:---------------:|-------|
| Phase 0 | **15 minutes** (Sonia checks review matrix before UAT) | Catches security gaps before customers see them |
| Phase 1 | **2 hours** (one-time charter creation per workstream) | Makes ownership visible and auditable |
| Phase 2 | **1 hour** (monthly metrics review) | Surfaces drift and debt before they become crises |
| Phase 3 | **2 hours** (quarterly health reviews) | Prevents domain dormancy |

### The counterfactual

Without v2, the next UAT will find the same class of gaps (consultant onboarding security, cross-provider access, missing review). Each UAT rework cycle costs more than a year of governance overhead. The review matrix alone — REV-002 — pays for the entire amendment.

---

## Part 4: Recommendation

**APPROVED WITH CONDITIONS**

1. Phase 0 activates immediately on constitutional adoption (Day 1)
2. MAHG-PMS pilots REV, ESC, GOV, PMO, and HR rule sets during Sprint 4
3. Phase 1 (workstream governance) begins Week 1 — no earlier
4. Phase 2 (metrics) begins after Phase 1 exit criteria are met
5. Phase 3 (optimization) begins after Phase 2 exit criteria are met
6. Governance overhead is measured after each phase — if overhead exceeds 2 hours/week, pause and reassess
7. Any rule that causes delivery slowdown without preventing a defect is flagged for retirement at next constitutional review

**Disposition:** AUDIT — adoption roadmap complete. 4 phases, MAHG-PMS pilot, measured overhead. Ready for your approval, Professor.
