---
name: pm-dependencies
description: "Map task dependencies as a Directed Acyclic Graph (DAG), identify the critical path,"
---
---

# PM Dependencies

Map task dependencies as a Directed Acyclic Graph (DAG), identify the critical path,
and flag circular dependencies before they block execution.

## What problem this solves
Projects stall when tasks start before their dependencies are done or when circular
dependencies create deadlocks. This skill analyzes the task backlog, builds a
dependency graph, identifies the critical path, and pinpoints dependency risks
so Sonia can sequence work correctly.

## When to use
After task decomposition (`pm-decompose`) and before sprint planning (`pm-plan`).
Also when a task unexpectedly blocks or when The Data Professor asks "what's blocking this?"

## Input
Task list with declared dependencies from `pm-decompose` output.

## Output
A dependency graph in `.araya/plan/spec/dependencies.md`:

```markdown
# Task Dependencies: User Management API

## Critical Path (total: 18 story points)
1.1 Design Schema (3 pts) → 1.2 POST /users (5 pts) → 1.4 Auth Middleware (5 pts) → 1.6 API Docs (2 pts) → 1.3 GET /users/:id (3 pts)

## Dependency Graph
1.1 ──► 1.2 ──┬──► 1.4 ──► 1.6
              │
              ├──► 1.3 ──► 1.6
              │
              └──► 1.5

## Risk Analysis
| Risk | Tasks Affected | Impact | Mitigation |
|------|---------------|--------|------------|
| 1.2 delayed | 1.3, 1.4, 1.5, 1.6 | Blocks 4 tasks | Parallelize 1.3 & 1.4 once 1.2 done |
| 1.1 blocked | All downstream | Blocks everything | Can mock schema for parallel development |

## Parallelization Opportunities
- 1.3 (GET /users) and 1.5 (Rate Limiting) can run in parallel after 1.2
- 1.6 (Docs) can start with placeholders while 1.3 and 1.4 complete
```

## Steps
1. Read the decomposed task list from `pm-decompose` output
2. For each task, identify its declared dependencies
3. Build a DAG: nodes = tasks, edges = "must complete before"
4. Detect cycles — if found, flag as blocking and propose resolution
5. Calculate the critical path: longest chain from root to leaf
6. Identify parallelization opportunities: tasks at same depth with no shared dependency
7. Calculate risk: which tasks have the most downstream dependencies?
8. Write to `.araya/plan/spec/dependencies.md`
9. Share with Sonia for `pm-plan` integration

## Rules
- Dependencies must form a DAG — cycles are invalid and must be broken
- The critical path determines minimum project duration — protect it
- Tasks with > 3 downstream dependencies are high-risk — assign most experienced agent
- Parallelization only where tasks are truly independent (no shared state, no shared resources)
- If dependency logic is unclear, ask the domain agent: "Does Task B really need Task A to complete first?"
- Cross-agent dependencies (Valentina depends on Isla) require explicit handoff coordination
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
