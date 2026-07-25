# Ponny Express 0009 — Teresa QA Review: Relay Protocol Design

**Reviewer:** Teresa (QA Engineer, ARAYA)
**Task:** PR #78 — Framework Relay Protocol — Design Review
**Date:** 2026-07-25
**Branch:** `feature/relay-protocol` @ `bd7fc0b`
**Scope:** Design artifacts only. No implementation exists. Motor not yet built.

## Artifacts Reviewed

| # | Artifact | Path |
|---|---|---|
| 1 | Acceptance Test Spec | `.araya/relay/acceptance-test-spec.md` |
| 2 | State Machine | `.araya/relay/state-machine.md` |
| 3 | Transition Table | `.araya/relay/transition-table.md` |
| 4 | Task Schema | `.araya/relay/task-schema.json` |
| 5 | Event Schema | `.araya/relay/event-schema.json` |
| 6 | Claim Contract | `.araya/relay/claim-contract.md` |
| 7 | Workflow Definition | `.araya/relay/workflow.yaml` |
| 8 | Filesystem Layout | `.araya/relay/filesystem-layout.md` |

## Verification Criteria & Results

### 1. Cobertura completa del happy path — ✅ PASS

**Path:** INTENT → ROUTING → PLANNING → EXECUTING → TESTING → VERIFYING → ACCEPTING → CLOSING → CLOSED

- `state-machine.md` §2: diagrama completo de 9 estados con transiciones explícitas
- `workflow.yaml`: cada estado define `allowed_events` y mapeo `next`
- `transition-table.md`: tabla completa cubriendo cada transición del happy path
- `acceptance-test-spec.md` T-008: verifica 9 transiciones, 9 eventos en events.jsonl, version=10, estado final CLOSED

**Veredicto:** Sin fisuras. Los 3 artefactos son consistentes entre sí. T-008 da trazabilidad completa.

### 2. Single owner (no dual ownership) — ✅ PASS

- `state-machine.md` Invariant 1: `len(active_claims) <= 1` at all times
- `claim-contract.md`: "A task can have at most one active or acknowledged claim"
- `task-schema.json`: `claim` es un objeto singular, no un array
- `acceptance-test-spec.md` T-001: prueba rechazo de claim cuando ya existe claim activo de otro agente

**Veredicto:** Blindado en 3 capas (invariante + schema + test).

### 3. No state skipping — ✅ PASS

- `state-machine.md` Invariant 3: "transitions only via defined edges"
- `transition-table.md`: tabla exhaustiva — cada transición posible está documentada explícitamente
- `workflow.yaml`: cada estado lista `allowed_events` con mapeo `next` restringido
- `acceptance-test-spec.md` T-003: intento de emitir DONE desde INTENT por actor incorrecto → rechazado

**Veredicto:** La máquina de estados es cerrada. No hay transiciones implícitas.

### 4. No self-test/self-approval — ✅ PASS

`transition-table.md` §Self-Approval Prevention documenta 5 conflict checks:

| Conflicto | Mecanismo | Verificación |
|---|---|---|
| Specialist no puede testear su propio trabajo | EXECUTING→TESTING: next_owner ≠ previous specialist | T-004 |
| Specialist no puede verificar su propio trabajo | VERIFYING: Rolando ≠ previous specialist | T-005 |
| Tester no puede verificar | Teresa ≠ Rolando (estructural) | — |
| Verifier no puede aceptar | Rolando ≠ Manu (estructural) | — |
| Controller nunca functional owner | owner.actor ≠ "daneel" en todos los estados | T-002, T-006 |

**Veredicto:** La arquitectura de roles (SPECIALIST → TERESA → ROLANDO → MANU) impide estructuralmente la auto-aprobación. T-004, T-005, T-006 dan cobertura de testing.

### 5. FAIL, DISCREPANCY, REJECT paths — ✅ PASS

| Camino | Transición | Owner resultante | Tests |
|---|---|---|---|
| FAIL | TESTING → EXECUTING | Mismo specialist, incrementa attempts | T-009, T-010 |
| DISCREPANCY | VERIFYING → PLANNING | Sonia, incrementa replanning | T-011, T-012 |
| REJECT | ACCEPTING → PLANNING | Sonia, incrementa replanning | T-013 |

Límites documentados en `workflow.yaml` (`max_attempts: 2`, `max_replanning: 2`) y `transition-table.md`. T-010 y T-012 verifican transición a BLOCKED cuando se exceden los límites.

**Veredicto:** Los 3 caminos excepcionales están definidos, con dueños claros, límites de ciclo, y tests.

### 6. ASK/BLOCK con owner suspendido (no daneel como owner) — ✅ PASS

Modelo verificado en 4 artefactos:

