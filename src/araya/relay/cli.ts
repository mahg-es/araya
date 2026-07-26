/**
 * ARAYA Relay Motor — CLI (REQ-042 canonical six commands).
 *   araya relay init    — create a new task
 *   araya relay inbox   — list pending handoffs for an agent
 *   araya relay claim   — claim a task (acquire lease)
 *   araya relay ack     — acknowledge receipt
 *   araya relay return  — return the ball with result + evidence
 *   araya relay status  — show task state
 * Exit codes: 0 success, 1 rejection/failure, 2 usage error. JSON output via --json.
 */
import { RelayMotor } from "./motor";
import { RelayError, EventType } from "./types";
import * as fs from "node:fs";
import * as path from "node:path";

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "araya.yaml"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

function emit(value: unknown, json: boolean, code = 0): number {
  process.stdout.write((json ? JSON.stringify(value, null, 2) : String(value)) + "\n");
  return code;
}

function parseFlags(args: string[]): { flags: Record<string, string | boolean>; rest: string[] } {
  const flags: Record<string, string | boolean> = {};
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--json") { flags.json = true; continue; }
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) { flags[key] = next; i++; }
      else flags[key] = true;
    } else {
      rest.push(a);
    }
  }
  return { flags, rest };
}

export async function relayCliMain(args: string[]): Promise<number> {
  const { flags, rest } = parseFlags(args);
  const json = flags.json === true;
  const [sub, ...subArgs] = rest;
  const root = findProjectRoot(process.cwd());
  const motor = new RelayMotor(root);

  try {
    switch (sub) {
      case "init": {
        const taskId = String(flags["task-id"] ?? subArgs[0] ?? "");
        const by = String(flags.by ?? process.env.ARAYA_AGENT ?? "");
        if (!taskId || !by) return emit({ error: "relay init --task-id <id> --by <actor> [--subject '<json>']", code: "USAGE" }, json, 2);
        let subject: Record<string, unknown> | undefined;
        if (typeof flags.subject === "string") subject = JSON.parse(flags.subject);
        const task = motor.init({ task_id: taskId, created_by: by, subject });
        return emit({ ok: true, task_id: task.task_id, state: task.state, owner: task.owner.actor, version: task.version }, json);
      }
      case "inbox": {
        const actor = String(flags.actor ?? process.env.ARAYA_AGENT ?? "");
        if (!actor) return emit({ error: "relay inbox --actor <name>", code: "USAGE" }, json, 2);
        const tasks = motor.inbox(actor).map((t) => ({
          task_id: t.task_id, state: t.state, owner: t.owner.actor,
          waiting_on: t.waiting_on?.actor, claim: t.claim ? { actor: t.claim.actor, status: t.claim.status } : null,
          version: t.version,
        }));
        return emit({ actor, pending: tasks.length, tasks }, json);
      }
      case "claim": {
        const taskId = String(flags["task-id"] ?? subArgs[0] ?? "");
        const actor = String(flags.actor ?? process.env.ARAYA_AGENT ?? "");
        if (!taskId || !actor) return emit({ error: "relay claim --task-id <id> --actor <name>", code: "USAGE" }, json, 2);
        const task = motor.claim(taskId, actor);
        return emit({ ok: true, task_id: task.task_id, claim: { id: task.claim?.claim_id, actor, status: task.claim?.status, ack_deadline: task.claim?.ack_deadline } }, json);
      }
      case "ack": {
        const taskId = String(flags["task-id"] ?? subArgs[0] ?? "");
        const actor = String(flags.actor ?? process.env.ARAYA_AGENT ?? "");
        if (!taskId || !actor) return emit({ error: "relay ack --task-id <id> --actor <name>", code: "USAGE" }, json, 2);
        const task = motor.ack(taskId, actor);
        return emit({ ok: true, task_id: task.task_id, claim_status: task.claim?.status, acked_at: task.claim?.acked_at }, json);
      }
      case "return": {
        const taskId = String(flags["task-id"] ?? subArgs[0] ?? "");
        const actor = String(flags.actor ?? process.env.ARAYA_AGENT ?? "");
        const eventType = String(flags.event ?? "").toUpperCase() as EventType;
        if (!taskId || !actor || !eventType) {
          return emit({ error: "relay return --task-id <id> --actor <name> --event <TYPE> [--evidence <path,...>] [--message <text>] [--result '<json>'] [--idempotency-key <key>]", code: "USAGE" }, json, 2);
        }
        const evidence = typeof flags.evidence === "string" ? flags.evidence.split(",").filter(Boolean) : undefined;
        const result = typeof flags.result === "string" ? JSON.parse(flags.result) : undefined;
        const task = motor.returnBall(taskId, actor, eventType, {
          evidence,
          message: typeof flags.message === "string" ? flags.message : undefined,
          result,
          idempotency_key: typeof flags["idempotency-key"] === "string" ? flags["idempotency-key"] : undefined,
        });
        return emit({ ok: true, task_id: task.task_id, state: task.state, owner: task.owner.actor, version: task.version }, json);
      }
      case "control": {
        const taskId = String(flags["task-id"] ?? subArgs[0] ?? "");
        const actor = String(flags.actor ?? process.env.ARAYA_AGENT ?? "daneel");
        const eventType = String(flags.event ?? "").toUpperCase() as EventType;
        if (!taskId || !eventType) return emit({ error: "relay control --task-id <id> --event <RESOLVE|ESCALATE|RELEASE|NOTE> [--actor daneel] [--message <text>] [--result '<json>']", code: "USAGE" }, json, 2);
        const task = motor.control(taskId, actor, eventType, {
          message: typeof flags.message === "string" ? flags.message : undefined,
          result: typeof flags.result === "string" ? JSON.parse(flags.result) : undefined,
          idempotency_key: typeof flags["idempotency-key"] === "string" ? flags["idempotency-key"] : undefined,
        });
        return emit({ ok: true, task_id: task.task_id, state: task.state, owner: task.owner.actor, waiting_on: task.waiting_on?.actor, version: task.version }, json);
      }
      case "status": {
        const taskId = String(flags["task-id"] ?? subArgs[0] ?? "");
        if (!taskId) return emit({ error: "relay status --task-id <id> [--events]", code: "USAGE" }, json, 2);
        const task = motor.status(taskId);
        const events = flags.events === true
          ? motor.store.readEvents(taskId).map((e) => ({ seq: e.sequence, type: e.event_type, actor: e.actor, from: e.from_state, to: e.to_state, at: e.timestamp }))
          : undefined;
        return emit({ task, events }, json);
      }
      default:
        return emit({ error: `unknown relay subcommand: ${sub ?? "(none)"}`, usage: "relay init|inbox|claim|ack|return|control|status" }, json, 2);
    }
  } catch (e) {
    if (e instanceof RelayError) {
      return emit({ ok: false, code: e.code, error: e.message }, json, 1);
    }
    throw e;
  }
}
