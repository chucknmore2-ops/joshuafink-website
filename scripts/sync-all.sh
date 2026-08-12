#!/bin/bash
# sync-all.sh — Syncs active + sold listings from Compass to joshuafink.com
# Runs daily in GitHub Actions (.github/workflows/sync-listings.yml), which
# commits the results and opens the auto-merging PR. This script only writes
# lib/listings.ts + lib/sold-listings.ts — it must NOT commit or push, or the
# workflow would find nothing staged and report success while the site's
# listings quietly froze.

set -e
cd "$(dirname "$0")/.."

echo "[sync-all] $(date) — Starting listing sync"

# Sync active listings with photos
node scripts/fetch-images.mjs

# Sync sold listings
node scripts/fetch-sold.mjs

echo "[sync-all] $(date) — Done"
