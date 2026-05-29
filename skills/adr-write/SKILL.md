---
name: adr-write
description: "Write Architecture Decision Records (ADRs) — lightweight documents that capture"
---
---

# ADR Write

Write Architecture Decision Records (ADRs) — lightweight documents that capture
a significant architectural decision, the context in which it was made, the
options considered, the decision taken, and the consequences.

## What problem this solves
Teams make architectural decisions every day, but months later nobody remembers
WHY a technology was chosen, WHAT alternatives were considered, or WHAT tradeoffs
were accepted. ADRs create an immutable decision log that preserves institutional
knowledge and prevents re-litigating settled decisions.

## When to use
- Choosing between technologies (PostgreSQL vs. MySQL, REST vs. GraphQL)
- Adopting architectural patterns (microservices vs. monolith, event-driven vs. request-response)
- Establishing conventions (naming, folder structure, API versioning)
- Rejecting a technology or pattern (record WHY it was rejected)
- Any decision where the rationale is more important than the outcome

## Input
The decision to document — technology choice, pattern adoption, or convention.

## Output
An ADR in `.araya/plan/spec/adr/`:

```markdown
# ADR-005: Use PostgreSQL with PostGIS for Spatial Data

**Status:** Accepted
**Date:** 2026-05-27
**Deciders:** Junia (Data Platform Architect), Bernabé (Data Engineer), The Data Professor
**Replaces:** n/a
**Superseded by:** n/a

---

## Context

The ManTradeCoin platform needs to store trade locations and perform
geospatial queries (radius search, distance calculation). We evaluated
options for adding spatial capabilities to our data layer.

## Decision

Use PostgreSQL with PostGIS extension as our primary spatial database.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **PostgreSQL + PostGIS** | Mature (20+ years), rich spatial functions, integrates with existing PG stack, excellent indexing (GiST) | Slightly larger install, separate extension to maintain |
| **MongoDB GeoJSON** | Simple API, good for prototypes, schema-flexible | Limited spatial operations, no spatial joins, weaker for ACID transactions in our use case |
| **Elasticsearch geo** | Great for search-first use cases, real-time indexing | Not a primary database, eventual consistency, operational complexity |
| **DuckDB spatial** | Excellent for analytical queries, zero-config | Not for transactional workloads, newer spatial support |

## Consequences

### Positive
- Spatial queries (ST_DWithin, ST_Distance) are SQL-native and indexed
- Reuses existing PostgreSQL operations knowledge and tooling
- Can combine spatial + transactional queries in single statements
- Excellent ecosystem: QGIS, GeoServer, pg_tileserv integrations

### Negative
- PostGIS extension adds complexity to Docker setup and migrations
- GiST indexes are larger and slower to build than B-tree
- Developers need to learn spatial SQL concepts (SRID, geometry types)

### Neutral / Mitigations
- Add PostGIS extension to Docker Compose and migration scripts
- Create helper functions for common spatial operations
- Document spatial query patterns in developer guide (Priscila to own)

## References
- PostGIS documentation: https://postgis.net/documentation/
- PostgreSQL + PostGIS Docker image: `postgis/postgis:16-3.4`
- Prior art: ManTradeCoin training lab uses PostgreSQL for non-spatial data
```

## Steps
1. Identify the decision: is it architecturally significant? If someone would ask "why did we choose X?" in 6 months, it deserves an ADR.
2. Gather context: what constraints, goals, and assumptions frame this decision?
3. Research options: what alternatives were considered? Why were they rejected?
4. Evaluate tradeoffs: pros and cons for each option, weighted by project priorities
5. State the decision clearly: "We will use X for Y."
6. Document consequences: what becomes easier? What becomes harder? What follow-up actions are needed?
7. Assign a sequential ADR number (check existing ADRs for next available)
8. Set status: Proposed → Accepted → Deprecated → Superseded
9. Write to `.araya/plan/spec/adr/adr-NNN-title-with-dashes.md`
10. If the decision is contentious, present options as numbered choices [1][2][3] for The Data Professor

## Rules
- One ADR per decision — don't bundle multiple decisions in one document
- Every ADR must include at least 2 alternatives considered — single-option ADRs are not decisions
- Status must be one of: Proposed, Accepted, Deprecated, Superseded
- If a decision is reversed, don't delete the old ADR — mark it "Superseded by ADR-XXX" and write a new one
- ADRs are immutable once accepted — edit only to fix typos or update status
- Use the MADR (Markdown Architecture Decision Record) format for consistency
- Coordinate with the relevant domain agent for technical validation before finalizing
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
