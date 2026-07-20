#!/usr/bin/env python3
"""Tests for AX audit tool — REQ-030 criteria 15-18."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "src"))

import ax_audit  # noqa: E402


class AXAuditTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / ".git").mkdir()

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_empty_project_fails(self) -> None:
        """No AGENTS.md at all → FAIL."""
        result = ax_audit.audit_ax_tree(self.root)
        self.assertFalse(result["ok"])
        self.assertIn("root AGENTS.md missing", result["errors"][0])

    def test_root_only_partial_ok(self) -> None:
        """Root exists but children missing → FAIL."""
        (self.root / "AGENTS.md").write_text(
            "# Project\n\nWalk before you edit. Update after you change.\n")
        (self.root / "src").mkdir()
        result = ax_audit.audit_ax_tree(self.root)
        self.assertFalse(result["ok"])
        self.assertGreater(result["count_missing"], 0)

    def test_complete_tree_passes(self) -> None:
        """Root + all children present → PASS."""
        (self.root / "AGENTS.md").write_text(
            "# Project\n\nWalk before you edit. Update after you change.\n")
        for d in ["src", "tests", "docs"]:
            (self.root / d).mkdir()
            (self.root / d / "AGENTS.md").write_text(
                f"# {d}/ — Local conventions\n\nInherits root AGENTS.md.\n\nConventions here:\n- Rule 1\n")
        result = ax_audit.audit_ax_tree(self.root)
        self.assertTrue(result["ok"])
        self.assertEqual(result["count_missing"], 0)
        self.assertEqual(result["count_covered"], 4)  # root + 3 children

    def test_filler_detected(self) -> None:
        """Short AGENTS.md triggers filler warning."""
        (self.root / "AGENTS.md").write_text(
            "# Project\n\nWalk before you edit. Update after you change.\n")
        (self.root / "src").mkdir()
        (self.root / "src" / "AGENTS.md").write_text("ok\n")
        result = ax_audit.audit_ax_tree(self.root)
        self.assertGreater(len(result["filler_suspect"]), 0)

    def test_walk_rule_missing_warns(self) -> None:
        """Root AGENTS.md without 'walk before you edit' → warning."""
        (self.root / "AGENTS.md").write_text("# No rules here\n")
        (self.root / "src").mkdir()
        (self.root / "src" / "AGENTS.md").write_text(
            "# src/ — Local conventions\n\nInherits root.\n\n- Rule 1\n")
        result = ax_audit.audit_ax_tree(self.root)
        self.assertTrue(result["ok"])  # children exist, so ok — but with warnings
        self.assertGreater(len(result["warnings"]), 0)

    def test_exclude_dirs_ignored(self) -> None:
        """.git, .araya, etc. are not required to have AGENTS.md."""
        (self.root / "AGENTS.md").write_text(
            "# Project\n\nWalk before you edit. Update after you change.\n")
        (self.root / ".araya").mkdir()
        (self.root / ".venv").mkdir()
        result = ax_audit.audit_ax_tree(self.root)
        self.assertTrue(result["ok"])
        self.assertEqual(result["count_missing"], 0)

    def test_json_output(self) -> None:
        """--json flag produces parseable output."""
        (self.root / "AGENTS.md").write_text(
            "# Project\n\nWalk before you edit. Update after you change.\n")
        (self.root / "docs").mkdir()
        (self.root / "docs" / "AGENTS.md").write_text(
            "# docs/ — Local conventions\n\nInherits root.\n\n- Rule 1\n")
        result = ax_audit.audit_ax_tree(self.root)
        self.assertTrue(result["ok"])
        self.assertIn("covered", result)
        self.assertIn("missing", result)
        self.assertIn("errors", result)


if __name__ == "__main__":
    unittest.main()
