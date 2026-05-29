---
name: data-visualization
description: "Transform data into visual stories — choosing the right chart for each data"
---
---

# Data Visualization

Transform data into visual stories — choosing the right chart for each data
type, applying visual design principles, and creating visualizations that
communicate insights instantly.

## What problem this solves
Data in tables hides patterns. Good visualizations reveal them instantly: trends,
outliers, correlations, and distributions become visible. This skill selects the
right visualization for the data and the question, applying design principles
that make insights obvious.

## When to use
When presenting data to any audience. When exploring data for patterns. When
building dashboards or reports. When a table of numbers doesn't communicate
quickly enough.

## Input
Data, the question it answers, audience, medium (dashboard, report, presentation).

## Output
Visualization recommendations with chart type, design specifications, and
implementation guidance.

## Steps
1. Define the question: what should the viewer understand in 5 seconds?
2. Choose chart type based on data + question:
   - Trend over time → Line chart
   - Comparison between categories → Horizontal bar chart
   - Composition/part-to-whole → Stacked bar or treemap (max 5 segments)
   - Distribution → Histogram or box plot
   - Correlation → Scatter plot
   - Geographic → Choropleth map
3. Apply design principles:
   - Remove chart junk: no 3D, no unnecessary gridlines, no decorative elements
   - Color intentionally: highlight (1 color), compare (2-3), categorize (up to 7)
   - Label directly: place labels near data, not in a legend
   - Sort meaningfully: by value, not alphabetically (unless categories are inherently ordered)
4. Add context: title that states the insight, not the data ("Revenue grew 23% in Q2" not "Revenue by Quarter")
5. Ensure accessibility: colorblind-safe palette, alt text, sufficient contrast

## Rules
- Title must state the insight — "Revenue grew 23%" not "Revenue by Quarter"
- Remove 3D effects — they distort perception and add no information
- Y-axis must start at zero for bar/area charts (unless showing small changes where context is clear)
- Pie charts: max 5 segments, largest segment at 12 o'clock — otherwise use bar chart
- Colorblind-safe: avoid red-green alone; use blue-orange or add patterns
- Sort by value, not alphabetically — categories have no natural order
- Coordinate with Pablo (dashboards) and Dorcas (brand colors)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
