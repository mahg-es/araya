---
name: cicd-quality
description: "Design and implement quality gates in CI/CD pipelines — automated checks that"
---
---

# CI/CD Quality

Design and implement quality gates in CI/CD pipelines — automated checks that
block unsafe changes from reaching production. Every commit is tested, scanned,
and validated before it can be merged or deployed.

## What problem this solves
Manual quality checks are bypassed under pressure. Automated gates enforce
quality consistently and impartially — no human can skip them, no deadline can
override them. This skill designs quality gates that block regressions, security
flaws, and performance degradations before they reach users.

## When to use
When setting up CI/CD for any project. When the team bypasses manual checks.
When production incidents trace back to changes that "should have been caught."

## Input
CI/CD platform, testing strategy, security requirements, deployment pipeline.

## Output
```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]

jobs:
  # Gate 1: Code Quality (2 min)
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx eslint . --max-warnings 0
      - run: npx prettier --check .
      - run: npx tsc --noEmit

  # Gate 2: Unit + Integration Tests (5 min)
  tests:
    needs: code-quality
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx vitest --coverage --coverage.thresholds.lines=80
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
      - name: Check coverage gates
        run: |
          npx vitest --coverage --coverage.thresholds.lines=80 \
            --coverage.thresholds.branches=75 \
            --coverage.thresholds.functions=85

  # Gate 3: Security Scan (3 min)
  security:
    needs: code-quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx audit-ci --moderate
      - name: Secret scanning
        uses: gitleaks/gitleaks-action@v2
      - name: SAST
        run: npx eslint-plugin-security --config .eslintrc.security.json

  # Gate 4: Build (2 min)
  build:
    needs: [tests, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: docker build -t app:${{ github.sha }} .

  # Gate 5: E2E Tests (8 min)
  e2e:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose up -d
      - run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-traces
          path: test-results/

  # Gate 6: Performance Budget (2 min)
  performance:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx lighthouse-budget --budget=./lighthouse-budget.json
      - run: |
          BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
          MAX_SIZE=200
          if [ "$(du -sm dist/ | cut -f1)" -gt "$MAX_SIZE" ]; then
            echo "Bundle exceeds ${MAX_SIZE}MB limit"
            exit 1
          fi

  # Gate 7: All Gates Passed
  all-gates:
    needs: [e2e, performance]
    runs-on: ubuntu-latest
    steps:
      - run: echo "✅ All quality gates passed"
```

## Quality Gate Definitions

| Gate | Checks | Blocks If | Override? |
|------|--------|-----------|-----------|
| **G1: Lint & Format** | ESLint, Prettier, TypeScript | Any error or warning | No |
| **G2: Tests** | Unit + Integration + Coverage | Coverage < 80% | No |
| **G3: Security** | Dependency audit, secrets, SAST | Any moderate+ vulnerability | Security lead only |
| **G4: Build** | Compile, bundle, Docker build | Build failure | No |
| **G5: E2E** | Critical path E2E tests | Any P0 test failure | No |
| **G6: Performance** | Bundle size, Lighthouse | Budget exceeded | PM + Tech Lead |
| **G7: Final Gate** | All above passed | Any gate failed | No |

## Steps
1. Define quality criteria: what must be true for code to be acceptable?
2. Implement gates incrementally: lint → tests → security → build → e2e → performance
3. Each gate must:
   - Run automatically on PR
   - Produce clear, actionable failure messages
   - Block merge when failing
   - Have a defined (or no) override process
4. Configure branch protection: required status checks before merge
5. Monitor gate performance — gates that take too long get skipped or bypassed

## Rules
- Every gate must have a clear failure message — "Tests failed" is not enough; "3 tests failed, see log" is
- Gates run on PR, not just on main — catch issues before merge, not after
- Override process defined for every gate — who can override, under what circumstances
- CI must complete in < 15 minutes total — if slower, optimize or parallelize
- Flaky gates erode trust — fix flaky tests/checks within one sprint or demote to advisory
- Security gate: high+ severity vulnerabilities block merge — no exceptions without security lead approval
- Coverage threshold: 80% minimum — greenfield projects can target higher (90%); legacy can phase in
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
