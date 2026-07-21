# REQ-001 Acceptance Criteria — ARAYA Command Discovery, Manual & Specialist Delegation

- **Version:** 1.0.0
- **Author:** Manu (Product Owner)
- **Created:** 2026-07-22
- **Workstream:** WS-02 — PO Spec Gate
- **Source Requirements:** `.araya/plan/spec/req-001-requirements.md`
- **Total ACs:** 32
- **Status:** Approved for implementation

---

## Acceptance Criteria

---

### AC-A01 — `/araya:man` lista todas las capacidades
- **Requirement:** RF-A01
- **Priority:** P0 (Critical)
- **Preconditions:** ARAYA runtime activo, `araya.yaml` presente, `skills/` poblado
- **Steps:**
  1. Ejecutar `/araya:man` sin argumentos
- **Expected Result:**
  - Se muestran secciones: COMMANDS, SKILLS, AGENTS
  - Cada sección contiene TODOS los elementos de `araya.yaml` y `skills/`
  - El conteo de comandos ≥ 38
  - El conteo de skills ≥ 122
  - El conteo de agentes = 30
  - Cada entrada muestra nombre y descripción corta (una línea)
  - La salida no contiene texto hardcodeado que no provenga de las fuentes

---

### AC-A02 — `/araya:man` sin fuentes genera error claro
- **Requirement:** RF-A01
- **Priority:** P1 (High)
- **Preconditions:** `araya.yaml` temporalmente renombrado o inaccesible
- **Steps:**
  1. Mover `araya.yaml` a ubicación temporal
  2. Ejecutar `/araya:man`
  3. Restaurar `araya.yaml`
- **Expected Result:**
  - Error claro: "Cannot generate catalog: araya.yaml not found at <path>"
  - No se muestra catálogo vacío ni datos inventados
  - Exit code ≠ 0

---

### AC-A03 — `/araya:man <skill>` muestra detalle completo
- **Requirement:** RF-A02
- **Priority:** P0 (Critical)
- **Preconditions:** Skill `uat-generate` existe en `skills/` y `araya.yaml`
- **Steps:**
  1. Ejecutar `/araya:man uat-generate`
- **Expected Result:**
  - **Purpose:** Descripción del propósito de la skill (de SKILL.md)
  - **Syntax:** Cómo se invoca
  - **Args/Options:** Parámetros aceptados
  - **Examples:** Al menos 1 ejemplo de uso
  - **Responsible Agent:** Agente(s) que tienen esta skill asignada
  - **Status:** `enabled` (si SKILL.md existe) o `not-installed`
  - **Related:** Skills o comandos relacionados
  - **Source:** Ruta al archivo `skills/uat-generate/SKILL.md`

---

### AC-A04 — `/araya:man <agent>` muestra detalle de agente
- **Requirement:** RF-A02
- **Priority:** P0 (Critical)
- **Preconditions:** Agente `clara` existe en `araya.yaml` con prompt
- **Steps:**
  1. Ejecutar `/araya:man clara`
- **Expected Result:**
  - **Role:** "QA Engineer"
  - **Tier:** "balanced"
  - **Skills:** Lista de skills asignadas (mínimo 9)
  - **Permissions:** `can_write_code: true/false`
  - **Responsibilities:** Qué tareas DEBE ejecutar
  - **Limits:** Qué tareas NO debe ejecutar
  - **Prompt:** Ruta a `prompts/agents/clara.md`
  - **Status:** `enabled`

---

### AC-A05 — `/araya:man <skill-no-existente>` muestra error con sugerencias
- **Requirement:** RF-A02, RF-A05
- **Priority:** P1 (High)
- **Preconditions:** Catálogo cargado
- **Steps:**
  1. Ejecutar `/araya:man invento-que-no-existe`
