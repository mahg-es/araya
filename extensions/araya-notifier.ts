// ARAYA Notifier — Terminal bell + timed "!" marker + footer version
//
// Rings the terminal bell and prepends "!" to the tab title for 30 seconds.
// Title shows "R. Daneel Olivaw" when in home paths.
// Footer shows "ARAYA vX.Y.Z" when in ARAYA-managed projects.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { basename } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { load } from "js-yaml";

const BELL = "\x07";
const FLASH_DURATION_MS = 30_000;

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
  } catch { /* ignore */ }
}

function isHomePath(cwd: string): boolean {
  const normalized = cwd.endsWith("/") && cwd !== "/" ? cwd.slice(0, -1) : cwd;
  return HOME_PATHS.has(normalized);
}

function buildNormalTitle(cwd: string): string {
  const name = basename(cwd);
  const acronyms: Record<string, string> = {
    "mahg-ai-project-office": "MAHG-PO",
    "mahg_bigdata_training_lab": "MBTL",
    "Modern-Analytics-Harmonized-Governance": "MAHG",
    "mahg-staticforge": "MSF",
    "mahg-pms": "PMS",
    "mahg_bigdata_cloud": "MBC",
  };
  const label = acronyms[name] ?? name;
  return `\u03C0\uFE4C ${label}`;
}

function getArayaVersion(cwd: string): string | null {
  try {
    const yamlPath = resolve(cwd, "araya.yaml");
    if (existsSync(yamlPath)) {
      const config = load(readFileSync(yamlPath, "utf-8")) as any;
      return config?.version ?? null;
    }
  } catch { /* not an ARAYA project */ }
  return null;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    setTimeout(() => {
      const cwd = process.cwd();
      if (isHomePath(cwd)) {
        setTitle("R. Daneel Olivaw");
      } else {
        setTitle(buildNormalTitle(cwd));
      }
      // Set footer with ARAYA version
      const version = getArayaVersion(cwd);
      if (version) {
        try { ctx.ui.setStatus("araya-version", `ARAYA v${version}`); } catch { /* ignore */ }
      }
    }, 200);
  });

  pi.on("agent_start", async (_event, _ctx) => {
    const cwd = process.cwd();
    if (isHomePath(cwd)) {
      setTitle("R. Daneel Olivaw");
    } else {
      setTitle(buildNormalTitle(cwd));
    }
  });

  pi.on("agent_end", async (_event, _ctx) => {
    if (clearFlashTimer) {
      clearTimeout(clearFlashTimer);
      clearFlashTimer = null;
    }

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

    if (!hasRateLimitError) {
      bell();
      const cwd = process.cwd();
      const baseTitle = isHomePath(cwd) ? "R. Daneel Olivaw" : buildNormalTitle(cwd);
      setTitle(`! ${baseTitle}`);
      clearFlashTimer = setTimeout(() => {
        setTitle(baseTitle);
        clearFlashTimer = null;
      }, FLASH_DURATION_MS);
    }
  });
}
