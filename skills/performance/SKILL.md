---
name: performance
description: "Optimize frontend performance — bundle size, rendering speed, network efficiency,"
---
---

# Performance

Optimize frontend performance — bundle size, rendering speed, network efficiency,
and runtime performance — achieving fast load times and smooth interactions
on every device.

## What problem this solves
Slow applications lose users. Every 100ms of load time costs conversions. This
skill measures performance with real metrics, identifies bottlenecks, and applies
optimizations that make measurable improvements to Core Web Vitals.

## When to use
Before launch. When users report slowness. After major feature additions. When
Lighthouse scores drop below 90. As a regular sprint activity.

## Input
Application URL or build output, performance budget, target device profiles.

## Output
```markdown
# Performance Audit & Optimization: ARAYA Dashboard

## Core Web Vitals
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| LCP (Largest Contentful Paint) | 3.2s | < 2.5s | 🔴 FAIL |
| FID (First Input Delay) | 45ms | < 100ms | 🟢 PASS |
| CLS (Cumulative Layout Shift) | 0.08 | < 0.1 | 🟢 PASS |
| TTFB (Time to First Byte) | 800ms | < 600ms | 🟡 WARN |
| Speed Index | 2.8s | < 2.0s | 🟡 WARN |

## Bundle Analysis
| Chunk | Size (gzip) | % of Total | Issue |
|-------|------------|-----------|-------|
| vendor.js | 245KB | 42% | Includes full lodash (72KB) — only using 3 functions |
| charts.js | 180KB | 31% | recharts imported entirely — tree-shaking not working |
| app.js | 95KB | 16% | Duplicate date-fns locales (en, es, fr — only need en, es) |
| styles.css | 58KB | 10% | 12KB unused CSS (Tailwind not purged properly) |

## Fixes Applied

### Fix #1: Replace lodash with native (245KB → 0KB for lodash)
```diff
- import _ from "lodash";
- const sorted = _.sortBy(users, "name");
- const grouped = _.groupBy(orders, "status");

+ // Native alternatives
+ const sorted = users.sort((a, b) => a.name.localeCompare(b.name));
+ const grouped = Object.groupBy(orders, o => o.status);
```
**Savings: 72KB gzip** ✅

### Fix #2: Lazy-load charts component
```diff
- import { Dashboard } from "../pages/Dashboard";

+ const Dashboard = lazy(() => import("../pages/Dashboard"));
```
**Savings: 180KB deferred until charts tab is clicked** ✅

### Fix #3: Image optimization (1.2MB → 48KB)
```diff
- <img src="/hero-banner.png" />  (1.2MB PNG)

+ <img
+   srcset="/hero-480.webp 480w, /hero-768.webp 768w, /hero-1200.webp 1200w"
+   sizes="(max-width: 768px) 100vw, 1200px"
+   src="/hero-1200.webp"
+   loading="lazy"
+   alt="ARAYA Dashboard"
+ />
```
**Savings: 1.15MB** ✅

## Results
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP | 3.2s | 1.8s | 🟢 44% faster |
| Total Bundle | 580KB | 180KB (initial) | 🟢 69% smaller |
| Lighthouse Performance | 62 | 96 | 🟢 +34 pts |
```

## Steps
1. Measure: Lighthouse, WebPageTest, or Chrome DevTools Performance tab
2. Analyze bundle: `vite-bundle-visualizer`, `webpack-bundle-analyzer`, or `source-map-explorer`
3. Prioritize by impact: LCP > bundle size > runtime performance
4. Apply optimizations:
   - **Network**: Compress (gzip/brotli), CDN, HTTP/2, resource hints (preload, prefetch)
   - **Bundle**: Code splitting, tree shaking, dynamic imports, dead code elimination
   - **Assets**: WebP/AVIF images, responsive images (`srcset`), lazy loading
   - **Runtime**: Virtualize long lists, debounce/throttle events, web workers for heavy computation
   - **CSS**: Purge unused CSS, critical CSS inline, font optimization (subset, `font-display: swap`)
5. Measure again — every optimization must show measurable improvement

## Rules
- Measure before and after — no optimization without data
- LCP < 2.5s, FID < 100ms, CLS < 0.1 — Core Web Vitals are the minimum bar
- Initial bundle < 200KB gzip — split anything larger
- Images: WebP/AVIF format, responsive sizes, lazy loading below the fold
- No render-blocking JavaScript or CSS — critical path must be lean
- Monitor performance in CI — block PRs that degrade Core Web Vitals
- Test on real devices, not just Chrome DevTools — throttled CPU + network is not reality
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
