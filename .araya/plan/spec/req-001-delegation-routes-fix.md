# REQ-001 — Delegation Routes Fix

**Status:** Pending Application  
**Owner:** Aurora (CHRO) — mapping author | Valentina (Backend Dev) — code applicator  
**Date:** 2026-07-22  
**Diagnosis by:** Daneel (Delegated Executor), Teresa (CCO)  
**Confirmed by:** Aurora (CHRO)

---

## Problem

8 de 9 comandos en `extensions/araya/index.ts` tienen `delegated_agent: "sonia"` cuando deberían apuntar a especialistas reales. Esto viola el Specialist Delegation Contract: Sonia no debe ejecutar tareas especializadas cuando existe un agente competente.

---

## Affected Locations

Hay **dos ubicaciones** por comando que deben corregirse:

1. **`SUBCOMMAND_ROUTES`** (línea 702): Mapeo para forma espacio — `/araya <cmd>`
2. **`pi.registerCommand`** (líneas 960–1933): Mapeo para forma colon — `/araya:<cmd>`

Dos comandos (`validate`, `usability-check`) solo tienen ruta en SUBCOMMAND_ROUTES; su forma colon es inline (no delega a agente).

---

## Mapping Table — 8 Corrections

### R-01: `generate-uat`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya generate-uat` + `/araya:generate-uat` |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`clara`** |
| **Skill justificante** | `uat-generate` |
| **Líneas SUBCOMMAND_ROUTES** | 712 |
| **Líneas pi.registerCommand** | 960–976 |

**Evidencia en `araya.yaml`:**
```yaml
clara:
  role: QA Engineer
  skills:
    - uat-generate
```

---

### R-02: `budget-status`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya budget-status` + `/araya:budget-status` |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`mateo`** |
| **Skill justificante** | `token-efficiency`, `cost-analysis`, `budget-forecasting` |
| **Líneas SUBCOMMAND_ROUTES** | 723 |
| **Líneas pi.registerCommand** | 1002–1012 |

**Evidencia en `araya.yaml`:**
```yaml
mateo:
  role: FinOps Specialist
  skills:
    - cost-analysis
    - usage-metering
    - resource-rightsizing
    - budget-forecasting
    - token-efficiency
```

---

### R-03: `optimize-task`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya optimize-task` + `/araya:optimize-task` |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`mateo`** |
| **Skill justificante** | `token-efficiency` |
| **Líneas SUBCOMMAND_ROUTES** | 724 |
| **Líneas pi.registerCommand** | 1014–1025 |

**Evidencia en `araya.yaml`:**
```yaml
mateo:
  role: FinOps Specialist
  skills:
    - token-efficiency
```

---

### R-04: `efficiency-report`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya efficiency-report` + `/araya:efficiency-report` |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`mateo`** |
| **Skill justificante** | `token-efficiency`, `cost-analysis` |
| **Líneas SUBCOMMAND_ROUTES** | 725 |
| **Líneas pi.registerCommand** | 1039–1048 |

**Evidencia en `araya.yaml`:**
```yaml
mateo:
  role: FinOps Specialist
  skills:
    - cost-analysis
    - token-efficiency
```

---

### R-05: `route`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya route` + `/araya:route` |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`aurora`** |
| **Skill justificante** | `capability-registry`, `agent-topology` (capability-based model selection = AI routing) |
| **Líneas SUBCOMMAND_ROUTES** | 727 |
| **Líneas pi.registerCommand** | 1825–1836 |

**Evidencia en `araya.yaml`:**
```yaml
aurora:
  role: Capability Officer
  capabilities:
    - workforce_planning
    - capability_management
    - skills_governance
    - gap_analysis
  skills:
    - capability-registry
    - agent-topology
```

**Nota adicional:** La skill `ai-routing` existe en el catálogo y describe exactamente esta función: _"capability-based model selection, cost governance, and explainable routing decisions."_ Aurora, como Capability Officer dueña del registry, es la autoridad natural para decidir qué agente + provider + modelo se asigna a cada tarea.

---

### R-06: `validate`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya validate` (solo SUBCOMMAND_ROUTES; `/araya:validate` es inline) |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`rolando`** |
| **Skill justificante** | `reality-verification` |
| **Líneas SUBCOMMAND_ROUTES** | 704 |
| **Líneas pi.registerCommand** | N/A — `/araya:validate` es inline (escanea archivos, no delega) |

**Evidencia en `araya.yaml`:**
```yaml
rolando:
  role: Reality Authority (Verifier)
  permissions:
    can_write_code: false
    can_approve_review: true
    can_emit_binding: true
  capabilities:
    - reality_verification
    - evidence_inspection
    - disposition_emission
  skills:
    - reality-verification
```

**Nota adicional:** La tarea dice _"Validate delivery against acceptance criteria. Check all ACs, constitutional compliance, and evidence."_ Esto es verificación de realidad — el núcleo del mandato de Rolando. Él inspecciona evidencia y emite disposiciones vinculantes (`can_emit_binding: true`).

---

### R-07: `uat-status`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya uat-status` + `/araya:uat-status` |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`clara`** |
| **Skill justificante** | `uat-generate` (extensión natural: quien genera UAT reporta su estado) |
| **Líneas SUBCOMMAND_ROUTES** | 714 |
| **Líneas pi.registerCommand** | 987–998 |

