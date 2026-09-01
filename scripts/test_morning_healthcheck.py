"""Unit tests for scripts/morning_healthcheck.py.

These run without psycopg2 and without a live database. The DB layer is
mocked at the boundary (`_connect_with_retries` / `_fetch_last_post_per_channel_job`).
"""

from __future__ import annotations

import io
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

import pytest

# Make `scripts/` importable when run from repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import morning_healthcheck as hc  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

NOW = datetime(2026, 5, 15, 12, 0, 0, tzinfo=timezone.utc)


def _fake_latest(days_ago: float) -> datetime:
    return NOW - timedelta(days=days_ago)


def _fake_latest_real(days_ago: float) -> datetime:
    """Real-time-relative variant for tests that go through main() (which
    calls datetime.now(timezone.utc) internally). The NOW-relative variant
    breaks once enough real time elapses past the hardcoded NOW."""
    return datetime.now(timezone.utc) - timedelta(days=days_ago)


# ---------------------------------------------------------------------------
# Schedule consistency — guard against drift from lib/admin-schedule.ts
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[1]
ADMIN_SCHEDULE_TS = REPO_ROOT / "lib" / "admin-schedule.ts"


def test_expected_jobs_match_admin_schedule_ts():
    """Catch silent drift: every (channel, jobName) pair in admin-schedule.ts
    must have a matching ExpectedJob entry in EXPECTED_JOBS."""
    ts = ADMIN_SCHEDULE_TS.read_text()
    # Parse the channel + jobName fields out of the TS literal. The shape is
    # stable enough for a regex; if the source format changes meaningfully,
    # this test will fail loudly and we update both sides together.
    pairs = set(
        re.findall(r'channel:\s*"([^"]+)",\s*jobName:\s*"([^"]+)"', ts)
    )
    assert pairs, "Failed to parse channel/jobName pairs from admin-schedule.ts"
    expected_pairs = {(j.channel, j.job_name) for j in hc.EXPECTED_JOBS}
    missing = pairs - expected_pairs
    extra = expected_pairs - pairs
    assert not missing, f"EXPECTED_JOBS is missing entries from admin-schedule.ts: {missing}"
    # `extra` is allowed for jobs monitored here but not surfaced in /admin.
    # If you intend to add a job here without changing admin-schedule.ts,
    # update this assertion with the rationale.


# ---------------------------------------------------------------------------
# check_pipeline_freshness
# ---------------------------------------------------------------------------

def test_pipeline_pass_when_fresh():
    latest = {("facebook", "listing-spotlight"): _fake_latest(2.0)}
    job = hc.EXPECTED_JOBS[0]  # autoposter-listing, 4d threshold
    result = hc.check_pipeline_freshness(job, latest, now=NOW)
    assert result.status == hc.STATUS_PASS
    assert result.actual_age_days is not None
    assert 1.9 < result.actual_age_days < 2.1


def test_pipeline_stale_when_over_threshold():
    latest = {("facebook", "listing-spotlight"): _fake_latest(5.0)}  # 5d > 4d threshold
    job = hc.EXPECTED_JOBS[0]
    result = hc.check_pipeline_freshness(job, latest, now=NOW)
    assert result.status == hc.STATUS_STALE
    assert result.is_alert


def test_pipeline_gap_when_never_logged():
    latest: dict = {}  # nothing in post_log for any channel
    job = hc.EXPECTED_JOBS[0]
    result = hc.check_pipeline_freshness(job, latest, now=NOW)
    assert result.status == hc.STATUS_GAP
    assert not result.is_alert
    assert "no successful" in result.detail


def test_pipeline_naive_timestamp_treated_as_utc():
    """Defensive — our admin-db uses TIMESTAMP WITH TIME ZONE, but make sure
    a naive datetime doesn't crash the math."""
    naive = (NOW - timedelta(days=1)).replace(tzinfo=None)
    # Inject naive directly bypassing the SQL parser path — simulate a future
    # schema regression where someone migrated the column to TIMESTAMP WITHOUT TZ.
    latest = {("facebook", "listing-spotlight"): naive.replace(tzinfo=timezone.utc)}
    job = hc.EXPECTED_JOBS[0]
    result = hc.check_pipeline_freshness(job, latest, now=NOW)
    assert result.status == hc.STATUS_PASS


# ---------------------------------------------------------------------------
# check_pipeline_freshness — diagnostic enrichment (the "why" suffix)
# ---------------------------------------------------------------------------

def test_stale_detail_includes_failure_reason():
    """A STALE job whose latest attempt is a `failed` row should echo the
    upstream error_message so the alert says *why* it stopped posting."""
    job = hc.EXPECTED_JOBS[0]  # autoposter-listing
    latest = {("facebook", "listing-spotlight"): _fake_latest(6.0)}  # >4d → stale
    attempts = {
        ("facebook", "listing-spotlight"): hc.LastAttempt(
            status="failed",
            posted_at=_fake_latest(1.0),
            error_message="(#200) The permission(s) pages_manage_posts are not granted",
        )
    }
    result = hc.check_pipeline_freshness(job, latest, now=NOW, last_attempt_by_key=attempts)
    assert result.status == hc.STATUS_STALE
    assert "latest attempt FAILED" in result.detail
    assert "pages_manage_posts" in result.detail


def test_stale_detail_includes_dry_run_hint():
    """A job stuck on AUTOPOSTER_DRY_RUN=1 writes dry_run rows that never count
    as fresh; the alert should call that out explicitly."""
    job = hc.EXPECTED_JOBS[0]
    latest = {("facebook", "listing-spotlight"): _fake_latest(6.0)}
    attempts = {
        ("facebook", "listing-spotlight"): hc.LastAttempt(
            status="dry_run", posted_at=_fake_latest(0.5), error_message=None,
        )
    }
    result = hc.check_pipeline_freshness(job, latest, now=NOW, last_attempt_by_key=attempts)
    assert result.status == hc.STATUS_STALE
    assert "DRY RUN" in result.detail
    assert "AUTOPOSTER_DRY_RUN=1" in result.detail


def test_stale_detail_omits_diag_when_latest_attempt_is_the_post():
    """If the most recent attempt IS the (now-old) successful post, there's no
    failure to explain — don't append a noisy suffix."""
    job = hc.EXPECTED_JOBS[0]
    last = _fake_latest(6.0)
    latest = {("facebook", "listing-spotlight"): last}
    attempts = {
        ("facebook", "listing-spotlight"): hc.LastAttempt(
            status="posted", posted_at=last, error_message=None,
        )
    }
    result = hc.check_pipeline_freshness(job, latest, now=NOW, last_attempt_by_key=attempts)
    assert result.status == hc.STATUS_STALE
    assert "latest attempt" not in result.detail


