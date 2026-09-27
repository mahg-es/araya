---
name: test-authoring
description: "Author tests from requirements/specs — unit, integration, end-to-end, and BDD/Gherkin — with structured, traceable cases. Run them via the deterministic test.execute operation."
---

# Test Authoring

Author tests from requirements and specifications: unit tests (isolated
behavior), integration tests (component interactions), end-to-end tests
(complete user journeys), and BDD/Gherkin feature files (executable
specifications). This is a single canonical skill combining seven legacy
testing skills that were variants of one capability.

## What problem this solves

Code without tests breaks silently. Structured, traceable test cases — happy
path, edge cases, error conditions, boundary values — catch regressions at the
lowest level where they are cheap to fix.

## Boundary — author here, run via the operation

- **Authoring** is reasoning: this skill writes the test cases/code.
- **Running** is deterministic: invoke the `test.execute` operation — do not
  re-derive how to run/parse a test tool.
- **Reporting** red/green is the `tdd-execute` skill.

```bash
araya operation execute test.execute command="pytest -q"
araya operation execute test.execute command="npm test"
```

## Levels of testing

1. **Unit** — functions/methods in isolation; no network, no DB, no filesystem.
2. **Integration** — interactions between components (API + DB + service).
3. **End-to-end** — complete user journeys across frontend/backend/infra.
4. **BDD/Gherkin** — executable specs (`Given/When/Then`) shared with business.
5. **Regression** — preserve existing behavior; run the full suite on change.

Aim for the test pyramid: most tests at unit level, few at E2E.

## Steps

1. Identify the requirement/behavior under test (and its requirement id if any).
2. Enumerate cases: happy path, edge cases, error conditions, boundary values.
3. Write the test using the project's existing framework (do not invent one).
4. Run via `test.execute`; interpret the result.
5. For failures, fix the defect or the test, then re-run.

## Rules

- One behavior per test; clear names; deterministic (no flakiness, no sleeps).
- Prefer invoking `test.execute` over re-deriving the run command.
- Coverage is informative, not a target — prioritize high-risk untested code.
- Every failure must carry an actionable message.

## Done criteria

- [ ] Cases cover happy path + edge + error + boundary
- [ ] Tests run via `test.execute` and pass
- [ ] Traceable to the requirement where applicable

## Provenance

Combined from legacy skills: `unit-test`, `integration-test`, `test-case`,
`bdd-feature`, `tdd-generate`, `e2e-strategy`, `regression`.
