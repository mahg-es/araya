---
name: api-gateway
description: "Design and configure API gateways — routing, rate limiting, authentication,"
---
---

# API Gateway

Design and configure API gateways — routing, rate limiting, authentication,
request/response transformation, and API composition — providing a single
entry point for all client traffic.

## What problem this solves
Clients calling microservices directly leads to tight coupling, security sprawl,
and complex client logic. An API gateway consolidates authentication, rate
limiting, routing, and transformation at the edge — clients call one endpoint;
the gateway handles the rest.

## When to use
When an application has more than 2 backend services. When implementing
authentication at the edge. When clients need aggregated responses from
multiple services. When implementing rate limiting or request transformation.

## Input
Service inventory, authentication strategy, client requirements (web, mobile, API).

## Output
```yaml
# gateway/config.yaml (Kong / KrakenD / Express Gateway)
services:
  - name: user-service
    url: http://user-service:3001
    routes:
      - name: users
        paths: ["/api/v1/users"]
        methods: ["GET", "POST", "PUT", "DELETE"]
        strip_path: false

  - name: trade-service
    url: http://trade-service:3002
    routes:
      - name: trades
        paths: ["/api/v1/orders", "/api/v1/portfolio"]
        methods: ["GET", "POST"]
        strip_path: false

  - name: pricing-service
    url: http://pricing-service:3003
    routes:
      - name: pricing
        paths: ["/api/v1/prices"]
        methods: ["GET"]
        strip_path: false

plugins:
  # Global: Authentication
  - name: jwt
    config:
      claims_to_verify: ["exp"]
      secret: ${JWT_SECRET}

  # Global: Rate Limiting
  - name: rate-limiting
    config:
      minute: 100
      policy: local

  # Per-route overrides
  - name: rate-limiting
    route: trades
    config:
      minute: 300     # Higher limit for trading endpoints

  # CORS
  - name: cors
    config:
      origins: ["https://app.mantradecoin.com"]
      methods: ["GET", "POST", "PUT", "DELETE"]
      headers: ["Authorization", "Content-Type"]
      max_age: 3600

  # Request logging
  - name: http-log
    config:
      http_endpoint: http://log-service:3100/logs
      method: POST
      timeout: 1000
```

## Steps
1. Inventory backend services: URLs, health check endpoints, expected latency
2. Design routing table: which paths go to which service
3. Choose gateway pattern:
   - **Edge Gateway**: Internet-facing, handles auth + rate limiting (Kong, KrakenD, Traefik, Nginx)
   - **BFF (Backend for Frontend)**: One gateway per client type (web, mobile, API)
4. Implement cross-cutting concerns at the gateway:
   - Authentication (JWT validation, API key check)
   - Rate limiting (global + per-route)
   - CORS (explicit origins, not wildcard)
   - Request/response logging
   - Request validation (schema check before forwarding)
   - Response caching (GET requests, short TTL)
5. Configure health checks and circuit breakers for each backend
6. Set up monitoring: request rate, error rate, latency percentiles per route

## Rules
- Gateway authenticates at the edge — services behind it trust the gateway's auth
- Rate limiting at gateway level — never rely on services to rate-limit themselves
- CORS: explicit origins only, never `*` in production
- Gateway must be stateless — no session data, no business logic
- Health checks on every backend route — gateway must know when a service is down
- Request timeout: 30 seconds default, 5 seconds for pricing/real-time endpoints
- Gateway logs must never contain passwords, tokens, or PII in URL query parameters
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
