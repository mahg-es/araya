#!/usr/bin/env bash
set -Eeuo pipefail

# araya-install.sh — repository installer for the ARAYA AX3 v0.6.0 core.
#
#   verify input
#   -> install ARAYA core + capability foundation
#   -> optionally install a requested host adapter
#   -> verify installation
#   -> report exact result
#
# Default installation is core-only and NEVER takes over global Pi. The Pi
# adapter is opt-in and project-scoped (it only touches <target>/.pi/).

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CANONICAL_FILES=(
  "GPT-CONFIGURATION.md"
  "K01-FOUNDATION-AUTHORITY-STAGES-ADR-AUTOGOVERNANCE.md"
  "K02-PRODUCT-DELIVERY-SLICES-DAG-TRACEABILITY.md"
  "K03-ASYNC-GIT-PUBLICATION-RELEASE.md"
  "K04-ENGINEERING-TOOLKIT-PERSISTENCE-UAT.md"
  "K05-INSTALL-BUNDLE-PROCEDURE-PREFLIGHT.md"
  "K06-AI-ORCHESTRATION-PRODUCT-MODEL-USER-TIME.md"
  "K07-RESPONSES-SCOPE-VERSIONING-CHANGE-CONTROL.md"
  "K08-TEMPLATES-ADR-IMPLEMENTATION-PLAN.md"
  "K09-TEMPLATES-AUDIT-UAT-TRACEABILITY.md"
  "K10-PROVENANCE-ADOPTION-PACKAGING.md"
  "ADOPTION-RECORD.md"
  "ARAYA-AX3-v0.6.0-CANONICAL-AUDIT.md"
  "SHA256SUMS.txt"
)

# Capability foundation: the agent-first CLI, shared library, operations
# catalog, skills, capabilities, communications, runtime, and delegation.
# Copied alongside the canonical core (they are product, not kernel canon).
FOUNDATION_DIRS=(
  "cli"
  "operations"
  "skills"
  "capabilities"
  "communications"
  "runtime"
  "delegation"
)

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*"; }

usage() {
  cat <<'EOF'
Usage:
  araya-install.sh [OPTIONS]

Installs the ARAYA AX3 v0.6.0 operating-model core, and optionally a host
adapter. Default installation is core-only and NEVER touches global Pi.

Options:
  --target DIR       Install the core into DIR (default: current directory).
  --adapter pi       Opt-in: install the project-scoped Pi adapter into
                     DIR/.pi/ (adds the explicit /araya command for DIR only).
  --adapter chatgpt  Opt-in: build the reproducible ChatGPT bundle.
  -h, --help         Show this help.

Example:
  bash araya-install.sh --target /path/to/project --adapter pi
EOF
}

