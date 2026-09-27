# Installation

ARAYA installs **into a target directory** (a project). It never installs
globally and never takes over `~/.pi`.

## Prerequisites

- `bash` and a POSIX shell.
- `python3` (≥ 3.8; the CLI and library are stdlib-only — no pip packages).
- `git` (for Git operations and `doctor`), optional `gh` (GitHub CLI).
- `sha256sum` (canonical integrity check).
- `zip` only if you build the ChatGPT bundle.

Check the environment at any time:

```bash
python3 cli/araya --json doctor
```

## Fresh install

```bash
# Core + capability foundation into a project (default target: current dir).
bash araya-install.sh --target /path/to/project

# Opt-in: project-scoped Pi adapter (adds /araya to that project only).
bash araya-install.sh --target /path/to/project --adapter pi

# Opt-in: build the reproducible ChatGPT bundle (no target required).
bash araya-install.sh --adapter chatgpt
```

The installer verifies the canonical core (`SHA256SUMS.txt`) before and after
copying, then reports `ARAYA installer result: PASS`.

### What it writes

Into `<target>/`:

- the 13 canonical core files (`GPT-CONFIGURATION.md`, `K01`–`K10`,
  `ADOPTION-RECORD.md`, `ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md`, `SHA256SUMS.txt`);
- the capability foundation: `cli/`, `operations/`, `skills/`, `capabilities/`,
  `communications/`, `runtime/`, `delegation/`.

With `--adapter pi` only, additionally: `<target>/.pi/prompts/araya.md`
(project-scoped; there is no global Pi change).

## Boundaries (enforced)

- **Never `~/.pi`.** The installer refuses to write into the Pi user layer
  (`~/.pi`, `~/.pi/agent`, and canonicalized equivalents such as `~/./.pi`).
- **Never a target named `daneel`.** The name is reserved to the Professor's
  personal Pi-level agent; ARAYA never creates a `daneel` persona.
- **Project-scoped.** Default install is core-only; the Pi adapter is opt-in
  and only touches `<target>/.pi/`.

`tests/test-installer.sh` enforces these boundaries, including a before/after
snapshot of `~/.pi`.

## Verify the install

```bash
cd /path/to/project
python3 cli/araya --json status      # product, versions, counts
python3 cli/araya --json doctor      # python/git/gh + canonical_integrity
sha256sum -c SHA256SUMS.txt          # canonical core intact
bash tests/test-canonical-integrity.sh   # if the tests were copied with the repo
```

## Upgrade from a previous stable version

There is no separate upgrade command; the installer is **idempotent** and is the
upgrade path. Re-run it over the existing target: it re-verifies and overwrites
the canonical core and capability foundation in place.

```bash
# From the (newer) ARAYA checkout:
bash araya-install.sh --target /path/to/previous-install
bash araya-install.sh --target /path/to/previous-install --adapter pi  # if used
```

Then re-run the verification commands above. Because the canonical core is
byte-identical to the adopted canon (`SHA256SUMS.txt`), a partial or mismatched
upgrade is detectable by integrity.

## Uninstall / cleanup

The installer has no uninstall command; it only ever created files under
`<target>`. To remove ARAYA from a project:

```bash
# 1. Remove the capability foundation + canonical core files it installed.
cd /path/to/project
rm -rf cli operations skills capabilities communications runtime delegation
rm -f GPT-CONFIGURATION.md K0[1-9]-*.md K10-*.md \
      ADOPTION-RECORD.md ARAYA-AX3-v0.5.0-CANONICAL-AUDIT.md SHA256SUMS.txt
# 2. If the Pi adapter was installed into this project:
rm -f .pi/prompts/araya.md
```

`~/.pi` is never touched, so there is nothing to undo there.

## ChatGPT bundle

```bash
bash bundle/chatgpt/build.sh
```

Produces `bundle/chatgpt/dist/ARAYA-AX3-v0.5.0-chatgpt.zip`. Import it into a
custom GPT following `bundle/chatgpt/README.md` (kernel as Instructions, exactly
the 10 Knowledge files).
