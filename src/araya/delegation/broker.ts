// ARAYA Delegation Broker — Core Engine
// WS-10 Part 1: delegate, status, list, results, health, persistence, recursion guard
// Spec: .araya/plan/spec/req-001-delegation-architecture.md §3-8
// Isla, Infra Architect — 2026-07-22
//
// Zero external dependencies — Node.js built-ins only.
// No API layer, no extension integration (Valentina's scope).

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, renameSync, unlinkSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

import type {
  DelegationState,
  DelegationEvent,
  DelegationId,
  CorrelationId,
  DelegationRecord,
  DelegateRequest,
  DelegateResponse,
  DelegationStatus,
  DelegationResult,
  DelegationFilter,
  DelegationSummary,
  AncestorChain,
  AuditEntry,
  BrokerConfig,
  BrokerHealth,
  BrokerError,
  ErrorCode,
} from "./types";
import { ErrorCodes, TERMINAL_STATES } from "./types";

import { transition, isTerminal } from "./state-machine";
import { CircuitBreaker } from "./circuit-breaker";

// ─── ID Generation ──────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}_${randomUUID().split("-")[0]}`;
}

// ─── Ancestor Chain ─────────────────────────────────────────────────────

export function buildChildChain(
  parent: AncestorChain,
  parentAgent: string,
  parentDelegationId: string
): AncestorChain {
  return {
    agents: [...parent.agents, parentAgent],
    delegationIds: [...parent.delegationIds, parentDelegationId],
    depth: parent.depth + 1,
  };
}

export function emptyChain(): AncestorChain {
  return { agents: [], delegationIds: [], depth: 0 };
}

// ─── Recursion Validation (DI-004, 3 layers) ───────────────────────────

export interface RecursionCheck {
  allowed: boolean;
  error?: BrokerError;
}

export function validateRecursion(
  targetAgent: string,
  chain: AncestorChain,
  maxDepth: number
): RecursionCheck {
  // Layer 1: Self-delegation
  if (chain.agents.length > 0 && chain.agents[chain.agents.length - 1] === targetAgent) {
    return {
      allowed: false,
      error: {
        code: ErrorCodes.SELF_DELEGATION,
        message: `Agent '${targetAgent}' cannot delegate to itself.`,
        detail: `The requesting agent is the same as the target agent. Choose a different specialist.`,
      },
    };
  }

  // Determine the full chain including the new target
  const fullChain = [...chain.agents, targetAgent];

  // Layer 2: Cycle detection
  const cycleIndex = chain.agents.indexOf(targetAgent);
  if (cycleIndex >= 0) {
    const cycle = chain.agents.slice(cycleIndex).join(" → ") + " → " + targetAgent;
    return {
      allowed: false,
      error: {
        code: ErrorCodes.CYCLE_DETECTED,
        message: `CYCLE_DETECTED: '${targetAgent}' is already in the delegation chain (${cycle}).`,
        detail: `Delegation loop detected. Restructure workflow to avoid cycles.`,
      },
    };
  }

  // Layer 3: Max depth
  const newDepth = chain.depth + 1;
  if (newDepth > maxDepth) {
    return {
      allowed: false,
      error: {
        code: ErrorCodes.MAX_DEPTH_EXCEEDED,
        message: `MAX_DEPTH_EXCEEDED: delegation depth would be ${newDepth}, max is ${maxDepth}.`,
        detail: `Flatten the delegation hierarchy or increase maxDepth in broker config.`,
      },
    };
  }

  return { allowed: true };
}

// ─── Atomic File Write (write-ahead via temp + rename) ──────────────────

function atomicWrite(filePath: string, content: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const tmpPath = filePath + ".tmp." + randomUUID().split("-")[0];
  writeFileSync(tmpPath, content, "utf-8");
  renameSync(tmpPath, filePath);
}

function atomicAppend(filePath: string, line: string): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, line + "\n", { flag: "a", encoding: "utf-8" });
}

// ─── Broker Handle ──────────────────────────────────────────────────────

interface BrokerStore {
  /** All records indexed by delegationId */
  records: Map<DelegationId, DelegationRecord>;
  /** correlationId → delegationId for idempotency */
  correlationIndex: Map<CorrelationId, DelegationId>;
  /** Agent → count of active (non-terminal) delegations */
  activeByAgent: Map<string, number>;
  failureCount: number;
  totalDelegations: number;
}

