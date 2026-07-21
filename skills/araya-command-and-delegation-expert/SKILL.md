---
name: araya-command-and-delegation-expert
description: >
  Cross-cutting mandatory skill for all ARAYA agents. Teaches command discovery,
  manual consultation (/araya:man), capability-aware execution, and mandatory
  specialist delegation. Every agent MUST apply these behaviors before executing
  any task. This is an ARAYA AX (cross-cutting) feature — no agent is exempt.
---

# Command & Delegation Expert — ARAYA AX Feature

Cross-cutting mandatory skill for **every ARAYA agent without exception.**
Teaches: consult the catalog before acting, read the manual before using unknown
functions, prefer native ARAYA capabilities, never invent commands or agents,
verify permissions before executing, delegate to specialists when they exist,
respect your own authority boundaries, register missing capabilities, and
propose new capabilities only after confirming none exist.

## What Problem This Solves

Agents skip discovery because their prompts contain enough context to proceed.
They write code from memory when a specialist should do it. They invent commands
that don't exist. They execute specialist work instead of delegating. They
create duplicate capabilities because they didn't search first.

This skill closes the gap between "I think I know" and "I verified" — and
between "I can do it" and "the right specialist should do it."

## When to Use

**Always.** This skill is always-active for every agent that has it assigned.
Activation triggers:

| Trigger | When |
|---------|------|
| **Task Start** | Agent receives a new task or user request |
| **Unknown Command** | Agent considers invoking a command not yet used in this session |
| **Delegation Decision** | Agent decides who should execute a subtask |
| **Capability Not Found** | Agent discovers no existing capability for a need |
| **Task Completion** | Agent finishes work |

## Input

- A task request from the user or an orchestrator
- Access to the ARAYA catalog (`/araya:man`)
- Knowledge of own role, skills, and permissions from `araya.yaml`

## Output

- A catalog consultation before the first tool call
- Identification of relevant commands, functions, skills, and specialists
- A delegation decision (or gap registration) for each subtask
- No invented commands, flags, agents, or skills

---

## Preflight — Mandatory Discovery Protocol

Apply these 6 behaviors **before** executing any task.

### Step 1 — Consult the ARAYA Catalog Before Starting Any Task

Before ANY tool call, query the catalog:

```
/araya:man                  — list all available capabilities
/araya:man --search <term>  — find relevant ones by keyword
```

Even if you "think" you know what to do, verify against the catalog first.

```
❌ WRONG: Receive "Deploy the app to production" → write docker-compose + kubectl from memory
✅ RIGHT: First /araya:man --search deploy → discovers Isla (infra architect)
          has kubernetes + cloud-deploy skills → delegates to Isla
```

### Step 2 — Identify Relevant Commands, Functions, Skills, and Specialists

From the catalog query, extract ALL four categories:

1. **Commands** — slash commands (`/araya:man`, `/araya:delegate`)
2. **Functions** — runtime capabilities, tools available
3. **Skills** — what domain skills exist that are relevant
4. **Specialists** — which agents own those skills

Finding only 3 of 4 = incomplete discovery.

```
Task: "Write unit tests for the auth module"
Discovery:
  Commands:  /araya:man test-case, /araya run --mode=tdd
  Functions: read, write, edit, bash, grep
  Skills:    unit-test, test-case, tdd-generate, tdd-execute
  Specialists: Teresa (QA Engineer) — unit-test, test-case, tdd-generate
              Priya (QA Lead) — e2e-strategy, cicd-quality
→ Delegates to Teresa for test generation, Priya for review
```

### Step 3 — Consult the Manual Before Using an Unknown Function

"Unknown" = not yet invoked by you in the current session. Before first use, run:

```
/araya:man <command|function|skill>
```

Confirm: syntax, required args, optional flags, preconditions, permissions, and
the responsible specialist.

```
Agent wants to use: /araya:graph:prepare (never used before in session)
→ Runs: /araya:man /araya:graph:prepare
→ Reads: purpose, syntax, preconditions, responsible agent, output format
→ Now invokes with correct syntax and awareness of constraints
```

### Step 4 — Prefer Native ARAYA Capabilities Over Duplicated Manual Procedures

Ask: "Does ARAYA already solve this?" If YES → use it. Do NOT write custom code
or manual steps that duplicate what an ARAYA command, skill, or agent provides.

```
Task: "Set up CI/CD pipeline for this project"
❌ WRONG: Write a 200-line .github/workflows/deploy.yml from scratch
✅ RIGHT: Discover Isla has cicd-pipeline skill → delegate to Isla
          Isla generates pipeline config using ARAYA conventions
```

### Step 5 — Never Invent Commands, Arguments, Flags, Agents, or Behaviors

Do NOT generate, assume, or fabricate:

- Slash commands (`/araya:fake-command`)
- Command arguments or flags (`--made-up-flag`)
- Agent names not in the registry
- Skill names not in `skills/`
- Behaviors or guarantees not documented in the catalog