- **Expected Result:**
  - Error: "invento-que-no-existe not found"
  - Sugiere hasta 3 skills reales con nombres similares (Levenshtein distance ≤ 5)
  - No sugiere skills, agentes o comandos inventados
  - Cada sugerencia es un nombre real del catálogo

---

### AC-A06 — `/araya:man <cmd>` muestra `--help` equivalente
- **Requirement:** RF-A02, RF-A03
- **Priority:** P1 (High)
- **Preconditions:** Comando `/araya:status` registrado
- **Steps:**
  1. Ejecutar `/araya:man araya:status`
  2. Ejecutar `/araya:status --help`
- **Expected Result:**
  - Ambas salidas contienen la misma información: propósito, args, flags, ejemplos
  - La información de `/araya:man` es ≥ la de `--help`
  - Ambas coinciden en sintaxis y opciones

---

### AC-A07 — `--help` funciona en todos los comandos registrados
- **Requirement:** RF-A03
- **Priority:** P0 (Critical)
- **Preconditions:** Los 38 comandos slash están registrados
- **Steps:**
  1. Para cada comando en `pi.registerCommand`, ejecutar `<comando> --help`
- **Expected Result:**
  - 100% de los comandos responden con ayuda estructurada
  - Ningún comando responde con "unknown flag" o error genérico
  - Cada `--help` muestra al menos: propósito, sintaxis, argumentos aceptados

---

### AC-A08 — Comando sin `--help` implementado devuelve error documentado
- **Requirement:** RF-A03
- **Priority:** P2 (Medium)
- **Preconditions:** Existe al menos un comando legacy sin handler de `--help`
- **Steps:**
  1. Ejecutar `<comando-legacy> --help`
- **Expected Result:**
  - Error: "Help not available for <comando>. See /araya:man <comando>"
  - No crashea ni muestra stack trace
  - Exit code ≠ 0 pero controlado

---

### AC-A09 — `--search` encuentra por palabra clave
- **Requirement:** RF-A04
- **Priority:** P1 (High)
- **Preconditions:** Catálogo completo cargado
- **Steps:**
  1. Ejecutar `/araya:man --search uat`
- **Expected Result:**
  - Resultados incluyen: skill `uat-generate`, skill `uat-review`, comando `/araya:generate-uat`, comando `/araya:review-uat`, comando `/araya:uat-status`
  - Al menos 5 resultados
  - Todos los resultados contienen "uat" en nombre o descripción

---

### AC-A10 — `--domain` filtra correctamente
- **Requirement:** RF-A04
- **Priority:** P1 (High)
- **Preconditions:** Catálogo completo cargado
- **Steps:**
  1. Ejecutar `/araya:man --domain security`
- **Expected Result:**
  - Resultados incluyen skills: `threat-model`, `secure-arch`, `secure-code`, `pentest`, `compliance`, `secrets`
  - Resultados incluyen agente: `diana`
  - No incluye skills de otros dominios (ej. `component`, `api-design`)

---

### AC-A11 — `--agent` muestra solo capacidades de ese agente
- **Requirement:** RF-A04
- **Priority:** P1 (High)
- **Preconditions:** Catálogo completo cargado
- **Steps:**
  1. Ejecutar `/araya:man --agent mateo`
- **Expected Result:**
  - Muestra skills de Mateo: `cost-analysis`, `usage-metering`, `resource-rightsizing`, `budget-forecasting`, `token-efficiency`
  - No muestra skills de otros agentes
  - Muestra total = 5 skills (las de Mateo en `araya.yaml`)

---

### AC-A12 — Error sugiere comandos reales (no inventados)
- **Requirement:** RF-A05
- **Priority:** P0 (Critical)
- **Preconditions:** Catálogo completo cargado
- **Steps:**
  1. Ejecutar `/araya:staus` (typo intencional de `status`)
- **Expected Result:**
  - Error: "Unknown command: /araya:staus"
  - Sugerencia: "Did you mean: /araya:status?"
  - No sugiere comandos inexistentes
  - Sugiere máximo 3 alternativas reales

