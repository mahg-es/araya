---
name: api-design
description: "Design REST and GraphQL APIs following OpenAPI 3.1 standards. Produce complete"
governance: "Constitution ENG-004: Engineering Excellence & Software Craftsmanship Standard"
---
---

# API Design

Design REST and GraphQL APIs following OpenAPI 3.1 standards. Produce complete
API specifications with endpoints, schemas, authentication, error handling, and
versioning — ready for implementation and documentation.

## What problem this solves
APIs designed ad-hoc become inconsistent, poorly documented, and hard to maintain.
This skill produces a complete API specification upfront — the contract between
frontend and backend — ensuring every endpoint is well-designed before a single
line of code is written.

## When to use
Before implementing any API. When adding new endpoints to an existing API. When
The Data Professor describes a feature that needs a backend.

## Input
Feature requirements, data model, authentication strategy.

## Output
An OpenAPI 3.1 specification:

```yaml
# openapi.yaml
openapi: "3.1.0"
info:
  title: User Management API
  version: "1.0.0"
  description: User CRUD with JWT authentication

servers:
  - url: http://localhost:3000/api/v1
    description: Development server

paths:
  /users:
    post:
      summary: Create a new user
      operationId: createUser
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateUserRequest"
      responses:
        "201":
          description: User created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          $ref: "#/components/responses/ValidationError"
        "409":
          description: Email already exists

  /users/{userId}:
    get:
      summary: Get user by ID
      operationId: getUser
      tags: [Users]
      parameters:
        - name: userId
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: User found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "404":
          description: User not found

components:
  schemas:
    User:
      type: object
      required: [id, name, email, createdAt]
      properties:
        id: { type: string, format: uuid }
        name: { type: string, minLength: 1, maxLength: 100 }
        email: { type: string, format: email }
        role: { type: string, enum: [user, admin] }
        createdAt: { type: string, format: date-time }

    CreateUserRequest:
      type: object
      required: [name, email, password]
      properties:
        name: { type: string, minLength: 1, maxLength: 100 }
        email: { type: string, format: email }
        password: { type: string, format: password, minLength: 8 }

  responses:
    ValidationError:
      description: Validation failed
      content:
        application/json:
          schema:
            type: object
            properties:
              error: { type: string }
              details:
                type: array
                items:
                  type: object
                  properties:
                    field: { type: string }
                    message: { type: string }

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Steps
1. Gather requirements: what resources, what operations, who accesses them
2. Design resource model: nouns as endpoints (`/users`, `/orders`), HTTP methods as verbs
3. Define schemas: request bodies, response bodies, path/query parameters
4. Design error responses: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server)
5. Add authentication: JWT bearer, API key, or OAuth2
6. Version the API: `/v1/` prefix or header-based versioning
7. Follow REST conventions:
   - POST for creation, GET for retrieval, PUT/PATCH for updates, DELETE for removal
   - Collection endpoints plural (`/users`), single resource by ID (`/users/{id}`)
   - Pagination for lists: `?page=1&limit=20`
8. Write OpenAPI spec to project root or `.araya/plan/spec/openapi.yaml`

## Rules
- Every endpoint must define success + error responses — never assume the happy path
- IDs must be UUIDs (not autoincrement integers) to prevent enumeration attacks
- Passwords/credentials in request bodies only; never returned in responses
- Use standard HTTP status codes — don't invent custom codes
- Pagination required on any list endpoint that could return > 100 items
- OpenAPI spec is the source of truth — code and tests derive from it, not the reverse
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
