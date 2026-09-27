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
project context, so the AX3 v0.5.0 operating model is active without any
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
2. Import `bundle/chatgpt/dist/ARAYA-AX3-v0.5.0-chatgpt.zip` per
   `bundle/chatgpt/README.md`.

## Verify

```bash
sha256sum -c SHA256SUMS.txt
bash tests/test-canonical-integrity.sh
bash tests/test-installer.sh
bash tests/test-pi-adapter.sh
bash tests/test-chatgpt-bundle.sh
bash tests/test-readme-contract.sh
bash tests/test-capability-foundation.sh
bash demo/vertical-demo.sh
```
