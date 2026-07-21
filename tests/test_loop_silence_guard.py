#!/usr/bin/env python3
"""Regression tests for the REQ-025 loop silence guard.

Covers the full escalation cycle Giskard required:
2 empties -> ASK (once), 2 more empties -> STOP + pause signal (never delete).
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "src"))

import loop_silence_guard as guard  # noqa: E402


class GuardTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        (self.root / ".git").mkdir()
        self.counter = self.root / ".pi" / "loop-silence-count"

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def run_cycle(self, pending: int = 0, **kwargs):
        return guard.run_guard(
            self.root,
            to_role="daneel",
            counter_path=self.counter,
            pending_fn=lambda: pending,
            **kwargs,
        )


class VerdictCycleTests(GuardTestCase):
    def test_first_empty_is_silent(self) -> None:
        result = self.run_cycle(pending=0)
        self.assertEqual(result["verdict"], "EMPTY")
        self.assertEqual(result["silence_count"], 1)
        self.assertFalse(result["action"]["ask"])
        self.assertFalse(result["action"]["pause"])
        self.assertFalse(result["action"]["delete"])

    def test_second_empty_asks_once(self) -> None:
        self.run_cycle(pending=0)
        result = self.run_cycle(pending=0)
        self.assertEqual(result["verdict"], "ASK")
        self.assertEqual(result["silence_count"], 2)
        self.assertTrue(result["action"]["ask"])
        self.assertFalse(result["action"]["pause"])

    def test_third_empty_waits_without_repeating_ask(self) -> None:
        for _ in range(2):
            self.run_cycle(pending=0)
        result = self.run_cycle(pending=0)
        self.assertEqual(result["verdict"], "WAIT")
        self.assertEqual(result["silence_count"], 3)
        self.assertFalse(result["action"]["ask"])
        self.assertFalse(result["action"]["pause"])

    def test_fourth_empty_stops_with_pause_never_delete(self) -> None:
        for _ in range(3):
            self.run_cycle(pending=0)
        result = self.run_cycle(pending=0)
        self.assertEqual(result["verdict"], "STOP")
        self.assertEqual(result["silence_count"], 4)
        self.assertTrue(result["action"]["pause"])
        self.assertTrue(result["action"]["notify"])
        self.assertFalse(result["action"]["delete"])

    def test_further_empties_keep_stop_verdict(self) -> None:
        for _ in range(4):
            self.run_cycle(pending=0)
        result = self.run_cycle(pending=0)
        self.assertEqual(result["verdict"], "STOP")
        self.assertEqual(result["silence_count"], 5)
        self.assertTrue(result["action"]["pause"])
        self.assertFalse(result["action"]["delete"])

    def test_full_req025_cycle_two_ask_then_two_stop(self) -> None:
        """The exact acceptance cycle: 2 empties -> ASK, 2 more -> STOP+pause."""
        r1 = self.run_cycle(pending=0)
        r2 = self.run_cycle(pending=0)
        r3 = self.run_cycle(pending=0)
        r4 = self.run_cycle(pending=0)
        self.assertEqual((r1["verdict"], r2["verdict"], r3["verdict"], r4["verdict"]),
                         ("EMPTY", "ASK", "WAIT", "STOP"))
        self.assertTrue(r2["action"]["ask"])
        self.assertTrue(r4["action"]["pause"])
        self.assertFalse(r4["action"]["delete"])

    def test_messages_reset_counter_to_zero(self) -> None:
        for _ in range(3):
            self.run_cycle(pending=0)
        result = self.run_cycle(pending=2)
        self.assertEqual(result["verdict"], "MESSAGES")
        self.assertEqual(result["silence_count"], 0)
        self.assertEqual(result["pending_count"], 2)
        self.assertEqual(self.counter.read_text().strip(), "0")
        # Next empty restarts the cycle from 1
        follow = self.run_cycle(pending=0)
        self.assertEqual(follow["verdict"], "EMPTY")
        self.assertEqual(follow["silence_count"], 1)

    def test_delete_signal_is_never_emitted(self) -> None:
        results = [self.run_cycle(pending=0) for _ in range(6)]
        results.append(self.run_cycle(pending=5))
        for result in results:
            self.assertFalse(result["action"]["delete"], result["verdict"])


class CounterFileTests(GuardTestCase):
    def test_counter_file_is_created_under_pi_dir(self) -> None:
        self.assertFalse(self.counter.exists())
        self.run_cycle(pending=0)
        self.assertTrue(self.counter.exists())
        self.assertEqual(self.counter.parent.name, ".pi")

    def test_counter_persists_across_calls(self) -> None:
        self.run_cycle(pending=0)
        self.assertEqual(self.counter.read_text().strip(), "1")
        self.run_cycle(pending=0)
        self.assertEqual(self.counter.read_text().strip(), "2")

    def test_corrupt_counter_recovers_as_zero(self) -> None:
        self.counter.parent.mkdir(parents=True)
        self.counter.write_text("not-a-number\n", encoding="utf-8")
        self.assertEqual(guard.read_counter(self.counter), 0)
        result = self.run_cycle(pending=0)
        self.assertEqual(result["silence_count"], 1)

    def test_reset_flag_zeroes_counter(self) -> None:
        for _ in range(3):
            self.run_cycle(pending=0)
        result = guard.run_guard(
            self.root, to_role="daneel", counter_path=self.counter, reset=True
        )
        self.assertEqual(result["verdict"], "RESET")
        self.assertEqual(self.counter.read_text().strip(), "0")


class ThresholdTests(GuardTestCase):
    def test_thresholds_are_overridable(self) -> None:
        r1 = self.run_cycle(pending=0, ask_threshold=1, stop_threshold=3)
        self.assertEqual(r1["verdict"], "ASK")
        r2 = self.run_cycle(pending=0, ask_threshold=1, stop_threshold=3)
        r3 = self.run_cycle(pending=0, ask_threshold=1, stop_threshold=3)
        self.assertEqual(r3["verdict"], "STOP")
        self.assertTrue(r3["action"]["pause"])
        self.assertFalse(r3["action"]["delete"])

    def test_invalid_thresholds_raise_validation(self) -> None:
        with self.assertRaises(guard.GuardError) as exc:
            guard.evaluate(0, 0, ask_threshold=4, stop_threshold=4)
        self.assertEqual(exc.exception.code, "ValidationFailure")

    def test_negative_pending_raises_validation(self) -> None:
        with self.assertRaises(guard.GuardError):
            guard.evaluate(-1, 0)


class CliIntegrationTests(GuardTestCase):
    def test_cli_reset_roundtrip(self) -> None:
        script = REPO_ROOT / "src" / "loop_silence_guard.py"
        counter = self.root / "custom-count"
        counter.write_text("3\n", encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(script), "--reset", "--counter", str(counter)],
            cwd=self.root, capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["verdict"], "RESET")
        self.assertEqual(counter.read_text().strip(), "0")


if __name__ == "__main__":
    unittest.main()
