---
name: medallion-architecture
description: "Implement medallion (Bronze → Silver → Gold) data architecture — progressive"
---
---

# Medallion Architecture

Implement medallion (Bronze → Silver → Gold) data architecture — progressive
refinement from raw ingestion to business-ready analytics — with Delta Lake
or Apache Iceberg tables, schema evolution, and time travel.

## What problem this solves
Data lakes become swamps when raw data is queried directly. Medallion architecture
imposes structure: raw (Bronze), validated (Silver), business-ready (Gold) —
each layer adds value, governance, and queryability.

## When to use
When building a data lakehouse. When raw data is being queried directly
(creating quality issues). When implementing Delta Lake or Iceberg.

## Input
Source data, business requirements, query patterns, governance policies.

## Output
A medallion architecture implementation with table definitions, transformation
logic, and quality gates per layer.

## Steps
1. **Bronze:** Ingest raw data as-is — append-only, immutable, full audit columns
2. **Silver:** Validate types, deduplicate, enrich, add quality checks — Delta/Iceberg tables
3. **Gold:** Build star schema with facts and dimensions — business-ready, query-optimized
4. Configure Delta Lake features: ACID transactions, time travel, schema evolution
5. Implement each layer as independent, scheduled, monitored pipelines
6. Add catalog entries (Hive Metastore, Unity Catalog) for discovery

## Rules
- Bronze: immutable, append-only, schema-on-read with `inferSchema=False`
- Silver: typed, deduplicated, validated — write as Delta/Iceberg tables
- Gold: star schema with surrogate keys, pre-computed aggregates
- Every layer has audit columns: `record_source`, `ingestion_timestamp`
- Delta Lake time travel: retain 7 days default, 30 days for regulated data
- Never query Bronze directly — always through Silver or Gold
- Coordinate with Junia (design) and Bernabé (pipeline implementation)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
