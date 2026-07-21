# REQ-001 Requirements — ARAYA Command Discovery, Manual & Specialist Delegation

- **Version:** 1.0.0
- **Author:** Manu (Product Owner)
- **Created:** 2026-07-22
- **Workstream:** WS-02 — PO Spec Gate
- **Source Vision:** `.araya/plan/spec/req-001-vision.md`
- **Status:** Approved for implementation

---

## Functional Requirements

### Pilar A — Discovery & Manual

---

#### RF-A01 — Comando `/araya:man`
**Description:** Debe existir un comando `/araya:man` que liste todas las capacidades
disponibles de ARAYA: comandos, funciones, skills y agentes.

**Priority:** High
**Acceptance Criteria:** AC-A01, AC-A02

---

#### RF-A02 — Detalle de capacidad (`/araya:man <target>`)
**Description:** `/araya:man <comando|agente|skill>` debe mostrar:
- Propósito y descripción
- Sintaxis, argumentos, opciones
- Ejemplos de uso
- Precondiciones y permisos requeridos
- Restricciones y efectos secundarios
- Agente especialista responsable (si aplica)
- Estado: `enabled`, `disabled`, `deprecated`, `not-installed`
- Capacidades relacionadas o alternativas
- Enlace al archivo fuente en el repositorio

**Priority:** High
**Acceptance Criteria:** AC-A03, AC-A04, AC-A05, AC-A06

---

#### RF-A03 — `--help` por comando
**Description:** Todo comando registrado vía `pi.registerCommand` debe soportar el
flag `--help` mostrando ayuda estructurada (args, flags, examples). Comandos que
deleguen en agentes deben propagar `--help` al agente destino cuando corresponda.

**Priority:** High
**Acceptance Criteria:** AC-A07, AC-A08

---

#### RF-A04 — Búsqueda de capacidades
**Description:** `/araya:man` debe soportar filtros de búsqueda:
- `--search <keyword>` — búsqueda textual en nombre, descripción, propósito
- `--domain <domain>` — filtrar por dominio (backend, frontend, security, FinOps, etc.)
- `--agent <agent>` — mostrar capacidades de un agente específico
- `--skill <skill>` — mostrar qué agentes tienen una skill

**Priority:** High
**Acceptance Criteria:** AC-A09, AC-A10, AC-A11

---

#### RF-A05 — Errores inteligentes
**Description:** Cuando un comando, agente o skill no existe, el sistema debe:
- Mostrar un error claro indicando que no se encontró
- Sugerir los 3 elementos más cercanos por distancia Levenshtein
- No inventar comandos, agentes, ni sugerir elementos inexistentes

**Priority:** High
**Acceptance Criteria:** AC-A12, AC-A13

---

#### RF-A06 — Indicadores de estado
**Description:** Cada capacidad debe mostrar su estado actual:
- `enabled` — disponible y funcional
- `disabled` — existe pero está deshabilitada
- `deprecated` — será removida en una versión futura
- `not-installed` — declarada pero no implementada (skill sin directorio)

**Priority:** Medium
**Acceptance Criteria:** AC-A14

---

#### RF-A07 — Generación automática del catálogo
**Description:** El catálogo de `/araya:man` debe generarse en runtime desde las
fuentes de verdad del repositorio:
- `araya.yaml` — comandos, agentes, skills asignadas
- `skills/` — directorios de skills con `SKILL.md`
- `prompts/agents/` — archivos de prompt por agente

No debe contener texto hardcodeado que pueda divergir de las fuentes.

**Priority:** High
**Acceptance Criteria:** AC-A15, AC-A16

---

#### RF-A08 — Validación de integridad del catálogo
**Description:** Debe existir un mecanismo para validar que el catálogo es
consistente con las fuentes de verdad:
- Skills en `araya.yaml` con directorio en `skills/`
- Skills con directorio en `skills/` declaradas en `araya.yaml`
- Skills en prompts de agentes declaradas en `araya.yaml`
- Agentes con archivo de prompt en `prompts/agents/`

**Priority:** High
**Acceptance Criteria:** AC-A17, AC-A18

---

### Pilar B — Specialist Delegation

---

#### RF-B01 — Corrección de rutas de delegación
**Description:** Las rutas de SUBCOMMAND_ROUTES deben reasignarse al agente
especialista correcto:

