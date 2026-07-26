/**
 * ARAYA Relay Motor — state machine core (REQ-042).
 * Invariants (workflow.yaml + acceptance-test-spec):
 *   single active owner; controller (daneel) never functional owner;
 *   no state skip; no self-approval; actor never chooses next owner;
 *   ASK/BLOCK suspend owner (never replaced); evidence required for
 *   DONE/PASS/VERIFIED/ACCEPT; append-only events; idempotency; retired
 *   agents rejected pre-persistence.
 */
import { load as yamlLoad } from "js-yaml";
import * as fs from "node:fs";
import * as path from "node:path";
import { RelayStore, newId, nowIso, plusSeconds } from "./store";
import { STANDARD_DELIVERY } from "./workflow-standard-delivery";
import {
  ActorRole, EventType, LIMITS, RelayError, RelayEvent, RelayState, RelayTask, StateSpec,
} from "./types";

const EVIDENCE_REQUIRED: Partial<Record<EventType, string>> = {
  DONE: "DONE requires at least one evidence reference",
  PASS: "PASS requires test report evidence",
  VERIFIED: "VERIFIED requires audit evidence",
  ACCEPT: "ACCEPT requires acceptance evidence",
};
const MESSAGE_REQUIRED: Partial<Record<EventType, string>> = {
  ASK: "ASK requires a message describing the decision needed",
  BLOCK: "BLOCK requires a message describing the blocker",
  FAIL: "FAIL requires a failure message",
  DISCREPANCY: "DISCREPANCY requires a message describing the divergence",
  REJECT: "REJECT requires a reason",
};

export interface ActorRegistry {
  activeAgents: Set<string>;
  retiredAgents: Set<string>;
  dormantAgents: Set<string>;
  specialists: Set<string>;
}

export function loadActorRegistry(root: string): ActorRegistry {
  const yaml = yamlLoad(fs.readFileSync(path.join(root, "araya.yaml"), "utf-8")) as {
    agents?: Record<string, { status?: string }>;
  };
  const agents = Object.keys(yaml.agents ?? {});
  const dormant = new Set(
    agents.filter((a) => (yaml.agents?.[a] as { status?: string }).status === "dormant")
  );
  const retired = new Set<string>(["giskard"]);
  try {
    const data = JSON.parse(
      fs.readFileSync(path.join(root, ".araya", "governance", "retired-agents.json"), "utf-8")
    );
    for (const r of data.retired_agents ?? []) retired.add(String(r.id).toLowerCase());
  } catch { /* fallback already set */ }
  const active = new Set(agents.filter((a) => !dormant.has(a)));
  active.add("professor"); // strategic authority is not an araya.yaml agent but is a valid Relay actor (escalations, BLOCK targets)
  const specialists = new Set(["valentina", "alejandra", "bernabe", "maria", "aquila", "clara"]);
  return { activeAgents: active, retiredAgents: retired, dormantAgents: dormant, specialists };
}

export class RelayMotor {
  readonly store: RelayStore;
  readonly registry: ActorRegistry;
  readonly workflow: StateSpec[];

  constructor(readonly projectRoot: string, workflow: StateSpec[] = STANDARD_DELIVERY) {
    this.store = new RelayStore(projectRoot);
    this.registry = loadActorRegistry(projectRoot);
    this.workflow = workflow;
  }

  private stateSpec(state: RelayState): StateSpec {
    const s = this.workflow.find((w) => w.state === state);
    if (!s) throw new RelayError("INVALID_STATE", `state not in workflow: ${state}`);
    return s;
  }