def test_stale_detail_unchanged_without_diagnostics():
    """No last_attempt map (e.g. diagnostic query failed) → detail is the plain
    freshness line, no crash."""
    job = hc.EXPECTED_JOBS[0]
    latest = {("facebook", "listing-spotlight"): _fake_latest(6.0)}
    result = hc.check_pipeline_freshness(job, latest, now=NOW, last_attempt_by_key=None)
    assert result.status == hc.STATUS_STALE
    assert "latest attempt" not in result.detail


def test_gap_detail_explains_failed_attempts():
    """Never-posted job that nonetheless has a `failed` attempt row: the GAP
    line should explain it's failing, not silently imply 'never ran'."""
    job = hc.EXPECTED_JOBS[1]  # monthly-market-update
    attempts = {
        ("facebook", "monthly-market-update"): hc.LastAttempt(
            status="failed",
            posted_at=_fake_latest(2.0),
            error_message="(#190) Malformed access token",
        )
    }
    result = hc.check_pipeline_freshness(job, {}, now=NOW, last_attempt_by_key=attempts)
    assert result.status == hc.STATUS_GAP
    assert "Malformed access token" in result.detail


def test_diag_error_message_is_truncated():
    """A huge upstream error_message must not bloat the email — cap it."""
    job = hc.EXPECTED_JOBS[0]
    latest = {("facebook", "listing-spotlight"): _fake_latest(6.0)}
    attempts = {
        ("facebook", "listing-spotlight"): hc.LastAttempt(
            status="failed", posted_at=_fake_latest(1.0), error_message="x" * 5000,
        )
    }
    result = hc.check_pipeline_freshness(job, latest, now=NOW, last_attempt_by_key=attempts)
    assert "…" in result.detail
    assert len(result.detail) < 600  # freshness line + capped error, not 5000


def test_fetch_last_attempt_scans_all_statuses():
    """The diagnostic query must NOT filter to status='posted' (that's the
    freshness query's job) — it needs the latest row of any status."""
    captured = {"sqls": []}

    class _Cur:
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def execute(self, sql, *args, **kwargs):
            captured["sqls"].append(sql)
        def fetchall(self): return []

    class _Conn:
        def cursor(self): return _Cur()
        def close(self): pass

    hc._fetch_last_attempt_per_channel_job("dsn://", connect_fn=lambda d: _Conn())
    select_sql = next((s for s in captured["sqls"] if "FROM post_log" in s), None)
    assert select_sql is not None, f"no SELECT FROM post_log found in {captured['sqls']}"
    assert "status = 'posted'" not in select_sql
    assert "DISTINCT ON" in select_sql


def test_run_all_stale_alert_surfaces_failure_reason(monkeypatch):
    """End-to-end through run_all_checks: a stale listing job with a failed
    attempt should produce a STALE result whose detail names the error."""
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    latest[("facebook", "listing-spotlight")] = _fake_latest(9)  # stale
    attempts = {
        ("facebook", "listing-spotlight"): hc.LastAttempt(
            status="failed",
            posted_at=_fake_latest(1.0),
            error_message="(#200) pages_manage_posts not granted",
        )
    }
    _patch_dns_helpers(
        monkeypatch,
        healthcheck_status="pass",
        git_status="pass",
        latest_map=latest,
        last_attempt_map=attempts,
    )
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 1
    listing = next(r for r in results if "listing-spotlight" in r.name)
    assert listing.status == hc.STATUS_STALE
    assert "pages_manage_posts" in listing.detail


# ---------------------------------------------------------------------------
# check_postgres_reachable
# ---------------------------------------------------------------------------

class _FakeCursor:
    def __init__(self, rows):
        self._rows = list(rows)
    def __enter__(self): return self
    def __exit__(self, *a): pass
    def execute(self, *a, **k): pass
    def fetchone(self):
        return self._rows[0] if self._rows else None
    def fetchall(self):
        return list(self._rows)


class _FakeConn:
    def __init__(self, rows=None, fail_query=False):
        self._rows = rows or [(1,)]
        self._fail_query = fail_query
        self.closed = False
    def cursor(self):
        if self._fail_query:
            raise RuntimeError("simulated query failure")
        return _FakeCursor(self._rows)
    def close(self):
        self.closed = True


def test_fetch_query_excludes_dry_run_status():
    """Pinned: dry_run rows must NOT count as fresh activity. A service
    stuck with AUTOPOSTER_DRY_RUN=1 writes dry_run rows every fire but
    nothing reaches the upstream API — treating those as 'fresh' would
    mask exactly that class of misconfiguration."""
    captured = {"sqls": []}

    class _Cur:
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def execute(self, sql, *args, **kwargs):
            captured["sqls"].append(sql)
        def fetchall(self): return []

    class _Conn:
        def cursor(self): return _Cur()
        def close(self): pass

    hc._fetch_last_post_per_channel_job("dsn://", connect_fn=lambda d: _Conn())
    select_sql = next((s for s in captured["sqls"] if "FROM post_log" in s), None)
    assert select_sql is not None, f"no SELECT FROM post_log found in {captured['sqls']}"
    assert "status = 'posted'" in select_sql
    assert "dry_run" not in select_sql


def test_postgres_reachable_pass():
    fake_conn = _FakeConn(rows=[(1,)])
    result = hc.check_postgres_reachable("dsn://", connect_fn=lambda dsn: fake_conn)
    assert result.status == hc.STATUS_PASS
    assert fake_conn.closed


def test_postgres_reachable_connect_error():
    def boom(dsn):
        raise ConnectionRefusedError("nope")
    result = hc.check_postgres_reachable("dsn://", connect_fn=boom)
    assert result.status == hc.STATUS_ERROR
    assert "ConnectionRefusedError" in result.detail


def test_postgres_reachable_query_error():
    fake = _FakeConn(fail_query=True)
    result = hc.check_postgres_reachable("dsn://", connect_fn=lambda dsn: fake)
    assert result.status == hc.STATUS_ERROR
    assert "SELECT 1 failed" in result.detail


def test_connect_with_retries_succeeds_after_one_failure():
    calls = {"n": 0}
    sleeps: list[float] = []

    def opener(dsn):
        calls["n"] += 1
        if calls["n"] == 1:
            raise TimeoutError("first try blip")
        return _FakeConn()

    conn = hc._connect_with_retries(
        "dsn://",
        open_fn=opener,
        sleep_fn=lambda s: sleeps.append(s),
    )
    assert isinstance(conn, _FakeConn)
    assert calls["n"] == 2
    assert sleeps == [5.0]


