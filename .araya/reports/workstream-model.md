# ARAYA Permanent Workstream Model

**Designer:** R. Daneel Olivaw
**Artifact ID:** workstream-model-001
**Created:** 2026-05-31 17:00 +0200
**Scope:** Permanent organizational structure for ARAYA and all governed projects

---

## Design Principles

1. **One accountable owner per workstream** — no shared accountability
2. **Clear boundaries** — no domain belongs to two workstreams
3. **Scalable** — works for 1 project or 100
4. **Compatible with ARAYA** — supports /araya run, subagent delegation, constitutional governance

---

## Workstream Map

```
                    ┌──────────────────┐
                    │  PRODUCT         │
                    │  DIRECTION       │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ SECURITY &  │  │ DELIVERY    │  │ PEOPLE &    │
    │ IDENTITY    │  │ MANAGEMENT  │  │ PROCESS     │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │
           ▼                ▼                ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │ PLATFORM    │  │ ARCHITECTURE│  │ KNOWLEDGE & │
    │ ENGINEERING │  │             │  │ LEARNING    │
    └──────┬──────┘  └──────┬──────┘  └─────────────┘
           │                │
           ▼                ▼
    ┌─────────────────────────────────────────┐
    │           SOFTWARE ENGINEERING           │
    │  (Backend / Frontend / Data / AI)        │
    └────────────────────┬────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────┐
    │           QUALITY ENGINEERING            │
    │        (Governance + Execution)          │
    └────────────────────┬────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────┐
    │         BUSINESS OPERATIONS              │
    │  (FinOps / Brand / Content / BI)         │
    └─────────────────────────────────────────┘
```

---

## Workstream 1: Product Direction

| Attribute | Detail |
|-----------|--------|
| **Mission** | Define what gets built, in what order, and what "done" means |
| **Classification** | Critical |
| **Accountable** | Product Owner |

### Responsibilities
- Product vision and strategy
- Requirements definition and acceptance criteria
- Backlog management and prioritization
- Roadmap ownership
- Release scope decisions
- Trade-off authority (speed vs quality, scope vs time)
- Stakeholder communication

### Required Specialists
- Product Owner (decision authority)
- Domain experts (profitability, education, content — consultative)

