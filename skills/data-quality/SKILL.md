---
name: data-quality
description: "Implement data quality validation — Great Expectations, schema validation,"
---
---

# Data Quality

Implement data quality validation — Great Expectations, schema validation,
anomaly detection — ensuring data is complete, accurate, consistent, and
timely at every stage of the pipeline.

## What problem this solves
Bad data in = bad decisions out. Without automated quality checks, null values,
duplicates, and schema drift silently corrupt downstream analytics and ML models.
This skill implements quality gates at every pipeline stage.

## When to use
At every pipeline stage (Bronze, Silver, Gold). Before data reaches dashboards
or ML models. When data quality issues cause incorrect business decisions.

## Input
Data schema, quality requirements, business rules, historical data for baselines.

## Output
Great Expectations or custom validation suite with expectations per table,
validation results, and alerting on quality failures.

## Steps
1. Define quality dimensions: completeness, uniqueness, timeliness, accuracy, consistency
2. Per table, define expectations:
   - `expect_column_to_exist` (schema compliance)
   - `expect_column_values_to_not_be_null` (completeness on key columns)
   - `expect_column_values_to_be_unique` (uniqueness on PK columns)
   - `expect_column_values_to_be_in_set` (domain validation)
   - `expect_column_values_to_be_between` (range validation)
   - `expect_table_row_count_to_be_between` (volume validation)
3. Implement validation after every pipeline stage (write → validate)
4. Configure actions: warn (log + metric), fail (block write), alert (Slack/PagerDuty)
5. Detect anomalies: row count deviates > 20% from 7-day average → alert
6. Generate quality reports per run with pass/fail/skip per expectation

## Rules
- Validate after every write — never write data without checking quality
- PK columns must never be null (fail pipeline if so)
- Row count validation: source count == bronze count == silver count (after dedup)
- Schema drift: new columns = warn; missing columns = fail
- Anomaly detection: row count outside 3σ from baseline → alert
- Quality failures in Bronze/Silver block downstream writes
- Monitor quality trends: is data quality improving or degrading over time?
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
