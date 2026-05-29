---
name: compliance
description: "Assess, document, and achieve compliance with regulatory frameworks — GDPR,"
---
---

# Compliance

Assess, document, and achieve compliance with regulatory frameworks — GDPR,
SOC 2, ISO 27001, HIPAA — translating legal requirements into technical
controls and operational procedures.

## What problem this solves
Compliance is treated as a checkbox exercise, leading to last-minute scrambles,
audit failures, and regulatory fines. This skill embeds compliance into the
development lifecycle — mapping regulations to technical controls, automating
evidence collection, and maintaining continuous compliance.

## When to use
When entering regulated markets (EU = GDPR, healthcare = HIPAA). When pursuing
SOC 2 or ISO 27001 certification. When a client contract requires compliance
evidence. When expanding to new jurisdictions.

## Input
Target compliance framework, system architecture, data inventory, current
security controls.

## Output
```markdown
# Compliance Assessment: ARAYA Platform — GDPR Readiness

## Framework Mapping: GDPR Articles → Technical Controls

| GDPR Article | Requirement | Control | Status |
|-------------|-------------|---------|--------|
| Art. 5.1(c) | Data minimization | Only collect fields needed for service; regular data inventory | 🟢 Compliant |
| Art. 5.1(e) | Storage limitation | Retention policies: user data deleted 30 days after account deletion | 🟡 Partial — automated deletion not implemented |
| Art. 25 | Data protection by design | Security review in SDLC (threat-model skill) | 🟢 Compliant |
| Art. 32 | Security of processing | Encryption at rest (AES-256), in transit (TLS 1.3), access controls | 🟢 Compliant |
| Art. 33 | Breach notification (72 hours) | Incident response plan drafted | 🔴 Missing — no formal IR plan |
| Art. 15-22 | Data subject rights | API endpoint for data export (JSON) | 🟡 Partial — deletion endpoint exists, export is manual |
| Art. 30 | Records of processing | Data flow diagrams in architecture docs | 🟢 Compliant |
| Art. 44-49 | International transfers | Data stored in EU region only | 🟢 Compliant |

## Compliance Scorecard
| Framework | Score | Status |
|-----------|-------|--------|
| GDPR | 78/100 | 🟡 Major gaps (breach notification, data export automation) |
| SOC 2 Type II | — | Not yet assessed |
| ISO 27001 | — | Not yet assessed |

## Gap Remediation Plan
| Priority | Gap | Action | Framework | Deadline |
|----------|-----|--------|-----------|----------|
| P0 | Breach notification procedure | Create incident response plan with 72h notification workflow | GDPR Art. 33 | 1 week |
| P1 | Automated data export | Build self-service data export endpoint (JSON + CSV) | GDPR Art. 20 | 2 weeks |
| P1 | Automated data deletion | Implement scheduled deletion 30 days post account-closure | GDPR Art. 17 | 2 weeks |
| P2 | Cookie consent banner | Add consent management platform for non-essential cookies | ePrivacy / GDPR | 3 weeks |
| P2 | Data Processing Agreement | Template DPA for B2B customers | GDPR Art. 28 | 3 weeks |

## Evidence Collection (Audit-Ready)
| Control | Evidence Type | Collection Method | Location |
|---------|-------------|-------------------|----------|
| Access Control | Access review logs | Quarterly automated review | `compliance/access-reviews/` |
| Encryption | Configuration scan | CI pipeline verification | Pipeline logs |
| Change Management | PR approvals + deployment logs | GitHub branch protection | Repository settings |
| Vulnerability Management | Scan reports + remediation timeline | Automated weekly scan | `compliance/vulnerability/` |
| Backup & Recovery | Backup success logs + restore test | Monthly automated test | `compliance/backup/` |

## Continuous Compliance Strategy
- **Shift left:** Pre-commit hooks for PII detection, secrets scanning
- **Automate evidence:** CI pipeline collects compliance artifacts, not manual screenshots
- **Monitor drift:** Weekly compliance scan against framework mappings
- **Annual review:** Full reassessment + penetration test + policy review
```

## Steps
1. Identify applicable frameworks based on data, jurisdiction, and business model
2. Map framework requirements to technical controls (not the other way around)
3. Assess current state: for each requirement, is it implemented, documented, and evidenced?
4. Identify gaps and prioritize by regulatory risk (fine amount × likelihood of audit)
5. Implement missing controls, document procedures, automate evidence collection
6. Prepare audit package: control matrix, evidence inventory, policy documents
7. Schedule recurring assessments — compliance is continuous, not point-in-time

## Rules
- Map regulations to controls, not the reverse — start with what's required, not what you have
- Every control needs three things: implementation, documentation, evidence
- Automate evidence collection — manual screenshots are unreliable and unsustainable
- Breach notification procedures must be tested — tabletop exercise, not just a document
- Data subject requests (access, deletion, portability) must be self-service where possible
- Compliance inherited from cloud providers is not sufficient — shared responsibility means you're still responsible
- Jurisdiction matters: EU data in EU region, healthcare data with BAA, financial data per local regulations
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
