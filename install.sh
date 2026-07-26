#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ARAYA Setup — Hardened Installer (Planned for v0.10.0)
# ─────────────────────────────────────────────────────────────────────────────
# Installs ARAYA into ~/.pi/agent/ from the canonical repository.
#
# Canonical extension: ~/.pi/agent/extensions/araya/index.ts (symlink to repo)
# Legacy extension:    ~/.pi/agent/extensions/araya.ts (REMOVED — causes duplicates)
#
# Flags:
#   --check       Verify-only — no changes, exit 0=clean 1=issues
#   --dry-run     Show what would happen without doing it
#   --force       Reinstall even if already present
#   --uninstall   Clean removal of ARAYA from ~/.pi/agent/
#   --project <p> Install project-local tools into <p>/.araya/tools/
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── Globals ──────────────────────────────────────────────────────────────
CANONICAL="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/.pi/agent"
MODE="install"          # install | check | dry-run | uninstall
FORCE=false
PROJECT_PATH=""
DRY_RUN=""              # empty = not dry-run, "true" = dry-run
UNINSTALL=false
CHECK_ONLY=false

# ─── Parse flags ──────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --force)     FORCE=true; shift ;;
    --dry-run)   DRY_RUN=true; MODE="dry-run"; shift ;;
    --check)     CHECK_ONLY=true; MODE="check"; shift ;;
    --uninstall) UNINSTALL=true; MODE="uninstall"; shift ;;
    --project)   PROJECT_PATH="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: ./araya-setup.sh [flags]"
      echo ""
      echo "Flags:"
      echo "  --check       Verify-only — no changes, exit 0=clean 1=issues"
      echo "  --dry-run     Show what would happen without doing it"
      echo "  --force       Reinstall even if already present"
      echo "  --uninstall   Clean removal of ARAYA from ~/.pi/agent/"
      echo "  --project <p> Install project-local tools into <p>/.araya/tools/"
      echo "  --help        This message"
      exit 0
      ;;
    *) echo "Unknown flag: $1"; exit 2 ;;
  esac
done

# ─── Helpers ───────────────────────────────────────────────────────────────
VERB=${DRY_RUN:+"[DRY-RUN] "}
OK=0
WARNINGS=0
FAILURES=0

ok()     { echo "  ${VERB}[OK]    $1"; OK=$((OK + 1)); }
warn()   { echo "  ${VERB}[WARN]  $1"; WARNINGS=$((WARNINGS + 1)); }
fail()   { echo "  ${VERB}[FAIL]  $1"; FAILURES=$((FAILURES + 1)); }
skip()   { echo "  ${VERB}[SKIP]  $1"; }
info()   { echo "  ${VERB}[INFO]  $1"; }
action() { echo "  ${VERB}[....]  $1"; }

# Run a command, or just print it in dry-run mode
run() {
  if [ "$DRY_RUN" = true ]; then
    echo "  ${VERB}[CMD]   $*"
  else
    "$@"
  fi
}

# Resolve real path of a potential symlink, empty if missing
real_target() {
  local p="$1"
  if [ -L "$p" ]; then
    readlink -f "$p" 2>/dev/null || true
  elif [ -f "$p" ]; then
    echo "$p"
  else
    echo ""
  fi
}

# ─── Preflight: inventory current state ───────────────────────────────────
EXT_DIR="$TARGET/extensions"
CANONICAL_EXT="$EXT_DIR/araya/index.ts"
LEGACY_EXT="$EXT_DIR/araya.ts"
CANONICAL_SRC="$CANONICAL/extensions/araya/index.ts"

