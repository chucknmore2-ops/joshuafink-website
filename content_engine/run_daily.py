#!/usr/bin/env python3
"""Daily runner — processes 3 articles from the keyword queue."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import load_config, run_batch

if __name__ == "__main__":
    config = load_config()
    count = config.get("engine", {}).get("articles_per_run", 3)
    run_batch(config, count)