  private validateActor(actor: string): void {
    const a = actor.toLowerCase();
    if (this.registry.retiredAgents.has(a)) {
      throw new RelayError("RETIRED_OPERATIONAL_ACTOR", `${actor} is retired — no operational role`);
    }
    if (!this.registry.activeAgents.has(a)) {
      if (this.registry.dormantAgents.has(a)) {
        throw new RelayError(
          "DORMANT_ACTOR",
          `${actor} is dormant — activation requires Aurora authorization (capability gap + sponsor + limits + duration + evidence)`
        );
      }
      throw new RelayError("UNKNOWN_ACTOR", `unknown actor (fail closed): ${actor}`);
    }
  }

  roleOf(actor: string): ActorRole {
    const a = actor.toLowerCase();
    if (a === "professor") return "PROFESSOR";
    if (a === "manu") return "MANU";
    if (a === "aurora") return "AURORA";
    if (a === "sonia") return "SONIA";
    if (a === "teresa") return "TERESA";
    if (a === "rolando") return "ROLANDO";
    if (a === "daneel") return "DANEEL";
    if (this.registry.specialists.has(a)) return "SPECIALIST";
    return "SPECIALIST";
  }

  /** araya relay init — create task in INTENT, owner manu. */
  init(input: {
    task_id: string;
    created_by: string;
    subject?: Record<string, unknown>;
  }): RelayTask {
    this.validateActor(input.created_by);
    const creatorRole = this.roleOf(input.created_by);
    if (creatorRole !== "PROFESSOR" && creatorRole !== "MANU" && creatorRole !== "DANEEL") {
      throw new RelayError("AUTHORITY_VIOLATION", `task creation allowed for professor/manu/daneel (coordinator), not ${input.created_by}`);
    }
    if (this.store.exists(input.task_id)) {
      throw new RelayError("DUPLICATE_TASK", `task already exists: ${input.task_id}`);
    }
    const now = nowIso();
    const task: RelayTask = {
      task_id: input.task_id,
      workflow: "standard-delivery",
      created_at: now,
      created_by: { actor: input.created_by.toLowerCase(), actor_role: creatorRole },
      version: 1,
      state: "INTENT",
      state_entered_at: now,
      owner: { actor: "manu", actor_role: "MANU" },
      relay_controller: { actor: "daneel", actor_role: "DANEEL" },
      subject: input.subject,
      attempts: { current: 1, max: LIMITS.max_attempts },
      replanning: { current: 0, max: LIMITS.max_replanning },
      notifications: [],
    };
    this.store.writeTask(task);
    const ev = this.buildAssignEvent(task, input.created_by);
    this.store.appendEvent(ev);
    task.version = 2;
    this.store.writeTask(task, 1);
    return task;
  }

  /** araya relay inbox — pending handoffs for an actor. */
  inbox(actor: string): RelayTask[] {
    this.validateActor(actor);
    const a = actor.toLowerCase();
    const role = this.roleOf(a);
    return this.store
      .listTasks()
      .map((id) => this.store.readTask(id))
      .filter((t) => {
        if (t.state === "CLOSED") return false;
        if (t.state === "ASK" || t.state === "BLOCKED") {
          return t.waiting_on?.actor === a || t.relay_controller.actor === a;
        }
        const spec = this.stateSpec(t.state);
        if (spec.owner_role === "SPECIALIST") {
          return role === "SPECIALIST" && (t.owner.actor === a || (!t.claim && t.owner.actor === a) || t.owner.actor === a);
        }
        return t.owner.actor === a;
      });
  }

