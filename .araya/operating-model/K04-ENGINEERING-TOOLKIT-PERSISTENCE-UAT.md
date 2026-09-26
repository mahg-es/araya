# K04 — Engineering Toolkit, Persistence, Runtime Reuse, and Automated UAT

**ARAYA AX3 Candidate Governance Version:** 0.5.0
**Baseline Canonical Governance:** 0.4.2
**Status:** ADOPTED / ACTIVE CANONICAL
K04 owns engineering-tool preferences and persistence selection. Repository Truth and accepted ADRs remain higher authority.

## 1. Engineering principles

Prefer:

- explicit boundaries;
- descriptive searchable naming;
- configuration over hardcoding;
- deterministic exit behavior;
- automation-friendly tools;
- small modules and isolated responsibilities;
- reversible change;
- documented environment differences;
- reuse of proven capabilities.

Avoid:

- magic values;
- hidden assumptions;
- giant source files;
- cross-layer leakage;
- accidental infrastructure coupling;
- unnecessary dependencies.

## 2. Separation of concerns

Maintain boundaries as applicable between:

- frontend;
- backend/API;
- domain/application services;
- persistence;
- infrastructure;
- governance/documentation;
- observability/security;
- Automated UAT/evidence.

One deployable binary does not require monolithic source.

## 3. Environment strategy

Support only environments justified by Repository Truth, typically:

- Local;
- Development;
- Pre-production/Staging;
- Production.

Make differences explicit through configuration.

## 4. Canonical toolkit preferences

When Repository Truth permits, ARAYA prefers:

- Docker and Docker Compose for reproducible governed runtime/isolation;
- Traefik where an ingress/reverse-proxy layer is actually required;
- Go for core binaries where appropriate and compatible with Repository Truth;
- `uv` for Python dependency/environment workflows where compatible;
- `ruff` for Python linting/static quality where compatible;
- Robot Framework for Automated UAT;
- Robot Framework Browser Library, backed by Playwright, for web-browser UAT automation.

These are preferences, not permission to replace an existing sound repository toolchain without evidence.

Early product evidence must not weaken security, transactional integrity, persistence correctness, migration safety, or recovery obligations.

## 5. Repository-native operational tooling

Repeated deterministic operational behavior should live in version-controlled repository tooling when compatible with Repository Truth.

Prefer stable repository-native commands or equivalents for recurring operations such as:

```text
validate
doctor
release
rollback
```

Names and paths are conventions, not mandatory structure. Repository Truth may define equivalent commands or mechanisms.

### validate

Runs repeatable non-authority repository checks such as build, tests, lint/static checks, contracts, repository-native gates, and cheap Repository Truth validation as applicable.

### doctor

Performs read-only diagnosis of applicable operational prerequisites and actual state. It must not mutate merely to discover whether mutation would succeed.

### release

Implements the governed release transaction defined by K03.

### rollback

Restores a known governed candidate when authorized and verifies the resulting system state.

## 6. Runtime and artifact reuse

New slice ≠ new environment.
New bundle ≠ dependency reinstall.

When the effective toolchain/dependency/environment fingerprint has not materially changed, reuse the proven runtime/artifact.

A rebuild/recreation requires evidence of at least one:

- relevant fingerprint change;
- compatibility requirement;
- invalidated/corrupt artifact;
- security requirement;
- explicit repository policy;
- other demonstrated technical necessity.

Do not use infrastructure reconstruction as a default response to new work.

## 7. Persistence selection

Choose the smallest technology satisfying actual data semantics and operational needs.

Evaluate:

- data model and invariants;
- integrity/transaction boundaries;
- query shape;
- write concurrency;
- availability/HA;
- backup/restore;
- deployment topology;
- security/compliance;
- growth and migration cost.

### SQLite

Prefer when lightweight/embedded/single-node persistence satisfies integrity, concurrency, and operations.

Do not stretch SQLite into requirements that need high multi-writer concurrency, server HA/failover, independent network clients, or sophisticated server operations.

### PostgreSQL

Prefer for sophisticated relational/server persistence requiring strong transactional integrity, relational constraints, complex queries, concurrency, mature schema/migration governance, or centralized durable workloads.

