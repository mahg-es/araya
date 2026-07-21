# req-001-workstreams — Plan de ejecución

**Plan ID**: REQ-001-WS-v1.0
**Date**: 2026-07-21 23:00 -04:00
**Status**: Draft — pending Manu approval
**Author**: Sonia (PM Head Orchestrator)
**Confidence**: 0.92

---

## Resumen ejecutivo

REQ-001 establece 25 acceptance criteria y 6 requisitos de infraestructura de delegación (DI-001 a DI-006). El objetivo es incorporar una capacidad transversal de descubrimiento de comandos, consulta de manual y delegación obligatoria en agentes especialistas.

Este plan define **14 Workstreams** con **38 Atomic Work Units (AWUs)**, desplegando **18 agentes especialistas** a lo largo de **8 batches de ejecución**. El critical path estimado es de **18.0 AWUs**.

---

## Workstreams

### Workstream 1: Audit & Gap Analysis
- **Objetivo**: Auditar el estado actual de comandos, funciones, skills, agentes, mecanismos de ayuda y patrones de delegación. Identificar brechas contra REQ-001. Cubre el contexto de auditoría descrito en la sección "Context" del requerimiento.
- **Agente responsable**: Esteban (Knowledge Manager)
- **AWUs**:
  1. **[AWU-001]** Auditar comandos slash, CLI, funciones runtime, y mecanismos de ayuda existentes → agente: **Esteban**, depende de: nada
  2. **[AWU-002]** Auditar skills instaladas, agentes registrados, capacidades, límites de autoridad y asignación skills→agentes → agente: **Esteban**, depende de: AWU-001
  3. **[AWU-003]** Auditar patrones de delegación actuales: casos donde orquestadores ejecutaron trabajo de especialistas → agente: **Esteban**, depende de: AWU-002
  4. **[AWU-004]** Generar Gap Analysis Report (GAR): qué existe vs. qué exige REQ-001, brechas clasificadas por severidad → agente: **Esteban**, depende de: AWU-001, AWU-002, AWU-003
- **Paralelizable con**: Ninguno (fundacional — todos los demás workstreams dependen de WS-01)
- **Cubre AC**: Contexto de auditoría (previo a implementación)
- **AWU total**: 4

---

### Workstream 2: Product Ownership — Requirements & Acceptance Validation
- **Objetivo**: Validar que los 25 acceptance criteria de REQ-001 son objetivos, medibles, verificables y comprobables. Definir DoD por fase. Aprobar formalmente el alcance. **MANDATORY GATE — ningún trabajo de implementación comienza sin esta aprobación.**
- **Agente responsable**: Manu (Product Owner) 👑
- **AWUs**:
  1. **[AWU-005]** Revisar REQ-001 completo, validar que los 25 ACs son testables y no ambiguos. Si hay gaps, ejecutar `/skill:po-gap-questionnaire` → agente: **Manu**, depende de: AWU-004 (GAR de Esteban)
  2. **[AWU-006]** Generar Definition of Done (DoD) para cada fase: catalog, man-system, skill, delegation-infra, integration, testing, docs → agente: **Manu**, depende de: AWU-005
  3. **[AWU-007]** Emitir aprobación formal pre-implementación (SPEC_APPROVED) o solicitar revisiones → agente: **Manu**, depende de: AWU-006
- **Paralelizable con**: WS-03 (Aurora capability coverage) — ambos consumen AWU-004
- **Cubre AC**: Gobernanza pre-implementación (GOV-001, GOV-002)
- **AWU total**: 3

---

### Workstream 3: Capability Coverage & Agent Eligibility
- **Objetivo**: Determinar cobertura de capacidades para REQ-001. Validar que existen agentes competentes para cada AWU. Identificar gaps de capacidad. Aurora es responsable de determinar elegibilidad cuando la asignación no es evidente (AC-16).
- **Agente responsable**: Aurora (Capability Authority) 🌟
- **AWUs**:
  1. **[AWU-008]** Analizar REQ-001 contra el capability registry: ¿hay agentes para cada tarea? → agente: **Aurora**, depende de: AWU-004
  2. **[AWU-009]** Validar elegibilidad de agentes para tareas de delegación, catálogo, infraestructura y skill → agente: **Aurora**, depende de: AWU-008
  3. **[AWU-010]** Emitir Capability Coverage Report: gaps, riesgos de SPOF, recomendaciones → agente: **Aurora**, depende de: AWU-009
- **Paralelizable con**: WS-02 (Manu) — ambos consumen AWU-004
- **Cubre AC**: AC-16 (Aurora participa en determinación de elegibilidad)
- **AWU total**: 3

---

