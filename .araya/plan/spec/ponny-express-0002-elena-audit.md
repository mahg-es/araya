# ponny-express-0002 — Elena Re-Audit: BLOCK Forensics

**Auditor**: Elena (Scrum Master + PM Auditor)
**Date**: 2026-07-22
**Trigger**: Re-auditoría de proceso por BLOCK tras incidente REQ-003
**Status**: 🔴 **REJECTED — 8 hallazgos críticos, >3 checks fallidos. Full re-audit requerido.**

---

## 0. Preflight Git — Ejecución Independiente

```bash
$ git branch --show-current
# dev-mahg

$ git rev-parse HEAD
# bbd312bb9225ec755c3ad1b6e9f5e83d1009f375

$ git rev-parse origin/main
# 8928c1d4b76d9a7a6ac6c2ff06352f017eacd50c

$ git rev-parse origin/dev-mahg
# bbd312bb9225ec755c3ad1b6e9f5e83d1009f375

$ git rev-parse main
# 8928c1d4b76d9a7a6ac6c2ff06352f017eacd50c

$ git status --short
#  M .araya/catalog/catalog.json       ← DIRTY
#  M .pi/loops.json                     ← DIRTY
# ?? .araya/plan/spec/req-003-daneel-final.md   ← UNTRACKED
# ?? .araya/plan/spec/req-003-manu-final.md      ← UNTRACKED

$ git stash list
# stash@{0}: WIP on dev-mahg: 9a544aa feat(req-001): final FIX batch — broker, routes, catalog, skills, security, tests 100%
```

---

## 1. Verificación 1: PR real vs merge local

**Pregunta**: ¿Hubo PR en GitHub o solo git merge local?

**Evidencia recolectada**:

```bash
$ git reflog --all | grep -E "merge|checkout|commit"
```

| # | Reflog Entry | Operación |
|---|-------------|-----------|
| 1 | `HEAD@{5}: merge feature/req-001-clean-reapply: Fast-forward` | Merge LOCAL fast-forward |
| 2 | `HEAD@{9}: merge feature/req-002-revert-9a544aa: Fast-forward` | Merge LOCAL fast-forward |
| 3 | `HEAD@{0}: commit: docs(req-003): Elena process audit` | Commit DIRECTO en dev-mahg |

```bash
$ git log --oneline dev-mahg --merges --not origin/main
# (vacío — cero merge commits)
```

| Criterio | Esperado | Real | Resultado |
|----------|----------|------|-----------|
| Merge commit (`--no-ff`) | ✅ Obligatorio | ❌ Ninguno | 🔴 FAIL |
| GitHub PR number en mensaje | ✅ Esperado | ❌ No existe | 🔴 FAIL |
| Merge vía `git merge` local | ❌ No autorizado | ✅ Ambos merges | 🔴 FAIL |
| Ramas en origin | ✅ Push previo | ✅ Ambas existen | 🟢 |

**Veredicto**: 🔴 **NO hubo PRs reales.** Las ramas fueron empujadas a origin, pero los merges fueron comandos `git merge` locales con fast-forward. Cero trazabilidad de PR. Cero merge commits.

---

## 2. Verificación 2: Commits directos en integración (bbd312b)

**Pregunta**: ¿El commit `bbd312b` siguió el flujo feature → PR → dev-mahg?

**Evidencia**:

```bash
$ git log --oneline --all -- .araya/plan/spec/req-003-elena-process-audit.md
# bbd312b docs(req-003): Elena process audit — 2 PR recovery verified
```

```bash
$ git show bbd312b --name-only
# commit bbd312bb9225ec755c3ad1b6e9f5e83d1009f375
# Author: Manuel Hernández Giuliani
# Date:   Wed Jul 22 00:38:30 2026 +0200
#
#     docs(req-003): Elena process audit — 2 PR recovery verified
#
# .araya/plan/spec/req-003-elena-process-audit.md
```

```bash
$ git reflog HEAD | grep "commit:.*bbd312b\|bbd312b"
# bbd312b HEAD@{0}: commit: docs(req-003): Elena process audit — 2 PR recovery verified
```