inventory() {
  echo "=== Preflight Inventory ==="
  echo "Canonical source: $CANONICAL_SRC"
  echo "Target directory: $EXT_DIR"
  echo ""

  # Check canonical source exists
  if [ -f "$CANONICAL_SRC" ]; then
    ok "Canonical source present: $CANONICAL_SRC"
  else
    fail "Canonical source MISSING: $CANONICAL_SRC"
    return 1
  fi

  # Check legacy araya.ts (use -L to detect broken symlinks; -e follows target)
  if [ -L "$LEGACY_EXT" ]; then
    local lt
    lt=$(real_target "$LEGACY_EXT")
    if [ -n "$lt" ] && [ -f "$lt" ]; then
      warn "Legacy araya.ts symlink found → $lt (will back up and remove)"
    else
      warn "Legacy araya.ts BROKEN symlink found → $(readlink "$LEGACY_EXT" 2>/dev/null || echo '?') (will remove)"
    fi
  elif [ -f "$LEGACY_EXT" ]; then
    warn "Legacy araya.ts FILE found (will back up and remove)"
  else
    ok "No legacy araya.ts detected"
  fi

  # Check canonical extension
  if [ -e "$CANONICAL_EXT" ]; then
    if [ -L "$CANONICAL_EXT" ]; then
      local ct
      ct=$(real_target "$CANONICAL_EXT")
      if [ "$ct" = "$CANONICAL_SRC" ]; then
        ok "Canonical extension symlink correct → $ct"
      else
        warn "Canonical extension symlink points elsewhere: $ct (will repair)"
      fi
    elif [ -f "$CANONICAL_EXT" ]; then
      warn "Canonical extension is a FILE copy (will replace with symlink)"
    fi
  else
    info "Canonical extension not yet installed"
  fi

  # Count ARAYA registrations (-L catches broken symlinks that -e misses)
  local count=0
  if [ -L "$LEGACY_EXT" ] || [ -f "$LEGACY_EXT" ]; then count=$((count + 1)); fi
  if [ -L "$CANONICAL_EXT" ] || [ -f "$CANONICAL_EXT" ]; then count=$((count + 1)); fi
  if [ "$count" -gt 1 ]; then
    warn "DUPLICATE registrations detected: $count (legacy + canonical)"
  elif [ "$count" -eq 1 ]; then
    ok "Exactly one ARAYA registration detected"
  else
    info "No ARAYA registration detected"
  fi

  # Check dependencies
  if [ -f "$EXT_DIR/araya/package.json" ] && [ -d "$EXT_DIR/araya/node_modules" ]; then
    if [ -d "$EXT_DIR/araya/node_modules/js-yaml" ]; then
      ok "Runtime dependency present: js-yaml"
    else
      warn "Runtime dependency MISSING: js-yaml"
    fi
    if [ -d "$EXT_DIR/araya/node_modules/argparse" ]; then
      ok "Runtime dependency present: argparse"
    else
      warn "Runtime dependency MISSING: argparse"
    fi
  else
    info "Dependencies not yet installed"
  fi

  return 0
}

# ─── Uninstall ────────────────────────────────────────────────────────────
do_uninstall() {
  echo "=== Uninstall ARAYA from $TARGET ==="

  # Remove legacy registration (use -L for broken symlinks)
  if [ -L "$LEGACY_EXT" ] || [ -f "$LEGACY_EXT" ]; then
    action "Removing legacy araya.ts"
    run rm -f "$LEGACY_EXT"
    ok "Legacy araya.ts removed"
  fi

  # Remove canonical extension
  if [ -e "$CANONICAL_EXT" ]; then
    action "Removing canonical extension araya/index.ts"
    run rm -f "$CANONICAL_EXT"
    ok "Canonical araya/index.ts removed"
  fi

  # Remove araya directory if empty
  if [ -d "$EXT_DIR/araya" ]; then
    # Remove only our files, leave unknown files
    run rm -f "$EXT_DIR/araya/index.ts" 2>/dev/null || true
    run rm -f "$EXT_DIR/araya/package.json" 2>/dev/null || true
    run rm -f "$EXT_DIR/araya/package-lock.json" 2>/dev/null || true
    run rm -rf "$EXT_DIR/araya/node_modules" 2>/dev/null || true
    # Only remove dir if empty
    if [ "$DRY_RUN" = false ]; then
      rmdir "$EXT_DIR/araya" 2>/dev/null || info "araya/ directory retained (contains other files)"
    fi
  fi

  # Remove araya.yaml
  if [ -L "$EXT_DIR/araya.yaml" ]; then
    run rm -f "$EXT_DIR/araya.yaml"
    ok "araya.yaml removed"
  fi

  # Remove notifier
  if [ -L "$EXT_DIR/araya-notifier.ts" ]; then
    run rm -f "$EXT_DIR/araya-notifier.ts"
    ok "araya-notifier.ts removed"
  fi

  echo ""
  echo "=== Uninstall complete ==="
  echo "Skills, agents, and prompts under $TARGET/skills/araya/,"
  echo "$TARGET/agents/, and $TARGET/prompts/araya/ were NOT removed."
  echo "Remove them manually if desired."
}

