/**
 * ARAYA Relay Motor — persistent task/event store (REQ-042).
 * Concurrency per workflow.yaml: file_lock (O_EXCL lockfile), optimistic
 * version check, atomic rename. Events: append-only JSONL, idempotency_key
 * dedup, monotonic gapless sequence.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { RelayError, RelayEvent, RelayTask, LIMITS } from "./types";

export class RelayStore {
  readonly runtimeDir: string;
  readonly tasksDir: string;
  readonly eventsDir: string;
  readonly locksDir: string;

  constructor(readonly projectRoot: string) {
    this.runtimeDir = path.join(projectRoot, ".araya", "relay", "runtime");
    this.tasksDir = path.join(this.runtimeDir, "tasks");
    this.eventsDir = path.join(this.runtimeDir, "events");
    this.locksDir = path.join(this.runtimeDir, "locks");
    for (const d of [this.tasksDir, this.eventsDir, this.locksDir]) {
      fs.mkdirSync(d, { recursive: true });
    }
  }

  taskPath(taskId: string): string {
    return path.join(this.tasksDir, `${taskId}.json`);
  }

  private taskIdOf(task: RelayTask): string {
    return task.task_id;
  }

  eventsPath(taskId: string): string {
    return path.join(this.eventsDir, `${taskId}.jsonl`);
  }

  exists(taskId: string): boolean {
    return fs.existsSync(this.taskPath(taskId));
  }

  readTask(taskId: string): RelayTask {
    const p = this.taskPath(taskId);
    if (!fs.existsSync(p)) throw new RelayError("TASK_NOT_FOUND", `task not found: ${taskId}`);
    return JSON.parse(fs.readFileSync(p, "utf-8")) as RelayTask;
  }

  /** Atomic write: tmp file + rename. Optimistic version check when expectedVersion given. */
  writeTask(task: RelayTask, expectedVersion?: number): void {
    const p = this.taskPath(this.taskIdOf(task));
    if (expectedVersion !== undefined && fs.existsSync(p)) {
      const current = (JSON.parse(fs.readFileSync(p, "utf-8")) as RelayTask).version;
      if (current !== expectedVersion) {
        throw new RelayError(
          "CONCURRENT_MODIFICATION",
          `expected version ${expectedVersion}, found ${current}`
        );
      }
    }
    const tmp = p + `.tmp-${process.pid}-${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(task, null, 2) + "\n", { encoding: "utf-8", mode: 0o644 });
    fs.renameSync(tmp, p);
  }

  /** O_EXCL lockfile with timeout and stale-age reclamation. */
  acquireLock(taskId: string, timeoutSeconds = LIMITS.lock_timeout_seconds): () => void {
    const lockPath = path.join(this.locksDir, `${taskId}.lock`);
    const deadline = Date.now() + timeoutSeconds * 1000;
    for (;;) {
      try {
        const fd = fs.openSync(lockPath, "wx");
        fs.writeSync(fd, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
        fs.closeSync(fd);
        let released = false;
        return () => {
          if (released) return;
          released = true;
          try { fs.unlinkSync(lockPath); } catch { /* already gone */ }
        };
      } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException;
        if (err.code !== "EEXIST") throw e;
        // stale lock reclamation (> 10× lock timeout)
        try {
          const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
          if (ageMs > LIMITS.lock_timeout_seconds * 10 * 1000) {
            fs.unlinkSync(lockPath);
            continue;
          }
        } catch { /* raced away — retry */ continue; }
        if (Date.now() > deadline) {
          throw new RelayError("LOCK_TIMEOUT", `could not acquire lock for ${taskId} within ${timeoutSeconds}s`);
        }
        const waitUntil = Date.now() + 25;
        while (Date.now() < waitUntil) { /* spin briefly */ }
      }
    }
  }

  /** Append-only event log with sequence gap protection + idempotency dedup. */
  readEvents(taskId: string): RelayEvent[] {
    const p = this.eventsPath(taskId);
    if (!fs.existsSync(p)) return [];
    return fs
      .readFileSync(p, "utf-8")
      .split("\n")
      .filter((l) => l.trim().length > 0)
      .map((l) => JSON.parse(l) as RelayEvent);
  }

  appendEvent(event: RelayEvent): { appended: boolean; event_id: string } {
    const events = this.readEvents(event.task_id);
    const dup = events.find((e) => e.idempotency_key === event.idempotency_key);
    if (dup) {
      return { appended: false, event_id: dup.event_id };
    }
    const expectedSeq = events.length + 1;
    if (event.sequence !== expectedSeq) {
      throw new RelayError(
        "SEQUENCE_GAP",
        `sequence gap detected: expected ${expectedSeq}, got ${event.sequence}`
      );
    }
    fs.appendFileSync(this.eventsPath(event.task_id), JSON.stringify(event) + "\n", { encoding: "utf-8" });
    return { appended: true, event_id: event.event_id };
  }

  listTasks(): string[] {
    return fs
      .readdirSync(this.tasksDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function plusSeconds(iso: string, seconds: number): string {
  return new Date(Date.parse(iso) + seconds * 1000).toISOString();
}
