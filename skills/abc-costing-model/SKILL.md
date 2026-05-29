---
name: abc-costing-model
description: "Implement Activity-Based Costing (ABC) to accurately attribute costs to products,"
---
---

# ABC Costing Model

Implement Activity-Based Costing (ABC) to accurately attribute costs to products,
services, and customers based on actual resource consumption — replacing the
distortions of traditional cost accounting.

## What problem this solves
Traditional accounting allocates overhead by simple metrics (revenue %, headcount)
— hiding which customers and products are truly profitable. ABC reveals that
often 20% of customers generate 180% of profit while the remaining 80% destroy
value. This skill builds ABC models that make hidden profit dynamics visible.

## When to use
When profitability analysis is needed, when pricing decisions lack cost clarity,
when a business wants to identify which customers/products to grow vs. divest,
or when traditional P&L statements don't explain margin variations.

## Input
- Chart of accounts / general ledger data
- Activity descriptions (what does the company actually do?)
- Resource drivers (what consumes resources: orders processed, support tickets, shipments)
- Cost objects (what we want to cost: customers, products, services, channels)

## Output
An ABC model document:

```markdown
# ABC Model: ManTradeCoin SaaS Platform

## Phase 1: Resource → Activities

| Resource | Annual Cost | Cost Driver |
|----------|------------|-------------|
| Cloud Infrastructure | $120,000 | CPU-hours |
| Engineering Salaries | $450,000 | Development hours |
| Support Team | $180,000 | Support tickets |
| Sales & Marketing | $200,000 | Customer acquisition |

| Activity | Annual Cost | Activity Driver | Volume | Rate |
|----------|------------|-----------------|--------|------|
| Process Trade | $85,000 | # Trades | 500,000 | $0.17/trade |
| Maintain Infrastructure | $90,000 | Server-hours | 8,760 | $10.27/hour |
| Handle Support Ticket | $120,000 | # Tickets | 2,400 | $50/ticket |
| Onboard Customer | $60,000 | # New Customers | 120 | $500/onboarding |
| Develop Features | $200,000 | Story Points | 800 | $250/point |

## Phase 2: Activities → Cost Objects

| Customer | Trades | Tickets | Onboarding | Support Cost | Trading Cost | Total Cost | Revenue | Profit | Margin % |
|----------|--------|---------|------------|-------------|-------------|-----------|---------|--------|----------|
| Whale Corp | 50,000 | 12 | 1 | $600 | $8,500 | $9,100 + infra | $45,000 | $35,900 | 79.8% |
| MidCo Ltd | 5,000 | 45 | 1 | $2,250 | $850 | $3,100 + infra | $8,000 | $4,900 | 61.3% |
| SmallCo Inc | 500 | 60 | 1 | $3,000 | $85 | $3,085 + infra | $1,200 | -$1,885 | -157% |

## Phase 3: Whale Curve Analysis

Cumulative profit curve shows:
- Top 20% customers generate 145% of total profit
- Bottom 30% customers DESTROY 45% of potential profit
- 3 customers identified for profit improvement plans
- 2 customers recommended for service tier downgrade
```

## Steps
1. Gather financial data: general ledger, P&L statements, cost center reports
2. Identify activities: what work does the organization actually perform?
   - Interview process owners to map "what do you do" → distinct activities
   - Aim for 10-20 activities — enough to capture variance, not so many as to be unmanageable
3. Assign resource costs to activities using resource drivers:
   - Salaries → % time spent per activity (timesheets or estimates)
   - Infrastructure → usage metrics by activity
   - Overhead → proportional to activity consumption
4. Calculate activity driver rates: total activity cost ÷ total driver volume
5. Measure cost object consumption: for each customer/product/service, count driver usage
6. Assign activity costs to cost objects: consumption × driver rate
7. Plot the Whale Curve: cumulative profit by customer, ranked most to least profitable
8. Identify profit improvement opportunities:
   - High-cost customers: reduce service level, increase prices, or offboard
   - High-profit customers: protect, expand, replicate acquisition strategy
9. Present findings with numbered recommendations [1][2][3] to The Data Professor

## Rules
- Activity drivers must be measurable and causally related to cost — correlation is not causation
- Interview at least 2 people per activity to validate time estimates — single-source estimates are unreliable
- The Whale Curve almost always shows a minority of customers funding the majority — that's the insight, not a bug
- Model accuracy is asymptotic: 15-20 activities captures ~90% of variance; more activities gives diminishing returns
- Distinguish between attributable costs (ABC) and non-attributable costs (corporate overhead) — separate reporting
- If data is incomplete, flag assumptions explicitly — "estimated" vs. "measured" costs
- ABC is a management tool, not GAAP — coordinate with Lidia; she owns profitability at ARAYA
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