### Workstream 4: Canonical Catalog Schema Design
- **Objetivo**: Diseñar el esquema del catálogo canónico de comandos, funciones, skills y agentes. Definir el modelo de metadatos: propósito, sintaxis, parámetros, ejemplos, restricciones, especialista responsable, precondiciones, permisos, riesgos, efectos secundarios, capacidades relacionadas/alternativas, estado (disponible, deshabilitada, obsoleta, no instalada). (AC-1, AC-3, AC-4, AC-6, AC-7, AC-8)
- **Agente responsable**: Aisha (Backend Architect)
- **AWUs**:
  1. **[AWU-011]** Diseñar schema del catálogo: entidades (Command, Function, Skill, Agent), atributos, relaciones → agente: **Aisha**, depende de: AWU-004 (GAR)
  2. **[AWU-012]** Definir modelo de búsqueda: por keyword, dominio, agente, skill, propósito → agente: **Aisha**, depende de: AWU-011
  3. **[AWU-013]** Definir estrategia de validación automática: catálogo debe validarse contra fuentes reales del repositorio (AC-6, AC-23) → agente: **Aisha**, depende de: AWU-011
  4. **[AWU-014]** Escribir ADR para el diseño del catálogo (architecture decision record) → agente: **Aisha**, depende de: AWU-012, AWU-013
- **Paralelizable con**: WS-05 (Skill design) y WS-08 (Delegation architecture) — todos dependen de WS-01
- **Cubre AC**: AC-1, AC-3, AC-4, AC-6, AC-7, AC-8, AC-21
- **AWU total**: 4

---

### Workstream 5: Skill — araya-command-and-delegation-expert (Diseño y Redacción)
- **Objetivo**: Crear la skill transversal obligatoria `araya-command-and-delegation-expert`. La skill debe enseñar a cada agente los 10 comportamientos especificados en REQ-001. (AC-9, AC-10, AC-11, AC-12)
- **Agente responsable**: Priscila (Technical Writer)
- **AWUs**:
  1. **[AWU-015]** Redactar la skill completa con los 10 teaching points: (1) consultar catálogo antes de iniciar tarea, (2) identificar comandos/funciones/skills/especialistas relevantes, (3) consultar --help o /araya:man antes de usar función desconocida, (4) preferir capacidades nativas ARAYA, (5) no inventar comandos/argumentos/flags/agentes/comportamientos, (6) verificar disponibilidad/compatibilidad/permisos antes de ejecutar, (7) delegar en agente especializado cuando exista, (8) no asumir tareas fuera de su autoridad, (9) registrar cuando una capacidad o especialista necesario no existe, (10) proponer nuevas capacidades solo tras confirmar inexistencia → agente: **Priscila**, depende de: AWU-004 (GAR), AWU-014 (Catalog ADR)
  2. **[AWU-016]** Incluir en la skill: Specialist Delegation Contract completo (reglas de Sonia, reglas de excepción, prohibition de presión de tiempo/simplicidad como excusa) → agente: **Priscila**, depende de: AWU-015
  3. **[AWU-017]** Revisar la skill contra los 10 teaching points del requerimiento (completeness check) → agente: **Priscila**, depende de: AWU-016
- **Paralelizable con**: WS-04 (Catalog schema) y WS-08 (Delegation architecture)
- **Cubre AC**: AC-9, AC-10, AC-11, AC-12
- **AWU total**: 3

---

### Workstream 6: PM Auditor — Process Quality Gate
- **Objetivo**: Elena audita la calidad del proceso de planificación: verifica que los workstreams cumplen con la constitución, que no hay solapamientos, que las dependencias son correctas, que los agentes asignados tienen las capacidades requeridas. **No audita dominio técnico — audita el PLAN.**
- **Agente responsable**: Elena (Scrum Master + PM Auditor)
- **AWUs**:
  1. **[AWU-018]** Auditar este plan (req-001-workstreams.md): verificar cobertura de ACs, integridad de dependencias, asignaciones válidas de agentes → agente: **Elena**, depende de: AWU-007 (Manu approval), AWU-010 (Aurora coverage)
  2. **[AWU-019]** Emitir Process Quality Audit Report: hallazgos, conformidad constitucional, recomendaciones → agente: **Elena**, depende de: AWU-018
- **Paralelizable con**: WS-04, WS-05, WS-08 (Elena audita el plan, no el contenido técnico)
- **Cubre AC**: Gobernanza de proceso (PMO-003, PMO-008)
- **AWU total**: 2

---

### Workstream 7: Catalog Population & Registry Implementation
- **Objetivo**: Implementar el registro del catálogo según el schema de Aisha. Poblar desde las fuentes reales del repositorio (prompts/agents/, skills/, comandos registrados en extensions/, CLI, runtime). (AC-1, AC-6)
- **Agente responsable**: Valentina (Backend Developer)
- **AWUs**:
  1. **[AWU-020]** Implementar la estructura de datos del registro (basada en schema de AWU-011) → agente: **Valentina**, depende de: AWU-014 (Catalog ADR)
  2. **[AWU-021]** Implementar populator: extraer comandos, funciones, skills y agentes desde fuentes reales (prompts/, skills/, extensions/, src/) → agente: **Valentina**, depende de: AWU-020
  3. **[AWU-022]** Implementar validador: verificar que el catálogo coincide con repository truth; detectar drift → agente: **Valentina**, depende de: AWU-021
