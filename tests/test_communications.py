"""Communications contract tests: PostOffice, PonyExpress, Relay handoff."""
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "cli"))

from araya_lib.postoffice import PostOffice  # noqa: E402
from araya_lib.ponyexpress import PonyExpress  # noqa: E402
from araya_lib.relay import Relay  # noqa: E402

# Vocabulary that must NEVER appear in a PostOffice/PonyExpress message schema.
FORBIDDEN = ("disposition", "approve", "approval", "authority", "ledger",
             "verdict", "gate", "binding", "workflow_state")


class PostOfficeTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.po = PostOffice(self.root)

    def test_send_and_read(self):
        m = self.po.send("daneel", "agent", "handoff", "do the thing",
                         message_type="handoff", correlation_id="P123")
        self.assertEqual(m["sender"], "daneel")
        self.assertEqual(m["recipient"], "agent")
        self.assertEqual(m["correlation_id"], "P123")
        self.assertFalse(m["acknowledged"])
        self.assertEqual(self.po.get(m["id"])["id"], m["id"])

    def test_append_only(self):
        self.po.send("a", "b", "one")
        first = self.po.read_all()
        self.po.send("a", "b", "two")
        second = self.po.read_all()
        self.assertEqual(len(second), 2)
        # First message unchanged (append-only: no in-place edit).
        self.assertEqual(second[0]["id"], first[0]["id"])
        self.assertEqual(second[0]["subject"], "one")

    def test_ack_is_appended_not_edited(self):
        m = self.po.send("a", "b", "task")
        ack = self.po.ack(m["id"])
        self.assertIsNotNone(ack)
        self.assertEqual(ack["message_type"], "acknowledgement")
        original = self.po.get(m["id"])
        # The original message is still unacknowledged (no in-place edit).
        self.assertFalse(original["acknowledged"])

    def test_trace_by_correlation(self):
        self.po.send("daneel", "agent", "delegation", correlation_id="P123")
        self.po.send("agent", "daneel", "result", correlation_id="P123")
        self.po.send("x", "y", "unrelated", correlation_id="P999")
        trace = self.po.trace("P123")
        self.assertEqual(len(trace), 2)
        self.assertTrue(all(t["correlation_id"] == "P123" for t in trace))

    def test_no_authority_vocabulary(self):
        m = self.po.send("a", "b", "s")
        schema_text = " ".join(sorted(m.keys()))
        for word in FORBIDDEN:
            self.assertNotIn(word, schema_text)


class PonyExpressTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.pe = PonyExpress(self.root)

    def test_send_preserves_correlation(self):
        m = self.pe.send("daneel", "do X", correlation_id="P123")
        self.assertEqual(m["id"], "P123")
        self.assertEqual(m["sender"], "professor")
        self.assertEqual(m["recipient"], "daneel")

    def test_generated_correlation(self):
        m = self.pe.send("daneel", "do Y")
        self.assertTrue(m["id"].startswith("P-"))

    def test_no_authority_vocabulary(self):
        m = self.pe.send("daneel", "s")
        schema_text = " ".join(sorted(m.keys()))
        for word in FORBIDDEN:
            self.assertNotIn(word, schema_text)


class RelayTest(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.relay = Relay(self.root)

    def test_full_correlation_chain(self):
        # Professor → PonyExpress P123
        pe = PonyExpress(self.root)
        pe.send("daneel", "deliver widget", correlation_id="P123")
        # Daneel → PostOffice handoff A456
        h = self.relay.handoff("daneel", "agent", "P123", "deliver widget")
        # delivery + result
        self.relay.deliver(h["id"])
        self.relay.handoff("agent", "daneel", "P123", "widget delivered")
        trace = self.relay.trace("P123")
        self.assertEqual(len(trace), 3)
        self.assertTrue(all(t["correlation_id"] == "P123" for t in trace))


if __name__ == "__main__":
    unittest.main()
