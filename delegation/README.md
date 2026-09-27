# Delegation

The smallest useful delegation surface: a capability resolver plus an ephemeral
agent factory. It is **not** a sovereign runtime and **not** an orchestration
engine. There is no durable workflow state.

## Flow

```text
task
→ determine capabilities needed
→ discover relevant skills
→ discover existing deterministic operations
→ execute directly if no specialist is needed
→ otherwise compose an ephemeral specialist agent (delegate via the host's
  native subagent mechanism)
→ trace communication through PostOffice
→ return result
```

## Ephemeral agents

Specialist agents are ephemeral workers constructed from task + selected skills
+ selected tools/operations + scoped context + permissions + runtime model.
Their display names are randomly assigned and have **no architectural meaning** —
capabilities and skills determine specialization, not names.

## API

Implemented in `cli/araya_lib/delegation.py` (`Delegation`) and exposed via:

```bash
araya delegate <task...>
```