- **Paralelizable con**: Ninguno (depende estrictamente de WS-04)
- **Cubre AC**: AC-1, AC-6, AC-21, AC-23
- **AWU total**: 3

---

### Workstream 8: Delegation Infrastructure — Architecture
- **Objetivo**: Diseñar la arquitectura del broker/orquestador de delegación. Cubre DI-001 a DI-006: broker, independencia del runtime, capacidades mínimas (correlación, sesiones, permisos, estados, resultados, evidencia), protección contra recursión, separación orden/ejecución, criterios de verificación.
- **Agente responsable**: Isla (Infra Architect)
- **AWUs**:
  1. **[AWU-023]** Diseñar arquitectura del broker: protocolo de delegación, API, modelo de datos (correlation_id, delegation_id, run_id, session_id) → agente: **Isla**, depende de: AWU-004 (GAR)
  2. **[AWU-024]** Diseñar state machine: pending → dispatched → running → completed/failed/blocked/timeout → agente: **Isla**, depende de: AWU-023
  3. **[AWU-025]** Diseñar protección contra recursión: detección de ciclos, profundidad máxima configurable (default 3), rechazo de auto-delegación → agente: **Isla**, depende de: AWU-023
  4. **[AWU-026]** Diseñar separación orden/ejecución: Sonia emite orden → broker despacha/monitorea/recolecta → Sonia recibe resultados consolidados → agente: **Isla**, depende de: AWU-024, AWU-025
  5. **[AWU-027]** Escribir ADR para la infraestructura de delegación → agente: **Isla**, depende de: AWU-026
- **Paralelizable con**: WS-04 (Catalog schema) y WS-05 (Skill design)
- **Cubre AC**: DI-001, DI-002, DI-003, DI-004, DI-005, DI-006 / AC-13, AC-14, AC-15
- **AWU total**: 5

---

### Workstream 9: /araya:man Help System Implementation
- **Objetivo**: Implementar el sistema de ayuda `/araya:man`. Cubre: listar capacidades, consultar detalle de función/agente/skill, búsqueda, --help, errores claros para funciones inexistentes, y validación automática contra el registro. (AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8)
- **Agente responsable**: Valentina (Backend Developer)
- **AWUs**:
  1. **[AWU-028]** Implementar `/araya:man` (sin argumentos): lista todas las capacidades disponibles → agente: **Valentina**, depende de: AWU-022 (Registry populated)
  2. **[AWU-029]** Implementar `/araya:man <función>`: muestra propósito, sintaxis, parámetros, ejemplos, restricciones, especialista responsable → agente: **Valentina**, depende de: AWU-028
  3. **[AWU-030]** Implementar `/araya:man <agente>`: muestra responsabilidad, capacidades, skills, permisos, tareas que no debe realizar → agente: **Valentina**, depende de: AWU-028
  4. **[AWU-031]** Implementar `/araya:man <skill>`: muestra propósito, alcance, agentes que la poseen → agente: **Valentina**, depende de: AWU-028
  5. **[AWU-032]** Implementar búsqueda: por keyword, dominio, agente, skill, propósito → agente: **Valentina**, depende de: AWU-028
  6. **[AWU-033]** Implementar `--help` para cada comando soportado (o justificación documentada de excepción) → agente: **Valentina**, depende de: AWU-029, AWU-030, AWU-031
  7. **[AWU-034]** Implementar error claro para función inexistente que sugiera funciones reales similares → agente: **Valentina**, depende de: AWU-028
- **Paralelizable con**: WS-10 (Delegation implementation) — ambos son implementación sobre infraestructura ya definida
- **Cubre AC**: AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
- **AWU total**: 7

---

### Workstream 10: Delegation Infrastructure — Implementation
- **Objetivo**: Implementar el broker/orquestador de delegación según la arquitectura de Isla. Cubre DI-001 a DI-006 completamente. Debe funcionar independientemente del runtime (pi, Codex, Claude CLI, AGY).
- **Agente responsable**: Valentina (Backend Developer)
- **AWUs**:
  1. **[AWU-035]** Implementar broker core: recepción de solicitudes, despacho a agentes, state machine → agente: **Valentina**, depende de: AWU-027 (Delegation ADR)
  2. **[AWU-036]** Implementar correlation & sessions: IDs únicos, agrupación en workflows, trazabilidad → agente: **Valentina**, depende de: AWU-035
  3. **[AWU-037]** Implementar permisos: validación de autoridad del solicitante, capacidades del destino → agente: **Valentina**, depende de: AWU-035
  4. **[AWU-038]** Implementar protección anti-recursión: detección de ciclos, profundidad máxima, rechazo de auto-delegación → agente: **Valentina**, depende de: AWU-035
  5. **[AWU-039]** Implementar persistencia de evidencia: almacenar resultados en `.araya/runs/{run_id}/` con outputs, artifacts y metadata → agente: **Valentina**, depende de: AWU-036
  6. **[AWU-040]** Implementar `/araya:delegate <agent> "<task>"` como entry point del broker → agente: **Valentina**, depende de: AWU-035, AWU-036, AWU-037, AWU-038, AWU-039
