# Rolando Reality Audit v2 — Independent Verification

**Auditor**: Rolando (Reality Authority — Verifier)  
**Not proxy. Not delegated. Independent verification.**  
**Date**: 2026-07-25  
**Alcance**: ARAYA Framework (SHA 6829204) + ARAYA Project Coordinator (SHA 47a0bae)  
**Disposición Final**: **BLOCK**

---

## Preámbulo

El informe previo (`rolando-reality-audit-ponny-express-0005-0006.md`) fue ejecutado
por **R. Daneel Olivaw actuando como Rolando por delegación**. No es independiente.
Daneel es un agente de verificación, sí — pero opera en la cadena de delivery de
Sonia/Manu. La Verificación de Realidad es una función TIER 1 de gobernanza que
requiere independencia estructural. Este informe restablece esa independencia.

---

## BLOQUE 1 — Estado Git Ambos Repositorios

### 1.1 ARAYA Framework

| Indicador | Valor | Estado |
|-----------|-------|--------|
| Branch | `dev-mahg` | ✅ |
| HEAD | `682920415726152b69296612fbeca9653299ea3f` | ✅ |
| HEAD vs origin/dev-mahg | Coinciden | ✅ |
| origin/main | `8928c1d4b76d9a7a6ac6c2ff06352f017eacd50c` | — |
| Working tree | `.pi/loops.json` (M) + 7 untracked spec files | ⚠️ |
| Stashes | 0 | ✅ |
| Worktrees | 1 (canónico) | ✅ |

**Disposición**: **PASS** con observación menor (dirty working tree).

### 1.2 ARAYA Project Coordinator

