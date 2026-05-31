---
name: auth-middleware
description: "Implement authentication and authorization middleware — JWT validation, role-based"
governance: "Constitution ENG-004: Engineering Excellence & Software Craftsmanship Standard"
---
---

# Auth Middleware

Implement authentication and authorization middleware — JWT validation, role-based
access control, API key verification, and session management — securing every
endpoint from unauthorized access.

## What problem this solves
Protecting routes with copy-pasted auth code leads to inconsistencies and security
gaps. This skill produces centralized middleware that authenticates every request,
verifies permissions, and fails securely — applied once, enforced everywhere.

## When to use
When implementing authentication for any API. When adding role-based access
control. When securing existing unprotected endpoints. Always before exposing
any endpoint to a network.

## Input
Authentication strategy (JWT, API key, session), user roles, endpoint access matrix.

## Output
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthUser {
  userId: string;
  role: "user" | "admin";
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// --- Authenticate: verify JWT token ---
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid authorization header",
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
      return;
    }
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid token",
    });
    return;
  }
}

// --- Authorize: require specific role(s) ---
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden",
        message: `Role '${req.user.role}' is not authorized for this resource`,
      });
      return;
    }

    next();
  };
}

// Usage in routes:
// router.get("/admin/users", authenticate, authorize("admin"), adminHandler);
// router.get("/profile", authenticate, profileHandler);
```

## Steps
1. Determine authentication method: JWT (most common), API key, OAuth2, session
2. Implement `authenticate` middleware:
   - Extract token from Authorization header
   - Verify token signature and expiry
   - Attach user info to request object
   - Return 401 for missing, expired, or invalid tokens
3. Implement `authorize` middleware:
   - Check user role against required roles
   - Return 403 for insufficient permissions
   - Never reveal which roles exist in error message
4. Handle token refresh: implement refresh token rotation with short-lived access tokens
5. Add rate limiting on auth endpoints (login, refresh) to prevent brute force
6. Configure JWT: short expiry (15 min access, 7 day refresh), RS256 or HS256, secure storage
7. Write middleware to project's middleware/auth directory

## Rules
- JWT access tokens: 15 minutes max — short-lived, refresh with rotation
- Never store tokens in localStorage (XSS risk) — httpOnly cookies or secure memory
- Password hashing: bcrypt with cost factor ≥ 12 — never MD5, SHA1, or SHA256
- Failed login: "Invalid email or password" — never reveal which field was wrong
- Rate limit auth endpoints: 5 attempts per IP per 15 minutes
- 401 = not authenticated (log in first), 403 = not authorized (wrong permissions)
- Coordinate with Diana for security review of all auth code
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
