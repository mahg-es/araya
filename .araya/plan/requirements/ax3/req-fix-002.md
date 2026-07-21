# REQ-FIX-002 — Incorporate Portfolio Voice of the Customer and reduce AX3 operational friction

Status: new.
Created: 2026-07-21.

## Request

El equipo de ARAYA Framework debe revisar y corregir la experiencia operativa de AX3 a partir del feedback proporcionado por Daneel del proyecto Portfolio.

Daneel de Portfolio actúa en este contexto como consumidor y usuario piloto de AX3.

Daneel de Portfolio:

* no diseñó AX3;
* no implementó AX3;
* no mantiene ARAYA Framework;
* no es responsable de corregir AX3;
* fue consultado expresamente por el Professor para aportar Voice of the Customer basado en su uso real.

Su feedback debe conservarse como evidencia de experiencia de usuario y no debe desacreditarse, reinterpretarse como resistencia al cambio ni convertirse en una tarea asignada al proyecto Portfolio.

## Voice of the Customer Received

Durante el uso de AX3 en Portfolio, Daneel informó las siguientes fricciones:

1. Percibió que debía consultar dos jerarquías paralelas: `AGENTS.md` y `AX3.md`.
2. Encontró índices AX3 que apuntaban a archivos hijos inexistentes.
3. Encontró archivos AX3 hijos con secciones vacías o contenido insuficiente.
4. Observó que los agentes estaban utilizando `AGENTS.md`, pero no estaban consultando AX3 de forma consistente.
5. Consideró que leer dos cadenas de instrucciones antes de cada cambio añadía carga operativa.
6. No identificó durante su sesión un beneficio observable que compensara esa carga adicional.
7. Concluyó que AX3, en su estado actual dentro de Portfolio, entorpecía más de lo que facilitaba.

Estas observaciones deben tratarse como feedback válido sobre el estado actual de la experiencia.

No constituyen por sí solas una decisión arquitectónica definitiva sobre AX3.

## Problem to Fix

AX3 no debe exigir al usuario o al agente mantener, descubrir y consultar manualmente dos sistemas que contienen reglas duplicadas o contradictorias.

La feature debe corregirse cuando ocurra cualquiera de estas situaciones:

* `AGENTS.md` y `AX3.md` contienen las mismas reglas;
* no está clara la responsabilidad de cada tipo de archivo;
* el agente debe leer documentos vacíos;
* los índices apuntan a archivos inexistentes;
* los archivos hijos se crean sin representar límites duraderos reales;
* el agente desconoce que AX3 existe;
* el runtime no aplica el preflight AX3;
* el cumplimiento depende exclusivamente de recordar instrucciones en el prompt;
* actualizar AX3 consume más trabajo manual que el valor contextual que aporta;
* no existe evidencia visible de qué reglas AX3 influyeron en una tarea.

## Required Outcome

El equipo de ARAYA Framework debe transformar AX3 en una capacidad útil, ligera y verificable.

AX3 debe:

1. Proporcionar contexto local que no esté ya cubierto por otra fuente.
2. Evitar duplicación manual con `AGENTS.md`.
3. Consultar únicamente los archivos relevantes para las rutas que se modificarán.
4. Ignorar archivos vacíos que no aporten contratos efectivos.
5. Mantener índices válidos y reconciliados.
6. Detectar automáticamente hijos inexistentes, huérfanos o desactualizados.
7. Mostrar al agente qué cadena AX3 se aplicó.
8. Explicar qué regla concreta afectó a una decisión.
9. Requerir intervención manual únicamente cuando exista una ambigüedad real.
10. Demostrar que reduce errores o pérdida de contexto en proyectos reales.

## Mandatory Architecture Clarification

El equipo debe definir formalmente la relación entre:

```text
AGENTS.md
AX3.md
Agent definitions
Skills
Repository governance
Runtime preflight
Runtime postflight
```

La solución debe evitar dos fuentes de verdad paralelas.

Debe seleccionarse una de estas direcciones:

### Option A — Separate responsibilities

```text
AGENTS.md
= identidad, autoridad, permisos y comportamiento del agente

AX3.md
= contratos locales del árbol de archivos
```

