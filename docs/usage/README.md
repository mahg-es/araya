# Usage

## Install

```bash
bash araya-install.sh --target /path/to/project                 # core only
bash araya-install.sh --target /path/to/project --adapter pi    # + project-scoped Pi
bash araya-install.sh --adapter chatgpt                         # build ChatGPT bundle
```

Default installation is core-only and never touches global `~/.pi`.

## Pi — explicit session

1. Install the adapter into a project (see above).
2. Inside that project, run `/araya <task>`.

Plain `pi` is unaffected. The adapter is project-scoped and opt-in.

## ChatGPT

1. `bash bundle/chatgpt/build.sh`
2. Import `bundle/chatgpt/dist/ARAYA-AX3-v0.5.0-chatgpt.zip` per
   `bundle/chatgpt/README.md`.

## Verify

```bash
sha256sum -c SHA256SUMS.txt
bash tests/test-canonical-integrity.sh
```
