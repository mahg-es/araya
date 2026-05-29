---
name: message-queue
description: "Design asynchronous messaging architectures — choosing the right queue technology,"
---
---

# Message Queue

Design asynchronous messaging architectures — choosing the right queue technology,
defining message schemas, and implementing reliable producers and consumers for
event-driven systems.

## What problem this solves
Synchronous communication between services creates tight coupling and cascading
failures. Message queues decouple services in time and space — the producer
doesn't need the consumer to be online, and the consumer can process at its own
pace. This skill designs messaging architectures that are reliable, scalable,
and observable.

## When to use
When services need to communicate without blocking. When implementing event-driven
architecture. When handling high-throughput data that needs buffering. When
decoupling a monolith into microservices.

## Input
Service interaction requirements, throughput needs, ordering guarantees, latency
tolerances.

## Output
```markdown
# Messaging Architecture: ManTradeCoin Platform

## Queue Technology Selection
| Requirement | Kafka | RabbitMQ | SQS |
|------------|-------|----------|-----|
| High throughput (10k+ msg/s) | ✅ Best | ⚠️ Moderate | ⚠️ Moderate |
| Message ordering | ✅ Partition-level | ⚠️ Limited | ❌ No (FIFO limited) |
| Message replay | ✅ Yes | ❌ No (consumed = gone) | ❌ No |
| Complex routing | ❌ Limited | ✅ Exchanges + bindings | ❌ No |
| Operational simplicity | ❌ Complex | ✅ Moderate | ✅ Managed |
| **Decision:** **Kafka** for trade events (ordering + replay critical), **RabbitMQ** for notifications/routing |

## Topics & Queues

### Kafka Topics
| Topic | Partitions | Retention | Consumers |
|-------|-----------|-----------|----------|
| `trade.orders` | 12 | 7 days | order-service, analytics, audit |
| `trade.executions` | 12 | 7 days | portfolio-service, notification-service |
| `user.events` | 6 | 30 days | All services (auth cache invalidation) |
| `market.prices` | 3 | 24 hours | pricing-service, analytics |

### RabbitMQ Exchanges & Queues
| Exchange | Type | Queues | Routing Key |
|----------|------|--------|-------------|
| `notifications` | Topic | `email.*`, `push.*`, `sms.*` | `email.order.confirmation` |
| `dlx.dead` | Direct | `dead-letter.all` | — |

## Message Schema (Avro)
```json
{
  "type": "record",
  "name": "OrderPlaced",
  "namespace": "mantradecoin.trade",
  "fields": [
    { "name": "orderId", "type": "string" },
    { "name": "userId", "type": "string" },
    { "name": "symbol", "type": "string" },
    { "name": "side", "type": { "type": "enum", "name": "Side", "symbols": ["BUY", "SELL"] } },
    { "name": "quantity", "type": "double" },
    { "name": "price", "type": "double" },
    { "name": "timestamp", "type": "long", "logicalType": "timestamp-millis" }
  ]
}
```

## Reliability Patterns
| Pattern | Implementation |
|---------|---------------|
| **At-least-once delivery** | Consumer acknowledges after processing; retry on failure |
| **Idempotent consumers** | Deduplicate by `orderId` — process same message twice = same result |
| **Dead Letter Queue** | Failed after 3 retries → DLQ → alert → manual inspection |
| **Schema Registry** | Avro schemas versioned; producer validated before publish |
| **Ordering** | Same `userId` → same Kafka partition (consistent hashing) |
```

## Steps
1. Identify events: what things happen in the system that other services care about?
2. Choose queue technology based on requirements (throughput, ordering, replay, operations)
3. Design topics/queues: one topic per business event type, not one topic per consumer
4. Define message schemas with versioning (Avro, Protobuf, JSON Schema)
5. Implement producer patterns:
   - **At-least-once**: Retry with backoff on failure
   - **Idempotency key**: Unique key per message for deduplication
   - **Ordering**: Partition key strategy for ordered delivery where needed
6. Implement consumer patterns:
   - **Idempotent processing**: Deduplicate by message ID
   - **Dead Letter Queue**: Failed messages → DLQ after N retries
   - **Backpressure**: Consumer rate limiting, not producer throttling
7. Set up monitoring: message rate, consumer lag, DLQ size, processing latency

## Rules
- Consumers must be idempotent — process the same message twice, get the same result
- Never lose a message: at-least-once delivery with DLQ for poison messages
- Schema evolution: additive changes OK (new optional fields), breaking changes require new topic
- One topic per business event — not one topic per consumer
- Consumer lag > 1000 messages for > 5 minutes → alert
- DLQ must be monitored — any message in DLQ > 1 hour → human intervention
- Message payload: include event ID, timestamp, version — not just business data
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