  /** araya relay claim — acquire lease on a task. */
  claim(taskId: string, actor: string): RelayTask {
    this.validateActor(actor);
    const release = this.store.acquireLock(taskId);
    try {
      const task = this.store.readTask(taskId);
      const a = actor.toLowerCase();
      this.sweepClaim(task);
      // Claim availability precedes owner-match (T-001: "task already claimed by X")
      if (task.claim && (task.claim.status === "active" || task.claim.status === "acknowledged")) {
        if (task.claim.actor === a) {
          return task; // idempotent re-claim by same actor
        }
        throw new RelayError("ALREADY_CLAIMED", `task already claimed by ${task.claim.actor}`);
      }
      if (task.claim?.abandoned && task.claim.actor === a) {
        throw new RelayError("PREVIOUSLY_ABANDONED", "previously abandoned — re-assignment required");
      }
      this.assertCanActOnState(task, a, "CLAIM");
      const now = nowIso();
      task.claim = {
        claim_id: newId("claim"),
        actor: a,
        status: "active",
        claimed_at: now,
        ack_deadline: plusSeconds(now, LIMITS.ack_timeout_seconds),
        lease_expires_at: plusSeconds(now, LIMITS.claim_timeout_seconds),
      };
      task.notifications.push({ at: now, to: a, kind: "CLAIM", ref: task.claim.claim_id });
      this.store.writeTask(task, task.version);
      return this.store.readTask(taskId);
    } finally {
      release();
    }
  }

  /** araya relay ack — acknowledge a claim within its deadline. */
  ack(taskId: string, actor: string): RelayTask {
    this.validateActor(actor);
    const release = this.store.acquireLock(taskId);
    try {
      const task = this.store.readTask(taskId);
      const a = actor.toLowerCase();
      if (!task.claim || task.claim.actor !== a) {
        throw new RelayError("NOT_CLAIMANT", `${actor} holds no claim on ${taskId}`);
      }
      this.sweepClaim(task);
      if (task.claim.status === "expired") {
        throw new RelayError("CLAIM_EXPIRED", `claim expired after ack deadline ${task.claim.ack_deadline}`);
      }
      if (task.claim.status !== "active") {
        throw new RelayError("INVALID_CLAIM_STATE", `cannot ACK claim in status ${task.claim.status}`);
      }
      const now = nowIso();
      if (Date.parse(now) > Date.parse(task.claim.ack_deadline)) {
        task.claim.status = "expired";
        this.store.writeTask(task, task.version);
        this.emit(task, "EXPIRE", "daneel", { message: "ack deadline exceeded" });
        throw new RelayError("CLAIM_EXPIRED", `claim expired after ack deadline`);
      }
      task.claim.status = "acknowledged";
      task.claim.acked_at = now;
      task.notifications.push({ at: now, to: a, kind: "ACK", ref: task.claim.claim_id });
      this.store.writeTask(task, task.version);
      return this.store.readTask(taskId);
    } finally {
      release();
    }
  }

  /** araya relay return — return the ball with result + evidence. */
  returnBall(taskId: string, actor: string, eventType: EventType, payload: {
    evidence?: string[];
    message?: string;
    result?: Record<string, unknown>;
    idempotency_key?: string;
  }): RelayTask {
    this.validateActor(actor);
    const release = this.store.acquireLock(taskId);
    try {
      const task = this.store.readTask(taskId);
      const a = actor.toLowerCase();
      const ev = this.buildAndValidateEvent(task, a, eventType, payload);
      this.applyTransition(task, ev);
      return this.store.readTask(taskId);
    } finally {
      release();
    }
  }

  /** Controller actions: RESOLVE / ESCALATE / RELEASE / NOTE / EXPIRE sweeps. */
  control(taskId: string, actor: string, eventType: EventType, payload: {
    evidence?: string[]; message?: string; result?: Record<string, unknown>; idempotency_key?: string;
  }): RelayTask {
    this.validateActor(actor);
    const a = actor.toLowerCase();
    if (a !== "daneel" && eventType !== "ESCALATE") {
      throw new RelayError("AUTHORITY_VIOLATION", `${eventType} is a controller (daneel) action`);
    }
    const release = this.store.acquireLock(taskId);
    try {
      const task = this.store.readTask(taskId);
      const ev = this.buildAndValidateEvent(task, a, eventType, payload, true);
      this.applyTransition(task, ev);
      return this.store.readTask(taskId);
    } finally {
      release();
    }
  }

