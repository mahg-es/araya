---
name: db-optimization
description: "Optimize database performance — query tuning, index design, connection pooling,"
---
---

# DB Optimization

Optimize database performance — query tuning, index design, connection pooling,
and schema optimization — identifying slow queries and making them fast.

## What problem this solves
Databases slow down as data grows. Queries that took 10ms at 1,000 rows take 10s
at 1,000,000 rows. This skill analyzes query performance, identifies bottlenecks,
and applies indexing, rewriting, and configuration fixes.

## When to use
When queries are slow (> 100ms). When database CPU/memory is spiking. When
planning for data growth. Before launch (proactive). When users complain
about slow pages.

## Input
Slow query logs, EXPLAIN ANALYZE output, schema, query patterns, data volumes.

## Output
```markdown
# Database Optimization Report: User Management API

## Slow Query Analysis

### Query #1: User Search (2,340ms avg)
```sql
SELECT * FROM users WHERE email LIKE '%gmail%' ORDER BY created_at DESC LIMIT 20;
```
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Execution Time | 2,340ms | 12ms | **195x faster** |
| Rows Scanned | 1,200,000 | 847 | 1,416x fewer |

**Problems:**
1. `LIKE '%...%'` — leading wildcard prevents B-tree index usage
2. `SELECT *` — fetches all columns including unused `password_hash`
3. No LIMIT in subquery — sorts 1.2M rows then discards 1,199,980

**Fixes:**
```sql
-- 1. Add trigram index for LIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_email_trgm ON users USING GIN (email gin_trgm_ops);

-- 2. Select only needed columns
SELECT id, name, email, role, created_at
FROM users
WHERE email ILIKE '%gmail%'
ORDER BY created_at DESC
LIMIT 20;
```

### Query #2: N+1 Problem — User + Orders (N queries)
```typescript
// Anti-pattern: N+1
const users = await db.query("SELECT id FROM users");
for (const user of users.rows) {
  const orders = await db.query("SELECT * FROM orders WHERE user_id = $1", [user.id]);
}
// 1,001 queries for 1,000 users!
```

**Fix:** Single JOIN query
```typescript
const result = await db.query(`
  SELECT u.id, u.name, u.email,
         o.id AS order_id, o.total, o.status, o.created_at
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  ORDER BY u.id, o.created_at DESC
`);
// 1 query instead of 1,001
```

## Index Recommendations
| Table | Index | Reason | Impact |
|-------|-------|--------|--------|
| `users` | `(email)` — B-tree UNIQUE | Login lookup (already exists ✅) | P0 |
| `users` | `(email gin_trgm_ops)` — GIN | Partial email search | P1 |
| `orders` | `(user_id, created_at DESC)` — B-tree composite | User's recent orders | P0 |
| `orders` | `(status, created_at)` — B-tree | Filter orders by status | P1 |
| `sessions` | `(expires_at)` — B-tree | Cleanup expired sessions | P2 |

## Configuration Tuning
```ini
# postgresql.conf
shared_buffers = 256MB         # 25% of RAM
effective_cache_size = 768MB   # 75% of RAM
work_mem = 16MB                # Per-operation sort memory
maintenance_work_mem = 64MB    # VACUUM, CREATE INDEX
random_page_cost = 1.1         # SSD-optimized (default 4.0 is for HDD)
```

## Optimization Prioritization
| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| P0 | Add composite index on orders(user_id, created_at) | 5 min | Fixes N+1 and slow listing |
| P0 | Replace N+1 pattern in user-list endpoint | 15 min | Reduces 1,001 queries to 1 |
| P1 | Add GIN trigram index for email search | 2 min | Fixes slow search |
| P1 | Change `SELECT *` to explicit columns | 10 min | Reduces bandwidth + memory |
| P2 | Tune PostgreSQL config for server specs | 30 min | 20-30% general improvement |
```

## Steps
1. Identify slow queries: enable `log_min_duration_statement = 100ms`
2. For each slow query, run `EXPLAIN ANALYZE` to see execution plan
3. Look for red flags:
   - Seq Scan on large tables (> 10k rows) — needs index
   - Nested Loop with many rows — needs JOIN optimization or index
   - High `rows` estimate vs. `actual rows` — stats out of date (run ANALYZE)
4. Apply fixes in priority order:
   - Add missing indexes (biggest ROI)
   - Rewrite queries (N+1 elimination, selective columns, better JOINs)
   - Tune PostgreSQL config for hardware
   - Consider denormalization or materialized views for read-heavy queries
5. Measure before/after — every optimization must have evidence

## Rules
- Never optimize without measuring — `EXPLAIN ANALYZE` before and after
- Missing indexes are the #1 cause of slow queries — index every column in WHERE, JOIN, ORDER BY
- N+1 queries are the #2 cause — batch queries or use JOINs
- Never `SELECT *` in production — fetch only needed columns
- Update statistics after large data changes: `ANALYZE table_name`
- `VACUUM` regularly for PostgreSQL — autovacuum is not enough for high-write tables
- Connection pooling (PgBouncer) required for any app with > 20 concurrent connections
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
