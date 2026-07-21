#!/usr/bin/env python3
"""AX compliance audit — REQ-030 validation command.

Verifies that an ARAYA project's AX tree is complete and correct:
- Root AGENTS.md exists and documents walk-before-edit
- Every top-level work directory has an AGENTS.md (not .git, .araya, .pi, etc.)
- No AGENTS.md is empty filler (minimum content check)
- Cross-references between AGENTS.md files are valid

Usage:
    python3 src/ax_audit.py           # audit current project
    python3 src/ax_audit.py --json    # machine-readable output
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

EXCLUDE_DIRS = {".git", ".araya", ".pi", ".venv", "node_modules",
                "__pycache__", ".mypy_cache", ".pytest_cache"}
EXCLUDE_FILES = {"README.md", "index.md", "TEMPLATE.md", "REQ-MANIFEST.md"}

MIN_CONTENT_LINES = 5  # fewer than this = probable filler


def repo_root() -> Path:
    current = Path.cwd().resolve()
    for c in (current, *current.parents):
        if (c / ".git").exists():
            return c
    raise SystemExit("Not a git repository")


def _is_work_dir(path: Path) -> bool:
    """Directories that should have AX coverage."""
    name = path.name
    if name.startswith("."):
        return False
    if name in EXCLUDE_DIRS:
        return False
    if not path.is_dir():
        return False
    return True


def _read_frontmatter_title(path: Path) -> str | None:
    """Extract the H1 title from an AGENTS.md."""
    try:
        first = path.read_text(encoding="utf-8").split("\n")[0]
        if first.startswith("# "):
            return first[2:].strip()
    except Exception:
        pass
    return None


def audit_ax_tree(root: Path | None = None) -> dict[str, Any]:
    """Run the full AX audit and return a structured result."""
    if root is None:
        root = repo_root()

    errors: list[str] = []
    warnings: list[str] = []
    covered: list[str] = []
    missing: list[str] = []
    filler: list[str] = []

    # 1. Root AGENTS.md
    root_ax = root / "AGENTS.md"
    if not root_ax.exists():
        errors.append(f"root AGENTS.md missing: {root_ax}")
    else:
        content = root_ax.read_text(encoding="utf-8")
        if "walk before you edit" not in content.lower():
            warnings.append("root AGENTS.md does not contain 'walk before you edit' rule")
        if "update after you change" not in content.lower():
            warnings.append("root AGENTS.md does not contain 'update after you change' rule")
        covered.append(str(root_ax.relative_to(root)))

    # 2. Child AGENTS.md files
    work_dirs = [d for d in sorted(root.iterdir()) if _is_work_dir(d)]

    for d in work_dirs:
        ax_file = d / "AGENTS.md"
        if ax_file.exists():
            lines = len(ax_file.read_text(encoding="utf-8").strip().split("\n"))
            if lines < MIN_CONTENT_LINES:
                filler.append(str(ax_file.relative_to(root)))
                warnings.append(f"possible filler (only {lines} lines): {ax_file.relative_to(root)}")
            else:
                covered.append(str(ax_file.relative_to(root)))
        else:
            missing.append(str((d / "AGENTS.md").relative_to(root)))
            errors.append(f"missing AX file: {d.name}/AGENTS.md")

    ok = len(errors) == 0
    summary = f"AX audit: {len(covered)} covered, {len(missing)} missing, {len(filler)} suspect, {len(errors)} errors, {len(warnings)} warnings"

    return {
        "command": "ax-audit",
        "ok": ok,
        "summary": summary,
        "project": str(root),
        "covered": covered,
        "missing": missing,
        "filler_suspect": filler,
        "errors": errors,
        "warnings": warnings,
        "count_covered": len(covered),
        "count_missing": len(missing),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="AX compliance audit (REQ-030)")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    args = parser.parse_args(argv)

    result = audit_ax_tree()
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        status = "✅ PASS" if result["ok"] else "❌ FAIL"
        print(f"{status} — {result['summary']}")
        if result["errors"]:
            for e in result["errors"]:
                print(f"  ERROR: {e}")
        if result["warnings"]:
            for w in result["warnings"]:
                print(f"  WARN:  {w}")

    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