  status(taskId: string): RelayTask {
    const release = this.store.acquireLock(taskId, 5);
    try {
      const task = this.store.readTask(taskId);
      this.sweepClaim(task);
      return task;
    } finally {
      release();
    }
  }

  /** Expire stale claims (ack deadline / lease timeout). */
  private sweepClaim(task: RelayTask): void {
    if (!task.claim) return;
    const now = Date.now();
    const c = task.claim;
    if (c.status === "active" && Date.parse(c.ack_deadline) < now) {
      c.status = "expired";
      task.notifications.push({ at: new Date(now).toISOString(), to: c.actor, kind: "EXPIRE", ref: c.claim_id });
      this.store.writeTask(task, task.version);
      this.store.appendEvent(this.controllerEvent(task, "EXPIRE", `claim expired: no ACK within ${LIMITS.ack_timeout_seconds}s`));
    } else if (c.status === "acknowledged" && Date.parse(c.lease_expires_at) < now) {
      c.status = "expired";
      task.notifications.push({ at: new Date(now).toISOString(), to: c.actor, kind: "EXPIRE", ref: c.claim_id });
      this.store.writeTask(task, task.version);
      this.store.appendEvent(this.controllerEvent(task, "EXPIRE", "claim lease expired"));
    }
  }

  private buildAssignEvent(task: RelayTask, actor: string): RelayEvent {
    return {
      event_id: newId("evt"),
      task_id: task.task_id,
      sequence: 1,
      event_type: "ASSIGN",
      actor: actor.toLowerCase(),
      actor_role: this.roleOf(actor),
      timestamp: nowIso(),
      task_version_before: 1,
      task_version_after: 2,
      from_state: "INTENT",
      to_state: "INTENT",
      correlation_id: task.task_id,
      causation_id: null,
      idempotency_key: newId("idem"),
      evidence: [],
      message: "task created",
    };
  }

  private controllerEvent(task: RelayTask, eventType: EventType, message: string): RelayEvent {
    return {
      event_id: newId("evt"),
      task_id: task.task_id,
      sequence: this.store.readEvents(task.task_id).length + 1,
      event_type: eventType,
      actor: "daneel",
      actor_role: "DANEEL",
      timestamp: nowIso(),
      task_version_before: task.version,
      task_version_after: task.version,
      from_state: task.state,
      to_state: task.state,
      correlation_id: task.task_id,
      causation_id: null,
      idempotency_key: newId("idem"),
      message,
    };
  }

  private assertCanActOnState(task: RelayTask, actor: string, eventType: EventType): void {
    if (task.state === "ASK" || task.state === "BLOCKED") {
      throw new RelayError(
        "STATE_SUSPENDED",
        `task is ${task.state} — only RESOLVE/ESCALATE (controller) or NOTE are allowed`
      );
    }
    if (task.state === "CLOSED") {
      throw new RelayError("TASK_CLOSED", "task is CLOSED (terminal)");
    }
    const spec = this.stateSpec(task.state);
    const actorRole = this.roleOf(actor);
    if (actorRole === "DANEEL") {
      throw new RelayError(
        "CONTROLLER_NOT_OWNER",
        "daneel is relay_controller, not functional owner"
      );
    }
    if (spec.owner_role === "SPECIALIST") {
      if (actorRole !== "SPECIALIST") {
        throw new RelayError(
          "AUTHORITY_VIOLATION",
          `actor ${actor} is not current owner (${task.owner.actor})`
        );
      }
    } else if (actorRole !== spec.owner_role) {
      throw new RelayError(
        "AUTHORITY_VIOLATION",
        `actor ${actor} is not current owner (${task.owner.actor})`
      );
    }
    if (task.owner.actor !== actor) {
      throw new RelayError(
        "AUTHORITY_VIOLATION",
        `actor ${actor} is not current owner (${task.owner.actor})`
      );
    }
  }

