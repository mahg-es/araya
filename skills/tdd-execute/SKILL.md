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
2. Execute the suite via the deterministic `test.execute` operation (single
   run, not watch mode) — do not re-derive how to run the tool:
   ```bash
   araya operation execute test.execute command="pytest -q"
   ```
3. Interpret the structured result: exit code, pass/fail counts.
4. Report with PASS/FAIL per test and a summary.
5. Set status: GREEN (all pass) or RED (failures exist).
6. For failures, surface the specific error and location — reason only about
   the failure and the next action, not about how to run the suite.

## Rules

- Red means stop — do not proceed to implementation while tests fail to run.
- Green without implementation means tests are wrong — verify test logic.
- Coverage is informative, not a target.
- Every failure must carry an actionable message.

## Done criteria

- [ ] Suite executed (not simulated)
- [ ] Pass/fail counts reported with exact numbers
- [ ] Each failure has an actionable message
