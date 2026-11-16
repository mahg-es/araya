# Metodología Agnóstica de Desarrollo Autónomo (MADA)

## 1. Principios Operativos

1. **Arquitectura Primero (`Architecture-First`):** Ningún agente escribe código de producto hasta que la arquitectura base, los contratos ejecutables y los activos estén cerrados y validados.
2. **Separación Estricta de Roles:**
   * **Arquitecto (Humano + IA Asesora):** Define el diseño, los criterios de aceptación, las pruebas previas y el orden de ejecución.
   * **Ejecutor Autónomo (Agente Desarrollador):** Ensambla técnicamente lo especificado. Tiene prohibido tomar decisiones de arquitectura; ante ambigüedad, detiene y escala.
3. **Atomicidad 1:1 (`1 Tarea = 1 Skill`):** Cada fila del backlog requiere una única habilidad técnica. Si una tarea exige dos o más skills, se divide en unidades independientes antes de ejecutarse.
4. **Cero Azar (`Contract-First TDD`):** Toda unidad de trabajo nace con su prueba de aceptación automatizada y sus insumos ya creados. El agente desarrolla hasta que el test pasa.
5. **Presupuesto de Contexto Medible (`Context Budget`):** Cada tarea lista explícitamente los únicos **3 a 5 archivos** que el agente tiene permitido leer. Para garantizar atomicidad real y bajo costo operativo, la suma total del prompt inicial y dichos archivos **no debe superar los 30k–50k tokens (aprox. 1,500–2,000 líneas de código/texto)**, manteniendo un techo duro absoluto de **150k tokens** incluyendo el historial de ejecución. Si una tarea exige más contexto, está mal particionada y debe dividirse.
6. **Paralelismo Controlado y Efímero (`Git Worktrees`):** Las tareas sin dependencias bloqueantes avanzan en paralelo hasta un máximo de **4 subprocesos simultáneos**. Cada subproceso opera exclusivamente dentro de una ruta oculta controlada fuera del repositorio (`~/.gh-worktree/<proyecto>/<rama-atomica>`) y **se destruye obligatoriamente (`git worktree remove`)** inmediatamente después de fusionar el PR, prohibiendo worktrees huérfanos o en directorios de trabajo visibles.
7. **Freno de Emergencia (`Circuit Breaker`):** Si una tarea falla la validación automática **2 veces consecutivas**, el subproceso se detiene de inmediato, no hace `push` de código roto y genera un ticket atómico en `docs/governance/action-logs/`.
8. **Prolijidad Estructural y Taxonomía Explícita (`SSOT`):** Prohibido crear archivos monolíticos gigantes o documentos sueltos en caos. Todo proyecto debe tener una **estructura de carpetas explícita, documentada y verificada por linter** en CI (ya sea adoptando la taxonomía base de MADA o declarando su mapa canónico adaptado en repositorios ya activos).

---

## 2. Taxonomía Base de Referencia y Adaptación a Proyectos Activos

La siguiente estructura constituye la **arquitectura de carpetas base recomendada por MADA** para proyectos nuevos (`greenfield`).

> **Regla para Proyectos Activos (`brownfield` / repositorios en curso):** Si el repositorio ya posee una jerarquía consolidada (por ejemplo, `apps/`, `content/`, `locales/` en un juego o `distribution/` en una plataforma existente), **no es obligatorio migrarla de golpe ni detener el desarrollo**. En su lugar, el proyecto debe:
> 1. **Documentar su Mapa Canónico de Directorios** en el `README.md` raíz o en `docs/architecture/REPO_MAP.md`, especificando el propósito de cada carpeta existente y su equivalencia con los roles de MADA (gobernanza, activos/contratos, núcleo y módulos).
> 2. **Configurar el Linter Estructural en CI** contra ese mapa aprobado para bloquear cualquier archivo suelto fuera de las rutas declaradas, evitando el desorden sin romper integraciones previas.
> 3. **Aplicar migración progresiva (opcional):** Si se decide converger hacia la estructura estándar de MADA, se ejecuta mediante PRs dedicados y atómicos en `MASTER_MATRIX.md`, nunca mezclados con tareas funcionales.

