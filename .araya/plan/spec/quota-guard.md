---
name: araya-quota-guard
description: "ARAYA Quota Guard — extension component that actively monitors token consumption, detects rate-limit errors, and auto-switches providers to prevent workflow interruption."
---

# ARAYA Quota Guard

Active quota management extension that prevents rate-limit interruptions
by tracking token consumption, predicting limit breaches, and automatically
switching providers when needed.

## Provider Limits (Defaults)

| Provider | TPM Limit | Strategy |
|----------|-----------|----------|
| Codex (gpt-5.3) | 500,000 | Track usage, pause at 80%, switch to fallback at 95% |
| Claude | Usage credits | Track cost, warn at low credits |
| DeepSeek | Generous | Primary fallback — always available |
| Gemini | 1,000,000 | Secondary fallback for large analysis |

## How It Works

1. **Track** — Accumulates token usage from agent_end events
2. **Predict** — Before large tasks, estimates if they'll exceed limits
3. **Protect** — At 80% usage: warn. At 95%: auto-switch to fallback
4. **Recover** — After cooldown period, restore original provider
5. **Report** — `/araya quota-status` shows real-time consumption

## Commands

- `/araya quota-status` — Real-time token consumption and risk level
- `/araya quota-reset` — Reset tracking for new session
- Automatic: warns at 80%, switches at 95%
