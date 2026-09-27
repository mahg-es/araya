"""Skills (progressive disclosure), capabilities, and delegation tests."""
import json
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


class Wave2SkillsTest(unittest.TestCase):
    """Wave 2 recovery: architecture-diagram + api-design (absorbs api-document)."""

    def setUp(self):
        self.skills = Skills(str(REPO))
        self.skills.load_index()
        self.caps = Capabilities(str(REPO))
        self.caps.load()
        self.delg = Delegation(str(REPO))

    def test_wave2_skills_present(self):
        names = self.skills.names()
        for n in ("architecture-diagram", "api-design"):
            self.assertIn(n, names)

    def test_wave2_skill_bodies_load(self):
        for n in ("architecture-diagram", "api-design"):
            rec = self.skills.get(n)
            self.assertIsNotNone(rec, n)
            self.assertIn("body", rec)
            self.assertGreater(len(rec["body"]), 200)
        # api-design body carries the combined api-design + api-document value
        # (OpenAPI spec design AND from-spec documentation).
        body = self.skills.get("api-design")["body"]
        self.assertIn("OpenAPI", body)
        self.assertIn("documentation", body.lower())

    def test_wave2_capabilities_present(self):
        cap_ids = {c["id"] for c in self.caps.list()}
        self.assertIn("document-architecture", cap_ids)
        self.assertIn("design-api", cap_ids)

    def test_wave2_capability_maps_skills(self):
        self.assertEqual(self.caps.get("document-architecture")["skills"],
                         ["architecture-diagram"])
        self.assertEqual(self.caps.get("design-api")["skills"], ["api-design"])

    def test_wave2_multi_skill_composition(self):
        # A design-and-document task must select both Wave 2 skills (and the
        # existing adr-write), composing into one ephemeral worker.
        r = self.delg.resolve(
            "design the API and architecture diagrams for a user management service")
        self.assertIn("architecture-diagram", r["skills"])
        self.assertIn("api-design", r["skills"])
        self.assertIn("adr-write", r["skills"])
        r2 = self.delg.compose_ephemeral_agent(
            "design the API and architecture for a user management service")
        self.assertFalse(r2["persistent"])
        self.assertTrue(r2["display_name_has_no_meaning"])

    def test_api_design_source_provenance_includes_api_document(self):
        idx = json.loads((REPO / "skills" / "index.json").read_text(encoding="utf-8"))
        api = next(s for s in idx["skills"] if s["name"] == "api-design")
        self.assertIn("api-design", api["source_provenance"])
        self.assertIn("api-document", api["source_provenance"])


class Wave2ReviewDispositionsTest(unittest.TestCase):
    """Wave 2 disposition changes must be reflected in the review record."""

    def setUp(self):
        self.review = json.loads(
            (REPO / "docs" / "legacy-skills-review.json").read_text(encoding="utf-8"))
        self.by_id = {r["legacy_skill_id"]: r for r in self.review["records"]}

    def test_wave2_recovered_as_keep(self):
        for sid in ("architecture-diagram", "api-design"):
            self.assertEqual(self.by_id[sid]["disposition"], "KEEP", sid)
            self.assertEqual(self.by_id[sid]["canonical_target"], sid, sid)

    def test_api_document_combined_into_api_design(self):
        r = self.by_id["api-document"]
        self.assertEqual(r["disposition"], "COMBINE")
        self.assertEqual(r["canonical_target"], "api-design")


if __name__ == "__main__":
    unittest.main()
