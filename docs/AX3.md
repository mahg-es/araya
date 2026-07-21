# docs — AX3 Local Contract

## Purpose

Documentation subtree for the ARAYA Framework. Houses command references, agent integration guides, architecture docs, and user-facing manuals. All documentation artifacts must follow the artifact governance model (see `.araya/adr/adr-artifact-governance.md`).

## Ownership

Priscila (Technical Writer) — documentation authorship and maintenance.
All documentation must be reviewed by the subject matter expert of the documented domain.

## Local Contracts

- Every document must carry: date, author, version, and status (draft/review/published)
- Code blocks must specify language and be copy-paste runnable
- Troubleshooting sections use pattern: Symptom → Cause → Solution
- No unexplained jargon — define terms on first use
- Documentation is a delivery artifact — it follows the same lifecycle as code

## Work Guidance

- Command references go in `docs/commands/`
- Agent integration/onboarding guides go in `docs/agents/`
- Architecture documentation goes in `docs/architecture/` (or co-located with ADRs in `.araya/governance/adrs/`)
- Runtime-specific guides go in `docs/runtimes/`
- Use mermaid for diagrams, C4 model for architecture

## Verification

- All command references must be validatable against the canonical catalog (`/araya:man --check`)
- Cross-references must resolve (no broken links)
- Run `/araya:ax3 --check` after any structural change

## Child AX3 Index

<!-- BEGIN ARAYA MANAGED: Child AX3 Index -->
- `architecture/AX3.md` — architecture
- `commands/AX3.md` — commands
- `agents/AX3.md` — agents
<!-- END ARAYA MANAGED: Child AX3 Index -->
