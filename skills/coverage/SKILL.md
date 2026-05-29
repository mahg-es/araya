---
name: coverage
description: "Analyze test coverage — measure what code is tested, identify coverage gaps,"
---
---

# Coverage

Analyze test coverage — measure what code is tested, identify coverage gaps,
and generate coverage reports that guide testing priorities toward
high-risk, low-coverage areas.

## What problem this solves
"80% coverage" is meaningless if the 20% uncovered is the payment processing
code. This skill analyzes coverage by risk, not just by line count — finding
the untested code that would cause the most damage if it failed.

## When to use
After running tests. During code review. Before release. When the team asks
"do we have enough tests?" or "what should we test next?"

## Input
Coverage report (Istanbul/nyc, JaCoCo, coverage.py), source code, risk analysis.

## Output
```markdown
# Coverage Analysis Report — User Management API

## Global Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Line Coverage | 87.3% | 80% | 🟢 |
| Branch Coverage | 76.1% | 75% | 🟢 |
| Function Coverage | 92.5% | 85% | 🟢 |
| Statement Coverage | 88.0% | 80% | 🟢 |

## Risk-Weighted Coverage

| Module | Coverage | Risk Level | Weighted Score | Status |
|--------|----------|-----------|---------------|--------|
| src/auth/login.ts | 94% | Critical 🟢 | 94/100 | ✅ |
| src/auth/token.ts | 91% | Critical 🟢 | 91/100 | ✅ |
| src/payment/process.ts | 62% | Critical 🔴 | 62/100 | ❌ MUST FIX |
| src/users/routes.ts | 88% | High | 88/100 | ✅ |
| src/users/validation.ts | 96% | High | 96/100 | ✅ |
| src/email/send.ts | 45% | Medium | 45/100 | ⚠️ Low priority |
| src/utils/format.ts | 100% | Low | 100/100 | ✅ |

## Coverage Gaps (Ordered by Risk × Gap)

| Rank | File | Lines Untested | Risk | Gap Impact |
|------|------|---------------|------|------------|
| 🔴 #1 | `src/payment/process.ts:45-62` | 18 lines | Critical | Payment error path untested — could silently fail charges |
| 🔴 #2 | `src/payment/process.ts:78-95` | 17 lines | Critical | Refund logic has 0% branch coverage |
| 🟡 #3 | `src/auth/middleware.ts:34-42` | 8 lines | High | Token expiry edge case uncovered |
| 🟡 #4 | `src/users/routes.ts:56-63` | 7 lines | High | Concurrent user creation race condition |

## Trend
| Sprint | Coverage | Critical Module Coverage | Gap Count |
|--------|----------|-------------------------|-----------|
| Sprint 1 | 72% | 58% | 34 |
| Sprint 2 | 81% | 71% | 18 |
| Sprint 3 | 87% | 81% | 7 |

⬆️ Critical module coverage improved 23% in 2 sprints

## Recommendations
1. **P0**: Write payment processing error tests (gap #1, #2) — blocks next release
2. **P1**: Add token expiry edge case test (gap #3)
3. **P2**: Add concurrency test for user creation (gap #4)
```

## Steps
1. Run test suite with coverage: `vitest --coverage`, `pytest --cov`, etc.
2. Load coverage data and source code
3. Map each source file to a risk level: Critical (payments, auth, PII), High (core features), Medium (helpers), Low (formatting, constants)
4. Calculate risk-weighted coverage: `coverage % × risk weight`
5. Identify untested lines/branches in high-risk files
6. Rank gaps by: risk level × number of uncovered lines × complexity
7. Generate trend data comparing to previous coverage reports
8. Produce actionable recommendations: which gaps to close, in what order
9. Write report to `.araya/plan/tdd/coverage-report.md`

## Rules
- Coverage is a signal, not a goal — 90% with all critical gaps closed > 95% with payment code uncovered
- Branch coverage matters more than line coverage — branches reveal untested logic paths
- Critical modules (auth, payments, PII): target 90%+ branch coverage
- Coverage thresholds in CI: 80% for non-critical, 90% for critical modules
- Never approve a PR that decreases critical module coverage
- Exclude generated code, types, and config files from coverage calculations
- Trend data is more valuable than point-in-time metrics — is coverage improving or degrading?
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
