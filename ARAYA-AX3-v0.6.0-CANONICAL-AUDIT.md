# ARAYA AX3 v0.6.0 — Canonical Adoption Audit

Status: ADOPTED / ACTIVE CANONICAL
Adoption date: 2026-09-27
Supersedes: v0.5.0

## Adoption authority

Repository/Governance Owner explicitly approved adoption of v0.6.0 as the new canonical governance
(PE-ARAYA-2609-C-06). The legacy Git tag `v0.6.0` belongs to a different historical lineage and is
not moved, deleted, rewritten, or repointed by this adoption.

## Packaging

- Operating Kernel: PRESENT
- Knowledge files: 10
- K11 introduced: NO
- Adoption record: PRESENT

## Validation

- K07 active v0.6.0: PASS
- K07 adoption date: PASS
- K10 active v0.6.0: PASS
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
- Host scoping preserved: ARAYA never takes over global Pi, and `DANEEL != ARAYA`.

## Adopted v0.6.0 evolution

v0.6.0 preserves the v0.5.0 governing identity and adopts, as canonical, the stable product line
built inside it (ADR-0001, ADR-0002):

- agent-first capability foundation: skills with progressive disclosure, deterministic operations
  with a minimal list/describe/resolve/execute API, and capabilities that map intent to
  skills/operations; no authority ownership, no roster, no orchestration engine;
- delegation as a capability resolver plus ephemeral specialist factory; specialist display names
  have no architectural meaning;
- native subagent execution with an ephemeral worker trace;
- PostOffice as messaging + trace (never an authority, ledger, gate, or continuation controller);
  PonyExpress as the Professor's channel (never an authority database);
- Relay recovered as L07 only (handoff, correlation, delivery, acknowledgement, trace) without the
  historical T0–T11/T12 state machine and lifecycle authority;
- Git operation gates as explicitly-invoked deterministic operations (no global shell gate);
- repository installer with idempotent in-place upgrade, opt-in project-scoped Pi adapter, and a
  hard ownership boundary around the Pi user layer;
- reproducible ChatGPT bundle as the packaging identity of the same canonical core;
- resolver precision and operation safety, with ES/EN regression coverage;
- product documentation sufficient for first use without the project's history.

## Result

CANONICAL_ADOPTION=PASS
ACTIVE_CANONICAL=v0.6.0
SUPERSEDES=v0.5.0
ADOPTION_DATE=2026-09-27

Disposition: AUDIT
