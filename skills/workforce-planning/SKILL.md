---
name: workforce-planning
description: "ARAYA workforce planning — project future skill needs, recommend agent hiring/retirement, manage organizational capacity."
---

# Workforce Planning

Plan organizational capacity, project skill needs, and recommend hiring
or retirement decisions to maintain capability coverage.

## What problem this solves

Without workforce planning, the organization reacts to gaps instead of
preventing them. This skill proactively ensures ARAYA has the right agents
with the right skills before they're needed.

## When to Use

- When roadmap shows new domains
- When a capability gap is detected
- When an agent is over-assigned

## Workforce Plan Format

```markdown
# Workforce Plan — WP-YYYY-QN

## Current State
- Agents: 25
- Skills: 113
- Domains covered: 12

## Future Needs
| Domain | Required Capability | Timeline | Current Coverage | Gap |
|--------|-------------------|----------|-----------------|-----|

## Recommendations
- Hire: [agent] as [role] for [domain]
- Extend: add [skills] to [agent]
- Retire: [agent] — capability now covered by [other agent]
```

## Steps

1. Review capability registry for current coverage
2. Project future needs from roadmap
3. Detect gaps: required capability with no owner
4. Recommend hiring, extension, or retirement
5. Present to The Data Professor as numbered options [1][2][3]

## Done Criteria

- [ ] Current state documented
- [ ] Future needs projected
- [ ] Gaps detected
- [ ] Recommendations provided
