# Usage

## Install

```bash
bash araya-install.sh --target /path/to/project                 # core + foundation
bash araya-install.sh --target /path/to/project --adapter pi    # + project-scoped Pi
bash araya-install.sh --adapter chatgpt                         # build ChatGPT bundle
```

Default installation is core-only and never touches global `~/.pi`.

## Pi — inside this repository (automatic)

When Pi runs inside this repository, `AGENTS.md` is loaded automatically as
project context, so the AX3 v0.6.0 operating model is active without any
command:

```bash
cd ~/github/mahg-es/araya
pi
```

No `/araya` invocation is needed here.

## Pi — explicit session in another project

The `/araya` command exists to intentionally bring ARAYA context into a
*different* project:

1. Install the adapter into that project (see above).
2. Inside that project, run `/araya <task>`.

The adapter is project-scoped and opt-in; it never changes global Pi (or the
Professor's user-level Daneel identity), and ARAYA never hooks global Pi.

## CLI (agent-first)

Run from the repository or an installed target:

```bash
python3 cli/araya --help
python3 cli/araya --json status
python3 cli/araya --json operation list
python3 cli/araya --json operation describe git.merge-gate
python3 cli/araya --json operation resolve "check repository state"
python3 cli/araya --json operation execute git.repository-sanity repo=/path/to/repo
python3 cli/araya --json git sanity --repo /path/to/repo
python3 cli/araya --json git merge-gate --pr 123 --candidate <sha> --base dev-mahg
python3 cli/araya --json skills list
python3 cli/araya --json skills show adr-write
python3 cli/araya --json capabilities
python3 cli/araya --json delegate "publish this branch to integration"
python3 cli/araya --json runtime model-context
```

Exit codes: `0` success, `1` operation failure, `2` usage error. `--json` gives
machine-readable output. `--project DIR` targets runtime state (PostOffice,
PonyExpress, quota, cycle, notifications) at a specific project; `--root DIR`
overrides where the foundation data lives.

## Natural request (do not name skills)

State the intent in words; the resolver selects the capabilities and skills. Do
**not** name skills, and read-only intents never select a state-changing
operation:

```bash
# Resolve only (capabilities + skills + operations):
python3 cli/araya --json delegate "review the design of a minimalist REST API"
# → capabilities: design-api ; skills: api-design ; operations: []

python3 cli/araya --json delegate "verify the repository is sane"
# → capability: verify-repository ; skill: git-publication ; operations: [read-only git checks]
```

The resolver is deterministic and token-based (exact tokens, EN/ES, no substring
matching), and derives operations only from the selected capabilities/skills —
never from arbitrary words in the request.

## Ephemeral worker execution (real native subagent)

When the intent needs a specialist (`needs_specialist: true`), `delegate run`
composes an **ephemeral** worker from the selected skills — a random name with
no architectural meaning, not a permanent persona, and never Daneel:

```bash
# 1. Resolve + compose + record the PostOffice handoff; emits the worker prompt.
python3 cli/araya --json delegate run --correlation P123 "review this API design"
# 2. The agent-facing caller (e.g. Daneel) invokes the host's NATIVE subagent
#    with the emitted worker prompt (the library does not spawn it).
# 3. Record the worker's result and emit the correlation trace.
python3 cli/araya --json delegate result --correlation P123 --worker <name> \
  --status PASS --body "<result summary>"
```

The worker must remain ephemeral and non-Daneel; it is read-only unless the
task genuinely requires otherwise.

## Interpret the correlation / PostOffice

A single `correlation_id` ties an instruction to its delegation and result. Read
the trace to see the full chain (sender → recipient, type, timestamps):

```bash
python3 cli/araya --json postoffice trace P123
```

Typical chain: `daneel → <worker>` (message_type `delegation`) then
`<worker> → daneel` (message_type `result`). PostOffice is messaging + trace
only — never an authority, approval ledger, or gate. Its state lives in
`<project>/.araya/postoffice/thread.jsonl` (operational, not a product file).

## Outside an ARAYA project

ARAYA context does **not** leak into unrelated projects. Outside this repository
and outside a project with the opt-in adapter:

- `pi` starts Daneel as usual; the ARAYA AX3 context is **not** loaded;
- `/araya` is unavailable unless the project-scoped adapter was installed with
  `--adapter pi`;
- no global Pi hooks, shell gates, or auto-continuation are installed.

```bash
cd ~/github && pi      # plain session: no ARAYA takeover
```

## PostOffice / PonyExpress / Relay

```bash
# Professor instruction (PonyExpress)
python3 cli/araya --project /path/to/project ponyexpress send \
  --recipient daneel --subject "do X" --correlation P123

# Agent delegation + result (PostOffice, correlated to P123)
python3 cli/araya --project /path/to/project relay handoff \
  --sender daneel --recipient agent --instruction P123 --subject "do X"
python3 cli/araya --project /path/to/project relay trace P123
```

## ChatGPT

1. `bash bundle/chatgpt/build.sh`
2. Import `bundle/chatgpt/dist/ARAYA-AX3-v0.6.0-chatgpt.zip` per
   `bundle/chatgpt/README.md`.

## Verify

```bash
sha256sum -c SHA256SUMS.txt
bash tests/test-canonical-integrity.sh
bash tests/test-canonical-version-coherence.sh
bash tests/test-installer.sh
bash tests/test-pi-adapter.sh
bash tests/test-chatgpt-bundle.sh
bash tests/test-readme-contract.sh
bash tests/test-capability-foundation.sh
bash demo/vertical-demo.sh
```

## See also

- **Installation & upgrade:** [`../INSTALLATION.md`](../INSTALLATION.md)
- **Troubleshooting:** [`../TROUBLESHOOTING.md`](../TROUBLESHOOTING.md)
- **Architecture (ADRs):** [`../architecture/`](../architecture/)
