---
name: adr-write
description: "Write Architecture Decision Records (ADRs) — lightweight documents that capture a significant architectural decision, the context, the options considered, the decision, and the consequences."
---

# ADR Write

Write Architecture Decision Records (ADRs) — lightweight documents that capture
a significant architectural decision, the context in which it was made, the
options considered, the decision taken, and the consequences.

## What problem this solves

Teams make architectural decisions every day, but months later nobody remembers
why a technology was chosen, what alternatives were considered, or what
trade-offs were accepted. ADRs create an immutable decision log that preserves
institutional knowledge and prevents re-litigating settled decisions.

## When to use

- Choosing between technologies or patterns.
- Establishing conventions (naming, structure, versioning).
- Rejecting a technology or pattern (record why it was rejected).
- Any decision where the rationale matters more than the outcome.

## Input

The decision to document.

## Output

An ADR markdown document:

```markdown
# ADR-00N: <title>

Status: Accepted
Date: <YYYY-MM-DD>

## Context
...

## Decision
...

## Options Considered
...

## Consequences
...
```

## Steps

1. Determine whether the decision is architecturally significant.
2. Gather context and constraints.
3. Research alternatives; record at least two options considered.
4. State the decision clearly.
5. Document consequences (positive, negative, mitigations).
6. Assign a sequential number (check existing ADRs).
7. Set status (Proposed → Accepted → Deprecated → Superseded).
8. Write the file under `docs/architecture/`.

## Rules

- One ADR per decision.
- Every ADR must include at least two alternatives considered.
- Never delete a superseded ADR — mark it "Superseded by ADR-XXX" and write a new one.
- Accepted ADRs are immutable except for status/typo fixes.

## Done criteria

- [ ] Decision documented with context, options, decision, consequences
- [ ] At least two alternatives considered
- [ ] Status set and sequence number assigned
