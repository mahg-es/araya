"""Deterministic query matching helpers.

Resolution is deterministic and token-based:

1. text is normalized — case-folded and accent-folded (so Spanish ``diseño``
   and English ``design``-style requests share a comparable token space);
2. it is tokenized on word boundaries;
3. English and Spanish stopwords (and very short tokens) are dropped from the
   *query* side;
4. a match is an **exact normalized-token intersection** between the query and
   a declared haystack.

There is no substring accumulation: ``version`` can never match ``versioning``
and ``con`` can never match ``consequences``. There is no probabilistic
matching presented as certainty.
"""
from __future__ import annotations

import re
import unicodedata

# Accents are stripped by ``fold`` before tokenization, so the ASCII class below
# is sufficient and keeps tokens stable across languages.
_WORD_RE = re.compile(r"[a-z0-9][a-z0-9_.-]*")

_EN_STOPWORDS = {
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
    # structural English words common in intent phrasing
    "need", "want", "please", "would", "could", "should", "about", "into",
    "using", "use", "let", "does", "how",
}

# Spanish structural words. These must never create false positives, so the
# query side drops them entirely.
_ES_STOPWORDS = {
    "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al",
    "que", "con", "por", "para", "en", "y", "o", "u", "ante", "bajo", "cabe",
    "como", "cuando", "donde", "sin", "sobre", "tras", "es", "son", "esta",
    "estan", "ser", "estar", "mi", "tu", "su", "mis", "tus", "sus", "me",
    "te", "se", "nos", "os", "lo", "le", "les", "este", "esto", "estos",
    "estas", "ese", "esa", "eso", "esos", "esas", "aquel", "aquella", "mas",
    "pero", "sino", "porque", "pues", "tambien", "muy", "junto", "juntos",
    "necesito", "quiero", "puedes", "favor", "hay", "cual", "cuales", "cuyo",
    "los", "un", "una", "algun", "alguna", "otro", "otra", "mismo", "misma",
    "tan", "tanto", "cada", "sea", "fue", "era", "han", "hay", "asi",
}

_STOPWORDS = _EN_STOPWORDS | _ES_STOPWORDS
_MIN_LEN = 3


def fold(text: str) -> str:
    """Case-fold and strip diacritics — the multilingual normalization step."""
    nfkd = unicodedata.normalize("NFKD", text or "")
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def _tokens(text: str) -> list:
    return _WORD_RE.findall(fold(text))


def tokenize(text: str) -> list:
    """Query-side tokens: normalized, stopword-filtered, length-filtered."""
    return [w for w in _tokens(text)
            if w not in _STOPWORDS and len(w) >= _MIN_LEN]


def hay_tokens(text: str) -> list:
    """Haystack-side tokens: normalized only (no stopword/length filtering)."""
    return _tokens(text)


def matches(haystack: str, query: str) -> bool:
    """True iff some normalized query token *exactly equals* a haystack token.

    Exact normalized-token intersection — never substring containment."""
    q = set(tokenize(query))
    if not q:
        return False
    return bool(q & set(hay_tokens(haystack)))


__all__ = ["tokenize", "hay_tokens", "matches", "fold"]