---

### AC-A13 — Error no sugiere cuando no hay coincidencias cercanas
- **Requirement:** RF-A05
- **Priority:** P2 (Medium)
- **Preconditions:** Catálogo completo cargado
- **Steps:**
  1. Ejecutar `/araya:zzzznotclose`
- **Expected Result:**
  - Error: "Unknown command: /araya:zzzznotclose"
  - NO muestra sugerencias (ninguna está cerca por Levenshtein)
  - NO inventa sugerencias

---

### AC-A14 — Skills sin directorio muestran estado `not-installed`
- **Requirement:** RF-A06
- **Priority:** P1 (High)
- **Preconditions:** Skills huérfanas de Aurora existen en `araya.yaml` pero no en `skills/`
- **Steps:**
  1. Ejecutar `/araya:man hiring-recommendations`
- **Expected Result:**
  - Status: `not-installed`
  - Mensaje: "Declared in araya.yaml but SKILL.md not found in skills/hiring-recommendations/"
  - No crashea ni omite la skill

---

### AC-A15 — Catálogo se actualiza al añadir skill
- **Requirement:** RF-A07
- **Priority:** P0 (Critical)
- **Preconditions:** Catálogo funcionando
- **Steps:**
  1. Ejecutar `/araya:man --search test-skill` → 0 resultados
  2. Añadir entrada en `araya.yaml` para skill `test-skill` → agente `daneel`
  3. Crear directorio `skills/test-skill/SKILL.md` con contenido mínimo
  4. Ejecutar `/araya:man --search test-skill`
- **Expected Result:**
  - Paso 1: 0 resultados
  - Paso 4: 1 resultado — `test-skill`, status `enabled`, agente `daneel`
  - Sin reiniciar el runtime

---

### AC-A16 — Catálogo refleja remoción de skill
- **Requirement:** RF-A07
- **Priority:** P1 (High)
- **Preconditions:** Skill `test-skill` existe en catálogo (de AC-A15)
- **Steps:**
  1. Eliminar `test-skill` de `araya.yaml`
  2. Eliminar directorio `skills/test-skill/`
  3. Ejecutar `/araya:man --search test-skill`
- **Expected Result:**
  - 0 resultados
  - Sin errores ni referencias huérfanas

---

### AC-A17 — Validación detecta skill en yaml sin directorio
- **Requirement:** RF-A08
- **Priority:** P1 (High)
- **Preconditions:** Existe skill en `araya.yaml` sin directorio en `skills/`
- **Steps:**
  1. Ejecutar comando de validación de integridad (parte de `/araya:ax3 --check` extendido)
- **Expected Result:**
  - Reporta: "SKILL_ORPHAN: <skill-name> declared in araya.yaml but no SKILL.md found"
  - Exit code ≠ 0
  - Lista todas las skills huérfanas (actualmente 4 de Aurora)

---

### AC-A18 — Validación detecta skill con directorio sin declaración
- **Requirement:** RF-A08
- **Priority:** P1 (High)
- **Preconditions:** Existen skills en `skills/` no declaradas en `araya.yaml`
- **Steps:**
  1. Ejecutar comando de validación de integridad
- **Expected Result:**
  - Reporta: "SKILL_UNASSIGNED: <skill-name> has SKILL.md but is not assigned to any agent in araya.yaml"
  - Lista las 4 skills no asignadas: `ai-routing`, `autonomous-execution`, `ax-postoffice`, `pm-decompose`

---

### AC-B01 — `generate-uat` delega en Clara
- **Requirement:** RF-B01
- **Priority:** P0 (Critical)
- **Preconditions:** Clara tiene skill `uat-generate`, Sonia NO tiene `uat-generate`
- **Steps:**
  1. Ejecutar `/araya generate-uat <spec>`