| Ruta | Agente actual | Agente correcto | Skills relevantes |
|------|--------------|-----------------|-------------------|
| `generate-uat` | sonia | clara | uat-generate |
| `budget-status` | sonia | mateo | token-efficiency |
| `optimize-task` | sonia | mateo | token-efficiency |
| `efficiency-report` | sonia | mateo | token-efficiency |
| `route` | sonia | aurora | ai-routing |
| `validate` | sonia | rolando | reality-verification |
| `usability-check` | sonia | manu | uat-review |

**Priority:** High
**Acceptance Criteria:** AC-B01, AC-B02

---

#### RF-B02 — Validación de capabilities antes de delegar
**Description:** Antes de ejecutar `/araya <agent> "<task>"`, el sistema debe:
- Verificar que el agente destino existe
- Verificar que el agente destino tiene skills para el tipo de tarea
- Si no, sugerir agente alternativo o escalar a Aurora para determinación de elegibilidad

**Priority:** High
**Acceptance Criteria:** AC-B03, AC-B04, AC-B05

---

#### RF-B03 — Skill transversal obligatoria
**Description:** Debe existir la skill `araya-command-and-delegation-expert` que
enseñe a cada agente:
1. Consultar el catálogo antes de iniciar una tarea
2. Identificar comandos, funciones, skills y especialistas relevantes
3. Consultar `--help` o `/araya:man` antes de usar una función desconocida
4. Preferir capacidades nativas frente a procedimientos manuales duplicados
5. No inventar comandos, argumentos, flags, agentes o comportamientos
6. Verificar disponibilidad, compatibilidad y permisos antes de ejecutar
7. Delegar en el agente especializado cuando exista uno competente
8. No asumir tareas fuera de su propia autoridad
9. Registrar cuando una capacidad o especialista necesario no existe
10. Proponer nuevas capacidades solo tras confirmar inexistencia de equivalente

**Priority:** High
**Acceptance Criteria:** AC-B06, AC-B07, AC-B08

---

#### RF-B04 — Asignación universal de la skill transversal
**Description:** La skill `araya-command-and-delegation-expert` debe asignarse a
los 30 agentes del roster en `araya.yaml`. Todo agente nuevo debe recibirla
automáticamente.

**Priority:** High
**Acceptance Criteria:** AC-B09, AC-B10

---

#### RF-B05 — Reconciliación de fuentes de verdad
**Description:** Deben resolverse las divergencias detectadas en WS-01:
- 4 skills huérfanas de Aurora: implementar o declarar como `not-installed`
- 4 skills no asignadas: asignar a agentes (`ai-routing` → Aurora, `pm-decompose` → Sonia,
  `autonomous-execution` → Sonia, `ax-postoffice` → Esteban)
- 9 skills en prompt de Sonia no en `araya.yaml`: decidir inclusión o remoción
- 3 skills en `araya.yaml` de Sonia no en su prompt: documentar en prompt
- Crear prompts faltantes: `daneel.md`, `rolando.md`

**Priority:** High
**Acceptance Criteria:** AC-B11, AC-B12, AC-B13

---

#### RF-B06 — Contrato de delegación vinculante
**Description:** El Specialist Delegation Contract definido en REQ-001 debe ser
vinculante para todos los agentes:
- Sonia no ejecuta directamente trabajo de especialistas disponibles
- Las excepciones requieren: (1) confirmación de Aurora de inexistencia de
  especialista, (2) registro de la excepción, (3) riesgos y límites explícitos
- Presión de tiempo, simplicidad aparente o conveniencia no son motivos válidos

**Priority:** High
**Acceptance Criteria:** AC-B14, AC-B15, AC-B16

---

### Pilar C — Delegation Infrastructure

---

#### RF-C01 — Broker/orquestador de delegación (DI-001)
**Description:** El comando `/araya:delegate <agent> "<task>"` debe enviar
solicitudes a un broker/orquestador accesible desde cualquier agente,
independientemente de su runtime.

**Priority:** High
**Acceptance Criteria:** AC-C01, AC-C02

---

#### RF-C02 — Independencia del runtime (DI-002)
**Description:** La delegación no debe depender de la herramienta `subagent`
ni de ninguna otra herramienta específica del runtime. El mecanismo debe
funcionar a nivel de aplicación (broker), no de runtime.

