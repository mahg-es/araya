# Vertical demonstration

A real end-to-end demonstration of the capability foundation, including REAL
native Pi subagent worker execution.

## Flow

```text
Professor instruction (PonyExpress, correlation P123)
→ capability resolution
→ selected skill(s)
→ deterministic operation (git.repository-sanity, real repo)
→ real ephemeral Pi subagent worker (native subagent mechanism)
→ worker result
→ PostOffice trace (delegation → result)
→ final structured result
```

## Run

Phase 1 (scriptable): PonyExpress instruction, resolution, worker handoff
(delegation), deterministic operation, and the worker prompt.

```bash
bash demo/vertical-demo.sh
```

Phase 2 (agent-facing caller): invoke Pi's native subagent with the generated
prompt at `demo/.run/worker-prompt.txt`, and write the worker's real output to
`demo/.run/worker-result.txt`.

Phase 3 (scriptable): record the worker result, emit the PostOffice trace, and
print the final structured result.

```bash
bash demo/vertical-demo.sh complete
```

The worker actually runs (its real output is captured in the PostOffice trace
and the final structured result). `demo/.run/` is transient state and is
git-ignored.
