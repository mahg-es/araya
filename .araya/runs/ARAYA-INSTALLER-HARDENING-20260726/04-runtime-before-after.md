# 04 — Runtime Before/After

**Run:** ARAYA-INSTALLER-HARDENING-20260726  
**Date:** 2026-07-26  

## Before Hardening

### Extension Registration

```
~/.pi/agent/extensions/araya/
├── index.ts          (FILE COPY, 138580 bytes, not symlink)
├── package.json      (js-yaml only, no argparse)
├── package-lock.json
└── node_modules/
    ├── argparse/
    └── js-yaml/

~/.pi/agent/extensions/araya.ts    (ABSENT — removed during ponny-express-10019)
```

### Key Findings
- `index.ts` was a **file copy**, not a symlink — could drift from repository
- No legacy `araya.ts` existed (already cleaned up manually)
- `package.json` was out of date (missing argparse)
- SHA-256: `e44ee3b641b8ed61c726475e150ae4ccff561212cc69bfc68c93a4fbf1ad3de6`

### Settings Snapshot
```
auth.json:        1c1d65ba7dd9204f7e94e7fa3dea5029f8664415233f0f3d994df361eac2d080
models.json:      9e2f3953cbc56f35bc67327bf7251e907c58cb74efcf69e6951cfac0d61d9c04
models-store.json: 156fe50d0fa52d3170464d75c20758ec427d5561298d040a7bf331f6a080e251
```

### Command Inventory
Professor reported duplicate commands in Pi UI:
- `/araya:man:1`, `/araya:man:2` — two man registrations
- `/araya:delegate:1`, `/araya:delegate:2` — two delegate registrations
- Multiple other commands with `:1`/`:2` suffixes

These were caused by the two extension registrations (araya.ts + araya/index.ts)
that existed before ponny-express-10019 removed the legacy. The file copy
remained as the sole registration, preventing new duplicates.

## After Hardening

### Extension Registration (after `./araya-setup.sh --force`)

```
~/.pi/agent/extensions/araya/
├── index.ts          (SYMLINK → /path/to/repo/extensions/araya/index.ts)
├── package.json      (from repo: js-yaml ^4.1.0 + argparse ^2.0.1)
├── package-lock.json
└── node_modules/
    ├── argparse/
    └── js-yaml/

~/.pi/agent/extensions/araya.ts    (ABSENT — confirmed no legacy)
```

### Key Changes
- `index.ts` is now a **symlink** to repository source — no drift possible
- `package.json` updated from repository with both dependencies
- No legacy `araya.ts` registration
- SHA-256: `e44ee3b641...` — identical to repository (symlink resolution)

### Verification Passed
```
[OK] Canonical extension: correct symlink to repository
[OK] No legacy araya.ts (no :1/:2 command suffixes)
[OK] Runtime dependency: js-yaml
[OK] Exactly 1 ARAYA extension registrations
[OK] Installed source matches repository artifact
```

### Settings Preserved
```
auth.json:        1c1d65ba7dd9204f7e94e7fa3dea5029f8664415233f0f3d994df361eac2d080  (UNCHANGED)
models.json:      9e2f3953cbc56f35bc67327bf7251e907c58cb74efcf69e6951cfac0d61d9c04  (UNCHANGED)
models-store.json: 156fe50d0fa52d3170464d75c20758ec427d5561298d040a7bf331f6a080e251  (UNCHANGED)
```

### Backup
Timestamped backup stored at: `~/.pi/agent/.araya-backup-20260726-191753/`
Contains: index.ts, package.json, package-lock.json, node_modules/
