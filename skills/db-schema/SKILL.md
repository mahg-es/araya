---
name: db-schema
description: "Design database schemas — tables, columns, types, constraints, indexes, and"
governance: "Constitution ENG-004: Engineering Excellence & Software Craftsmanship Standard"
---
---

# DB Schema

Design database schemas — tables, columns, types, constraints, indexes, and
migrations — following best practices for the target database engine.

## What problem this solves
Poorly designed schemas lead to data corruption, query performance issues, and
expensive migrations. This skill produces normalized schemas with proper types,
constraints, indexes, and migration scripts that evolve safely.

## When to use
When creating new tables, modifying existing schemas, designing a new database,
or reviewing an existing schema for normalization and performance.

## Input
Data model requirements, entity relationships, query patterns, expected data volumes.

## Output
1. **Entity-Relationship Diagram** (Mermaid):
```
erDiagram
  users ||--o{ orders : places
  users {
    uuid id PK
    string name
    string email UK
    string password_hash
    string role
    timestamp created_at
    timestamp updated_at
  }
  orders {
    uuid id PK
    uuid user_id FK
    string status
    decimal total
    timestamp created_at
  }
```

2. **Migration file** (SQL or ORM migration):
```sql
-- 001_create_users.up.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

## Steps
1. Identify entities from requirements — each noun is a candidate table
2. Define relationships: 1:1, 1:N, N:M (junction table)
3. Normalize to 3NF:
   - 1NF: Atomic columns, no repeating groups
   - 2NF: No partial dependencies (non-key depends on whole PK)
   - 3NF: No transitive dependencies (non-key depends only on PK)
4. Choose data types:
   - IDs: UUID (not autoincrement) for security and distributed systems
   - Text: VARCHAR with length constraint (not TEXT for fixed-size fields)
   - Timestamps: TIMESTAMPTZ always (never TIMESTAMP without timezone)
   - Money: DECIMAL(19,4) or NUMERIC (never FLOAT for currency)
5. Add constraints: NOT NULL, UNIQUE, CHECK, FOREIGN KEY (with ON DELETE policy)
6. Design indexes based on query patterns:
   - Index every foreign key
   - Index columns used in WHERE, JOIN, ORDER BY
   - Composite indexes for multi-column queries
7. Write migrations: up (apply) and down (rollback) for each change
8. Add audit columns: `created_at`, `updated_at` on every table

## Rules
- UUIDs for primary keys — no autoincrement integers that expose row counts
- TIMESTAMPTZ always — never TIMESTAMP without timezone; store UTC
- Every table gets `created_at` and `updated_at` columns with auto-update trigger
- Foreign keys with explicit ON DELETE (CASCADE, SET NULL, or RESTRICT — never default)
- Index every foreign key — missing FK indexes are the #1 performance killer
- Denormalize only with justification and documentation — premature denormalization is premature optimization
- Coordinate with Bernabé for data models that need pipeline support (Bronze/Silver/Gold)
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
