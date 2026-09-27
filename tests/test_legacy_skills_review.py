"""Legacy skills review + Wave 1 recovery contract tests.

Verifies the full corpus is accounted for (no skill silently disappears, each
has exactly one disposition), deduplication/provenance are retained, progressive
disclosure holds, and operation-backed skills reference operations rather than
duplicating deterministic procedure.
"""
import json
import sys
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "cli"))

from araya_lib.delegation import Delegation  # noqa: E402
from araya_lib.skills import Skills  # noqa: E402

# The authoritative legacy skill ids from the archived branch (skills/*/SKILL.md).
LEGACY_SKILL_IDS = [
    'abc-costing-model', 'accessibility', 'adr-write', 'agent-design',
    'agent-topology', 'ai-routing', 'analytics-report', 'animation',
    'api-design', 'api-document', 'api-gateway', 'api-integration',
    'araya-command-and-delegation-expert', 'araya-operation-runtime',
    'architecture-diagram', 'asset-management', 'auth-middleware',
    'autonomous-execution', 'ax-postoffice', 'ax3', 'bdd-feature',
    'brand-audit', 'brand-compliance', 'budget-forecasting', 'cache-strategy',
    'capability-registry', 'cicd-pipeline', 'cicd-quality', 'cloud-deploy',
    'cloud-provision', 'compliance', 'component', 'component-arch',
    'content-calendar', 'cost-analysis', 'cost-to-serve', 'coverage',
    'cr-generate', 'curriculum-planning', 'daily-note', 'daily-standup',
    'dashboard-design', 'data-governance', 'data-lakehouse-design',
    'data-modeling', 'data-quality', 'data-visualization', 'db-optimization',
    'db-schema', 'definition-of-done', 'deployment-automation', 'docker',
    'drr-create', 'e2e-strategy', 'endpoint', 'error-handling',
    'etl-orchestration', 'form-design', 'gap-analysis', 'geo-branding',
    'iar-generate', 'impediment', 'integration-test', 'knowledge-graph',
    'kpi-framework', 'kubernetes', 'lab-scenario-design', 'llm-local-deploy',
    'medallion-architecture', 'message-queue', 'microservice',
    'model-fine-tuning', 'monitoring', 'multi-platform-publish',
    'organizational-health', 'organizational-knowledge', 'page-route',
    'pentest', 'performance', 'performance-test', 'pkm-workflow',
    'pm-decompose', 'pm-dependencies', 'pm-plan', 'pm-risk', 'pm-status',
    'po-gap-questionnaire', 'profitability-lineage', 'project-planning',
    'rag-pipeline', 'reality-verification', 'regression', 'relay-participant',
    'resource-rightsizing', 'responsive', 'retrospective', 'sdd-requirements',
    'sdd-vision', 'secrets', 'secure-arch', 'secure-code', 'seo-optimize',
    'skills-lifecycle', 'slide-deck-generate', 'spark-pipeline',
    'spof-detection', 'sprint-planning', 'state-management',
    'static-site-generate', 'student-assessment', 'tdd-execute', 'tdd-generate',
    'technical-book', 'test-case', 'theme-design', 'threat-model',
    'token-efficiency', 'training-module', 'trajectory-management',
    'uat-generate', 'uat-review', 'unit-test', 'usage-metering',
    'vector-search', 'velocity', 'visual-identity', 'whale-curve-analyze',
    'workforce-planning',
]

VALID_DISPOSITIONS = {"KEEP", "COMBINE", "REPLACE_BY_OPERATION", "DROP", "LATER"}

REQUIRED_FIELDS = [
    "legacy_skill_id", "purpose", "inputs", "outputs", "dependencies",
    "deterministic_code_available", "overlap_with_other_skills",
    "overlap_with_operations", "overlap_with_AX3", "current_product_value",
    "disposition", "canonical_target", "reason", "source_provenance",
]