def test_connect_with_retries_gives_up_after_exhausting():
    calls = {"n": 0}

    def opener(dsn):
        calls["n"] += 1
        raise TimeoutError("dead")

    with pytest.raises(TimeoutError):
        hc._connect_with_retries(
            "dsn://",
            open_fn=opener,
            sleep_fn=lambda s: None,
        )
    assert calls["n"] == hc.DB_CONNECT_RETRIES + 1


# ---------------------------------------------------------------------------
# check_listings_git_freshness
# ---------------------------------------------------------------------------

def _git_run_returning(iso: str):
    def fake_run(*args, **kwargs):
        return subprocess.CompletedProcess(args=args[0], returncode=0, stdout=iso + "\n", stderr="")
    return fake_run


def test_git_freshness_pass():
    fresh = (NOW - timedelta(days=10)).isoformat()
    result = hc.check_listings_git_freshness("/repo", now=NOW, run_fn=_git_run_returning(fresh))
    assert result.status == hc.STATUS_PASS


def test_git_freshness_stale():
    old = (NOW - timedelta(days=30)).isoformat()
    result = hc.check_listings_git_freshness("/repo", now=NOW, run_fn=_git_run_returning(old))
    assert result.status == hc.STATUS_STALE
    assert result.is_alert


def test_git_freshness_subprocess_error():
    def fake_run(*args, **kwargs):
        raise subprocess.CalledProcessError(
            returncode=128, cmd=args[0], stderr="fatal: not a git repository"
        )
    result = hc.check_listings_git_freshness("/repo", now=NOW, run_fn=fake_run)
    assert result.status == hc.STATUS_ERROR
    assert "git log failed" in result.detail


def test_git_freshness_empty_stdout():
    def fake_run(*args, **kwargs):
        return subprocess.CompletedProcess(args=args[0], returncode=0, stdout="\n", stderr="")
    result = hc.check_listings_git_freshness("/repo", now=NOW, run_fn=fake_run)
    assert result.status == hc.STATUS_ERROR
    assert "no commit" in result.detail


# ---------------------------------------------------------------------------
# check_blog_freshness
# ---------------------------------------------------------------------------

def _human(days_ago: float) -> str:
    """NOW-relative date in the same format lib/blog.ts uses."""
    d = NOW - timedelta(days=days_ago)
    return f"{d:%B} {d.day}, {d.year}"


def _blog_source(*human_dates: str) -> str:
    """Minimal lib/blog.ts stand-in — one `date:` line per post."""
    return "\n".join(
        f'  {{\n    slug: "post-{i}",\n    date: "{d}",\n'
        f'    dateModified: "January 1, 2099",\n  }},'
        for i, d in enumerate(human_dates)
    )


def _reader(source: str):
    return lambda path: source


def test_blog_freshness_pass():
    src = _blog_source(_human(30), _human(3))
    result = hc.check_blog_freshness("/repo", now=NOW, read_fn=_reader(src))
    assert result.status == hc.STATUS_PASS
    assert (NOW - timedelta(days=3)).date().isoformat() in result.detail


def test_blog_freshness_stale_when_calendar_stalls():
    src = _blog_source(_human(60), _human(21))
    result = hc.check_blog_freshness("/repo", now=NOW, read_fn=_reader(src))
    assert result.status == hc.STATUS_STALE
    assert result.is_alert


def test_blog_freshness_ignores_date_modified():
    # dateModified is far in the future; only the real publish dates count.
    src = _blog_source(_human(21))
    result = hc.check_blog_freshness("/repo", now=NOW, read_fn=_reader(src))
    assert result.status == hc.STATUS_STALE


def test_blog_freshness_skips_unparsable_dates():
    src = _blog_source("not a date", _human(3))
    result = hc.check_blog_freshness("/repo", now=NOW, read_fn=_reader(src))
    assert result.status == hc.STATUS_PASS


def test_blog_freshness_error_when_no_dates():
    result = hc.check_blog_freshness("/repo", now=NOW, read_fn=_reader("export const x = []"))
    assert result.status == hc.STATUS_ERROR
    assert "no parsable post dates" in result.detail


def test_blog_freshness_error_when_unreadable():
    def boom(path):
        raise FileNotFoundError(path)
    result = hc.check_blog_freshness("/repo", now=NOW, read_fn=boom)
    assert result.status == hc.STATUS_ERROR


def test_blog_freshness_reads_the_real_file():
    """The shipped lib/blog.ts must parse — guards the regex against a
    reformat of the source that would silently zero this check out."""
    result = hc.check_blog_freshness(str(REPO_ROOT))
    assert result.status in (hc.STATUS_PASS, hc.STATUS_STALE)
    assert result.actual_age_days is not None


def test_blog_stale_has_remediation():
    stale = hc.CheckResult(
        name=f"blog cadence — {hc.BLOG_FILE}",
        status=hc.STATUS_STALE,
        detail="newest post dated 2026-06-20",
    )
    tip = hc._remediation_for(stale)
    assert tip and "content-keyword-strategy" in tip


# ---------------------------------------------------------------------------
# check_market_stats_freshness
# ---------------------------------------------------------------------------

def _iso(days_ago: float) -> str:
    return (NOW - timedelta(days=days_ago)).date().isoformat()


def _suburbs_source(main_date: str, *data_updated: str) -> str:
    """Minimal lib/suburbs.ts stand-in."""
    lines = [f"    dataUpdatedAt: '{d}'," for d in data_updated]
    lines.append(f"export const marketStatsLastUpdated = '{main_date}'")
    return "\n".join(lines)


def _cash_source(date: str) -> str:
    return f"export const cashOfferContentLastUpdated = '{date}'"


def _stats_reader(suburbs_src: str, cash_src: str):
    """Dispatch on filename — the check reads both TS sources."""
    def read(path):
        return suburbs_src if path.endswith("suburbs.ts") else cash_src
    return read


def test_market_stats_pass_when_fresh():
    read = _stats_reader(_suburbs_source(_iso(80), _iso(10)), _cash_source(_iso(90)))
    result = hc.check_market_stats_freshness("/repo", now=NOW, read_fn=read)
    # Newest date across both files wins — one recent dataUpdatedAt is enough.
    assert result.status == hc.STATUS_PASS
    assert _iso(10) in result.detail


def test_market_stats_stale_when_all_dates_old():
    read = _stats_reader(_suburbs_source(_iso(80), _iso(76)), _cash_source(_iso(90)))
    result = hc.check_market_stats_freshness("/repo", now=NOW, read_fn=read)
    assert result.status == hc.STATUS_STALE
    assert result.is_alert
    assert "re-run the Redfin sync" in result.detail