### MongoDB Community

Prefer when document aggregates are genuinely the natural persistence boundary.

Do not select MongoDB merely because schema may evolve or joins seem inconvenient.

### Polyglot persistence

Do not add multiple persistence technologies by default. Require an ADR proving distinct ownership/semantics, operational benefit, failure/transaction boundaries, backup/restore, migration, observability, and acceptable complexity.

Introducing/replacing primary persistence is normally ADR-level.

### Persistence operational contract

When persistence is introduced or materially changed, the governed architecture/plan must define as applicable:

- data ownership;
- schemas/collections/files and integrity boundaries;
- migration and compatibility;
- rollback/recovery;
- backup/restore;
- testing and acceptance;
- production acceptance boundary;
- secrets/configuration;
- monitoring/version management for server persistence.

For server databases under Docker/Compose, isolate governed resources when concurrent lanes require it and do not hardcode credentials or host-specific paths.

For SQLite, configure database paths explicitly and protect file ownership, backup, locking assumptions, and environment separation.

## 8. Automated UAT purpose

Robot Framework is the canonical preference for automating the mechanical execution of product acceptance flows and collecting reviewable evidence.

It is intended for:

- repeatable user/operator journeys;
- deterministic business/contract assertions;
- UI interaction through actual product interfaces;
- API checks where appropriate;
- optional read-only backend observation;
- Product Evidence collection.

It does not replace:

- unit tests;
- integration tests;
- static analysis;
- security tests;
- migration tests;
- repository audits;
- specialized performance tests.

## 9. Browser automation

For web UAT prefer:

```text
Robot Framework
→ Browser Library
→ Playwright
```

Keep product/domain keywords above DOM-specific implementation details.

Prefer semantic/stable selectors and accessible roles/labels over fragile layout/XPath coupling.

## 10. Deterministic assertion classes

UAT assertions must classify expected behavior as appropriate:

### STRICT
Exact governed contract/business invariant, for example amount, currency, state, total, permission, critical identifier, or transition.

### SEMANTIC
Meaning/behavior must match without depending on incidental presentation.

### VOLATILE
Generated/non-contractual values such as timestamps, runtime IDs, duration, or non-contractual ordering. Do not compare literally unless the requirement makes them contractual.

Determinism means exactness where the contract requires exactness, not brittle comparison of every rendered detail.

## 11. Backend evidence

For UAT:

```text
act through product interfaces
observe backend read-only when additional evidence is required
```

Prefer a governed evidence/API boundary when available.

Do not mutate PostgreSQL/SQLite/MongoDB directly to fabricate a successful user journey unless an explicitly governed test-fixture boundary authorizes that setup and the production behavior remains independently verified.

## 12. Automated UAT result

Use explicit states:

```text
AUTOMATED_UAT_PASS
AUTOMATED_UAT_FAIL
AUTOMATED_UAT_NOT_RUN
AUTOMATED_UAT_NOT_APPLICABLE
```

`AUTOMATED_UAT_PASS` proves only the configured automated acceptance assertions for the identified candidate/environment/dataset.

It does not equal Product Acceptance, merge authorization, release authorization, or production authorization.

## 13. UAT evidence

When applicable, evidence identifies:

- Product Increment;
- acceptance criteria covered;
- UAT flow identity;
- exact candidate SHA/artifact;
- environment;
- deterministic dataset/fixture identity;
- Robot result;
- key observed values;
- screenshots at acceptance checkpoints;
- structured result/report artifacts;
- backend read-only evidence when used.

Product Authority reviews Product Evidence and separately records ACCEPTED/REJECTED according to repository/product governance.


## 14. Product Evidence timing and acceptance-evidence reuse

Expose representative Product Evidence before the next costly or irreversible boundary whenever the product and Repository Truth make that safe and meaningful.

This does not create a universal requirement for human UAT before merge. Product Authority review timing follows Repository Truth and applicable product governance.

After a bounded correction, reuse still-valid acceptance evidence when its premises have not materially changed.

Re-run only affected acceptance gates unless governance or changed premises require broader revalidation.
