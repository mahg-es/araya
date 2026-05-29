---
name: component
description: "Create reusable, accessible, and well-typed UI components following design system"
---
---

# Component

Create reusable, accessible, and well-typed UI components following design system
patterns. Each component handles its own state, props, styling, and edge cases.

## What problem this solves
Copy-pasting UI code leads to inconsistencies, bugs, and maintenance nightmares.
This skill produces components that are self-contained, composable, and
consistent — built once, used everywhere, tested thoroughly.

## When to use
When building any new UI element: buttons, inputs, cards, modals, tables, forms.
When refactoring duplicated UI code into shared components.

## Input
Design mockup, component requirements, accessibility level (WCAG AA default).

## Output
```tsx
// src/components/Button/Button.tsx
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : icon ? (
        <span className={styles.icon} aria-hidden="true">{icon}</span>
      ) : null}
      <span className={loading ? styles.loadingText : undefined}>
        {loading ? "Loading..." : children}
      </span>
    </button>
  );
}
```

## Steps
1. Define the component's purpose and API (props interface)
2. Identify variants: size (sm/md/lg), visual style (primary/secondary/danger), state (loading/disabled/error)
3. Design the props interface:
   - Required vs. optional props
   - Extend native HTML attributes where appropriate
   - Use discriminated unions for complex state combinations
4. Implement the component:
   - Handle all states: default, hover, focus, active, disabled, loading, error
   - Add aria attributes for accessibility: `aria-label`, `aria-busy`, `aria-expanded`, etc.
   - Support keyboard navigation: Enter, Space, Escape, Tab
5. Add CSS/styling (CSS Modules, Tailwind, or styled-components)
6. Handle edge cases: empty content, very long text, RTL languages, reduced motion
7. Write to `src/components/<ComponentName>/` with co-located styles and tests

## Rules
- Every component must handle: default, hover, focus, active, disabled, loading, error states
- `aria-label` required when visual label is not sufficient
- Keyboard accessible: all interactive elements reachable via Tab, activatable via Enter/Space
- `data-testid` attributes for test selection — never rely on CSS classes in tests
- Props extend native HTML attributes where the component wraps a native element
- Support `className` prop for consumer customization
- Import only what you need — no giant component libraries for a single button
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
