# ADR-Artifact-Governance — Artifact Governance Model

**Timestamp:** 2026-05-31 14:30 +0200
**Status:** Accepted
**Author:** R. Daneel Olivaw (per The Data Professor)
**Context:** ARAYA repositories accumulate documentation entropy without formal artifact governance.

---

## Decision

ARAYA SHALL adopt a formal Artifact Governance Model governing:
- Canonical repository structure
- Mandatory naming conventions
- Sequential numbering per artifact type
- Explicit lifecycle management (Draft → Active → Superseded → Archived)
- Supersession rules with reference updates
- Mandatory metadata on every artifact
- Archive governance with year-based partitioning
- Redesigned reconstitution as organizational recovery

## Artifact Types

| Prefix | Type | Canonical Location |
|--------|------|--------------------|
| `sdd-` | Software Design Document | `.araya/sdd/` |
| `bdd-` | Behavior-Driven Design | `.araya/bdd/` |
| `tdd-` | Test-Driven Design | `.araya/tdd/` |
| `adr-` | Architecture Decision Record | `.araya/adr/` |
| `cr-`  | Change Request | `.araya/active/cr/` |
| `drr-` | Delivery Review Report | `.araya/active/drr/` |
| `iar-` | Impact Analysis Report | `.araya/active/iar/` |
| `plan-` | Project Plan | `.araya/plan/` |
| `spec-` | Specification | `.araya/spec/` |
| `run-` | Execution Run | `.araya/runs/` |
| `vio-` | Governance Violation | `.araya/governance/violations/` |

## Naming Convention

```
<prefix>-<NNN>-<short-description>.md
```

Examples:
- `sdd-001-authentication-baseline.md`
- `adr-001-artifact-governance.md`
- `cr-001-provider-billing-fix.md`

Numbers are sequential per prefix, never reused. Archived artifacts retain identifiers.

## Lifecycle

```
Draft → Active → Superseded → Archived
```

Status must be explicit in artifact metadata. No orphan artifacts.

## Consequences

- Reconstitution becomes organizational recovery (inventory, detect drift, propose remediation)
- Compact preserves context only — no restructuring
- Handoff preserves project status only — no restructuring
- All artifacts require mandatory metadata block
- Archive is year-partitioned: `archive/2026/`, `archive/2027/`
- No active artifact in archive; no archived artifact outside archive
