---
name: cost-analysis
description: "Analyze cloud and infrastructure costs — breakdown by service, project, and"
---
---

# Cost Analysis

Analyze cloud and infrastructure costs — breakdown by service, project, and
environment — identifying cost drivers, anomalies, and optimization
opportunities with measurable savings estimates.

## What problem this solves
Cloud bills arrive as a lump sum with hundreds of line items. Without structured
cost analysis, you can't tell which project costs what, which service is the
cost driver, or whether yesterday's spike was normal or anomalous. This skill
breaks down costs, attributes them to projects, and finds savings opportunities.

## When to use
Monthly (cost review). When the cloud bill increases unexpectedly. When
planning budgets. When The Data Professor asks "why is our cloud bill so high?"

## Input
Cloud billing data (AWS Cost Explorer, OCI Cost Analysis, Hetzner invoices),
resource inventory, project tags.

## Output
```markdown
# Cloud Cost Analysis: May 2026

## Monthly Summary
| Metric | May 2026 | April 2026 | Change |
|--------|----------|-----------|--------|
| Total Cloud Spend | $4,832.17 | $4,215.40 | +$616.77 (+14.6%) |
| AWS | $3,210.45 | $2,890.30 | +$320.15 |
| OCI | $1,124.82 | $1,050.20 | +$74.62 |
| Hetzner | $496.90 | $274.90 | +$222.00 |
| Budget | $4,500.00 | $4,500.00 | +$332.17 over budget 🔴 |

## Cost by Service (AWS)
| Service | Cost | % of AWS | MoM Change | Trend |
|---------|------|---------|-----------|-------|
| EC2 | $1,245.30 | 38.8% | +$180.50 | ⬆️ Up |
| RDS | $845.20 | 26.3% | +$45.20 | ➡️ Stable |
| S3 | $320.15 | 10.0% | +$28.10 | ⬆️ Up (growing data) |
| CloudFront | $280.40 | 8.7% | +$12.30 | ➡️ Stable |
| Lambda | $195.60 | 6.1% | +$95.40 | ⬆️ Spike (new service) |
| Other | $323.80 | 10.1% | +$8.65 | ➡️ Stable |

## Cost by Project (Tag-Based Attribution)
| Project | Cost | % of Total | Owner | Budget | Variance |
|---------|------|-----------|-------|--------|----------|
| ManTradeCoin Platform | $2,840.30 | 58.8% | Junia | $2,500 | +$340.30 🔴 |
| ARAYA Dashboard | $845.20 | 17.5% | Isla | $900 | -$54.80 🟢 |
| Training Labs | $520.50 | 10.8% | Eunice | $550 | -$29.50 🟢 |
| Content Engine | $312.10 | 6.5% | Lucas | $300 | +$12.10 🟡 |
| Knowledge Hub | $180.40 | 3.7% | Esteban | $180 | +$0.40 🟢 |
| Unattributed | $133.67 | 2.8% | — | — | ⚠️ Needs tagging |

## Cost Anomalies (May 2026)
| Date | Service | Normal | Actual | Increase | Root Cause |
|------|---------|--------|--------|----------|------------|
| May 8 | Lambda | $6.50/day | $42.30/day | 6.5x | New RAG pipeline deployed without concurrency limits |
| May 15-22 | EC2 | $41/day | $89/day | 2.2x | Staging environment left running 24/7 for 8 days |
| May 28 | S3 | $10/day | $38/day | 3.8x | Large dataset upload (5TB) for training lab |

## Optimization Opportunities
| Opportunity | Service | Current | After | Monthly Savings | Annual Savings | Effort |
|------------|---------|---------|-------|----------------|---------------|--------|
| EC2 Reserved Instances | EC2 | On-demand ($1,245) | 1yr RI ($780) | $465 | $5,580 | 1 hour |
| S3 Lifecycle Policy | S3 | Standard ($320) | Intelligent-Tiering ($180) | $140 | $1,680 | 30 min |
| Lambda Concurrency Limit | Lambda | Unlimited ($195) | Capped at 100 ($95) | $100 | $1,200 | 5 min |
| Auto-stop Staging | EC2 | 24/7 ($89 spike) | Stop nights/weekends ($30) | $59 | $708 | 1 hour |
| **Total Potential Savings** | | | | **$764/mo** | **$9,168/yr** | |

## Alerts Configured
- Daily spend > $200 → Slack #finops
- Any service 3x normal daily spend → PagerDuty
- Unattributed cost > 5% → Slack #engineering
- Budget > 80% consumed → Email to The Data Professor
```

## Steps
1. Gather billing data: cloud provider console, invoice CSV, or API (Cost Explorer)
2. Categorize costs: by service, by region, by project (tags), by environment
3. Compare to previous month: absolute change, % change, trend direction
4. Detect anomalies: any service with > 2x normal daily spend
5. Attribute to projects: ensure every resource has `Project` and `Owner` tags
6. Identify optimization opportunities with $ savings estimates
7. Set up cost alerts and budgets
8. Write report to `.araya/plan/spec/cost-analysis-YYYY-MM.md`

## Rules
- Every resource must be tagged: Project, Environment, Owner, CostCenter
- Unattributed costs must be < 5% of total — if higher, tag remediation is priority
- Cost anomalies (2x normal) must be investigated within 24 hours
- Optimization opportunities must include dollar savings and effort estimate
- Budget alerts: 50% (inform), 80% (warn), 100% (block new resources)
- Compare month-over-month, not month-to-budget — budget variance alone hides trends
- Reserved Instances / Savings Plans for stable workloads; spot instances for fault-tolerant
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
