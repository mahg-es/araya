# REQ-001 Audit Report — ARAYA Command Discovery, Manual & Specialist Delegation

- **Workstream:** WS-01 (Audit & Gap Analysis)
- **Auditor:** Esteban (CKO)
- **Date:** 2026-07-22
- **Status:** Complete — audit only, no implementation

---

## Executive Summary

ARAYA dispone de un ecosistema extenso de 38+ comandos slash, 30 agentes, 122 skills
y 28 rutas de subcomandos. Sin embargo, la capacidad actual adolece de problemas
estructurales que impiden el descubrimiento, la ayuda contextual y la delegación
correcta. Los hallazgos principales son:

1. **No existe `/araya:man` ni `--help` por comando.** La única ayuda disponible es
   una cadena hardcodeada de ~100 líneas en `extensions/araya/index.ts` que diverge
   de las fuentes reales (araya.yaml, prompts/, skills/).

2. **Sonia concentra el 57% de las rutas de subcomandos** (16 de 28). Varias de
   estas rutas deberían delegar en especialistas (Mateo para FinOps, Aurora para
   routing, Rolando para verificación).

3. **Divergencia entre fuentes de verdad:**
   - 4 skills declaradas en araya.yaml sin directorio en skills/
   - 4 skills con directorio pero sin declaración en araya.yaml
   - 4 agentes sin archivo de prompt (daneel, neo, rolando, trinity)
   - 9 skills del prompt de Sonia no están en araya.yaml

4. **La delegación depende exclusivamente del runtime** (herramienta `subagent` de
   pi). No existe broker/orquestador portable. Sin IDs de correlación, sin
   detección de ciclos, sin límite de profundidad.

5. **5 agentes "bare"** con ≤1 skill no-ax3: daneel, neo, rolando, sofia, trinity.
   Son agentes declarados pero no funcionalmente equipados.

---

## Command Inventory

### Slash Commands Registrados (`pi.registerCommand`)

| # | Comando | Descripción | Implementación |
|---|---------|-------------|----------------|
| 1 | `/araya` | Hub principal (status, help, run, delegate) | Handler único ~1200 líneas |
| 2 | `/araya:status` | Roster completo de agentes | Directo — lee araya.yaml |
| 3 | `/araya:install` | Instalar ARAYA | Ejecuta araya-setup.sh |
| 4 | `/araya:review-delivery` | DRR post-delivery | Delega a Sonia |
| 5 | `/araya:generate-uat` | Generar paquete UAT | Delega a Sonia |
| 6 | `/araya:review-uat` | Revisar UAT completeness | Delega a Manu |
| 7 | `/araya:uat-status` | Estado UAT | Delega a Sonia |
| 8 | `/araya:budget-status` | Estado de tokens y budget | Delega a Sonia |
| 9 | `/araya:optimize-task` | Optimizar task para token efficiency | Delega a Sonia |
| 10 | `/araya:compress-context` | Comprimir contexto | Delega a Sonia |
| 11 | `/araya:efficiency-report` | Reporte de eficiencia | Delega a Sonia |
| 12 | `/araya:spec:init` | Inicializar estructura spec | Directo — crea directorios |
| 13 | `/araya:spec:list` | Listar specs activas | Directo — lee filesystem |
| 14 | `/araya:validate` | Validar delivery contra ACs | Directo — parsea acceptance.md |
| 15 | `/araya:trace` | Trazabilidad REQ→CR | Directo — parsea artifacts |
| 16 | `/araya:metrics` | Métricas de gobernanza | Directo — parsea artifacts |
| 17 | `/araya:constitution` | Mostrar/validar constitución | Directo — lee constitution.md |
| 18 | `/araya:knowledge` | Conocimiento organizacional | Directo — lee .araya/knowledge/ |
| 19 | `/araya:learn` | Capturar lección | Directo — escribe archivo |
| 20 | `/araya:reconstitute` | Reconstituir contexto | Directo — analiza repo |
| 21 | `/araya:trajectory` | Trayectorias doradas | Directo — lee .araya/trajectories/ |
| 22 | `/araya:improve` | Recomendar mejoras de proceso | Delega a Esteban |
| 23 | `/araya:graph` | Knowledge graph | Directo — lee .araya/graph/ |
| 24 | `/araya:ask` | Consulta organizacional | Delega a Esteban |
| 25 | `/araya:graph:prepare` | Validar readiness graph builder | Directo — check files |
| 26 | `/araya:version` | Versión y release path | Directo — lee araya.yaml |
| 27 | `/araya:release-check` | Validar MAHG Release Standard | Directo — parsea versión |
| 28 | `/araya:route` | Recomendar provider+model | Delega a Sonia |
| 29 | `/araya:provider:list` | Listar providers | Directo — hardcoded |
| 30 | `/araya:model:list` | Listar model tiers | Directo — hardcoded |
| 31 | `/araya:team:recommend` | Recomendar equipo | Delega a Aurora |
| 32 | `/araya:team:assemble` | Ensamblar equipo | Delega a Aurora |
| 33 | `/araya:team:risk` | Riesgos de workforce | Delega a Aurora |
| 34 | `/araya:team:list` | Listar formaciones | Directo — hardcoded |
| 35 | `/araya:usability-check` | Evidencia de usabilidad | Directo — lee .araya/evidence/ |
| 36 | `/araya:compact` | Context capsule | Directo — escribe .araya/compact/ |
| 37 | `/araya:handoff` | Agente handoff | Directo — escribe .araya/handoff/ |
| 38 | `/araya:ax3` | Reconciliar/check/repair AX3 | Delega a motor AX3 |

