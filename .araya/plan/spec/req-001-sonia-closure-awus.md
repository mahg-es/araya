# REQ-001 Sonia Closure — Atomic Work Units (AWUs)

- **Document ID:** REQ-001-SONIA-CLOSURE-AWUs-v1.0
- **Date:** 2026-07-22
- **Author:** Sonia (PM Head Orchestrator)
- **Trigger:** Manu's Closure Decision — `req-001-manu-closure-decision.md`
- **Source Authority:** The Data Professor — 4 criteria exactos delegados a Sonia para emisión de AWUs
- **Status:** ⬜ AWUs EMITIDAS — pendiente ejecución por especialistas

---

## Resumen Ejecutivo

Manu (Product Owner) ha dictado su decisión de cierre para REQ-001 con 4 criterios
exactos. Sonia convierte esos criterios en 7 Atomic Work Units (AWUs) estructuradas,
con agentes asignados, dependencias, archivos permitidos, validaciones, y resultados
esperados. Las AWUs se emiten como solicitudes formales al executor superior.

**Los 4 criterios de Manu → 7 AWUs:**

| Criterio Manu | AWU | Agente | Objetivo |
|---------------|-----|--------|----------|
| C1: AC-B11 orphan skills | AWU-C1 | Aurora | Crear 4 SKILL.md huérfanos |
| C2: AC-B13 Sonia prompt | AWU-C2 | Priscila | Reconciliar 13 discrepancias |
| C3: Test suite re-run | AWU-C3 | Teresa | Actualizar + ejecutar tests |
| C3 (contingency) | AWU-C4 | Valentina | Solo si Teresa detecta fallos de código |
| Post-cambio | AWU-C5 | Valentina | Regenerar catalog.json |
| Verificación | AWU-C6 | Daneel | Verificar AWU-C3 + AWU-C5 |
| Aceptación | AWU-C7 | Manu | PO APPROVED final |

### DAG de Ejecución

```
AWU-C1 (Aurora) ──┐
                   ├──→ AWU-C3 (Teresa) ──→ AWU-C4 (Valentina, condicional)
AWU-C2 (Priscila) ─┘       │                         │
                            └──→ AWU-C5 (Valentina) ──┘
                                       │
                                       └──→ AWU-C6 (Daneel) ──→ AWU-C7 (Manu)
```

- **AWU-C1** y **AWU-C2** son paralelizables (sin dependencias entre sí)
- **AWU-C3** depende de C1 + C2
- **AWU-C4** es condicional: solo se activa si Teresa reporta fallos que requieren código
- **AWU-C5** depende de C1 + C2 (post-cambios en skills/)
- **AWU-C6** depende de C3 + C5
- **AWU-C7** depende de C6

---

## AWU-C1: Aurora — Crear 4 SKILL.md huérfanos

```
┌──────────────────────────────────────────────────────────────┐
│ AWU-C1                                                       │
│ Priority: P0 (Critical) — Blocker para AC-B11                │
│ Agent: Aurora (CHRO — Chief Human Resources Officer)         │
│ Tier: reasoning                                              │
│ Mode: single                                                 │
└──────────────────────────────────────────────────────────────┘
```

### Objetivo

Crear archivos `SKILL.md` para las 4 skills que Aurora declaró en `araya.yaml`
pero que carecen de directorio y `SKILL.md` en `skills/`.

### Skills a crear

| # | Skill | Ruta esperada | Dominio |
|---|-------|---------------|---------|
| 1 | `ai-routing` | `skills/ai-routing/SKILL.md` | AI/ML — Provider-agnostic AI routing |
| 2 | `autonomous-execution` | `skills/autonomous-execution/SKILL.md` | Process — Autonomous execution triggers |
| 3 | `ax-postoffice` | `skills/ax-postoffice/SKILL.md` | Process — Postoffice operational channel |
| 4 | `pm-decompose` | `skills/pm-decompose/SKILL.md` | PM — Task decomposition (WBS) |

### Archivos permitidos

- `skills/ai-routing/SKILL.md`
- `skills/autonomous-execution/SKILL.md`
- `skills/ax-postoffice/SKILL.md`
- `skills/pm-decompose/SKILL.md`

### Constraints

- ❌ NO modificar `araya.yaml`
- ❌ NO modificar `catalog.json`
- ❌ NO modificar archivos fuera de `skills/<name>/`
- Cada SKILL.md debe tener frontmatter YAML válido (nombre, dominio, agente, status)

