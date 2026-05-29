---
name: pm-plan
description: "Plan a sprint or project phase: scope, estimation, sequencing, and resource assignment."
---
---

# PM Plan

Plan a sprint or project phase: scope, estimation, sequencing, and resource assignment.

## What problem this solves
Teams start projects without clear scope, estimates, or task ordering. This skill
produces a structured sprint plan with prioritized tasks, effort estimates, and
agent assignments so work begins with alignment.

## When to use
At the start of any project or sprint. Also re-invoke when scope changes
significantly or a new phase begins.

## Input
Project vision (`specs/vision.md`) or a task backlog in natural language.

## Output
A sprint plan document containing:
- **Sprint Goal**: One sentence — what success looks like at sprint end
- **Task Backlog**: Prioritized task list (P0 → P3)
- **Estimates**: Story points or T-shirt sizes per task
- **Assignments**: Which agent(s) own each task
- **Dependencies**: Blocking relationships between tasks
- **Definition of Done**: What "done" means for each task type
- **Timeline**: Target completion per task with buffer

## Steps
1. Review the project vision or backlog context
2. Decompose large tasks into sprint-sized chunks (delegate to `/skill:pm-decompose` if needed)
3. Estimate effort — ask agents for input on tasks in their domain
4. Identify dependencies — what must finish before what can start
5. Map dependencies as a DAG (invoke `/skill:pm-dependencies` if complex)
6. Assign tasks to agents based on skill match and availability
7. Define the Definition of Done for each task type
8. Present the sprint plan to The Data Professor as numbered options [1][2][3] for approval
9. Write plan to `.araya/plan/spec/sprint-plan.md`

## Rules
- Every task must have exactly ONE owner — shared ownership means no ownership
- P0 tasks must be independent where possible — avoid dependency chains at top priority
- Estimates must come from the agent who will do the work, not from PM assumptions
- Buffer 20% of sprint capacity for unknowns, blockers, and context switching
- The Definition of Done must be testable — "code reviewed" is not testable; "PR merged with 2 approvals and passing CI" is
- If a task is too big to estimate, it needs decomposition first
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
