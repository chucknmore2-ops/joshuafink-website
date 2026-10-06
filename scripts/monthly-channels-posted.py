"""Report whether LinkedIn, Google Business, and Facebook already posted a month.

Reads DATABASE_URL. Does not post and does not print the connection string.
Exit 0: each of those channels has a status=posted row for the month.
Exit 2: at least one channel has no posted row (the caller may post).
Exit 1: bad input or the database could not be read.
"""

import os
import re
import sys
from typing import Mapping, Sequence

CHANNELS = ("linkedin", "gbp", "facebook")


def classify_counts(counts: Mapping[str, int]) -> str:
    """Return 'posted' when every channel has a row, otherwise 'waiting'."""
    if all(counts.get(channel, 0) >= 1 for channel in CHANNELS):
        return "posted"
    return "waiting"


def main(argv: Sequence[str]) -> int:
    if len(argv) != 2 or not re.fullmatch(r"\d{4}-\d{2}", argv[1]):
        print("usage: monthly-channels-posted.py YYYY-MM")
        return 1
    month = argv[1]
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        print("DATABASE_URL is not set")
        return 1

    import psycopg2

    conn = psycopg2.connect(dsn, connect_timeout=15, sslmode="require")
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT channel, COUNT(*)
              FROM post_log
             WHERE job_name = 'monthly-market-update'
               AND ref_key = %s
               AND status = 'posted'
               AND channel = ANY(%s)
             GROUP BY channel
            """,
            (month, list(CHANNELS)),
        )
        counts = {channel: 0 for channel in CHANNELS}
        for channel, count in cur.fetchall():
            counts[channel] = int(count)
    finally:
        conn.close()

    kind = classify_counts(counts)
    summary = " ".join(f"{channel}={counts[channel]}" for channel in CHANNELS)
    print(f"{summary} month={month}")
    if kind == "posted":
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
