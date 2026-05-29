---
name: retrospective
description: "Facilitate the sprint retrospective — a structured reflection on what went well,"
---
---

# Retrospective

Facilitate the sprint retrospective — a structured reflection on what went well,
what didn't, and what the team will change — driving continuous improvement
sprint after sprint.

## What problem this solves
Teams repeat the same mistakes sprint after sprint because they never stop to
reflect. The retrospective creates a safe, structured space to identify process
improvements, celebrate wins, and commit to concrete changes — transforming
experience into better ways of working.

## When to use
At the end of every sprint. After significant incidents (post-mortem). When
the team feels stuck or process friction is increasing.

## Input
Sprint metrics, completed tasks, blocker log, team feedback, standup notes.

## Output
```markdown
# Sprint Retrospective — Sprint 3
**Date:** June 9, 2026
**Sprint Goal:** User Management API with JWT authentication
**Outcome:** Goal met ✅ (all P0 tasks completed, 2 P1 tasks carried over)

## Sprint Metrics
| Metric | Planned | Actual | Variance |
|--------|---------|--------|----------|
| Story Points Committed | 53 | 48 delivered | -5 (9%) |
| Tasks Completed | 12 | 10 | -2 carried over |
| Velocity | 53 pts | 48 pts | Slight under-estimation |
| Bugs Found | — | 3 | 2 fixed, 1 deferred |
| Production Incidents | — | 0 | ✅ |
| Sprint Days | 10 | 10 | No overtime needed |

## What Went Well 🟢
1. **POST /users implementation** — Valentina completed 2 days ahead of estimate. Clean code, excellent test coverage (94%).
2. **Security review integration** — Diana reviewed code in parallel with development; caught JWT algorithm issue before merge, not after.
3. **CI/CD pipeline** — Isla's quality gates caught 2 issues before they reached dev branch. Zero broken builds on main.
4. **Documentation-first approach** — Priscila started API docs on Day 2 while endpoints were being built; docs were ready at launch, not after.

## What Could Be Improved 🟡
1. **Auth middleware estimation was off by 60%** — Estimated 5 pts, actually 8 pts. JWT refresh token logic was more complex than assumed.
2. **RBAC decision delayed 3 days** — The Data Professor was needed for role definition. We should flag decision dependencies earlier.
3. **Integration tests blocked on auth completion** — Teresa was idle for 2 days waiting for auth middleware. Should have mocked auth for initial integration tests.
4. **PR review bottleneck** — All PRs went through Valentina; review queue grew to 4 PRs waiting.

## Action Items (Committed Changes for Next Sprint)
| ID | Action | Owner | Deadline |
|----|--------|-------|----------|
| AI-01 | Add estimation buffer for auth/security tasks (+50% initial estimate) | Sonia | Sprint 4 planning |
| AI-02 | Flag all decision dependencies in sprint plan with 48h response SLA | Sonia | Sprint 4 planning |
| AI-03 | Mock auth for integration tests when auth is still in development | Teresa | Sprint 4 start |
| AI-04 | Distribute PR reviews: Diana reviews security PRs, Isla reviews infra PRs | Sonia | Sprint 4 start |

## Team Health Check
| Question | Score (1-5) | Trend |
|----------|------------|-------|
| Clarity of goals | 4 | ➡️ |
| Psychological safety | 4 | ⬆️ |
| Work-life balance | 4 | ➡️ |
| Tooling quality | 3 | ⬇️ (CI flaky 1 day) |
| Fun / motivation | 5 | ⬆️ |

## Experiments for Next Sprint
- **Experiment:** "No meeting Wednesdays" — deep work day with no standup or sync meetings
- **Hypothesis:** Will increase throughput by reducing context switching
- **Measure:** Compare Wednesday velocity vs. other days after 2 sprints
```

## Steps
1. Gather data: sprint metrics, completed/carried-over tasks, blocker log, feedback
2. Run the retrospective in three acts:
   - **What went well?** Celebrate wins, identify practices to keep
   - **What could be improved?** Surface friction, delays, communication gaps
   - **What will we change?** Commit to 1-3 concrete action items, not a wishlist
3. Use data, not feelings — "auth was slow" becomes "auth took 5 extra days because..."
4. Frame improvements as experiments — hypothesis, action, measurement
5. Limit action items to 3 max — more than 3 won't get done
6. Review previous retrospective's action items — did we actually do them?
7. Team health check: quick pulse on clarity, safety, balance, tools, motivation
8. Write retrospective to `.araya/plan/spec/retrospective-sprint-N.md`

## Rules
- Blame-free zone — focus on process, not people. "The process let us down" not "Valentina was slow"
- Data-driven, not anecdote-driven — every observation should have a metric or concrete example
- Action items must be owned and deadline-d — "do better at X" is not an action item
- Maximum 3 action items — more dilutes focus and guarantees nothing changes
- Review previous retrospective's action items at the start — accountability loop
- The retrospective is worthless if nothing changes next sprint — action items must be tracked
- Celebrate wins first — start positive to create psychological safety before criticism
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
