# ARAYA Canonical Context v1.0

Status: CANONICAL
Owner: Manuel Alejandro Hernández Giuliani
Project: ARAYA
GitHub Organization: mahg-es
Canonical Repository Pattern: `github.com/mahg-es/<repo-name>`
Canonical Date: 2026-07-20

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
- **Authority:** Manu=WHAT, Aurora=WHO CAN, Sonia=HOW, Rolando=TRUTH (renamed from Daneel 2026-07-19; reports to Giskard, not delivery ops). Daneel=Giskard's delegated executor across Portfolio and every governed project — routes to the specialist bench (Valentina, Alejandra, Clara, Isla, etc.) per task.
- **Professor:** Manuel. Strategic direction. Approves major decisions. Rejects false completion.
- **Capability-Driven:** Capabilities delivered > Workstreams completed > AWUs implemented. Capability not delivered until User Journey passes UAT.
- **Delivery Modes:** full, standard, quick, review, repair. Typo fix MUST NOT require 17-phase lifecycle.
- **ADR-007:** Formalizes capability-driven delivery, complexity scoring, model-aware batching, traceability chain.
- **ADR-008 (2026-07-20):** Universal Agent Tool Access — all agents have permanent read, bash, and PostOffice read/write access. Governed by ADR-008 + Constitution TOOL section + agent-tool-access-standard.md. Subject to security, destructive operations, secrets, scope, and main-branch governance restrictions.
- **Public/Private:** Public Framework defines governance. Private Go Core enforces it.
- **Strategic:** Do not optimize ARAYA endlessly. Success = real project delivery (mahg-pms).
- **Multi-project coordination model (canonical, 2026-07-19):** one terminal/session per project, each anchored in that project's own repo, `AGENTS.md`, and PostOffice channel — never one terminal invoking multiple projects. Giskard is the single cross-project coordinator, working through each project's file-based PostOffice (`.araya/postoffice/`), not by operating inside each project's terminal. The Professor runs the human side of each project's terminal when he chooses to advance it; Giskard reviews/dispatches/verifies via PostOffice in between. When Giskard needs the Professor's direct attention on something, it must name the exact terminal/project to switch to, explicitly — never leave it implicit.

Full context at Sections 0-40 below.
