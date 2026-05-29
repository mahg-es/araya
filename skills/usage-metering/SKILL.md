---
name: usage-metering
description: "Track and analyze cloud resource consumption — CPU-hours, storage GB-months,"
---
---

# Usage Metering

Track and analyze cloud resource consumption — CPU-hours, storage GB-months,
network egress, API calls — providing granular usage data for cost attribution,
rightsizing, and chargeback/showback models.

## What problem this solves
Cloud bills aggregate thousands of resource metrics into a single number.
Usage metering breaks them apart: which project consumed how much of what?
This granular data enables accurate cost attribution, anomaly detection,
and optimization targeting.

## When to use
When setting up FinOps. When cost attribution is needed (chargeback/showback).
When investigating cost anomalies. When planning budgets based on usage.

## Input
Cloud billing data, resource inventory, project tags.

## Output
Usage reports by service, project, and environment with consumption metrics,
trends, and optimization opportunities.

## Steps
1. Instrument usage collection: cloud provider APIs (Cost Explorer, OCI Usage)
2. Tag all resources for attribution: Project, Environment, Owner, CostCenter
3. Collect metrics: compute (CPU-hours, GB-hours), storage (GB-months, requests), network (GB egress)
4. Build usage dashboards: consumption by project, service, environment
5. Detect anomalies: usage spike > 2x baseline → investigate
6. Forecast: usage trend + 15% growth → monthly cost prediction
7. Generate showback/chargeback reports per project/team

## Rules
- Tag everything — unattributed usage is invisible usage
- Usage metrics normalized: CPU-hours, GB-months, GB-egress — comparable across services
- Anomalies: any metric 2x above 7-day average → alert within 24 hours
- Showback first (visibility), chargeback later (accountability)
- Usage not cost: separate metering from pricing for flexibility
- Forecast monthly: linear regression on 90-day usage trend
- Coordinate with Mateo (FinOps) and Isla (infrastructure)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