- **Paralelizable con**: WS-09 (/araya:man) — ambos son implementación independiente
- **Cubre AC**: DI-001 a DI-006 / AC-13, AC-14, AC-15
- **AWU total**: 6

---

### Workstream 11: Agent Prompt Integration & Skill Assignment
- **Objetivo**: Asignar la skill `araya-command-and-delegation-expert` a todos los agentes ARAYA sin excepción. Actualizar prompts de agentes para incluir la skill y las reglas de delegación. Implementar validación que falla cuando un agente nuevo no recibe la skill. (AC-10, AC-11, AC-12)
- **Agente responsable**: Esteban (Knowledge Manager) + Priscila (Technical Writer)
- **AWUs**:
  1. **[AWU-041]** Actualizar Sonia.md: incorporar Specialist Delegation Contract, reglas de cuándo NO ejecutar directamente, protocolo de delegación vía broker → agente: **Priscila**, depende de: AWU-017 (Skill doc), AWU-040 (Broker impl)
  2. **[AWU-042]** Asignar `araya-command-and-delegation-expert` a los 27 agentes del roster: modificar cada prompt para incluir la skill → agente: **Priscila**, depende de: AWU-017
  3. **[AWU-043]** Implementar validación automática: al registrar un nuevo agente, verificar que tiene la skill asignada; fallar si no → agente: **Esteban**, depende de: AWU-042
  4. **[AWU-044]** Actualizar Aurora.md: incorporar responsibility de elegibilidad en delegación (AC-16) → agente: **Priscila**, depende de: AWU-010 (Aurora coverage report)
- **Paralelizable con**: WS-09 y WS-10 (tras completarse AWU-017 y AWU-040)
- **Cubre AC**: AC-10, AC-11, AC-12, AC-16
- **AWU total**: 4

---

### Workstream 12: Security Review
- **Objetivo**: Revisar la seguridad del sistema completo: broker de delegación,暴露 de capacidades vía /araya:man, frontera público/privado (AC-21), secrets management. Threat model y secure code review.
- **Agente responsable**: Diana (Cybersecurity Specialist) 🔒
- **AWUs**:
  1. **[AWU-045]** Threat model del sistema de delegación: STRIDE sobre broker, canales de comunicación, persistencia de evidencia → agente: **Diana**, depende de: AWU-040 (Broker impl), AWU-034 (Man system)
  2. **[AWU-046]** Secure code review del broker: inyección, path traversal en almacenamiento de evidencia, escalación de privilegios → agente: **Diana**, depende de: AWU-045
  3. **[AWU-047]** Validar frontera público/privado: el catálogo y man system no exponen capacidades del Core privado (AC-21) → agente: **Diana**, depende de: AWU-022 (Registry), AWU-034 (Man system)
  4. **[AWU-048]** Emitir Security Assessment Report: hallazgos, severidad, recomendaciones, disposition (APPROVE/BLOCK) → agente: **Diana**, depende de: AWU-046, AWU-047
- **Paralelizable con**: WS-13 (Documentation) — Diana lee, Priscila escribe
- **Cubre AC**: AC-21, AC-22 (security aspects)
- **AWU total**: 4

---

### Workstream 13: Documentation
- **Objetivo**: Documentar el sistema completo para todos los runtimes oficialmente soportados: pi.dev, Codex, Claude CLI, AGY. Cubrir: guía de usuario de /araya:man, guía de delegación para agentes, guía de onboarding para nuevos agentes, referencia de arquitectura. (AC-20)
- **Agente responsable**: Priscila (Technical Writer)
- **AWUs**:
  1. **[AWU-049]** Escribir User Guide: `/araya:man`, búsqueda, --help, ejemplos para cada runtime → agente: **Priscila**, depende de: AWU-034 (Man system complete)
  2. **[AWU-050]** Escribir Agent Delegation Guide: cómo delegar, cuándo delegar, protocolo del broker, manejo de errores → agente: **Priscila**, depende de: AWU-040 (Broker impl), AWU-041 (Sonia prompt updated)
  3. **[AWU-051]** Escribir ADR para el sistema de delegación (si no cubierto por AWU-027) y arquitectura del catálogo (si no cubierto por AWU-014) → agente: **Priscila**, depende de: AWU-014, AWU-027
  4. **[AWU-052]** Documentar cobertura de runtimes: pi.dev, Codex, Claude CLI, AGY — diferencias, limitaciones, configuración → agente: **Priscila**, depende de: AWU-049, AWU-050
