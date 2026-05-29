---
name: impediment
description: "Identify, track, and remove blockers — anything preventing an agent from"
---
---

# Impediment

Identify, track, and remove blockers — anything preventing an agent from
completing their work. Escalate decisively and follow through until the
blocker is resolved.

## What problem this solves
Blockers that aren't actively managed fester. A 1-hour blocker on Monday
becomes a 3-day delay by Wednesday if no one escalates. This skill tracks
every blocker from identification to resolution, escalating aggressively
when blockers age beyond their SLA.

## When to use
When any agent reports a blocker in standup. When dependencies are delayed.
When external decisions are needed. When infrastructure or tools are broken.

## Input
Blocker report from agent, context about what's blocked, who can resolve it.

## Output
```markdown
# Blocker Log — Sprint 3

## Active Blockers

### BLK-03: RBAC role definition unclear
- **Reported:** 2026-05-26 by Valentina
- **Age:** 3 days 🔴 (SLA: 48 hours — OVERDUE)
- **Severity:** Critical — blocks auth middleware (8 pts)
- **Impact:** Valentina cannot complete 1.4 Auth Middleware or 1.5 RBAC
- **Affected Tasks:** 1.4 (8 pts), 1.5 (5 pts) — 13 pts total at risk
- **Who Can Resolve:** The Data Professor (architecture decision)
- **Escalation History:**
  - Day 1: Flagged in standup
  - Day 2: Reminder in standup, DM to The Data Professor
  - Day 3: ESCALATED — sprint goal at risk, needs immediate decision
- **Proposed Resolution Options:**
  [1] Admin + User roles (simplest)
  [2] Admin + Manager + User (moderate)
  [3] Custom role hierarchy (define now)
- **Status:** 🔴 ESCALATED — awaiting decision

---

### BLK-04: AWS sandbox account pending
- **Reported:** 2026-05-27 by Isla
- **Age:** 1 day 🟡
- **Severity:** High — blocks staging environment setup
- **Impact:** Isla cannot set up staging environment for integration tests
- **Affected Tasks:** 1.7 Integration tests (Teresa can't run against real environment)
- **Who Can Resolve:** The Data Professor (account approval)
- **Status:** 🟡 Pending approval

## Resolved This Sprint
| ID | Blocker | Reported | Resolved | Duration | Resolution |
|----|---------|----------|----------|----------|------------|
| BLK-01 | PostgreSQL connection refused in Docker | May 24 | May 24 | 2 hours | Health check race condition — added `depends_on` with healthcheck |
| BLK-02 | JWT secret not configured in CI | May 25 | May 25 | 1 hour | Added JWT_SECRET to GitHub Secrets |

## Blocker Metrics
| Metric | Current |
|--------|---------|
| Active Blockers | 2 |
| Avg Resolution Time | 1.5 hours |
| Escalated Blockers | 1 |
| Blockers > 48h | 1 🔴 |
| Sprint Impact (pts at risk) | 13 / 53 (25%) |

## Trend (Last 3 Sprints)
| Sprint | Blockers | Avg Age | Escalations |
|--------|----------|---------|-------------|
| Sprint 1 | 6 | 4.2h | 2 |
| Sprint 2 | 4 | 3.1h | 1 |
| Sprint 3 | 4 (2 active) | — | 1 (so far) |
⬇️ Trend: Fewer blockers, faster resolution — process improving
```

## Steps
1. When a blocker is reported, create a blocker record immediately
2. Assess severity: Critical (blocks sprint goal), High (blocks P1 task), Medium (blocks P2), Low (inconvenience)
3. Identify who can resolve it — if the resolver is outside the team, escalate immediately
4. Track age: < 4h 🟢, 4-24h 🟡, 24-48h 🟠, > 48h 🔴
5. Escalate per SLA:
   - Critical: escalate within 4 hours
   - High: escalate within 24 hours
   - Medium: escalate within 48 hours
6. When escalating, propose resolution options as numbered choices [1][2][3]
7. Update daily in standup — blockers are the first and most important item

## Rules
- Every blocker gets a record — no oral blockers that disappear from memory
- Critical blockers escalate within 4 hours — sprint goal is at stake
- Escalation must include proposed solutions — never just "tell me what to do"
- If a blocker is waiting on The Data Professor, provide numbered options [1][2][3]
- Blockers > 48 hours trigger automatic escalation to Sonia and The Data Professor
- Remove the blocker, not the task — never drop a task to "resolve" a blocker
- After resolution, add to "resolved" log with duration — builds evidence for process improvement
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
