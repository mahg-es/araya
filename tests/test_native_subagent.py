"""Native subagent execution adapter-boundary tests.

The library layer does not (and must not) spawn the host's subagent itself; it
produces a scoped worker request + records the PostOffice handoff, and the
agent-facing caller invokes the host's native subagent with that request. These
tests verify the adapter-boundary contract: the handoff is recorded, the worker
request is complete and well-scoped, and the result round-trip produces a full
correlation trace.
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CLI = str(REPO / "cli" / "araya")


def run_cli(*args, cwd=None):
    return subprocess.run(
        [sys.executable, CLI, "--json", *args],
        cwd=cwd or str(REPO), capture_output=True, text=True)


class NativeSubagentBoundaryTest(unittest.TestCase):
    def test_delegate_run_records_handoff_and_emits_worker_request(self):
        with tempfile.TemporaryDirectory() as d:
            r = run_cli("delegate", "run", "--correlation", "P123",
                        "verify the araya repository is sane", cwd=d)
            self.assertEqual(r.returncode, 0)
            req = json.loads(r.stdout)
            self.assertEqual(req["correlation_id"], "P123")
            self.assertTrue(req["worker_name"].startswith("agent-"))
            self.assertTrue(req["display_name_has_no_meaning"])
            self.assertIn("git-publication", req["skills"])
            self.assertIn("git.repository-sanity", req["operations"])
            self.assertIn("handoff_message_id", req)
            self.assertTrue(req["worker_prompt"])
            self.assertIn(req["task"], req["worker_prompt"])

            # Handoff recorded in PostOffice with sender/recipient/correlation.
            listing = json.loads(run_cli("postoffice", "list", cwd=d).stdout)
            self.assertEqual(len(listing), 1)
            self.assertEqual(listing[0]["message_type"], "delegation")
            self.assertEqual(listing[0]["sender"], "daneel")
            self.assertEqual(listing[0]["recipient"], req["worker_name"])
            self.assertEqual(listing[0]["correlation_id"], "P123")

    def test_delegate_result_completes_trace(self):
        with tempfile.TemporaryDirectory() as d:
            req = json.loads(run_cli(
                "delegate", "run", "--correlation", "P123",
                "verify the araya repository is sane", cwd=d).stdout)
            r = run_cli("delegate", "result",
                        "--correlation", "P123",
                        "--worker", req["worker_name"],
                        "--status", "PASS",
                        "--body", "sanity PASS (6/6 checks)", cwd=d)
            self.assertEqual(r.returncode, 0)
            out = json.loads(r.stdout)
            self.assertEqual(out["status"], "PASS")
            types = [m["message_type"] for m in out["trace"]]
            self.assertIn("delegation", types)
            self.assertIn("result", types)
            self.assertTrue(all(m["correlation_id"] == "P123" for m in out["trace"]))

    def test_worker_prompt_scoped(self):
        with tempfile.TemporaryDirectory() as d:
            req = json.loads(run_cli(
                "delegate", "run", "verify the araya repository is sane",
                cwd=d).stdout)
            prompt = req["worker_prompt"]
            self.assertIn("ephemeral specialist worker", prompt)
            self.assertIn(req["task"], prompt)
            self.assertIn("git.repository-sanity", prompt)

    def test_agent_name_has_no_capability_semantics(self):
        with tempfile.TemporaryDirectory() as d:
            a = json.loads(run_cli("delegate", "run", "publish git", cwd=d).stdout)
            b = json.loads(run_cli("delegate", "run", "publish git", cwd=d).stdout)
            self.assertNotEqual(a["worker_name"], b["worker_name"])
            for req in (a, b):
                self.assertNotIn("git", req["worker_name"].lower())
                self.assertNotIn("publish", req["worker_name"].lower())


if __name__ == "__main__":
    unittest.main()
