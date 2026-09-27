---
name: security-review
description: "Review code, architecture, and dependencies for security (OWASP/CWE/STRIDE), and audit secrets across four lenses."
---

# Security Review

Review a change for security across four lenses: secure code review
(OWASP ASVS / CWE Top 25), secure architecture review (zero-trust, least
privilege, defense in depth), threat modeling (STRIDE), and secrets hygiene.
This is a single canonical skill combining five legacy security skills that
were variants of one capability.

## What problem this solves

Security defects are 10x more expensive to fix in production than at review.
This skill finds injection flaws, broken auth, sensitive-data exposure,
design flaws, and hardcoded secrets before they ship.

## Boundary — reasoning-only capability

- **Reasoning** lives here: threat modeling, trust boundaries, contextual
  review of authn/authz/input-handling/data-access, and secrets hygiene.
- This capability declares **no deterministic operation**: a security review is
  not, by itself, a Git action. It therefore never drags a Git operation into a
  resolution. Where a change is published, the deterministic secret/path check
  belongs to the publication flow (`git.feature-pr-gate`), not to this skill —
  invoke it explicitly when you are actually publishing, not merely reviewing.

## Lenses

1. **Secure code** — OWASP ASVS + CWE Top 25: injection, broken auth, sensitive
   data exposure, XXE, SSRF, deserialization.
2. **Secure architecture** — zero-trust, defense in depth, least privilege,
   secure defaults, trust boundaries, data flows.
3. **Threat model** — STRIDE (Spoofing, Tampering, Repudiation, Information
   Disclosure, DoS, Elevation of Privilege) on the design.
4. **Secrets** — hardcoded credentials, keys, tokens; storage and rotation.

## Steps

1. Identify the change's trust boundaries and data flows.
2. Apply STRIDE; rank threats by likelihood × impact.
3. Review code for the most dangerous vulnerability classes; produce fixes.
4. For a change being published, note that the deterministic secret/path check
   runs in the publication flow; this skill does not declare that operation.
5. Recommend mitigations (not just findings).

## Rules

- Report findings with severity + concrete fix, not just "looks risky".
- This skill declares no deterministic operation — do not present secret/path
  scanning as an automatic step of the security-review capability.
- Least privilege and secure defaults over bolted-on hardening.

## Done criteria

- [ ] Code + architecture + threat model reviewed
- [ ] Findings carry severity + actionable mitigation

## Provenance

Combined from legacy skills: `secure-code`, `secure-arch`, `threat-model`,
`pentest`, `secrets`.
