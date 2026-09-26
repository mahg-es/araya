#!/usr/bin/env bash
# ARAYA S3b — portable bundle builder (REQ-050 / ADR-0020 / K05).
#
# Produces a self-contained, portable ARAYA bundle ZIP with an embedded copy of
# the canonical installer (fresh-machine bootstrap) and a MANIFEST.sha256 for
# contained-file integrity. The external EXPECTED_SHA256 is computed AFTER the
# ZIP is produced (external trust anchor), never embedded as self-attestation.
#
# Usage:
#   ops/make-bundle.sh <bundle-id> <payload-dir> <installer-path> <output-zip>
set -Eeuo pipefail

BUNDLE_ID="${1:?bundle-id required}"
PAYLOAD_DIR="${2:?payload-dir required}"
INSTALLER="${3:?installer-path required}"
OUT_ZIP="${4:?output-zip required}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# ARAYA-BUNDLE.env
cat > "$WORK/ARAYA-BUNDLE.env" <<EOF
FORMAT=ARAYA_BUNDLE
FORMAT_VERSION=1.0.0
BUNDLE_ID=$BUNDLE_ID
ENTRYPOINT=APPLY.sh
EOF

# Payload (governed files to apply)
mkdir -p "$WORK/payload"
if [ -d "$PAYLOAD_DIR" ]; then
  cp -R "$PAYLOAD_DIR"/. "$WORK/payload/"
fi

# Embedded canonical installer (fresh-machine bootstrap)
mkdir -p "$WORK/bootstrap"
cp "$INSTALLER" "$WORK/bootstrap/araya-install.sh"

# README.md (bootstrap + install instructions; no producer-local paths)
cat > "$WORK/README.md" <<EOF
# ARAYA Bundle — $BUNDLE_ID

## Fresh-machine bootstrap (when \$HOME/bin/araya-install.sh is MISSING)
1. Verify the bundle ZIP SHA-256 matches the externally supplied EXPECTED_SHA256.
2. Extract the bundle.
3. Verify MANIFEST.sha256 (contained-file integrity).
4. Materialize the canonical installer:
   cp bootstrap/araya-install.sh "\$HOME/bin/araya-install.sh"
   chmod +x "\$HOME/bin/araya-install.sh"
5. Run the canonical command:
   clear && cd "<REPOSITORY_ROOT>" && bash "\$HOME/bin/araya-install.sh" "<BUNDLE_ZIP>" "<EXPECTED_SHA256>"

## Existing machine (\$HOME/bin/araya-install.sh PRESENT)
PRESENT → REUSE. Do not overwrite an existing installer.
EOF

# APPLY.sh — the governed operation payload entrypoint
cat > "$WORK/APPLY.sh" <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
# Governed operation entrypoint. Populate per bundle intent.
echo "APPLY: bundle applied (entrypoint)"
EOF
chmod +x "$WORK/APPLY.sh"

# MANIFEST.sha256 (covers governed files except itself)
(
  cd "$WORK"
  find . -type f ! -name 'MANIFEST.sha256' -print0 | sort -z | xargs -0 sha256sum > MANIFEST.sha256
)

# Build the ZIP
(
  cd "$WORK"
  zip -qr "$OUT_ZIP" .
)

# External trust anchor: compute the SHA-256 AFTER the ZIP is sealed
sha256sum "$OUT_ZIP"
