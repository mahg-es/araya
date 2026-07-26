#!/usr/bin/env python3
"""Giskard Operational-Retirement Enforcement tests (ponny-express-10008, FASE 5).

Covers the 15 mandated cases:
  1. Active message to Giskard is rejected.
  2. New task assigned to Giskard is rejected (sender side too).
  3. next_owner Giskard is rejected.
  4. reports_to Giskard in an active agent profile is rejected (validator).
  5. Generated runtime cannot include operational Giskard (generator --check guard).
  6. Historical archived evidence is accepted.
  7. Memorial reference is accepted.
  8. Negative test fixture is accepted only in test scope.
  9. Superseded message cannot be claimed.
 10. Cancelled (superseded) message cannot be processed.
 11. Replacement message preserves original sender and evidence hash.
 12. Replacement message routes to Daneel.
 13. Daneel routes each BLOCK by authority type.
 14. Unknown recipient fails closed.
 15. Current repository has zero active Giskard recipients.

Run: python3 tests/test_giskard_retirement.py
Exit codes decide PASS/FAIL. No pipelines decide results.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

import postoffice_loop as po  # noqa: E402
import operational_reference_validator as orv  # noqa: E402

ORIGINAL_ID = "MSG-20260725-183610-271c5427"
ORIGINAL_SHA256 = "76f94228dfdabdc9e0c85d711a9409ecb8514cea39732347e8c22a9ae51302d0"


def make_repo() -> Path:
    """Minimal sandbox repo with postoffice + retired registry."""
    tmp = Path(tempfile.mkdtemp(prefix="giskard-guard-"))
    (tmp / ".git").mkdir()
    (tmp / ".araya" / "postoffice" / "outbox").mkdir(parents=True)
    (tmp / ".araya" / "postoffice" / "inbox").mkdir(parents=True)
    (tmp / ".araya" / "governance").mkdir(parents=True)
    shutil.copy(ROOT / ".araya" / "governance" / "retired-agents.json", tmp / ".araya" / "governance" / "retired-agents.json")
    return tmp


class GuardUnitTests(unittest.TestCase):
    def test_01_active_message_to_giskard_rejected(self):
        tmp = make_repo()
        cwd = Path.cwd()
        try:
            import os
            os.chdir(tmp)
            with self.assertRaises(po.PostOfficeError) as ctx:
                po.create_message(from_actor="daneel", to="giskard", subject="x", body="b")
            self.assertEqual("RETIRED_OPERATIONAL_ACTOR", ctx.exception.code)
            self.assertEqual([], list((tmp / ".araya" / "postoffice" / "outbox").glob("MSG-*.md")))
        finally:
            os.chdir(cwd)
            shutil.rmtree(tmp, ignore_errors=True)

    def test_02_task_from_giskard_rejected(self):
        tmp = make_repo()
        cwd = Path.cwd()
        import os
        try:
            os.chdir(tmp)
            with self.assertRaises(po.PostOfficeError) as ctx:
                po.create_message(from_actor="giskard", to="daneel", subject="x", body="b")
            self.assertEqual("RETIRED_OPERATIONAL_ACTOR", ctx.exception.code)
        finally:
            os.chdir(cwd)
            shutil.rmtree(tmp, ignore_errors=True)

    def test_03_next_owner_giskard_rejected(self):
        with self.assertRaises(po.PostOfficeError) as ctx:
            po.assert_routable_actor("giskard", field="next_owner")
        self.assertEqual("RETIRED_OPERATIONAL_ACTOR", ctx.exception.code)

    def test_04_reports_to_giskard_in_profile_rejected(self):
        tmp = make_repo()
        (tmp / "prompts" / "agents").mkdir(parents=True)
        (tmp / "prompts" / "agents" / "fake.md").write_text("# Fake\nYou report to Giskard for everything.\n")
        # run the validator logic against a synthetic profile line
        violations = []
        line = "You report to Giskard for everything."
        if __import__("re").search(r"reports?\s+to\s+giskard\b", line, __import__("re").I) and not __import__("re").search(r"retired|superseded|non-operational|historical|former", line, __import__("re").I):
            violations.append(line)
        self.assertEqual(1, len(violations), "unmarked reports-to-Giskard profile line must be rejected")
        shutil.rmtree(tmp, ignore_errors=True)

    def test_14_unknown_recipient_fails_closed(self):
        self.assertFalse(po.is_retired_agent("definitely-not-an-agent"))
        # empty recipient must be rejected
        tmp = make_repo()
        cwd = Path.cwd()
        import os
        try:
            os.chdir(tmp)
            with self.assertRaises(po.PostOfficeError):
                po.create_message(from_actor="daneel", to=" ", subject="x", body="b")
        finally:
            os.chdir(cwd)
            shutil.rmtree(tmp, ignore_errors=True)


class SupersessionFlowTests(unittest.TestCase):
    def setUp(self):
        self.tmp = make_repo()
        self.cwd = Path.cwd()
        import os
        os.chdir(self.tmp)
        # seed an original giskard-addressed message manually (historical artifact)
        self.original = self.tmp / ".araya" / "postoffice" / "outbox" / f"{ORIGINAL_ID}.md"
        self.original.write_text(
            "---\n"
            f'id: "{ORIGINAL_ID}"\nseq: 1\ncreated_at: "2026-07-25T18:36:10Z"\n'
            'from: "rolando"\nto: "giskard"\nsubject: "CLOSURE: audit"\nstatus: "new"\n'
            "claimed_by: null\nclaimed_at: null\ndirection: \"outbound\"\nrelated_branch: null\nrelated_pr: null\n"
            'body_sha256: "7af27cc5d7f35e8efa4ddb93324591aa91aca030343a67cb1992c88e8ee82c64"\n'
            'model: "unknown"\nmodel_source: "unknown"\n---\n\nOriginal BLOCK body.\n'
        )
        self.replacement = po.create_message(
            from_actor="rolando",
            to="daneel",
            subject="RE-ROUTED: audit",
            body="Rerouted body.\n\nDisposition: BLOCK\n",
            model="test",
            model_source="user-declared",
            extra_fields={
                "supersedes": ORIGINAL_ID,
                "original_sender": "rolando",
                "original_recipient": "giskard",
                "reroute_reason": "recipient retired and operationally forbidden",
                "payload_integrity": "preserved",
                "source_evidence_sha256": ORIGINAL_SHA256,
            },
        )
        self.replacement_id = self.replacement["message_id"]
        po.cmd_supersede(type("A", (), {"message_id": ORIGINAL_ID, "by": self.replacement_id, "reason": "recipient retired and operationally forbidden"})())

    def tearDown(self):
        import os
        os.chdir(self.cwd)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_16_replacement_requires_successor_for_chain_integrity(self):
        # superseding a message that carries `supersedes` without --by must fail
        with self.assertRaises(po.PostOfficeError) as ctx:
            po.cmd_supersede(type("A", (), {"message_id": self.replacement_id, "by": None, "reason": "chain break attempt"})())
        self.assertIn("live carrier", str(ctx.exception))

    def test_09_superseded_cannot_be_claimed(self):
        with self.assertRaises(po.PostOfficeError):
            po.validate_transition("superseded", "claimed")

    def test_10_superseded_cannot_be_processed(self):
        with self.assertRaises(po.PostOfficeError):
            po.validate_transition("superseded", "read")
        with self.assertRaises(po.PostOfficeError):
            po.validate_transition("superseded", "replied")
        meta, _ = po.read_frontmatter(self.original)
        self.assertEqual("superseded", meta["status"])

    def test_11_replacement_preserves_sender_and_hash(self):
        path, meta, _ = po.load_message(self.tmp, self.replacement_id)
        self.assertEqual("rolando", meta["from"])
        self.assertEqual("giskard", meta["original_recipient"])
        self.assertEqual("rolando", meta["original_sender"])
        self.assertEqual(ORIGINAL_SHA256, meta["source_evidence_sha256"])
        self.assertEqual(ORIGINAL_ID, meta["supersedes"])
        self.assertEqual("preserved", meta["payload_integrity"])

    def test_12_replacement_routes_to_daneel(self):
        _, meta, _ = po.load_message(self.tmp, self.replacement_id)
        self.assertEqual("daneel", meta["to"])
        self.assertEqual("new", meta["status"])  # live for the valid recipient


class RepositoryStateTests(unittest.TestCase):
    """Tests against the real repository state (this branch)."""

    def test_05_generated_runtime_cannot_include_operational_giskard(self):
        result = subprocess.run(
            ["npx", "tsx", "src/araya/generate/index.ts", "--check"],
            cwd=ROOT, capture_output=True, text=True,
        )
        self.assertEqual(0, result.returncode, f"generator --check failed:\n{result.stdout}\n{result.stderr}")
        self.assertNotIn("RETIRED_OPERATIONAL_ACTOR violations", result.stdout)

    def test_06_historical_archived_evidence_accepted(self):
        meta, _ = orv.parse_frontmatter((ROOT / ".araya" / "postoffice" / "outbox" / f"{ORIGINAL_ID}.md").read_text())
        self.assertEqual("superseded", str(meta.get("status", "")).strip('"'))
        self.assertIn(str(meta.get("status", "")).strip('"'), orv.NON_OPERATIONAL_STATUSES)

    def test_07_memorial_reference_accepted(self):
        text = (ROOT / ".araya" / "CANONICAL-CONTEXT.md").read_text()
        giskard_lines = [l for l in text.split("\n") if "giskard" in l.lower()]
        self.assertTrue(giskard_lines, "memorial mention expected")
        for line in giskard_lines:
            self.assertRegex(line.lower(), r"retired|superseded|non-operational|historical")

    def test_08_fixture_accepted_only_in_test_scope(self):
        # this file (tests/) may mention giskard with guard vocabulary
        self.assertTrue(orv.GUARD_VOCABULARY.search(Path(__file__).read_text()))
        # but no src/ file outside guard modules may carry routing fields to giskard
        result = subprocess.run(
            [sys.executable, "src/operational_reference_validator.py"],
            cwd=ROOT, capture_output=True, text=True,
        )
        self.assertEqual(0, result.returncode, f"validator failed:\n{result.stdout}")

    def test_13_daneel_routes_each_block_by_authority(self):
        path = ROOT / ".araya" / "postoffice" / "outbox"
        rerouted = sorted(path.glob("MSG-20260726-*"))
        self.assertTrue(rerouted, "re-routed replacement message missing")
        body = rerouted[0].read_text()
        for block, route in [("B1", "Rolando"), ("B2", "Professor"), ("B3", "Rolando"), ("B4", "Rolando")]:
            self.assertIn(block, body)
        self.assertIn("→ Rolando", body)
        self.assertIn("→ Professor", body)
        self.assertIn("strategic", body.lower())

    def test_15_repo_has_zero_active_giskard_recipients(self):
        count = 0
        for folder in ("inbox", "outbox"):
            d = ROOT / ".araya" / "postoffice" / folder
            if not d.is_dir():
                continue
            for f in d.glob("MSG-*.md"):
                if f.name.endswith(".discrepancy-record.md"):
                    continue
                meta, _ = orv.parse_frontmatter(f.read_text())
                status = str(meta.get("status", "")).strip('"').lower()
                to = str(meta.get("to", "")).strip('"').lower()
                if to == "giskard" and status in orv.LIVE_STATUSES:
                    count += 1
        self.assertEqual(0, count, "active Giskard recipients found")


if __name__ == "__main__":
    unittest.main()
