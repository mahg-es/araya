---
name: test-case
description: "Write comprehensive test cases from requirements and specifications. Test"
---
---

# Test Case

Write comprehensive test cases from requirements and specifications. Test
cases cover happy path, edge cases, error conditions, and boundary values —
structured, traceable, and ready for automation.

## What problem this solves
Testing without structured test cases misses edge cases and creates untestable
requirements. This skill produces test cases with clear preconditions, steps,
expected results, and traceability to the requirement they verify.

## When to use
After requirements are defined (`sdd-requirements`). Before implementation begins.
When QA needs a test suite for manual or automated execution.

## Input
Requirements document, user stories, or feature specification.

## Output
```markdown
# Test Cases: User Registration

## TC-01: Successful Registration
- **Requirement:** REQ-USER-001
- **Priority:** P0 (Critical)
- **Preconditions:** Database is empty, email "new@test.com" not registered
- **Steps:**
  1. Navigate to POST /api/v1/users
  2. Send: `{ "name": "Test User", "email": "new@test.com", "password": "SecurePass123!" }`
- **Expected Result:**
  - HTTP 201 Created
  - Response contains: `id` (UUID), `name`, `email`, `role: "user"`, `createdAt`
  - Password hash stored in database (not plaintext)
  - `createdAt` is within 1 second of current time

## TC-02: Duplicate Email
- **Requirement:** REQ-USER-002
- **Priority:** P0 (Critical)
- **Preconditions:** User "existing@test.com" already registered
- **Steps:**
  1. Navigate to POST /api/v1/users
  2. Send: `{ "name": "Another", "email": "existing@test.com", "password": "SecurePass123!" }`
- **Expected Result:**
  - HTTP 409 Conflict
  - Response: `{ "error": "CONFLICT", "message": "A user with this email already exists" }`

## TC-03: Missing Required Field
- **Requirement:** REQ-USER-003
- **Priority:** P1 (High)
- **Preconditions:** None
- **Test Data:**
  | Scenario | Input | Expected Status | Expected Error |
  |----------|-------|----------------|----------------|
  | Missing name | `{ "email": "a@b.com", "password": "SecurePass123!" }` | 400 | VALIDATION_ERROR |
  | Missing email | `{ "name": "Test", "password": "SecurePass123!" }` | 400 | VALIDATION_ERROR |
  | Missing password | `{ "name": "Test", "email": "a@b.com" }` | 400 | VALIDATION_ERROR |
  | Empty name | `{ "name": "", "email": "a@b.com", "password": "SecurePass123!" }` | 400 | VALIDATION_ERROR |

## TC-04: Weak Password
- **Requirement:** REQ-USER-004
- **Priority:** P1 (High)
- **Test Data:**
  | Scenario | Password | Expected |
  |----------|----------|----------|
  | Too short | "Abc1!" | 400 — "Password must be at least 8 characters" |
  | No uppercase | "securepass123!" | 400 — "Password must contain uppercase letter" |
  | No number | "SecurePass!" | 400 — "Password must contain a number" |
  | Valid | "SecurePass123!" | 201 — Accepted |
```

## Steps
1. Review requirements — each requirement should have at least one test case
2. For each requirement, design test cases covering:
   - **Happy path**: Normal input, expected success
   - **Edge cases**: Empty, null, very large, very small, boundary values
   - **Error cases**: Invalid input, missing fields, wrong types
   - **Security cases**: Injection, XSS, auth bypass attempts
   - **Concurrency**: Race conditions if applicable
3. Use Given-When-Then or Preconditions-Steps-Expected format
4. Assign priority: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
5. Trace to requirement ID for coverage tracking
6. Use parameterized test data for multiple similar scenarios
7. Write to `tests/cases/` directory

## Rules
- Every requirement must have at least 1 test case — traceability is mandatory
- Test data must be specific: "test@example.com", not "a valid email"
- Expected results must be unambiguous — binary pass/fail, no interpretation needed
- Test cases must be independent — no shared state or sequential dependency
- Prioritize: P0 tests block release; P1 tests should pass; P2/P3 are nice-to-have
- Security test cases required for any endpoint handling auth, PII, or payments
- Hand off to Teresa for unit/integration test generation from these cases
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
