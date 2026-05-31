# ARAYA & MAHG-PMS — Permanent Domain Ownership Map

**Auditor:** R. Daneel Olivaw
**Artifact ID:** domain-map-001
**Created:** 2026-05-31 16:45 +0200
**Scope:** ARAYA framework + MAHG-PMS platform

---

## Domain Classification

| Domain | Classification | Current Owner | Gap |
|--------|:------------:|---------------|-----|
| Product Ownership | Critical | Manu | ✅ |
| Delivery Orchestration | Critical | Sonia | ✅ |
| Security | Critical | Diana | ✅ |
| Identity & Auth | Critical | — | 🔴 |
| Backend Architecture | Critical | Aisha | ✅ |
| Frontend Architecture | Critical | Lin | ✅ |
| Infrastructure & Platform | Critical | Isla | ✅ |
| Data Architecture | Critical | Junia | ✅ |
| Quality Assurance | Critical | Priya (gov) + Clara (exec) | ✅ |
| Release Management | Critical | — | 🔴 |
| Incident Response | Critical | — | 🔴 |
| Backend Development | Important | Valentina | ✅ |
| Frontend Development | Important | Alejandra | ✅ |
| Data Engineering | Important | Bernabé | ✅ |
| AI/ML Engineering | Important | María | ✅ |
| FinOps | Important | Mateo | ✅ |
| Profitability Methodology | Important | Lidia | ✅ |
| Content & Publishing | Important | Lucas | ✅ |
| Brand Governance | Important | Dorcas | ✅ |
| Education & Training | Important | Eunice | ✅ |
| BI & Analytics | Important | Pablo | ✅ |
| Static Sites | Important | Aquila | ✅ |
| Documentation | Important | Priscila | ✅ |
| Knowledge Management | Important | Esteban | ✅ |
| Workforce & HR | Important | Aurora | ✅ |
| Scrum & Process | Important | Elena | ✅ |
| Monitoring & Observability | Important | Isla (partial) | 🟡 |
| Backup & Disaster Recovery | Important | — | 🟡 |
| Customer Success | Optional | — | 🟡 |
| Technical Debt | Optional | — | 🟡 |
| UX Research | Optional | — | 🟡 |
| AI Governance | Optional | — | 🟡 |
| Legal & Compliance | Optional | — | 🟡 |

---

## 1. Critical Domains (Must Have Permanent Ownership)

---

### 1.1 Product Ownership

**Purpose:** Define what gets built, in what order, and what "done" means.

**Scope:** Vision, requirements, acceptance criteria, backlog, roadmap, release scope.

**Dependencies:** Delivery orchestration, all development domains, QA.

**Risk if unowned:** Everything built is unvalidated. No gate between request and implementation. Scope drift without accountability.

**Owner profile:** Senior decision-maker. Understands business value, user needs, and technical feasibility. Authority to say no. Manu.

---

### 1.2 Delivery Orchestration

**Purpose:** Turn approved requirements into delivered, validated work.

**Scope:** Planning, decomposition, dependency analysis, risk management, delegation, status reporting, delivery gates.

**Dependencies:** Product ownership, all execution domains, QA, release management.

**Risk if unowned:** Work happens without coordination. Parallel conflicts. Missed dependencies. No delivery predictability.

**Owner profile:** Organized, systematic, communication-focused. Sees the whole before the parts. Sonia.

---

### 1.3 Security

**Purpose:** Protect the organization, its platforms, its data, and its users.

**Scope:** Threat modeling, secure architecture, secure code review, penetration testing, compliance, secrets management, dependency auditing, incident response coordination.

**Dependencies:** All development domains, infrastructure, identity.

**Risk if unowned:** Vulnerabilities undetected. Secrets exposed. Attacks unmitigated. Compliance violations. Reputational damage.

**Owner profile:** Paranoid by profession. Thinks in attack vectors. Understands defense in depth. Diana.

---

### 1.4 Identity & Authentication

**Purpose:** Ensure that the right people access the right resources with the right permissions.

**Scope:** Authentication providers, SSO, RBAC, API authorization, session management, credential lifecycle, access auditing.

**Dependencies:** Security, infrastructure, all platform domains.

**Risk if unowned:** Unauthorized access. Credential leaks. No audit trail. Role escalation. Cross-tenant data exposure.

**Owner profile:** Understands OAuth/OIDC, RBAC models, forward auth, and session security. Currently split between infrastructure (Authelia) and application (security.py). Needs unified ownership.

**Current state:** 🔴 No single owner. Authelia owned by infrastructure. App RBAC owned by backend. No identity architect.

---

### 1.5 Infrastructure & Platform

**Purpose:** Provide reliable, secure, cost-effective computing environments.

**Scope:** Cloud/VM provisioning, Docker, Kubernetes, networking, TLS, DNS, CI/CD pipelines, environment configuration, deployment automation.

**Dependencies:** Security, identity, all development domains.

**Risk if unowned:** No deployment. No scaling. No recovery. Manual everything. Single-machine dependency.

**Owner profile:** Understands containers, networking, cloud providers, and deployment automation. Isla.

---

### 1.6 Release Management

**Purpose:** Ensure that releases are planned, validated, deployed, and recoverable.

**Scope:** Release calendar, version management, deployment gates, rollback procedures, release notes, artifact promotion across environments.

**Dependencies:** Delivery orchestration, QA, infrastructure, all development domains.

**Risk if unowned:** Uncontrolled releases. No rollback capability. Version conflicts. Staging/production divergence. Branch chaos.