### Space-form Subcommand Routes (`/araya <cmd>`)

Estas son rutas internas del handler central que mapean palabras clave a agentes:

| Subcomando | Agente destino | ¿Correcto? | Comentario |
|-----------|----------------|------------|------------|
| `validate` | sonia | ⚠️ | Debería ser Rolando (reality-verification) o Elena (PM audit) |
| `constitution` | sonia | ⚠️ | Debería ser Manu (governance owner) |
| `release-check` | sonia | ⚠️ | Debería ser Manu (release gate) |
| `usability-check` | sonia | ⚠️ | Debería ser Manu/Priya |
| `trace` | sonia | ✅ | PM traceability |
| `metrics` | sonia | ✅ | PM métricas |
| `review-delivery` | sonia | ⚠️ | DRR ok para Sonia, pero IAR y routing a especialistas debe ser explícito |
| `generate-uat` | sonia | ❌ | **Delegación incorrecta.** Clara tiene `uat-generate`. Sonia no. |
| `review-uat` | manu | ✅ | PO review |
| `uat-status` | sonia | ⚠️ | Podría ser directo |
| `knowledge` | esteban | ✅ | CKO domain |
| `learn` | esteban | ✅ | CKO domain |
| `trajectory` | esteban | ✅ | CKO domain |
| `improve` | esteban | ✅ | CKO domain |
| `graph` | esteban | ✅ | CKO domain |
| `ask` | esteban | ✅ | CKO domain |
| `budget-status` | sonia | ❌ | **Delegación incorrecta.** Mateo tiene `token-efficiency`. Sonia no. |
| `optimize-task` | sonia | ❌ | **Delegación incorrecta.** Mateo es FinOps specialist. |
| `efficiency-report` | sonia | ❌ | **Delegación incorrecta.** Mateo domain. |
| `route` | sonia | ❌ | **Delegación incorrecta.** Aurora es Capability Officer con `ai-routing`. |
| `team` (recommend/assemble/risk) | aurora | ✅ | CHRO domain |
| `anticipate` | sonia | ⚠️ | Podría ser Elena (risk) o Esteban (organizational) |
| `align` | manu | ✅ | PO alignment |
| `prioritize` | sonia | ✅ | PM prioritization |
| `harmonize` | manu | ✅ | PO tradeoffs |
| `understand` | manu | ✅ | PO discovery |
| `roundtable` | sonia | ✅ | PM orchestration |
| `sharpen` | esteban | ✅ | CKO improvement |

**Resumen de rutas incorrectas: 7 de 28 (25%)** donde Sonia ejecuta trabajo que
pertenece a otro especialista disponible.

### Delegación por Agente (`/araya <agent> <task>`)