### Estructura Base de Referencia (Proyectos Nuevos)

```text
repo-root/
├── README.md                                               # Punto de entrada único e índice general (y mapa de carpetas)
├── docs/
│   ├── governance/                                         # Control operativo, seguimiento y auditoría
│   │   ├── METHODOLOGY.md                                  # Este documento rector
│   │   ├── MASTER_MATRIX.md                                # Backlog maestro y contratos por PR
│   │   ├── action-logs/                                    # Tickets atómicos de escalación (1 archivo = 1 incidente)
│   │   │   └── YYYYMMDD-HHMMSS_PR-XX_<slug>.md             # Ej: 20261116-163000_PR-02_schema-mismatch.md
│   │   └── daily-handoffs/                                 # Cierres diarios inmutables (1 archivo = 1 jornada)
│   │       └── YYYY-MM-DD_handoff.md                       # Ej: 2026-11-16_handoff.md
│   └── architecture/                                       # Diagramas, ADRs y especificaciones técnicas
│       └── REPO_MAP.md                                     # (Obligatorio en proyectos activos) Taxonomía aprobada del repo
├── assets/
│   ├── contracts/                                          # Pruebas de aceptación previas (test_prXX.*)
│   └── fixtures/                                           # Insumos inmutables (datos, textos, media, mocks)
├── core/                                                   # Fase 0: Base del sistema (motor, infra, layout)
└── modules/                                                # Fase 1+: Unidades funcionales escalables
    ├── mod01/
    │   ├── README.md                                       # Objetivo y criterios de verificación del módulo
    │   ├── src/                                            # Código fuente del módulo
    │   └── tests/                                          # Pruebas unitarias y de integración
    └── modN/
```

---

## 3. Fases de Ejecución

### Fase 0: Construcción de la Base del Sistema (Día 1)

Antes de construir cualquier módulo funcional, se ensambla e integra el núcleo técnico (`core/` o las rutas equivalentes declaradas en `REPO_MAP.md`): entorno de ejecución, dependencias, comunicación entre componentes y estructuras base en estado final validado.

### Fase 1 a N: Construcción Modular Continua (Días 2 en adelante)

Con la base operativa y los activos cerrados, el agente ejecuta secuencialmente o en paralelo (máx. 4 subprocesos) las filas de `MASTER_MATRIX.md` desde `mod01` hasta `modN` (o sus rutas canónicas equivalentes). Cada fila representa un **Pull Request (PR) atómico, completo y verificable** (desde una interacción simple hasta un flujo complejo).

---

## 4. Plantilla Operativa: `MASTER_MATRIX.md`

