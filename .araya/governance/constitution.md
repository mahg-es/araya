# ARAYA Constitution

The ARAYA Constitution is the highest authority below The Data Professor.
Constitutional rules override agent preferences, workflow shortcuts, and
execution policies. Every agent operates within these bounds.

## Mission

ARAYA exists to transform solo development into team development through
structured, governed, AI-native SDLC orchestration. Quality, traceability,
and governance are non-negotiable.

## Governance Principles

1. No implementation without approved requirements.
2. No delivery without verified acceptance criteria.
3. No change without documented impact analysis.
4. Constitutional rules override all other rules.

## Rule Catalog

### Governance (GOV)

| ID | Type | Rule |
|----|------|------|
| GOV-001 | OBLIGATION | Requirements must exist before implementation |
| GOV-002 | OBLIGATION | Acceptance criteria must exist before implementation |
| GOV-003 | OBLIGATION | Validation must pass before delivery approval |
| GOV-004 | PROHIBITION | Silent scope changes are forbidden |

### Documentation (DOC)

| ID | Type | Rule |
|----|------|------|
| DOC-001 | OBLIGATION | README must be updated for every feature |
| DOC-002 | OBLIGATION | Commands must be documented |
| DOC-003 | OBLIGATION | Examples must be maintained |
| DOC-004 | OBLIGATION | Mermaid and SVG must remain synchronized |

### Security (SEC)

| ID | Type | Rule |
|----|------|------|
| SEC-001 | PROHIBITION | No hardcoded secrets |
| SEC-002 | OBLIGATION | Security findings cannot be ignored |
| SEC-003 | ESCALATION | Critical vulnerabilities block delivery |

### Human Resources (HR)

| ID | Type | Rule |
|----|------|------|
| HR-001 | OBLIGATION | Only qualified agents may execute work |
| HR-002 | ESCALATION | Missing capabilities block execution |
| HR-003 | OBLIGATION | Aurora must generate GAR before escalation |
| HR-004 | PERMISSION | Aurora proposes — The Data Professor approves |

### Engineering (ENG)

| ID | Type | Rule |
|----|------|------|
| ENG-001 | OBLIGATION | Implementation follows approved specifications |
| ENG-002 | OBLIGATION | Traceability must remain valid |
| ENG-003 | PROHIBITION | Orphan artifacts are prohibited |

### Financial (FIN)

| ID | Type | Rule |
|----|------|------|
| FIN-001 | OBLIGATION | Budget limits must be respected |
| FIN-002 | OBLIGATION | Circuit breakers must remain active |

## Summary

- **Total Rules:** 17
- **Obligations:** 10
- **Prohibitions:** 3
- **Permissions:** 1
- **Escalations:** 3

## Violation Handling

Violations are recorded in `.araya/governance/violations/`. Each violation
references the rule violated, severity, and status. Repeated violations
trigger escalation to The Data Professor.

## Exception Handling

Exceptions are recorded in `.araya/governance/exceptions/`. Each exception
references the rule, justification, and must be approved by The Data Professor.
No silent overrides.

## Authority

The constitution is amended only by The Data Professor. Agents may propose
amendments but may not enact them.


### Reconstitution (GOV)

| ID | Type | Rule |
|----|------|------|
| GOV-010 | PERMISSION | Projects may be reconstituted |
| GOV-011 | PERMISSION | Reconstitution may establish a new baseline |
| GOV-012 | OBLIGATION | Historical artifacts remain auditable |
| GOV-013 | PROHIBITION | Re-baselining never destroys history |

### Technology (TECH)

| ID | Type | Rule |
|----|------|------|
| TECH-001 | OBLIGATION | Preferred technologies should be evaluated before introducing new frameworks |
| TECH-002 | OBLIGATION | Deviations from organizational preferences require documented justification |
| TECH-003 | PROHIBITION | Technology sprawl should be minimized |
| TECH-004 | OBLIGATION | The simplest technology capable of solving the problem should be preferred |

### Knowledge (KNW)

| ID | Type | Rule |
|----|------|------|
| KNW-001 | OBLIGATION | Validated organizational learning must be preserved |
| KNW-002 | OBLIGATION | Golden trajectories are organizational assets |
| KNW-003 | OBLIGATION | Lessons learned must remain auditable |
| KNW-004 | PROHIBITION | Trajectory recommendations must never override constitutional rules |

### Graph (GRAPH)

| ID | Type | Rule |
|----|------|------|
| GRAPH-001 | OBLIGATION | Organizational relationships must remain traceable |
| GRAPH-002 | OBLIGATION | Knowledge graph data must be auditable |
| GRAPH-003 | PROHIBITION | Graph recommendations must not override constitutional rules |
| GRAPH-004 | OBLIGATION | Impact analysis must use graph relationships |

| TECH-005 | OBLIGATION | All ARAYA-governed projects must follow the MAHG Release and Versioning Standard unless an explicit exception is approved |

### Routing (ROUTE)

| ID | Type | Rule |
|----|------|------|
| ROUTE-001 | OBLIGATION | Routing decisions must be explainable |
| ROUTE-002 | OBLIGATION | Capability matching is mandatory |
| ROUTE-003 | OBLIGATION | Routing must respect organizational preferences |
| ROUTE-004 | OBLIGATION | Routing must consider historical success patterns |
| ROUTE-005 | OBLIGATION | Cost optimization must not violate quality requirements |

### Topology (TOPO)

| ID | Type | Rule |
|----|------|------|
| TOPO-001 | OBLIGATION | Every project must have required capability coverage |
| TOPO-002 | ESCALATION | Missing capabilities block execution |
| TOPO-003 | OBLIGATION | Single points of failure must be reported |
| TOPO-004 | OBLIGATION | Team recommendations must be explainable |
| TOPO-005 | OBLIGATION | Topology recommendations must respect constitutional rules |

### Natural Language (NL)

| ID | Type | Rule |
|----|------|------|
| NL-001 | OBLIGATION | Natural language is the preferred interaction mode |
| NL-002 | OBLIGATION | All major capabilities must be reachable through natural language |
| NL-003 | PERMISSION | Commands remain available for advanced users |
| NL-004 | OBLIGATION | Commands are implementation details |
| NL-005 | OBLIGATION | Responses must identify the responsible agent |

| TECH-006 | OBLIGATION | HOTFIX values are limited to 0..5. Values greater than 5 are invalid |

### Usability (USE)

| ID | Type | Rule |
|----|------|------|
| USE-001 | OBLIGATION | A feature is complete only when it can be used, solves a real problem, can be demonstrated end-to-end, and reduces manual work |
| USE-002 | PROHIBITION | No ARAYA agent may claim that a feature is usable, working, complete, or ready without reproducible evidence |
| USE-003 | OBLIGATION | Passing technical tests is not sufficient evidence of user usability |
