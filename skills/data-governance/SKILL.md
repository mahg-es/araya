---
name: data-governance
description: "Design and implement data governance frameworks — catalog, lineage, quality,"
---
---

# Data Governance

Design and implement data governance frameworks — catalog, lineage, quality,
access control, and retention — ensuring data is trustworthy, discoverable,
and compliant across the entire data lifecycle.

## What problem this solves
Without governance, data becomes untrusted ("where did this come from?"),
undiscoverable ("where is the customer table?"), and non-compliant ("are we
allowed to store this?"). This skill establishes the policies, tools, and
processes that make data a governed asset.

## When to use
When building a data platform. When compliance requirements apply (GDPR, SOC 2).
When data quality issues cause business decisions to be questioned.

## Input
Data assets inventory, compliance requirements, data flow diagrams, stakeholder needs.

## Output
A data governance framework with catalog design, lineage tracking, quality rules,
access policies, and retention schedules.

## Steps
1. Inventory data assets: tables, files, APIs — what data exists and where?
2. Design catalog: metadata about every asset — owner, schema, sensitivity, freshness
3. Implement lineage: column-level from source to consumption (Bronze → Silver → Gold)
4. Define quality rules: completeness, uniqueness, timeliness, accuracy, consistency
5. Set access policies: who can read/write/administer each asset, based on role and sensitivity
6. Define retention: how long to keep each layer (Bronze 90d, Silver 1yr, Gold indefinite)
7. Classify PII: identify, tag, and protect personally identifiable information

## Rules
- Every data asset must have an owner — unnamed ownership = ungoverned data
- Column-level lineage mandatory for regulated data (GDPR, financial reporting)
- PII must be identified and protected at the Silver layer (tokenization or masking)
- Quality rules must be automated — manual quality checks don't scale
- Access control: least privilege; no human reads production data without audit log
- Retention policies must be automated — no manual cleanup of old data
- Coordinate with Diana for security classification and compliance requirements
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
