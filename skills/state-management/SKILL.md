---
name: state-management
description: "Design frontend state management architecture — choosing the right pattern"
---
---

# State Management

Design frontend state management architecture — choosing the right pattern
(server state, client state, form state, URL state) and implementing it with
the right tools for scalability and maintainability.

## What problem this solves
Scattered useState and prop drilling leads to spaghetti state — impossible to
debug, full of stale data, and riddled with race conditions. This skill designs
a state architecture that categorizes state by type and uses the right tool
for each, keeping state predictable, debuggable, and efficient.

## When to use
When setting up a new frontend application. When an existing app has scattered,
unpredictable state. When adding complex features that need shared state.

## Input
Application features, data flow, API structure, real-time requirements.

## Output
```markdown
# State Management Architecture: ARAYA Dashboard

## State Categories (5 Types)

| State Type | What It Is | Tool | Example |
|-----------|-----------|------|---------|
| **Server State** | Data from the backend | React Query / SWR | Users list, orders, prices |
| **Client State** | UI-only state | Zustand / Jotai | Sidebar open, theme, selected tab |
| **Form State** | Ephemeral input state | React Hook Form | Login form, user create form |
| **URL State** | State reflected in URL | React Router | Current page, filters, sort order |
| **URL State** | Persistent across sessions | localStorage | Auth token, user preferences |

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                      App State                          │
│                                                         │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ React Query  │  │ Zustand  │  │ React Hook Form  │  │
│  │ (Server)     │  │ (Client) │  │ (Forms)          │  │
│  │              │  │          │  │                  │  │
│  │ /api/users   │  │ sidebar  │  │ loginForm        │  │
│  │ /api/orders  │  │ theme    │  │ userForm         │  │
│  │ /api/prices  │  │ toasts   │  │ settingsForm     │  │
│  └──────┬───────┘  └────┬─────┘  └────────┬─────────┘  │
│         │               │                  │            │
│         ▼               ▼                  ▼            │
│  ┌──────────────────────────────────────────────────┐   │
│  │              URL State (React Router)             │   │
│  │  /users?page=2&sort=name&filter=active           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Server State Configuration (React Query)
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30 seconds before refetch
      gcTime: 5 * 60_000,         // 5 min garbage collection
      retry: 2,                    // Retry failed queries twice
      refetchOnWindowFocus: true,  // Refetch when user returns
    },
    mutations: {
      retry: 0,                    // Don't retry mutations
    },
  },
});
```

## Client State Store (Zustand)
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppStore {
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "light",
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "araya-app-store" } // Persists to localStorage
  )
);
```

## State Guidelines
- **Server state**: Cache aggressively, invalidate on mutation, never duplicate in client state
- **Client state**: Keep minimal — if it can be derived from server state, derive it
- **Form state**: Isolated to form component — don't lift to global state
- **URL state**: Source of truth for pagination, filters, sort — shareable and bookmarkable
```

## Steps
1. Categorize state by type: server, client, form, URL, persistent
2. For each category, choose the right tool:
   - Server: React Query, SWR, Apollo Client
   - Client: Zustand, Jotai (lightweight), Redux Toolkit (complex apps)
   - Form: React Hook Form, Formik
   - URL: React Router, Next.js router
3. Define cache policies: stale time, retry strategy, garbage collection
4. Implement stores with separation of concerns — one store per domain, not one global store
5. Add DevTools for debugging (React Query DevTools, Redux DevTools)
6. Document state flow for each feature: where does state live, who updates it, who reads it

## Rules
- Server state and client state must be in separate stores — never cache server data in Zustand/Redux
- URL is the source of truth for page-level state (filters, sort, pagination)
- Form state stays in the form — don't lift it to global state
- Optimistic updates for mutations where appropriate — update UI before server confirmation
- Stale time ≥ 30 seconds for read-heavy data — avoid unnecessary refetches
- Never duplicate state — one source of truth per data type
- If state can be derived, derive it — don't store derived state
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
