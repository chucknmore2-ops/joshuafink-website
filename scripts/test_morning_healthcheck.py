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
    # `extra` is allowed — e.g. instagram is documented but intentionally omitted.
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
    job = hc.EXPECTED_JOBS[1]  # content-market-stats
    attempts = {
        ("facebook", "content-market-stats"): hc.LastAttempt(
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
# Orchestration + exit codes
# ---------------------------------------------------------------------------

def _patch_dns_helpers(monkeypatch, *, healthcheck_status, git_status, latest_map=None, reach_status="pass", last_attempt_map=None):
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
        "check_listings_git_freshness",
        lambda repo_dir, now=None, run_fn=None: hc.CheckResult(
            name=f"sync-listings — {hc.LISTINGS_FILE}",
            status=git_status,
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


def test_run_all_all_green(monkeypatch):
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    _patch_dns_helpers(monkeypatch, healthcheck_status="pass", git_status="pass", latest_map=latest)
    results = hc.run_all_checks(
        dsn="dsn://", healthcheck_url="https://x/", repo_dir="/repo", now=NOW
    )
    assert hc.determine_exit_code(results) == 0
    # site uptime + git + reach + 7 pipeline checks = 10 results
    assert len(results) == 3 + len(hc.EXPECTED_JOBS)


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
    ("autoposter-listing (FB) — listing-spotlight", "FB_PAGE_TOKEN"),
    ("autoposter-stats (FB) — content-market-stats", "Cron Runs"),
    ("autoposter-testimonial (FB) — content-testimonial", "Cron Runs"),
    ("autoposter-tips (FB) — content-tips", "Cron Runs"),
    ("autoposter-engagement (FB) — content-engagement", "Cron Runs"),
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
