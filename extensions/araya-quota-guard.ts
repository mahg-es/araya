// ARAYA Quota Guard v4 — Global Cooldown Enforcement
//
// Single cooldown for ALL providers. When any rate-limit error is detected,
// block ALL subsequent requests until the cooldown expires.
// No provider matching needed — universal protection.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Single global cooldown — blocks all providers
let cooldownUntilMs = 0;
let cooldownProvider = "";

function isRateLimitError(text: string): { blocked: boolean; waitSeconds?: number } {
  // Codex TPM: "try again in Ns"
  const tpm = text.match(/try again in ([\d.]+)s/i);
  if (tpm) return { blocked: true, waitSeconds: parseFloat(tpm[1]) };

  // Claude: "extra usage"
  if (/extra usage/i.test(text)) return { blocked: true };

  // Generic rate limit
  if (/rate limit|too many requests|429/i.test(text)) return { blocked: true };

  return { blocked: false };
}

export default function (pi: ExtensionAPI) {
  // Detect rate-limit errors from any response
  pi.on("agent_end", async (event: any, _ctx) => {
    for (const msg of (event.messages ?? [])) {
      const content = msg?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          const text = block?.text ?? "";
          const result = isRateLimitError(text);

          if (result.blocked) {
            const waitSec = Math.ceil((result.waitSeconds ?? 10) + 3); // +3s buffer
            cooldownUntilMs = Date.now() + waitSec * 1000;
            cooldownProvider = msg?.provider ?? "unknown";
            console.error(`[ARAYA Quota Guard] COOLDOWN ACTIVE: ${waitSec}s on ${cooldownProvider}. All requests held until ${new Date(cooldownUntilMs).toISOString()}.`);
            return; // one error is enough to trigger cooldown
          }
        }
      }
    }
  });

  // Block requests during cooldown
  pi.on("before_agent_start", async (_event: any, _ctx) => {
    if (Date.now() < cooldownUntilMs) {
      const remaining = Math.ceil((cooldownUntilMs - Date.now()) / 1000);
      console.error(`[ARAYA Quota Guard] HOLDING: ${remaining}s cooldown remaining on ${cooldownProvider}.`);

      // Inject a waiting message — the model will see this and pause
      return {
        message: {
          customType: "araya-quota-cooldown",
          content: `⏳ RATE LIMIT COOLDOWN: ${remaining}s remaining. Provider ${cooldownProvider} limit reached. Please wait. Do NOT send another request until cooldown expires.`,
          display: true,
        },
      };
    }
    // Cooldown expired — clear
    if (cooldownUntilMs > 0) {
      console.error(`[ARAYA Quota Guard] Cooldown cleared. Requests resumed.`);
      cooldownUntilMs = 0;
      cooldownProvider = "";
    }
  });

  // /araya quota-status
  pi.registerCommand("araya:quota-status", {
    description: "📊 Show rate-limit cooldown status",
    handler: async (_args, ctx) => {
      if (cooldownUntilMs > 0 && Date.now() < cooldownUntilMs) {
        const remaining = Math.ceil((cooldownUntilMs - Date.now()) / 1000);
        ctx.ui.notify(`🔴 COOLDOWN ACTIVE: ${remaining}s remaining on ${cooldownProvider}. All requests held.`, "warning");
      } else {
        ctx.ui.notify("🟢 No cooldown active. All providers available.", "info");
      }
    },
  });

  console.error("[ARAYA Quota Guard v4] Active — global cooldown enforcement");
}