### Validación

- [ ] Los 4 archivos existen en las rutas especificadas
- [ ] Cada `SKILL.md` tiene frontmatter YAML válido con campos: `name`, `domain`, `agent`, `status`
- [ ] `status: enabled` en cada uno
- [ ] `grep -l "SKILL.md" skills/ai-routing/ skills/autonomous-execution/ skills/ax-postoffice/ skills/pm-decompose/` retorna 4 archivos

### Resultado esperado

- **AC-B11** transiciona de `FAILED` → `MET`
- Validación de integridad: 0 `SKILL_ORPHAN` para estas 4 skills
- Catálogo (post-regeneración en AWU-C5): 4 skills con `status: enabled`

### Dependencias

- Ninguna (puede ejecutarse en paralelo con AWU-C2)

---

## AWU-C2: Priscila — Reconciliar prompt de Sonia con araya.yaml

```
┌──────────────────────────────────────────────────────────────┐
│ AWU-C2                                                       │
│ Priority: P0 (Critical) — Blocker para AC-B13                │
│ Agent: Priscila (Technical Writer)                           │
│ Tier: balanced                                               │
│ Mode: single                                                 │
└──────────────────────────────────────────────────────────────┘
```

### Objetivo

Eliminar las 13 discrepancias documentadas entre `prompts/agents/sonia.md`
y `araya.yaml` para Sonia, llevando el diff a 0.

### Contexto

Manu identificó 13 discrepancias en su validación final:
- Skills listadas en el prompt de Sonia que NO están en `araya.yaml`
- Skills en `araya.yaml` para Sonia que NO están documentadas en el prompt

### Archivos permitidos

- `prompts/agents/sonia.md` (lectura + escritura)
- `araya.yaml` (SOLO LECTURA — no modificar)

### Reglas de reconciliación

1. **Skills en prompt NO en araya.yaml:** Añadir la skill a `araya.yaml` para Sonia
   (vía PR o solicitud a Valentina/Aurora) O remover del prompt si la skill ya no
   pertenece a Sonia.
2. **Skills en araya.yaml NO en prompt:** Documentar la skill en el prompt de Sonia
   con: nombre, propósito, cuándo usarla.
3. Cada skill debe resolverse individualmente con trazabilidad.

### Validación

- [ ] `diff` entre skills en `prompts/agents/sonia.md` y skills de Sonia en `araya.yaml` → 0 discrepancias
- [ ] Skill count en prompt = skill count en yaml para Sonia
- [ ] Cada skill en araya.yaml tiene entrada documentada en el prompt
- [ ] Cada skill en el prompt está registrada en araya.yaml

### Resultado esperado

- **AC-B13** transiciona de `CONDITIONAL` → `MET`
- Verificación: `grep` de skills en prompt vs `grep` de skills en yaml → idénticos

### Dependencias

- Ninguna (puede ejecutarse en paralelo con AWU-C1)

---

## AWU-C3: Teresa — Actualizar y ejecutar test suite

```
┌──────────────────────────────────────────────────────────────┐
│ AWU-C3                                                       │
│ Priority: P0 (Critical) — Gate para PO APPROVED              │
│ Agent: Teresa (CCO — Chief Compliance Officer / QA)          │
│ Tier: balanced                                               │
│ Mode: single                                                 │
│ Dependencies: AWU-C1, AWU-C2                                 │
└──────────────────────────────────────────────────────────────┘
```

### Objetivo

1. Actualizar tests desactualizados que Daneel identificó en `req-001-daneel-final-verification.md`
2. Re-ejecutar la suite completa contra el repositorio en estado post-AWU-C1 + post-AWU-C2
3. Entregar test report con ≥95% pass rate, 0 CRITICAL failures

### Archivos permitidos

- `tests/req-001-*.js` (todos los tests de REQ-001)
- `tests/mvp2-smoke-test.js` (actualizar conteo de agentes)
- `tests/catalog-test.js` (actualizar snapshots si es necesario)
- `tests/published-interface-test.js` (si Robot Framework está disponible)

### Tests a actualizar (hallazgos de Daneel)