| Indicador | Valor | Estado |
|-----------|-------|--------|
| Branch | `dev-araya-portfolio` | ⚠️ |
| HEAD | `47a0bae88e9de9edd67a883f9e306be282f0dce1` | ✅ |
| origin/main | `e79339855b3a780bfe52a91a006321f8312d1ea5` | — |
| Working tree | `portfolio/projects/araya/req-002.md` (M) | ⚠️ |
| Untracked | 29 archivos (26 AX3.md + 7 specs de proyecto) | ⚠️ |
| Stashes | 17 acumulados | 🔴 |
| Worktrees | 4: 1 canónico + **3 en /tmp/** | 🔴 |

**Evidencia de worktrees en /tmp**:
```
/tmp/git-opmodel-worktree      3f0b307 [feature/git-operating-model]
/tmp/verify-git-opmodel        3f0b307 (detached HEAD)
/tmp/verify-opmodel            f467b18 (detached HEAD)
```

**Finding R1.1 — BLOCK (canon-rule-001)**: Tres worktrees en `/tmp/`. Violación directa
de canon-rule-001 que exige `~/github/mahg-es/worktrees/<repo>/<name>`.

**Finding R1.2 — CONDITIONAL**: 17 stashes acumulados desde PR #87. Higiene de
workspace pobre. Stashes deben resolverse o documentarse.

**Finding R1.3 — CONDITIONAL**: 29 archivos untracked. Especialmente crítico:
26 archivos AX3.md generados en batch pero nunca commiteados (ver BLOQUE 3).

**Disposición BLOQUE 1**: **BLOCK** (por /tmp worktrees en Coordinator)

---

## BLOQUE 2 — AX3 Security Error (Fase 2)

### 2.1 Traza de Ejecución

Se trazó el flujo completo de seguridad en `src/araya/v2/ax3/resolver.ts` y
`reconciler.ts`:

1. **findProjectRoot()**: Camina desde `process.cwd()` hacia arriba buscando
   `.git` o `araya.yaml`. En coordinator, encuentra `.git` →
   `/home/thedataprofessor/github/mahg-es/araya-project-coordinator`.

2. **walkDirs()**: Itera directorios desde el root. Para cada entrada:
   - `realpathSync(fullPath)` — resuelve symlinks
   - `normalize(resolvedPath)` — normaliza
   - `norm.startsWith(normalize(root))` — verifica no escape

3. **Symlinks**: CERO symlinks en el coordinator (`find . -type l` → vacío).

4. **Simulación Python**: Confirmado — ningún directorio escapa del root.

### 2.2 Análisis de Seguridad

| Vector | Resultado |
|--------|-----------|
| Symlinks en el repo | No existen |
| realpathSync escape | No hay rutas que resuelvan fuera del root |
| findProjectRoot bypass | El root se identifica correctamente via `.git` |
| walkDirs traversal a /tmp | No ocurre — walkDirs va hacia abajo, no lateralmente |
| Test (j) Symlink Safety | ✅ 16/16 — valida que symlinks externos son bloqueados |

### 2.3 Veredicto

**FALSE_POSITIVE_REPRODUCED**: El "security error" reportado es un falso positivo.
El sistema de seguridad de AX3 funciona correctamente. No hay escape de symlinks
porque no hay symlinks. El mecanismo de `walkDirs` bloquea correctamente cualquier
symlink que apuntara fuera del proyecto.

**Nota técnica** (no bloqueante): Existe un edge case teórico donde
`findProjectRoot` usa `pathResolve()` (no `realpathSync()`) para el root. Si el
CWD fuera un symlink, el root normalizado no coincidiría con las rutas resueltas
de `realpathSync`. Esto podría causar un falso positivo (entries legítimas
marcadas como escape) pero NUNCA un escape real. Severidad: LOW, no explotable.

**Disposición BLOQUE 2**: **PASS**

---

## BLOQUE 3 — AX3 Templates Vacíos (Fase 3)

### 3.1 Evidencia de Generación

Los 26 archivos AX3.md en el Coordinator **NO están commiteados**:

```
$ git log --all --oneline -- "**/AX3.md"
(ningún resultado — ningún AX3.md jamás fue commiteado)
```

Todos los 25 child AX3.md fueron creados **exactamente al mismo segundo**:
```
2026-07-21 21:20:07.072788366 +0200 — 25 archivos simultáneos
```

El root AX3.md fue creado **18 minutos después**:
```
2026-07-21 21:38:17.573079934 +0200 — AX3.md (root)
```

### 3.2 Análisis de Contenido

**Root AX3.md** (`AX3.md`, 2603 bytes):
- Contenido estructural: ✅ Preflight (6 pasos), Postflight, Hierarchy, Closeout
- Child AX3 Index: ✅ 9 entradas correctas apuntando a hijos que existen
- Secciones de dominio: ❌ TODAS vacías (Purpose, Ownership, Local Contracts, Work Guidance, Verification = HTML comments sin contenido)

**9 Child AX3.md estructurales** (`.araya/`, `cmdb/`, `docs/`, `governance/`, `ops/`, `planning/`, `portfolio/`, `resources/`, `src/`):
- TODOS son templates vacíos — solo HTML comments

**16 Deep-child AX3.md** (ej. `.araya/evidence/`, `.araya/postoffice/`, `docs/architecture/`, `governance/adrs/`, `portfolio/projects/`):
- TODOS templates vacíos
- NO están indexados en sus parents (el managed section dice "No child AX3.md files detected")

### 3.3 Análisis de Autoría

```
$ git log --all --oneline -- "AX3.md"
(ningún resultado)

