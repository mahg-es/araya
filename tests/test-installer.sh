#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ── Snapshot ~/.pi before any installer run ─────────────────────────────────
# Capture a full manifest (path + sha256) of every file under ~/.pi/agent so we
# can later prove the installer never added, modified, or deleted anything.
# Known Pi-runtime-volatile paths are excluded from the comparison.
PI_AGENT="$HOME/.pi/agent"
PI_VOLATILE_RE='/sessions/|/crashes\.json$|/models-store\.json$|/loops\.json$'

snapshot_pi() {
  if [[ -d "$PI_AGENT" ]]; then
    find "$PI_AGENT" -type f 2>/dev/null \
      | grep -Ev "$PI_VOLATILE_RE" \
      | sort | xargs sha256sum 2>/dev/null || true
  fi
}

PI_SNAPSHOT_DIR="$(mktemp -d)"
snapshot_pi > "$PI_SNAPSHOT_DIR/before.txt" 2>/dev/null || true

# check_no_global_araya — verifies that known ARAYA product files were NOT
# installed into the global Pi layer.  Only genuine ARAYA artefacts are
# prohibited; personal Pi extensions (runtime-model-context.ts,
# req-046-cycle-copy.ts, pi-notifier.ts, etc.) are explicitly allowed.
check_no_global_araya() {
  for p in \
    "$HOME/.pi/agent/extensions/araya" \
    "$HOME/.pi/agent/extensions/araya-notifier.ts" \
    "$HOME/.pi/agent/extensions/araya.yaml"; do
    [[ ! -e "$p" ]] || { echo "FAIL: global ARAYA present: $p"; return 1; }
  done
}

check_no_global_araya

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP" "$PI_SNAPSHOT_DIR"' EXIT

# Daneel-owned paths (user layer) — capture current state so we can prove the
# installer never modifies them.
DANEEL_IDENTITY="$HOME/.pi/agent/daneel/IDENTITY.md"
DANEEL_HASH_BEFORE=""
if [[ -f "$DANEEL_IDENTITY" ]]; then
  DANEEL_HASH_BEFORE="$(sha256sum "$DANEEL_IDENTITY" | awk '{print $1}')"
fi

# 0. Ownership boundary: installer must refuse the ENTIRE Pi user layer
#    (~/.pi and ~/.pi/**), not just ~/.pi/agent, and even canonicalized
#    paths like ~/./.pi must not bypass the guard.

# 0a. --target ~/.pi => FAIL (the whole Pi user layer)
if bash araya-install.sh --target "$HOME/.pi" > "$TMP/guard_pi.log" 2>&1; then
  echo "FAIL: installer accepted ~/.pi as target"; exit 1
fi
grep -q 'Refusing to install into the Pi user layer' "$TMP/guard_pi.log" \
  || { echo "FAIL: no ownership-boundary error for ~/.pi"; exit 1; }

# 0b. --target ~/.pi/agent => FAIL
if bash araya-install.sh --target "$HOME/.pi/agent" > "$TMP/guard_agent.log" 2>&1; then
  echo "FAIL: installer accepted ~/.pi/agent as target"; exit 1
fi
grep -q 'Refusing to install into the Pi user layer' "$TMP/guard_agent.log" \
  || { echo "FAIL: no ownership-boundary error for ~/.pi/agent"; exit 1; }

# 0c. Canonicalized path ~/./.pi => FAIL (cannot bypass the guard)
if bash araya-install.sh --target "$HOME/./.pi" > "$TMP/guard_canon.log" 2>&1; then
  echo "FAIL: installer accepted canonicalized ~/./.pi as target"; exit 1
fi
grep -q 'Refusing to install into the Pi user layer' "$TMP/guard_canon.log" \
  || { echo "FAIL: no ownership-boundary error for canonicalized ~/./.pi"; exit 1; }

# 0d. Reserved name "daneel" => FAIL (even outside ~/.pi)
if bash araya-install.sh --target "$TMP/daneel" > "$TMP/guard_daneel.log" 2>&1; then
  echo "FAIL: installer accepted a target named 'daneel'"; exit 1
fi
grep -q "target named 'daneel'" "$TMP/guard_daneel.log" \
  || { echo "FAIL: no ownership-boundary error for reserved name 'daneel'"; exit 1; }

# 0e. Installer must refuse Daneel-owned paths under the user layer.
#     Note: ~/.pi/agent/daneel is a symlink that resolves OUTSIDE ~/.pi, so
#     the ownership guard fires on the canonicalised basename ("daneel").
#     ~/.pi/agent/SYSTEM.md stays inside ~/.pi, so the user-layer guard fires.
for guarded in "$HOME/.pi/agent/daneel" "$HOME/.pi/agent/SYSTEM.md"; do
  if bash araya-install.sh --target "$guarded" > "$TMP/guard_owned.log" 2>&1; then
    echo "FAIL: installer accepted a Daneel-owned path: $guarded"; exit 1
  fi
  grep -qE 'Refusing to install into the Pi user layer|target named .daneel.' "$TMP/guard_owned.log" \
    || { echo "FAIL: no ownership-boundary error for Daneel-owned path: $guarded"; exit 1; }
