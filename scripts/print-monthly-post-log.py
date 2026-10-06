"""Print monthly-market-update post_log rows and the healthcheck freshness.

Reads DATABASE_URL. Does not post. The morning healthcheck counts only
status='posted' and reports GAP when that channel has never posted.
"""

import os
from datetime import datetime, timezone

import psycopg2

dsn = os.environ.get("DATABASE_URL")
if not dsn:
    print("DATABASE_URL is not set")
    raise SystemExit(1)

conn = psycopg2.connect(dsn, connect_timeout=15, sslmode="require")
cur = conn.cursor()
cur.execute(
    """
    SELECT channel, status, ref_key, posted_at,
           left(coalesce(error_message, ''), 160)
      FROM post_log
     WHERE job_name = 'monthly-market-update'
     ORDER BY posted_at DESC
     LIMIT 30
    """
)
rows = cur.fetchall()
print(f"rows={len(rows)}")
for channel, status, ref_key, posted_at, err in rows:
    print(f"{channel}\t{status}\t{ref_key}\t{posted_at}\t{err}")

cur.execute(
    """
    SELECT channel, MAX(posted_at)
      FROM post_log
     WHERE job_name = 'monthly-market-update'
       AND status = 'posted'
     GROUP BY channel
    """
)
found = {channel: posted_at for channel, posted_at in cur.fetchall()}
now = datetime.now(timezone.utc)
print("--- healthcheck freshness (posted only, 42d) ---")
for channel in ("facebook", "linkedin", "gbp"):
    last = found.get(channel)
    if last is None:
        print(f"{channel}\tGAP\tno successful posted row")
        continue
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    age = (now - last).total_seconds() / 86400
    status = "PASS" if age <= 42 else "STALE"
    print(f"{channel}\t{status}\tage_days={age:.2f}\tat={last.isoformat()}")
