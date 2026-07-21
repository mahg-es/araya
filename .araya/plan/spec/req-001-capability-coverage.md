# REQ-001 Capability Coverage Report

- **Workstream:** WS-03 (Capability Coverage & Agent Eligibility)
- **Author:** Aurora (CHRO — Capability Authority) 🌟
- **Date:** 2026-07-22
- **Status:** Complete
- **Inputs:** `req-001.md`, `req-001-audit.md`, `req-001-workstreams.md`, `req-001-daneel-audit.md`, `araya.yaml`, `capability-registry.yaml`
- **Output:** Capability coverage validation, gap detection, hiring/activation recommendations

---

## Executive Summary

REQ-001 defines 25 Acceptance Criteria (ACs) and 6 Delegation Infrastructure requirements
(DI-001 to DI-006) for a total of **31 verifiable criteria**, distributed across
**16 workstreams** with **71 Atomic Work Units (AWUs)** deploying **14 agents**.

This report validates that every agent assigned to every workstream has the documented
skills to execute their assigned tasks, identifies capability gaps, and issues
recommendations for remediation.

**Bottom line:** 12 of 14 agents are capably assigned. **2 agents have capability gaps**
(Valentina in WS-10, Aisha/Isla for ADR writing). **3 SPOF risks** detected.
**4 orphan skills** exist in Aurora's portfolio. **5 unassigned skills** are dead weight.
Overall coverage is **85%** (12/14 agents fully qualified for their assignments).

---

## 1. Capability Coverage Matrix: 25 ACs + 6 DIs

For each Acceptance Criterion, the required capabilities, qualified agents, and
coverage status.

### AC-1: Catálogo canónico de comandos, funciones, skills y agentes

| Attribute | Value |
|-----------|-------|
| Phase | Design → Implementation |
| Workstreams | WS-04 (Aisha: schema), WS-07 (Valentina: implementation) |
| Required Skills | `microservice`, `api-gateway`, `cache-strategy` (Aisha) / `api-design`, `db-schema`, `endpoint` (Valentina) |
| Agent: Aisha | ✅ All 5 skills present |
| Agent: Valentina | ✅ All 5 skills present |
| **Verdict** | ✅ **PASS** |

### AC-2: `/araya:man` lista las capacidades disponibles

| Attribute | Value |
|-----------|-------|
| Phase | Implementation |
| Workstream | WS-09 (Valentina: man system AWU-028) |
| Required Skills | `api-design`, `endpoint`, `error-handling` |
| Agent: Valentina | ✅ All required skills present |
| **Verdict** | ✅ **PASS** |

### AC-3: `/araya:man <función>` muestra propósito, sintaxis, parámetros, ejemplos, restricciones, especialista responsable

| Attribute | Value |
|-----------|-------|
| Phase | Design → Implementation |
| Workstreams | WS-04 (Aisha: schema AWU-011), WS-09 (Valentina: man system AWU-029) |
| Required Skills | Schema design (Aisha) / Backend implementation (Valentina) |
| Agent: Aisha | ✅ `microservice`, `api-gateway`, `cache-strategy` |
| Agent: Valentina | ✅ `api-design`, `db-schema`, `endpoint`, `error-handling` |
| **Verdict** | ✅ **PASS** |

### AC-4: `/araya:man <agente>` muestra responsabilidad, capacidades, skills, permisos y tareas que no debe realizar

| Attribute | Value |
|-----------|-------|
| Phase | Design → Implementation |
| Workstreams | WS-04 (Aisha), WS-09 (Valentina AWU-030) |
| Required Skills | Same as AC-3 |
| Agent: Aisha | ✅ |
| Agent: Valentina | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-5: Cada comando soportado dispone de `--help` o justificación documentada

| Attribute | Value |
|-----------|-------|
| Phase | Implementation |
| Workstream | WS-09 (Valentina AWU-033) |
| Required Skills | `api-design`, `endpoint`, `error-handling` |
| Agent: Valentina | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-6: Ayuda se obtiene desde el registro real o se valida automáticamente contra él

| Attribute | Value |
|-----------|-------|
| Phase | Implementation |
| Workstreams | WS-07 (Valentina: validator AWU-022), WS-09 (Valentina: man system) |
| Required Skills | `api-design`, `db-schema`, `endpoint` |
| Agent: Valentina | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-7: Función inexistente devuelve error claro y sugiere funciones reales

| Attribute | Value |
|-----------|-------|
| Phase | Implementation |
| Workstream | WS-09 (Valentina AWU-034) |
| Required Skills | `error-handling`, `endpoint` |
| Agent: Valentina | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-8: Búsqueda por keywords, dominio, agente, skill y propósito

| Attribute | Value |
|-----------|-------|
| Phase | Design → Implementation |
| Workstreams | WS-04 (Aisha AWU-012), WS-09 (Valentina AWU-032) |
| Required Skills | `cache-strategy` (search index), `db-schema`, `endpoint` |
| Agent: Aisha | ✅ `cache-strategy` available |
| Agent: Valentina | ✅ `db-schema`, `endpoint` available |
| **Verdict** | ✅ **PASS** |

### AC-9: Skill transversal obligatoria creada (`araya-command-and-delegation-expert`)

| Attribute | Value |
|-----------|-------|
| Phase | Design/Authoring |
| Workstream | WS-05 (Priscila AWU-015, AWU-016, AWU-017) |
| Required Skills | `technical-book`, instructional writing, skill format |
| Agent: Priscila | ✅ `technical-book`, `adr-write`, `api-document`, `slide-deck-generate`, `architecture-diagram` |
| **Verdict** | ✅ **PASS** |

### AC-10: Todos los agentes heredan o tienen asignada explícitamente dicha skill

| Attribute | Value |
|-----------|-------|
| Phase | Integration |
| Workstream | WS-11 (Priscila + Esteban AWU-042) |
| Required Skills | Prompt authoring (Priscila), knowledge management (Esteban) |
| Agent: Priscila | ✅ `technical-book` for content |
| Agent: Esteban | ✅ `organizational-knowledge`, `project-planning` |
| **Note** | ⚠️ Plan erroneously says 22 agents; corrected to 27 (Daneel audit CR-002) |
| **Verdict** | ✅ **PASS** (with count correction) |

### AC-11: Validación falla cuando un agente nuevo no recibe la skill

