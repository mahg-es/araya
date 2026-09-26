# ARAYA AX3 v0.5.0 — Canonical Adoption Audit

Status: ADOPTED / ACTIVE CANONICAL
Adoption date: 2026-09-20
Supersedes: v0.4.2

## Adoption authority

Repository/Governance Owner explicitly approved adoption of v0.5.0 as the new canonical governance.

## Packaging

- Operating Kernel: PRESENT
- Knowledge files: 10
- K11 introduced: NO
- Adoption record: PRESENT

## Validation

- K07 active v0.5.0: PASS
- K07 adoption date: PASS
- K10 active v0.5.0: PASS
- Exactly 10 K files: PASS
- Kernel present: PASS
- Residual candidate-state defects: NONE

## Preserved invariants

PASS:
- Repository Truth remains highest authority.
- Decision routing remains LOCK / DECIDE-BY-BEST-PRACTICE / ESCALATE-AUTHORITY / BLOCK-EVIDENCE-GAP.
- Four-stage model preserved.
- No authorization inferred across stages or publication/production boundaries.
- Technical Progress != Product Progress.
- DAG and failure-containment semantics preserved.
- Merge != Release authorization.
- Release != Production authorization.
- Product Acceptance != Production authorization.
- Bundle installer reuse and `UNKNOWN != MISSING` preserved.
- Exactly 10 Knowledge files preserved.
- No new final disposition introduced.

## Adopted v0.5.0 operating shift

v0.5.0 preserves governance rigor while reducing procedural fragmentation:

- slices remain fine-grained for traceability;
- compatible slices may execute as one Execution Group;
- deterministic gates move inside authorized transactions;
- routine repeatable operations prefer repo-native tooling;
- bundles remain governed but are no longer the routine interface for every microgate;
- release/production identity is explicit;
- failed operations are diagnosed before ungrounded corrective mutation;
- user and operational transitions are minimized.

## Result

CANONICAL_ADOPTION=PASS
ACTIVE_CANONICAL=v0.5.0
SUPERSEDES=v0.4.2
ADOPTION_DATE=2026-09-20

Disposition: AUDIT
