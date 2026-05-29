---
name: data-modeling
description: "Design data models — conceptual, logical, and physical — using star schemas,"
---
---

# Data Modeling

Design data models — conceptual, logical, and physical — using star schemas,
dimensional modeling, slowly changing dimensions, and Data Vault patterns
for analytics, reporting, and AI/ML readiness.

## What problem this solves
Ad-hoc schemas become unqueryable at scale. This skill designs data models
that answer business questions efficiently — dimensional models for analytics,
Data Vault for enterprise integration, and normalized schemas for transactions.

## When to use
When designing a new data warehouse or lakehouse. When migrating from legacy
schemas. When query performance is poor due to poor model design.

## Input
Business questions, source systems, query patterns, data volumes.

## Output
A dimensional model with star schema design, grain definitions, SCD strategies,
and DDL ready for implementation.

## Steps
1. Identify business processes: what questions must the data answer?
2. Define grain: what does one row represent? (one trade, one customer interaction)
3. Design dimensions: who, what, where, when — descriptive attributes
4. Design facts: numeric, additive measures at the defined grain
5. Choose SCD strategy: Type 1 (overwrite), Type 2 (history rows), Type 3 (previous value)
6. Add surrogate keys (`_sk` suffix) to all dimensions
7. Generate DDL and coordinate with db-schema for implementation

## Rules
- Star schema: facts reference dimensions via surrogate keys — no snowflaking without justification
- Grain must be atomic and explicit: "1 row = 1 trade execution" not "trade data"
- Every dimension gets surrogate key (`_sk` suffix, UUID or integer)
- Fact tables: narrow (few columns) and deep (many rows); dimensions: wide (many columns) and shallow
- SCD Type 2 for dimensions that need history (customer address); Type 1 for corrections
- No null foreign keys in fact tables — use "Unknown" dimension row (`_sk = -1`)
- Coordinate with Junia (architecture) and Bernabé (implementation)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
