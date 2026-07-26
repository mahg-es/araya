/**
 * ARAYA Governed Operation — shared handler helpers.
 */
import { execFileSync } from "node:child_process";
import { OperationCheck } from "./types";

export interface CmdResult {
  code: number;
  stdout: string;
  stderr: string;
}

export function run(cmd: string, args: string[], cwd: string, timeoutMs = 300000): CmdResult {
  try {
    const stdout = execFileSync(cmd, args, {
      cwd,
      encoding: "utf-8",
      timeout: timeoutMs,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { code: 0, stdout: String(stdout), stderr: "" };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return {
      code: typeof err.status === "number" ? err.status : 1,
      stdout: String(err.stdout ?? ""),
      stderr: String(err.stderr ?? ""),
    };
  }
}

/** Run capturing BOTH streams on success and failure (unittest writes to stderr). */
export function runCaptured(cmd: string, args: string[], cwd: string, timeoutMs = 300000): CmdResult {
  const { spawnSync } = require("node:child_process");
  const r = spawnSync(cmd, args, { cwd, encoding: "utf-8", timeout: timeoutMs });
  return {
    code: r.status ?? 1,
    stdout: String(r.stdout ?? ""),
    stderr: String(r.stderr ?? ""),
  };
}

export function git(root: string, args: string[], timeoutMs = 120000): CmdResult {
  return run("git", ["-C", root, ...args], root, timeoutMs);
}

export function check(id: string, passed: boolean, detail?: string, evidence?: string[], blocking = true): OperationCheck {
  return { id, passed, blocking, detail, evidence };
}

export function isHex(s: string, min = 7): boolean {
  return /^[0-9a-f]+$/i.test(s) && s.length >= min;
}