Los 30 agentes son accesibles mediante `/araya <agent> <task>`. Sin embargo:
- No hay validación de que el agente destino tenga las skills necesarias para la tarea.
- No hay verificación de permisos (can_write_code, etc.) antes de delegar.
- La asignación es puramente nominal — el runtime no verifica capabilities.

### Gaps de Comandos

1. **No existe `/araya:man`** — requerido explícitamente por REQ-001.
2. **No existe `--help` por comando** — no hay mecanismo para consultar ayuda de un comando específico.
3. **No existe search** — no se puede buscar por keyword, dominio, propósito o tarea.
4. **No existe comando de disponibilidad** — no se sabe si una función está enabled/disabled/deprecated.
5. **No hay enlace fuente de verdad** — los comandos no enlazan con su implementación en el repositorio.

---

## Help Mechanisms

### Lo que existe

| Mecanismo | Cobertura | Generación |
|-----------|-----------|------------|
| `/araya` (vacío) | Resumen conciso + PROJECT-001 violations | Hardcoded |
| `/araya help` | Manual completo (~100 líneas) | Hardcoded string |
| `/araya <agent>` (sin task) | Info de agente: role, skills, tier | Auto-generado de araya.yaml |
| `/araya:status` | Roster completo con tiers y skills | Auto-generado de araya.yaml |
| Sonia prompt auto-generado | Contexto de agente + skills + permissions | Auto-generado de araya.yaml + prompt file |

### Lo que falta (requerido por REQ-001)

| Gap | Detalle |
|-----|---------|
| `/araya:man` | No existe. Debe listar capacidades y mostrar detalle por función/agente/skill. |
| `/araya <cmd> --help` | Ningún comando soporta `--help`. No hay infraestructura para ello. |
| Ayuda auto-generada | `/araya help` es hardcoded. Si se añade un comando nuevo, la ayuda no se actualiza. |
| Búsqueda por keyword | No existe `--search`, `--filter`, `--domain`. |
| Sintaxis y ejemplos | La ayuda actual no muestra argumentos, opciones, ni ejemplos. |
| Precondiciones y restricciones | No se muestran permisos, riesgos ni efectos secundarios. |
| Estado de disponibilidad | No se indica si una función está enabled/disabled/deprecated. |
| Enlace fuente de verdad | No hay referencia al archivo fuente de cada capacidad. |
| Errores claros | Comandos inexistentes muestran error genérico sin sugerir alternativas reales. |

### Evaluación de madurez

La ayuda actual funciona para un operador humano que ya conoce ARAYA. No funciona
para un agente que necesita descubrir capacidades programáticamente. El manual
hardcoded diverge inevitablemente de las fuentes reales (araya.yaml, skills/,
prompts/). **No pasa el criterio de aceptación #6** (ayuda validada contra fuentes).

---

## Skills Registry

### Estadísticas

| Métrica | Valor |
|---------|-------|
| Skills declaradas en araya.yaml | 122 (entre todos los agentes) |
| Directorios en skills/ | 122 (+ AX3.md) |
| Skills únicas en araya.yaml | 126 (contando duplicados entre agentes) |
| Skills con directorio | 122 |
| Skills sin directorio | 4 |
| Directorios sin declaración | 4 |

### Skills declaradas sin directorio (🔴 huérfanas)

Estas skills están asignadas a agentes en `araya.yaml` pero **no tienen SKILL.md ni
directorio en `skills/`:**

| Skill | Agente afectado | Impacto |
|-------|----------------|---------|
| `hiring-recommendations` | Aurora | CHRO no puede ejecutar hiring recommendations |
| `organizational-health` | Aurora | CHRO no puede evaluar salud organizacional |
| `skills-lifecycle` | Aurora | CHRO no puede gestionar ciclo de vida de skills |
| `spof-detection` | Aurora | CHRO no puede detectar single points of failure |

**Aurora tiene 4 de 9 skills huérfanas (44%).** Su capacidad operativa está severamente limitada.

### Directorios sin declaración en araya.yaml (🟡 no asignadas)

Estas skills existen en `skills/` pero **ningún agente las tiene asignadas:**

| Skill | Descripción probable |
|-------|---------------------|
| `ai-routing` | Provider-agnostic AI routing |
| `autonomous-execution` | Autonomous execution triggers |
| `ax-postoffice` | PostOffice operational directives |
| `pm-decompose` | Task decomposition (WBS) |

