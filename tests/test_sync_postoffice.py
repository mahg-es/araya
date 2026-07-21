#!/usr/bin/env python3
"""Dry tests for sync_postoffice() — REQ-035 repair.

Simulates the exact scenarios that lost data tonight against a real
local git repository with a real origin, proving the stash-based fix
preserves local postoffice state across syncs.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "src"))

import postoffice_loop  # noqa: E402


class SyncPostOfficeTests(unittest.TestCase):
    """Each test creates a fresh origin + clone, simulating the two-worktree
    scenario that caused sync_postoffice to clobber local state."""

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)

        # Bare origin repo
        self.origin = base / "origin.git"
        self.origin.mkdir()
        subprocess.run(["git", "init", "--bare", str(self.origin)], check=True, capture_output=True)

        # Clone → working copy (empty repo — create main branch manually)
        self.work = base / "work"
        subprocess.run(["git", "clone", str(self.origin), str(self.work)], check=True, capture_output=True)
        subprocess.run(["git", "checkout", "-b", "main"], cwd=self.work, check=True, capture_output=True)

        # Set up postoffice directories
        po = self.work / ".araya" / "postoffice"
        for d in ("inbox", "outbox", "archive"):
            (po / d).mkdir(parents=True)
        (po / "thread.md").write_text("thread\n")
        (po / "index.jsonl").write_text("")
        (po / ".seq_counter").write_text("0\n")

        subprocess.run(["git", "add", ".araya/"], cwd=self.work, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "init"], cwd=self.work, check=True, capture_output=True)
        subprocess.run(["git", "push", "-u", "origin", "main"], cwd=self.work, check=True, capture_output=True)

        # Monkeypatch repo_root to point at our work tree
        self._orig_repo_root = postoffice_loop.repo_root
        postoffice_loop.repo_root = lambda: self.work

    def tearDown(self) -> None:
        postoffice_loop.repo_root = self._orig_repo_root
        self.tmp.cleanup()

    def _push_from_work(self):
        subprocess.run(["git", "add", ".araya/"], cwd=self.work, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "state", "--allow-empty"], cwd=self.work, check=True, capture_output=True)
        subprocess.run(["git", "push"], cwd=self.work, check=True, capture_output=True)

    def _make_remote_change(self):
        """Simulate another worktree pushing a change: clone, create postoffice dirs, modify, push."""
        remote = Path(self.tmp.name) / "remote"
        subprocess.run(["git", "clone", str(self.origin), str(remote)], check=True, capture_output=True)
        subprocess.run(["git", "checkout", "main"], cwd=remote, check=True, capture_output=True)
        po = remote / ".araya" / "postoffice"
        for d in ("inbox", "outbox", "archive"):
            (po / d).mkdir(parents=True, exist_ok=True)
        return remote

    def _push_remote(self, remote: Path):
        """Commit and push from a remote clone."""
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "remote", "--allow-empty"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "HEAD:main"], cwd=remote, check=True, capture_output=True)

    def _write_outbox_msg(self, work: Path, msg_id: str, status: str = "new", body: str = "test"):
        msg = work / ".araya" / "postoffice" / "outbox" / f"{msg_id}.md"
        content = f"""---