  private buildAndValidateEvent(
    task: RelayTask,
    actor: string,
    eventType: EventType,
    payload: { evidence?: string[]; message?: string; result?: Record<string, unknown>; idempotency_key?: string },
    controllerAction = false
  ): RelayEvent {
    const a = actor.toLowerCase();
    if (this.registry.retiredAgents.has(a)) {
      throw new RelayError("RETIRED_OPERATIONAL_ACTOR", `${actor} is retired — no operational role`);
    }

    if (!controllerAction) {
      this.assertCanActOnState(task, a, eventType);
    }

    if (task.state === "ASK" || task.state === "BLOCKED") {
      if (!["RESOLVE", "ESCALATE", "NOTE"].includes(eventType)) {
        throw new RelayError("STATE_SUSPENDED", `only RESOLVE/ESCALATE/NOTE allowed while ${task.state}`);
      }
    } else if (task.state === "CLOSED") {
      if (eventType !== "NOTE") throw new RelayError("TASK_CLOSED", "task is CLOSED (terminal)");
    } else if (!controllerAction) {
      const spec = this.stateSpec(task.state);
      if (!spec.allowed_events.includes(eventType)) {
        throw new RelayError(
          "INVALID_TRANSITION",
          `event ${eventType} not allowed in state ${task.state} (allowed: ${spec.allowed_events.join(", ")})`
        );
      }
    }

    const needEvidence = EVIDENCE_REQUIRED[eventType];
    if (needEvidence && (!payload.evidence || payload.evidence.length === 0)) {
      throw new RelayError("EVIDENCE_REQUIRED", needEvidence);
    }
    const needMessage = MESSAGE_REQUIRED[eventType];
    if (needMessage && (!payload.message || payload.message.trim().length === 0)) {
      throw new RelayError("MESSAGE_REQUIRED", needMessage);
    }

    return {
      event_id: newId("evt"),
      task_id: task.task_id,
      sequence: this.store.readEvents(task.task_id).length + 1,
      event_type: eventType,
      actor: a,
      actor_role: this.roleOf(a),
      timestamp: nowIso(),
      task_version_before: task.version,
      task_version_after: task.version + 1,
      from_state: task.state,
      to_state: task.state, // updated in applyTransition
      correlation_id: task.task_id,
      causation_id: null,
      idempotency_key: payload.idempotency_key ?? newId("idem"),
      evidence: payload.evidence,
      message: payload.message,
      result: payload.result,
    };
  }