def test_market_stats_error_when_suburbs_has_no_dates():
    read = _stats_reader("export const x = []", _cash_source(_iso(1)))
    result = hc.check_market_stats_freshness("/repo", now=NOW, read_fn=read)
    assert result.status == hc.STATUS_ERROR
    assert hc.SUBURBS_FILE in result.detail


def test_market_stats_error_when_cash_offer_has_no_dates():
    # Guards the mirrored regex — a reformat of cash-offer-cities.ts must
    # surface as ERROR, not silently drop the file from the check.
    read = _stats_reader(_suburbs_source(_iso(1)), "export const x = []")
    result = hc.check_market_stats_freshness("/repo", now=NOW, read_fn=read)
    assert result.status == hc.STATUS_ERROR
    assert hc.CASH_OFFER_FILE in result.detail


def test_market_stats_error_when_unreadable():
    def boom(path):
        raise FileNotFoundError(path)
    result = hc.check_market_stats_freshness("/repo", now=NOW, read_fn=boom)
    assert result.status == hc.STATUS_ERROR


def test_market_stats_reads_the_real_files():
    """The shipped TS sources must parse — guards the regexes against a
    reformat that would silently zero this check out."""
    result = hc.check_market_stats_freshness(str(REPO_ROOT))
    assert result.status in (hc.STATUS_PASS, hc.STATUS_STALE)
    assert result.actual_age_days is not None


def test_market_stats_stale_has_remediation():
    stale = hc.CheckResult(
        name=f"market stats — {hc.SUBURBS_FILE}",
        status=hc.STATUS_STALE,
        detail="newest stats refresh 2026-08-20",
    )
    tip = hc._remediation_for(stale)
    assert tip and "Redfin" in tip and "lib/suburbs.ts" in tip


# ---------------------------------------------------------------------------
# check_site_uptime
# ---------------------------------------------------------------------------

class _FakeResponse:
    def __init__(self, status: int, body: bytes):
        self.status = status
        self._body = body
    def __enter__(self): return self
    def __exit__(self, *a): pass
    def read(self, n=None): return self._body if n is None else self._body[:n]
    def getcode(self): return self.status


def test_uptime_pass_with_marker():
    body = json.dumps({"status": "ok", "version": "x"}).encode()
    def opener(req, timeout=None):
        return _FakeResponse(200, body)
    r = hc.check_site_uptime("https://example.test/api/healthcheck", opener=opener)
    assert r.status == hc.STATUS_PASS


def test_uptime_error_when_marker_missing():
    """200 OK served by an error page or CDN cached body must not pass."""
    body = b"<html>maintenance</html>"
    def opener(req, timeout=None):
        return _FakeResponse(200, body)
    r = hc.check_site_uptime("https://example.test/api/healthcheck", opener=opener)
    assert r.status == hc.STATUS_ERROR
    assert "missing status:ok" in r.detail


def test_uptime_error_on_500():
    def opener(req, timeout=None):
        return _FakeResponse(500, b"err")
    r = hc.check_site_uptime("https://example.test/api/healthcheck", opener=opener)
    assert r.status == hc.STATUS_ERROR
    assert "HTTP 500" in r.detail


def test_uptime_error_on_network():
    import urllib.error
    attempts = {"n": 0}
    def opener(req, timeout=None):
        attempts["n"] += 1
        raise urllib.error.URLError("nope")
    with mock.patch.object(hc.time, "sleep", lambda s: None):
        r = hc.check_site_uptime("https://example.test/api/healthcheck", opener=opener)
    assert r.status == hc.STATUS_ERROR
    # Retries enabled: 1 initial + HEALTHCHECK_RETRIES.
    assert attempts["n"] == hc.HEALTHCHECK_RETRIES + 1


# ---------------------------------------------------------------------------
# check_lead_pipeline — daily SYSTEM TEST lead through /api/contact
# ---------------------------------------------------------------------------

def _channel(channel, configured=True, ok=True, detail=None):
    d = {"channel": channel, "configured": configured, "ok": ok}
    if detail is not None:
        d["detail"] = detail
    return d


def _contact_opener(payload, status=200, captured=None):
    body = json.dumps(payload).encode()

    def opener(req, timeout=None):
        if captured is not None:
            captured["req"] = req
        return _FakeResponse(status, body)

    return opener


ALL_CHANNELS_OK = {"ok": True, "channels": [
    _channel("clickup"), _channel("joshua-email"), _channel("sheet"), _channel("pushover"),
]}


def test_lead_pipeline_pass_and_payload_shape():
    """Green path — and pin the request contract: the secret header that
    unlocks the route's test mode, plus the SYSTEM TEST / system-test tagging
    that keeps the CRM sheet filterable and Josh's phone silent."""
    captured: dict = {}
    r = hc.check_lead_pipeline(
        "https://x/api/contact", "s3cret",
        opener=_contact_opener(ALL_CHANNELS_OK, captured=captured),
    )
    assert r.status == hc.STATUS_PASS
    assert "all 4 configured" in r.detail
    req = captured["req"]
    assert req.get_header("X-healthcheck-secret") == "s3cret"
    sent = json.loads(req.data.decode())
    assert sent["lead_type"] == "system-test"
    assert "SYSTEM TEST" in sent["name"]
    # Classifier safety: a space in the name (random_name rule) and no token
    # long enough to trip gibberish_body — a flagged test lead would arrive
    # with a spurious ⚠️ on every channel.
    assert " " in sent["name"]
    assert max(len(t) for t in sent["body"].split()) < 25
    assert "email" not in sent  # no auto-reply for a test lead


def test_lead_pipeline_alerts_on_failed_channel():
    """The SendGrid failure mode: a configured channel silently dead while
    every other check stays green. Must page, naming the channel and why."""
    payload = {"ok": True, "channels": [
        _channel("clickup", ok=False, detail="HTTP 401"),
        _channel("joshua-email"), _channel("sheet"), _channel("pushover"),
    ]}
    r = hc.check_lead_pipeline(
        "https://x/api/contact", "s3cret", opener=_contact_opener(payload),
    )
    assert r.status == hc.STATUS_ERROR
    assert r.is_alert
    assert "clickup(HTTP 401)" in r.detail


def test_lead_pipeline_unconfigured_channel_is_not_a_failure():
    """configured:false is an expected no-op (creds not set), not a page —
    but the channel is still named so silent shrinkage stays visible."""
    payload = {"ok": True, "channels": [
        _channel("clickup", configured=False, ok=False),
        _channel("joshua-email"), _channel("sheet"), _channel("pushover"),
    ]}
    r = hc.check_lead_pipeline(
        "https://x/api/contact", "s3cret", opener=_contact_opener(payload),
    )
    assert r.status == hc.STATUS_PASS
    assert "not configured: clickup" in r.detail


