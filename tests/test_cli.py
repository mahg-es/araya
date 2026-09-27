"""CLI contract tests: structured machine-readable output, stable exit codes."""
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


class CliTest(unittest.TestCase):
    def test_status_json(self):
        r = run_cli("status")
        self.assertEqual(r.returncode, 0)
        data = json.loads(r.stdout)
        self.assertEqual(data["product"], "ARAYA")
        self.assertIn("operations", data)
        self.assertIn("skills", data)
        self.assertIn("capabilities", data)

    def test_operation_list_json(self):
        r = run_cli("operation", "list")
        self.assertEqual(r.returncode, 0)
        data = json.loads(r.stdout)
        self.assertTrue(isinstance(data, list))
        self.assertTrue(all("operation_id" in d for d in data))

    def test_operation_execute_json_and_exit_code(self):
        r = run_cli("operation", "execute", "git.repository-sanity", f"repo={REPO}")
        self.assertEqual(r.returncode, 0)
        data = json.loads(r.stdout)
        self.assertEqual(data["status"], "PASS")
        self.assertIn("checks", data)

    def test_operation_unknown_exit_code_1(self):
        r = run_cli("operation", "execute", "nope.unknown")
        self.assertEqual(r.returncode, 1)

    def test_usage_error_exit_code_2(self):
        r = run_cli("operation")  # missing subcommand
        self.assertEqual(r.returncode, 2)

    def test_unknown_command_exit_code_2(self):
        r = run_cli("bogus-command")
        self.assertEqual(r.returncode, 2)

    def test_git_sanity_json(self):
        r = run_cli("git", "sanity", "--repo", str(REPO))
        self.assertEqual(r.returncode, 0)
        data = json.loads(r.stdout)
        self.assertEqual(data["status"], "PASS")

    def test_delegate_json(self):
        r = run_cli("delegate", "publish this branch to integration")
        self.assertEqual(r.returncode, 0)
        data = json.loads(r.stdout)
        self.assertIn("resolution", data)
        self.assertIn("ephemeral_agent", data)
        self.assertTrue(data["ephemeral_agent"]["display_name_has_no_meaning"])

    def test_runtime_model_context_read_only(self):
        r = run_cli("runtime", "model-context")
        self.assertEqual(r.returncode, 0)
        data = json.loads(r.stdout)
        self.assertTrue(data["read_only"])

    def test_postoffice_roundtrip_in_temp_project(self):
        with tempfile.TemporaryDirectory() as d:
            send = run_cli("postoffice", "send", "--recipient", "agent",
                           "--subject", "hi", "--correlation", "P123", cwd=d)
            self.assertEqual(send.returncode, 0)
            listing = run_cli("postoffice", "list", cwd=d)
            self.assertEqual(listing.returncode, 0)
            data = json.loads(listing.stdout)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["correlation_id"], "P123")


if __name__ == "__main__":
    unittest.main()
