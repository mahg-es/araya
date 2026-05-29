---
name: performance-test
description: "Design and execute performance tests — load, stress, soak, and spike testing —"
---
---

# Performance Test

Design and execute performance tests — load, stress, soak, and spike testing —
measuring system behavior under realistic traffic and finding breaking points
before users do.

## What problem this solves
Systems that work for 10 users crash at 1,000. Performance tests simulate
realistic load to find bottlenecks, capacity limits, and degradation patterns
BEFORE they hit production — preventing outages, revenue loss, and reputational
damage.

## When to use
Before launching any API or service. After significant architecture changes.
When scaling to new user tiers. When users report slowness under load.

## Input
System architecture, expected user counts, target response times, critical paths.

## Output
```markdown
# Performance Test Plan & Results: User Management API

## Test Environment
- **Infrastructure:** 2 vCPU, 4GB RAM, PostgreSQL 16, Node.js 22
- **Tool:** k6 (Grafana)
- **Test Data:** 100,000 users pre-loaded

## Test Scenarios

### Scenario 1: Load Test (Expected Peak)
- **Ramp-up:** 0 → 100 VUs over 2 minutes
- **Steady:** 100 VUs for 10 minutes
- **Ramp-down:** 100 → 0 over 1 minute
- **Thresholds:**
  - p95 < 500ms ✅
  - p99 < 1,000ms ✅
  - Error rate < 1% ✅

### Scenario 2: Stress Test (Find Breaking Point)
- **Ramp-up:** 0 → 500 VUs over 10 minutes
- **Objective:** Find max throughput before degradation

### Scenario 3: Spike Test (Sudden Burst)
- **Pattern:** 10 VUs → spike to 200 VUs instantly → back to 10
- **Objective:** Verify auto-scaling and recovery

## Results

### Load Test (100 VUs)
| Endpoint | Req/s | p50 | p95 | p99 | Error Rate |
|----------|-------|-----|-----|-----|-----------|
| GET /users | 850 | 45ms | 120ms | 210ms | 0.0% |
| GET /users/:id | 1,200 | 22ms | 65ms | 98ms | 0.0% |
| POST /users | 180 | 180ms | 420ms | 680ms | 0.0% |

### Stress Test Results
| VUs | Req/s | p95 | Error Rate | Notes |
|-----|-------|-----|-----------|-------|
| 100 | 850 | 120ms | 0.0% | Normal ✅ |
| 200 | 1,400 | 280ms | 0.0% | Scaling well ✅ |
| 300 | 1,300 | 890ms | 0.2% | Queueing observed 🟡 |
| 400 | 950 | 3,200ms | 8.5% | 🔴 Degradation — connection pool exhausted |
| 500 | 420 | 12,000ms | 34% | 🔴 System failing |

**Breaking point:** 350 VUs (connection pool maxed at 20 connections)

### Bottlenecks Identified
1. **PostgreSQL connection pool (20 max)** → Exhausted at 350 VUs → Increase to 50 + add PgBouncer
2. **bcrypt hashing (POST /users)** → 180ms per request → Move to queue for non-blocking
3. **No response compression** → 45KB average response → Add gzip (reduces to 6KB)

## Recommendations
| Priority | Action | Expected Impact |
|----------|--------|----------------|
| P0 | Increase connection pool to 50 + add PgBouncer | Supports 500+ VUs |
| P1 | Add response compression (gzip/brotli) | 85% bandwidth reduction |
| P1 | Async bcrypt via worker thread or queue | POST throughput 3x |
| P2 | Add Redis cache for GET /users/:id | 10x read throughput |
```

## Steps
1. Identify critical paths: most-used endpoints, highest-value transactions
2. Choose tool: k6 (modern, JS), JMeter (enterprise), Locust (Python), Artillery (Node)
3. Design test scenarios:
   - **Load test:** Expected peak traffic × 1.5
   - **Stress test:** Ramp until system breaks — find the ceiling
   - **Soak test:** Moderate load for hours — find memory leaks
   - **Spike test:** Sudden burst — verify auto-scaling and recovery
4. Define thresholds: p95 latency, error rate, throughput
5. Run from distributed locations to avoid client-side bottlenecks
6. Monitor system during test: CPU, memory, DB connections, queue depth
7. Analyze results: find bottlenecks, document breaking points, recommend fixes

## Rules
- Test environment must match production specs — "works on my machine" is not a performance test
- Run from multiple geographic locations — single-location tests miss network bottlenecks
- p95 and p99 matter more than average — averages hide tail latency
- Error rate < 1% under load — anything higher is a failing test
- Connection pool exhaustion is the #1 bottleneck — monitor connections during every test
- Soak test for at least 2x your longest-running production process (memory leaks are slow)
- Never run performance tests against production during peak hours
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