export interface BrokerHandle {
  config: BrokerConfig;
  store: BrokerStore;
  circuitBreaker: CircuitBreaker;
  startedAt: number;
}

// ─── Broker Initialization ──────────────────────────────────────────────

export function initBroker(config: BrokerConfig): BrokerHandle {
  const evidenceDir = resolve(config.arayaRoot, config.evidenceBasePath);
  if (!existsSync(evidenceDir)) {
    mkdirSync(evidenceDir, { recursive: true });
  }

  const handle: BrokerHandle = {
    config: { ...config },
    store: {
      records: new Map(),
      correlationIndex: new Map(),
      activeByAgent: new Map(),
      failureCount: 0,
      totalDelegations: 0,
    },
    circuitBreaker: new CircuitBreaker({
      threshold: config.circuitBreakerThreshold,
      windowMs: config.circuitBreakerWindowMs,
      cooldownMs: config.circuitBreakerCooldownMs,
    }),
    startedAt: Date.now(),
  };

  // Crash recovery: scan for stale delegations
  recoverStaleDelegations(handle);

  return handle;
}

// ─── Crash Recovery ─────────────────────────────────────────────────────

function recoverStaleDelegations(handle: BrokerHandle): void {
  const runsDir = resolve(handle.config.arayaRoot, handle.config.evidenceBasePath);
  if (!existsSync(runsDir)) return;

  // Find all delegation directories
  let entries: string[];
  try {
    entries = readdirSync(runsDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.startsWith("del_")) continue;
    const metaPath = resolve(runsDir, entry, "metadata.json");
    if (!existsSync(metaPath)) continue;

    try {
      const raw = readFileSync(metaPath, "utf-8");
      const record: DelegationRecord = JSON.parse(raw);

      // Only recover non-terminal delegations
      if (TERMINAL_STATES.has(record.status)) continue;

      const elapsed = Date.now() - record.createdAt;
      if (elapsed > record.timeoutMs * 2) {
        // Stale: mark as timeout
        appendAudit(handle, record, {
          timestamp: Date.now(),
          event: "RECOVERY_TIMEOUT",
          from: record.status,
          to: "timeout",
          actor: "system",
          detail: `Stale delegation recovered: elapsed ${elapsed}ms > 2× timeout ${record.timeoutMs}ms`,
        });
        record.status = "timeout";
        record.completedAt = Date.now();
        persistRecord(handle, record);
        handle.store.failureCount++;
      } else if (record.status === "dispatched" || record.status === "running") {
        // Re-load into memory for continued tracking
        handle.store.records.set(record.delegationId, record);
        handle.store.correlationIndex.set(record.correlationId, record.delegationId);
        incrementActive(handle, record.dispatchedTo);
        handle.store.totalDelegations++;
      }
    } catch {
      // Corrupt metadata — skip
    }
  }
}

// ─── Audit ──────────────────────────────────────────────────────────────

function appendAudit(handle: BrokerHandle, record: DelegationRecord, entry: AuditEntry): void {
  record.auditLog.push(entry);
  const auditPath = resolve(
    handle.config.arayaRoot,
    handle.config.evidenceBasePath,
    record.delegationId,
    "audit.jsonl"
  );
  atomicAppend(auditPath, JSON.stringify(entry));
}

// ─── Persistence ────────────────────────────────────────────────────────

function persistRecord(handle: BrokerHandle, record: DelegationRecord): void {
  const dir = resolve(
    handle.config.arayaRoot,
    handle.config.evidenceBasePath,
    record.delegationId
  );

  // Write audit log (write-ahead: audit before metadata)
  const auditPath = resolve(dir, "audit.jsonl");
  const auditLines = record.auditLog.map(e => JSON.stringify(e)).join("\n");
  if (auditLines) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(auditPath, auditLines + "\n", "utf-8");
  }

  // Write metadata atomically
  const metaPath = resolve(dir, "metadata.json");
  const metadata = { ...record };
  // Don't duplicate audit log in metadata (it's in audit.jsonl)
  atomicWrite(metaPath, JSON.stringify(metadata, null, 2));

  // Write output.md if output exists
  if (record.output) {
    const outputPath = resolve(dir, "output.md");
    atomicWrite(outputPath, record.output);
  }
}

function loadRecord(handle: BrokerHandle, delegationId: string): DelegationRecord | null {
  const metaPath = resolve(
    handle.config.arayaRoot,
    handle.config.evidenceBasePath,
    delegationId,
    "metadata.json"
  );
  if (!existsSync(metaPath)) return null;

  try {
    return JSON.parse(readFileSync(metaPath, "utf-8"));
  } catch {
    return null;
  }
}