| Attribute | Value |
|-----------|-------|
| Phase | Integration |
| Workstream | WS-11 (Esteban AWU-043) |
| Required Skills | `organizational-knowledge`, validation logic |
| Agent: Esteban | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-12: Todo agente consulta capacidades existentes antes de improvisar una solución

| Attribute | Value |
|-----------|-------|
| Phase | Design (embedded in skill) → Integration (prompt update) |
| Workstreams | WS-05 (Priscila: skill content), WS-11 (Priscila: prompt integration) |
| Required Skills | Instructional writing |
| Agent: Priscila | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-13: Sonia delega arquitectura, desarrollo, pruebas, seguridad, infraestructura y documentación en especialistas

| Attribute | Value |
|-----------|-------|
| Phase | Infrastructure → Integration |
| Workstreams | WS-08 (Isla: delegation architecture), WS-10 (Valentina: broker impl), WS-11 (Priscila: Sonia prompt update AWU-041) |
| Required Skills | Delegation architecture (Isla), broker implementation (Valentina), prompt writing (Priscila) |
| Agent: Isla | ✅ `docker`, `kubernetes`, `cicd-pipeline`, `cloud-deploy`, `monitoring` |
| Agent: Valentina | ⚠️ See GAP-03 — broker implementation requires skills not in Valentina's portfolio |
| Agent: Priscila | ✅ |
| **Verdict** | ⚠️ **CONDITIONAL** — depends on GAP-03 resolution |

### AC-14: Test falla cuando Sonia u otro orquestador ejecuta directamente trabajo de especialista

| Attribute | Value |
|-----------|-------|
| Phase | Testing |
| Workstream | WS-14 (Teresa AWU-058) |
| Required Skills | `test-case`, `integration-test`, test design |
| Agent: Teresa | ✅ `unit-test`, `integration-test`, `test-case`, `regression`, `coverage`, `tdd-generate`, `tdd-execute` |
| **Verdict** | ✅ **PASS** |

### AC-15: Excepciones de delegación requieren evidencia de inexistencia de especialista

| Attribute | Value |
|-----------|-------|
| Phase | Architecture → Implementation |
| Workstreams | WS-08 (Isla: design), WS-10 (Valentina: implementation) |
| Required Skills | Exception handling design, broker state machine |
| Agent: Isla | ✅ Architecture design |
| Agent: Valentina | ⚠️ Same as GAP-03 |
| **Verdict** | ⚠️ **CONDITIONAL** |

### AC-16: Aurora participa en determinación de elegibilidad cuando la asignación no es evidente

| Attribute | Value |
|-----------|-------|
| Phase | WS-03 (this report) → WS-11 (Aurora prompt update AWU-044) |
| Workstreams | WS-03 (Aurora), WS-11 (Priscila) |
| Required Skills | `capability-registry`, `gap-analysis`, `workforce-planning`, `agent-topology` |
| Agent: Aurora | ✅ `capability-registry`, `gap-analysis`, `workforce-planning`, `agent-topology` |
| Agent: Priscila | ✅ (prompt update) |
| **Verdict** | ✅ **PASS** |

### AC-17: Agentes demuestran que pueden descubrir una capacidad no incluida directamente en su prompt

| Attribute | Value |
|-----------|-------|
| Phase | Testing |
| Workstream | WS-14 (Teresa AWU-059) |
| Required Skills | `test-case`, `integration-test` |
| Agent: Teresa | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-18: Ningún agente inventa comandos, argumentos, skills o especialistas durante las pruebas

| Attribute | Value |
|-----------|-------|
| Phase | Testing |
| Workstream | WS-14 (Teresa AWU-060) |
| Required Skills | `test-case`, behavioral testing |
| Agent: Teresa | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-19: Test confirma que el agente busca función existente antes de proponer implementación duplicada

| Attribute | Value |
|-----------|-------|
| Phase | Testing |
| Workstream | WS-14 (Teresa AWU-061) |
| Required Skills | `test-case`, `integration-test` |
| Agent: Teresa | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-20: Documentación cubre pi.dev, Codex, Claude CLI, AGY y adaptadores oficialmente soportados

| Attribute | Value |
|-----------|-------|
| Phase | Documentation |
| Workstream | WS-13 (Priscila AWU-049→052) |
| Required Skills | `api-document`, `technical-book`, `architecture-diagram` |
| Agent: Priscila | ✅ All required skills present |
| **Verdict** | ✅ **PASS** |

### AC-21: Solución respeta la frontera entre ARAYA Framework público y ARAYA Core privado

| Attribute | Value |
|-----------|-------|
| Phase | Design → Security Review |
| Workstreams | WS-04 (Aisha: schema design), WS-07 (Valentina: implementation), WS-12 (Diana AWU-047) |
| Required Skills | `microservice` (boundary design), `threat-model`, `secure-arch` (Diana) |
| Agent: Aisha | ✅ |
| Agent: Valentina | ✅ |
| Agent: Diana | ✅ `threat-model`, `secure-arch`, `secure-code`, `pentest`, `compliance`, `secrets` |
| **Verdict** | ✅ **PASS** |

### AC-22: Cambios incluyen tests unitarios, integración, regresión y validación documental

| Attribute | Value |
|-----------|-------|
| Phase | Testing |
| Workstream | WS-14 (Teresa + Priya AWU-053→064) |
| Required Skills | Teresa: `unit-test`, `integration-test`, `test-case`, `regression`, `coverage`, `tdd-generate`, `tdd-execute` / Priya: `performance-test`, `e2e-strategy`, `cicd-quality` |
| Agent: Teresa | ✅ 7 testing skills |
| Agent: Priya | ✅ 3 QA lead skills |
| **Verdict** | ✅ **PASS** |

### AC-23: Daneel verifica que catálogo, asignaciones y delegación coinciden con repository truth

| Attribute | Value |
|-----------|-------|
| Phase | Delivery Verification |
| Workstream | WS-15 (Daneel AWU-065, AWU-066, AWU-067) |
| Required Skills | `reality-verification` |
| Agent: Daneel | ✅ `reality-verification` present |
| **Verdict** | ✅ **PASS** |

### AC-24: Entrega identifica el estado real en workspace, feature branch, dev-mahg, main, release y runtime

