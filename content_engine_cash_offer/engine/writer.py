"""Article writer using local Ollama — cash offer SEO content for joshuafink.com."""

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
    audience = site.get("audience", "Nashville-area homeowners considering selling for cash")
    tone = site.get("tone", "Empathetic but direct, no-pressure, locally expert")
    agent_name = site.get("agent_name", "Joshua Fink")
    phone = site.get("phone", "615-551-2727")
    links = site.get("internal_links", {})
    brief = research.get("brief", "")

    prompt = f"""Write a comprehensive, SEO-optimized blog post about "{keyword}" for a Nashville cash home buyer website.

Author: {agent_name}, Joshua Fink Group
Target audience: {audience}
Tone: {tone}
Word count: 1000-1400 words

Research context:
{brief[:2000]}

Requirements:
- Start with an empathetic hook that addresses the reader's situation (they may be stressed, overwhelmed, or in a tough spot)
- Use H2 and H3 headers for clear structure (markdown format)
- Explain how cash offers work and why they benefit the seller in this situation
- Reference specific Nashville suburbs and neighborhoods where relevant
- Include real data points from the research when available
- Add internal links naturally: [cash offer]({links.get('cash_offer', '/cash-offer')}), [contact us]({links.get('contact', '/contact')})
- End with CTA: "Need a fast cash offer? Joshua Fink can close in as little as 14 days. Get your free, no-obligation offer today. [Get Your Cash Offer]({links.get('cash_offer', '/cash-offer')})"
- Write in first person as {agent_name} — empathetic, experienced, no-pressure
- NO AI-sounding phrases like "in today's world", "it's important to note", "navigating the landscape"
- Optimize for the keyword "{keyword}" naturally
- Address common objections: "Will I get a fair price?", "Is this a scam?", "How fast can you close?"

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

    # Retry loop: expand if under 800 words (up to 2 retries)
    MIN_WORDS = 800
    MAX_RETRIES = 2
    word_count = len(text.split())
    for retry in range(MAX_RETRIES):
        if word_count >= MIN_WORDS:
            break
        log.warning(f"Article only {word_count} words (min {MIN_WORDS}), retry {retry + 1}/{MAX_RETRIES}")
        expand_prompt = (
            f"This article is only {word_count} words. Expand it to at least 1200 words "
            f"with more detail, examples, and actionable advice. Keep the same structure and SEO focus.\n\n{text}"
        )
        try:
            resp2 = requests.post(
                OLLAMA_URL,
                json={"model": model, "prompt": expand_prompt, "stream": False,
                      "options": {"temperature": temperature, "num_predict": 4096, "top_p": 0.9}},
                timeout=timeout,
            )
            resp2.raise_for_status()
            text = resp2.json()["response"]
            word_count = len(text.split())
        except Exception as e:
            log.error(f"Ollama expand retry {retry + 1} failed: {e}")
            break
    log.info(f"Final word count for '{keyword}': {word_count}")

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