// ─── Active Count Tracking ──────────────────────────────────────────────

function incrementActive(handle: BrokerHandle, agent: string): void {
  const count = handle.store.activeByAgent.get(agent) ?? 0;
  handle.store.activeByAgent.set(agent, count + 1);
}

function decrementActive(handle: BrokerHandle, agent: string): void {
  const count = handle.store.activeByAgent.get(agent) ?? 0;
  if (count <= 1) {
    handle.store.activeByAgent.delete(agent);
  } else {
    handle.store.activeByAgent.set(agent, count - 1);
  }
}

function getActiveCount(handle: BrokerHandle): number {
  let total = 0;
  for (const count of handle.store.activeByAgent.values()) {
    total += count;
  }
  return total;
}

// ─── State Transition (with persistence) ─────────────────────────────────

function applyTransition(
  handle: BrokerHandle,
  record: DelegationRecord,
  event: DelegationEvent
): DelegationState {
  const from = record.status;
  let next: DelegationState;

  try {
    next = transition(from, event);
  } catch (err: any) {
    appendAudit(handle, record, {
      timestamp: Date.now(),
      event: "INVALID_TRANSITION_ATTEMPTED",
      from,
      actor: "system",
      detail: err.message,
    });
    throw err;
  }

  record.status = next;

  // Update timestamps
  const now = Date.now();
  if (next === "dispatched") record.dispatchedAt = now;
  if (next === "running") record.runningAt = now;
  if (isTerminal(next)) {
    record.completedAt = now;
    decrementActive(handle, record.dispatchedTo);
    if (next === "failed" || next === "timeout") {
      handle.store.failureCount++;
    }
  }

  appendAudit(handle, record, {
    timestamp: now,
    event: `STATE_CHANGE`,
    from,
    to: next,
    actor: "system",
  });

  persistRecord(handle, record);
  return next;
}

// ─── Core API: delegate ─────────────────────────────────────────────────

export function delegate(handle: BrokerHandle, request: DelegateRequest): DelegateResponse {
  const now = Date.now();

  // ── Idempotency check ──
  if (request.correlationId) {
    const existingDelegationId = handle.store.correlationIndex.get(request.correlationId);
    if (existingDelegationId) {
      const existing = handle.store.records.get(existingDelegationId) ??
        loadRecord(handle, existingDelegationId);
      if (existing) {
        return {
          accepted: true,
          delegationId: existing.delegationId,
          correlationId: existing.correlationId,
          status: existing.status,
          reason: `DUPLICATE_CORRELATION: delegation with correlation_id '${request.correlationId}' already exists. Use existing delegation_id to query status.`,
        };
      }
    }
  }

  // ── Concurrency check ──
  const active = getActiveCount(handle);
  if (active >= handle.config.maxConcurrentDelegations) {
    return {
      accepted: false,
      reason: `MAX_CONCURRENT: ${active} active delegations, max is ${handle.config.maxConcurrentDelegations}. Wait for some to complete.`,
    };
  }

  // ── Validate targetAgent and requestedBy are non-empty ──
  if (!request.targetAgent || typeof request.targetAgent !== "string" || request.targetAgent.trim().length === 0) {
    return { accepted: false, reason: "targetAgent is required and must be a non-empty string." };
  }
  if (!request.requestedBy || typeof request.requestedBy !== "string" || request.requestedBy.trim().length === 0) {
    return { accepted: false, reason: "requestedBy is required and must be a non-empty string." };
  }
  if (!request.task || typeof request.task !== "string" || request.task.trim().length === 0) {
    return { accepted: false, reason: "task is required and must be a non-empty string." };
  }

  const targetAgent = request.targetAgent.trim();
  const requestedBy = request.requestedBy.trim();
  const task = request.task.trim();

  // ── Build ancestor chain ──
  // NEVER from user input — always built server-side
  const chain: AncestorChain = request.ancestorChain
    ? { ...request.ancestorChain }
    : emptyChain();

  // ── Recursion check (DI-004) ──
  const recursionCheck = validateRecursion(targetAgent, chain, handle.config.maxDepth);
  if (!recursionCheck.allowed) {
    return {
      accepted: false,
      reason: recursionCheck.error!.message,
      suggestions: recursionCheck.error!.suggestions,
    };
  }

  // ── Circuit breaker check ──
  const cbCheck = handle.circuitBreaker.checkBeforeDispatch(targetAgent);
  if (!cbCheck.allowed) {
    return {
      accepted: false,
      reason: cbCheck.reason ?? `CIRCUIT_OPEN: Agent '${targetAgent}' is temporarily unavailable.`,
    };
  }

  // ── Build the delegation ──
  const delegationId = generateId("del");
  const correlationId = request.correlationId ?? generateId("cor");
  const timeoutMs = request.timeoutMs ?? handle.config.defaultTimeoutMs;

  const childChain = buildChildChain(chain, requestedBy, delegationId);

  const record: DelegationRecord = {
    delegationId,
    correlationId,
    sessionId: request.sessionId,
    status: "pending",
    requestedBy,
    dispatchedTo: targetAgent,
    task,
    parentDelegationId: request.parentDelegationId,
    ancestorChain: childChain,
    depth: childChain.depth,
    timeoutMs,
    createdAt: now,
    risks: [],
    blockers: [],
    auditLog: [],
  };

  // ── Validate: PENDING → DISPATCHED ──
  try {
    applyTransition(handle, record, "VALIDATE_PASS");
  } catch (err: any) {
    applyTransition(handle, record, "VALIDATE_FAIL");
    return {
      accepted: false,
      reason: `VALIDATION_FAILED: ${err.message}`,
    };
  }

  // ── Store in memory ──
  handle.store.records.set(delegationId, record);
  handle.store.correlationIndex.set(correlationId, delegationId);
  handle.store.totalDelegations++;
  incrementActive(handle, targetAgent);

  // Persist
  persistRecord(handle, record);

  return {
    accepted: true,
    delegationId,
    correlationId,
    status: record.status,
  };
}

