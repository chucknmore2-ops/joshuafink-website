#!/usr/bin/env python3
"""Joshua Fink Group Content Engine — local SEO article factory."""

import argparse
import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime

import yaml

from engine.keyword_queue import KeywordQueue
from engine.researcher import research_topic
from engine.writer import write_article
from engine.quality_check import check_quality
from engine.publisher import save_article

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(LOG_DIR, "engine.log")),
    ],
)
log = logging.getLogger("jfg-content-engine")


def load_config():
    with open(os.path.join(BASE_DIR, "config.yaml")) as f:
        return yaml.safe_load(f)


def process_one(queue: KeywordQueue, config: dict) -> bool:
    """Process a single keyword. Returns True if an article was written."""
    kw = queue.get_next_keyword()
    if not kw:
        return False

    keyword = kw["keyword"]
    keyword_id = kw["id"]
    log.info("Processing: %s", keyword)

    # Research
    research = research_topic(keyword, config)
    log.info("Research: %d sources, %d words brief", research["sources"], len(research["brief"].split()))

    # Write
    article = write_article(keyword, research, config)
    log.info("Written: %s (%d words)", article["title"], article["word_count"])

    # Quality check
    quality = check_quality(article["content"], keyword, config)
    score = quality.get("overall", 0)
    log.info("Quality: %.1f (readability: %.1f)", score, quality.get("readability_score", 0))

    min_score = config.get("engine", {}).get("min_quality_score", 7.0)

    # Save
    article_id, filepath = save_article(article, quality, kw, config)

    if score >= min_score:
        queue.mark_drafted(keyword_id, article_id)
        log.info("✅ Published draft: %s", filepath)
    else:
        queue.mark_rejected(keyword_id)
        log.info("❌ Rejected (score %.1f < %.1f): %s", score, min_score, filepath)

    return True


def run_batch(config, count=3):
    """Process up to `count` keywords."""
    queue = KeywordQueue()
    written = 0
    for i in range(count):
        if process_one(queue, config):
            written += 1
        else:
            log.info("Queue empty after %d articles", written)
            break
    stats = queue.get_stats()
    log.info("Batch complete. Written: %d | Stats: %s", written, stats)
    return written


def run_daemon(config):
    """Run continuously."""
    queue = KeywordQueue()
    cycle_delay = config["engine"]["cycle_delay_seconds"]
    empty_sleep = config["engine"]["empty_queue_sleep"]

    log.info("Content engine daemon started")
    while True:
        try:
            if not process_one(queue, config):
                log.info("Queue empty. Sleeping %d seconds...", empty_sleep)
                time.sleep(empty_sleep)
            else:
                time.sleep(cycle_delay)
        except KeyboardInterrupt:
            log.info("Shutting down.")
            break
        except Exception as e:
            log.error("Error: %s", e, exc_info=True)
            time.sleep(30)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JFG Content Engine")
    parser.add_argument("--daemon", action="store_true", help="Run continuously")
    parser.add_argument("--batch", type=int, default=3, help="Number of articles per batch run")
    parser.add_argument("--seed", action="store_true", help="Seed keywords from data/seed_keywords.txt")
    parser.add_argument("--stats", action="store_true", help="Show queue stats")
    args = parser.parse_args()

    config = load_config()

    if args.seed:
        seed_file = os.path.join(BASE_DIR, "data", "seed_keywords.txt")
        if os.path.exists(seed_file):
            with open(seed_file) as f:
                keywords = [line.strip() for line in f if line.strip() and not line.startswith("#")]
            queue = KeywordQueue()
            queue.add_keywords(keywords)
            log.info("Seeded %d keywords", len(keywords))
        else:
            log.error("Seed file not found: %s", seed_file)
        sys.exit(0)

    if args.stats:
        queue = KeywordQueue()
        stats = queue.get_stats()
        print(json.dumps(stats, indent=2))
        sys.exit(0)

    if args.daemon:
        run_daemon(config)
    else:
        run_batch(config, args.batch)
