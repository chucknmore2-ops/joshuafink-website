"""SQLite-backed keyword queue for JFG content engine."""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "keywords.db")


class KeywordQueue:
    def __init__(self, db_path=None):
        self.db_path = db_path or DB_PATH
        self._init_db()

    def _conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._conn() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS keywords (
                    id INTEGER PRIMARY KEY,
                    keyword TEXT NOT NULL,
                    status TEXT DEFAULT 'queued',
                    article_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS articles (
                    id TEXT PRIMARY KEY,
                    keyword_id INTEGER,
                    title TEXT,
                    slug TEXT,
                    word_count INTEGER,
                    quality_score FLOAT,
                    readability_score FLOAT,
                    file_path TEXT,
                    status TEXT DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (keyword_id) REFERENCES keywords(id)
                );
            """)

    def get_next_keyword(self):
        with self._conn() as conn:
            row = conn.execute(
                "SELECT * FROM keywords WHERE status = 'queued' ORDER BY id LIMIT 1"
            ).fetchone()
            if row:
                conn.execute(
                    "UPDATE keywords SET status = 'writing', updated_at = ? WHERE id = ?",
                    (datetime.utcnow().isoformat(), row["id"]),
                )
                return dict(row)
        return None

    def add_keywords(self, keywords: list):
        with self._conn() as conn:
            for kw in keywords:
                kw = kw.strip()
                if not kw:
                    continue
                exists = conn.execute(
                    "SELECT id FROM keywords WHERE keyword = ?", (kw,)
                ).fetchone()
                if not exists:
                    conn.execute(
                        "INSERT INTO keywords (keyword) VALUES (?)", (kw,)
                    )

    def mark_drafted(self, keyword_id, article_id):
        with self._conn() as conn:
            conn.execute(
                "UPDATE keywords SET status = 'drafted', article_id = ?, updated_at = ? WHERE id = ?",
                (article_id, datetime.utcnow().isoformat(), keyword_id),
            )

    def mark_rejected(self, keyword_id):
        with self._conn() as conn:
            conn.execute(
                "UPDATE keywords SET status = 'rejected', updated_at = ? WHERE id = ?",
                (datetime.utcnow().isoformat(), keyword_id),
            )

    def get_stats(self):
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT status, COUNT(*) as cnt FROM keywords GROUP BY status"
            ).fetchall()
            stats = {r["status"]: r["cnt"] for r in rows}
            total = conn.execute("SELECT COUNT(*) as c FROM articles").fetchone()["c"]
            stats["total_articles"] = total
            return stats
