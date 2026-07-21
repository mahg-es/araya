# REQ-001 Vision — ARAYA Command Discovery, Manual & Specialist Delegation

- **Version:** 1.0.0
- **Author:** Manu (Product Owner)
- **Created:** 2026-07-22
- **Workstream:** WS-02 — PO Spec Gate
- **Status:** Approved for implementation

---

## Project Name

**ARAYA Command & Delegation System (ACDS)** — Discovery, manual, and specialist
delegation infrastructure for the ARAYA multi-agent framework.

---

## Description

### Business Problem

ARAYA dispone de un ecosistema extenso de **38+ comandos slash**, **30 agentes**
especializados, **122 skills** y **28 rutas de subcomandos**. Sin embargo, los
agentes del propio framework no pueden descubrir qué capacidades existen, no
tienen un mecanismo canónico de ayuda (`/araya:man`), no saben cuándo delegar
en un especialista, y con frecuencia ejecutan directamente tareas que pertenecen
a otro rol.

El caso concreto que origina este requerimiento: **Sonia ejecutó directamente una
incorporación que debía haber coordinado y delegado entre agentes especialistas.**
La auditoría de Esteban (WS-01) confirmó que este no es un incidente aislado sino
un patrón estructural: Sonia concentra el **57% de las rutas de subcomandos**,
incluyendo tareas de FinOps (Mateo), routing (Aurora), generación de UAT (Clara),
y verificación (Rolando).

Además, la ayuda actual está **hardcodeada** (~100 líneas en `extensions/araya/index.ts`),
diverge de las fuentes reales (`araya.yaml`, `skills/`, `prompts/`), y la delegación
depende exclusivamente de la herramienta `subagent` del runtime pi, violando el
requisito de independencia de runtime (DI-002).

### Proposed Solution

Incorporar una capacidad transversal para que **todos los agentes ARAYA, sin
excepción**, puedan:

1. Descubrir qué comandos, funciones, skills y agentes existen.
2. Consultar ayuda precisa (`/araya:man`, `--help`) antes de ejecutar.
3. Identificar al especialista competente para cada tipo de trabajo.
4. Delegar correctamente en lugar de ejecutar trabajo ajeno.
5. Respetar límites de autoridad, responsabilidad y permisos.

El sistema se compone de tres pilares:

- **Pilar A — Discovery & Manual:** `/araya:man` auto-generado desde fuentes de
  verdad (`araya.yaml`, `skills/`, `prompts/`), con búsqueda, `--help` por comando,
  y errores inteligentes.
- **Pilar B — Specialist Delegation:** Corrección de rutas de subcomandos,
  validación de capabilities antes de delegar, y contrato de delegación obligatorio.
- **Pilar C — Delegation Infrastructure:** Broker/orquestador independiente del
  runtime (DI-001 a DI-006), con correlación, sesiones, estados, protección contra
  ciclos, y separación orden/ejecución.

Además, se crea la **skill transversal obligatoria** `araya-command-and-delegation-expert`
que enseña a cada agente el flujo completo de descubrimiento y delegación.

---

## Objectives

| # | Objective | Measurement |
|---|-----------|-------------|
| O1 | Todo agente puede descubrir cualquier capacidad ARAYA usando `/araya:man` | 100% de comandos, skills y agentes referenciables desde `/araya:man` |
| O2 | Ningún agente ejecuta trabajo que pertenece a un especialista disponible | 0 violaciones del Specialist Delegation Contract en pruebas de regresión |
| O3 | La ayuda está sincronizada con las fuentes de verdad del repositorio | 0 divergencias entre `araya.yaml` ↔ `skills/` ↔ `prompts/` ↔ ayuda generada |
| O4 | La delegación funciona independientemente del runtime | `/araya:delegate <agent> "<task>"` exitoso desde pi, Codex, Claude CLI, AGY |
| O5 | Cada delegación deja traza verificable | 100% de delegaciones con `correlation_id`, estado, evidencia en `.araya/runs/` |

---

## Success Metrics

| # | KPI | Target | Measurement Method |
|---|-----|--------|-------------------|
| SM1 | Cobertura de `/araya:man` | 100% de comandos, skills, agentes | Test automático compara catálogo vs araya.yaml + skills/ |
| SM2 | Tasa de delegación correcta | ≥95% de rutas asignadas al especialista correcto | Auditoría de SUBCOMMAND_ROUTES |
| SM3 | Divergencia prompt↔yaml | 0 discrepancias | `/araya:ax3 --check` extendido |
| SM4 | Delegaciones con traza completa | 100% | Verificación en `.araya/runs/` |
| SM5 | Tiempo hasta descubrimiento | <3 interacciones para que un agente nuevo descubra una capacidad | Test de usabilidad con agente sin conocimiento previo |

---

## Scope

### Included

