# ARAYA Mandatory Review Matrix

**Designer:** R. Daneel Olivaw
**Artifact ID:** review-matrix-001
**Created:** 2026-05-31 17:30 +0200
**Scope:** MAHG-PMS platform capabilities

---

## Review Domains

| Domain | Reviews for | Can block |
|--------|-------------|:---------:|
| **Security** | RBAC, auth, data access, secrets, injection, isolation, CSP, dependency safety | ✅ |
| **Identity** | SSO, user lifecycle, credential management, role provisioning, session security | ✅ |
| **Architecture** | API design, data model, component architecture, service boundaries, technology choices | ✅ |
| **UX & Accessibility** | Navigation, breadcrumbs, responsive design, WCAG AA, user flow, empty states | ❌ |
| **Economics** | Pricing, billing, commissions, plan enforcement, usage metering, profitability methodology | ✅ |
| **Governance** | Constitutional compliance, artifact standards, branch policy, DoD, traceability | ✅ |
| **AI** | Model routing, AI citations, agent behavior, prompt safety, token efficiency | ❌ |
| **Platform** | Deployability, scalability, monitoring, backup, TLS, networking, containerization | ✅ |
| **Quality** | Test coverage, acceptance criteria validation, regression, UAT completeness | ❌ |

---

## Capability Review Matrix

### Legend
- 🔴 **Blocker** — must review and approve. Cannot proceed without sign-off.
- 🟡 **Required** — must review. Can note findings but cannot block.
- ⚪ **Advisory** — consult if relevant. Optional.

---

### 1. Provider Onboarding
_Registration, email verification, plan selection, Authelia integration_

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Security | 🔴 Blocker | Password hashing, verification token safety, Authelia user injection |
| Identity | 🔴 Blocker | User lifecycle, role assignment (pms-provider-admin), session handling |
| Economics | 🔴 Blocker | Plan selection flow, trial activation, pricing display, EUR enforcement |
| UX & Accessibility | 🟡 Required | Registration form accessibility, error states, empty states, mobile |
| Governance | 🟡 Required | ART-002 naming, DOC-005 timestamps, traceability |
| Quality | 🟡 Required | Registration tests, verification tests, plan selection tests |

---

### 2. Consultant Onboarding
_Invitation, assignment to tenant, lifecycle (active/suspended), role scoping_

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Security | 🔴 Blocker | Cross-provider data access prevention, suspended consultant access revocation |
| Identity | 🔴 Blocker | Consultant role provisioning, provider_id in auth principal, credential lifecycle |
| Architecture | 🔴 Blocker | ConsultantAssignment model, provider-scoped queries, foreign key integrity |
| UX & Accessibility | 🟡 Required | Onboarding flow, empty state CTAs, sidebar behavior, breadcrumbs |
| Governance | 🟡 Required | Lifecycle status enforcement, audit trail |

---

### 3. RBAC & Permissions

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Security | 🔴 Blocker | Role hierarchy integrity, privilege escalation paths, least-privilege enforcement |
| Identity | 🔴 Blocker | Remote-User/Remote-Groups header trust, Authelia group mapping, session expiry |
| Architecture | 🔴 Blocker | require_role() implementation, middleware chain, role resolution logic |
| Governance | 🟡 Required | Role definitions match constitutional separation of duties |
| Quality | 🟡 Required | Auth enforcement tests (401/403/200), role hierarchy tests |

---

### 4. Billing & Payments

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Economics | 🔴 Blocker | Plan pricing accuracy, overage calculation, commission rate, EUR default |
| Security | 🔴 Blocker | Stripe webhook signature validation, payment data handling, PCI scope |
| Platform | 🔴 Blocker | Stripe API key management, webhook endpoint availability, mock mode fallback |
| Governance | 🟡 Required | Commercial policy alignment, billing event audit trail |
| Quality | 🟡 Required | Checkout flow tests, webhook tests, mock mode tests |

---

### 5. AI Routing & Chat

| Domain | Level | What to Review |
|--------|:----:|----------------|
| AI | 🔴 Blocker | Citation enforcement, agent behavior boundaries, prompt injection resistance |
| Security | 🔴 Blocker | No autonomous governance changes, no data exfiltration, rate limiting |
| Economics | 🟡 Required | Token usage metering, cost attribution per tenant/provider |
| Architecture | 🟡 Required | LLMRouter abstraction, fallback chain, provider-agnostic design |
| Governance | 🟡 Required | Agent permissions compliance, read-only chat enforcement |

---

### 6. Provider Management (CRUD)

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Architecture | 🔴 Blocker | Provider model integrity, tenant relationship, commission entry lifecycle |
| Security | 🟡 Required | Provider-scoped queries, cross-provider access prevention |
| Identity | 🟡 Required | Provider admin role assignment consistency |
| Quality | 🟡 Required | CRUD operation tests, isolation tests |

---

### 7. Tenant Management (CRUD, Isolation)

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Architecture | 🔴 Blocker | Tenant model integrity, provider_id FK, transfer workflow, model ownership |
| Security | 🔴 Blocker | Tenant isolation (data, API, UI), cross-tenant access prevention, tenant scoping |
| Identity | 🟡 Required | Tenant role assignment, provider-tenant ownership validation |
| Quality | 🟡 Required | Tenant CRUD tests, isolation tests, transfer workflow tests |