  private applyTransition(task: RelayTask, ev: RelayEvent): void {
    const expectedVersion = task.version;
    const fromState = task.state;

    if (ev.event_type === "NOTE") {
      ev.task_version_after = task.version;
      ev.to_state = fromState;
      this.store.appendEvent(ev);
      return;
    }

    if (ev.event_type === "RESOLVE") {
      if (task.state !== "ASK" && task.state !== "BLOCKED") {
        throw new RelayError("INVALID_TRANSITION", "RESOLVE allowed only from ASK/BLOCKED");
      }
      const resume = task.suspended_from_state;
      if (!resume) throw new RelayError("INVALID_STATE", "no suspended_from_state recorded");
      ev.to_state = resume;
      task.state = resume;
      task.state_entered_at = ev.timestamp;
      task.owner.suspended = false;
      task.waiting_on = undefined;
      task.suspended_from_state = undefined;
      ev.task_version_after = task.version + 1;
      task.version += 1;
    } else if (ev.event_type === "ESCALATE") {
      if (task.state !== "ASK" && task.state !== "BLOCKED") {
        throw new RelayError("INVALID_TRANSITION", "ESCALATE allowed only from ASK/BLOCKED");
      }
      ev.to_state = task.state;
      ev.task_version_after = task.version;
      task.waiting_on = { actor: "professor", actor_role: "PROFESSOR" };
      task.notifications.push({ at: ev.timestamp, to: "professor", kind: "ESCALATE", ref: ev.event_id });
    } else if (ev.event_type === "ASK" || ev.event_type === "BLOCK") {
      const spec = this.stateSpec(task.state);
      if (!spec.allowed_events.includes(ev.event_type)) {
        throw new RelayError("INVALID_TRANSITION", `${ev.event_type} not allowed in ${task.state}`);
      }
      const suspendedFrom = task.state;
      ev.to_state = ev.event_type === "ASK" ? "ASK" : "BLOCKED";
      task.state = ev.to_state as RelayState;
      task.state_entered_at = ev.timestamp;
      task.suspended_from_state = suspendedFrom;
      task.owner.suspended = true;
      task.waiting_on = this.dispatchAuthority(ev.event_type, suspendedFrom);
      task.notifications.push({ at: ev.timestamp, to: task.waiting_on.actor, kind: ev.event_type, ref: ev.event_id });
      ev.task_version_after = task.version + 1;
      task.version += 1;
    } else if (ev.event_type === "RELEASE") {
      if (!task.claim) throw new RelayError("INVALID_STATE", "no claim to release");
      task.claim.status = "released";
      task.claim.released_at = ev.timestamp;
      task.claim.release_reason = ev.message;
      task.claim.abandoned = ev.result?.abandoned === true;
      ev.to_state = task.state;
      ev.task_version_after = task.version;
      task.notifications.push({ at: ev.timestamp, to: task.claim.actor, kind: "RELEASE", ref: ev.event_id });
    } else {
      // functional transition via workflow.next
      const spec = this.stateSpec(task.state);
      const transition = spec.next[ev.event_type];
      if (!transition) {
        throw new RelayError("INVALID_TRANSITION", `no transition for ${ev.event_type} from ${task.state}`);
      }

      if (transition.action === "increment_attempts") {
        task.attempts.current += 1;
        if (task.attempts.current > task.attempts.max) {
          ev.to_state = "BLOCKED";
          task.state = "BLOCKED";
          task.state_entered_at = ev.timestamp;
          task.suspended_from_state = "EXECUTING";
          task.owner.suspended = true;
          task.waiting_on = { actor: "sonia", actor_role: "SONIA" };
          task.notifications.push({ at: ev.timestamp, to: "sonia", kind: "BLOCKED", ref: ev.event_id });
          ev.task_version_after = task.version + 1;
          task.version += 1;
          this.finishTransition(task, ev, expectedVersion);
          return;
        }
      }
      if (transition.action === "increment_replanning") {
        task.replanning.current += 1;
        if (task.replanning.current > task.replanning.max) {
          ev.to_state = "BLOCKED";
          task.state = "BLOCKED";
          task.state_entered_at = ev.timestamp;
          task.suspended_from_state = "PLANNING";
          task.owner.suspended = true;
          task.waiting_on = { actor: "professor", actor_role: "PROFESSOR" };
          task.notifications.push({ at: ev.timestamp, to: "professor", kind: "BLOCKED", ref: ev.event_id });
          ev.task_version_after = task.version + 1;
          task.version += 1;
          this.finishTransition(task, ev, expectedVersion);
          return;
        }
      }

      ev.to_state = transition.state;
      task.state = transition.state;
      task.state_entered_at = ev.timestamp;
      task.previous_owner = { actor: task.owner.actor, actor_role: task.owner.actor_role };
      (this as unknown as { currentTask?: RelayTask }).currentTask = task;
      const nextOwnerActor = this.ownerForRole(transition.owner_role, ev);
      (this as unknown as { currentTask?: RelayTask }).currentTask = undefined;
      task.owner = { actor: nextOwnerActor, actor_role: transition.owner_role };
      task.claim = null;
      if (ev.result) task.result = { ...(task.result ?? {}), ...ev.result };
      ev.task_version_after = task.version + 1;
      task.version += 1;
    }

    this.finishTransition(task, ev, expectedVersion);
  }

