#!/bin/bash
# sync-all.sh — Syncs active + sold listings from Compass to joshuafink.com
# Runs locally on Mac Mini via LaunchAgent, zero token usage
# Pushes to GitHub → Vercel auto-deploys

set -e
cd "$(dirname "$0")/.."

echo "[sync-all] $(date) — Starting listing sync"

# Sync active listings with photos
node scripts/fetch-images.mjs

# Sync sold listings
node scripts/fetch-sold.mjs

# Git commit and push (if anything changed)
if git diff --quiet lib/listings.ts lib/sold-listings.ts 2>/dev/null; then
  echo "[sync-all] No changes detected"
else
  git add lib/listings.ts lib/sold-listings.ts
  git commit -m "chore: bi-weekly listing sync from Compass [$(date +%Y-%m-%d)]" || true
  git push origin main || echo "[sync-all] Push failed — will retry next run"
fi

echo "[sync-all] $(date) — Done"
