---
name: tdd-execute
description: "Execute the test suite and report results in red/green format."
---
---

# TDD Execute

Execute the test suite and report results in red/green format.

## What problem this solves
Tests exist but need to be executed, with results clearly communicated so the 
team knows what passes, what fails, and what to fix next.

## When to use
After `tdd-generate` has produced test files, or anytime tests need to be run.

## Input
Project test configuration (vitest.config.ts, jest.config.js, etc.) and test files.

## Output
A red/green test report:

```
🧪 TDD Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASS  tests/login.test.ts (3 tests)
   ✓ should authenticate with valid credentials (45ms)
   ✓ should reject with 401 for wrong password (12ms)
   ✓ should lock account after 5 failed attempts (23ms)

❌ FAIL  tests/register.test.ts (2/3 passing)
   ✗ should validate email format (Error: Expected 400, got 500)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary: 5/6 passing | 1 failing
📈 Coverage: 0% (expected — implementation not started)
🟡 Status: RED — 1 test failing, implementation needed
```

## Steps
1. Detect the project's test runner (check for vitest, jest, or other config)
2. Execute the test suite: `npx vitest run` or `npx jest`
3. Parse the output for pass/fail counts, individual test results, and coverage
4. Format results clearly with ✅ PASS / ❌ FAIL indicators
5. Report summary: pass count, fail count, coverage percentage
6. Set status: 🟢 GREEN (all pass) or 🔴 RED (failures exist)
7. For failures, provide the specific error message and location

## Rules
- Red means stop — do not proceed to implementation if tests can't even compile
- Green without implementation means tests are wrong — verify test logic
- Coverage is informative, not a target — don't chase 100% blindly
- Every test failure must have an actionable error message
- Run tests in CI mode (single run, not watch mode) for reporting
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
