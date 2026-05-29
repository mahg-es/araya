---
name: microservice
description: "Design microservice architectures — service boundaries, communication patterns,"
---
---

# Microservice

Design microservice architectures — service boundaries, communication patterns,
data ownership, and deployment independence — decomposing monoliths or designing
distributed systems from scratch.

## What problem this solves
Poorly bounded microservices create distributed monoliths — worse than the
monolith they replaced. This skill designs service boundaries based on business
domains (Domain-Driven Design), ensuring each service is independently
deployable, scalable, and maintainable.

## When to use
When decomposing a monolith. When designing a new distributed system. When
evaluating whether something should be a microservice or part of an existing
service. When The Data Professor says "should we use microservices?"

## Input
Business domain description, current architecture (if migrating), scale and
team structure.

## Output
```markdown
# Microservice Architecture: ManTradeCoin Platform

## Service Decomposition (Domain-Driven Design)

| Bounded Context | Service | Data Ownership | Communication | Team |
|----------------|---------|---------------|---------------|------|
| User Management | `user-service` | PostgreSQL `users_db` | REST + Events | Valentina |
| Trading | `trade-service` | PostgreSQL `trades_db` | REST + Events | Valentina |
| Pricing | `pricing-service` | Redis + PostgreSQL | gRPC (low latency) | Aisha |
| Notifications | `notification-service` | MongoDB (templates) | Async events only | Valentina |
| Analytics | `analytics-service` | ClickHouse | Async events only | Pablo |

## Service Boundaries

### user-service
- **Owns:** User CRUD, authentication, authorization, profile
- **Does NOT own:** Trading history (belongs to trade-service)
- **API:** POST /users, GET /users/:id, POST /auth/login, POST /auth/refresh
- **Events published:** `user.created`, `user.updated`, `user.deleted`

### trade-service  
- **Owns:** Order placement, execution, history, portfolio
- **Depends on:** user-service (for user validation), pricing-service (for current prices)
- **API:** POST /orders, GET /orders/:id, GET /portfolio
- **Events published:** `order.placed`, `order.executed`, `trade.completed`

## Communication Patterns
- **Synchronous (REST/gRPC):** User validation, current price queries (must return immediately)
- **Asynchronous (Events/Kafka):** Notifications, analytics, audit logs (eventual consistency OK)
- **Circuit Breaker:** On all synchronous calls — 5 failures in 30s → open circuit → fallback

## Data Ownership
- Each service owns its database — no shared databases
- trade-service stores `userId` (foreign key reference, no foreign key constraint)
- Data duplication acceptable for resilience: trade-service caches user name/email
- Event sourcing for trade history: event store is source of truth, projections for queries

## Deployment Independence
- Each service: independent Docker image, independent CI/CD pipeline
- Staggered deployments: user-service → pricing-service → trade-service
- API versioning: `/v1/` for stable, `/v2/` for breaking changes
- Backward compatibility: support N-1 version for 2 release cycles
```

## Steps
1. Map business domains using Domain-Driven Design (Event Storming or business capability mapping)
2. Identify bounded contexts — where does one domain end and another begin?
3. For each context, define:
   - **Data ownership**: What data does this service own and protect?
   - **API contract**: What does it expose to other services?
   - **Events**: What does it tell the world about?
   - **Dependencies**: What does it need from other services?
4. Choose communication patterns:
   - Synchronous for queries that need immediate answers (REST, gRPC)
   - Asynchronous for notifications, events, eventual consistency (Kafka, RabbitMQ, SQS)
5. Design for failure: circuit breakers, retries, timeouts, fallbacks on every external call
6. Plan data strategy: database per service, event sourcing where needed, CQRS for complex queries
7. Define deployment order and API versioning strategy

## Rules
- Database per service — no shared databases between microservices
- First, prove the monolith doesn't work — premature microservices are premature optimization
- Synchronous calls between services ≤ 1 level deep — no call chains (A→B→C→D)
- Circuit breaker on every external service call — assume every dependency will fail
- Services communicate via API contracts — never access another service's database directly
- Events are the backbone — invest early in reliable event infrastructure
- If two services always deploy together, they should be one service
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
