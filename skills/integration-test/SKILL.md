---
name: integration-test
description: "Generate integration tests that verify interactions between multiple components —"
---
---

# Integration Test

Generate integration tests that verify interactions between multiple components —
API endpoints, database queries, message queues, and service-to-service communication.

## What problem this solves
Unit tests verify isolated functions; integration tests verify that components
work together. This skill generates tests that catch wiring errors, contract
mismatches, and configuration issues that unit tests cannot detect.

## When to use
After unit tests pass — to verify that components connect correctly. Especially
important for API endpoints, database migrations, authentication flows, and
multi-service orchestration.

## Input
API specification (OpenAPI), database schema, or service interaction description.

## Output
Integration test files:

```typescript
// tests/integration/users-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { db } from '../../src/db';

describe('POST /api/users', () => {
  beforeAll(async () => {
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should create a user and return 201', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@example.com' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(String),
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('should return 409 for duplicate email', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'Test User', email: 'test@example.com' });

    await request(app)
      .post('/api/users')
      .send({ name: 'Another', email: 'test@example.com' })
      .expect(409);
  });

  it('should return 400 for missing required fields', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'No Email' })
      .expect(400);
  });
});
```

## Steps
1. Identify integration points: API endpoints, database operations, auth flows, external services
2. Set up test environment:
   - Database: use test database, run migrations, seed test data
   - External services: mock with realistic responses (nock, msw, wiremock)
   - Auth: generate test tokens or disable auth for integration tests
3. For each integration point, write tests that exercise the full flow:
   - **Happy path**: End-to-end success
   - **Error path**: Invalid input, missing auth, duplicate records
   - **Concurrency**: Parallel requests (if applicable)
   - **Cleanup**: State after operations (no test pollution)
4. Use `beforeAll`/`afterAll` for expensive setup (DB migrations, server start)
5. Use `beforeEach`/`afterEach` for per-test cleanup (transaction rollback, cache clear)
6. Write tests to `tests/integration/` directory (separate from unit tests)

## Rules
- Integration tests run in a dedicated test environment — never use production databases
- Each test must clean up after itself — no shared state that breaks other tests
- External services must be mocked — don't call real payment gateways or email APIs
- Test the full request/response cycle, not just the handler function
- Database tests: use transactions and rollback (PostgreSQL) or test database reset (SQLite)
- Integration tests may take up to 10 seconds per file — slower than unit tests, still fast enough for CI
- Test authentication: valid token, expired token, missing token, wrong permissions
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