// ─── Core API: getStatus ────────────────────────────────────────────────

export function getStatus(
  handle: BrokerHandle,
  delegationId: string
): DelegationStatus | null {
  // Check memory first, then filesystem
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return null;

  return {
    delegationId: record.delegationId,
    correlationId: record.correlationId,
    status: record.status,
    requestedBy: record.requestedBy,
    dispatchedTo: record.dispatchedTo,
    task: record.task,
    depth: record.depth,
    sessionId: record.sessionId,
    parentDelegationId: record.parentDelegationId,
    createdAt: record.createdAt,
    dispatchedAt: record.dispatchedAt,
    runningAt: record.runningAt,
    completedAt: record.completedAt,
  };
}

// ─── Core API: listDelegations ──────────────────────────────────────────

export function listDelegations(
  handle: BrokerHandle,
  filter?: DelegationFilter
): DelegationSummary[] {
  // Collect from memory and filesystem
  const allRecords: DelegationRecord[] = [...handle.store.records.values()];

  // Also scan filesystem for persisted records not in memory
  const runsDir = resolve(handle.config.arayaRoot, handle.config.evidenceBasePath);
  if (existsSync(runsDir)) {
    try {
      for (const entry of readdirSync(runsDir)) {
        if (!entry.startsWith("del_")) continue;
        if (handle.store.records.has(entry)) continue; // already in memory
        const loaded = loadRecord(handle, entry);
        if (loaded) allRecords.push(loaded);
      }
    } catch { /* ignore scan errors */ }
  }

  // Apply filters
  let filtered = allRecords;

  if (filter?.sessionId) {
    filtered = filtered.filter(r => r.sessionId === filter.sessionId);
  }
  if (filter?.agent) {
    filtered = filtered.filter(
      r => r.requestedBy === filter.agent || r.dispatchedTo === filter.agent
    );
  }
  if (filter?.status) {
    filtered = filtered.filter(r => r.status === filter.status);
  }

  // Sort by createdAt desc
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  // Apply limit
  if (filter?.limit && filter.limit > 0) {
    filtered = filtered.slice(0, filter.limit);
  }

  return filtered.map(r => ({
    delegationId: r.delegationId,
    status: r.status,
    requestedBy: r.requestedBy,
    dispatchedTo: r.dispatchedTo,
    task: r.task,
    createdAt: r.createdAt,
    sessionId: r.sessionId,
    depth: r.depth,
  }));
}

// ─── Core API: getResult ────────────────────────────────────────────────