id: "{msg_id}"
seq: 1
created_at: "2026-07-20T00:00:00Z"
from: "Daneel"
to: "Giskard"
subject: "test"
status: "{status}"
claimed_by: null
claimed_at: null
direction: "outbound"
related_branch: null
related_pr: null
body_sha256: null
model: "test"
model_source: "test"
---
{body}
"""
        msg.write_text(content)


class BasicSyncTests(SyncPostOfficeTests):
    """Core scenarios that must work."""

    def test_no_local_changes_sync_clean(self):
        """No local changes → sync brings in remote additions, no crash."""
        # Remote adds a message
        remote = self._make_remote_change()
        self._write_outbox_msg(remote, "MSG-remote001", status="new")
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "remote msg"], cwd=remote, check=True, capture_output=True)
        self._push_remote(remote)

        # Local sync
        result = postoffice_loop.sync_postoffice(self.work)
        self.assertTrue(result, "sync should succeed with no local changes")

        # Remote message should now exist locally
        local_msg = self.work / ".araya" / "postoffice" / "outbox" / "MSG-remote001.md"
        self.assertTrue(local_msg.exists(), "remote message should appear locally")

    def test_local_new_message_survives_sync(self):
        """Post a message locally, sync → local message survives."""
        self._write_outbox_msg(self.work, "MSG-local001", status="new")
        self._push_from_work()

        # Now remote adds a different message
        remote = self._make_remote_change()
        self._write_outbox_msg(remote, "MSG-remote001", status="new")
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "remote msg"], cwd=remote, check=True, capture_output=True)
        self._push_remote(remote)

        # Sync locally
        result = postoffice_loop.sync_postoffice(self.work)
        self.assertTrue(result, "sync should succeed")

        # BOTH messages should exist
        self.assertTrue((self.work / ".araya" / "postoffice" / "outbox" / "MSG-local001.md").exists(),
                        "local message should survive sync")
        self.assertTrue((self.work / ".araya" / "postoffice" / "outbox" / "MSG-remote001.md").exists(),
                        "remote message should appear")

    def test_local_uncommitted_message_survives_sync(self):
        """EXACT SCENARIO that lost my audit reports: post a message,
        DO NOT commit, then sync → message MUST survive."""
        self._write_outbox_msg(self.work, "MSG-uncommitted", status="new")
        # DO NOT commit or push — this is the exact scenario

        # Remote adds a message
        remote = self._make_remote_change()
        self._write_outbox_msg(remote, "MSG-remote", status="new")
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "remote"], cwd=remote, check=True, capture_output=True)
        self._push_remote(remote)

        # Sync — this is where the OLD code would clobber the uncommitted message
        result = postoffice_loop.sync_postoffice(self.work)
        self.assertTrue(result, "sync should succeed even with uncommitted local changes")

        local_msg = self.work / ".araya" / "postoffice" / "outbox" / "MSG-uncommitted.md"
        self.assertTrue(local_msg.exists(),
                        "CRITICAL: uncommitted local message was clobbered by sync!")

    def test_mark_replied_survives_sync(self):
        """Mark a message replied locally, sync → replied status survives."""
        # Create a message that exists in origin with status=new
        self._write_outbox_msg(self.work, "MSG-001", status="new")
        self._push_from_work()

        # Remote marks it replied... no wait, LOCAL marks it replied
        # and doesn't commit yet — the sync shouldn't revert it

        # Local: mark as replied (simulate mark-replied)
        msg_path = self.work / ".araya" / "postoffice" / "outbox" / "MSG-001.md"
        content = msg_path.read_text().replace('status: "new"', 'status: "replied"')
        msg_path.write_text(content)

        # Remote adds a new message (unrelated)
        remote = self._make_remote_change()
        self._write_outbox_msg(remote, "MSG-remote", status="new")
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "remote"], cwd=remote, check=True, capture_output=True)
        self._push_remote(remote)

        # Sync
        result = postoffice_loop.sync_postoffice(self.work)
        self.assertTrue(result, "sync should succeed")

        # Verify the replied status was preserved
        synced = msg_path.read_text()
        self.assertIn('status: "replied"', synced,
                      "CRITICAL: mark-replied was reverted by sync!")

    def test_multiple_local_ops_survive_sync(self):
        """Post message + mark-replied old message → both survive sync."""
        # Message 1: exists in origin as new
        self._write_outbox_msg(self.work, "MSG-001", status="new")
        self._push_from_work()

        # Local: mark MSG-001 as replied AND create a new uncommitted message
        msg1 = self.work / ".araya" / "postoffice" / "outbox" / "MSG-001.md"
        msg1.write_text(msg1.read_text().replace('status: "new"', 'status: "replied"'))
        self._write_outbox_msg(self.work, "MSG-002", status="new")  # uncommitted

        # Remote adds a message
        remote = self._make_remote_change()
        self._write_outbox_msg(remote, "MSG-remote", status="new")
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "remote"], cwd=remote, check=True, capture_output=True)
        self._push_remote(remote)

        # Sync
        result = postoffice_loop.sync_postoffice(self.work)
        self.assertTrue(result, "sync should succeed with multiple local changes")

        # Verify all 3 messages present and correct
        self.assertIn('status: "replied"', msg1.read_text(), "MSG-001 should stay replied")
        self.assertTrue((self.work / ".araya" / "postoffice" / "outbox" / "MSG-002.md").exists(),
                        "MSG-002 (uncommitted) should survive")
        self.assertTrue((self.work / ".araya" / "postoffice" / "outbox" / "MSG-remote.md").exists(),
                        "MSG-remote should appear")


class ConflictTests(SyncPostOfficeTests):
    """Edge cases where both local and remote modify the same file."""

    def test_same_file_conflict_detected(self):
        """Both local and remote modify the SAME message → sync fails cleanly."""
        self._write_outbox_msg(self.work, "MSG-001", status="new")
        self._push_from_work()

        # Remote changes MSG-001
        remote = self._make_remote_change()
        msg_r = remote / ".araya" / "postoffice" / "outbox" / "MSG-001.md"
        msg_r.write_text(msg_r.read_text().replace('status: "new"', 'status: "archived"'))
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "remote archive"], cwd=remote, check=True, capture_output=True)
        self._push_remote(remote)

        # Local also changes MSG-001 (different change)
        msg_l = self.work / ".araya" / "postoffice" / "outbox" / "MSG-001.md"
        msg_l.write_text(msg_l.read_text().replace('status: "new"', 'status: "replied"'))

        # Sync should detect conflict and fail cleanly
        result = postoffice_loop.sync_postoffice(self.work)
        # Conflict → stash pop fails → sync returns False
        # But local state should be preserved
        self.assertFalse(result, "sync with conflict should return False (not crash)")

        # Local version should still be locally modified (not reverted)
        self.assertIn('status: "replied"', msg_l.read_text(),
                      "CRITICAL: local change lost on conflict")


class RealWorldScenarioTests(SyncPostOfficeTests):
    """Tests mirroring tonight's exact failures."""

    def test_audit_report_scenario(self):
        """The exact scenario that lost my audit reports to mahg-pms:
        1. Post 4 messages to outbox
        2. Run sync (old code: git checkout overwrites them)
        3. New fix: all 4 survive
        """
        for i in range(1, 5):
            self._write_outbox_msg(self.work, f"MSG-audit{i:03d}", status="new",
                                   body=f"Audit report {i}")

        # Remote added something in the meantime
        remote = self._make_remote_change()
        self._write_outbox_msg(remote, "MSG-giskard", status="new")
        subprocess.run(["git", "add", ".araya/"], cwd=remote, check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "giskard"], cwd=remote, check=True, capture_output=True)
        self._push_remote(remote)

        # Sync
        result = postoffice_loop.sync_postoffice(self.work)
        self.assertTrue(result, "sync should succeed")

        # All 4 audit messages must exist
        for i in range(1, 5):
            msg = self.work / ".araya" / "postoffice" / "outbox" / f"MSG-audit{i:03d}.md"
            self.assertTrue(msg.exists(),
                            f"CRITICAL: MSG-audit{i:03d} lost — same bug as tonight!")

        # Remote message also appeared
        self.assertTrue((self.work / ".araya" / "postoffice" / "outbox" / "MSG-giskard.md").exists())

    def test_rapid_read_write_cycle(self):
        """Simulate the rapid read→write→read cycle that lost mark-replied."""
        # Pre-existing message
        self._write_outbox_msg(self.work, "MSG-001", status="new")
        self._push_from_work()

        for cycle in range(3):
            # Read phase: pending triggers sync
            result = postoffice_loop.sync_postoffice(self.work)
            self.assertTrue(result, f"sync failed on cycle {cycle}")

            # Write phase: mark as replied (simulate the agent marking msgs)
            msg = self.work / ".araya" / "postoffice" / "outbox" / "MSG-001.md"
            current = msg.read_text()
            if 'status: "replied"' not in current:
                msg.write_text(current.replace('status: "new"', 'status: "replied"'))

        # After 3 cycles, replied status must still be there
        self.assertIn('status: "replied"', msg.read_text(),
                      "CRITICAL: replied status lost after rapid read/write cycles")


if __name__ == "__main__":
    unittest.main()
