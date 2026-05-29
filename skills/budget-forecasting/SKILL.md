---
name: budget-forecasting
description: "Forecast cloud and infrastructure budgets — predicting future costs based on"
---
---

# Budget Forecasting

Forecast cloud and infrastructure budgets — predicting future costs based on
historical data, growth trends, and planned changes — with variance analysis
and early-warning alerts when spending deviates from plan.

## What problem this solves
"Cloud costs are up, but is that expected growth or a problem?" Without
budgeting and forecasting, every bill is a surprise. This skill builds
predictive models that answer: what will we spend, is that in budget, and
what's driving the variance?

## When to use
Monthly budget review. Annual budget planning. When cloud costs deviate from
expectations. When planning new projects or scaling existing ones.

## Input
Historical costs (12+ months), growth trends, planned changes, business forecasts.

## Output
A budget forecast with monthly projections, variance analysis, trend
identification, and budget alert thresholds.

## Steps
1. Gather historical costs: 12+ months of data by service, project, environment
2. Calculate baseline trends: linear regression on trailing 90-day costs
3. Incorporate planned changes: new services, scaling events, migrations
4. Project forward: monthly forecast for next 12 months with confidence bands
5. Compare to budget: planned vs. forecasted; flag variances > 10%
6. Set alerts: 50% (inform), 80% (warn), 95% (block), 100% (escalate) of monthly budget
7. Review and recalibrate quarterly: actuals vs. forecast, adjust model

## Rules
- 12+ months of historical data for reliable forecasting — less data = wider confidence bands
- Baseline: linear regression on 90-day trend — simple and interpretable
- Planned changes (new projects, scaling) must be manually incorporated — regression alone isn't enough
- Confidence bands: forecast ±15% for 3 months, ±25% for 12 months
- Budget alerts: auto-notify at 50%, 80%, 95%, 100% thresholds
- Reforecast monthly: compare actuals to previous forecast, explain variance > 10%
- Coordinate with Mateo (FinOps) and cost-analysis (actual spend tracking)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
