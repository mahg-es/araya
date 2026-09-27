# K10 — Provenance, Adoption, Packaging, and v0.6.0 Change Map

**ARAYA AX3 Candidate Governance Version:** 0.6.0
**Baseline Canonical Governance:** 0.5.0
**Status:** ADOPTED / ACTIVE CANONICAL

K10 records provenance and packaging. It cannot override K01 authority or K07 version/adoption authority.

## 1. Current canonical lineage

Owner-authorized lineage:

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

v0.3.0 was adopted on 2026-08-11.

v0.4.0 was explicitly assigned and adopted by owner authority on 2026-08-12.

v0.4.1 was explicitly approved and adopted by owner authority on 2026-08-31.

v0.4.2 was explicitly approved and adopted by owner authority on 2026-09-02 and is the canonical predecessor to v0.5.0.

v0.5.0 was explicitly approved and adopted by owner authority on 2026-09-20 and is the canonical predecessor to v0.6.0.

v0.6.0 was explicitly approved and adopted by owner authority on 2026-09-27 (PE-ARAYA-2609-C-06) and is the active canonical governance.

v0.5.0 and earlier canonical versions are superseded/archival. Historical `1.1.0` / `1.1.1` labels remain provenance only and are not canonical ARAYA versions.

## 2. v0.4.0 owner-authorized evolution

Owner authority approved and adopted this revision with:

```text
Operating Kernel
+
maximum 10 Knowledge files
+
Robot Framework Automated UAT
+
Product Delivery corrections
+
minimal duplication
+
deterministic routing
```

Packaging/design constraints:

- the Instructions kernel is an operating system, not a manual;
- kernel hard maximum = 8,000 characters;
- the maximum is not a target;
- kernel must be minimal, deterministic, and unambiguous;
- Knowledge uploads must not exceed 10 files;
- specialized rules belong in Knowledge, not the always-on kernel.

The validated kernel contains exactly 2284 characters.

## 3. Packaging contract

Upload exactly these 10 Knowledge files:

1. `K01-FOUNDATION-AUTHORITY-STAGES-ADR-AUTOGOVERNANCE.md`
2. `K02-PRODUCT-DELIVERY-SLICES-DAG-TRACEABILITY.md`
3. `K03-ASYNC-GIT-PUBLICATION-RELEASE.md`
4. `K04-ENGINEERING-TOOLKIT-PERSISTENCE-UAT.md`
5. `K05-INSTALL-BUNDLE-PROCEDURE-PREFLIGHT.md`
6. `K06-AI-ORCHESTRATION-PRODUCT-MODEL-USER-TIME.md`
7. `K07-RESPONSES-SCOPE-VERSIONING-CHANGE-CONTROL.md`
8. `K08-TEMPLATES-ADR-IMPLEMENTATION-PLAN.md`
9. `K09-TEMPLATES-AUDIT-UAT-TRACEABILITY.md`
10. `K10-PROVENANCE-ADOPTION-PACKAGING.md`

`GPT-CONFIGURATION.md` is **not** a Knowledge upload. Copy its Name, Description, and Instructions into the GPT configuration fields.

Do not create an 11th Knowledge file. Integrate new specialized policy into the owning K-file.

## 4. Kernel architecture

The v0.4.2 baseline prompt architecture, preserved by the v0.5.0, is:

```text
L0 — Operating Kernel
     minimal, deterministic, always-on

L1 — K01–K10 Knowledge
     deep canonical policy

L2 — procedures inside owning K-files
     Git, bundles, UAT, recovery, etc.

L3 — templates inside K08/K09
```

Rule admission:

```text
Must this rule influence almost every governed decision?

YES → kernel candidate
NO  → Knowledge
```

Compression test:

```text
Can the rule be shorter without losing required behavior?

YES → compress
NO  → preserve
```

## 5. v0.4.0 change map

### K01
- keeps authority hierarchy/stages/ADR/autogovernance;
- removes specialized operational detail from the kernel path;
- preserves deterministic decision routing.

### K02
- owns Product Delivery control;
- Product Delivery State and repository capability map;
- visible-value stop-loss;
- Recovery Mode;
- Product Increment vs Implementation Slice;
- DAG/failure containment;
- requirement traceability.

### K03
- preserves async GREEN/TRANSIENT/FAILED and HOLD;
- Git/publication/merge/release/production boundaries.

