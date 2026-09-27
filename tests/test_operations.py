"""Operations catalog contract tests: list / describe / resolve / execute."""
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "cli"))

from araya_lib.operations import OperationRegistry  # noqa: E402


class OperationsTest(unittest.TestCase):
    def setUp(self):
        self.registry = OperationRegistry(str(REPO))
        self.loaded = self.registry.load()

    def test_catalog_loads_without_errors(self):
        self.assertEqual(self.loaded["errors"], [], f"load errors: {self.loaded['errors']}")
        self.assertGreaterEqual(self.loaded["loaded"], 4)

    def test_list_returns_definitions(self):
        ops = self.registry.list()
        ids = [o["operation_id"] for o in ops]
        for expected in ("git.repository-sanity", "git.merge-gate",
                         "git.feature-pr-gate", "git.feature-start"):
            self.assertIn(expected, ids)

    def test_describe(self):
        d = self.registry.describe("git.repository-sanity")
        self.assertIsNotNone(d)
        self.assertEqual(d["operation_id"], "git.repository-sanity")
        self.assertEqual(d["risk_level"], "read-only")

    def test_resolve_exact_id(self):
        r = self.registry.resolve("git.merge-gate")
        self.assertTrue(r["found"])
        self.assertEqual(r["via"], "exact-id")

    def test_resolve_alias(self):
        r = self.registry.resolve("sanity")
        self.assertTrue(r["found"])
        self.assertEqual(r["operation_id"], "git.repository-sanity")

    def test_resolve_intent(self):
        r = self.registry.resolve("is the repository sane")
        self.assertTrue(r["found"])
        self.assertEqual(r["operation_id"], "git.repository-sanity")

    def test_resolve_unknown(self):
        r = self.registry.resolve("no such operation")
        self.assertFalse(r["found"])
        self.assertIsNone(r["operation_id"])

    def test_execute_repository_sanity_read_only(self):
        result = self.registry.execute("git.repository-sanity", {"repo": str(REPO)})
        self.assertEqual(result.operation_id, "git.repository-sanity")
        # Executed against a real, clean git repository: should PASS and be read-only.
        self.assertEqual(result.status, "PASS")
        self.assertEqual(result.side_effects, [])
        self.assertTrue(result.evaluated_sha)
        self.assertIsNotNone(result.started_at)
        self.assertIsNotNone(result.completed_at)

    def test_execute_unknown_raises(self):
        with self.assertRaises(ValueError):
            self.registry.execute("nope.unknown", {})

    def test_result_contract_valid(self):
        from araya_lib.result import validate_result
        result = self.registry.execute("git.repository-sanity", {"repo": str(REPO)})
        self.assertEqual(validate_result(result), [])

    def test_execute_test_command(self):
        result = self.registry.execute("test.execute", {"command": "python3 -c 'print(1+1)'"})
        self.assertEqual(result.operation_id, "test.execute")
        self.assertEqual(result.status, "PASS")
        self.assertTrue(any(c.id == "exit_code_zero" and c.passed for c in result.checks))

    def test_execute_test_command_failure(self):
        result = self.registry.execute("test.execute", {"command": "python3 -c 'import sys; sys.exit(3)'"})
        self.assertEqual(result.status, "FAIL")


if __name__ == "__main__":
    unittest.main()
