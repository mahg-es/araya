# MAHG Platform Governance — Authority Boundaries

**Source:** The Data Professor
**Artifact ID:** governance-platform-boundaries-001
**Status:** Active — Permanent
**Created:** 2026-06-06

---

## Core Rule

**MAHG Platform es la autoridad de gobernanza de todo lo transversal.** Cuando una decisión está Accepted, es vinculante para todos los proyectos.

## Shared (Platform — no tocar sin excepción)

| Dominio | Regla |
|---------|-------|
| **Identity / Auth** | Authelia como único IdP compartido. Consumir headers Remote-User/Remote-Groups. NUNCA X-authentik-groups. La autorización se queda en la aplicación. |
| **Redes** | Solo mahg_edge y mahg_auth son compartidas. No crear redes propias que dupliquen. |
| **Routing** | Traefik compartido. No self-host de reverse proxy. |
| **Certificados** | ACME DNS-01 vía Traefik. No manejar certificados en la aplicación. |
| **DNS** | Solo lo toca el Professor. Manual. Sin API. |
| **Email sender** | noreply@mahg.es canónico (ADR-016). No configurar remitente/relay/SPF/DKIM/DMARC propio. |
| **Observabilidad** | Compartida. No self-host de Prometheus/Loki/Grafana. |
| **Seguridad** | Políticas de seguridad transversales. |
| **Onboarding** | Proceso de onboarding de proyectos a la plataforma. |
| **Notificaciones** | Solo de revisión. Plataforma define el relay. |

## Project-Owned (aplicación — sois dueños)

| Dominio | Regla |
|---------|-------|
| **Lógica de aplicación** | Vuestra. Endpoints, servicios, modelos, reglas de negocio. |
| **Autorización** | Vuestra. La aplicación decide quién puede hacer qué. La autenticación es de plataforma. |
| **Base de datos** | Vuestra. Schema, migraciones, datos. |
| **UI / UX** | Vuestra. Templates, componentes, flows. |

## Fuente de Verdad

- **Remote:** `git@github.com:mahg-es/mahg-platform.git`
- **Local:** `/home/thedataprofessor/github/Modern-Analytics-Harmonized-Governance/mahg-platform`

## READ-FIRST Protocol (cada sesión)

1. Leer `docs/onboarding/project-onboarding.md`
2. Leer los documentos listados para el dominio a tocar: capsules, manifests de ownership/governance, ADRs relevantes, standards, contracts, registries
3. Grabar el bloque READ-FIRST de `project-onboarding.md` §5 al `CLAUDE.md` y `AGENTS.md` del repo, arriba del todo, bajo `## Platform Governance (READ-FIRST)`. No borrarlo.

## Regla de Desvío

Cualquier desvío de lo compartido necesita:
- Excepción documentada
- Fecha de caducidad
- Firma del Professor

**Ante la duda, leer primero. Proponer; no cambiar lo compartido por cuenta propia.**
