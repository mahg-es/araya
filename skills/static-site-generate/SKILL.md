---
name: static-site-generate
description: "Generate static websites and blogs — from Markdown content to deployed HTML —"
---
---

# Static Site Generate

Generate static websites and blogs — from Markdown content to deployed HTML —
using static site generators (Astro, Hugo, 11ty, Free Pascal CLI) with themes,
SEO, and automated deployment to CDN or static hosting.

## What problem this solves
Dynamic websites require servers, databases, and maintenance — overkill for
content sites, blogs, and documentation. Static sites are faster, more secure,
and cheaper to host. This skill generates complete static sites from content
files with automatic deployment to GitHub Pages, Cloudflare Pages, or Netlify.

## When to use
When creating or redesigning a content site, blog, documentation, or landing
page. When migrating from WordPress or other CMS. When The Data Professor says
"I need a website for X."

## Input
Content (Markdown files), design preferences (theme, colors, layout), domain
name, deployment target.

## Output
A complete static site:

```
my-site/
├── src/
│   ├── pages/
│   │   ├── index.md           # Home page
│   │   ├── about.md           # About page
│   │   └── blog/
│   │       ├── index.md       # Blog listing
│   │       └── post-1.md      # Blog post
│   ├── layouts/
│   │   └── BaseLayout.astro   # Main layout template
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── SEO.astro          # Meta tags, Open Graph, structured data
│   └── styles/
│       └── global.css          # Design tokens + styles
├── public/
│   ├── favicon.ico
│   └── images/
├── astro.config.mjs
├── package.json
└── .github/workflows/deploy.yml
```

### SEO Component
```astro
---
// src/components/SEO.astro
interface Props {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article";
  publishedAt?: string;
  author?: string;
}

const {
  title,
  description,
  image = "/images/og-default.png",
  type = "website",
  publishedAt,
  author = "Manuel Alejandro Hernández Giuliani",
} = Astro.props;

const siteTitle = "The Data Professor";
const siteUrl = "https://thedataprofessor.com";
const fullTitle = `${title} | ${siteTitle}`;
---

<!-- Primary Meta -->
<title>{fullTitle}</title>
<meta name="description" content={description} />
<link rel="canonical" href={new URL(Astro.url.pathname, siteUrl).href} />

<!-- Open Graph -->
<meta property="og:title" content={fullTitle} />
<meta property="og:description" content={description} />
<meta property="og:image" content={new URL(image, siteUrl).href} />
<meta property="og:url" content={new URL(Astro.url.pathname, siteUrl).href} />
<meta property="og:type" content={type} />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={fullTitle} />
<meta name="twitter:description" content={description} />

<!-- Structured Data -->
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": {type === "article" ? '"Article"' : '"WebSite"'},
    "headline": {JSON.stringify(title)},
    "description": {JSON.stringify(description)},
    "author": { "name": {JSON.stringify(author)} },
    {publishedAt ? `"datePublished": "${publishedAt}",` : ''}
  }
</script>

<!-- Copyright -->
<meta name="copyright" content="© 2026 Manuel Alejandro Hernández Giuliani. All rights reserved." />
```

### Deployment (GitHub Actions)
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Steps
1. Choose SSG based on content type and The Data Professor's preference:
   - **Astro** (modern, component-based, great for content sites)
   - **Hugo** (fastest build, Go-based, excellent for blogs)
   - **11ty** (flexible, JS-based, great for documentation)
   - **Free Pascal CLI** (mahg-staticforge, custom tooling)
2. Design information architecture: pages, sections, navigation
3. Implement layouts: base template with header, footer, SEO, navigation
4. Create content pages from Markdown files
5. Apply theme: colors, typography, spacing from Dorcas / brand guidelines
6. Generate: `npm run build` or SSG build command
7. Deploy: GitHub Pages, Cloudflare Pages, or Netlify with custom domain
8. Validate: Lighthouse ≥ 95 performance, 100 accessibility, 100 SEO

## Rules
- Lighthouse scores: Performance ≥ 95, Accessibility = 100, SEO = 100
- Every page must have: title, meta description, canonical URL, OG tags
- Images: WebP format, responsive srcset, lazy loading below the fold
- No JavaScript framework unless absolutely necessary — static HTML is the goal
- Copyright footer on every page: "© 2026 Manuel Alejandro Hernández Giuliani. All rights reserved."
- Custom domain with HTTPS — Let's Encrypt or CDN-provided certificate
- Coordinate with Lucas for content strategy and Dorcas for brand compliance
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
