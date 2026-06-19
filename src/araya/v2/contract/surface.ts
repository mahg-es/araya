// ARAYA v2.0 — AX Contract Tree: published-interface SURFACE extraction (Slice 7).
//
// Per Accepted ADR-0012 §3.2. The observed surface of a published interface is
// read from source the SAME way the Slice-6 descriptive generator observes a
// boundary's exports — extended to interface-member granularity. This is the one
// observation mechanism (extractTopLevelExports is shared with the descriptive
// generator); the breaking-change comparator (published-interface.ts) is the only
// new logic. No parallel detector.

import { readFileSync } from "node:fs";

/** Top-level exported symbol names — the Slice-6 descriptive observation. */
export function extractTopLevelExports(src: string): string[] {
  return Array.from(src.matchAll(/^export\s+(?:class|function|interface|type|const)\s+([A-Za-z0-9_]+)/gm))
    .map(m => m[1]);
}

/** Strip block and line comments so member scanning is not fooled by prose. */
function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * Member names of an exported `interface Name { ... }`, depth-aware so method
 * parameters (paren depth) and nested object types (brace depth) are never
 * mistaken for members. Members are the leading identifiers of the declarations
 * separated by top-level `;`/`,`.
 */
function interfaceMembers(src: string, name: string): string[] {
  const head = src.match(new RegExp(`export\\s+interface\\s+${name}\\b[^{]*\\{`));
  if (!head || head.index === undefined) return [];
  let i = head.index + head[0].length; // first char inside the body
  // Track only brace + paren depth. Angle/generic tracking is deliberately
  // omitted: `=>` arrows and comparisons make `<`/`>` unreliable, and member
  // separators (`;`/`,`) never appear inside a generic argument list anyway.
  let brace = 0, paren = 0;
  const chunks: string[] = [];
  let cur = "";
  for (; i < src.length; i++) {
    const c = src[i];
    if (brace === 0 && paren === 0 && c === "}") break; // end of interface body
    if (c === "{") brace++;
    else if (c === "}") brace--;
    else if (c === "(") paren++;
    else if (c === ")") paren--;
    if ((c === ";" || c === ",") && brace === 0 && paren === 0) {
      chunks.push(cur); cur = ""; continue;
    }
    cur += c;
  }
  if (cur.trim()) chunks.push(cur);
  const members: string[] = [];
  for (const chunk of chunks) {
    const m = chunk.trim().match(/^(?:readonly\s+)?([A-Za-z_]\w*)\s*[?]?\s*[(:<]/);
    if (m) members.push(m[1]);
  }
  return members;
}

/**
 * The published surface of a source file: top-level exported symbols, plus the
 * members of each exported interface as `Interface.member`. Sorted + de-duped, so
 * the comparison is order-independent.
 */
export function extractSurface(src: string): string[] {
  const clean = stripComments(src);
  const surface = new Set<string>();
  const top = extractTopLevelExports(clean);
  for (const name of top) {
    surface.add(name);
    for (const member of interfaceMembers(clean, name)) {
      surface.add(`${name}.${member}`);
    }
  }
  return Array.from(surface).sort();
}

/** Observe a published interface's surface from its declared source file. */
export function observeSurface(sourceFileAbs: string): string[] {
  return extractSurface(readFileSync(sourceFileAbs, "utf-8"));
}
