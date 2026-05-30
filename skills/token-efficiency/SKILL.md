---
name: token-efficiency
description: "Global Token Efficiency and Provider Optimization Framework — maximize useful work within available quotas by optimizing prompts, contexts, and delegation."
---

# Token Efficiency & Provider Optimization

ARAYA optimization layer that maximizes productive work within provider
quotas. Works transparently for ARAYA workflows, direct pi conversations,
agent delegations, and sub-agent executions.

## What problem this solves

Rate-limit errors, retry delays, wasted quotas, and oversized prompts
reduce throughput. This skill detects inefficiencies before they waste
tokens and provides optimization strategies per provider.

## When to Use

- Before any large task execution
- When rate-limit risk is detected
- For multi-agent orchestration planning
- When context windows approach limits

## Core Principles

- **Small tasks over giant prompts** — decompose, don't compress
- **Context reuse over repetition** — reference artifacts, don't resend
- **Provider-aware execution** — optimize per provider profile
- **Budget before execution** — estimate tokens before invoking

## Provider Optimization Profiles

| Provider | Optimize For | Avoid |
|----------|-------------|-------|
| Codex | Small prompts, incremental, frequent checkpoints | Large plans, full repo scans |
| Claude | Deep reasoning, architecture, governance | Repeating context/standards |
| DeepSeek | Cost efficiency, long workflows, docs | Unbounded context growth |
| Gemini | Large-scale analysis, research, synthesis | Small incremental tasks |
| GitHub Copilot | Local implementation, fast iteration | Architecture discussions |
| OpenCode Go | Lightweight execution, rapid tasks | Heavy planning sessions |

## Steps

1. Estimate token consumption before execution: input + output + reasoning
2. Check rate-limit risk based on recent usage patterns
3. If risk detected, recommend: decomposition, compression, or deferral
4. Apply provider-specific optimization profile
5. Generate context capsules for reusable information
6. Track consumption across session
7. Report efficiency metrics

## Context Capsule Format

```markdown
# Context Capsule — {topic}
Compressed from: X tokens → Y tokens (Z:1 ratio)
Requirements: REQ-001, REQ-002
Standards: STD-004
Decisions: ARCH-002
Key findings: ...
Dependencies: ...
```

## Expected Output

Token budget report with estimated input/output tokens, rate-limit risk
assessment, optimization recommendations, and provider strategy.

## Done Criteria

- [ ] Token budget estimated before execution
- [ ] Rate-limit risk evaluated
- [ ] Context compressed where possible
- [ ] Provider profile applied
- [ ] Efficiency metrics tracked
