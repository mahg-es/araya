"""ARAYA CLI — agent-first command surface.

Design properties: stable commands, structured parameters, --json output,
stable exit codes, non-interactive execution, compact output, dry-run where
useful, idempotency where feasible, explicit side-effect metadata, namespaced
commands, and machine-readable capability discovery.

Exit codes: 0 = success, 1 = operation failure (not-passed / not-found),
2 = usage error.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Optional

from . import VERSION, CAPABILITY_FOUNDATION
from .capabilities import Capabilities
from .delegation import Delegation
from .operations import OperationRegistry
from .ponyexpress import PonyExpress
from .postoffice import PostOffice
from .relay import Relay
from .runtime import Cycle, Notifier, Quota, model_context
from .skills import Skills


def _default_root() -> str:
    # cli/araya_lib/cli.py -> parents[2] is the repo (or installed target) root.
    return str(Path(__file__).resolve().parents[2])


def _emit(value: Any, json_mode: bool) -> None:
    if json_mode:
        if hasattr(value, "to_dict"):
            value = value.to_dict()
        sys.stdout.write(json.dumps(value, indent=2, sort_keys=True, default=str) + "\n")
    else:
        sys.stdout.write(_human(value) + "\n")


def _human(value: Any) -> str:
    if isinstance(value, dict):
        if value.get("__op_result__"):
            return _human_operation(value)
        return "\n".join(f"{k}: {v}" for k, v in value.items() if not k.startswith("_"))
    if isinstance(value, list):
        return "\n".join(_human(v) for v in value)
    return str(value)


def _human_operation(r: dict) -> str:
    lines = [f"{r.get('operation_id')} -> {r.get('status')}"]
    for c in r.get("checks", []):
        mark = "PASS" if c.get("passed") else "FAIL"
        lines.append(f"  [{mark}] {c.get('id')}: {c.get('detail', '')}")
    if r.get("blocking_reasons"):
        lines.append("blocking: " + "; ".join(r["blocking_reasons"]))
    if r.get("side_effects"):
        lines.append("side_effects: " + "; ".join(r["side_effects"]))
    return "\n".join(lines)


def _parse_kv(args: list) -> dict:
    out = {}
    for a in args:
        if "=" in a and not a.startswith("--"):
            k, _, v = a.partition("=")
            k = k.replace("-", "_")
            out[k] = v if v not in ("true", "false") else (v == "true")
    return out


def _flag(args: list, name: str, default: Optional[str] = None) -> Optional[str]:
    """Return the value following a --flag (or default)."""
    if name in args:
        i = args.index(name)
        if i + 1 < len(args):
            return args[i + 1]
    return default


def _split_flag(args: list, name: str) -> tuple:
    """Remove a --flag <value> pair from args, returning (value, remaining)."""
    value = None
    remaining = []
    i = 0
    while i < len(args):
        if args[i] == name and i + 1 < len(args):
            value = args[i + 1]
            i += 2
            continue
        remaining.append(args[i])
        i += 1
    return value, remaining


class Cli:
    def __init__(self, root: str, project: str, json_mode: bool):
        self.root = root
        self.project = project
        self.json_mode = json_mode
        self.registry = OperationRegistry(root)
        self.skills = Skills(root)
        self.capabilities = Capabilities(root)
        self.delegation = Delegation(root)

    # ── top-level informational ────────────────────────────────────────────
    def status(self) -> int:
        self.registry.load()
        self.capabilities.load()
        self.skills.load_index()
        core_files = [f for f in ("GPT-CONFIGURATION.md", "K01-FOUNDATION-AUTHORITY-STAGES-ADR-AUTOGOVERNANCE.md")
                      if (Path(self.root) / f).is_file()]
        out = {
            "product": "ARAYA",
            "capability_foundation": CAPABILITY_FOUNDATION,
            "cli_version": VERSION,
            "operations": len(self.registry.list()),
            "skills": len(self.skills.names()),
            "capabilities": len(self.capabilities.list()),
            "core_files_present": len(core_files),
        }
        _emit(out, self.json_mode)
        return 0

    def doctor(self) -> int:
        import shutil
        import subprocess
        checks = {}
        checks["python"] = sys.version.split()[0]
        checks["git"] = shutil.which("git") is not None
        checks["gh"] = shutil.which("gh") is not None
        checks["catalog_load_errors"] = self.registry.load().get("errors", [])
        integrity = subprocess.run(
            ["sha256sum", "-c", "SHA256SUMS.txt"], cwd=self.root,
            capture_output=True, text=True)
        checks["canonical_integrity"] = integrity.returncode == 0
        ok = checks["git"] and checks["gh"] and checks["canonical_integrity"] \
            and not checks["catalog_load_errors"]
        _emit({"passed": ok, "checks": checks}, self.json_mode)
        return 0 if ok else 1

    # ── capabilities ───────────────────────────────────────────────────────
    def capabilities_cmd(self, args: list) -> int:
        self.capabilities.load()
        if args and args[0] == "show":
            cap = self.capabilities.get(args[1]) if len(args) > 1 else None
            if cap is None:
                _emit({"found": False, "capability": args[1] if len(args) > 1 else None},
                      self.json_mode)
                return 1
            _emit(cap, self.json_mode)
            return 0
        _emit(self.capabilities.list(), self.json_mode)
        return 0

    # ── skills ─────────────────────────────────────────────────────────────
    def skills_cmd(self, args: list) -> int:
        self.skills.load_index()
        if not args:
            _emit(self.skills.list(), self.json_mode)
            return 0
        sub = args[0]
        if sub == "list":
            _emit(self.skills.list(), self.json_mode)
            return 0
        if sub == "show":
            if len(args) < 2:
                return _usage("skills show <name>")
            rec = self.skills.get(args[1])
            if rec is None:
                _emit({"found": False, "skill": args[1]}, self.json_mode)
                return 1
            _emit(rec, self.json_mode)
            return 0
        if sub == "resolve":
            if len(args) < 2:
                return _usage("skills resolve <query>")
            _emit(self.skills.resolve(args[1]), self.json_mode)
            return 0
        return _usage("skills [list|show|resolve]")

    # ── operations ─────────────────────────────────────────────────────────
    def operation_cmd(self, args: list) -> int:
        self.registry.load()
        if not args:
            return _usage("operation <list|describe|resolve|execute>")
        sub = args[0]
        if sub == "list":
            _emit(self.registry.list(), self.json_mode)
            return 0
        if sub == "describe":
            if len(args) < 2:
                return _usage("operation describe <id>")
            d = self.registry.describe(args[1])
            if d is None:
                _emit({"found": False, "operation_id": args[1]}, self.json_mode)
                return 1
            _emit(d, self.json_mode)
            return 0
        if sub == "resolve":
            if len(args) < 2:
                return _usage("operation resolve <query>")
            _emit(self.registry.resolve(" ".join(args[1:])), self.json_mode)
            return 0
        if sub == "execute":
            if len(args) < 2:
                return _usage("operation execute <id> [key=value ...]")
            try:
                result = self.registry.execute(args[1], _parse_kv(args[2:]))
            except ValueError as e:
                _emit({"passed": False, "error": str(e)}, self.json_mode)
                return 1
            payload = result.to_dict()
            payload["__op_result__"] = True
            _emit(payload, self.json_mode)
            return 0 if result.passed else 1
        return _usage("operation <list|describe|resolve|execute>")

    # ── git operations (namespaced shortcuts) ──────────────────────────────
    def git_cmd(self, args: list) -> int:
        self.registry.load()
        if not args:
            return _usage("git <sanity|merge-gate|feature-pr-gate|feature-start>")
        sub = args[0]
        repo = _flag(args, "--repo", default=self.project) or self.project
        if sub == "sanity":
            result = self.registry.execute("git.repository-sanity", {"repo": repo})
            return self._emit_result(result)
        if sub == "merge-gate":
            pr = _flag(args, "--pr")
            candidate = _flag(args, "--candidate")
            if not pr or not candidate:
                return _usage("git merge-gate --pr <n> --candidate <sha> [--base <b>] "
                              "[--evidence-commit <sha>] [--repo <path>]")
            kwargs = {"repo": repo, "pr": pr, "candidate": candidate}
            base = _flag(args, "--base")
            if base:
                kwargs["base"] = base
            ev = _flag(args, "--evidence-commit")
            if ev:
                kwargs["evidence_commit"] = ev
            result = self.registry.execute("git.merge-gate", kwargs)
            return self._emit_result(result)
        if sub == "feature-pr-gate":
            kwargs = {"repo": repo}
            base = _flag(args, "--base")
            if base:
                kwargs["base"] = base
            result = self.registry.execute("git.feature-pr-gate", kwargs)
            return self._emit_result(result)
        if sub == "feature-start":
            name = _flag(args, "--name")
            authorized = _flag(args, "--authorized-root")
            dry_run = "--dry-run" in args
            if not name or not authorized:
                return _usage("git feature-start --name <n> --authorized-root <path> "
                              "[--base <b>] [--dry-run] [--repo <path>]")
            kwargs = {"repo": repo, "name": name,
                      "authorized_worktree_root": authorized, "dry_run": dry_run}
            base = _flag(args, "--base")
            if base:
                kwargs["base"] = base
            result = self.registry.execute("git.feature-start", kwargs)
            return self._emit_result(result)
        return _usage("git <sanity|merge-gate|feature-pr-gate|feature-start>")

    def _emit_result(self, result) -> int:
        payload = result.to_dict()
        payload["__op_result__"] = True
        _emit(payload, self.json_mode)
        return 0 if result.passed else 1

    # ── postoffice ─────────────────────────────────────────────────────────
    def postoffice_cmd(self, args: list) -> int:
        po = PostOffice(self.project)
        if not args:
            return _usage("postoffice <send|list|read|ack|trace>")
        sub = args[0]
        if sub == "send":
            sender = _flag(args, "--sender") or "daneel"
            recipient = _flag(args, "--recipient")
            subject = _flag(args, "--subject")
            if not recipient or not subject:
                return _usage("postoffice send --recipient <r> --subject <s> "
                              "[--sender <s>] [--body <b>] [--type <t>] [--correlation <c>]")
            _emit(po.send(sender, recipient, subject,
                          body=_flag(args, "--body") or "",
                          message_type=_flag(args, "--type") or "note",
                          correlation_id=_flag(args, "--correlation")), self.json_mode)
            return 0
        if sub == "list":
            _emit(po.read_all(), self.json_mode)
            return 0
        if sub == "read":
            if len(args) < 2:
                return _usage("postoffice read <message-id>")
            m = po.get(args[1])
            if m is None:
                _emit({"found": False, "id": args[1]}, self.json_mode)
                return 1
            _emit(m, self.json_mode)
            return 0
        if sub == "ack":
            if len(args) < 2:
                return _usage("postoffice ack <message-id>")
            a = po.ack(args[1])
            if a is None:
                _emit({"found": False, "id": args[1]}, self.json_mode)
                return 1
            _emit(a, self.json_mode)
            return 0
        if sub == "trace":
            if len(args) < 2:
                return _usage("postoffice trace <correlation-id>")
            _emit(po.trace(args[1]), self.json_mode)
            return 0
        return _usage("postoffice <send|list|read|ack|trace>")

    # ── ponyexpress ────────────────────────────────────────────────────────
    def ponyexpress_cmd(self, args: list) -> int:
        pe = PonyExpress(self.project)
        if not args:
            return _usage("ponyexpress <send|list|read|trace>")
        sub = args[0]
        if sub == "send":
            recipient = _flag(args, "--recipient")
            subject = _flag(args, "--subject")
            if not recipient or not subject:
                return _usage("ponyexpress send --recipient <r> --subject <s> "
                              "[--body <b>] [--correlation <c>] [--sender <s>]")
            _emit(pe.send(recipient, subject,
                          body=_flag(args, "--body") or "",
                          sender=_flag(args, "--sender") or "professor",
                          correlation_id=_flag(args, "--correlation")), self.json_mode)
            return 0
        if sub == "list":
            _emit(pe.read_all(), self.json_mode)
            return 0
        if sub == "read":
            if len(args) < 2:
                return _usage("ponyexpress read <instruction-id>")
            m = pe.get(args[1])
            if m is None:
                _emit({"found": False, "id": args[1]}, self.json_mode)
                return 1
            _emit(m, self.json_mode)
            return 0
        if sub == "trace":
            # PonyExpress trace = relay trace over the same correlation id.
            if len(args) < 2:
                return _usage("ponyexpress trace <correlation-id>")
            _emit(Relay(self.project).trace(args[1]), self.json_mode)
            return 0
        return _usage("ponyexpress <send|list|read|trace>")

    # ── relay (L07 handoff only) ───────────────────────────────────────────
    def relay_cmd(self, args: list) -> int:
        relay = Relay(self.project)
        if not args:
            return _usage("relay <handoff|deliver|ack|trace>")
        sub = args[0]
        if sub == "handoff":
            sender = _flag(args, "--sender") or "daneel"
            recipient = _flag(args, "--recipient")
            instruction = _flag(args, "--instruction")
            subject = _flag(args, "--subject")
            if not recipient or not instruction or not subject:
                return _usage("relay handoff --recipient <r> --instruction <correlation-id> "
                              "--subject <s> [--sender <s>] [--body <b>]")
            _emit(relay.handoff(sender, recipient, instruction, subject,
                                body=_flag(args, "--body") or ""), self.json_mode)
            return 0
        if sub == "deliver":
            if len(args) < 2:
                return _usage("relay deliver <message-id>")
            d = relay.deliver(args[1])
            if d is None:
                _emit({"found": False, "id": args[1]}, self.json_mode)
                return 1
            _emit(d, self.json_mode)
            return 0
        if sub == "ack":
            if len(args) < 2:
                return _usage("relay ack <message-id>")
            a = relay.ack(args[1])
            if a is None:
                _emit({"found": False, "id": args[1]}, self.json_mode)
                return 1
            _emit(a, self.json_mode)
            return 0
        if sub == "trace":
            if len(args) < 2:
                return _usage("relay trace <correlation-id>")
            _emit(relay.trace(args[1]), self.json_mode)
            return 0
        return _usage("relay <handoff|deliver|ack|trace>")

    # ── runtime utilities ──────────────────────────────────────────────────
    def runtime_cmd(self, args: list) -> int:
        if not args:
            return _usage("runtime <model-context|quota|cycle|notify>")
        sub = args[0]
        if sub == "model-context":
            _emit(model_context(), self.json_mode)
            return 0
        if sub == "quota":
            q = Quota(self.project)
            act = args[1] if len(args) > 1 else "guard"
            if act == "record":
                amount = _flag(args, "--amount")
                if amount is None:
                    return _usage("runtime quota record --amount <n> [--unit tokens] [--label x]")
                _emit(q.record(int(amount),
                               unit=_flag(args, "--unit") or "tokens",
                               label=_flag(args, "--label") or ""), self.json_mode)
                return 0
            if act == "used":
                _emit({"used": q.used()}, self.json_mode)
                return 0
            limit = _flag(args, "--limit")
            if limit is None:
                return _usage("runtime quota guard --limit <n>")
            g = q.guard(int(limit))
            _emit(g, self.json_mode)
            return 0 if g["within_limit"] else 1
        if sub == "cycle":
            act = args[1] if len(args) > 1 else "start"
            c = Cycle(self.project)
            if act == "start":
                name = _flag(args, "--name") or "cycle"
                _emit(c.start(name), self.json_mode)
                return 0
            if act == "end":
                token = _flag(args, "--token")
                if token is None:
                    return _usage("runtime cycle end --token <token>")
                r = c.end(token)
                _emit(r, self.json_mode)
                return 0 if "error" not in r else 1
            return _usage("runtime cycle <start|end>")
        if sub == "notify":
            event = _flag(args, "--event")
            if event is None:
                return _usage("runtime notify --event <name> [--payload '<json>']")
            payload = {}
            raw = _flag(args, "--payload")
            if raw:
                try:
                    payload = json.loads(raw)
                except json.JSONDecodeError:
                    return _usage("runtime notify: --payload must be valid JSON")
            _emit(Notifier(self.project).notify(event, payload), self.json_mode)
            return 0
        return _usage("runtime <model-context|quota|cycle|notify>")

    # ── delegation ─────────────────────────────────────────────────────────
    def delegate_cmd(self, args: list) -> int:
        if not args:
            return _usage("delegate <run|result> ...")
        if args[0] == "run":
            return self._delegate_run(args[1:])
        if args[0] == "result":
            return self._delegate_result(args[1:])
        # Default (no subcommand): resolve + compose only (dry spec).
        task = " ".join(args)
        resolved = self.delegation.resolve(task)
        agent = self.delegation.compose_ephemeral_agent(task)
        _emit({"resolution": resolved, "ephemeral_agent": agent}, self.json_mode)
        return 0

    def _delegate_run(self, args: list) -> int:
        """Adapter boundary for native subagent execution: resolve + compose a
        scoped worker request, record the PostOffice handoff (delegation), and
        emit the worker request so the agent-facing caller can invoke the host's
        native subagent with it. No orchestration is performed here."""
        correlation, task_args = _split_flag(args, "--correlation")
        task = " ".join(task_args).strip()
        if not task:
            return _usage("delegate run [--correlation <id>] <task...>")
        req = self.delegation.compose_worker_request(task, correlation_id=correlation)
        po = PostOffice(self.project)
        handoff = po.send(
            sender="daneel",
            recipient=req["worker_name"],
            subject=f"delegation: {task}",
            body=json.dumps({
                "skills": req["skills"],
                "operations": req["operations"],
            }, sort_keys=True),
            message_type="delegation",
            correlation_id=req["correlation_id"],
        )
        req["handoff_message_id"] = handoff["id"]
        req["worker_prompt"] = self.delegation.worker_prompt(req)
        _emit(req, self.json_mode)
        return 0

    def _delegate_result(self, args: list) -> int:
        """Record the worker's returned result into PostOffice and emit the
        correlation trace as the structured result."""
        correlation = _flag(args, "--correlation")
        worker = _flag(args, "--worker")
        status = _flag(args, "--status") or "PASS"
        body = _flag(args, "--body") or ""
        if not correlation or not worker:
            return _usage("delegate result --correlation <id> --worker <name> "
                          "[--status PASS|FAIL] [--body <text>]")
        po = PostOffice(self.project)
        result = po.send(
            sender=worker,
            recipient="daneel",
            subject=f"result: {status}",
            body=body,
            message_type="result",
            correlation_id=correlation,
        )
        trace = po.trace(correlation)
        _emit({
            "correlation_id": correlation,
            "worker": worker,
            "status": status,
            "result_message_id": result["id"],
            "trace": trace,
        }, self.json_mode)
        return 0 if status == "PASS" else 1


def _usage(hint: str) -> int:
    sys.stderr.write(f"usage error: {hint}\n")
    return 2


def _parse_global(argv: list) -> tuple:
    json_mode = "--json" in argv
    root = None
    project = None
    rest = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--json":
            i += 1
            continue
        if a == "--root":
            if i + 1 >= len(argv):
                return None, None, None, argv, 2
            root = argv[i + 1]
            i += 2
            continue
        if a == "--project":
            if i + 1 >= len(argv):
                return None, None, None, argv, 2
            project = argv[i + 1]
            i += 2
            continue
        rest.append(a)
        i += 1
    return root, project, json_mode, rest, 0


def main(argv: Optional[list] = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    root, project, json_mode, rest, err = _parse_global(argv)
    if err:
        return _usage("invalid global flags")

    root = root or _default_root()
    project = project or str(Path.cwd())

    if not rest or rest[0] in ("-h", "--help", "help"):
        sys.stdout.write(_help_text())
        return 0

    cli = Cli(root=root, project=project, json_mode=json_mode)
    cmd = rest[0]
    args = rest[1:]

    dispatch = {
        "status": cli.status,
        "doctor": cli.doctor,
        "capabilities": lambda: cli.capabilities_cmd(args),
        "skills": lambda: cli.skills_cmd(args),
        "operation": lambda: cli.operation_cmd(args),
        "git": lambda: cli.git_cmd(args),
        "postoffice": lambda: cli.postoffice_cmd(args),
        "ponyexpress": lambda: cli.ponyexpress_cmd(args),
        "relay": lambda: cli.relay_cmd(args),
        "runtime": lambda: cli.runtime_cmd(args),
        "delegate": lambda: cli.delegate_cmd(args),
    }
    fn = dispatch.get(cmd)
    if fn is None:
        sys.stderr.write(f"unknown command: {cmd}\n{_help_text()}")
        return 2
    return fn()


def _help_text() -> str:
    return """ARAYA CLI (agent-first)

Usage:
  araya [--json] [--root DIR] [--project DIR] <command>

Commands:
  status                                  product/capability summary
  doctor                                  environment + integrity diagnostics
  capabilities [show <id>]                list capability registry
  skills list|show <name>|resolve <q>     progressive-disclosure skills
  operation list|describe <id>|resolve <q>|execute <id> [k=v...]
  git sanity [--repo PATH]
  git merge-gate --pr N --candidate SHA [--base B] [--evidence-commit SHA]
  git feature-pr-gate [--base B] [--repo PATH]
  git feature-start --name N --authorized-root PATH [--base B] [--dry-run]
  postoffice send|list|read|ack|trace
  ponyexpress send|list|read|trace
  relay handoff|deliver|ack|trace
  runtime model-context|quota|cycle|notify
  delegate <task...>                      resolve + compose ephemeral agent (dry spec)
  delegate run [--correlation <id>] <task...>   handoff + worker request (native subagent)
  delegate result --correlation <id> --worker <name> [--status PASS|FAIL] [--body <text>]

Exit codes: 0 success, 1 operation failure, 2 usage error.
"""


if __name__ == "__main__":
    sys.exit(main())
