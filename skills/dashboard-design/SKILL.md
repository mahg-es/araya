---
name: dashboard-design
description: "Design BI dashboards — information architecture, visualization selection,"
---
---

# Dashboard Design

Design BI dashboards — information architecture, visualization selection,
KPI hierarchy, and UX — transforming raw data into decision tools that
answer business questions at a glance.

## What problem this solves
Dashboards with 20 widgets, inconsistent charts, and no clear narrative
overwhelm users and hide insights. This skill designs dashboards with clear
information hierarchy, the right visualizations for each data type, and
progressive disclosure — from executive summary to granular detail.

## When to use
When building any dashboard. When an existing dashboard has too many widgets.
When stakeholders can't find what they need. When The Data Professor says
"I need a dashboard for X."

## Input
Business questions to answer, data sources, audience (executive, manager, analyst),
refresh requirements.

## Output
```markdown
# Dashboard Design: ManTradeCoin Executive Overview

## Audience & Purpose
- **Primary:** The Data Professor (CEO-level)
- **Frequency:** Checked daily (morning review)
- **Questions answered:**
  1. How much revenue did we generate yesterday? (vs. target)
  2. Which customers are most/least profitable?
  3. Are there any operational issues (errors, delays, anomalies)?
  4. What's the trend — are we growing or declining?

## Information Architecture

### Row 1: Executive Summary (Top — First Glance)
| Position | KPI | Visualization | Update |
|----------|-----|--------------|--------|
| Top-left | Daily Revenue | Big number ($1,247,832) + sparkline (30d) | Daily |
| Top-center | Active Traders | Big number (3,847) + trend arrow ↑12% | Daily |
| Top-right | Profit Margin | Gauge (31.4%) with target (30%) | Daily |

### Row 2: Trend Analysis
| Position | Data | Visualization | Why |
|----------|------|--------------|-----|
| Left (50%) | Revenue Trend (30 days) | Line chart with trend line | Trends over time |
| Right (50%) | Revenue by Coin | Horizontal bar chart (top 10) | Compare categories |

### Row 3: Deep Dive (Drill-Down)
| Position | Data | Visualization | Why |
|----------|------|--------------|-----|
| Full width | Whale Curve (Cumulative Profit by Customer) | Area chart (cumulative) | Identify profit concentration |
| Left (50%) | Top 10 Customers | Table: name, revenue, profit, margin %, trend | Actionable list |
| Right (50%) | Bottom 10 Customers | Table: name, revenue, profit, margin %, trend | Profit improvement candidates |

## Visualization Selection Guide

| Data Question | Best Chart | Why |
|--------------|-----------|-----|
| How does X change over time? | Line chart | Time on x-axis is intuitive |
| How do categories compare? | Horizontal bar chart | Labels are readable |
| What's the composition? | Stacked bar or treemap | Shows part-to-whole |
| What's the distribution? | Histogram or box plot | Shows spread and outliers |
| How do two variables relate? | Scatter plot | Shows correlation |
| Where is the data geographically? | Choropleth map | Spatial patterns visible |
| What's the current value? | Big number + sparkline | Immediate answer |

## UX Principles
1. **5-second rule:** The top row must answer the main question in 5 seconds
2. **Eyes move in a Z:** Top-left (most important) → Top-right → Bottom-left → Bottom-right
3. **Color communicates:** Green = good, Red = bad, Blue = neutral; never color alone
4. **Progressive disclosure:** Summary → Trend → Detail; don't show everything at once
5. **Consistent scales:** Same metric uses same scale across the dashboard
6. **Interactive filters:** Date range, customer segment, coin type — but load with sensible defaults

## Steps
1. Define audience and questions — what decisions will this dashboard enable?
2. Select KPIs: leading (predict future) and lagging (measure past) indicators
3. Design layout: information hierarchy, row structure, widget placement
4. Choose visualizations per data type (see guide above)
5. Add interactivity: filters, drill-down, date range, export
6. Apply visual design: color palette, typography, spacing, branding
7. Prototype and test: "Can you answer question X in under 5 seconds?"

## Rules
- Dashboard titles must state the question: "Monthly Revenue vs. Target" not "Revenue Chart"
- 5-second rule: the most important answer must be visible immediately
- Maximum 7 widgets per dashboard view — more requires tabs or drill-down
- Color is information, not decoration — never use rainbows or random colors
- Every chart must have: title, labeled axes, data source, last updated timestamp
- Filters at the top, consistent across the dashboard
- Empty state: show why (no data for selected period), not a blank widget
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
