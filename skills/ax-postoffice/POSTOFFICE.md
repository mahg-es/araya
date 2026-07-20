# The POSTOFFICE — ARAYA's Operational-Directive Channel

**Status:** Canonical (framework institution)
**Kind:** Coordination, not governance — advisory, never a gate

The POSTOFFICE is the canonical channel through which the human authority routes
**day-to-day operational direction** to the agents doing the work — in ARAYA or in
any repository ARAYA governs. It is the single, derivable standard. Every project
instance (`<project>/.araya/postoffice/`) derives **from this document**; this
document is the source of truth, not any one project's copy.

The postoffice exists so the human authority stops relaying every message by hand:
agents read it at the start of a work cycle and write to it at the end. It is
**markdown plus a standing instruction — nothing more.** It has no engine, no
enforcement, and no power to stop or close work.

---

## 1. The operational / governance boundary (load-bearing)

The postoffice carries **operational direction only**. Governance acts never travel
it. This is the rule that keeps the postoffice from becoming an informal parallel
ledger — a back door that closes work where the governed channels never see it.

### Allowed on the postoffice — OPERATIONAL direction

- **Priorities** — what to work on next, what to do first, what to park.
- **Work routing** — who picks up what; handing a task from one participant to another.
- **Context** — background, constraints, links, the state of the world a participant needs.
- **Day-to-day operational questions** — "which branch?", "is the prototype still the base?", "what did the last cycle leave open?"
- **Status** — "cycle finished, here is what I touched," "waiting on the Director."
- **Handoffs** — passing the baton between participants.

### Forbidden on the postoffice — GOVERNANCE acts (these go to the governed channels)

- **Approve a decision record** — a decision record's status transition + the recorded decision.
- **Accept a deliverable** — an acceptance recorded on the governed channel, gated by the readiness and verification gates.
- **Declare something done** — a typed disposition emitted by the verifier and written to the governed ledger.
- **Emit a binding disposition** — only the independent verifier emits; written to the governed ledger.

**This holds even when the directive comes from the human authority (the Director).**
The Director saying "I accept this" *in a postoffice message* does **not** accept it.
Acceptance exists only when it is recorded on the governed channel, where the
readiness gate, the verifier, and the ledger see it. The postoffice may carry the
*pointer* ("I've accepted it on the ledger — route the next item"); the **act**
itself always lives on the governed channel.

> **The Director DIRECTS through the postoffice; the Director GOVERNS through the
> ledgers and the decision records — both, through different doors, by design.**

### The failure mode this prevents

If a governance act could be performed by a loose postoffice message, the postoffice
becomes an **informal parallel ledger**: "done" would be asserted in a thread the
readiness gate, the verifier, and the ledger never see. A green project would mean
"someone said so in a message," not "the verifier substantiated it against evidence."
The boundary keeps the postoffice a coordination surface and keeps the governed
channels the only place work is ever closed. The back door stays shut.

---

## 2. Advisory, never a gate (load-bearing)

The postoffice is **consulted and considered — never obeyed as a gate.**

- A participant **reads** the whole postoffice at cycle start and **takes its
  operational directives into account.** It **writes** its entry at cycle end.
- A postoffice message can **NEVER block, halt, or force** a participant. It has no
  blocking power at all.
- The `status:` markers are **informational**, not gates: `blocked` means "this needs
  the Director," `open` means "this awaits a reply" — neither one stops a run.
- **Blocking work is a governance act** — a stop or a binding disposition — and it
  travels the **governed channels** (the verifier, the ledger, the decision records),
  never the postoffice.

A postoffice that could block would be **governance disguised as coordination, and is
forbidden.** The advisory rule preserves the §1 boundary in both directions: the
postoffice can neither **close** work (it has no emitter) nor **stop** work (it has no
gate).

**Implementation consequence.** The postoffice is markdown + a standing instruction.
It contains **no emitter, no disposition vocabulary, no ledger path, and no verifier
wiring** — there is nothing for a governance act, or a block, to be expressed with.

---

## 3. Roles — by function, never by model or vendor

The channel is defined by **roles, by function.** Any agent occupying a role uses it
identically; swapping the underlying model changes nothing about the channel. Roles
are **never** named by AI model or vendor.

