---
name: organizational-health
description: "ARAYA organizational health monitoring — aggregate coverage scores, risk indicators, skill freshness, and workforce balance metrics."
---

# Organizational Health Monitoring

Monitor and report the overall health of the ARAYA organization through
composite metrics covering capability coverage, workforce balance, skill
freshness, SPOF density, and delegation effectiveness.

## What problem this solves

Organizations decay silently. Skills become stale, SPOFs accumulate,
coverage gaps widen. Without a health dashboard, leadership operates
on intuition rather than data. This skill provides the quantitative
pulse of organizational fitness.

## When to Use

- Monthly organizational health review
- Before board-level or The Data Professor briefings
- After major organizational changes (hiring, retirement, restructuring)
- When delivery quality trends downward

## Health Metrics

| Metric | What It Measures | Healthy Range |
|--------|-----------------|---------------|
| Coverage Score | % of required capabilities with ≥1 agent | ≥ 90% |
| SPOF Density | % of skills held by a single agent | ≤ 15% |
| Skill Freshness | % of skills reviewed in last 6 months | ≥ 80% |
| Workforce Balance | StdDev of skills per agent | Low variance |
| Delegation Coverage | % of commands with clear agent routing | 100% |
| Bare Agent Ratio | % of agents with only AX skills | ≤ 10% |
| Domain Balance | Skills per domain distribution | No domain < 3 skills |

## Health Report Format

```markdown
# Organizational Health Report — OH-YYYY-MM

## Overall Health Score: 87/100 🟢

| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Coverage Score | 94% | ≥90% | 🟢 |
| SPOF Density | 12% | ≤15% | 🟢 |
| Skill Freshness | 78% | ≥80% | 🟡 |
| Workforce Balance | σ=4.2 | Low | 🟢 |
| Delegation Coverage | 96% | 100% | 🟡 |
| Bare Agent Ratio | 7% | ≤10% | 🟢 |
| Domain Balance | 3 gaps | 0 | 🔴 |

## Top Risks
1. SPOF: diana/secrets — single point of failure in security domain
2. Freshness: 6 skills not reviewed in >12 months
3. Domain Balance: 3 domains under-resourced

## Recommendations
...
```

## Input

- Capability registry (agents, skills, assignments)
- SPOF register
- Skills lifecycle states
- Command delegation mappings
- Delivery quality metrics (from Sonia)

## Output

- Organizational health report with composite scores
- Trend analysis (improving/degrading per metric)
- Top-N risk items with mitigation recommendations
- Recommended actions for CHRO

## Steps

1. Collect data from registry, SPOF register, lifecycle states
2. Compute each health metric
3. Compare against thresholds (🟢 🟡 🔴)
4. Compute composite health score
5. Identify top risks and trends
6. Generate actionable recommendations
7. Write health report

## Done Criteria

- [ ] All 7 health metrics computed
- [ ] Threshold comparison complete
- [ ] Composite score calculated
- [ ] Top risks identified with recommendations
- [ ] Health report written to `.araya/organization/health-reports/`
