---
name: e2e-strategy
description: "Design end-to-end testing strategy — what to test, how to test it, when to run"
---
---

# E2E Strategy

Design end-to-end testing strategy — what to test, how to test it, when to run
it, and how to keep it reliable. E2E tests validate complete user journeys
across frontend, backend, and infrastructure.

## What problem this solves
Unit and integration tests verify components; E2E tests verify that everything
works together from a user's perspective. This skill designs an E2E strategy
that catches integration failures, deployment issues, and regression bugs
without creating a flaky, slow test suite.

## When to use
Before launching any application. When setting up CI/CD. When the test pyramid
is missing its top. When users report bugs that unit/integration tests miss.

## Input
Application user journeys, critical paths, test environment, CI/CD pipeline.

## Output
```markdown
# E2E Test Strategy: ARAYA Dashboard

## Test Pyramid (Balanced)
```
        /\
       /E2E\        10% — Critical paths (23 tests, 8 min)
      /------\
     / Integr \     30% — API + component integration (79 tests, 3 min)
    /----------\
   /   Unit     \   60% — Functions + components (245 tests, 12 sec)
  /--------------\
```

## Critical User Journeys (E2E Test Candidates)

| Journey | Priority | Test Count | Frequency |
|---------|----------|-----------|-----------|
| User registration + login + dashboard load | P0 | 3 tests | Every commit |
| Order placement + payment + confirmation | P0 | 2 tests | Every PR |
| Admin: create user + assign role + verify access | P1 | 2 tests | Every PR |
| Password reset flow | P1 | 2 tests | Daily |
| Settings: profile update + email change | P2 | 2 tests | Pre-release |
| Error states: 404, 500, network offline | P2 | 3 tests | Pre-release |

## Test Architecture
```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Journey", () => {
  test("complete registration → login → dashboard", async ({ page }) => {
    // Register
    await page.goto("/register");
    await page.fill('[data-testid="name-input"]', "Test User");
    await page.fill('[data-testid="email-input"]', "e2e-test@araya.dev");
    await page.fill('[data-testid="password-input"]', "SecurePass123!");
    await page.click('[data-testid="register-button"]');

    // Should redirect to login
    await expect(page).toHaveURL("/login");
    await expect(page.locator('[data-testid="success-toast"]'))
      .toContainText("Registration successful");

    // Login
    await page.fill('[data-testid="email-input"]', "e2e-test@araya.dev");
    await page.fill('[data-testid="password-input"]', "SecurePass123!");
    await page.click('[data-testid="login-button"]');

    // Should reach dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator('[data-testid="user-greeting"]'))
      .toContainText("Test User");
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[data-testid="email-input"]', "wrong@email.com");
    await page.fill('[data-testid="password-input"]', "wrong");
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText("Invalid email or password");
    await expect(page).toHaveURL("/login"); // Still on login page
  });
});
```

## Reliability Strategy
| Problem | Solution |
|---------|----------|
| Flaky tests (pass/fail randomly) | Retry 2x, then quarantine if > 5% flake rate |
| Slow tests (E2E suite > 10 min) | Parallel execution (4 workers), split by journey |
| Test data pollution | Each test creates + cleans up own data; isolated DB per worker |
| Environment drift | Docker Compose for deterministic test environment |
| Visual regressions | Playwright screenshots compared to baseline (5% threshold) |

## CI Integration
```yaml
e2e-tests:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
    api:
      image: araya-api:latest
  steps:
    - uses: actions/checkout@v4
    - run: npx playwright install --with-deps
    - run: npx playwright test --workers=4
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-traces
        path: test-results/
```

## Steps
1. Map critical user journeys — what must work for the application to be usable?
2. Prioritize: P0 (blocks release), P1 (should pass), P2 (nice to have)
3. Choose tool: Playwright (modern, multi-browser), Cypress (popular), Selenium (legacy)
4. Write tests using data-testid selectors (not CSS classes or text content)
5. Set up test environment: Docker Compose with isolated DB per run
6. Run in CI: parallel execution, artifact upload on failure
7. Monitor flake rate — quarantine tests > 5% flake

## Rules
- E2E tests must be independent — each test sets up and tears down its own data
- Use `data-testid` attributes for selectors — never CSS classes, XPaths, or text content
- No `sleep()` or `waitForTimeout()` — use `waitForSelector`, `waitForResponse`, `waitForURL`
- Run against a production-like environment, not dev with hot-reload
- E2E suite must complete in < 10 minutes — if slower, parallelize or split
- Flaky tests (> 5% failure rate) get quarantined — fix within 1 sprint or remove
- Test on the browser your users actually use — don't test only Chrome if users are on Safari
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
