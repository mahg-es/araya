# Artifact Governance Model

**Timestamp:** 2026-05-31 14:30 +0200
**ADR:** `adr-artifact-governance.md`
**Constitutional Rules:** ART-001 through ART-010
**Status:** Active

---

## 1. Canonical Repository Structure

```
.araya/
├── active/           ← Active work items (cr, drr, iar)
├── adr/              ← Architecture Decision Records
├── archive/          ← Year-partitioned archive
│   ├── 2026/
│   └── 2027/
├── bdd/              ← Behavior-Driven Design artifacts
├── compact/          ← Context capsules
├── evidence/         ← Delivery evidence
├── governance/       ← Constitution, standards, violations
├── handoff/          ← Agent handoff records
├── plan/             ← Project plans
├── reconstitution/   ← Reconstitution reports
├── releases/         ← Release artifacts
├── runs/             ← Execution run records
├── sdd/              ← Software Design Documents
├── spec/             ← Specifications
└── tdd/              ← Test-Driven Design artifacts
```

---

## 2. Naming Convention

```
<prefix>-<NNN>-<short-description>.md
```

| Prefix | Type | Location |
|--------|------|----------|
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
| `hdo-` | Handoff Record | `.araya/handoff/` |
| `cmp-` | Context Capsule (Compact) | `.araya/compact/` |
| `rec-` | Reconstitution Report | `.araya/reconstitution/` |

**Rules:**
- Numbers are sequential per prefix, starting at 001
- Numbers are never reused — even for archived artifacts
- Description is lowercase, hyphen-separated, ≤50 characters
- No free-form filenames

---

## 3. Numbering Standard

| Artifact | First | Second | Pattern |
|----------|-------|--------|---------|
| SDD | `sdd-001-authentication.md` | `sdd-002-billing.md` | Sequential |
| ADR | `adr-001-technology-stack.md` | `adr-002-versioning.md` | Sequential |
| CR | `cr-001-provider-billing.md` | `cr-002-tenant-transfer.md` | Sequential |

Numbers are global per type, not per sprint or phase.

---

## 4. Lifecycle Management

```
  Draft
    │
    ▼
  Active ──────────────────────┐
    │                          │
    ▼                          ▼
Superseded ──────────►  Archived
```

| Status | Meaning | Location |
|--------|---------|----------|
| Draft | Work in progress, not yet approved | Canonical location |
| Active | Approved and current | Canonical location |
| Superseded | Replaced by newer version | Archive |
| Archived | Historical record, not active | Archive |

---

## 5. Supersession Rules

When `vision-v2.md` replaces `vision.md`:

1. Add `Superseded By: vision-v2.md` to `vision.md` metadata
2. Add `Supersedes: vision.md` to `vision-v2.md` metadata
3. Change `vision.md` status to `Superseded`
4. Move `vision.md` to `archive/<year>/`
5. Commit both changes together

**No duplicate active artifacts.**

---

## 6. Mandatory Metadata

Every artifact SHALL begin with:

```markdown
# <Title>

**Artifact ID:** <prefix>-<NNN>
**Owner:** <agent or role>
**Status:** Draft | Active | Superseded | Archived
**Created:** YYYY-MM-DD HH:MM ±HH:MM
**Updated:** YYYY-MM-DD HH:MM ±HH:MM
**Supersedes:** <artifact-id> | None
**Superseded By:** <artifact-id> | None
**Related:** <artifact-id>, <artifact-id>

---
```

---

## 7. Reconstitution (Redesigned)

Reconstitution is Organizational Recovery.

```bash
/araya reconstitute
```

Produces `rec-<NNN>-<project>-reconstitution.md`:

1. Inventory all `.araya/` artifacts
2. Detect naming violations (free-form names)
3. Detect duplicates (multiple versions of same artifact active)
4. Detect lifecycle violations (orphans, missing metadata)
5. Detect broken references (supersedes/superseded-by chains)
6. Detect archive violations (active in archive, archived outside)
7. Propose remediation plan (moves, renames, status changes)
8. Optionally execute cleanup (with `--execute` flag)

---

## 8. Compact (Redesigned)

Compact is Context Preservation only.

```bash
/araya compact
```

Produces `cmp-<NNN>-<project>-<date>.md`:

- Active objectives
- Active decisions
- Active risks and blockers
- Governance state summary
- No repository restructuring

---

## 9. Handoff (Redesigned)

Handoff is Project Status only.

```bash
/araya handoff
```

Produces `hdo-<NNN>-<project>-<date>.md`:

- Project status
- Active objectives
- Risks and blockers
- Branch status
- Next actions
- No repository restructuring

---

## 10. Archive Governance

```
archive/
├── 2026/
│   ├── sdd-001-obsolete-feature.md
│   ├── adr-003-superseded-decision.md
│   └── ...
└── 2027/
    └── ...
```

**Rules:**
- Archive is year-partitioned
- Superseded and archived artifacts move to `archive/<year>/`
- No active artifact may exist inside archive
- No archived artifact may exist outside archive
- Archive operations must be committed with message: `archive: <artifact-id>`
