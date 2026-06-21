# Postoffice — operational-directive channel

Derived from the ARAYA postoffice standard (the `ax-postoffice` skill / `POSTOFFICE.md`).
This is **coordination, not governance**: it does not replace the ledgers or the
decision records. It is **advisory, never a gate.**

## Files

- `thread.md` — single append-only log. Read it **whole** at cycle start; **append**
  your entry at cycle end. Newest last.

## The boundary

- **Allowed (operational):** priorities, work routing, context, day-to-day operational
  questions, status, handoffs.
- **Forbidden (governance — go to the governed channels):** approve a decision record,
  accept a deliverable, declare something done, emit a binding disposition. This holds
  **even when the directive comes from the Director.**

## Advisory, never a gate

A postoffice message can never block, halt, or force you. `status:blocked`/`open` are
**informational**, not gates. Blocking work is a governance act on the governed
channels, never something a postoffice message does. Consider the channel; you are
never bound by it.

## Rules

1. **Append-only.** Never edit or delete a prior entry. A correction is a new entry.
2. **Header (exact):**
   ```
   ### NNN · <author-role> · <direction> · <YYYY-MM-DD HH:MM> · status:<open|done|blocked|fyi>
   ```
   `NNN` = 3-digit correlative. `<author-role>` and `<direction>` use **function roles**
   only: `director`, `po-proxy`, `executor`, `strategy` — never an AI model or vendor name.
3. **status:** `open` = awaits a reply · `done` = closed · `blocked` = needs the Director
   · `fyi` = informational. All four are informational; none is a gate.
4. **Single thread.** One `thread.md`; read whole, append at end.
5. **Scope:** this project only.

## Standing instruction (for every participant)

At the **start** of each cycle: read `thread.md` whole; consider any `status:open` entry
directed at your role and any relevant context/priorities. At the **end** of each cycle:
append one entry (`<your-role>→<recipient>`) with what you did or need, and its status.
