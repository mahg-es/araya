# K02 — Product Delivery, Implementation Slices, DAG, Failure Containment, and Traceability

**ARAYA AX3 Candidate Governance Version:** 0.5.0
**Baseline Canonical Governance:** 0.4.2
**Status:** ADOPTED / ACTIVE CANONICAL
K02 owns Product Increment semantics, product-delivery control, dependency scheduling, failure containment, and requirement traceability.

## 1. Product Increment, Implementation Slice, and Execution Group

```text
Implementation Slice
= traceable unit of technical responsibility and change

Execution Group
= one or more compatible Implementation Slices executed, validated,
  evidenced, and contained as one governed operation

Product Increment
= human-observable, evaluable outcome that delivers product/business value
  or materially reduces product/operational uncertainty
```

These abstractions may have different granularities.

An Implementation Slice does not imply a separate human operation, bundle, commit, execution cycle, or approval.

One Product Increment may require one or more Implementation Slices and one or more Execution Groups. Never report technical slices or Execution Groups as product progress by themselves.

## 2. Product-delivery objective

For product-facing work seek the smallest safe end-to-end Product Increment permitted by proven dependencies.

Preferred:

```text
real/representative data
→ real user/operator interaction
→ real business behavior
→ visible result
→ review
```

Avoid unbounded horizontal campaigns such as completing all infrastructure, persistence, backend, and frontend before any human-observable evidence when a safe vertical route exists.

Horizontal work is valid only when a proven dependency, security obligation, migration constraint, infrastructure prerequisite, or governance requirement requires precedence.

For each horizontal slice record:

- proven dependency;
- Product Increment enabled;
- bounded scope;
- acceptance evidence.

## 3. No process credit

The following are Technical Progress unless they produce a human-observable capability:

- ADRs;
- plans;
- tests;
- commits;
- PRs;
- Docker images;
- migrations;
- CI;
- audits;
- evidence bundles.

Technical Progress never compensates for missing Product Progress.

## 4. Product Delivery State

For sustained product-facing work maintain a compact derived artifact named **Product Delivery State**.

It may contain:

- product vision;
- users/operators;
- critical workflows;
- datasets, entities, platforms, and business dimensions;
- Must Have capabilities;
- implemented and missing capabilities;
- Product Increments and acceptance state;
- current Product Evidence;
- Repository capability map;
- known blockers and failure guards;
- next human-observable increment.

The Product Delivery State is not authority. It must reference authoritative sources and Repository Truth. It must not silently replace them.

Before each material Product Increment, scan the whole known Product Delivery State, not only the latest user message.

## 5. Repository capability map

Discover important reusable repository capabilities early and maintain the map after material change.

Record as applicable:

```text
what exists
where it exists
what is proven working
what can be reused
what is missing
```

Include relevant loaders, ETL, persistence, services, UI, analytics, tests, automation, deployment, and evidence mechanisms.

Do not rediscover known capabilities piecemeal or invent absent mechanisms.

## 6. Visible-value stop-loss

After a meaningful product-facing work cycle:

```text
new Product Evidence?
```

If YES: continue according to the approved plan/DAG.

If NO: classify exactly one:

1. **PROVEN_DEPENDENCY** — record why the technical work had to precede Product Evidence and keep it bounded.
2. **METHOD_FAILURE** — the current method is not producing justified product progress; stop repeating it and choose a smaller/more direct vertical route.

Repeated technical-only cycles without a proven dependency require strategy change, not more ceremony.

Do not expand into a new large optional technical foundation while available Product Evidence has not yet been exposed to the intended Product Authority, unless a proven dependency requires that foundation first.

No fixed wall-clock threshold is universal. A repository/project may define one explicitly.

## 7. Delivery Recovery Mode

When an explicit deadline/budget exists and Product Increments are materially behind the authorized Must Have delivery plan, activate a bounded recovery assessment.

Recovery Mode may apply:

- scope freeze to Must Have;
- no speculative refactors;
- no optional infrastructure;
- no new foundations without a proven dependency;
- vertical increments only where feasible;
- reuse proven runtime/tooling;
- Product Evidence every meaningful cycle;
- minimize user operations.

Recovery Mode never bypasses security, scope authority, persistence correctness, publication gates, or production authorization.

## 8. Execution Groups

An Execution Group may contain multiple Implementation Slices when:

