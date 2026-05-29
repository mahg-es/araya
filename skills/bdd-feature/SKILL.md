---
name: bdd-feature
description: "Generate Gherkin feature files from functional requirements."
---
---

# BDD Feature

Generate Gherkin feature files from functional requirements.

## What problem this solves
Requirements are documented but the team needs executable specifications that 
define behavior in a language everyone understands — business, developers, QA.

## When to use
After `sdd-requirements` has produced `specs/requirements.md`.

## Input
A `specs/requirements.md` file with functional requirements (RF-XX).

## Output
One or more `features/*.feature` files in Gherkin format:

```gherkin
Feature: [Feature name]
  As a [role]
  I want [goal]
  So that [benefit]

  Background:
    Given [shared precondition]

  Scenario: [Scenario name]
    Given [precondition]
    When [action]
    Then [expected outcome]

  Scenario Outline: [Parameterized scenario]
    Given [precondition with <parameter>]
    When [action with <parameter>]
    Then [expected outcome with <parameter>]
    Examples:
      | parameter | expected |
      | value1    | result1  |
```

## Steps
1. Read `specs/requirements.md`
2. Group related functional requirements into features
3. For each feature, write the Feature header (As a / I want / So that)
4. For each requirement, write one or more scenarios covering:
   - Happy path (everything works)
   - Edge cases (boundary conditions)
   - Error cases (invalid input, missing data)
   - Security scenarios (unauthorized access, injection attempts)
5. Use Scenario Outlines with Examples tables for parameterized test data
6. Write `features/<feature-name>.feature` files
7. Have Teresa validate scenarios are testable

## Rules
- Each feature file maps to one business capability, not one technical component
- Scenarios must use business language, not technical implementation details
- Every functional requirement must be covered by at least one scenario
- Security scenarios are mandatory — consult Diana for threat-based scenarios
- Tags (@smoke, @regression, @security) must be applied consistently
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