Estas 4 skills son capacidades disponibles pero invisibles porque ningún agente
puede invocarlas. Son "dead code" organizacional.

### Sonia: Drift Prompt vs araya.yaml

El archivo `prompts/agents/sonia.md` lista skills que **no están en `araya.yaml`:**

| Skill en prompt | ¿En araya.yaml? | ¿En skills/? | Nota |
|-----------------|-----------------|--------------|------|
| `pm-decompose` | ❌ | ✅ | Existe pero no asignada a nadie |
| `sprint-planning` | ❌ | ✅ | Asignada a Elena, no a Sonia |
| `daily-standup` | ❌ | ✅ | Asignada a Elena, no a Sonia |
| `daily-note` | ❌ | ✅ | Asignada a Esteban, no a Sonia |
| `retrospective` | ❌ | ✅ | Asignada a Elena, no a Sonia |
| `impediment` | ❌ | ✅ | Asignada a Elena, no a Sonia |
| `velocity` | ❌ | ✅ | Asignada a Elena, no a Sonia |
| `content-calendar` | ❌ | ✅ | Asignada a Lucas, no a Sonia |
| `sdd-vision` | ❌ | ✅ | Asignada a Manu, no a Sonia |

Y skills en `araya.yaml` que **no están en el prompt de Sonia:**

| Skill en araya.yaml | ¿En prompt? | Nota |
|---------------------|-------------|------|
| `drr-create` | ❌ | Sonia lo usa en SUBCOMMAND_ROUTES pero no está documentado en su prompt |
| `iar-generate` | ❌ | Ídem |
| `cr-generate` | ❌ | Ídem |
| `ax3` | ❌ | Skill transversal |

**Conclusión:** Hay 13 discrepancias entre el prompt de Sonia y araya.yaml. Sonia
cree que tiene 14 skills; en realidad tiene 9. Tres de las que realmente tiene
no están documentadas en su prompt.

### Cobertura de Skills

| Dominio | Skills | Cobertura |
|---------|--------|-----------|
| Backend | api-design, db-schema, endpoint, auth-middleware, error-handling | ✅ Completo |
| Frontend | component, form-design, page-route, api-integration, responsive, animation, performance, accessibility, state-management | ✅ Completo |
| Arquitectura | microservice, api-gateway, cache-strategy, message-queue, db-optimization, component-arch | ✅ Completo |
| QA/Testing | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute, uat-generate, uat-review, performance-test, e2e-strategy, cicd-quality | ✅ Completo |
| Seguridad | threat-model, secure-arch, secure-code, pentest, compliance, secrets | ✅ Completo |
| Infra/DevOps | docker, kubernetes, cicd-pipeline, cloud-deploy, cloud-provision, monitoring, deployment-automation | ✅ Completo |
| Datos/AI | data-lakehouse-design, spark-pipeline, data-modeling, data-governance, data-quality, etl-orchestration, medallion-architecture, llm-local-deploy, rag-pipeline, vector-search, agent-design, model-fine-tuning | ✅ Completo |
| BI/Analytics | dashboard-design, data-visualization, kpi-framework, analytics-report | ✅ Completo |
| FinOps | cost-analysis, usage-metering, resource-rightsizing, budget-forecasting, token-efficiency | ✅ Completo |
| Rentabilidad | abc-costing-model, whale-curve-analyze, cost-to-serve, profitability-lineage | ✅ Completo |
| Educación | lab-scenario-design, student-assessment, training-module, curriculum-planning | ✅ Completo |
| Contenido/Marca | seo-optimize, geo-branding, multi-platform-publish, content-calendar, brand-compliance, visual-identity, brand-audit, asset-management | ✅ Completo |
| Documentación | adr-write, api-document, architecture-diagram, slide-deck-generate, technical-book | ✅ Completo |
| Gobernanza/PM | pm-plan, pm-dependencies, pm-risk, pm-status, project-planning, drr-create, iar-generate, cr-generate, daily-standup, sprint-planning, retrospective, impediment, velocity, definition-of-done, reality-verification | ✅ Completo |
| Conocimiento | daily-note, knowledge-graph, pkm-workflow, organizational-knowledge, trajectory-management | ✅ Completo |
| CHRO (parcial) | capability-registry, gap-analysis, workforce-planning, agent-topology | ⚠️ 4 skills huérfanas |
| AX (transversal) | ax3, ax-postoffice, autonomous-execution, ai-routing, token-efficiency | ⚠️ 3 sin asignar |