def test_lead_pipeline_alerts_on_502_with_channel_results():
    """Total delivery failure: the route answers 502 in test mode but still
    carries the per-channel results — judge by those, not just the status."""
    payload = {"error": "delivery failed", "channels": [
        _channel("clickup", ok=False, detail="HTTP 401"),
        _channel("joshua-email", ok=False, detail="403"),
        _channel("sheet", ok=False, detail="HTTP 500"),
        _channel("pushover", ok=False, detail="HTTP 400"),
    ]}
    r = hc.check_lead_pipeline(
        "https://x/api/contact", "s3cret",
        opener=_contact_opener(payload, status=502),
    )
    assert r.status == hc.STATUS_ERROR
    assert "HTTP 401" in r.detail


def test_lead_pipeline_gap_without_secret():
    """No CRON_SECRET must never page — and must never POST a lead."""
    def opener(req, timeout=None):
        raise AssertionError("must not submit a lead without the secret")
    r = hc.check_lead_pipeline("https://x/api/contact", None, opener=opener)
    assert r.status == hc.STATUS_GAP
    assert not r.is_alert


def test_lead_pipeline_error_when_channels_missing_from_200():
    """CRON_SECRET drift (GitHub secret != Vercel env) makes the route treat
    the POST as a normal visitor lead and return a bare {ok:true}. That must
    alert loudly — a quietly passing check that tests nothing is the exact
    blindness this exists to remove."""
    r = hc.check_lead_pipeline(
        "https://x/api/contact", "s3cret", opener=_contact_opener({"ok": True}),
    )
    assert r.status == hc.STATUS_ERROR
    assert "CRON_SECRET" in r.detail


def test_lead_pipeline_error_on_http_failure():
    r = hc.check_lead_pipeline(
        "https://x/api/contact", "s3cret",
        opener=_contact_opener({"error": "Server error"}, status=500),
    )
    assert r.status == hc.STATUS_ERROR
    assert "HTTP 500" in r.detail


def test_lead_pipeline_error_on_network_failure():
    import urllib.error
    attempts = {"n": 0}

    def opener(req, timeout=None):
        attempts["n"] += 1
        raise urllib.error.URLError("nope")

    with mock.patch.object(hc.time, "sleep", lambda s: None):
        r = hc.check_lead_pipeline("https://x/api/contact", "s3cret", opener=opener)
    assert r.status == hc.STATUS_ERROR
    assert "unreachable" in r.detail
    assert attempts["n"] == hc.HEALTHCHECK_RETRIES + 1


def test_lead_pipeline_failure_has_remediation():
    r = hc.CheckResult(
        name="lead pipeline — /api/contact test lead",
        status="error",
        detail="test lead FAILED on configured channel(s): clickup(HTTP 401)",
    )
    tip = hc._remediation_for(r)
    assert tip is not None
    assert "CLICKUP_API_TOKEN" in tip
    assert "Vercel" in tip


def test_run_all_failed_lead_channel_triggers_exit_1(monkeypatch):
    """A dead lead channel has to page the next morning — the whole point."""
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(
        monkeypatch,
        healthcheck_status="pass",
        git_status="pass",
        latest_map=latest,
        lead_status="error",
    )
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 1


# ---------------------------------------------------------------------------
# check_workflow_last_run — did the scheduled Actions job actually succeed?
# ---------------------------------------------------------------------------

def _runs_opener(payload, status=200):
    body = json.dumps(payload).encode()
    def opener(req, timeout=None):
        return _FakeResponse(status, body)
    return opener


def _run_payload(conclusion):
    return {"workflow_runs": [{
        "conclusion": conclusion,
        "updated_at": "2026-08-09T08:48:36Z",
        "html_url": "https://github.com/o/r/actions/runs/1",
    }]}


def test_workflow_run_pass_on_success():
    r = hc.check_workflow_last_run(
        "sync-listings.yml", "Sync Compass Listings",
        repo="o/r", token="t", opener=_runs_opener(_run_payload("success")),
    )
    assert r.status == hc.STATUS_PASS


def test_workflow_run_error_on_failure():
    """The regression this check exists for: sync-listings red every morning
    while every freshness threshold still read green."""
    r = hc.check_workflow_last_run(
        "sync-listings.yml", "Sync Compass Listings",
        repo="o/r", token="t", opener=_runs_opener(_run_payload("failure")),
    )
    assert r.status == hc.STATUS_ERROR
    assert r.is_alert
    assert "actions/runs/1" in r.detail


def test_workflow_run_cancelled_is_gap_not_alert():
    r = hc.check_workflow_last_run(
        "sync-listings.yml", "Sync Compass Listings",
        repo="o/r", token="t", opener=_runs_opener(_run_payload("cancelled")),
    )
    assert r.status == hc.STATUS_GAP


def test_workflow_run_gap_without_token():
    """No credentials must never page — and must never hit the network."""
    def opener(req, timeout=None):
        raise AssertionError("should not call the API without a token")
    r = hc.check_workflow_last_run(
        "sync-listings.yml", "Sync Compass Listings",
        repo="o/r", token=None, opener=opener,
    )
    assert r.status == hc.STATUS_GAP
    assert not r.is_alert


def test_workflow_run_gap_when_never_run():
    r = hc.check_workflow_last_run(
        "sync-listings.yml", "Sync Compass Listings",
        repo="o/r", token="t", opener=_runs_opener({"workflow_runs": []}),
    )
    assert r.status == hc.STATUS_GAP


def test_workflow_run_error_on_api_failure():
    r = hc.check_workflow_last_run(
        "sync-listings.yml", "Sync Compass Listings",
        repo="o/r", token="t", opener=_runs_opener({"message": "Bad creds"}, status=401),
    )
    assert r.status == hc.STATUS_ERROR
    assert "HTTP 401" in r.detail


def test_monitored_workflows_exist_on_disk():
    """Guard against a rename silently turning a check into a permanent GAP."""
    workflows_dir = Path(__file__).resolve().parent.parent / ".github" / "workflows"
    for workflow_file, _label in hc.MONITORED_WORKFLOWS:
        assert (workflows_dir / workflow_file).exists(), workflow_file


# ---------------------------------------------------------------------------
# check_stuck_sync_prs — is a sync-listings PR sitting open past auto-merge?
# ---------------------------------------------------------------------------

def _pr(branch: str, hours_ago: float, number: int = 1) -> dict:
    created = NOW - timedelta(hours=hours_ago)
    return {
        "number": number,
        "head": {"ref": branch},
        "created_at": created.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "html_url": f"https://github.com/o/r/pull/{number}",
    }


