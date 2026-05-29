---
name: resource-rightsizing
description: "Analyze cloud resource utilization and recommend rightsizing — matching"
---
---

# Resource Rightsizing

Analyze cloud resource utilization and recommend rightsizing — matching
resource allocation to actual consumption — eliminating over-provisioning
waste and fixing under-provisioning bottlenecks.

## What problem this solves
Cloud resources are routinely 30-50% over-provisioned "just in case." That's
30-50% waste. Rightsizing matches allocation to actual usage: instances too
big get smaller, instances too small get bigger, idle instances get terminated.
The result: lower cost without performance impact.

## When to use
Monthly resource optimization review. When cloud costs exceed budget. When
performance issues suggest under-provisioning. Before committing to reserved
instances (rightsize first, reserve after).

## Input
Resource utilization metrics (CPU, memory, disk, network), instance inventory,
performance requirements.

## Output
Rightsizing recommendations with current vs. proposed sizing, cost savings,
and implementation guidance.

## Steps
1. Collect utilization data: CPU avg/max, memory avg/max over 30 days
2. Classify each resource:
   - **Over-provisioned:** Avg CPU < 30%, avg memory < 40% — candidate for downsizing
   - **Right-sized:** Avg CPU 40-70%, avg memory 50-70% — optimal
   - **Under-provisioned:** Avg CPU > 70% or memory > 80% or performance issues
3. Recommend action per resource:
   - Downsize: move to next smaller instance family
   - Terminate: idle resources (avg CPU < 5% for 7+ days, no production traffic)
   - Upsize: move to next larger instance family
   - Modernize: move to newer generation (better price/performance)
4. Estimate savings: (current cost - proposed cost) × remaining commitment period
5. Implement gradually: non-production → production, one service at a time

## Rules
- 30 days of utilization data minimum — single-day snapshots are misleading
- Over-provisioned threshold: avg CPU < 30% AND avg memory < 40% for 30 days
- Never downsize production during peak hours — schedule maintenance windows
- Terminate idle resources: avg CPU < 5%, no production traffic for 7+ days
- Reserved Instance purchases only after rightsizing — locking over-provisioned waste is worse
- Modernize before upsizing: newer instance generations offer better price/performance
- Coordinate with Mateo (cost analysis) and Isla (infrastructure)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
