---
name: tdd-execute
description: "Execute the test suite and report results in red/green format with actionable failures."
---

# TDD Execute

Execute a test suite and report results in red/green format, with actionable
failure messages.

## When to use

After test files exist, or any time tests need to be run to gate implementation.

## Steps

1. Detect the project's test runner.
2. Execute the suite (single run, not watch mode).
3. Parse pass/fail counts and per-test results.
4. Report with PASS/FAIL per test and a summary.
5. Set status: GREEN (all pass) or RED (failures exist).
6. For failures, surface the specific error and location.

## Rules

- Red means stop — do not proceed to implementation while tests fail to run.
- Green without implementation means tests are wrong — verify test logic.
- Coverage is informative, not a target.
- Every failure must carry an actionable message.

## Done criteria

- [ ] Suite executed (not simulated)
- [ ] Pass/fail counts reported with exact numbers
- [ ] Each failure has an actionable message
