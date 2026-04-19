#!/usr/bin/env bash
# Sync shared files between content_engine/ and content_engine_cash_offer/.
# These two engines share writer.py / quality_check.py / publisher.py and
# the writer prompt. Drift between them is a silent-failure risk — if the
# main engine's banned-phrase list updates, the cash-offer engine should
# get the same update.
#
# Usage:
#   scripts/sync-content-engines.sh       # copy main -> cash-offer
#   scripts/sync-content-engines.sh check # fail (exit 1) on any diff
set -euo pipefail

SRC_DIR="content_engine"
DST_DIR="content_engine_cash_offer"
FILES=(
  "engine/writer.py"
  "engine/quality_check.py"
  "engine/publisher.py"
  "prompts/writer.md"
)

mode="${1:-copy}"

case "$mode" in
  check)
    status=0
    for f in "${FILES[@]}"; do
      if ! diff -q "$SRC_DIR/$f" "$DST_DIR/$f" >/dev/null 2>&1; then
        echo "drift: $f"
        status=1
      fi
    done
    if [ "$status" -ne 0 ]; then
      echo "content_engine and content_engine_cash_offer have drifted."
      echo "Run: scripts/sync-content-engines.sh"
    fi
    exit "$status"
    ;;
  copy)
    mkdir -p "$DST_DIR/engine" "$DST_DIR/prompts"
    for f in "${FILES[@]}"; do
      cp -f "$SRC_DIR/$f" "$DST_DIR/$f"
      echo "synced: $f"
    done
    ;;
  *)
    echo "usage: $0 [copy|check]" >&2
    exit 2
    ;;
esac
