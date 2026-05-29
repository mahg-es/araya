---
name: architecture-diagram
description: "Create clear, standards-based architecture diagrams — C4 model (Context,"
---
---

# Architecture Diagram

Create clear, standards-based architecture diagrams — C4 model (Context,
Container, Component, Code), sequence diagrams, and data flow diagrams —
visual communication of system design.

## What problem this solves
Architecture without diagrams is invisible. Stakeholders can't understand
systems they can't see. This skill creates diagrams at the right level of
abstraction for each audience — executives need context; developers need
components.

## When to use
When documenting system architecture. When onboarding new team members. When
presenting design proposals. When an ADR needs a visual aid.

## Input
System architecture, audience (executive, architect, developer), diagram type.

## Output
Architecture diagrams in Mermaid (preferred, text-based, version-controlled)
or PlantUML/C4-PlantUML format.

## Steps
1. Determine audience and abstraction level:
   - **Context (Level 1):** System + users + external systems — for executives
   - **Container (Level 2):** Services, databases, message queues — for architects
   - **Component (Level 3):** Modules within a service — for developers
2. Choose diagram type: C4 (structural), sequence (behavioral), data flow (data movement)
3. Create in Mermaid for version control and easy updates
4. Label every element: system name, technology, responsibility
5. Show data flow direction with labeled arrows
6. Add legend for colors, shapes, line styles
7. Embed in documentation next to relevant ADR or architecture decision

## Rules
- One diagram per abstraction level — don't mix context and components
- Every element labeled: name + technology (e.g., "User API — Express.js on Node.js")
- Arrows labeled with protocol and data (e.g., "HTTPS/JSON", "JDBC/SQL")
- C4 model is the standard — use it or justify why not
- Text-based formats (Mermaid, PlantUML) over image-only — version controlled
- Keep diagrams updated — outdated diagrams are worse than no diagrams
- Coordinate with Priscila (documentation) and relevant architect
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
