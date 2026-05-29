---
name: theme-design
description: "Design CSS theme systems — design tokens, color palettes, typography scales,"
---
---

# Theme Design

Design CSS theme systems — design tokens, color palettes, typography scales,
spacing, dark/light modes, and component variants — creating consistent,
maintainable visual systems for websites and applications.

## What problem this solves
Hardcoded colors and inconsistent spacing create visual chaos across pages.
Theme design codifies the visual language into design tokens — change one
token, and every component updates consistently. Themes make visual design
systematic, not accidental.

## When to use
When building or redesigning a website or application. When implementing
dark mode. When visual inconsistency is visible across pages.

## Input
Brand guidelines (from Dorcas), design preferences, accessibility requirements,
supported modes (light, dark, high-contrast).

## Output
A complete CSS theme with design tokens, dark/light mode support, typography
scale, spacing system, and component variant definitions.

## Steps
1. Extract design tokens from brand guidelines (colors, fonts, logos)
2. Define CSS custom properties on `:root`:
   - Colors: primary, surface, text, border, semantic (error, success, warning)
   - Typography: font-family, font-size scale, font-weight, line-height
   - Spacing: 4px-based scale (4, 8, 12, 16, 24, 32, 48, 64)
   - Radii: sm (4px), md (8px), lg (16px), full (9999px)
   - Shadows: sm, md, lg (for elevation)
3. Design dark mode: `[data-theme="dark"]` or `prefers-color-scheme: dark`
4. Create component variants using design tokens (primary, secondary, danger, ghost)
5. Test accessibility: contrast ratios, focus indicators, reduced motion
6. Document theme tokens for developer reference

## Rules
- Design tokens, not hardcoded values — everything through CSS custom properties
- 4px spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 — no custom spacing
- Color contrast: 4.5:1 for text, 3:1 for large text, 3:1 for UI components
- Dark mode: darker surfaces, lighter text, adjusted saturation (not just inverted)
- Reduced motion: animations disabled or minimized when preferred
- High-contrast mode for accessibility (optional but recommended)
- Coordinate with Dorcas (brand guidelines) and Aquila (static sites)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
