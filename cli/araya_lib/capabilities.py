"""Capabilities — a thin registry mapping capabilities to the skills and
deterministic operations that realize them. Capabilities (and skills), not
display names, determine specialization.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from .matching import matches


class Capabilities:
    def __init__(self, root: str):
        self.root = str(root)
        self._data: dict = {}
        self._loaded = False
        self._errors: list[str] = []

    @property
    def index_path(self) -> Path:
        return Path(self.root) / "capabilities" / "index.json"

    def load(self) -> dict:
        self._data = {}
        self._errors = []
        if not self.index_path.is_file():
            self._errors.append(f"capabilities index missing: {self.index_path}")
            self._loaded = True
            return {"loaded": 0, "errors": list(self._errors)}
        try:
            data = json.loads(self.index_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            self._errors.append(f"capabilities index parse error: {e}")
            self._loaded = True
            return {"loaded": 0, "errors": list(self._errors)}
        for cap in data.get("capabilities", []):
            self._data[cap.get("id", "")] = cap
        self._loaded = True
        return {"loaded": len(self._data), "errors": list(self._errors)}

    def list(self) -> list:
        if not self._loaded:
            self.load()
        return sorted(self._data.values(), key=lambda c: c.get("id", ""))

    def get(self, cap_id: str) -> Optional[dict]:
        if not self._loaded:
            self.load()
        return self._data.get(cap_id)

    def resolve(self, query: str) -> dict:
        """Deterministic keyword match against capability id / description and
        the skills/operations it names. Reports matched items; never presents a
        probabilistic guess as certainty."""
        q = query.strip().lower()
        if q in self._data:
            return {"found": True, "capability": q, "via": "exact-id"}
        matches_ = []
        for cap in self.list():
            hay = " ".join(cap.get("keywords", []))
            if matches(hay, query):
                matches_.append(cap.get("id"))
        if matches_:
            return {"found": True, "capability": matches_[0], "via": "keyword",
                    "matches": matches_}
        return {"found": False, "capability": None, "via": None}


__all__ = ["Capabilities"]