$ git blame AX3.md
(fatal: no such path in HEAD — el archivo nunca fue commiteado)
```

**No hay commit de creación. No hay autor. No hay git blame posible.**
Los archivos fueron generados fuera de git, probablemente por `/araya:ax3` ejecutado
por un agente o por el Professor manualmente.

### 3.4 Child AX3 Index — Auditoría de Integridad

| Entry en Root Index | ¿Archivo existe? | ¿Tiene contenido? | ¿Indexa sus hijos? |
|---------------------|:----------------:|:-----------------:|:------------------:|
| `.araya/AX3.md` | ✅ | ❌ Template vacío | ❌ (no detecta evidence, postoffice) |
| `cmdb/AX3.md` | ✅ | ❌ Template vacío | ❌ |
| `docs/AX3.md` | ✅ | ❌ Template vacío | ❌ (no detecta architecture, historical) |
| `governance/AX3.md` | ✅ | ❌ Template vacío | ❌ (no detecta adrs, standards) |
| `ops/AX3.md` | ✅ | ❌ Template vacío | ❌ |
| `planning/AX3.md` | ✅ | ❌ Template vacío | ❌ (no detecta current) |
| `portfolio/AX3.md` | ✅ | ❌ Template vacío | ❌ (no detecta projects) |
| `resources/AX3.md` | ✅ | ❌ Template vacío | ❌ (no detecta examples, schemas) |
| `src/AX3.md` | ✅ | ❌ Template vacío | ❌ |

### 3.5 Vector de Falso Cumplimiento

Un agente que ejecute el preflight AX3:
1. Lee el root AX3.md → recibe protocolo estructural válido ✅
2. Camina la cadena de child AX3.md → recibe 9+ templates vacíos
3. Puede reportar "AX3 chain read" como cumplimiento
4. Pero NO recibe ningún contrato de dominio, guía de trabajo, o criterio de verificación

**Esto es un vector de falso cumplimiento**: la estructura existe pero el contenido
de gobernanza está ausente. Los agentes pueden declarar cumplimiento sin haber
recibido guía sustantiva.

**Disposición BLOQUE 3**: **BLOCK**
- Estructura: PASS (el esqueleto AX3 es correcto)
- Contenido: BLOCK (26 archivos = 0 contenido de dominio)
- Trazabilidad: BLOCK (sin commit, sin autor, sin git blame)
- Falso cumplimiento: BLOCK (los agentes reciben protocolo vacío)

---

## BLOQUE 4 — PR #77 canon-rule-001 (Fase 4)

### 4.1 Matriz de Verificación

| Requisito | Cambiado en PR #77 | Pre-existente | Instalado | Operacional | Testeado | Missing |
|-----------|:------------------:|:-------------:|:---------:|:-----------:|:--------:|:-------:|
| AGENTS.md (canon-rule-001) | ✅ (+25 líneas) | ✅ | ✅ | ✅ | ✅ | — |
| Pre-commit Rule 6 | ✅ (+12 líneas) | ✅ (Rules 1-5 ya existían) | ❌ | ❌ | — | 🔴 |
| AX3 tests (symlink + hidden) | ✅ (+14/-2) | ✅ (ax3-test.js existía) | ✅ | ✅ | ✅ | — |
| Portfolio spec | — | — | — | — | — | 🔴 |
| /tmp worktree detection | — | — | — | — | — | 🔴 |

### 4.2 Evidencia Crítica: Hook NO Instalado

**Archivo fuente**: `.araya/hooks/pre-commit` — EXISTE ✅, 6 reglas, ejecutable

**Directorio de hooks de git**: `.git/hooks/` — **SOLO archivos .sample**

```bash
$ ls .git/hooks/
applypatch-msg.sample  fsmonitor-watchman.sample  pre-applypatch.sample     pre-merge-commit.sample  pre-push.sample     pre-receive.sample     push-to-checkout.sample   update.sample
commit-msg.sample      post-update.sample         pre-commit.sample         prepare-commit-msg.sample  pre-rebase.sample  push-to-checkout.sample  sendemail-validate.sample
```

**NO existe `.git/hooks/pre-commit`.**

```bash
$ git config core.hooksPath
(vacío — usa el default .git/hooks/)
```

**El hook NUNCA se ejecuta.** Cualquier claim de que "el hook está activo" es FALSO.

### 4.3 Evidencia Crítica: Bypass de /tmp en Rule 6

Simulación con `/tmp/git-opmodel-worktree`:

```
WT_PATH=/tmp/git-opmodel-worktree
WT_EXPECTED=/home/thedataprofessor/github/mahg-es/worktrees
WT_REAL=/tmp/git-opmodel-worktree
→ grep "$WT_EXPECTED" → NO MATCH (no está en worktrees/)
→ grep "$HOME/github/mahg-es/" → NO MATCH (no está en repo dir)
→ cae al exit 0 → BYPASS
```

**Aunque el hook estuviera instalado, los worktrees en /tmp pasarían sin detección.**

### 4.4 Análisis

| Finding | Hallazgo | Severidad |
|---------|----------|-----------|
| R4.1 | Hook pre-commit NO instalado en `.git/hooks/` | 🔴 CRÍTICA |
| R4.2 | Rule 6 no detecta worktrees en /tmp (bypass gap) | 🔴 CRÍTICA |
| R4.3 | Múltiples agentes declararon el hook como "activo" — afirmación FALSA | 🔴 CRÍTICA |
| R4.4 | PR #77 cambió 3 archivos correctamente | ✅ |
| R4.5 | AGENTS.md contiene canon-rule-001 completo | ✅ |
| R4.6 | ax3-test.js tiene test de symlink safety | ✅ |

### 4.5 Falsas Afirmaciones de Agentes

Los siguientes reportes declararon el hook como "activo" o "deployed":

- **Daneel** (ponny-express-0002-daneel-final.md): "Hooks presentes | pre-commit (5 reglas) + preflight.sh"
- **Manu** (ponny-express-0002-manu-final.md): "Hooks de gobernanza | pre-commit (5 reglas) + preflight.sh ✅"
- **Elena** (ponny-express-0002-elena-final.md): "Pre-commit hook deployed | ✅ .araya/hooks/pre-commit"

**REALIDAD**: El archivo existe en `.araya/hooks/` pero NO está instalado en `.git/hooks/`.
Existencia ≠ Activación. Esto es exactamente el tipo de discrepancia que la
Verificación de Realidad debe detectar: los agentes confundieron "archivo presente"
con "mecanismo operacional" (violación de REAL-002: Configured ≠ Operational).

**Disposición BLOQUE 4**: **BLOCK**
- PR #77 contenido: PASS (los cambios son correctos)
- Hook instalación: BLOCK (no instalado en .git/hooks/)
- Hook bypass: BLOCK (/tmp worktrees no detectados)
- Reporting falso: BLOCK (múltiples agentes declararon "activo" lo que solo está "presente")

---

## BLOQUE 5 — Portfolio canon-rule-001 (Fase 5)

### 5.1 Evidencia en Coordinator

```bash
$ git status --short portfolio/projects/araya/canon-rule-001.md
?? portfolio/projects/araya/canon-rule-001.md