**Evidencia en `araya.yaml`:**
```yaml
clara:
  role: QA Engineer
  skills:
    - uat-generate
    - coverage
    - tdd-generate
    - tdd-execute
```

---

### R-08: `usability-check`

| Campo | Valor |
|-------|-------|
| **Comando** | `/araya usability-check` (solo SUBCOMMAND_ROUTES; `/araya:usability-check` es inline) |
| **Agente actual** | `sonia` |
| **Agente correcto** | **`priya`** |
| **Skill justificante** | `e2e-strategy`, `uat-review` (QA domain) |
| **Líneas SUBCOMMAND_ROUTES** | 707 |
| **Líneas pi.registerCommand** | N/A — `/araya:usability-check` es inline (escanea archivos, no delega) |

**Evidencia en `araya.yaml`:**
```yaml
priya:
  role: QA Lead
  permissions:
    can_write_code: false
    can_approve_review: true
  skills:
    - performance-test
    - e2e-strategy
    - cicd-quality
    - uat-review
```

**Nota adicional:** Usability es un dominio de QA. Priya como QA Lead tiene `e2e-strategy` (estrategia de validación integral) y `uat-review` (revisión de aceptación). La verificación de cobertura de evidencia de usabilidad (USE-002, USE-003) cae naturalmente en su dominio.

---

## Commands NOT Modified (correct as-is)

| Comando | Agente | Justificación |
|---------|--------|---------------|
| `review-delivery` | sonia | Sonia tiene `drr-create`, `iar-generate`, `cr-generate` — es su core |
| `constitution` | sonia | Governance reporting — dominio de PMO |
| `release-check` | sonia | Version compliance — dominio de PMO |
| `trace` | sonia | Traceability — dominio de PMO |
| `metrics` | sonia | Governance metrics — dominio de PMO |
| `review-uat` | manu | Manu tiene `uat-review` — correcto |
| `knowledge`, `learn`, `trajectory`, `improve`, `graph`, `ask` | esteban | CKO — correcto |
| `team` | aurora | Capability Officer — correcto |
| `anticipate` | sonia | Risk detection — PMO domain |
| `align`, `harmonize`, `understand` | manu | Product Owner — correcto |
| `prioritize`, `roundtable` | sonia | PMO domain — correcto |
| `sharpen` | esteban | CKO — correcto |
| `compress-context` | sonia | Token efficiency pero operacional — OK en PMO por ahora |

---

## Application Instructions for Valentina

### 1. SUBCOMMAND_ROUTES (línea 702)

Reemplazar 8 entradas en el objeto `SUBCOMMAND_ROUTES`:

```
Línea 704:  "validate":         { agent: "sonia" → "rolando" }
Línea 707:  "usability-check":  { agent: "sonia" → "priya"   }
Línea 712:  "generate-uat":     { agent: "sonia" → "clara"   }
Línea 714:  "uat-status":       { agent: "sonia" → "clara"   }
Línea 723:  "budget-status":    { agent: "sonia" → "mateo"   }
Línea 724:  "optimize-task":    { agent: "sonia" → "mateo"   }
Línea 725:  "efficiency-report":{ agent: "sonia" → "mateo"   }
Línea 727:  "route":            { agent: "sonia" → "aurora"  }
```

### 2. pi.registerCommand handlers

Reemplazar `buildAgentPrompt(config, "sonia", ...)` por el agente correcto en:

```
Línea 962:  "araya:generate-uat"    → buildAgentPrompt(config, "clara", ...)
Línea 989:  "araya:uat-status"      → buildAgentPrompt(config, "clara", ...)
Línea 1004: "araya:budget-status"   → buildAgentPrompt(config, "mateo", ...)
Línea 1016: "araya:optimize-task"   → buildAgentPrompt(config, "mateo", ...)
Línea 1041: "araya:efficiency-report" → buildAgentPrompt(config, "mateo", ...)
Línea 1827: "araya:route"           → buildAgentPrompt(config, "aurora", ...)
```

No modificar:
- `araya:validate` (línea 1124) — es inline, no delega
- `araya:usability-check` (línea 1933) — es inline, no delega

---

## Verification Checklist

- [ ] `/araya generate-uat` → Clara invoked with `uat-generate` skill
- [ ] `/araya budget-status` → Mateo invoked with `token-efficiency` skill
- [ ] `/araya optimize-task "..."` → Mateo invoked with `token-efficiency` skill
- [ ] `/araya efficiency-report` → Mateo invoked with `cost-analysis` skill
- [ ] `/araya route "..."` → Aurora invoked with `capability-registry` skill
- [ ] `/araya validate` → Rolando invoked with `reality-verification` skill
- [ ] `/araya uat-status` → Clara invoked with `uat-generate` skill
- [ ] `/araya usability-check` → Priya invoked with `e2e-strategy` skill
- [ ] Sonia ya no recibe ninguna de estas 8 delegaciones
- [ ] Compliance con Specialist Delegation Contract (REQ-001)

---

## Governance

- **Authority:** Aurora (CHRO) — organizational design per `araya.yaml` role
- **Approval:** The Data Professor
- **Execution:** Valentina (Backend Developer)
- **Verification:** Rolando (Reality Authority) — confirmar que el cambio está en repo
- **Registry Update:** Aurora actualizará `capability-registry.md` tras la aplicación