def test_sync_prs_stale_when_pr_stuck_over_a_day():
    """The regression this check exists for: the workflow run concludes green
    while its PR never merges and listings go stale on the live site."""
    prs = [_pr("sync-listings/2026-05-08-080000", hours_ago=7 * 24, number=301)]
    r = hc.check_stuck_sync_prs(
        repo="o/r", token="t", now=NOW, opener=_runs_opener(prs),
    )
    assert r.status == hc.STATUS_STALE
    assert r.is_alert
    assert "pull/301" in r.detail
    assert "jammed" in r.detail


def test_sync_prs_stale_reports_oldest_of_stack():
    """Six stacked PRs (the 2026-08-18 jam): alert links the oldest one."""
    prs = [
        _pr(f"sync-listings/2026-05-{9 + i:02d}-080000", hours_ago=(6 - i) * 24 + 1, number=300 + i)
        for i in range(6)
    ]
    r = hc.check_stuck_sync_prs(
        repo="o/r", token="t", now=NOW, opener=_runs_opener(prs),
    )
    assert r.status == hc.STATUS_STALE
    assert "6 open sync-listings/" in r.detail
    assert "pull/300" in r.detail  # the oldest


def test_sync_prs_pass_when_pr_fresh():
    """Last night's PR a few hours old is the normal pre-merge window."""
    prs = [_pr("sync-listings/2026-05-15-080000", hours_ago=4, number=310)]
    r = hc.check_stuck_sync_prs(
        repo="o/r", token="t", now=NOW, opener=_runs_opener(prs),
    )
    assert r.status == hc.STATUS_PASS
    assert not r.is_alert


def test_sync_prs_pass_when_no_open_prs():
    r = hc.check_stuck_sync_prs(
        repo="o/r", token="t", now=NOW, opener=_runs_opener([]),
    )
    assert r.status == hc.STATUS_PASS


def test_sync_prs_ignores_non_sync_branches():
    """A long-lived feature PR must not page — only sync-listings/* counts."""
    prs = [_pr("research/some-feature", hours_ago=30 * 24, number=200)]
    r = hc.check_stuck_sync_prs(
        repo="o/r", token="t", now=NOW, opener=_runs_opener(prs),
    )
    assert r.status == hc.STATUS_PASS


def test_sync_prs_gap_without_token():
    """No credentials must never page — and must never hit the network."""
    def opener(req, timeout=None):
        raise AssertionError("should not call the API without a token")
    r = hc.check_stuck_sync_prs(repo="o/r", token=None, now=NOW, opener=opener)
    assert r.status == hc.STATUS_GAP
    assert not r.is_alert


def test_sync_prs_error_on_api_failure():
    r = hc.check_stuck_sync_prs(
        repo="o/r", token="t", now=NOW,
        opener=_runs_opener({"message": "Bad creds"}, status=401),
    )
    assert r.status == hc.STATUS_ERROR
    assert "HTTP 401" in r.detail


def test_sync_prs_error_when_api_down():
    import urllib.error
    def opener(req, timeout=None):
        raise urllib.error.URLError("nope")
    r = hc.check_stuck_sync_prs(repo="o/r", token="t", now=NOW, opener=opener)
    assert r.status == hc.STATUS_ERROR
    assert "unreachable" in r.detail


def test_sync_prs_parses_response_larger_than_500kb():
    """Regression (2026-08-19): 29 open PRs pushed the Pulls payload past a
    500 KB read cap, truncating the JSON mid-string — the check reported
    [ERR] unparsable instead of paging on the stuck sync PR it had found."""
    prs = [_pr("sync-listings/2026-05-08-080000", hours_ago=7 * 24, number=301)]
    prs[0]["body"] = "x" * 600_000
    r = hc.check_stuck_sync_prs(
        repo="o/r", token="t", now=NOW, opener=_runs_opener(prs),
    )
    assert r.status == hc.STATUS_STALE
    assert "pull/301" in r.detail


# ---------------------------------------------------------------------------
# Orchestration + exit codes
# ---------------------------------------------------------------------------

def _patch_dns_helpers(monkeypatch, *, healthcheck_status, git_status, latest_map=None, reach_status="pass", last_attempt_map=None, workflow_status="pass", blog_status="pass", market_stats_status="pass", sync_prs_status="pass", lead_status="pass"):
    """Replace per-check functions with deterministic fakes."""
    monkeypatch.setattr(
        hc,
        "check_site_uptime",
        lambda url, opener=None: hc.CheckResult(
            name=f"site uptime — {url}",
            status=healthcheck_status,
            detail="patched",
        ),
    )
    monkeypatch.setattr(
        hc,
        "check_lead_pipeline",
        lambda url, secret, opener=None: hc.CheckResult(
            name="lead pipeline — /api/contact test lead",
            status=lead_status,
            detail="patched",
        ),
    )
    monkeypatch.setattr(
        hc,
        "check_listings_git_freshness",
        lambda repo_dir, now=None, run_fn=None: hc.CheckResult(
            name=f"sync-listings — {hc.LISTINGS_FILE}",
            status=git_status,
            detail="patched",
        ),
    )
    monkeypatch.setattr(
        hc,
        "check_blog_freshness",
        lambda repo_dir, now=None, read_fn=None: hc.CheckResult(
            name=f"blog cadence — {hc.BLOG_FILE}",
            status=blog_status,
            detail="patched",
        ),
    )
    monkeypatch.setattr(
        hc,
        "check_market_stats_freshness",
        lambda repo_dir, now=None, read_fn=None: hc.CheckResult(
            name=f"market stats — {hc.SUBURBS_FILE}",
            status=market_stats_status,
            detail="patched",
        ),
    )
    monkeypatch.setattr(
        hc,
        "check_postgres_reachable",
        lambda dsn, connect_fn=None: hc.CheckResult(
            name="postgres reachable",
            status=reach_status,
            detail="patched",
        ),
    )
    monkeypatch.setattr(
        hc,
        "_fetch_last_post_per_channel_job",
        lambda dsn, connect_fn=None: latest_map or {},
    )
    monkeypatch.setattr(
        hc,
        "_fetch_last_attempt_per_channel_job",
        lambda dsn, connect_fn=None: last_attempt_map or {},
    )
    monkeypatch.setattr(
        hc,
        "check_workflow_last_run",
        lambda wf, label, repo=None, token=None, opener=None: hc.CheckResult(
            name=f"github-actions — {label}",
            status=workflow_status,
            detail="patched",
        ),
    )
    monkeypatch.setattr(
        hc,
        "check_stuck_sync_prs",
        lambda repo=None, token=None, now=None, opener=None: hc.CheckResult(
            name="sync-listings — open PRs",
            status=sync_prs_status,
            detail="patched",
        ),
    )


