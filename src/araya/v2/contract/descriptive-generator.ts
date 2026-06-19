// ARAYA v2.0 — AX Contract Tree: descriptive-layer generator (Slice 6).
//
// Per Accepted ADR-0010 §3.2. The descriptive layer is the boundary's CURRENT
// FACTUAL STATE (observed/generated). This generator writes ONLY within the
// marked descriptive region; it must never touch the frontmatter or the authored
// prescriptive section. The splice is byte-exact: everything outside the markers
// is preserved verbatim (the no-clobber guarantee proved in the slice tests).

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { DESCRIPTIVE_BEGIN, DESCRIPTIVE_END } from "./contract";
import { extractTopLevelExports } from "./surface";

/**
 * Replace the content between the descriptive markers in `raw` with `body`,
 * leaving every other byte untouched. Throws if the markers are absent or
 * malformed — it never appends or guesses, so it cannot clobber prescriptive.
 */
export function spliceDescriptive(raw: string, body: string): string {
  const start = raw.indexOf(DESCRIPTIVE_BEGIN);
  const end = raw.indexOf(DESCRIPTIVE_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("descriptive markers missing or malformed; refusing to write");
  }
  const head = raw.slice(0, start + DESCRIPTIVE_BEGIN.length);
  const tail = raw.slice(end);
  return `${head}\n${body}\n${tail}`;
}

/** Observe a boundary's current state from its physical root (a pure read). */
export function observeDescriptive(physicalRoot: string): string {
  const files = readdirSync(physicalRoot)
    .filter(f => f.endsWith(".ts"))
    .sort();
  const lines: string[] = [`_Generated from \`${physicalRoot.split("/").slice(-2).join("/")}\` — observed state, do not edit._`, ""];
  for (const f of files) {
    const src = readFileSync(join(physicalRoot, f), "utf-8");
    const exports = extractTopLevelExports(src);
    const size = statSync(join(physicalRoot, f)).size;
    lines.push(`- \`${f}\` (${size} bytes) — exports: ${exports.length ? exports.join(", ") : "(none)"}`);
  }
  return lines.join("\n");
}

/**
 * Regenerate a contract file's descriptive section in place. Reads the file,
 * observes the physical root, splices ONLY the descriptive region, writes back.
 * Returns the new file content. Frontmatter + prescriptive are untouched.
 */
export function regenerateDescriptive(contractPath: string, physicalRoot: string): string {
  const raw = readFileSync(contractPath, "utf-8");
  const next = spliceDescriptive(raw, observeDescriptive(physicalRoot));
  writeFileSync(contractPath, next, "utf-8");
  return next;
}
