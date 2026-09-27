---
name: ponyexpress
description: "Intake and trace Professor-originated instructions via the PonyExpress channel, correlated through delegation to results."
---

# PonyExpress

The Professor's explicit communication channel toward the agent system (Daneel /
agents). An instruction arrives here, is carried through delegation by its
correlation id, and results trace back to it.

## Boundary

PonyExpress is a transport, not an authority database. The Professor's actual
authority exists independently of it. A PonyExpress message records an
instruction; it does not by itself grant, transfer, or record authority.

## Flow

```text
Professor
  ↓ PonyExpress message P123
Daneel
  ↓ PostOffice delegation A456
Agent
  ↓ PostOffice result A457

correlation_id = P123
```

## Use

```bash
araya ponyexpress send --recipient daneel --subject "do X" --correlation P123
araya relay handoff --recipient agent --instruction P123 --subject "do X"
araya relay trace P123
```

## Rules

- Durable, append-only traceability.
- Every delegation and result carries the instruction's correlation id.
- Never an authority database.

## Done criteria

- [ ] Instruction recorded with a correlation id
- [ ] Delegation and result traceable back to the instruction
