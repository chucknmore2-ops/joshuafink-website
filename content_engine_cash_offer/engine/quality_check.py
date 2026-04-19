"""Quality checker — self-scores articles via Ollama + local gates.

Local gates (cheap, deterministic, run BEFORE the LLM self-score):
  1. Banned-phrase detector — catches the AI tells from the 2026-04-19 audit.
  2. Uniqueness gate — computes Jaccard similarity against recent published
     posts in lib/blog.ts using word tri-grams. Posts with >0.45 overlap are
     automatically rejected (this is what caught the 10 Living-in clones
     after the fact; now we catch them before publish).
  3. Flesch-Kincaid readability score.
  4. Compliance check — if `compliance_required`, article body must mention
     TREC or TCA § 62-13-403.
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Iterable

import requests

log = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"

# AI tells from the 2026-04-19 audit. Matched case-insensitive as substrings.
BANNED_PHRASES: tuple[str, ...] = (
    "keeps showing up for a reason",
    "a familiar mix",
    "five-year flexibility",
    "around about",
    "separating sits from sells",
    'separating "sits" from "sells',
    "strongest long-term ownership plays",
    "the retail mix is increasingly",
    "in today's world",
    "in today's market landscape",
    "it's important to note",
    "it is important to note",
    "navigating the landscape",
    "delve into",
    "at the end of the day",
    "the bottom line",
)

# When ≥ this many banned phrases are found, the post fails.
BANNED_PHRASE_FAIL_THRESHOLD = 2

# Jaccard similarity threshold on word tri-grams against any previously
# published post. Above this, the post fails uniqueness and is rejected.
UNIQUENESS_FAIL_THRESHOLD = 0.45

# Path to the published blog data (optional — uniqueness gate degrades
# gracefully if the file isn't readable).
BLOG_DATA_PATH = Path(__file__).resolve().parents[2] / "lib" / "blog.ts"


def _flesch_kincaid(text: str) -> float:
    sentences = max(len(re.split(r"[.!?]+", text)), 1)
    words_list = text.split()
    words = max(len(words_list), 1)
    syllables = sum(_count_syllables(w) for w in words_list)
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59


def _count_syllables(word: str) -> int:
    word = word.lower().strip(".,!?;:'\"")
    if len(word) <= 3:
        return 1
    vowels = "aeiouy"
    count = 0
    prev_vowel = False
    for ch in word:
        is_vowel = ch in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e"):
        count = max(count - 1, 1)
    return max(count, 1)


def _find_banned_phrases(text: str) -> list[str]:
    low = text.lower()
    return [p for p in BANNED_PHRASES if p in low]


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _trigrams(tokens: list[str]) -> set[tuple[str, str, str]]:
    return {(tokens[i], tokens[i + 1], tokens[i + 2]) for i in range(len(tokens) - 2)}


def _jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def _load_published_bodies(path: Path = BLOG_DATA_PATH) -> list[str]:
    """Best-effort extraction of blog post content bodies from lib/blog.ts.

    Returns empty list on any failure — this is a quality gate, not a
    correctness requirement for publication. The writer can still run
    without this check; it just loses the uniqueness signal.
    """
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as e:
        log.warning("uniqueness gate skipped — cannot read %s: %s", path, e)
        return []
    # Every post has a content: `...`.trim(), block. The body is a TS
    # template literal where backticks are escaped as \`. Match lazily but
    # allow escaped backticks inside (otherwise we'd truncate bodies at the
    # first escaped backtick and inflate uniqueness).
    bodies = re.findall(r"content:\s*`((?:[^`\\]|\\.)*)`\.trim\(\)", raw)
    return bodies


def uniqueness_score(new_text: str, published: Iterable[str] | None = None) -> tuple[float, str | None]:
    """Returns (max_jaccard, offending_slug_or_first_words) across published posts."""
    if published is None:
        published = _load_published_bodies()
    new_trigrams = _trigrams(_tokenize(new_text))
    worst = 0.0
    worst_ref: str | None = None
    for body in published:
        score = _jaccard(new_trigrams, _trigrams(_tokenize(body)))
        if score > worst:
            worst = score
            worst_ref = body[:80].replace("\n", " ")
    return worst, worst_ref


def check_quality(
    article_text: str,
    keyword: str,
    config: dict | None = None,
    model: str = "llama3.1:8b",
    timeout: int = 120,
    compliance_required: bool = False,
) -> dict:
    if isinstance(config, dict):
        model = config.get("ollama", {}).get("model", model)
        timeout = config.get("ollama", {}).get("timeout", timeout)

    # ── Local gates (fast, deterministic) ──────────────────────────────
    banned_hits = _find_banned_phrases(article_text)
    uniq_score, uniq_ref = uniqueness_score(article_text)
    readability = round(_flesch_kincaid(article_text), 1)

    compliance_ok = True
    if compliance_required:
        lower = article_text.lower()
        compliance_ok = (
            "trec" in lower
            or "tca § 62-13-403" in lower
            or "tennessee real estate commission" in lower
        )

    local_issues: list[str] = []
    if len(banned_hits) >= BANNED_PHRASE_FAIL_THRESHOLD:
        local_issues.append(
            f"banned phrases detected ({len(banned_hits)}): {banned_hits}"
        )
    if uniq_score > UNIQUENESS_FAIL_THRESHOLD:
        local_issues.append(
            f"uniqueness too low — {uniq_score:.2f} overlap with: {uniq_ref!r}"
        )
    if not compliance_ok:
        local_issues.append(
            "compliance rider missing — post references cash-offer / legal "
            "content but body does not mention TREC or TCA § 62-13-403"
        )
    if readability < 40:
        local_issues.append(f"readability too low — Flesch-Kincaid {readability}")

    local_fail = bool(local_issues)

    # ── LLM self-score (only if local gates pass; save tokens on rejects) ─
    quality: dict = {"overall": 0.0 if local_fail else 5.0, "issues": list(local_issues), "suggestion": ""}

    if not local_fail:
        prompt = f"""Score this article about "{keyword}" on a scale of 1-10.

Criteria:
- Accuracy and depth of information (1-10)
- Readability and flow (1-10)
- SEO optimization for "{keyword}" (1-10)
- Actionability — does it help the reader? (1-10)
- Originality — does it say something new? (1-10)

Reply ONLY with JSON:
{{"overall": 7.5, "accuracy": 8, "readability": 7, "seo": 8, "actionability": 7, "originality": 7, "issues": ["list any problems"], "suggestion": "one improvement"}}

Article:
{article_text[:3000]}"""

        try:
            resp = requests.post(
                OLLAMA_URL,
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 512},
                },
                timeout=timeout,
            )
            resp.raise_for_status()
            raw = resp.json()["response"]
            match = re.search(r"\{[^{}]*\}", raw, re.DOTALL)
            if match:
                llm_quality = json.loads(match.group())
                quality.update(llm_quality)
                # Preserve local issues even if LLM didn't flag them
                existing = quality.get("issues") or []
                quality["issues"] = list(local_issues) + list(existing)
        except Exception as e:
            log.warning("Quality check LLM failed: %s, using local score only", e)

    quality["readability_score"] = readability
    quality["banned_phrases_found"] = banned_hits
    quality["uniqueness_score"] = round(uniq_score, 3)
    quality["compliance_ok"] = compliance_ok
    quality["local_fail"] = local_fail
    quality.setdefault("overall", 0.0 if local_fail else 5.0)
    return quality
