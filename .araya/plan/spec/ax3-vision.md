# AX3 — Project Vision
## Manu (Product Owner) — Formal Specification

**Date**: 2026-06-16
**Status**: Approved for Planning
**Confidence**: 0.95

---

## Project Name
**AX3 — Agent Execution Contract Hierarchy** (ARAYA AX Cross-Cutting Feature)

## Description

### Business Problem
AI coding agents (Codex, Claude CLI, AGY, pi.dev, and future adapters) operate blindly when editing files — they lack awareness of project context, local rules, and hierarchical constraints. Without a binding contract system, agents produce drift, inconsistency, and broken contracts. Each agent reinvents its own context-loading mechanism (CLAUDE.md, AGENTS.md, Cursor rules, etc.), leading to fragmentation and incompatibility.

### Proposed Solution
AX3 provides a **lightweight, filesystem-native contract hierarchy** via `AX3.md` files that all ARAYA agents read before editing and update after meaningful changes. It is:

- **Portable**: A single `AX3.md` file per directory, readable by any AI tool
- **Hierarchical**: Root → children, with local rules that concretize but never weaken parent rules
- **Autonomous**: `/araya:ax3` reconciles the entire tree automatically
- **Complementary**: Works alongside AGENTS.md boundaries (ADR-0010) without conflict
- **Universal**: Same mechanism works across all agent adapters (Codex, Claude CLI, AGY, pi.dev)

## Objectives

1. **O1 — Autonomous Reconciliation**: `/araya:ax3` builds and maintains a valid AX3.md hierarchy across any project without human intervention
2. **O2 — Mandatory Preflight**: Every ARAYA agent reads the applicable AX3 chain before any file modification
3. **O3 — Mandatory Postflight**: After meaningful changes, agents update affected AX3.md files and indexes
4. **O4 — Cross-Agent Compatibility**: AX3 works uniformly across Codex, Claude CLI, AGY, pi.dev, and future adapters
5. **O5 — Non-Destructive by Design**: Human-authored content is always preserved; only clearly managed sections are auto-updated

## Success Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| **Reconciliation Idempotence** | 100% | Second reconciliation produces zero changes |
| **Preflight Coverage** | 100% of agent write operations | Audit log of preflight calls |
| **Drift Detection Accuracy** | 100% | `--check` detects all actual drift, zero false positives |
| **Cross-Agent Portability** | 4/4 adapters | Evidence per adapter (Codex, Claude CLI, AGY, pi.dev) |
| **Human Content Preservation** | 100% | No human-authored sections overwritten |
| **Test Coverage** | ≥ 90% | Unit + integration + regression test suite |

## Scope

### Included
- AX3 contract specification (AX3.md format, sections, markers)
- Root discovery algorithm (git root or araya.yaml)
- AX3 chain resolution (root → target path)
- Preflight hook (read chain before editing)
- Postflight hook (update chain after meaningful changes)
- `/araya:ax3` command with flags: `--check`, `--dry-run`, `--scope`, `--repair`
- Deterministic, idempotent reconciler
- Integration with all ARAYA agent adapters
- Managed section markers (`<!-- BEGIN/END ARAYA MANAGED -->`)
- Symlink and path traversal protection
- Exclusion configuration (node_modules, .git, dist, etc.)
- Unit, integration, and regression test suite
- Documentation (README, skill reference, agent integration guide)
- Independent audit (Daneel verifies claims)

### Explicitly Excluded
- Replacing AGENTS.md boundary system (ADR-0010) — AX3 is complementary
- Modifying existing agent personalities (agents reference AX3, don't embed it)
- CI/CD pipeline modifications (future enhancement)
- Real-time file watching (file-system polling not in scope)
- AX3.md diff/merge tools (use git)
- GUI or web interface

## Constraints

| Category | Constraint |
|----------|------------|
| **Architecture** | Must integrate into `src/araya/v2/ax3/` as an AX cross-cutting feature |
| **Runtime** | Must work in Node.js (pi.dev runtime), no native dependencies |
| **Branch** | `feature/ax3-integration` from `dev-mahg`, never touch `main` |
| **Compatibility** | Must not break existing commands, agents, or tests |
| **Security** | No path traversal, symlink escapes, or writes outside repo |
| **Performance** | Reconciliation < 5s for repos with < 1000 dirs |
| **Governance** | Diana reviews security; Elena audits process quality |
| **Idempotence** | Reconciler must be deterministic and idempotent |

## Stakeholders

| Role | Stakeholder | Responsibility |
|------|-------------|----------------|
| **Executive Sponsor** | The Data Professor | Final approval, vision validation |
| **Product Owner** | Manu | Requirements, acceptance criteria, pre-delivery validation |
| **PM Orchestrator** | Sonia | Workstreams, dependencies, resource allocation |
| **Capability Registry** | Aurora | Agent/skill/model coverage analysis |
| **Backend Architect** | Aisha | Contract design, API surface, module placement |
| **Backend Developer** | Valentina | Runtime implementation, command registration |
| **QA Engineer** | Teresa | Unit, integration, regression tests |
| **Cybersecurity** | Diana | Filesystem security, symlink/path safety |
| **Technical Writer** | Priscila | Documentation, usage guide, examples |
| **Independent Auditor** | Daneel | Verification against repository truth |
| **Scrum Master** | Elena | Process quality audit |