  private finishTransition(task: RelayTask, ev: RelayEvent, expectedVersion: number): void {
    if (task.owner.actor === "daneel" && task.state !== "ASK" && task.state !== "BLOCKED") {
      throw new RelayError("CONTROLLER_NOT_OWNER", "daneel cannot be functional owner");
    }
    this.store.writeTask(task, expectedVersion);
    this.store.appendEvent(ev);
  }

  private dispatchAuthority(eventType: "ASK" | "BLOCK", fromState: RelayState): { actor: string; actor_role: ActorRole } {
    // capability gap → Aurora; requirement/design → Manu; planning/process → Sonia;
    // reality dispute → Rolando; strategic → Professor (used for BLOCK from VERIFYING/ACCEPTING)
    if (eventType === "BLOCK") {
      if (fromState === "VERIFYING" || fromState === "ACCEPTING") {
        return { actor: "professor", actor_role: "PROFESSOR" };
      }
      return { actor: "sonia", actor_role: "SONIA" };
    }
    switch (fromState) {
      case "INTENT":
      case "ACCEPTING":
        return { actor: "manu", actor_role: "MANU" };
      case "ROUTING":
        return { actor: "aurora", actor_role: "AURORA" };
      case "PLANNING":
      case "CLOSING":
        return { actor: "sonia", actor_role: "SONIA" };
      case "VERIFYING":
        return { actor: "rolando", actor_role: "ROLANDO" };
      default:
        return { actor: "sonia", actor_role: "SONIA" };
    }
  }

  private ownerForRole(role: ActorRole, ev: RelayEvent): string {
    switch (role) {
      case "MANU": return "manu";
      case "AURORA": return "aurora";
      case "SONIA": return "sonia";
      case "TERESA": return "teresa";
      case "ROLANDO": return "rolando";
      case "DANEEL": return "daneel";
      case "PROFESSOR": return "professor";
      case "SPECIALIST": {
        // FAIL → back to the previous specialist (the EXECUTING owner recorded
        // in task.previous_owner when the ball passed to TESTING)
        if (ev.event_type === "FAIL") {
          const prev = (this as unknown as { currentTask?: RelayTask }).currentTask?.previous_owner;
          if (prev && prev.actor_role === "SPECIALIST") return prev.actor;
        }
        // DONE at PLANNING → specialist chosen by routing evidence/result, default valentina
        const chosen = ev.result && typeof ev.result.specialist === "string" ? (ev.result.specialist as string) : null;
        if (chosen) {
          if (!this.registry.specialists.has(chosen.toLowerCase())) {
            throw new RelayError("AUTHORITY_VIOLATION", `${chosen} is not a registered specialist`);
          }
          return chosen.toLowerCase();
        }
        return "valentina";
      }
    }
  }

  private emit(task: RelayTask, eventType: EventType, actor: string, payload: {
    evidence?: string[]; message?: string; result?: Record<string, unknown>; idempotency_key?: string;
  }, sequence?: number): RelayEvent {
    const ev: RelayEvent = {
      event_id: newId("evt"),
      task_id: task.task_id,
      sequence: sequence ?? this.store.readEvents(task.task_id).length + 1,
      event_type: eventType,
      actor: actor.toLowerCase(),
      actor_role: this.roleOf(actor),
      timestamp: nowIso(),
      task_version_before: task.version,
      task_version_after: task.version,
      from_state: task.state,
      to_state: task.state,
      correlation_id: task.task_id,
      causation_id: null,
      idempotency_key: payload.idempotency_key ?? newId("idem"),
      evidence: payload.evidence,
      message: payload.message,
      result: payload.result,
    };
    this.store.appendEvent(ev);
    return ev;
  }
}

function task_previousSpecialist(ev: RelayEvent): string {
  const chosen = ev.result && typeof ev.result.specialist === "string" ? (ev.result.specialist as string) : null;
  return chosen ?? "";
}