### K04
- engineering toolkit preferences;
- persistence;
- runtime reuse/fingerprint rule;
- Robot Framework Automated UAT;
- Browser Library/Playwright for web UAT.

### K05
- preserves Install Bundle contract;
- adds producer-side delivery-time preflight;
- adds UAT evidence packaging without changing UAT semantics.

### K06
- whole-product reasoning;
- artifact-first governed memory;
- user-time protection;
- failure recurrence guard;
- agent/tool orchestration.

### K07
- response/disposition/scope/version/adoption;
- v0.4.0 is owner-assigned and adopted as active canonical governance.

### K08
- ADR and implementation-plan templates;
- adds Product Delivery State, Automated UAT, runtime reuse, user operations, stop-loss/recovery fields.

### K09
- repository/product/UAT audit;
- traceability template;
- failure-guard template.

### K10
- provenance;
- packaging constraints;
- change map;
- adoption state.

## 6. v0.4.1 adopted change map

Owner authority approved and adopted v0.4.1 on 2026-08-31. It preserves the v0.4.0 authority model, stage model, Product Delivery model, publication boundaries, and exactly-10-Knowledge-file packaging.

Adopted bounded changes:

### K02
- clarifies that external agent/tool lanes use the existing dependency DAG;
- clarifies shared immutable read-only baselines versus isolated mutable roots.

### K06
- adds bounded execution-capability discovery;
- adds capability-evidence sufficiency and reuse;
- adds provider-neutral external-agent roles;
- adds parallel-execution and one-writer guidance;
- adds external-agent authority boundaries;
- adds failure isolation, reconciliation, and an anti-orchestration guard.

### K08
- adds optional execution-capability/orchestration planning fields.

### K09
- adds optional execution-capability/orchestration audit gates.

### K10
- records the candidate change map while preserving the packaging contract.

Unchanged functionally from v0.4.0 except canonical version/adoption identity:

```text
K01
K03
K04
K05
K07
GPT-CONFIGURATION Instructions
```

v0.4.1 does not create K11.

Canonical adoption/version identity remains governed by K07.

## 7. Source lineage

v0.4.1 preserves the v0.4.0 source lineage and adds the owner-approved orchestration/capability-discovery refinement. The inherited lineage includes:

- `Manuel Prompt Engineering.md`;
- `AI Engineer v2 0.md`;
- `mantra_desarrollador.txt`;
- `MANIFIESTO-INSTALL-BUNDLE-PROCEDURE-ARAYA-1.0.0.md`;
- `PROCESS-IMPROVEMENT-AUTOGOVERNED-ADR-AND-IMPLEMENTATION-PLAN-ARAYA-1.0.0.md`;
- `ADDENDUM-ASYNC-CHECK-SETTLEMENT-HOLD-POLICY-ARAYA-1.0.1.md`;
- `ADDENDUM — DEPENDENCY-DRIVEN PARALLEL EXECUTION AND REQUIREMENT TRACEABILITY RECOVERY.md`;
- adopted v0.3.0 K01–K10;
- owner-provided Product Delivery incident/root-cause analysis;
- owner-approved Automated UAT decision.

Legacy/source artifacts remain provenance. They are not co-equal active governance when a successor is explicitly adopted.


## 8. Preserved source hashes

Where previously recorded in the adopted provenance map:

| Source | SHA-256 | Bytes |
|---|---|---:|
| `Manuel Prompt Engineering.md` | `c34e75e3415fdac3541d62cc09fbb25d1a1f686d03946393aef3dc64867b241c` | 2858 |
| `AI Engineer v2 0.md` | `9c9141d03ad514539636d92c069aa8fc8a89daee9b20d938be9f823126a817ef` | 4916 |
| `mantra_desarrollador.txt` | `f769f6fed891bb8e4ec06557534e4568945810e5fe907b934172c4a16666d678` | 5929 |
| `MANIFIESTO-INSTALL-BUNDLE-PROCEDURE-ARAYA-1.0.0.md` | `49929860afc6c2e26c987cfc2de4818e66028257ab738f5d9034816f728246e4` | 8273 |
| `PROCESS-IMPROVEMENT-AUTOGOVERNED-ADR-AND-IMPLEMENTATION-PLAN-ARAYA-1.0.0.md` | `8676bd50ee17b5137148b32972b1202309a5a30e66cb05c46c2acd93f955f674` | 17121 |
| `ADDENDUM-ASYNC-CHECK-SETTLEMENT-HOLD-POLICY-ARAYA-1.0.1.md` | `b188035b7c676ab4e33dd80a51211092438d82c9fd0b295588860ec15a0e296a` | 11475 |
| `ADDENDUM — DEPENDENCY-DRIVEN PARALLEL EXECUTION AND REQUIREMENT TRACEABILITY RECOVERY.md` | `a104a80c0f8651cccb14ebed8cfea558df8864a6051c6caada48991e439058de` | 26083 |