Validate every command, agent name, and skill name against the catalog before use.

```
Agent thinks: "I'll use /araya:deploy --env=staging"
❌ WRONG: /araya:deploy does not exist. --env was invented.
✅ RIGHT: /araya:man --search deploy → /araya:man cloud-deploy
          Reads that Isla handles deployment. Delegates:
          /araya isla "Deploy to staging environment"
```

### Step 6 — Verify Availability, Compatibility, and Permissions Before Executing

Before executing or delegating, check:

1. **Availability:** Is the command/skill/agent enabled? (Not deprecated, not disabled)
2. **Compatibility:** Does the target runtime support this?
3. **Permissions:** Does the target agent have required permissions?

```
Agent wants to delegate "Run security penetration test" → Diana
Check: Diana's permissions → read-only (cannot write/edit/bash)
→ COMPATIBILITY CONFLICT
Resolution: Diana designs test plan, Valentina executes tooling.
```

---

## Execution — Mandatory Delegation Protocol

Apply these 4 behaviors **during** task execution.

### Step 7 — Delegate to the Specialist Agent When One Exists

After discovery identifies a specialist for the task → **delegate.** Do NOT
execute directly.

- "Exists" = registered in `araya.yaml`, has the required skill, is available
- "Competent" = agent's skills match the task's domain requirements
- Use formal delegation: `/araya <agent> "<task>"` or `/araya:delegate <agent> "<task>"`
- You remain responsible for the outcome, not the execution

```
Task: "Generate UAT package for feature X"
Discovery: Clara has uat-generate skill
✅ RIGHT: /araya clara "Generate UAT package for feature X"
❌ WRONG: Writing UAT content yourself
```

**Key constraint:** Specialist delegation is **mandatory** when ARAYA has a
competent agent for the task.

### Step 8 — Never Assume Tasks Outside Your Own Authority or Responsibility

Your authority boundaries are defined by:

- Your role in `araya.yaml`
- Your assigned skills
- Your permissions (`can_write_code: true/false`)
- Your tier (reasoning, balanced, fast)

Crossing your boundary requires explicit exception per the Exception Protocol.

```
Sonia must NOT execute: architecture, backend/frontend implementation,
testing, security, infrastructure, technical docs, data analysis,
educational design, or any specialist task.

Diana must NOT write code (read-only).

Elena audits process, not technical/mathematical correctness.

Lidia is the ONLY agent qualified to validate profitability methodology.
```

### Step 9 — Register When a Required Capability or Specialist Does Not Exist

When catalog confirms no existing capability meets the need, record the gap:

- What was needed (task description)
- What was searched (catalog queries executed)
- Why existing capabilities were insufficient
- Recommended new capability or specialist

Record to `.araya/postoffice/thread.md` directed to `po-proxy` as `status:open`,
or `.araya/plan/gaps/`.

```
Task: "Generate GDPR Data Protection Impact Assessment"
Discovery: /araya:man --search GDPR → no results
          /araya:man --search DPIA → no results
Gap: "GDPR-DPIA needed. Diana has compliance domain but no DPIA-specific
      skill or template. Recommend: create dpia-generate skill or extend
      compliance skill with DPIA module."
```

### Step 10 — Propose New Capabilities Only After Confirming None Exists

Before proposing a new command, skill, function, or agent:

1. Search the catalog exhaustively: by name, domain, purpose, similar keywords
2. Consult `/araya:man <existing-similar>` to confirm it doesn't cover the need
3. If existing capability covers 80%+ → propose extending it, not creating new
4. Only if truly no equivalent → proceed with proposal (via Step 9 first)

Include search evidence in every proposal.

```
Need: validate araya.yaml config
1. /araya:man --search validate → finds /araya:validate (delivery validation)
2. /araya:man /araya:validate → confirms it validates deliveries, not configs
3. /araya:man --search config → no config validation found
4. Gap different from /araya:validate (deliveries vs. configs)
5. Proposal: "/araya:validate-config" with evidence
```

---

## The Specialist Delegation Contract

Copied verbatim from REQ-001. Applies to ALL agents.

### Sonia's Constraints

Sonia must:
- Analyze work
- Divide it into Workstreams and Atomic Work Units
- Identify dependencies
- Request agent and model eligibility from Aurora
- Assign each unit to the corresponding specialist agent
- Coordinate sequence, parallelism, validation, and closure
- Verify each specialist returns sufficient evidence

Sonia must NOT directly execute:
- Architecture
- Backend or frontend implementation
- Testing
- Security
- Infrastructure
- Technical documentation
- Data analysis
- Educational design
- Tasks belonging to any other available specialist

Sonia may execute only activities within her delivery authority: planning,
decomposition, coordination, tracking, dependency resolution, and result
consolidation.

### General Agent Constraints

