---
name: cache-strategy
description: "Design caching strategies — what to cache, where, for how long, and how to"
---
---

# Cache Strategy

Design caching strategies — what to cache, where, for how long, and how to
invalidate — reducing database load, API latency, and infrastructure costs
while keeping data acceptably fresh.

## What problem this solves
Without caching, every request hits the database — slow, expensive, and
unnecessary for frequently-read, rarely-changed data. This skill designs
multi-level caching with appropriate TTLs, invalidation strategies, and
fallbacks that balance freshness with performance.

## When to use
When API response times exceed 200ms. When database load is high from repeated
reads. When implementing features with high read-to-write ratios (product
catalogs, user profiles, configuration). Before launch, not after.

## Input
API endpoints, data freshness requirements, read/write ratios, traffic patterns.

## Output
```markdown
# Cache Strategy: ManTradeCoin Platform

## Cache Architecture

┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│ Client  │───►│ CDN (Edge)   │───►│ API Gateway  │───►│ Redis      │
│         │    │ TTL: 1h-24h  │    │ TTL: 30s-5m  │    │ TTL: 1m-1h │
└─────────┘    └──────────────┘    └─────────────┘    └────────────┘
                                                             │
                                                        ┌────▼───────┐
                                                        │ PostgreSQL │
                                                        │ (source)   │
                                                        └────────────┘

## Cache Tiers

### Tier 1: Browser/Client Cache
| Resource | Cache-Control | Stale While Revalidate |
|----------|--------------|----------------------|
| Static assets (JS, CSS, images) | `max-age=31536000, immutable` | — |
| API responses (GET) | `private, max-age=30` | `stale-while-revalidate=300` |
| HTML pages | `no-cache` (always revalidate) | — |

### Tier 2: CDN Cache (Cloudflare / Fastly)
| Resource | TTL | Purge Strategy |
|----------|-----|---------------|
| Static assets | 1 year (fingerprinted URLs) | New filename on change |
| API GET /prices | 5 seconds | Purge on price update event |
| API GET /users/:id | 60 seconds | Purge on user update event |

### Tier 3: Application Cache (Redis)
| Data | TTL | Invalidation | Key Pattern |
|------|-----|-------------|-------------|
| User session | 15 minutes | On logout or expiry | `session:{token}` |
| User profile | 5 minutes | On user update event | `user:{userId}:profile` |
| Price feed | 30 seconds | On price update event | `prices:current` |
| Order book | 1 second | On order event | `orderbook:{symbol}` |
| Rate limit counters | Window size | Automatic expiry | `ratelimit:{ip}:{endpoint}` |

## Caching Patterns

### Cache-Aside (Lazy Loading)
```
App checks Redis → Miss → Queries PostgreSQL → Stores in Redis → Returns
App checks Redis → Hit → Returns immediately
```
**Use for:** User profiles, configuration, content

### Write-Through
```
App writes to Redis → Redis writes to PostgreSQL synchronously
```
**Use for:** Data that must never be stale (account balances)

### Write-Behind
```
App writes to Redis → Redis writes to PostgreSQL asynchronously
```
**Use for:** High-write, latency-tolerant data (analytics events)

## Cache Invalidation Strategy
- **TTL-based:** Primary strategy (automatic expiry)
- **Event-driven:** On data mutation, publish invalidation event → clear affected cache keys
- **Key pattern:** Structured keys enable batch invalidation (`user:{id}:*`)
- **Never delete cache on error:** Serve stale data if backend is down (stale-while-revalidate)
```

## Steps
1. Profile current API response times — which endpoints are slow and why?
2. Categorize data by freshness tolerance:
   - **Real-time** (< 1s stale): Order books, live auctions → minimal caching or cache-aside with 1s TTL
   - **Near real-time** (1-30s): Prices, availability → short TTL Redis
   - **Eventually consistent** (1-30 min): User profiles, content → longer TTL Redis + CDN
   - **Static** (hours-days): Config, reference data, assets → CDN with long TTL
3. Design cache hierarchy: Browser → CDN → Application (Redis) → Database
4. Choose caching pattern per data type: Cache-Aside, Write-Through, Write-Behind
5. Define invalidation strategy: TTL + event-driven + key pattern for batch invalidation
6. Implement fallback: serve stale data if backend is down
7. Set up monitoring: cache hit rate, miss latency, eviction rate, memory usage

## Rules
- Cache at the closest layer to the client first (CDN > Redis > Database cache)
- TTL must be shorter than the business tolerance for stale data
- Stale data > no data — serve cached data if backend is down
- Cache keys must be namespaced: `{domain}:{entity}:{id}:{field}`
- Monitor cache hit rate — if < 80%, your TTL is too short or your keys are wrong
- Never cache POST/PUT/DELETE responses
- Authentication/authorization data: short TTL (5-15 min), immediate invalidation on role change
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
