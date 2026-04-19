"""Article writer using local Ollama — tailored for joshuafink.com.

The prompt lives in `content_engine/prompts/writer.md` (v2 · 2026-04-19).
This module loads it, fills placeholders, and submits to Ollama. The
hardened prompt enforces: specific opener, 2+ proprietary data points,
3-of-6 angle picking (not one-of-every), banned-phrase list, sourced
claims, and a compliance rider for TREC-sensitive keywords.

See `content_engine/prompts/writer.md` for editing the prompt. Placeholder
substitution uses `string.Template` ($-syntax) rather than `.format()` so
literal `{` characters in the prompt (example JSON, code snippets) cannot
crash the pipeline.
"""

import logging
import re
from pathlib import Path
from string import Template

import requests
from slugify import slugify

log = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
WRITER_PROMPT_PATH = PROMPTS_DIR / "writer.md"

# Minimum word count for a published article — retries expand shorter output.
MIN_WORDS = 800
MAX_EXPAND_RETRIES = 2

# Keywords that require the TREC principal-as-buyer or legal-content rider.
# Matched with word boundaries so "tax" does not match "syntax" / "contact".
COMPLIANCE_KEYWORD_PATTERNS: tuple[str, ...] = (
    r"\bcash offer\b",
    r"\bwe buy houses\b",
    r"\bsell my house fast\b",
    r"\bforeclosure\b",
    r"\bprobate\b",
    r"\binherited\b",
    r"\bdivorce\b",
    r"\bshort sale\b",
    r"\btax\b",
    r"\bas[- ]is\b",
)

_COMPLIANCE_RE = re.compile("|".join(COMPLIANCE_KEYWORD_PATTERNS), re.IGNORECASE)

COMPLIANCE_RIDER = (
    "COMPLIANCE: Joshua Fink is a licensed Tennessee Affiliate Broker with "
    "Compass Real Estate. Since this post touches on principal-as-buyer or "
    "regulated-claim territory, include a short disclosure paragraph "
    "referencing TREC Rule 1260-02-.12 and TCA § 62-13-403 at the end of "
    "the article body. This is not optional — ship with the disclosure or "
    "fail the post."
)


def _load_writer_template() -> str:
    """Load the writer prompt markdown and extract the first fenced code block."""
    raw = WRITER_PROMPT_PATH.read_text(encoding="utf-8")
    in_block = False
    lines: list[str] = []
    for ln in raw.splitlines():
        if ln.startswith("```"):
            if in_block:
                break
            in_block = True
            continue
        if in_block:
            lines.append(ln)
    if not lines:
        raise RuntimeError(
            f"writer prompt at {WRITER_PROMPT_PATH} has no fenced code block; "
            "refusing to run with an empty prompt"
        )
    return "\n".join(lines)


def _needs_compliance(keyword: str) -> bool:
    return bool(_COMPLIANCE_RE.search(keyword))


def _render_prompt(template: str, values: dict[str, str]) -> str:
    """Render $placeholder form safely. `{` / `}` in the template are never
    interpreted — unlike str.format, which would crash on literal braces."""
    # Convert `{name}` placeholders used in older prompt drafts to `$name`
    # for backward compatibility; new writer.md should use `$name` directly.
    converted = re.sub(r"\{(\w+)\}", r"$\1", template)
    return Template(converted).safe_substitute(values)


def write_article(
    keyword: str,
    research: dict,
    config: dict,
    model: str = "llama3.1:8b",
    temperature: float = 0.85,
    timeout: int = 300,
) -> dict:
    if isinstance(config, dict):
        model = config.get("ollama", {}).get("model", model)
        # Enforce minimum temperature — lower values collapse onto the template
        # scaffolding documented in prompts/writer.md.
        cfg_temp = config.get("ollama", {}).get("temperature", temperature)
        temperature = max(float(cfg_temp), 0.8)
        timeout = config.get("ollama", {}).get("timeout", timeout)

    site = config.get("site", {})
    audience = site.get("audience", "Nashville-area home buyers and sellers")
    tone = site.get("tone", "Authoritative, direct, data-driven")
    phone = site.get("phone", "615-551-2727")
    links = site.get("internal_links", {}) or {}
    brief = research.get("brief", "")

    internal_links_csv = (
        ", ".join(f"[{k}]({v})" for k, v in links.items())
        or "/listings, /contact, /cash-offer, /sell"
    )

    template = _load_writer_template()
    prompt = _render_prompt(
        template,
        {
            "keyword": keyword,
            "audience": audience,
            "tone": tone,
            "brief": brief[:2500],
            "phone": phone,
            "internal_links_csv": internal_links_csv,
            "compliance_rider": COMPLIANCE_RIDER if _needs_compliance(keyword) else "",
        },
    )

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": 4096,
                    "top_p": 0.9,
                    "repeat_penalty": 1.15,
                },
            },
            timeout=timeout,
        )
        response.raise_for_status()
        text = response.json()["response"]
    except Exception as e:
        log.error("Ollama write failed: %s", e)
        raise

    # Minimum-word retry loop
    word_count = len(text.split())
    for retry in range(MAX_EXPAND_RETRIES):
        if word_count >= MIN_WORDS:
            break
        log.warning(
            "Article only %d words (min %d), retry %d/%d",
            word_count, MIN_WORDS, retry + 1, MAX_EXPAND_RETRIES,
        )
        expand_prompt = (
            f"This article is only {word_count} words. Expand to at least 1200 words with "
            f"more specific local detail (named subdivisions, schools, closed-deal examples). "
            f"DO NOT introduce the banned phrases listed in the writer prompt. Keep the same "
            f"angles already chosen. Return only the full revised article.\n\n{text}"
        )
        try:
            resp2 = requests.post(
                OLLAMA_URL,
                json={
                    "model": model,
                    "prompt": expand_prompt,
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": 4096,
                        "top_p": 0.9,
                        "repeat_penalty": 1.15,
                    },
                },
                timeout=timeout,
            )
            resp2.raise_for_status()
            text = resp2.json()["response"]
            word_count = len(text.split())
        except Exception as e:
            log.error("Ollama expand retry %d failed: %s", retry + 1, e)
            break
    log.info("Final word count for '%s': %d", keyword, word_count)

    lines = text.strip().split("\n")
    title = lines[0].replace("# ", "").strip() if lines else keyword
    slug = slugify(title)
    word_count = len(text.split())

    return {
        "title": title,
        "slug": slug,
        "content": text,
        "word_count": word_count,
        "keyword": keyword,
        "compliance_required": _needs_compliance(keyword),
    }