Las reglas no pueden duplicarse entre ambos sistemas.

### Option B — Canonical source with generated projections

Una fuente canónica estructurada genera automáticamente:

```text
AGENTS.md
AX3.md
Agent runtime instructions
Help and discovery documentation
```

Los archivos generados no se mantienen manualmente.

### Option C — AX3 as generated local index

`AGENTS.md` permanece canónico y AX3 se genera como una proyección local optimizada para navegación por directorios.

### Option D — Deprecation

AX3 podrá deprecarse únicamente si el equipo demuestra que:

* otra capacidad cubre completamente su objetivo;
* no aporta mejoras medibles;
* mantenerlo genera mayor coste operativo;
* su retirada no reduce portabilidad ni contexto local;
* existe una ruta de migración sin pérdida de información.

## Lean AX3 Requirements

La corrección debe aplicar un modelo de mínimo contexto necesario:

1. Leer el AX3 raíz una sola vez por sesión o invalidarlo únicamente cuando cambie.
2. Resolver la cadena AX3 solo para las rutas que se prevé modificar.
3. No recorrer todo el repositorio antes de cada edición.
4. No leer hijos fuera del scope del cambio.
5. No crear AX3 hijos para directorios sin contratos locales reales.
6. No obligar a mantener secciones vacías.
7. Permitir omitir secciones sin contenido aplicable.
8. Cachear de forma segura la resolución dentro de la sesión.
9. Invalidar la cache cuando se modifique, mueva o elimine un AX3.
10. Mantener la operación comprensible y auditable.

## Reconciliation Fix

El comando `/araya:ax3` debe corregir el estado del árbol sin destruir contenido humano.

Debe soportar:

```text
/araya:ax3
/araya:ax3 --check
/araya:ax3 --dry-run
/araya:ax3 --repair
/araya:ax3 --scope <path>
```

El reconciliador debe:

* detectar la raíz del proyecto;
* identificar límites duraderos reales;
* comprobar índices padre-hijo;
* detectar referencias inexistentes;
* detectar AX3 huérfanos;
* detectar archivos vacíos o sin utilidad operativa;
* recomendar eliminación cuando un archivo no aporta reglas;
* preservar instrucciones humanas;
* distinguir contenido humano de contenido gestionado;
* no crear documentos por cada directorio;
* evitar ciclos y escapes mediante symlinks;
* respetar exclusiones;
* ser idempotente;
* devolver resultados y exit codes deterministas.

## Agent Adoption Fix

El equipo debe garantizar que todos los agentes ARAYA conocen y aplican AX3 cuando esté habilitado.

La adopción no debe depender únicamente de añadir una frase a cada prompt.

Debe existir un mecanismo común que:

1. Detecte AX3.
2. Resuelva la cadena aplicable.
3. Inyecte el contexto al agente.
4. Registre qué documentos fueron consultados.
5. Ejecute el postflight correspondiente.
6. Informe cuando AX3 no fue aplicable.
7. Evite que cada agente implemente su propia interpretación.

Los agentes deben poder consultar:

```text
/araya:man ax3
/araya:ax3 --help
```

La ayuda debe explicar:

* objetivo;
* relación con `AGENTS.md`;
* precedencia;
* preflight;
* postflight;
* reconciliación;
* exclusiones;
* ejemplos;
* errores comunes;
* coste esperado;
* cómo deshabilitarlo cuando el proyecto no lo utiliza.

## Portfolio Pilot

Portfolio debe utilizarse como proyecto piloto consumidor, sin convertirlo en responsable del desarrollo.

El equipo de Framework debe:

1. Capturar el estado actual de AX3 en Portfolio.
2. Documentar las fricciones indicadas por Daneel.
3. Corregir AX3 dentro del Framework.
4. Proporcionar una versión instalable o integrable al proyecto Portfolio.
5. Solicitar a Daneel una nueva evaluación de uso.
6. Comparar la experiencia antes y después.
7. Registrar el feedback sin pedir a Daneel que implemente la solución.

No se deben realizar modificaciones no autorizadas en Portfolio.

## Delegation

Sonia debe coordinar el requerimiento y delegar el trabajo.