| PR ID | Fase / Módulo | Ruta Destino | Objetivo Funcional | Skill (1:1) | Dependencias | Context Budget (3–5 archivos / ≤ 50k tokens) | Insumos (`assets/fixtures/`) | Contrato de Validación (`assets/contracts/`) | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PR-00` | Fase 0 (`core`) | `core/` *(o ruta mapeada)* | Inicializar entorno base y dependencias | `env-setup` | Ninguna | `docs/architecture/core.md` | `fixtures/config.json` | `contracts/test_pr00.py` | Pendiente |
| `PR-01` | Fase 0 (`core`) | `core/` *(o ruta mapeada)* | Definir modelos/esquemas principales | `data-modeling` | `PR-00` | `docs/architecture/models.md`, `core/config` | `fixtures/seed_data.*` | `contracts/test_pr01.py` | Pendiente |
| `PR-02` | Fase 1 (`mod01`) | `modules/mod01/` | Implementar flujo de entrada inicial | `core-logic` | `PR-01` | `modules/mod01/README.md`, `core/models` | `fixtures/mod01_input.*` | `contracts/test_pr02.py` | Pendiente |
| `PR-03` | Fase 1 (`mod01`) | `modules/mod01/` | Renderizar/exponer salida del módulo | `ui-interface` | `PR-02` | `modules/mod01/README.md`, `modules/mod01/src/` | `fixtures/mod01_expected.*` | `contracts/test_pr03.py` | Pendiente |

---

## 5. Ciclo de Vida de Cada PR (Protocolo del Ejecutor)

1. **Aislamiento en Ruta Controlada:**
   * El agente crea el worktree exclusivamente en `~/.gh-worktree/<proyecto>/feat-PR-XX` mediante:
     `git worktree add ~/.gh-worktree/<proyecto>/feat-PR-XX -b feat/PR-XX`
   * Carga únicamente los archivos listados en su *Context Budget* verificando que no excedan el umbral de tokens definido.
2. **Implementación:** Escribe el código mínimo necesario en la `Ruta Destino` declarada para cumplir el objetivo funcional usando la única skill asignada.
3. **Validación Automática:** Ejecuta el script de `assets/contracts/test_prXX.*` y el linter de estructura de carpetas (validado contra la taxonomía base o `docs/architecture/REPO_MAP.md`).
   * *Si pasa:* Hace `rebase` contra `main`, ejecuta `git push` y marca el PR como listo para fusión.
   * *Si falla (Intento 1):* Analiza el error del test y corrige dentro del mismo worktree.
   * *Si falla (Intento 2 - Circuit Breaker):* Detiene el subproceso, no hace `push` de código roto y crea un ticket individual en `docs/governance/action-logs/YYYYMMDD-HHMMSS_PR-XX_<slug>.md`.
4. **Saneamiento Post-Fusión (`Garbage Collection`):**
   * Una vez fusionado el PR en `main`, el agente ejecuta obligatoriamente `git worktree remove ~/.gh-worktree/<proyecto>/feat-PR-XX` y `git branch -d feat/PR-XX`, garantizando cero directorios huérfanos en el entorno local.

---

## 6. Protocolo de Gobernanza Modular (`action-logs/` y `daily-handoffs/`)

Para evitar archivos monolíticos de miles de líneas y conflictos de concurrencia cuando operan hasta 4 subprocesos en paralelo, toda comunicación asíncrona usa archivos atómicos con metadatos YAML:

### 6.1. Tickets de Escalación (`docs/governance/action-logs/`)
Cada bloqueo crea su propio archivo (`YYYYMMDD-HHMMSS_PR-XX_<slug>.md`) con encabezado de estado rastreable:

```yaml
---
id: AL-20261116-163000
pr_id: PR-02
worktree: ~/.gh-worktree/proyecto-x/feat-PR-02
status: OPEN # Valores permitidos: OPEN | ANSWERED | RESOLVED | WONTFIX
severity: BLOCKER # BLOCKER | CLARIFICATION
created_at: 2026-11-16T16:30:00Z
resolved_at: null
---
```
* **Flujo de Resolución:** El Ejecutor crea el archivo en estado `OPEN` -> El Arquitecto añade su directriz técnica en la sección `## Directriz de Arquitectura` y cambia el estado a `ANSWERED` -> El Ejecutor aplica la solución, valida el test en verde y cierra el ticket cambiando el estado a `RESOLVED`.

### 6.2. Cierre Diario (`docs/governance/daily-handoffs/`)
Al finalizar cada jornada, se genera un único archivo inmutable `docs/governance/daily-handoffs/YYYY-MM-DD_handoff.md` con el resumen ejecutivo del día:

```yaml
---
date: 2026-11-16
status: CLOSED # OPEN | CLOSED
prs_merged: [PR-00, PR-01]
active_blockers: [AL-20261116-163000]
next_queue: [PR-02, PR-03]
worktrees_cleaned: true
---
```
* **Contenido obligatorio del cierre:** (1) Lista de PRs fusionados y evidencia de contratos en verde, (2) Tickets abiertos en `action-logs/` pendientes de directriz, (3) Confirmación de limpieza en `~/.gh-worktree/<proyecto>/`, y (4) Cola exacta de PRs desbloqueados para la siguiente jornada.
