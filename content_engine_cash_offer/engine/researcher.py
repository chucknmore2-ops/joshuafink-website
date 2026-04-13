"""Web research module — uses Brave Search API for topic context."""

import json
import os
import logging
import requests

log = logging.getLogger(__name__)


def _get_brave_key():
    key_path = os.path.expanduser("~/.openclaw/credentials/bravesearch.json")
    if os.path.exists(key_path):
        with open(key_path) as f:
            content = f.read().strip()
            try:
                data = json.loads(content)
                return data.get("api_key") or data.get("apiKey") or data.get("key")
            except json.JSONDecodeError:
                pass
            if ':' in content:
                return content.split(':', 1)[1].strip()
            return content
    return os.environ.get("BRAVE_API_KEY")


def _brave_search(query: str, count: int = 5) -> list:
    key = _get_brave_key()
    if not key:
        log.warning("No Brave API key found, skipping web research")
        return []
    try:
        resp = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            headers={"X-Subscription-Token": key, "Accept": "application/json"},
            params={"q": query, "count": count},
            timeout=15,
        )
        resp.raise_for_status()
        results = resp.json().get("web", {}).get("results", [])
        return [{"title": r.get("title", ""), "url": r.get("url", ""), "snippet": r.get("description", "")} for r in results]
    except Exception as e:
        log.warning(f"Brave search failed: {e}")
        return []


def research_topic(keyword: str, config: dict = None, max_pages: int = 3, max_brief_words: int = 500) -> dict:
    if isinstance(config, dict):
        max_pages = config.get('research', {}).get('max_fetch_pages', max_pages)
        max_brief_words = config.get('research', {}).get('max_brief_words', max_brief_words)

    results = _brave_search(keyword)
    competing_titles = [r["title"] for r in results[:5]]
    brief_parts = [r["snippet"] for r in results if r["snippet"]]
    brief = " ".join(brief_parts)
    words = brief.split()
    if len(words) > max_brief_words:
        brief = " ".join(words[:max_brief_words])

    return {
        "keyword": keyword,
        "brief": brief,
        "competing_titles": competing_titles,
        "sources": len(results),
    }