| Attribute | Value |
|-----------|-------|
| Phase | Delivery Verification |
| Workstream | WS-15 (Daneel AWU-066) |
| Required Skills | `reality-verification`, evidence inspection |
| Agent: Daneel | ✅ |
| **Verdict** | ✅ **PASS** |

### AC-25: Capacidad no se considera entregada hasta demostrar que todos los agentes descubren funciones y delegan correctamente

| Attribute | Value |
|-----------|-------|
| Phase | Final Gate |
| Workstream | WS-15 (Manu AWU-068, AWU-069) |
| Required Skills | `sdd-vision`, `sdd-requirements`, `test-case`, `bdd-feature`, `uat-review`, `drr-create` |
| Agent: Manu | ✅ All required skills present (11 skills total) |
| **Verdict** | ✅ **PASS** |

---

### DI Coverage: Delegation Infrastructure Requirements

| DI | Description | Workstream | Agent | Skills | Verdict |
|----|-------------|------------|-------|--------|---------|
| DI-001 | Broker/Orquestador de delegación | WS-08 (design) + WS-10 (impl) | Isla + Valentina | Isla: ✅ / Valentina: ⚠️ GAP-03 | ⚠️ CONDITIONAL |
| DI-002 | Independencia del runtime | WS-08 + WS-10 | Isla + Valentina | Isla: ✅ / Valentina: ⚠️ GAP-03 | ⚠️ CONDITIONAL |
| DI-003 | Capacidades mínimas (correlación, sesiones, permisos, estados, resultados, evidencia) | WS-08 + WS-10 | Isla + Valentina | Isla: ✅ / Valentina: ⚠️ GAP-03 | ⚠️ CONDITIONAL |
| DI-004 | Protección contra recursión no controlada | WS-08 + WS-10 | Isla + Valentina | Isla: ✅ / Valentina: ⚠️ GAP-03 | ⚠️ CONDITIONAL |
| DI-005 | Separación orden/ejecución | WS-08 + WS-10 | Isla + Valentina | Isla: ✅ / Valentina: ⚠️ GAP-03 | ⚠️ CONDITIONAL |
| DI-006 | Verificación de infraestructura de delegación | WS-08 + WS-10 + WS-14 | Isla + Valentina + Teresa | Isla: ✅ / Valentina: ⚠️ / Teresa: ✅ | ⚠️ CONDITIONAL |

