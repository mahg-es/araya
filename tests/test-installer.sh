#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

check_no_global_araya() {
  for p in \
    "$HOME/.pi/agent/extensions/araya" \
    "$HOME/.pi/agent/extensions/araya-notifier.ts" \
    "$HOME/.pi/agent/extensions/araya.yaml" \
    "$HOME/.pi/agent/extensions/runtime-model-context.ts" \
    "$HOME/.pi/agent/extensions/req-046-cycle-copy.ts"; do
    [[ ! -e "$p" ]] || { echo "FAIL: global ARAYA present: $p"; return 1; }
  done
}

check_no_global_araya

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Daneel-owned paths (user layer) — capture current state so we can prove the
# installer never modifies them.
DANEEL_IDENTITY="$HOME/.pi/agent/daneel/IDENTITY.md"
DANEEL_HASH_BEFORE=""
if [[ -f "$DANEEL_IDENTITY" ]]; then
  DANEEL_HASH_BEFORE="$(sha256sum "$DANEEL_IDENTITY" | awk '{print $1}')"
fi

# 0. Ownership boundary: installer must refuse the Pi user layer and the
#    reserved "daneel" name.
if bash araya-install.sh --target "$HOME/.pi/agent" > "$TMP/guard1.log" 2>&1; then
  echo "FAIL: installer accepted the Pi user layer as target"; exit 1
fi
grep -q 'Refusing to install into the Pi user layer' "$TMP/guard1.log" \
  || { echo "FAIL: no ownership-boundary error for Pi user layer"; exit 1; }

if bash araya-install.sh --target "$TMP/daneel" > "$TMP/guard2.log" 2>&1; then
  echo "FAIL: installer accepted a target named 'daneel'"; exit 1
fi
grep -q "target named 'daneel'" "$TMP/guard2.log" \
  || { echo "FAIL: no ownership-boundary error for reserved name 'daneel'"; exit 1; }

# 0b. Installer must refuse Daneel-owned paths (the user-layer identity and
#     memory), so it can never modify them.
for guarded in "$HOME/.pi/agent/daneel" "$HOME/.pi/agent/SYSTEM.md"; do
  if bash araya-install.sh --target "$guarded" > "$TMP/guard-daneel.log" 2>&1; then
    echo "FAIL: installer accepted a Daneel-owned path: $guarded"; exit 1
  fi
  grep -q 'Refusing to install into the Pi user layer' "$TMP/guard-daneel.log" \
    || { echo "FAIL: no ownership-boundary error for Daneel-owned path: $guarded"; exit 1; }
done

# 1. Core-only install into a clean target directory.
TARGET="$TMP/project"
bash araya-install.sh --target "$TARGET" > "$TMP/core.log" 2>&1
grep -q 'ARAYA installer result: PASS' "$TMP/core.log"

( cd "$TARGET" && sha256sum -c SHA256SUMS.txt >/dev/null )

# 2. No global Pi change.
check_no_global_araya

# 3. Opt-in Pi adapter (project-scoped).
bash araya-install.sh --target "$TARGET" --adapter pi > "$TMP/pi.log" 2>&1
grep -q 'ARAYA installer result: PASS' "$TMP/pi.log"
[[ -f "$TARGET/.pi/prompts/araya.md" ]] || { echo "FAIL: pi adapter missing"; exit 1; }
grep -q 'global Pi (~/.pi) was NOT modified' "$TMP/pi.log"

check_no_global_araya

# 4. Daneel-owned identity unchanged, and the installer created no persona or
#    artifact named 'daneel'.
if [[ -f "$DANEEL_IDENTITY" && -n "$DANEEL_HASH_BEFORE" ]]; then
  DANEEL_HASH_AFTER="$(sha256sum "$DANEEL_IDENTITY" | awk '{print $1}')"
  [[ "$DANEEL_HASH_AFTER" == "$DANEEL_HASH_BEFORE" ]] \
    || { echo "FAIL: Daneel identity was modified by the installer"; exit 1; }
fi
if find "$TARGET" -iname '*daneel*' | grep -q .; then
  echo "FAIL: installer created a daneel-named artifact"; exit 1
fi

echo "INSTALLER_TEST=PASS"
echo "CORE_INSTALL=PASS"
echo "PI_ADAPTER_PROJECT_SCOPED=PASS"
echo "NO_GLOBAL_PI_TAKEOVER=PASS"
echo "DANEEL_OWNED_PATHS_PROTECTED=PASS"
echo "NO_GLOBAL_DANEEL_PERSONA=PASS"
