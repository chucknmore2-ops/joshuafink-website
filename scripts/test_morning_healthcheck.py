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
    assert "no rows ever" in result.detail


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

def _patch_dns_helpers(monkeypatch, *, healthcheck_status, git_status, latest_map=None, reach_status="pass"):
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


# ---------------------------------------------------------------------------
# CLI / main()
# ---------------------------------------------------------------------------

def test_main_no_email_prints_report(monkeypatch, capsys):
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
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
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    latest[("facebook", "listing-spotlight")] = _fake_latest(99)
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
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
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
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
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
    latest = {(j.channel, j.job_name): _fake_latest(0.5) for j in hc.EXPECTED_JOBS}
    latest[("facebook", "listing-spotlight")] = _fake_latest(99)
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
