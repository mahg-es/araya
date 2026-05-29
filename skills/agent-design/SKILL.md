---
name: agent-design
description: "Design multi-agent AI systems — agent architectures, tool use, memory systems,"
---
---

# Agent Design

Design multi-agent AI systems — agent architectures, tool use, memory systems,
inter-agent communication, and safety guardrails — building autonomous agents
that plan, act, and learn within defined boundaries.

## What problem this solves
Single-prompt LLM interactions are limited; agents that can reason, use tools,
and iterate solve complex multi-step problems. This skill designs agent
architectures with clear roles, tools, memory, and safety constraints.

## When to use
When building autonomous agents. When a single LLM call is insufficient for
the task (multi-step reasoning, external tool use, iterative refinement).
When designing ARAYA-like multi-agent systems.

## Input
Task domain, required capabilities, constraints, safety requirements.

## Output
An agent architecture specification with roles, tools, memory model, and
safety guardrails — ready for implementation.

## Steps
1. Define the agent's purpose: what problem does it solve, for whom?
2. Design agent loop: perceive → plan → act → observe → repeat
3. Assign tools: what does the agent need to do? (read, write, bash, API calls, search, database)
4. Design memory: short-term (conversation), working (current task), long-term (knowledge base)
5. Implement safety: allowed actions whitelist, human approval for destructive operations, rate limits
6. Design inter-agent communication: shared memory, message passing, task delegation
7. Add reflection: after each action, was it successful? Should the plan change?
8. Test with adversarial scenarios: edge cases, safety violations, infinite loops

## Rules
- Every agent must have: purpose, tools, memory, safety boundaries
- Tool whitelist: agents can only use explicitly granted tools
- Destructive operations (delete, rm, drop) require human approval
- Rate limits: prevent infinite loops (max 10 iterations, max 5 tool calls per iteration)
- Memory must be inspectable — humans must see what the agent remembers
- Fallback: if agent is uncertain, escalate to human — never guess on critical decisions
- Coordinate with María for LLM deployment and Diana for security review
## Done Criteria

- [ ] All steps completed as specified
- [ ] Output validated against requirements
- [ ] Status reported with confidence score
- [ ] Evidence artifacts captured
