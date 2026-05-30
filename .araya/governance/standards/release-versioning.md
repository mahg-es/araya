# MAHG Release and Versioning Standard

## Purpose

Define a common versioning model for all projects governed by ARAYA.

## Version Format

```
MAJOR.REVISION.HOTFIX
```

## Components

| Component | Meaning | Example |
|-----------|---------|---------|
| **MAJOR** | Generation of the product — intentionally rare | 0.x.x, 1.x.x |
| **REVISION** | Substantial functional growth (new capabilities, modules, architecture) | 0.1.0, 0.2.0 |
| **HOTFIX** | Defect corrections, small enhancements, docs, minor governance | 0.5.1, 0.5.2 |

## Major Version Promotion Rule

A project may only advance to the next major version when:

```
REVISION = 73
HOTFIX = 5
```

```
0.73.5 → 1.0.0
1.73.5 → 2.0.0
```

## Origin

The rule reflects the founding milestone of The Data Professor:

- Year of Birth: 1973
- Month of Birth: May (05)

## Philosophy

Major versions should be earned. Long-term thinking. Incremental delivery.
Controlled evolution. Stability. Governance maturity.

## ARAYA Current State

**v0.5.6** — Revision 5, Hotfix 6. Path to 1.0.0 requires 73 revisions and 5 hotfixes.