**Owner profile:** Process-disciplined. Understands Git flow, CI/CD, and deployment risk. Currently performed ad-hoc by Daneel. Needs formal ownership.

**Current state:** 🔴 No owner.

---

### 1.7 Incident Response

**Purpose:** Detect, respond to, resolve, and learn from operational incidents.

**Scope:** Alerting, escalation, diagnosis, resolution, post-mortem, preventive measures.

**Dependencies:** Monitoring, infrastructure, security, all platform domains.

**Risk if unowned:** Outages undetected. No escalation path. No post-incident learning. Repeated failures.

**Owner profile:** Calm under pressure. Systematic diagnostician. Currently no owner for non-security incidents.

**Current state:** 🔴 No owner. Security incidents → Diana. Operational incidents → nobody.

---

### 1.8 Backend Architecture

**Purpose:** Design and govern backend systems, APIs, and data flows.

**Scope:** API design, service boundaries, database schema, caching, messaging, error handling patterns.

**Dependencies:** Product ownership, security, infrastructure, data architecture.

**Risk if unowned:** Inconsistent APIs. Service sprawl. Performance degradation. Integration failures.

**Owner profile:** Understands distributed systems, API design, and data modeling. Aisha.

---

### 1.9 Frontend Architecture

**Purpose:** Design and govern user-facing systems and interaction patterns.

**Scope:** Component architecture, design systems, accessibility, performance, state management, responsive design.

**Dependencies:** Product ownership, UX, backend architecture.

**Risk if unowned:** Inconsistent UI. Inaccessible interfaces. Performance problems. Design fragmentation.

**Owner profile:** Understands component design, accessibility standards, and frontend performance. Lin.

---

### 1.10 Data Architecture

**Purpose:** Design and govern data storage, processing, and governance.

**Scope:** Data modeling, lakehouse architecture, ETL/ELT, data quality, data governance, medallion architecture.

**Dependencies:** Infrastructure, security, backend architecture.

**Risk if unowned:** Data silos. Inconsistent schemas. Quality degradation. Compliance failures.

**Owner profile:** Understands data modeling, pipeline design, and governance frameworks. Junia.

---

### 1.11 Quality Assurance

**Purpose:** Verify that delivered work meets acceptance criteria and quality standards.

**Scope:** Test strategy, test execution, coverage analysis, regression guarding, UAT, performance testing.

**Dependencies:** Product ownership, all development domains, release management.

**Risk if unowned:** Untested releases. Regression failures. Customer-facing bugs. Quality erosion.

**Owner profile:** Governance: strategic, standards-focused. Execution: thorough, automated, evidence-driven. Priya (gov) + Clara (exec). ✅ Separation of duties.

---

## 2. Important Domains (Should Have Ownership)

| Domain | Owner | Risk if unowned |
|--------|-------|-----------------|
| Backend Development | Valentina | No implementation |
| Frontend Development | Alejandra | No UI delivery |
| Data Engineering | Bernabé | No pipeline delivery |
| AI/ML Engineering | María | No AI feature delivery |
| FinOps | Mateo | Uncontrolled cloud costs |
| Profitability Methodology | Lidia | Incorrect financial models |
| Content & Publishing | Lucas | No public presence |
| Brand Governance | Dorcas | Brand inconsistency |
| Education & Training | Eunice | No learning materials |
| BI & Analytics | Pablo | No data insights |
| Static Sites | Aquila | No web presence |
| Documentation | Priscila | Outdated docs |
| Knowledge Management | Esteban | Lost institutional knowledge |
| Workforce & HR | Aurora | Skill gaps, no hiring |
| Scrum & Process | Elena | No process discipline |
| Monitoring | Isla (partial) 🟡 | Blind to system health |
| Backup & DR | — 🟡 | No disaster recovery |

---

## 3. Optional Domains (Nice to Have)

| Domain | Why optional | Why still valuable |
|--------|-------------|-------------------|
| Customer Success | Current stage: pre-revenue pilot | Post-revenue, this becomes Critical |
| Technical Debt | ENG-004 covers it partially | Dedicated tracking prevents erosion |
| UX Research | Lin covers accessibility | Dedicated UX improves product-market fit |
| AI Governance | María covers AI deployment | Dedicated governance for AI safety/ethics |
| Legal & Compliance | Diana covers security compliance | Regulatory requirements scale with revenue |

---

## 4. Critical Gaps (No Owner)

| # | Domain | Classification | Impact |
|---|--------|:------------:|--------|
| 1 | **Release Management** | Critical | Releases happen ad-hoc via Daneel. No process, no automation, no rollback. |
| 2 | **Incident Response** | Critical | Operational incidents have no owner. Security incidents → Diana only. |
| 3 | **Identity & Authentication** | Critical | Split between infrastructure and application. No unified identity architecture. |
| 4 | **Backup & Disaster Recovery** | Important | Manual backups exist. No owner, no schedule, no verification, no DR plan. |
| 5 | **Monitoring & Observability** | Important | Infrastructure configured but empty. No runtime metrics, no alerting. |

---

## 5. Recommendations

1. **Assign release management** — formalize who owns releases (or automate fully)
2. **Assign incident response** — separate security incidents (Diana) from operational incidents (new or existing)
3. **Unify identity ownership** — single owner for Authelia + app RBAC + auth patterns
4. **Activate monitoring** — Isla already owns infra; add runtime metrics and alerting
5. **Assign backup/DR** — formal ownership before first production deployment

---

**Disposition:** AUDIT — domain map established. 5 critical gaps requiring ownership decisions. Ready for your third request, Professor.
