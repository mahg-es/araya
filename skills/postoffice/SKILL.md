---
name: postoffice
description: "Consult and write the agent-to-agent postoffice — the operational-coordination channel. Advisory, never a gate; governance acts never travel it."
---

# Postoffice

The agent-to-agent coordination channel. A shared, append-only log that agents
read at the start of work and write to at the end — so priorities, routing,
context, questions, status, and handoffs flow without a human relaying every
message by hand.

## Boundary — what it carries

Operational direction only: priorities, routing, context, day-to-day questions,
status, handoffs.

Governance acts never travel the postoffice: no approvals, no acceptances, no
declarations of done, no binding dispositions. Those belong on the governed
channels. A postoffice message is a message — it is not an authority, not an
approval ledger, not a workflow state machine, not canonical repository truth,
and not an automatic continuation controller.

## Advisory, never a gate

A postoffice message can never block, halt, or force a run. It is consulted and
considered, never obeyed as a gate.

## Message shape

sender, recipient, timestamp, correlation id, message type, subject, body, and
an optional acknowledgement — plus traceability to the originating work.

## Use

```bash
araya postoffice send --recipient agent --subject "handoff" --correlation P123
araya postoffice list
araya postoffice trace P123
```

## Rules

- Append-only — never edit or delete a prior message; a correction is a new message.
- Correlation ids tie an instruction through delegation to its result.
- No authority, no disposition, no gate.

## Done criteria

- [ ] Read the channel at cycle start
- [ ] Appended an entry at cycle end
- [ ] No governance act in the entry
- [ ] No prior messages modified
