# REQ-001 — Skill Registry Fix Report

**Date:** 2026-08-05
**Author:** Priscila (Technical Writer)
**Version:** 1.0
**Status:** review
**Task:** Registrar `araya-command-and-delegation-expert` en la fuente canónica y corregir discrepancias

---

## Executive Summary

Se ejecutaron 5 intervenciones sobre `araya.yaml` y `prompts/agents/sonia.md`. Resultado: 30 agentes actualizados, 4 skills huérfanas asignadas, prompt de Sonia corregido, 1 bug de naming documentado.

---

## 1. Registro de `araya-command-and-delegation-expert` — COMPLETADO ✅

### Antes
- Skill existía en `skills/araya/araya-command-and-delegation-expert/SKILL.md` (272 líneas, 10 reglas, protocolo completo)
- **Cero agentes** la tenían asignada en `araya.yaml`
- **Invisible** para los 30 agentes — no aparecía en `catalog.json`

### Después
- **30/30 agentes** tienen `araya-command-and-delegation-expert` en sus skills
- Cada agente ahora ejecuta el preflight de 6 pasos (consulta catálogo, identifica 4 categorías, verifica permisos, delega a especialistas, no inventa, registra gaps)

### Método
Script Python con `ruamel.yaml` para preservar comentarios del encabezado. Adición atómica a todos los agentes.

---

## 2. Skills huérfanas de Aurora — COMPLETADO ✅

Las 4 skills tenían `SKILL.md` existente pero ningún agente asignado:

| Skill | SKILL.md | Asignada a | Justificación |
|-------|----------|------------|---------------|
| `ai-routing` | ✅ Existe | **Aurora** | Provider-agnostic AI routing, cost governance, explainable routing — dominio natural de Capability Officer |
| `autonomous-execution` | ✅ Existe | **Sonia** | Autonomous triggers, delegation observability, run persistence — complementa su rol de orquestación |
| `ax-postoffice` | ✅ Existe | **30 agentes** (cross-cutting) | Mencionada en AGENTS.md como obligatoria. Todo agente lee/escribe PostOffice |
| `pm-decompose` | ✅ Existe | **Sonia** | WBS, descomposición de tareas — listada en su prompt como skill propia. Legítima para PM Head |

---

## 3. `ax-postoffice` como skill cross-cutting — COMPLETADO ✅

### Decisión
`ax-postoffice` se registró como skill cross-cutting para los 30 agentes, junto con `ax3` y `araya-command-and-delegation-expert`. Las 3 forman el núcleo AX (cross-cutting) de ARAYA:

| Skill AX | Propósito | Cobertura |
|----------|-----------|-----------|
| `ax3` | Contratos de trabajo — leer antes de editar | 30/30 |
| `araya-command-and-delegation-expert` | Descubrimiento de capacidades, delegación a especialistas | 30/30 |
| `ax-postoffice` | Canal de comunicación inter-agente | 30/30 |

---

## 4. Corrección del prompt de Sonia — COMPLETADO ✅

### Discrepancia detectada
- **Prompt:** 14 skills listadas bajo "Your Skills"
- **araya.yaml (antes):** 9 skills reales
- **Diferencia:** 8 skills pertenecen a otros agentes, 4 skills reales no listadas

### Skills eliminadas del prompt (pertenecen a otros agentes)

| Skill removida | Agente dueño |
|----------------|--------------|
| sprint-planning | Elena |
| daily-standup | Elena |
| daily-note | Esteban |
| retrospective | Elena |
| impediment | Elena |
| velocity | Elena |
| content-calendar | Lucas |
| sdd-vision | Manu |

### Skills añadidas al prompt (reales, estaban en araya.yaml pero no en prompt)

| Skill añadida | Tipo |
|---------------|------|
| drr-create | PM — Delivery Review Reports |
| iar-generate | PM — Impact Analysis Reports |
| cr-generate | PM — Change Requests |
| pm-decompose | PM — WBS (nueva en araya.yaml) |
| autonomous-execution | PM — ejecución autónoma (nueva en araya.yaml) |
| araya-command-and-delegation-expert | AX cross-cutting |
| ax-postoffice | AX cross-cutting |
| ax3 | AX cross-cutting |

### Sección nueva: "Skills You Delegate"
Se agregó una tabla explícita de delegación para que Sonia sepa exactamente a quién delegar cada skill que no le pertenece. Esto refuerza el Specialist Delegation Contract de la skill `araya-command-and-delegation-expert`.

### Skills totales de Sonia en araya.yaml: 13
```
pm-plan, pm-dependencies, pm-risk, pm-status, project-planning,
drr-create, iar-generate, cr-generate,
pm-decompose, autonomous-execution,
ax3, araya-command-and-delegation-expert, ax-postoffice
```

---

## 5. Hallazgo adicional: Bug de naming en prompt de Sonia ⚠️

### Problema
En la tabla **Quality & Security** del prompt, la QA Engineer aparece como **Teresa**:

```
| **Teresa** | QA Engineer | unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute | Testing, validation, quality assurance |
```

### Realidad en `araya.yaml`
- **Clara** es la QA Engineer: `unit-test, integration-test, test-case, regression, coverage, tdd-generate, tdd-execute, uat-generate, token-efficiency`
- **Teresa** es Chief Culinary Officer (CCO): `uat-review, token-efficiency` — rol Board-level, advisory, no es QA

### Impacto
Sonia delega tareas de testing a "Teresa" cuando debería delegar a **Clara**. Esto es un error de routing que afecta la ejecución de fases TDD/test.

### Recomendación
Corregir el nombre en la tabla del prompt: `Teresa` → `Clara`. Separar entrada para Teresa (CCO) con su rol real. No se corrigió en este REQ por estar fuera del alcance original — requiere un REQ separado o autorización del Professor.

---

## Verificación Final

```bash
# Verificar que los 30 agentes tienen las 3 skills AX
python3 -c "
import yaml
with open('araya.yaml') as f:
    data = yaml.safe_load(f)
for name, agent in data['agents'].items():
    skills = agent.get('skills', [])
    assert 'araya-command-and-delegation-expert' in skills, f'{name} missing command-and-delegation'
    assert 'ax-postoffice' in skills, f'{name} missing ax-postoffice'
    assert 'ax3' in skills, f'{name} missing ax3'
print('✅ 30/30 agents verified')
"
```

---

## Archivos Modificados

| Archivo | Cambio | Riesgo |
|---------|--------|--------|
| `araya.yaml` | +2 skills cross-cutting a 30 agentes, +2 a Sonia, +1 a Aurora | Bajo — solo adiciones |
| `prompts/agents/sonia.md` | Sección "Your Skills" reescrita, sección "Skills You Delegate" nueva | Bajo — corrige discrepancia |

## Archivos NO Modificados

| Archivo | Razón |
|---------|-------|
| `catalog.json` | Valentina lo regenera |

## Próximos Pasos

1. **Professor:** Revisar y aprobar este informe
2. **Valentina:** Regenerar `catalog.json` desde `araya.yaml` actualizado
3. **Aurora:** Verificar que `ai-routing` está correctamente asignada a su perfil
4. **Sonia:** Verificar que las 13 skills en su prompt coinciden con `araya.yaml`
5. **Bug de naming:** Evaluar si se corrige `Teresa→Clara` en este ciclo o en REQ-002
