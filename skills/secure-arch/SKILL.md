---
name: secure-arch
description: "Review system architecture for security — zero-trust design, defense in depth,"
---
---

# Secure Architecture

Review system architecture for security — zero-trust design, defense in depth,
least privilege, and secure defaults — finding architectural vulnerabilities
before they become production incidents.

## What problem this solves
Secure code reviews find implementation bugs; secure architecture reviews find
design flaws — which are 10x more expensive to fix. This skill audits the
architecture itself: trust boundaries, data flows, authentication model,
and network segmentation.

## When to use
During architecture design. When adding new services or third-party integrations.
When the system handles PII, payments, or authentication. Before any security
audit or penetration test.

## Input
Architecture diagrams, data flow diagrams, API specifications, infrastructure
configuration.

## Output
```markdown
# Secure Architecture Review: ARAYA Platform

## Architecture Security Scorecard
| Domain | Score | Status |
|--------|-------|--------|
| Network Security | 7/10 | 🟡 |
| Identity & Access | 8/10 | 🟢 |
| Data Protection | 6/10 | 🟡 |
| Secrets Management | 9/10 | 🟢 |
| Logging & Monitoring | 5/10 | 🔴 |
| Resilience | 7/10 | 🟢 |

## Findings

### SA-01: Direct database exposure to internet
- **Severity:** Critical 🔴
- **Description:** PostgreSQL port 5432 exposed to 0.0.0.0 in docker-compose
- **Risk:** Anyone can attempt database connections, brute-force credentials
- **Fix:**
  ```yaml
  # docker-compose.yml
  postgres:
    ports:
      - "127.0.0.1:5432:5432"  # Loopback only, not 0.0.0.0
  ```

### SA-02: Missing network segmentation
- **Severity:** High 🟠
- **Description:** All services on same Docker network; no internal firewalls
- **Risk:** Compromised frontend can access database directly
- **Fix:** Separate frontend-net, backend-net, data-net with controlled ingress

### SA-03: No audit logging
- **Severity:** High 🟠
- **Description:** No centralized logging for auth events, data access, or admin actions
- **Risk:** Cannot detect or investigate security incidents
- **Fix:** Implement audit log with: who, what, when, from where, result

### SA-04: TLS terminated at load balancer, internal traffic plaintext
- **Severity:** Medium 🟡
- **Description:** HTTPS → Load Balancer → HTTP → Internal services
- **Risk:** Traffic sniffing within network (lateral movement after breach)
- **Fix:** mTLS between services or at minimum TLS for all internal traffic

## Zero-Trust Assessment
| Principle | Implemented? | Notes |
|-----------|-------------|-------|
| Never trust, always verify | Partial | Auth at gateway, but services trust gateway blindly |
| Least privilege | ✅ | Role-based access, per-endpoint permissions |
| Assume breach | ❌ | No lateral movement prevention, no internal encryption |
| Explicit verification | Partial | Auth token verified once, not per-service |
```

## Steps
1. Review architecture diagrams — identify all trust boundaries
2. Apply zero-trust principles:
   - Never trust the network — authenticate and authorize every request
   - Least privilege — services get minimum permissions needed
   - Assume breach — design for containment when (not if) a service is compromised
3. Audit each layer:
   - **Network:** Exposed ports, segmentation, TLS, firewalls
   - **Identity:** Authentication method, token storage, session management
   - **Authorization:** Role model, permission granularity, admin access
   - **Data:** Encryption at rest, encryption in transit, PII handling, backups
   - **Secrets:** Storage, rotation, access audit, leak detection
   - **Logging:** Audit events, centralized collection, tamper-proof storage
   - **Resilience:** DoS protection, rate limiting, circuit breakers, fail-closed
4. Rate each finding by severity and provide concrete fixes
5. Share with Diana for threat model correlation and secure code review

## Rules
- No service should accept connections from the internet unless it's a gateway
- Internal traffic must be encrypted (mTLS or TLS) — the network is hostile
- Database ports never exposed publicly — loopback or internal network only
- Every auth event must be logged: login, logout, token refresh, permission change
- Admin actions require re-authentication (step-up auth)
- Services authenticate to each other, not just the gateway to the user
- Default deny for all network policies — whitelist only required traffic
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