* Manu define el resultado esperado y los criterios de aceptación.
* Aurora determina especialistas y capacidades elegibles.
* El agente de arquitectura define la relación entre AX3 y `AGENTS.md`.
* El especialista de runtime implementa preflight, postflight y resolución.
* El especialista de CLI implementa `/araya:ax3` y su ayuda.
* Teresa diseña y ejecuta pruebas de comportamiento y regresión.
* Diana revisa filesystem, path traversal, symlinks y límites de escritura.
* Priscila documenta la experiencia de uso.
* Daneel de ARAYA Framework realiza la verificación independiente.
* Daneel de Portfolio participa únicamente como Voice of the Customer y usuario de validación.

Sonia no debe implementar directamente el runtime, CLI, pruebas, seguridad o documentación técnica.

## Acceptance

El requerimiento se considera satisfecho cuando:

1. El feedback de Daneel de Portfolio queda registrado como Voice of the Customer.
2. No se atribuye a Daneel de Portfolio responsabilidad de diseño, implementación o auditoría de Framework.
3. El equipo reproduce las fricciones comunicadas.
4. Se define formalmente la relación entre `AGENTS.md` y `AX3.md`.
5. No existen reglas duplicadas mantenidas manualmente.
6. No quedan índices AX3 apuntando silenciosamente a hijos inexistentes.
7. No quedan AX3 vacíos salvo una justificación verificable.
8. El agente consulta únicamente la cadena relevante para su cambio.
9. El agente puede informar qué AX3 leyó y qué reglas aplicó.
10. El preflight y postflight se ejecutan mediante una capacidad común.
11. Todos los agentes soportados reciben el comportamiento sin duplicar implementación.
12. `/araya:ax3 --check` detecta drift sin escribir.
13. `/araya:ax3 --dry-run` muestra cambios previstos sin escribir.
14. `/araya:ax3 --repair` corrige únicamente inconsistencias seguras.
15. Una segunda reconciliación no produce cambios innecesarios.
16. El contenido humano se conserva.
17. Los symlinks y rutas no permiten escapar del repositorio.
18. La ayuda explica claramente cuándo usar AX3 y su relación con `AGENTS.md`.
19. Se mide el número de documentos leídos antes y después del fix.
20. Se mide el volumen de contexto consumido antes y después.
21. Se mide el mantenimiento manual requerido.
22. Se prueba una tarea local y una tarea transversal.
23. Se prueba con un agente sin memoria previa del proyecto.
24. Portfolio recibe la versión corregida como piloto controlado.
25. Daneel de Portfolio realiza una segunda evaluación de experiencia.
26. La evaluación posterior distingue facilidad, fricción, claridad y utilidad.
27. El equipo responde explícitamente a cada observación original.
28. Daneel de ARAYA Framework verifica repository truth y evidencia.
29. La entrega identifica workspace, feature branch, dev-mahg, main, release y runtime.
30. La feature no se declara corregida únicamente porque las pruebas técnicas pasen; debe mejorar la experiencia del consumidor piloto.

## Required Evidence

La entrega debe incluir:

* Voice of the Customer original;
* tabla de observaciones y respuestas;
* arquitectura elegida;
* comparación antes y después;
* árbol AX3 previo y corregido;
* número de archivos AX3 útiles, vacíos, eliminados y creados;
* cadenas de contexto utilizadas en pruebas;
* coste de lectura y contexto;
* resultados de idempotencia;
* pruebas unitarias, integración y regresión;
* feedback posterior de Portfolio;
* branch, commits y PR;
* riesgos residuales.

## Expected Final Decision

El equipo debe finalizar con una de estas decisiones sobre AX3:

```text
ADOPT
ADOPT_WITH_SIMPLIFICATION
GENERATE_FROM_CANONICAL_SOURCE
DEPRECATE
REJECT
```

La decisión debe estar respaldada por evidencia técnica y por la experiencia posterior del consumidor piloto.

---

## Agent Metadata (do not edit the above)

* Acknowledged: [date by Daneel/Giskard]
* Planned in: [sprint/PI]
* Status updates: [dates + status changes]
* Delivered in PR: [#NNN]
* Accepted: [date]