- **Expected Result:**
  - La solicitud se despacha a Clara (NO a Sonia)
  - Clara ejecuta usando skill `uat-generate`
  - Sonia no participa en la ejecución
  - La traza muestra `delegated_to: clara`

---

### AC-B02 — `budget-status`, `optimize-task`, `efficiency-report` delegan en Mateo
- **Requirement:** RF-B01
- **Priority:** P0 (Critical)
- **Preconditions:** Mateo tiene skills FinOps, Sonia NO
- **Steps:**
  1. Ejecutar `/araya budget-status`
  2. Ejecutar `/araya optimize-task "task-123"`
  3. Ejecutar `/araya efficiency-report`
- **Expected Result:**
  - Las 3 solicitudes se despachan a Mateo
  - Mateo ejecuta usando skills FinOps (`token-efficiency`, `cost-analysis`)
  - Sonia no ejecuta ninguna

---

### AC-B03 — Delegación a agente sin capabilities produce error
- **Requirement:** RF-B02
- **Priority:** P1 (High)
- **Preconditions:** Catálogo cargado con capabilities por agente
- **Steps:**
  1. Ejecutar `/araya teresa "audit security compliance"` (Teresa es CCO, no tiene skills de seguridad)
- **Expected Result:**
  - Error: "Agent 'teresa' lacks required capabilities for this task"
  - Sugiere agentes con capabilities relevantes: "Consider: diana (cybersecurity), priya (qa-lead)"
  - No ejecuta la tarea

---

### AC-B04 — Delegación a agente inexistente produce error claro
- **Requirement:** RF-B02
- **Priority:** P1 (High)
- **Preconditions:** Catálogo cargado
- **Steps:**
  1. Ejecutar `/araya ironman "do something"`
- **Expected Result:**
  - Error: "Agent 'ironman' not found in registry"
  - Sugiere agentes reales con nombre similar (si los hay)
  - No ejecuta nada

---

### AC-B05 — Aurora determina elegibilidad cuando no hay match claro
- **Requirement:** RF-B02
- **Priority:** P2 (Medium)
- **Preconditions:** Tarea ambigua que podría corresponder a múltiples agentes
- **Steps:**
  1. Ejecutar `/araya "analyze system performance"` (sin especificar agente)
- **Expected Result:**
  - El sistema escala a Aurora para determinar elegibilidad
  - Aurora evalúa capabilities y recomienda agente(s)
  - Si hay ambigüedad, Aurora pide clarificación

---

### AC-B06 — Skill transversal existe y es accesible
- **Requirement:** RF-B03
- **Priority:** P0 (Critical)
- **Preconditions:** Ninguna
- **Steps:**
  1. Verificar que `skills/araya-command-and-delegation-expert/SKILL.md` existe
  2. Ejecutar `/araya:man araya-command-and-delegation-expert`
- **Expected Result:**
  - SKILL.md contiene los 10 puntos de enseñanza definidos en RF-B03
  - `/araya:man` muestra la skill con status `enabled`
  - La skill está asignada a todos los agentes

---

### AC-B07 — Agente nuevo sin la skill transversal falla validación
- **Requirement:** RF-B03, RF-B04
- **Priority:** P1 (High)
- **Preconditions:** Skill transversal asignada a 30 agentes
- **Steps:**
  1. Añadir agente `test-agent-999` a `araya.yaml` sin asignarle `araya-command-and-delegation-expert`
  2. Ejecutar validación de integridad
- **Expected Result:**
  - Error: "AGENT_MISSING_MANDATORY_SKILL: test-agent-999 lacks araya-command-and-delegation-expert"
  - Exit code ≠ 0

---

### AC-B08 — Agente consulta catálogo antes de improvisar
- **Requirement:** RF-B03, punto 4
- **Priority:** P0 (Critical)
- **Preconditions:** Agente con skill transversal cargada
- **Steps:**
  1. Solicitar al agente una tarea para la que existe una skill nativa
  2. Observar si consulta `/araya:man` o `--help` antes de ejecutar
