// ARAYA Notifier — Terminal bell + timed "!" marker when agent finishes
//
// Rings the terminal bell and prepends "!" to the tab title for 30 seconds
// so The Data Professor can multitask and know when the AI has finished.
// Title shows "R. Daneel Olivaw" when in home paths (/, /home, etc.)
// or "π project-name" for all other directories.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { basename } from "node:path";

const BELL = "\x07";
const FLASH_DURATION_MS = 30_000; // 30 seconds

const HOME_PATHS = new Set([
  "/home/thedataprofessor/github",
  "/home/thedataprofessor",
  "/home",
  "/",
]);

let clearFlashTimer: ReturnType<typeof setTimeout> | null = null;

function bell(): void {
  process.stdout.write(BELL);
}

function setTitle(text: string): void {
  try {
    process.stdout.write(`\x1b]0;${text}\x07`);
  } catch {
    // Terminal may not support OSC; bell alone is enough
  }
}

function isHomePath(cwd: string): boolean {
  // Normalize: strip trailing slash
  const normalized = cwd.endsWith("/") && cwd !== "/" ? cwd.slice(0, -1) : cwd;
  return HOME_PATHS.has(normalized);
}

function buildNormalTitle(cwd: string): string {
  const name = basename(cwd);
  // Use acronym for known long names
  const acronyms: Record<string, string> = {
    "mahg-ai-project-office": "MAHG-PO",
    "mahg_bigdata_training_lab": "MBTL",
    "Modern-Analytics-Harmonized-Governance": "MAHG",
    "mahg-staticforge": "MSF",
    "mahg-pms": "PMS",
    "mahg_bigdata_cloud": "MBC",
  };
  const label = acronyms[name] ?? name;
  return `\u03C0 ${label}`;
}

export default function (pi: ExtensionAPI) {
  pi.on("agent_start", async (_event, _ctx) => {
    const cwd = process.cwd();
    if (isHomePath(cwd)) {
      setTitle("R. Daneel Olivaw");
    } else {
      setTitle(buildNormalTitle(cwd));
    }
  });

  pi.on("agent_end", async (_event, _ctx) => {
    // Suppress bell for TPM rate-limit errors — Quota Guard handles silently
    const messages = (_event as any).messages ?? [];
    const hasRateLimitError = messages.some((m: any) => {
      const content = m?.content;
      if (Array.isArray(content)) {
        return content.some((block: any) => {
          const text = block?.text ?? "";
          return /Rate limit reached.*tokens per min|extra usage/i.test(text);
        });
      }
      return false;
    });

    // Clear any previous pending clear
    if (clearFlashTimer) {
      clearTimeout(clearFlashTimer);
      clearFlashTimer = null;
    }

    // Only bell for real completions, not rate-limit errors
    if (!hasRateLimitError) {
      bell();
    }

    const cwd = process.cwd();
    const baseTitle = isHomePath(cwd)
      ? "R. Daneel Olivaw"
      : buildNormalTitle(cwd);

    // Flash the "!" marker (suppress for rate-limit errors)
    if (!hasRateLimitError) {
      setTitle(`! ${baseTitle}`);

      // Remove the "!" after 30 seconds
      clearFlashTimer = setTimeout(() => {
        setTitle(baseTitle);
        clearFlashTimer = null;
      }, FLASH_DURATION_MS);
    }
  });
}
