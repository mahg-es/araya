# REQ-043 Step 2 — Canonical-Source Hierarchy for Agent/Skill System

**Author:** Aisha (Backend Architect)  
**Date:** 2026-07-26  
**Status:** DRAFT — PENDING MANU REVIEW  
**Traces to:** REQ-001 (catalog), REQ-043 (source-of-truth hierarchy)  
**Reviewed by:** (pending)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Canonical-Source Hierarchy](#2-the-canonical-source-hierarchy)
3. [Layer-by-Layer Definition](#3-layer-by-layer-definition)
4. [Runtime Generation Schema](#4-runtime-generation-schema)
5. [Drift Validator](#5-drift-validator)
6. [Command Architecture](#6-command-architecture)
7. [Source Hash Tracking](#7-source-hash-tracking)
8. [Do-Not-Edit Marker Protocol](#8-do-not-edit-marker-protocol)
9. [Idempotency & Determinism Guarantees](#9-idempotency--determinism-guarantees)
10. [Error Handling & Failure Modes](#10-error-handling--failure-modes)
11. [ADR Candidate](#11-adr-candidate)

---

## 1. Executive Summary

The ARAYA agent/skill system currently derives runtime artifacts from multiple sources
(`araya.yaml`, `prompts/agents/*.md`, `skills/*/SKILL.md`) but the relationship between
canonical sources and generated outputs is not formally codified. Manual edits to generated
files create drift, and there is no systematic way to detect such drift.

This specification defines:

- A **four-layer canonical-source hierarchy** with clear ownership and direction of
  information flow
- A **deterministic, idempotent generation pipeline** that produces all runtime artifacts
  from canonical sources
- A **drift validator** that detects any manual modification to generated files
- A **unified command architecture** (`generate`, `generate --check`, `validate-agents`,
  `validate-skills`) for all generation and validation operations
- **Source hash tracking** embedded in every generated file, plus standardized
  **do-not-edit markers**

### Design Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| P1 | **Single source of truth per datum** | Every fact about an agent/skill lives in exactly one canonical layer. No duplication that can diverge. |
| P2 | **Generation is one-way** | Canonical → Generated. Never the reverse. Generated files are never canonical input. |
| P3 | **Generation is deterministic** | Same canonical inputs → byte-identical generated outputs. Enables `--check` mode. |
| P4 | **Generation is idempotent** | Running generation N times produces identical output. Safe for CI, pre-commit hooks, automated pipelines. |
| P5 | **Drift is always detectable** | Every generated file carries source hashes and markers. Any manual edit is a detectable violation. |
| P6 | **Fail closed on ambiguity** | If canonical sources are inconsistent or incomplete, generation fails with a clear error — never silently produces a best-guess output. |

---

## 2. The Canonical-Source Hierarchy

```
LAYER 0: araya.yaml
  │         ┌─ agents: { name, role, emoji, model_tier, permissions, skills[], capabilities[] }
  │         └─ global:  version, model_tiers, providers, budgets, circuit_breakers, …
  │
  ▼
LAYER 1: prompts/agents/<name>.md
  │         ┌─ Agent personality, approach, rules, PostOffice instructions
  │         └─ Canonical identity + charter (complements araya.yaml; never contradicts it)
  │
  ▼
LAYER 2: skills/<name>/SKILL.md
  │         ┌─ Skill definition: purpose, inputs, outputs, when-to-use, problem-solved
  │         └─ Self-contained, reusable across agents
  │
  ▼
LAYER 3: GENERATED (never manually edited)
  │
  ├── .pi/agents/<name>.md              ── Runtime agent prompt (merged from L0 + L1)
  ├── .araya/catalog/catalog.json       ── Machine-readable catalog of all agents, skills, commands
  └── .araya/organization/capability-registry.yaml  ── Human-readable capability inventory
```

### Information Flow (ONE-WAY)

```
araya.yaml ─────────────────────────────────────────────────────────────┐
   │                                                                     │
   │  "aisha: { role: Backend Architect, skills: [microservice, ...] }" │
   │                                                                     │
   ▼                                                                     │
prompts/agents/aisha.md ────────────────────────────────────────────────┤
   │                                                                     │
   │  "You are Aisha, Backend Architect...                               │
   │   Your Skills: microservice, api-gateway, ..."                     │
   │                                                                     │
   ▼                                                                     │
skills/microservice/SKILL.md ───────────────────────────────────────────┤
   │                                                                     │
   │  "# Microservice Design — Service decomposition, bounded contexts"  │
   │                                                                     │
   ▼                                                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          GENERATION PIPELINE                              │
│                                                                          │
│  Reads ALL canonical layers, merges, validates, and produces:            │
│                                                                          │
│  1. .pi/agents/<name>.md           (L0 agent config + L1 prompt merged) │
│  2. catalog.json                   (L0 + L1 + L2 structured entries)    │
│  3. capability-registry.yaml       (L0 + L2 human-readable inventory)   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Critical constraint:** LAYER 3 files are NEVER canonical. They are read by the Pi
runtime and by Aurora's workforce pipeline, but they are NEVER edited by hand. Any
discrepancy between a LAYER 3 file and its canonical sources is a bug — the canonical
source always wins.

---

## 3. Layer-by-Layer Definition

### 3.1 LAYER 0 — `araya.yaml`

**Canonical for:**
- Agent existence (which agents exist, their names)
- Agent metadata: role, emoji, model_tier, primary_provider, max_turns, execution_mode
- Agent permissions: can_write_code, can_approve_review, can_merge_pr
- Agent capabilities (declared capability tags)
- Agent skill assignments (which skills each agent has — the authoritative list)
- Agent status: active / dormant / bare
- Global configuration: model_tiers, providers, budgets, circuit_breakers, delivery_modes
- Agent description (optional prose)

**NOT canonical for:**
- Agent personality, approach, rules → LAYER 1 (prompts/agents/)
- Skill definitions, usage guidance → LAYER 2 (skills/*/SKILL.md)

**Schema constraints:**
```yaml
agents:
  <name>:            # Must match regex: ^[a-z][a-z0-9-]*$
    role: string     # Required. Human-readable role title.
    emoji: string    # Required. Single emoji character.
    model_tier: "fast" | "balanced" | "reasoning"  # Required.
    primary_provider: string   # Required. Must match a declared provider.
    max_turns: number          # Required. Positive integer.
    execution_mode?: "deterministic" | "adaptive"  # Optional.
    status?: "active" | "dormant" | "bare"          # Optional. Defaults to "active".
    permissions:
      can_write_code?: boolean       # Required.
      can_approve_review?: boolean    # Optional. Defaults to false.
      can_merge_pr?: boolean          # Optional. Defaults to false.
    capabilities?: string[]           # Optional. Free-form capability tags.
    skills: string[]                  # Required. Must reference existing skills/*/ directories.
    description?: string              # Optional. One-line description.
```

**Validation rules (fail generation on violation):**
- V0.1: Every `skills[]` entry MUST resolve to an existing `skills/<name>/SKILL.md`
- V0.2: Every agent MUST have exactly one corresponding `prompts/agents/<name>.md`
- V0.3: `model_tier` MUST reference a declared tier in the root `model_tiers` block
- V0.4: `primary_provider` MUST reference a declared provider in the root `providers` block
- V0.5: No duplicate agent names
- V0.6: Every agent MUST include the mandatory AX skills: `ax3`, `araya-command-and-delegation-expert`, `ax-postoffice`

### 3.2 LAYER 1 — `prompts/agents/<name>.md`

**Canonical for:**
- Agent personality and tone
- Agent workflow approach (numbered steps, guidelines)
- Agent-specific rules and constraints
- PostOffice communication instructions
- Domain-specific guidance (e.g., "Diana must review service-to-service auth patterns")

**NOT canonical for:**
- Skill lists → LAYER 0 (araya.yaml agents.<name>.skills)
- Role, emoji, model_tier → LAYER 0 (araya.yaml)
- Permissions → LAYER 0 (araya.yaml)

**Format contract:**
```markdown
# <Name> — <Role>

You are <Name>, <Role> of the ARAYA team. <one-line description>

## Personality
<personality traits>

## Approach
<numbered workflow steps>

## Your Skills
- **<skill-name>**: <one-line description>
- ...

## Rules
- <rule>
- ...
```

**Relationship with LAYER 0:**
- The skills listed in `prompts/agents/<name>.md` under "Your Skills" MUST match the
  `skills[]` array in `araya.yaml` for that agent. If they differ, `araya.yaml` wins
  (LAYER 0 > LAYER 1 for skill lists).
- The role in the heading MUST match `araya.yaml agents.<name>.role`.
- Generation SHOULD validate consistency between L0 and L1 and emit warnings on mismatch.

### 3.3 LAYER 2 — `skills/<name>/SKILL.md`

**Canonical for:**
- Skill purpose and problem description
- Input/output contracts
- When-to-use and when-not-to-use guidance
- Domain classification
- Whether the skill is AX (cross-cutting) or mandatory

**NOT canonical for:**
- Which agents have the skill → LAYER 0 (araya.yaml)

**Format contract:**
```markdown
# <Skill Display Name>

## What problem this solves
<description>

## When to use this skill
<conditions>

## When NOT to use this skill
<contraindications>

## Input
<what the skill expects as input>

## Output
<what the skill produces>

## Rules
<rules the skill enforces>
```

**Validation rules:**
- V2.1: Every skill directory MUST contain exactly one `SKILL.md`
- V2.2: SKILL.md MUST contain the sections: "What problem this solves", "When to use this skill", "Input", "Output"
- V2.3: A skill directory with no corresponding agent assignment (orphan) is valid but flagged

### 3.4 LAYER 3 — Generated Artifacts

**Generated files — NEVER manually edited:**

| File | What it contains | Canonical sources |
|------|-----------------|-------------------|
| `.pi/agents/<name>.md` | Runtime agent prompt with YAML frontmatter (name, description, tools, model_tier) + merged personality prompt | L0: agent config → frontmatter; L1: prompt body |
| `.araya/catalog/catalog.json` | Machine-readable JSON catalog of all agents, skills, commands, cross-references, stats | L0 + L1 + L2 → structured entries |
| `.araya/organization/capability-registry.yaml` | Human-readable YAML registry of agents and their skill assignments | L0 + L2 → hierarchical inventory |

---

## 4. Runtime Generation Schema

### 4.1 Generation Pipeline — High Level

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GENERATE (unified entry point)                │
│                                                                      │
│  1. LOAD                                                                 │
│     ├── Parse araya.yaml → ArayaConfig object                          │
│     ├── Parse all prompts/agents/*.md → AgentPrompt objects           │
│     └── Parse all skills/*/SKILL.md → SkillDefinition objects          │
│                                                                        │
│  2. VALIDATE                                                            │
│     ├── L0 self-consistency: skills[] resolve, providers exist, etc.  │
│     ├── L0 ↔ L1 consistency: roles match, skills listed match         │
│     └── L0 ↔ L2 consistency: every assigned skill has a SKILL.md      │
│                                                                        │
│  3. COMPUTE CONTENT HASH                                                │
│     ├── For each canonical source file: SHA-256 of file content       │
│     ├── Aggregated into: sources_hash (all files)                    │
│     └── Per-artifact: artifact_source_hash (files contributing)      │
│                                                                        │
│  4. GENERATE                                                            │
│     ├── .pi/agents/<name>.md     ← merge(L0.agents[name], L1[name])  │
│     ├── catalog.json             ← populate(L0, L1, L2)              │
│     └── capability-registry.yaml ← registry(L0, L2)                   │
│                                                                        │
│  5. WRITE                                                               │
│     ├── Embed do-not-edit markers + source hashes in each file         │
│     └── Atomic write (write to .tmp, fsync, rename)                   │
│                                                                        │
│  6. REPORT                                                              │
│     └── Summary: files written, agents generated, skills indexed,      │
│         warnings (orphan skills, consistency mismatches)              │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Determinism Contract

**Formal guarantee:** For identical canonical source files (byte-for-byte identical
`araya.yaml`, `prompts/agents/*.md`, `skills/*/SKILL.md`), the generation pipeline
MUST produce byte-for-byte identical output.

**Implementation constraints:**
- No timestamps in generated content (use `sources_hash` instead of `generated_at` for
  drift detection). The `generated_at` field is permitted only as metadata and must be
  excluded from hash computation.
- No non-deterministic iteration (hash maps iterated in sorted key order).
- No external state (network, environment variables, random).
- JSON output: sorted keys, consistent indentation (2 spaces).
- Markdown output: fixed section order, no variable whitespace.

### 4.3 Idempotency Contract

Running generation N times on the same canonical sources produces identical output
every time. If the output directory already contains identical content, the write is
a no-op (file unchanged, mtime preserved). This enables safe use in pre-commit hooks
and CI pipelines.

### 4.4 `--check` Mode

When invoked with `--check`, the pipeline:

1. Runs the full generation pipeline **in memory** (no disk writes)
2. Compares in-memory output to existing on-disk generated files
3. Reports drift per file:
   - `CLEAN` — byte-identical to what would be generated
   - `DRIFT` — would produce different output (manual edit or stale generation)
   - `MISSING` — file doesn't exist (never generated)
   - `EXTRA` — generated file exists but no canonical source produces it (e.g., deleted agent)
4. Exit code: 0 = all CLEAN, 1 = drift detected

---

## 5. Drift Validator

### 5.1 Drift Categories

```
┌──────────────────┬──────────────────────────────────────────────────┐
│ DRIFT TYPE       │ DESCRIPTION                                       │
├──────────────────┼──────────────────────────────────────────────────┤
│ CONTENT_DRIFT    │ Generated file content differs from what canon    │
│                  │ sources would produce. Manual edit detected.      │
├──────────────────┼──────────────────────────────────────────────────┤
│ MARKER_TAMPER    │ Do-not-edit marker missing or modified in a       │
│                  │ generated file.                                   │
├──────────────────┼──────────────────────────────────────────────────┤
│ HASH_MISMATCH    │ Embedded sources_hash doesn't match current       │
│                  │ canonical source hashes.                          │
├──────────────────┼──────────────────────────────────────────────────┤
│ ORPHAN_GENERATED │ Generated file exists for a canonical entity      │
│                  │ that no longer exists (e.g., deleted agent).      │
├──────────────────┼──────────────────────────────────────────────────┤
│ MISSING_GENERATED│ Canonical entity exists but no generated file.    │
├──────────────────┼──────────────────────────────────────────────────┤
│ SCHEMA_DRIFT     │ Generated file structure doesn't match expected   │
│                  │ schema (e.g., missing required fields).           │
└──────────────────┴──────────────────────────────────────────────────┘
```

### 5.2 Validation Algorithm

```
function validateGeneratedFile(filePath, canonicalSources):
    if not filePath.exists():
        return DRIFT: MISSING_GENERATED

    content = readFile(filePath)

    // 1. Check do-not-edit marker
    marker = extractMarker(content, fileType)
    if not marker or marker.tampered:
        return DRIFT: MARKER_TAMPER

    // 2. Check embedded source hash
    embeddedHash = marker.sourceHash
    computedHash = computeCanonicalHash(canonicalSources, filePath)
    if embeddedHash != computedHash:
        return DRIFT: HASH_MISMATCH

    // 3. Regenerate and compare
    expected = generateFromSources(canonicalSources, filePath)
    if normalizeForComparison(content) != normalizeForComparison(expected):
        return DRIFT: CONTENT_DRIFT
            .withDiff(diff(content, expected))

    return CLEAN
```

### 5.3 Drift Report Format

```
DRIFT REPORT — 2026-07-26T14:30:00Z
────────────────────────────────────
Canonical sources hash: a1b2c3d4...

  CLEAN  .pi/agents/aisha.md
  CLEAN  .pi/agents/lin.md
  DRIFT  .pi/agents/aurora.md     ← CONTENT_DRIFT: line 12 changed
  DRIFT  .araya/catalog/catalog.json  ← HASH_MISMATCH: sources changed
  MISSING .pi/agents/neo.md       ← canon exists, no generated file
  EXTRA  .pi/agents/old-agent.md  ← no canon source for this file

3 clean, 2 drift, 1 missing, 1 extra
EXIT CODE: 1
```

---

## 6. Command Architecture

### 6.1 Command Surface

All commands live under the `araya` namespace. Implementation: `src/araya/catalog/`
(extending existing `index.ts` exported functions) plus a CLI adapter.

```
COMMAND                     DESCRIPTION
──────────────────────────────────────────────────────────────────
araya generate              Full generation: all L3 artifacts from L0+L1+L2
araya generate --check      Dry-run: detect drift without writing
araya generate --target     Generate only specific artifact(s):
  agents                      .pi/agents/*.md only
  catalog                     catalog.json only
  registry                    capability-registry.yaml only

araya validate-agents       Validate L0↔L1 consistency (roles, skills)
araya validate-agents --fix Report-only mode (default is --check)

araya validate-skills       Validate L0↔L2 consistency (assignments, orphans)
araya validate-skills --fix Report-only mode

araya drift                 Shortcut for: araya generate --check
                            Full drift report across all generated artifacts

araya drift --json          Machine-readable drift report (for CI)
```

### 6.2 Exit Codes

```
0   All clean — no drift, no validation errors
1   Drift detected or validation errors found
2   Generation/validation failed (canonical source parse error, I/O error)
3   Usage error (invalid arguments, unknown flags)
```

### 6.3 Implementation Location

| Component | Location |
|-----------|----------|
| Generator core | `src/araya/generator/index.ts` |
| .pi/agents writer | `src/araya/generator/agent-prompts.ts` |
| Catalog populator | `src/araya/catalog/populator.ts` (existing, refactor to use generator) |
| Capability-registry writer | `src/araya/generator/capability-registry.ts` |
| Drift validator | `src/araya/catalog/validator.ts` (existing, extend) |
| CLI adapter | `src/araya/cli/generate.ts` (new) |
| Extension hook | `extensions/araya/index.ts` (register `/araya generate` command) |

### 6.4 CI/CD Integration

The `--check` mode is designed for CI. Example GitHub Actions step:

```yaml
- name: Check ARAYA source-drift
  run: npx araya generate --check
  # Exit 0 = clean. Exit 1 = drift → PR must regenerate.
```

This should run on every PR that touches `araya.yaml`, `prompts/agents/`, or `skills/`.

---

## 7. Source Hash Tracking

### 7.1 Hash Algorithm

- **Algorithm:** SHA-256
- **Input:** Sorted concatenation of (relative_path + file_content) for every canonical
  source file that contributes to the artifact
- **Format:** 64-character lowercase hex string

```
sources_hash = SHA-256(
    "araya.yaml:" + content_of_araya_yaml + "\n" +
    "prompts/agents/aisha.md:" + content_of_aisha_md + "\n" +
    "prompts/agents/aurora.md:" + content_of_aurora_md + "\n" +
    ...all agent prompts sorted by name... + "\n" +
    "skills/microservice/SKILL.md:" + content_of_microservice_skill + "\n" +
    ...all skills sorted by name...
)
```

**Important:** Only files that actually contribute to the artifact are included.
For `.pi/agents/aisha.md`, the contributing files are `araya.yaml` (the `aisha` agent
block only — though for simplicity we hash the whole file) + `prompts/agents/aisha.md`
+ all skills assigned to Aisha.

### 7.2 Per-Artifact vs Global Hash

Each generated artifact embeds TWO hashes:

1. **`global_sources_hash`** — Hash of ALL canonical source files in the repository
   (same across all artifacts). Changes when any canonical source changes. Used for
   the catalog-level drift check.

2. **`artifact_source_hash`** — Hash of ONLY the canonical sources that contribute
   to THIS specific artifact. Changes only when this artifact's sources change. Used
   for fine-grained drift detection.

### 7.3 Hash Embedding Format

**In `.pi/agents/<name>.md` (YAML frontmatter):**
```yaml
---
# @generated — DO NOT EDIT MANUALLY
# Canonical sources: araya.yaml → prompts/agents/aisha.md
# global_sources_hash: a1b2c3d4e5f6...
# artifact_source_hash: f6e5d4c3b2a1...
name: aisha
description: "ARAYA agent: Backend Architect. Model tier: reasoning."
tools: read, grep, find, bash
model_tier: reasoning
---
```

**In `catalog.json` (top-level fields):**
```json
{
  "version": "1.1.0",
  "_generated": "@generated — DO NOT EDIT MANUALLY",
  "global_sources_hash": "a1b2c3d4e5f6...",
  "artifact_source_hash": "f6e5d4c3b2a1...",
  "generated_at": "2026-07-26T14:30:00Z",
  "...": "..."
}
```

**In `capability-registry.yaml` (top-level comment + field):**
```yaml
# @generated — DO NOT EDIT MANUALLY
# Canonical sources: araya.yaml + skills/*/SKILL.md
# To regenerate: npx araya generate --target registry
generated_from: araya.yaml + skills/*/SKILL.md
generated_at: '2026-07-26T14:30:00Z'
global_sources_hash: a1b2c3d4e5f6...
artifact_source_hash: f6e5d4c3b2a1...
```

---

## 8. Do-Not-Edit Marker Protocol

### 8.1 Marker Format (by file type)

| File Type | Marker Location | Marker Format |
|-----------|----------------|---------------|
| `.md` (YAML frontmatter) | Frontmatter comment | `# @generated — DO NOT EDIT MANUALLY` |
| `.json` | `_generated` field | `"@generated — DO NOT EDIT MANUALLY"` |
| `.yaml` | Line 1 comment | `# @generated — DO NOT EDIT MANUALLY` |

### 8.2 Marker Validation Rules

The drift validator checks:

1. **Marker presence:** The marker MUST exist at the expected location
2. **Marker integrity:** The marker text MUST match exactly (no whitespace changes)
3. **Marker position:** The marker MUST be at the expected position (first line for YAML,
   frontmatter for .md, _generated field for JSON)
4. **Following content:** Content after the marker must not contain manual additions
   (detected via content hash comparison)

### 8.3 What Happens When Marker Is Violated

| Violation | Severity | Action |
|-----------|----------|--------|
| Marker missing | CRITICAL | File treated as manually created → overwrite on next generate with warning |
| Marker modified | CRITICAL | File treated as tampered → overwrite on next generate with warning |
| Content drift with marker intact | HIGH | Report drift, do NOT overwrite automatically (wait for explicit generate) |
| Extra file with no marker in gen dir | MEDIUM | Report as EXTRA, do NOT delete automatically |

### 8.4 Human Workflow for Manual Edits

If a human needs to change a generated file's behavior:

1. **STOP.** Generated files are never the right place to make changes.
2. **Find the canonical source** that controls the desired behavior:
   - Agent metadata? → `araya.yaml`
   - Agent personality? → `prompts/agents/<name>.md`
   - Skill behavior? → `skills/<name>/SKILL.md`
3. **Edit the canonical source.**
4. **Regenerate:** `npx araya generate`
5. **Verify:** `npx araya generate --check`

---

## 9. Idempotency & Determinism Guarantees

### 9.1 Formal Guarantees

```
GUARANTEE D1 (determinism):
    ∀ s1, s2 ∈ CanonicalSources:
        s1 == s2 ⟹ generate(s1) == generate(s2)
    where == denotes byte-for-byte equality

GUARANTEE I1 (idempotency):
    ∀ s ∈ CanonicalSources:
        generate(s); generate(s) ⟹ output_after_first == output_after_second
    and the second run is a no-op (no file writes, mtime preserved)

GUARANTEE C1 (check-mode correctness):
    ∀ s ∈ CanonicalSources:
        generate(s, mode=WRITE); generate(s, mode=CHECK).exit_code == 0
    After generation, check mode must report CLEAN
```

### 9.2 Implementation Requirements

To satisfy these guarantees, the generator MUST:

1. **Sort all maps by key** before iteration (JavaScript `Map` insertion order is not
   sufficient — use `Object.keys().sort()`)
2. **Use fixed string formatting** for all output (no `Date.now()`, no `Math.random()`,
   no `process.hrtime()`)
3. **Normalize generated JSON:** `JSON.stringify(obj, sortedKeys, 2) + "\n"`
4. **Exclude `generated_at` from content comparison** in check mode
5. **Use atomic writes:** write to `.tmp`, `fsync`, `rename` — so partial writes never
   corrupt the generated file
6. **Cache canonical source content** in memory during a single generation session —
   don't re-read files that haven't changed

---

## 10. Error Handling & Failure Modes

### 10.1 Failure Classification

```
┌──────────────────────┬──────────┬────────────────────────────────────┐
│ FAILURE              │ SEVERITY │ BEHAVIOR                            │
├──────────────────────┼──────────┼────────────────────────────────────┤
│ araya.yaml parse err │ FATAL    │ Abort all generation. Report line. │
│ SKILL.md parse err   │ FATAL    │ Abort all generation. Report file. │
│ Agent prompt missing │ FATAL    │ Abort. "agent 'X' has no prompt   │
│                      │          │  at prompts/agents/X.md"           │
│ Skill not found      │ FATAL    │ Abort. "agent 'X' references skill│
│                      │          │  'Y' but skills/Y/SKILL.md missing"│
│ Provider not found   │ FATAL    │ Abort. "agent 'X' uses provider   │
│                      │          │  'Z' not declared in providers"    │
│ Tier not found       │ FATAL    │ Abort. "agent 'X' uses tier 'T'   │
│                      │          │  not declared in model_tiers"      │
│ Duplicate agent name │ FATAL    │ Abort. "duplicate agent: 'X'"      │
│ L0↔L1 role mismatch  │ WARNING  │ Continue. Use L0 role. Warn.       │
│ L0↔L1 skill mismatch │ WARNING  │ Continue. Use L0 skills. Warn.     │
│ Orphan skill dir     │ WARNING  │ Continue. "skill 'X' has no agent │
│                      │          │  assignment"                       │
│ Write permission err │ FATAL    │ Abort. "cannot write to .pi/agents"│
│ Disk full            │ FATAL    │ Abort. Clean up partial .tmp files.│
└──────────────────────┴──────────┴────────────────────────────────────┘
```

### 10.2 Partial Failure Policy

Generation is **all-or-nothing within an artifact type:**
- If any agent prompt fails to generate, NO `.pi/agents/*.md` files are written
- If catalog generation fails, catalog.json is not written
- If capability-registry fails, capability-registry.yaml is not written

This prevents partial-update states where some agents have fresh prompts and others don't.

### 10.3 Rollback

Since writes are atomic (write to .tmp, rename), no rollback is needed. If the process
crashes mid-generation, only `.tmp` files remain, which are cleaned up on the next run.

---

## 11. ADR Candidate

This design is submitted as an Architecture Decision Record candidate. See
`.araya/plan/spec/adr/` for the formal ADR.

### Decision

> We will adopt a four-layer canonical-source hierarchy (araya.yaml → prompts/agents/ →
> skills/ → generated) with one-way generation, deterministic idempotent output, embedded
> source hashes, and do-not-edit markers on all generated files.

### Rationale

1. **Source of truth clarity.** Every datum about an agent/skill has exactly one canonical
   home. No ambiguity about where to make changes.
2. **Drift elimination.** Manual edits to generated files are detectable and preventable.
   CI can enforce this with `generate --check`.
3. **Auditability.** Source hashes create a verifiable chain from canonical sources to
   runtime artifacts. At any point, you can prove a generated file came from specific
   canonical inputs.
4. **CI safety.** Idempotent generation means pre-commit hooks and CI pipelines can run
   generation without side effects.

### Consequences

- **Breaking change to workflow:** Humans can no longer edit `.pi/agents/*.md` directly.
  They must edit `araya.yaml` or `prompts/agents/` and regenerate.
- **Migration required:** Existing `.pi/agents/*.md` files must be re-generated from
  canonical sources to embed markers and hashes.
- **CI step added:** PRs touching canonical sources must pass `araya generate --check`.

### Alternatives Considered

1. **Bi-directional sync (canonical ↔ generated).** Rejected. Creates ambiguity about
   which side wins on conflict. P1 (single source of truth) is a foundational principle.
2. **Lazy generation at runtime.** Rejected. Adds startup latency, makes debugging
   harder (can't inspect the actual prompt the runtime sees), and complicates drift
   detection.
3. **No generated files — runtime reads canonical sources directly.** Rejected. The
   Pi runtime requires `.pi/agents/*.md` files. Catalog and registry serve different
   consumers (machines and humans) who need pre-computed, validated views.

---

## Appendix A: File Manifest

```
CANONICAL (human-editable):
  araya.yaml                              ← L0: Agent config, global settings
  prompts/agents/<name>.md                ← L1: Agent personality prompts
  skills/<name>/SKILL.md                  ← L2: Skill definitions

GENERATED (never edit):
  .pi/agents/<name>.md                    ← L3: Merged runtime prompts
  .araya/catalog/catalog.json             ← L3: Machine-readable catalog
  .araya/organization/capability-registry.yaml ← L3: Human-readable registry

IMPLEMENTATION (generation pipeline):
  src/araya/generator/index.ts            ← Unified generator entry point
  src/araya/generator/agent-prompts.ts    ← .pi/agents/* writer
  src/araya/generator/capability-registry.ts ← capability-registry writer
  src/araya/catalog/populator.ts          ← Existing catalog populator (refactored)
  src/araya/catalog/validator.ts          ← Existing drift validator (extended)
  src/araya/cli/generate.ts               ← CLI adapter
  extensions/araya/index.ts               ← Pi extension (register commands)

DOCUMENTATION:
  .araya/plan/spec/req-043-aisha-architecture.md  ← This document
  .araya/plan/spec/adr/043-canonical-source-hierarchy.md ← ADR (to be created)
```

## Appendix B: Validation Checklists

### Pre-Generation Validation (fail on violation)

- [ ] `araya.yaml` parses as valid YAML
- [ ] Every `agents.<name>.skills[]` entry resolves to `skills/<name>/SKILL.md`
- [ ] Every agent has `prompts/agents/<name>.md`
- [ ] Every agent has mandatory AX skills (ax3, araya-command-and-delegation-expert, ax-postoffice)
- [ ] Every `model_tier` references a declared tier
- [ ] Every `primary_provider` references a declared provider
- [ ] No duplicate agent names

### Post-Generation Validation (warn on violation)

- [ ] `prompts/agents/<name>.md` role matches `araya.yaml` role
- [ ] `prompts/agents/<name>.md` skill list matches `araya.yaml` skill list
- [ ] No orphan skill directories (skills/* with no agent assignment)
- [ ] No undeclared skills (agent references skill with no skills/ directory)

### Drift Check Validation (exit 1 on violation)

- [ ] Every generated file has intact do-not-edit marker
- [ ] Every generated file's embedded hash matches current canonical sources
- [ ] Content-identical to what generation would produce
- [ ] No extra generated files (no canonical source)
- [ ] No missing generated files (canonical source exists)

---

*End of specification. Submitted for Manu's SPEC_APPROVED gate.*