- `state-machine.md` §Exceptional States: "Daneel does NOT occupy the ball nor respond on behalf of the authority"
- `transition-table.md`: ASK/BLOCK rows muestran "(suspended: <owner>)" — nunca "daneel"
- `task-schema.json`: `waiting_on.actor` enum = `["manu", "aurora", "sonia", "professor"]` — sin "daneel"
- `acceptance-test-spec.md`:
  - T-002: `task.owner.actor != "daneel"` para todos los estados funcionales
  - T-006: Daneel no puede emitir VERIFIED (no es functional owner)
  - T-007: ASK preserva `owner.actor == "valentina"` (suspendida, no reemplazada)

**Veredicto:** El diseño es inequívoco. Daneel coordina, despacha, y devuelve la pelota — nunca la posee.

### 7. Claim, ACK, timeout, release — ✅ PASS

`claim-contract.md` documenta el ciclo completo:

```
UNCLAIMED → CLAIM → ACTIVE → ACK → ACKNOWLEDGED → RELEASE/EXPIRE → RELEASED/EXPIRED
```

Parámetros:
- `ack_timeout_seconds`: 300s (default)
- Force-release: 2× ack_timeout (600s)
- Prohibición de re-claim por previous claimant

Tests: T-015 (ACK timeout), T-016 (expired release), T-017 (force-release), T-018 (no re-claim).

`event-schema.json`: CLAIM, ACK, RELEASE, EXPIRE en enum `event_type` con constraint `claim_id` requerido.

`task-schema.json`: `claim.status` enum incluye `active`, `acknowledged`, `released`, `expired`, `superseded`.

**Veredicto:** Ciclo completo, timeouts definidos, tests de cobertura.

### 8. Concurrencia (flock + version check + atomic rename) — ✅ PASS

`claim-contract.md` §Concurrency Guarantee documenta los 3 mecanismos en orden:

1. **flock(LOCK_EX)** con timeout 30s — serializa acceso al task file
2. **Optimistic version check** (`expected_version`) — detecta escrituras stale post-flock
3. **Atomic rename** (write → .tmp → fsync → rename) — previene lecturas parciales

Pseudocódigo `claim_task()` incluido mostrando los 3 pasos integrados.

`workflow.yaml` §concurrency lista los 3 mecanismos.

Tests: T-019 (flock previene escrituras concurrentes), T-020 (version check detecta stale writes), T-021 (atomic rename previene partial reads).

**Veredicto:** El protocolo de concurrencia es correcto y completo. La combinación flock + version check + atomic rename es el patrón estándar para file-based locking en POSIX.

### 9. Idempotencia — ✅ PASS

- `event-schema.json`: campo `idempotency_key` con formato `<actor>-<uuid>`
- `workflow.yaml` §events: `idempotency: idempotency_key`
- `acceptance-test-spec.md` T-024: replay de idempotency_key → reconocido como duplicado, sin side effects, devuelve event_id original
- T-022: evento inválido no cambia versión ni estado ni apendea evento

**Veredicto:** Mecanismo de idempotencia definido y testeado.

### 10. Estado local por proyecto (.araya/relay/runtime/) — ⚠️ FIX

`filesystem-layout.md` establece el path canónico para runtime state:

```text
.araya/relay/runtime/
├── tasks/      # <task-id>.json
├── events/     # <task-id>.jsonl
├── claims/     # cache
└── inbox/      # <actor-id>/
```

`acceptance-test-spec.md` T-032 confirma: `.araya/relay/runtime/tasks/RELAY-001.json`

**Pero 3 artefactos omiten el segmento `runtime/`:**

| Artefacto | Dice | Debe decir |
|---|---|---|
| `task-schema.json` description | `.araya/relay/tasks/<task-id>.json` | `.araya/relay/runtime/tasks/<task-id>.json` |
| `event-schema.json` description | `.araya/relay/events/<task-id>.jsonl` | `.araya/relay/runtime/events/<task-id>.jsonl` |
| `claim-contract.md` (pseudocódigo) | `.araya/relay/tasks/<task-id>.json` | `.araya/relay/runtime/tasks/<task-id>.json` |

**Severidad:** FIX requerido. La inconsistencia causaría que el motor escriba en el path incorrecto.

### 11. Independencia de Portfolio — ✅ PASS

- `acceptance-test-spec.md` T-033: Portfolio lee de project state, nunca almacena copia local, project gana en caso de desacuerdo
- `filesystem-layout.md` §Separation from Portfolio: diagrama de 3 capas (Framework → Project → Portfolio) con Portfolio como read-only aggregator
- `task-schema.json` $id: `https://araya.es/relay/task-schema.json` — namespace del Framework, no del Portfolio

**Veredicto:** Separación clara. Portfolio es consumidor, no fuente de verdad.

---

## Additional Observations (Non-Blocking)

### OBS-1: ASSIGN event type sin semántica

