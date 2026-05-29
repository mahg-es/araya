---
name: component-arch
description: "Design scalable component architectures — design systems, component libraries,"
---
---

# Component Architecture

Design scalable component architectures — design systems, component libraries,
and frontend architecture patterns that ensure consistency, reusability, and
maintainability across an application.

## What problem this solves
Without a component architecture, every developer builds the same button
differently, design drifts, and the codebase becomes a patchwork of
inconsistencies. This skill designs the architecture that organizes components
into a coherent system — hierarchical, composable, and governed.

## When to use
When starting a new frontend project. When consolidating multiple UI patterns
into a design system. When the application grows beyond 20+ components.

## Input
Design mockups, brand guidelines, technology stack, accessibility requirements.

## Output
```markdown
# Component Architecture: ARAYA Dashboard

## Design Tokens (The Source of Truth)

### Colors
```css
:root {
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-text: #ffffff;
  --color-surface: #ffffff;
  --color-surface-alt: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --color-error: #ef4444;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
}
```

### Typography Scale
| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 0.75rem | 1rem | 400 | Captions |
| `text-sm` | 0.875rem | 1.25rem | 400 | Body small |
| `text-base` | 1rem | 1.5rem | 400 | Body |
| `text-lg` | 1.125rem | 1.75rem | 500 | Subtitles |
| `text-xl` | 1.25rem | 1.75rem | 600 | Section headers |
| `text-2xl` | 1.5rem | 2rem | 700 | Page headers |
| `text-4xl` | 2.25rem | 2.5rem | 800 | Hero |

## Component Hierarchy

### Atoms (Building Blocks)
```
Button, Input, Label, Icon, Badge, Avatar, Spinner, Divider
```
- No business logic
- No external dependencies
- 100% unit test coverage

### Molecules (Compositions)
```
SearchInput, FormField, NavItem, UserCard, StatCard, Pagination
```
- Combines 2-5 atoms
- Simple state (open/closed, selected/unselected)
- Integration tested with composed atoms

### Organisms (Sections)
```
Navbar, Sidebar, DataTable, UserForm, DashboardGrid, FilterPanel
```
- Complex state
- May include API calls
- Integration tested as complete units

### Templates (Page Layouts)
```
MainLayout, AuthLayout, SettingsLayout, DashboardLayout
```
- Defines page structure
- Manages responsive breakpoints
- Visual regression tested

## Component API Design Patterns
```typescript
// Pattern 1: Polymorphic (renders as different HTML elements)
<Button as="a" href="/dashboard">Go to Dashboard</Button>
<Button as="button" onClick={handleClick}>Submit</Button>

// Pattern 2: Compound Components (parent-child relationship)
<Tabs defaultTab="users">
  <Tabs.List>
    <Tabs.Tab id="users">Users</Tabs.Tab>
    <Tabs.Tab id="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="users"><UsersContent /></Tabs.Panel>
  <Tabs.Panel id="settings"><SettingsContent /></Tabs.Panel>
</Tabs>

// Pattern 3: Render Props / Slots
<DataTable data={users}>
  <DataTable.Column accessor="name" header="Name" />
  <DataTable.Column accessor="email" header="Email" />
  <DataTable.Column accessor="actions" header="">
    {(user) => <Button onClick={() => editUser(user.id)}>Edit</Button>}
  </DataTable.Column>
</DataTable>
```

## Governance
- **Component Registry:** Storybook catalog of every component
- **Adoption:** No custom buttons/inputs — use the library
- **Contribution:** PR with Storybook story + tests + accessibility review
- **Deprecation:** Mark deprecated in one release, remove in the next
- **Versioning:** Semantic versioning — breaking API changes = major version
```

## Steps
1. Extract design tokens from brand guidelines: colors, typography, spacing, shadows, radii
2. Define the component hierarchy (Atomic Design or similar): Atoms → Molecules → Organisms → Templates
3. Design the component API for each key component
4. Choose component patterns based on use case:
   - Polymorphic for flexibility, Compound for complex state, Render Props for customization
5. Set up component registry (Storybook, Ladle, or custom)
6. Define governance: how to add, change, or deprecate components
7. Establish quality standards: accessibility, testing, documentation per component

## Rules
- Design tokens, not hardcoded values — change a token, update everywhere
- Atomic Design hierarchy: small components compose into larger ones, not the reverse
- Every component must have a Storybook story or equivalent documentation
- No custom buttons/inputs outside the library — enforce via lint rule
- Component API must be consistent: similar props names, similar patterns
- Accessibility audit on every component before release
- Deprecate before removing — give consumers one release to migrate
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