$ git branch -a | grep -i "canon\|worktree\|rule-001"
(ningún resultado)

$ git log --oneline --all --grep="canon-rule-001\|worktree-hygiene"
(ningún resultado en coordinator)

$ git log --oneline --all -- portfolio/projects/araya/canon-rule-001.md
(ningún resultado — archivo nunca commiteado)
```

### 5.2 Matriz

| Indicador | Framework | Coordinator |
|-----------|:---------:|:-----------:|
| Spec document exists | ✅ (comprehensive, 7374 bytes) | ❌ (archivo untracked, no PR) |
| Feature branch | ✅ `feature/canon-rule-001-worktree-hygiene` | ❌ No existe |
| PR merged | ✅ PR #77 | ❌ No existe |
| AGENTS.md updated | ✅ | N/A |
| Hook implemented | ✅ `.araya/hooks/pre-commit` Rule 6 | ❌ No existe |
| Hook ACTIVATED | ❌ | ❌ |
| Worktree violations resolved | ✅ (Framework repo limpio) | ❌ (3 en /tmp persisten) |
| Stash hygiene | ✅ (0 stashes) | ❌ (17 acumulados) |

### 5.3 Análisis

La regla canon-rule-001 fue concebida como vinculante para TODOS los repositorios.
Sin embargo:
- **Solo el Framework** tiene implementación parcial (hook existe pero no activado)
- **El Coordinator** — el sistema que debe gobernar el portfolio — tiene:
  - Spec untracked (nunca integrado)
  - Cero branches, cero PRs, cero hooks
  - Las mismas violaciones que la regla busca prevenir (3 worktrees en /tmp)

Esto no es un gap de implementación. Es un gap de gobernanza: **la regla que debe
gobernar el portfolio no está implementada en el sistema que gestiona el portfolio.**

**Disposición BLOQUE 5**: **BLOCK**
- Spec document: CONDITIONAL (existe pero untracked)
- Implementation: BLOCK (sin branch, sin PR, sin hook)
- Enforcement: BLOCK (violaciones activas persisten)
- Gobernanza: BLOCK (el sistema de portfolio no se gobierna a sí mismo)

---

## BLOQUE 6 — Tests desde SHA 6829204 (Fase 5)

### 6.1 Ejecución Independiente Completa

Ejecutados desde HEAD `6829204` en el Framework:

| # | Suite | Tests | Passed | Failed | Status |
|---|-------|-------|--------|--------|--------|
| 1 | `ax3-test.js` | 16 | 16 | 0 | ✅ |
| 2 | `req-001-unit-test.js` | 54 | 54 | 0 | ✅ |
| 3 | `req-001-delegation-test.js` | 40 | 40 | 0 | ✅ |
| 4 | `req-001-integration-test.js` | 28 | 28 | 0 | ✅ |
| 5 | `catalog-test.js` | 43 | 43 | 0 | ✅ |
| 6 | `req-001-discovery-test.js` | 27 | 27 | 0 | ✅ |
| 7 | `man-test.js` | 56 | 56 | 0 | ✅ |
| 8 | `mvp2-smoke-test.js` | 22 | 21 | 1 | ⚠️ |
| **TOTAL** | | **286** | **285** | **1** | **99.65%** |

### 6.2 Único Fallo — mvp2-smoke-test.js

```
❌ has 29 agents: Expected 29, got 30
```

**Causa**: El test espera 29 agentes (comentario: "29 since AX Slice 8"). El
catálogo tiene 30 agentes porque Rolando fue agregado. El test está stale, no es
un bug de producción. Severidad: LOW. Corrección: actualizar el expected count a 30.

### 6.3 Findings No-Bloqueantes de Suites

1. **req-001-delegation-test.js** (2 findings):
   - Sonia no tiene `tasks_must_delegate` constraints — contrato de delegación no forzado
   - `/araya:provider:list` delegado a `none` — debería delegar a aurora

2. **req-001-discovery-test.js** (1 finding):
   - Sonia tiene 98 skills en su prompt que no están en el catálogo

3. **catalog-test.js** (warnings no-bloqueantes):
   - 52 missing sections en 123 SKILL.md (principalmente "What problem this solves", "When to use", "Input", "Output")
   - 4 undeclared skills detectadas: `skills-lifecycle`, `spof-detection`, `hiring-recommendations`, `organizational-health`

### 6.4 Test de Symlink Safety (Relevante para BLOQUE 2)

```
(j) Symlink Safety
  ✅ symlinks outside project root are blocked
