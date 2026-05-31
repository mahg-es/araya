# Engineering Excellence & Software Craftsmanship Standard

**Timestamp:** 2026-05-31 11:00 +0200
**Author:** The Data Professor
**Status:** Active
**Scope:** Company-wide — all code creators, reviewers, auditors, and approvers

---

## Scope

This standard applies to:

- Front-End Developers
- Back-End Developers
- Full-Stack Developers
- Software Engineers
- Technical Leads
- Architects
- Code Reviewers
- Code Auditors
- QA Engineers performing code reviews
- AI-assisted developers using Copilot, Codex, Gemini, Cursor, or similar tools

Anyone who creates, modifies, reviews, approves, audits, or deploys code must follow this standard.

---

## 1. Core Engineering Principles

### 1.1 Follow Industry Standards

All code must align with established industry best practices.

Priorities:

1. Security
2. Maintainability
3. Readability
4. Testability
5. Reusability
6. Scalability
7. Performance

Code that works but is difficult to maintain is not considered acceptable.

---

### 1.2 Adopt Unix Philosophy

Engineering teams must apply Unix principles whenever practical.

#### Rule 1: Do One Thing Well

Components, services, modules, templates, and functions should have a single clear responsibility.

**Avoid:**

- Giant controllers
- Giant templates
- Giant services
- One-page-does-everything designs

**Prefer:**

- Small focused components
- Clear separation of concerns
- Modular architecture

---

#### Rule 2: Build Reusable Components

If code is repeated, it should become a reusable component.

**Examples:**

- Shared templates
- Shared macros
- Shared UI components
- Shared services
- Shared utilities

**Avoid copy-paste development.**

---

#### Rule 3: Compose Rather Than Duplicate

New functionality should be assembled from existing building blocks whenever possible.

**Before creating new code:**

- Check whether a reusable solution already exists.
- Extend existing patterns before creating parallel implementations.

---

## 2. Front-End Standards

Front-end development must use:

- Template inheritance
- Shared layouts
- Shared partials
- Shared macros
- Shared navigation components
- Shared breadcrumbs
- Shared cards
- Shared tables/lists
- Shared status badges
- Shared action buttons

**Avoid:**

- Inline JavaScript
- Inline CSS
- Repeated markup
- Duplicated role logic
- Large monolithic pages

Navigation must be progressive and context-aware.

---

## 3. Back-End Standards

Back-end development must enforce:

- Clear service boundaries
- Explicit naming
- Dependency injection where appropriate
- Separation of routing, services, repositories, and business logic
- Centralized configuration
- Reusable domain services

**Avoid:**

- Business logic in routes
- Hardcoded values
- Copy-pasted authorization checks
- Duplicate service implementations

---

## 4. Security Standards

Security is mandatory at all layers.

Security must be enforced at:

- Navigation level
- Menu level
- Page level
- API level
- Service level
- Business-rule level
- Data-access level

Hiding UI elements is not security.

Authorization must always be enforced server-side.

---

## 5. Code Review Standards

Every reviewer must verify:

### Maintainability

- Is the code understandable?
- Is duplication minimized?
- Is responsibility clearly separated?

### Reusability

- Can this be reused?
- Should this be extracted into a shared component?

### Security

- Is authorization enforced?
- Are permissions validated server-side?

### Testing

- Are tests present?
- Do tests validate behavior?

### Architecture

- Does this follow established platform patterns?

---

## 6. Code Audit Standards

Audits must evaluate:

- Technical debt
- Duplication
- Security risks
- Architectural drift
- Performance concerns
- Maintainability risks

Audits must propose reusable patterns instead of isolated fixes.

---

## 7. AI-Assisted Development Standards

When using AI tools:

- AI-generated code must be reviewed.
- AI-generated code must follow platform standards.
- AI-generated code must not introduce duplication.
- AI-generated code must not bypass security patterns.
- AI-generated code must not become production code without human validation.

**Human accountability remains mandatory.**

---

## 8. Definition of Done

Work is not complete unless:

- Standards are followed.
- Security is enforced.
- Duplication is minimized.
- Reusable patterns are used.
- Tests pass.
- Documentation is updated.
- Code review is completed.

---

## Engineering Principle

Create systems that are:

- Secure
- Maintainable
- Reusable
- Testable
- Observable
- Scalable

Build once.
Reuse everywhere.

Prefer composition over duplication.

Prefer clarity over cleverness.

Prefer maintainability over short-term speed.
