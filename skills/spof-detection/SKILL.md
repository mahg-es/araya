---
name: spof-detection
description: "ARAYA Single Point of Failure detection — identify organizational risks where one agent is the sole holder of a critical capability."
---

# Single Point of Failure Detection

Scan the organizational capability registry to identify single points
of failure: capabilities held by exactly one agent where loss of that
agent would create a critical gap. Generate risk-ranked SPOF reports
with mitigation recommendations.

## What problem this solves

When a critical skill is owned by a single agent, the organization is
one departure away from a capability gap. SPOF detection finds these
vulnerabilities before they become delivery blockers.

## When to Use

- Before any major delivery cycle
- When an agent role changes
- During quarterly workforce risk review
- When assessing organizational bus factor

## SPOF Report Format

```markdown
# SPOF Analysis — SPOF-YYYY-NNN

## Critical SPOFs (single agent, no backup)
| Skill | Sole Agent | Domain | Risk | Impact |
|-------|-----------|--------|------|--------|

## High-Risk SPOFs (single agent, critical domain)
...

## Recommendations
- Cross-train: add [skill] to [agent]
- Hire: [agent] with [skills]
- Document: capture [skill] as golden trajectory
```

## Input

- Capability registry (agents, skills, assignments)
- Domain criticality ratings
- Agent availability projections

## Output

- SPOF register with risk-ranked entries
- Mitigation recommendations (cross-train, hire, document)
- Bus factor score per domain

## Steps

1. Load capability registry with all agent-to-skill assignments
2. For each skill, count distinct assigned agents
3. Flag skills with count = 1 as SPOF candidates
4. Assess risk: domain criticality × agent uniqueness
5. Rank SPOFs by risk score (critical → low)
6. Generate mitigation recommendations
7. Present to The Data Professor

## Done Criteria

- [ ] All single-agent skills identified
- [ ] Risk ranking complete
- [ ] Mitigation recommendations provided
- [ ] SPOF register written to `.araya/organization/spof-register.md`