### Inputs
- Customer needs, market signals, business strategy
- Delivery feedback (what worked, what didn't)
- Quality metrics (test results, coverage, bugs)

### Outputs
- Approved requirements with acceptance criteria
- Prioritized backlog
- Release scope decisions
- GO / NO-GO decisions

### Quality Gates
- Every requirement has acceptance criteria
- Every backlog item has business value rationale
- No implementation without approved requirements

### Escalation Path
- Product Owner → The Data Professor (strategic)
- Product Owner → Security (if security conflict)
- Product Owner → Delivery Management (if capacity conflict)

---

## Workstream 2: Delivery Management

| Attribute | Detail |
|-----------|--------|
| **Mission** | Turn approved requirements into delivered, validated work |
| **Classification** | Critical |
| **Accountable** | Delivery Manager (PM) |

### Responsibilities
- Sprint and release planning
- Task decomposition and estimation
- Dependency analysis and critical path
- Risk identification and mitigation
- Agent delegation and workload balancing
- Status reporting and visibility
- Delivery gate enforcement
- Impediment removal

### Required Specialists
- Delivery Manager (orchestration)
- Scrum Master (process discipline, retrospectives)

### Inputs
- Approved requirements from Product Direction
- Capacity and capability data from People & Process
- Architecture decisions from Architecture
- Quality standards from Quality Engineering

### Outputs
- Execution plans with assignments
- Status reports and dashboards
- Risk registers and mitigation plans
- Delivery evidence and traceability
- Handoff documentation

### Quality Gates
- Every task has an assigned agent
- Dependencies are mapped before execution
- Parallel work is conflict-checked
- Status is visible to stakeholders

### Escalation Path
- Delivery Manager → Product Owner (scope/priority)
- Delivery Manager → Security (security blockers)
- Delivery Manager → Platform Engineering (infrastructure blockers)
- Delivery Manager → People & Process (capability gaps)

---

## Workstream 3: Security & Identity

| Attribute | Detail |
|-----------|--------|
| **Mission** | Protect the organization, its platforms, its data, and its users |
| **Classification** | Critical |
| **Accountable** | Security Lead |

### Responsibilities
- Threat modeling and risk assessment
- Secure architecture review
- Secure code review and SAST
- Penetration testing
- Secrets management
- Dependency vulnerability scanning
- Compliance assessment (GDPR, SOC2 readiness)
- Incident response (security incidents)
- Identity architecture (auth, SSO, RBAC)
- Access auditing

### Required Specialists
- Security Lead (governance, strategy)
- Identity Specialist (auth architecture, RBAC design)

### Inputs
- Architecture proposals from Architecture
- Implementation plans from Software Engineering
- Deployment plans from Platform Engineering
- Incident reports

### Outputs
- Threat models and risk assessments
- Security review findings
- Vulnerability reports
- Compliance status
- Identity architecture decisions
- Incident response procedures

### Quality Gates
- Security review required for architecture changes
- Secrets never committed
- Dependencies scanned before release
- RBAC enforced at all layers

### Escalation Path
- Security Lead → Delivery Management (blocking security findings)
- Security Lead → Product Owner (risk acceptance decisions)
- Security Lead → The Data Professor (critical vulnerabilities)

---

## Workstream 4: Platform Engineering

| Attribute | Detail |
|-----------|--------|
| **Mission** | Provide reliable, secure, observable, and cost-effective computing environments |
| **Classification** | Critical |
| **Accountable** | Platform Lead |

### Responsibilities
- Infrastructure provisioning (cloud, VMs, containers)
- CI/CD pipeline design and maintenance
- Deployment automation
- Networking, DNS, TLS
- Monitoring and observability (metrics, logs, alerts)
- Backup and disaster recovery
- Environment management (dev, staging, production)
- Cost optimization (FinOps coordination)
- Release deployment execution

### Required Specialists
- Platform Lead (infrastructure, Docker, networking)
- FinOps Specialist (cost analysis — consultative)

### Inputs
- Architecture decisions from Architecture
- Deployment requirements from Software Engineering
- Security requirements from Security & Identity
- Release plans from Delivery Management

### Outputs
- Provisioned infrastructure
- CI/CD pipelines
- Deployment playbooks
- Monitoring dashboards and alerts
- Backup schedules and verification
- Cost reports

### Quality Gates
- Infrastructure as Code — no manual provisioning
- Deployments are automated and repeatable
- Monitoring covers all critical services
- Backups are scheduled and verified
- TLS enforced for all public endpoints

### Escalation Path
- Platform Lead → Security (infrastructure vulnerabilities)
- Platform Lead → Delivery Management (deployment blockers)
- Platform Lead → FinOps (cost exceptions)

---

## Workstream 5: Architecture

| Attribute | Detail |
|-----------|--------|
| **Mission** | Design and govern technical systems for consistency, scalability, and maintainability |
| **Classification** | Critical |
| **Accountable** | Architecture Lead (rotates per domain: backend, frontend, data) |

### Responsibilities
- System design and technology selection
- API design governance
- Database schema governance
- Component architecture governance
- Data architecture governance
- Architecture Decision Records (ADRs)
- Technical standards enforcement
- Architecture review for all material changes

### Required Specialists
- Backend Architect
- Frontend Architect
- Data Architect

### Inputs
- Product requirements from Product Direction
- Implementation feedback from Software Engineering
- Security requirements from Security & Identity
- Platform constraints from Platform Engineering

### Outputs
- Architecture Decision Records
- System design documents
- API specifications
- Database schemas
- Component architecture specifications
- Technical standards

### Quality Gates
- ADR required for architectural decisions
- API designs reviewed before implementation
- Schema changes reviewed before migration
- Architecture review for all material changes

### Escalation Path
- Architecture Lead → Product Owner (technology constraints)
- Architecture Lead → Security (security implications)
- Architecture Lead → Platform Engineering (infrastructure implications)

---

## Workstream 6: Software Engineering

| Attribute | Detail |
|-----------|--------|
| **Mission** | Build working, maintainable, tested software |
| **Classification** | Important |
| **Accountable** | Engineering Lead (rotates per domain) |

### Responsibilities
- Feature implementation
- Bug fixing
- Code review participation
- Unit and integration test writing
- Technical debt management
- Performance optimization
- Code documentation

### Required Specialists
- Backend Developer
- Frontend Developer
- Data Engineer
- AI/ML Engineer
- Static Site Engineer

### Inputs
- Approved requirements from Product Direction
- Architecture decisions from Architecture
- Test specifications from Quality Engineering
- Deployment configuration from Platform Engineering

### Outputs
- Working, tested code
- Code review feedback
- Technical documentation
- Build artifacts

### Quality Gates
- All code follows Engineering Excellence Standard (ENG-004)
- Tests pass before merge
- Code review completed before merge
- No duplication without justification
- Security patterns followed

### Escalation Path
- Engineering Lead → Architecture (design questions)
- Engineering Lead → Quality Engineering (test failures)
- Engineering Lead → Delivery Management (blockers)

---

## Workstream 7: Quality Engineering

| Attribute | Detail |
|-----------|--------|
| **Mission** | Verify that delivered work meets acceptance criteria and quality standards |
| **Classification** | Critical |
| **Accountable** | Quality Lead (governance) + Quality Engineer (execution) — separation of duties |

### Responsibilities
- Test strategy and planning
- Test case generation from acceptance criteria
- Test execution (unit, integration, regression, performance)
- Coverage analysis and gap identification
- UAT package generation and review
- TDD/BDD process enforcement
- Quality metrics and reporting
- Delivery approval/rejection (governance)

### Required Specialists
- Quality Lead (strategy, governance, approval)
- Quality Engineer (execution, test generation, test running)

### Inputs
- Acceptance criteria from Product Direction
- Implementation from Software Engineering
- Architecture decisions from Architecture
- Release plans from Delivery Management

### Outputs
- Test plans and test cases
- Test execution results (pass/fail/skip)
- Coverage reports
- UAT packages
- Quality dashboards
- Delivery approval/rejection decisions

### Quality Gates
- Tests generated from acceptance criteria, not code
- Full suite runs before release
- Coverage meets threshold
- UAT package complete before delivery
- Separation of duties: executor ≠ approver

### Escalation Path
- Quality Lead → Delivery Management (quality blocks)
- Quality Lead → Product Owner (acceptance criteria gaps)
- Quality Engineer → Quality Lead (execution issues)

---

## Workstream 8: Knowledge & Learning

| Attribute | Detail |
|-----------|--------|
| **Mission** | Preserve institutional knowledge and enable continuous learning |
| **Classification** | Important |
| **Accountable** | Knowledge Lead |

### Responsibilities
- Documentation creation and maintenance
- Architecture Decision Record stewardship
- Knowledge graph maintenance
- Organizational learning capture (lessons, trajectories)
- Training material development
- Educational program design
- Onboarding content
- Daily knowledge capture

### Required Specialists
- Knowledge Lead (stewardship, graph, learning)
- Technical Writer (documentation, ADRs, books)
- Educational Designer (training, labs, curriculum)

### Inputs
- Decisions and changes from all workstreams
- Delivery outcomes from Delivery Management
- Architecture decisions from Architecture

### Outputs
- Documentation (READMEs, guides, references)
- ADR catalog
- Knowledge graph
- Training materials
- Learning paths
- Onboarding guides

### Quality Gates
- Documentation updated with code changes
- ADRs created for architectural decisions
- Lessons captured from each delivery
- Timestamps on all documents (DOC-005)
- Artifact naming follows convention (ART-002)

### Escalation Path
- Knowledge Lead → Delivery Management (documentation gaps)
- Knowledge Lead → Architecture (ADR requirements)

---

## Workstream 9: Business Operations

| Attribute | Detail |
|-----------|--------|
| **Mission** | Support business functions, financial health, brand, and market presence |
| **Classification** | Important |
| **Accountable** | Business Operations Lead |

### Responsibilities
- Cloud and infrastructure cost management
- Budget forecasting and tracking
- Brand governance and compliance
- Content strategy and publishing
- Business intelligence and analytics
- Profitability methodology (for MAHG-PMS)
- Revenue model validation

### Required Specialists
- FinOps Specialist
- Brand Lead
- Content Strategist
- BI & Analytics Lead
- Profitability Domain Expert

### Inputs
- Usage data from Platform Engineering
- Product direction from Product Direction
- Market signals

### Outputs
- Cost reports and forecasts
- Brand guidelines and audits
- Content calendar and publications
- BI dashboards and reports
- Profitability models and analysis

### Quality Gates
- Brand compliance checked before publication
- Costs tracked and forecasted
- Profitability models validated

### Escalation Path
- Business Operations Lead → Product Owner (strategic)
- Business Operations Lead → Platform Engineering (cost issues)

---

## Workstream 10: People & Process

| Attribute | Detail |
|-----------|--------|
| **Mission** | Develop people, improve processes, and ensure organizational health |
| **Classification** | Important |
| **Accountable** | People & Process Lead |

### Responsibilities
- Workforce planning and capability management
- Agent hiring, onboarding, and development
- Skill gap analysis and remediation
- Scrum and agile process facilitation
- Sprint rituals (standups, planning, retrospectives)
- Velocity tracking and forecasting
- Organizational excellence (anticipate, align, sharpen)
- Definition of Done enforcement
- Process improvement

### Required Specialists
- People & Process Lead (workforce, capabilities)
- Scrum Master (rituals, velocity, DoD)
- Organizational Excellence (continuous improvement)

### Inputs
- Capability demands from Delivery Management
- Skill requirements from Architecture and Engineering
- Process feedback from all workstreams

### Outputs
- Capability registry and gap analysis
- Hiring recommendations
- Onboarding programs
- Sprint metrics and velocity reports
- Process improvement proposals
- Organizational excellence reports

### Quality Gates
- Every project has required capability coverage
- Single points of failure identified
- Retrospectives conducted per sprint
- DoD enforced per delivery

### Escalation Path
- People & Process Lead → Delivery Management (capability gaps)
- People & Process Lead → Product Owner (resource priorities)

---

## Workstream Summary

| # | Workstream | Classification | Domains Covered |
|---|-----------|:------------:|-----------------|
| 1 | Product Direction | Critical | 1 |
| 2 | Delivery Management | Critical | 2 |
| 3 | Security & Identity | Critical | 3 |
| 4 | Platform Engineering | Critical | 4 |
| 5 | Architecture | Critical | 3 |
| 6 | Software Engineering | Important | 5 |
| 7 | Quality Engineering | Critical | 2 |
| 8 | Knowledge & Learning | Important | 3 |
| 9 | Business Operations | Important | 5 |
| 10 | People & Process | Important | 3 |

**Total: 10 workstreams covering 31 domains.**

---

## Dependency Map

```
Product Direction ──→ Delivery Management ──→ Software Engineering ──→ Quality Engineering
       │                      │                        │
       │                      ▼                        ▼
       │              People & Process          Business Operations
       │                                              
       ▼                                              
   Architecture ──→ Platform Engineering
       │
       ▼
   Security & Identity ──→ (all workstreams)
       
   Knowledge & Learning ──→ (observes all, serves all)
```

---

**Disposition:** AUDIT — permanent workstream model designed. 10 workstreams, 31 domains, clear accountability boundaries, no overlapping ownership. Ready for agent assignment in your fourth request, Professor.