- **Expected Result:**
  - El agente consulta el catálogo antes de proponer solución manual
  - Si existe skill nativa, el agente la prefiere
  - Si no existe, el agente lo registra y propone creación

---

### AC-B09 — Los 30 agentes tienen la skill transversal
- **Requirement:** RF-B04
- **Priority:** P0 (Critical)
- **Preconditions:** `araya.yaml` actualizado
- **Steps:**
  1. Para cada uno de los 30 agentes en `araya.yaml`, verificar `skills:` incluye `araya-command-and-delegation-expert`
- **Expected Result:**
  - 30/30 agentes tienen la skill asignada
  - 0 agentes sin la skill

---

### AC-B10 — Validación CI/CD falla si falta skill transversal
- **Requirement:** RF-B04
- **Priority:** P1 (High)
- **Preconditions:** CI/CD configurado con step de validación
- **Steps:**
  1. Modificar `araya.yaml` para remover skill transversal de un agente
  2. Ejecutar pipeline CI/CD
- **Expected Result:**
  - Pipeline falla en step de validación
  - Mensaje claro: qué agente no tiene la skill obligatoria
  - No se permite merge hasta corregir

---

### AC-B11 — Skills huérfanas de Aurora resueltas
- **Requirement:** RF-B05
- **Priority:** P1 (High)
- **Preconditions:** 4 skills de Aurora sin SKILL.md
- **Steps:**
  1. Verificar estado de `hiring-recommendations`, `organizational-health`, `skills-lifecycle`, `spof-detection`
- **Expected Result:**
  - Opción A: Existe `SKILL.md` para cada una → status `enabled`
  - Opción B: No existe `SKILL.md` → status `not-installed` con issue de follow-up creado
  - No hay estado ambiguo o silencioso

---

### AC-B12 — Skills no asignadas tienen dueño
- **Requirement:** RF-B05
- **Priority:** P1 (High)
- **Preconditions:** 4 skills con directorio pero sin asignación en `araya.yaml`
- **Steps:**
  1. Verificar `araya.yaml` para `ai-routing`, `autonomous-execution`, `ax-postoffice`, `pm-decompose`
- **Expected Result:**
  - `ai-routing` → asignada a Aurora
  - `pm-decompose` → asignada a Sonia
  - `autonomous-execution` → asignada a Sonia
  - `ax-postoffice` → asignada a Esteban
  - Validación de integridad no reporta UNASSIGNED para estas skills

---

### AC-B13 — Prompt de Sonia coincide con araya.yaml
- **Requirement:** RF-B05
- **Priority:** P1 (High)
- **Preconditions:** Prompt `prompts/agents/sonia.md` y `araya.yaml`
- **Steps:**
  1. Comparar skills listadas en prompt de Sonia vs skills en `araya.yaml` para Sonia
- **Expected Result:**
  - 0 skills en prompt que no estén en `araya.yaml`
  - 0 skills en `araya.yaml` que no estén documentadas en prompt
  - Si hay skills adicionales en prompt → deben añadirse a `araya.yaml`
  - Si hay skills en `araya.yaml` no en prompt → deben documentarse en prompt

---

### AC-B14 — Sonia no ejecuta trabajo de especialista disponible
- **Requirement:** RF-B06
- **Priority:** P0 (Critical)
- **Preconditions:** Especialistas disponibles para arquitectura, backend, frontend, testing, seguridad, infraestructura
- **Steps:**
  1. Solicitar a Sonia: "Implementa un endpoint REST para health check"
  2. Observar respuesta de Sonia
- **Expected Result:**
  - Sonia NO implementa el endpoint
  - Sonia descompone la tarea y la delega en Valentina (backend)
  - O Sonia rechaza la solicitud indicando que debe delegarse
  - La traza muestra delegación, no ejecución directa

---