- **Pilar A — Discovery & Manual:**
  - `/araya:man` — catálogo auto-generado de comandos, funciones, skills y agentes.
  - `/araya:man <cmd|agent|skill>` — detalle con propósito, sintaxis, args, ejemplos, restricciones.
  - `--help` en todos los comandos registrados vía `pi.registerCommand`.
  - Búsqueda: `--search <keyword>`, `--domain <domain>`, `--agent <agent>`.
  - Errores inteligentes: sugerir los 3 comandos más cercanos (Levenshtein) cuando un comando no existe.
  - Indicadores de estado: `enabled`, `disabled`, `deprecated`, `not-installed`.
  - Enlace fuente de verdad: cada entrada referencia su archivo en el repositorio.
  - Generación/validación automática desde `araya.yaml` + `skills/` + `prompts/`.

- **Pilar B — Specialist Delegation:**
  - Redistribución de SUBCOMMAND_ROUTES: 7 rutas reasignadas al especialista correcto.
  - Validación de capabilities antes de `/araya <agent> <task>`.
  - Skill transversal `araya-command-and-delegation-expert` asignada a los 30 agentes.
  - Reconciliación `araya.yaml` ↔ `skills/` ↔ `prompts/agents/`.
  - Creación de prompts faltantes: `daneel.md`, `rolando.md`.
  - Skills huérfanas de Aurora implementadas o declaradas como pendientes.

- **Pilar C — Delegation Infrastructure:**
  - Broker/orquestador con: correlation_id, sesiones, permisos, estados, resultados, evidencia.
  - Protección contra recursión: no self-delegation, detección de ciclos, profundidad máxima.
  - Separación orden/ejecución: Sonia ordena, broker despacha.
  - Evidencia en `.araya/runs/{run_id}/`.
  - Compatible con pi, Codex, Claude CLI, AGY.

### Explicitly Excluded

- Modificación de la lógica interna de los 122 skills existentes (fuera de scope).
- Cambios en la arquitectura de agentes más allá de la delegación (no se rediseña el roster).
- Implementación de un sistema de colas persistente (RabbitMQ, Kafka) — el broker es ligero.
- Dashboard visual de delegación (fuera de scope para REQ-001, posible follow-up).
- Migración de comandos existentes a nueva sintaxis (backward compatibility requerida).
- Auto-reparación de divergencias (detección sí, reparación automática no — requiere aprobación humana).

---

## Constraints

| # | Constraint | Source |
|---|-----------|--------|
| C1 | Backward compatibility: ningún comando existente debe romperse | Requisito del ecosistema |
| C2 | Independencia del runtime: no depender de herramientas propietarias (subagent) | DI-002 |
| C3 | La skill transversal debe asignarse a los 30 agentes sin excepción | REQ-001 |
| C4 | El catálogo debe generarse/validarse desde fuentes reales, no ser hardcoded | Criterio aceptación #6 |
| C5 | Las skills huérfanas de Aurora deben resolverse (implementar o declarar pendientes) | Audit WS-01 |
| C6 | Los prompts de daneel y rolando son prerequisites para su operación | Audit WS-01 |
| C7 | Respetar la frontera ARAYA Framework (público) vs ARAYA Core (privado) | Governance |
| C8 | Todo cambio debe incluir pruebas unitarias, integración y regresión | Criterio aceptación #22 |

---

## Stakeholders

| Role | Persona/Agent | Interest |
|------|---------------|----------|
| Executive Sponsor | The Data Professor (Manuel Alejandro Hernández Giuliani) | Valor del framework, calidad de entregas |
| Product Owner | Manu | Requirements, acceptance, scope, release gate |
| Program Director | Sonia | Orquestación correcta, delegación, coordinación |
| Chief Knowledge Officer | Esteban | Catálogo, documentación, fuentes de verdad |
| Capability Officer | Aurora | Elegibilidad de agentes, asignación de capacidades |
| Reality Authority | Rolando | Verificación de cumplimiento de delegación |
| All Agents (30) | Valentina, Alejandra, Clara, Mateo, Diana, etc. | Descubrir capacidades, recibir delegaciones correctas |
| QA Lead | Priya | Testabilidad de la delegación y el descubrimiento |
| Security | Diana | Que la delegación no abra vectores de ataque |

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| El broker añade latencia a las delegaciones | Medium | Medium | Broker ligero, sin cola persistente; timeout configurable |
| Agentes ignoran la skill transversal | Medium | High | Test de regresión obligatorio; validation gate en CI/CD |
| Divergencia recurrente entre fuentes | High | Medium | `/araya:ax3 --check` extendido en CI/CD; alerta temprana |
| Resistencia de Sonia a delegar | Low | High | Contrato vinculante en prompt; Rolando verifica cumplimiento |
| Complejidad del broker excede scope de REQ-001 | Medium | High | MVP con capacidades mínimas (DI-003); iteraciones posteriores |

---

## Related Documents

- `.araya/plan/requirements/req-001.md` — Requerimiento original
- `.araya/plan/spec/req-001-audit.md` — Auditoría WS-01 (Esteban)
- `.araya/plan/spec/req-001-workstreams.md` — Plan de workstreams
- `.araya/plan/spec/req-001-requirements.md` — Requisitos funcionales y no funcionales
- `.araya/plan/spec/req-001-acceptance-criteria.md` — Criterios de aceptación

---

*Manu, Product Owner — Vision approved. Proceed to requirements.*
