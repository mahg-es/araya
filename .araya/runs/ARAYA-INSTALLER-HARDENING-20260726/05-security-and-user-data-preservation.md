# 05 — Security and User-Data Preservation

**Run:** ARAYA-INSTALLER-HARDENING-20260726
**Date:** 2026-07-26

## Design Principles

### Files Protected (Never Touched)

| File | Content | Risk if Exposed |
|------|---------|----------------|
| `auth.json` | Provider API keys, tokens | Credential leak |
| `models.json` | Model configurations | User preferences |
| `models-store.json` | Model store data | User data |
| `settings.json` | Pi settings | User preferences |
| `prompts/` | User prompt history | Privacy |
| `skills/` (non-araya) | User-installed skills | Work loss |

### Validation: Settings Unchanged

```
BEFORE (SHA-256):
auth.json:        1c1d65ba7dd9204f7e94e7fa3dea5029f8664415233f0f3d994df361eac2d080
models.json:      9e2f3953cbc56f35bc67327bf7251e907c58cb74efcf69e6951cfac0d61d9c04
models-store.json: 156fe50d0fa52d3170464d75c20758ec427d5561298d040a7bf331f6a080e251

AFTER (SHA-256):
auth.json:        1c1d65ba7dd9204f7e94e7fa3dea5029f8664415233f0f3d994df361eac2d080  ✅
models.json:      9e2f3953cbc56f35bc67327bf7251e907c58cb74efcf69e6951cfac0d61d9c04  ✅
models-store.json: 156fe50d0fa52d3170464d75c20758ec427d5561298d040a7bf331f6a080e251  ✅
```

All three files have identical SHA-256 hashes before and after installation.

## Installation Safety

### Preflight Checks

Before any destructive change, the installer runs `inventory()` which validates:
1. Canonical source exists in repository
2. Current installation state (legacy, canonical, deps)
3. Number of active ARAYA registrations

If preflight fails, the installer exits before making ANY changes.

### Backup Before Modification

```
~/.pi/agent/.araya-backup-YYYYMMDD-HHMMSS/
├── index.ts          (previous canonical extension)
├── package.json      (previous dependency manifest)
├── package-lock.json
└── node_modules/     (previous dependencies)
```

### Automatic Restore on Failure

The installer registers an EXIT trap:

```bash
trap 'if [ "$NEEDS_RESTORE" = true ]; then
        # Restore from backup
        cp "$BACKUP_DIR/index.ts" "$CANONICAL_EXT"
        cp -r "$BACKUP_DIR/node_modules" "$EXT_DIR/araya/"
        ...
      fi' EXIT
```

Once installation succeeds, `NEEDS_RESTORE=false` and `trap - EXIT` disarm it.

### Staging

- Legacy artifacts are backed up before removal
- The new symlink replaces (not appends) to the canonical path
- Package.json is updated atomically (via cp)
- npm install runs idempotently in the target directory

## Secrets Protection

- No secrets are printed in installer output
- No environment variables containing secrets are read
- `auth.json` is never read, parsed, or referenced
- `models-store.json` is never read, parsed, or referenced
- Only ARAYA-managed files are modified

## Unknown User File Protection

The installer follows the rule: "Never delete an unknown user file merely
because its name contains 'araya'."

- Only files at known canonical paths are modified
- The `araya/` directory is not deleted — only known files within it
- If `araya/` contains unknown files after uninstall, it is preserved
- `rmdir` only succeeds if the directory is empty