- **Paralelizable con**: WS-12 (Security) — ambos leen artefactos implementados
- **Cubre AC**: AC-20
- **AWU total**: 4

---

### Workstream 14: Testing & QA
- **Objetivo**: Implementar y ejecutar tests unitarios, de integración, de regresión y de validación documental. Cubrir todos los acceptance criteria verificables automáticamente. Incluye tests específicos para AC-14, AC-17, AC-18, AC-19. (AC-22)
- **Agente responsable**: Teresa (QA Engineer) + Priya (QA Lead)
- **AWUs**:
  1. **[AWU-053]** Generar test cases a partir de los 25 ACs: traducir cada AC verificable en casos de prueba concretos → agente: **Teresa**, depende de: AWU-007 (Manu approval)
  2. **[AWU-054]** Implementar unit tests para Catalog Registry: populator, validator, search → agente: **Teresa**, depende de: AWU-022
  3. **[AWU-055]** Implementar unit tests para /araya:man: listado, detalle función, detalle agente, detalle skill, búsqueda, --help, error para inexistente → agente: **Teresa**, depende de: AWU-034
  4. **[AWU-056]** Implementar integration tests para Delegation Broker: flujo completo de delegación, correlation, sesiones, estados, persistencia, protección anti-recursión → agente: **Teresa**, depende de: AWU-040
  5. **[AWU-057]** Implementar tests de regresión: comandos existentes no rotos por nuevas incorporaciones → agente: **Teresa**, depende de: AWU-034, AWU-040
  6. **[AWU-058]** Implementar test AC-14: verificar que Sonia (u otro orquestador) no puede ejecutar directamente trabajo de especialista → agente: **Teresa**, depende de: AWU-041, AWU-040
  7. **[AWU-059]** Implementar test AC-17: verificar que agentes pueden descubrir capacidades no incluidas directamente en su prompt → agente: **Teresa**, depende de: AWU-042, AWU-034
  8. **[AWU-060]** Implementar test AC-18: verificar que ningún agente inventa comandos, argumentos, skills o especialistas → agente: **Teresa**, depende de: AWU-042
  9. **[AWU-061]** Implementar test AC-19: verificar que un agente busca función existente antes de proponer implementación duplicada → agente: **Teresa**, depende de: AWU-042, AWU-034
  10. **[AWU-062]** Implementar document validation tests: cobertura de runtimes, integridad de docs, enlaces válidos → agente: **Teresa**, depende de: AWU-052
  11. **[AWU-063]** Ejecutar test suite completa, generar test report con red/green, coverage → agente: **Teresa**, depende de: AWU-054 a AWU-062
  12. **[AWU-064]** Priya: Revisar estrategia de testing, cobertura de ACs, calidad de assertions, performance de test suite → agente: **Priya**, depende de: AWU-063
- **Paralelizable con**: Internamente: AWU-054, AWU-055, AWU-056 son paralelizables entre sí (dependencias distintas)
- **Cubre AC**: AC-14, AC-17, AC-18, AC-19, AC-22
- **AWU total**: 12

---

### Workstream 15: Delivery Verification & Reality Check
- **Objetivo**: Daneel (Reality Authority) verifica que el catálogo, las asignaciones y la delegación coinciden con repository truth. Identificar estado real en workspace, feature branch, dev-mahg, main, release y runtime. Manu (Product Owner) valida todos los ACs y emite disposición final. **MANDATORY GATE — ninguna entrega se considera completada sin esta validación.**
- **Agente responsable**: Daneel (Reality Authority) 🛡️ + Manu (Product Owner) 👑
- **AWUs**:
  1. **[AWU-065]** Daneel: Verificar catálogo contra repository truth — cada entrada del catálogo debe coincidir con su fuente real → agente: **Daneel**, depende de: AWU-022 (Registry), AWU-042 (Agent prompts)
  2. **[AWU-066]** Daneel: Verificar estado real en workspace, feature branch, dev-mahg, main, release, runtime (AC-24) → agente: **Daneel**, depende de: AWU-065
  3. **[AWU-067]** Daneel: Emitir Reality Verification Report: 5-tier state, divergencias, disposición → agente: **Daneel**, depende de: AWU-066
  4. **[AWU-068]** Manu: Validar los 25 ACs uno por uno contra la evidencia entregada → agente: **Manu**, depende de: AWU-063 (Test report), AWU-048 (Security report), AWU-067 (Daneel report), AWU-052 (Docs)
  5. **[AWU-069]** Manu: Emitir disposición final: APPROVED / REVISE / BLOCKED. Si REVISE, generar DRR y re-enrutar → agente: **Manu**, depende de: AWU-068
- **Paralelizable con**: Ninguno — es el gate final
- **Cubre AC**: AC-23, AC-24, AC-25
- **AWU total**: 5

---

