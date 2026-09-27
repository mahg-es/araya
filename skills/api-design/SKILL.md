---
name: api-design
description: "Design REST/GraphQL APIs as an OpenAPI 3.1 contract (endpoints, schemas, auth, errors, versioning) and turn that contract into developer documentation."
---

# API Design

Design REST and GraphQL APIs following OpenAPI 3.1 standards, then turn the
resulting specification into developer documentation. The OpenAPI spec is the
single source of truth: code, tests, and docs derive from it.

## What problem this solves

APIs designed ad-hoc become inconsistent, poorly documented, and hard to
maintain. This skill produces a complete API specification upfront — the
contract between frontend and backend — so every endpoint is well-designed and
documented before implementation.

## When to use

- Before implementing any API.
- When adding endpoints to an existing API.
- When a feature needs a backend contract.
- When an API is ready for internal or external developers and needs docs.

## Input

Feature requirements, data model, authentication strategy; (for documentation)
the OpenAPI specification and example use cases.

## Output

1. An OpenAPI 3.1 specification (`openapi.yaml`) with endpoints, schemas,
   authentication, error handling, and versioning.
2. Developer documentation derived from that spec: getting-started guide,
   endpoint reference, authentication tutorial, code samples, and error catalog.

## Steps

### Design (spec first)

1. Gather requirements: what resources, what operations, who accesses them.
2. Design the resource model: nouns as endpoints (`/users`, `/orders`), HTTP methods as verbs.
3. Define schemas: request bodies, response bodies, path/query parameters.
4. Design error responses: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server).
5. Add authentication: JWT bearer, API key, or OAuth2.
6. Version the API: `/v1/` prefix or header-based versioning.
7. Follow REST conventions:
   - POST create, GET retrieve, PUT/PATCH update, DELETE remove.
   - Collection endpoints plural (`/users`), single resource by ID (`/users/{id}`).
   - Pagination for lists: `?page=1&limit=20`.
8. Write the OpenAPI spec to the project root or `docs/openapi.yaml`.

### Document (from spec)

9. Read the OpenAPI spec for the complete endpoint inventory.
10. Write a getting-started guide: auth, base URL, first request in < 5 minutes.
11. Document each endpoint: method, path, parameters, request/response schemas, example.
12. Add code examples in 2+ languages (curl + Python or JavaScript minimum).
13. Explain authentication step-by-step: get a token, use it, refresh it.
14. Document the error catalog: every status code, meaning, and fix.
15. Render with Swagger UI, Redoc, or static docs; keep the spec as source of truth.

## Rules

- Every endpoint must define success + error responses — never assume the happy path.
- IDs must be UUIDs (not autoincrement integers) to prevent enumeration attacks.
- Credentials appear only in request bodies, never in responses.
- Use standard HTTP status codes — do not invent custom codes.
- Pagination is required on any list endpoint that could return > 100 items.
- The OpenAPI spec is the source of truth — code, tests, and docs derive from it.
- No persona/role references in the spec or docs.

## Done criteria

- [ ] OpenAPI 3.1 spec written with endpoints, schemas, auth, errors, versioning
- [ ] Every endpoint has success + error responses
- [ ] Getting-started guide lets a developer make a first call in < 5 minutes
- [ ] Code examples in at least 2 languages
- [ ] Error catalog documented with fixes
