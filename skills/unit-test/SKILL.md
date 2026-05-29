---
name: unit-test
description: "Generate unit tests for functions, methods, and classes. Tests validate behavior"
---
---

# Unit Test

Generate unit tests for functions, methods, and classes. Tests validate behavior
in isolation — no external dependencies, no network calls, no database access.

## What problem this solves
Code without tests is code that will break silently. Unit tests catch regressions
at the function level so bugs are found in seconds, not in production. This skill
generates focused, fast, deterministic tests that document expected behavior.

## When to use
When implementing new functions, refactoring existing code, or when The Data
Professor needs test coverage for untested code.

## Input
Source code file(s) or function signatures to test.

## Output
Test file in the project's test framework:

```typescript
// tests/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { add, divide } from '../src/calculator';

describe('add', () => {
  it('should return the sum of two positive numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(add(-2, 3)).toBe(1);
  });

  it('should handle zero', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(0, 0)).toBe(0);
  });
});

describe('divide', () => {
  it('should divide two positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should throw when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Cannot divide by zero');
  });
});
```

## Steps
1. Read the source code to understand function signatures, edge cases, and error handling
2. Determine test framework from project config (Vitest, Jest, pytest, etc.)
3. For each function, generate test cases:
   - **Happy path**: Normal input → expected output
   - **Edge cases**: Zero, empty, null, undefined, negative numbers, very large values
   - **Error cases**: Invalid input should throw with specific error messages
   - **Boundaries**: Just below, at, and just above any thresholds
4. Structure tests with AAA pattern: Arrange → Act → Assert
5. Use descriptive test names: `should <expected behavior> when <condition>`
6. Group related tests with `describe` blocks (one per function or module)
7. Ensure tests are independent — no shared mutable state between tests
8. Write the test file to `tests/` directory

## Rules
- Tests must run in under 1 second for the entire file — unit tests are fast by definition
- No external dependencies: mock everything outside the function under test
- Every test must have a single assertion about a single behavior
- Test names must describe behavior: "should throw when dividing by zero", not "testDivide"
- Cover edge cases first — happy path tests prove it works; edge case tests prove it's robust
- If a function has no error handling, add a test that documents expected failure behavior
- Never test implementation details — test observable behavior, not internal state
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
