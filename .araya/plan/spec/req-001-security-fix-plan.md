# REQ-001 Security Fix Plan — C1, H1-H5

- **Document:** Security Fix Plan
- **Parent:** `.araya/plan/spec/req-001-security-audit.md` (Diana's audit, 2026-07-22)
- **Date:** 2026-07-22
- **Author:** Diana (Cybersecurity Specialist)
- **Status:** AWAITING_IMPLEMENTATION
- **Assignee:** Valentina (Frontend Dev, primary) / Isla (Infra Architect, review) / Aisha (Backend Architect, review)

---

## Table of Contents

1. [Verdict](#verdict)
2. [Fix: C1 — Arbitrary Script Execution via `/araya:install`](#fix-c1--arbitrary-script-execution-via-arayainstall)
3. [Fix: H1 — Dynamic Import from Symlink-Followed Path](#fix-h1--dynamic-import-from-symlink-followed-path)
4. [Fix: H2 — Unsanitized File Write from `/araya:learn`](#fix-h2--unsanitized-file-write-from-arayalearn)
5. [Fix: H3 — `findArayaRoot()` Symlink Following](#fix-h3--findarayaroot-symlink-following)
6. [Fix: H4 — Incomplete STRIDE Model](#fix-h4--incomplete-stride-model)
7. [Fix: H5 — Evidence Store Path via Symlinked Root](#fix-h5--evidence-store-path-via-symlinked-root)
8. [Post-Implementation Verification](#post-implementation-verification)

---

## Verdict

**BLOCKING.** These 6 findings **must** be resolved before REQ-001 closure (deployment of the delegation broker). The architecture is approved; the implementation gaps must close.

**Assignment rationale:**

| Finding | Primary | Reviewer | Reason |
|---------|---------|----------|--------|
| C1 | Valentina | Isla | Code change in extension surface; Isla reviews infra/execution risk |
| H1 | Valentina | Isla + Aisha | Code change in extension; Isla reviews symlink boundary; Aisha reviews import architecture |
| H2 | Valentina | Aisha | Simple sanitization; Aisha reviews data integrity in knowledge system |
| H3 | Valentina | Isla | Code change across 3 files; Isla reviews filesystem trust boundary |
| H4 | Diana → Isla/Aisha | Manu | Spec document; Diana provides the expanded model, Isla/Aisha validate technical accuracy, Manu signs off |
| H5 | Valentina | Isla | Same mechanism as H1; fix H1 and H5 is resolved |

---

## Fix: C1 — Arbitrary Script Execution via `/araya:install`

**Severity:** CRITICAL
**File:** `extensions/araya/index.ts`
**Lines:** 906–927

### Current Code (lines 906–927)

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
        // ...
      }
    },
});
```

### Attack Vector
`root` comes from `findArayaRoot()` → finds `araya.yaml` anywhere in directory hierarchy → attacker drops `araya.yaml` + malicious `araya-setup.sh` → `/araya:install` runs it with `--force` (no confirmation) with full user privileges.

### Proposed Fix

**Three changes** to the handler block (lines 906–927):

1. **Add interactive confirmation prompt** before executing the script. Use `ctx.ui.confirm()` (or equivalent Pi TUI confirm dialog). The prompt must:
   - Show the full resolved path of the script
   - Show a SHA-256 hash of the script
   - Require explicit "yes" from the user

2. **Remove the `--force` flag** from the `pi.exec` call. The setup script should run in its default (interactive) mode. If `--force` is a required parameter of the script, replace it with a flag that requires explicit user intent.

3. **Add script hash validation** against a known good value embedded in the extension. If the hash doesn't match, block execution even if the user confirms.

### Proposed Code

```typescript
pi.registerCommand("araya:install", {
    description: "🔧 Install ARAYA on this machine from canonical source",
    handler: async (_args, ctx) => {
      const setupScript = resolve(root, "araya-setup.sh");
      if (!existsSync(setupScript)) {
        ctx.ui.notify(`❌ Setup script not found at: ${setupScript}`, "error");
        return;
      }

      // Compute script hash for integrity check
      const scriptContent = readFileSync(setupScript, "utf-8");
      const scriptHash = crypto.createHash("sha256").update(scriptContent).digest("hex");

      // Require explicit user confirmation
      const confirmed = await ctx.ui.confirm(
        `⚠️  **Security Confirmation Required**\n\n` +
        `ARAYA will execute the setup script:\n` +
        `- **Path:** \`${setupScript}\`\n` +
        `- **SHA-256:** \`${scriptHash.slice(0, 16)}...\`\n\n` +
        `This script will run with your user privileges and may modify your system.\n\n` +
        `Type **yes** to proceed:`
      );

      if (!confirmed) {
        ctx.ui.notify("❌ Installation cancelled by user.", "warning");
        return;
      }

      ctx.ui.notify(`🔧 Running ARAYA setup from ${root}...`, "info");

      try {
        // Run WITHOUT --force — let the script handle its own confirmation
        const result = await pi.exec("bash", [setupScript]);
        ctx.ui.notify(
          `✅ **ARAYA installed successfully**\n\n${result.stdout.slice(-500)}`,
          "info"
        );
      } catch (e: any) {
        ctx.ui.notify(
          `❌ Setup failed: ${e?.message ?? "unknown error"}`,
          "error"
        );
      }
    },
});
```

### Dependencies
- `ctx.ui.confirm()` must be available in the Pi extension API. If it doesn't exist, Valentina must request it from the Pi runtime team or use `ctx.ui.prompt()` as fallback.
- `crypto` module (`node:crypto`) must be imported at the top of the file. Check if it's already imported; if not, add: `import { createHash } from "node:crypto";`

### Validation
- Run `/araya:install` → confirm dialog appears with script path and hash
- Type "no" → installation cancelled
- Type "yes" → script executes
- Modify `araya-setup.sh` → hash changes → confirm dialog shows different hash

### Assignment
- **Implement:** Valentina
- **Review:** Isla (Infra Architect) — validates execution boundary and privilege model

---

## Fix: H1 — Dynamic Import from Symlink-Followed Path

**Severity:** HIGH
**File:** `extensions/araya/index.ts`
**Lines:** 2015–2019 (AX3 command) and 2093–2097 (`/araya:man` command)

### Current Code — AX3 command (lines 2015–2019)

```typescript
const arayaYamlReal = realpathSync(resolve(findArayaRoot(), "araya.yaml"));
const arayaRoot = dirname(arayaYamlReal);
const { check: ax3Check, dryRun: ax3DryRun, reconcile: ax3Reconcile } =
    await import(resolve(arayaRoot, "dist/araya/v2/ax3"));
```

### Current Code — `/araya:man` command (lines 2093–2097)

```typescript
const arayaYamlReal = realpathSync(resolve(findArayaRoot(), "araya.yaml"));
const arayaRoot = dirname(arayaYamlReal);
const { man, manAgent, manSkill, manSearch, manHelp, listAll, listByType, help, formatCommand } =
    await import(resolve(arayaRoot, "dist/araya/catalog/help-provider"));
```

### Attack Vector
1. Attacker creates `araya.yaml` as a symlink to `/tmp/evil/araya.yaml`
2. `realpathSync` follows the symlink → `arayaRoot` = `/tmp/evil`
3. Dynamic `import()` loads `/tmp/evil/dist/araya/v2/ax3.js` or `/tmp/evil/dist/araya/catalog/help-provider.js`
4. Arbitrary JavaScript execution in the extension process

### Proposed Fix

**Add a workspace boundary validation** immediately after resolving `arayaRoot`. The check must verify that `arayaRoot` is within the expected workspace (the project directory where the extension is running).

Two variants, depending on what the extension has access to:

**Variant A (preferred): Validate against `cwd` or a known project root**

```typescript
// After resolving arayaRoot, before dynamic import:
const arayaYamlReal = realpathSync(resolve(findArayaRoot(), "araya.yaml"));
const arayaRoot = dirname(arayaYamlReal);

// WORKSPACE BOUNDARY CHECK: ensure arayaRoot is within cwd
const cwdReal = realpathSync(cwd);
if (!arayaRoot.startsWith(cwdReal + path.sep) && arayaRoot !== cwdReal) {
  throw new Error(
    `SECURITY: araya.yaml resolved outside workspace.\n` +
    `  Resolved: ${arayaRoot}\n` +
    `  Workspace: ${cwdReal}\n` +
    `  This may indicate a symlink attack. Refusing to load.`
  );
}

const { check: ax3Check, ... } = await import(resolve(arayaRoot, "dist/araya/v2/ax3"));
```

**Variant B (fallback): Validate against the extension's own location**

```typescript
// After resolving arayaRoot, before dynamic import:
const arayaYamlReal = realpathSync(resolve(findArayaRoot(), "araya.yaml"));
const arayaRoot = dirname(arayaYamlReal);

// WORKSPACE BOUNDARY CHECK: resolve relative to extension's own location
const extensionRoot = dirname(realpathSync(__filename));
// Walk up to find the project root (where package.json lives)
// or use a sentinel file check
if (!existsSync(resolve(arayaRoot, ".araya"))) {
  throw new Error(
    `SECURITY: araya.yaml at ${arayaRoot} does not appear to be a valid ARAYA project. ` +
    `Missing .araya/ sentinel directory. Refusing to load.`
  );
}

const { check: ax3Check, ... } = await import(resolve(arayaRoot, "dist/araya/v2/ax3"));
```

### Recommendation
Use **Variant A** (workspace boundary check against `cwd`). It's simpler, more precise, and doesn't rely on sentinel file existence. Apply the check identically to both dynamic import sites:

- **Site 1:** After line 2017, before line 2018 (AX3 command)
- **Site 2:** After line 2095, before line 2098 (`/araya:man` command)

Additionally, add the same check in `findArayaRoot()` itself (see H3 fix below for a unified approach).

### Validation
- Normal operation: `araya.yaml` is in the project root → boundary check passes → imports load normally
- Symlink attack: `araya.yaml` symlinks to `/tmp/evil/` → boundary check fails → error thrown, no code loaded
- Nested projects: `araya.yaml` in a subdirectory within workspace → boundary check passes (it's within `cwd`)

### Assignment
- **Implement:** Valentina
- **Review:** Isla (Infra Architect) — validates filesystem trust boundary; Aisha (Backend Architect) — validates import architecture

---

## Fix: H2 — Unsanitized File Write from `/araya:learn`

**Severity:** HIGH
**File:** `extensions/araya/index.ts`
**Lines:** 1496–1502

### Current Code

```typescript
const lesson = args?.trim() || "";
if (!lesson) { ctx.ui.notify("Usage: /araya learn \"<lesson>\"", "warning"); return; }
// ...
const id = `LESSON-${String(count).padStart(3, "0")}`;
writeFileSync(resolve(dir, `${id}.md`),
  `# ${id}\n\n${lesson}\n\n**Captured:** ${new Date().toISOString().slice(0, 10)}`);
```

### Attack Vector
User-controlled `args` (the `lesson` content) is written directly to a `.md` file without sanitization. Could inject:
- Markdown that breaks the knowledge graph parser
- HTML/JavaScript (if rendered in a browser context)
- Misleading content that corrupts organizational knowledge

### Proposed Fix

**Three changes:**

1. **Sanitize the input** — strip HTML tags and limit to safe markdown
2. **Add a maximum length** — 10KB (10,240 characters)
3. **Add a content warning for obviously suspicious patterns** (script tags, base64 blobs, etc.)

### Proposed Code

Replace lines 1492–1503 with:

```typescript
pi.registerCommand("araya:learn", {
    description: "📝 Capture a structured organizational lesson",
    handler: async (args, ctx) => {
      const raw = args?.trim() || "";
      if (!raw) { ctx.ui.notify("Usage: /araya learn \"<lesson>\"", "warning"); return; }

      // H2 FIX: Input sanitization
      const MAX_LESSON_LENGTH = 10240; // 10KB

      if (raw.length > MAX_LESSON_LENGTH) {
        ctx.ui.notify(
          `❌ Lesson too long (${raw.length} chars). Maximum is ${MAX_LESSON_LENGTH} characters.`,
          "error"
        );
        return;
      }

      // Strip HTML tags and dangerous Markdown constructs
      const lesson = raw
        .replace(/<[^>]*>/g, "")           // strip HTML tags
        .replace(/```(?:javascript|js|html|css)/gi, "```text") // neutralize code block language hints
        .replace(/\[([^\]]*)\]\(javascript:[^)]*\)/gi, "[$1](blocked-link)") // strip javascript: URLs
        .trim();

      if (!lesson) {
        ctx.ui.notify("❌ Lesson content is empty after sanitization.", "warning");
        return;
      }

      const cwd = process.cwd();
      const { writeFileSync, existsSync, mkdirSync, readdirSync } = await import("node:fs");
      const { resolve } = await import("node:path");
      const dir = resolve(cwd, ".araya/knowledge/lessons-learned");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const count = readdirSync(dir).length + 1;
      const id = `LESSON-${String(count).padStart(3, "0")}`;

      writeFileSync(
        resolve(dir, `${id}.md`),
        `# ${id}\n\n${lesson}\n\n**Captured:** ${new Date().toISOString().slice(0, 10)}`
      );

      ctx.ui.notify(`✅ ${id} captured: ${lesson.slice(0, 80)}${lesson.length > 80 ? '...' : ''}`, "info");
    },
});
```

### Dependencies
None. All sanitization uses vanilla JavaScript string operations.

### Validation
- `/araya:learn "<script>alert(1)</script>"` → HTML stripped, only "alert(1)" stored
- `/araya:learn "Normal lesson text"` → stored as-is
- Lesson > 10KB → rejected with error message
- Lesson that's all HTML → rejected as "empty after sanitization"
- `/araya:learn "[click](javascript:evil())"` → link stripped, only "[click](blocked-link)" stored

### Assignment
- **Implement:** Valentina
- **Review:** Aisha (Backend Architect) — validates data integrity in knowledge system

---

## Fix: H3 — `findArayaRoot()` Symlink Following

**Severity:** HIGH
**Files:** 3 files, 3 identical patterns
- `extensions/araya/index.ts:50–71`
- `src/araya/catalog/index.ts:135–142`
- `src/araya/catalog/populator.ts:82–90`

### Current Code (all three are structurally identical)

```typescript
function findArayaRoot(): string {
  let dir = dirname(__filename);  // or __dirname in catalog files
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "araya.yaml"))) return dir;
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("ARAYA: Cannot find araya.yaml root.");
}
```

### Attack Vector
`existsSync` follows symlinks. If a directory in the path is a symlink to an attacker-controlled location, the `araya.yaml` found could be malicious. The catalog populator would ingest attacker-controlled `skills/` and `prompts/agents/`, poisoning the capability registry.

**Concrete scenario for `src/araya/catalog/`:** The catalog is compiled to `dist/araya/catalog/index.js`. When installed as a Pi extension, `__dirname` resolves to somewhere in `~/.pi/`. If any parent directory between `__dirname` and the actual project root contains a symlink, `existsSync` follows it without the code knowing.

### Proposed Fix

**Two changes per file:**

1. After finding the root via `existsSync`, **resolve the real path** and **validate it's within expected boundaries**
2. Add a **sentinel check** for `.araya/` directory to confirm it's a genuine ARAYA project root

### Proposed Code — `extensions/araya/index.ts`

Replace lines 50–71:

```typescript
function findArayaRoot(): string {
  let dir = dirname(__filename);
  for (let i = 0; i < 10; i++) {
    if (existsSync(resolve(dir, "araya.yaml"))) {
      // H3 FIX: Resolve real path and validate
      const realDir = realpathSync(dir);
      // Sentinel: a genuine ARAYA project has a .araya/ directory
      if (!existsSync(resolve(realDir, ".araya"))) {
        throw new Error(
          `SECURITY: araya.yaml found at ${dir} but .araya/ sentinel missing. ` +
          `Cowardly refusing to use a potentially symlink-hijacked root.`
        );
      }
      return realDir;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }

  // Fallback: try via realpath of the extension file itself
  try {
    const realFile = realpathSync(__filename);
    dir = dirname(realFile);
    for (let i = 0; i < 10; i++) {
      if (existsSync(resolve(dir, "araya.yaml"))) {
        const realDir = realpathSync(dir);
        if (!existsSync(resolve(realDir, ".araya"))) {
          throw new Error(
            `SECURITY: araya.yaml found at ${dir} but .araya/ sentinel missing.`
          );
        }
        return realDir;
      }
      const parent = resolve(dir, "..");
      if (parent === dir) break;
      dir = parent;
    }
  } catch { /* realpathSync may fail */ }

  throw new Error("ARAYA: Cannot find araya.yaml.");
}
```

### Proposed Code — `src/araya/catalog/index.ts`

Replace lines 135–142:

```typescript
function findArayaRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 15; i++) {
    if (fs.existsSync(path.resolve(dir, "araya.yaml"))) {
      // H3 FIX: Resolve real path and validate sentinel
      const realDir = fs.realpathSync(dir);
      if (!fs.existsSync(path.resolve(realDir, ".araya"))) {
        throw new Error(
          `SECURITY: araya.yaml found at ${dir} but .araya/ sentinel missing. ` +
          `Cowardly refusing to use a potentially symlink-hijacked root.`
        );
      }
      return realDir;
    }
    const parent = path.resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("ARAYA: Cannot find araya.yaml root from " + __dirname);
}
```

### Proposed Code — `src/araya/catalog/populator.ts`

Apply the **identical** fix pattern as `index.ts` above (replace lines 82–90 with the same `realpathSync` + `.araya/` sentinel pattern).

### Validation
- Normal project with `.araya/` directory → `findArayaRoot()` returns expected path
- Project missing `.araya/` → throws security error
- Symlink to malicious directory with `araya.yaml` but no `.araya/` → throws security error
- Symlink to genuine project (which has `.araya/`) → works (legitimate use case)

### Assignment
- **Implement:** Valentina (all 3 files)
- **Review:** Isla (Infra Architect) — validates filesystem trust boundary

---

## Fix: H4 — Incomplete STRIDE Model

**Severity:** HIGH
**File:** `.araya/plan/spec/req-001-delegation-architecture.md`
**Section:** §11.1 (Security Architecture → Threat Model)

### Current State
The spec's §11.1 contains a 7-row summary table. Missing:
- Data flow diagrams (DFDs) annotated with trust boundaries
- Attack trees for each threat category
- Trust boundary enumeration as a formal list
- Residual risk assessment after mitigations
- Assumptions register (what we trust and why)
- Full analysis of: Spoofing, Information Disclosure (T9, T10), DoS (T13, T14), Elevation (T18)

### Proposed Fix

**This is a spec/documentation fix, not a code fix.** Diana will produce the expanded STRIDE model and insert it into the spec. The full STRIDE analysis already exists in the security audit report (§4 of `req-001-security-audit.md`). The fix is to migrate that analysis into the architecture spec.

**What to add to §11.1:**

1. **§11.1.1 Trust Boundary Map** — ASCII diagram showing TB1 (Runtime Process), TB2 (Filesystem), TB3 (Catalog), TB4 (Runtime Adapter)
2. **§11.1.2 Trust Boundary Enumeration** — formal list of boundaries with descriptions
3. **§11.1.3 STRIDE Matrix** — the full 18-threat matrix from the audit report §4.2
4. **§11.1.4 Residual Risk Summary** — table from audit report §4.3
5. **§11.1.5 Assumptions Register** — explicit list of what the system trusts and why

### Procedure

1. Diana (or a delegated writer) copies the STRIDE content from `req-001-security-audit.md` §4 into `req-001-delegation-architecture.md` §11.1
2. Isla reviews the trust boundary map for technical accuracy
3. Aisha reviews the threat assessment for architectural completeness
4. Manu signs off (SPEC_APPROVED gate)

### Content Source
All content already exists in `.araya/plan/spec/req-001-security-audit.md` §4. This is a copy/migrate operation, not a write-from-scratch.

### Validation
- Open `req-001-delegation-architecture.md` §11.1
- Verify it contains: DFD/trust boundary diagram, 18-row STRIDE matrix, residual risk table, assumptions register
- Verify no contradiction between the spec STRIDE and the audit STRIDE

### Assignment
- **Produce expanded STRIDE:** Diana (content already authored in audit §4; migration only)
- **Review:** Isla (Infra Architect) + Aisha (Backend Architect)
- **Sign-off:** Manu (Product Owner)

---

## Fix: H5 — Evidence Store Path via Symlinked Root

**Severity:** HIGH
**File:** `extensions/araya/index.ts`
**Lines:** 2017 (AX3 command — same line as H1)

### Current Code

```typescript
const arayaYamlReal = realpathSync(resolve(findArayaRoot(), "araya.yaml"));
const arayaRoot = dirname(arayaYamlReal);
```

### Attack Vector
Same mechanism as H1. The evidence store (`.araya/runs/`) is resolved relative to `arayaRoot`, which is determined by symlink-following `araya.yaml`. If `araya.yaml` is a symlink pointing outside the project, evidence files could be written to an attacker-controlled location.

### Proposed Fix

**This is resolved by the same fix as H1.** Once `arayaRoot` is validated to be within the workspace boundary (H1 fix), the evidence store path is also guaranteed to be within the workspace. No separate fix needed for H5 beyond H1's workspace boundary check.

### Verification
- Apply H1 fix (workspace boundary check)
- Confirm that `.araya/runs/` is always created within the validated workspace
- No additional code change required

### Assignment
- **Implement:** Valentina (as part of H1 fix)
- **Review:** Isla (Infra Architect) — confirms H1 fix covers H5

---

## Post-Implementation Verification

After all fixes are applied, run the following verification checklist:

### C1 Verification
- [ ] `/araya:install` shows confirmation dialog with script path and hash
- [ ] Typing "no" cancels execution
- [ ] Script runs without `--force` flag
- [ ] Modified `araya-setup.sh` shows different hash in dialog

### H1 Verification
- [ ] Normal workspace: dynamic imports load correctly
- [ ] Symlinked `araya.yaml` outside workspace: error thrown, no code loaded
- [ ] Both AX3 and `/araya:man` commands work after boundary check

### H2 Verification
- [ ] HTML tags stripped from `/araya:learn` input
- [ ] `javascript:` URLs neutralized
- [ ] Lesson > 10KB rejected
- [ ] Empty-after-sanitization rejected
- [ ] Normal lessons stored correctly

### H3 Verification
- [ ] `findArayaRoot()` returns real path (not symlink path)
- [ ] Missing `.araya/` sentinel throws security error
- [ ] Catalog populator and help provider work correctly with real path
- [ ] All 3 files (extensions, catalog/index, catalog/populator) have identical fix

### H4 Verification
- [ ] `req-001-delegation-architecture.md` §11.1 contains full STRIDE model
- [ ] Trust boundary map, matrix, residual risk, and assumptions register present
- [ ] No contradiction with audit report

### H5 Verification
- [ ] Evidence store writes to `.araya/runs/` within workspace boundary
- [ ] H1 boundary check covers H5 scenario

### Integration Test
- [ ] Full `/araya:man` command works (tests H1 + H3 combined)
- [ ] `/araya:ax3` reconciliation works (tests H1 + H3 combined)
- [ ] `/araya:learn "Test lesson"` stores correctly (tests H2)
- [ ] `.araya/runs/` directory created within workspace (tests H5)

---

*Diana, Cybersecurity Specialist — Fix plan complete. Handing off to Valentina for implementation and Isla/Aisha for review. No code leaves this document until reviewed.*