| # | Archivo | Test | Cambio requerido |
|---|---------|------|-----------------|
| FN-02 | `tests/req-001-delegation-test.js` | RF-B01 usability-check | expects `manu` → debe esperar `priya` (decisión Manu Sección 1) |
| FN-03 | `tests/mvp2-smoke-test.js` | "has 29 agents" | 29 → 30 (Lin fue añadido) |
| — | `tests/req-001-delegation-test.js` | AC-12.2 | Rolando tiene 4 skills (actualizar expected) |
| — | `tests/req-001-delegation-test.js` | AC-16.6 | `/araya:provider:list` no delegado a aurora (documentar o actualizar) |
| — | `tests/req-001-integration-test.js` | AC-5.5, AC-6.4, AC-A18 | Issues de consistencia help text y source_files |
| — | `tests/catalog-test.js` | Snapshots | Posibles cambios por AWU-C1 y AWU-C2 |

### Ejecución

1. Actualizar test expectations según la tabla anterior
2. Ejecutar suite completa: `npm test`
3. Si hay fallos de snapshot → actualizar snapshots
4. Si hay fallos de código → documentar y pasar a AWU-C4 (Valentina)
5. Generar reporte estructurado

### Validación

- [ ] Pass rate ≥ 95% (umbral absoluto, target actual: 97.89% → mantener o mejorar)
- [ ] 0 CRITICAL failures
- [ ] 0 failures que indiquen defectos funcionales no documentados
- [ ] Breakdown por suite: broker-test, ax3-test, req-001-*, mvp2-smoke, catalog-test, published-interface
- [ ] Test expectations actualizados para: usability-check → priya, agent count → 30
- [ ] Hallazgos categorizados con severidad (CRITICAL, HIGH, MEDIUM, LOW)

### Resultado esperado

- Reporte de test actualizado en `.araya/plan/spec/req-001-test-report.md` (o ruta designada)
- ≥95% pass rate confirmado
- Cualquier fallo de código → triggers AWU-C4

### Dependencias

- **AWU-C1** (Aurora): los 4 SKILL.md deben existir antes de ejecutar tests de catálogo
- **AWU-C2** (Priscila): prompt reconciliado para tests de consistencia

---

## AWU-C4: Valentina — Corregir fallos de código (CONDICIONAL)

```
┌──────────────────────────────────────────────────────────────┐
│ AWU-C4                                                       │
│ Priority: P1 (High) — Solo si AWU-C3 detecta fallos          │
│ Agent: Valentina (Backend Developer)                         │
│ Tier: balanced                                               │
│ Mode: single                                                 │
│ Dependencies: AWU-C3                                         │
│ Trigger: AWU-C3 reporta fallos que requieren cambios de código│
└──────────────────────────────────────────────────────────────┘
```

### Condición de activación

AWU-C4 **solo se ejecuta si** Teresa (AWU-C3) reporta fallos de test que:
- No son de snapshot (esos los actualiza Teresa)
- No son de test expectations (esos los actualiza Teresa)
- Son defectos funcionales en código fuente (`src/`, `extensions/`)

Si AWU-C3 produce ≥95% pass rate con 0 fallos de código → AWU-C4 se omite.

### Objetivo

Corregir defectos de código identificados por Teresa en AWU-C3, garantizando
que la suite completa pase con ≥95% pass rate y 0 fallos funcionales.

### Archivos permitidos

- `src/araya/**/*.ts` (solo si es necesario)
- `extensions/araya/index.ts` (solo si es necesario)
- ❌ NO modificar `araya.yaml` sin aprobación de Manu
- ❌ NO modificar skills/ o prompts/

### Validación

- [ ] Re-run de test suite post-fix → ≥95% pass rate
- [ ] 0 fallos de código residuales
- [ ] Fix report documentando cada cambio

### Resultado esperado

- 0 fallos de código en la suite
- Fix report en `.araya/plan/spec/req-001-valentina-fix-report-c4.md`

### Dependencias

- **AWU-C3** (Teresa): requiere output del test report para saber qué corregir

---

## AWU-C5: Valentina — Regenerar catalog.json

```
┌──────────────────────────────────────────────────────────────┐
│ AWU-C5                                                       │
│ Priority: P1 (High) — Catálogo debe reflejar post-cambios    │
│ Agent: Valentina (Backend Developer)                         │
│ Tier: balanced                                               │
│ Mode: single                                                 │
│ Dependencies: AWU-C1, AWU-C2                                 │
└──────────────────────────────────────────────────────────────┘
```

