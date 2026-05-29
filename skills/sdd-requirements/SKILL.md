---
name: sdd-requirements
description: "Generate functional and non-functional requirements from the project vision."
---
---

# SDD Requirements

Generate functional and non-functional requirements from the project vision.

## What problem this solves
The vision is defined but the team needs concrete, testable requirements before 
design and implementation can begin. This skill bridges vision to execution.

## When to use
After `sdd-vision` has produced a confirmed `specs/vision.md`.

## Input
A confirmed `specs/vision.md` file in the project's `specs/` directory.

## Output
A `specs/requirements.md` file containing:

### Functional Requirements (RF-XX)
- **ID**: Unique identifier (RF-01, RF-02, ...)
- **Description**: What the system must do
- **Priority**: High / Medium / Low
- **Acceptance Criteria**: How to verify this requirement is met

### Non-Functional Requirements (RNF-XX)
- **ID**: Unique identifier (RNF-01, RNF-02, ...)
- **Category**: Performance, Security, Usability, Reliability, Maintainability
- **Description**: Quality attribute the system must satisfy
- **Measurement**: How to verify compliance
- **Priority**: High / Medium / Low

## Steps
1. Read `specs/vision.md`
2. Extract actors, use cases, and user journeys from the vision
3. Derive functional requirements for each use case
4. Derive non-functional requirements: performance, security (consult Diana's standards), scalability
5. Assign priorities based on business impact and dependency order
6. Write `specs/requirements.md` using the write tool
7. Have Teresa review requirements for testability

## Rules
- Every functional requirement must have at least one acceptance criterion
- Security requirements are mandatory — involve Diana
- Non-functional requirements must be measurable, not aspirational
- Requirements must be testable — if you can't test it, it's not a requirement
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