TARGET=""
ADAPTERS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      [[ $# -ge 2 ]] || die "--target requires a value"
      TARGET="$2"; shift 2
      ;;
    --adapter)
      [[ $# -ge 2 ]] || die "--adapter requires a value"
      case "$2" in
        pi|chatgpt) ADAPTERS+=("$2") ;;
        *) die "Unsupported adapter: $2" ;;
      esac
      shift 2
      ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1" ;;
  esac
done

[[ -n "$TARGET" ]] || TARGET="$PWD"

for cmd in bash sha256sum cp mkdir; do
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
done

# ── 0. ownership boundary ──────────────────────────────────────────────────
# ARAYA owns only the target directory it is given. It must never touch the Pi
# user layer (~/.pi/) — which includes the Professor's personal agent Daneel
# (under ~/.pi/agent/) — nor the reserved name "daneel".
#
# Canonicalize the target so that paths like ~/./.pi, ~/.pi/../../.pi, or
# relative ../ segments cannot bypass the guard.  realpath -m resolves . and ..
# and symlinks even when the path does not yet exist on disk.
canonicalize_path() {
  if command -v realpath >/dev/null 2>&1; then
    realpath -m "$1"
  else
    (cd "$1" 2>/dev/null && pwd) || printf '%s' "$1"
  fi
}

ABS_TARGET="$(canonicalize_path "$TARGET")"

# Resolve $HOME to its canonical form first (handles HOME containing symlinks
# or relative segments), then append /.pi.  This lets us guard even when
# ~/.pi does not yet exist on disk.
HOME_CANON="$(cd "$HOME" && pwd)"
PI_USER_LAYER="$(canonicalize_path "$HOME_CANON/.pi")"

if [[ -n "$PI_USER_LAYER" ]]; then
  case "$ABS_TARGET" in
    "$PI_USER_LAYER"|"$PI_USER_LAYER"/*)
      die "Refusing to install into the Pi user layer ($PI_USER_LAYER). ARAYA does not own Pi user resources (including Daneel)."
      ;;
  esac
fi

if [[ "$(basename "$ABS_TARGET")" == "daneel" ]]; then
  die "Refusing to install into a target named 'daneel' (reserved to the Professor's personal Pi agent)."
fi

# ── 1. verify input ────────────────────────────────────────────────────────
info "ARAYA installer: verifying input..."
for f in "${CANONICAL_FILES[@]}"; do
  [[ -f "$SELF_DIR/$f" ]] || die "Canonical file missing from source: $f"
done
for d in "${FOUNDATION_DIRS[@]}"; do
  [[ -d "$SELF_DIR/$d" ]] || die "Foundation directory missing from source: $d"
done
( cd "$SELF_DIR" && sha256sum -c SHA256SUMS.txt ) \
  || die "Canonical core integrity check failed (input)."

# ── 2. install core ────────────────────────────────────────────────────────
mkdir -p "$TARGET"
for f in "${CANONICAL_FILES[@]}"; do
  cp -p "$SELF_DIR/$f" "$TARGET/$f"
done
for d in "${FOUNDATION_DIRS[@]}"; do
  # Merge into any existing directory (idempotent upgrade). `cp -R src dst`
  # would nest `dst/src` when `dst` already exists; copying the *contents*
  # (`src/.` -> `dst/`) updates in place instead.
  mkdir -p "$TARGET/$d"
  cp -R "$SELF_DIR/$d/." "$TARGET/$d/"
done
info "ARAYA core installed to: $TARGET"

# ── 3. optional adapters ───────────────────────────────────────────────────
for adapter in "${ADAPTERS[@]}"; do
  case "$adapter" in
    pi)
      # Project-scoped: only touches <target>/.pi/, never ~/.pi.
      [[ -f "$SELF_DIR/adapters/pi/prompts/araya.md" ]] \
        || die "Pi adapter source missing: adapters/pi/prompts/araya.md"
      mkdir -p "$TARGET/.pi/prompts"
      cp -p "$SELF_DIR/adapters/pi/prompts/araya.md" "$TARGET/.pi/prompts/araya.md"
      info "Pi adapter installed (project-scoped): $TARGET/.pi/prompts/araya.md"
      info "  -> /araya is available when Pi runs in: $TARGET"
      info "  -> global Pi (~/.pi) was NOT modified."
      ;;
    chatgpt)
      ( cd "$SELF_DIR" && bash bundle/chatgpt/build.sh )
      ;;
  esac
done

# ── 4. verify installation ─────────────────────────────────────────────────
info "ARAYA installer: verifying installation..."
for f in "${CANONICAL_FILES[@]}"; do
  [[ -f "$TARGET/$f" ]] || die "Canonical file missing after install: $f"
done
[[ -f "$TARGET/cli/araya" ]] || die "Capability foundation CLI missing after install: $TARGET/cli/araya"
( cd "$TARGET" && sha256sum -c SHA256SUMS.txt ) \
  || die "Canonical core integrity check failed (installed)."

# ── 5. report exact result ─────────────────────────────────────────────────
info "ARAYA installer result: PASS"
info "CORE=$TARGET"
if [[ ${#ADAPTERS[@]} -gt 0 ]]; then
  info "ADAPTERS=${ADAPTERS[*]}"
else
  info "ADAPTERS=none (default: no Pi takeover)"
fi