### Workstream 16: PM Auditor — Final Process Quality Gate
- **Objetivo**: Elena verifica que el proceso completo cumplió con la constitución, los workstreams se ejecutaron según el plan, las dependencias se respetaron, y los gates de calidad se aplicaron correctamente.
- **Agente responsable**: Elena (Scrum Master + PM Auditor)
- **AWUs**:
  1. **[AWU-070]** Auditar ejecución completa: conformidad con el plan, respeto de gates, trazabilidad de decisiones → agente: **Elena**, depende de: AWU-069 (Manu disposition)
  2. **[AWU-071]** Emitir Final Process Audit Report: hallazgos, lecciones aprendidas, recomendaciones para future runs → agente: **Elena**, depende de: AWU-070
- **Paralelizable con**: Cierre administrativo posterior a la entrega
- **Cubre AC**: Gobernanza de cierre (PMO-003, PMO-008)
- **AWU total**: 2

---

## Dependency DAG

```
WS-01 (Esteban: Audit & GAR)
  │
  ├──► WS-02 (Manu: PO Spec Gate) ──► WS-06 (Elena: Process Audit 1)
  │
  ├──► WS-03 (Aurora: Capability Coverage)
  │
  ├──► WS-04 (Aisha: Catalog Schema) ──► WS-07 (Valentina: Registry Impl)
  │                                            │
  ├──► WS-05 (Priscila: Skill Design)          │
  │         │                                   │
  └──► WS-08 (Isla: Delegation Arch)           │
            │                                   │
            │                                   ▼
            │                             WS-09 (Valentina: Man System)
            │                                   │
            │                                   │
            │     ┌─────────────────────────────┘
            │     │
            ▼     ▼
      WS-10 (Valentina: Delegation Impl)
            │
            ├──► WS-11 (Priscila+Esteban: Agent Integration)
            │
            ├──► WS-12 (Diana: Security Review) ──┐
            │                                      │
            ├──► WS-13 (Priscila: Documentation) ──┤
            │                                      │
            └──► WS-14 (Teresa+Priya: Testing) ────┤
                                                   │
                                                   ▼
                                          WS-15 (Daneel+Manu: Delivery Verification)
                                                   │
                                                   ▼
                                          WS-16 (Elena: Final Process Audit)
```

---

## Batch Execution Plan

### Batch 0 — Foundation (secuencial)
| WS | Agent | AWUs | Dependencia |
|----|-------|------|-------------|
| WS-01 | Esteban | AWU-001→004 | nada |

> Esteban ejecuta la auditoría completa. Su GAR (AWU-004) alimenta a todos los demás workstreams.

### Batch 1 — Parallel Group A (dependen de WS-01)
| WS | Agent | AWUs | Qué produce |
|----|-------|------|-------------|
| WS-02 | Manu 👑 | AWU-005→007 | Spec approval + DoD |
| WS-03 | Aurora 🌟 | AWU-008→010 | Capability coverage report |
| WS-04 | Aisha | AWU-011→014 | Catalog schema + ADR |
| WS-05 | Priscila | AWU-015→017 | Skill document |
| WS-08 | Isla | AWU-023→027 | Delegation architecture + ADR |

> **5 workstreams en paralelo.** Sin dependencias mutuas. Todos consumen AWU-004.

### Batch 2 — Process Gate 1 (depende de WS-02 + WS-03)
| WS | Agent | AWUs | Qué produce |
|----|-------|------|-------------|
| WS-06 | Elena | AWU-018→019 | Process quality audit report |

> Elena audita el plan con las aprobaciones de Manu y Aurora ya emitidas.

### Batch 3 — Sequential Implementation (dependencias encadenadas)
| WS | Agent | AWUs | Depende de |
|----|-------|------|------------|
| WS-07 | Valentina | AWU-020→022 | WS-04 (Catalog schema) |

> Implementación del registro. Bloquea WS-09.

### Batch 4 — Parallel Group B (dependen de WS-07 + WS-08)
| WS | Agent | AWUs | Depende de |
|----|-------|------|------------|
| WS-09 | Valentina | AWU-028→034 | WS-07 (Registry) |
| WS-10 | Valentina | AWU-035→040 | WS-08 (Delegation arch) |
| WS-11 | Priscila+Esteban | AWU-041→044 | WS-05 (Skill) + WS-10 (Broker) |

> **3 workstreams en paralelo.** WS-09 y WS-10 son implementación independiente. WS-11 consume skill doc (WS-05) y broker (WS-10). ⚠️ Valentina aparece en 2 workstreams — no son paralelizables para el mismo agente. Ver nota abajo.

**Nota de capacidad**: WS-09 y WS-10 ambos asignados a Valentina. Si la capacidad de Valentina es 1 workstream a la vez, ejecutar secuencialmente: WS-09 → WS-10. WS-11 puede ejecutarse en paralelo con cualquiera de los dos (agentes distintos: Priscila y Esteban).

### Batch 5 — Parallel Group C (dependen de Batch 4)
| WS | Agent | AWUs | Depende de |
|----|-------|------|------------|
| WS-12 | Diana 🔒 | AWU-045→048 | WS-09 + WS-10 |
| WS-13 | Priscila | AWU-049→052 | WS-09 + WS-10 + WS-11 |

