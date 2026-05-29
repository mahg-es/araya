---
name: profitability-lineage
description: "Trace profitability from cost source through activities to customers, products,"
---
---

# Profitability Lineage

Trace profitability from cost source through activities to customers, products,
and channels — building end-to-end visibility into how costs flow and where
profit is created or destroyed.

## What problem this solves
Profit appears in the P&L as a single number. Profitability lineage breaks it
apart: where did each dollar of cost originate, what activity consumed it, and
which customer ultimately benefited (or didn't)? This end-to-end traceability
enables surgical profit improvement.

## When to use
After ABC model and Whale Curve analysis. When board/stakeholders ask "why are
we profitable here but not there?" When building a profitability management system.

## Input
ABC model output, cost-to-serve data, whale curve analysis, revenue data.

## Output
A profitability lineage map showing cost flows from source → activity → cost object,
with profit/loss attribution at each level.

## Steps
1. Start with cost sources: salaries, infrastructure, software, facilities
2. Trace to activities: which activities consumed each cost source?
3. Trace to cost objects: which customers/products/channels used each activity?
4. Match against revenue per cost object
5. Calculate profit/loss at each level of the lineage
6. Identify profit leaks: costs that flow to unprofitable objects
7. Identify profit engines: low-cost activities driving high-revenue customers

## Rules
- Lineage must be traceable from source to object — no black-box allocations
- Each cost dollar should have a single, traceable path — avoid double-counting
- Profit leaks = costs flowing to objects with negative margin — target for improvement
- Profit engines = low-cost activities serving high-revenue objects — protect and scale
- Visualize with Sankey diagrams showing cost flow through activities to objects
- Update lineage model quarterly or when business model changes significantly
- Coordinate with Lidia (all profitability skills) and Pablo (visualization)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
