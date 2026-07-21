---
name: autonomous-execution
description: "Reduce manual intervention — autonomous natural language execution triggers, delegation observability, and run persistence."
---

# Autonomous Execution

ARAYA execution should start from natural language, not commands. Delegation
progress is visible during execution. Every run persists for audit. This skill
defines the autonomous execution layer — triggers, observability, and persistence.

## What problem this solves

ARAYA agents are capable but require explicit `/araya run` commands. The
Professor must type commands to start workflows. Execution is invisible until
complete. Failed runs leave no trace. This skill makes ARAYA reactive to
natural language, transparent during execution, and auditable afterward.

## When to Use

- Always — this is a cross-cutting capability that affects all workflows
- When designing new workflow triggers
- When debugging a failed or stalled run
- When auditing past executions

## Natural Language Triggers

ARAYA recognizes intent from natural language and starts the appropriate
workflow without requiring `/araya run`:

| Natural Language Pattern | Triggers |
|---|---|
| "Assess {project}" / "Evaluate {project}" | PO assessment workflow |
| "Review {project}" / "Audit {delivery}" | Delivery review workflow |
| "Identify capability gaps" / "What skills are missing?" | GAR generation |
| "Reconstitute {project}" | Reconstitution workflow |
| "Prepare a release" / "Ship {feature}" | Release readiness workflow |
| "What's the team doing?" / "Status update" | Daily standup |
| "Plan sprint for {goal}" | Sprint planning |

## Delegation Observability

During execution, the following is visible:

- Current run ID and workflow name
- Current phase and agent
- Completed tasks / total tasks
- Blocked tasks and their owners
- Elapsed time and estimated remaining

## Run Persistence

Every run creates `.araya/runs/{run_id}/run.json`:

```json
{
  "run_id": "run-2026-05-28-001",
  "workflow": "delivery-review",
  "trigger": "natural-language",
  "start_time": "2026-05-28T10:00:00Z",
  "end_time": "2026-05-28T10:45:00Z",
  "agents": ["sonia", "elena", "diana"],
  "phases": [...],
  "status": "completed",
  "artifacts": ["spec.md", "gar.md"],
  "errors": [],
  "outcome": "delivery-accepted"
}
```

## Input

- Natural language message from The Data Professor
- Agent capability registry (for routing)
- Provider availability state

## Output

- Triggered workflow (started automatically)
- Run record in `.araya/runs/{run_id}/`
- Observability stream during execution

## Steps

1. Receive natural language input
2. Match intent against trigger patterns
3. Verify required agents are available and capable
4. Route to appropriate workflow via provider-aware routing
5. Start run with observability stream
6. Persist run record on completion (or failure)

## Rules

- Natural language triggers must not require command syntax
- Every run creates a persistent record — no execution without an audit trail
- Provider-aware routing checks rate limits before delegation
- A feature is complete only when it: can be used, solves a real problem, can be demonstrated end-to-end, and reduces manual work
- Failed runs must persist their error state for debugging
- Observability is non-negotiable — no silent execution

## Done Criteria

- [ ] Natural language triggers recognized and routed
- [ ] Run record persisted with full metadata
- [ ] Observability stream active during execution
- [ ] Provider routing respected rate limits
- [ ] Usability gate passed (usable, solves problem, demonstrable, reduces work)
