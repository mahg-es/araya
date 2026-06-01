# ADR-006: Version Compatibility Model

**Status:** Accepted (corrected — supersedes SemVer draft)
**Date:** 2026-06-01
**Decider:** R. Daneel Olivaw (Architecture)
**Authority:** The Data Professor
**Supersedes:** ADR-006 (SemVer draft, rejected 2026-06-01)
**Related:** ADR-002 (Core Binary Contract & IPC), [release-versioning standard](../standards/release-versioning.md)

## Context

The previous ADR-006 draft governed compatibility between Public ARAYA and the
Private ARAYA Core using **Semantic Versioning (SemVer)** semantics:

- MAJOR = breaking change
- MINOR = backward-compatible feature
- PATCH = backward-compatible fix

This is **incorrect for ARAYA**. ARAYA does not use SemVer. It uses the MAHG
canonical versioning model (Manuel's model):

```
MAJOR.REVISION.HOTFIX
```

| Component | Meaning | Bound |
|-----------|---------|-------|
| **MAJOR** | Generation of the product — intentionally rare, *earned* | — |
| **REVISION** | Substantial functional growth (capabilities, modules, architecture) | ≤ 73 |
| **HOTFIX** | Defect corrections, small enhancements, docs | ≤ 5 |

Promotion rule: a MAJOR advances **only** when `REVISION = 73` and `HOTFIX = 5`.

```
0.73.5 → 1.0.0
1.73.5 → 2.0.0
```

Examples: `0.6.4`, `0.12.3`, `0.73.5`, `1.0.0`.

**Why SemVer is wrong here — the load-bearing distinction:**

1. REVISION **is not** SemVer MINOR. A REVISION bump may carry *substantial
   architecture change*, which can be breaking. SemVer assumes MINOR is always
   backward-compatible; ARAYA makes no such guarantee.
2. HOTFIX **is not** SemVer PATCH. HOTFIX is capped at 5 and rolls into REVISION;
   PATCH is unbounded.
3. MAJOR is *earned and rare* (only at 0.73.5). Under SemVer, consumers treat
   "same MAJOR = compatible." In ARAYA, MAJOR can stay `0` across dozens of
   breaking REVISION changes. **Deriving runtime compatibility from the product
   MAJOR would be unsafe.**

Therefore the product version **cannot** be used as the IPC compatibility
boundary the way SemVer MAJOR is used.

## Decision

**1. The product release version follows the MAHG canonical model exactly.**
`MAJOR.REVISION.HOTFIX`, bounds `REVISION ≤ 73`, `HOTFIX ≤ 5`, promotion only at
`x.73.5 → (x+1).0.0`. The product version expresses *maturity and milestone*,
not wire compatibility.

**2. IPC compatibility is governed by a separate, independent IPC Contract
Version — NOT by the product version.**

The Public/Private boundary (ADR-003) is crossed exclusively through the Core
binary's IPC contract (ADR-002). That contract carries its own version:

```
ipc_contract_version: <monotonic integer>   e.g. 1, 2, 3 …
```

- It is a **single monotonic integer**, incremented only on a
  **breaking** change to the IPC envelope, subcommand surface, or payload schema.
- Additive, backward-compatible IPC changes do **not** increment it.
- It is **decoupled** from `MAJOR.REVISION.HOTFIX`. A REVISION bump may or may
  not change the IPC contract version; they move independently.

**3. Compatibility is established by handshake, not by inference.**

`araya version` is the canonical handshake. It emits both the product version
and the IPC contract version. Public ARAYA decides compatibility by comparing
the **IPC contract version** it requires against what the Core reports:

```
public_requires_ipc == core_reports_ipc   → compatible
public_requires_ipc <  core_reports_ipc   → Core is newer; compatible only if
                                             Core still serves the older contract
public_requires_ipc >  core_reports_ipc   → INCOMPATIBLE — refuse, instruct upgrade
```

Public ARAYA MUST NOT infer compatibility from `MAJOR.REVISION.HOTFIX`.

## Consequences

- The SemVer assumption is removed from all architecture artifacts.
- Public ARAYA and Private Core can release on independent product-version
  cadences without breaking runtime, because the *contract* version — not the
  *product* version — is authoritative for compatibility.
- `araya version` becomes a load-bearing command (the handshake), which is why
  it is the first subcommand in Slice 1.
- A breaking IPC change is a deliberate, visible event (integer bump), separate
  from the marketing/maturity signal of a REVISION.
- The MAHG `release-versioning` standard is the single source of truth for the
  product-version half of this model; this ADR adds only the IPC contract half.

## Evidence

- MAHG `release-versioning.md` defines `MAJOR.REVISION.HOTFIX` with bounds
  `REVISION ≤ 73`, `HOTFIX ≤ 5`, promotion at `x.73.5 → (x+1).0.0`: ✅
- No SemVer language remains in this ADR: ✅
- IPC contract version is defined as independent of the product version: ✅
- Handshake mechanism (`araya version`) specified and scheduled in Slice 1: ✅
