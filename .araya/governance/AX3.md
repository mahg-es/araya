# governance — AX3 Local Contract

## Purpose

Canonical home of ARAYA governance standards, contracts, and schemas. Defines the binding rules for agent profiles, skill contracts, tool access, repository hygiene, engineering excellence, artifact governance, release versioning, and the agent-and-skill contract itself. This is part of the ARAYA Framework.

## Ownership

The Data Professor (Manuel Alejandro Hernández Giuliani) — all governance decisions.
Priscila — technical documentation and contract refinement.

## Local Contracts

- All governance standards live under `.araya/governance/standards/`.
- The Agent and Skill Contract (`ARAYA-agent-and-skill-contract-v1.md`) is the schema-of-schemas — it governs agent and skill profile definitions.
- JSON Schemas for machine validation live under `.araya/governance/schemas/`.
- Governance standards are binding on all ARAYA agents and governed projects.

## Work Guidance

- Standards are written in Markdown with YAML/JSON examples.
- Every standard must have a date, author, version, and status.
- Machine-validatable fields must be explicitly called out with validation rules.
- Changes to standards require Professor approval via governed PR.

## Verification

- Validate agent profiles against `agent-profile.schema.json`.
- Validate skill profiles against `skill-profile.schema.json`.
- Run validation gates defined in `ARAYA-agent-and-skill-contract-v1.md` Section 11.
- Run `araya-runtime generate --check` for drift detection.

## Child AX3 Index

<!-- BEGIN ARAYA MANAGED: Child AX3 Index -->
<!-- No child AX3.md files detected -->
<!-- END ARAYA MANAGED: Child AX3 Index -->
