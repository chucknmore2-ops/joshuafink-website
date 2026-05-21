#!/usr/bin/env bash
# One-shot bootstrap for a fresh local machine working on joshuafink-website.
#
# Idempotent — safe to re-run anytime. Verifies tooling versions, installs
# node + python deps, links the Vercel project, and pulls the gitignored
# .env.local. Use this when:
#
#   - Onboarding a new machine (e.g. the 2026-05-21 Mac mini → iMac migration)
#   - Suspect local state is broken
#   - Anyone clones the repo for the first time
#
# Usage:
#   npm run setup
#   # or
#   bash scripts/setup-machine.sh

set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ joshuafink-website — machine bootstrap"
echo

# ─── Tool checks ─────────────────────────────────────────────────────────
need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "✗ Missing required tool: $1"
    [ -n "${2:-}" ] && echo "  Install hint: $2"
    return 1
  fi
  echo "✓ $1 → $(command -v "$1")"
}

echo "Checking required tools..."
need node "brew install node"
need npm  ""
need python3 ""
need gh   "brew install gh"
echo

# ─── Node deps ───────────────────────────────────────────────────────────
if [ ! -d node_modules ]; then
  echo "▶ Installing npm dependencies..."
  npm install
else
  echo "✓ node_modules already present (run 'npm install' manually to refresh)"
fi
echo

# ─── Python healthcheck deps ─────────────────────────────────────────────
if [ -f scripts/requirements-healthcheck.txt ]; then
  echo "▶ Installing Python healthcheck deps (user-level)..."
  # pip is finicky about pinned wheels on older Python; install non-pinned if pinned fails
  python3 -m pip install --user --quiet -r scripts/requirements-healthcheck.txt 2>/dev/null \
    || python3 -m pip install --user --quiet psycopg2-binary pytest
  echo "✓ Python deps installed"
fi
echo

# ─── Vercel CLI + .env.local ─────────────────────────────────────────────
if ! command -v vercel >/dev/null 2>&1; then
  echo "▶ Installing Vercel CLI globally..."
  npm install -g vercel
fi

if [ ! -f .env.local ]; then
  echo "▶ Pulling .env.local from Vercel (development environment)..."
  echo "  If prompted, run 'vercel login' first, then re-run this script."
  vercel link --yes >/dev/null 2>&1 || true
  vercel env pull .env.local || {
    echo "✗ vercel env pull failed. Run 'vercel login' then 'vercel link', then 'npm run setup' again."
    exit 1
  }
else
  echo "✓ .env.local already present"
fi
echo

# ─── Smoke test ──────────────────────────────────────────────────────────
echo "▶ Running typecheck smoke test..."
if npm run typecheck >/dev/null 2>&1; then
  echo "✓ TypeScript check passed"
else
  echo "✗ TypeScript check failed — run 'npm run typecheck' for details"
  exit 1
fi
echo

echo "✅ Machine setup complete."
echo
echo "Common commands:"
echo "  npm run dev         — start dev server on :3000"
echo "  npm run build       — production build"
echo "  npm run typecheck   — strict TypeScript check"
echo "  npm run healthcheck — run morning healthcheck against prod DB"
echo "  npm run lint        — ESLint pass"
