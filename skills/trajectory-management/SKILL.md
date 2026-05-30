---
name: trajectory-management
description: "ARAYA golden trajectory management — capture, validate, promote, and reuse successful delivery patterns."
---

# Golden Trajectories

Capture successful delivery patterns and reuse them across projects.
Transform one-time success into repeatable organizational learning.

## Trajectory Lifecycle

```
Candidate → Validated → Golden → Archived
```

## Promotion Criteria (ALL must pass)

| Criterion | Threshold |
|-----------|-----------|
| Validation Coverage | ≥ 95% |
| Traceability Coverage | 100% |
| Constitutional Violations | 0 |
| Delivery Health | GREEN |
| Critical Security Findings | 0 |
| Acceptance Rate | ≥ 95% |

## Commands

- `/araya trajectory` — summary of golden and candidate trajectories
- `/araya trajectory --list` — list all trajectories
- `/araya trajectory --search "<term>"` — search by task, agent, or skill
- `/araya trajectory --recommend "<task>"` — recommend proven patterns for new task
- `/araya improve` — analyze trajectories and recommend process improvements

## Done Criteria

- [ ] Successful deliveries captured as candidate trajectories
- [ ] Promotion criteria validated before golden status
- [ ] Patterns extracted and preserved
- [ ] Recommendations available for new tasks
