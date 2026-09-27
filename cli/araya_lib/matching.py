"""Deterministic query matching helpers.

Resolution is keyword-based and deterministic: a query is tokenized, stopwords
and very short tokens are dropped, and a match is a token-containment against a
declared haystack. There is no probabilistic matching presented as certainty.
"""
from __future__ import annotations

import re

_WORD_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]*")

_STOPWORDS = {
    "the", "and", "for", "are", "but", "not", "you", "all", "any", "can",
    "had", "her", "was", "one", "our", "out", "day", "get", "has", "him",
    "his", "how", "man", "new", "now", "old", "see", "two", "way", "who",
    "did", "its", "let", "put", "say", "she", "too", "use", "that", "with",
    "have", "this", "will", "your", "from", "they", "know", "want", "been",
    "good", "much", "some", "time", "very", "when", "come", "here", "just",
    "like", "long", "make", "many", "more", "only", "over", "such", "take",
    "than", "them", "then", "these", "also", "into", "is", "be", "to", "of",
    "in", "it", "or", "as", "an", "on", "at", "by", "do", "if", "my", "so",
    "up", "we", "am", "me", "no", "us", "i", "a",
}

_MIN_LEN = 3


def tokenize(text: str) -> list:
    return [w.lower() for w in _WORD_RE.findall(text or "")
            if w.lower() not in _STOPWORDS and len(w) >= _MIN_LEN]


def hay_tokens(text: str) -> list:
    return [w.lower() for w in _WORD_RE.findall(text or "")]


def matches(haystack: str, query: str) -> bool:
    """True if any query token is contained in any haystack token."""
    q_tokens = tokenize(query)
    if not q_tokens:
        return False
    h_tokens = hay_tokens(haystack)
    return any(any(q in h for h in h_tokens) for q in q_tokens)


__all__ = ["tokenize", "matches"]
