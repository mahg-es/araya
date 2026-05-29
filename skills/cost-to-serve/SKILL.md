---
name: cost-to-serve
description: "Model the cost of serving individual customers, products, or channels —"
---
---

# Cost-to-Serve

Model the cost of serving individual customers, products, or channels —
identifying the hidden costs of complexity in service delivery and enabling
profitability-based service design.

## What problem this solves
Two customers generating the same revenue can have wildly different costs to
serve — one orders in bulk online, the other calls support daily. Cost-to-serve
reveals these hidden cost drivers, enabling service-tier design that aligns
service levels with customer profitability.

## When to use
When designing service tiers. When some customers consume disproportionate
support resources. When evaluating whether "free shipping for all" makes sense.

## Input
Service activity data (support tickets, order frequency, returns, payment method),
activity costs (from ABC model).

## Output
A cost-to-serve model per customer/product/channel with cost breakdown by
activity, service tier recommendations, and profit improvement opportunities.

## Steps
1. Identify cost-driving activities: order processing, support, returns, payment processing, delivery
2. Assign activity costs (from ABC model): cost per ticket, cost per order, cost per return
3. Measure activity consumption per entity: how many tickets, orders, returns?
4. Calculate cost-to-serve: sum of (activity consumption × activity cost)
5. Compare cost-to-serve % of revenue across entities
6. Identify service tiers:
   - Premium (high revenue, low cost-to-serve): VIP service
   - Standard (moderate both): self-service + standard support
   - Economy (low revenue, high cost-to-serve): automated only
7. Calculate profit improvement potential from tier reclassification

## Rules
- Cost-to-serve uses fully-loaded ABC costs — avoid allocating overhead arbitrarily
- Measure actual activity consumption, not estimates — ticket system data > manager opinion
- Two customers with same revenue can differ 10x in cost-to-serve — that's the insight
- Service tiers based on data, not intuition: revenue + cost-to-serve → tier
- Economy tier: self-service, automated support, minimal SLAs
- Premium tier: dedicated support, proactive outreach, priority SLAs
- Coordinate with Lidia for ABC model and whale-curve analysis
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
