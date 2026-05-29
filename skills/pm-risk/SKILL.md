---
name: pm-risk
description: "Identify, assess, and plan mitigation for project risks before they become"
---
---

# PM Risk

Identify, assess, and plan mitigation for project risks before they become
blockers. Covers technical, schedule, resource, and dependency risks.

## What problem this solves
Risks that are identified early can be mitigated for free. Risks discovered
mid-project cost 10x to fix. This skill systematically surfaces risks across
four dimensions — technical, schedule, resource, dependency — and produces
actionable mitigation plans.

## When to use
During sprint planning, after dependency mapping, when a new technology is
introduced, or when The Data Professor asks "what could go wrong?"

## Input
Project plan, dependency graph, team composition, technology choices.

## Output
A risk register in `.araya/plan/spec/risk-register.md`:

```markdown
# Risk Register: User Management API

| ID | Category | Risk | Likelihood | Impact | Score | Mitigation | Owner | Status |
|----|----------|------|-----------|--------|-------|-------------|-------|--------|
| R-01 | Technical | PostgreSQL connection pool exhaustion under load | Medium | High | 8 | Connection pooling (PgBouncer), load test before launch | Isla | Open |
| R-02 | Schedule | Auth middleware takes longer than estimated (5 pts → 8 pts) | High | Medium | 12 | Spike 1 day on auth; if > 5 pts, split into 2 tasks | Sonia | Open |
| R-03 | Resource | Diana unavailable for security review during sprint | Low | Critical | 6 | Pre-schedule review window; Valentina can do initial review | Sonia | Open |
| R-04 | Dependency | Email service API changes during development | Medium | Medium | 6 | Abstract email behind interface; mock in tests | Valentina | Open |

## Risk Matrix
                  Impact
              Low   Med   High  Critical
Likelihood
High           4     8     12     16
Medium         3     6      9     12
Low            2     4      6      8

Score ≥ 12: Critical — immediate mitigation required
Score 8-9: High — mitigation in current sprint
Score 4-6: Medium — monitor, mitigate if capacity allows
Score < 4: Low — accept or monitor

## Burn-Down
- Sprint start: 4 risks (score sum: 32)
- Current: 2 risks resolved, 2 open (score sum: 14)
- Trend: ↓ improving
```

## Steps
1. Review project plan, dependency graph, and technology choices
2. Brainstorm risks across four categories:
   - **Technical**: architecture, tech debt, integration, performance, security
   - **Schedule**: estimation errors, scope creep, delays
   - **Resource**: agent availability, skill gaps, knowledge silos
   - **Dependency**: external APIs, third-party libraries, cross-team handoffs
3. Rate each risk: Likelihood (High/Medium/Low) × Impact (Critical/High/Medium/Low)
4. Calculate risk score (matrix multiplication)
5. For each risk score ≥ 8, define concrete mitigation with owner
6. Track risk burn-down across sprints
7. Write to `.araya/plan/spec/risk-register.md`

## Rules
- Every risk must have an owner — unnamed risks become unmanaged risks
- Score ≥ 12: must be presented to The Data Professor as numbered options [1][2][3]
- Mitigation must be actionable, not aspirational: "monitor" is not mitigation
- Re-assess risks at sprint boundaries — likelihood and impact change over time
- Include at least one security risk (consult Diana) and one infrastructure risk (consult Isla)
- Risk register is a living document — update when new information emerges
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