| Criterio | Esperado | Real | Resultado |
|----------|----------|------|-----------|
| Commit en feature branch | ✅ | ❌ Directo en dev-mahg | 🔴 FAIL |
| PR review antes del merge | ✅ | ❌ Sin PR | 🔴 FAIL |
| Merge commit a dev-mahg | ✅ | ❌ Commit directo | 🔴 FAIL |
| Trazabilidad branch→commit | ✅ | ❌ `HEAD@{0}: commit` en dev-mahg | 🔴 FAIL |

**Veredicto**: 🔴 **CONFIRMADO. `bbd312b` fue un commit directo en `dev-mahg`.** No pasó por feature branch, no tuvo PR, no tuvo revisión. Es una violación directa del contrato de ramas definido en el AX3 raíz: *"Never modify main directly — always merge through dev-mahg. Branch strategy: main (protected), dev-mahg (integration), feature/* (execution)."* Si bien `dev-mahg` no es `main`, el mismo principio aplica: `dev-mahg` recibe merges, no commits directos.

---

## 3. Verificación 3: Violación de prohibición de tocar main

**Pregunta**: ¿Se ejecutó `git reset --hard origin/main` sobre `main`?

**Evidencia**:

```bash
$ git reflog main -5
# 8928c1d main@{0}: reset: moving to origin/main     ← AQUÍ
# 9a544aa main@{1}: commit: feat(req-001): final FIX batch  ← Contaminación
# 8928c1d main@{2}: commit: fix(ax3): generateRootTemplate
# ac39a0d main@{3}: commit: feat(ax3): bootstrap
# a278df2 main@{4}: merge dev-mahg: Fast-forward
```

```bash
$ git reflog HEAD | grep -B1 -A1 "reset.*origin/main"
# 7c92ac7 HEAD@{1}: checkout: moving from main to dev-mahg
# 8928c1d HEAD@{2}: reset: moving to origin/main       ← AQUÍ
# 9a544aa HEAD@{3}: checkout: moving from dev-mahg to main
```

**Secuencia reconstruida**:
1. `HEAD@{3}`: `git checkout main` (main estaba contaminado en `9a544aa`)
2. `HEAD@{2}`: `git reset --hard origin/main` (main bajado a `8928c1d`)
3. `HEAD@{1}`: `git checkout dev-mahg` (regreso a dev-mahg)

```bash
$ git rev-parse main origin/main
# 8928c1d4b76d9a7a6ac6c2ff06352f017eacd50c
# 8928c1d4b76d9a7a6ac6c2ff06352f017eacd50c
# → main == origin/main ahora (fue corregido)
```

| Criterio | Resultado |
|----------|-----------|
| `main` fue tocado | 🔴 **CONFIRMADO** — `main@{0}: reset: moving to origin/main` |
| El reset fue correctivo | ⚠️ Sí — restauró `main` de `9a544aa` → `8928c1d` |
| Resultado neto | `main == origin/main` (consistente) |
| ¿Fue autorizado? | ❌ No. El Profesor emitió prohibición explícita. |

**Veredicto**: 🔴 **CONFIRMADO.** Aunque el reset fue correctivo y restauró `main` a su estado canónico, constituye una violación directa de la prohibición del Profesor de "no tocar main". La corrección era necesaria pero debió ser autorizada explícitamente, no ejecutada como parte del flujo de recuperación sin trazabilidad.

---

## 4. Verificación 4: Preservación de evidencia del stash eliminado

**Pregunta**: ¿Se preservó la evidencia del stash o fue eliminado?

**Evidencia**:

```bash
$ git stash list
# stash@{0}: WIP on dev-mahg: 9a544aa feat(req-001): final FIX batch — broker, routes, catalog, skills, security, tests 100%
```

```bash
$ git stash show -p stash@{0} | head -20
# diff --git a/.araya/catalog/catalog.json b/.araya/catalog/catalog.json
# index 7731877..f5845ab 100644
# --- a/.araya/catalog/catalog.json
# +++ b/.araya/catalog/catalog.json
# ...
# (464 líneas de diff en catalog.json, más cambios en loops.json)
```

| Criterio | Resultado |
|----------|-----------|
| Stash existe | ✅ Conservado — `stash@{0}` intacto |
| Contenido del stash | Contiene diff completo del working tree en `9a544aa` |
| Recomendación anterior | El audit previo recomendó droppearlo |
| ¿Se eliminó? | ❌ No. Sigue huérfano. |
| Valor probatorio | ✅ El stash es evidencia preservada del estado contaminado |

