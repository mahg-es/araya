# 01 — Duplicate Registration Root Cause

**Run:** ARAYA-INSTALLER-HARDENING-20260726
**Defect detector:** Professor, through direct human inspection of the Pi command UI
**Date:** 2026-07-26

## Symptom

ARAYA slash commands appear with generated `:1` and `:2` suffixes in the Pi
command palette:

- `/araya:man:1`, `/araya:man:2`
- `/araya:delegate:1`, `/araya:delegate:2`
- `/araya:ax3:1`, `/araya:ax3:2`

Pi generates numeric suffixes when it discovers multiple extensions registering
the same logical command name.

## Root Cause

The `araya-setup.sh` installer (prior to hardening) created **TWO** extension
registrations pointing to the same file:

1. **Legacy (file format):** `~/.pi/agent/extensions/araya.ts`
   - Symlink → `$CANONICAL/extensions/araya/index.ts`
   - Pi discovers this as a single-file extension

2. **Canonical (directory format):** `~/.pi/agent/extensions/araya/index.ts`
   - Symlink → `$CANONICAL/extensions/araya/index.ts`
   - Pi discovers this as a directory extension

Both registrations export the same command names, so Pi detects duplicates and
disambiguates with `:1`/`:2` suffixes.

## Code Location (pre-hardening)

```bash
# araya-setup.sh — Lines creating duplicate registrations:
ln -sf "$CANONICAL/extensions/araya/index.ts" "$EXT_DIR/araya.ts"        # LEGACY
ln -sf "$CANONICAL/extensions/araya/index.ts" "$EXT_DIR/araya/index.ts"  # CANONICAL
```

## Fix

The hardened installer creates **only** the canonical directory-format
registration (`~/.pi/agent/extensions/araya/index.ts`) and removes any
pre-existing legacy `araya.ts` registration.

Legacy `araya.ts` was already removed during ponny-express-10019. The
hardening ensures it can never be recreated by future installs.

## Verification

```bash
ls ~/.pi/agent/extensions/araya.ts      # MUST NOT EXIST
ls ~/.pi/agent/extensions/araya/index.ts # MUST EXIST as symlink to repo
```