These hashes are provenance evidence, not competing active governance.

## 9. Validation and adoption record

Static candidate validation completed before adoption:

```text
KNOWLEDGE_FILES = 10
K11_PRESENT = NO
KERNEL_FUNCTIONAL_CHANGE = NO
CAPABILITY_DISCOVERY_BOUNDED = PASS
DAG_OWNER = K02
ORCHESTRATION_OWNER = K06
PROVIDER_SPECIFIC_CANONICAL_ROLES = NO
FIXED_WORKER_COUNTS = NO
ARBITRARY_CAPABILITY_TTL = NO
SHARED_MUTABLE_CHECKOUT_CONCURRENCY = FORBIDDEN
ANTI_ORCHESTRATION_GUARD = present
AUTHORITY_STAGE_CONTRADICTIONS = none found
```

K01, K03, K04, and K05 retain their v0.4.0 functional policy unchanged. K07 changes only as required for v0.4.1 canonical adoption/version authority. K02, K06, K08, K09, and K10 contain the adopted bounded evolution.

The Operating Kernel / Instructions remain functionally unchanged from v0.4.0.

Repository/Governance Owner authority explicitly approved the candidate after Validation / Audit and adopted v0.4.1 on 2026-08-31.

v0.4.1 supersedes v0.4.0 as active canonical governance. Prior canonical versions remain archival/provenance only.


## 10. v0.4.2 adopted change map

Repository/Governance Owner authority approved and adopted v0.4.2 on 2026-09-02 as a bounded Hotfix.

Preserved unchanged in governing meaning:

```text
authority hierarchy
stage model
Product Delivery model
dependency DAG
Automated UAT semantics
Git/publication/merge/release/production boundaries
10-Knowledge-file packaging
Operating Kernel behavior
```

Adopted bounded changes:

### K05
- classifies permanent installer state as `PRESENT / MISSING / UNKNOWN`;
- establishes `UNKNOWN != MISSING`;
- reuses a proven-present installer and does not recreate/reinstall it merely because a GPT/session cannot observe local state;
- makes `APPLY.sh` and the exact user executable invocation mandatory delivery gates;
- requires user-facing Git Bash bundle commands to begin with `clear &&`;
- preserves `<BUNDLE-ID>.txt` as full governed local execution evidence;
- adds `<BUNDLE-ID>.result.txt` as the compact GPT handoff result;
- aligns material terminal output with the compact result artifact;
- prefers compact `KEY=VALUE`, `PASS`, `FAIL`, `BLOCK`, `NEXT`, hashes, identities, and evidence paths;
- requires minimal normal bundle-delivery communication, with additional verbosity only when a human authority decision, clarification, blocker, or material risk requires it;
- preserves secret-handling and all publication/production authority boundaries.

### K07
- records v0.4.2 owner-authorized canonical adoption and supersession of v0.4.1.

### K10
- records v0.4.2 provenance, packaging identity, change map, validation, and adoption.

No functional change except canonical version metadata:

```text
K01
K02
K03
K04
K06
K08
K09
```

No K11 is introduced.

## 11. v0.4.2 validation and adoption record

Validation completed before adoption:

```text
KNOWLEDGE_FILES = 10
K11_PRESENT = NO
CHANGE_CLASSIFICATION = HOTFIX
K05_DELTA = PASS
UNKNOWN_INSTALLER_NOT_MISSING = PASS
INSTALLER_REUSE = PASS
APPLY_SH_MANDATORY = PASS
EXECUTION_COMMAND_MANDATORY = PASS
CLEAR_AND_PREFIX = PASS
FULL_EVIDENCE_FILE = PASS
GPT_RESULT_FILE = PASS
TERMINAL_RESULT_MIRROR = PASS
MINIMAL_BUNDLE_RESPONSE = PASS
SECRETS_GUARD = PASS
PUBLICATION_BOUNDARIES_CHANGED = NO
AUTHORITY_STAGE_CONTRADICTIONS = none found
```

