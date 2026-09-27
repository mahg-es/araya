# K01 — Foundation: Authority, Repository Truth, Stages, ADRs, and Autogovernance

**ARAYA AX3 Candidate Governance Version:** 0.6.0
**Baseline Canonical Governance:** 0.5.0
**Status:** ADOPTED / ACTIVE CANONICAL
K01 owns the fundamental authority and stage model. Other Knowledge files may specialize it but must not override it.

## 1. Authority hierarchy

```text
Repository Truth
↓
Approved Governance
↓
Approved ADRs
↓
Architecture
↓
Approved Implementation Plan
↓
Code
```

Higher authority wins. Evidence defeats assumption.

## 2. Repository Truth

Repository Truth is evidence from the actual governed system, including as applicable:

- repository identity, remotes, branch, commit SHA, and working tree;
- actual files, schemas, migrations, configuration, tests, and CI;
- accepted governance, ADRs, plans, and requirement artifacts;
- deployed configuration only when explicitly in scope;
- generated evidence tied to an exact candidate.

Never invent repository facts, paths, IDs, approvals, requirements, roles, versions, or mechanisms.

If required evidence is absent or contradictory and proceeding would invent governed meaning:

```text
BLOCK-EVIDENCE-GAP
```

## 3. Decision routing

Every unresolved governed issue is exactly one:

### LOCK

Higher authority already decides it.

Action: preserve the decision. Reopen only when higher-authority evidence invalidates a premise.

### DECIDE-BY-BEST-PRACTICE

Business meaning and authorized scope are clear; the remaining choice is ordinary engineering judgment.

Choose the smallest sufficient solution that is:

- reversible;
- testable;
- auditable;
- compatible with Repository Truth;
- minimally coupled;
- free of unnecessary dependencies.

Do not escalate ordinary technical judgment.

### ESCALATE-AUTHORITY

Human authority is required for one or more of:

- business/product semantics;
- organizational policy;
- security/compliance authority;
- scope expansion;
- governance meaning, canonical version identity, adoption, or supersession;
- production authorization;
- irreversible or legally/external binding effect;
- unresolved conflict between authoritative sources.

### BLOCK-EVIDENCE-GAP

Required Repository Truth is missing or contradictory and a choice would invent governed meaning.

Action: contain the affected boundary and BLOCK it.

## 4. Audience and decision authority

Audience and Decision Authority are distinct.

Typical authorities:

- Product/Business;
- Technical/Engineering;
- Security/Compliance;
- Repository/Governance Owner;
- Release/Production.

One person may hold multiple roles.

Route business semantics to Product/Business Authority. Resolve ordinary technical details by best practice unless Repository Truth reserves them. Do not ask Product Authority to choose implementation technology merely because the system is technical.

## 5. Stage model

```text
Stage 1 — Architecture
Stage 2 — Implementation Planning
Stage 3 — Implementation
Stage 4 — Validation / Audit
```

Stages are distinct for each governed outcome. Independent outcomes may occupy different stages when K02 proves independence.

Stage 2 begins only after architecture is accepted for that outcome and planning authority exists.
Stage 3 begins only after an approved implementation plan exists and implementation authority exists.

Architecture authorization does not imply planning authorization.
Planning authorization does not imply implementation authorization.
Implementation completion does not imply publication, release, or production authorization.

## 6. Architecture contract

Begin with:

```text
What must be true before we build this?
```

For product-facing work also establish:

```text
What must the user, operator, or Product Authority be able to observe and validate as we build it?
```

Before implementation establish, as applicable:

- current state and target state;
- requirements and authoritative source;
- invariants and locked decisions;
- Must Have scope and explicit out-of-scope;
- compatibility and dependencies;
- security;
- persistence and data ownership;
- integrations;
- migration/recovery/rollback;
- acceptance and evidence obligations.

Product-facing architecture maintains two views of the same decision:

1. **Business/Product Architecture View** — user/operator flow, business rules, money/state rules, failures, risks, scope, acceptance.
2. **Internal Engineering Architecture** — boundaries, contracts, security, persistence, deployment, integrations, observability, migration, recovery.

The Product Authority must not be required to understand implementation internals to approve product behavior.

## 7. ADR policy

Create or update an ADR for significant durable decisions affecting:

- architectural boundaries or contracts;
- security model;
- persistence technology or data ownership;
- deployment topology;
- externally visible lifecycle semantics;
- version/release policy;
- irreversible infrastructure;
- cross-service ownership;
- technology adoption with durable operational cost.

Do not create ADRs for trivial local implementation details.

Recommended lifecycle:

```text
Proposed → Accepted → Superseded/Deprecated
```

Acceptance requires the authority defined by Repository Truth/governance.

An ADR never authorizes implementation unless that boundary is explicitly authorized.

## 8. Autogoverned transactions

Human interaction should concentrate on authority decisions, not deterministic internal checks.

When a stage and its local mutation boundary are explicitly authorized, deterministic substeps inside that stage may execute consecutively without repeated approval, provided Repository Truth remains exact and all gates pass.

Example:

```text
authorized architecture scope
→ ADR draft
→ local audits
→ local acceptance when authorized
→ evidence
```

This does not cross into Planning or Implementation.

Before mutation revalidate exact repository preconditions. A failed deterministic gate is fail-closed and must preserve/restore the smallest safe prior state.

### Governance compression

Human interaction must concentrate on decisions that require human authority, judgment, Product Review, access, secrets, or another proven human-only boundary.

Once a governed transition and its mutation boundary are explicitly authorized, deterministic internal checks and substeps should normally execute as one governed operation when they can do so without crossing another authority boundary.

Do not convert deterministic internal gates into independent human operations merely for procedural visibility.

Prefer the largest coherent authorized transaction that preserves:

- exact Repository Truth;
- required authority boundaries;
- failure containment;
- rollback/recovery;
- traceability;
- evidence;
- security/compliance.

### Granularity / Process-Theater Guard

Do not atomize governed work merely because it can be decomposed.

Before creating an additional slice, gate, bundle, approval, command, handoff, user operation, or evidence artifact, establish at least one material reason for the separation:

- authority boundary;
- proven dependency;
- safer failure containment;
- independent rollback;
- materially distinct Product Evidence;
- meaningful concurrency;
- security/compliance obligation;
- materially improved auditability.

If no such reason exists, group compatible work into one governed execution unit.

Governance must minimize coordination cost while preserving required control.

## 9. Locked safety invariants

- Protect working systems.
- Do not silently expand scope.
- Do not invent business semantics.
- Do not reopen accepted decisions without higher-authority evidence.
- Do not infer authorization across boundaries.
- Repository Truth remains higher than every generated artifact.
