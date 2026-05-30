// ARAYA Quota Guard v2 — Intelligent Rate-Limit Handling
//
// Two strategies based on limit type:
//   TPM (tokens per minute): Silent wait — let the minute pass, retry automatically
//   5-hour usage limit: Suggest provider switch to DeepSeek
//
// No error messages. No beeps. Smart waiting.

import type { ExtensionAPI, AgentEndEvent } from "@earendil-works/pi-coding-agent";

// Provider limits
const PROVIDER_TPM: Record<string, number> = {
  "openai-codex": 500_000,
  "openai": 500_000,
  anthropic: 1_000_000,
  google: 1_000_000,
  deepseek: 10_000_000,
};

// Cooldown tracking
const usage = new Map<string, { tokensThisMinute: number; minuteStart: number; tpmHits: number; usageLimitHits: number }>();

// Provider cooldown — blocks requests until timestamp expires
const cooldownUntil = new Map<string, number>();

function getUsage(provider: string) {
  const now = Date.now();
  let u = usage.get(provider);
  if (!u || now - u.minuteStart > 60_000) {
    u = { tokensThisMinute: 0, minuteStart: now, tpmHits: 0, usageLimitHits: 0 };
    usage.set(provider, u);
  }
  return u;
}

function isTPMLimitError(text: string): { isTPM: boolean; retrySeconds?: number } {
  // Codex TPM error: "Rate limit reached for ... on tokens per min (TPM): Limit X, Used Y, Requested Z. Please try again in Ns."
  const tpmMatch = text.match(/tokens per min.*?try again in ([\d.]+)s/i);
  if (tpmMatch) {
    return { isTPM: true, retrySeconds: parseFloat(tpmMatch[1]) };
  }
  return { isTPM: false };
}

function isUsageWindowLimit(text: string): boolean {
  // 5-hour usage window limit — harder limit, requires provider switch
  return /usage.*limit|quota.*exceeded|usage.*window|5.?hour/i.test(text);
}

function isClaudeExtraUsageError(text: string): boolean {
  // Claude: "Third-party apps now draw from your extra usage"
  return /extra usage|third.party apps.*draw from/i.test(text);
}

export default function (pi: ExtensionAPI) {
  pi.on("agent_end", async (event: AgentEndEvent, _ctx) => {
    const provider = event.messages?.[0]?.provider ?? "unknown";
    const tokens = event.messages?.reduce((sum: number, m: any) =>
      sum + (m.usage?.input ?? 0) + (m.usage?.output ?? 0), 0) ?? 0;

    if (tokens > 0) {
      const u = getUsage(provider);
      u.tokensThisMinute += tokens;
    }

    // Detect rate-limit errors
    for (const msg of (event.messages ?? [])) {
      const content = msg?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          const text = block?.text ?? "";
          
          const tpmCheck = isTPMLimitError(text);
          if (tpmCheck.isTPM) {
            const u = getUsage(provider);
            u.tpmHits++;
            u.tokensThisMinute = 0; // Reset — minute window will pass
            
            // SILENT WAIT — capture retry time and enforce cooldown
            const waitSeconds = Math.ceil((tpmCheck.retrySeconds ?? 7) + 2); // +2s buffer
            cooldownUntil.set(provider, Date.now() + waitSeconds * 1000);
            console.error(`[ARAYA Quota Guard] TPM limit on ${provider}. Cooldown ${waitSeconds}s until ${new Date(Date.now() + waitSeconds * 1000).toISOString()}. Silent — no bell.`);
            
            // The model will naturally retry after the wait
            // No notification to user — just let the minute pass
            break;
          }
          
          if (isUsageWindowLimit(text) || isClaudeExtraUsageError(text)) {
            const u = getUsage(provider);
            u.usageLimitHits++;
            const reason = isClaudeExtraUsageError(text)
              ? "CLAUDE EXTRA USAGE required"
              : "USAGE WINDOW LIMIT";
            console.error(`[ARAYA Quota Guard] ${reason} on ${provider}. Switch to DeepSeek — reliable, tested, no extra credits needed.`);
            break;
          }
        }
      }
    }
  });

  // before_agent_start — enforce cooldown from rate-limit errors
  pi.on("before_agent_start", async (_event, _ctx) => {
    const provider = (_event as any).systemPromptOptions?.selectedTools?.[0] ?? "openai-codex";
    const cooldown = cooldownUntil.get(provider);
    if (cooldown && Date.now() < cooldown) {
      const remaining = Math.ceil((cooldown - Date.now()) / 1000);
      console.error(`[ARAYA Quota Guard] Cooling down ${provider}. ${remaining}s remaining. Request held.`);
      return {
        message: {
          customType: "araya-quota-cooldown",
          content: `⏳ Rate limit cooldown: ${remaining}s remaining on ${provider}. Waiting...`,
          display: true,
        },
      };
    }
  });

  // /araya quota-status
  pi.registerCommand("araya:quota-status", {
    description: "📊 Show real-time token consumption and rate-limit risk",
    handler: async (_args, ctx) => {
      const lines: string[] = ["## Quota Status", ""];

      for (const [provider, limit] of Object.entries(PROVIDER_TPM)) {
        const u = getUsage(provider);
        const percent = Math.round((u.tokensThisMinute / limit) * 100);
        const icon = percent >= 95 ? "🔴" : percent >= 80 ? "🟡" : percent >= 50 ? "🟠" : "🟢";

        lines.push(`${icon} **${provider}**: ${percent}% (${u.tokensThisMinute.toLocaleString()} / ${limit.toLocaleString()} TPM)`);

        if (u.tpmHits > 0) {
          lines.push(`   ↩️ ${u.tpmHits} TPM resets (auto-waited — silent)`);
        }
        if (u.usageLimitHits > 0) {
          lines.push(`   ⚠️ ${u.usageLimitHits} usage window limits → switch to DeepSeek`);
        }
      }

      // Only suggest switching for usage window limits or Claude extra usage
      let hasUsageLimit = false;
      for (const [, u] of usage) {
        if (u.usageLimitHits > 0) hasUsageLimit = true;
      }
      if (hasUsageLimit) {
        lines.push("", "⚠️ Provider limit reached. Switch to DeepSeek (Ctrl+P) — reliable, tested, no extra credits.");
      }

      ctx.ui.notify(lines.join("\n"), hasUsageLimit ? "warning" : "info");
    },
  });

  // /araya quota-reset
  pi.registerCommand("araya:quota-reset", {
    description: "🔄 Reset quota tracking counters",
    handler: async (_args, ctx) => {
      usage.clear();
      ctx.ui.notify("✅ Quota tracking reset.", "info");
    },
  });

  console.error("[ARAYA Quota Guard v2] Active — TPM: silent wait | Usage limit: provider switch");
}
