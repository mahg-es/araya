---
name: data-lakehouse-design
description: "Design enterprise data lakehouse architectures using medallion patterns"
---
---

# Data Lakehouse Design

Design enterprise data lakehouse architectures using medallion patterns
(Bronze → Silver → Gold) with Delta Lake or Apache Iceberg on cloud
and on-premise infrastructure.

## What problem this solves
Organizations dump data into lakes without structure, creating "data swamps."
This skill designs layered lakehouse architectures where raw data flows through
progressively refined layers — raw ingestion, validated and typed, business-ready
— with full lineage, governance, and queryability at every stage.

## When to use
When designing a new data platform, migrating from a data warehouse or data lake,
evaluating medallion vs. Inmon vs. Kimball approaches, or auditing an existing
data architecture for gaps.

## Input
Data sources, business use cases, query patterns, SLAs, and infrastructure
constraints (cloud provider, budget, team skills).

## Output
A lakehouse architecture document:

```markdown
# Lakehouse Architecture: ManTradeCoin Data Platform

## Architecture Overview
Sources (CSV, API, streaming) → Bronze (raw, append-only) → Silver (typed, deduplicated) → Gold (star schema, business-ready)

## Layer Design

### Bronze Layer (Raw Landing Zone)
- **Storage**: S3 / MinIO / local `data/bronze/`
- **Format**: Parquet, Snappy compression
- **Schema**: Schema-on-read, `inferSchema=False` for known sources
- **Partitioning**: By `ingestion_date` (daily)
- **Audit Columns**: `record_source`, `ingestion_timestamp`, `source_file`
- **Retention**: 90 days raw, then archive to cold storage
- **Access**: Data engineers only

### Silver Layer (Validated & Enriched)
- **Storage**: Delta Lake on S3 / MinIO / local `data/silver/`
- **Transformations**: Type casting, deduplication, null handling, enrichment
- **Schema**: Enforced schema with evolution policy
- **Quality**: Great Expectations validation suite on every write
- **CDC**: Merge (upsert) for dimension tables; append for facts
- **Access**: Data analysts and scientists

### Gold Layer (Business-Ready)
- **Model**: Star schema — dimension tables (customers, coins, dates) + fact tables (trades, transactions)
- **Grain**: 1 row = 1 business event (e.g., 1 trade)
- **Surrogate Keys**: All dimensions have `_sk` suffix
- **Aggregations**: Pre-computed daily, weekly, monthly aggregates
- **Access**: BI tools, dashboards, ML models

## Governance
- **Catalog**: Apache Hive Metastore or Unity Catalog
- **Lineage**: Column-level lineage from Bronze → Silver → Gold
- **Retention**: Bronze 90d, Silver 1yr, Gold indefinite
- **PII**: Tokenization at Silver layer; Gold layer stores references only
```

## Steps
1. Inventory data sources: batch (CSV, database dumps), streaming (Kafka, Kinesis), API
2. Define business questions: what queries must this platform answer?
3. Design Bronze: raw schema, partitioning strategy, retention, audit requirements
4. Design Silver: type mapping, deduplication logic, quality rules, enrichment joins
5. Design Gold: star schema with dimensions and facts, grain definition, aggregate tables
6. Choose format: Delta Lake (databricks-backed, ACID, time travel) or Iceberg (catalog-flexible, multi-engine)
7. Define governance: catalog, lineage, retention, access control, PII handling
8. Draw data flow diagram with layers, transforms, and access patterns
9. Coordinate with Junia (platform), Bernabé (pipelines), Diana (governance/security)
10. Present architecture as numbered options [1][2][3] if tradeoffs exist

## Rules
- Bronze is sacred: raw, immutable, append-only — never modify Bronze data
- Every table must have audit columns: `record_source`, `ingestion_timestamp`
- Silver deduplicates by business key + timestamp; Gold is unique by surrogate key
- Star schema for Gold: facts reference dimensions via foreign keys; no snowflaking without justification
- Open formats only: Delta Lake or Apache Iceberg, Parquet underneath — no proprietary formats
- Partition by date for time-series; partition by category for high-cardinality lookups (but ≤ 1000 partitions)
- Design for query patterns, not for storage — access patterns drive partitioning and indexing
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