| Role | Function |
|---|---|
| **Director** (the human authority) | Routes operational direction. The only role that may also act on the governed channels — governance through the other door (§1). |
| **PO proxy** | Stands in for the Product Owner in day-to-day routing and coordination; carries the Director's operational intent to the participants. |
| **Participants** (executor / strategy agents) | The agents doing the work — an executor agent in the repository; a strategy/architecture agent. Defined by what they do. |

A message header carries the **author-role**, never a model id. (Earlier hand-rolled
prototypes named the two sides by vendor; the canonical standard is function-named,
and any such prototype is reconciled to function names — see §6.)

---

## 4. Canonical structure

**Location.** The postoffice lives in the project governance namespace:
`<project>/.araya/postoffice/`. It is **per-project** — coordination is project-local;
each governed project has its own postoffice, derived from this standard.

**Files.**

- `PROTOCOL.md` — the project's derived copy of the rules (derived from this standard).
- `thread.md` — a **single append-only** log.

**Why a single append-only thread (not numbered letters).** One file, read whole at
cycle start and appended at cycle end, mirrors the append-only ledger philosophy — one
book, total order, newest last — so agents follow one discipline, not two. Per-message
files add directory sprawl and a second discipline for no coordination benefit.

**Append-only discipline (same as the ledgers).** Entries are **appended, never edited
or deleted in place.** A correction is a **new entry**, never a rewrite of a prior line.
History is never falsified.

**Message header.** Every entry carries an exact header:

```
### NNN · <author-role> · <direction> · <YYYY-MM-DD HH:MM> · status:<open|done|blocked|fyi>
```

- `NNN` — a 3-digit correlative (`001`, `002`, …).
- `<author-role>` — a **function name** (§3): `director`, `po-proxy`, `executor`, `strategy`.
- `<direction>` — sender→recipient roles, e.g. `director→executor`, `executor→po-proxy`.
- `status` — one of: `open` (awaits a reply), `done` (closed), `blocked` (needs the
  Director), `fyi` (informational, no reply needed). **All four are informational —
  none is a gate (§2).**

A template `PROTOCOL.md` and a seed `thread.md` ship with the framework hook (see the
`ax-postoffice` skill and its `templates/`).

---

## 5. The framework hook — how the standing instruction is institutionalized

The standing instruction is one line of behavior: **consult the postoffice at cycle
start; write to it at cycle end; consider — never obey-as-a-gate — what it says.**

To make this an **institution** rather than a per-project habit, it is hooked at the
framework level, in three parts:

1. **The framework standard** — this document, the single source of truth.
2. **The `ax-postoffice` skill** — ships the standing instruction and the templates;
   any governed agent invokes it to *consult-and-write* the channel. The behavior lives
   **once**, in the framework, so it cannot drift across projects.
3. **A one-line `AGENTS.md` pointer per project** — how a project opts in. The project
   adds a single line to its root `AGENTS.md` (the agent-instruction entry point):

   ```markdown
   - **Postoffice:** this project runs the ARAYA postoffice — consult `.araya/postoffice/thread.md` at cycle start and append your entry at cycle end (advisory, never a gate). See the `ax-postoffice` skill.
   ```

This keeps the routine institutional and uniform while leaving each project an explicit,
visible opt-in.

---

## 6. Reconciling an existing prototype (plan)

A project that already grew a provisional postoffice (a `PROTOCOL.md` + an append-only
`thread.md`) is brought to this standard **without losing its thread history**:

1. **Preserve the thread.** `thread.md` is append-only; existing entries are **never
   rewritten or renumbered.** Reconciliation **appends** — it does not rewrite the past.
2. **Append a reconciliation marker.** A new entry (next correlative, `status:fyi`)
   records that the instance now derives from this standard, and notes that the
   role-naming change takes effect **from this entry forward**.
3. **Correct roles going forward.** `PROTOCOL.md` is updated to the function-named roles
   (§3) and the role-named header (§4); **new** entries use function names. Past entries
   keep their original headers (append-only) — the marker explains the transition, so no
   history is falsified.
4. **Derive, don't fork.** The updated `PROTOCOL.md` is regenerated **from** this
   standard, so the project becomes a derivation, not a bespoke variant.
5. **Adopt the hook.** The project's `AGENTS.md` gets the one-line pointer (§5).

This is a **plan**. Reconciling any specific project is decided and executed by the
Director in that project, separately. This document executes no migration.
