"""Skills (progressive disclosure), capabilities, and delegation tests."""
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "cli"))

from araya_lib.skills import Skills  # noqa: E402
from araya_lib.capabilities import Capabilities  # noqa: E402
from araya_lib.delegation import Delegation, random_display_name  # noqa: E402


class SkillsTest(unittest.TestCase):
    def setUp(self):
        self.skills = Skills(str(REPO))
        self.skills.load_index()

    def test_index_loaded(self):
        names = self.skills.names()
        self.assertGreaterEqual(len(names), 5)
        for n in ("adr-write", "tdd-execute", "git-publication",
                  "postoffice", "ponyexpress"):
            self.assertIn(n, names)

    def test_progressive_disclosure_metadata_only(self):
        # list() exposes metadata only — never the full body.
        for s in self.skills.list():
            self.assertNotIn("body", s)
            self.assertIn("name", s)
            self.assertIn("path", s)

    def test_get_loads_full_body(self):
        rec = self.skills.get("adr-write")
        self.assertIsNotNone(rec)
        self.assertIn("body", rec)
        self.assertIn("Architecture Decision Records", rec["body"])

    def test_resolve(self):
        self.assertTrue(self.skills.resolve("adr-write")["found"])
        self.assertTrue(self.skills.resolve("testing")["found"])
        self.assertFalse(self.skills.resolve("no-such-skill")["found"])


class CapabilitiesTest(unittest.TestCase):
    def setUp(self):
        self.caps = Capabilities(str(REPO))
        self.caps.load()

    def test_load(self):
        self.assertGreaterEqual(len(self.caps.list()), 5)

    def test_resolve_exact(self):
        r = self.caps.resolve("publish-git")
        self.assertTrue(r["found"])
        self.assertEqual(r["capability"], "publish-git")

    def test_publish_git_maps_operations(self):
        cap = self.caps.get("publish-git")
        self.assertIn("git.merge-gate", cap["operations"])


class DelegationTest(unittest.TestCase):
    def setUp(self):
        self.delg = Delegation(str(REPO))

    def test_resolve_git_task(self):
        r = self.delg.resolve("publish this branch to integration")
        self.assertIn("git.merge-gate", r["operations"])
        self.assertIn("git-publication", r["skills"])
        self.assertTrue(r["execute_directly"])

    def test_resolve_decision_task(self):
        r = self.delg.resolve("write an architecture decision record")
        self.assertIn("adr-write", r["skills"])

    def test_ephemeral_agent_composed_from_skills(self):
        agent = self.delg.compose_ephemeral_agent(
            "publish this branch to integration")
        self.assertIn("git-publication", agent["skills"])
        self.assertFalse(agent["persistent"])
        self.assertTrue(agent["display_name_has_no_meaning"])

    def test_agent_names_are_not_capability_identifiers(self):
        a = self.delg.compose_ephemeral_agent("publish git")
        b = self.delg.compose_ephemeral_agent("publish git")
        # Two compositions for the SAME capability get different names...
        self.assertNotEqual(a["name"], b["name"])
        # ...and neither name encodes the capability.
        for agent in (a, b):
            self.assertNotIn("git", agent["name"].lower())
            self.assertNotIn("publish", agent["name"].lower())

    def test_random_display_name_format(self):
        n = random_display_name()
        self.assertTrue(n.startswith("agent-"))
        self.assertEqual(len(n), len("agent-") + 6)


if __name__ == "__main__":
    unittest.main()