def test_run_all_all_green(monkeypatch):
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 0
    # site uptime + lead pipeline + listings git + blog cadence + market stats
    # + open sync PRs + reach + monitored workflows + one per expected pipeline
    assert len(results) == 7 + len(hc.MONITORED_WORKFLOWS) + len(hc.EXPECTED_JOBS)


def test_run_all_misconfig_when_no_dsn(monkeypatch):
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass")
    results = hc.run_all_checks(
        dsn=None, healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 2
    assert any(r.status == hc.STATUS_MISCONFIG for r in results)


def test_run_all_db_unreachable_downgrades(monkeypatch):
    _patch_dns_helpers(
        monkeypatch,
        healthcheck_status="pass",
        git_status="pass",
        reach_status="error",
    )
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    # Postgres-reach ERROR triggers exit 1; per-pipeline checks become a single GAP.
    assert hc.determine_exit_code(results) == 1
    pipeline_results = [r for r in results if r.name == "autoposter pipelines"]
    assert len(pipeline_results) == 1
    assert pipeline_results[0].status == hc.STATUS_GAP


def test_run_all_stale_pipeline_triggers_exit_1(monkeypatch):
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    # Make autoposter-listing stale.
    latest[("facebook", "listing-spotlight")] = _fake_latest(99)
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 1


def test_run_all_stale_blog_triggers_exit_1(monkeypatch):
    """A stalled content calendar has to page, not sit quiet for weeks."""
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(
        monkeypatch,
        healthcheck_status="pass",
        git_status="pass",
        latest_map=latest,
        blog_status="stale",
    )
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 1


def test_run_all_stale_market_stats_triggers_exit_1(monkeypatch):
    """Rotted Redfin figures on the money pages have to page, not sit quiet
    until guide prices visibly disagree with market pages again."""
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(
        monkeypatch,
        healthcheck_status="pass",
        git_status="pass",
        latest_map=latest,
        market_stats_status="stale",
    )
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 1


def test_run_all_red_workflow_triggers_exit_1(monkeypatch):
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(
        monkeypatch,
        healthcheck_status="pass",
        git_status="pass",
        latest_map=latest,
        workflow_status="error",
    )
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 1


def test_run_all_stuck_sync_pr_triggers_exit_1(monkeypatch):
    """A jammed auto-merge has to page the next morning, not at 17 days."""
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(
        monkeypatch,
        healthcheck_status="pass",
        git_status="pass",
        latest_map=latest,
        sync_prs_status="stale",
    )
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 1


def test_run_all_checks_workflows_even_without_dsn(monkeypatch):
    """A missing DATABASE_URL returns early — the workflow checks must run
    before that point, or a broken automation stays invisible."""
    _patch_dns_helpers(
        monkeypatch, healthcheck_status="pass", git_status="pass", workflow_status="error"
    )
    results = hc.run_all_checks(
        dsn=None, healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert any(r.name.startswith("github-actions —") and r.is_alert for r in results)


def test_run_all_never_logged_is_not_an_alert(monkeypatch):
    """Channel rows that have never appeared in post_log => GAP, not failure."""
    # latest_map missing the linkedin + gbp entries — simulates the current
    # state where Vercel-side crons don't yet write to post_log.
    latest = {
        ("facebook", "listing-spotlight"): _fake_latest(1),
        ("facebook", "content-market-stats"): _fake_latest(1),
        ("facebook", "content-testimonial"): _fake_latest(1),
        ("facebook", "content-tips"): _fake_latest(1),
        ("facebook", "content-engagement"): _fake_latest(1),
    }
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 0
    gaps = [r for r in results if r.status == hc.STATUS_GAP]
    assert any("linkedin" in r.name for r in gaps)
    assert any("gbp" in r.name.lower() for r in gaps)


# ---------------------------------------------------------------------------
# Report formatting
# ---------------------------------------------------------------------------

def test_report_includes_gaps_section_on_pass():
    results = [hc.CheckResult(name="x", status="pass", detail="ok")]
    text = hc.format_text_report(results, now=NOW, hostname="ci-runner")
    assert "DOCUMENTED GAPS" in text
    assert "/api/cron/indexnow" in text
    assert "OK — all pipelines fresh" in text


def test_report_includes_alerts_section_on_fail():
    results = [
        hc.CheckResult(name="x", status="pass", detail="ok"),
        hc.CheckResult(name="autoposter-listing", status="stale", detail="last write 99d ago"),
    ]
    text = hc.format_text_report(results, now=NOW, hostname="ci-runner")
    assert "FAIL — 1 alert" in text
    assert "ALERTS" in text
    assert "autoposter-listing" in text
    assert "last write 99d ago" in text
    # Gaps still present in alert emails.
    assert "DOCUMENTED GAPS" in text


def test_report_includes_remediation_section_when_actionable():
    """STALE/ERROR/MISCONFIG results should produce a HOW TO FIX section
    with per-failure tips and quick links. Green runs should not."""
    results = [
        hc.CheckResult(
            name="autoposter-listing (FB) — listing-spotlight",
            status="stale",
            detail="last write 4.7d ago",
        ),
    ]
    text = hc.format_text_report(results, now=NOW, hostname="ci-runner")
    assert "HOW TO FIX" in text
    assert "FB_PAGE_TOKEN" in text  # autoposter-listing tip mentions the token
    assert "~/.facebook_tokens" in text
    assert "Quick links:" in text
    assert "railway.com/project/" in text  # quick link URL


def test_report_no_remediation_when_all_green():
    results = [hc.CheckResult(name="x", status="pass", detail="ok")]
    text = hc.format_text_report(results, now=NOW, hostname="ci-runner")
    assert "HOW TO FIX" not in text
    assert "Quick links:" not in text


@pytest.mark.parametrize("check_name,must_contain", [
    ("postgres reachable", "DATABASE_PUBLIC_URL"),
    ("site uptime — https://example/", "vercel.com"),
    ("sync-listings — lib/listings.ts", "Sync Compass Listings"),
    ("market stats — lib/suburbs.ts", "Redfin Data Center"),
    ("sync-listings — open PRs", "merge the NEWEST"),
    ("github-actions — Sync Compass Listings", "Re-run"),
    ("autoposter-listing (FB) — listing-spotlight", "FB_PAGE_TOKEN"),
    ("monthly-market-update (FB) — market snapshot", "lib/market-snapshot.ts"),
    ("vercel-cron-linkedin", "/api/linkedin/auth"),
    ("vercel-cron-gbp", "GBP"),
])
def test_remediation_tip_per_failure_type(check_name, must_contain):
    """Each known failure mode produces an actionable tip mentioning the
    specific console/command for that pipeline."""
    r = hc.CheckResult(name=check_name, status="stale", detail="")
    tip = hc._remediation_for(r)
    assert tip is not None, f"no tip returned for {check_name!r}"
    assert must_contain in tip, (
        f"tip for {check_name!r} missing {must_contain!r}; got: {tip}"
    )


def test_remediation_returns_none_for_pass_and_gap():
    assert hc._remediation_for(hc.CheckResult(name="x", status="pass", detail="")) is None
    assert hc._remediation_for(hc.CheckResult(name="x", status="gap", detail="")) is None


def test_misconfig_database_url_gets_tip():
    """The most common MISCONFIG (no DATABASE_URL) gets a specific add-the-secret tip."""
    r = hc.CheckResult(
        name="postgres",
        status="misconfig",
        detail="DATABASE_URL is not set — DB-dependent checks skipped",
    )
    tip = hc._remediation_for(r)
    assert tip is not None
    assert "Secrets" in tip


# ---------------------------------------------------------------------------
# CLI / main()
# ---------------------------------------------------------------------------

def test_main_no_email_prints_report(monkeypatch, capsys):
    latest = {(j.channel, j.job_name): _fake_latest_real(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    monkeypatch.setenv("DATABASE_URL", "dsn://")
    monkeypatch.delenv("GMAIL_USER", raising=False)
    monkeypatch.delenv("GMAIL_APP_PASSWORD", raising=False)
    monkeypatch.delenv("ALERT_TO_EMAIL", raising=False)
    rc = hc.main(["--no-email", "--repo-dir", "/repo"])
    captured = capsys.readouterr()
    assert rc == 0
    assert "OK — all pipelines fresh" in captured.out


def test_main_sends_email_on_failure(monkeypatch, capsys):
    latest = {(j.channel, j.job_name): _fake_latest_real(0.5) for j in hc.EXPECTED_JOBS}
    latest[("facebook", "listing-spotlight")] = _fake_latest_real(99)
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    monkeypatch.setenv("DATABASE_URL", "dsn://")
    monkeypatch.setenv("GMAIL_USER", "bot@example.com")
    monkeypatch.setenv("GMAIL_APP_PASSWORD", "xxxx")
    monkeypatch.setenv("ALERT_TO_EMAIL", "to@example.com")

    sent = {}
    def fake_send(*, subject, body, smtp_user, smtp_password, to_addr):
        sent["subject"] = subject
        sent["body"] = body
        sent["to"] = to_addr
    monkeypatch.setattr(hc, "send_email", fake_send)

    rc = hc.main(["--repo-dir", "/repo"])
    assert rc == 1
    assert "FAIL" in sent["subject"]
    assert "autoposter-listing" in sent["body"]
    assert sent["to"] == "to@example.com"


def test_main_does_not_email_on_pass_without_always_email(monkeypatch):
    latest = {(j.channel, j.job_name): _fake_latest_real(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    monkeypatch.setenv("DATABASE_URL", "dsn://")
    monkeypatch.setenv("GMAIL_USER", "bot@example.com")
    monkeypatch.setenv("GMAIL_APP_PASSWORD", "xxxx")
    monkeypatch.setenv("ALERT_TO_EMAIL", "to@example.com")

    called = {"n": 0}
    monkeypatch.setattr(hc, "send_email", lambda **kw: called.__setitem__("n", called["n"] + 1))

    rc = hc.main(["--repo-dir", "/repo"])
    assert rc == 0
    assert called["n"] == 0


def test_main_emails_on_pass_with_always_email(monkeypatch):
    latest = {(j.channel, j.job_name): _fake_latest_real(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    monkeypatch.setenv("DATABASE_URL", "dsn://")
    monkeypatch.setenv("GMAIL_USER", "bot@example.com")
    monkeypatch.setenv("GMAIL_APP_PASSWORD", "xxxx")
    monkeypatch.setenv("ALERT_TO_EMAIL", "to@example.com")

    called = {"n": 0}
    monkeypatch.setattr(hc, "send_email", lambda **kw: called.__setitem__("n", called["n"] + 1))

    rc = hc.main(["--repo-dir", "/repo", "--always-email"])
    assert rc == 0
    assert called["n"] == 1


def test_main_empty_healthcheck_url_env_falls_back_to_default(monkeypatch):
    """GitHub Actions resolves `${{ vars.X }}` to '' when X is undefined,
    which Python's `os.environ.get(key, default)` returns AS '' (not the
    default). Confirm we fall through to HEALTHCHECK_URL_DEFAULT in that
    case rather than passing '' to urllib (which raises ValueError)."""
    captured: dict = {}

    def fake_check(url, opener=None):
        captured["url"] = url
        return hc.CheckResult(name=f"site uptime — {url}", status="pass", detail="ok")

    monkeypatch.setattr(hc, "check_site_uptime", fake_check)
    monkeypatch.setattr(
        hc,
        "check_listings_git_freshness",
        lambda repo_dir, now=None, run_fn=None: hc.CheckResult(
            name="git", status="pass", detail="ok"
        ),
    )
    monkeypatch.setenv("HEALTHCHECK_URL", "")  # the broken-empty case
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)  # keep the Actions API out of it
    monkeypatch.delenv("CRON_SECRET", raising=False)  # never POST a real test lead from a unit test

    hc.main(["--no-email", "--repo-dir", "/repo"])
    assert captured["url"] == hc.HEALTHCHECK_URL_DEFAULT


def test_main_misconfig_exit_2_without_dsn(monkeypatch):
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    rc = hc.main(["--no-email", "--repo-dir", "/repo"])
    assert rc == 2


def test_main_email_send_failure_keeps_alert_exit_code(monkeypatch):
    """If the SMTP send blows up we still surface the underlying exit-1; we
    do NOT swallow the alert by returning 0."""
    latest = {(j.channel, j.job_name): _fake_latest_real(0.5) for j in hc.EXPECTED_JOBS}
    latest[("facebook", "listing-spotlight")] = _fake_latest_real(99)
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    monkeypatch.setenv("DATABASE_URL", "dsn://")
    monkeypatch.setenv("GMAIL_USER", "bot@example.com")
    monkeypatch.setenv("GMAIL_APP_PASSWORD", "xxxx")
    monkeypatch.setenv("ALERT_TO_EMAIL", "to@example.com")
    def boom(**kwargs):
        raise RuntimeError("smtp down")
    monkeypatch.setattr(hc, "send_email", boom)
    rc = hc.main(["--repo-dir", "/repo"])
    assert rc == 1
