---
name: architecture-diagram
description: "Create clear, standards-based architecture diagrams — C4 model (Context, Container, Component, Code), sequence, and data-flow — as version-controlled text (Mermaid/PlantUML)."
---

# Architecture Diagram

Create clear, standards-based architecture diagrams — C4 model (Context,
Container, Component, Code), sequence diagrams, and data flow diagrams — as
visual communication of system design, in version-controlled text format.

## What problem this solves

Architecture without diagrams is invisible. Stakeholders cannot understand
systems they cannot see. This skill creates diagrams at the right level of
abstraction for each audience — executives need context; developers need
components.

## When to use

- Documenting system architecture.
- Onboarding new team members.
- Presenting design proposals.
- An ADR needs a visual aid (pair with the `adr-write` skill).

## Input

System architecture, audience (executive, architect, developer), diagram type.

## Output

Architecture diagrams in Mermaid (preferred — text-based, version-controlled)
or PlantUML / C4-PlantUML format.

## Steps

1. Determine audience and abstraction level:
   - **Context (Level 1):** system + users + external systems — for executives.
   - **Container (Level 2):** services, databases, message queues — for architects.
   - **Component (Level 3):** modules within a service — for developers.
2. Choose diagram type: C4 (structural), sequence (behavioral), data flow (data movement).
3. Write it in Mermaid (or PlantUML) so it is version-controlled and diffable.
4. Label every element: name + technology (e.g. "User API — Express.js on Node.js").
5. Show data-flow direction with labeled arrows (protocol + payload, e.g. "HTTPS/JSON").
6. Add a legend for colors, shapes, and line styles.
7. Commit it next to the relevant ADR or architecture decision.

## Rules

- One diagram per abstraction level — do not mix context and component levels.
- C4 is the standard — use it, or state explicitly why not.
- Prefer text-based formats (Mermaid, PlantUML) over image-only output.
- Keep diagrams updated — an outdated diagram is worse than none.
- No persona/role references: the diagram describes the system, not a team roster.

## Done criteria

- [ ] Audience and abstraction level chosen and stated
- [ ] Diagram type chosen (C4 / sequence / data flow)
- [ ] Every element labeled with name + technology
- [ ] Arrows labeled with protocol + payload
- [ ] Diagram committed in a text-based, version-controlled format
