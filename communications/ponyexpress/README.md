# PonyExpress

The Professor's explicit communication channel toward the agent system (Daneel /
agents). Durable, append-only, and correlated.

## What PonyExpress is NOT

PonyExpress is **not** an authority database. The Professor's actual authority
exists independently of the transport. An instruction recorded here does not by
itself grant, transfer, or record authority.

## Correlation

An instruction carries a correlation id; every delegation and result downstream
carries the same id, so the instruction can be followed end to end:

```text
Professor → PonyExpress P123 → Daneel → PostOffice A456 → Agent → PostOffice A457
correlation_id = P123
```

## Storage

Append-only JSONL at `<project>/.araya/ponyexpress/inbox.jsonl`.

## API

Implemented in `cli/araya_lib/ponyexpress.py` (`PonyExpress`) and exposed via:

```bash
araya ponyexpress send --recipient <r> --subject <s> [--body <b>] [--correlation <c>]
araya ponyexpress list
araya ponyexpress read <instruction-id>
araya ponyexpress trace <correlation-id>
```
