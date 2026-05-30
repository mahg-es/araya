// ARAYA Quota Guard — Active Token Consumption Monitor & Provider Fallback
//
// Tracks token usage across sessions, detects rate-limit errors,
// warns at 80% usage, and recommends provider switching at 95%.
// This protects Codex and Claude users from workflow interruption.

import type { ExtensionAPI, AgentEndEvent } from "@earendil-works/pi-coding-agent";

// Provider limits (TPM = tokens per minute)
const PROVIDER_LIMITS: Record<string, number> = {
  "openai-codex": 500_000,
  "openai": 500_000,
  anthropic: 1_000_000,
  google: 1_000_000,
  deepseek: 10_000_000, // generous — rarely hits limit
};

// Cooldown period in ms (1 minute)
const COOLDOWN_MS = 60_000;

interface ProviderUsage {
  tokensThisMinute: number;
  minuteStart: number;
  rateLimitHits: number;
  lastRateLimitTime: number;
}

const usage = new Map<string, ProviderUsage>();

function getUsage(provider: string): ProviderUsage {
  const now = Date.now();
  let u = usage.get(provider);
  if (!u || now - u.minuteStart > COOLDOWN_MS) {
    u = { tokensThisMinute: 0, minuteStart: now, rateLimitHits: 0, lastRateLimitTime: 0 };
    usage.set(provider, u);
  }
  return u;
}

function getRiskLevel(provider: string): { percent: number; level: string; message: string } {
  const limit = PROVIDER_LIMITS[provider] ?? 500_000;
  const u = getUsage(provider);
  const percent = Math.round((u.tokensThisMinute / limit) * 100);
  
  if (percent >= 95) return { percent, level: "critical", message: `CRITICAL: ${percent}% of ${provider} TPM used. SWITCH PROVIDER NOW. ${u.rateLimitHits} rate-limit hits this minute.` };
  if (percent >= 80) return { percent, level: "warning", message: `WARNING: ${percent}% of ${provider} TPM used. Consider smaller tasks or switch provider.` };
  if (percent >= 50) return { percent, level: "caution", message: `Caution: ${percent}% of ${provider} TPM used.` };
  return { percent, level: "ok", message: `OK: ${percent}% of ${provider} TPM used.` };
}

export default function (pi: ExtensionAPI) {
  // Track token consumption from every agent response
  pi.on("agent_end", async (event: AgentEndEvent, _ctx) => {
    const provider = event.messages?.[0]?.provider ?? "unknown";
    const tokens = event.messages?.reduce((sum: number, m: any) => 
      sum + (m.usage?.input ?? 0) + (m.usage?.output ?? 0), 0) ?? 0;
    
    if (tokens > 0) {
      const u = getUsage(provider);
      u.tokensThisMinute += tokens;
    }
    
    // Detect rate-limit errors in the last message
    for (const msg of (event.messages ?? [])) {
      const content = msg?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          const text = block?.text ?? "";
          if (text.includes("Rate limit reached") || text.includes("rate_limit")) {
            const u = getUsage(provider);
            u.rateLimitHits++;
            u.lastRateLimitTime = Date.now();
            
            // Auto-report rate limit
            console.error(`[ARAYA Quota Guard] Rate limit hit on ${provider}. ${u.rateLimitHits} hits this minute. Switch to DeepSeek recommended.`);
            
            // Reset counter to prevent cascade
            u.tokensThisMinute = 0;
            break;
          }
        }
      }
    }
  });

  // /araya quota-status — real-time consumption report
  pi.registerCommand("araya:quota-status", {
    description: "📊 Show real-time token consumption and rate-limit risk",
    handler: async (_args, ctx) => {
      const lines: string[] = ["## Quota Status — Real-Time Token Consumption", ""];
      
      let hasIssues = false;
      for (const [provider, limit] of Object.entries(PROVIDER_LIMITS)) {
        const risk = getRiskLevel(provider);
        const u = getUsage(provider);
        const icon = risk.level === "critical" ? "🔴" : risk.level === "warning" ? "🟡" : risk.level === "caution" ? "🟠" : "🟢";
        lines.push(`${icon} **${provider}**: ${risk.percent}% (${u.tokensThisMinute.toLocaleString()} / ${limit.toLocaleString()} TPM) | ${u.rateLimitHits} rate-limit hits`);
        if (risk.level !== "ok") hasIssues = true;
      }
      
      if (hasIssues) {
        lines.push("", "⚠️ **Recommendation:** Switch to DeepSeek (Ctrl+P) to avoid workflow interruption.");
      }
      
      ctx.ui.notify(lines.join("\n"), hasIssues ? "warning" : "info");
    },
  });

  // /araya quota-reset — reset tracking
  pi.registerCommand("araya:quota-reset", {
    description: "🔄 Reset quota tracking counters",
    handler: async (_args, ctx) => {
      usage.clear();
      ctx.ui.notify("✅ Quota tracking reset. All counters cleared.", "info");
    },
  });

  console.error("[ARAYA Quota Guard] Active — monitoring token consumption across providers");
}
