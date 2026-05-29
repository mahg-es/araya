---
name: tdd-generate
description: "Generate test code from Gherkin feature files. Tests are written before"
---
---

# TDD Generate

Generate test code from Gherkin feature files. Tests are written before 
implementation — they define what success looks like.

## What problem this solves
Feature files describe behavior, but developers need executable tests that 
validate the implementation. This skill bridges BDD scenarios to TDD test code.

## When to use
After `bdd-feature` has produced `features/*.feature` files.

## Input
One or more `features/*.feature` files in Gherkin format.

## Output
Test files in the project's test framework (Jest/Vitest by default):

```typescript
// tests/<feature-name>.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Feature: User Login', () => {
  describe('Scenario: Successful login', () => {
    it('should authenticate with valid credentials', async () => {
      // Given a registered user
      // When they submit valid credentials
      // Then they receive an access token
    });
  });

  describe('Scenario: Invalid password', () => {
    it('should reject with 401 for wrong password', async () => {
      // Given a registered user
      // When they submit an incorrect password
      // Then they receive a 401 error
    });
  });
});
```

## Steps
1. Read the feature file(s) to be implemented
2. Determine the test framework (check project config; default: Vitest)
3. For each scenario, generate a test function:
   - `describe` block = Feature + Scenario names
   - `it` block = scenario description
   - Arrange (Given) = test setup
   - Act (When) = the action under test
   - Assert (Then) = expected outcomes
4. For Scenario Outlines, generate parameterized tests
5. Include setup/teardown hooks (beforeAll, afterAll, beforeEach, afterEach)
6. Write test files to `tests/` directory with `.test.ts` or `.spec.ts` extension
7. Run `/skill:tdd-execute` to verify tests are runnable (they should FAIL — no implementation yet)

## Rules
- Tests must fail initially (red phase) — if they pass without implementation, they're wrong
- One test file per feature file — keep tests organized
- Tests must be independent — no shared state between tests
- Use descriptive test names that explain the behavior being tested
- Security scenarios must have dedicated security tests with attack payloads
- Mock external dependencies; don't test third-party services
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
