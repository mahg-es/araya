// ARAYA v2.0 — Headless-CLI invocation surface (AX Slice 10), per Accepted ADR-0014 §3.3.
//
// THE ONE ISOLATED MODULE. All version-fragile knowledge of how to drive an
// external coding CLI headless lives behind a BackendDescriptor, so a CLI surface
// change (a renamed flag, a changed output format, a cwd quirk — the cwd hotfix is
// the cautionary precedent) touches THIS file only, never the engines or the
// adapter's evidence handling. New backends (Codex, Antigravity) are added as new
// descriptors here; the adapter core is untouched (§3.2 parameterize-by-descriptor).
//
// The descriptor exposes exactly the three real-world signals the evidence contract
// (§3.1) is built from, all observed — never taken from the CLI's self-assertion:
//   runCli       — invoke the CLI one-shot and capture stdout/stderr/exit (+timeout)
//   observeDelta — read the real working-tree file delta the run produced
//   runTests     — run the unit's tests and capture the REAL result (null = no tests)

import { spawnSync } from "node:child_process";

/** Captured result of one headless CLI invocation. */
export interface CliRunResult {
  stdout: string;
  stderr: string;
  /** Process exit code; null on timeout / signal kill. */
  exitCode: number | null;
  /** True when the invocation exceeded its timeout and was killed. */
  timedOut: boolean;
}

/** A real test run's captured result. `run` is the count; `passed` the verdict. */
export interface TestRunResult {
  run: number;
  passed: boolean;
}

/** Options threaded into every descriptor call (cwd, env, timeout, the task). */
export interface InvocationOptions {
  /** Working directory the CLI runs in (explicit — never cwd-derived implicitly). */
  cwd: string;
  /** The unit of work, passed to the CLI as its one-shot prompt. */
  task: string;
  /** Hard timeout for the CLI invocation, in ms. */
  timeoutMs: number;
  /** Extra environment for the child (merged over process.env). */
  env?: NodeJS.ProcessEnv;
}

/**
 * A backend descriptor isolates ONE external CLI's invocation surface. The adapter
 * core composes these three signals into a StructuredOutput; it knows nothing of
 * the CLI's flags or output format — that all lives here.
 */
export interface BackendDescriptor {
  /** Stable backend id, stamped as the producer (e.g. "claude-code-cli"). */
  id: string;
  /** Invoke the CLI one-shot, headless; capture stdout/stderr/exit (+timeout). */
  runCli(opts: InvocationOptions): CliRunResult;
  /** Observe the real working-tree file delta the run produced. */
  observeDelta(opts: InvocationOptions): string[];
  /**
   * Run the unit's tests and capture the REAL result. Returns null ONLY when the
   * unit genuinely has no tests (delta-only is then acceptable, §3.1). A non-null
   * result is the authoritative test signal — never the CLI's self-report.
   */
  runTests(opts: InvocationOptions): TestRunResult | null;
}

/** Parse `git status --porcelain` output into a list of changed paths. */
function parsePorcelain(stdout: string): string[] {
  return stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^\S+\s+/, ""));
}

/**
 * The Claude Code pilot backend (§3.3): one-shot `claude -p "<task>"`, no TTY.
 * Authentication is the operator's existing Claude Code auth (§3.4) — this brokers
 * NO credentials; it spawns the CLI as the operator. An optional test command,
 * configured per unit, supplies the real test result; absent it, the unit is
 * treated as test-less and only the file delta is observed.
 */
export function claudeCodeDescriptor(config?: {
  /** CLI binary (default "claude"); the headless flag is "-p" (one-shot). */
  bin?: string;
  /** Shell command that runs the unit's tests, or undefined for a test-less unit. */
  testCommand?: string;
}): BackendDescriptor {
  const bin = config?.bin ?? "claude";
  const testCommand = config?.testCommand;
  return {
    id: "claude-code-cli",
    runCli(opts) {
      // One-shot, non-interactive: `claude -p "<task>"`. stdin is ignored (no TTY).
      const r = spawnSync(bin, ["-p", opts.task], {
        cwd: opts.cwd,
        env: { ...process.env, ...opts.env },
        timeout: opts.timeoutMs,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const timedOut = r.error !== undefined && (r.error as any).code === "ETIMEDOUT";
      return {
        stdout: r.stdout ?? "",
        stderr: r.stderr ?? (r.error ? String(r.error.message) : ""),
        exitCode: r.status,
        timedOut,
      };
    },
    observeDelta(opts) {
      const r = spawnSync("git", ["status", "--porcelain"], {
        cwd: opts.cwd,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return r.status === 0 ? parsePorcelain(r.stdout ?? "") : [];
    },
    runTests(opts) {
      if (!testCommand) return null; // genuinely test-less unit → delta-only (§3.1)
      const r = spawnSync(testCommand, {
        cwd: opts.cwd,
        env: { ...process.env, ...opts.env },
        timeout: opts.timeoutMs,
        encoding: "utf-8",
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      // The real verdict is the test process's own exit code — not the model's word.
      return { run: 1, passed: r.status === 0 };
    },
  };
}
