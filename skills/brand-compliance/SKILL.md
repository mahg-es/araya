---
name: brand-compliance
description: "Audit and enforce brand compliance across all projects and platforms — logo,"
---
---

# Brand Compliance

Audit and enforce brand compliance across all projects and platforms — logo,
color, typography, voice, and visual identity — ensuring every output
represents Manuel Alejandro Hernández Giuliani's brand consistently.

## What problem this solves
Brand inconsistency erodes trust. Different logos on different sites, wrong
colors on slides, mismatched typography — each is a small crack in brand
credibility. This skill audits all published properties for brand compliance
and produces actionable fixes with specific references to canonical brand
guidelines.

## When to use
Quarterly brand audit. When launching a new site or project. When someone
creates content outside established templates. When The Data Professor asks
"does this look on-brand?"

## Input
Canonical brand guidelines (`my-brands-guidelines/`), project URLs or files
to audit.

## Output
```markdown
# Brand Compliance Audit: Q2 2026

## Canonical Brand Guidelines
**Source:** `Modern-Analytics-Harmonized-Governance/my-brands-guidelines/`

### Brand Assets
| Asset | Canonical Location | Version |
|-------|-------------------|---------|
| Primary Logo | `brand-assets/logo/MAHG-logo-primary.svg` | v2.0 |
| Icon/Favicon | `brand-assets/logo/MAHG-icon.svg` | v2.0 |
| Color Palette | See below | v2.0 |
| Typography | Inter (headings), Source Sans Pro (body) | v3.0 |

### MAHG Color System
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#1a56db` | Buttons, links, accents |
| Primary Dark | `#1e40af` | Hover states |
| Surface | `#ffffff` | Backgrounds, cards |
| Surface Alt | `#f8fafc` | Alternate backgrounds |
| Text Primary | `#0f172a` | Headings, body |
| Text Secondary | `#64748b` | Muted text, captions |
| Border | `#e2e8f0` | Dividers, card borders |
| Error | `#ef4444` | Error states |
| Success | `#22c55e` | Success states |

## Audit Results

### mahg.es
| Check | Status | Issue | Fix |
|-------|--------|-------|-----|
| Logo | 🟢 PASS | v2.0 logo used | — |
| Favicon | 🟡 FAIL | Old icon (v1.0) | Replace with `MAHG-icon.svg` v2.0 |
| Primary Color | 🟢 PASS | `#1a56db` | — |
| Font | 🟡 FAIL | Using Roboto instead of Inter | Update CSS font-family |
| Copyright | 🟢 PASS | Correct format | — |
| Responsive | 🟢 PASS | Mobile-friendly | — |

### thedataprofessor.com
| Check | Status | Issue | Fix |
|-------|--------|-------|-----|
| Logo | 🟢 PASS | Site-specific logo (approved variant) | — |
| Primary Color | 🔴 FAIL | `#2563eb` (wrong) | Change to `#1a56db` |
| Font | 🟢 PASS | Inter | — |
| Copyright | 🟢 PASS | Correct format | — |

### hispanopinion.es
| Check | Status | Issue | Fix |
|-------|--------|-------|-----|
| Logo | 🟢 PASS | Site-specific logo (approved variant) | — |
| Primary Color | 🟢 PASS | `#1a56db` | — |
| Font | 🔴 FAIL | Georgia (serif) on body text | Change to Source Sans Pro |

### manuelhernandezgiuliani.com
| Check | Status | Issue | Fix |
|-------|--------|-------|-----|
| Logo | 🟡 FAIL | No logo on homepage | Add MAHG logo top-left |
| Favicon | 🔴 FAIL | Default favicon (globe icon) | Add MAHG icon |
| Primary Color | 🟡 FAIL | `#3b82f6` (Tailwind default) | Change to `#1a56db` |
| Copyright | 🔴 FAIL | No copyright footer | Add © 2026 footer |

## Summary
| Property | Score | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| mahg.es | 85% | 0 | 0 | 2 | 0 |
| thedataprofessor.com | 75% | 1 | 0 | 0 | 0 |
| hispanopinion.es | 80% | 0 | 1 | 0 | 0 |
| manuelhernandezgiuliani.com | 55% | 2 | 2 | 0 | 0 |

## Remediation Priority
| Priority | Action | Properties | Effort |
|----------|--------|-----------|--------|
| P0 | Fix manuelhernandezgiuliani.com — missing logo, favicon, copyright | 1 site | 30 min |
| P0 | Fix thedataprofessor.com primary color | 1 site | 5 min |
| P1 | Fix favicon on mahg.es | 1 site | 5 min |
| P1 | Fix font on hispanopinion.es | 1 site | 10 min |
| P1 | Fix font on mahg.es | 1 site | 5 min |

## Brand Voice Audit (Content)
| Property | Tone | Issue |
|----------|------|-------|
| thedataprofessor.com | Professional, technical 🟢 | On-brand |
| hispanopinion.es | Opinionated, engaging 🟢 | On-brand |
| LinkedIn posts | Professional, educational 🟢 | On-brand |
| X/Twitter | 🟡 Inconsistent | Some posts too casual — align with professional tone |
```

## Steps
1. Load canonical brand guidelines from `my-brands-guidelines/`
2. For each property, audit:
   - **Logo:** Correct version, correct placement, correct sizing
   - **Color:** Primary, secondary, surface, text — match hex values
   - **Typography:** Correct font family, correct weights, correct hierarchy
   - **Favicon:** Present and matches canonical icon
   - **Copyright:** "© YYYY Manuel Alejandro Hernández Giuliani. All rights reserved."
   - **Responsive:** Works at 320px, 768px, 1024px, 1440px
3. Score each property (pass / fail per check)
4. Prioritize fixes: Critical (brand credibility at risk) → High → Medium → Low
5. Produce remediation plan with specific file paths and hex values to change
6. Re-audit after fixes to confirm compliance

## Rules
- Canonical brand guidelines are non-negotiable — reference, don't interpret
- Every published property audited quarterly — brand drift is gradual but cumulative
- Copyright year must be current: update annually
- Logo must link to homepage — standard web convention
- Brand voice matters as much as visual identity — audit content tone, not just design
- Fixes must reference exact values (hex, font name, file path), not vague suggestions
- Coordinate with Aquila for website fixes and Lucas for content voice
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
