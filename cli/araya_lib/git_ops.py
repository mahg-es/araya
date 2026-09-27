"""Deterministic git operations (recovered from the legacy operations runtime).

Every operation here is a plain, deterministic, explicitly-invoked function.
No operation is looked up before every task, no global preflight is required,
and none of these functions owns authority or durable state.

The merge gate is persona-free: it validates repository truth (base branch,
candidate SHA, remote PR head, mergeability, tests, hygiene) — it does not
consult any agent roster, name sentinel, or authority ledger.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Optional

from .process import git, run, is_hex
from .result import OperationResult, Check, check, build_result, now_iso

# Integration branches are configurable per call; these are only the defaults
# used when a caller does not override them. They are branch *names*, not
# machine paths, and carry no authority.
DEFAULT_INTEGRATION_BRANCHES = ("dev-mahg", "dev-araya-portfolio")

_AI_COAUTHOR_RE = re.compile(
    r"co-authored-by:.*(agent|\bAI\b|gpt|claude|sonia|aurora|daneel|manu|"
    r"teresa|rolando|giskard)",
    re.IGNORECASE,
)


def _integration_branches(input_: dict) -> tuple:
    supplied = input_.get("integration_branches")
    if isinstance(supplied, (list, tuple)):
        return tuple(str(b) for b in supplied)
    return DEFAULT_INTEGRATION_BRANCHES


def _repo(input_: dict, ctx: dict) -> str:
    return str(input_.get("repo") or ctx.get("root") or os.getcwd())


# ── git.repository-sanity ───────────────────────────────────────────────────
def git_repository_sanity(input_: dict, ctx: dict) -> OperationResult:
    started = now_iso()
    root = _repo(input_, ctx)
    authorized_root = input_.get("authorized_worktree_root")

    checks: list[Check] = []
    evidence: list[str] = []

    checks.append(check("repository_exists", (Path(root) / ".git").exists(), root))

    remote = git(root, ["remote", "-v"])
    checks.append(check(
        "remote_exists",
        remote["code"] == 0 and "origin" in remote["stdout"],
        "origin remote configured",
    ))

    branch = git(root, ["branch", "--show-current"]).get("stdout", "").strip()
    detached = git(root, ["rev-parse", "HEAD"]).get("code", 1) == 0
    checks.append(check(
        "branch_known",
        bool(branch) or detached,
        f"branch={branch or 'detached HEAD'}",
    ))

    upstream = git(root, ["rev-parse", "--abbrev-ref", "@{upstream}"])
    checks.append(check(
        "upstream_known",
        upstream["code"] == 0 and bool(upstream["stdout"].strip()),
        upstream["stdout"].strip() or "no upstream",
    ))

    status = git(root, ["status", "--porcelain"])
    dirty = [l for l in status["stdout"].splitlines() if l.strip()]
    evidence.append(f"porcelain entries: {len(dirty)}")

    merging = (Path(root) / ".git" / "MERGE_HEAD").exists()
    rebasing = (Path(root) / ".git" / "rebase-merge").exists() or \
        (Path(root) / ".git" / "rebase-apply").exists()
    checks.append(check(
        "no_merge_rebase_in_progress",
        not merging and not rebasing,
        "MERGE_HEAD" if merging else "rebase" if rebasing else "none",
    ))

    dangerous = [
        f for f in ("RESET_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD")
        if (Path(root) / ".git" / f).exists()
    ]
    checks.append(check(
        "no_dangerous_operation",
        not dangerous,
        ",".join(dangerous) or "none",
    ))

    # Optional, non-hardcoded worktree authorization check: only enforced when
    # the caller supplies an authorized root (never derived from a fixed path).
    if authorized_root:
        wts = git(root, ["worktree", "list", "--porcelain"]).get("stdout", "")
        bad = [
            line[9:] for line in wts.splitlines()
            if line.startswith("worktree ")
            and "/tmp/" not in line
            and not line[9:].startswith(str(authorized_root))
        ]
        checks.append(check(
            "worktrees_within_authorized_root",
            not bad,
            ";".join(bad) or "all worktrees authorized",
        ))

    head = git(root, ["rev-parse", "HEAD"]).get("stdout", "").strip()
    return build_result(
        operation_id="git.repository-sanity",
        version="1.0.0",
        checks=checks,
        subject={"repo": root, "branch": branch},
        evidence=evidence,
        evaluated_sha=head,
        started_at=started,
    )


# ── git.merge-gate ──────────────────────────────────────────────────────────
def git_merge_gate(input_: dict, ctx: dict) -> OperationResult:
    """Predicate: may this PR merge into an integration branch? Does not merge.

    Inputs: repo, pr (number), candidate (sha), base (branch), evidence_commit
    (optional), required_tests (optional list).
    """
    started = now_iso()
    root = _repo(input_, ctx)
    pr = str(input_.get("pr", ""))
    candidate = str(input_.get("candidate", ""))
    expected_base = str(input_.get("base", "dev-mahg"))
    required_tests = input_.get("required_tests") or []
    evidence_commit = input_.get("evidence_commit") or None
    integration = _integration_branches(input_)

    checks: list[Check] = []
    evidence: list[str] = []

    checks.append(check(
        "base_is_integration",
        expected_base in integration,
        f"base={expected_base} (allowed: {', '.join(integration)})",
    ))
    checks.append(check("main_not_target", expected_base != "main",
                        "main target forbidden"))

    cat_type = git(root, ["cat-file", "-t", candidate])
    checks.append(check(
        "candidate_resolves",
        is_hex(candidate) and cat_type["stdout"].strip() == "commit",
        f"candidate={candidate}",
    ))

    remote_head = git(root, ["ls-remote", "origin", f"refs/pull/{pr}/head"])
    remote_sha = remote_head["stdout"].strip().split()[0] if remote_head["stdout"].strip() else ""
    expected_head = str(evidence_commit or candidate)
    short_remote = remote_sha[:12] if remote_sha else ""
    checks.append(check(
        "head_current_remote",
        bool(remote_sha) and (
            remote_sha.startswith(expected_head) or expected_head.startswith(short_remote)
        ),
        f"remote PR head={short_remote or 'unknown'} vs expected={expected_head[:12]}",
    ))

    if evidence_commit:
        diff = git(root, ["diff", "--name-only", f"{candidate}..{evidence_commit}"])
        paths = [p for p in diff["stdout"].splitlines() if p.strip()]
        non_evidence = [p for p in paths if not p.startswith(".araya/runs/")]
        checks.append(check(
            "evidence_only_diff",
            diff["code"] == 0 and not non_evidence,
            non_evidence and f"non-evidence: {','.join(non_evidence)}"
            or f"{len(paths)} evidence path(s)",
            evidence=paths,
        ))

    gh = run("gh", ["pr", "view", pr, "--json", "mergeable,baseRefName,state",
                    "-q", "{m:.mergeable,b:.baseRefName,s:.state}"], root)
    mergeable = False
    base_ok = False
    gh_known = False
    if gh["code"] == 0:
        try:
            j = json.loads(gh["stdout"])
            mergeable = j.get("m") == "MERGEABLE"
            base_ok = j.get("b") == expected_base
            gh_known = True
        except (json.JSONDecodeError, AttributeError):
            gh_known = False
    checks.append(check(
        "pr_mergeable",
        gh_known and mergeable,
        f"mergeable={mergeable}" if gh_known else "gh mergeability unknown (fail closed)",
    ))
    checks.append(check(
        "pr_base_matches",
        gh_known and base_ok,
        f"base={base_ok}" if gh_known else "unknown base (fail closed)",
    ))

    for t in required_tests:
        parts = str(t).split()
        r = run(parts[0], parts[1:], root)
        checks.append(check(f"test:{t}", r["code"] == 0, f"exit={r['code']}"))
        evidence.append(f"test {t} exit={r['code']}")

    msg = git(root, ["log", "-1", "--format=%B", candidate]).get("stdout", "")
    checks.append(check(
        "no_ai_coauthor",
        not _AI_COAUTHOR_RE.search(msg),
        "candidate commit trailers clean",
    ))

    ws = git(root, ["diff", "--check", f"{candidate}^..{candidate}"])
    checks.append(check("diff_check_passes", ws["code"] == 0,
                        ws["stderr"].strip() or "no whitespace errors"))

    evaluated = git(root, ["rev-parse", candidate]).get("stdout", "").strip()
    return build_result(
        operation_id="git.merge-gate",
        version="1.0.0",
        checks=checks,
        subject={"repo": root, "pr": pr, "candidate": candidate, "base": expected_base},
        evidence=evidence,
        evaluated_sha=evaluated,
        started_at=started,
    )


# ── git.feature-pr-gate ─────────────────────────────────────────────────────
def git_feature_pr_gate(input_: dict, ctx: dict) -> OperationResult:
    """Validate a feature branch before creating a PR (read-only)."""
    started = now_iso()
    root = _repo(input_, ctx)
    base = str(input_.get("base", "origin/dev-mahg"))
    required_tests = input_.get("required_tests") or []
    forbidden = input_.get("forbidden_paths") or [".env", "secrets"]
    integration = _integration_branches(input_)
    integration_name = str(input_.get("integration", "dev-mahg"))

    checks: list[Check] = []
    evidence: list[str] = []

    diff = git(root, ["diff", "--name-only", f"{base}...HEAD"])
    files = [f for f in diff["stdout"].splitlines() if f.strip()]
    checks.append(check("diff_exists", diff["code"] == 0 and bool(files),
                        f"{len(files)} files changed"))

    ws = git(root, ["diff", "--check", f"{base}...HEAD"])
    checks.append(check("diff_check_passes", ws["code"] == 0,
                        ws["stderr"].strip() or "no whitespace errors"))

    checks.append(check("base_is_integration", integration_name in integration,
                        f"integration={integration_name}"))
    checks.append(check("not_main_target", integration_name != "main",
                        "main target forbidden"))

    hits = [f for f in files if any(
        fp.lower() in f.lower() for fp in forbidden if fp.lower() != "main")]
    checks.append(check("no_forbidden_paths", not hits,
                        ",".join(hits) or "none"))

    secret_hits = [f for f in files if re.search(
        r"\.(env|pem|key|p12)$|secret|credential", f, re.IGNORECASE)]
    checks.append(check("no_secrets", not secret_hits,
                        ",".join(secret_hits) or "none"))

    for t in required_tests:
        parts = str(t).split()
        r = run(parts[0], parts[1:], root)
        checks.append(check(f"test:{t}", r["code"] == 0, f"exit={r['code']}"))
        evidence.append(f"test {t} exit={r['code']}")

    log = git(root, ["log", "--format=%B", f"{base}..HEAD"]).get("stdout", "")
    checks.append(check("no_ai_coauthor", not _AI_COAUTHOR_RE.search(log),
                        "trailers clean"))

    head = git(root, ["rev-parse", "HEAD"]).get("stdout", "").strip()
    return build_result(
        operation_id="git.feature-pr-gate",
        version="1.0.0",
        checks=checks,
        subject={"repo": root, "base": base, "files_changed": len(files)},
        evidence=evidence,
        evaluated_sha=head,
        started_at=started,
    )


# ── git.feature-start ───────────────────────────────────────────────────────
def git_feature_start(input_: dict, ctx: dict) -> OperationResult:
    """Create an authorized worktree + feature branch from an integration head.

    Supports dry-run (default False; caller must opt in). Preconditions are
    checked before any write.
    """
    started = now_iso()
    repo = _repo(input_, ctx)
    name = str(input_.get("name", ""))
    branch = str(input_.get("branch", f"feature/{name}"))
    base = str(input_.get("base", "origin/dev-mahg"))
    dry_run = bool(input_.get("dry_run", False))
    authorized_root = input_.get("authorized_worktree_root")
    integration = _integration_branches(input_)

    checks: list[Check] = []
    side_effects: list[str] = []

    if not authorized_root:
        checks.append(check(
            "authorized_root_provided", False,
            "authorized_worktree_root is required for git.feature-start",
        ))
        return build_result(operation_id="git.feature-start", version="1.0.0",
                            checks=checks, subject={"repo": repo, "name": name},
                            side_effects=side_effects, started_at=started)

    wt_path = str(Path(authorized_root) / name)
    checks.append(check("worktree_root_authorized",
                        wt_path.startswith(str(authorized_root)), wt_path))
    checks.append(check("no_tmp", "/tmp/" not in wt_path, "no /tmp worktrees"))

    exists_ref = git(repo, ["show-ref", "--verify", "--quiet", f"refs/heads/{branch}"])
    checks.append(check("branch_name_unique", exists_ref["code"] != 0,
                        f"{branch} does not exist as a local ref"))

    wt_exists = Path(wt_path).exists()
    checks.append(check("worktree_path_free", not wt_exists,
                        wt_exists and f"{wt_path} exists" or "path free"))

    fetch = git(repo, ["fetch", "origin", "--prune"])
    checks.append(check("remote_fetched", fetch["code"] == 0,
                        fetch["stderr"].strip() or "fetch ok"))

    base_sha = git(repo, ["rev-parse", base]).get("stdout", "").strip()
    checks.append(check("integration_head_known", is_hex(base_sha),
                        f"{base}={base_sha[:12]}"))

    all_pre = all(c.passed for c in checks)
    if dry_run:
        checks.append(check("dry_run_no_writes", True, "dry-run: nothing written"))
    elif all_pre:
        add = git(repo, ["worktree", "add", wt_path, "-b", branch, base])
        checks.append(check("worktree_created", add["code"] == 0,
                            add["stderr"].strip() or f"created {wt_path}"))
        if add["code"] == 0:
            side_effects.append(
                f"worktree {wt_path} branch {branch} from {base}@{base_sha[:12]}")
    else:
        checks.append(check("feature_start_aborted", False,
                            "preconditions failed — nothing created"))

    return build_result(
        operation_id="git.feature-start",
        version="1.0.0",
        checks=checks,
        subject={"repo": repo, "name": name, "branch": branch, "base": base,
                 "wt_path": wt_path, "dry_run": dry_run},
        side_effects=side_effects,
        evaluated_sha=base_sha,
        started_at=started,
    )


__all__ = [
    "git_repository_sanity",
    "git_merge_gate",
    "git_feature_pr_gate",
    "git_feature_start",
]
