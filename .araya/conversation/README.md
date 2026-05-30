# ARAYA Conversational Operating System

ARAYA is conversational-first. Natural language is the primary interface.
Commands remain available as implementation details for advanced users.

## Intent Detection

ARAYA detects intent from natural language and routes to the appropriate
agent and workflow:

| Intent | Example | Routes To |
|--------|---------|-----------|
| Information Request | "What's the status?" | Sonia |
| Status Request | "How are we doing?" | Sonia → validate, release-check |
| Planning Request | "I want to build X" | Manu → requirements, team assembly |
| Implementation Request | "Build JWT auth" | Sonia → /araya run |
| Validation Request | "Is this ready?" | Manu → validate, constitution |
| Governance Request | "Check compliance" | Elena → audit |
| Capability Request | "Do we have gaps?" | Aurora → gap analysis |
| Security Request | "Review security" | Diana → threat model |
| Learning Request | "What have we learned?" | Esteban → trajectories, knowledge |
| Release Request | "Can we release?" | Sonia → release-check |

## Multi-Agent Routing

ARAYA understands compound requests:

```
"Manu and Sonia, I want to build a customer portal."
→ Manu: requirements + scope
→ Sonia: planning + team assembly
→ Aurora: capability check
→ Response: coordinated plan with roles and timeline
```

## Agent Identification

Every response identifies the speaking agent:

```
Manu: Based on the requirements...
Sonia: Delivery health is GREEN...
Aurora: One capability gap detected...
```

## Explain Mode

When asked "why?" or "how?", ARAYA reveals internal reasoning:
agents consulted, workflows executed, commands executed, artifacts referenced.
