#!/usr/bin/env bash
set -Eeuo pipefail

# build.sh — reproducible packaging of the ARAYA AX3 v0.6.0 ChatGPT bundle.
#
#   verify canonical core -> assemble knowledge + instructions -> manifest
#   -> zip -> validate produced bundle.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIST="$REPO_ROOT/bundle/chatgpt/dist"
NAME="ARAYA-AX3-v0.6.0-chatgpt"
PKG="$DIST/$NAME"
ZIP="$DIST/$NAME.zip"

for cmd in sha256sum cp mkdir rm zip unzip cmp find sort sed wc mktemp; do
  command -v "$cmd" >/dev/null 2>&1 || {
    printf 'ERROR: required command not found: %s\n' "$cmd" >&2
    exit 1
  }
done

# 1. Verify the canonical core is intact before packaging.
( cd "$REPO_ROOT" && sha256sum -c SHA256SUMS.txt )

# 1b. Verify the README matches the product before packaging (stale-README gate).
( cd "$REPO_ROOT" && bash tests/test-readme-contract.sh )

# 2. Assemble the package.
rm -rf "$PKG"
mkdir -p "$PKG/knowledge"

for f in "$REPO_ROOT"/K*.md; do
  cp -p "$f" "$PKG/knowledge/$(basename "$f")"
done

cp -p "$REPO_ROOT/GPT-CONFIGURATION.md" "$PKG/instructions.md"

cat > "$PKG/gpt-manifest.json" <<'EOF'
{
  "name": "ARAYA AX3 v0.6.0",
  "description": "AI Engineer operating model: Repository Truth first, authority/stages/ADR-driven delivery governance (AX3 v0.6.0).",
  "instructions": "instructions.md",
  "knowledge": "knowledge/"
}
EOF

# 3. Internal manifest covering all files except itself.
(
  cd "$PKG"
  find . -type f ! -name MANIFEST.sha256 | LC_ALL=C sort \
    | sed 's|^\./||' | while read -r rel; do
        sha256sum "$rel"
      done > MANIFEST.sha256
)

# 4. Zip.
mkdir -p "$DIST"
rm -f "$ZIP"
( cd "$DIST" && zip -qr "$NAME.zip" "$NAME" )

# 5. Validate the produced bundle.
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -q "$ZIP" -d "$TMP"
VERIFY_ROOT="$TMP/$NAME"
( cd "$VERIFY_ROOT" && sha256sum -c MANIFEST.sha256 )

KCOUNT="$(find "$VERIFY_ROOT/knowledge" -type f -name 'K*.md' | wc -l | tr -d ' ')"
[[ "$KCOUNT" -eq 10 ]] || {
  printf 'ERROR: expected 10 knowledge files, got %s\n' "$KCOUNT" >&2
  exit 1
}

cmp -s "$VERIFY_ROOT/instructions.md" "$REPO_ROOT/GPT-CONFIGURATION.md" || {
  printf 'ERROR: instructions.md does not match GPT-CONFIGURATION.md\n' >&2
  exit 1
}

printf 'ARAYA ChatGPT bundle result: PASS\n'
printf 'BUNDLE=%s\n' "$ZIP"
printf 'SHA256=%s\n' "$(sha256sum "$ZIP" | awk '{print $1}')"
printf 'KNOWLEDGE_FILES=%s\n' "$KCOUNT"
printf 'INSTRUCTIONS_MATCH=PASS\n'
