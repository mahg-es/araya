---
name: pm-status
description: "Generate sprint and project status reports with metrics, progress, blockers,"
---
---

# PM Status

Generate sprint and project status reports with metrics, progress, blockers,
and burndown — keeping The Data Professor and stakeholders informed.

## What problem this solves
Stakeholders (including The Data Professor) don't have time to read individual
task updates. This skill produces concise, metric-driven status reports that
answer three questions: where are we, what's blocking us, and are we on track?

## When to use
At sprint midpoint (check-in), sprint end (review), on demand when The Data
Professor asks "how's it going?", or when a blocker emerges that needs escalation.

## Input
Task board status, burndown data, blocker list, agent updates.

## Output
A status report in `.araya/plan/spec/status-report.md`:

```markdown
# Sprint Status Report — Sprint 3
**Date:** 2026-05-27 | **Sprint:** May 24 – Jun 6

## At a Glance
- **Sprint Goal:** User Management API with JWT auth
- **Progress:** 65% complete (on track ✅)
- **Velocity:** 28 pts committed / 18 pts delivered / 10 pts remaining
- **Burndown:** Ahead of schedule by 2 days
- **Blocker Count:** 1 (open) / 3 (resolved)

## Task Status
| Task | Points | Status | Agent | Notes |
|------|--------|--------|-------|-------|
| 1.1 Design Schema | 3 | ✅ Done | Bernabé | Migration file created |
| 1.2 POST /users | 5 | ✅ Done | Valentina | Tests passing |
| 1.3 GET /users/:id | 3 | 🔄 In Progress | Valentina | 80% done |
| 1.4 Auth Middleware | 5 | 🔄 In Progress | Valentina | JWT validation works; RBAC next |
| 1.5 Rate Limiting | 3 | ⏳ Not Started | Diana | Blocked by 1.4 |
| 1.6 API Docs | 2 | ⏳ Not Started | Priscila | Waiting on 1.3 + 1.4 |

## Blockers
| ID | Blocker | Impact | Owner | Status |
|----|---------|--------|-------|--------|
| B-01 | RBAC role definition unclear | Blocks 1.4 completion | The Data Professor | AWAITING DECISION |

## Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Story Points Delivered | 18 | 28 | 🟡 64% |
| Tests Passing | 42/42 | 100% | 🟢 |
| Coverage | 87% | 80% | 🟢 |
| Security Findings (open) | 0 | 0 | 🟢 |
| Sprint Days Remaining | 5 | — | — |

## Next Steps
1. Resolve RBAC blocker — needs The Data Professor decision [1][2][3]
2. Valentina to complete 1.3 by EOD tomorrow
3. Diana to start 1.5 once 1.4 unblocked
4. Sprint review scheduled for Jun 6
```

## Steps
1. Gather data: task board, burndown chart, blocker list
2. Calculate metrics: completion %, velocity, burndown trend
3. Categorize status: On Track 🟢 / At Risk 🟡 / Off Track 🔴
4. Focus on blockers — they're what The Data Professor needs to act on
5. Include decision requests as numbered options [1][2][3]
6. Keep it concise — one page, scannable, metrics up top
7. Write to `.araya/plan/spec/status-report.md`

## Rules
- Blockers go to the top — if The Data Professor reads nothing else, they should see blockers
- Every status must be evidence-based: "on track" because burndown shows ahead, not because it feels good
- Red status (Off Track) requires a recovery plan in the same report
- Velocity is a trailing indicator — use burndown for current sprint health
- Decision requests must be numbered and offer concrete options
- Report frequency: weekly minimum; daily if in red status or final sprint week
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
