#!/usr/bin/env bash
set -Eeuo pipefail

PROGRAM="araya-install.sh"
SUPPORTED_FORMAT="ARAYA_BUNDLE"
SUPPORTED_FORMAT_VERSION="1.0.0"

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

info() {
  printf '%s\n' "$*"
}

usage() {
  cat <<'EOF'
Usage:
  araya-install.sh <bundle.zip> <expected-sha256>

Example:
  bash ~/bin/araya-install.sh "$HOME/Downloads/BUNDLE.zip" "<sha256>"

Behavior:
  - validates the ZIP SHA-256 before extraction
  - extracts to temporary storage
  - validates ARAYA-BUNDLE.env
  - validates MANIFEST.sha256
  - validates APPLY.sh syntax
  - discovers the actual Git repository root from the current directory
  - executes APPLY.sh from that repository root
  - cleans temporary extraction on success or failure

The installer does not push, merge, alter PR state, or infer publication authority.
Those effects may only occur if an individual governed bundle explicitly and validly
contains such an authorized operation.
EOF
}

[[ $# -eq 2 ]] || { usage >&2; exit 64; }

BUNDLE_ZIP="$1"
EXPECTED_SHA256="$2"

[[ -f "$BUNDLE_ZIP" ]] || die "Bundle not found: $BUNDLE_ZIP"
[[ "$EXPECTED_SHA256" =~ ^[0-9a-fA-F]{64}$ ]] || die "Expected SHA-256 must contain exactly 64 hexadecimal characters."

for cmd in bash git sha256sum mktemp unzip find awk sed; do
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
done

# Runtime validation.
# Canonical ARAYA bundles were originally designed for Git Bash/MSYS.
# This installer also accepts native Linux Bash because the same POSIX shell,
# hashing, unzip and Git invariants can be proven directly there.
case "$(uname -s 2>/dev/null || true)" in
  MINGW*|MSYS*)
    RUNTIME_KIND="git-bash-msys"
    ;;
  Linux*)
    RUNTIME_KIND="linux-bash"
    ;;
  *)
    die "Unsupported shell/runtime. Use Git Bash/MSYS or native Linux Bash."
    ;;
esac

ACTUAL_SHA256="$(sha256sum "$BUNDLE_ZIP" | awk '{print $1}')"
EXPECTED_SHA256="$(printf '%s' "$EXPECTED_SHA256" | tr 'A-F' 'a-f')"

[[ "$ACTUAL_SHA256" == "$EXPECTED_SHA256" ]] || {
  die "External SHA-256 mismatch.
Expected: $EXPECTED_SHA256
Actual:   $ACTUAL_SHA256"
}

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/araya-install.XXXXXXXX")"
cleanup() {
  rm -rf "$TMP_ROOT"
}
trap cleanup EXIT INT TERM

unzip -q "$BUNDLE_ZIP" -d "$TMP_ROOT"

# Accept either files directly at ZIP root or one wrapping directory.
if [[ -f "$TMP_ROOT/ARAYA-BUNDLE.env" ]]; then
  BUNDLE_ROOT="$TMP_ROOT"
