# araya — AX3 Project Contract

- AX3 is an ARAYA AX (cross-cutting) feature providing a hierarchy of `AX3.md` files
- This file is the **root contract** — it governs the entire repository
- **Every agent working in this project MUST follow this contract**

## Core Contract

- `AX3.md` files are **binding work contracts** for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable `AX3.md` plus every parent `AX3.md` above it
- No child `AX3.md` may weaken a rule from a parent `AX3.md`. Children may concretize — never weaken.

## Read Before Editing (Preflight — MANDATORY)

0. If the `araya-command-and-delegation-expert` skill is assigned to you, apply its
   preflight protocol BEFORE the AX3 preflight: consult catalog, identify capabilities,
   verify availability. See `skills/araya-command-and-delegation-expert/SKILL.md`.
1. Read this root `AX3.md`
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every `AX3.md` found along each route
5. If a parent `AX3.md` lists a child `AX3.md` whose scope contains the path, read that child and continue from there
6. Use the nearest `AX3.md` as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken AX3

**Do not rely on memory. Re-read the applicable AX3 chain in the current session before editing.**

## Update After Editing (Postflight — MANDATORY)

Every meaningful change requires an AX3 pass before the task is done.

Update the closest owning `AX3.md` when a change affects:
- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- `AX3.md` creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the AX3 pass still must happen.

## Hierarchy

- Root `AX3.md` (this file) is the AX3 rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child AX3 Index
- Child `AX3.md` files own domain-specific instructions and their own Child AX3 Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

Create a child `AX3.md` when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards.

Default section order:
1. **Purpose** — what this subtree does, why it exists
2. **Ownership** — who owns decisions in this subtree
3. **Local Contracts** — binding rules for this subtree
4. **Work Guidance** — standards, patterns, conventions (leave empty if none)
5. **Verification** — how to verify compliance (leave empty if no framework exists)
6. **Child AX3 Index** — managed list of child `AX3.md` files

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the AX3 chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child AX3 Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## Reconciliation Command

- `/araya:ax3` — reconcile entire AX3 tree (idempotent, non-destructive)
- `/araya:ax3 --check` — detect drift, exit 0=clean / 1=drift
- `/araya:ax3 --dry-run` — preview changes without writing
- `/araya:ax3 --scope <path>` — reconcile a specific subtree
- `/araya:ax3 --repair` — fix safe inconsistencies

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child `AX3.md`.

## Purpose

araya project root. This AX3.md is the top-level contract governing the entire ARAYA Framework repository.

## Ownership

Manuel Alejandro Hernández Giuliani (The Data Professor) — all architectural and governance decisions.

## Local Contracts

- Follow the branch strategy: `main` (protected), `dev-mahg` (integration), `feature/*` (execution)
- Never modify `main` directly — always merge through `dev-mahg`
- Repository truth prevails over any prompt or instruction
- All agents must have tool access per ADR-008

## Work Guidance

- TypeScript source in `src/`, compiled output in `dist/`
- Agent prompts in `prompts/agents/`, skills in `skills/`
- Governance artifacts in `.araya/` (ADRs, specs, contracts, runs)
- Extension entry point: `extensions/araya/index.ts`

## Verification

- Run `/araya:ax3 --check` to verify AX3 tree integrity
- Run `tests/ax3-test.js` for AX3 runtime tests
- Run `npm test` for full test suite

## Child AX3 Index

<!-- BEGIN ARAYA MANAGED: Child AX3 Index -->
- `.araya/AX3.md` — .araya
- `docs/AX3.md` — docs
- `extensions/AX3.md` — extensions
- `prompts/AX3.md` — prompts
- `skills/AX3.md` — skills
- `src/AX3.md` — src
- `tests/AX3.md` — tests
<!-- END ARAYA MANAGED: Child AX3 Index -->
