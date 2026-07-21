# REQ-001 Manu Closure Decision — PO Final Ruling

- **Decision ID:** REQ-001-MANU-CLOSURE-v1.0
- **Date:** 2026-07-22
- **Author:** Manu (Product Owner) 👑
- **Authority:** The Data Professor — delegated decision authority for REQ-001 closure
- **Trigger:** Professor's three-part directive:
  1. Decide ownership de usability-check
  2. Asigna usability-check a Priya salvo evidencia de que pertenece a otro especialista
  3. Confirma los criterios EXACTOS necesarios para emitir PO APPROVED

---

## 1. Decision: usability-check Ownership

### The Conflict

| Source | Routing | Rationale |
|--------|---------|-----------|
| **Aurora (CHRO)** | `usability-check → priya` | Priya is QA Lead with `e2e-strategy`. Usability testing is a QA function. |
| **Teresa (CCO, test)** | `usability-check → manu` | Based on original RF-B01 table which specified `manu` with `uat-review`. |
| **Valentina (implementation)** | `usability-check → priya` | Followed Aurora's CHRO specification. |

### Analysis

1. **Aurora is the authority on capability routing.** As CHRO, she owns the
   `capability-registry` and `agent-topology` skills. Her specification of
   `usability-check → priya` is a deliberate capability assignment, not an error.

2. **Priya's skillset is the correct match.** Usability checking is a QA testing
   function — it systematically verifies whether the product is usable against
   criteria. Priya's `e2e-strategy` skill directly covers this testing domain.
   Usability-check is a testing activity, not a review activity.

3. **uat-review ≠ usability-check.** My skill `uat-review` is about *reviewing
   and validating UAT packages* — a higher-level gate function that happens
   AFTER testing is complete. The pipeline is:
   ```
   Priya executes usability-check (QA testing)
   → UAT package is generated (Clara, uat-generate)
   → Manu reviews UAT package (PO, uat-review)
   ```
   These are sequential, distinct activities. usability-check is upstream of
   uat-review.

4. **The original RF-B01 table was provisional.** It was written before Aurora's
   capability coverage analysis (WS-03). Aurora's CHRO analysis supersedes the
   provisional assignment.

5. **No evidence points to a better specialist.** The only two candidates are
   Priya and Manu. No other agent has a more relevant skill for usability checking
   than `e2e-strategy` (Priya).

### Ruling