> Diana audita seguridad (read-only), Priscila escribe documentación. Sin contención de recursos.

### Batch 6 — Testing (depende de Batch 4 + Batch 5)
| WS | Agent | AWUs | Depende de |
|----|-------|------|------------|
| WS-14 | Teresa + Priya | AWU-053→064 | WS-07, WS-09, WS-10, WS-11, WS-12, WS-13 |

> Teresa genera y ejecuta tests. Priya revisa estrategia al final.

### Batch 7 — Final Gates (secuencial)
| WS | Agent | AWUs | Depende de |
|----|-------|------|------------|
| WS-15 | Daneel + Manu 👑 | AWU-065→069 | WS-14 + WS-12 + WS-13 |
| WS-16 | Elena | AWU-070→071 | WS-15 |

---

## Critical Path

```
WS-01 → WS-04 → WS-07 → WS-09 → WS-12 → WS-14 → WS-15 → WS-16
                      ↘ WS-10 → WS-12
```

**Critical Path AWUs**: 4 + 4 + 3 + 7 + 4 + 12 + 5 + 2 = **41 AWUs** en el critical path si Valentina ejecuta WS-09 y WS-10 secuencialmente.
**Critical Path AWUs (con paralelismo interno)**: ~**18 AWUs** equivalentes.

---

## Total Resource Estimation

| Métrica | Valor |
|---------|-------|
| **Total Workstreams** | 16 |
| **Total AWUs** | 71 |
| **Batches** | 8 (0 a 7) |
| **Parallel Groups** | 3 (Batch 1: 5 WS, Batch 4: 2-3 WS, Batch 5: 2 WS) |
| **Agentes requeridos** | 19 (Esteban, Manu, Aurora, Aisha, Priscila, Isla, Elena, Valentina, Diana, Teresa, Priya, Daneel) |
| **Agentes con múltiples asignaciones** | Valentina (WS-07, WS-09, WS-10), Priscila (WS-05, WS-11, WS-13), Esteban (WS-01, WS-11), Elena (WS-06, WS-16), Manu (WS-02, WS-15), Aurora (WS-03) |
| **Max agentes en paralelo** | 5 (Batch 1) |
| **Modo de entrega** | full (sdd → bdd → tdd → implementation → review → security → validation → docs) |
| **Policy** | conservative (all gates required, security + architect review mandatory) |

---

## Coverage Matrix: ACs → Workstreams

| AC | Descripción breve | Workstream(s) |
|----|-------------------|---------------|
| AC-1 | Catálogo canónico | WS-04 (schema), WS-07 (impl) |
| AC-2 | /araya:man lista capacidades | WS-09 |
| AC-3 | /araya:man <función> detalle | WS-04 (schema), WS-09 (impl) |
| AC-4 | /araya:man <agente> detalle | WS-04 (schema), WS-09 (impl) |
| AC-5 | --help en cada comando | WS-09 |
| AC-6 | Ayuda validada contra registro real | WS-07, WS-09 |
| AC-7 | Error claro para inexistente | WS-09 |
| AC-8 | Búsqueda por keyword/dominio/agente/skill | WS-04 (schema), WS-09 (impl) |
| AC-9 | Skill transversal creada | WS-05 |
| AC-10 | Todos los agentes heredan la skill | WS-11 |
| AC-11 | Validación falla si nuevo agente sin skill | WS-11 |
| AC-12 | Agente consulta antes de improvisar | WS-05, WS-11 |
| AC-13 | Sonia delega en especialistas | WS-08, WS-10, WS-11 |
| AC-14 | Test: Sonia no ejecuta trabajo de especialista | WS-14 |
| AC-15 | Excepciones requieren evidencia | WS-08, WS-10 |
| AC-16 | Aurora determina elegibilidad | WS-03, WS-11 |
| AC-17 | Agentes descubren capacidades fuera de su prompt | WS-14 |
| AC-18 | Ningún agente inventa comandos/agentes | WS-14 |
| AC-19 | Agente busca antes de proponer duplicado | WS-14 |
| AC-20 | Documentación cubre todos los runtimes | WS-13 |
| AC-21 | Respeta frontera público/privado | WS-04, WS-07, WS-12 |
| AC-22 | Tests unitarios, integración, regresión, doc | WS-14 |
| AC-23 | Daneel verifica catálogo = repository truth | WS-15 |
| AC-24 | Entrega identifica estado real en todos los branches | WS-15 |
| AC-25 | Capacidad no entregada hasta demo completa | WS-15 |

| DI | Descripción breve | Workstream(s) |
|----|-------------------|---------------|
| DI-001 | Broker/orquestador de delegación | WS-08, WS-10 |
| DI-002 | Independencia del runtime | WS-08, WS-10 |
| DI-003 | Capacidades mínimas del broker | WS-08, WS-10 |
| DI-004 | Protección contra recursión | WS-08, WS-10 |
| DI-005 | Separación orden/ejecución | WS-08, WS-10 |
| DI-006 | Criterios de verificación de infraestructura | WS-08, WS-10, WS-14 |

