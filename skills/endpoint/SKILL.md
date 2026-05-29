---
name: endpoint
description: "Implement REST API endpoints with validation, error handling, and database"
---
---

# Endpoint

Implement REST API endpoints with validation, error handling, and database
integration — turning an API specification into working, tested code.

## What problem this solves
An API specification describes what endpoints should do; this skill makes them
real. It generates endpoint code with input validation, business logic, database
operations, and standardized responses — production-ready from the start.

## When to use
After API design (`api-design`) and schema design (`db-schema`) are complete.
When implementing any new endpoint or refactoring existing ones.

## Input
OpenAPI specification, database schema, authentication requirements.

## Output
Endpoint implementation (Node.js/Express example):

```typescript
// src/routes/users.ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { hashPassword } from "../auth";
import { validate } from "../middleware/validate";

const router = Router();

// --- POST /api/v1/users ---
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/", validate(createUserSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check for duplicate email
    const existing = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: "Conflict",
        message: "A user with this email already exists",
      });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash]
    );

    return res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    });
  }
});

// --- GET /api/v1/users/:id ---
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: "Bad Request",
        message: "Invalid user ID format",
      });
    }

    const result = await db.query(
      "SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Not Found",
        message: "User not found",
      });
    }

    return res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    });
  }
});

export default router;
```

## Steps
1. Read the OpenAPI specification for the endpoint
2. Set up input validation using schema validation library (Zod, Joi, class-validator)
3. Implement the route handler:
   - Validate input → return 400 if invalid
   - Check authorization (delegate to auth middleware)
   - Execute business logic / database operation
   - Return appropriate success response
   - Catch errors → return appropriate error response
4. Handle edge cases: duplicate records (409), not found (404), forbidden (403)
5. Ensure error responses follow consistent format: `{ error, message, details? }`
6. Never expose internal errors to the client — log them, return generic 500
7. Write the endpoint file to the routes/controllers directory

## Rules
- Input validation on every endpoint — never trust client data
- Consistent error format: `{ error: string, message: string, details?: any[] }`
- Never expose stack traces, SQL errors, or internal paths in responses
- 201 for creation, 200 for reads/updates, 204 for deletions (or 200 with body)
- Parametrize all SQL queries — never string concatenation
- Return only the data the client needs — never return password hashes, internal IDs unnecessarily
- Coordinate with Diana for security-sensitive endpoints (auth, payments, PII)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
