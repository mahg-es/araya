#!/usr/bin/env python3
"""Regression tests for REQ-024 Slice 1 — session identity (criteria 1-2)."""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "src"))

import postoffice_loop  # noqa: E402
import session_identity as si  # noqa: E402


class SessionIdentityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / ".git").mkdir()
        si.repo_root = lambda: self.root  # type: ignore[method-assign]

    def tearDown(self) -> None:
        si.repo_root = si.__dict__["repo_root"]  # restore original
        self.tempdir.cleanup()

    def test_session_id_is_stable(self) -> None:
        s1 = si.write_session(self.root, agent_name="Daneel", agent_role="exec",
                              scope="portfolio", project="test", repository="r",
                              runtime="pi", provider="p", model="m")
        s2 = si.read_session(self.root)
        self.assertEqual(s1["session_id"], s2["session_id"])

    def test_ensure_session_is_idempotent(self) -> None:
        s1 = si.ensure_session(self.root, agent_name="Daneel", agent_role="exec",
                               scope="portfolio", project="test", repository="r",
                               runtime="pi", provider="p", model="m")
        s2 = si.ensure_session(self.root, agent_name="Daneel", agent_role="exec",
                               scope="portfolio", project="test", repository="r",
                               runtime="pi", provider="p", model="m")
        self.assertEqual(s1["session_id"], s2["session_id"])
        self.assertEqual(s2["operational_status"], "active")

    def test_missing_file_raises_not_found(self) -> None:
        with self.assertRaises(si.SessionIdentityError) as exc:
            si.read_session(self.root)
        self.assertEqual(exc.exception.code, "NotFound")

    def test_read_none_returns_none_missing(self) -> None:
        self.assertIsNone(si.read_session_or_none(self.root))

    def test_read_none_returns_none_corrupt(self) -> None:
        sp = si.session_path(self.root)
        sp.parent.mkdir(parents=True)
        sp.write_text("not json", encoding="utf-8")
        self.assertIsNone(si.read_session_or_none(self.root))

    def test_validation_rejects_missing_required(self) -> None:
        sp = si.session_path(self.root)
        sp.parent.mkdir(parents=True)
        sp.write_text('{"session_id": "x"}\n', encoding="utf-8")
        with self.assertRaises(si.SessionIdentityError) as exc:
            si.read_session(self.root)
        self.assertEqual(exc.exception.code, "ValidationFailure")
        self.assertIn("missing required fields", exc.exception.message)

    def test_validation_rejects_bad_type(self) -> None:
        si.write_session(self.root, agent_name="D", agent_role="exec",
                         scope="portfolio", project="test", repository="r",
                         runtime="pi", provider="p", model="m",
                         declared_capabilities="not-a-list")  # type: ignore[arg-type]
        # declared_capabilities should reject non-list after validation
        # But write_session does not validate on write — it serializes.
        # read_session validates.
        with self.assertRaises(si.SessionIdentityError) as exc:
            si.read_session(self.root)
        self.assertIn("expected list", exc.exception.message.lower())

    def test_validation_rejects_empty_session_id(self) -> None:
        sp = si.session_path(self.root)
        sp.parent.mkdir(parents=True)
        sp.write_text(json.dumps({
            "session_id": "",
            "agent_name": "D", "agent_role": "exec",
            "scope": "portfolio", "project": "test", "repository": "r",
            "runtime": "pi", "provider": "p", "model": "m",
        }) + "\n", encoding="utf-8")
        with self.assertRaises(si.SessionIdentityError):
            si.read_session(self.root)

    def test_validation_rejects_bad_status(self) -> None:
        sp = si.session_path(self.root)
        sp.parent.mkdir(parents=True)
        sp.write_text(json.dumps({
            "session_id": "abc", "operational_status": "sleeping",
            "agent_name": "D", "agent_role": "exec",
            "scope": "portfolio", "project": "test", "repository": "r",
            "runtime": "pi", "provider": "p", "model": "m",
        }) + "\n", encoding="utf-8")
        with self.assertRaises(si.SessionIdentityError) as exc:
            si.read_session(self.root)
        self.assertIn("operational_status", exc.exception.message)

    def test_touch_activity_updates_timestamp(self) -> None:
        si.write_session(self.root, agent_name="D", agent_role="exec",
                         scope="portfolio", project="test", repository="r",
                         runtime="pi", provider="p", model="m")
        old = si.read_session(self.root)["last_activity_at"]
        import time
        time.sleep(1.1)  # ensure timestamp changes
        si.touch_activity(si.session_path(self.root))
        new = si.read_session(self.root)["last_activity_at"]
        self.assertNotEqual(old, new)

    def test_frontmatter_helper_no_session(self) -> None:
        fm = si.session_identity_for_frontmatter(self.root)
        self.assertEqual(fm, {})

    def test_frontmatter_helper_with_session(self) -> None:
        si.write_session(self.root, agent_name="Daneel", agent_role="exec",
                         scope="portfolio", project="apc", repository="r",
                         runtime="pi.dev", provider="moonshotai", model="kimi-k3")
        fm = si.session_identity_for_frontmatter(self.root)
        self.assertIn("from_session_id", fm)
        self.assertIn("from_session_metadata", fm)
        meta = json.loads(fm["from_session_metadata"])
        self.assertEqual(meta["agent_name"], "Daneel")
        self.assertEqual(fm["from_session_id"], meta["session_id"])

    def test_session_json_has_all_metadata_slots(self) -> None:
        """Criterion 2: session publishes all required metadata."""
        s = si.write_session(
            self.root,
            agent_name="Daneel", agent_role="execution_agent",
            scope="portfolio", project="araya-project-coordinator",
            repository="git@github.com:mahg-es/araya-portfolio.git",
            runtime="pi.dev", provider="moonshotai", model="kimi-k3",
            capability_tier="medium",
            declared_capabilities=["code", "postoffice", "git"],
            known_constraints=["128k context"],
        )
        expected = {"agent_name", "agent_role", "scope", "project", "repository",
                    "runtime", "provider", "model", "capability_tier",
                    "operational_status", "started_at", "last_activity_at",
                    "declared_capabilities", "known_constraints", "session_id"}
        self.assertTrue(expected.issubset(set(s.keys())),
                        f"missing: {expected - set(s.keys())}")