**Priority:** High
**Acceptance Criteria:** AC-C03, AC-C04

---

#### RF-C03 — Capacidades del broker (DI-003)
**Description:** El broker debe soportar:
- **Correlación:** `correlation_id` único que enlace solicitud, ejecución y resultado
- **Sesiones:** Agrupación en sesiones/workflows (sprint, run, proyecto)
- **Permisos:** Validación de autoridad del solicitante y capacidades del destino
- **Estados:** `pending`, `dispatched`, `running`, `completed`, `failed`, `blocked`, `timeout`
- **Resultados:** Estructurados con `status`, `confidence`, `risks`, `blockers`, `evidence`, `artifacts`
- **Evidencia:** Traza en `.araya/runs/{run_id}/` con outputs, artifacts y metadata

**Priority:** High
**Acceptance Criteria:** AC-C05, AC-C06, AC-C07, AC-C08

---

#### RF-C04 — Protección contra recursión (DI-004)
**Description:** El broker debe impedir delegaciones recursivas no controladas:
- Un agente no puede delegar en sí mismo
- Un agente no puede delegar en un agente que ya está en su cadena activa
- Profundidad máxima configurable (default: 3 niveles)
- Delegaciones circulares detectadas y rechazadas antes del dispatch

**Priority:** High
**Acceptance Criteria:** AC-C09, AC-C10, AC-C11

---

#### RF-C05 — Separación orden/ejecución (DI-005)
**Description:** Sonia (y cualquier orquestador) debe poder ordenar delegaciones
sin ejecutarlas técnicamente:
- Sonia emite la orden al broker
- El broker despacha, monitorea y recolecta
- Sonia recibe resultados consolidados
- Sonia nunca necesita `subagent` ni acceso directo a herramientas del agente destino

**Priority:** High
**Acceptance Criteria:** AC-C12, AC-C13

---

#### RF-C06 — Verificación de infraestructura (DI-006)
**Description:** La infraestructura se considera operativa cuando:
1. `/araya:delegate <agent> "<task>"` envía solicitud al broker
2. El broker despacha al agente correcto
3. El resultado retorna con `correlation_id` y estado
4. Un agente sin `subagent` puede delegar exitosamente
5. Una delegación recursiva es rechazada
6. Una delegación a agente inexistente produce error claro
7. La evidencia queda en `.araya/runs/`

**Priority:** High
**Acceptance Criteria:** AC-C14

---

## Non-Functional Requirements

---

### RNF-01 — Performance
**Category:** Performance
**Description:** `/araya:man` debe responder en menos de 500ms en condiciones
normales. La búsqueda (`--search`) debe completarse en menos de 1s incluso con
el catálogo completo (122+ skills, 30 agentes, 38+ comandos).
**Measurement:** Tiempo de respuesta medido con `time` en 10 ejecuciones consecutivas.
**Priority:** Medium

---

### RNF-02 — Exactitud del catálogo
**Category:** Reliability
**Description:** El catálogo generado por `/araya:man` debe reflejar el estado
real del repositorio en el momento de la consulta. No debe mostrar información
stale de ejecuciones anteriores.
**Measurement:** Test que modifica `araya.yaml` (añade/remueve skill), ejecuta
`/araya:man`, verifica que el cambio se refleja inmediatamente.
**Priority:** High

---

### RNF-03 — Inmutabilidad de fuentes
**Category:** Reliability
**Description:** `/araya:man` y el broker de delegación son lectores de las
fuentes de verdad. No deben modificarlas bajo ninguna circunstancia.
**Measurement:** Test que verifica que `araya.yaml` y `skills/` no son modificados
tras 100 ejecuciones de `/araya:man`.
**Priority:** High

---

### RNF-04 — Idempotencia del broker
**Category:** Reliability
**Description:** Una misma orden de delegación enviada dos veces con el mismo
`correlation_id` no debe resultar en dos ejecuciones. El broker debe detectar
duplicados y retornar el resultado existente.
**Measurement:** Enviar delegación con `correlation_id` X, reenviar con mismo X,
verificar que solo hay una ejecución.
**Priority:** High

---

