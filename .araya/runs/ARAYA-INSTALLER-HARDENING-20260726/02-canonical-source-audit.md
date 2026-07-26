# 02 — Canonical Source Audit

**Run:** ARAYA-INSTALLER-HARDENING-20260726
**Date:** 2026-07-26

## Canonical Extension Source

**Path:** `extensions/araya/index.ts` (in repository)
**Lines:** ~2830
**Purpose:** ARAYA pi.dev extension — registers slash commands, agent delegation, and governance operations.

### Dependencies

The extension imports the following external packages:

| Import | Source | Status |
|--------|--------|--------|
| `@earendil-works/pi-coding-agent` | Pi SDK | Resolved by pi runtime |
| `typebox` | Pi SDK | Resolved by pi runtime |
| `js-yaml` | npm | Requires `npm install` |
| `argparse` | npm | Requires `npm install` (used by /araya:man command) |

### Repository Package.json

Created at `extensions/araya/package.json` (was missing before hardening):

```json
{
  "name": "araya-extension",
  "version": "1.0.0",
  "description": "ARAYA pi.dev extension — runtime dependencies",
  "private": true,
  "type": "commonjs",
  "dependencies": {
    "js-yaml": "^4.1.0",
    "argparse": "^2.0.1"
  }
}
```

## Real Installation State (Before Hardening)

- `~/.pi/agent/extensions/araya/index.ts`: **FILE COPY** (138580 bytes), not symlink
- `~/.pi/agent/extensions/araya/package.json`: Had `js-yaml` only (no argparse)
- `~/.pi/agent/extensions/araya/node_modules/`: Present with js-yaml and argparse
- `~/.pi/agent/extensions/araya.ts`: **ABSENT** (removed during ponny-express-10019)
- SHA-256 of installed: `e44ee3b641...` — matched repo at time of copy

## Real Installation State (After Hardening)

- `~/.pi/agent/extensions/araya/index.ts`: **SYMLINK** → repo source
- `~/.pi/agent/extensions/araya/package.json`: Updated from repo (js-yaml + argparse)
- `~/.pi/agent/extensions/araya/node_modules/`: Present with js-yaml and argparse
- `~/.pi/agent/extensions/araya.ts`: **ABSENT** (confirmed no legacy registration)
- SHA-256: `e44ee3b641...` — identical to repo

## Dependencies Verification

```bash
$ ls ~/.pi/agent/extensions/araya/node_modules/
argparse  js-yaml
```

## Settings Preservation

| File | Before SHA-256 | After SHA-256 | Match |
|------|---------------|---------------|-------|
| auth.json | `1c1d65ba...` | `1c1d65ba...` | ✅ |
| models.json | `9e2f3953...` | `9e2f3953...` | ✅ |
| models-store.json | `156fe50d...` | `156fe50d...` | ✅ |
