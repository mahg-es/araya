# ARAYA Runtime Coverage — pi.dev, Codex, Claude CLI, AGY

- **Document:** Runtime Coverage — REQ-001 Cross-Runtime Compatibility
- **Date:** 2026-07-22
- **Author:** Priscila (Technical Writer)
- **Version:** 1.0
- **Status:** draft
- **Subject Matter Expert:** Isla (Infra Architect) — runtime dispatchers, DI-002

---

## Table of Contents

1. [Overview](#1-overview)
2. [Runtime Comparison](#2-runtime-comparison)
3. [pi.dev](#3-pidev)
4. [Codex](#4-codex)
5. [Claude CLI](#5-claude-cli)
6. [AGY](#6-agy)
7. [Delegation Across Runtimes](#7-delegation-across-runtimes)
8. [Configuration per Runtime](#8-configuration-per-runtime)
9. [Limitations & Known Gaps](#9-limitations--known-gaps)

---

## 1. Overview

ARAYA is designed to be **runtime-agnostic**. The framework deploys the same 28 agents, 120 skills, and governance model regardless of which AI coding assistant (runtime) executes them.

REQ-001 AC-20 requires that documentation cover all officially supported runtimes. This document catalogs the differences, limitations, and configuration for each.

### Supported Runtimes

| Runtime | Status | Dispatcher | Priority |
|---------|--------|-----------|----------|
| **pi.dev** | ✅ Production (primary) | `PiAgentDispatcher` | Tier 1 — full support |
| **Codex** | 🔨 In development | `CodexAgentDispatcher` | Tier 2 — adapter ready |
| **Claude CLI** | 🔨 In development | `ClaudeCLIAgentDispatcher` | Tier 2 — adapter ready |
| **AGY** | 🔨 In development | `AgyAgentDispatcher` | Tier 2 — adapter ready |

---

## 2. Runtime Comparison

| Feature | pi.dev | Codex | Claude CLI | AGY |
|---------|--------|-------|------------|-----|
| **Agent model** | YAML + Markdown prompts | SDK-based agent config | CLI-based agent invocation | REST API agents |
| **Delegation mechanism** | `pi.sendUserMessage()` | `session.sendMessage()` | `claude send --agent` | `POST /agents/{id}/tasks` |
| **Agent isolation** | Per-message context switch | Session context switch | Subprocess invocation | API endpoint isolation |
| **Tool access** | Native pi tools (read, write, edit, bash) | Codex SDK tools | Claude tools | AGY tools |
| **Slash commands** | `/araya:*` extension system | Custom command registration | CLI flags | API endpoints |
| **Evidence persistence** | `.araya/runs/` | `.araya/runs/` | `.araya/runs/` | `.araya/runs/` |
| **Catalog** | `dist/araya/catalog` import | `dist/araya/catalog` import | `dist/araya/catalog` import | `dist/araya/catalog` import |
| **Autonomous execution** | Native (pi session) | Codex session | Claude CLI session | AGY session |

---

## 3. pi.dev

### Status: ✅ Primary — Production

pi.dev is the **reference implementation** for ARAYA. All features, commands, and governance are designed and tested on pi first.

### How It Works

1. **Extension system:** ARAYA is loaded as a pi extension (`extensions/araya/`)
2. **Agent prompts:** Loaded from `prompts/agents/<name>.md`
3. **Agent config:** `araya.yaml` provides agent definitions, skills, permissions
4. **Slash commands:** Registered via `pi.registerCommand()` in the extension's `activate()` function
5. **Delegation:** The `PiAgentDispatcher` uses `pi.sendUserMessage()` with context switching

### Key Commands

```bash
/araya:man                           # Catalog discovery (browse, search, lookup)
/araya:delegate <agent> "<task>"     # Delegate to specialist
/araya:delegation-status <id>        # Check delegation status
/araya:ax3                           # AX3 contract reconciliation
/araya run --mode full "<task>"      # Full SDLC orchestration
```

### Limitations

- `sendUserMessage()` behavior may change across pi versions → dispatcher tests must target current version
- Agent context switching is per-message, not per-session → no persistent agent state between messages (by design)
- Extension must be symlinked or copied to `~/.pi/agent/extensions/` → `./araya-setup.sh` handles this

### Configuration

```yaml
# araya.yaml — pi-specific (none needed, pi uses defaults)
delegation:
  broker:
    runtime: "pi"  # auto-detected
```

---

## 4. Codex

### Status: 🔨 Adapter Ready — Pending Testing

Codex support uses the Codex SDK's session-based agent model. The `CodexAgentDispatcher` wraps `session.sendMessage()` with ARAYA's delegation protocol.

### How It Works

1. **Agent prompts:** Same `prompts/agents/<name>.md` files
2. **Agent config:** Same `araya.yaml` definitions
3. **Command registration:** Codex custom commands (mapped from ARAYA slash commands)
4. **Delegation:** `CodexAgentDispatcher` sends messages with context switching via the Codex SDK

### Key Differences from pi.dev

| Aspect | pi.dev | Codex |
|--------|--------|-------|
| Agent invocation | `pi.sendUserMessage()` | `session.sendMessage()` |
| Tool names | `read`, `write`, `edit`, `bash`, `grep`, `find` | Codex equivalents |
| Slash commands | `/araya:man` | Codex command system |
| Context window | pi-managed | Codex-managed |

### Limitations

- Codex tool names may differ from pi's (e.g., `read_file` vs `read`) → prompts should use tool-agnostic descriptions
- Session lifecycle differs → delegation session grouping may behave differently
- Autonomous execution triggers may need Codex-specific wiring

### Configuration

```yaml
# araya.yaml — Codex-specific overrides (proposed)
delegation:
  broker:
    runtime: "codex"
  codex:
    session_persistence: true
    auto_context_compression: true
```

---

## 5. Claude CLI

### Status: 🔨 Adapter Ready — Pending Testing

Claude CLI support uses the `claude send` subprocess invocation pattern. Each delegation spawns a Claude CLI instance with the target agent's prompt.

### How It Works

1. **Agent prompts:** Same `prompts/agents/<name>.md` files
2. **Agent config:** Same `araya.yaml` definitions
3. **Command registration:** CLI flags mapped from ARAYA slash commands
4. **Delegation:** `ClaudeCLIAgentDispatcher` spawns `claude send --agent <name> "<task>"` subprocess

### Key Differences from pi.dev

| Aspect | pi.dev | Claude CLI |
|--------|--------|------------|
| Agent invocation | `pi.sendUserMessage()` | `claude send --agent` subprocess |
| Tool names | `read`, `write`, `edit`, `bash`, `grep`, `find` | Claude tools |
| Isolation | In-process context switch | Separate process per delegation |
| Overhead | Low (context switch) | Higher (process spawn per delegation) |
| State | Filesystem (`.araya/runs/`) | Filesystem (`.araya/runs/`) |

### Limitations

- **Process overhead:** Each delegation spawns a new Claude CLI process — slower than in-process dispatch
- **Tool name mapping:** Claude's tool names may differ → need mapping layer
- **Subprocess lifecycle:** Timeout and cancellation require SIGTERM handling
- **Concurrent delegations:** Each requires its own process → OS limits apply

### Configuration

```yaml
# araya.yaml — Claude CLI-specific overrides (proposed)
delegation:
  broker:
    runtime: "claude-cli"
  claude_cli:
    binary_path: "claude"              # or absolute path
    spawn_timeout_ms: 5000             # process spawn timeout
    output_format: "markdown"
```

---

## 6. AGY

### Status: 🔨 Adapter Ready — Pending Testing

AGY support uses AGY's REST API for agent task management. The `AgyAgentDispatcher` sends `POST /agents/{id}/tasks` requests.

### How It Works

1. **Agent prompts:** Same `prompts/agents/<name>.md` files
2. **Agent config:** AGY reads `araya.yaml` agent definitions
3. **Command registration:** AGY API endpoints (REST)
4. **Delegation:** `AgyAgentDispatcher` makes HTTP requests to AGY's task API

### Key Differences from pi.dev

| Aspect | pi.dev | AGY |
|--------|--------|-----|
| Agent invocation | `pi.sendUserMessage()` | `POST /agents/{id}/tasks` |
| Protocol | In-process function call | HTTP REST |
| Tool names | `read`, `write`, `edit`, `bash`, `grep`, `find` | AGY tools |
| Isolation | In-process context switch | API endpoint isolation |
| Network | None (local) | Requires AGY endpoint reachable |

### Limitations

- **Network dependency:** AGY endpoint must be reachable
- **Authentication:** AGY API requires auth token → must be in environment or config
- **Latency:** HTTP overhead per delegation
- **Tool name mapping:** AGY's tool names may differ

### Configuration

```yaml
# araya.yaml — AGY-specific overrides (proposed)
delegation:
  broker:
    runtime: "agy"
  agy:
    endpoint: "${AGY_ENDPOINT}"         # from environment
    auth_token: "${AGY_AUTH_TOKEN}"     # from environment
    request_timeout_ms: 30000
```

---

## 7. Delegation Across Runtimes

### The AgentDispatcher Interface

All runtimes implement the same interface:

```typescript
interface AgentDispatcher {
  dispatch(params: DispatchParams): Promise<DispatchResult>;
  isAvailable(agentName: string): Promise<boolean>;
  cancelDispatch(delegationId: string): Promise<void>;
}
```

Adding a new runtime requires:
1. Implementing the `AgentDispatcher` interface (~50 lines)
2. Registering the dispatcher in the runtime detection function
3. Testing against the runtime's agent invocation mechanism

### Runtime Detection

The broker automatically detects the runtime at startup:

```typescript
function detectRuntime(): RuntimeId {
  if (process.env.PI_VERSION) return "pi";
  if (process.env.CODEX_SESSION_ID) return "codex";
  if (process.env.CLAUDE_CLI === "1") return "claude-cli";
  if (process.env.AGY_ENDPOINT) return "agy";
  return "unknown";
}
```

### Cross-Runtime Evidence

Regardless of runtime, all delegation evidence is stored in the same format at `.araya/runs/{delegation_id}/`:
- `metadata.json` — full delegation record
- `output.md` — agent response
- `audit.jsonl` — append-only audit log
- `artifacts/` — produced files

This means Daneel can verify evidence from any runtime using the same tools.

---

## 8. Configuration per Runtime

### Minimal Configuration (all runtimes)

```yaml
# araya.yaml — shared section, works on all runtimes
delegation:
  broker:
    max_depth: 3
    default_timeout_ms: 300000
    max_concurrent: 10
    evidence_path: ".araya/runs"
  circuit_breaker:
    failure_threshold: 5
    failure_window_ms: 60000
    cooldown_ms: 30000
  permissions:
    enforce: true
    escalate_to_aurora: true
    aurora_timeout_ms: 30000
```

### Runtime-Specific (optional)

Runtime-specific configuration is only needed when the default runtime detection is insufficient or when you need to override runtime behavior.

---

## 9. Limitations & Known Gaps

| Limitation | Affected Runtimes | Severity | Mitigation |
|-----------|-------------------|----------|------------|
| Tool name differences | Codex, Claude CLI, AGY | Medium | Use tool-agnostic language in agent prompts ("read file" not "use the read tool") |
| Subprocess overhead | Claude CLI | Low | Acceptable for non-real-time use; batch delegations when possible |
| Network dependency | AGY | Medium | Timeout and circuit breaker protect against AGY unavailability |
| pi version sensitivity | pi.dev | Low | Dispatcher tests run against current pi version |
| No cross-runtime delegation | All | Low | Delegations stay within the same runtime instance |

### Not Yet Implemented (Future)

- Cross-runtime delegation (pi agent delegating to AGY agent)
- Runtime failover (if pi dispatcher fails, try Codex)
- Unified telemetry across runtimes

---

## Reference

| Document | Covers |
|----------|--------|
| `.araya/plan/spec/req-001-delegation-architecture.md` §4 | Runtime Independence (DI-002) — full dispatcher design |
| `.araya/plan/spec/req-001-delegation-architecture.md` §9 | pi.dev integration — detailed |
| `docs/commands/araya-man.md` | /araya:man command reference (works on all runtimes) |
| `docs/agents/command-delegation-integration.md` | Agent integration guide (runtime-agnostic) |
| `skills/araya-command-and-delegation-expert/SKILL.md` | Skill spec (runtime-agnostic) |

---

*This document covers AWU-052. Runtime coverage is a moving target — update this document when a new runtime adapter is implemented or tested.*