done

# 1. Core-only install into a clean target directory — must PASS.
TARGET="$TMP/project"
bash araya-install.sh --target "$TARGET" > "$TMP/core.log" 2>&1
grep -q 'ARAYA installer result: PASS' "$TMP/core.log"

( cd "$TARGET" && sha256sum -c SHA256SUMS.txt >/dev/null )

# 1b. The capability foundation (CLI, operations, skills, capabilities) must be
#     installed alongside the core.
[[ -f "$TARGET/cli/araya" ]] || { echo "FAIL: capability foundation CLI missing after install"; exit 1; }
[[ -d "$TARGET/operations/catalog" ]] || { echo "FAIL: operations catalog missing after install"; exit 1; }
[[ -f "$TARGET/skills/index.json" ]] || { echo "FAIL: skills index missing after install"; exit 1; }
[[ -f "$TARGET/capabilities/index.json" ]] || { echo "FAIL: capabilities index missing after install"; exit 1; }
# The installed CLI must actually run (agent-first surface).
python3 "$TARGET/cli/araya" --json status >/dev/null \
  || { echo "FAIL: installed CLI does not run"; exit 1; }

# 1c. Upgrade idempotency — re-running the installer over an existing target
#     must update in place: never nest duplicate directories (cli/cli, ...) and
#     must restore a stale/corrupted foundation file.
bash araya-install.sh --target "$TARGET" > "$TMP/upgrade.log" 2>&1
[[ $? -eq 0 ]] || { echo "FAIL: upgrade re-run failed"; exit 1; }
grep -q 'ARAYA installer result: PASS' "$TMP/upgrade.log"
for d in cli operations skills capabilities communications runtime delegation; do
  [[ ! -e "$TARGET/$d/$d" ]] \
    || { echo "FAIL: upgrade nested duplicate directory: $d/$d"; exit 1; }
done
printf '{"stale":true}\n' > "$TARGET/skills/index.json"
bash araya-install.sh --target "$TARGET" > "$TMP/upgrade2.log" 2>&1
python3 - "$TARGET/skills/index.json" <<'PY' \
  || { echo "FAIL: upgrade did not restore stale foundation file in place"; exit 1; }
import json, sys
d = json.load(open(sys.argv[1]))
assert "skills" in d, d
PY

# 2. No global Pi change — no ARAYA artefacts dropped in ~/.pi.
check_no_global_araya

# 3. Opt-in Pi adapter (project-scoped — only touches <target>/.pi/, never ~/.).
bash araya-install.sh --target "$TARGET" --adapter pi > "$TMP/pi.log" 2>&1
grep -q 'ARAYA installer result: PASS' "$TMP/pi.log"
[[ -f "$TARGET/.pi/prompts/araya.md" ]] || { echo "FAIL: pi adapter missing"; exit 1; }
grep -q 'global Pi (~/.pi) was NOT modified' "$TMP/pi.log"

check_no_global_araya

# 4. Daneel-owned identity unchanged, and the installer created no persona or
#    artefact named 'daneel'.
if [[ -f "$DANEEL_IDENTITY" && -n "$DANEEL_HASH_BEFORE" ]]; then
  DANEEL_HASH_AFTER="$(sha256sum "$DANEEL_IDENTITY" | awk '{print $1}')"
  [[ "$DANEEL_HASH_AFTER" == "$DANEEL_HASH_BEFORE" ]] \
    || { echo "FAIL: Daneel identity was modified by the installer"; exit 1; }
fi
if find "$TARGET" -iname '*daneel*' | grep -q .; then
  echo "FAIL: installer created a daneel-named artifact"; exit 1
fi

# 5. Snapshot ~/.pi before/after — prove the installer touched nothing in the
#    Professor's Pi user layer (beyond known runtime volatility).
snapshot_pi > "$PI_SNAPSHOT_DIR/after.txt" 2>/dev/null || true
if ! diff -q "$PI_SNAPSHOT_DIR/before.txt" "$PI_SNAPSHOT_DIR/after.txt" >/dev/null 2>&1; then
  echo "FAIL: ~/.pi/agent was modified by the installer:"
  diff "$PI_SNAPSHOT_DIR/before.txt" "$PI_SNAPSHOT_DIR/after.txt" || true
  exit 1
fi

echo "INSTALLER_TEST=PASS"
echo "CORE_INSTALL=PASS"
echo "UPGRADE_IDEMPOTENT=PASS"
echo "PI_ADAPTER_PROJECT_SCOPED=PASS"
echo "NO_GLOBAL_PI_TAKEOVER=PASS"
echo "DANEEL_OWNED_PATHS_PROTECTED=PASS"
echo "NO_GLOBAL_DANEEL_PERSONA=PASS"
echo "PI_SNAPSHOT_BEFORE_AFTER_MATCH=PASS"