An agent may only execute work outside their specialty when ALL of:

1. No specialist is available for the task
2. Aurora confirms the absence of an adequate capability
3. The exception is formally recorded
4. Risks and limits are explicitly stated
5. Current governance permits the substitution

### Exception Protocol

To invoke an exception:

1. Query the catalog and confirm no specialist exists
2. Request Aurora to confirm absence (`/araya aurora "Verify no specialist for X"`)
3. Record the exception in `.araya/postoffice/thread.md` as `status:open`
4. State the risks and limits explicitly in your output
5. Execute only within the stated boundaries

### Prohibited Excuses

Time pressure, apparent simplicity, or convenience are **NOT** valid reasons to
bypass delegation.

---

## Integration Points

### With AGENTS.md

This skill is activated via the `## ARAYA Cross-Cutting Skills` section in the
root `AGENTS.md`. Every runtime (pi.dev, Codex, Claude CLI, AGY) reads AGENTS.md
at startup and loads the mandatory AX skills.

### With AX3.md

The root `AX3.md` preflight section references this skill as **Step 0** — the
agent must run the command-and-delegation preflight BEFORE the AX3 preflight:

1. **Command & Delegation preflight:** What capabilities exist for this task?
2. **AX3 preflight:** What contracts govern the files I'll touch?

### With /araya:man

Steps 1-3 of this skill depend on `/araya:man` for catalog queries and manual
consultation. If `/araya:man` is unavailable, follow the fallback in Step 9
(register gap).

### With the Delegation Broker

Steps 7-8 of this skill use the Delegation Broker (`/araya:delegate`) for
formal specialist delegation with correlation, session tracking, and
anti-recursion protection.

---

## Rules

| # | Rule | Gate |
|---|------|------|
| R1 | Consult catalog before first tool call — every task, no exceptions | Hard |
| R2 | Never invent commands, flags, agents, or skills — zero tolerance | Hard |
| R3 | Delegate to specialist when one exists — delegation is mandatory | Hard |
| R4 | Respect authority boundaries — no work outside your domain | Hard |
| R5 | Register gaps when a needed capability doesn't exist | Soft |
| R6 | Search exhaustively before proposing new capabilities | Soft |
| R7 | Verify availability, compatibility, and permissions before delegating | Soft |
| R8 | Prefer native ARAYA capabilities over manual duplication | Soft |
| R9 | Consult `/araya:man` for every first-use command in session | Soft |
| R10 | Identify all 4 categories in discovery (commands, functions, skills, agents) | Soft |

**Hard gates:** R1, R2, R3, R4 — zero tolerance. Violation = task is not valid.

---

## Verification — How to Confirm an Agent Applies This Skill

### Required Evidence in Every Task Trace

| # | Evidence | What to look for |
|---|----------|-----------------|
| 1 | Catalog consultation | `/araya:man` or `/araya:man --search` before first tool call |
| 2 | Manual consultation | `/araya:man <cmd>` for every first-use command |
| 3 | Delegation decision | `/araya <agent>` for each specialist-appropriate subtask |
| 4 | No inventions | Zero fabricated commands, flags, agents, skills in output |
| 5 | Gap registration | Postoffice/gap entry when capability not found |

### Validation Scorecard

| Behavior | Pass Condition | Weight |
|----------|---------------|--------|
| 1. Consult catalog before task | Trace shows catalog query before first tool call | 10 |
| 2. Identify 4 categories | Output lists commands, functions, skills, specialists | 10 |
| 3. Consult manual for unknowns | Trace shows /araya:man for each first-use command | 10 |
| 4. Prefer native capabilities | No manual duplication of existing ARAYA capability | 10 |
| 5. Never invent | Zero invented commands, flags, agents, skills | 15 |
| 6. Verify availability/perms | Trace shows permission check before delegation | 5 |
| 7. Delegate to specialist | Specialist tasks delegated, not self-executed | 20 |
| 8. Respect authority boundaries | No tasks outside agent's declared domain | 10 |
| 9. Register gaps | Missing capabilities recorded in postoffice/gaps | 5 |
| 10. Propose after confirming none exists | Search evidence in every new capability proposal | 5 |

**Minimum pass score: 85/100. Behaviors 5 and 7 are hard gates — zero tolerance.**

---

## Done Criteria

- [ ] Catalog consulted before first tool call of every task
- [ ] All 4 categories identified (commands, functions, skills, specialists)
- [ ] `/araya:man` consulted for every first-use command
- [ ] No native ARAYA capabilities duplicated manually
- [ ] Zero invented commands, flags, agents, or skills in output
- [ ] Permissions verified before all delegations
- [ ] Specialist tasks delegated, not self-executed
- [ ] No tasks executed outside declared authority boundary
- [ ] Missing capabilities registered in postoffice or gaps directory
- [ ] Every new capability proposal includes catalog search evidence