---

## Risk Register

| ID | Riesgo | Probabilidad | Impacto | Mitigación | Owner |
|----|--------|-------------|---------|------------|-------|
| R-01 | Valentina es bottleneck (WS-07, WS-09, WS-10) | Alta | Medio | Secuenciar WS-07 → WS-09 → WS-10. Isla mantiene ownership del core del broker; Valentina implementa solo la capa API. Neo pendiente de verificación por Aurora | Sonia |
| R-02 | Daneel no tiene prompt completo para verificación | Media | Alto | Usar reality-verification skill; escalar a The Data Professor si es insuficiente | Aurora |
| R-03 | Skill no cubre todos los runtimes (pi, Codex, Claude, AGY) | Media | Medio | Priscila documenta diferencias por runtime en AWU-052 | Priscila |
| R-04 | Catálogo se desincroniza de fuentes reales | Media | Alto | Validación automática en AWU-022; Daneel verifica en AWU-065 | Valentina, Daneel |
| R-05 | Broker introduce latencia en delegaciones | Baja | Medio | Diseñar con timeouts configurables; performance test en WS-14 | Isla, Teresa |
| R-06 | Diana encuentra vulnerabilidad crítica en broker | Baja | Crítico | HALT inmediato; fix antes de continuar | Diana |
| R-07 | Manu rechaza en pre-delivery validation | Baja | Alto | DRR → IAR → CR → re-enrutar por SDLC | Sonia, Manu |
| R-08 | Agentes no pueden descubrir capacidades (AC-17 falla) | Media | Alto | Iterar sobre skill y man system hasta que el test pase | Teresa, Priscila |

---

## Agentes requeridos — Orden de invocación recomendado

1. **Esteban** (WS-01) — Auditoría y GAR. Fundacional.
2. **Manu** + **Aurora** + **Aisha** + **Priscila** + **Isla** (WS-02→05, WS-08) — Batch 1 en paralelo.
3. **Elena** (WS-06) — Process audit del plan.
4. **Valentina** (WS-07) — Registry implementation.
5. **Valentina** (WS-09) + **Priscila** + **Esteban** (WS-11) — Man system + agent integration en paralelo.
6. **Valentina** (WS-10) — Delegation implementation (puede solaparse con WS-09 si hay capacidad).
7. **Diana** (WS-12) + **Priscila** (WS-13) — Security review + docs en paralelo.
8. **Teresa** + **Priya** (WS-14) — Testing completo.
9. **Daneel** + **Manu** (WS-15) — Delivery verification.
10. **Elena** (WS-16) — Final process audit.

---

## Decision Log

| Decisión | Razón |
|----------|-------|
| WS-01 (Audit) es fundacional y secuencial | Todos los demás workstreams necesitan saber qué existe vs. qué falta |
| WS-04, WS-05, WS-08 en paralelo (Batch 1) | Son diseños independientes: schema, skill doc, arch de delegación. Sin dependencias mutuas |
| WS-09 y WS-10 ambos asignados a Valentina | Mismo agente, mismo skill set (backend). Secuenciar si capacidad = 1 |
| WS-11 depende de WS-05 + WS-10 | Necesita la skill doc final y el broker implementado para actualizar prompts |
| WS-12 y WS-13 en paralelo (Batch 5) | Diana lee (read-only), Priscila escribe docs. Sin contención |
| WS-14 es el workstream más grande (12 AWUs) | Testing cubre 25 ACs + 6 DIs. Es intensivo pero automatizable |
| Manu en WS-02 (pre) y WS-15 (post) | MANDATORY: Product Owner aprueba antes de implementar y valida entrega final |
| Daneel en WS-15 como Reality Authority | AC-23 y AC-24 requieren verificación independiente contra repository truth |

---

## Constraints recordatorias

- ❌ Sonia no ejecuta arquitectura, código, pruebas, seguridad, infraestructura, ni documentación técnica.
- ❌ Este documento es SOLO el plan. La ejecución requiere `/araya run` con este plan como input.
- ✅ Priscila escribe la skill `araya-command-and-delegation-expert` (WS-05) — Sonia no la escribe.
- ✅ Valentina implementa registry, man system, y broker — con revisión de arquitectura de Aisha e Isla.
- ✅ La skill debe asignarse a TODOS los 27 agentes sin excepción.
- ✅ El broker debe ser runtime-independent (DI-002).
- ✅ La delegación debe dejar evidencia en `.araya/runs/{run_id}/` (DI-003).

---

*Plan generado por Sonia (PM Head Orchestrator) el 2026-07-21 23:00 -04:00.*
*Próximo paso: presentar a Manu para aprobación pre-implementación (AWU-005).*