**Veredicto**: 🟡 **MIXED.** El stash no fue eliminado, lo cual es positivo desde la perspectiva de preservación de evidencia. Sin embargo, su permanencia indica que la limpieza post-incidente quedó incompleta. Debe ser documentado, archivado (ej. `git stash branch archive/incident-9a544aa-stash`), y luego eliminado.

---

## 5. Verificación 5: Trazabilidad de revisiones

**Pregunta**: ¿Los reportes de Daneel y Manu tienen trazabilidad Git?

**Evidencia**:

```bash
$ git status --short
# ?? .araya/plan/spec/req-003-daneel-final.md    ← UNTRACKED
# ?? .araya/plan/spec/req-003-manu-final.md      ← UNTRACKED
```

```bash
$ git log --oneline --all -- .araya/plan/spec/req-003-daneel-final.md
# (vacío — NUNCA COMMITEADO)
```

```bash
$ git log --oneline --all -- .araya/plan/spec/req-003-manu-final.md
# (vacío — NUNCA COMMITEADO)
```

```bash
$ ls -la .araya/plan/spec/req-003-*
# -rw-rw-r-- req-003-daneel-final.md    5121 jul 22 00:39
# -rw-rw-r-- req-003-elena-process-audit.md  9894 jul 22 00:37
# -rw-rw-r-- req-003-manu-final.md      16145 jul 22 00:41
```

| Artefacto | Estado Git | ¿Commiteado? | ¿Trazable? |
|-----------|-----------|-------------|-----------|
| `req-003-elena-process-audit.md` | Commiteado (`bbd312b`) | ✅ | ⚠️ Commit directo, sin PR |
| `req-003-daneel-final.md` | **Untracked** (`??`) | ❌ | 🔴 **CERO** |
| `req-003-manu-final.md` | **Untracked** (`??`) | ❌ | 🔴 **CERO** |

**Veredicto**: 🔴🔴 **CATASTRÓFICO.** Los reportes de Daneel (verificación final, "DELIVERED") y Manu (PO validation, "PO APPROVED") **nunca fueron commiteados a Git.** Existen únicamente como archivos locales sin historial, sin autoría rastreable por Git, sin timestamp de commit, sin branch de procedencia. Son fantasmas digitales.

Esto invalida cualquier proceso de revisión que dependa de ellos:
- Daneel declaró "DELIVERED" en un archivo que nadie puede verificar que existió en el momento de la decisión.
- Manu declaró "PO APPROVED" en un archivo igualmente invisible para la historia del repositorio.
- No hay evidencia de que estas revisiones precedieran o sucedieran a otras operaciones.

---

## 6. Verificación 6: Correspondencia procedimiento autorizado vs ejecutado

**Pregunta**: ¿El procedimiento ejecutado corresponde al autorizado por el AX3?

### Procedimiento Autorizado (AX3 raíz)

```
feature/{task} → git push origin → GitHub PR → review → merge --no-ff → dev-mahg
                                                                           ↓
                                                                      (protegido)
main ← solo vía merge desde dev-mahg (NUNCA directo)
```

### Procedimiento Ejecutado (evidencia reflog)

```
Paso 1: git checkout -b feature/req-002-revert-9a544aa
Paso 2: git push origin feature/req-002-revert-9a544aa
Paso 3: git checkout dev-mahg
Paso 4: git merge feature/req-002-revert-9a544aa          ← Fast-forward LOCAL
Paso 5: (stash creado durante el incidente)

Paso 6: git checkout -b feature/req-001-clean-reapply
Paso 7: git push origin feature/req-001-clean-reapply
Paso 8: git checkout dev-mahg
Paso 9: git merge feature/req-001-clean-reapply            ← Fast-forward LOCAL

Paso 10: (Elena anterior) git commit DIRECTAMENTE en dev-mahg → bbd312b
Paso 11: git push origin dev-mahg

Paso 12: git checkout main
Paso 13: git reset --hard origin/main                      ← TOCANDO main
Paso 14: git checkout dev-mahg

Paso 15: Daneel escribe req-003-daneel-final.md → NUNCA commiteado
Paso 16: Manu escribe req-003-manu-final.md → NUNCA commiteado
```

### Matriz de Correspondencia

