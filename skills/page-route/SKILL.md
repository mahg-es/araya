---
name: page-route
description: "Design and implement page routing — URL structure, navigation, layouts,"
governance: "Constitution ENG-004: Engineering Excellence & Software Craftsmanship Standard"
---
---

# Page Route

Design and implement page routing — URL structure, navigation, layouts,
protected routes, and lazy loading — creating a coherent application
navigation experience.

## What problem this solves
Ad-hoc routing leads to broken back buttons, unshareable URLs, and confused
users. This skill designs a complete routing structure with nested layouts,
guards, code splitting, and SEO-friendly URLs that make the application
navigable, bookmarkable, and performant.

## When to use
When setting up a new application. When adding new pages or restructuring
navigation. When implementing authentication-gated sections.

## Input
Page inventory, authentication requirements, layout structure.

## Output
```tsx
// src/router/index.tsx
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "../hooks/useAuth";
import { MainLayout } from "../layouts/MainLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { LoadingPage } from "../components/LoadingPage";

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Users = lazy(() => import("../pages/Users"));
const UserDetail = lazy(() => import("../pages/UserDetail"));
const Login = lazy(() => import("../pages/Login"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Route guard: redirect to login if not authenticated
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthLayout />,
    children: [
      { index: true, element: <Login /> },
    ],
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
          {
            path: "users",
            children: [
              { index: true, element: <Users /> },
              { path: ":userId", element: <UserDetail /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
```

## Steps
1. Map all application pages: public (login, landing) vs. protected (dashboard, settings)
2. Design URL structure:
   - RESTful patterns: `/users` (list), `/users/:id` (detail), `/users/new` (create)
   - Nested resources: `/projects/:id/tasks/:taskId`
   - Avoid deep nesting (> 3 levels)
3. Design layout hierarchy: AuthLayout (minimal) → MainLayout (sidebar + header + content)
4. Implement route guards:
   - Auth guard: redirect to login if unauthenticated
   - Role guard: redirect to 403 if wrong permissions
   - Verification guard: redirect to verify-email if unverified
5. Add lazy loading: dynamic imports for each page, Suspense fallback
6. Handle edge states: loading (initial page load), empty (no data), error (data fetch failed), 404 (not found)
7. Add scroll restoration: scroll to top on route change
8. Write router configuration to project's router directory

## Rules
- All pages lazy-loaded by default — no user downloads code for pages they never visit
- Auth guards must check auth state BEFORE rendering protected content — no flash of protected page
- URLs must be shareable and meaningful: `/users/abc-123` not `/page?id=abc-123`
- 404 page always present — catch-all route at the end
- Navigation items must highlight the current route (active state)
- Breadcrumbs for nested routes: Dashboard > Users > User Detail
- Skeleton screens during lazy loading — better than spinners for perceived performance
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