# ─── Install ───────────────────────────────────────────────────────────────
do_install() {
  echo "=== ARAYA Setup (Planned for v0.10.0) ==="
  echo "Canonical: $CANONICAL"
  echo "Mode:      $MODE"
  echo ""

  # ── Preflight ──────────────────────────────────────────────────────────
  if ! inventory; then
    fail "Preflight failed — aborting"
    exit 1
  fi
  echo ""

  if [ "$CHECK_ONLY" = true ]; then
    if [ "$FAILURES" -gt 0 ]; then
      echo "=== Check: ISSUES FOUND ($FAILURES failures, $WARNINGS warnings) ==="
      exit 1
    fi
    echo "=== Check: CLEAN ($OK OK, $WARNINGS warnings) ==="
    exit 0
  fi

  if [ "$UNINSTALL" = true ]; then
    do_uninstall
    exit 0
  fi

  # ── Stage 1: Create backup of any legacy artifacts ────────────────────
  local BACKUP_DIR=""
  local NEEDS_RESTORE=false

  if [ "$DRY_RUN" = false ]; then
    BACKUP_DIR="$TARGET/.araya-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
  fi

  trap 'if [ "$NEEDS_RESTORE" = true ] && [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
          echo ""; echo "=== RESTORING from backup $BACKUP_DIR ==="
          [ -f "$BACKUP_DIR/araya.ts" ] && cp "$BACKUP_DIR/araya.ts" "$LEGACY_EXT" 2>/dev/null || true
          [ -f "$BACKUP_DIR/index.ts" ] && cp "$BACKUP_DIR/index.ts" "$CANONICAL_EXT" 2>/dev/null || true
          [ -d "$BACKUP_DIR/node_modules" ] && cp -r "$BACKUP_DIR/node_modules" "$EXT_DIR/araya/" 2>/dev/null || true
          [ -f "$BACKUP_DIR/package.json" ] && cp "$BACKUP_DIR/package.json" "$EXT_DIR/araya/package.json" 2>/dev/null || true
        fi' EXIT

  # ── Stage 2: Handle legacy araya.ts ────────────────────────────────────
  echo "=== Extensions ==="
  mkdir -p "$EXT_DIR"

  if [ -L "$LEGACY_EXT" ] || [ -f "$LEGACY_EXT" ]; then
    if [ "$DRY_RUN" = false ]; then
      if [ -L "$LEGACY_EXT" ]; then
        local lt
        lt=$(real_target "$LEGACY_EXT")
        if [ -n "$lt" ] && [ -f "$lt" ]; then
          action "Backing up legacy araya.ts symlink → $lt"
          cp "$lt" "$BACKUP_DIR/araya.ts" 2>/dev/null || true
        else
          info "Legacy araya.ts is a broken symlink — no content to back up"
        fi
      elif [ -f "$LEGACY_EXT" ]; then
        action "Backing up legacy araya.ts file"
        cp "$LEGACY_EXT" "$BACKUP_DIR/araya.ts" 2>/dev/null || true
      fi
    fi
    action "Removing legacy araya.ts"
    run rm -f "$LEGACY_EXT"
    ok "Legacy araya.ts removed"
  else
    skip "No legacy araya.ts to remove"
  fi

  # ── Stage 3: Handle existing canonical extension ──────────────────────
  NEEDS_RESTORE=true  # From here, failure triggers restore

  # Backup existing extension directory content
  if [ -d "$EXT_DIR/araya" ] && [ "$DRY_RUN" = false ]; then
    if [ -f "$EXT_DIR/araya/index.ts" ] && [ ! -L "$EXT_DIR/araya/index.ts" ]; then
      action "Backing up existing araya/index.ts (file copy)"
      cp "$EXT_DIR/araya/index.ts" "$BACKUP_DIR/index.ts" 2>/dev/null || true
    fi
    if [ -f "$EXT_DIR/araya/package.json" ]; then
      cp "$EXT_DIR/araya/package.json" "$BACKUP_DIR/package.json" 2>/dev/null || true
    fi
    if [ -d "$EXT_DIR/araya/node_modules" ]; then
      cp -r "$EXT_DIR/araya/node_modules" "$BACKUP_DIR/node_modules" 2>/dev/null || true
    fi
  fi

  # Ensure directory exists
  run mkdir -p "$EXT_DIR/araya"

  # Replace existing index.ts with symlink (force mode or if currently a copy/wrong link)
  local REPLACE_INDEX=false
  if [ "$FORCE" = true ]; then
    REPLACE_INDEX=true
  elif [ -e "$CANONICAL_EXT" ]; then
    if [ ! -L "$CANONICAL_EXT" ]; then
      info "Existing index.ts is a file copy — replacing with symlink"
      REPLACE_INDEX=true
    elif [ "$(real_target "$CANONICAL_EXT")" != "$CANONICAL_SRC" ]; then
      info "Existing symlink points elsewhere — repairing"
      REPLACE_INDEX=true
    fi
  fi

  if [ "$REPLACE_INDEX" = true ]; then
    run rm -f "$CANONICAL_EXT"
  fi

  if [ ! -e "$CANONICAL_EXT" ]; then
    action "Creating canonical extension symlink"
    run ln -sf "$CANONICAL_SRC" "$CANONICAL_EXT"
    ok "Canonical extension: araya/index.ts → $CANONICAL_SRC"
  else
    skip "Canonical extension already correct"
  fi

  # ── Stage 4: Install runtime dependencies ─────────────────────────────
  echo ""
  echo "=== Dependencies ==="

  # Link package.json from repo
  local REPO_PKG="$CANONICAL/extensions/araya/package.json"
  local TARGET_PKG="$EXT_DIR/araya/package.json"

  if [ -f "$REPO_PKG" ]; then
    if [ "$FORCE" = true ] || [ ! -f "$TARGET_PKG" ]; then
      run rm -f "$TARGET_PKG"
      run cp "$REPO_PKG" "$TARGET_PKG"
      ok "package.json installed from repository"
    elif [ -f "$TARGET_PKG" ]; then
      skip "package.json exists"
    fi
  else
    warn "Repository package.json missing: $REPO_PKG"
  fi

  # Run npm install
  if [ -f "$TARGET_PKG" ]; then
    local NEEDS_INSTALL=false
    if [ "$FORCE" = true ]; then
      NEEDS_INSTALL=true
    elif [ ! -d "$EXT_DIR/araya/node_modules/js-yaml" ]; then
      NEEDS_INSTALL=true
    elif [ ! -d "$EXT_DIR/araya/node_modules/argparse" ]; then
      NEEDS_INSTALL=true
    fi

    if [ "$NEEDS_INSTALL" = true ]; then
      action "Installing npm dependencies (js-yaml, argparse)"
      if [ "$DRY_RUN" = false ]; then
        (cd "$EXT_DIR/araya" && npm install --production --no-audit --no-fund 2>&1) || {
          warn "npm install had issues — checking if critical deps resolved"
        }
      fi
      # Verify critical dependencies
      if [ "$DRY_RUN" = false ]; then
        if [ -d "$EXT_DIR/araya/node_modules/js-yaml" ]; then
          ok "js-yaml installed"
        else
          fail "js-yaml NOT installed — extension may not load"
        fi
        if [ -d "$EXT_DIR/araya/node_modules/argparse" ]; then
          ok "argparse installed"
        else
          warn "argparse NOT installed — some features may be unavailable"
        fi
      fi
    else
      skip "Dependencies already installed"
    fi
  fi

  # ── Stage 4b: Subagent extension ─────────────────────────────────────
  echo ""
  local PI_PKG_DIR
  PI_PKG_DIR=$(dirname "$(dirname "$(which pi)")")
  local PI_PKG="$PI_PKG_DIR/lib/node_modules/@earendil-works/pi-coding-agent"
  local SUBAGENT_SRC="$PI_PKG/examples/extensions/subagent"

  if [ -f "$SUBAGENT_SRC/index.ts" ]; then
    run mkdir -p "$EXT_DIR/subagent"
    if [ "$FORCE" = true ]; then
      run rm -f "$EXT_DIR/subagent/index.ts" "$EXT_DIR/subagent/agents.ts" 2>/dev/null || true
    fi
    local NEEDS_SUBAGENT=false
    if [ ! -e "$EXT_DIR/subagent/index.ts" ]; then NEEDS_SUBAGENT=true; fi
    if [ ! -e "$EXT_DIR/subagent/agents.ts" ]; then NEEDS_SUBAGENT=true; fi
    if [ "$NEEDS_SUBAGENT" = true ]; then
      run ln -sf "$SUBAGENT_SRC/index.ts" "$EXT_DIR/subagent/index.ts"
      run ln -sf "$SUBAGENT_SRC/agents.ts" "$EXT_DIR/subagent/agents.ts"
      ok "Subagent extension installed"
    else
      skip "Subagent extension exists"
    fi
  fi

  # ── Stage 4c: Notifier ───────────────────────────────────────────────
  if [ -f "$CANONICAL/extensions/araya-notifier.ts" ]; then
    run rm -f "$EXT_DIR/araya-notifier.ts" 2>/dev/null || true
    run ln -sf "$CANONICAL/extensions/araya-notifier.ts" "$EXT_DIR/araya-notifier.ts"
    ok "Notifier installed"
  fi

  # ── Stage 4d: araya.yaml symlink ──────────────────────────────────────
  run rm -f "$EXT_DIR/araya.yaml" 2>/dev/null || true
  run ln -sf "$CANONICAL/araya.yaml" "$EXT_DIR/araya.yaml"
  ok "araya.yaml linked"

  # ── Stage 5: Agents ───────────────────────────────────────────────────
  echo ""
  echo "=== Agent Definitions ==="
  local AGENTS_DIR="$TARGET/agents"
  run mkdir -p "$AGENTS_DIR"
  local AGENTS_SRC="$CANONICAL/.pi/agents"

  if [ -d "$AGENTS_SRC" ]; then
    local count=0
    for f in "$AGENTS_SRC"/*.md; do
      local name
      name=$(basename "$f")
      if [ "$FORCE" = true ] || [ ! -f "$AGENTS_DIR/$name" ]; then
        run cp "$f" "$AGENTS_DIR/$name"
        count=$((count + 1))
      fi
    done
    ok "$count agents installed (total: $(ls "$AGENTS_SRC"/*.md 2>/dev/null | wc -l))"
  else
    fail "Agent source not found: $AGENTS_SRC"
    exit 1
  fi

  # ── Stage 6: Skills ───────────────────────────────────────────────────
  echo ""
  echo "=== Skills ==="
  local SKILLS_DIR="$TARGET/skills"
  run mkdir -p "$SKILLS_DIR"

  if [ "$FORCE" = true ]; then
    run rm -f "$SKILLS_DIR/araya" 2>/dev/null || true
  fi

  if [ -L "$SKILLS_DIR/araya" ]; then
    skip "Skills symlink exists"
  else
    run ln -sf "$CANONICAL/skills" "$SKILLS_DIR/araya"
    ok "Skills → $CANONICAL/skills"
  fi

  # ── Stage 7: Prompts ──────────────────────────────────────────────────
  echo ""
  echo "=== Prompt Templates ==="
  local PROMPTS_DIR="$TARGET/prompts"
  run mkdir -p "$PROMPTS_DIR"

  if [ "$FORCE" = true ]; then
    run rm -f "$PROMPTS_DIR/araya" 2>/dev/null || true
  fi

  if [ -L "$PROMPTS_DIR/araya" ]; then
    skip "Prompts symlink exists"
  else
    run ln -sf "$CANONICAL/prompts" "$PROMPTS_DIR/araya"
    ok "Prompts → $CANONICAL/prompts"
  fi

  # ── Stage 8: Project-local agents info ────────────────────────────────
  echo ""
  echo "=== Project-local Agents ==="
  if [ -d "$CANONICAL/.pi/agents" ]; then
    ok "$(ls "$CANONICAL/.pi/agents"/*.md 2>/dev/null | wc -l) agents in .pi/agents/"
  fi

  # ── Stage 9: Project tools (--project flag) ───────────────────────────
  if [ -n "$PROJECT_PATH" ]; then
    echo ""
    echo "=== Project Tools → $PROJECT_PATH ==="
    local TOOLS_DIR="$PROJECT_PATH/.araya/tools"
    run mkdir -p "$TOOLS_DIR"
    for tool in postoffice_loop.py session_identity.py loop_silence_guard.py ax_audit.py; do
      if [ -f "$CANONICAL/src/$tool" ]; then
        run cp "$CANONICAL/src/$tool" "$TOOLS_DIR/$tool"
        ok "$tool"
      else
        warn "$tool not found in Framework src/"
      fi
    done
    echo "  Tools installed in .araya/tools/ — invoke as: python3 .araya/tools/<tool>.py"
  fi

  # ── Stage 10: Verification ─────────────────────────────────────────────
  echo ""
  echo "=== Verification ==="

  # In dry-run mode, skip verification (nothing was actually created)
  if [ "$DRY_RUN" = true ]; then
    skip "Verification skipped in dry-run mode"
    NEEDS_RESTORE=false
    trap - EXIT
    echo ""
    echo "=== Done (dry-run) ==="
    echo "  Run without --dry-run to install."
    exit 0
  fi

  local VERIFY_FAILURES=0

  # Verify canonical extension exists and is correct
  if [ -e "$CANONICAL_EXT" ]; then
    if [ -L "$CANONICAL_EXT" ]; then
      local rt
      rt=$(real_target "$CANONICAL_EXT")
      if [ "$rt" = "$CANONICAL_SRC" ]; then
        ok "Canonical extension: correct symlink to repository"
      else
        fail "Canonical extension symlink is wrong: $rt (expected $CANONICAL_SRC)"
        VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
      fi
    else
      fail "Canonical extension is NOT a symlink (should be)"
      VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
    fi
  else
    fail "Canonical extension MISSING"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi

  # Verify legacy does NOT exist (use -L for broken symlinks, -f for files)
  if [ -L "$LEGACY_EXT" ] || [ -f "$LEGACY_EXT" ]; then
    fail "Legacy araya.ts STILL EXISTS — will cause :1/:2 command suffixes"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  else
    ok "No legacy araya.ts (no :1/:2 command suffixes)"
  fi

  # Verify dependencies
  if [ -d "$EXT_DIR/araya/node_modules/js-yaml" ]; then
    ok "Runtime dependency: js-yaml"
  else
    fail "Runtime dependency MISSING: js-yaml"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi

  # Verify exactly one ARAYA extension
  local ext_count=0
  if [ -L "$CANONICAL_EXT" ] || [ -f "$CANONICAL_EXT" ]; then ext_count=$((ext_count + 1)); fi
  if [ -L "$LEGACY_EXT" ] || [ -f "$LEGACY_EXT" ]; then ext_count=$((ext_count + 1)); fi
  if [ "$ext_count" -eq 1 ]; then
    ok "Exactly 1 ARAYA extension registrations"
  else
    fail "Extension count: $ext_count (expected 1)"
    VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
  fi

  # Verify installed source matches repository
  if [ "$DRY_RUN" = false ] && [ -L "$CANONICAL_EXT" ]; then
    local rt
    rt=$(real_target "$CANONICAL_EXT")
    if [ "$rt" = "$CANONICAL_SRC" ]; then
      if diff -q "$rt" "$CANONICAL_SRC" >/dev/null 2>&1; then
        ok "Installed source matches repository artifact"
      else
        # Same path means symlink resolved to same file; diff is redundant but safe
        ok "Installed source matches repository artifact"
      fi
    fi
  fi

  # ── Done ────────────────────────────────────────────────────────────────
  echo ""
  echo "=== Done ==="
  echo ""
  echo "  Agents:     $(ls "$AGENTS_DIR"/*.md 2>/dev/null | wc -l)"
  echo "  Skills:     $(find "$SKILLS_DIR/araya" -name 'SKILL.md' 2>/dev/null | wc -l)"
  echo "  Extensions: $(ls "$EXT_DIR/araya/index.ts" "$EXT_DIR"/*.ts 2>/dev/null | wc -l)"
  echo "  Prompts:    $(ls "$PROMPTS_DIR/araya/agents/"*.md 2>/dev/null | wc -l)"
  echo ""

  if [ "$VERIFY_FAILURES" -gt 0 ]; then
    fail "VERIFICATION FAILED: $VERIFY_FAILURES checks failed"
    echo "  Run /reload in pi to activate"
    echo "  If :1/:2 command suffixes appear, re-run: ./araya-setup.sh --force"
    exit 1
  fi

  ok "Verification passed"
  echo "  Run /reload in pi to activate"
  echo "  Test: /araya run --mode standard \"Hello ARAYA\""
  echo "  Verify no :1/:2 suffixes: check /araya commands in pi UI"

  NEEDS_RESTORE=false  # Success — don't restore
  trap - EXIT
}

# ─── Main ──────────────────────────────────────────────────────────────────
echo ""
do_install
