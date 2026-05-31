---
name: error-handling
description: "Design and implement standardized error handling patterns — consistent error"
governance: "Constitution ENG-004: Engineering Excellence & Software Craftsmanship Standard"
---
---

# Error Handling

Design and implement standardized error handling patterns — consistent error
responses, logging, and recovery — so errors are debuggable for developers
and safe for users.

## What problem this solves
Inconsistent error handling leads to information leakage (stack traces to users),
lost debugging context (no logs), and confusing API responses. This skill
establishes a single error-handling pattern used by every endpoint and service.

## When to use
At project setup. When an existing project has inconsistent error handling.
When adding error tracking/monitoring. Before any API goes to production.

## Input
Project language, framework, logging setup, error tracking service.

## Output
1. **Error classes**:
```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found`, 404, "NOT_FOUND", { resource, id });
  }
}

export class ValidationError extends AppError {
  constructor(details: Array<{ field: string; message: string }>) {
    super("Validation failed", 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(resource: string) {
    super(`${resource} already exists`, 409, "CONFLICT");
  }
}
```

2. **Error handler middleware**:
```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known application errors
  if (err instanceof AppError) {
    logger.warn({
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // Unknown errors — log fully, return generic
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers["x-request-id"],
  });

  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  });
}
```

## Steps
1. Define error hierarchy: base AppError → specific errors (NotFound, Validation, etc.)
2. Each error carries: HTTP status code, machine-readable code, human message, optional details
3. Create error handler middleware that:
   - Catches AppError → returns structured JSON with correct status
   - Catches unknown errors → logs full details, returns generic 500 to user
   - Never exposes stack traces or internal paths in production
4. Set up logging: warn for 4xx (client errors), error for 5xx (server errors)
5. Include request context in logs: path, method, request ID, user ID (if authenticated)
6. Handle async errors: wrap async handlers or use express-async-errors
7. Add health check endpoint that exercises error handling

## Rules
- Every error response follows: `{ error: code, message: string, details?: any }`
- Never expose stack traces, SQL errors, or file paths to clients — log them, don't return them
- 4xx errors are the client's fault (log at warn); 5xx errors are our fault (log at error)
- Always include a machine-readable error code — clients should never parse human messages
- Unhandled promise rejections must crash the process (let the process manager restart it)
- Validation errors must return which field failed and why — not just "invalid input"
- Coordinate with Diana: error messages must not leak system internals
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