### RNF-05 — Seguridad de delegación
**Category:** Security
**Description:** La delegación no debe introducir vectores de ataque:
- Un agente no puede delegar en nombre de otro agente (spoofing)
- Un agente no puede elevar sus privilegios mediante delegación
- Las credenciales no deben viajar en los mensajes de delegación
- Los resultados de delegación no deben ser interceptables por terceros
**Measurement:** Revisión de seguridad por Diana; test de penetración específico.
**Priority:** High

---

### RNF-06 — Trazabilidad completa
**Category:** Maintainability
**Description:** Toda delegación debe ser trazable de extremo a extremo:
solicitante → broker → agente destino → resultado → evidencia. La traza debe
persistir en `.araya/runs/` y ser consultable.
**Measurement:** Ejecutar 10 delegaciones, verificar que las 10 tienen traza
completa en `.araya/runs/`.
**Priority:** High

---

### RNF-07 — Backward compatibility
**Category:** Maintainability
**Description:** Ningún comando existente debe romperse. La sintaxis actual de
`/araya`, `/araya <agent> <task>`, `/araya:status` y resto de comandos slash
debe seguir funcionando sin cambios.
**Measurement:** Test de regresión completo sobre los 38 comandos existentes.
**Priority:** Critical

---

### RNF-08 — Extensibilidad del catálogo
**Category:** Maintainability
**Description:** Añadir un nuevo comando, skill o agente debe requerir únicamente
la modificación de las fuentes de verdad (`araya.yaml`, crear `SKILL.md`, crear
prompt). El catálogo de `/araya:man` debe reflejar el cambio automáticamente sin
modificar código del sistema de ayuda.
**Measurement:** Añadir skill de prueba, ejecutar `/araya:man`, verificar que
aparece sin cambios en el código de `/araya:man`.
**Priority:** Medium

---

### RNF-09 — Usabilidad para agentes
**Category:** Usability
**Description:** Un agente sin conocimiento previo de ARAYA debe poder:
1. Descubrir que `/araya:man` existe
2. Encontrar una capacidad relevante para su tarea en ≤3 interacciones
3. Entender la sintaxis y restricciones sin ambigüedad
**Measurement:** Test con agente nuevo (sin skills precargadas) — mide número de
interacciones hasta completar una tarea de descubrimiento.
**Priority:** High

---

### RNF-10 — Disponibilidad del broker
**Category:** Reliability
**Description:** El broker de delegación debe estar disponible mientras el runtime
de ARAYA esté activo. No debe requerir un proceso externo ni configuración manual.
**Measurement:** El broker responde en <100ms a un health check local.
**Priority:** Medium

---

### RNF-11 — Timeout de delegación
**Category:** Reliability
**Description:** Toda delegación debe tener un timeout configurable (default: 300s).
Una delegación que excede el timeout debe transicionar a estado `timeout` y liberar
recursos. El solicitante debe recibir notificación del timeout.
**Measurement:** Delegar tarea que duerme 400s con timeout 5s, verificar estado `timeout`.
**Priority:** Medium

---

## Traceability Matrix

| Requirement | Vision Objective | Acceptance Criteria |
|-------------|-----------------|---------------------|
| RF-A01 | O1 | AC-A01, AC-A02 |
| RF-A02 | O1 | AC-A03–AC-A06 |
| RF-A03 | O1 | AC-A07, AC-A08 |
| RF-A04 | O1 | AC-A09–AC-A11 |
| RF-A05 | O1 | AC-A12, AC-A13 |
| RF-A06 | O1 | AC-A14 |
| RF-A07 | O3 | AC-A15, AC-A16 |
| RF-A08 | O3 | AC-A17, AC-A18 |
| RF-B01 | O2 | AC-B01, AC-B02 |
| RF-B02 | O2 | AC-B03–AC-B05 |
| RF-B03 | O2 | AC-B06–AC-B08 |
| RF-B04 | O2 | AC-B09, AC-B10 |
| RF-B05 | O3 | AC-B11–AC-B13 |
| RF-B06 | O2 | AC-B14–AC-B16 |
| RF-C01 | O4 | AC-C01, AC-C02 |
| RF-C02 | O4 | AC-C03, AC-C04 |
| RF-C03 | O5 | AC-C05–AC-C08 |
| RF-C04 | O4 | AC-C09–AC-C11 |
| RF-C05 | O4 | AC-C12, AC-C13 |
| RF-C06 | O4, O5 | AC-C14 |

---

*Manu, Product Owner — Requirements approved. Proceed to acceptance criteria.*
