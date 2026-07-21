---
name: autonomous-execution
description: "Reduce manual intervention — autonomous natural language execution triggers, delegation observability, and run persistence."
---

# Autonomous Execution

Natural language should trigger ARAYA execution. Commands become optional.
Delegation progress is visible. Run records persist for audit.

## IMP-01: Natural Language Triggers

ARAYA recognizes intent from natural language and starts the appropriate
workflow without `/araya run`:

| Natural Language | Triggers |
|---|---|
| "Manu, assess mahg-pms" | PO assessment workflow |
| "Sonia, review this project" | Delivery review workflow |
| "Aurora, identify capability gaps" | GAR generation |
| "I want to reconstitute mahg-pms" | Reconstitution workflow |
| "Help me prepare a release" | Release readiness workflow |

## IMP-02: Delegation Observability

During execution, The Professor sees:
- Current run ID
- Current phase
- Current agent
- Completed tasks / total tasks
- Blocked tasks (if any)

## IMP-03: Run Persistence

Every run creates `.araya/runs/{run_id}/run.json`:
- Run ID, start/end time, workflow, agents, status, artifacts, errors, outcome

## IMP-04: Provider-Aware Routing

Before delegation, check: rate-limit history, recent usage, known failures.
Avoid selecting providers near TPM quota.

## IMP-05: Usability Gate

A feature is complete only when it can be used, solves a real problem,
can be demonstrated end-to-end, and reduces manual work.
