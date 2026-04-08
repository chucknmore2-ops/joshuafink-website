"""Article writer using local Ollama — tailored for joshuafink.com."""

import logging
import requests
from slugify import slugify

log = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"


def write_article(keyword: str, research: dict, config: dict, model: str = "llama3.1:8b", temperature: float = 0.7, timeout: int = 300) -> dict:
    if isinstance(config, dict):
        model = config.get('ollama', {}).get('model', model)
        temperature = config.get('ollama', {}).get('temperature', temperature)
        timeout = config.get('ollama', {}).get('timeout', timeout)

    site = config.get("site", {})
    audience = site.get("audience", "Nashville-area home buyers and sellers")
    tone = site.get("tone", "Authoritative, direct, data-driven")
    agent_name = site.get("agent_name", "Joshua Fink")
    phone = site.get("phone", "615-551-2727")
    email = site.get("email", "joshua@joshuafink.com")
    links = site.get("internal_links", {})
    brief = research.get("brief", "")

    prompt = f"""Write a comprehensive, SEO-optimized blog post about "{keyword}" for a Nashville real estate website.

Author: {agent_name}, Affiliate Broker at Compass Real Estate
Target audience: {audience}
Tone: {tone}
Word count: 1200-1500 words

Research context:
{brief[:2000]}

Requirements:
- Start with a compelling hook that addresses the reader's core question
- Use H2 and H3 headers for clear structure (markdown format)
- Include actionable, specific advice — not generic filler
- Reference specific Nashville suburbs and neighborhoods where relevant
- Include real data points (median prices, school ratings, growth stats) from the research
- Add internal links naturally using markdown: [listings]({links.get('listings', '/listings')}), [contact]({links.get('contact', '/contact')}), [cash offer]({links.get('cash_offer', '/cash-offer')}), [sell your home]({links.get('sell', '/sell')})
- End with a CTA: "Thinking about buying/selling in [relevant area]? Call or text {agent_name} at {phone} or visit joshuafink.com"
- Write in first person as {agent_name} — confident, experienced, locally expert
- NO AI-sounding phrases like "in today's world", "it's important to note", "navigating the landscape"
- Optimize for the keyword "{keyword}" naturally

Write the full article in markdown. Start with # title."""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": temperature, "num_predict": 4096, "top_p": 0.9},
            },
            timeout=timeout,
        )
        response.raise_for_status()
        text = response.json()["response"]
    except Exception as e:
        log.error(f"Ollama write failed: {e}")
        raise

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
    }
