"""Publisher — saves articles as markdown drafts and generates TS blog entry snippets."""

import os
import re
import uuid
import json
import logging
from datetime import datetime

log = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))


def _strip_markdown_title(content: str) -> str:
    """Remove the first # heading line since title is in frontmatter / TS entry."""
    lines = content.split("\n")
    if lines and lines[0].startswith("# "):
        lines = lines[1:]
    return "\n".join(lines).strip()


def _escape_ts(s: str) -> str:
    """Escape backticks and ${} for TS template literals."""
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def save_article(article: dict, quality: dict, keyword_row: dict, config: dict) -> tuple:
    article_id = str(uuid.uuid4())[:8]
    score = quality.get("overall", 0)
    min_score = config.get("engine", {}).get("min_quality_score", 7.0)
    reject_score = config.get("engine", {}).get("reject_score", 5.0)

    if score >= min_score:
        subdir = config.get("output", {}).get("drafts_dir", "output/drafts")
    elif score < reject_score:
        subdir = config.get("output", {}).get("rejected_dir", "output/rejected")
    else:
        subdir = config.get("output", {}).get("drafts_dir", "output/drafts")

    out_dir = os.path.join(BASE_DIR, subdir)
    os.makedirs(out_dir, exist_ok=True)

    slug = article["slug"]
    body = _strip_markdown_title(article["content"])
    title = article["title"]
    today = datetime.now().strftime("%B %d, %Y")

    # Build excerpt from first paragraph
    paragraphs = [p.strip() for p in body.split("\n\n") if p.strip() and not p.strip().startswith("#")]
    excerpt = paragraphs[0][:200] if paragraphs else title
    # Strip markdown from excerpt
    excerpt = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', excerpt)
    excerpt = re.sub(r'[*_`#]', '', excerpt)

    # Save markdown version
    md_path = os.path.join(out_dir, f"{slug}.md")
    frontmatter = f"""---
title: "{title}"
keyword: "{article['keyword']}"
slug: "{slug}"
word_count: {article['word_count']}
quality_score: {score}
readability_score: {quality.get('readability_score', 0)}
article_id: "{article_id}"
created: "{datetime.utcnow().isoformat()}"
status: "{'draft' if score >= min_score else 'rejected'}"
---

"""
    with open(md_path, "w") as f:
        f.write(frontmatter + article["content"])

    # Save TS blog entry snippet (ready to paste into lib/blog.ts)
    ts_path = os.path.join(out_dir, f"{slug}.ts.txt")
    ts_entry = f"""  {{
    slug: "{slug}",
    title: "{_escape_ts(title)}",
    date: "{today}",
    excerpt: "{_escape_ts(excerpt)}",
    content: `
{_escape_ts(body)}
    `.trim(),
  }},"""
    with open(ts_path, "w") as f:
        f.write(ts_entry)

    log.info(f"Saved: {md_path} (score: {score})")
    return article_id, md_path