---

## Agent Roster

### Total: 30 agentes declarados

| # | Agente | Role | Tier | Write Code | Skills (no-ax3) | Prompt? |
|---|--------|------|------|------------|------------------|---------|
| 1 | rolando | Reality Authority (Verifier) | reasoning | ❌ | 1 | ❌ |
| 2 | daneel | Delegated Executor | balanced | ✅ | 0 | ❌ |
| 3 | manu | Product Owner | reasoning | ❌ | 11 | ✅ |
| 4 | aurora | Capability Officer | reasoning | ❌ | 8 (4 huérfanas) | ✅ |
| 5 | neo | Dynamic Capability Agent | balanced | ✅ | 0 | ❌ |
| 6 | trinity | Dynamic Capability Agent | balanced | ✅ | 0 | ❌ |
| 7 | sonia | Program Director & PMO Head | reasoning | ❌ | 8 | ✅ |
| 8 | valentina | Backend Developer | balanced | ✅ | 5 | ✅ |
| 9 | alejandra | Frontend Developer | balanced | ✅ | 5 | ✅ |
| 10 | teresa | Chief Culinary Officer (CCO) | balanced | ❌ | 2 | ✅ |
| 11 | clara | QA Engineer | balanced | ✅ | 9 | ✅ |
| 12 | aisha | Backend Architect | reasoning | ❌ | 5 | ✅ |
| 13 | lin | Frontend Architect | reasoning | ❌ | 5 | ✅ |
| 14 | priya | QA Lead | balanced | ❌ | 5 | ✅ |
| 15 | diana | Cybersecurity Specialist | reasoning | ❌ | 6 | ✅ |
| 16 | isla | Infra Architect | reasoning | ✅ | 5 | ✅ |
| 17 | elena | Scrum Master + PM Auditor | balanced | ❌ | 7 | ✅ |
| 18 | sofia | AI Assistant | fast | N/A | 0 | ✅ |
| 19 | junia | Data Platform Architect | reasoning | ❌ | 5 | ✅ |
| 20 | bernabe | Data Engineer | balanced | ✅ | 4 | ✅ |
| 21 | maria | AI/ML Engineer | reasoning | ✅ | 5 | ✅ |
| 22 | lucas | Content Strategist | balanced | ❌ | 4 | ✅ |
| 23 | priscila | Technical Writer | balanced | ✅ | 5 | ✅ |
| 24 | lidia | Profitability Domain Expert | reasoning | ❌ | 4 | ✅ |
| 25 | pablo | BI & Analytics Lead | balanced | ❌ | 4 | ✅ |
| 26 | mateo | FinOps Specialist | balanced | ❌ | 5 | ✅ |
| 27 | eunice | Educational Designer | balanced | ✅ | 4 | ✅ |
| 28 | esteban | Chief Knowledge Officer | balanced | ✅ | 6 | ✅ |
| 29 | aquila | Static Site Engineer | balanced | ✅ | 4 | ✅ |
| 30 | dorcas | Brand Governance Lead | balanced | ❌ | 4 | ✅ |

### Agentes "Bare" (≤1 skill no-ax3)

| Agente | Skills no-ax3 | Estado | Riesgo |
|--------|---------------|--------|--------|
| daneel | 0 | Sin prompt, sin skills | No puede ejecutar ninguna tarea especializada |
| neo | 0 | dormant, sin prompt | Template sin implementar |
| trinity | 0 | dormant, sin prompt | Template sin implementar |
| rolando | 1 (reality-verification) | Sin prompt | Severamente limitado |
| sofia | 0 | General assistant | Intencionalmente genérica |

### Gaps de Skills por Agente