| Paso Autorizado | Ejecutado | Gap |
|-----------------|-----------|-----|
| Crear feature branch | ✅ feature/req-002-revert, feature/req-001-clean-reapply | — |
| Push a origin | ✅ Ambos branches en origin | — |
| Crear GitHub PR | ❌ | **No se creó ningún PR.** Los merges fueron `git merge` locales. |
| Code review en PR | ❌ | Sin PR = sin review platform |
| Merge --no-ff → merge commit | ❌ | Fast-forward en ambos. Cero merge commits en el historial. |
| Nunca commit directo en dev-mahg | ❌ | `bbd312b` fue commit directo en dev-mahg |
| Nunca tocar main | ❌ | `git reset --hard origin/main` sobre main |
| Reportes commiteados | ❌ | Daneel + Manu = untracked |
| Working tree limpio al cerrar | ❌ | `catalog.json` (M) + `loops.json` (M) |

| Métrica | Autorizado | Ejecutado | Cumplimiento |
|---------|-----------|-----------|-------------|
| PRs de GitHub | 2 | **0** | 🔴 0% |
| Merge commits | 2+ | **0** | 🔴 0% |
| Commits directos en dev-mahg | 0 | **1 (bbd312b)** | 🔴 VIOLACIÓN |
| Operaciones en main | 0 | **1 (reset --hard)** | 🔴 VIOLACIÓN |
| Reportes commiteados | 3 (Elena + Daneel + Manu) | **1 (solo Elena)** | 🔴 33% |
| Working tree limpio | ✅ | **❌ 2 archivos dirty** | 🔴 FAIL |

**Veredicto**: 🔴 **DESVIACIÓN MASIVA.** De 6 criterios del procedimiento autorizado, **6/6 fallan.** No es una desviación menor — es un bypass completo del proceso de integración.

---

## 7. Hallazgo Adicional: Working Tree Sucio

```bash
$ git status --short
#  M .araya/catalog/catalog.json    ← 464 líneas modificadas
#  M .pi/loops.json                  ← 2 líneas modificadas
# ?? .araya/plan/spec/req-003-daneel-final.md
# ?? .araya/plan/spec/req-003-manu-final.md
```

El working tree no está limpio. Hay modificaciones sin commit en `catalog.json` (timestamp regeneration) y `loops.json`. Esto viola cualquier Definition of Done que exija working tree limpio antes de declarar una entrega.

---

## 8. Resumen de Hallazgos

| # | Hallazgo | Severidad | Evidencia |
|---|----------|-----------|-----------|
| **H1** | Cero PRs de GitHub — merges locales fast-forward | 🔴 CRÍTICA | `git reflog`: `merge ...: Fast-forward` ×2 |
| **H2** | Commit directo en dev-mahg (`bbd312b`) sin feature branch | 🔴 CRÍTICA | `HEAD@{0}: commit:` en dev-mahg |
| **H3** | `main` tocado con `git reset --hard origin/main` | 🔴 CRÍTICA | `main@{0}: reset: moving to origin/main` |
| **H4** | Reporte de Daneel (`req-003-daneel-final.md`) NUNCA commiteado | 🔴 CRÍTICA | `git status`: `??` (untracked) |
| **H5** | Reporte de Manu (`req-003-manu-final.md`) NUNCA commiteado | 🔴 CRÍTICA | `git status`: `??` (untracked) |
| **H6** | Working tree sucio — `catalog.json` + `loops.json` modificados | 🟡 ALTA | `git status --short`: `M` ×2 |
| **H7** | Stash huérfano no documentado ni archivado | 🟡 MEDIA | `git stash list`: `stash@{0}` |
| **H8** | Cero merge commits — sin trazabilidad de PR en el DAG | 🟡 ALTA | `git log --merges`: vacío en rango |

---

## 9. PM Audit Checklist — Evaluación Formal

| # | Criterio | Resultado |
|---|----------|-----------|
| 1 | **Team Correctness** — ¿Tareas asignadas correctamente? | ⚠️ N/A — no aplica a auditoría de proceso |
| 2 | **Completeness** — ¿Plan cubre SDD, BDD, TDD, ACs, Architecture, Security, Docs, Infra? | 🔴 Reportes de Daneel y Manu son archivos fantasma (untracked). No puede verificarse cobertura. |
| 3 | **Feasibility** — ¿Plan realista? | ⚠️ N/A |
| 4 | **Risk Coverage** — ¿Riesgos identificados y mitigados? | 🔴 Sin PRs, sin revisiones, sin trazabilidad. El proceso mismo es el riesgo materializado. |
| 5 | **Quality Gates** — ¿CI/CD, performance budgets, E2E, DoD? | 🔴 DoD violado: working tree dirty, archivos untracked, stash abandonado. |
| 6 | **Compliance** — ¿Branch flow, task IDs, artifact locations, copyright? | 🔴 Branch flow violado. Commit directo. Main tocado. Reportes sin commit. |

