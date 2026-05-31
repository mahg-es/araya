---
name: api-integration
description: "Connect frontend to backend — type-safe API clients, request/response handling,"
governance: "Constitution ENG-004: Engineering Excellence & Software Craftsmanship Standard"
---
---

# API Integration

Connect frontend to backend — type-safe API clients, request/response handling,
caching, optimistic updates, and error recovery — making API calls reliable
and predictable.

## What problem this solves
Scattered fetch calls with manual error handling lead to inconsistent loading
states, data staleness, and UI bugs. This skill creates a centralized API
layer with type safety, caching, retry logic, and consistent state management.

## When to use
When connecting React/Vue/Svelte frontend to any API. When replacing ad-hoc
fetch/axios calls with a structured API layer.

## Input
OpenAPI specification or API endpoint list.

## Output
```typescript
// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api/v1";

interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("accessToken");

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: "UNKNOWN",
        message: "An unexpected error occurred",
      }));

      if (response.status === 401) {
        // Attempt token refresh or redirect to login
        window.dispatchEvent(new CustomEvent("auth:expired"));
      }

      throw new ApiRequestError(response.status, error);
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;

    return response.json();
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError
  ) {
    super(error.message);
  }
}

export const api = new ApiClient();
```

```typescript
// src/api/users.ts
import { api } from "./client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export const usersApi = {
  list: () => api.get<{ data: User[] }>("/users"),
  get: (id: string) => api.get<{ data: User }>(`/users/${id}`),
  create: (data: CreateUserRequest) => api.post<{ data: User }>("/users", data),
};
```

## Steps
1. Create a base API client with:
   - Base URL configuration (environment variable)
   - Automatic Authorization header injection
   - Consistent response parsing
   - Error transformation (HTTP status → typed error)
   - 401 handling: token refresh or redirect to login
2. Create typed endpoint functions grouped by resource
3. Set up caching with React Query / SWR / Vue Query:
   - Stale time: 30 seconds for lists, 5 minutes for detail views
   - Retry: 3 attempts with exponential backoff for GET, no retry for mutations
4. Implement optimistic updates for mutations where appropriate
5. Handle loading states: skeleton screens, not spinners
6. Handle error states: toast for transient errors, inline for field errors, full page for fatal errors

## Rules
- Every API call must handle: loading, success, error, and empty states
- 401 response → attempt token refresh exactly once; if it fails, redirect to login
- Never store tokens in localStorage in production — use httpOnly cookies or secure memory
- GET requests: cache with stale-while-revalidate pattern
- Mutations (POST/PUT/DELETE): no caching; invalidate affected GET queries on success
- TypeScript types derived from API schema — never manually typed API responses
- Network errors (offline, timeout) must surface user-friendly messages, not "TypeError: Failed to fetch"
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
