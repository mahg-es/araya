---
name: asset-management
description: "Organize and manage digital brand assets — logos, fonts, templates, images,"
---
---

# Asset Management

Organize and manage digital brand assets — logos, fonts, templates, images,
icons — with versioning, access control, and distribution so every team
member uses the right version of every asset.

## What problem this solves
"Which logo file is the current one?" Without asset management, teams use
outdated logos, wrong-format fonts, and inconsistent templates. This skill
organizes assets into a single source of truth with clear versioning and
distribution — one canonical location for every brand file.

## When to use
When establishing brand guidelines. When managing multiple versions of assets.
When onboarding new collaborators who need brand assets.

## Input
Brand asset inventory, version history, access requirements, distribution needs.

## Output
An organized asset management system with canonical file structure, versioning,
metadata, and distribution guidelines.

## Steps
1. Inventory all brand assets: logos, fonts, templates, images, icons, documents
2. Organize hierarchical structure:
   - logos/ (primary, icon, variants by color/background)
   - fonts/ (heading, body, monospace with licenses)
   - templates/ (presentations, documents, social media)
   - images/ (photography, illustrations, backgrounds)
   - icons/ (app icons, favicons, social icons)
3. Establish naming convention: `asset-name-variant-size.format`
4. Version control: track changes, tag releases, archive obsolete
5. Add metadata per asset: created date, dimensions, format, usage guidelines
6. Distribute: shared drive, CDN, or asset library accessible to all agents

## Rules
- One canonical location for each asset type — no "which folder has the latest?"
- Naming convention enforced: `name-variant-size.format` (e.g., `MAHG-logo-primary-512px.svg`)
- Vector formats (SVG) preferred for logos and icons — resolution-independent
- Versioning: major changes = new version number; minor = incremented
- Archive, don't delete — obsolete assets moved to `archive/`, not removed
- Access: designers edit, everyone reads — no accidental overwrites
- Coordinate with Dorcas (brand governance) and visual-identity (guidelines)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
