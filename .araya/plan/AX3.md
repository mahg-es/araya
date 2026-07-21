# plan — AX3 Local Contract

## Purpose

Planning and specification subtree for the ARAYA Framework. Contains all requirements,
specifications, architecture designs, acceptance criteria, and workstream plans that
drive execution of the SDLC pipeline.

## Ownership

- **Architecture specs:** Aisha (Backend Architect), Isla (Infra Architect)
- **Requirements & acceptance:** Manu (Product Owner) 👑
- **Workstream planning:** Sonia (PM Head Orchestrator)
- **Governance:** All docs must pass Manu's SPEC_APPROVED gate before implementation begins

## Local Contracts

- All spec documents live in `.araya/plan/spec/` and follow the naming convention
  `req-XXX-description.md`
- Requirements live in `.araya/plan/requirements/` or in `ax3/` subdirectories for AX3-tracked requirements
- Each spec must trace to an approved requirement and to acceptance criteria
- Architecture specs (like delegation architecture) must be reviewed by Aisha (Backend Architect)
  before implementation
- ADRs live in `.araya/plan/spec/adr/` following the ADR format

## Work Guidance

- Spec documents are design artifacts — they describe WHAT to build and HOW, not the
  implementation itself
- Use C4 model (Context, Container, Component) for architecture diagrams
- Include sequence diagrams for complex interactions
- Include data models with type definitions
- Include error catalogs for reliability engineering
- Always include verification criteria — how do we know it works?

## Verification

- Each spec must trace to its parent requirement and to acceptance criteria
- Run `/araya:ax3 --check` from repo root to verify AX3 chain integrity
- Diana reviews security-sensitive architecture specs (like delegation broker)

## Child AX3 Index

<!-- BEGIN ARAYA MANAGED: Child AX3 Index -->
- `requirements/ax3/AX3.md` — requirements (AX3-tracked)
<!-- END ARAYA MANAGED: Child AX3 Index -->