Repository/Governance Owner authority explicitly approved the candidate after Validation / Audit and adopted v0.4.2 on 2026-09-02.

v0.4.2 supersedes v0.4.1 as active canonical governance. Prior canonical versions remain archival/provenance only.


## 12. v0.5.0 provenance and change map

Status:

```text
ADOPTED / ACTIVE CANONICAL
Baseline Canonical: v0.4.2
Proposed Classification: Revision
```

Candidate source lineage adds:

- `ARAYA-BUENAS-PRACTICAS-NUEVO-PROYECTO.docx`;
- Repository/Governance Owner approval to develop the v0.5.0;
- owner-approved Governance Compression principle;
- owner-approved Granularity / Process-Theater Guard;
- owner-approved Execution Group model.

The candidate preserves:

```text
Repository Truth authority
stage model
decision routing
Product Increment semantics
Git/publication/merge/release/production authority separation
Automated UAT vs Product Acceptance distinction
failure containment
10-Knowledge-file packaging
minimal Operating Kernel architecture
```

Candidate bounded changes:

### K01
- adds Governance Compression inside already-authorized transitions;
- adds the Granularity / Process-Theater Guard;
- prefers the largest coherent safe authorized transaction without crossing authority boundaries.

### K02
- distinguishes Implementation Slice, Execution Group, and Product Increment;
- makes Execution Groups the operational grouping abstraction;
- clarifies that dependency DAG nodes do not imply separate human execution cycles.

### K03
- adds exact release candidate identity;
- adds observable production identity independent of current `main`;
- defines an integrated release transaction;
- defines bounded release-contingency rollback authority.

### K04
- adds repository-native operational tooling responsibilities for `validate`, `doctor`, `release`, and `rollback` or repository equivalents;
- adds Product Evidence timing guidance;
- allows still-valid acceptance evidence to be reused after bounded corrections.

### K05
- preserves the Bundle Contract while changing its default operational role;
- prefers bundles for bootstrap, durable capability installation/upgrade, recovery, especially sensitive changes, and exceptional transport;
- discourages bundles for routine microgates and ordinary repeated operations;
- permits multiple compatible slices in one coherent governed bundle transaction;
- minimizes manual user file choreography.

### K06
- minimizes unnecessary operational transitions as well as user operations;
- adds diagnosis before corrective mutation;
- extends anti-orchestration into a broader process-efficiency guard.

### K07
- records v0.5.0 as a proposed Revision candidate only;
- does not alter active canonical identity or supersession state.

### K08
- adds compact Execution Granularity planning fields;
- strengthens justification for human operations;
- adds conditional Release Transaction planning fields.

### K09
- adds compact audit gates for execution granularity, Execution Group traceability, avoidable human operations, diagnosis-before-retry, and release identity.

### K10
- records candidate provenance and bounded change map.

No K11 is introduced.

### Operating Kernel candidate delta

The source `GPT-CONFIGURATION.md` was not present in the available canonical artifact set used to generate this candidate. Therefore no candidate configuration file is fabricated.

The approved conceptual delta to apply when the authoritative source is available is:

```text
Minimize unnecessary operational granularity.
Group compatible work into the largest safe governed transaction;
split only for proven authority, dependency, risk, rollback,
evidence, containment, or meaningful concurrency needs.
```

This candidate delta is not adopted into L0 until applied to and validated against the authoritative configuration source.

## 13. v0.5.0 validation state

Required before canonical adoption:

- cross-file contradiction audit;
- packaging count = exactly 10 Knowledge files;
- no K11;
- authority/stage leakage audit;
- bundle-safety regression audit;
- release/production authority audit;
- template-growth/process-theater audit;
- kernel-source reconciliation when `GPT-CONFIGURATION.md` Repository Truth is available;
- explicit Repository/Governance Owner adoption.

Until those gates pass and owner adoption is explicit:

```text
v0.4.2 = ACTIVE CANONICAL
v0.5.0 = CANDIDATE ONLY
```


## 9. v0.5.0 adopted change map

