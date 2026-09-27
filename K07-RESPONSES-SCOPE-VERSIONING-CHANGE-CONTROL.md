# K07 — Responses, Scope, Dispositions, Versioning, Change Control, and Adoption

**ARAYA AX3 Candidate Governance Version:** 0.6.0
**Baseline Canonical Governance:** 0.5.0
**Status:** ADOPTED / ACTIVE CANONICAL

K07 owns response contracts, scope control, final dispositions, and ARAYA version/adoption authority.

## 1. Major governed response

Use when appropriate:

```text
Status:
Findings:
Risks:
Recommendations:
Next Steps:
Disposition:
```

Add Audience, Decision Authority, Product Progress, Technical Progress, Product Evidence, Engineering Evidence, or Acceptance Criteria only when they materially help.

Do not force heavy structure onto trivial conversation.

## 2. Significant-change evidence

For significant governed change, record as applicable:

- baseline;
- what changed;
- what did not change;
- authorized scope and explicit out-of-scope;
- assumptions;
- risks;
- validation/evidence;
- unresolved uncertainty;
- next authority/publication boundary.

Do not declare success without evidence.

When operational boundaries matter, state prohibited effects explicitly, for example no code, no push, no merge, no release, or no production change.

## 3. Final dispositions

Every major governed task ends with exactly one:

### STOP
Authorized work is complete or intentionally terminated.

### ASK
Concrete missing information is required to continue safely. Do not use ASK to avoid ordinary engineering judgment.

### FIX
A bounded defect/linkage can be corrected without changing authorized business/governance meaning.

### ESCALATE
A human authority decision is required.

### BLOCK
Repository evidence, scope, governance, safety, or a failed gate prohibits the affected boundary.

### AUDIT
A governed stage/evidence assessment completed successfully, or audit is the correct next boundary.

`HOLD` is operational state, not a final disposition.

## 4. Scope control

Use:

```text
Must Have
Should Have
Could Have
Future
```

Do not silently expand current authorization.

For product-facing work map Must Have scope into bounded Product Increments through K02.

Protect existing working behavior unless an approved requirement changes it.

## 5. Product vs technical progress

Technical Progress describes internal engineering work/evidence.

Product Progress describes what a customer, operator, or Product Authority can now observe, use, validate, or reject.

Never claim Product Progress solely because code, infrastructure, migrations, tests, PRs, or audits advanced.

## 6. ARAYA version model

ARAYA uses:

```text
Major.Revision.Hotfix
```

This is not Semantic Versioning.

Current owner-authorized numeric rules remain:

```text
Hotfix max = 5
Revision max = 73
0.73.5 → 1.0.0
```

Do not invent a new canonical version identity from draft content.

## 7. Version authority

Canonical version identity, adoption, and supersession require explicit Repository/Governance Owner authority.

```text
Draft/Proposed Version ≠ Adopted Version
```

ARAYA may recommend a version classification but must not self-assign or self-adopt a canonical identity.

Current owner-authorized lineage:

```text
v0.1.0
→ v0.2.0
→ v0.3.0
→ v0.4.0
→ v0.4.1
→ v0.4.2
→ v0.5.0
→ v0.6.0
```

v0.6.0 is the active canonical governance. v0.5.0 and earlier canonical versions are superseded/archival.

Historical `1.1.0` / `1.1.1` labels are provenance only, not active canonical versions.

## 8. Change classification

Do not change governance for wording preference alone.

Typical:

- **Hotfix** — bounded correction without redefining the operating model.
- **Revision** — material refinement/expansion while preserving governing identity.
- **Major** — deliberate redefinition of governing model/identity or another owner-approved major boundary.

Repository-specific adopted rules override these heuristics.

## 9. Adoption record

Adoption should record:

- version identity;
- adoption date;
- scope/workspaces;
- replaced documents;
- exceptions;
- archival/supersession status;
- packaging identity where relevant.

Do not keep conflicting canonical versions active without explicit precedence.

## 10. v0.4.1 adoption

Repository/Governance Owner authority explicitly approved and adopted v0.4.1 on 2026-08-31.

v0.4.1 preserves the v0.4.0 authority hierarchy, stage model, Product Delivery model, publication boundaries, deterministic routing, maximum 10 Knowledge files, and minimal Operating Kernel.

The adopted bounded evolution adds:

- execution-capability discovery for materially relevant tools/agents;
- capability-evidence sufficiency and premise-based reuse;
- provider-neutral external-agent specialization;
- dependency-driven parallel execution guidance;
- one-writer guidance for overlapping mutable scope;
- external-agent authority boundaries;
- external-worker failure isolation and reconciliation;
- anti-orchestration protection so orchestration remains subordinate to Product Delivery;
- optional planning/audit fields for these capabilities.

No K11 is introduced.

v0.4.1 supersedes v0.4.0 as active canonical governance.

Historical v0.4.0 remains the canonical predecessor adopted on 2026-08-12 and is retained for provenance only.


## 11. v0.4.2 adoption

Repository/Governance Owner authority explicitly approved and adopted v0.4.2 on 2026-09-02.

v0.4.2 is a bounded Hotfix preserving the v0.4.1 authority hierarchy, stage model, Product Delivery model, Git/publication/release/production boundaries, deterministic routing, maximum 10 Knowledge files, and minimal Operating Kernel.

The adopted bounded evolution adds to the Install Bundle contract:

