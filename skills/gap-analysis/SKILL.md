---
name: gap-analysis
description: "Generate Gap Analysis Reports (GAR) — detect missing capabilities, skills, agents, and recommend remediation."
---

# Gap Analysis Report (GAR)

Detect organizational capability gaps and generate remediation recommendations.

## What problem this solves

Capability gaps block deliveries. Without proactive detection, gaps are
discovered mid-execution when it's too late.

## When to Use

- Before any major delivery
- When a new domain is needed
- When a task has no qualified agent

## GAR Format

```markdown
# Gap Analysis Report — GAR-YYYY-NNN

## Detected Gaps
| Gap ID | Missing Capability | Impact | Severity |
|--------|-------------------|--------|----------|
| GAP-001 | [capability] | [what's blocked] | Critical/High/Medium |

## Recommendations
[A] Extend agent [name] with skills [list]
[B] Create new skills: [list]
[C] Hire new agent: [name] as [role] with [skills]

## Impact Assessment
- Affected domains: ...
- Blocked deliveries: ...
- Timeline risk: ...
```

## Steps

1. Compare required capabilities against registry
2. Identify gaps: capability with no owning agent
3. Assess impact: what's blocked, severity
4. Recommend: extend/hire/create
5. Present to The Data Professor as numbered options [1][2][3]

## Done Criteria

- [ ] All capability gaps detected
- [ ] Impact assessed per gap
- [ ] Recommendations provided
- [ ] Presented for approval
