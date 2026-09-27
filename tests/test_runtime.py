"""Runtime utility tests: model-context (read-only), quota, cycle, notifier."""
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "cli"))

from araya_lib.runtime import model_context, Quota, Cycle, Notifier  # noqa: E402


class ModelContextTest(unittest.TestCase):
    def test_read_only_and_structured(self):
        ctx = model_context(env={
            "ARAYA_PROVIDER": "p", "ARAYA_MODEL": "m",
            "ARAYA_REASONING": "high", "ARAYA_SESSION": "s",
        })
        self.assertEqual(ctx["provider"], "p")
        self.assertEqual(ctx["model"], "m")
        self.assertEqual(ctx["reasoning_level"], "high")
        self.assertTrue(ctx["read_only"])

    def test_defaults_to_unknown(self):
        ctx = model_context(env={})
        self.assertEqual(ctx["provider"], "unknown")
        self.assertEqual(ctx["model"], "unknown")


class QuotaTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.quota = Quota(self.root)

    def test_record_and_guard(self):
        self.quota.record(1000)
        self.quota.record(2000)
        self.assertEqual(self.quota.used(), 3000)
        g = self.quota.guard(5000)
        self.assertTrue(g["within_limit"])
        self.assertEqual(g["remaining"], 2000)
        g2 = self.quota.guard(2000)
        self.assertFalse(g2["within_limit"])


class CycleTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.cycle = Cycle(self.root)

    def test_start_and_end(self):
        s = self.cycle.start("demo")
        self.assertIn("token", s)
        e = self.cycle.end(s["token"])
        self.assertIn("duration_seconds", e)
        self.assertGreaterEqual(e["duration_seconds"], 0)

    def test_end_unknown_token(self):
        r = self.cycle.end("bogus")
        self.assertIn("error", r)


class NotifierTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.notifier = Notifier(self.root)

    def test_notify_append_only(self):
        self.notifier.notify("cycle.done", {"n": 1})
        self.notifier.notify("cycle.done", {"n": 2})
        events = self.notifier.log.read_all()
        self.assertEqual(len(events), 2)
        self.assertEqual(events[0]["event"], "cycle.done")
        self.assertEqual(events[1]["payload"], {"n": 2})


if __name__ == "__main__":
    unittest.main()
