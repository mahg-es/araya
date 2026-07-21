# REQ-001 Security Audit — WS-12

- **Document:** Security Audit Report
- **Workstream:** WS-12 (Security Review per REQ-001 plan)
- **Date:** 2026-07-22
- **Author:** Diana (Cybersecurity Specialist)
- **Audit Scope:** Help Provider, Catalog System, Delegation Architecture, Skill Files, Extension Surface
- **Methodology:** OWASP ASVS Level 2, CWE Top 25, STRIDE threat modeling
- **Parent:** `.araya/plan/spec/req-001-workstreams.md` (Workstream 12)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Findings by Severity](#2-findings-by-severity)
3. [Detailed Findings](#3-detailed-findings)
4. [STRIDE Matrix — Delegation Broker](#4-stride-matrix--delegation-broker)
5. [Recommendations](#5-recommendations)
6. [Verdict](#6-verdict)

---

## 1. Executive Summary

This audit covers 5 attack surfaces in the REQ-001 implementation scope. Total findings: **14** (1 CRITICAL, 5 HIGH, 5 MEDIUM, 3 LOW).

**The delegation architecture spec is well-designed** with a coherent three-layer recursion defense, immutable evidence, and fail-closed permission model. However, **the extension surface has a critical code-execution risk** via `/araya:install`, and the catalog system has **no input sanitization** for markdown rendering or symlink safety. The spec's STRIDE model is present but incomplete — it's a summary table, not a full threat analysis.

**Overall posture:** The architecture is security-conscious but the implementation has gaps that must be closed before production delegation use.

---

## 2. Findings by Severity

### CRITICAL (1)

| ID | Finding | Location |
|----|---------|----------|
| **C1** | Arbitrary script execution via `/araya:install` with `--force` flag | `extensions/araya/index.ts:919` |

### HIGH (5)

| ID | Finding | Location |
|----|---------|----------|
| **H1** | Dynamic import from symlink-followed path — code injection risk | `extensions/araya/index.ts:2017,2095` |
| **H2** | Unsanitized file write from user input in `/araya:learn` | `extensions/araya/index.ts:1502` |
| **H3** | `findArayaRoot()` follows symlinks via `existsSync` — trust boundary bypass | `extensions/araya/index.ts:50-71`, `src/araya/catalog/index.ts:135-142`, `src/araya/catalog/populator.ts:82-90` |
| **H4** | Incomplete STRIDE model — no data flow diagrams, no trust boundaries mapped, no residual risk assessment | `.araya/plan/spec/req-001-delegation-architecture.md §11.1` |
| **H5** | Evidence store directory traversal via symlinked `araya.yaml` | `extensions/araya/index.ts:2017` (uses `realpathSync` on `araya.yaml` to resolve `arayaRoot`) |

### MEDIUM (5)

| ID | Finding | Location |
|----|---------|----------|
| **M1** | Markdown injection in help provider output (query reflected unsanitized) | `src/araya/catalog/help-provider.ts:310-338` |
| **M2** | No content validation on SKILL.md / agent prompt files — malicious markdown propagates to catalog and help output | `src/araya/catalog/populator.ts:parseSkills()`, `enrichFromPrompts()` |
| **M3** | No file size limits on catalog source reads — DoS via giant SKILL.md or constitution.md | `src/araya/catalog/populator.ts`, `extensions/araya/index.ts` (multiple `readFileSync` calls) |
| **M4** | `/araya:learn` IDs are predictable (sequential LESSON-NNN) — enabling targeted overwrite | `extensions/araya/index.ts:1499-1502` |
| **M5** | No agent authentication — identity relies entirely on runtime context assertion, no cryptographic proof | Spec §11.2, `extensions/araya/index.ts` |

### LOW (3)

| ID | Finding | Location |
|----|---------|----------|
| **L1** | Symlink following in `skills/` directory enumeration — malicious symlink could point outside project | `src/araya/catalog/populator.ts:parseSkills()` |
| **L2** | Predictable delegation ID format (`del_{uuid_short}`) — UUID v4 truncated to 8 hex chars = 32-bit entropy | Spec §5.1 |
| **L3** | Circuit breaker state lost on restart — memory-only, no persistence | Spec §10.2 |

---

## 3. Detailed Findings

### C1 — Arbitrary Script Execution via `/araya:install` — CRITICAL

**File:** `extensions/araya/index.ts:914-927`

```typescript
pi.registerCommand("araya:install", {
    description: "🔧 Install ARAYA on this machine from canonical source",
    handler: async (_args, ctx) => {
      const setupScript = resolve(root, "araya-setup.sh");
      if (!existsSync(setupScript)) {
        ctx.ui.notify(`❌ Setup script not found at: ${setupScript}`, "error");
        return;
      }
      ctx.ui.notify(`🔧 Running ARAYA setup from ${root}...`, "info");
      try {
        const result = await pi.exec("bash", [setupScript, "--force"]);
```

**Risk:** The `root` variable is resolved by `findArayaRoot()`, which walks up directories looking for `araya.yaml`. If an attacker places a malicious `araya.yaml` and `araya-setup.sh` anywhere in the directory hierarchy, execution of the setup script is a single command away. The `--force` flag prevents interactive confirmation.

**Attack scenario:** A compromised dependency or insider adds a malicious `araya-setup.sh` to the project. The next `/araya:install` invocation executes it with full user privileges.

**Remediation:**
1. Require explicit confirmation before executing external scripts (remove `--force` default, or better: prompt user)
2. Validate `araya-setup.sh` hash against a known good value before execution
3. Execute in a restricted environment (no network, limited filesystem)

---

### H1 — Dynamic Import from Symlink-Followed Path — HIGH

**File:** `extensions/araya/index.ts:2017,2095`

```typescript
const arayaYamlReal = realpathSync(resolve(findArayaRoot(), "araya.yaml"));
const arayaRoot = dirname(arayaYamlReal);
const { check: ax3Check, dryRun: ax3DryRun, reconcile: ax3Reconcile } =
    await import(resolve(arayaRoot, "dist/araya/v2/ax3"));
// ...
const { man, manAgent, manSkill, manSearch, manHelp, listAll, listByType, help, formatCommand } =
    await import(resolve(arayaRoot, "dist/araya/catalog/help-provider"));
```

**Risk:** The `arayaRoot` is resolved by following `araya.yaml`'s real path (symlink dereference). If `araya.yaml` is a symlink pointing outside the project, `arayaRoot` becomes an attacker-controlled path, and the dynamic `import()` loads attacker-controlled JavaScript.

**Attack scenario:** An attacker creates `araya.yaml` as a symlink to `/tmp/evil/araya.yaml`. The dynamic import then loads `/tmp/evil/dist/araya/v2/ax3.js` — arbitrary code execution.

**Remediation:**
1. Validate that `arayaRoot` is within the expected workspace after resolving the real path
2. Add a workspace boundary check: `if (!arayaRoot.startsWith(workspaceRoot)) throw new Error(...)`
3. Alternatively, resolve imports relative to the extension's own location (`__dirname`), not relative to a symlink-resolved path

---

### H2 — Unsanitized File Write from User Input — HIGH

**File:** `extensions/araya/index.ts:1496-1502`

```typescript
pi.registerCommand("araya:learn", {
    description: "📝 Capture a structured organizational lesson",
    handler: async (args, ctx) => {
      const lesson = args?.trim() || "";
      // ...
      writeFileSync(resolve(dir, `${id}.md`),
        `# ${id}\n\n${lesson}\n\n**Captured:** ${new Date().toISOString().slice(0, 10)}`);
```

**Risk:** While the file path is controlled (`dir` is `.araya/knowledge/lessons-learned` and `id` is auto-generated `LESSON-NNN`), the **content** of `lesson` is unsanitized user input written directly to a markdown file. An attacker could inject:
- Markdown that breaks the knowledge graph parser
- JavaScript (if the markdown is ever rendered in a browser context)
- Content that misleads other agents reading the knowledge base

**Remediation:**
1. Sanitize lesson content — strip HTML tags, limit length (e.g., 10KB)
2. Validate that the content is well-formed markdown
3. Add a content policy for knowledge entries

---

### H3 — `findArayaRoot()` Symlink Following — HIGH

**Files:** 3 locations implementing the same pattern:
- `extensions/araya/index.ts:50-71`
- `src/araya/catalog/index.ts:135-142`
- `src/araya/catalog/populator.ts:82-90`

All three walk from `__dirname` upward checking `existsSync(resolve(dir, "araya.yaml"))`. Node.js's `existsSync` follows symlinks by default, meaning `araya.yaml` located in a symlinked directory could resolve the root to an unexpected location.

**Risk:** Symlink confusion could cause the catalog populator to ingest attacker-controlled `skills/` and `prompts/agents/` directories, poisoning the catalog.

**Remediation:**
1. Use `realpathSync` consistently and validate the result is within expected boundaries
2. Add a canonical root sentinel file (e.g., check for `.araya/root-marker`) beyond just `araya.yaml`

---

### H4 — Incomplete STRIDE Model — HIGH

**File:** `.araya/plan/spec/req-001-delegation-architecture.md §11.1`

The spec's "Threat Model" is a 7-row summary table. A proper STRIDE analysis requires:

- **Data flow diagrams** annotated with trust boundaries
- **Attack trees** for each threat category
- **Trust boundary enumeration** (runtime process, filesystem, agent-agent, agent-broker)
- **Residual risk** assessment after mitigations
- **Assumptions register** (what we trust and why)

Missing from the analysis:
- **Spoofing:** What prevents Agent A from impersonating Agent B via prompt injection?
- **Tampering:** Can evidence files be modified between state transitions? (The write-ahead log helps, but the check is not validated)
- **Information Disclosure:** What about agent output containing secrets from environment variables or previous tasks?
- **Elevation:** What if an agent's prompt convinces the dispatcher to change `requestedBy`?

---

### H5 — Evidence Store Path via Symlinked Root — HIGH

The evidence path `.araya/runs/` is resolved relative to `arayaRoot`, which is determined by symlink-following `araya.yaml`. If `araya.yaml` is a symlink to another location, evidence files could be written outside the expected project directory.

---

### M1 — Markdown Injection in Help Provider — MEDIUM

**File:** `src/araya/catalog/help-provider.ts:310-338`

```typescript
const lines = [
    `## ❌ Not Found: "${query}"`,
    // ...
    "### 💡 Suggestions",
    ...(suggestions.length > 0
      ? suggestions.map((s) => `  - \`${s}\``)
      : ["  *(no suggestions — try a different query)*"]),
```

The query string is embedded directly into markdown output. While suggestions come from the catalog (trusted source), the `query` itself is user-controlled. An attacker could inject markdown like `"## Fake Heading\nMalicious content"` into the help output.

**Impact:** Low — self-XSS at worst since the attacker is the user typing the command.

---

### M2 — No Content Validation on SKILL.md / Agent Prompts — MEDIUM

**File:** `src/araya/catalog/populator.ts`

The populator reads `skills/*/SKILL.md` and `prompts/agents/*.md` with `fs.readFileSync` and parses content into catalog fields. These fields are later rendered by the help provider as markdown. There is **no validation** of content:

- No size limits beyond available memory
- No structure validation (malformed frontmatter is silently ignored, not rejected)
- No sanitization of extracted sections

If a malicious or compromised skill file contains crafted content, it could:
1. Break the help provider output formatting
2. Inject misleading information into the catalog (catalog poisoning)
3. Cause agent confusion if the catalog is used for capability discovery

---

### M3 — No File Size Limits on Catalog Source Reads — MEDIUM

The populator reads entire source files into memory (`readFileSync` without size checks). An attacker who can create or modify a `SKILL.md` or agent prompt could cause memory exhaustion (DoS).

---

### M4 — Predictable `/araya:learn` IDs — MEDIUM

Lesson IDs are `LESSON-001`, `LESSON-002`, etc., determined by counting files in the directory. An attacker who can create files in `.araya/knowledge/lessons-learned/` could:
1. Create files `LESSON-001` through `LESSON-999` 
2. The next legitimate `/araya:learn` call writes to `LESSON-1000`
3. No collision detection, no content integrity check

---

### M5 — No Cryptographic Agent Authentication — MEDIUM

**File:** Spec §11.2

Agent identity is assigned by the runtime via `ctx.getCurrentAgent()`. There is **no cryptographic proof** that the agent is who it claims to be. The broker trusts the runtime's assertion entirely.

For an in-process, single-user system (which ARAYA is), this is currently acceptable. However, if the delegation broker were ever extended to cross-process or cross-network boundaries, this would become a CRITICAL gap.

---

### L1 — Symlink Following in Skills Directory — LOW

**File:** `src/araya/catalog/populator.ts:parseSkills()`

```typescript
const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillName = entry.name;
    const skillDir = path.join(skillsDir, skillName);
```

`readdirSync` with `withFileTypes: true` returns `Dirent` objects. `isDirectory()` on a `Dirent` does NOT follow symlinks by default on all platforms. However, the subsequent `path.join` and `fs.existsSync(skmdPath)` do follow symlinks. A symlink in `skills/` pointing outside the project would be followed.

---

### L2 — Predictable Delegation ID — LOW

**File:** Spec §5.1

```typescript
function generateId(prefix: string): string {
  return `${prefix}_${randomUUID().split('-')[0]}`;
}
// Example: del_a1b2c3d4
```

UUID v4 provides 122 bits of entropy. Truncating to the first 8 hex characters reduces this to 32 bits — approximately 4 billion possible values. For an in-process system, this is adequate, but it increases the probability of collisions under high delegation volume.

---

### L3 — Circuit Breaker State in Memory Only — LOW

**File:** Spec §10.2

> | Circuit breaker state | Memory only | — | Resets on restart |

After a crash/restart, the circuit breaker loses all failure history. A persistently failing agent would get a fresh circuit after every restart, defeating the protection.

---

## 4. STRIDE Matrix — Delegation Broker

### 4.1 Trust Boundaries Identified

```
┌─────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY MAP                            │
│                                                               │
│  TB1: Runtime Process Boundary                                │
│  ┌──────────────┐        ┌──────────────────────────┐        │
│  │  Calling      │────────│     Delegation Broker     │        │
│  │  Agent (A)    │  TB1   │                           │        │
│  └──────────────┘        │  ┌─────────────────────┐  │        │
│                           │  │  Request Validator  │  │        │
│  ┌──────────────┐  TB1   │  │  (identity check)   │  │        │
│  │  Target       │────────│  └─────────────────────┘  │        │
│  │  Agent (B)    │        │                           │        │
│  └──────────────┘        └───────────┬───────────────┘        │
│                                       │                        │
│                            TB2: Filesystem Boundary            │
│                                       │                        │
│                           ┌───────────▼───────────────┐        │
│                           │  .araya/runs/              │        │
│                           │  metadata.json             │        │
│                           │  output.md                  │        │
│                           │  audit.jsonl                │        │
│                           └───────────────────────────┘        │
│                                                               │
│  TB3: Catalog Boundary                                         │
│  ┌──────────────┐        ┌──────────────────────────┐        │
│  │  Capability  │────────│     Permission Checker    │        │
│  │  Registry    │  TB3   │                           │        │
│  └──────────────┘        └──────────────────────────┘        │
│                                                               │
│  TB4: Runtime Adapter Boundary                                 │
│  ┌──────────────┐        ┌──────────────────────────┐        │
│  │  Agent       │────────│     Dispatcher            │        │
│  │  Dispatcher  │  TB4   │  (pi/Codex/Claude/AGY)    │        │
│  └──────────────┘        └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 STRIDE Analysis — Full Matrix

| # | Threat | Category | Asset | Trust Boundary | Risk (Before) | Mitigation | Risk (After) | Status |
|---|--------|----------|-------|---------------|---------------|------------|--------------|--------|
| T1 | Agent A spoofs as Agent B via prompt injection | **S**poofing | Agent identity | TB1 | HIGH | `requestedBy` set server-side from runtime context | MEDIUM | ⚠️ No cryptographic proof |
| T2 | Agent sends `targetAgent=valentina` but actually routes to diana | **S**poofing | Dispatcher routing | TB4 | HIGH | Broker controls dispatch, target validated against registry | LOW | ✅ |
| T3 | Malicious agent modifies ancestor chain to bypass cycle detection | **T**ampering | Recursion guard | TB1 | HIGH | Ancestor chain built server-side, never from user input | LOW | ✅ |
| T4 | Attacker modifies `.araya/runs/{id}/metadata.json` post-completion | **T**ampering | Evidence integrity | TB2 | HIGH | Terminal states are immutable (write-once design) | LOW | ⚠️ No cryptographic integrity check |
| T5 | Attacker modifies `audit.jsonl` to remove evidence of a delegation | **T**ampering | Audit log | TB2 | HIGH | Append-only JSONL; but no hash chain or signature | MEDIUM | ⚠️ No tamper-evident seal |
| T6 | Attacker injects entries into `audit.jsonl` (fabricated delegations) | **T**ampering | Audit log | TB2 | MEDIUM | Each entry has delegation_id + timestamp; cross-checked with metadata | MEDIUM | ⚠️ No signature |
| T7 | Delegation result claims "completed" but task never executed | **R**epudiation | Non-repudiation | TB1 | HIGH | Evidence includes full agent output + artifacts in `.araya/runs/` | LOW | ✅ |
| T8 | Agent denies requesting a delegation | **R**epudiation | Non-repudiation | TB1 | MEDIUM | `requestedBy` + `createdAt` + audit log entry | LOW | ✅ |
| T9 | Sensitive data (API keys, passwords) leaks in agent output to `.araya/runs/{id}/output.md` | **I**nformation Disclosure | Secrets | TB2 | **CRITICAL** | Spec says "credentials managed by secret manager, never passed in delegation" | MEDIUM | ⚠️ No output scanning |
| T10 | `.araya/runs/` readable by other system users | **I**nformation Disclosure | Evidence files | TB2 | MEDIUM | File permissions depend on OS umask | MEDIUM | ⚠️ No explicit permission hardening |
| T11 | Broker internal state exposed via command output | **I**nformation Disclosure | Broker state | TB1 | LOW | Delegation list shows summaries only, not full state | LOW | ✅ |
| T12 | Attacker floods delegations → memory exhaustion | **D**enial of Service | Broker availability | TB1 | HIGH | `maxConcurrentDelegations` (default: 10) | LOW | ✅ |
| T13 | Attacker floods delegations → disk exhaustion via evidence files | **D**enial of Service | Filesystem | TB2 | MEDIUM | No size limits on output.md or artifacts/ | MEDIUM | ⚠️ No output size limits |
| T14 | Circuit breaker bypass via process restart | **D**enial of Service | Failure protection | TB1 | MEDIUM | Circuit breaker state is memory-only — lost on restart | MEDIUM | ⚠️ L3 |
| T15 | Agent A delegates to Agent B to gain Agent B's permissions | **E**levation of Privilege | Permission model | TB1 | CRITICAL | Agent B executes with Agent B's permissions, not A's | LOW | ✅ |
| T16 | Agent invents target agent name → dispatcher routes to wrong model | **E**levation of Privilege | Model tier governance | TB3 | MEDIUM | Target agent validated against registry before dispatch | LOW | ✅ |
| T17 | Agent A forces Agent B to use a higher-cost model tier | **E**levation of Privilege | Cost governance | TB3 | LOW | Model tier from registry, not from delegation request | LOW | ✅ |
| T18 | Prompt injection in task text causes dispatcher to change behavior | **E**levation of Privilege | Dispatcher | TB4 | HIGH | Task is wrapped in structured dispatch prompt; dispatcher doesn't parse task content | MEDIUM | ⚠️ No prompt injection guard on task text |

### 4.3 Residual Risk Summary

| Risk Level | Count | Items |
|------------|-------|-------|
| CRITICAL (unmitigated) | 0 | — |
| HIGH (unmitigated) | 0 | — |
| MEDIUM (unmitigated) | 7 | T1, T5, T6, T9, T10, T13, T14, T18 |
| LOW (unmitigated) | 11 | All others with ✅ |

**Key observation:** The broker architecture correctly mitigates the highest-severity threats (permission escalation, spoofing of target, recursive delegation). The MEDIUM residual risks cluster around **evidence integrity** (no cryptographic seals) and **information disclosure** (no output scanning, no file permission hardening).

---

## 5. Recommendations

### Immediate (before REQ-001 closure)

| # | Recommendation | Addresses |
|---|---------------|-----------|
| R1 | **Remove `--force` from `/araya:install`** or add explicit user confirmation prompt before executing external bash scripts | **C1** |
| R2 | **Add workspace boundary check after `realpathSync`**: validate that resolved `arayaRoot` is within the expected project directory before dynamic imports | **H1, H5** |
| R3 | **Sanitize `/araya:learn` input**: strip HTML/Markdown control characters, limit to 10KB | **H2** |
| R4 | **Complete the STRIDE model**: add data flow diagrams, trust boundary enumeration, attack trees, and assumptions register to §11 | **H4** |
| R5 | **Add content hash validation to `findArayaRoot()`**: store a sentinel hash in `.araya/` to verify the root has not been tampered | **H3** |

### Short-term (next sprint)

| # | Recommendation | Addresses |
|---|---------------|-----------|
| R6 | Add markdown sanitization to `help-provider.ts` output (strip raw HTML, escape backtick sequences in user queries) | **M1** |
| R7 | Add file size limits to all `readFileSync` calls in populator (e.g., 1MB max for SKILL.md, 100KB for prompts) | **M3** |
| R8 | Replace sequential `LESSON-NNN` IDs with content-addressed IDs (e.g., SHA-256 of content) | **M4** |
| R9 | Add output sanitization scanner to delegation evidence writer — detect and redact patterns matching API keys, tokens, passwords | **T9** |
| R10 | Add `chmod 600` to `.araya/runs/` directory creation | **T10** |
| R11 | Add output/artifact size limits in evidence store (e.g., 10MB per output.md, 50MB total per delegation) | **T13** |

### Long-term (backlog)

| # | Recommendation | Addresses |
|---|---------------|-----------|
| R12 | Add cryptographic signature chain to audit log (HMAC or Ed25519 per entry, chaining previous hash) | **T5, T6** |
| R13 | Persist circuit breaker state to filesystem for crash recovery | **T14, L3** |
| R14 | Add prompt injection detection to task text validation in dispatcher | **T18** |
| R15 | Add delegation ID entropy analysis — consider full UUID or 64-bit random ID | **L2** |
| R16 | Add `realpath` validation with boundary check in `skills/` directory traversal | **L1** |

---

## 6. Verdict

### VERDICT: **CONDITIONAL**

**Conditional on CRITICAL finding C1 and HIGH findings H1-H5 being resolved before REQ-001 closure.**

**Rationale:**

The **architecture** is sound. The delegation broker's design demonstrates security-forward thinking with its three-layer recursion defense, fail-closed permission model, immutable evidence, and circuit breaker. The STRIDE summary, while incomplete as a formal model, hits the right threat categories.

The **implementation** has real gaps:
- **C1** is a genuine code-execution risk that can't wait
- **H1** and **H5** create a symlink-mediated trust boundary bypass that undermines the entire catalog and broker isolation
- **H2** is a data integrity issue in the knowledge system

The catalog system (`src/araya/catalog/`) is well-structured with clean separation of concerns — populator, validator, types, and help provider are properly isolated. The lack of input sanitization is the primary weakness.

The delegation architecture spec (`.araya/plan/spec/req-001-delegation-architecture.md`) is comprehensive and well-reasoned. Section 11 (Security Architecture) needs expansion to meet professional STRIDE standards.

**I approve the architecture. I require fixes for C1, H1, H2, H3, H4, H5 before deployment of the delegation broker.**

---

*Diana, Cybersecurity Specialist — Security Audit complete. Ready for Manu's review.*