### Objetivo

Regenerar `catalog.json` para reflejar los cambios realizados en AWU-C1
(nuevos SKILL.md) y AWU-C2 (cambios en araya.yaml o prompt).

### Archivos permitidos

- `.araya/catalog/catalog.json` (regeneración completa)
- ❌ NO modificar manualmente el JSON — usar el populator

### Acciones

1. Ejecutar el populator de catálogo para regenerar desde fuentes
2. Verificar que las 4 skills de AWU-C1 aparecen con `status: enabled`
3. Verificar que los cambios de AWU-C2 se reflejan en el agente Sonia
4. Verificar que `generated_at` timestamp está actualizado

### Validación

- [ ] `catalog.json` contiene las 4 skills nuevas con `status: enabled`
- [ ] Skill count ≥ 127 (mínimo pre-AWU-C1)
- [ ] Agente Sonia refleja skills reconciliadas de AWU-C2
- [ ] `generated_at` timestamp > timestamp de AWU-C1 y AWU-C2
- [ ] 0 skills huérfanas detectadas para las 4 skills de AWU-C1

### Resultado esperado

- `catalog.json` actualizado, reflejando el estado post-AWU-C1 + post-AWU-C2
- Integridad de catálogo verificada

### Dependencias

- **AWU-C1** (Aurora): SKILL.md deben existir para que el populator los detecte
- **AWU-C2** (Priscila): cambios en prompt/yaml deben estar completos

---

## AWU-C6: Daneel — Verificación final

```
┌──────────────────────────────────────────────────────────────┐
│ AWU-C6                                                       │
│ Priority: P0 (Critical) — Reality verification gate          │
│ Agent: Daneel (Reality Authority — Right Hand of Professor)  │
│ Tier: reasoning                                              │
│ Mode: single                                                 │
│ Dependencies: AWU-C3, AWU-C5                                 │
└──────────────────────────────────────────────────────────────┘
```

### Objetivo

Verificar independientemente que el repositorio cumple con los 4 criterios
de Manu, contrastando cada claim contra el filesystem.

### Alcance de verificación

1. **AWU-C1 verification:** Los 4 SKILL.md existen y tienen frontmatter válido
2. **AWU-C2 verification:** 0 discrepancias entre prompt de Sonia y araya.yaml
3. **AWU-C3 verification:** Test pass rate ≥95%, reporte actualizado
4. **AWU-C5 verification:** catalog.json regenerado, 4 nuevas skills presentes
5. **AC-B11:** `FAILED` → `MET`
6. **AC-B13:** `CONDITIONAL` → `MET`

### Validación

- [ ] 4 SKILL.md existen (ai-routing, autonomous-execution, ax-postoffice, pm-decompose)
- [ ] Diff prompt vs yaml → 0 discrepancias
- [ ] Test pass rate ≥ 95%
- [ ] catalog.json contiene las 4 skills con `status: enabled`
- [ ] 0 FAILED ACs residuales
- [ ] Disposición: 🟢 DELIVERED o 🔴 BLOCKED

### Resultado esperado

- Verification report en `.araya/plan/spec/req-001-daneel-closure-verification.md`
- Disposición final: 🟢 DELIVERED → triggers AWU-C7 (Manu accepts)
- O: 🔴 BLOCKED → se itera sobre AWUs fallidas

### Dependencias

- **AWU-C3** (Teresa): test report actualizado
- **AWU-C5** (Valentina): catalog.json regenerado

---

## AWU-C7: Manu — PO APPROVED

```
┌──────────────────────────────────────────────────────────────┐
│ AWU-C7                                                       │
│ Priority: P0 (Critical) — Release gate                       │
│ Agent: Manu (Product Owner) 👑                               │
│ Tier: reasoning                                              │
│ Mode: single                                                 │
│ Dependencies: AWU-C6 (Daneel verification)                   │
└──────────────────────────────────────────────────────────────┘
```

### Objetivo

Manu verifica los 4 criterios de su closure decision contra las evidencias
entregadas por las AWUs C1–C6, y emite **PO APPROVED** autorizando el merge
a `main` y el cierre formal de REQ-001.

### Criterios a verificar (de `req-001-manu-closure-decision.md`)

