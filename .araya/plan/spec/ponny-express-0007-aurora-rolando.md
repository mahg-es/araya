# PONNY-EXPRESS-0007 — Rolando Capability Audit

**Auditor:** Aurora (CHRO)  
**Date:** 2026-07-25T18:29:17Z  
**Subject:** Rolando — Reality Authority (Verifier)  
**Classification:** Operational Audit — Capability Verification  
**Verdict:** **MISCONFIGURED**

---

## Executive Summary

Rolando exists conceptually — defined in `araya.yaml`, documented in
`prompts/agents/`, and backed by a valid `reality-verification` skill. However,
the agent is **not executable as a subagent** because:

1. It is **absent from the canonical install source** (`.pi/agents/`)
2. Its runtime file at `~/.pi/agent/agents/rolando.md` **lacks YAML frontmatter**,
   making it invisible to Pi's `discoverAgents()` subsystem
3. The manual copy that placed it there is **not the canonical mechanism**

Rolando can be invoked only through `/araya rolando <task>` (direct injection
via the ARAYA extension's `buildAgentPrompt` → `loadPersonality` chain), but
**not** through the `subagent` tool which is the standard delegation mechanism.

---

## Audit Matrix

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | Identidad canónica | ✅ PASS | `prompts/agents/rolando.md` exists with full identity, personality, charter, rules |
| 2 | Prompt válido | ✅ PASS | Identity, charter (5 duties), cross-cutting skills, rules, PostOffice protocol all defined |
| 3 | Skill reality-verification | ✅ PASS | `skills/reality-verification/SKILL.md` — 5-tier model, commands, reality scoring, REAL-001 through REAL-005 |
| 4 | Registro en araya.yaml | ✅ PASS | `agents.rolando` with role, tier, permissions, capabilities, skills |
| 5 | Mecanismo oficial de instalación | ❌ FAIL | `araya-setup.sh` copies from `.pi/agents/` — Rolando is **NOT** in that directory |
| 6 | Disponible en Pi runtime | ❌ PARTIAL | `/araya rolando <task>` works (direct prompt injection). `subagent` tool **skips** Rolando (no frontmatter) |
| 7 | Alcance user/project | ❌ BROKEN | File exists at `~/.pi/agent/agents/rolando.md` (user scope) but is invisible to discovery |
| 8 | Copia manual canónica | ❌ NO | `cp prompts/agents/rolando.md ~/.pi/agent/agents/rolando.md` is not the canonical mechanism and produces a non-discoverable file |

---

## Detailed Findings

### F1: Missing from canonical install source (BLOCKING)

The install script `araya-setup.sh` (line ~85) copies agents from
`$CANONICAL/.pi/agents/` to `~/.pi/agent/agents/`.

```bash
AGENTS_SRC="$CANONICAL/.pi/agents"
for f in "$AGENTS_SRC"/*.md; do
  cp "$f" "$AGENTS_DIR/$name"
done
```

`rolando.md` does **not** exist in `.pi/agents/` (28 files present; rolando is
not among them). This means:

- `araya-setup.sh` will **never** install Rolando
- Any `--force` reinstall will **not** restore Rolando if deleted
- The agent is excluded from the official distribution pipeline

### F2: Missing YAML frontmatter in runtime file (BLOCKING)

The subagent tool's `discoverAgents()` (in `agents.ts`) requires each `.md`
file in `~/.pi/agent/agents/` to have YAML frontmatter with **both** `name` and
`description` fields:

```typescript
const { frontmatter, body } = parseFrontmatter(content);
if (!frontmatter.name || !frontmatter.description) {
    continue;  // ← Silently skipped
}
```

`~/.pi/agent/agents/rolando.md` has **zero frontmatter** — it begins directly
with `# Rolando — Reality Authority (Verifier)`. Compare with working agents:

```yaml
# Working (sonia):
---
name: sonia
description: "ARAYA agent: Program Director & PMO Head..."
tools: read, write, edit, bash, grep, find
model_tier: reasoning
---

# Broken (rolando):
# Rolando — Reality Authority (Verifier)
(no frontmatter at all)
```

**Frontmatter audit of ALL agents in `~/.pi/agent/agents/`:**

| Agent | Frontmatter | name | description | Discoverable? |
|-------|:----------:|:----:|:-----------:|:-------------:|
| aisha | ✅ | ✅ | ✅ | ✅ |
| alejandra | ✅ | ✅ | ✅ | ✅ |
| aquila | ✅ | ✅ | ✅ | ✅ |
| aurora | ✅ | ✅ | ✅ | ✅ |
| bernabe | ✅ | ✅ | ✅ | ✅ |
| clara | ✅ | ✅ | ❌ | ❌ |
| daneel | ✅ | ✅ | ✅ | ✅ |
| diana | ✅ | ✅ | ✅ | ✅ |
| dorcas | ✅ | ✅ | ✅ | ✅ |
| elena | ✅ | ✅ | ✅ | ✅ |
| esteban | ✅ | ✅ | ✅ | ✅ |
| eunice | ✅ | ✅ | ✅ | ✅ |
| isla | ✅ | ✅ | ✅ | ✅ |
| junia | ✅ | ✅ | ✅ | ✅ |
| lidia | ✅ | ✅ | ✅ | ✅ |
| lin | ✅ | ✅ | ✅ | ✅ |
| lucas | ✅ | ✅ | ✅ | ✅ |
| manu | ✅ | ✅ | ✅ | ✅ |
| maria | ✅ | ✅ | ✅ | ✅ |
| mateo | ✅ | ✅ | ✅ | ✅ |
| neo | ✅ | ✅ | ❌ | ❌ |
| pablo | ✅ | ✅ | ✅ | ✅ |
| priscila | ✅ | ✅ | ✅ | ✅ |
| priya | ✅ | ✅ | ✅ | ✅ |
| **rolando** | **❌** | **❌** | **❌** | **❌** |
| sofia | ✅ | ✅ | ✅ | ✅ |
| sonia | ✅ | ✅ | ✅ | ✅ |
| teresa | ✅ | ✅ | ✅ | ✅ |
| trinity | ✅ | ✅ | ❌ | ❌ |
| valentina | ✅ | ✅ | ✅ | ✅ |

Rolando is the **only agent with zero frontmatter**. Two other agents (clara,
neo, trinity) have frontmatter but lack `description` — a separate issue.

### F3: Two invocation paths — one works, one doesn't

| Path | Mechanism | Rolando Works? |
|------|-----------|:--------------:|
| `/araya rolando <task>` | Extension → `buildAgentPrompt()` → `loadPersonality()` → reads `prompts/agents/rolando.md` | ✅ YES |
| `subagent({ agent: "rolando", task: "..." })` | Extension → `discoverAgents()` → reads `~/.pi/agent/agents/` → requires frontmatter | ❌ NO |
| Chain/parallel subagent | Same as subagent tool | ❌ NO |

The `/araya` command works because it reads from `prompts/agents/` (symlinked to
project source), which bypasses the frontmatter requirement entirely. But the
`subagent` tool — which spawns isolated Pi processes with proper context
isolation — cannot see Rolando.

---

## Impact Assessment

| Dimension | Assessment |
|-----------|-----------|
| **Affected domain** | Governance — Reality Verification is a Tier 1 governance function |
| **Blocked workflows** | Any delegation chain that requires independent reality verification via subagent |
| **Degraded to** | Direct injection only (`/araya rolando`), no isolated subagent execution |
| **Collateral** | Clara, Neo, and Trinity also affected by missing/incomplete frontmatter |
| **Severity** | **HIGH** — Governance agent exists on paper but is not executable through the standard delegation mechanism |

---

## Recommendations

Aurora presents these numbered options for The Data Professor's decision:

### [1] EXTEND — Add frontmatter to Rolando's runtime file (QUICK FIX)

Add proper YAML frontmatter to `~/.pi/agent/agents/rolando.md`:

```yaml
---
name: rolando
description: "ARAYA agent: Reality Authority (Verifier) — independent verification of agent claims against repository truth. Reports to Giskard."
tools: read, bash, grep, find
model_tier: reasoning
---
```

**Pros:** 5-minute fix, makes Rolando immediately discoverable by subagent tool  
**Cons:** Does not fix the canonical install source (.pi/agents/); would be lost on --force reinstall  
**Risk:** LOW

### [2] PROMOTE — Add Rolando to canonical install source (PROPER FIX)

1. Create `.pi/agents/rolando.md` with proper frontmatter + the full prompt body
2. Re-run `araya-setup.sh --force` to copy it to `~/.pi/agent/agents/`
3. This ensures Rolando survives reinstalls and is part of the official distribution

**Pros:** Canonical, survives reinstalls, aligns with all other agents  
**Cons:** Requires duplicating the prompt definition (prompts/agents/ vs .pi/agents/)  
**Risk:** LOW — but introduces a second source of truth for the prompt body

### [3] REFACTOR — Unify agent definitions (ARCHITECTURAL FIX)

Merge the two directories into a single source of truth:
- `.pi/agents/*.md` becomes the SOLE canonical agent store (with frontmatter)
- `prompts/agents/` becomes a symlink to `.pi/agents/` (or vice versa)
- Update `araya-setup.sh` to symlink instead of copying
- Update extension's `loadPersonality()` to read from `.pi/agents/`

**Pros:** Single source of truth, no duplication, all paths work consistently  
**Cons:** Significant refactor, touches installation, extension, and agent discovery  
**Risk:** MEDIUM — requires coordinated changes across multiple files

### [4] COLLATERAL — Also fix Clara, Neo, and Trinity (BONUS)

These agents also need frontmatter fixes (missing `description` field). Should
be done regardless of which option is chosen for Rolando.

**Pros:** Restores 3 additional agents to subagent discoverability  
**Cons:** Separate scope from Rolando  
**Risk:** NEGLIGIBLE

---

## Aurora's Assessment

Professor, Rolando is **MISCONFIGURED**. The agent's identity, prompt, skill,
and YAML registration are all sound — it's the runtime wiring that's broken.

The core issue is a **drift between two agent definition directories**:

- `prompts/agents/` — used by `/araya` extension for direct injection (Rolando exists here)
- `.pi/agents/` — used by install script as canonical source (Rolando absent)
- `~/.pi/agent/agents/` — used by subagent discovery (Rolando present but invisible)

I recommend **[2] + [4]** combined: add Rolando to `.pi/agents/` with proper
frontmatter, reinstall, and simultaneously fix Clara/Neo/Trinity's missing
description fields. This is the minimum viable fix that makes all agents
discoverable through the subagent tool.

Option [3] (unified agent store) should be tracked as a separate architectural
improvement for a future sprint.

---

## Appendix A: File Inventory

| File | Exists | Has Frontmatter | Role |
|------|:------:|:---------------:|------|
| `prompts/agents/rolando.md` | ✅ | N/A (plain Markdown) | Source of truth for `/araya` command |
| `.pi/agents/rolando.md` | ❌ | N/A | Canonical install source |
| `~/.pi/agent/agents/rolando.md` | ✅ | ❌ | Runtime agent store (invisible to subagent) |
| `skills/reality-verification/SKILL.md` | ✅ | ✅ (skill frontmatter) | Skill definition |
| `araya.yaml` (agents.rolando) | ✅ | N/A | YAML registry entry |

## Appendix B: MD5 Verification

```
8de4ee2e2cf23b0814f650e4605b225b  prompts/agents/rolando.md
8de4ee2e2cf23b0814f650e4605b225b  ~/.pi/agent/agents/rolando.md
```

Files are identical — confirmed manual copy from source.

---

**Aurora — CHRO, ARAYA**  
*Organizational design is not negotiable. Capability before assignment.*