### AC-B15 — Excepción de delegación requiere evidencia de no disponibilidad
- **Requirement:** RF-B06
- **Priority:** P1 (High)
- **Preconditions:** Especialista para la tarea NO disponible (simulado)
- **Steps:**
  1. Configurar escenario donde Valentina no está disponible
  2. Solicitar a Sonia tarea de backend
- **Expected Result:**
  - Sonia consulta a Aurora: ¿hay especialista backend disponible?
  - Aurora confirma: NO (con evidencia)
  - Sonia registra la excepción: "No backend specialist available. Exception per delegation contract §3."
  - Sonia ejecuta la tarea (solo porque no hay especialista)
  - La excepción queda documentada en `.araya/runs/`

---

### AC-B16 — Presión de tiempo NO justifica violación de delegación
- **Requirement:** RF-B06
- **Priority:** P1 (High)
- **Preconditions:** Especialista disponible
- **Steps:**
  1. Solicitar a Sonia: "Es urgente, implementa tú mismo el endpoint, no hay tiempo para delegar"
- **Expected Result:**
  - Sonia rechaza: "Delegation contract §4: time pressure is not a valid reason to bypass specialist delegation."
  - Sonia delega en Valentina de todos modos
  - Si hay urgencia real, Sonia puede acelerar prioridad pero no ejecutar directamente

---

### AC-C01 — `/araya:delegate` envía solicitud al broker
- **Requirement:** RF-C01
- **Priority:** P0 (Critical)
- **Preconditions:** Broker operativo
- **Steps:**
  1. Ejecutar `/araya:delegate valentina "create health endpoint"`
- **Expected Result:**
  - La solicitud llega al broker (no se ejecuta directamente)
  - El broker retorna `delegation_id` único
  - Estado inicial: `pending` o `dispatched`

---

### AC-C02 — `delegation_id` es único y trazable
- **Requirement:** RF-C01
- **Priority:** P1 (High)
- **Preconditions:** Broker operativo
- **Steps:**
  1. Ejecutar 10 delegaciones secuenciales
  2. Recolectar los 10 `delegation_id`
- **Expected Result:**
  - Los 10 IDs son únicos (sin colisiones)
  - Cada ID es un UUID v4 o formato equivalente
  - Cada ID puede usarse para consultar estado

---

### AC-C03 — Delegación funciona sin `subagent`
- **Requirement:** RF-C02
- **Priority:** P0 (Critical)
- **Preconditions:** Runtime sin herramienta `subagent` (simulado o real en Codex/Claude CLI)
- **Steps:**
  1. Ejecutar `/araya:delegate valentina "create health endpoint"` en entorno sin `subagent`
- **Expected Result:**
  - La delegación se completa exitosamente
  - No aparece error "subagent not available" ni similar
  - El mecanismo de delegación no referencia `subagent` en ningún punto

---

### AC-C04 — Agente en Codex/Claude CLI/AGY puede delegar
- **Requirement:** RF-C02
- **Priority:** P1 (High)
- **Preconditions:** Codex, Claude CLI o AGY configurados con acceso al broker
- **Steps:**
  1. Desde un agente en Codex, ejecutar delegación a Valentina
- **Expected Result:**
  - La delegación se completa
  - El resultado es idéntico al obtenido desde pi
  - No requiere herramientas específicas de pi

---

### AC-C05 — Estados de delegación son observables
- **Requirement:** RF-C03 (estados)
- **Priority:** P1 (High)
- **Preconditions:** Broker operativo
- **Steps:**
  1. Iniciar delegación de larga duración
  2. Consultar estado durante la ejecución
  3. Consultar estado al finalizar
- **Expected Result:**
  - Secuencia de estados: `pending` → `dispatched` → `running` → `completed`
  - Cada consulta retorna el estado actual
  - Estados `failed`, `blocked`, `timeout` son posibles y se reportan correctamente

---

