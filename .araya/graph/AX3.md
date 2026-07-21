# graph — AX3 Local Contract

## Purpose

Organizational Knowledge Graph for the ARAYA Framework. Contains file-based entities
(agents, skills, capabilities, projects, domains, findings) and relationships
(OWNS, ROUTES_TO, BELONGS_TO, REQUIRES, DEPENDS_ON, etc.) that together form
the queryable organizational memory of the ARAYA ecosystem.

Populated by the Graph Builder engine from repository artifacts (araya.yaml,
skills/, prompts/agents/, specs) and manually curated for audit findings.

## Ownership

Esteban (Chief Knowledge Officer) — all knowledge graph curation and query decisions.

## Local Contracts

- Entities follow `entity-schema.md` from `.araya/graph-builder/`
- Relationships follow `relationship-schema.md` from `.araya/graph-builder/`
- Entity files live in `entities/{type}/` subdirectories
- Relationship files live in `relationships/`
- Index files in `indexes/` provide cross-reference for fast lookup
- All entities and relationships are file-based YAML — no external database
- Graph is deterministic and reproducible from source artifacts + audit reports

## Work Guidance

- Entity IDs use kebab-case with descriptive prefixes
- Relationship IDs follow `rel-{source}-{type}-{target}` pattern
- Confidence scores: 1.0 = verified, 0.8-0.99 = high confidence, <0.8 = uncertain
- Status flags: verified, orphan, drift, undeclared, recommended, incorrect, new
- Query via `/araya graph --show <entity>` or `/araya ask "<question>"`
- Impact analysis via `/araya graph --impact <entity>`

## Verification

- Entity index must match all files in entities/
- Relationship index must match all relationship files
- Run `/araya:graph:prepare` to validate readiness
- All agent→skill relationships must trace to araya.yaml (verified) or audit (drift/orphan)

## Child AX3 Index

<!-- BEGIN ARAYA MANAGED: Child AX3 Index -->
- `entities/agents/` — Agent entities
- `entities/skills/` — Skill entities
- `entities/capabilities/` — Capability entities
- `entities/projects/` — Project entities
- `entities/domains/` — Domain taxonomy
- `entities/findings/` — Audit findings
- `relationships/` — Relationship files
- `indexes/` — Cross-reference indexes
- `queries/` — Saved graph queries
- `reports/` — Graph analysis reports
- `visualizations/` — Mermaid diagrams
<!-- END ARAYA MANAGED: Child AX3 Index -->
