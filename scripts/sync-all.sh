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

# Pushover Josh when a previously active home is now sold. The message is a
# ready-to-text review ask. It does not text the client, and a failed alert
# must not fail the listing sync.
node --import tsx scripts/notify-sold-flips.ts || echo "[sync-all] sold-flip notify failed; continuing"

echo "[sync-all] $(date) — Done"