class LegacySkillsReviewTest(unittest.TestCase):
    def setUp(self):
        self.review = json.loads(
            (REPO / "docs" / "legacy-skills-review.json").read_text(encoding="utf-8"))
        self.records = self.review["records"]
        self.index = json.loads(
            (REPO / "skills" / "index.json").read_text(encoding="utf-8"))

    def test_full_corpus_accounted_for(self):
        reviewed = {r["legacy_skill_id"] for r in self.records}
        self.assertEqual(reviewed, set(LEGACY_SKILL_IDS))
        self.assertEqual(len(self.records), 128)

    def test_no_duplicate_legacy_ids(self):
        ids = [r["legacy_skill_id"] for r in self.records]
        self.assertEqual(len(ids), len(set(ids)))

    def test_each_has_exactly_one_disposition(self):
        for r in self.records:
            self.assertIn(r["disposition"], VALID_DISPOSITIONS, r)

    def test_summary_matches_records(self):
        s = self.review["summary"]
        self.assertEqual(s["total_reviewed"], len(self.records))
        for disp in VALID_DISPOSITIONS:
            actual = sum(1 for r in self.records if r["disposition"] == disp)
            self.assertEqual(s[disp], actual, disp)

    def test_canonical_skill_names_unique(self):
        names = [s["name"] for s in self.index["skills"]]
        self.assertEqual(len(names), len(set(names)))

    def test_provenance_retained(self):
        canonical_names = {s["name"] for s in self.index["skills"]}
        op_names = set()
        for f in (REPO / "operations" / "catalog").glob("*.json"):
            op_names.add(json.loads(f.read_text(encoding="utf-8"))["operation_id"])
        for r in self.records:
            target = r.get("canonical_target")
            if r["disposition"] in ("COMBINE", "KEEP"):
                self.assertIsNotNone(target, r)
                self.assertIn(target, canonical_names, r)
            elif r["disposition"] == "REPLACE_BY_OPERATION":
                self.assertIsNotNone(target, r)
                self.assertIn(target, op_names, r)

    def test_review_schema_complete(self):
        for r in self.records:
            for field in REQUIRED_FIELDS:
                self.assertIn(field, r, f"{r['legacy_skill_id']} missing {field}")

    def test_no_empty_inputs_outputs(self):
        # Required analysis fields that must carry source evidence cannot be left
        # empty. inputs/outputs are populated from the archived SKILL.md body
        # (handling alternate headings Input/Inputs/Inputs (Required) and
        # Output/Outputs/Outputs (Required)/Expected Output); when the source
        # genuinely provides none, the field must carry an explicit UNKNOWN.
        for r in self.records:
            sid = r["legacy_skill_id"]
            self.assertTrue(r["inputs"], f"{sid} has empty inputs")
            self.assertTrue(r["outputs"], f"{sid} has empty outputs")
            for v in r["inputs"]:
                self.assertTrue(str(v).strip(), f"{sid} has a blank inputs entry")
            for v in r["outputs"]:
                self.assertTrue(str(v).strip(), f"{sid} has a blank outputs entry")

    def test_later_reasons_individualized(self):
        later = [r for r in self.records if r["disposition"] == "LATER"]
        self.assertTrue(later)
        for r in later:
            reason = (r.get("reason") or "").strip()
            self.assertTrue(len(reason) >= 20,
                            f"{r['legacy_skill_id']} LATER reason too short/empty")
            # no generic boilerplate
            low = reason.lower()
            self.assertNotIn("not otherwise classified", low)
            self.assertNotEqual(low, "lateral")

    def test_no_bulk_identical_reasons(self):
        from collections import Counter
        counts = Counter((r.get("reason") or "").strip() for r in self.records)
        bulk = {k: v for k, v in counts.items() if v >= 10}
        self.assertEqual(bulk, {}, f"bulk default reasons detected: {bulk}")

    def test_combine_has_canonical_target(self):
        for r in self.records:
            if r["disposition"] == "COMBINE":
                self.assertIsNotNone(r.get("canonical_target"), r["legacy_skill_id"])

    def test_replace_has_operation_evidence(self):
        op_names = {json.loads(f.read_text())["operation_id"]
                    for f in (REPO / "operations" / "catalog").glob("*.json")}
        for r in self.records:
            if r["disposition"] == "REPLACE_BY_OPERATION":
                self.assertIn(r.get("canonical_target"), op_names, r["legacy_skill_id"])
                self.assertTrue(r.get("deterministic_code_available"), r["legacy_skill_id"])

    def test_source_provenance_present(self):
        for r in self.records:
            prov = r.get("source_provenance")
            self.assertTrue(prov, r["legacy_skill_id"])
            self.assertIn(r["legacy_skill_id"], prov)

    def test_progressive_disclosure_metadata_only(self):
        # The discovery index exposes metadata only — never a full body.
        for s in self.index["skills"]:
            self.assertNotIn("body", s)
            self.assertIn("path", s)
            self.assertIn("source_provenance", s)

    def test_operation_backed_skills_reference_operations(self):
        # Skills whose deterministic step is an operation must name it, not
        # re-teach the procedure.
        by_name = {s["name"]: s for s in self.index["skills"]}
        self.assertIn("test.execute", by_name["tdd-execute"]["operations"])
        self.assertIn("test.execute", by_name["test-authoring"]["operations"])
        # PE-ARAYA-2609-C-04: security review is reasoning-only and must NOT
        # drag an irrelevant Git operation via an indirect relation.
        self.assertEqual(by_name["security-review"]["operations"], [])
        self.assertNotIn("git.feature-pr-gate", by_name["security-review"]["operations"])

    def test_wave1_skills_present(self):
        names = {s["name"] for s in self.index["skills"]}
        for n in ("test-authoring", "security-review"):
            self.assertIn(n, names)
            body = (REPO / "skills" / n / "SKILL.md").read_text(encoding="utf-8")
            self.assertGreater(len(body), 200)

    def test_multi_skill_composition(self):
        d = Delegation(str(REPO))
        r = d.resolve("author and run tests and safely publish a fix")
        self.assertGreaterEqual(len(r["skills"]), 2)
        self.assertIn("test-authoring", r["skills"])
        self.assertIn("git-publication", r["skills"])
        self.assertTrue(r["execute_directly"])


if __name__ == "__main__":
    unittest.main()