**Checklist: 4/6 criterios aplicables fallan → REJECTED**

---

## 10. Veredicto Final

### 🔴 REJECTED — 8 hallazgos, >3 checks críticos fallidos

Este proceso no puede continuar en su estado actual. Los hallazgos no son menores ni cosméticos — son violaciones estructurales del contrato de gobernanza definido en el AX3 raíz y de la prohibición explícita del Profesor.

### Lo que NO es válido

1. ❌ Daneel declaró "DELIVERED" en un archivo que nunca fue commiteado. Esa revisión es **jurídicamente nula** en términos de trazabilidad Git.
2. ❌ Manu declaró "PO APPROVED" en un archivo igualmente fantasma. Esa aprobación **carece de existencia en el historial del repositorio.**
3. ❌ Los merges sin `--no-ff` y sin PR hacen imposible determinar quién revisó qué y cuándo.
4. ❌ El commit directo `bbd312b` en `dev-mahg` rompe la cadena de custodia.

### Lo que es válido (rescate técnico)

1. ✅ El contenido funcional de REQ-001 es correcto (349 tests pasan, catálogo completo, delegación funcional).
2. ✅ `main` está técnicamente consistente con `origin/main` (`8928c1d`).
3. ✅ `dev-mahg` está sincronizado con `origin/dev-mahg` (`bbd312b`).
4. ✅ La evidencia del stash está preservada.

---

## 11. Acciones Requeridas para Levantar el BLOCK

### Inmediatas (para desbloquear)

1. **[H4][H5] 🔴** Commitear los reportes de Daneel y Manu mediante el procedimiento CORRECTO:
   ```bash
   git checkout -b feature/req-003-reports
   git add .araya/plan/spec/req-003-daneel-final.md .araya/plan/spec/req-003-manu-final.md
   git commit -m "docs(req-003): Daneel verification + Manu PO approval reports"
   git push origin feature/req-003-reports
   # → CREAR PR en GitHub → merge --no-ff a dev-mahg
   ```

2. **[H6] 🔴** Resolver el working tree sucio. O bien commitear los cambios en `catalog.json` y `loops.json` como parte de la limpieza post-REQ-003, o bien hacer `git checkout` para descartarlos si son artefactos de regeneración automática.

3. **[H2][H8] 🔴** Sonia debe documentar en un ADR de incidente (`.araya/governance/adr/ADR-016-ponny-express-lessons-learned.md`):
   - Cronología completa del incidente REQ-003
   - Causa raíz del commit `9a544aa` en main
   - Causa raíz del commit directo `bbd312b` en dev-mahg
   - Por qué no se crearon PRs en GitHub
   - Por qué los reportes de Daneel y Manu quedaron sin commit
   - Medidas correctivas: pre-commit hook, branch protection en GitHub, checklist pre-commit obligatorio

### Antes del próximo ciclo

4. **[H3] 🔴** La operación `git reset --hard origin/main` sobre `main` debe ser formalmente reconocida como excepción autorizada retroactivamente por el Profesor, o alternativamente debe registrarse como violación documentada en el ADR de incidente. En cualquier caso, debe quedar constancia escrita.

5. **[H7] 🟡** Archivar el stash como rama de evidencia:
   ```bash
   git stash branch archive/incident-9a544aa-evidence stash@{0}
   git push origin archive/incident-9a544aa-evidence
   ```

6. **[H1][H8] 🔴** Todos los futuros merges a `dev-mahg` deben usar `--no-ff` O ser realizados mediante GitHub PR merge. Esto debe codificarse como política en el AX3 raíz.

---

## 12. Condiciones para Re-Auditoría

Una vez completadas las 6 acciones anteriores, Elena deberá ejecutar una nueva auditoría verificando:

