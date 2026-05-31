# ARAYA Organizational Maturity Roadmap

**Designer:** R. Daneel Olivaw
**Artifact ID:** roadmap-maturity-001
**Created:** 2026-05-31 17:45 +0200
**Scope:** ARAYA organizational transformation
**Current State:** Level 2 — Managed (agent-based delivery)
**Target State:** Level 4 — Quantitatively Managed (domain-owned delivery)

---

## Current State Assessment

| Attribute | Today |
|-----------|-------|
| Maturity level | 2 — Managed |
| Delivery model | Agent-based (26 individual specialists) |
| Governance | 100 rules defined, branch governance enforced, rest manual |
| Ownership | 19 domains owned, 5 critical gaps |
| Structure | Flat agent roster, no workstream hierarchy |
| Enforcement | Memory-dependent, not automated |
| Context injection | Manual (agents don't auto-read project state) |
| Releases | Manual (Daneel does versioning and releases) |

---

## Phase 1: Stabilize — Close Critical Gaps

**Duration:** 1 week
**Objective:** No unowned critical domains. Every critical function has an accountable owner.

### Governance Changes

| Change | Detail |
|--------|--------|
| Assign Release Management | Formal owner for versioning, releases, deployment gates |
| Assign Incident Response | Separate security (Diana) from operational (new/existing) |
| Unify Identity Ownership | Single owner for Authelia + app RBAC + auth patterns |
| Formalize escalation paths | Agent → Lead → Program Director → The Data Professor |

### Organizational Changes

| Change | Detail |
|--------|--------|
| Clara onboarding | QA Engineer active in delivery cycles |
| Release Manager role | New or assigned from existing agents |
| Identity Architect role | New or unified from infrastructure/security |
| Elena gains tactical authority | Task decomposition, sprint status, primary sprint planning |

### Success Metrics

| Metric | Current | Target |
|--------|:------:|:------:|
| Critical domains unowned | 5 | **0** |
| Release process | Ad-hoc (Daneel) | **Owned by Release Manager** |
| Incident response coverage | Security only | **Security + Operations** |
| Identity architecture | Split (2 owners) | **Unified (1 owner)** |
| Escalation paths tested | 0 | **Documented and communicated** |

### Risks

| Risk | Mitigation |
|------|-----------|
| New roles overload existing agents | Backfill with new agents if needed |
| Identity unification creates conflict | Architecture review before consolidation |

### Exit Criteria

- [ ] 0 unowned critical domains
- [ ] Release Manager assigned and active
- [ ] Incident response owner assigned
- [ ] Identity architecture under single ownership
- [ ] Escalation paths documented in agent charters

---

## Phase 2: Structure — Implement Workstream Model

**Duration:** 2 weeks
**Objective:** Organization operates through workstreams, not individual agents. Sonia transitions to Program Director.

### Governance Changes

| Change | Detail |
|--------|--------|
| Workstream model activated | 10 workstreams with accountable leads |
| Review matrix enforced | Blocker reviews mandatory before UAT |
| Sonia elevated | PM Head Orchestrator → Program Director & PMO Head |
| Sonia gains governance authority | Block delivery, override scope, escalate |
| Quality gates per workstream | Defined, documented, enforced |

### Organizational Changes

| Change | Detail |
|--------|--------|
| 10 workstream leads assigned | One accountable owner per workstream |
| Sonia transitions tactical work | pm-decompose, ai-routing, autonomous-execution → Elena/automation |
| Review matrix operational | 12 capabilities have defined blocker reviewers |
| Workstream reporting cadence | Weekly per-workstream status to Program Director |
| Separation of duties activated | QA executor ≠ QA approver, Architecture ≠ Implementation |

### Success Metrics

| Metric | Current | Target |
|--------|:------:|:------:|
| Workstreams with assigned leads | 0 | **10** |
| Capabilities with review coverage | 0 | **12** |
| Sonia tactical time | 70% | **<20%** |
| Delivery reviews with blocker sign-off | 0% | **100%** |
| Cross-workstream dependencies mapped | None | **All critical paths** |

### Risks

| Risk | Mitigation |
|------|-----------|
| Workstream leads resist accountability | Clear authority model; Sonia escalates |
| Review matrix slows delivery | Blocker-only reviews; advisory reviews are optional |
| Transition confusion during mahg-pms Sprint 4 | Phase 2 runs parallel to production deployment |

### Exit Criteria

- [ ] All 10 workstreams have assigned leads
- [ ] Review matrix activated for mahg-pms capabilities
- [ ] Sonia operating as Program Director (verified by time allocation)
- [ ] First delivery completed with full review chain
- [ ] Workstream reporting cadence established
- [ ] Separation of duties verified (QA, Architecture, Security)

---

## Phase 3: Automate — Enforce Governance Automatically

**Duration:** 2 weeks
**Objective:** Governance rules enforced by automation, not memory. Context injected automatically.

### Governance Changes

| Change | Detail |
|--------|--------|
| Automated context injection | Every agent receives project context at session start |
| Pre-commit governance hooks | ART-002 naming, DOC-005 timestamps, BRANCH-002 main protection |
| CI governance gates | Tests, coverage, security scan, artifact validation |
| Automated release pipeline | Version bump, changelog, tag, release — one command |
| Delegation visibility | `/araya delegation` shows active work and agent assignments |
| Run records automated | Every delegation creates a run record in `.araya/runs/` |

### Organizational Changes

| Change | Detail |
|--------|--------|
| ARAYA CI/CD pipeline | ARAYA tests itself before release |
| Monitoring activated | Prometheus + Grafana + Loki instrumented |
| Backup automation | Scheduled, verified, owned |
| Delegation audit trail | Who delegated to whom, when, for what |

### Success Metrics

| Metric | Current | Target |
|--------|:------:|:------:|
| Governance rules auto-enforced | ~5% (branch only) | **>80%** |
| Context injection coverage | 0% (manual) | **100%** (automatic) |
| Release automation | 0% (manual) | **100%** (one command) |
| Monitoring coverage | 0% (empty) | **100%** (all critical services) |
| Delegation visibility | 0% (blind) | **100%** (visible) |

### Risks

| Risk | Mitigation |
|------|-----------|
| Automation over-engineering | Start with highest-impact rules (naming, timestamps, tests) |
| CI pipeline complexity | Use existing GitHub Actions patterns from mahg-pms |
| Monitoring noise | Start with critical alerts only |

### Exit Criteria

- [ ] Context injected automatically for all agents
- [ ] Pre-commit hooks active for naming and timestamps
- [ ] CI pipeline validates tests + coverage + security before merge
- [ ] `/araya release` performs full release cycle
- [ ] `/araya delegation` shows active work
- [ ] Run records created for every delegation
- [ ] Monitoring dashboards active for critical services

---

## Phase 4: Optimize — Continuous Self-Improvement

**Duration:** Ongoing
**Objective:** ARAYA operates as a learning organization. The excellence loop runs continuously.

### Governance Changes

| Change | Detail |
|--------|--------|
| Organizational excellence loop active | anticipate → align → prioritize → harmonize → understand → roundtable → sharpen |
| Periodic reviews automated | Weekly, monthly, quarterly cadence |
| Skills evolution | New skills proposed, obsolete skills retired |
| Agent evolution | New agents hired, roles adjusted, promotions executed |
| Constitutional evolution | Rules reviewed, added, and retired based on evidence |
| Cross-project learning | Lessons from mahg-pms applied to mahg-certified-professional and vice versa |

### Organizational Changes

| Change | Detail |
|--------|--------|
| `/araya anticipate` | Weekly risk and drift detection |
| `/araya sharpen --scope skills` | Quarterly skills review |
| `/araya sharpen --scope agents` | Quarterly agent roster review |
| `/araya sharpen --scope governance` | Monthly governance review |
| `/araya roundtable` | Per-delivery collaborative review |
| Trajectory management | Golden trajectories promoted, learned from, reused |

### Success Metrics

| Metric | Current | Target |
|--------|:------:|:------:|
| Organizational maturity level | 2 | **4 — Quantitatively Managed** |
| Excellence loop frequency | Never run | **Weekly anticipation, monthly governance, quarterly skills** |
| Golden trajectories | 1 | **Growing catalog** |
| Constitutional rule churn | Rules added, none retired | **Balanced: added, retired, and improved** |
| Cross-project knowledge transfer | None | **Active** |

### Risks

| Risk | Mitigation |
|------|-----------|
| Excellence loop becomes bureaucracy | Keep reviews focused, time-boxed, actionable |
| Metrics without action | Every metric has an owner and a threshold for action |
| Continuous change fatigue | Stabilize between phases; don't change everything at once |

### Exit Criteria (Phase 4 is ongoing — these are health indicators)

- [ ] Organizational excellence loop runs on schedule
- [ ] Average time from risk detection to mitigation < 1 week
- [ ] Constitutional rules are actively maintained (add, retire, improve)
- [ ] Agent roster evolves based on capability data
- [ ] Golden trajectories are reusable across projects
- [ ] Maturity level reaches 4

---

## Summary

| Phase | Duration | Focus | Key Outcome |
|-------|:------:|-------|-------------|
| 1 — Stabilize | 1 week | Close critical gaps | 0 unowned domains |
| 2 — Structure | 2 weeks | Workstream model + Sonia transition | Domain-owned delivery |
| 3 — Automate | 2 weeks | Governance enforcement | Rules enforced, not remembered |
| 4 — Optimize | Ongoing | Continuous improvement | Learning organization |

### Total: 5 weeks to Level 3, ongoing to Level 4

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ (continuous)
Week 1      Week 2-3     Week 4-5     Week 6+
Stabilize   Structure    Automate     Optimize
```

---

**Disposition:** AUDIT — roadmap established. 4 phases, 5 weeks to Level 3, continuous path to Level 4. Ready for your sixth request, Professor.