| Agente | Skills faltantes | Tipo |
|--------|-----------------|------|
| Aurora | 4/9 skills huérfanas (hiring-recommendations, organizational-health, skills-lifecycle, spof-detection) | 🔴 Skills no implementadas |
| Sonia | 9 skills en prompt no en araya.yaml | 🟡 Drift prompt↔yaml |
| Sonia | 3 skills en yaml no en prompt (drr-create, iar-generate, cr-generate) | 🟡 Drift prompt↔yaml |
| daneel | Sin skills más allá de ax3 | 🔴 Agente sin capacidades |
| rolando | Solo reality-verification | 🔴 Agente sin prompt |
| sofia | Sin skills especializadas | 🟡 Por diseño, pero limita utilidad |

### Archivos de Prompt Faltantes

| Agente | Agregado | Estado |
|--------|----------|--------|
| daneel | 2026-07-19 | ❌ Sin prompt |
| rolando | 2026-07-19 (renombrado de Daneel) | ❌ Sin prompt |
| neo | N/A | ❌ Sin prompt (dormant) |
| trinity | N/A | ❌ Sin prompt (dormant) |

---

## Delegation Audit

### Violación Principal (caso origen de REQ-001)

> "Sonia ejecutó directamente una incorporación que debía haber coordinado y
> delegado entre agentes especialistas."

Este patrón no es un incidente aislado — está **estructuralmente habilitado**
por el diseño actual del extension. Sonia es el agente destino por defecto para
el 57% de las rutas de subcomando, incluyendo tareas que pertenecen a otros
especialistas.

### Violaciones Detectadas en SUBCOMMAND_ROUTES

| Ruta | Agente actual | Agente correcto | Skills relevantes |
|------|--------------|-----------------|-------------------|
| `generate-uat` | sonia | clara | `uat-generate` (Clara lo tiene, Sonia no) |
| `budget-status` | sonia | mateo | `token-efficiency` (Mateo lo tiene, Sonia no) |
| `optimize-task` | sonia | mateo | `token-efficiency` (Mateo lo tiene, Sonia no) |
| `efficiency-report` | sonia | mateo | `token-efficiency` (Mateo lo tiene, Sonia no) |
| `route` | sonia | aurora | `ai-routing` existe pero sin asignar; Aurora es Capability Officer |
| `validate` | sonia | rolando | `reality-verification` (Rolando lo tiene, Sonia no) |
| `usability-check` | sonia | manu/priya | `uat-review` (Manu/Priya lo tienen) |

### Violación Estructural: Sonia como Cuello de Botella

```
Rutas por agente:
  sonia:   16 (57.1%)  ← concentración excesiva
  esteban:  7 (25.0%)
  manu:     4 (14.3%)
  aurora:   1 (3.6%)
```

Además, en el flujo `/araya run`, **todas** las fases pasan por Sonia como
orquestador, y varias tareas de reporting/governance se le asignan directamente
en lugar de delegarse al especialista correspondiente.

### Dependencia del Runtime (`subagent`)

La delegación entre agentes depende de la herramienta `subagent` de pi:

```typescript
// extensions/araya/index.ts — línea relevante
`**Subagent Delegation:** ENABLED — use the subagent tool for delegation`
```

Esto viola **DI-002** (Independencia del runtime). El prompt de Sonia instruye
usar `subagent` tool, que es específica de pi. En Codex, Claude CLI, o AGY no
existiría este mecanismo.

### Infraestructura de Delegación Ausente

| Requisito (REQ-001) | Estado |
|---------------------|--------|
| DI-001: Broker/Orquestador | ❌ No existe |
| DI-002: Independencia del runtime | ❌ Depende de `subagent` |
| DI-003: Capacidades mínimas (correlación, sesiones, permisos, estados, resultados, evidencia) | ❌ Ninguna implementada |
| DI-004: Protección contra recursión | ❌ No implementada |
| DI-005: Separación orden/ejecución | ❌ Sonia ejecuta, no solo ordena |
| DI-006: Verificación | ❌ No aplicable |
| Specialist Delegation Contract | ❌ No se cumple: Sonia ejecuta tareas de especialistas |

---

## Recommendations

Las recomendaciones se presentan en orden de prioridad, agrupadas por lo que
REQ-001 exige explícitamente.

### [1] Prioridad Crítica — Mecanismo de Descubrimiento y Ayuda

