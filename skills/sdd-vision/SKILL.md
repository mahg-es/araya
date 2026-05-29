---
name: sdd-vision
description: "Define the project vision from a business problem description."
---
---

# SDD Vision

Define the project vision from a business problem description.

## What problem this solves
The user has a business need but hasn't formalized it into a project vision. 
This skill turns "I need an API for users" into a structured vision document 
with objectives, success metrics, scope, and constraints.

## When to use
At the start of any new project or feature. Invoke before any implementation 
work begins.

## Input
A description of the business problem or project idea, in natural language.

## Output
A `specs/vision.md` file containing:
- **Project Name**: Short, descriptive name
- **Description**: Business problem and proposed solution (2-3 paragraphs)
- **Objectives**: Measurable, specific goals (3-5 items)
- **Success Metrics**: How we'll know we've succeeded (3-5 KPIs)
- **Scope**: What's included and explicitly excluded
- **Constraints**: Technical, budget, timeline, compliance requirements
- **Stakeholders**: Who this serves and who decides

## Steps
1. Ask clarifying questions about the business problem if needed
2. Identify measurable objectives — not "build an API" but "reduce user onboarding time by 50%"
3. Define scope boundaries — what are we NOT building?
4. Involve Diana early to identify security and compliance constraints
5. Write `specs/vision.md` using the write tool
6. Confirm the vision with the user before proceeding

## Rules
- Always start with the business problem, not the technical solution
- Objectives must be measurable — no vague goals
- Security and compliance must be considered from the vision stage
- The vision document is a contract — change it deliberately, not accidentally
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