class PostOfficeIntegrationTests(unittest.TestCase):
    """Integration: create_message picks up session identity from .araya/session.json."""

    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / ".git").mkdir()
        po = self.root / ".araya" / "postoffice"
        for folder in ("inbox", "outbox", "archive"):
            (po / folder).mkdir(parents=True, exist_ok=True)
        (po / "thread.md").write_text("thread\n", encoding="utf-8")
        (po / "index.jsonl").write_text("", encoding="utf-8")
        self._orig_po = postoffice_loop.repo_root
        self._orig_si = si.repo_root
        postoffice_loop.repo_root = lambda: self.root
        si.repo_root = lambda: self.root

    def tearDown(self) -> None:
        postoffice_loop.repo_root = self._orig_po
        si.repo_root = self._orig_si
        self.tempdir.cleanup()

    def test_create_message_without_session(self) -> None:
        """Backward compatibility: no session.json -> from_session_id is null."""
        result = postoffice_loop.create_message(
            from_actor="Giskard", to="Daneel",
            subject="test no session", body="Body.",
            model="test", model_source="test",
        )
        path = self.root / result["path"]
        meta, _body = postoffice_loop.read_frontmatter(path)
        self.assertIsNone(meta.get("from_session_id"))
        self.assertIsNone(meta.get("from_session_metadata"))

    def test_create_message_with_session(self) -> None:
        """With session.json -> from_session_id + metadata injected (criteria 1-2)."""
        si.write_session(
            self.root,
            agent_name="Daneel", agent_role="execution_agent",
            scope="portfolio", project="araya-project-coordinator",
            repository="gh:mahg-es/apc", runtime="pi.dev",
            provider="moonshotai", model="kimi-k3",
        )
        result = postoffice_loop.create_message(
            from_actor="Daneel", to="Giskard",
            subject="test with session", body="Body.\n",
            model="kimi-k3", model_source="tool-reported",
        )
        path = self.root / result["path"]
        meta, _body = postoffice_loop.read_frontmatter(path)
        self.assertIsNotNone(meta.get("from_session_id"))
        self.assertIsNotNone(meta.get("from_session_metadata"))
        meta_json = json.loads(meta["from_session_metadata"])  # type: ignore[arg-type]
        self.assertEqual(meta_json["agent_name"], "Daneel")
        self.assertEqual(meta["from_session_id"], meta_json["session_id"])


class RegistryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / ".git").mkdir()
        self._orig_si = si.repo_root
        si.repo_root = lambda: self.root  # type: ignore[method-assign]

    def tearDown(self) -> None:
        si.repo_root = self._orig_si
        self.tempdir.cleanup()

    def _create_session(self, **overrides):
        kwargs = dict(agent_name="Daneel", agent_role="exec",
                      scope="portfolio", project="apc", repository="r",
                      runtime="pi", provider="moonshotai", model="kimi-k3")
        kwargs.update(overrides)
        return si.write_session(self.root, **kwargs)

    def test_empty_registry_returns_empty(self) -> None:
        reg = si.list_registry(self.root)
        self.assertEqual(reg, {})

    def test_register_session_appears_in_registry(self) -> None:
        s = self._create_session()
        si.register_in_registry(s, self.root)
        reg = si.list_registry(self.root)
        self.assertIn(s["session_id"], reg["sessions"])
        self.assertEqual(reg["sessions"][s["session_id"]]["agent_name"], "Daneel")

    def test_register_current_session(self) -> None:
        self._create_session()
        entry = si.register_current_session(self.root)
        self.assertIsNotNone(entry)
        reg = si.list_registry(self.root)
        self.assertEqual(len(reg["sessions"]), 1)

    def test_register_preserves_first_seen(self) -> None:
        s = self._create_session()
        first = si.register_in_registry(s, self.root)
        # Re-register
        import time; time.sleep(1.5)
        second = si.register_in_registry(s, self.root)
        # first_seen_at unchanged, last_registered_at updated
        self.assertEqual(first["first_registered_at"], second["first_registered_at"])
        self.assertNotEqual(first["last_registered_at"], second["last_registered_at"])

    def test_multiple_sessions_in_registry(self) -> None:
        s1 = self._create_session()
        s2 = self._create_session()  # different session_id (new UUID)
        si.register_in_registry(s1, self.root)
        si.register_in_registry(s2, self.root)
        reg = si.list_registry(self.root)
        self.assertEqual(len(reg["sessions"]), 2)

    def test_available_filters_out_closed(self) -> None:
        s1 = self._create_session()
        s2 = self._create_session()
        si.register_in_registry(s1, self.root)
        s2["operational_status"] = "closed"
        si.register_in_registry(s2, self.root)
        available = si.available_sessions(self.root)
        self.assertEqual(len(available), 1)
        self.assertEqual(available[0]["session_id"], s1["session_id"])

    def test_available_filters_by_scope(self) -> None:
        s1 = self._create_session(scope="portfolio")
        s2 = self._create_session(scope="project")
        si.register_in_registry(s1, self.root)
        si.register_in_registry(s2, self.root)
        available = si.available_sessions(self.root, scope="project")
        self.assertEqual(len(available), 1)
        self.assertEqual(available[0]["session_id"], s2["session_id"])

    def test_available_filters_by_tier(self) -> None:
        s1 = self._create_session(capability_tier="high")
        s2 = self._create_session(capability_tier="medium")
        si.register_in_registry(s1, self.root)
        si.register_in_registry(s2, self.root)
        available = si.available_sessions(self.root, capability_tier="high")
        self.assertEqual(len(available), 1)
        self.assertEqual(available[0]["session_id"], s1["session_id"])


class RoutingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / ".git").mkdir()
        self._orig_si = si.repo_root
        si.repo_root = lambda: self.root  # type: ignore[method-assign]
        # Pre-create sessions in registry
        self.s_high = si.write_session(self.root, agent_name="Daneel", agent_role="exec",
                                        scope="portfolio", project="apc", repository="r",
                                        runtime="pi", provider="moonshotai", model="kimi-k3",
                                        capability_tier="high")
        self.s_med = si.write_session(self.root, agent_name="Daneel", agent_role="exec",
                                       scope="project", project="tmahg", repository="r2",
                                       runtime="claude", provider="anthropic", model="sonnet",
                                       capability_tier="medium")
        si.register_in_registry(self.s_high, self.root)
        si.register_in_registry(self.s_med, self.root)

    def tearDown(self) -> None:
        si.repo_root = self._orig_si
        self.tempdir.cleanup()

    def test_select_exact_match_tier_and_scope(self) -> None:
        s = si.select_session(self.root, capability_tier="high", scope="portfolio")
        self.assertIsNotNone(s)
        self.assertEqual(s["session_id"], self.s_high["session_id"])

    def test_select_exact_match_tier_scope_and_role(self) -> None:
        s = si.select_session(self.root, capability_tier="high", scope="portfolio", agent_role="exec")
        self.assertIsNotNone(s)
        self.assertEqual(s["session_id"], self.s_high["session_id"])

    def test_select_fallback_when_scope_mismatch(self) -> None:
        # No high/project combo — should fall back to any high
        s = si.select_session(self.root, capability_tier="high", scope="project")
        self.assertIsNotNone(s)
        self.assertEqual(s["capability_tier"], "high")

    def test_select_returns_none_when_no_match(self) -> None:
        s = si.select_session(self.root, capability_tier="low")
        self.assertIsNone(s)

    def test_to_session_id_in_message_frontmatter(self) -> None:
        """postoffice_loop.create_message injects to_session_id when provided."""
        po = self.root / ".araya" / "postoffice"
        for f in ("inbox", "outbox", "archive"):
            (po / f).mkdir(parents=True)
        (po / "thread.md").write_text("t\n")
        (po / "index.jsonl").write_text("")
        orig_po = postoffice_loop.repo_root
        postoffice_loop.repo_root = lambda: self.root
        try:
            result = postoffice_loop.create_message(
                from_actor="Giskard", to="Daneel",
                subject="routed", body="Body.",
                model="test", model_source="test",
                to_session_id=self.s_high["session_id"],
            )
            path = self.root / result["path"]
            meta, _ = postoffice_loop.read_frontmatter(path)
            self.assertEqual(meta["to_session_id"], self.s_high["session_id"])
        finally:
            postoffice_loop.repo_root = orig_po


if __name__ == "__main__":
    unittest.main()
