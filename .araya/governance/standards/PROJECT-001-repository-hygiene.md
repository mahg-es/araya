# ARAYA Governance Defect — PROJECT-001

## Repository Hygiene Standard

### Principle

```
Project root = Customer-facing assets
.araya/      = Internal delivery organization
```

Customers should never need to understand ARAYA to understand the project.

---

## Classification Matrix — mahg-pms Audit

### ✅ Product Artifacts (stay in docs/)

| Path | Classification | Reason |
|------|---------------|--------|
| `docs/architecture/` | Product | Architecture is customer-facing |
| `docs/data-model/` | Product | Data model is customer-facing |
| `docs/methodology/` | Product | Methodology documentation |
| `docs/product/` | Product | Product scope, roadmap, pricing |
| `docs/operations/docker.md` | Product | Deployment documentation |
| `docs/operations/deployment.md` | Product | Deployment documentation |
| `docs/operations/postgresql.md` | Product | Database documentation |
| `docs/operations/traefik.md` | Product | Proxy documentation |

### 🔴 ARAYA Operational (migrate to .araya/)

| Path | Classification | Target |
|------|---------------|--------|
| `docs/operations/authelia-integration-plan.md` | Implementation plan | `.araya/plan/` |
| `docs/operations/deployment-playbook.md` | Execution plan | `.araya/plan/` |
| `docs/operations/traefik-staging-routing.md` | Execution plan | `.araya/plan/` |
| `docs/operations/local-development.md` | ARAYA operational | `.araya/operations/` |
| `docs/operations/authentik.md` | Decision document | `.araya/adr/` or `.araya/plan/` |
| `docs/agents/*` (4 files) | Agent configuration | `.araya/agents/` |
| `memory/*` (6 files) | Planning memory | `.araya/memory/` |

### 🟡 ADRs (classify per content)

| Path | Classification | Target |
|------|---------------|--------|
| `docs/adr/ADR-0001` through `ADR-0018` | Mixed | **Product ADRs** stay in `docs/adr/`. **ARAYA operational ADRs** migrate to `.araya/adr/` |

Classification rule:
- **Product ADR**: About the product's architecture, technology, or design → `docs/adr/` ✅
- **ARAYA operational ADR**: About how the delivery organization works → `.araya/adr/` 🔴

Example classification:
- ADR-0009 (Traefik as reverse proxy) → Product ✅ → stays
- ADR-0003 (Multi-agent development memory) → ARAYA operational 🔴 → `.araya/adr/`

---

## PROJECT-001 — Specification

### Rule

All ARAYA operational artifacts must live under `.araya/`.

### Allowed in project root

```
app/  src/  infrastructure/  docker/  tests/  docs/  examples/  api/  ui/  assets/
```

### docs/ — allowed subdirectories

```
docs/architecture/     ← Product architecture
docs/data-model/       ← Product data model
docs/methodology/      ← Product methodology
docs/product/          ← Product scope, roadmap
docs/operations/       ← Product operations (deployment, configuration — not planning)
docs/adr/              ← Product ADRs
docs/user-guide.md     ← Product user documentation
docs/installation.md   ← Product installation
docs/api-reference.md  ← Product API documentation
```

### docs/ — NOT allowed

```
docs/operations/*-plan.md        ← Planning artifacts → .araya/plan/
docs/operations/*-playbook.md    ← Execution playbooks → .araya/plan/
docs/operations/*-integration.md ← Integration plans → .araya/plan/
docs/agents/                      ← Agent configuration → .araya/agents/
```

### Project root — NOT allowed

```
memory/              ← .araya/memory/
AGENTS.md            ← Allowed (project-level agent instructions)
*.plan.md            ← .araya/plan/
*.planning.md        ← .araya/plan/
```

### .araya/ — canonical structure

```
.araya/
├── plan/           ← Planning artifacts, implementation plans
├── runs/           ← Execution records
├── adr/            ← ARAYA operational ADRs
├── governance/     ← Constitution, rules, violations
├── reviews/        ← DRR, IAR, CR, UAT
├── trajectories/   ← Golden/candidate trajectories
├── memory/         ← Agent memory, current focus, decisions
├── agents/         ← Agent configuration specific to this project
├── operations/     ← Internal operations documentation
└── reports/        ← Health reports, audits, assessments
```

---

## Migration Plan — mahg-pms

### Phase 1 — Safe (no product impact)

| File | From | To |
|------|------|-----|
| `memory/*` (6 files) | `./memory/` | `.araya/memory/` |
| `docs/agents/*` (4 files) | `docs/agents/` | `.araya/agents/` |

### Phase 2 — Operations cleanup

| File | From | To |
|------|------|-----|
| `docs/operations/authelia-integration-plan.md` | `docs/operations/` | `.araya/plan/` |
| `docs/operations/deployment-playbook.md` | `docs/operations/` | `.araya/plan/` |
| `docs/operations/traefik-staging-routing.md` | `docs/operations/` | `.araya/plan/` |
| `docs/operations/authentik.md` | `docs/operations/` | `.araya/adr/` |

### Phase 3 — ADR classification (manual review)

18 ADRs need classification. Product ADRs stay. ARAYA operational ADRs migrate.

---

## Violations Summary

| Project | Violations | Severity |
|---------|-----------|----------|
| mahg-pms | 10 files in wrong location | Medium |
| ARAYA | 0 — .araya/ is correct | — |

---

## Backward Compatibility

- Existing file references in agent memory may break after migration
- `/araya reconstitute` must be updated to scan both old and new locations
- Migration is one-time per project, not ongoing overhead

---

## Recommendation

**Approve PROJECT-001.** Execute Phase 1 (safe) immediately. Phase 2-3 require Manu review for ADR classification. No new features. Governance correction only.