- required authority is compatible;
- dependency ordering permits combined execution;
- mutable scope is known;
- failure containment remains acceptable;
- rollback/recovery remains coherent;
- evidence remains traceable to each affected requirement/slice.

Prefer grouping unless separation materially improves:

- authority control;
- dependency management;
- failure containment;
- rollback;
- Product Evidence;
- concurrency;
- security/compliance;
- auditability.

Execution Group boundaries are operational boundaries. Implementation Slice boundaries are traceability and dependency boundaries. Do not force both to be identical.

## 9. Implementation Slice contract

Each slice defines:

- authoritative requirement;
- accepted ADR/plan dependencies;
- objective;
- exact scope and out-of-scope;
- mutable paths/resources;
- inputs and outputs;
- acceptance;
- rollback/containment;
- evidence;
- publication boundary.

Preferred rhythm:

```text
slice → implement → validate → commit when authorized → audit
```

A slice may execute independently or as part of an Execution Group. The plan must not require independent execution merely because the slice is independently traceable.

## 10. Dependency DAG

Repository dependencies define serialization.

The DAG determines required ordering and isolation; it does not require one execution operation per node. Adjacent or related nodes may execute within one Execution Group when internal ordering remains deterministic and containment remains safe.

Serialize on proven edges such as:

- output → input;
- same mutable physical Git checkout;
- overlapping write scope;
- migration/schema dependency;
- shared mutable external state;
- governance dependency;
- requirement dependency.

Do not infer dependency from conversation order, same repository, same developer, or one lane starting earlier.

Parallel lanes must prove independent mutable roots, no overlapping writes, no hidden output/input dependency, isolated mutable external state, exact baselines, independent rollback, and independent evidence.

Never concurrently mutate the same physical Git checkout. Use isolated worktrees/containers where needed.

External agent/tool lanes obey these same DAG rules. Agent identity, model identity, or tool identity does not establish independence.

Concurrent read-only lanes may reuse the same proven immutable baseline only when mutation is prevented or sufficiently proven absent for the governed operation.

Every concurrent mutable lane requires an independent mutable root and isolated mutable external state.

Recompute the DAG after material commit, merge, rollback, ADR acceptance, requirement/schema change, publication, failure, or recovery.

## 11. Failure containment

Classify implementation-lane failures exactly:

### LOCAL_FAILURE
Block only the affected lane. Continue independent authorized lanes.

### DEPENDENCY_FAILURE
Block the failed lane and dependent descendants. Continue unrelated lanes.

### GLOBAL_GOVERNANCE_FAILURE
Stop every lane whose premises are invalidated by a global authority/repository/safety change.

Do not promote a local defect into a global stop.

## 12. Requirement traceability

Preferred chain:

```text
Authoritative Requirement
↓
Product Scope
↓
ADR when required
↓
Implementation Plan
↓
Product Increment when applicable
↓
Implementation Slice(s)
↓
Acceptance Criterion
↓
Automated UAT when applicable
↓
Engineering Evidence + Product Evidence
↓
Product Acceptance when applicable
↓
Published / Integrated Result
```

Forward and backward traceability must remain possible.

If no repository requirement ID exists:

```text
Repository Requirement ID: NOT PRESENT
```

Preserve the actual authority source. Never fabricate an ID or backlog mechanism.

## 13. Traceability gap vs breach

### REQUIREMENT_TRACEABILITY_GAP

Use when authoritative intent is demonstrable, scope/meaning are clear, no authority conflicts, and linkage can be reconstructed deterministically.

Action:

```text
FIX linkage
```

Do not rewrite working implementation solely for missing metadata.

### REQUIREMENT_TRACEABILITY_BREACH

Use when an outcome crosses or approaches an authority/publication boundary and:

- authoritative intent cannot be demonstrated;
- implementation contradicts the requirement;
- lower authority substituted for higher authority;
- scope expanded without authorization;
- acceptance evidence is disconnected;
- requirement was silently reinterpreted;
- traceability was invented or materially stale.

Action:

```text
contain exact affected boundary
→ BLOCK affected boundary
→ recover authority
→ reconcile
→ verify
```

Recovery states:

```text
DETECTED → CLASSIFIED → CONTAINED → RECONCILED → VERIFIED → CLOSED
```

Independent work continues unless a dependency is proven.
