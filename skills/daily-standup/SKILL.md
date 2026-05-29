---
name: daily-standup
description: "Facilitate the daily standup — a 15-minute sync where agents report what they"
---
---

# Daily Standup

Facilitate the daily standup — a 15-minute sync where agents report what they
completed yesterday, what they plan today, and what's blocking them. Keeps the
team aligned and blockers visible.

## What problem this solves
Without daily sync, work diverges, blockers fester, and the PM doesn't know
who's stuck until it's too late. The daily standup surfaces problems within
24 hours, not at sprint review.

## When to use
Every working day. When the sprint is active. When The Data Professor asks
"what's the team working on?"

## Input
Previous day's standup notes, task board status, agent status updates.

## Output
```markdown
# Daily Standup — 2026-05-28 (Sprint Day 4)

## Sprint Progress
- **Goal:** User Management API with JWT auth
- **Progress:** 65% complete (on track 🟢)
- **Days Remaining:** 6

## Agent Updates

### Valentina — Backend Developer
- **Yesterday:** Completed POST /users endpoint with validation. 42 tests passing.
- **Today:** Implementing GET /users/:id and starting auth middleware.
- **Blockers:** None.
- **Needs Help:** RBAC role definition — needs decision from The Data Professor.

### Teresa — QA Engineer
- **Yesterday:** Generated unit tests for user validation. Coverage at 87%.
- **Today:** Integration tests for user CRUD endpoints.
- **Blockers:** Waiting on auth middleware to test authenticated endpoints.

### Diana — Cybersecurity Specialist
- **Yesterday:** Completed security review of POST /users. Found 0 critical issues.
- **Today:** Reviewing password reset flow. Setting up secrets rotation.
- **Blockers:** None.

### Isla — Infra Architect
- **Yesterday:** Docker Compose updated with health checks. CI pipeline green.
- **Today:** Setting up staging environment for integration tests.
- **Blockers:** AWS sandbox account pending approval.

## Blockers Requiring Attention
| ID | Blocker | Impact | Owner | Status |
|----|---------|--------|-------|--------|
| B-01 | RBAC role definition unclear | Blocks auth middleware completion | The Data Professor | ⚠️ AWAITING since 5/26 |
| B-02 | AWS sandbox account pending | Blocks staging environment | The Data Professor | 🟡 Pending approval |

## Action Items
- [ ] The Data Professor: Define RBAC roles [1] Admin, User [2] Admin, Manager, User [3] Custom
- [ ] The Data Professor: Approve AWS sandbox request
- [ ] Sonia: Update sprint plan if RBAC delays auth middleware
- [ ] Valentina: Start GET /users/:id while waiting on RBAC decision
```

## Steps
1. Review yesterday's standup notes and completed tasks
2. Check task board for status changes (Done, In Progress, Blocked)
3. For each active agent, capture:
   - What did you complete yesterday?
   - What are you working on today?
   - What's blocking you? (If anything)
   - Do you need help from anyone?
4. Aggregate blockers — prioritize by impact and age
5. Identify action items — who needs to do what to unblock the team
6. Present blockers requiring The Data Professor's decision as numbered options [1][2][3]
7. Write to `.araya/plan/spec/standup-YYYY-MM-DD.md`

## Rules
- 15 minutes max — if it takes longer, you're solving problems, not reporting status
- Focus on blockers — they're the only thing The Data Professor needs to act on
- Blockers older than 24 hours must be escalated
- Yesterday's plan vs. today's reality reveals estimation accuracy — Sonia uses this for sprint health
- Not every agent reports every day — only those active on the sprint
- Standup notes are reference material for status reports and retrospectives
- If an agent is blocked for 2+ days without escalation, that's a process failure
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
