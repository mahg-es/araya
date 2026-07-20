# Agent Tool Access Standard

**Standard ID:** STD-TOOL-001
**Status:** Active (Canonical)
**Owner:** Manuel Alejandro Hernández Giuliani (The Data Professor)
**Created:** 2026-07-20
**Updated:** 2026-07-20
**Authority:** ADR-008 + Constitutional Section TOOL
**Applies To:** ALL ARAYA agents across ALL ARAYA-governed projects

---

## 1. Purpose

This standard defines the permanent, universal tool access rights of every ARAYA agent. It implements ADR-008 and the TOOL section of the ARAYA Constitution. No agent configuration, adapter, or project-specific policy may reduce these baseline tool access rights.

---

## 2. Baseline Tools — Universal Access

Every ARAYA agent, regardless of role, model tier, permissions, or project, has access to:

### 2.1 Read & Inspection

| Tool | Purpose | Scope |
|------|---------|-------|
| `read` | Read file contents (text and images) | Entire repository |
| `grep` / `rg` | Search file contents by pattern | Entire repository |
| `find` | Locate files by name or pattern | Entire repository |

**Rules:**
- May read any file in the repository
- Must not read files outside repository boundaries
- Must not read `.env`, credentials files, or secrets (SEC-001)
- All reads are traceable through agent execution logs

### 2.2 Bash Execution

| Tool | Purpose | Scope |
|------|---------|-------|
| `bash` | Execute shell commands | Repository workspace |

**Permitted Operations:**
- Git operations (status, diff, log, branch, checkout — not push to main)
- Run tests (unit, integration, smoke, validation)
- Execute build commands (npm, pip, make, docker-compose build)
- Run validation scripts and linters
- Execute authorized automation scripts
- Inspect system state (ls, cat, wc, stat, ps, df, env excluding secrets)

**Prohibited Operations (Constitutional):**
- Direct modifications to `main` branch (BRANCH-002)
- Destructive operations (DROP TABLE, DELETE without WHERE, rm -rf without confirmation)
- Infrastructure changes without approval (terraform apply, kubectl delete, docker rm -f production)
- Production deployment without governance gates
- Exposure of secrets or credentials (SEC-001)
- Network operations to unauthorized external services

**Rules:**
- Every bash invocation must have a clear, auditable purpose
- Destructive risk commands require explicit Professor or Program Director approval
- Circuit breakers (cost, runtime, failures) remain active
- Commands that modify repository state must be committed to feature branches

### 2.3 PostOffice — Read Access

| Capability | Purpose |
|------------|---------|
| `pending --to <role>` | List pending messages addressed to a role |
| `list` | List messages in PostOffice |
| `read <message-id>` | Read specific message content |
| `summary` | Get concise PostOffice state summary |
| `inspect` | Inspect PostOffice for relevant context |

**Accessible Paths:**
- `.araya/postoffice/inbox/` — Inbound messages
- `.araya/postoffice/outbox/` — Outbound messages
- `.araya/postoffice/thread.md` — Live thread view
- `.araya/postoffice/index.jsonl` — Technical event index

**Rules:**
- Agents SHOULD check PostOffice at the start of each invocation
- Agents SHOULD read pending messages addressed to them
- Agents MUST NOT delete or modify other agents' messages
- Agents MUST respect message lifecycle states

### 2.4 PostOffice — Write Access

| Capability | Purpose |
|------------|---------|
| `post` | Send a message to any recipient |
| `mark-read <message-id>` | Mark a message as read |
| `mark-claimed <message-id>` | Claim a message for processing |
| `mark-replied <message-id>` | Mark a message as replied |
| `mark-blocked <message-id>` | Block a message with reason |

**Message Types Agents May Send:**
| Type | Purpose | When |
|------|---------|------|
| ACK | Acknowledge receipt of task/delegation | Immediately upon receiving a task |
| STATUS | Report current status | After phase completion, on request, or when blocked |
| QUESTION | Ask for clarification | When requirements are ambiguous (AMB-001) |
| BLOCKED | Report blocker with rationale | When impeded from proceeding |
| EVIDENCE | Attach supporting evidence | With deliverables, test results, or verification |
| RESPONSE | Deliver task output | Upon completion of delegated work |
| CLOSURE | Signal completion | After all outputs delivered and acknowledged |

**Rules:**
- Messages MUST follow the PostOffice protocol (PROTOCOL.md)
- Messages MUST include required frontmatter (id, seq, created_at, from, to, subject, status, direction, model, model_source)
- Body size limit: 65536 bytes (larger content should be summarized or referenced as files)
- Agents MUST NOT spam — status updates should be meaningful
- Closure messages signal that an agent considers its task complete

---

## 3. Agent-Specific Overrides

The baseline tools SHALL NOT be removed from any agent. Project-specific or role-specific configurations MAY add restrictions but MUST NOT remove baseline access.

### 3.1 Configuration Syntax (araya.yaml)

```yaml
agents:
  agent_name:
    tool_access:
      read: true        # ALWAYS true — baseline
      bash: true        # ALWAYS true — baseline
      postoffice_read: true   # ALWAYS true — baseline
      postoffice_write: true  # ALWAYS true — baseline
```

### 3.2 Enforcement

- The pi extension (`extensions/araya/index.ts`) SHALL ensure baseline tools are registered for every agent invocation
- Subagent delegation SHALL preserve baseline tool access
- The PostOffice loop (`src/postoffice_loop.py`) SHALL authorize agent access based on this standard

---

## 4. PostOffice Setup per Project

Every ARAYA-governed project MUST have:

```
.araya/postoffice/
├── PROTOCOL.md
├── thread.md
├── index.jsonl
├── .seq_counter
├── inbox/
├── outbox/
├── archive/
└── archived-threads/
```

### 4.1 Minimum Viable Setup

For projects that do not yet have PostOffice, the canonical setup script (`araya-setup.sh` or equivalent) SHALL create the minimal structure.

### 4.2 PostOffice Tool

Projects SHOULD have `src/postoffice_loop.py` available for CLI-based PostOffice operations. If the Python tool is not present, agents SHALL interact with PostOffice through direct file read/write following PROTOCOL.md.

---

## 5. Auditing & Traceability

### 5.1 What Must Be Logged

| Operation | Audit Record |
|-----------|-------------|
| `read` / `grep` / `find` | Agent execution log (telemetry) |
| `bash` invocation | Command + exit code + truncated output (telemetry) |
| PostOffice read | Message ID + agent (index.jsonl) |
| PostOffice write | Message file (outbox/inbox) + index.jsonl entry |

### 5.2 Audit Locations

- Agent telemetry: `.araya/telemetry/`
- PostOffice index: `.araya/postoffice/index.jsonl`
- Run records: `.araya/runs/`

---

## 6. Compliance

- Sonia (Program Director) SHALL verify tool access compliance during monthly governance reviews
- Aurora (Capability Officer) SHALL verify all agent profiles include baseline tools
- Rolando (Reality Authority) SHALL independently verify that tool access restrictions are only those codified in this standard
- Violations of this standard SHALL be recorded as governance violations (VIO-*)

---

## 7. Amendment

Only The Data Professor may amend this standard. Agents may propose amendments through the constitutional amendment pipeline (PMO-010).