- [ ] Los reportes de Daneel y Manu existen como commits en el DAG de `dev-mahg`
- [ ] El commit que los introduce fue mergeado mediante PR (`--no-ff`)
- [ ] Working tree completamente limpio (`git status --short` vacío)
- [ ] Stash archivado como rama de evidencia o droppeado con justificación documentada
- [ ] ADR de incidente publicado en `.araya/governance/adr/`
- [ ] Pre-commit hook o branch protection configurado y verificado
- [ ] `main` intacto y sin divergencia contra `origin/main`

---

## Anexo A: Estado Actual del DAG

```
* bbd312b (HEAD -> dev-mahg, origin/dev-mahg)  ← COMMIT DIRECTO (NO MERGE)
|          docs(req-003): Elena process audit — 2 PR recovery verified
|
* 7c92ac7 (origin/feature/req-001-clean-reapply, feature/req-001-clean-reapply)
|          feat(req-001): clean reapply
|
* 53b8715 (origin/feature/req-002-revert-9a544aa, feature/req-002-revert-9a544aa)
|          Revert "feat(req-001): final FIX batch"
|
* 9a544aa (main@{1}, RESET-DELETED)             ← COMMIT ELIMINADO DE main
|          feat(req-001): final FIX batch
|
* 8928c1d (origin/main, origin/HEAD, main)      ← main RESTAURADO
           fix(ax3): generateRootTemplate
```

**Nota**: `9a544aa` sigue siendo alcanzable desde `dev-mahg` (es ancestro del revert). Esto es correcto — el revert no borra historia, la revierte lógicamente.

## Anexo B: Archivos en Estado Irregular

| Archivo | Estado | Riesgo |
|---------|--------|--------|
| `.araya/plan/spec/req-003-daneel-final.md` | Untracked (`??`) | Pérdida de datos si no se commitea |
| `.araya/plan/spec/req-003-manu-final.md` | Untracked (`??`) | Pérdida de datos si no se commitea |
| `.araya/catalog/catalog.json` | Modified (`M`) | Regeneración automática no commiteada |
| `.pi/loops.json` | Modified (`M`) | Cambio no documentado |
| `stash@{0}` | Abandonado | Evidencia no archivada |

---

## Anexo C: Línea de Tiempo Forense Completa

```
T+0  (21:38)  dev-mahg = 8928c1d (= origin/main). Estado limpio.
T+1  (23:51)  ⚠️ Checkout a main. Commit 9a544aa DIRECTO en main.
              → main = 9a544aa. 95 archivos, +45K líneas.
T+2  (23:51)  Checkout a dev-mahg. Fast-forward merge de main.
              → dev-mahg = 9a544aa. Contaminación propagada.
T+3  (00:34)  Creación feature/req-002-revert-9a544aa desde dev-mahg.
              git revert de 9a544aa → commit 53b8715.
T+4  (00:34)  Fast-forward merge feature/req-002-revert → dev-mahg.
              → dev-mahg = 53b8715. Contenido revertido.
T+5  (00:34)  Stash creado: WIP on dev-mahg: 9a544aa.
T+6  (00:35)  Creación feature/req-001-clean-reapply desde 53b8715.
              Commit 7c92ac7: clean reapply sin Co-authored-by.
T+7  (00:35)  Fast-forward merge feature/req-001-clean-reapply → dev-mahg.
              → dev-mahg = 7c92ac7. REQ-001 funcional restaurado.
T+8  (00:38)  ⚠️ Commit DIRECTO bbd312b en dev-mahg (audit de Elena).
              → dev-mahg = bbd312b.
T+9  (00:38)  Push a origin (dev-mahg y feature branches).
T+10 (00:39)  Daneel escribe req-003-daneel-final.md (NUNCA commiteado).
T+11 (00:41)  Manu escribe req-003-manu-final.md (NUNCA commiteado).
T+12 (??:??)  Checkout a main. git reset --hard origin/main.
              → main = 8928c1d. main restaurado pero TOCADO.
T+13 (??:??)  Checkout a dev-mahg.
T+14 (AHORA)  Working tree: 2 archivos dirty, 2 untracked, 1 stash.
              → Estado IRREGULAR.
```

---

**Firma**: Elena, Scrum Master + PM Auditor, ARAYA
**Timestamp**: 2026-07-22
**Disposición**: 🔴 REJECTED — Full re-audit requerido tras remediación.
