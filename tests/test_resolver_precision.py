"""Resolver precision + operation safety regression tests (PE-ARAYA-2609-C-03).

Fixes the C-02 defect: the capability resolver must select the *right*
capabilities and derive skills/operations from them, never accumulate unrelated
skills/operations merely because a word matched. Also verifies that matching is
exact normalized-token based (no accidental substring matches), that operations
are risk-safe, and that both Spanish and English intents resolve identically.
"""
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "cli"))

from araya_lib.delegation import Delegation  # noqa: E402
from araya_lib.matching import matches, tokenize  # noqa: E402

C02_ES = ("Necesito revisar el diseño de una API mínima que exponga /health y "
          "/version, junto con un diagrama sencillo de cómo encaja con ARAYA.")
C02_EN = ("I need to review the design of a minimal API exposing /health and "
          "/version, plus a simple diagram of how it fits with ARAYA.")

GIT_SKILLS = {"git-publication", "postoffice"}
GIT_OPS = {"git.feature-start", "git.merge-gate", "git.feature-pr-gate"}


class SpanishPositiveCompositionTest(unittest.TestCase):
    """The C-02 intent must resolve exactly the intended capabilities/skills."""

    def setUp(self):
        self.d = Delegation(str(REPO))

    def test_capabilities_exact(self):
        r = self.d.resolve(C02_ES)
        self.assertEqual(sorted(r["capabilities"]),
                         ["design-api", "document-architecture"])

    def test_skills_exact(self):
        r = self.d.resolve(C02_ES)
        self.assertEqual(sorted(r["skills"]),
                         ["api-design", "architecture-diagram"])

    def test_no_unrelated_skill_spillover(self):
        r = self.d.resolve(C02_ES)
        for s in GIT_SKILLS:
            self.assertNotIn(s, r["skills"])
        self.assertNotIn("adr-write", r["skills"])

    def test_operations_empty_for_read_only_design(self):
        r = self.d.resolve(C02_ES)
        self.assertEqual(r["operations"], [])
        for op in GIT_OPS:
            self.assertNotIn(op, r["operations"])
        self.assertFalse(r["execute_directly"])
        self.assertTrue(r["needs_specialist"])


class EnglishEquivalentTest(unittest.TestCase):
    def setUp(self):
        self.d = Delegation(str(REPO))

    def test_english_equivalent(self):
        r = self.d.resolve(C02_EN)
        self.assertEqual(sorted(r["capabilities"]),
                         ["design-api", "document-architecture"])
        self.assertEqual(sorted(r["skills"]),
                         ["api-design", "architecture-diagram"])
        self.assertEqual(r["operations"], [])

    def test_spanish_and_english_agree(self):
        es = self.d.resolve(C02_ES)
        en = self.d.resolve(C02_EN)
        self.assertEqual(sorted(es["capabilities"]), sorted(en["capabilities"]))
        self.assertEqual(sorted(es["skills"]), sorted(en["skills"]))
        self.assertEqual(es["operations"], en["operations"])


class GitPositiveTest(unittest.TestCase):
    """Do not make the resolver safe by disabling legitimate Git behavior."""

    def setUp(self):
        self.d = Delegation(str(REPO))

    def test_git_positive_english(self):
        r = self.d.resolve("start a feature branch and publish it to integration")
        self.assertIn("publish-git", r["capabilities"])
        self.assertIn("git-publication", r["skills"])
        self.assertIn("git.merge-gate", r["operations"])
        self.assertIn("git.feature-start", r["operations"])
        self.assertTrue(r["execute_directly"])

    def test_git_positive_spanish(self):
        r = self.d.resolve("publicar la rama y hacer merge a la integración")
        self.assertIn("publish-git", r["capabilities"])
        self.assertIn("git-publication", r["skills"])

    def test_git_positive_publish_branch(self):
        r = self.d.resolve("publish this branch to integration")
        self.assertIn("git-publication", r["skills"])
        self.assertIn("git.merge-gate", r["operations"])
        self.assertTrue(r["execute_directly"])


class SingleCapabilityTest(unittest.TestCase):
    def setUp(self):
        self.d = Delegation(str(REPO))

    def test_api_only(self):
        r = self.d.resolve("design a minimal REST API for orders")
        self.assertEqual(r["capabilities"], ["design-api"])
        self.assertEqual(r["skills"], ["api-design"])
        self.assertEqual(r["operations"], [])

    def test_architecture_diagram_only(self):
        r = self.d.resolve("create a deployment diagram")
        self.assertEqual(r["capabilities"], ["document-architecture"])
        self.assertEqual(r["skills"], ["architecture-diagram"])
        self.assertEqual(r["operations"], [])

    def test_test_execution_request(self):
        r = self.d.resolve("run the test suite")
        self.assertIn("execute-tests", r["capabilities"])
        self.assertIn("tdd-execute", r["skills"])
        self.assertNotIn("api-design", r["skills"])
        self.assertNotIn("git-publication", r["skills"])

    def test_repository_verification_request(self):
        r = self.d.resolve("verify the repository is sane")
        self.assertEqual(r["capabilities"], ["verify-repository"])
        self.assertIn("git-publication", r["skills"])
        self.assertIn("git.repository-sanity", r["operations"])


class MatchingPrecisionTest(unittest.TestCase):
    def setUp(self):
        self.d = Delegation(str(REPO))

    def test_substring_is_not_a_match(self):
        self.assertFalse(matches("version", "versioning"))
        self.assertFalse(matches("consequences", "con"))
        self.assertFalse(matches("consult", "con"))

    def test_exact_token_is_a_match(self):
        self.assertTrue(matches("version", "the version endpoint"))
        self.assertTrue(matches("diagram diagrama", "un diagrama sencillo"))

    def test_end_to_end_no_false_positives(self):
        for q in ("the versioning strategy", "consult the consequences",
                  "el estado del resultado final", "review the archivo",
                  "the preconditions were met"):
            r = self.d.resolve(q)
            self.assertEqual(r["capabilities"], [], q)
            self.assertEqual(r["skills"], [], q)
            self.assertEqual(r["operations"], [], q)

    def test_tokenize_drops_spanish_stopwords(self):
        toks = set(tokenize("junto con el diseño de una API"))
        self.assertNotIn("junto", toks)
        self.assertNotIn("con", toks)
        self.assertNotIn("el", toks)
        self.assertIn("diseno", toks)  # accent-folded
        self.assertIn("api", toks)


class OperationSafetyTest(unittest.TestCase):
    def setUp(self):
        self.d = Delegation(str(REPO))

    def test_read_only_request_never_gains_state_changing_operation(self):
        r = self.d.resolve("verify the repository is sane")
        self.assertNotIn("git.feature-start", r["operations"])

    def test_state_changing_operation_kept_when_requested(self):
        r = self.d.resolve("start a feature branch")
        self.assertIn("git.feature-start", r["operations"])

    def test_generic_noun_does_not_warrant_state_changing_operation(self):
        # Regression for the independent-verifier finding: a single generic
        # shared token ("branch") must never warrant a state-changing operation
        # (git.feature-start creates a worktree+branch). A strong match — at
        # least two distinct action tokens — is required.
        r = self.d.resolve("document the branch naming conventions")
        self.assertNotIn("git.feature-start", r["operations"])
        r2 = self.d.resolve("explain the integration strategy")
        self.assertNotIn("git.feature-start", r2["operations"])

    def test_design_request_has_no_operations(self):
        self.assertEqual(self.d.resolve(C02_ES)["operations"], [])
        self.assertEqual(self.d.resolve("design a REST API")["operations"], [])


if __name__ == "__main__":
    unittest.main()
