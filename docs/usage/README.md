# Usage

## Install

```bash
bash araya-install.sh --target /path/to/project                 # core only
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

## ChatGPT

1. `bash bundle/chatgpt/build.sh`
2. Import `bundle/chatgpt/dist/ARAYA-AX3-v0.5.0-chatgpt.zip` per
   `bundle/chatgpt/README.md`.

## Verify

```bash
sha256sum -c SHA256SUMS.txt
bash tests/test-canonical-integrity.sh
```
