# ARAYA Canonical Context v1.0

Status: CANONICAL
Owner: Manuel Alejandro Hernández Giuliani
Project: ARAYA
GitHub Organization: mahg-es
Canonical Repository Pattern: `github.com/mahg-es/<repo-name>`
Canonical Date: 2026-06-01

This is the single canonical context file for ARAYA. It prevents context drift, duplicate instructions, obsolete capsules, and conflicting governance. All other ARAYA documents are classified here as CANONICAL, ACTIVE_REFERENCE, ACTIVE_DRAFT, RESEARCH_REFERENCE, SUPERSEDED, DEPRECATED, or ARCHIVED. If not registered here, not authoritative.

## Quick Reference

- **ARAYA Identity:** One professional. Many specialists. One delivery organization.
- **Core Doctrine:** Evidence > Claims. Repository reality > Workspace reality. Human-usable capabilities > Technical achievements.
- **Repository Truth:** Workspace ≠ Delivered. Uncommitted ≠ Progress. Reports must identify: Workspace, Feature Branch, dev-mahg, main, Release Tag, Production.
- **Branch:** feature/* → dev-mahg → main. Direct main commits = violation.
- **Infrastructure:** Docker + Traefik mandatory. Local → Pre-production → Production.
- **Auth:** Traefik + Authelia + Application RBAC. Authentik not default.
- **Tech:** XHTML/Jinja/Tailwind/HTMX preferred. Go for Private Core. Python when appropriate.
- **Versioning:** Major.Revision.Hotfix. Max Revision=73, Max Hotfix=5. 0.73.5→1.0.0. NOT SemVer.
- **GitHub Org:** `mahg-es` (was Modern-Analytics-Harmonized-Governance).
- **Authority:** Manu=WHAT, Aurora=WHO CAN, Sonia=HOW, Daneel=TRUTH.
- **Professor:** Manuel. Strategic direction. Approves major decisions. Rejects false completion.
- **Capability-Driven:** Capabilities delivered > Workstreams completed > AWUs implemented. Capability not delivered until User Journey passes UAT.
- **Delivery Modes:** full, standard, quick, review, repair. Typo fix MUST NOT require 17-phase lifecycle.
- **ADR-007:** Formalizes capability-driven delivery, complexity scoring, model-aware batching, traceability chain.
- **Public/Private:** Public Framework defines governance. Private Go Core enforces it.
- **Strategic:** Do not optimize ARAYA endlessly. Success = real project delivery (mahg-pms).

Full context at Sections 0-40 below.