```

El test (j) crea un symlink que apunta fuera del proyecto y verifica que
el reconciliador NO sigue el symlink. Esto confirma que el security check
de walkDirs funciona. El falso positivo del BLOQUE 2 queda evidenciado.

**Disposición BLOQUE 6**: **PASS**
- 285/286 tests pasan (99.65%)
- El único fallo es un test stale (expected count desactualizado)
- Los 3 findings no-bloqueantes son known issues documentados

---

## RESUMEN DE DISPOSICIONES

| Bloque | Scope | Disposición | Hallazgo Principal |
|--------|-------|-------------|--------------------|
| B1 | Git Framework | **PASS** | Dirty working tree menor |
| B1 | Git Coordinator | **BLOCK** | 3 worktrees en /tmp/ violan canon-rule-001 |
| B2 | AX3 Security Error | **PASS** | FALSE_POSITIVE_REPRODUCED — no hay escape |
| B3 | AX3 Vacíos | **BLOCK** | 26 archivos = 0 contenido de dominio, sin commit, sin autor |
| B4 | PR #77 Hook | **BLOCK** | Hook NO instalado en .git/hooks/ + bypass de /tmp |
| B5 | Portfolio canon-rule-001 | **BLOCK** | Spec untracked, sin branch, sin PR, sin enforcement |
| B6 | Tests | **PASS** | 285/286 passed (99.65%) |

---

## DISPOSICIÓN FINAL: BLOCK

**Cuatro BLOCKs independientes impiden PASS o CONDITIONAL:**

### BLOCK 1 — /tmp Worktrees (canon-rule-001)
Tres worktrees en ubicación no autorizada. La regla existe, los worktrees
violatorios persisten. Remediation: `git worktree remove` de cada uno,
`git worktree prune`.

### BLOCK 2 — Hook NO Instalado
El pre-commit hook con Rule 6 (canon-rule-001) existe como archivo pero
NUNCA fue instalado en `.git/hooks/`. Esto es gravísimo: todos los agentes
de gobernanza (Daneel, Manu, Elena) declararon el hook "activo" cuando
solo está "presente". REAL-002: Configured ≠ Operational.

### BLOCK 3 — AX3 Vacío + Sin Trazabilidad
26 archivos AX3.md sin contenido de dominio, sin commit, sin git blame.
La jerarquía existe como estructura pero no como gobernanza. Los agentes
pueden declarar "AX3 chain read" sin recibir ninguna guía sustantiva.
Vector de falso cumplimiento.

### BLOCK 4 — Portfolio Sin Auto-Gobernanza
canon-rule-001 está documentada pero no implementada en el Coordinator.
El sistema que debe gobernar el portfolio no se gobierna a sí mismo.
Sin branch, sin PR, sin hooks, sin enforcement.

---

## Discrepancias con el Informe Daneel-Proxy

| Aspecto | Daneel (proxy) | Rolando (independiente) |
|---------|---------------|------------------------|
| Disposición final | CONDITIONAL | **BLOCK** |
| BLOQUE 4 Hook | PASS ("Hooks: PASS") | **BLOCK** (hook no instalado) |
| BLOQUE 4 Bypass /tmp | No detectado | **Detectado y evidenciado** |
| BLOQUE 3 AX3 | BLOCK (templates vacíos) | **BLOCK + sin commit + sin autor** |
| BLOQUE 6 Tests | 2 suites, 70/70 | **8 suites, 285/286** |
| Falsas afirmaciones | No investigadas | **Evidenciadas (3 agentes)** |

**Conclusión**: El informe proxy de Daneel subestimó la severidad del BLOQUE 4
(aceptó "hook presente" como "hook activo") y no detectó el bypass de /tmp.
Esto demuestra por qué la Verificación de Realidad debe ser independiente:
Daneel opera en la misma cadena de delivery que produjo el hook y no puede
cuestionarla imparcialmente.

---

## Recomendaciones (Advisory — El Professor Decide)

1. **Limpiar /tmp worktrees** (BLOCK → PASS):
   ```bash
   cd ~/github/mahg-es/araya-project-coordinator
   git worktree remove /tmp/git-opmodel-worktree
   git worktree remove /tmp/verify-git-opmodel
   git worktree remove /tmp/verify-opmodel
   git worktree prune
   ```

2. **Activar el hook** (BLOCK → PASS):
   ```bash
   cd ~/github/mahg-es/araya
   ln -sf ../../.araya/hooks/pre-commit .git/hooks/pre-commit
   # O: cp .araya/hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
   ```

3. **Cerrar el bypass de /tmp en Rule 6** (BLOCK → PASS):
   Cambiar el `elif` por un `else` que bloquea cualquier ubicación no canónica:
   ```bash
   if echo "$WT_REAL" | grep -q "$WT_EXPECTED"; then
     : # OK
   else
     echo "❌ BLOCKED: Worktree at $WT_REAL is not in canonical location $WT_EXPECTED"
     exit 1
   fi
   ```

4. **Poblar AX3.md con contenido de dominio** (BLOCK → CONDITIONAL):
   - Mínimo: Purpose, Ownership, Verification en root + portfolio/, governance/, .araya/
   - Commitear todos los AX3.md al repo

5. **Implementar canon-rule-001 en Coordinator** (BLOCK → CONDITIONAL):
   - Crear feature branch
   - Commitear portfolio/projects/araya/canon-rule-001.md
   - Agregar hook equivalente
   - Crear PR

6. **Resolver 17 stashes** (CONDITIONAL → PASS):
   - `git stash list` → documentar o droppear cada uno

7. **Actualizar mvp2-smoke-test.js**: expected agent count 29 → 30

---

*Rolando — Reality Authority (Verifier)*  
*Disposición: BLOCK*  
*Timestamp: 2026-07-25*  
*Este informe es vinculante para gobernanza. Reportado a Giskard.*