```
┌──────────────────────────────────────────────────────────┐
│  PO RULING: usability-check → PRIYA (QA Lead)            │
│                                                          │
│  Aurora's CHRO specification is CONFIRMED.               │
│  Teresa's test expectation (→ manu) is OVERRULED.        │
│  Valentina's implementation is CORRECT.                  │
│                                                          │
│  Rationale: usability-check is a QA testing function     │
│  (e2e-strategy), not a PO review function (uat-review).  │
│  Aurora as CHRO has authority over capability routing.   │
│                                                          │
│  Action required:                                        │
│  - Teresa: update test expectations for AC-B01 to        │
│    reflect priya as correct target                       │
│  - Manu (me): update AC-B01 documentation if needed      │
│  - No code changes required (implementation is correct)  │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Assignment Confirmation

Confirmo la asignación de `usability-check` a **Priya (QA Lead)**. No existe
evidencia de que pertenezca a otro especialista. Análisis completo:

| Candidato | Skill más relevante | ¿Alineado con usability-check? |
|-----------|--------------------|-------------------------------|
| **Priya** | e2e-strategy | ✅ YES — QA testing de usabilidad |
| Manu | uat-review | ❌ NO — review de paquetes UAT, no ejecución de tests |
| Clara | uat-generate | ❌ NO — generación de UAT, no testing |
| Teresa | test-case | ⚠️ PARCIAL — diseño de test cases, no ejecución de usability |

Priya es la única especialista con skills directamente alineadas a la ejecución
de verificaciones de usabilidad como actividad de QA. La asignación es **firme
y definitiva**.

---

## 3. Exact Criteria for PO APPROVED

### Current State (al momento de esta decisión)

| Métrica | Valor |
|---------|-------|
| ACs MET | 32 / 48 (66.7%) |
| ACs CONDITIONAL | 15 / 48 (31.3%) |
| ACs FAILED | 1 / 48 (2.1%) — AC-B11 |
| Condiciones pendientes | 4 (de req-001-final-validation.md) |
| Test pass rate | 338/349 (96.85%) |
| Blockers | 0 |

### The 1 FAILED AC

**AC-B11**: Skills huérfanas de Aurora — 4 skills (`skills-lifecycle`,
`spof-detection`, `hiring-recommendations`, `organizational-health`) declaradas
en `araya.yaml` sin `SKILL.md`.

### The 4 Pending Conditions (from req-001-final-validation.md)

| # | Condition | Owner | Status |
|---|-----------|-------|--------|
| C1 | AC-B11 — Aurora's orphan skills resueltas | Aurora + Priscila | PENDING |
| C2 | AC-B13 — Sonia prompt reconciliado con araya.yaml | Priscila | PENDING |
| C3 | Teresa re-run test suite → ≥95% pass rate | Teresa | PENDING |
| C4 | usability-check routing decision | The Data Professor → Manu | **RESUELTA por esta decisión** |

### Criteria EXACTOS para PO APPROVED

Para que yo (Manu) emita **PO APPROVED** y autorice el cierre de REQ-001,
deben cumplirse TODOS los siguientes criterios en el orden especificado:

---

#### Criterion 1: AC-B11 — Aurora's Orphan Skills Resolved

```
┌──────────────────────────────────────────────────────────┐
│  REQUISITO EXACTO:                                       │
│                                                          │
│  Opción A (preferida):                                   │
│  - Aurora o Priscila crean skills/<name>/SKILL.md        │
│    para las 4 skills huérfanas                           │
│  - Skills aparecen con status "enabled" en catálogo      │
│  - Validación de integridad no reporta SKILL_ORPHAN      │
│                                                          │
│  Opción B (aceptable con desviación documentada):        │
│  - Se documenta formalmente en .araya/plan/spec/         │
│    req-001-aurora-orphan-skills-backlog.md:               │
│    * Por qué cada skill no tiene SKILL.md aún            │
│    * Timeline estimado para creación (sprint/versión)    │
│    * Issue de follow-up creado y referenciado            │
│  - Las 4 skills mantienen status "not-installed"         │
│  - Yo (Manu) acepto la desviación por escrito            │
│                                                          │
│  NO ACEPTABLE:                                           │
│  - Skills huérfanas sin acción documentada               │
│  - Silencio — ignorar el gap                            │
│                                                          │
│  VERIFICACIÓN:                                           │
│  - Yo inspecciono skills/ para los 4 SKILL.md            │
│  - O leo el documento de backlog y apruebo desviación    │
│  - AC-B11 transiciona de FAILED → MET (o CONDITIONAL     │
│    con desviación aprobada)                              │
└──────────────────────────────────────────────────────────┘
```

---

#### Criterion 2: AC-B13 — Sonia Prompt Fully Reconciled

```
┌──────────────────────────────────────────────────────────┐
│  REQUISITO EXACTO:                                       │
│                                                          │
│  Priscila debe resolver las 13 discrepancias entre       │
│  prompts/agents/sonia.md y araya.yaml:                   │
│                                                          │
│  - Skills en prompt NO en araya.yaml:                    │
│    * Añadir a araya.yaml O remover del prompt            │
│    * Cada skill resuelta individualmente                 │
│                                                          │
│  - Skills en araya.yaml NO en prompt:                    │
│    * Documentar en prompt de Sonia                       │
│    * Cada skill documentada individualmente              │
│                                                          │
│  VERIFICACIÓN:                                           │
│  - diff entre prompt y yaml → 0 discrepancias            │
│  - Skill count en prompt = skill count en yaml           │
│  - AC-B13 transiciona de CONDITIONAL → MET               │
│                                                          │
│  NO ACEPTABLE:                                           │
│  - Discrepancias residuales sin justificación            │
│  - "Ya casi" sin verificación de 0 diferencias           │
└──────────────────────────────────────────────────────────┘
```

---

#### Criterion 3: Teresa Test Suite Re-Run → ≥95% Pass Rate

```
┌──────────────────────────────────────────────────────────┐
│  REQUISITO EXACTO:                                       │
│                                                          │
│  Teresa debe:                                            │
│  1. Re-ejecutar las 6 suites completas contra el         │
│     repositorio en estado post-fix + post-decisiones     │
│  2. Actualizar test expectations para:                   │
│     - usability-check → priya (antes: manu)              │
│     - 4 unassigned skills → ahora 0 (test esperaba 4)    │
│     - Snapshots del catálogo (5 failures actuales)       │
│  3. Entregar test report actualizado con:                │
│     - Pass rate ≥ 95% (umbral absoluto)                  │
│     - 0 CRITICAL failures                                │
│     - Breakdown por suite                                │
│     - Hallazgos categorizados con severidad              │
│                                                          │
│  VERIFICACIÓN:                                           │
│  - Leo el test report actualizado                        │
│  - Pass rate ≥ 95% confirmado                            │
│  - 0 failures que indiquen defectos funcionales          │
│                                                          │
│  NO ACEPTABLE:                                           │
│  - Pass rate < 95%                                       │
│  - Failures no categorizados o sin explicación           │
│  - "Los tests pasan en mi máquina" sin reporte           │
└──────────────────────────────────────────────────────────┘
```

---

#### Criterion 4: usability-check Decision Applied

```
┌──────────────────────────────────────────────────────────┐
│  REQUISITO EXACTO:                                       │
│                                                          │
│  Ya RESUELTO por esta decisión (Sección 1-2).            │
│                                                          │
│  Acciones derivadas requeridas:                          │
│  - Teresa: actualiza test expectations en AC-B01         │
│    y AC-B14 para reflejar priya como target              │
│  - Si existe documentación que referencia                 │
│    usability-check → manu, debe actualizarse             │
│  - No se requiere cambio de código (ya implementado)     │
│                                                          │
│  VERIFICACIÓN:                                           │
│  - Tests de AC-B01 y AC-B14 esperan → priya              │
│  - Catálogo muestra usability-check → priya              │
│  - Documentación de ACs coherente con la ruta            │
└──────────────────────────────────────────────────────────┘
```

---

### Lo que NO necesito para PO APPROVED

Para ser absolutamente claro sobre lo que NO bloquea el cierre:

| Ítem | ¿Bloquea? | Por qué |
|------|-----------|---------|
| **15 CONDITIONAL ACs** | ❌ NO | Ninguno es funcionalmente blocker. Son verificaciones adicionales, calidad de contenido, o tests end-to-end que el proceso SDLC cubrirá. Los acepto como CONDITIONAL con plan de acción documentado. |
| **AC-A03** (uat-generate syntax) | ❌ NO | Gap de contenido en catálogo. Cosmético. |
| **AC-A06** (long_help < short_help) | ❌ NO | Defecto de formato. Cosmético. |
| **AC-A07** (skills-lifecycle placeholder) | ❌ NO | El populator genera placeholder. Es comportamiento esperado para skills not-installed. |
| **AC-A14** (not-installed rendering) | ❌ NO | Detecta correctamente. Rendering mejorable pero funcional. |
| **AC-A15/A16** (live regeneration) | ❌ NO | Mecanismo existe. Test live es nice-to-have. |
| **AC-B03/B04** (capability validation) | ❌ NO | Infraestructura lista. Test end-to-end pendiente. |
| **AC-B07/B10** (nuevo agente sin skill) | ❌ NO | Infraestructura lista. No testeado con agente real nuevo. |
| **AC-C04** (cross-runtime) | ❌ NO | Arquitectura lo soporta. Verificación cross-runtime es fase siguiente. |
| **AC-C07/C08** (evidence/sessions) | ❌ NO | Broker implementado. End-to-end test pendiente. |
| **H4 STRIDE** (Diana docs) | ❌ NO | Documentación de seguridad. No es código. |
| **RNF-01** (performance) | ❌ NO | No probado. No blocker para funcionalidad. |
| **RNF-04** (idempotencia) | ❌ NO | Broker existe. Test pendiente. |
| **RNF-06** (trazabilidad) | ❌ NO | Broker existe. Verificación end-to-end pendiente. |
| **RNF-07** (backward compat) | ❌ NO | No fully tested. Pero 96.85% pass rate sugiere sin regresiones. |

---

## 4. Sequence to PO APPROVED

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: Aurora/Priscila resuelven AC-B11               │
│  ├─ Opción A: Crean 4 SKILL.md                          │
│  └─ Opción B: Documentan backlog (yo apruebo desviación)│
│                                                         │
│  PASO 2: Priscila reconcilia Sonia prompt (AC-B13)      │
│  └─ 13 discrepancias → 0 discrepancias                  │
│                                                         │
│  PASO 3: Teresa re-ejecuta test suite                   │
│  ├─ Actualiza expectations (usability-check, snapshots) │
│  ├─ Confirma ≥95% pass rate                             │
│  └─ Entrega reporte actualizado                         │
│                                                         │
│  PASO 4: Manu verifica criterios 1-4                    │
│  ├─ AC-B11: FAILED → MET (o CONDITIONAL aprobado)       │
│  ├─ AC-B13: CONDITIONAL → MET                           │
│  ├─ Test pass rate ≥ 95%                                │
│  ├─ usability-check → priya reflejado en tests/docs     │
│  └─ 0 FAILED ACs residuales                             │
│                                                         │
│  PASO 5: MANU EMITE PO APPROVED                         │
│  └─ REQ-001 cerrado. Merge a main autorizado.           │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Final Disposition (Current)

```
╔══════════════════════════════════════════════════════════╗
║  🟡 PO CONDITIONAL — 4 criteria pending                 ║
║                                                          ║
║  C1: AC-B11 Aurora orphan skills    → Aurora/Priscila   ║
║  C2: AC-B13 Sonia prompt reconcile  → Priscila          ║
║  C3: Test re-run ≥95%               → Teresa            ║
║  C4: usability-check → priya        → RESUELTA ✓        ║
║                                                          ║
║  Cuando C1-C3 se completen y verifiquen:                 ║
║  → PO APPROVED. REQ-001 cerrado.                        ║
╚══════════════════════════════════════════════════════════╝
```

---

## 6. Traceability

| Request | Decision | Status |
|---------|----------|--------|
| Professor directive 1 | usability-check ownership → Priya | ✅ DECIDIDO |
| Professor directive 2 | Asignación a Priya confirmada | ✅ CONFIRMADO |
| Professor directive 3 | Criterios exactos para PO APPROVED | ✅ DOCUMENTADOS |

---

## Appendix A: Authority Statement

Esta decisión se emite con la autoridad que The Data Professor me ha delegado
como Product Owner de ARAYA. Las decisiones aquí contenidas son vinculantes para
todos los agentes del proyecto:

- **Aurora** — ejecuta Criterion 1 (orphan skills) con Priscila
- **Priscila** — ejecuta Criterion 2 (Sonia prompt reconciliation)
- **Teresa** — ejecuta Criterion 3 (test suite re-run) + actualiza test expectations
- **Valentina** — sin acción requerida (implementación correcta)
- **Sonia** — sin acción requerida (orquestación correcta)

Ningún agente puede modificar estas decisiones sin mi aprobación explícita.

---

*Manu, Product Owner 👑 — Closure decision rendered.*
*The Professor holds ultimate authority. This decision stands unless overruled.*