**DI Coverage Summary:** All 6 DIs are covered by workstreams. 6/6 have architecture design by a qualified agent (Isla ✅). 6/6 are ⚠️ CONDITIONAL for implementation due to GAP-03 (Valentina's skill gap for broker implementation).

---

## 2. Agent-by-Agent Capability Validation

For each agent assigned to REQ-001 workstreams, verify they have the documented
skills required for their tasks.

### 2.1 Esteban (CKO) — WS-01, WS-11

| Attribute | Value |
|-----------|-------|
| Workstreams | WS-01 (Audit & Knowledge Report: AWU-001→004), WS-11 (Agent integration: AWU-043) |
| Assigned Skills | `daily-note`, `knowledge-graph`, `project-planning`, `pkm-workflow`, `organizational-knowledge`, `trajectory-management` |
| Required for WS-01 | Knowledge audit, inventory, repository analysis → ✅ covered by `organizational-knowledge`, `knowledge-graph`, `project-planning` |
| Required for WS-11 | Validation logic for agent skill assignment → ✅ covered by `organizational-knowledge`, `project-planning` |
| Missing Skills | None for assigned tasks |
| **Verdict** | ✅ **PASS** |
| **Note** | Audit report output correctly renamed from "GAR" to "Knowledge Audit Report" per Daneel CR-004. `gap-analysis` is Aurora's skill and Esteban does not need it for his task. |

### 2.2 Manu (PO) — WS-02, WS-15

| Attribute | Value |
|-----------|-------|
| Workstreams | WS-02 (PO Spec Gate: AWU-005→007), WS-15 (Delivery Verification: AWU-068, AWU-069) |
| Assigned Skills | `sdd-vision`, `sdd-requirements`, `test-case`, `bdd-feature`, `pm-status`, `project-planning`, `po-gap-questionnaire`, `definition-of-done`, `drr-create`, `uat-review`, `token-efficiency` |
| Required for WS-02 | Requirements validation, DoD generation, spec approval → ✅ all covered |
| Required for WS-15 | AC validation, DRR/IAR/CR if REVISE, final disposition → ✅ all covered |
| Missing Skills | None |
| **Verdict** | ✅ **PASS** |

### 2.3 Aurora (CHRO) — WS-03

| Attribute | Value |
|-----------|-------|
| Workstream | WS-03 (Capability Coverage: AWU-008→010 — this report) |
| Assigned Skills | `capability-registry`, `gap-analysis`, `workforce-planning`, `agent-topology`, `skills-lifecycle`*, `spof-detection`*, `hiring-recommendations`*, `organizational-health`* |
| Required for WS-03 | Capability analysis, gap detection, eligibility validation → ✅ covered by `capability-registry`, `gap-analysis`, `workforce-planning`, `agent-topology` |
| Missing Skills | None for this task. ⚠️ 4 skills marked `*` are declared in `araya.yaml` but have no `SKILL.md` implementation (see GAP-11) |
| **Verdict** | ✅ **PASS** (for WS-03 tasks) |

### 2.4 Aisha (Backend Architect) — WS-04

| Attribute | Value |
|-----------|-------|
| Workstream | WS-04 (Catalog Schema Design: AWU-011→014) |
| Assigned Skills | `microservice`, `api-gateway`, `cache-strategy`, `message-queue`, `db-optimization` |
| Required for WS-04 | Schema design for catalog entities, search model, validation strategy → ✅ all design skills present |
| Required for AWU-014 | ADR writing → ⚠️ `adr-write` is Priscila's skill, not Aisha's (see GAP-01) |
| **Verdict** | ⚠️ **CONDITIONAL** — ADR writing requires collaboration with Priscila |

### 2.5 Priscila (Technical Writer) — WS-05, WS-11, WS-13

| Attribute | Value |
|-----------|-------|
| Workstreams | WS-05 (Skill Design: AWU-015→017), WS-11 (Agent Integration: AWU-041, AWU-042, AWU-044), WS-13 (Documentation: AWU-049→052) |
| Assigned Skills | `adr-write`, `api-document`, `architecture-diagram`, `slide-deck-generate`, `technical-book` |
| Required for WS-05 | Skill authoring, instructional writing → ✅ `technical-book` covers this |
| Required for WS-11 | Prompt writing, agent documentation → ✅ all skills applicable |
| Required for WS-13 | User guide, delegation guide, runtime docs → ✅ all skills applicable |
| Missing Skills | None |
| **Verdict** | ✅ **PASS** |
| **Note** | Priscila assigned to 3 workstreams (11 AWUs). Only content creation — no implementation. Capacity is adequate. |

### 2.6 Isla (Infra Architect) — WS-08

| Attribute | Value |
|-----------|-------|
| Workstream | WS-08 (Delegation Architecture: AWU-023→027) |
| Assigned Skills | `docker`, `kubernetes`, `cicd-pipeline`, `cloud-deploy`, `monitoring` |
| Required for WS-08 | Broker architecture, state machine design, anti-recursion design, protocol design → ✅ `docker`/`kubernetes`/`cicd-pipeline` for distributed system design; `monitoring` for observability |
| Required for AWU-027 | ADR writing → ⚠️ `adr-write` is Priscila's skill, not Isla's (see GAP-02) |
| **Verdict** | ⚠️ **CONDITIONAL** — ADR writing requires collaboration with Priscila. Architecture design skills are adequate. |

### 2.7 Elena (Scrum Master + PM Auditor) — WS-06, WS-16

| Attribute | Value |
|-----------|-------|
| Workstreams | WS-06 (Process Quality Audit 1: AWU-018, AWU-019), WS-16 (Final Process Audit: AWU-070, AWU-071) |
| Assigned Skills | `daily-standup`, `sprint-planning`, `retrospective`, `impediment`, `velocity`, `definition-of-done`, `reality-verification` |
| Required for WS-06/WS-16 | Process auditing, plan validation, constitutional compliance → ✅ all PM skills present; `reality-verification` for evidence-based auditing |
| Missing Skills | None |
| **Verdict** | ✅ **PASS** |

### 2.8 Valentina (Backend Developer) — WS-07, WS-09, WS-10

| Attribute | Value |
|-----------|-------|
| Workstreams | WS-07 (Registry Impl: AWU-020→022), WS-09 (Man System: AWU-028→034), WS-10 (Delegation Broker: AWU-035→040) |
| Assigned Skills | `api-design`, `db-schema`, `endpoint`, `auth-middleware`, `error-handling` |
| Total AWUs | 16 of 71 (22.5%) — **bottleneck risk** |
| Required for WS-07 | Data structures, populator, validator → ✅ `db-schema`, `api-design` |
| Required for WS-09 | CLI help system, search, error messages → ✅ `endpoint`, `error-handling`, `api-design` |
| Required for WS-10 | State machine, correlation IDs, session management, anti-recursion, persistence → ❌ **CAPABILITY GAP** (see GAP-03) |
| **Verdict** | ❌ **GAP** — Valentina lacks documented skills for WS-10 (broker implementation) |

### 2.9 Diana (Cybersecurity Specialist) — WS-12

| Attribute | Value |
|-----------|-------|
| Workstream | WS-12 (Security Review: AWU-045→048) |
| Assigned Skills | `threat-model`, `secure-arch`, `secure-code`, `pentest`, `compliance`, `secrets` |
| Required for WS-12 | Threat modeling, secure code review, boundary validation → ✅ all 6 skills |
| Missing Skills | None |
| **Verdict** | ✅ **PASS** |

### 2.10 Teresa (QA Engineer) — WS-14

| Attribute | Value |
|-----------|-------|
| Workstream | WS-14 (Testing: AWU-053→063) |
| Assigned Skills | `unit-test`, `integration-test`, `test-case`, `regression`, `coverage`, `tdd-generate`, `tdd-execute`, `uat-generate`, `uat-review`, `token-efficiency` |
| Required for WS-14 | Test case generation, unit/integration/regression tests, AC-specific tests → ✅ all testing skills present |
| Missing Skills | None |
| **Verdict** | ✅ **PASS** |

### 2.11 Priya (QA Lead) — WS-14

| Attribute | Value |
|-----------|-------|
| Workstream | WS-14 (QA Lead Review: AWU-064) |
| Assigned Skills | `performance-test`, `e2e-strategy`, `cicd-quality`, `uat-review`, `token-efficiency` |
| Required for WS-14 | Test strategy review, coverage validation, quality gate → ✅ all QA lead skills present |
| Missing Skills | None |
| **Verdict** | ✅ **PASS** |

### 2.12 Daneel (Reality Authority) — WS-15

| Attribute | Value |
|-----------|-------|
| Workstream | WS-15 (Delivery Verification: AWU-065→067) |
| Assigned Skills | `reality-verification` |
| Required for WS-15 | Catalog vs. repository truth verification, 5-tier state identification, disposition → ✅ `reality-verification` |
| Missing Skills | None for WS-15 tasks |
| **Verdict** | ✅ **PASS** |
| **Note** | Daneel has no prompt file (system-level agent). The `reality-verification` skill is documented and functional. |

### 2.13 Agents NOT assigned to REQ-001

These 17 agents have no role in REQ-001 workstreams. This is correct — their domains
(profitability, education, content, brand, BI, FinOps, data, AI, static sites,
frontend development) are not needed for a command discovery and delegation system.

| Agent | Role | Why not needed |
|-------|------|----------------|
| Alejandra | Frontend Developer | No frontend in REQ-001 scope |
| Lin | Frontend Architect | No frontend architecture needed |
| Aquila | Static Site Engineer | No site generation needed |
| Bernabe | Data Engineer | No data pipeline work |
| Clara | QA Engineer | Testing covered by Teresa (Clara could be backup) |
| Dorcas | Brand Governance | No brand work needed |
| Eunice | Educational Designer | No training/education deliverables |
| Junia | Data Platform Architect | No data platform work |
| Lidia | Profitability Expert | No profitability analysis needed |
| Lucas | Content Strategist | No content strategy work |
| Maria | AI/ML Engineer | No ML/LLM work needed |
| Mateo | FinOps Specialist | Note: budget routing currently misrouted to Sonia |
| Pablo | BI & Analytics Lead | No BI/dashboards needed |
| Sofia | AI Assistant | General assistant, no REQ-001 role |
| Teresa | (CCO — board role) | Advisory only; testing done by QA Teresa |
| Neo | Dynamic Capability Agent | Dormant |
| Trinity | Dynamic Capability Agent | Dormant |

**Note:** Rolando is listed in arasa.yaml with role "Reality Authority (Verifier) — renamed from Daneel 2026-07-19". But the workstream plan uses "Daneel" for WS-15. The `araya.yaml` shows both `rolando` and `daneel` as separate agents. For this report, Daneel is the active Reality Authority.

---

## 3. Detected Capability Gaps

### 🔴 GAP-03 — Valentina: Missing skills for Delegation Broker Implementation (WS-10)

| Attribute | Value |
|-----------|-------|
| **Severity** | **CRITICAL** |
| **Agent** | Valentina (Backend Developer) |
| **Workstream** | WS-10 (Delegation Broker Implementation: AWU-035→040) |
| **Required Skills** | State machine design, correlation/session management, anti-recursion detection, evidence persistence, distributed message passing |
| **Documented Skills** | `api-design`, `db-schema`, `endpoint`, `auth-middleware`, `error-handling` |
| **Impact** | WS-10 is the most complex implementation workstream (6 AWUs). It directly implements DI-001 through DI-006. If Valentina cannot implement the broker correctly, **all 6 DI requirements fail**, which blocks AC-13, AC-14, AC-15, and ultimately AC-25. |
| **Affected DIs** | DI-001, DI-002, DI-003, DI-004, DI-005, DI-006 |
| **Affected ACs** | AC-13, AC-14, AC-15 |
| **Mitigation** | See Recommendation [2] |

### 🟡 GAP-01 — Aisha: Missing `adr-write` for Catalog ADR (WS-04 AWU-014)

| Attribute | Value |
|-----------|-------|
| **Severity** | **LOW** |
| **Agent** | Aisha (Backend Architect) |
| **Required Skill** | `adr-write` (owned by Priscila) |
| **Impact** | AWU-014 produces an Architecture Decision Record. Aisha has deep architecture knowledge but not the ADR format skill. |
| **Mitigation** | Priscila reviews Aisha's ADR for format compliance. This is a collaboration, not a gap. Aisha writes content; Priscila ensures format. |

### 🟡 GAP-02 — Isla: Missing `adr-write` for Delegation ADR (WS-08 AWU-027)

| Attribute | Value |
|-----------|-------|
| **Severity** | **LOW** |
| **Agent** | Isla (Infra Architect) |
| **Required Skill** | `adr-write` (owned by Priscila) |
| **Impact** | AWU-027 produces an ADR for delegation infrastructure. Same pattern as GAP-01. |
| **Mitigation** | Priscila reviews Isla's ADR for format compliance. |

### 🔴 GAP-04 — No Backend Developer Backup (SPOF)

| Attribute | Value |
|-----------|-------|
| **Severity** | **CRITICAL** |
| **Type** | Single Point of Failure (SPOF) |
| **Impact** | Valentina is the **only backend developer** in ARAYA with `can_write_code: true` in the backend domain. She is assigned to 3 workstreams (WS-07, WS-09, WS-10) totaling 16 AWUs. If Valentina is unavailable, blocked, or exceeds capacity, **all backend implementation work stops**. |
| **Current Backup** | R-01 suggests Clara as backup — **invalid** (Clara is QA, not backend). |
| **Affected Workstreams** | WS-07, WS-09, WS-10 |
| **Mitigation** | See Recommendation [1] |

### 🟡 GAP-05 — Clara as Invalid Backup (Mitigation Failure)

| Attribute | Value |
|-----------|-------|
| **Severity** | **HIGH** |
| **Source** | Risk R-01 in `req-001-workstreams.md` |
| **Text** | "Si es crítico, activar a Clara como backup" |
| **Why Invalid** | Clara's skills: `unit-test`, `integration-test`, `test-case`, `regression`, `coverage`, `tdd-generate`, `tdd-execute`, `uat-generate`, `token-efficiency`. **Zero backend development skills.** Clara cannot implement registry, man system, or delegation broker. |
| **Impact** | The only documented mitigation for the Valentina bottleneck is ineffective. |
| **Mitigation** | See Recommendation [1] and [3] |

### 🟡 GAP-06 — `ai-routing` Skill Unassigned

| Attribute | Value |
|-----------|-------|
| **Severity** | **MEDIUM** |
| **Skill** | `ai-routing` (exists in `skills/ai-routing/SKILL.md`) |
| **Current State** | Not assigned to any agent in `araya.yaml` |
| **Note** | Esteban's audit found `/araya route` is misrouted to Sonia. `ai-routing` should be assigned to **Aurora** (Capability Officer) who already has `agent-topology` and `workforce-planning`. |
| **Impact on REQ-001** | Low — `ai-routing` is not directly required for REQ-001. However, it impacts AC-16 (Aurora's role in eligibility) and the correct routing of `/araya route`. |
| **Mitigation** | See Recommendation [4] |

### 🟡 GAP-07 — `pm-decompose` Skill Unassigned

| Attribute | Value |
|-----------|-------|
| **Severity** | **MEDIUM** |
| **Skill** | `pm-decompose` (exists in `skills/pm-decompose/SKILL.md`) |
| **Current State** | Not assigned to any agent. Sonia's prompt references it but it's not in her `araya.yaml` skills list. |
| **Impact on REQ-001** | Medium — Sonia needs `pm-decompose` for decomposing work into workstreams and AWUs. REQ-001's Specialist Delegation Contract explicitly requires Sonia to "dividirlo en Workstreams y Atomic Work Units." |
| **Mitigation** | See Recommendation [5] |

### 🟡 GAP-08 — `ax-postoffice` and `autonomous-execution` Unassigned

| Attribute | Value |
|-----------|-------|
| **Severity** | **LOW** |
| **Skills** | `ax-postoffice`, `autonomous-execution` (exist in `skills/`) |
| **Current State** | Neither assigned to any agent |
| **Impact on REQ-001** | Low — not directly required. But `ax-postoffice` is a cross-cutting AX feature and should be assigned. |
| **Mitigation** | Assign `ax-postoffice` to all agents (transversal AX skill). Assign `autonomous-execution` to Sonia. |

### 🟡 GAP-09 — Daneel: No Prompt File

| Attribute | Value |
|-----------|-------|
| **Severity** | **MEDIUM** |
| **Agent** | Daneel (Reality Authority) |
| **Current State** | No `prompts/agents/daneel.md` exists. Agent exists in `araya.yaml` as system-level with `reality-verification` skill. |
| **Impact on REQ-001** | Medium — Daneel executes WS-15 (AWU-065→067). Without a prompt, his behavior is defined only by the skill and runtime. |
| **Mitigation** | Create `prompts/agents/daneel.md`. Not blocking — skill-based execution is sufficient. |

### 🟡 GAP-10 — Neo and Trinity: Dormant Agents

| Attribute | Value |
|-----------|-------|
| **Severity** | **LOW** |
| **Agents** | Neo, Trinity (Dynamic Capability Agents) |
| **Current State** | Both `status: dormant`, no prompt files, no skills beyond `ax3` |
| **Impact on REQ-001** | None — not assigned to any REQ-001 workstream |
| **Note** | These are template agents for dynamic activation. No action needed unless they need to be activated. |

### 🟡 GAP-11 — Aurora: 4 Skills Without Implementation

| Attribute | Value |
|-----------|-------|
| **Severity** | **MEDIUM** |
| **Agent** | Aurora (CHRO) |
| **Orphan Skills** | `hiring-recommendations`, `organizational-health`, `skills-lifecycle`, `spof-detection` |
| **Current State** | Declared in `araya.yaml` for Aurora but no `SKILL.md` file exists |
| **Impact on REQ-001** | Medium — `hiring-recommendations` and `spof-detection` are relevant for this report's recommendations. Without them, Aurora operates on her core skills (`capability-registry`, `gap-analysis`, `workforce-planning`, `agent-topology`) which is sufficient but limiting. |
| **Mitigation** | See Recommendation [6] |

---

## 4. Summary: Coverage Verdict by Workstream

| WS | Description | Agent | Skills Coverage | Verdict |
|----|-------------|-------|-----------------|---------|
| WS-01 | Audit & Gap Analysis | Esteban | 6/6 skills matched | ✅ PASS |
| WS-02 | PO Spec Gate | Manu | 11/11 skills matched | ✅ PASS |
| WS-03 | Capability Coverage | Aurora | 4/4 required skills matched | ✅ PASS |
| WS-04 | Catalog Schema | Aisha | 5/5 design skills matched; ⚠️ adr-write missing | ⚠️ COND (GAP-01) |
| WS-05 | Skill Design | Priscila | 5/5 skills matched | ✅ PASS |
| WS-06 | PM Process Audit 1 | Elena | 7/7 skills matched | ✅ PASS |
| WS-07 | Registry Implementation | Valentina | 5/5 skills matched | ✅ PASS |
| WS-08 | Delegation Architecture | Isla | 5/5 design skills matched; ⚠️ adr-write missing | ⚠️ COND (GAP-02) |
| WS-09 | Man System | Valentina | 5/5 skills matched | ✅ PASS |
| WS-10 | Delegation Broker Impl | Valentina | ❌ 0/3 required skills documented | ❌ GAP (GAP-03) |
| WS-11 | Agent Prompt Integration | Priscila + Esteban | 10/10 combined skills | ✅ PASS |
| WS-12 | Security Review | Diana | 6/6 skills matched | ✅ PASS |
| WS-13 | Documentation | Priscila | 5/5 skills matched | ✅ PASS |
| WS-14 | Testing | Teresa + Priya | 10/10 combined skills | ✅ PASS |
| WS-15 | Delivery Verification | Daneel + Manu | 12/12 combined skills | ✅ PASS |
| WS-16 | Final Process Audit | Elena | 7/7 skills matched | ✅ PASS |

**Overall coverage:** 12 agents fully qualified / 14 agents assigned = **85.7%**
**Blocking gaps:** 2 (GAP-03, GAP-04)
**Conditional passes:** 2 (GAP-01, GAP-02 — ADR format collaborations)

---

## 5. SPOF Analysis

### 🔴 SPOF-01: Valentina — Sole Backend Developer

| Attribute | Value |
|-----------|-------|
| **Agent** | Valentina |
| **Domain** | Backend Implementation |
| **Risk** | All backend code (registry, man system, delegation broker) depends on one agent |
| **Work Affected** | WS-07 (3 AWUs), WS-09 (7 AWUs), WS-10 (6 AWUs) = **16 AWUs (22.5% of project)** |
| **Current Backup** | None. Clara is QA, not backend. |
| **Impact if Unavailable** | Project blocks at Batch 3. No backend code can be produced. |

### 🟡 SPOF-02: Priscila — Sole Technical Writer

| Attribute | Value |
|-----------|-------|
| **Agent** | Priscila |
| **Domain** | Documentation, Skill Authoring, Prompt Writing |
| **Risk** | All content (skill, docs, prompts, guides) depends on one agent |
| **Work Affected** | WS-05 (3 AWUs), WS-11 (4 AWUs), WS-13 (4 AWUs) = **11 AWUs (15.5%)** |
| **Backup** | Esteban can cover knowledge management content. No other technical writer exists. |
| **Impact** | Medium — content can be delayed; doesn't break code. But AC-9, AC-10, AC-11, AC-20 depend on Priscila's output. |

### 🟡 SPOF-03: Diana — Sole Security Specialist

| Attribute | Value |
|-----------|-------|
| **Agent** | Diana |
| **Domain** | Cybersecurity |
| **Risk** | All security review depends on one agent |
| **Work Affected** | WS-12 (4 AWUs) |
| **Backup** | None. No other security agent exists. |
| **Impact** | Medium — security gate cannot pass without Diana. But security review is read-only; Diana could be replaced with a security-competent reasoning agent in a pinch. |

---

## 6. Recommendations

The following recommendations are presented as numbered options for The Data
Professor's consideration.

### [1] Extend Valentina with Broker Implementation Skills — or Split WS-10

**Type:** [A] Extend existing agent
**Addresses:** GAP-03, GAP-04, SPOF-01

Valentina needs three capabilities she doesn't currently have documented:
- **State machine design and implementation** (correlation IDs, session management, delegation lifecycle)
- **Anti-recursion and cycle detection** (depth limits, delegation chain tracking)
- **Evidence persistence** (structured output storage in `.araya/runs/`)

**Option A — Extend Valentina's skills:**
Add `state-machine`, `message-broker`, and `event-sourcing` as implementable skills
for Valentina. These are patterns she can follow from the architecture designs
provided by Aisha (WS-04) and Isla (WS-08).

**Option B — Split WS-10 between Isla and Valentina:**
Isla implements the state machine, correlation, and anti-recursion core (AWU-035,
AWU-037, AWU-038) as infrastructure. Valentina implements the broker entry point
and evidence persistence (AWU-036, AWU-039, AWU-040) as API layer. This aligns
with Daneel's CR-003 suggestion.

**My recommendation:** Option B. Isla has `docker`, `kubernetes`, `cicd-pipeline`,
and `monitoring` — infrastructure orchestration aligns with her skills. Valentina
focuses on the API layer (`api-design`, `endpoint`). This reduces Valentina's
WS-10 load from 6 AWUs to 3, and distributes the most complex work to the agent
best equipped for it.

### [2] Hire a Second Backend Developer — or Activate a Dynamic Agent

**Type:** [C] Hire new agent
**Addresses:** GAP-04, SPOF-01

ARAYA has **one backend developer** (Valentina) and **no backup**. This is the
most critical SPOF in the organization. REQ-001 alone assigns 16 AWUs to Valentina.

**Recommendation:** I recommend hiring or activating a second backend developer
with skills: `api-design`, `db-schema`, `endpoint`, `error-handling`, `auth-middleware`.
This agent would serve as:
1. Backup for Valentina across all projects
2. Parallel executor for WS-09 and WS-10 (they can run concurrently)
3. Eliminator of SPOF-01

**Alternative:** Activate **Neo** (currently dormant) as a scoped backend developer
for REQ-001's WS-10, assigning them `api-design`, `db-schema`, `endpoint`,
`error-handling`. Retire or return to dormant after delivery.

### [3] Update Risk R-01: Remove Invalid Clara Backup

**Type:** [A] Correct existing plan
**Addresses:** GAP-05

Replace the mitigation in R-01 from "activar a Clara como backup" to:
- "Activar a Neo como scoped backend developer" (if Recommendation [2] is accepted)
- "Secuenciar WS-07 → WS-09 → WS-10 estrictamente; extender timeline"

Clara is a QA Engineer with zero backend skills. This mitigation must be corrected
before execution begins.

### [4] Assign `ai-routing` to Aurora

**Type:** [A] Extend existing agent
**Addresses:** GAP-06

`ai-routing` skill exists in `skills/ai-routing/SKILL.md` but is unassigned.
Aurora is the Capability Officer responsible for routing decisions (AC-16).
Assign `ai-routing` to Aurora in `araya.yaml`.

This also corrects the `/araya route` subcommand which is currently misrouted to Sonia.

### [5] Assign `pm-decompose` to Sonia

**Type:** [A] Extend existing agent
**Addresses:** GAP-07

`pm-decompose` skill exists in `skills/pm-decompose/SKILL.md` but is unassigned.
Sonia's prompt already references it. The Specialist Delegation Contract in
REQ-001 explicitly requires Sonia to decompose work. Assign `pm-decompose` to
Sonia in `araya.yaml`.

### [6] Create SKILL.md Files for Aurora's 4 Orphan Skills

**Type:** [B] Create new skill implementations
**Addresses:** GAP-11

Aurora has 4 skills declared in `araya.yaml` without implementation:
- `hiring-recommendations` — Create SKILL.md for structured hiring proposals
- `organizational-health` — Create SKILL.md for health assessment metrics
- `skills-lifecycle` — Create SKILL.md for skill creation/deprecation lifecycle
- `spof-detection` — Create SKILL.md for single point of failure analysis

These are not blocking REQ-001 but limit Aurora's ability to execute her full
mandate. `spof-detection` is directly relevant to this report but Aurora has
compensated using `agent-topology` and `gap-analysis`.

**Priority:** `spof-detection` first (used in this report), then `skills-lifecycle`
(needed for AC-16 implementation), then `hiring-recommendations` and
`organizational-health`.

### [7] Assign Cross-Cutting AX Skills

**Type:** [B] Assign existing skills
**Addresses:** GAP-08

- `ax-postoffice` → Assign to all agents as a transversal AX skill (like `ax3`)
- `autonomous-execution` → Assign to Sonia as the orchestration lead

These are not blocking but represent dead organizational capability.

### [8] Create Prompt File for Daneel

**Type:** [A] Documentation
**Addresses:** GAP-09

Create `prompts/agents/daneel.md` documenting his role as Reality Authority,
his `reality-verification` skill, and his 5-tier delivery state model.
Not blocking — skill-based execution is sufficient for WS-15, but a prompt
improves consistency.

---

## 7. Decision Required from The Data Professor

The following decisions are needed before REQ-001 execution can proceed:

| # | Decision | Options | Urgency |
|---|----------|---------|---------|
| D-01 | GAP-03 resolution: How to handle WS-10 broker implementation | [1A] Extend Valentina / [1B] Split with Isla | **CRITICAL** — blocks Batch 4 |
| D-02 | SPOF-01 resolution: Valentina backup | [2A] Hire second backend dev / [2B] Activate Neo for WS-10 / [2C] Accept SPOF risk | **CRITICAL** — blocks parallel execution |
| D-03 | Approve Clara backup removal from R-01 | [Approve] / [Propose alternative] | **HIGH** — incorrect mitigation |

Decisions D-04 through D-08 are non-blocking enhancements:

| # | Decision | Options | Urgency |
|---|----------|---------|---------|
| D-04 | Assign `ai-routing` to Aurora | [Approve] / [Defer] | Low |
| D-05 | Assign `pm-decompose` to Sonia | [Approve] / [Defer] | Low |
| D-06 | Create Aurora's orphan skill files | [Approve all 4] / [spof-detection only] / [Defer] | Low |
| D-07 | Assign `ax-postoffice` and `autonomous-execution` | [Approve] / [Defer] | Low |
| D-08 | Create Daneel prompt file | [Approve] / [Defer] | Low |

---

## 8. Updated Capability Registry Impact

If all recommendations are approved, these changes to the capability registry
are required:

### Changes to `araya.yaml`

```yaml
# Assign ai-routing to Aurora
aurora:
  skills:
    - ai-routing  # ADD

# Assign pm-decompose to Sonia
sonia:
  skills:
    - pm-decompose  # ADD

# Assign ax-postoffice and autonomous-execution
# (all agents get ax-postoffice as transversal)
# Sonia gets autonomous-execution:
sonia:
  skills:
    - autonomous-execution  # ADD

# If Neo is activated:
neo:
  status: active  # CHANGE from dormant
  skills:
    - api-design       # ADD
    - db-schema        # ADD
    - endpoint         # ADD
    - error-handling   # ADD
    - auth-middleware   # ADD
    - ax3
```

### New SKILL.md files to create

| Skill | Directory |
|-------|-----------|
| `hiring-recommendations` | `skills/hiring-recommendations/SKILL.md` |
| `organizational-health` | `skills/organizational-health/SKILL.md` |
| `skills-lifecycle` | `skills/skills-lifecycle/SKILL.md` |
| `spof-detection` | `skills/spof-detection/SKILL.md` |

### New prompt file to create

| Agent | File |
|-------|------|
| Daneel | `prompts/agents/daneel.md` |

---

## 9. Methodology

This report was generated by:

1. Reading `req-001.md` to extract all 25 ACs and 6 DIs
2. Reading `req-001-audit.md` (Esteban's knowledge audit) for command/skill/agent inventory
3. Reading `req-001-workstreams.md` (Sonia's plan) for the 16 workstreams and 71 AWUs
4. Reading `req-001-daneel-audit.md` for Daneel's corrections (CR-001 to CR-004)
5. Reading `araya.yaml` as the canonical source of truth for agents, skills, and permissions
6. Reading `capability-registry.yaml` for cross-reference
7. Cross-referencing every agent assignment against their documented skills
8. Identifying gaps where required skills > documented skills
9. Issuing recommendations per the Gap Analysis Report methodology

---

## Appendix A: Agent Skill Map (Complete)

| # | Agent | Skills (from araya.yaml) | Count |
|---|-------|--------------------------|-------|
| 1 | Manu | sdd-vision, sdd-requirements, test-case, bdd-feature, pm-status, project-planning, po-gap-questionnaire, definition-of-done, drr-create, uat-review, token-efficiency, ax3 | 12 |
| 2 | Aurora | capability-registry, gap-analysis, workforce-planning, agent-topology, skills-lifecycle*, spof-detection*, hiring-recommendations*, organizational-health*, ax3 | 9 (5 implemented) |
| 3 | Sonia | pm-plan, pm-dependencies, pm-risk, pm-status, project-planning, drr-create, iar-generate, cr-generate, ax3 | 9 |
| 4 | Valentina | api-design, db-schema, endpoint, auth-middleware, error-handling, ax3 | 6 |
| 5 | Alejandra | component, form-design, page-route, api-integration, responsive, ax3 | 6 |
| 6 | Teresa | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute, uat-generate, uat-review, token-efficiency, ax3 | 11 |
| 7 | Clara | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute, uat-generate, token-efficiency, ax3 | 10 |
| 8 | Aisha | microservice, api-gateway, cache-strategy, message-queue, db-optimization, ax3 | 6 |
| 9 | Lin | component-arch, animation, performance, accessibility, state-management, ax3 | 6 |
| 10 | Priya | performance-test, e2e-strategy, cicd-quality, uat-review, token-efficiency, ax3 | 6 |
| 11 | Diana | threat-model, secure-arch, secure-code, pentest, compliance, secrets, ax3 | 7 |
| 12 | Isla | docker, kubernetes, cicd-pipeline, cloud-deploy, monitoring, ax3 | 6 |
| 13 | Elena | daily-standup, sprint-planning, retrospective, impediment, velocity, definition-of-done, reality-verification, ax3 | 8 |
| 14 | Sofia | ax3 | 1 |
| 15 | Junia | data-lakehouse-design, spark-pipeline, cloud-provision, data-modeling, data-governance, ax3 | 6 |
| 16 | Bernabe | spark-pipeline, etl-orchestration, data-quality, medallion-architecture, ax3 | 5 |
| 17 | Maria | llm-local-deploy, rag-pipeline, vector-search, agent-design, model-fine-tuning, ax3 | 6 |
| 18 | Lucas | seo-optimize, geo-branding, multi-platform-publish, content-calendar, ax3 | 5 |
| 19 | Priscila | adr-write, api-document, architecture-diagram, slide-deck-generate, technical-book, ax3 | 6 |
| 20 | Lidia | abc-costing-model, whale-curve-analyze, cost-to-serve, profitability-lineage, ax3 | 5 |
| 21 | Pablo | dashboard-design, data-visualization, kpi-framework, analytics-report, ax3 | 5 |
| 22 | Mateo | cost-analysis, usage-metering, resource-rightsizing, budget-forecasting, token-efficiency, ax3 | 6 |
| 23 | Eunice | lab-scenario-design, student-assessment, training-module, curriculum-planning, ax3 | 5 |
| 24 | Esteban | daily-note, knowledge-graph, project-planning, pkm-workflow, organizational-knowledge, trajectory-management, ax3 | 7 |
| 25 | Aquila | static-site-generate, theme-design, seo-optimize, deployment-automation, ax3 | 5 |
| 26 | Dorcas | brand-compliance, visual-identity, brand-audit, asset-management, ax3 | 5 |
| 27 | Daneel | reality-verification, ax3 | 2 |
| 28 | Rolando | reality-verification, ax3 | 2 |
| 29 | Neo | ax3 | 1 |
| 30 | Trinity | ax3 | 1 |

\* Skills without SKILL.md implementation (orphan).

---

## Appendix B: Unassigned Skills (Dead Organizational Capability)

| Skill | SKILL.md Exists | Suggested Assignment |
|-------|----------------|---------------------|
| `ai-routing` | ✅ | Aurora (Capability Officer) |
| `pm-decompose` | ✅ | Sonia (PM Head Orchestrator) |
| `ax-postoffice` | ✅ | All agents (transversal AX) |
| `autonomous-execution` | ✅ | Sonia (orchestration lead) |

---

*Aurora, CHRO — Capability Coverage Report complete. No implementation performed.*
*Presented to The Data Professor for decision on D-01 through D-08.*