else
  mapfile -t ENV_FILES < <(find "$TMP_ROOT" -mindepth 2 -maxdepth 2 -type f -name 'ARAYA-BUNDLE.env' -print)
  [[ ${#ENV_FILES[@]} -eq 1 ]] || die "Expected exactly one ARAYA-BUNDLE.env at ZIP root or one top-level bundle directory."
  BUNDLE_ROOT="$(dirname "${ENV_FILES[0]}")"
fi

for required in ARAYA-BUNDLE.env MANIFEST.sha256 APPLY.sh; do
  [[ -f "$BUNDLE_ROOT/$required" ]] || die "Required bundle file missing: $required"
done

# Reject unsafe paths in the extracted bundle.
while IFS= read -r rel; do
  [[ "$rel" != /* ]] || die "Unsafe absolute path in bundle: $rel"
  [[ ! "$rel" =~ ^[A-Za-z]: ]] || die "Unsafe Windows drive path in bundle: $rel"
  case "/$rel/" in
    */../*) die "Unsafe parent traversal path in bundle: $rel" ;;
  esac
done < <(cd "$BUNDLE_ROOT" && find . -mindepth 1 -printf '%P\n')

# Parse bundle metadata without executing it.
FORMAT=""
FORMAT_VERSION=""
BUNDLE_ID=""
ENTRYPOINT=""
TARGET_MODE=""
while IFS='=' read -r key value; do
  case "$key" in
    FORMAT) FORMAT="$value" ;;
    FORMAT_VERSION) FORMAT_VERSION="$value" ;;
    BUNDLE_ID) BUNDLE_ID="$value" ;;
    ENTRYPOINT) ENTRYPOINT="$value" ;;
    TARGET_MODE) TARGET_MODE="$value" ;;
  esac
done < "$BUNDLE_ROOT/ARAYA-BUNDLE.env"

[[ "$FORMAT" == "$SUPPORTED_FORMAT" ]] || die "Unsupported FORMAT: $FORMAT"
[[ "$FORMAT_VERSION" == "$SUPPORTED_FORMAT_VERSION" ]] || die "Unsupported FORMAT_VERSION: $FORMAT_VERSION"
[[ -n "$BUNDLE_ID" ]] || die "BUNDLE_ID is missing."
[[ "$ENTRYPOINT" == "APPLY.sh" ]] || die "Unsupported ENTRYPOINT: $ENTRYPOINT"

case "$TARGET_MODE" in
  "")
    [[ -n "$REPO_ROOT" ]] || die "Current directory is not inside a Git repository. cd into the target repository first."
    EXEC_ROOT="$REPO_ROOT"
    ;;
  BOOTSTRAP)
    [[ -z "$REPO_ROOT" ]] || die "TARGET_MODE=BOOTSTRAP must be run outside an existing Git repository."
    EXEC_ROOT="$PWD"
    ;;
  *)
    die "Unsupported TARGET_MODE: $TARGET_MODE"
    ;;
esac

# MANIFEST must not contain unsafe paths and must cover all governed files
# except MANIFEST.sha256 itself.
while read -r hash rel; do
  [[ "$hash" =~ ^[0-9a-fA-F]{64}$ ]] || die "Malformed MANIFEST.sha256 entry: $hash $rel"
  [[ -n "$rel" ]] || die "Empty path in MANIFEST.sha256"
  [[ "$rel" != /* ]] || die "Unsafe absolute manifest path: $rel"
  [[ ! "$rel" =~ ^[A-Za-z]: ]] || die "Unsafe drive manifest path: $rel"
  case "/$rel/" in
    */../*) die "Unsafe parent traversal in manifest: $rel" ;;
  esac
  [[ -f "$BUNDLE_ROOT/$rel" ]] || die "Manifest references missing file: $rel"
done < "$BUNDLE_ROOT/MANIFEST.sha256"

(
  cd "$BUNDLE_ROOT"
  sha256sum -c MANIFEST.sha256
) || die "Internal manifest verification failed."

mapfile -t ACTUAL_FILES < <(
  cd "$BUNDLE_ROOT"
  find . -type f ! -name MANIFEST.sha256 -printf '%P\n' | LC_ALL=C sort
)
mapfile -t MANIFEST_FILES < <(
  awk '{ $1=""; sub(/^  ?/, ""); print }' "$BUNDLE_ROOT/MANIFEST.sha256" | LC_ALL=C sort
)

[[ "${ACTUAL_FILES[*]}" == "${MANIFEST_FILES[*]}" ]] || {
  printf 'Actual governed files:\n' >&2
  printf '  %s\n' "${ACTUAL_FILES[@]}" >&2
  printf 'Manifest governed files:\n' >&2
  printf '  %s\n' "${MANIFEST_FILES[@]}" >&2
  die "Bundle contains undeclared or missing governed files."
}

bash -n "$BUNDLE_ROOT/APPLY.sh" || die "APPLY.sh shell syntax validation failed."

info "ARAYA installer preflight: PASS"
info "Runtime: $RUNTIME_KIND"
info "Bundle: $BUNDLE_ID"
info "External SHA-256: PASS"
info "Internal manifest: PASS"
info "Entrypoint syntax: PASS"
info "Repository root: ${REPO_ROOT:-BOOTSTRAP-NONE}"
info "Execution root: $EXEC_ROOT"
info "Executing governed bundle..."

if (
  cd "$EXEC_ROOT"
  bash "$BUNDLE_ROOT/APPLY.sh"
); then
  info "ARAYA installer result: PASS"
else
  RC=$?
  die "Bundle entrypoint failed with exit code $RC"
fi