Owner authority approved and adopted v0.5.0 on 2026-09-20. It preserves the v0.4.2 authority hierarchy, stage model, Product Delivery model, publication boundaries, deterministic routing, maximum 10 Knowledge files, and minimal Operating Kernel.

Adopted bounded evolution:

### K01
- adds Governance Compression;
- adds the Granularity / Process-Theater Guard;
- prefers the largest coherent safe authorized transaction;
- preserves stage and authority separation.

### K02
- introduces Execution Group as an operational grouping of one or more Implementation Slices;
- keeps Implementation Slice as a traceability/dependency unit;
- keeps Product Increment as the human-observable value unit;
- allows DAG nodes to execute together where ordering and containment remain safe.

### K03
- adds exact release candidate identity;
- adds production identity independent of current `main`;
- defines the integrated release transaction;
- adds authorization-bounded release-contingency rollback.

### K04
- adds repository-native operational tooling for routine validation, diagnosis, release, and rollback;
- preserves existing toolkit/runtime-reuse rules;
- allows reuse of still-valid acceptance evidence when premises remain unchanged.

### K05
- preserves the Bundle Contract and permanent-installer rules;
- repositions bundles toward bootstrap, durable capability installation/update, recovery, sensitive governed change, and exceptional transport;
- discourages routine bundles for microgates;
- allows one bundle to contain multiple compatible slices forming one governed transaction.

### K06
- extends user-time protection to operational-transition minimization;
- adds diagnosis-before-corrective-mutation;
- adds an explicit process-efficiency guard.

### K07
- adopts v0.5.0 as active canonical governance;
- records v0.4.2 as superseded canonical predecessor.

### K08
- adds compact Execution Granularity planning fields;
- adds release-transaction planning fields only when applicable;
- requires justification for unavoidable user operations.

### K09
- adds compact audit gates for execution granularity, avoidable human operations, release identity, and diagnosis-before-retry.

### K10
- records v0.5.0 provenance, adoption, packaging identity, and change map.

### Operating Kernel
- adds one compact cross-cutting rule:
  minimize unnecessary operational granularity; group compatible work into the largest safe governed transaction and split only for proven authority, dependency, risk, rollback, evidence, containment, or meaningful concurrency needs.

v0.5.0 introduces no K11.


## 14. v0.6.0 adoption and change map

Status:

```text
ADOPTED / ACTIVE CANONICAL
Baseline Canonical: v0.5.0
Classification: Revision
Adoption date: 2026-09-27
```

Owner authority approved and adopted v0.6.0 on 2026-09-27 (PE-ARAYA-2609-C-06). It preserves the v0.5.0 authority hierarchy, four-stage model, Product Delivery model, publication/release/production boundaries, deterministic routing, exactly 10 Knowledge files, and minimal Operating Kernel.

Adopted evolution, recorded from the artifacts already present in Repository Truth (ADR-0001, ADR-0002):

### K01
- rule content unchanged: authority hierarchy, Repository Truth precedence, stage model, decision routing, and autogovernance are preserved.

### K02
- rule content unchanged: Implementation Slice, Execution Group, and Product Increment semantics are preserved and are exercised by the capability foundation's composition.

### K03
- rule content unchanged: Git publication, merge, release, and production authority boundaries are preserved; the Git operation gates (`git-feature-start`, `git-merge-gate`, `git-feature-pr-gate`, `git-repository-sanity`) are invoked explicitly as deterministic operations rather than through a global shell gate.

### K04
- the repository-native operational tooling responsibility is realized by the agent-first CLI (`cli/araya`) and the operations catalog; no operational-authority ownership is added.

### K05
- bundle contract unchanged: the reproducible ChatGPT bundle packages the same canonical core and the installer preserves permanent-installer classification and `UNKNOWN != MISSING`.

### K06
- anti-orchestration and user-time rules unchanged: no global Pi takeover; ARAYA remains host-scoped and project-scoped, and Daneel remains outside ARAYA.

### K07
- adopts v0.6.0 as active canonical governance;
- records v0.5.0 as superseded canonical predecessor.

### K08 / K09
- rule content unchanged; no new mandatory planning or audit gate is introduced by this adoption.

### K10
- records v0.6.0 provenance, adoption, packaging identity, and change map.

v0.6.0 introduces no K11.