export function getResult(
  handle: BrokerHandle,
  delegationId: string
): DelegationResult | null {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return null;

  // Load output from output.md if not in memory
  let output = record.output ?? "";
  if (!output) {
    const outputPath = resolve(
      handle.config.arayaRoot,
      handle.config.evidenceBasePath,
      delegationId,
      "output.md"
    );
    if (existsSync(outputPath)) {
      try {
        output = readFileSync(outputPath, "utf-8");
      } catch { /* ignore read errors */ }
    }
  }

  return {
    delegationId: record.delegationId,
    correlationId: record.correlationId,
    sessionId: record.sessionId,
    status: record.status,
    requestedBy: record.requestedBy,
    dispatchedTo: record.dispatchedTo,
    task: record.task,
    taskType: record.taskType,
    createdAt: record.createdAt,
    dispatchedAt: record.dispatchedAt,
    runningAt: record.runningAt,
    completedAt: record.completedAt,
    durationMs: record.completedAt && record.runningAt
      ? record.completedAt - record.runningAt
      : undefined,
    confidence: record.confidence,
    risks: record.risks,
    blockers: record.blockers,
    output,
    outputFormat: record.outputFormat ?? "markdown",
    parentDelegationId: record.parentDelegationId,
    depth: record.depth,
  };
}

// ─── Core API: cancel ───────────────────────────────────────────────────

export function cancel(
  handle: BrokerHandle,
  delegationId: string,
  reason: string
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  if (isTerminal(record.status)) return false;

  try {
    applyTransition(handle, record, "CANCEL");
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: recordDispatch (called by dispatcher when agent is invoked)

export function recordDispatch(
  handle: BrokerHandle,
  delegationId: string
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  try {
    applyTransition(handle, record, "DISPATCH");
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: recordRunning (called when agent acknowledges execution) ──

export function recordRunning(
  handle: BrokerHandle,
  delegationId: string
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  try {
    applyTransition(handle, record, "RUNNING");
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: recordCompletion ─────────────────────────────────────────

export function recordCompletion(
  handle: BrokerHandle,
  delegationId: string,
  output: string,
  opts?: {
    confidence?: number;
    risks?: import("./types").RiskEntry[];
    blockers?: import("./types").BlockerEntry[];
    outputFormat?: "markdown" | "json";
  }
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  record.output = output;
  record.outputFormat = opts?.outputFormat ?? "markdown";
  record.confidence = opts?.confidence;
  if (opts?.risks) record.risks = opts.risks;
  if (opts?.blockers) record.blockers = opts.blockers;

  try {
    applyTransition(handle, record, "COMPLETE");
    // Record success in circuit breaker
    handle.circuitBreaker.recordSuccess(record.dispatchedTo);
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: recordFailure ────────────────────────────────────────────

export function recordFailure(
  handle: BrokerHandle,
  delegationId: string,
  reason: string
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  try {
    applyTransition(handle, record, "FAIL");
    handle.circuitBreaker.recordFailure(record.dispatchedTo, reason);
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: recordTimeout ────────────────────────────────────────────

export function recordTimeout(
  handle: BrokerHandle,
  delegationId: string
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  try {
    applyTransition(handle, record, "TIMEOUT");
    handle.circuitBreaker.recordFailure(
      record.dispatchedTo,
      `timeout after ${record.timeoutMs}ms`
    );
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: recordBlocked ────────────────────────────────────────────

export function recordBlocked(
  handle: BrokerHandle,
  delegationId: string
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  try {
    applyTransition(handle, record, "BLOCK");
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: recordUnblocked ──────────────────────────────────────────

export function recordUnblocked(
  handle: BrokerHandle,
  delegationId: string
): boolean {
  let record = handle.store.records.get(delegationId);
  if (!record) {
    record = loadRecord(handle, delegationId);
  }
  if (!record) return false;

  try {
    applyTransition(handle, record, "UNBLOCK");
    return true;
  } catch {
    return false;
  }
}

// ─── Core API: healthCheck ──────────────────────────────────────────────

export function healthCheck(handle: BrokerHandle): BrokerHealth {
  return {
    initialized: true,
    startedAt: handle.startedAt,
    uptimeMs: Date.now() - handle.startedAt,
    activeDelegations: getActiveCount(handle),
    totalDelegations: handle.store.totalDelegations,
    failureCount: handle.store.failureCount,
    circuitBreakers: handle.circuitBreaker.getAllStates(),
  };
}

// ─── Utility: getRecord (for tests/debug) ───────────────────────────────

export function getRecord(
  handle: BrokerHandle,
  delegationId: string
): DelegationRecord | null {
  return handle.store.records.get(delegationId) ?? loadRecord(handle, delegationId);
}
