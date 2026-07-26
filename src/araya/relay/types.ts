/**
 * ARAYA Relay Motor — types (REQ-042, per .araya/relay/ schemas).
 * MVP: standard-delivery only.
 */

export const RELAY_STATES = [
  "INTENT", "ROUTING", "PLANNING", "EXECUTING", "TESTING",
  "VERIFYING", "ACCEPTING", "CLOSING", "CLOSED", "ASK", "BLOCKED",
] as const;
export type RelayState = (typeof RELAY_STATES)[number];

export const EVENT_TYPES = [
  "ASSIGN", "CLAIM", "ACK", "DONE", "PASS", "FAIL", "ASK", "BLOCK",
  "DISCREPANCY", "VERIFIED", "ACCEPT", "REJECT", "CLOSE",
  "RELEASE", "EXPIRE", "ESCALATE", "RESOLVE", "NOTE",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const ACTOR_ROLES = [
  "PROFESSOR", "MANU", "AURORA", "SONIA", "SPECIALIST", "TERESA", "ROLANDO", "DANEEL",
] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

export type ClaimStatus = "active" | "acknowledged" | "released" | "expired" | "superseded";

export interface ActorRef {
  actor: string;
  actor_role: ActorRole;
}

export interface Claim {
  claim_id: string;
  actor: string;
  status: ClaimStatus;
  claimed_at: string;
  ack_deadline: string;
  acked_at?: string;
  lease_expires_at: string;
  released_at?: string;
  release_reason?: string;
  abandoned?: boolean;
}

export interface RelayTask {
  task_id: string;
  workflow: string;
  created_at: string;
  created_by: ActorRef;
  version: number;
  state: RelayState;
  state_entered_at: string;
  owner: ActorRef & { suspended?: boolean };
  relay_controller: ActorRef;
  waiting_on?: ActorRef;
  suspended_from_state?: RelayState;
  previous_owner?: ActorRef;
  claim?: Claim | null;
  result?: Record<string, unknown>;
  subject?: Record<string, unknown>;
  attempts: { current: number; max: number };
  replanning: { current: number; max: number };
  notifications: Array<{ at: string; to: string; kind: string; ref?: string }>;
}

export interface RelayEvent {
  event_id: string;
  task_id: string;
  sequence: number;
  event_type: EventType;
  actor: string;
  actor_role: ActorRole;
  timestamp: string;
  task_version_before: number;
  task_version_after: number;
  from_state: RelayState;
  to_state: RelayState;
  correlation_id: string;
  causation_id: string | null;
  idempotency_key: string;
  evidence?: string[];
  message?: string;
  result?: Record<string, unknown>;
}

export interface TransitionSpec {
  state: RelayState;
  owner_role: ActorRole;
  action?: "increment_attempts" | "increment_replanning";
}

export interface StateSpec {
  state: RelayState;
  owner_role: ActorRole;
  allowed_events: EventType[];
  next: Partial<Record<EventType, TransitionSpec>>;
  terminal?: boolean;
}

export const LIMITS = {
  max_attempts: 2,
  max_replanning: 2,
  claim_timeout_seconds: 3600,
  ack_timeout_seconds: 300,
  lock_timeout_seconds: 30,
  force_release_after_seconds: 600,
};

export class RelayError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "RelayError";
  }
}
