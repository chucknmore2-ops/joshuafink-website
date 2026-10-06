"""Report whether the Railway autoposter recorded one Facebook market post.

Reads DATABASE_URL. Does not post and does not print the connection string.
Exit 0: exactly one status=posted row for the month, with an external post id.
Exit 2: no posted row yet (the caller may retry).
Exit 1: anything else, including a missing DATABASE_URL.
"""

import os
import re
import sys
from typing import Optional, Sequence


def classify(external_ids: Sequence[Optional[str]]) -> str:
    """Classify posted-row external ids: ok, waiting, or bad."""
    if len(external_ids) == 0:
        return "waiting"
    if len(external_ids) == 1 and external_ids[0]:
        return "ok"
    return "bad"


def main(argv: Sequence[str]) -> int:
    if len(argv) != 2 or not re.fullmatch(r"\d{4}-\d{2}", argv[1]):
        print("usage: monthly-facebook-row.py YYYY-MM")
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
            SELECT external_post_id
              FROM post_log
             WHERE channel = 'facebook'
               AND job_name = 'monthly-market-update'
               AND ref_key = %s
               AND status = 'posted'
             ORDER BY posted_at
            """,
            (month,),
        )
        external_ids = [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

    kind = classify(external_ids)
    present = sum(1 for value in external_ids if value)
    print(f"posted_rows={len(external_ids)} with_external_id={present} month={month}")
    if kind == "ok":
        print(f"external_post_id={external_ids[0]}")
        return 0
    if kind == "waiting":
        return 2
    print("expected exactly one posted row with an external post id")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
