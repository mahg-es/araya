---
name: threat-model
description: "Conduct structured threat modeling on a system design using STRIDE methodology."
---
---

# Threat Model

Conduct structured threat modeling on a system design using STRIDE methodology.
Identify threats, assess risk, and recommend mitigations before implementation
introduces vulnerabilities.

## What problem this solves
Security vulnerabilities are 10x more expensive to fix in production than in design.
This skill applies STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure,
Denial of Service, Elevation of Privilege) to find threats before they become exploits.

## When to use
At the design phase of any feature that handles data, authentication, payments, or
external APIs. Also on any existing system that has not been threat-modeled.

## Input
System architecture description, data flow diagram, or API specification.

## Output
A threat model document (`.araya/plan/spec/threat-model.md`):

```markdown
# Threat Model: User Management API

## System Overview
POST /users creates accounts; GET /users/:id returns user data.
Authentication via JWT. Database stores bcrypt-hashed passwords.

## Data Flow
Client → [HTTPS] → API Gateway → Auth Middleware → User Controller → PostgreSQL

## Threat Analysis (STRIDE)

### S — Spoofing
| ID | Threat | Impact | Likelihood | Mitigation |
|----|--------|--------|-----------|------------|
| T-01 | Attacker impersonates user via stolen JWT | High | Medium | Short-lived tokens (15min), refresh token rotation, rate limit on token refresh |
| T-02 | Attacker brute-forces passwords | High | High | Account lockout after 5 attempts, bcrypt with cost factor 12 |

### T — Tampering
| ID | Threat | Impact | Likelihood | Mitigation |
|----|--------|--------|-----------|------------|
| T-03 | User modifies JWT claims to escalate role | Critical | Low | Verify JWT signature on every request, never trust client-sent roles |

## Risk Matrix
| Risk Level | Count | 
|------------|-------|
| Critical | 2 |
| High | 5 |
| Medium | 3 |
| Low | 1 |
```

## Steps
1. Draw the data flow diagram: actors, boundaries, data stores, flows
2. Identify trust boundaries — where data crosses from untrusted → trusted zones
3. Apply STRIDE to each element in the data flow:
   - **Spoofing**: Can an attacker pretend to be someone else?
   - **Tampering**: Can data be modified in transit or at rest?
   - **Repudiation**: Can a user deny an action? Do we have audit logs?
   - **Information Disclosure**: Can an unauthorized party read data?
   - **Denial of Service**: Can the system be overwhelmed?
   - **Elevation of Privilege**: Can a user gain unauthorized access?
4. Rate each threat: Impact (Critical/High/Medium/Low) × Likelihood (High/Medium/Low)
5. Propose mitigations for every Critical and High threat
6. Create a risk matrix summarizing findings
7. Present threats as numbered options if The Data Professor needs to decide tradeoffs

## Rules
- Threat model before implementation — design-phase fixes are 10x cheaper
- Every trust boundary must be analyzed — API → DB, Client → Server, Service → Service
- Authentication is not authorization — verify both separately
- All High and Critical threats must have specific, actionable mitigations
- Audit logs required for: authentication events, data mutations, permission changes
- Share findings with relevant agents: Diana (overall security), Valentina (API fixes), Isla (infra controls)
- If a threat cannot be fully mitigated, document it as an accepted risk with justification
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
