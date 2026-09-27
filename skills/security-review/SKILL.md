---
name: security-review
description: "Review code, architecture, and dependencies for security (OWASP/CWE/STRIDE), and audit secrets — with deterministic secret/path checks delegated to the git operations."
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

## Boundary — deterministic checks via operations

- **Reasoning** lives here: threat modeling, trust boundaries, contextual
  review of authn/authz/input-handling/data-access.
- **Deterministic secret/path checks** are already operations — invoke them
  instead of re-deriving:

```bash
araya operation execute git.feature-pr-gate base=origin/dev-mahg
# reports no_secrets + no_forbidden_paths deterministically
```

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
4. Invoke the git operations' secret/path checks for the deterministic part.
5. Recommend mitigations (not just findings).

## Rules

- Report findings with severity + concrete fix, not just "looks risky".
- Do not re-derive secret/path scanning — invoke the deterministic operation.
- Least privilege and secure defaults over bolted-on hardening.

## Done criteria

- [ ] Code + architecture + threat model reviewed
- [ ] Deterministic secret/path check invoked
- [ ] Findings carry severity + actionable mitigation

## Provenance

Combined from legacy skills: `secure-code`, `secure-arch`, `threat-model`,
`pentest`, `secrets`.
