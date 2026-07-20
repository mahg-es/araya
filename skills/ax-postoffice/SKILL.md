---
name: ax-postoffice
description: "Consult and write the ARAYA postoffice — the operational-directive channel. Advisory, never a gate: read it at cycle start, append your entry at cycle end, consider its directives, never be blocked by it. Governance acts never travel the postoffice."
---

# AX Postoffice

The standing instruction for the **postoffice** — ARAYA's operational-directive
channel. This skill is the framework hook that makes the postoffice an institution
rather than a per-project habit. The canonical institution definition is
`POSTOFFICE.md` (next to this file); this skill is **how an agent uses it each cycle.**

## What problem this solves

The human authority (the Director) should not have to relay every operational
message by hand into each agent's run. The postoffice is a shared, append-only
channel agents read at the start of a work cycle and write to at the end — so
priorities, routing, context, questions, status, and handoffs flow without
hand-relaying. It is **markdown plus this standing instruction — nothing more.**

## When to use

Every work cycle, when the project runs the postoffice (it carries the one-line
`AGENTS.md` pointer):

- **At cycle start** — before doing work, **consult** the postoffice.
- **At cycle end** — before finishing, **write** your entry.

## The boundary — what the postoffice carries (read this first)

**Operational direction ONLY.** Allowed: priorities, work routing, context,
day-to-day operational questions, status, handoffs.

**Governance acts NEVER travel the postoffice** — not even from the Director:
approving a decision record, accepting a deliverable, declaring something done,
emitting a binding disposition. Those stay on the **governed channels** (the
decision records, acceptances, the verifier, the ledger). If a message *looks*
like one of these, it does not take effect here; the act lives on the governed
channel, and the postoffice may only carry a pointer to it.

The Director **directs** through the postoffice and **governs** through the
ledgers/decision records — different doors, by design. See `POSTOFFICE.md §1`.

## Advisory, never a gate

The postoffice is **consulted and considered — never obeyed as a gate.**

- A postoffice message can **never block, halt, or force** you. It has no blocking
  power.
- `status:blocked` / `status:open` are **informational**, not gates — they tell you
  something needs the Director or awaits a reply; they do **not** stop your run.
- Blocking work is a governance act (a stop / a binding disposition) on the governed
  channels — never something a postoffice message can do.

You **consider** the channel; you are never **bound** by it. See `POSTOFFICE.md §2`.

## Input

- The project's `.araya/postoffice/thread.md` (read whole).
- Your role, by function: `director`, `po-proxy`, `executor`, or `strategy` (never a
  model/vendor name).

## Output

- One appended entry in `.araya/postoffice/thread.md`, newest last. Nothing else —
  this skill writes no ledger, emits no disposition, and gates nothing.

## Steps

1. **At cycle start — consult.** Read `.araya/postoffice/thread.md` in full. Note any
   `status:open` entries directed at your role and any context/priorities/routing that
   bear on this cycle. **Consider** them; do not treat any of them as a gate.
2. **Do the work** as directed by the governed channels and your task — informed by,
   but never blocked by, the postoffice.
3. **At cycle end — write.** Append one entry with the exact header:
   ```
   ### NNN · <author-role> · <direction> · <YYYY-MM-DD HH:MM> · status:<open|done|blocked|fyi>
   ```
   `NNN` = next 3-digit correlative; `<author-role>` = your function role;
   `<direction>` = e.g. `executor→po-proxy`; `status` ∈ {open, done, blocked, fyi}.
   Write what you did, what you need, or your status.

## Rules

- **Append-only.** Never edit or delete a prior entry. A correction is a **new** entry,
  never a rewrite. Same discipline as the ledgers.
- **Single thread.** One `thread.md`, read whole, appended at the end, newest last.
- **Roles by function only.** `director` / `po-proxy` / `executor` / `strategy` — never
  an AI model or vendor name in the header or body.
- **No governance acts.** Never approve, accept, declare-done, or emit a disposition
  here — those are forbidden on the postoffice and belong on the governed channels.
- **Never a gate.** Never let a postoffice entry block, halt, or force a run; never
  treat `status:blocked`/`open` as a precondition. It is advisory.
- **No enforcement surface.** This skill produces a markdown entry only — no emitter,
  no disposition, no ledger write, no verifier call.

## To adopt the postoffice in a project

Add **one line** to the project's root `AGENTS.md` (the agent-instruction entry point):

```markdown
- **Postoffice:** this project runs the ARAYA postoffice — consult `.araya/postoffice/thread.md` at cycle start and append your entry at cycle end (advisory, never a gate). See the `ax-postoffice` skill.
```

Then create `.araya/postoffice/` from the bundled templates (`templates/protocol-template.md`
→ `PROTOCOL.md`, `templates/thread-seed.md` → `thread.md`).