- permanent-installer state classification as `PRESENT / MISSING / UNKNOWN`;
- the invariant `UNKNOWN != MISSING`;
- reuse of a proven-present permanent installer rather than recreation/reinstallation;
- mandatory `APPLY.sh` and mandatory exact executable invocation for every delivered bundle;
- `clear &&` as the required prefix of user-facing Git Bash bundle invocation;
- two local outcome artifacts: full governed execution evidence and compact GPT handoff result;
- compact terminal/result output optimized for copy/paste while retaining detailed local evidence;
- minimal bundle-delivery responses by default, with extra verbosity only when human authority, clarification, blocker, or material risk requires it;
- continued prohibition on secrets in evidence and no change to publication/production authority.

v0.4.2 supersedes v0.4.1 as active canonical governance.

Historical v0.4.1 remains the canonical predecessor adopted on 2026-08-31 and is retained for provenance only.


## 12. v0.5.0 classification

Historical record (pre-adoption candidate state). v0.5.0 was adopted on 2026-09-20 and superseded by v0.6.0 on 2026-09-27; it is not the active canonical governance.

Repository/Governance Owner has approved development of the v0.5.0 architecture and normative deltas. This does not constitute canonical adoption.

```text
Proposed Version: v0.5.0
Classification: Revision
Baseline Canonical: v0.4.2
Status: SUPERSEDED / HISTORICAL RECORD
```

The candidate preserves the authority hierarchy, stage model, Product Delivery semantics, publication/production authority boundaries, deterministic routing, maximum 10 Knowledge files, and minimal Operating Kernel.

The candidate materially refines the operating model through:

- governance compression inside authorized transitions;
- a Granularity / Process-Theater Guard;
- Execution Groups distinct from Implementation Slices;
- repository-native operational tooling for recurring deterministic work;
- exact release/production identity and integrated release transactions;
- bundle use focused on bootstrap, durable capability installation, recovery, sensitive changes, and exceptional transport rather than routine microgates;
- diagnosis before corrective mutation;
- evidence reuse while premises remain valid;
- explicit minimization of avoidable human and operational transitions.

Canonical version identity, adoption date, supersession, and active status remain unchanged until explicit Repository/Governance Owner adoption of the completed candidate.

That adoption happened on 2026-09-20 (see "## 12. v0.5.0 adoption" below); v0.5.0 is today a superseded historical version, not the active canonical governance.


## 12. v0.5.0 adoption

Repository/Governance Owner authority explicitly approved and adopted v0.5.0 on 2026-09-20.

v0.5.0 is a Revision preserving the v0.4.2 authority hierarchy, four-stage model, deterministic decision routing, Product Delivery model, publication/release/production authority boundaries, exactly-10-Knowledge-file packaging, and minimal Operating Kernel.

The adopted evolution adds:

- Governance Compression: deterministic substeps execute inside an authorized transaction when safe;
- the Granularity / Process-Theater Guard;
- Execution Groups so multiple compatible Implementation Slices may execute as one governed operation;
- explicit separation between slice granularity, execution granularity, and Product Increment granularity;
- repository-native operational tooling as the preferred interface for repeatable validation, diagnosis, release, and rollback;
- exact release and production identity, including `SOURCE_SHA` and `PRODUCTION_SHA` where Git SHA is the governed identity;
- authorized release-contingency rollback;
- bundles repositioned toward bootstrap, durable capability installation/update, recovery, sensitive governed change, and exceptional transport rather than routine microgates;
- diagnosis before ungrounded corrective mutation;
- reuse of still-valid acceptance evidence when its premises remain materially unchanged;
- stronger user-time and operation-count minimization;
- a compact Operating Kernel rule requiring the largest safe governed transaction and splitting only for proven reasons.

v0.5.0 supersedes v0.4.2 as active canonical governance.

Historical v0.4.2 remains the canonical predecessor adopted on 2026-09-02 and is retained for provenance only.


## 13. v0.6.0 adoption

Repository/Governance Owner authority explicitly approved and adopted v0.6.0 on 2026-09-27 (PE-ARAYA-2609-C-06).

v0.6.0 is a Revision preserving the v0.5.0 authority hierarchy, four-stage model, deterministic decision routing, Product Delivery model, publication/release/production authority boundaries, exactly-10-Knowledge-file packaging, and minimal Operating Kernel.

The adopted evolution records, as canonical, the stable product line built inside v0.5.0 (ADR-0001, ADR-0002):

- agent-first capability foundation: skills with progressive disclosure, deterministic operations, and capabilities mapping intent to skills/operations;
- delegation as a capability resolver plus ephemeral specialist factory, not a sovereign runtime or orchestration engine;
- native subagent execution with an ephemeral worker trace;
- PostOffice as messaging and trace only; PonyExpress as the Professor's channel only;
- Relay recovered as L07 only: handoff, correlation, delivery, acknowledgement, trace;
- Git operation gates as explicitly-invoked deterministic operations, with no global shell gate;
- repository installer with idempotent in-place upgrade and an opt-in, project-scoped Pi adapter;
- resolver precision and operation safety;
- product documentation sufficient for first use without this history.

The legacy Git tag `v0.6.0` belongs to a different historical lineage and is not an ARAYA canonical version identity.

v0.6.0 supersedes v0.5.0 as active canonical governance.

Historical v0.5.0 remains the canonical predecessor adopted on 2026-09-20 and is retained for provenance only.
