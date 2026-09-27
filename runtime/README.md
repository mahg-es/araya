# Runtime utilities

Small, reusable, non-invasive runtime helpers. Implemented in
`cli/araya_lib/runtime.py`.

## model-context

Read-only runtime metadata — provider, model, reasoning level, session. This is
runtime information, **not** Daneel's operating model. Reads a documented set of
environment variables; never writes anything.

```bash
araya runtime model-context
```

## quota

Read/guard consumption against a limit. Explicit and opt-in; nothing is enforced
globally.

```bash
araya runtime quota record --amount 1000 --unit tokens
araya runtime quota used
araya runtime quota guard --limit 5000
```

## cycle

Cycle duration / copy / UX helper. No governance cycles are recreated.

```bash
araya runtime cycle start --name <name>
araya runtime cycle end --token <token>
```

## notifier

Non-invasive notifications/events — append to a local event log only. No global
hooks, no OS-level interception.

```bash
araya runtime notify --event <name> [--payload '<json>']
```