---

### 8. Stage Zero Import

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Architecture | 🔴 Blocker | Staged input schema, validation pipeline, incremental import diff |
| Security | 🟡 Required | File upload safety, path traversal prevention, input validation |
| Platform | 🟡 Required | Storage requirements, snapshot size limits, import performance |
| Economics | 🟡 Required | Import usage metering, billing event generation |
| Quality | 🟡 Required | CSV/JSON import tests, validation tests, incremental import tests |

---

### 9. Model Execution (ABC Calculation)

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Economics | 🔴 Blocker | Profitability methodology correctness, cost behavior, overhead allocation, TRUE PROFIT |
| Architecture | 🔴 Blocker | Calculation engine integrity, graph freeze, formula expansion, execution diagnostics |
| AI | 🟡 Required | AI persona auto-routing, citation generation for analytical agents |
| Quality | 🟡 Required | Calculation service tests, execution engine tests, formula tests |

---

### 10. Whale Curve & Lineage

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Economics | 🔴 Blocker | Whale Curve methodology, profitability lineage correctness, validation guard |
| UX & Accessibility | 🟡 Required | Visualization clarity, D3.js rendering, accessibility of charts |
| Quality | 🟡 Required | Whale Curve tests, lineage service tests, visualization tests |

---

### 11. Platform UI (Navigation, Components)

| Domain | Level | What to Review |
|--------|:----:|----------------|
| UX & Accessibility | 🔴 Blocker | WCAG AA compliance, breadcrumb universality, responsive design, keyboard navigation |
| Architecture | 🟡 Required | Component reuse, template inheritance, macro architecture, no inline scripts |
| Security | 🟡 Required | Security-aware navigation, role-filtered menus, CSP headers |
| Governance | 🟡 Required | Engineering Excellence Standard (ENG-004) compliance |

---

### 12. Deployment & Infrastructure

| Domain | Level | What to Review |
|--------|:----:|----------------|
| Platform | 🔴 Blocker | Docker compose validity, network isolation, TLS configuration, backup schedule |
| Security | 🔴 Blocker | Port exposure, secret management, Traefik middleware chain, SSH hardening |
| Governance | 🟡 Required | Environment parity (dev/staging/production), deployment playbook currency |

---

## Summary Matrix

| Capability | Security | Identity | Architecture | UX | Economics | Governance | AI | Platform | Quality |
|-----------|:--------:|:--------:|:------------:|:--:|:---------:|:----------:|:--:|:--------:|:-------:|
| Provider Onboarding | 🔴 | 🔴 | ⚪ | 🟡 | 🔴 | 🟡 | ⚪ | ⚪ | 🟡 |
| Consultant Onboarding | 🔴 | 🔴 | 🔴 | 🟡 | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |
| RBAC & Permissions | 🔴 | 🔴 | 🔴 | ⚪ | ⚪ | 🟡 | ⚪ | ⚪ | 🟡 |
| Billing & Payments | 🔴 | ⚪ | ⚪ | ⚪ | 🔴 | 🟡 | ⚪ | 🔴 | 🟡 |
| AI Routing & Chat | 🔴 | ⚪ | 🟡 | ⚪ | 🟡 | 🟡 | 🔴 | ⚪ | ⚪ |
| Provider Management | 🟡 | 🟡 | 🔴 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🟡 |
| Tenant Management | 🔴 | 🟡 | 🔴 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | 🟡 |
| Stage Zero Import | 🟡 | ⚪ | 🔴 | ⚪ | 🟡 | ⚪ | ⚪ | 🟡 | 🟡 |
| Model Execution | ⚪ | ⚪ | 🔴 | ⚪ | 🔴 | ⚪ | 🟡 | ⚪ | 🟡 |
| Whale Curve | ⚪ | ⚪ | ⚪ | 🟡 | 🔴 | ⚪ | ⚪ | ⚪ | 🟡 |
| Platform UI | 🟡 | ⚪ | 🟡 | 🔴 | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |
| Deployment | 🔴 | ⚪ | ⚪ | ⚪ | ⚪ | 🟡 | ⚪ | 🔴 | ⚪ |

---

## Blocking Reviewers per Capability

| Capability | Must approve before implementation |
|-----------|-----------------------------------|
| Provider Onboarding | Security + Identity + Economics |
| Consultant Onboarding | Security + Identity + Architecture |
| RBAC & Permissions | Security + Identity + Architecture |
| Billing & Payments | Security + Economics + Platform |
| AI Routing & Chat | Security + AI |
| Provider Management | Architecture |
| Tenant Management | Security + Architecture |
| Stage Zero Import | Architecture |
| Model Execution | Economics + Architecture |
| Whale Curve | Economics |
| Platform UI | UX & Accessibility |
| Deployment | Security + Platform |

---

## Process

1. **Before implementation starts** → Blocker reviewers must be notified
2. **During implementation** → Required reviewers may be consulted
3. **Before UAT** → All blocker reviewers must sign off
4. **After UAT** → Quality review of acceptance criteria coverage

**No capability proceeds to UAT with unresolved blocker findings.**

---

**Disposition:** AUDIT — review matrix established. 12 capabilities, 9 review domains, clear blocking authority. Ready for your fifth request, Professor.
