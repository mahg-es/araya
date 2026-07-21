---
name: pm-decompose
description: "Break a large task or feature into smaller, independently deliverable subtasks with"
---
---

# PM Decompose

Break a large task or feature into smaller, independently deliverable subtasks with
clear dependencies and acceptance criteria.

## What problem this solves
Large tasks ("Build the API") are impossible to estimate, assign, or track. This
skill applies Work Breakdown Structure (WBS) methodology to produce granular,
independently testable subtasks that can be assigned and completed in one session.

## When to use
When a task is too large to estimate, when a feature spans multiple domains,
or when The Data Professor describes something at too high a level.

## Input
A large task description or feature request in natural language.

## Output
A decomposition tree:
```
Task: Build User Management API
├── 1.1 [P0] Design user schema (Bernabé/Mateo) — 3 pts
│   Depends on: nothing
│   Done when: schema DDL reviewed by Junia, migration file created
├── 1.2 [P0] Implement POST /users (Valentina) — 5 pts
│   Depends on: 1.1
│   Done when: endpoint returns 201, validation works, tests pass
├── 1.3 [P1] Implement GET /users/:id (Valentina) — 3 pts
│   Depends on: 1.2
│   Done when: endpoint returns 200 with user object, 404 for missing
├── 1.4 [P1] Add authentication middleware (Valentina) — 5 pts
│   Depends on: 1.2
│   Done when: JWT validation, role-based access, 401 for no token
├── 1.5 [P2] API rate limiting (Diana) — 3 pts
│   Depends on: 1.2
│   Done when: 429 after threshold, configurable limits
└── 1.6 [P2] OpenAPI documentation (Priscila) — 2 pts
    Depends on: 1.3, 1.4
    Done when: Swagger UI renders, all endpoints documented
```

## Steps
1. Read the task description and identify all nouns (entities) and verbs (actions)
2. Group related work into sub-tasks — each should deliver one capability
3. For each subtask, define: priority (P0-P3), assignee (agent), estimate, dependencies, done criteria
4. Draw the dependency tree — leaf tasks first, dependent tasks later
5. Flag cross-cutting concerns: security (Diana), testing (Teresa), docs (Priscila)
6. Validate: can each subtask be completed independently? If not, decompose further
7. Present decomposition as numbered options to The Data Professor for approval

## Rules
- Every subtask must be completable in one session by its assigned agent
- No subtask larger than 8 story points — if it is, decompose again
- Dependencies must form a DAG — no cycles allowed
- Cross-cutting tasks (security review, testing, docs) must be explicit subtasks, not afterthoughts
- Done criteria must be binary — either done or not, no "partially done"
- If you're uncertain about technical scope, consult the domain specialist agent before finalizing
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
