---
name: animation
description: "Design and implement purposeful motion — page transitions, micro-interactions,"
---
---

# Animation

Design and implement purposeful motion — page transitions, micro-interactions,
loading states, and data visualizations — that guide attention, provide feedback,
and delight users without degrading performance.

## What problem this solves
Static interfaces feel dead. But gratuitous animation frustrates users, drains
battery, and triggers motion sensitivity. This skill designs animations that
serve a purpose — providing feedback, directing attention, or making state
changes understandable — while respecting user preferences and performance.

## When to use
When adding transitions between pages or UI states. When providing feedback for
user actions (button press, form submission, error). When visualizing data
changes. When the UI feels static and needs life.

## Input
UI states that need animation, performance budget, accessibility requirements.

## Output
```css
/* src/styles/animations.css */

/* Design tokens for motion */
:root {
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in from right (for panels/drawers) */
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Slide up (for toasts, modals) */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale pulse (for notifications, activity indicators) */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Skeleton loading shimmer */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-alt) 25%,
    var(--color-border) 50%,
    var(--color-surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

/* Usage classes */
.animate-fade-in {
  animation: fadeIn var(--duration-normal) var(--ease-default);
}

.animate-slide-up {
  animation: slideUp var(--duration-normal) var(--ease-out);
}

/* Page transition (React Router / View Transitions API) */
::view-transition-old(root) {
  animation: fadeIn var(--duration-fast) var(--ease-in) reverse;
}
::view-transition-new(root) {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}
```

## Purpose-Driven Animation Guide

| Purpose | Animation | Duration | Easing | Example |
|---------|-----------|----------|--------|---------|
| **Feedback** (button click) | Scale 95% → 100% | 100ms | ease-out | Button press feedback |
| **Attention** (notification) | Slide up + fade | 300ms | ease-out | Toast notification |
| **State change** (expand/collapse) | Height transition | 200ms | ease-default | Accordion, dropdown |
| **Navigation** (page change) | Cross-fade | 200ms | ease-default | SPA route change |
| **Loading** (skeleton) | Shimmer | 1.5s loop | linear | Content placeholder |
| **Visualization** (data change) | Tween values | 500ms | ease-out | Chart updates |
| **Delight** (success) | Scale bounce | 400ms | ease-bounce | Checkmark animation |

## Steps
1. Identify states that change in the UI — transitions between states are animation candidates
2. Categorize by purpose: feedback, attention, state change, navigation, loading, delight
3. Choose animation type per purpose (see guide above)
4. Implement with CSS animations (preferred) or JS (for complex orchestration)
5. Always include `prefers-reduced-motion` override
6. Only animate `transform` and `opacity` — these are GPU-composited and don't trigger layout
7. Test on low-end device — animation should not drop below 60fps

## Rules
- `prefers-reduced-motion: reduce` kills all animations — non-negotiable for accessibility
- Only animate `transform` + `opacity` — never `width`, `height`, `top`, `left` (triggers layout)
- Animation duration: 100ms-500ms max — longer animations feel sluggish
- Purpose before beauty — an animation without purpose is just a distraction
- No animation on first load — let the page render, then animate subsequent interactions
- Performance budget: animations must maintain 60fps on target devices
- Use `will-change` sparingly and remove after animation — overuse causes memory bloat
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
