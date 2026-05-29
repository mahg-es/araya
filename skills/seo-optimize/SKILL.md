---
name: seo-optimize
description: "Optimize content and websites for search engines — keyword strategy, on-page"
---
---

# SEO Optimize

Optimize content and websites for search engines — keyword strategy, on-page
SEO, technical SEO, and Generative Engine Optimization (GEO) — ensuring content
ranks in both traditional search results and AI-generated answers.

## What problem this solves
"Build it and they will come" doesn't work for search. Without SEO, great
content remains invisible. This skill performs keyword research, on-page
optimization, technical audits, and GEO (optimizing for AI-powered search
like Google SGE and ChatGPT) — making content discoverable by humans and AI.

## When to use
Before publishing any content. When organic traffic is low. When launching
or redesigning a website. When a competitor outranks you. When AI search
engines become a significant traffic source.

## Input
Content, website URL, target keywords, competitor URLs.

## Output
```markdown
# SEO Audit & Optimization: thedataprofessor.com

## Keyword Strategy

### Primary Keywords (High Volume, High Intent)
| Keyword | Volume | Difficulty | Current Rank | Target |
|---------|--------|-----------|-------------|--------|
| "big data architecture" | 2,400/mo | Medium (35) | #12 | #1-3 |
| "enterprise data platform" | 1,800/mo | High (52) | #28 | #1-5 |
| "activity-based costing tutorial" | 880/mo | Low (18) | #4 | #1 |

### Long-Tail Keywords (Lower Volume, Higher Conversion)
| Keyword | Volume | Intent | Opportunity |
|---------|--------|--------|------------|
| "how to build medallion architecture spark" | 90/mo | Tutorial | Create dedicated tutorial |
| "ABC costing whale curve example" | 70/mo | Template | Create template with examples |
| "traefik authentik docker compose 2026" | 110/mo | Setup | Write configuration guide |

## On-Page Optimization

### Page: /big-data-architecture/
- **Title:** "Enterprise Big Data Architecture: Medallion Lakehouse Design" (52 chars ✅)
- **Meta Description:** "Complete guide to enterprise big data architecture using medallion design. Covers Bronze/Silver/Gold layers, Delta Lake, and cloud deployment patterns." (148 chars ✅)
- **H1:** "Enterprise Big Data Architecture" ✅
- **H2s:** "Medallion Architecture", "Bronze Layer", "Silver Layer", "Gold Layer", "Cloud Deployment" (all contain target keywords)
- **Missing:** Alt text on 3 architecture diagrams — add descriptive alt text with keywords
- **Missing:** Schema.org `Article` structured data — add for rich snippets

## Technical SEO
| Issue | Severity | Fix |
|-------|----------|-----|
| Missing sitemap.xml | High | Generate with static-site-generate skill |
| No robots.txt | Medium | Add with sitemap reference |
| PageSpeed Mobile: 62 | High | Optimize images (WebP), defer JS, inline critical CSS |
| Missing canonical tags | Medium | Add to all pages |
| HTTP → HTTPS redirect missing | Critical | Configure at CDN/load balancer level |

## GEO (Generative Engine Optimization)

### For Google SGE / ChatGPT / Perplexity
| Technique | Implementation |
|-----------|---------------|
| **Structured answers** | Use Q&A format for target questions: "What is medallion architecture?" → H2 question, H3 answer, structured list |
| **Entity optimization** | Link to Wikipedia/Wikidata entities: "Apache Spark", "Delta Lake", "Data Lakehouse" |
| **Author authority** | Prominent author bio with credentials (Manuel Alejandro Hernández Giuliani — Enterprise Big Data Architect) |
| **Citation-worthy stats** | Include original statistics, benchmarks, or case studies that AI can cite |
| **Content freshness** | Date-modified meta tag; update content quarterly |

## Content Calendar — SEO Priority
| Week | Action | Expected Impact |
|------|--------|----------------|
| 1 | Fix critical technical issues (HTTPS, sitemap) | Indexing improvement |
| 2 | Optimize top 5 pages (title, meta, headings) | +3-5 positions |
| 3 | Create long-tail content (3 articles) | +50-100 new keywords |
| 4 | Implement structured data | Rich snippets in 2-4 weeks |
```

## Steps
1. Research keywords: use Google Keyword Planner, Ahrefs, or free alternatives
2. Analyze current rankings: where are you now for target keywords?
3. Audit on-page SEO: title, meta description, H1, H2s, alt text, internal links
4. Audit technical SEO: sitemap, robots.txt, canonical, HTTPS, PageSpeed
5. Apply GEO techniques: structured Q&A, entity linking, author authority, fresh content
6. Implement changes in priority order: technical > on-page > content > GEO
7. Monitor: track rankings weekly, adjust strategy based on results

## Rules
- Title tag: 50-60 characters, primary keyword first, brand name last
- Meta description: 140-160 characters, include keyword, end with call to action
- One H1 per page — must contain primary keyword
- Alt text on every image — descriptive, include keyword where natural
- HTTPS mandatory — Google penalizes HTTP sites
- Mobile-first: Google indexes mobile version; test with Mobile-Friendly Test
- GEO is complementary to SEO, not a replacement — optimize for both traditional and AI search
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
