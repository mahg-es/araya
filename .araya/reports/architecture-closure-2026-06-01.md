# ARAYA Architecture Closure Report

**Date:** 2026-06-01
**Product version at closure:** v0.11.0 (next REVISION target: 0.12.0 — Go Core foundation)
**Prepared by:** Architecture (closing the package after the Antigravity session reached quota)
**Scope:** Architecture closure only. No code, no repository skeleton, no commits.

---

## 1. Purpose

Close the ARAYA architecture package so implementation can begin from a stable,
durable set of decisions. This report consolidates the locked/approved ADRs,
records the final positions on the boundary, IPC, versioning, and Go Core, and
fixes the exact first implementation slice for tomorrow.

---

## 2. ADR Ledger

| ADR | Title | Status | Notes |
|-----|-------|--------|-------|
| ADR-001 | Branch Governance Restoration | **Locked** (Accepted) | Pre-existing |
| ADR-002 | Core Binary Contract & IPC Specification | **Locked** | Persisted this session; payload schema ratified in Slice 1 |
| ADR-003 | Public / Private Boundary | **Approved (directional)** | Conflict-reviewed vs ADR-002 → no conflict |
| ADR-006 | Version Compatibility Model | **Locked (corrected)** | SemVer draft superseded by MAHG canonical model |

**Numbering gap — ADR-004 / ADR-005:** not present on disk and not provided in
the closure brief. Flagged as a pending item to confirm (reserved, or to be
back-filled). Not a blocker for Slice 1.

- **Locked:** ADR-001, ADR-002, ADR-006
- **Approved (directional):** ADR-003
- **Pending (confirm):** ADR-004, ADR-005 existence/intent
- **Deferred (no ADR yet):** Docker, workspaces, Kubernetes, orchestration,
  evidence signing, agents, daemon mode

---

## 3. Final Architecture Positions

### 3.1 Final Public / Private Boundary (ADR-003)
- **Public ARAYA** (open): conversational OS, intent routing, agents/personas,
  skills, governance docs, ADRs, `araya.yaml`, orchestration shell.
- **Private ARAYA Core** (closed, binary-only): the Go `araya` binary holding
  privileged/proprietary capabilities.
- **Single sanctioned crossing:** the ADR-002 IPC contract. No shared-library
  linkage, no import of Core source, no internal reach-through.
- **Dependency direction:** Public → Core *contract* only; Core depends on
  nothing in Public.

### 3.2 Final IPC Contract Reference (ADR-002)
- **Packaging:** one statically-linked Go binary, capabilities as subcommands.
- **Transport:** stateless process invocation — JSON request on **stdin**, JSON
  response envelope on **stdout**, diagnostics on **stderr**.
- **Exit codes:** `0` ok · `1` validation/contract failure · `2` usage · `≥3`
  capability-specific.
- **Envelope:** self-describing, carries `ipc_contract_version`. Canonical schema
  ratified by implementing `araya version` first.
- **No daemon:** every invocation self-contained (daemon mode deferred).

### 3.3 Final Version Compatibility Model (ADR-006 — corrected)
- **Product version:** MAHG canonical `MAJOR.REVISION.HOTFIX`.
  - `REVISION ≤ 73`, `HOTFIX ≤ 5`; promotion only at `x.73.5 → (x+1).0.0`.
  - REVISION ≠ SemVer MINOR; HOTFIX ≠ SemVer PATCH; MAJOR is earned and rare.
  - **ARAYA does not use SemVer.**
- **IPC contract version:** a **separate monotonic integer**, incremented only on
  a breaking IPC change, **decoupled** from the product version.
- **Compatibility by handshake, not inference:** `araya version` publishes both
  versions; Public compares the **IPC contract version** (never the product
  version) to decide compatibility.

### 3.4 Go Core Decision
- Private ARAYA Core is implemented in **Go**, shipped as a **single binary**.
- Rationale: static single-artifact distribution, clean process/stdio IPC, strong
  cross-compilation, keeps proprietary logic behind a binary boundary (ADR-003).

### 3.5 One-Binary / Multi-Package Source Organization
Single binary `araya`; capabilities are internal Go packages dispatched from one
entrypoint (illustrative layout — to be created at implementation time, **not
now**):

```
cmd/araya/main.go            # single entrypoint; subcommand dispatch
internal/ipc/                # envelope encode/decode; ipc_contract_version
internal/version/            # araya version  (handshake)
internal/validate/           # araya validate
internal/repotruth/          # araya repo-truth
internal/core/               # shared types/helpers
```

One binary, many packages — no per-capability binaries.

---

## 4. Pending Risks

1. **Provenance of ADR-002 / ADR-003 text.** Both were locked/approved in the
   Antigravity session but never persisted; this report reconstructs them from
   the closure brief and on-disk design docs. **Action:** owner confirms the
   reconstructed text matches the original intent. *(Low risk — Slice 1 does not
   depend on un-ratified payload detail.)*
2. **ADR-004 / ADR-005 numbering gap.** Confirm whether reserved or to be
   back-filled. *(Low risk — not on the Slice 1 path.)*
3. **IPC envelope schema not yet frozen.** Intentional: it is ratified by
   shipping `araya version` first. *(Managed, not open-ended.)*

None of the above blocks Slice 1.

---

## 5. Deferred Scope (explicitly out of architecture closure)

Docker · workspaces · Kubernetes · orchestration · evidence signing · agents ·
daemon mode.

These are acknowledged and intentionally excluded from this closure. No ADRs are
opened for them yet.

---

## 6. Tomorrow's First Slice — Slice 1 (Go Core foundation)

Implement three stateless subcommands behind the ADR-002 IPC contract. This slice
**ratifies the IPC envelope** and **lands the version handshake**.

### 6.1 `araya version`
- **Purpose:** the compatibility handshake (ADR-006).
- **Output (stdout JSON envelope):** product version `MAJOR.REVISION.HOTFIX`
  (`0.11.0` / `0.12.0`) **and** `ipc_contract_version` (start at `1`).
- **Acceptance:** valid envelope; both versions present; `--json` machine mode;
  exit `0`.

### 6.2 `araya validate`
- **Purpose:** validate `araya.yaml` and repo against governance schema/constitution.
- **Output:** envelope with structured findings (pass/fail + violations list).
- **Acceptance:** exit `0` when valid, `1` with structured violations when not;
  no false coupling to Public internals.

### 6.3 `araya repo-truth`
- **Purpose:** emit the canonical ground-truth snapshot (branch, product version,
  structure markers) used by governance.
- **Output:** envelope with the truth snapshot.
- **Acceptance:** deterministic snapshot; exit `0`; consumable by `validate`.

### 6.4 Slice 1 done-criteria
- Single `araya` binary builds with three subcommands.
- All three emit the ADR-002 envelope carrying `ipc_contract_version: 1`.
- `araya version` handshake usable by Public to gate compatibility.
- stdout = JSON only; stderr = diagnostics only; exit codes per ADR-002.

---

## 7. Disposition

ADR-006 corrected (SemVer removed, MAHG canonical model + decoupled IPC contract
version installed). ADR-003 reviewed against ADR-002 — **no conflict**. No
blockers remain on the Slice 1 path.

**Recommendation:** Proceed tomorrow with Slice 1.
**Disposition:** STOP
