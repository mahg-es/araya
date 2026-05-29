---
name: responsive
description: "Implement mobile-first responsive design — fluid layouts, breakpoints,"
---
---

# Responsive

Implement mobile-first responsive design — fluid layouts, breakpoints,
responsive images, and device-appropriate interactions — so the application
works beautifully on every screen from 320px to 4K.

## What problem this solves
Desktop-only designs break on mobile; phone-only designs waste desktop space.
This skill produces responsive layouts that adapt gracefully to any viewport
using CSS Grid, Flexbox, container queries, and responsive design patterns.

## When to use
When building any UI. When making an existing design responsive. When
The Data Professor reviews a page and it doesn't work on mobile.

## Input
Design mockups at key breakpoints (mobile 375px, tablet 768px, desktop 1440px).

## Output
```css
/* src/styles/responsive.css */

/* Mobile-first base styles (320px+) */
.container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1rem;
}

/* Navigation: hamburger on mobile */
.nav {
  display: none; /* Hidden by default, toggled via JS */
}

.nav.open {
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-surface);
  padding: 1rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.hamburger {
  display: flex; /* Visible on mobile */
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .container {
    grid-template-columns: 250px 1fr; /* Sidebar + content */
    gap: 2rem;
    padding: 2rem;
  }

  .nav {
    display: flex;
    position: static;
    flex-direction: row;
    gap: 1.5rem;
    box-shadow: none;
  }

  .hamburger {
    display: none; /* Hide hamburger on tablet+ */
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    grid-template-columns: 280px 1fr 320px; /* Sidebar + content + panel */
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .container {
    max-width: 1400px;
    margin: 0 auto;
  }
}
```

## Steps
1. Design mobile-first: start at 320px, add complexity at larger breakpoints
2. Define breakpoints based on content, not devices:
   - 480px: Large phones landscape
   - 768px: Tablets
   - 1024px: Small laptops / tablets landscape
   - 1280px: Desktops
   - 1440px+: Large desktops (max-width container)
3. Choose layout strategy:
   - **Single column** (mobile) → **2 columns** (tablet) → **3 columns** (desktop)
   - **Stacked** (mobile) → **Side-by-side** (tablet+) 
   - **Hamburger menu** (mobile) → **Visible nav** (tablet+)
4. Responsive images: `srcset` and `sizes` attributes for resolution switching
5. Responsive typography: `clamp()` for fluid font sizes
6. Touch targets: minimum 44×44px on mobile (WCAG)
7. Test at every breakpoint: 320, 375, 414, 768, 1024, 1280, 1440, 1920

## Rules
- Mobile-first: base styles are mobile; `min-width` media queries add complexity
- Breakpoints in relative units (em/rem), not pixels, for zoom tolerance
- Never use `max-width` media queries as primary strategy — they fight mobile-first
- Touch targets minimum 44×44px — Apple HIG and WCAG requirement
- `clamp()` for fluid typography: `font-size: clamp(1rem, 2.5vw, 1.5rem)`
- Test on real devices when possible — Chrome DevTools device mode is not reality
- Reduced motion: `@media (prefers-reduced-motion)` for animations
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