**1A. Crear `/araya:man`**
- Leer `araya.yaml` y `skills/` como fuentes de verdad.
- Auto-generar catálogo en runtime (no hardcoded).
- Soporte: `/araya:man`, `/araya:man <cmd>`, `/araya:man <agent>`, `/araya:man <skill>`.

**1B. Implementar `--help` por comando**
- Cada `pi.registerCommand` debe exponer metadatos (args, flags, examples).
- El handler debe interceptar `--help` y mostrar ayuda estructurada.

**1C. Implementar búsqueda**
- `/araya:man --search <keyword>` o `/araya:man --domain <domain>`.
- Búsqueda por nombre, propósito, agente, skill, dominio.

**1D. Errores inteligentes**
- Cuando un comando no existe, sugerir los 3 comandos más cercanos (Levenshtein).
- Nunca sugerir comandos o agentes inventados.

### [2] Prioridad Alta — Sincronización de Fuentes de Verdad

**2A. Reconciliar araya.yaml ↔ skills/**
- Crear directorios para las 4 skills huérfanas de Aurora.
- Asignar las 4 skills no asignadas a agentes (ai-routing → Aurora, pm-decompose → Sonia, etc.).

**2B. Reconciliar araya.yaml ↔ prompts/agents/**
- Reescribir prompt de Sonia para reflejar solo skills de araya.yaml.
- O añadir las skills del prompt a araya.yaml (decisión de Manu).

**2C. Crear prompts faltantes**
- `daneel.md`, `rolando.md` son críticos (agregados 2026-07-19).
- `neo.md`, `trinity.md` pueden ser templates (dormant).

**2D. Validación automática**
- Test que compara `araya.yaml` ↔ `skills/` ↔ `prompts/agents/`.
- Debe correr en CI/CD (`/araya:ax3 --check` extendido).

### [3] Prioridad Alta — Corrección de Delegación

**3A. Redistribuir SUBCOMMAND_ROUTES**
- `generate-uat` → Clara (tiene `uat-generate`)
- `budget-status`, `optimize-task`, `efficiency-report` → Mateo (FinOps)
- `route` → Aurora (Capability Officer)
- `validate` → Rolando (Reality Authority)
- `usability-check` → Manu (PO)

**3B. Validación de capabilities antes de delegar**
- Antes de `/araya <agent> <task>`, verificar que el agente tiene skills para la tarea.
- Si no, sugerir agente alternativo o escalar a Aurora.

**3C. Implementar broker/orquestador (DI-001 a DI-006)**
- Separar emisión de orden (Sonia) de ejecución técnica.
- IDs de correlación, estados, evidencia en `.araya/runs/`.
- Protección contra ciclos y límite de profundidad.

### [4] Prioridad Media — Crear Skill Transversal

**4A. Crear `araya-command-and-delegation-expert`**
- Skill obligatoria para todos los agentes.
- Debe enseñar el flujo completo de descubrimiento y delegación.
- Incluir en `ax3` skills baseline.

**4B. Asignar a todos los agentes**
- Añadir a `skills:` de cada agente en `araya.yaml`.
- Validación: test que verifica que todo agente la tiene.

### [5] Prioridad Media — Robustez de Agentes "Bare"

**5A. Equipar a daneel y rolando**
- Asignar skills relevantes según su rol.
- Crear prompts completos.

**5B. Evaluar neo/trinity**
- Si son dormant, documentar como tales.
- Si no se usarán, considerar eliminar para reducir ruido.

---

## Appendix: File Reference

| Archivo | Líneas | Rol en este audit |
|---------|--------|-------------------|
| `araya.yaml` | ~566 | Fuente de verdad canónica |
| `extensions/araya/index.ts` | ~2094 | Registro de comandos y delegación |
| `prompts/agents/*.md` | 27 archivos | Personalidades y skills auto-declaradas |
| `skills/` | 122 directorios | Skills implementadas |
| `.araya/plan/requirements/req-001.md` | ~308 | Requerimiento que motiva este audit |

---

*Esteban, CKO — Audit completo. No se ha implementado nada. Las recomendaciones
quedan a disposición de Sonia para planificación y de Manu para aprobación.*