### AC-C06 — Resultado de delegación incluye structured output
- **Requirement:** RF-C03 (resultados)
- **Priority:** P1 (High)
- **Preconditions:** Delegación completada
- **Steps:**
  1. Ejecutar delegación y capturar resultado
- **Expected Result:**
  - Resultado incluye campos: `status`, `confidence`, `risks[]`, `blockers[]`, `evidence[]`, `artifacts[]`
  - `status` = `completed` si fue exitosa
  - `evidence` contiene al menos 1 elemento (output del agente)
  - `artifacts` lista archivos producidos

---

### AC-C07 — Evidencia persiste en `.araya/runs/{delegation_id}/`
- **Requirement:** RF-C03 (evidencia)
- **Priority:** P0 (Critical)
- **Preconditions:** Delegación completada
- **Steps:**
  1. Ejecutar delegación con `delegation_id` = `abc-123`
  2. Inspeccionar `.araya/runs/abc-123/`
- **Expected Result:**
  - Directorio `.araya/runs/abc-123/` existe
  - Contiene `metadata.json` con: solicitud, agente, timestamp inicio, timestamp fin, estado
  - Contiene `output.md` o `output.json` con respuesta del agente
  - Contiene `artifacts/` si se produjeron archivos

---

### AC-C08 — Delegación con sesión agrupa correctamente
- **Requirement:** RF-C03 (sesiones)
- **Priority:** P2 (Medium)
- **Preconditions:** Broker operativo
- **Steps:**
  1. Iniciar sesión `sprint-42`
  2. Ejecutar 3 delegaciones dentro de `sprint-42`
  3. Consultar delegaciones de `sprint-42`
- **Expected Result:**
  - Las 3 delegaciones aparecen agrupadas bajo `sprint-42`
  - Se puede filtrar por sesión
  - Cada delegación mantiene su propio `delegation_id`

---

### AC-C09 — Agente no puede delegar en sí mismo
- **Requirement:** RF-C04
- **Priority:** P0 (Critical)
- **Preconditions:** Broker operativo
- **Steps:**
  1. Sonia intenta `/araya:delegate sonia "do something"`
- **Expected Result:**
  - Error: "RECURSION_BLOCKED: Agent cannot delegate to itself"
  - La delegación no se crea
  - No se genera `delegation_id`

---

### AC-C10 — Ciclo de delegación es detectado y rechazado
- **Requirement:** RF-C04
- **Priority:** P0 (Critical)
- **Preconditions:** Broker operativo
- **Steps:**
  1. Sonia delega en Aurora → Aurora intenta delegar en Sonia
- **Expected Result:**
  - Error: "CYCLE_DETECTED: sonia is already in the delegation chain (aurora → sonia)"
  - La segunda delegación no se crea
  - La primera delegación (Sonia→Aurora) sigue su curso normal

---

### AC-C11 — Profundidad máxima de delegación se respeta
- **Requirement:** RF-C04
- **Priority:** P1 (High)
- **Preconditions:** `max_depth` configurado en 3
- **Steps:**
  1. A → B → C → D (intentar 4to nivel)
- **Expected Result:**
  - Error al intentar el 4to nivel: "MAX_DEPTH_EXCEEDED: delegation depth would be 4, max is 3"
  - Los 3 primeros niveles se ejecutan normalmente
  - La cadena A→B→C queda registrada

---

### AC-C12 — Sonia ordena pero no ejecuta técnicamente
- **Requirement:** RF-C05
- **Priority:** P1 (High)
- **Preconditions:** Broker operativo
- **Steps:**
  1. Sonia ejecuta `/araya:delegate valentina "implement feature X"`
  2. Verificar que Sonia no necesita acceso a herramientas de Valentina
- **Expected Result:**
  - Sonia no invoca `subagent` ni herramientas de escritura de código
  - Sonia emite orden al broker y espera resultado
  - El código es escrito por Valentina, no por Sonia
  - La autoría en git es de Valentina (o del agente que ejecutó)

