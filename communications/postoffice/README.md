# PostOffice

Agent-to-agent messaging + historical trace. A shared, append-only log of
messages carrying sender, recipient, timestamp, correlation id, message type,
subject, body, and an optional acknowledgement.

## What PostOffice is NOT

PostOffice is **not** an authority, an approval ledger, a workflow state
machine, canonical repository truth, or an automatic continuation controller.

- A message can never block, halt, or force a run.
- Governance acts (approvals, acceptances, declarations of done, dispositions)
  never travel the postoffice.

## Storage

Append-only JSONL at `<project>/.araya/postoffice/thread.jsonl`. Newest last.
A correction is a new message, never a rewrite.

## API

Implemented in `cli/araya_lib/postoffice.py` (`PostOffice`) and exposed via:

```bash
araya postoffice send --recipient <r> --subject <s> [--sender <s>] [--body <b>] [--type <t>] [--correlation <c>]
araya postoffice list
araya postoffice read <message-id>
araya postoffice ack <message-id>
araya postoffice trace <correlation-id>
```
