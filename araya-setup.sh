#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ARAYA Setup — Backward-compatible wrapper
#
# This is the legacy entry point preserved for compatibility with existing
# documentation and automation. It delegates to install.sh.
#
# Canonical public installer: install.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$SCRIPT_DIR/install.sh" "$@"