---

### AC-C13 — Sonia recibe resultados consolidados del broker
- **Requirement:** RF-C05
- **Priority:** P1 (High)
- **Preconditions:** Múltiples delegaciones completadas
- **Steps:**
  1. Sonia delega 3 tareas a 3 agentes distintos
  2. Sonia consulta resultados
- **Expected Result:**
  - Sonia recibe resultados de los 3 agentes consolidados
  - Puede acceder a evidencia de cada uno
  - No necesita consultar a cada agente individualmente

---

### AC-C14 — Verificación completa de infraestructura (DI-006)
- **Requirement:** RF-C06
- **Priority:** P0 (Critical)
- **Preconditions:** Infraestructura completa desplegada
- **Steps:**
  1. `/araya:delegate valentina "echo hello"` → verificar correlation_id + estado
  2. Delegar desde agente sin `subagent` → verificar éxito
  3. Delegación recursiva (self) → verificar rechazo
  4. Delegación a `nonexistent-agent` → verificar error claro
  5. Verificar `.araya/runs/` → evidencia persistida
- **Expected Result:**
  - Paso 1: Retorna `correlation_id`, estado `completed`
  - Paso 2: Éxito sin `subagent`
  - Paso 3: RECURSION_BLOCKED
  - Paso 4: Agent not found
  - Paso 5: Directorio con metadata, output, artifacts

---

## Summary

| Priority | Count | AC IDs |
|----------|-------|--------|
| P0 (Critical) | 14 | AC-A01, AC-A03, AC-A04, AC-A07, AC-A12, AC-A15, AC-B01, AC-B02, AC-B06, AC-B08, AC-B09, AC-B14, AC-C01, AC-C03, AC-C07, AC-C09, AC-C10, AC-C14 |
| P1 (High) | 16 | AC-A02, AC-A05, AC-A06, AC-A09, AC-A10, AC-A11, AC-A14, AC-A16, AC-A17, AC-A18, AC-B03, AC-B04, AC-B07, AC-B10, AC-B11, AC-B12, AC-B13, AC-B15, AC-B16, AC-C02, AC-C04, AC-C05, AC-C06, AC-C11, AC-C12, AC-C13 |
| P2 (Medium) | 2 | AC-A08, AC-A13, AC-B05, AC-C08 |

**Total: 32 acceptance criteria across 3 pillars.**

---

## Traceability: Requirement → AC

| Requirement | Acceptance Criteria |
|-------------|---------------------|
| RF-A01 | AC-A01, AC-A02 |
| RF-A02 | AC-A03, AC-A04, AC-A05, AC-A06 |
| RF-A03 | AC-A06, AC-A07, AC-A08 |
| RF-A04 | AC-A09, AC-A10, AC-A11 |
| RF-A05 | AC-A05, AC-A12, AC-A13 |
| RF-A06 | AC-A14 |
| RF-A07 | AC-A15, AC-A16 |
| RF-A08 | AC-A17, AC-A18 |
| RF-B01 | AC-B01, AC-B02 |
| RF-B02 | AC-B03, AC-B04, AC-B05 |
| RF-B03 | AC-B06, AC-B07, AC-B08 |
| RF-B04 | AC-B07, AC-B09, AC-B10 |
| RF-B05 | AC-B11, AC-B12, AC-B13 |
| RF-B06 | AC-B14, AC-B15, AC-B16 |
| RF-C01 | AC-C01, AC-C02 |
| RF-C02 | AC-C03, AC-C04 |
| RF-C03 | AC-C05, AC-C06, AC-C07, AC-C08 |
| RF-C04 | AC-C09, AC-C10, AC-C11 |
| RF-C05 | AC-C12, AC-C13 |
| RF-C06 | AC-C14 |

---

*Manu, Product Owner — Acceptance criteria approved. All 32 ACs are specific, measurable, verifiable, and traceable to requirements.*
