---
name: regression
description: "Design and maintain regression test suites that ensure existing functionality"
---
---

# Regression

Design and maintain regression test suites that ensure existing functionality
continues to work after changes — catching unintended side effects before
they reach production.

## What problem this solves
New features break old features. The larger the codebase, the more likely a
change in module A silently breaks module B. Regression tests catch these
breakages automatically, giving developers confidence to refactor and ship.

## When to use
Before every release. After any refactoring. When adding features to an
established codebase. When a bug is found and fixed (add a regression test
for that specific bug).

## Input
Existing test suite, recent changes, bug history, feature inventory.

## Output
A regression test plan:

```markdown
# Regression Test Suite — User Management API v2.0

## Smoke Tests (Run First — 2 minutes)
| ID | Test | Expected | Priority |
|----|------|----------|----------|
| SMK-01 | Health check endpoint returns 200 | Application is running | P0 |
| SMK-02 | Login with valid credentials | Returns JWT | P0 |
| SMK-03 | GET /users returns paginated list | 200 with data array | P0 |

## Core Regression (Run on Every PR — 10 minutes)
| Module | Tests | Coverage % |
|--------|-------|-----------|
| Authentication | 24 tests | 94% |
| User CRUD | 18 tests | 91% |
| Authorization | 12 tests | 88% |
| Validation | 15 tests | 96% |
| Error Handling | 10 tests | 85% |

## Full Regression (Run Before Release — 30 minutes)
- All core tests (79 tests)
- Integration tests (22 tests)
- Performance tests (5 tests)
- Security tests (8 tests)

## Regression Candidates (Bugs Found in Production)
| Bug ID | Bug Description | Test Added | Status |
|--------|----------------|------------|--------|
| BUG-042 | DELETE /users/:id allowed deleting self | TC-REG-042: admin cannot delete own account | ✅ |
| BUG-037 | Rate limit not applied to password reset | TC-REG-037: verify rate limit on reset endpoint | ✅ |
| BUG-031 | Unicode names caused 500 error | TC-REG-031: create user with Unicode name | ✅ |

## Selection Strategy
For every PR, run:
1. Smoke tests (always)
2. Tests for changed modules
3. Tests for modules that import from changed modules (dependency graph analysis)
```

## Steps
1. Inventory existing test suite: categorize by module, speed, and priority
2. Define regression tiers:
   - **Smoke** (P0): Core happy paths — runs on every commit, < 2 min
   - **Core** (P1): Full module coverage — runs on every PR, < 10 min
   - **Full** (P2): Integration + performance + security — runs before release, < 30 min
3. Map dependency graph: when module A changes, which tests outside module A should run?
4. For every production bug, add a regression test that reproduces the exact bug
5. Tag tests by module, priority, and type for selective execution
6. Set up CI to run the right tier based on trigger (commit vs. PR vs. release)
7. Review regression suite monthly: remove flaky tests, add tests for new features

## Rules
- Every production bug → one regression test — no exceptions
- Smoke tests must pass in < 2 minutes — if they're slow, refactor or demote to core
- Tests for changed modules AND their dependents must run on every PR
- Flaky tests (pass/fail randomly) must be fixed or removed within one sprint
- Regression suite grows linearly with features — budget CI time accordingly
- Never skip regression tests "to save time" on release day — that's when you need them most
- Coordinate with Teresa for test generation from regression test cases
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