| # | Criterio | AWU responsable | Evidencia |
|---|----------|----------------|-----------|
| C1 | AC-B11 orphan skills → MET | AWU-C1 + AWU-C5 | Daneel verifica en AWU-C6 |
| C2 | AC-B13 Sonia prompt → MET | AWU-C2 | Daneel verifica en AWU-C6 |
| C3 | Test pass rate ≥ 95% | AWU-C3 (+ AWU-C4 si aplica) | Daneel verifica en AWU-C6 |
| C4 | usability-check → priya | AWU-C3 (test expectations) | Ya decidido por Manu |

### Acciones de Manu

1. Recibir verification report de Daneel (AWU-C6)
2. Verificar cada criterio contra evidencias
3. Si los 4 criterios pasan → emitir `PO APPROVED`
4. Si algún criterio falla → indicar qué AWU debe re-ejecutarse

### Resultado esperado

```
╔══════════════════════════════════════════════════════════╗
║  🟢 PO APPROVED                                          ║
║                                                          ║
║  REQ-001 cerrado.                                        ║
║  Merge a main autorizado.                                ║
║  AC-B11: FAILED → MET                                    ║
║  AC-B13: CONDITIONAL → MET                               ║
║  48/48 ACs MET o CONDITIONAL (0 FAILED)                  ║
║  Test pass rate ≥ 95%                                    ║
╚══════════════════════════════════════════════════════════╝
```

### Dependencias

- **AWU-C6** (Daneel): requiere verification report con disposición 🟢 DELIVERED

---

## Resumen de AWUs

| AWU | Agente | Archivos | Dependencias | Resultado |
|-----|--------|----------|-------------|-----------|
| **AWU-C1** | Aurora | `skills/{ai-routing,autonomous-execution,ax-postoffice,pm-decompose}/SKILL.md` | Ninguna | AC-B11: FAILED→MET |
| **AWU-C2** | Priscila | `prompts/agents/sonia.md` | Ninguna | AC-B13: CONDITIONAL→MET |
| **AWU-C3** | Teresa | `tests/req-001-*.js` | AWU-C1, AWU-C2 | Test report ≥95% |
| **AWU-C4** | Valentina | `src/`, `extensions/` (condicional) | AWU-C3 | 0 fallos de código |
| **AWU-C5** | Valentina | `.araya/catalog/catalog.json` | AWU-C1, AWU-C2 | Catálogo actualizado |
| **AWU-C6** | Daneel | Solo lectura | AWU-C3, AWU-C5 | Verification report |
| **AWU-C7** | Manu | Solo lectura | AWU-C6 | PO APPROVED |

### Execution Budget

| Métrica | Estimado |
|---------|----------|
| AWUs totales | 7 (6 activas + 1 condicional) |
| AWUs paralelizables | AWU-C1 ∥ AWU-C2 |
| AWU-C4 probabilidad | Baja (tests ya están a 97.89%, fallas son de test expectations) |
| Ruta crítica | C1→C3→C5→C6→C7 o C2→C3→C5→C6→C7 |
| Costo estimado | < $1.00 USD |

---

## Governance

### Circuit Breakers

- Si AWU-C3 produce ≥3 CRITICAL failures → HALT, no proceder a AWU-C4 sin análisis
- Si AWU-C6 detecta drift entre claims y filesystem → HALT, no proceder a AWU-C7
- Si cualquier AWU falla 2 veces → escalar a Sonia para re-planificación

### Approval Checkpoints

- AWU-C2: si Priscila necesita modificar `araya.yaml` → requiere aprobación de Manu
- AWU-C4: cada cambio de código debe documentarse con diff
- AWU-C7: autoridad exclusiva de Manu — ningún otro agente puede emitir PO APPROVED

### Traceability

| Manu Criterion | AWU(s) | AC Impactado |
|---------------|--------|-------------|
| C1: AC-B11 orphan skills | AWU-C1, AWU-C5 | AC-B11, AC-A17 |
| C2: AC-B13 Sonia prompt | AWU-C2 | AC-B13 |
| C3: Test ≥95% | AWU-C3, AWU-C4 | All ACs verification |
| C4: usability → priya | AWU-C3 (test update) | AC-B01, AC-B14 |

---

*Sonia, PM Head Orchestrator — AWUs emitidas. 2026-07-22.*
*NO ejecuto trabajo de especialistas. Estas son solicitudes estructuradas para el executor superior.*
*Próximo paso: Aurora y Priscila ejecutan AWU-C1 y AWU-C2 en paralelo.*
