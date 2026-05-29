---
name: monitoring
description: "Design and implement observability — logs, metrics, traces, and alerts — that"
---
---

# Monitoring

Design and implement observability — logs, metrics, traces, and alerts — that
tell you what's happening in your system right now, what happened yesterday,
and what will happen if nothing changes.

## What problem this solves
"Works on my machine" becomes "is it working right now?" in production. Without
observability, you're flying blind — users report outages before you detect them.
This skill designs the three pillars of observability: logs, metrics, and traces
— with actionable alerts that wake you up when something is actually wrong.

## When to use
Before deploying any service to production. When the current monitoring is
"users tell us when it's down." When troubleshooting takes hours because
there are no logs or traces.

## Input
System architecture, service inventory, SLO/SLA requirements, alerting preferences.

## Output
```yaml
# docker-compose.monitoring.yml
services:
  # Metrics collection
  prometheus:
    image: prom/prometheus:v2.50.0
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--storage.tsdb.retention.time=30d'
    ports:
      - "9090:9090"

  # Dashboards
  grafana:
    image: grafana/grafana:10.4.0
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    depends_on:
      - prometheus

  # Log aggregation (Loki + Promtail)
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log:ro
      - ./monitoring/promtail.yml:/etc/promtail/promtail.yml

  # Distributed tracing
  tempo:
    image: grafana/tempo:2.3.0
    command: ["-config.file=/etc/tempo/tempo.yml"]
    volumes:
      - ./monitoring/tempo.yml:/etc/tempo/tempo.yml
    ports:
      - "3200:3200"   # Tempo HTTP

volumes:
  prometheus_data:
  grafana_data:
```

## Golden Signals (RED Method)
Monitor these four signals for EVERY service:

| Signal | Metric | Example Alert |
|--------|--------|--------------|
| **Rate** | Requests per second | > 2x baseline for 5 min → traffic spike |
| **Errors** | Error rate (%) | > 1% for 5 min → failing service |
| **Duration** | p95 latency | > 500ms for 5 min → degraded performance |
| **Saturation** | CPU, memory, connections | > 80% for 10 min → resource exhaustion |

## Alert Tiers
| Tier | Alert | Example | Channel | Response |
|------|-------|---------|---------|----------|
| **P0 — Critical** | Service down, data loss | API returning 500 for > 2 min | PagerDuty, SMS | Immediate (any time) |
| **P1 — High** | Degraded, at risk | Error rate > 1%, DB CPU > 80% | Slack #alerts | Within 30 min business hours |
| **P2 — Medium** | Warning, trending | Disk 70% full, certificate expiry < 14 days | Slack #monitoring | Within 4 hours |
| **P3 — Low** | Informational | Deployment completed, backup successful | Slack #events | Acknowledge |

## Key Dashboards

### Service Overview
```
┌─────────────────────────────────────────────────┐
│  Service: araya-api    Uptime: 99.97% (30d)     │
├─────────────────────────────────────────────────┤
│  Requests: 850/s    Errors: 0.02%    p95: 120ms │
│  ████████████████░  ░░░░░░░░░░░░░░  ██████░░░░░ │
├─────────────────────────────────────────────────┤
│  CPU: 34%    Memory: 2.1GB/4GB    DB Conns: 8   │
│  ██████░░░░░░░░  ██████████░░░░  ████░░░░░░░░░░ │
└─────────────────────────────────────────────────┘
```

### RED Dashboard (per endpoint)
| Endpoint | Rate | Errors | p50 | p95 | p99 |
|----------|------|--------|-----|-----|-----|
| GET /users | 450/s | 0.0% | 22ms | 65ms | 120ms |
| GET /users/:id | 200/s | 0.0% | 18ms | 45ms | 85ms |
| POST /users | 50/s | 0.2% | 120ms | 380ms | 650ms |

## Steps
1. Instrument services: metrics (Prometheus client), logs (structured JSON), traces (OpenTelemetry)
2. Define SLOs: 99.9% uptime, p95 < 500ms, error rate < 1%
3. Set up collection: Prometheus (pull), Loki (logs), Tempo (traces)
4. Build dashboards: Service overview, RED per endpoint, business metrics
5. Configure alerts: P0 critical path, P1 degradation, P2 warnings
6. Test alerts: simulate failure, verify alert fires, verify notification delivery
7. Review and tune: remove noisy alerts, add missing ones, adjust thresholds monthly

## Rules
- Every service must expose: request rate, error rate, latency percentiles
- Logs must be structured (JSON) — grep-friendly text logs don't scale
- Alerts must require action — if no one does anything, it's noise, not an alert
- P0 alerts must wake someone up — no P0 alert goes to Slack only
- Dashboards begin with the four golden signals — everything else is secondary
- Trace every request across services — OpenTelemetry context propagation is mandatory
- Alert fatigue kills monitoring — if an alert fires > 5 times without action, demote or remove it
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
