# REQ-001 Delegation Architecture — Broker, Protocol, and Runtime Integration

- **Document:** Spec — Delegation Infrastructure Architecture (WS-08)
- **Date:** 2026-07-22
- **Author:** Isla (Infra Architect)
- **Version:** 1.0
- **Status:** Draft — pending review by Aisha (Backend Architect), Valentina (Backend Dev), Diana (Security)
- **Parent:** `.araya/plan/spec/req-001-workstreams.md` (Workstream 8, AWU-023 a AWU-027)
- **Covers AC:** DI-001, DI-002, DI-003, DI-004, DI-005, DI-006 / AC-13, AC-14, AC-15
- **Covers Requirements:** RF-C01, RF-C02, RF-C03, RF-C04, RF-C05, RF-C06
- **Covers RNF:** RNF-04 (Idempotencia), RNF-05 (Seguridad), RNF-06 (Trazabilidad), RNF-10 (Disponibilidad), RNF-11 (Timeout)

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Architecture Overview](#2-architecture-overview)
3. [Broker Core Design (DI-001)](#3-broker-core-design-di-001)
4. [Runtime Independence (DI-002)](#4-runtime-independence-di-002)
5. [Capabilities: Correlation, Sessions, Permissions, States, Results, Evidence (DI-003)](#5-capabilities-di-003)
6. [Anti-Recursion & Circuit Breaker (DI-004)](#6-anti-recursion--circuit-breaker-di-004)
7. [Order/Execution Separation — Sonia's Role (DI-005)](#7-orderexecution-separation--sonias-role-di-005)
8. [Verification Criteria (DI-006)](#8-verification-criteria-di-006)
9. [Integration with pi.dev Runtime](#9-integration-with-pidev-runtime)
10. [Data Model & Persistence](#10-data-model--persistence)
11. [Security Architecture](#11-security-architecture)
12. [ADR-XXX: Delegation Broker Design](#12-adr-delegation-broker-design)

---

## 1. Purpose & Scope

### Purpose

This document defines the **complete architecture** of the ARAYA Delegation Broker — the
infrastructure that enables any ARAYA agent, on any runtime, to delegate work to a
specialist agent with full correlation, state tracking, permission validation, recursion
protection, and verifiable evidence.

### Scope

- **In scope:** Broker architecture, delegation protocol, state machine, session model,
  permission model, anti-recursion mechanism, circuit breaker, runtime integration,
  persistence layer, security boundaries, data model.
- **Out of scope:** Implementation code (belongs to WS-10), catalog registry (WS-07),
  `/araya:man` system (WS-09), agent prompt updates (WS-11), testing (WS-14).

### Design Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| P1 | **Lightweight — no external dependencies** | The broker runs in-process. No RabbitMQ, Kafka, Redis, or external DB. |
| P2 | **Runtime-agnostic by design** | The broker exposes a pure function API. The runtime adapter is a thin shell. |
| P3 | **Immutable evidence** | Once a delegation completes/fails/timeouts, its record is append-only. |
| P4 | **Fail-closed on security** | If permission check fails, reject. Never default-allow. |
| P5 | **Observable at all times** | Every delegation state transition is logged. State is always queryable. |
| P6 | **Idempotent dispatch** | Same correlation_id submitted twice = one execution, same result returned. |

---

## 2. Architecture Overview

### 2.1 System Context (C4 — Level 1)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ARAYA Runtime (pi / Codex / Claude CLI / AGY) │
│                                                                      │
│  ┌──────────┐   /araya:delegate    ┌───────────────────────────┐    │
│  │  Agent   │ ──────────────────►  │   Delegation Broker       │    │
│  │ (Sonia,  │                      │                           │    │
│  │  Manu,   │  ◄────────────────── │  ┌─────────────────────┐  │    │
│  │  anyone) │   result + evidence  │  │  State Machine      │  │    │
│  └──────────┘                      │  │  pending→dispatched │  │    │
│                                    │  │  →running→completed │  │    │
│  ┌──────────┐                      │  └─────────────────────┘  │    │
│  │  Target  │ ◄── dispatch ──────── │                           │    │
│  │  Agent   │                      │  ┌─────────────────────┐  │    │
│  │(Valentina│ ──── result ────────► │  │  Recursion Guard    │  │    │
│  │ , Diana, │                      │  │  Cycle Detection    │  │    │
│  │  Clara)  │                      │  │  Depth Limiter      │  │    │
│  └──────────┘                      │  └─────────────────────┘  │    │
│                                    │                           │    │
│                                    │  ┌─────────────────────┐  │    │
│                                    │  │  Evidence Store     │  │    │
│                                    │  │  .araya/runs/       │  │    │
│                                    │  └─────────────────────┘  │    │
│                                    └───────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Container Diagram (C4 — Level 2)

```
┌─ ARAYA Runtime Process ─────────────────────────────────────────────┐
│                                                                      │
│  ┌──────────────────────┐     ┌──────────────────────────────────┐  │
│  │  Slash Command Layer │     │  Delegation Broker               │  │
│  │                      │     │                                  │  │
│  │  /araya:delegate     │────►│  ┌────────────────────────────┐  │  │
│  │  /araya:delegation-  │     │  │  Request Validator         │  │  │
│  │    status            │     │  │  - agent exists?           │  │  │
│  │  /araya:delegation-  │     │  │  - has capabilities?       │  │  │
│  │    list              │     │  │  - recursion check         │  │  │
│  └──────────────────────┘     │  └────────────┬───────────────┘  │  │
│                               │               │                   │  │
│  ┌──────────────────────┐     │  ┌────────────▼───────────────┐  │  │
│  │  Capability Registry  │◄───►│  │  Dispatcher               │  │  │
│  │  (from WS-07)        │     │  │  - build agent prompt      │  │  │
│  │  - agents            │     │  │  - send user message       │  │  │
│  │  - skills            │     │  │  - await response          │  │  │
│  │  - permissions       │     │  └────────────┬───────────────┘  │  │
│  └──────────────────────┘     │               │                   │  │
│                               │  ┌────────────▼───────────────┐  │  │
│  ┌──────────────────────┐     │  │  State Manager            │  │  │
│  │  Evidence Store       │◄────│  │  - transition validation  │  │  │
│  │  .araya/runs/{id}/   │     │  │  - timeout monitoring     │  │  │
│  │  - metadata.json     │     │  │  - result collection      │  │  │
│  │  - output.md         │     │  └────────────┬───────────────┘  │  │
│  │  - artifacts/        │     │               │                   │  │
│  └──────────────────────┘     │  ┌────────────▼───────────────┐  │  │
│                               │  │  Evidence Writer           │  │  │
│                               │  │  - persist metadata        │  │  │
│                               │  │  - write output            │  │  │
│                               │  │  - save artifacts          │  │  │
│                               │  └────────────────────────────┘  │  │
│                               └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Component Interaction (Sequence)

```
Agent A          Broker           Registry        Agent B        Filesystem
  │                │                 │               │               │
  │ /araya:delegate│                 │               │               │
  │   valentina    │                 │               │               │
  │   "task"       │                 │               │               │
  │───────────────►│                 │               │               │
  │                │ validate(A)     │               │               │
  │                │────────────────►│               │               │
  │                │ ◄── A: ok       │               │               │
  │                │                 │               │               │
  │                │ validate(B)     │               │               │
  │                │────────────────►│               │               │
  │                │ ◄── B: ok       │               │               │
  │                │                 │               │               │
  │                │ recursion_check │               │               │
  │                │─────────────┐   │               │               │
  │                │ ◄── clean   │   │               │               │
  │                │             │   │               │               │
  │                │ persist: PENDING              │               │
  │                │───────────────────────────────────────────────►│
  │                │                 │               │               │
  │  delegation_id │                 │               │               │
  │ ◄──────────────│                 │               │               │
  │                │                 │               │               │
  │                │ dispatch(B, task)              │               │
  │                │────────────────────────────────►│               │
  │                │ state: DISPATCHED→RUNNING      │               │
  │                │                 │               │               │
  │                │                 │     B executes task           │
  │                │                 │ ◄─────────────│               │
  │                │                 │               │               │
  │                │     result ◄────│               │               │
  │                │                 │               │               │
  │                │ persist: COMPLETED + evidence    │               │
  │                │───────────────────────────────────────────────►│
  │                │                 │               │               │
  │ result+evidence│                 │               │               │
  │ ◄──────────────│                 │               │               │
```

---

## 3. Broker Core Design (DI-001)

### 3.1 API Surface

The broker exposes a **pure function API** — no class instances, no global state.
The runtime adapter wraps these functions into slash commands.

```typescript
// ── Broker API ──────────────────────────────────────────────

/** Initialize the broker with configuration */
function initBroker(config: BrokerConfig): BrokerHandle;

/** Submit a delegation request. Returns immediately with delegation_id. */
function delegate(handle: BrokerHandle, request: DelegateRequest): DelegateAck;

/** Query the status of a delegation by ID */
function getStatus(handle: BrokerHandle, delegationId: string): DelegationStatus | null;

/** List all delegations, optionally filtered by session or agent */
function listDelegations(handle: BrokerHandle, filter?: DelegationFilter): DelegationSummary[];

/** Retrieve the full result + evidence of a completed delegation */
function getResult(handle: BrokerHandle, delegationId: string): DelegationResult | null;

/** Cancel a pending/dispatched delegation */
function cancel(handle: BrokerHandle, delegationId: string, reason: string): boolean;

/** Health check — returns broker uptime, active delegations, failure count */
function healthCheck(handle: BrokerHandle): BrokerHealth;
```

### 3.2 BrokerHandle — In-Process State

The broker maintains its state in a lightweight in-memory store backed by
the filesystem for crash recovery. This is NOT an external process — it
lives inside the ARAYA extension's module scope.

```typescript
interface BrokerHandle {
  config: BrokerConfig;
  store: DelegationStore;       // in-memory Map + filesystem sync
  registry: CapabilityRegistry;  // read-only ref to WS-07 catalog
  dispatcher: AgentDispatcher;   // sends tasks to agents
  circuitBreaker: CircuitBreaker;
  startedAt: number;
}

interface BrokerConfig {
  maxDepth: number;              // default: 3
  defaultTimeoutMs: number;      // default: 300_000 (5 min)
  evidenceBasePath: string;      // default: ".araya/runs"
  maxConcurrentDelegations: number; // default: 10
  circuitBreakerThreshold: number;  // default: 5 failures in 60s
  circuitBreakerCooldownMs: number; // default: 30_000
}
```

### 3.3 Lifecycle

```
STARTUP:
  1. Extension loads → broker module imported
  2. initBroker(config) called with config from araya.yaml + defaults
  3. In-memory store initialized
  4. Pending/running delegations from previous session detected (if store persisted)
  5. Stale delegations (no heartbeat) marked as TIMEOUT
  6. Broker ready

SHUTDOWN:
  1. All running delegations given grace period (configurable, default 10s)
  2. State flushed to filesystem
  3. Broker handle released

CRASH RECOVERY:
  1. On init, scan .araya/runs/ for delegations in PENDING/DISPATCHED/RUNNING state
  2. Any delegation with no heartbeat in > 2× timeout → mark TIMEOUT
  3. Any delegation in DISPATCHED/RUNNING with target agent still available → re-attempt dispatch (once)
  4. Log recovery actions
```

---

## 4. Runtime Independence (DI-002)

### 4.1 The Problem

The current implementation (2026-07-22) hardcodes `subagent` — a pi-specific tool:

```typescript
// Current: vendor lock-in
`**Subagent Delegation:** ENABLED — use the subagent tool for delegation`
```

This violates DI-002. Agents on Codex, Claude CLI, or AGY cannot use `subagent`.

### 4.2 The Solution: Agent Dispatcher Abstraction

The broker does NOT invoke agents directly. It delegates to an **AgentDispatcher**
interface. Each runtime provides its own implementation:

```typescript
interface AgentDispatcher {
  /** Send a task to a target agent and return the response */
  dispatch(params: DispatchParams): Promise<DispatchResult>;

  /** Check if a target agent is available (exists, not busy, not blocked) */
  isAvailable(agentName: string): Promise<boolean>;

  /** Send a cancellation signal to a running delegation */
  cancelDispatch(delegationId: string): Promise<void>;
}

interface DispatchParams {
  delegationId: string;
  targetAgent: string;
  targetModelTier: string;
  task: string;                    // the natural language task
  context: string;                 // full agent prompt with delegation context
  timeoutMs: number;
  parentDelegationId?: string;     // for chain tracking
  sessionId?: string;
}
```

### 4.3 Runtime Adapters

| Runtime | Dispatcher Implementation | Mechanism |
|---------|--------------------------|-----------|
| **pi.dev** | `PiAgentDispatcher` | Uses `pi.sendUserMessage()` with target agent prompt. The pi extension framework switches agent identity based on the prompt's agent marker. |
| **Codex** | `CodexAgentDispatcher` | Uses Codex SDK `session.sendMessage()` with agent context switching. |
| **Claude CLI** | `ClaudeCLIAgentDispatcher` | Uses Claude CLI `claude send` subprocess invocation with `--agent` flag. |
| **AGY** | `AgyAgentDispatcher` | Uses AGY's REST API `POST /agents/{id}/tasks`. |

Each dispatcher is a **separate TypeScript file** implementing the `AgentDispatcher`
interface. The broker selects the dispatcher based on a runtime identifier passed
at initialization.

### 4.4 Runtime Detection

```typescript
// Runtime is detected once at startup and the correct dispatcher is selected
type RuntimeId = "pi" | "codex" | "claude-cli" | "agy" | "unknown";

function detectRuntime(): RuntimeId {
  // pi: process.env.PI_VERSION exists
  if (process.env.PI_VERSION) return "pi";
  // Codex: process.env.CODEX_SESSION_ID exists
  if (process.env.CODEX_SESSION_ID) return "codex";
  // Claude CLI: process.env.CLAUDE_CLI === "1"
  if (process.env.CLAUDE_CLI === "1") return "claude-cli";
  // AGY: process.env.AGY_ENDPOINT exists
  if (process.env.AGY_ENDPOINT) return "agy";
  return "unknown";
}
```

### 4.5 The pi.dev Dispatcher

For pi.dev, this is how the dispatcher works WITHOUT `subagent`:

```
1. Broker calls piDispatcher.dispatch({targetAgent: "valentina", task: "...", ...})
2. PiDispatcher constructs a new user message:
   - Sets the "speaking as" context to the target agent
   - Injects the delegation task + context
   - Uses pi.sendUserMessage() to invoke the target agent's prompt
3. pi's core routes the message to the target agent's configured model
4. The target agent's response is captured
5. PiDispatcher returns DispatchResult{output, artifacts, metadata}
```

This is fundamentally different from `subagent` because:
- It uses the standard `pi.sendUserMessage()` API — no special tool
- The target agent's prompt is loaded from `prompts/agents/{name}.md`
- The target agent executes with its OWN tools, not the caller's
- The caller never gets access to the target agent's tools

**Key insight:** `pi.sendUserMessage()` is the UNIVERSAL delegation primitive.
It exists in every runtime. The broker wraps it so agents don't need to know
which runtime they're on.

---

## 5. Capabilities (DI-003)

### 5.1 Correlation

Every delegation receives three identifiers forming a hierarchical chain:

```
session_id (optional, groups related delegations)
  └── delegation_id (unique per delegation — UUID v4)
        └── correlation_id (links request → dispatch → result)
```

| ID | Format | Assigned By | Lifetime | Purpose |
|----|--------|-------------|----------|---------|
| `session_id` | `ses_{uuid_short}` | Caller or broker | Multi-delegation workflow | Group delegations into a sprint, run, or project |
| `delegation_id` | `del_{uuid_short}` | Broker at request time | Single delegation | Primary key for all delegation queries |
| `correlation_id` | `cor_{uuid_short}` | Broker at request time | Single delegation | Links the original request to the dispatched task and result |

```typescript
function generateId(prefix: string): string {
  return `${prefix}_${randomUUID().split('-')[0]}`;
}
// Example: del_a1b2c3d4, cor_e5f6g7h8, ses_i9j0k1l2
```

**Idempotency guarantee:** If `delegate()` is called with the same `correlation_id`
twice, the broker returns the existing `delegation_id` and does NOT dispatch again.
This is checked before any validation.

### 5.2 Sessions

Sessions are an optional grouping mechanism. A session is NOT a security boundary —
it's an organizational convenience.

```typescript
interface Session {
  sessionId: string;
  label?: string;           // human-readable: "sprint-42", "req-001-run-3"
  createdBy: string;        // agent who created the session
  createdAt: number;
  delegations: string[];    // ordered list of delegation_ids
  status: "active" | "closed";
  metadata?: Record<string, unknown>;
}

// Creating a session
function createSession(handle: BrokerHandle, label?: string): Session;

// Delegating within a session
function delegate(handle: BrokerHandle, request: DelegateRequest): DelegateAck;
// request.sessionId — if set, this delegation joins that session

// Closing a session (no more delegations can be added)
function closeSession(handle: BrokerHandle, sessionId: string): void;
```

**Session behavior:**
- Sessions are `active` by default — delegations can be added
- `closeSession()` transitions to `closed` — no more delegations
- Sessions are queryable: `/araya:delegation-list --session ses_abc`
- Sessions persist to `.araya/runs/sessions/{session_id}.json`

### 5.3 Permissions

The broker enforces a **three-tier permission model**:

#### Tier 1: Structural Validation

```
Can Agent A delegate to Agent B?
  ├── Agent A exists in registry? → if not: REJECT
  ├── Agent B exists in registry? → if not: REJECT (suggest similar names)
  ├── Agent A == Agent B? → if yes: REJECT (self-delegation, DI-004)
  └── Agent B is in A's delegation chain? → if yes: REJECT (cycle, DI-004)
```

#### Tier 2: Capability Validation

```
Does Agent B have the skills for this task?
  ├── Task type inferred from keywords or explicit task_type
  ├── Agent B has skills matching task domain? → if not: WARN + suggest alternatives
  └── Agent B has can_write_code: false and task requires code? → if yes: REJECT
```

**Aurora's role (AC-16):**
When capability matching is ambiguous (multiple agents could handle the task, or
no agent clearly matches), the broker escalates to Aurora for eligibility
determination. This is a **delegation itself** — the broker delegates to Aurora:

```
Broker → Aurora: "Determine eligibility for task X. Candidates: [A, B, C]."
Aurora → Broker: {recommended: "B", confidence: 0.92, reasoning: "..."}
Broker → dispatches to B (or returns recommendation to caller)
```

#### Tier 3: Governance Validation

```
Is this delegation allowed by governance?
  ├── Sonia delegating implementation? → ALLOWED (this is the whole point)
  ├── Sonia delegating planning? → REJECTED (planning is Sonia's job)
  ├── Agent delegating outside its orchestrator scope? → WARN (logged)
  └── Exception mode active (no specialist available)? → ALLOW with evidence
```

```typescript
interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;           // human-readable rejection reason
  suggestions?: string[];    // alternative agents if rejected
  requiresAuroraEscalation?: boolean;
  candidates?: string[];     // agents that Aurora should evaluate
}
```

### 5.4 State Machine

```
                         ┌──────────┐
                         │  PENDING  │  ← delegation created, not yet validated
                         └─────┬─────┘
                               │ validation passes
                               ▼
                         ┌──────────┐
                   ┌─────│DISPATCHED│─────┐
                   │     └─────┬─────┘     │
                   │           │           │
              cancel()    dispatch       cancel()
                   │      succeeds         │
                   ▼           ▼           ▼
              ┌────────┐ ┌─────────┐  ┌─────────┐
              │CANCELLED│ │ RUNNING │  │CANCELLED│
              └────────┘ └────┬─────┘  └─────────┘
                              │
                   ┌──────────┼──────────┐
                   │          │          │
              result    timeout   dispatch fails
              received   │          │
                   │     │          │
                   ▼     ▼          ▼
              ┌─────────┐ ┌──────┐ ┌──────┐
              │COMPLETED│ │TIMEOUT│ │FAILED│
              └─────────┘ └──────┘ └──────┘
                              │          │
                              │          │
                              ▼          ▼
                         ┌──────────────────┐
                         │    TERMINAL      │
                         │ (no transitions) │
                         └──────────────────┘

SPECIAL STATE:

  ┌────────┐
  │ BLOCKED│  ← external dependency prevents progress
  └───┬────┘     (e.g., waiting for Aurora eligibility)
      │
      ▼
  back to DISPATCHED when unblocked
```

**Transition Validation Table:**

| From | To | Allowed? | Condition |
|------|----|----------|-----------|
| PENDING | DISPATCHED | ✅ | Validation passes |
| PENDING | CANCELLED | ✅ | Cancel called before dispatch |
| PENDING | FAILED | ✅ | Validation fails (no retry) |
| DISPATCHED | RUNNING | ✅ | Dispatch acknowledged by runtime |
| DISPATCHED | FAILED | ✅ | Dispatcher returned error |
| DISPATCHED | TIMEOUT | ✅ | Dispatch didn't acknowledge within 30s |
| DISPATCHED | CANCELLED | ✅ | Cancel called before running |
| RUNNING | COMPLETED | ✅ | Result received + evidence persisted |
| RUNNING | FAILED | ✅ | Agent returned error or runtime crash |
| RUNNING | TIMEOUT | ✅ | Exceeded timeoutMs |
| RUNNING | BLOCKED | ✅ | Awaiting external input (e.g., Aurora eligibility) |
| BLOCKED | DISPATCHED | ✅ | Block resolved, re-dispatch |
| BLOCKED | TIMEOUT | ✅ | Blocked longer than timeout |
| BLOCKED | CANCELLED | ✅ | Cancel called while blocked |
| COMPLETED | * | ❌ | Terminal state |
| FAILED | * | ❌ | Terminal state |
| TIMEOUT | * | ❌ | Terminal state |
| CANCELLED | * | ❌ | Terminal state |

### 5.5 Results

Every completed delegation returns a structured result:

```typescript
interface DelegationResult {
  // ── Identity ──
  delegationId: string;
  correlationId: string;
  sessionId?: string;

  // ── Status ──
  status: "completed" | "failed" | "timeout" | "cancelled";
  statusReason?: string;     // human-readable: "timeout after 300s"

  // ── Agents ──
  requestedBy: string;       // agent who initiated delegation
  dispatchedTo: string;      // agent who executed
  modelTier: string;         // tier used for execution

  // ── Task ──
  task: string;              // original task text
  taskType?: string;         // inferred: "backend", "security", "docs", etc.

  // ── Execution ──
  createdAt: number;         // epoch ms
  dispatchedAt?: number;
  runningAt?: number;
  completedAt?: number;
  durationMs?: number;       // runningAt → completedAt

  // ── Quality ──
  confidence?: number;       // 0.0–1.0, set by executing agent
  risks: Risk[];
  blockers: Blocker[];

  // ── Output ──
  output: string;            // full agent response (markdown or structured)
  outputFormat: "markdown" | "json";

  // ── Chain ──
  parentDelegationId?: string;
  depth: number;             // 0 = direct, 1 = sub-delegation, 2 = sub-sub
}

interface Risk {
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

interface Blocker {
  description: string;
  resolution?: string;
}
```

### 5.6 Evidence

```typescript
interface DelegationEvidence {
  metadata: DelegationMetadata;   // full delegation record as JSON
  output: string;                 // raw agent output
  artifacts: Artifact[];          // files produced
  auditLog: AuditEntry[];         // every state transition + timestamp
}

interface DelegationMetadata {
  // mirrors DelegationResult but persisted to filesystem
}

interface Artifact {
  path: string;             // relative to .araya/runs/{delegation_id}/
  type: "file" | "diff" | "log";
  sizeBytes: number;
  description: string;
}

interface AuditEntry {
  timestamp: number;
  event: string;            // "VALIDATION_PASSED" | "DISPATCHED" | "STATE_CHANGE" | etc.
  from?: string;
  to?: string;
  actor: string;            // agent or "system"
  detail?: string;
}
```

**Evidence directory layout:**

```
.araya/runs/
├── sessions/
│   └── ses_a1b2c3d4.json          # session metadata
├── del_e5f6g7h8/
│   ├── metadata.json               # full delegation record
│   ├── output.md                    # agent response (markdown)
│   ├── artifacts/
│   │   ├── health-endpoint.ts      # code produced
│   │   └── test-results.log        # test output
│   └── audit.jsonl                 # append-only audit log
├── del_i9j0k1l2/
│   └── ...
└── broker-state.json               # broker internal state (crash recovery)
```

---

## 6. Anti-Recursion & Circuit Breaker (DI-004)

### 6.1 Three-Layer Recursion Defense

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECURSION DEFENSE LAYERS                       │
│                                                                   │
│  LAYER 1: Self-Delegation Block                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Agent A → Agent A  →  REJECT immediately                    │ │
│  │ "Agent cannot delegate to itself"                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│                           ▼                                       │
│  LAYER 2: Active Chain Cycle Detection                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ A → B → C → A  →  REJECT before dispatch                    │ │
│  │ "CYCLE_DETECTED: A is already in delegation chain [A→B→C]"  │ │
│  │                                                              │ │
│  │ How: Each delegation carries its ancestor chain.             │ │
│  │ Broker walks chain before dispatch.                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                       │
│                           ▼                                       │
│  LAYER 3: Maximum Depth Limit                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ A → B → C → D  (depth 3 if maxDepth=3)  →  REJECT           │ │
│  │ "MAX_DEPTH_EXCEEDED: depth would be 4, max is 3"            │ │
│  │                                                              │ │
│  │ depth = length of ancestor chain + 1                         │ │
│  │ maxDepth configurable in BrokerConfig (default: 3)           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Implementation: Ancestor Chain Tracking

```typescript
interface AncestorChain {
  /** Ordered list of agents from root delegator to immediate parent */
  agents: string[];
  /** Corresponding delegation_ids */
  delegationIds: string[];
  /** Current depth */
  depth: number;
}

function buildChildChain(parent: AncestorChain, parentAgent: string, parentDelegationId: string): AncestorChain {
  return {
    agents: [...parent.agents, parentAgent],
    delegationIds: [...parent.delegationIds, parentDelegationId],
    depth: parent.depth + 1,
  };
}

function validateRecursion(
  targetAgent: string,
  chain: AncestorChain,
  maxDepth: number
): { allowed: boolean; reason?: string } {
  // Layer 1: Self-delegation
  if (chain.agents.length > 0 && chain.agents[chain.agents.length - 1] === targetAgent) {
    return { allowed: false, reason: "RECURSION_BLOCKED: Agent cannot delegate to itself" };
  }

  // Layer 2: Cycle detection
  if (chain.agents.includes(targetAgent)) {
    const cycleIndex = chain.agents.indexOf(targetAgent);
    const cycle = chain.agents.slice(cycleIndex).join(" → ") + " → " + targetAgent;
    return { allowed: false, reason: `CYCLE_DETECTED: ${targetAgent} is already in the delegation chain (${cycle})` };
  }

  // Layer 3: Max depth
  if (chain.depth >= maxDepth) {
    return { allowed: false, reason: `MAX_DEPTH_EXCEEDED: delegation depth would be ${chain.depth + 1}, max is ${maxDepth}` };
  }

  return { allowed: true };
}
```

### 6.3 Edge Cases

| Scenario | Detection | Response |
|----------|-----------|----------|
| A → B → B (B tries to delegate to self) | Layer 1 | REJECT: self-delegation |
| A → B → A (B tries to delegate back to A) | Layer 2 | REJECT: cycle detected |
| A → B → C → B (C tries to delegate to B) | Layer 2 | REJECT: B already in chain |
| A → B → C → D (with maxDepth=3) | Layer 3 | REJECT: max depth exceeded |
| A → B → C (with maxDepth=3) | — | ALLOW: depth 2 < maxDepth 3 |
| A → B, then A → B again (duplicate) | Idempotency | Return existing delegation (same correlation_id) |

### 6.4 Circuit Breaker

A circuit breaker protects the broker from cascading failures when
an agent or runtime is persistently failing.

```typescript
interface CircuitBreaker {
  /** Failure counts by target agent */
  failures: Map<string, FailureWindow[]>;
  /** Currently open circuits */
  openCircuits: Set<string>;
  config: {
    threshold: number;        // failures before opening (default: 5)
    windowMs: number;         // sliding window (default: 60_000)
    cooldownMs: number;       // how long circuit stays open (default: 30_000)
  };
}

interface FailureWindow {
  timestamp: number;
  reason: string;
}
```

**States:**

```
        ┌──────────┐
        │  CLOSED  │  ← normal operation, delegations flow
        └─────┬─────┘
              │ failure count > threshold within window
              ▼
        ┌──────────┐
        │   OPEN   │  ← all delegations to this agent immediately rejected
        └─────┬─────┘
              │ cooldownMs elapsed
              ▼
        ┌──────────┐
        │ HALF_OPEN│  ← one test delegation allowed through
        └─────┬─────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
success?            failure?
    │                   │
    ▼                   ▼
 CLOSED              OPEN
(reset counter)    (cooldown restart)
```

**Circuit breaker behavior at dispatch time:**

```
1. Check: is circuit OPEN for targetAgent?
   → Yes: REJECT immediately with CIRCUIT_OPEN error
   → No: proceed

2. Dispatch delegation

3. On FAILURE/TIMEOUT:
   → Record failure in sliding window
   → If failures in window > threshold → OPEN circuit
   → Log: "CIRCUIT_OPEN: {agent} has {n} failures in {windowMs}ms"

4. On circuit OPEN:
   → Set timer for cooldownMs
   → After cooldown: transition to HALF_OPEN
   → Next delegation to this agent is a "test probe"

5. On test probe SUCCESS:
   → CLOSE circuit, reset counter

6. On test probe FAILURE:
   → OPEN circuit, restart cooldown
```

**Circuit breaker error to the user:**

```
CIRCUIT_OPEN: Agent 'valentina' is temporarily unavailable.
Failures: 5 in the last 60s.
Last failure: "timeout after 300s"
Circuit will re-test in 30s.
Suggestion: wait and retry, or try a different agent.
```

---

## 7. Order/Execution Separation — Sonia's Role (DI-005)

### 7.1 The Principle

Sonia is an **orchestrator**, not an executor. She must be able to order
delegations without ever touching the tools or execution context of the
target agent.

### 7.2 How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│   SONIA (orchestrator)                  BROKER (infrastructure)    │
│   ┌─────────────────────┐              ┌──────────────────────┐   │
│   │                     │              │                      │   │
│   │ 1. Plan work        │              │                      │   │
│   │ 2. Identify agents  │              │                      │   │
│   │ 3. Issue orders ────┼──────────────► 4. Validate          │   │
│   │                     │              │ 5. Dispatch           │   │
│   │                     │              │ 6. Monitor            │   │
│   │                     │              │ 7. Collect results    │   │
│   │ 8. Receive results ◄┼──────────────│                      │   │
│   │ 9. Synthesize       │              │                      │   │
│   │ 10. Report          │              │                      │   │
│   │                     │              │                      │   │
│   └─────────────────────┘              └──────────────────────┘   │
│                                                                   │
│   SONIA NEVER:                                                    │
│   - Opens files directly (no write tool on target agent's behalf) │
│   - Accesses subagent tool                                        │
│   - Needs target agent's prompt or tools                          │
│   - Sees target agent's raw execution context                     │
│                                                                   │
│   SONIA ALWAYS:                                                   │
│   - Uses /araya:delegate <agent> "<task>"                         │
│   - Receives structured results from broker                       │
│   - Has access to evidence in .araya/runs/                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Sonia's Delegate Command

```
/araya:delegate valentina "implement POST /api/health endpoint returning {status: 'ok'}"

What Sonia types:    /araya:delegate <target> "<task>"
What Sonia sees:     delegation_id: del_a1b2c3d4
                     status: DISPATCHED
                     estimated completion: <timeout>

What Sonia does next: wait or continue other work

What Sonia eventually sees:
  delegation_id: del_a1b2c3d4
  status: COMPLETED
  agent: valentina
  confidence: 0.95
  risks: []
  evidence: .araya/runs/del_a1b2c3d4/
  output: (summary of what valentina did)
```

### 7.4 Batch Delegation

Sonia can issue multiple delegations in sequence or in parallel groups:

```bash
# Sequential batch (Sonia's typical workflow)
/araya:delegate aisha "design catalog schema" --session ses_sprint42
/araya:delegate priscila "write delegation skill" --session ses_sprint42
/araya:delegate isla "design delegation architecture" --session ses_sprint42

# Check all delegations in this session
/araya:delegation-list --session ses_sprint42

# Wait for all to complete, then synthesize
/araya:delegation-status --session ses_sprint42 --wait
```

### 7.5 Sonia's Prompt Update Required

Sonia's prompt (`prompts/agents/sonia.md`) must be updated to include the
Specialist Delegation Contract as **mandatory behavior**:

```
## Specialist Delegation Contract (BINDING)

You are an orchestrator, NOT an executor. For any task outside your
core orchestration responsibilities (planning, decomposition, coordination,
tracking, consolidation), you MUST delegate via /araya:delegate.

### You MUST delegate:
- Architecture → aisha (architect)
- Backend implementation → valentina (backend)
- Frontend implementation → alejandra (frontend)
- Testing → teresa/priya (qa)
- Security → diana (cybersecurity)
- Infrastructure → isla (infra architect)
- Documentation → priscila (technical writer)
- Data analysis → bernabe (data engineer)
- Educational design → laura (educational designer)
- Any task where a specialist agent exists and is available

### You MUST NOT execute directly:
- Write code
- Run tests
- Design architecture
- Perform security reviews
- Write documentation
- Any specialist work

### Exceptions (require evidence):
Only when ALL of:
1. Aurora confirms no specialist is available
2. Exception is logged with reason
3. Risks and limits are explicit
4. Governance allows substitution

### Time pressure or convenience ARE NOT valid reasons to bypass delegation.
```

---

## 8. Verification Criteria (DI-006)

The infrastructure is considered operational when ALL 7 verification points pass:

### V1: `/araya:delegate` sends request to broker

```bash
$ /araya:delegate valentina "echo hello"
delegation_id: del_a1b2c3d4
correlation_id: cor_e5f6g7h8
status: DISPATCHED
```

**Verification:** The command returns a `delegation_id` and `correlation_id`
within 1 second. No direct execution of the task by the caller.

### V2: Broker dispatches to the correct agent

```bash
$ /araya:delegation-status del_a1b2c3d4
status: COMPLETED
dispatchedTo: valentina
```

**Verification:** `dispatchedTo` matches the requested target. The task was
executed by the target agent, not the caller.

### V3: Result returns with correlation_id and status

```bash
$ /araya:delegate valentina "echo hello"
result: {
  correlation_id: "cor_e5f6g7h8",
  status: "completed",
  output: "hello"
}
```

**Verification:** The result includes `correlation_id` matching the original
request and a valid status.

### V4: Agent without subagent can delegate

```bash
# In a runtime where subagent tool is NOT available:
$ /araya:delegate valentina "echo hello"
# Must succeed without errors
```

**Verification:** The delegation completes successfully without any reference
to `subagent` in logs or code paths.

### V5: Recursive delegation is rejected

```bash
$ /araya:delegate valentina "delegate back to me"
# ...inside valentina's context, valentina tries:
$ /araya:delegate sonia "do something"
ERROR: CYCLE_DETECTED: sonia is already in the delegation chain (sonia → valentina)
```

**Verification:** Self-delegation and cycle detection produce clear errors.
No delegation is created.

### V6: Delegation to nonexistent agent produces clear error

```bash
$ /araya:delegate nonexistent "do something"
ERROR: Agent 'nonexistent' not found in registry.
Did you mean: [no close matches]
```

**Verification:** Error is clear, suggests real agents if close names exist.

### V7: Evidence is persisted

```bash
$ ls .araya/runs/del_a1b2c3d4/
metadata.json
output.md
audit.jsonl
```

**Verification:** After delegation completes, the directory exists with at
least `metadata.json`, `output.md`, and `audit.jsonl`.

---

## 9. Integration with pi.dev Runtime

### 9.1 Where It Lives

The delegation broker is integrated into the existing ARAYA pi extension:

```
extensions/araya/
├── index.ts                      # existing — slash command registration
├── delegation/
│   ├── broker.ts                 # NEW — Broker core (init, delegate, state machine)
│   ├── state-machine.ts          # NEW — State transitions, validation
│   ├── recursion-guard.ts        # NEW — Anti-recursion logic
│   ├── circuit-breaker.ts        # NEW — Failure protection
│   ├── evidence-store.ts         # NEW — .araya/runs/ persistence
│   ├── permission-checker.ts     # NEW — Capability validation
│   ├── id-generator.ts           # NEW — UUID generation
│   ├── dispatchers/
│   │   ├── types.ts              # NEW — AgentDispatcher interface
│   │   ├── pi-dispatcher.ts      # NEW — pi.dev implementation
│   │   ├── codex-dispatcher.ts   # NEW — Codex implementation
│   │   └── agy-dispatcher.ts     # NEW — AGY implementation
│   └── types.ts                  # NEW — Shared types
```

### 9.2 Registration in index.ts

In `extensions/araya/index.ts`, add:

```typescript
// ── Delegation Broker ──────────────────────────────────────────
import { initBroker, delegate, getStatus, listDelegations, getResult, cancel } from "./delegation/broker";
import { detectRuntime } from "./delegation/dispatchers/types";

let brokerHandle: BrokerHandle | null = null;

export function activate(api: ExtensionAPI) {
  const ctx = api.getContext();
  const runtime = detectRuntime();
  const arayaRoot = findArayaRoot();
  const config = loadConfig(arayaRoot);

  // Initialize broker
  brokerHandle = initBroker({
    maxDepth: 3,
    defaultTimeoutMs: 300_000,
    evidenceBasePath: ".araya/runs",
    maxConcurrentDelegations: 10,
    circuitBreakerThreshold: 5,
    circuitBreakerCooldownMs: 30_000,
    runtime,
    arayaRoot,
    registry: config,  // araya.yaml loaded config
  });

  // Register delegation commands
  ctx.registerCommand("araya:delegate", handleDelegate);
  ctx.registerCommand("araya:delegation-status", handleDelegationStatus);
  ctx.registerCommand("araya:delegation-list", handleDelegationList);
  // ... existing commands unchanged ...
}
```

### 9.3 Command Handlers

```typescript
// /araya:delegate <agent> "<task>" [--session <id>] [--timeout <ms>]
async function handleDelegate(args: string[]) {
  const targetAgent = args[0];
  const task = args.slice(1).join(" ");

  if (!targetAgent) return "Usage: /araya:delegate <agent> \"<task>\"";
  if (!task) return "Usage: /araya:delegate <agent> \"<task>\"";

  // Parse optional flags
  const timeoutIdx = args.indexOf("--timeout");
  const sessionIdx = args.indexOf("--session");
  const timeout = timeoutIdx >= 0 ? parseInt(args[timeoutIdx + 1]) * 1000 : undefined;
  const sessionId = sessionIdx >= 0 ? args[sessionIdx + 1] : undefined;

  const result = delegate(brokerHandle!, {
    targetAgent,
    task,
    requestedBy: "sonia", // or detect current agent
    sessionId,
    timeoutMs: timeout,
  });

  if (!result.accepted) {
    return `❌ Delegation rejected: ${result.reason}\n${result.suggestions ? "Suggestions: " + result.suggestions.join(", ") : ""}`;
  }

  return `✅ Delegation accepted
delegation_id: ${result.delegationId}
correlation_id: ${result.correlationId}
status: ${result.status}
target: ${targetAgent}
`;
}

// /araya:delegation-status <delegation_id>
async function handleDelegationStatus(args: string[]) {
  const id = args[0];
  if (!id) return "Usage: /araya:delegation-status <delegation_id>";

  const status = getStatus(brokerHandle!, id);
  if (!status) return `No delegation found with id: ${id}`;

  return formatDelegationStatus(status);
}

// /araya:delegation-list [--session <id>] [--agent <agent>]
async function handleDelegationList(args: string[]) {
  const sessionIdx = args.indexOf("--session");
  const agentIdx = args.indexOf("--agent");

  const filter: DelegationFilter = {};
  if (sessionIdx >= 0) filter.sessionId = args[sessionIdx + 1];
  if (agentIdx >= 0) filter.agent = args[agentIdx + 1];

  const delegations = listDelegations(brokerHandle!, filter);
  return formatDelegationList(delegations);
}
```

### 9.4 Backward Compatibility

The existing `/araya <agent> <task>` command MUST continue to work. It is
NOT replaced by `/araya:delegate`. Instead:

- `/araya <agent> <task>` — legacy path, routes through broker if broker is active,
  falls back to direct execution if broker is not initialized.
- `/araya:delegate <agent> <task>` — new explicit delegation path, always routes
  through broker, fails if broker is not initialized.

```typescript
// In existing handler for /araya <agent> <task>:
if (brokerHandle) {
  // Route through broker for correlation, evidence, recursion protection
  const result = delegate(brokerHandle, { targetAgent, task, requestedBy: currentAgent });
  return formatDelegationAck(result);
} else {
  // Legacy path: send directly (backward compatible)
  const prompt = buildAgentPrompt(config, targetAgent, [task]);
  pi.sendUserMessage(prompt);
}
```

---

## 10. Data Model & Persistence

### 10.1 Entity-Relationship

```
┌──────────┐        ┌──────────────┐        ┌──────────┐
│  Session  │1──────*│  Delegation  │*──────1│  Agent   │
│           │        │              │        │          │
│ sessionId │        │ delegationId │        │ name     │
│ label     │        │ correlationId│        │ role     │
│ status    │        │ sessionId    │        │ skills[] │
│ createdAt │        │ requestedBy  │        │ tier     │
│           │        │ dispatchedTo │        │ perms    │
└──────────┘        │ status       │        └──────────┘
                     │ task         │
                     │ createdAt    │
                     │ completedAt  │
                     │ depth        │
                     │ parentId     │
                     └──────┬───────┘
                            │
                     ┌──────┴───────┐
                     │              │
               ┌─────┴─────┐  ┌────┴─────┐
               │  Result   │  │ Evidence │
               │           │  │          │
               │ output    │  │ metadata │
               │ confidence│  │ artifacts│
               │ risks[]   │  │ auditLog │
               │ blockers[]│  │ output   │
               └───────────┘  └──────────┘
```

### 10.2 Storage Strategy

| Data | Storage | Format | Rationale |
|------|---------|--------|-----------|
| Broker state | Memory + `.araya/runs/broker-state.json` | JSON | Fast access, crash recovery |
| Delegation metadata | `.araya/runs/{id}/metadata.json` | JSON | Immutable after terminal state |
| Agent output | `.araya/runs/{id}/output.md` | Markdown | Human-readable, diffable |
| Audit log | `.araya/runs/{id}/audit.jsonl` | JSONL | Append-only, line-at-a-time |
| Artifacts | `.araya/runs/{id}/artifacts/` | Original | Preserves file identity |
| Sessions | `.araya/runs/sessions/{id}.json` | JSON | Lightweight grouping |
| Circuit breaker state | Memory only | — | Resets on restart |

### 10.3 Persistence Guarantees

- **Write-ahead:** State transitions are written to audit log BEFORE the
  state is updated in memory.
- **Atomic writes:** Files are written via temp file + rename to prevent
  partial writes from corrupting state.
- **Immutability:** Once a delegation reaches a TERMINAL state
  (COMPLETED/FAILED/TIMEOUT/CANCELLED), its metadata.json is never overwritten.
- **Garbage collection:** Not in scope for REQ-001. Future enhancement.

---

## 11. Security Architecture

### 11.1 Threat Model (STRIDE Summary)

| Threat | Category | Mitigation |
|--------|----------|------------|
| Agent A delegates as Agent B (spoofing) | Spoofing | `requestedBy` is determined server-side from current agent context, not from user input |
| Agent elevates privileges via delegation | Elevation | Permission check at dispatch: target agent's permissions applied, not caller's |
| Delegation chain injection | Tampering | Ancestor chain built server-side, never from user input |
| Credentials in delegation messages | Information Disclosure | Tasks are plain text. Credentials managed by secret manager, never passed in delegation |
| Replay of old delegation_id | Repudiation | Idempotency based on correlation_id. Replay returns existing result, doesn't re-execute |
| DoS via delegation flood | Denial of Service | maxConcurrentDelegations + circuit breaker |
| Evidence tampering | Tampering | Evidence is write-once per delegation. Audit log is append-only JSONL |

### 11.2 Agent Identity

The broker determines the requesting agent from the runtime context,
NOT from user input:

```typescript
// pi.dev: current agent identity comes from which prompt is active
// This is determined by pi's extension context
function getCurrentAgent(ctx: ExtensionContext): string {
  // In pi, the current agent is set by the extension when the agent's
  // prompt is loaded. Fallback: "unknown".
  return ctx.getCurrentAgent?.() ?? "unknown";
}
```

### 11.3 Permission Application

When Agent A delegates to Agent B:
- Agent B executes with **Agent B's permissions**, not Agent A's
- If Agent B has `can_write_code: false`, the broker still dispatches but
  Agent B's runtime will enforce the restriction
- The broker validates permissions at dispatch time and warns if the task
  requires capabilities the target agent lacks

### 11.4 Diana's Security Review Checklist (for WS-12)

| # | Check | Applies to |
|---|-------|------------|
| 1 | No credentials in delegation messages or evidence | RF-C01 |
| 2 | Agent identity not spoofable | RF-C02 |
| 3 | No path traversal in evidence paths | RF-C03 |
| 4 | Ancestor chain not injectable | RF-C04 |
| 5 | Max depth enforced server-side | RF-C04 |
| 6 | Circuit breaker cannot be bypassed | RF-C04 |
| 7 | Audit log is append-only | RF-C03 |
| 8 | No privilege escalation via delegation | RF-C02 |
| 9 | Delegation to non-existent agent fails safely | RF-C01 |
| 10 | Broker state not exposed via command output | RF-C02 |

---

## 12. ADR: Delegation Broker Design

---

### ADR-XXX: Use In-Process Lightweight Broker for Agent Delegation

**Status:** Proposed
**Date:** 2026-07-22
**Deciders:** Isla (Infra Architect), Aisha (Backend Architect), Valentina (Backend Dev)
**Replaces:** Implicit delegation via pi `subagent` tool
**Superseded by:** n/a

---

### Context

ARAYA agents need to delegate work to specialist agents. The current mechanism
uses pi's `subagent` tool, which is runtime-specific and violates REQ-001 DI-002
(runtime independence). DI-001 through DI-006 mandate a broker with correlation,
sessions, permissions, states, results, evidence, recursion protection, and
order/execution separation.

We must design a delegation system that:
- Works on pi, Codex, Claude CLI, and AGY
- Does not require external infrastructure (databases, message queues)
- Provides full traceability with immutable evidence
- Protects against recursion and cascading failures
- Separates Sonia's orchestration from execution

### Decision

**We will build an in-process lightweight delegation broker as a TypeScript
module within the ARAYA pi extension**, with runtime-specific dispatcher
adapters, file-based evidence persistence, and a four-layer safety system
(self-delegation block, cycle detection, depth limit, circuit breaker).

### Options Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A: In-process broker (CHOSEN)** | Zero dependencies, fast, simple deployment, no external process, easy to test | State lost on crash (mitigated by filesystem persistence), single-process only | ✅ Best fit for REQ-001 scope |
| B: External message queue (RabbitMQ/Redis) | Robust, distributed, persistent queues, production-grade | Overengineered for ARAYA's current needs, requires external service, complex deployment, violates "lightweight" constraint in vision doc | ❌ Out of scope |
| C: File-watch based dispatcher (inotify) | No process coupling, agents write task files, broker picks them up | Race conditions, polling overhead, complex error handling, no real-time state | ❌ Too fragile |
| D: HTTP microservice broker | Language-agnostic, scalable, clear API boundary | Requires running a second process, network overhead, auth complexity, violates P1 (no external deps) | ❌ Added complexity for no benefit |
| E: Keep subagent, wrap in abstraction | Minimal code change, backward compatible | Still depends on pi runtime's subagent tool at the bottom, doesn't solve DI-002, doesn't add correlation/evidence/recursion guard | ❌ Doesn't satisfy requirements |

### Rationale

1. **Zero external dependencies** aligns with the vision doc's "broker ligero, sin cola persistente" and with ARAYA's philosophy of self-contained operation.

2. **Filesystem persistence** gives us crash recovery without a database. `.araya/runs/` is already the established location for run evidence.

3. **Runtime adapters** are thin — they only implement `AgentDispatcher.dispatch()`. The broker core is runtime-agnostic. Adding a new runtime requires ~50 lines of adapter code.

4. **The recursion defense is mandatory.** Without it, agents could create infinite delegation loops. The three-layer model (self-block, cycle detection, depth limit) is proven in workflow engines.

5. **The circuit breaker** prevents cascading failures. If an agent is down or a runtime is misbehaving, the circuit opens and delegations fail fast instead of piling up.

6. **Order/execution separation** is the core of DI-005. Sonia issues `/araya:delegate` commands and receives structured results. She never touches code, never uses `subagent`, and never needs another agent's tools.

### Consequences

**Positive:**
- Full DI-001 through DI-006 compliance
- Runtime independence — works on pi, Codex, Claude CLI, AGY
- Immutable evidence in `.araya/runs/`
- Recursion and failure protection
- Clean separation between orchestration and execution

**Negative:**
- Increases extension codebase by ~800 lines (broker + dispatchers + types)
- State model adds complexity to debugging
- Crash recovery requires careful filesystem handling
- Pi dispatcher still depends on pi's `sendUserMessage()` — this is unavoidable
  as the agent prompt mechanism IS runtime-specific, but the broker API hides this

**Risks:**
- Filesystem race conditions if multiple agents write to same run directory
  → Mitigation: delegation_id is UUID, directories are unique
- Broker state grows unbounded
  → Mitigation: GC not in scope for REQ-001, but documented as future work
- `sendUserMessage()` may behave differently across pi versions
  → Mitigation: pi dispatcher tests against current pi version

**Neutral:**
- The broker does NOT replace Sonia's orchestration. It replaces her direct
  execution of specialist work. Sonia still plans, decomposes, and coordinates.
- The existing `/araya <agent> <task>` path continues to work for backward
  compatibility.

---

## Appendix A: Full Type Definitions

```typescript
// ── delegation/types.ts ──────────────────────────────────────

export type DelegationStatus =
  | "pending"
  | "dispatched"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "timeout"
  | "cancelled";

export type CircuitState = "closed" | "open" | "half_open";

export interface DelegateRequest {
  targetAgent: string;
  task: string;
  requestedBy: string;
  sessionId?: string;
  correlationId?: string;   // if provided, used for idempotency
  timeoutMs?: number;
  parentDelegationId?: string;
  ancestorChain?: AncestorChain;
}

export interface DelegateAck {
  accepted: boolean;
  delegationId?: string;
  correlationId?: string;
  status?: DelegationStatus;
  reason?: string;           // if rejected
  suggestions?: string[];    // if rejected, alternative agents
}

export interface DelegationRecord {
  delegationId: string;
  correlationId: string;
  sessionId?: string;
  status: DelegationStatus;
  requestedBy: string;
  dispatchedTo: string;
  modelTier: string;
  task: string;
  taskType?: string;
  parentDelegationId?: string;
  ancestorChain: AncestorChain;
  depth: number;
  timeoutMs: number;
  createdAt: number;
  dispatchedAt?: number;
  runningAt?: number;
  completedAt?: number;
  output?: string;
  outputFormat?: "markdown" | "json";
  confidence?: number;
  risks: Risk[];
  blockers: Blocker[];
  permissionCheck?: PermissionCheckResult;
  auditLog: AuditEntry[];
}

export interface AncestorChain {
  agents: string[];
  delegationIds: string[];
  depth: number;
}

export interface DelegationFilter {
  sessionId?: string;
  agent?: string;
  status?: DelegationStatus;
  limit?: number;
}

export interface DelegationSummary {
  delegationId: string;
  status: DelegationStatus;
  requestedBy: string;
  dispatchedTo: string;
  task: string;
  createdAt: number;
  sessionId?: string;
}
```

## Appendix B: Error Catalog

| Error Code | Message | HTTP-like Status | Recovery |
|------------|---------|------------------|----------|
| `AGENT_NOT_FOUND` | Agent '{name}' not found in registry | 404 | Check agent name, use `/araya:man --agent` to list |
| `SELF_DELEGATION` | Agent cannot delegate to itself | 400 | Delegate to a different agent |
| `CYCLE_DETECTED` | '{agent}' is already in delegation chain: {chain} | 400 | Restructure workflow to avoid cycles |
| `MAX_DEPTH_EXCEEDED` | Depth would be {n}, max is {maxDepth} | 400 | Flatten delegation hierarchy |
| `CIRCUIT_OPEN` | Agent '{name}' is temporarily unavailable | 503 | Wait for cooldown or try different agent |
| `CAPABILITY_MISMATCH` | Agent '{name}' lacks required capabilities for this task | 400 | Try suggested alternative agents |
| `TIMEOUT` | Delegation exceeded {timeoutMs}ms timeout | 504 | Retry with longer timeout or different agent |
| `BROKER_NOT_INITIALIZED` | Delegation broker is not initialized | 500 | Check extension activation |
| `INVALID_STATE_TRANSITION` | Cannot transition from '{from}' to '{to}' | 500 | Internal error — report |
| `DUPLICATE_CORRELATION` | Delegation with correlation_id '{id}' already exists | 409 | Use the existing delegation_id to query status |
| `SESSION_CLOSED` | Cannot add delegations to closed session '{id}' | 400 | Create a new session |
| `DISPATCH_FAILED` | Failed to dispatch to agent '{name}': {reason} | 502 | Retry or check agent availability |

---

## Appendix C: Configuration Reference

```yaml
# araya.yaml — delegation section (proposed)
delegation:
  broker:
    max_depth: 3                    # maximum delegation chain depth
    default_timeout_ms: 300000      # 5 minutes
    max_concurrent: 10              # max delegations in RUNNING state
    evidence_path: ".araya/runs"    # where evidence is stored
  
  circuit_breaker:
    failure_threshold: 5            # failures before opening
    failure_window_ms: 60000        # sliding window (1 minute)
    cooldown_ms: 30000              # how long circuit stays open (30 seconds)
  
  permissions:
    enforce: true                   # set false only for testing
    escalate_to_aurora: true       # auto-escalate ambiguous capability matches
    aurora_timeout_ms: 30000       # how long to wait for Aurora's response
```

---

## Appendix D: Pi Dispatcher — Implementation Sketch

```typescript
// delegation/dispatchers/pi-dispatcher.ts

import type { AgentDispatcher, DispatchParams, DispatchResult } from "./types";

export class PiAgentDispatcher implements AgentDispatcher {
  private pi: any; // pi ExtensionAPI instance

  constructor(pi: any) {
    this.pi = pi;
  }

  async dispatch(params: DispatchParams): Promise<DispatchResult> {
    const { targetAgent, task, context, delegationId } = params;

    // Build the target agent's prompt with delegation context
    const prompt = this.buildDispatchPrompt(targetAgent, task, context, delegationId);

    // Send as user message — pi routes to the target agent's model
    const startTime = Date.now();
    try {
      // pi.sendUserMessage returns the agent's response
      const response = await this.pi.sendUserMessage(prompt);

      return {
        success: true,
        output: response,
        outputFormat: "markdown",
        durationMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        output: "",
        outputFormat: "markdown",
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async isAvailable(agentName: string): Promise<boolean> {
    // In pi, all registered agents are always available
    // Check if agent exists in config
    try {
      const config = this.pi.getContext().config;
      return agentName in (config?.agents ?? {});
    } catch {
      return false;
    }
  }

  async cancelDispatch(delegationId: string): Promise<void> {
    // In pi, cancellation is best-effort — send an interrupt signal
    this.pi.sendUserMessage(
      `CANCEL delegation ${delegationId}. Stop current task and report status.`
    );
  }

  private buildDispatchPrompt(
    agent: string,
    task: string,
    context: string,
    delegationId: string
  ): string {
    return [
      `## Delegated Task — ${delegationId}`,
      ``,
      `**Delegated to:** ${agent}`,
      `**Task:** ${task}`,
      ``,
      `## Context`,
      context,
      ``,
      `## Instructions`,
      `1. Execute the task described above`,
      `2. Produce your deliverable`,
      `3. If you need to sub-delegate, use /araya:delegate`,
      `4. Report completion with: status, confidence, risks, blockers, artifacts`,
      ``,
      `## Task`,
      task,
    ].join("\n");
  }
}
```

---

*Isla, Infra Architect — Architecture design complete. Ready for review by Aisha (Backend Architect) and Valentina (Backend Dev). Proceed to WS-10 for implementation.*
