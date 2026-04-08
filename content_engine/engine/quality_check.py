"""Quality checker — self-scores articles via Ollama + local readability."""

import json
import logging
import re
import requests

log = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"


def _flesch_kincaid(text: str) -> float:
    sentences = max(len(re.split(r'[.!?]+', text)), 1)
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


def check_quality(article_text: str, keyword: str, config: dict = None, model: str = "llama3.1:8b", timeout: int = 120) -> dict:
    if isinstance(config, dict):
        model = config.get('ollama', {}).get('model', model)
        timeout = config.get('ollama', {}).get('timeout', timeout)

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

    quality = {"overall": 5.0, "issues": [], "suggestion": ""}

    try:
        resp = requests.post(
            OLLAMA_URL,
            json={"model": model, "prompt": prompt, "stream": False, "options": {"temperature": 0.3, "num_predict": 512}},
            timeout=timeout,
        )
        resp.raise_for_status()
        raw = resp.json()["response"]
        match = re.search(r'\{[^{}]*\}', raw, re.DOTALL)
        if match:
            quality = json.loads(match.group())
    except Exception as e:
        log.warning(f"Quality check LLM failed: {e}, using defaults")

    quality["readability_score"] = round(_flesch_kincaid(article_text), 1)
    quality.setdefault("overall", 5.0)
    return quality
