# El Secreto — Origen del Mantra Operacional

**Fuente:** Conversación con un amigo, compartida por The Data Professor
**Artifact ID:** mantra-origin-001
**Relacionado:** `mantra-operational.md`

---

## Los Cinco Principios (con evidencia de batalla)

### 1. Investigación antes de código, siempre
Patrón: pedir mejora → Daneel investiga y propone sin tocar → muestra estado actual y propuesta → Profesor decide → solo entonces escribe código. Cuando se saltó este paso (códigos hex), falló. Cuando se respetó, nunca falló.

### 2. Preview antes de escribir, sin excepciones
Todo script que tocaba datos tuvo `--dry-run` por defecto y `--apply` explícito. El Profesor revisaba el preview antes del apply. No fue burocracia: impidió errores reales (fechas a 4 años en vez de 3, cazadas en preview, no en producción).

### 3. Respaldo manual del minuto anterior
Aunque hubiera respaldos automáticos diarios, antes de aplicar nada se hacía uno fresco. No es paranoia — es lo que permite dormir esa noche.

### 4. Decir que no a juntar cosas en un solo bloque
Tres mejoras independientes en un PR = imposible revisar bien y, si algo falla, no se sabe qué lo causó. El instinto de "es rápido, mételo todo" casi siempre cuesta más caro al final. Excepción: piezas del mismo concepto sí pueden ir juntas.

### 5. Honestidad estratégica por encima de complacencia
Cuando algo no cuadraba, se dijo. Cuando había que frenar para confirmar una regla, se frenó. Cuando el instinto iba hacia complejidad innecesaria (códigos hex), se señaló. Un asistente que solo dice "sí, claro" lleva a un sitio peor que uno que dice "espera, esto que me pides tiene un matiz."

---

## Dos Hábitos del Profesor

- **Parar cuando algo parece raro.** En el momento, no después. Cuando todavía es barato arreglarlo.
- **Distinguir lo que se sabe de lo que se sospecha.** Pedir lecturas en frío ("no quiero especular, que Daneel mire") en vez de sugerir la respuesta. Si se sugiere, el agente confirma el sesgo. Lectura en frío = hallazgos reales, no confirmación de ruido.

---

## La Regla de Escalado

> Escalar el cuidado al riesgo real del trabajo, no aplicar siempre el mismo nivel de fricción.

| Contexto | Nivel |
|----------|-------|
| Producción con datos reales | Máxima cautela — investigar, preview, respaldo, una cosa |
| Prototipo exploratorio | Velocidad — menos fricción, más iteración |
| Datos que no importan | Ir rápido — el preview puede ser opcional |

---

## Resumen de una frase

> "Investigar antes de tocar, preview antes de escribir, respaldo antes de aplicar, una cosa cada vez, y un agente que te diga 'espera, esto tiene un matiz' en vez de uno que solo te diga que sí."
