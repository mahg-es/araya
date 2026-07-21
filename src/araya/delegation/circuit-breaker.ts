// ARAYA Delegation Broker — Circuit Breaker
// WS-10 Part 1: 3-state sliding-window failure protection
// Spec: .araya/plan/spec/req-001-delegation-architecture.md §6.4
// Isla, Infra Architect — 2026-07-22

import type { CircuitBreakerState } from "./types";

// ─── Interfaces ─────────────────────────────────────────────────────────

export interface CircuitBreakerConfig {
  /** Number of failures in window before opening circuit (default: 5) */
  threshold: number;
  /** Sliding window duration in ms (default: 60_000) */
  windowMs: number;
  /** How long circuit stays open before transitioning to half_open (default: 30_000) */
  cooldownMs: number;
}

interface FailureEntry {
  timestamp: number;
  reason: string;
}

interface AgentCircuit {
  state: CircuitBreakerState;
  failures: FailureEntry[];
  openedAt: number | null;
}

// ─── Circuit Breaker ────────────────────────────────────────────────────

export class CircuitBreaker {
  private circuits = new Map<string, AgentCircuit>();
  private config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      threshold: config?.threshold ?? 5,
      windowMs: config?.windowMs ?? 60_000,
      cooldownMs: config?.cooldownMs ?? 30_000,
    };
  }

  /**
   * Check if a delegation to `agent` is allowed.
   * Returns { allowed, reason }.
   *
   * - CLOSED → allowed
   * - OPEN → check cooldown. If cooldown elapsed, transition to HALF_OPEN and allow (test probe).
   *           If cooldown not elapsed, reject.
   * - HALF_OPEN → allowed (one test probe at a time; we track via state)
   */
  checkBeforeDispatch(agent: string): { allowed: boolean; reason?: string } {
    const circuit = this.circuits.get(agent);
    if (!circuit || circuit.state === "closed") {
      return { allowed: true };
    }

    if (circuit.state === "open") {
      const elapsed = circuit.openedAt ? Date.now() - circuit.openedAt : 0;
      if (elapsed >= this.config.cooldownMs) {
        // Transition to HALF_OPEN — allow one test probe
        circuit.state = "half_open";
        return { allowed: true };
      }
      const remaining = Math.ceil((this.config.cooldownMs - elapsed) / 1000);
      const lastFailure = circuit.failures.length > 0
        ? circuit.failures[circuit.failures.length - 1].reason
        : "unknown";
      return {
        allowed: false,
        reason: `CIRCUIT_OPEN: Agent '${agent}' is temporarily unavailable. ` +
          `Failures: ${circuit.failures.length} in the last ${this.config.windowMs / 1000}s. ` +
          `Last failure: "${lastFailure}". ` +
          `Circuit will re-test in ${remaining}s. Suggestion: wait and retry, or try a different agent.`,
      };
    }

    // HALF_OPEN — one test probe allowed
    return { allowed: true };
  }

  /**
   * Record a successful dispatch/execution for an agent.
   * - HALF_OPEN + success → CLOSE circuit, reset failures
   * - Otherwise no-op (keep closed)
   */
  recordSuccess(agent: string): void {
    const circuit = this.circuits.get(agent);
    if (!circuit) return;

    if (circuit.state === "half_open") {
      circuit.state = "closed";
      circuit.failures = [];
      circuit.openedAt = null;
    }
    // If already closed, nothing to do
  }

  /**
   * Record a failure for an agent.
   * - CLOSED: add to sliding window. If threshold reached → OPEN
   * - HALF_OPEN: test probe failed → back to OPEN, restart cooldown
   * - OPEN: add failure (keeps it open)
   */
  recordFailure(agent: string, reason: string): void {
    const now = Date.now();

    let circuit = this.circuits.get(agent);
    if (!circuit) {
      circuit = { state: "closed", failures: [], openedAt: null };
      this.circuits.set(agent, circuit);
    }

    // Prune failures outside the sliding window
    const cutoff = now - this.config.windowMs;
    circuit.failures = circuit.failures.filter(f => f.timestamp > cutoff);

    // Add new failure
    circuit.failures.push({ timestamp: now, reason });

    if (circuit.state === "half_open") {
      // Test probe failed → back to OPEN, restart cooldown
      circuit.state = "open";
      circuit.openedAt = now;
      return;
    }

    if (circuit.state === "closed" && circuit.failures.length >= this.config.threshold) {
      circuit.state = "open";
      circuit.openedAt = now;
    }

    // If already open, stays open. Cooldown timer not reset — only on half_open failure.
  }

  /**
   * Get the current state of an agent's circuit.
   * Returns "closed" if agent has no circuit (never failed).
   */
  getState(agent: string): CircuitBreakerState {
    return this.circuits.get(agent)?.state ?? "closed";
  }

  /**
   * Get all agent circuit states for health check / observability.
   */
  getAllStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    for (const [agent, circuit] of this.circuits.entries()) {
      states[agent] = circuit.state;
    }
    return states;
  }

  /**
   * Get failure count in current window for an agent.
   */
  getFailureCount(agent: string): number {
    const circuit = this.circuits.get(agent);
    if (!circuit) return 0;
    const cutoff = Date.now() - this.config.windowMs;
    return circuit.failures.filter(f => f.timestamp > cutoff).length;
  }

  /**
   * Reset circuit for a specific agent (for testing / manual intervention).
   */
  reset(agent: string): void {
    this.circuits.delete(agent);
  }

  /**
   * Reset all circuits.
   */
  resetAll(): void {
    this.circuits.clear();
  }

  /**
   * Force-close a circuit (admin override).
   */
  forceClose(agent: string): void {
    const circuit = this.circuits.get(agent);
    if (circuit) {
      circuit.state = "closed";
      circuit.failures = [];
      circuit.openedAt = null;
    }
  }
}
