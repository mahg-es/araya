# ADR-008: Universal Agent Tool Access — Read, Bash, PostOffice

**Status:** Active
**Decision:** Accepted
**Date:** 2026-07-20
**Decider:** Manuel Alejandro Hernández Giuliani (The Data Professor)
**Domain:** Agent Governance, Tool Access, Inter-Agent Communication
**Supersedes:** Any prior implicit or explicit tool restrictions not codified as constitutional security rules

---

## Context

ARAYA operates 28 specialized agents across 12 domains with 120 skills. Historically, agent tool access was determined by role — read-only agents were restricted from writing code or executing bash commands. While this was appropriate for architectural review agents, it created unnecessary friction:

- Read-only agents could not inspect repository state directly (no `read`, `grep`, `find`)
- Agents could not execute validation scripts, run tests, or verify build status (no `bash`)
- Agents had no standard mechanism for reading inter-agent communication (no PostOffice read)
- Agents could not send status updates, ACKs, questions, blockers, or closure messages (no PostOffice write)

This ADR establishes permanent, canonical, universal access for all ARAYA agents to fundamental tools required for their work, while preserving security and governance boundaries.

---

## Decision

The Data Professor authorizes, canonically and permanently, that **ALL ARAYA agents** across **ALL ARAYA-governed projects** have access to:

### 1. Read & Inspection Tools
- `read` — Read file contents
- `grep` / `rg` — Search file contents
- `find` — Locate files by name or pattern
- Any equivalent read/inspection capability

### 2. Bash Execution
- `bash` — Execute commands, Git operations, tests, validation scripts, build commands, and authorized automation
- Subject to: no destructive operations without governance, no production changes without approval

### 3. PostOffice — Read Access
- Read messages, instructions, context, responses, blockers, and relevant history from `.araya/postoffice/`
- Access to `inbox/`, `outbox/`, `thread.md`, and `index.jsonl`
- Ability to use `pending`, `list`, `read`, `summary`, `inspect` PostOffice lifecycle commands

### 4. PostOffice — Write Access
- Send ACK messages
- Send STATUS updates
- Send questions to other agents or the Professor
- Send BLOCKED messages with rationale
- Send evidence attachments
- Send responses to delegated tasks
- Send closure messages upon completion
- Send messages via `post` command to any recipient

---

## Scope

This authorization is:

- **Permanent** — does not expire
- **Universal** — applies to all agents in `araya.yaml` now and in the future
- **Cross-project** — applies to all projects governed by ARAYA Framework
- **Default** — is the baseline behavior; does not require per-agent or per-invocation approval
- **Canonical** — incorporated into the ARAYA Constitution, configuration, agent profiles, adapters, and subagent contracts

---

## Restrictions That Remain in Force

1. **No agent may modify `main` branch** without explicit Professor authorization
2. **No agent may expose secrets or credentials**
3. **No agent may execute destructive actions** (DROP, DELETE without WHERE, infrastructure teardown) without governance
4. **No agent may make production changes** without applicable governance
5. **No agent may operate outside authorized scope** — domain boundaries remain
6. **Read, Bash, and PostOffice operations must be logged, traceable, and auditable**

---

## Implementation Priority

1. `mahg-pms` — Primary production project
2. `mahg-platform` — Platform infrastructure
3. All other ARAYA-governed projects (`tmahg`, `araya-dev-coordinator`, `araya-project-coordinator`)

---

## Consequences

### Positive
- All agents can independently verify repository state, run validation, and communicate
- Reduced friction in delegation — agents don't need the Professor as messenger
- PostOffice becomes a reliable inter-agent communication channel
- Bash access enables automated testing, verification, and validation pipelines

### Risks & Mitigations
- **Risk:** Agents could misuse bash for destructive operations
  **Mitigation:** Constitutional prohibitions remain; circuit breakers enforce budget limits
- **Risk:** PostOffice could fill with noise
  **Mitigation:** Protocol rules (PROTOCOL.md) govern message format and lifecycle
- **Risk:** Scope creep beyond tool access
  **Mitigation:** Domain boundaries and constitutional rules unchanged

---

## Related

- Constitution: Section TOOL (Agent Tool Access)
- Standard: `.araya/governance/standards/agent-tool-access-standard.md`
- Contract: `.araya/contracts/araya.tool-access.json`
- PostOffice Protocol: `.araya/postoffice/PROTOCOL.md`
- ADR-002: Core Binary IPC
- ADR-003: Public/Private Boundary
