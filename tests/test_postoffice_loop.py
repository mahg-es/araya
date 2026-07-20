#!/usr/bin/env python3
"""Focused regression tests for PostOffice message creation."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "src"))

import postoffice_loop  # noqa: E402


class CreateMessageDispositionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / ".git").mkdir()
        postoffice = self.root / ".araya" / "postoffice"
        for folder in ("inbox", "outbox", "archive"):
            (postoffice / folder).mkdir(parents=True, exist_ok=True)
        (postoffice / "thread.md").write_text("original-thread\n", encoding="utf-8")
        (postoffice / "index.jsonl").write_text("original-index\n", encoding="utf-8")
        self._original_repo_root = postoffice_loop.repo_root
        postoffice_loop.repo_root = lambda: self.root

    def tearDown(self) -> None:
        postoffice_loop.repo_root = self._original_repo_root
        self.tempdir.cleanup()

    def test_invalid_disposition_writes_no_artifacts(self) -> None:
        postoffice = self.root / ".araya" / "postoffice"

        with self.assertRaises(postoffice_loop.PostOfficeError) as exc:
            postoffice_loop.create_message(
                from_actor="Daneel",
                to="Giskard",
                subject="invalid disposition test",
                body="Body\n\nDisposition: NOPE.\n",
                model="test-model",
                model_source="tool-reported",
            )

        self.assertEqual(exc.exception.code, "ValidationFailure")
        self.assertEqual([], list((postoffice / "outbox").glob("MSG-*.md")))
        self.assertEqual([], list((postoffice / "inbox").glob("MSG-*.md")))
        self.assertEqual("original-index\n", (postoffice / "index.jsonl").read_text(encoding="utf-8"))
        self.assertEqual("original-thread\n", (postoffice / "thread.md").read_text(encoding="utf-8"))
        self.assertFalse((self.root / ".araya" / "ax" / "ledger" / "score.ndjson").exists())

    def test_valid_disposition_writes_message_and_ledger(self) -> None:
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        result = postoffice_loop.create_message(
            from_actor="Daneel",
            to="Giskard",
            subject="valid disposition test",
            body="Body\n\nDisposition: STOP.\n",
            model="test-model",
            model_source="tool-reported",
        )

        self.assertTrue(result["ok"])
        self.assertEqual(1, len(list((postoffice / "outbox").glob("MSG-*.md"))))
        self.assertIn(result["message_id"], (postoffice / "index.jsonl").read_text(encoding="utf-8"))
        self.assertIn(result["message_id"], (postoffice / "thread.md").read_text(encoding="utf-8"))

        ledger_path = self.root / ".araya" / "ax" / "ledger" / "score.ndjson"
        entries = [json.loads(line) for line in ledger_path.read_text(encoding="utf-8").splitlines()]
        self.assertEqual(1, len(entries))
        self.assertEqual("STOP", entries[0]["disposition"])
        self.assertEqual(result["message_id"], entries[0]["message_id"])


    def test_related_pr_structured_present(self) -> None:
        """(a) related_pr structured → ledger pr field uses it."""
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        postoffice_loop.create_message(
            from_actor="Daneel",
            to="Giskard",
            subject="related_pr structured test",
            body="Body with no PR: line\n\nDisposition: STOP.\n",
            model="test-model",
            model_source="tool-reported",
            related_pr="238",
        )

        ledger_path = self.root / ".araya" / "ax" / "ledger" / "score.ndjson"
        entries = [json.loads(line) for line in ledger_path.read_text(encoding="utf-8").splitlines()]
        self.assertEqual(1, len(entries))
        self.assertEqual(238, entries[0]["pr"])
        self.assertIn("PR #238", entries[0]["evidence_ref"])

    def test_related_pr_absent_body_fallback(self) -> None:
        """(b) related_pr absent + PR: line in body → fallback works."""
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        postoffice_loop.create_message(
            from_actor="Daneel",
            to="Giskard",
            subject="fallback test",
            body="PR: #239\n\nDisposition: STOP.\n",
            model="test-model",
            model_source="tool-reported",
            # related_pr intentionally NOT passed
        )

        ledger_path = self.root / ".araya" / "ax" / "ledger" / "score.ndjson"
        entries = [json.loads(line) for line in ledger_path.read_text(encoding="utf-8").splitlines()]
        self.assertEqual(1, len(entries))
        self.assertEqual(239, entries[0]["pr"])
        self.assertIn("PR #239", entries[0]["evidence_ref"])

    def test_related_pr_absent_no_body_line(self) -> None:
        """(c) neither structured nor body line → pr: null."""
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        postoffice_loop.create_message(
            from_actor="Daneel",
            to="Giskard",
            subject="no pr test",
            body="Body with no PR reference at all\n\nDisposition: STOP.\n",
            model="test-model",
            model_source="tool-reported",
        )

        ledger_path = self.root / ".araya" / "ax" / "ledger" / "score.ndjson"
        entries = [json.loads(line) for line in ledger_path.read_text(encoding="utf-8").splitlines()]
        self.assertEqual(1, len(entries))
        self.assertIsNone(entries[0]["pr"])
        # evidence_ref falls back to message_id when no PR/commit
        self.assertIn("message ", entries[0]["evidence_ref"])

    def test_repo_root_walks_up_to_git_directory_from_portable_locations(self) -> None:
        original_file = postoffice_loop.__file__
        try:
            deeper_tool = self.root / "tools" / "coordination" / "postoffice_loop.py"
            root_tool = self.root / "postoffice_loop.py"

            deeper_tool.parent.mkdir(parents=True)
            deeper_tool.write_text("", encoding="utf-8")
            root_tool.write_text("", encoding="utf-8")

            postoffice_loop.__file__ = str(deeper_tool)
            self.assertEqual(self.root, postoffice_loop.repo_root())

            postoffice_loop.__file__ = str(root_tool)
            self.assertEqual(self.root, postoffice_loop.repo_root())
        finally:
            postoffice_loop.__file__ = original_file

    def test_mark_claimed_records_claim_fields(self) -> None:
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        result = postoffice_loop.create_message(
            from_actor="Giskard",
            to="Daneel",
            subject="claim me",
            body="Body\n",
            model="test-model",
            model_source="tool-reported",
        )
        message_path = postoffice / "outbox" / f"{result['message_id']}.md"
        before_meta, before_body = postoffice_loop.read_frontmatter(message_path)

        claimed = postoffice_loop.cmd_mark_claimed(
            SimpleNamespace(message_id=result["message_id"], claimed_by="Daneel-Codex")
        )

        after_meta, after_body = postoffice_loop.read_frontmatter(message_path)
        self.assertTrue(claimed["ok"])
        self.assertEqual("claimed", after_meta["status"])
        self.assertEqual("Daneel-Codex", after_meta["claimed_by"])
        self.assertIsNotNone(after_meta["claimed_at"])
        self.assertEqual(before_meta["body_sha256"], after_meta["body_sha256"])
        self.assertEqual(before_body, after_body)
        pending = postoffice_loop.cmd_pending(SimpleNamespace(to="Daneel"))
        self.assertEqual([], pending["items"])

    def test_double_claim_rejected_with_already_claimed(self) -> None:
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        result = postoffice_loop.create_message(
            from_actor="Giskard",
            to="Daneel",
            subject="claim once",
            body="Body\n",
            model="test-model",
            model_source="tool-reported",
        )
        postoffice_loop.cmd_mark_claimed(SimpleNamespace(message_id=result["message_id"], claimed_by="Daneel-A"))

        with self.assertRaises(postoffice_loop.PostOfficeError) as exc:
            postoffice_loop.cmd_mark_claimed(SimpleNamespace(message_id=result["message_id"], claimed_by="Daneel-B"))

        self.assertEqual("AlreadyClaimed", exc.exception.code)

    def test_two_consecutive_posts_assign_monotonic_seq(self) -> None:
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        first = postoffice_loop.create_message(
            from_actor="Giskard",
            to="Daneel",
            subject="first",
            body="First\n",
            model="test-model",
            model_source="tool-reported",
        )
        second = postoffice_loop.create_message(
            from_actor="Giskard",
            to="Daneel",
            subject="second",
            body="Second\n",
            model="test-model",
            model_source="tool-reported",
        )

        self.assertEqual(1, first["seq"])
        self.assertEqual(2, second["seq"])
        self.assertEqual("2\n", (postoffice / ".seq_counter").read_text(encoding="utf-8"))
        self.assertIn("seq: 1\n", (postoffice / "outbox" / f"{first['message_id']}.md").read_text(encoding="utf-8"))
        pending = postoffice_loop.cmd_pending(SimpleNamespace(to="Daneel"))
        self.assertEqual([1, 2], [item["seq"] for item in pending["items"]])
        thread = (postoffice / "thread.md").read_text(encoding="utf-8")
        self.assertIn("## #1 ", thread)
        self.assertIn("## #2 ", thread)

    def test_pending_to_is_case_insensitive(self) -> None:
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        postoffice_loop.create_message(
            from_actor="Giskard",
            to="Daneel",
            subject="case check",
            body="Body\n",
            model="test-model",
            model_source="tool-reported",
        )

        for candidate in ("Daneel", "daneel", "DANEEL"):
            pending = postoffice_loop.cmd_pending(SimpleNamespace(to=candidate))
            self.assertEqual(1, len(pending["items"]), f"expected a match for to={candidate!r}")

    def test_historical_message_without_seq_still_reads(self) -> None:
        postoffice = self.root / ".araya" / "postoffice"
        body = "Historical body\n"
        digest = postoffice_loop.hashlib.sha256(body.encode("utf-8")).hexdigest()
        message_id = "MSG-20260701-000000-abcdef12"
        message_path = postoffice / "outbox" / f"{message_id}.md"
        message_path.write_text(
            "\n".join(
                [
                    "---",
                    f'id: "{message_id}"',
                    'created_at: "2026-07-01T00:00:00Z"',
                    'from: "Giskard"',
                    'to: "Daneel"',
                    'subject: "historical"',
                    'status: "new"',
                    'direction: "outbound"',
                    "related_branch: null",
                    "related_pr: null",
                    f'body_sha256: "{digest}"',
                    "---",
                    body.rstrip(),
                    "",
                ]
            ),
            encoding="utf-8",
        )

        read = postoffice_loop.cmd_read(SimpleNamespace(message_id=message_id))

        self.assertTrue(read["ok"])
        self.assertIsNone(read["message"]["seq"])
        self.assertEqual(body, read["body"])

    def test_sync_postoffice_graceful_when_no_remote(self) -> None:
        """sync_postoffice returns False in a temp repo with no origin — never crashes."""
        synced = postoffice_loop.sync_postoffice(self.root)
        self.assertFalse(synced)

    def test_pending_runs_even_when_sync_fails(self) -> None:
        """cmd_pending must work when sync_postoffice returns False (no remote)."""
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        postoffice_loop.create_message(
            from_actor="Giskard",
            to="Daneel",
            subject="sync-fail test",
            body="Body\n",
            model="test-model",
            model_source="tool-reported",
        )

        pending = postoffice_loop.cmd_pending(SimpleNamespace(to="Daneel"))
        self.assertEqual(1, len(pending["items"]))
        self.assertEqual("sync-fail test", pending["items"][0]["subject"])

    def test_no_sync_flag_skips_sync(self) -> None:
        """cmd_pending --no-sync must not call git at all."""
        postoffice = self.root / ".araya" / "postoffice"
        (postoffice / "index.jsonl").write_text("", encoding="utf-8")

        postoffice_loop.create_message(
            from_actor="Giskard",
            to="Daneel",
            subject="no-sync test",
            body="Body\n",
            model="test-model",
            model_source="tool-reported",
        )

        pending = postoffice_loop.cmd_pending(SimpleNamespace(to="Daneel", no_sync=True))
        self.assertEqual(1, len(pending["items"]))


if __name__ == "__main__":
    unittest.main()
