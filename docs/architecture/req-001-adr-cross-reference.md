# REQ-001 ADR Cross-Reference — Delegation Broker & Catalog Architecture

- **Document:** ADR Inventory — REQ-001 Embedded Architecture Decisions
- **Date:** 2026-07-22
- **Author:** Priscila (Technical Writer)
- **Version:** 1.0
- **Status:** draft
- **Source Specs:** Aisha (WS-04 — Catalog Schema), Isla (WS-08 — Delegation Architecture)

---

## Status Summary

AWU-051 tasks Priscila with writing ADRs for the delegation system and catalog architecture if not already covered by AWU-027 (Isla) and AWU-014 (Aisha).

**Finding:** Both architects embedded their ADRs within their design specification documents rather than extracting them as standalone ADR files in the canonical location (`.araya/governance/adrs/` or `.araya/adr/`). The ADR Artifact Governance model (`.araya/adr/adr-artifact-governance.md`) specifies that ADRs should be stored at `.araya/adr/` with the naming convention `adr-NNN-<short-description>.md`.

**Recommendation:** Extract the embedded ADRs to standalone files during the next ADR governance pass. The ADRs are fully written and reviewed — they just need to be moved to the canonical location with proper numbering.

---

## Embedded ADR Inventory

### From Aisha's Catalog Schema Spec (WS-04, AWU-014)

**Source:** `.araya/plan/spec/req-001-catalog-schema.md`, Section 8

| # | ADR Title | Status | Recommendation |
|---|-----------|--------|----------------|
| 1 | **Catalog is a Build Artifact, Not a Runtime Database** | Accepted (embedded) | Extract to `adr-009-catalog-build-artifact.md` |
| 2 | **Overlay for Manual Overrides, Not Mixed Source** | Accepted (embedded) | Extract to `adr-010-catalog-overlay-strategy.md` |
| 3 | **MCP as Broker Protocol** | Accepted (embedded) | Extract to `adr-011-mcp-broker-protocol.md` |

**ADR 1 Summary:** The catalog is generated as a JSON file (`.araya/catalog/catalog.json`) committed to the repository. It is not a live database. Populator runs at build/generation time. Runtime uses cached in-memory copy with 60-second TTL.

**ADR 2 Summary:** Fields that cannot be auto-derived (`usage_notes`, `risks`, `alternatives`) are stored in a separate `overrides.yaml` file, not mixed into the auto-generated catalog. This enables safe regeneration without touching human-curated content.

**ADR 3 Summary:** The delegation broker exposes MCP-compatible tools for runtime-agnostic access, with a thin pi-specific wrapper for local performance. This satisfies DI-002 (runtime independence).

---

### From Isla's Delegation Architecture Spec (WS-08, AWU-027)

**Source:** `.araya/plan/spec/req-001-delegation-architecture.md`, Section 12

| # | ADR Title | Status | Recommendation |
|---|-----------|--------|----------------|
| 4 | **Use In-Process Lightweight Broker for Agent Delegation** | Proposed (embedded as ADR-XXX) | Extract to `adr-012-delegation-broker-design.md` |

**ADR 4 Summary:** Build an in-process lightweight delegation broker as a TypeScript module within the ARAYA pi extension. Five options evaluated (in-process broker, external message queue, file-watch dispatcher, HTTP microservice, wrapped subagent). Zero external dependencies. Filesystem-based evidence persistence. Runtime-specific dispatcher adapters. Four-layer safety: self-delegation block, cycle detection, depth limit, circuit breaker.

---

## Gap Analysis

### Current ADR Registry

Canonical ADRs in `.araya/governance/adrs/`:

| Number | Title | Status |
|--------|-------|--------|
| ADR-001 | Branch Restoration | Active |
| ADR-002 | Core Binary IPC | Active |
| ADR-003 | Public/Private Boundary | Active |
| ADR-006 | Version Compatibility Model | Active |
| ADR-008 | Agent Tool Access | Active |

Notable gap: ADR-004, ADR-005, ADR-007 (in `.araya/adr/`) are not in the governance ADR directory.

### Proposed ADR Numbering for REQ-001

| Proposed # | Title | Author | Source |
|-----------|-------|--------|--------|
| ADR-009 | Catalog as Build Artifact | Aisha | `req-001-catalog-schema.md` §8 |
| ADR-010 | Catalog Overlay Strategy | Aisha | `req-001-catalog-schema.md` §8 |
| ADR-011 | MCP as Broker Protocol | Aisha | `req-001-catalog-schema.md` §8 |
| ADR-012 | In-Process Delegation Broker | Isla | `req-001-delegation-architecture.md` §12 |

---

## Action Items

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Extract ADR-009 through ADR-012 to `.araya/governance/adrs/` | Priscila / Esteban | Medium — content is written, needs relocation |
| 2 | Assign permanent ADR numbers (avoid conflicts with existing ADR-007, ADR-008) | Esteban | Medium |
| 3 | Update ADR index in `.araya/adr/adr-artifact-governance.md` | Priscila | Low |
| 4 | Reconcile `.araya/adr/` vs `.araya/governance/adrs/` location | Esteban / Daneel | Low — dual location may be intentional (see ADR-003 public/private boundary) |

---

## Decision: No Standalone ADR Written by Priscila

Priscila does **not** write new standalone ADRs for AWU-051 because:

1. The ADRs are already written by Aisha (WS-04) and Isla (WS-08) — the subject matter experts.
2. Priscila's role is documentation, not architecture design. Writing ADRs requires domain expertise that lives with the architects.
3. The ADRs are fully detailed, reviewed, and include: context, decision, options considered, rationale, consequences, and tradeoffs — all required ADR sections.
4. What's missing is **extraction** (relocating to canonical directory) and **numbering** (assigning permanent ADR numbers), not content creation.

**Priscila's contribution:** This cross-reference document catalogs all embedded ADRs, their status, proposed numbers, and the action items needed to complete ADR governance for REQ-001.

---

*This document serves as the AWU-051 deliverable. The embedded ADRs in Aisha's and Isla's specs are the authoritative source for architecture decisions. Assignment of permanent ADR numbers should be coordinated with Esteban (Knowledge Manager) to avoid conflicts with the existing ADR registry.*
