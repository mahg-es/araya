# Troubleshooting

Real problems observed while using ARAYA, and how to diagnose them. Start with:

```bash
python3 cli/araya --json status
python3 cli/araya --json doctor
```

`status` reports product identity, versions, and registry counts. `doctor`
reports `python`, `git`, `gh`, catalog load errors, and `canonical_integrity`.
`doctor` exits `1` when a gating check fails.

## The installer refuses my target (`~/.pi` protected)

**Symptom:** `araya-install.sh` errors on a target under `~/.pi` (including
canonicalized spellings like `~/./.pi`).

**This is correct.** ARAYA never installs into the Pi user layer and never takes
over global Pi. Install into a *project* instead:

```bash
bash araya-install.sh --target /path/to/project
```

## "Daneel" is separate from ARAYA

**Symptom:** confusion about whether ARAYA owns the `pi` agent you are talking
to.

**Clarification:** running `pi` starts **Daneel**, the Professor's personal
Pi **user-layer** agent. `DANEEL != ARAYA`. ARAYA is a project-scoped operating
model; it does not own, install, or configure Daneel, and ARAYA never creates a
persona named `daneel`. Inside the ARAYA repository, Daneel simply loads the
repository's ARAYA context automatically (via `AGENTS.md`).

## Provider / model context looks "unknown"

**Symptom:** `araya runtime model-context` returns `provider: unknown`,
`model: unknown`, etc.

**Explanation:** this is runtime **metadata**, not a failure. It reports only
what the host exports (`ARAYA_PROVIDER`, `ARAYA_MODEL` / `ARAYA_MODEL_ID`,
`ARAYA_REASONING`, `ARAYA_SESSION`). When those are unset it returns `unknown`
by design and `read_only: true`. It is **not** the agent's operating model.

## The native subagent is not available

**Symptom:** you composed a worker (`delegate run`) but no native subagent
executed it.

**Explanation:** the library intentionally does **not** spawn the host's
subagent. `delegate run` resolves + composes + records the PostOffice handoff
and returns the worker prompt; the **agent-facing caller** (the host agent, e.g.
Daneel) invokes the native `subagent` mechanism, then calls `delegate result`.
If no subagent is available in the host, the worker cannot run — this is an
adapter-boundary condition, not a library bug.

## How to verify a resolution (no guessing)

```bash
# What would this intent select? (capabilities, skills, operations)
python3 cli/araya --json delegate "review the design of a REST API"

# Inspect the catalog directly
python3 cli/araya --json capabilities
python3 cli/araya --json skills list
python3 cli/araya --json operation list
python3 cli/araya --json operation describe git.merge-gate
```

Resolution is deterministic and token-based (no substring matching): a
read-only intent selects no state-changing operation, and a single generic word
does not drag in an unrelated operation.

## PostOffice operational state vs product files

**Symptom:** `git status` shows an untracked `.araya/` directory after a
delegation.

**Explanation:** the PostOffice trace is **operational state**, not product
files. `delegate run` / `delegate result` append to
`<project>/.araya/postoffice/thread.jsonl`. This is the delegation/result trace
(append-only, correlation-id keyed). It is separate from tracked product files
and is never a governance artifact. Inspect it with:

```bash
python3 cli/araya --json postoffice list
python3 cli/araya --json postoffice trace <correlation_id>
```

## Canonical integrity fails

**Symptom:** `doctor` reports `canonical_integrity: false`, or
`sha256sum -c SHA256SUMS.txt` reports a mismatch.

**Meaning:** one of the 13 canonical core files differs from the adopted canon.
Diagnose the named file **before** mutating anything; restore it from the
adopted canon rather than editing it. The canonical files are byte-identical and
must not be edited in place.

## Where to look next

- **Usage / HOW TO:** [`usage/README.md`](usage/README.md)
- **Installation & upgrade:** [`INSTALLATION.md`](INSTALLATION.md)
- **Architecture (ADRs):** [`architecture/`](architecture/)