`event-schema.json` incluye `ASSIGN` en el enum `event_type`, pero ningún otro artefacto define su semántica:
- `state-machine.md` — no menciona ASSIGN
- `transition-table.md` — sin fila ASSIGN
- `workflow.yaml` — ASSIGN no aparece en `allowed_events`
- `claim-contract.md` — no referencia ASSIGN

**Recomendación:** Documentar ASSIGN (¿se emite cuando Sonia asigna specialist? ¿quién lo emite? ¿cambia versión?), o eliminarlo del enum para MVP y reintroducirlo cuando se defina.

### OBS-2: Claim events ausentes en workflow.yaml

`workflow.yaml` solo cubre eventos de transición funcional. CLAIM, ACK, RELEASE, EXPIRE — definidos en `event-schema.json` y `claim-contract.md` — no aparecen en `workflow.yaml`.

Esto es correcto arquitectónicamente (son ortogonales a las transiciones de estado), pero un implementador que lea solo `workflow.yaml` no sabrá que el protocolo de claim existe.

**Recomendación:** Agregar nota en `workflow.yaml`:
```yaml
# Claim lifecycle events (CLAIM, ACK, RELEASE, EXPIRE) are orthogonal
# to functional state transitions. See claim-contract.md.
```

### OBS-3: Constraint de version_after es descriptivo, no estructural

`event-schema.json` describe `task_version_after == task_version_before` para eventos inválidos/no-state-changing, pero el constraint `allOf` solo cubre NOTE. ASSIGN, CLAIM, ACK, RELEASE, EXPIRE no tienen constraint de versión en el schema — solo en la descripción textual.

**Severidad:** Baja para MVP. Recomendado formalizar antes de implementación del validador de eventos.

---

## Edge Cases Verified

| Edge Case | Test | Status |
|---|---|---|
| Doble claim simultáneo | T-001 | ✅ Cubierto |
| Evento de actor incorrecto | T-003 | ✅ Cubierto |
| Sequence gap | T-025 | ✅ Cubierto |
| DONE sin evidence | T-026 | ✅ Cubierto |
| PASS sin evidence | T-027 | ✅ Cubierto |
| VERIFIED sin evidence | T-028 | ✅ Cubierto |
| ASK/BLOCK sin message | T-029 | ✅ Cubierto |
| Giskard operativo bloqueado | T-030 | ✅ Cubierto |
| Giskard histórico permitido | T-031 | ✅ Cubierto |
| Max attempts exceeded | T-010 | ✅ Cubierto |
| Max replanning exceeded | T-012 | ✅ Cubierto |
| Previous owner re-claim | T-018 | ✅ Cubierto |
| Event log immutability | T-023 | ✅ Cubierto |
| Concurrent write race | T-019, T-020, T-021 | ✅ Cubierto |

---

## Test Coverage Summary

| Suite | Tests | Scope |
|---|---|---|
| Structural (T-001→T-007) | 7 | Single owner, no self-approval, ASK/BLOCK model, controller isolation |
| Happy Path (T-008) | 1 | 9-state complete traversal |
| Exceptional (T-009→T-014) | 6 | FAIL, DISCREPANCY, REJECT, max limits, ASK→RESOLVE |
| Claim (T-015→T-018) | 4 | Timeout, expired, force-release, re-claim prevention |
| Concurrency (T-019→T-021) | 3 | flock, version check, atomic rename |
| Event Integrity (T-022→T-025) | 4 | Invalid events, append-only, idempotency, sequence gaps |
| Evidence (T-026→T-029) | 4 | Required evidence per event type |
| Giskard (T-030→T-031) | 2 | Operational block, historical allow |
| Cross-Repo (T-032→T-033) | 2 | Runtime state locality, Portfolio independence |
| **Total** | **33** | |

---

## Final Verdict

```
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   VERDICT: FIX                                       ║
║                                                      ║
║   🔴 FIX-1: task-schema.json path (missing runtime/) ║
║   🔴 FIX-2: event-schema.json path (missing runtime/)║
║   🔴 FIX-3: claim-contract.md path (missing runtime/)║
║                                                      ║
║   🟡 OBS-1: ASSIGN event type undefined              ║
║   🟡 OBS-2: Claim events not in workflow.yaml        ║
║   🟡 OBS-3: version_after constraint descriptive     ║
║                                                      ║
║   🟢 11/11 criteria structurally sound               ║
║   🟢 33 acceptance tests cover all paths              ║
║   🟢 NO BLOCKING architectural flaws                  ║
║                                                      ║
║   Design is IMPLEMENTATION-READY after 3 FIX items.   ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

## Signature

**Teresa** — QA Engineer, ARAYA Team
**Model:** deepseek-v4-pro/DeepSeek | runtime-reported
**Repository:** mahg-es/araya (ARAYA Framework)
