#!/usr/bin/env python3
"""Morning healthcheck for joshuafink.com automation pipelines.

External monitor, run from GitHub Actions on a weekday morning cron.
Verifies every background pipeline that writes to the Railway Postgres
`post_log` table is still producing fresh rows, plus a git freshness
probe on the daily listings sync, a run-status probe on the scheduled
GitHub Actions workflows, and an HTTPS probe on the public healthcheck
endpoint. Emails a per-check failure report via Gmail SMTP when anything
is stale or errors.

============================================================================
WHAT THIS MONITOR DOES AND DOES NOT COVER
============================================================================

COVERED (per `lib/admin-schedule.ts`):
  Railway autoposter (FB channel) — listing-spotlight (M/W/F)
  Monthly market update (FB channel) — monthly-market-update, fired on the
    5th by .github/workflows/monthly-market-update.yml, which posts the same
    lib/market-snapshot.ts figures to Facebook, LinkedIn and GBP. Facebook is
    the canary for all three. 35-day threshold, so one missed month pages.
  LinkedIn + GBP + Instagram — all three routes write to post_log on
    every fire (success and failure) since the lib/admin-db logPost
    wiring. A channel can still show as NEVER_LOGGED if the route has
    never fired since post_log existed — that's expected for a
    freshly-cut branch, not a failure.
  Blog publishing cadence — newest post date in lib/blog.ts. The weekly
    calendar in docs/content-keyword-strategy.md lives only on paper, so
    nothing else notices when it stalls (weeks 6-12 went unwritten for a
    fortnight in Aug 2026 and every other check stayed green).
  GitHub Actions sync-listings — checked via git mtime of lib/listings.ts
  GitHub Actions scheduled workflows — latest completed run of each must
    have concluded 'success' (needs GITHUB_TOKEN; otherwise a GAP). This
    is the fast signal: freshness thresholds only notice days later.
  Open sync-listings PRs — a sync-listings/* PR still open after ~24h means
    auto-merge jammed even though the workflow run itself concluded green.
  Public uptime — GET https://joshuafink.com/api/healthcheck

NOT COVERED (documented gaps — listed in every alert email):
  /api/cron/indexnow            no DB write; signal lives in Vercel logs
  /api/cron/agent-briefing      sends email + ClickUp task, no DB write
  Local content engine          runs on Joshua's Mac via Ollama; out of
                                GitHub Actions reach
  Holidays                      v1 is holiday-naive — a US federal
                                holiday on a cron day will look STALE
                                until the next firing
  DST drift                     v1 anchors thresholds in days, not local
                                clock time; +/-1h drift is acceptable

A green run from this monitor proves the Railway autoposter and the
listings-sync are alive; it does NOT prove the items in the gap list.

============================================================================
EXIT CODES
  0   all checked pipelines fresh (gaps are not failures)
  1   one or more pipelines stale or check errored
  2   misconfiguration (missing DATABASE_URL, malformed DSN, etc.)
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import logging
import os
import re
import smtplib
import socket
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from typing import Callable, Iterable, Optional

log = logging.getLogger("morning_healthcheck")


# ---------------------------------------------------------------------------
# Schedule — mirror of lib/admin-schedule.ts plus the daily listings sync.
# Keep these in sync by hand; tests assert the channel/job_name list against
# the TS source on every CI run.
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ExpectedJob:
    """One scheduled pipeline that should be producing fresh post_log rows."""
    label: str
    channel: str
    job_name: str
    cadence_ct: str
    max_age_days: float


EXPECTED_JOBS: tuple[ExpectedJob, ...] = (
    # Railway autoposter — Mon/Wed/Fri 9am CT. Friday → Monday is 3d, +1d buffer.
    ExpectedJob(
        label="autoposter-listing (FB) — listing-spotlight",
        channel="facebook",
        job_name="listing-spotlight",
        cadence_ct="Mon/Wed/Fri 9:00am CT",
        max_age_days=4,
    ),
    # Monthly market update — .github/workflows/monthly-market-update.yml fires
    # FB + LinkedIn + GBP together on the 5th; Facebook is the canary for all
    # three. 31d nominal + 4d buffer = 35d, so a single missed month pages but a
    # report landing a few days late does not.
    #
    # This REPLACES the four Railway `autoposter-*` content jobs (market-stats,
    # testimonial, tips, engagement) that were monitored here for months. Those
    # Railway services were never actually created, so they could only ever
    # report [GAP] — noise that made a real gap indistinguishable from the
    # permanent ones.
    ExpectedJob(
        label="monthly-market-update (FB) — market snapshot",
        channel="facebook",
        job_name="monthly-market-update",
        cadence_ct="5th of each month, 9:00am CT",
        max_age_days=35,
    ),
    # Weekly Vercel-side crons. 7d nominal + 2d weekend buffer = 9d. If a
    # channel never appears we surface a gap instead of a failure.
    ExpectedJob(
        label="vercel-cron-linkedin",
        channel="linkedin",
        job_name="linkedin-post",
        cadence_ct="Thu 9:00am CT",
        max_age_days=9,
    ),
    ExpectedJob(
        label="vercel-cron-gbp",
        channel="gbp",
        job_name="gbp-post",
        cadence_ct="Tue 9:00am CT",
        max_age_days=9,
    ),
    # Fired weekly by .github/workflows/social-autopost.yml (not Vercel Cron).
    ExpectedJob(
        label="github-actions-instagram",
        channel="instagram",
        job_name="instagram-post",
        cadence_ct="Wed 9:00am CT",
        max_age_days=9,
    ),
)

# Daily Compass scrape (.github/workflows/sync-listings.yml, 08:00 UTC).
# The threshold stays generous because the sync only commits when Compass
# actually changed — a quiet fortnight is normal and not a failure. Whether
# the *workflow* is healthy is answered by MONITORED_WORKFLOWS below, not here.
LISTINGS_FILE = "lib/listings.ts"
LISTINGS_MAX_AGE_DAYS = 17

# Weekly blog cadence (docs/content-keyword-strategy.md). Measured from the
# newest `date:` in lib/blog.ts rather than the file's git mtime — a typo fix
# touches the file without publishing anything. 7d nominal + 7d buffer, so one
# skipped week is tolerated and two page. The schedule is human-run: nothing
# publishes these posts automatically, which is exactly why it needs a monitor.
BLOG_FILE = "lib/blog.ts"
BLOG_MAX_AGE_DAYS = 14
# `date: "August 3, 2026"` on hand-written posts. Anchored to the line start so
# the optional `dateModified:` field can't be mistaken for a publish date, and
# the generated market-update post (whose date is a variable, not a literal)
# is correctly ignored — it has its own monthly check.
BLOG_DATE_RE = re.compile(r'^\s*date:\s*"([^"]+)"', re.MULTILINE)

# Scheduled GitHub Actions workflows. Freshness thresholds are slow by design;
# a red workflow run is the immediate signal that an automation is broken.
# (sync-listings failed silently for days in Aug 2026 — main's branch
# protection rejected its push — and nothing here noticed.)
GITHUB_API_ROOT = "https://api.github.com"
GITHUB_REPO_DEFAULT = "chucknmore2-ops/joshuafink-website"
GITHUB_API_TIMEOUT_S = 15

MONITORED_WORKFLOWS: tuple[tuple[str, str], ...] = (
    ("sync-listings.yml", "Sync Compass Listings"),
    ("social-autopost.yml", "Social Autopost"),
    ("geo-audit.yml", "GEO Audit"),
    ("daily-tasks-pushover.yml", "Daily tasks Pushover"),
)

# Open PRs from the nightly listings sync (branch sync-listings/<timestamp>,
# supposed to auto-merge within minutes). The workflow can conclude 'success'
# while its PR never merges — rejected push, approval gate, whatever breaks
# next — so the run check stays green and the 17d freshness threshold takes
# weeks to notice. A sync PR still open after a day means auto-merge is jammed.
SYNC_PR_BRANCH_PREFIX = "sync-listings/"
SYNC_PR_MAX_AGE_HOURS = 24

HEALTHCHECK_URL_DEFAULT = "https://joshuafink.com/api/healthcheck"
HEALTHCHECK_TIMEOUT_S = 15
HEALTHCHECK_RETRIES = 2

DB_CONNECT_TIMEOUT_S = 10
DB_STATEMENT_TIMEOUT_MS = 5000
DB_CONNECT_RETRIES = 2  # so a transient blip is 3 total attempts


# ---------------------------------------------------------------------------
# Result model
# ---------------------------------------------------------------------------

# Tri-state — PASS / STALE / GAP — plus terminal ERROR/MISCONFIG. Only
# STALE and ERROR escalate to exit-1; GAP is documented coverage, not a
# failure.
STATUS_PASS = "pass"
STATUS_STALE = "stale"
STATUS_ERROR = "error"
STATUS_GAP = "gap"
STATUS_MISCONFIG = "misconfig"

ALERT_STATUSES = frozenset({STATUS_STALE, STATUS_ERROR})


@dataclass
class CheckResult:
    name: str
    status: str
    detail: str
    actual_age_days: Optional[float] = None
    expected_max_age_days: Optional[float] = None
    duration_ms: Optional[int] = None

    @property
    def is_alert(self) -> bool:
        return self.status in ALERT_STATUSES


@dataclass
class LastAttempt:
    """Most-recent post_log row of ANY status for one (channel, job_name).

    Diagnostic companion to the 'posted'-only freshness query: when a job is
    STALE this carries *why* — the latest row's status and (for failures) the
    upstream `error_message`. Never drives pass/fail; only enriches the detail.
    """
    status: str
    posted_at: Optional[datetime]
    error_message: Optional[str]


# Always-on documented gaps — shown in every alert email so a passing
# run is never mistaken for full coverage.
DOCUMENTED_GAPS: tuple[tuple[str, str], ...] = (
    (
        "/api/cron/indexnow (daily)",
        "Submits URLs to Bing/Yandex. No DB write — only signal is Vercel "
        "function logs. Not externally checkable from GitHub Actions.",
    ),
    (
        "/api/cron/agent-briefing (Mon)",
        "Sends SendGrid email + creates a ClickUp task. No DB write. Signal "
        "is the email landing in Chuck's inbox.",
    ),
    (
        "Holidays / DST",
        "v1 is holiday-naive and tolerates +/- ~1h DST drift. A US federal "
        "holiday on a scheduled day will surface as STALE until the next "
        "firing.",
    ),
)


# ---------------------------------------------------------------------------
# DB layer
# ---------------------------------------------------------------------------

def _open_connection(dsn: str):
    """Open one short-lived Postgres connection with timeouts + SSL.

    Imported lazily so unit tests can run without psycopg2 installed.
    """
    import psycopg2  # type: ignore

    # Railway public networking requires TLS. We don't pin a CA — Vercel's
    # admin-db connector also passes rejectUnauthorized:false; the host is
    # opaque and rotates. v1 accepts the same trust posture.
    return psycopg2.connect(
        dsn,
        connect_timeout=DB_CONNECT_TIMEOUT_S,
        sslmode="require",
        application_name="morning_healthcheck",
    )


def _connect_with_retries(
    dsn: str,
    *,
    open_fn: Callable[[str], object] = _open_connection,
    sleep_fn: Callable[[float], None] = time.sleep,
):
    """Two retries with 5s linear backoff. Transient network blips != page."""
    last_exc: Optional[BaseException] = None
    for attempt in range(DB_CONNECT_RETRIES + 1):
        try:
            return open_fn(dsn)
        except Exception as exc:  # noqa: BLE001 — broad on purpose, includes OperationalError + socket.timeout
            last_exc = exc
            if attempt < DB_CONNECT_RETRIES:
                wait_s = 5.0 * (attempt + 1)
                log.warning(
                    "DB connect attempt %d failed (%s) — retry in %ss",
                    attempt + 1,
                    type(exc).__name__,
                    wait_s,
                )
                sleep_fn(wait_s)
    assert last_exc is not None
    raise last_exc


# ---------------------------------------------------------------------------
# Individual checks. Each is independent — exceptions never abort the others.
# ---------------------------------------------------------------------------

def check_postgres_reachable(
    dsn: str,
    *,
    connect_fn: Callable[[str], object] = _connect_with_retries,
) -> CheckResult:
    """Cheap sanity check — can we open a connection and SELECT 1?"""
    t0 = time.monotonic()
    try:
        conn = connect_fn(dsn)
    except Exception as exc:  # noqa: BLE001
        return CheckResult(
            name="postgres reachable",
            status=STATUS_ERROR,
            detail=f"connect failed after retries: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    try:
        with conn.cursor() as cur:  # type: ignore[attr-defined]
            cur.execute(f"SET statement_timeout = {DB_STATEMENT_TIMEOUT_MS}")
            cur.execute("SELECT 1")
            cur.fetchone()
    except Exception as exc:  # noqa: BLE001
        return CheckResult(
            name="postgres reachable",
            status=STATUS_ERROR,
            detail=f"SELECT 1 failed: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )
    finally:
        try:
            conn.close()  # type: ignore[attr-defined]
        except Exception:  # noqa: BLE001
            pass

    return CheckResult(
        name="postgres reachable",
        status=STATUS_PASS,
        detail="connected, SELECT 1 ok",
        duration_ms=int((time.monotonic() - t0) * 1000),
    )


def _fetch_last_post_per_channel_job(
    dsn: str,
    *,
    connect_fn: Callable[[str], object] = _connect_with_retries,
) -> dict[tuple[str, str], datetime]:
    """One query — `MAX(posted_at)` grouped by (channel, job_name).

    Returns timezone-aware datetimes. Channels with no rows ever are simply
    absent from the dict (the per-channel check then surfaces a GAP).

    Counts ONLY `status = 'posted'` — `dry_run` rows do NOT prove the
    pipeline reached the upstream API. A service stuck with
    AUTOPOSTER_DRY_RUN=1 will write `dry_run` rows on every fire but
    nothing ever lands on Facebook; treating those as fresh would mask
    that exact misconfiguration. `failed` rows also don't count
    (failures are not freshness).
    """
    conn = connect_fn(dsn)
    try:
        with conn.cursor() as cur:  # type: ignore[attr-defined]
            cur.execute(f"SET statement_timeout = {DB_STATEMENT_TIMEOUT_MS}")
            cur.execute(
                """
                SELECT channel, job_name, MAX(posted_at) AS last_at
                  FROM post_log
                 WHERE status = 'posted'
                 GROUP BY channel, job_name
                """
            )
            rows = cur.fetchall()
    finally:
        try:
            conn.close()  # type: ignore[attr-defined]
        except Exception:  # noqa: BLE001
            pass

    out: dict[tuple[str, str], datetime] = {}
    for channel, job_name, last_at in rows:
        if last_at is None:
            continue
        if last_at.tzinfo is None:
            # Defensive — Postgres TIMESTAMP WITHOUT TIME ZONE would be UTC by convention.
            last_at = last_at.replace(tzinfo=timezone.utc)
        out[(channel, job_name)] = last_at
    return out


def _fetch_last_attempt_per_channel_job(
    dsn: str,
    *,
    connect_fn: Callable[[str], object] = _connect_with_retries,
) -> dict[tuple[str, str], LastAttempt]:
    """Most recent row of ANY status per (channel, job_name) — diagnostic only.

    Freshness is driven by `_fetch_last_post_per_channel_job` ('posted'-only).
    This companion answers *why* a job is stale: a `failed` row carries the
    upstream `error_message` (e.g. `(#200) ... pages_manage_posts`), a `dry_run`
    row means `AUTOPOSTER_DRY_RUN=1` is still set, and an absent entry means the
    service is writing no rows at all (paused / crashed / nothing eligible).

    Unlike the freshness query this does NOT filter on status — it deliberately
    scans every status to find the latest attempt. Callers treat any failure
    here as "no diagnostics" rather than letting it fail the whole run.
    """
    conn = connect_fn(dsn)
    try:
        with conn.cursor() as cur:  # type: ignore[attr-defined]
            cur.execute(f"SET statement_timeout = {DB_STATEMENT_TIMEOUT_MS}")
            cur.execute(
                """
                SELECT DISTINCT ON (channel, job_name)
                       channel, job_name, status, posted_at, error_message
                  FROM post_log
                 ORDER BY channel, job_name, posted_at DESC
                """
            )
            rows = cur.fetchall()
    finally:
        try:
            conn.close()  # type: ignore[attr-defined]
        except Exception:  # noqa: BLE001
            pass

    out: dict[tuple[str, str], LastAttempt] = {}
    for channel, job_name, status, posted_at, error_message in rows:
        if posted_at is not None and posted_at.tzinfo is None:
            posted_at = posted_at.replace(tzinfo=timezone.utc)
        out[(channel, job_name)] = LastAttempt(
            status=status, posted_at=posted_at, error_message=error_message
        )
    return out


# Cap on how much of a raw upstream error_message we echo into the alert email —
# enough to identify the Graph API error code, not a whole stack trace.
_DIAG_ERROR_MAXLEN = 240


def _diagnose_attempt(
    job: ExpectedJob,
    last_attempt_by_key: Optional[dict[tuple[str, str], LastAttempt]],
) -> str:
    """Build a one-line ' — why' suffix for a STALE/GAP detail string.

    Returns '' when there's nothing useful to add (no diagnostics available, or
    the most recent attempt IS the last successful post).
    """
    if not last_attempt_by_key:
        return ""
    att = last_attempt_by_key.get((job.channel, job.job_name))
    if att is None or att.status == "posted":
        return ""
    when = att.posted_at.isoformat() if att.posted_at else "unknown time"
    if att.status == "failed":
        err = (att.error_message or "no error_message recorded").strip()
        if len(err) > _DIAG_ERROR_MAXLEN:
            err = err[:_DIAG_ERROR_MAXLEN] + "…"
        return f" — latest attempt FAILED at {when}: {err}"
    if att.status == "dry_run":
        return (
            f" — latest attempt was a DRY RUN at {when} "
            f"(AUTOPOSTER_DRY_RUN=1 — dry_run rows are not counted as fresh; "
            f"set it to 0 to actually post)"
        )
    return f" — latest attempt status={att.status!r} at {when}"


def check_pipeline_freshness(
    job: ExpectedJob,
    latest_by_key: dict[tuple[str, str], datetime],
    *,
    now: Optional[datetime] = None,
    last_attempt_by_key: Optional[dict[tuple[str, str], LastAttempt]] = None,
) -> CheckResult:
    """One pipeline freshness check.

    NEVER_LOGGED ⇒ GAP (warning, not failure). Stale ⇒ STALE (failure).
    When `last_attempt_by_key` is supplied, STALE/GAP details are enriched
    with the most recent attempt's status + error so the alert says *why*
    (token error, stuck dry-run, etc.) instead of just "old".
    """
    now = now or datetime.now(timezone.utc)
    last_at = latest_by_key.get((job.channel, job.job_name))
    diag = _diagnose_attempt(job, last_attempt_by_key)
    if last_at is None:
        return CheckResult(
            name=job.label,
            status=STATUS_GAP,
            detail=(
                f"no successful ('posted') rows in post_log for "
                f"channel='{job.channel}', job_name='{job.job_name}'. "
                f"Pipeline may run but is not landing posts — track via "
                f"Vercel/Railway function logs."
            ) + diag,
            expected_max_age_days=job.max_age_days,
        )

    age = now - last_at
    age_days = age.total_seconds() / 86400.0
    detail = (
        f"last write {age_days:.1f}d ago at {last_at.isoformat()} "
        f"(threshold {job.max_age_days}d, cadence {job.cadence_ct})"
    )
    if age_days > job.max_age_days:
        return CheckResult(
            name=job.label,
            status=STATUS_STALE,
            detail=detail + diag,
            actual_age_days=age_days,
            expected_max_age_days=job.max_age_days,
        )
    return CheckResult(
        name=job.label,
        status=STATUS_PASS,
        detail=detail,
        actual_age_days=age_days,
        expected_max_age_days=job.max_age_days,
    )


def check_listings_git_freshness(
    repo_dir: str,
    *,
    now: Optional[datetime] = None,
    run_fn: Callable[..., subprocess.CompletedProcess] = subprocess.run,
) -> CheckResult:
    """Daily sync-listings workflow — verify lib/listings.ts isn't stale."""
    now = now or datetime.now(timezone.utc)
    t0 = time.monotonic()
    try:
        result = run_fn(
            ["git", "log", "-1", "--format=%cI", "--", LISTINGS_FILE],
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True,
            timeout=15,
        )
    except subprocess.CalledProcessError as exc:
        return CheckResult(
            name=f"sync-listings — {LISTINGS_FILE}",
            status=STATUS_ERROR,
            detail=f"git log failed (rc={exc.returncode}): {exc.stderr.strip()[:200]}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError) as exc:
        return CheckResult(
            name=f"sync-listings — {LISTINGS_FILE}",
            status=STATUS_ERROR,
            detail=f"git not runnable: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    iso = result.stdout.strip()
    if not iso:
        return CheckResult(
            name=f"sync-listings — {LISTINGS_FILE}",
            status=STATUS_ERROR,
            detail="git log returned no commit for this file",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    try:
        commit_dt = datetime.fromisoformat(iso).astimezone(timezone.utc)
    except ValueError as exc:
        return CheckResult(
            name=f"sync-listings — {LISTINGS_FILE}",
            status=STATUS_ERROR,
            detail=f"unparsable commit ISO ({iso!r}): {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    age_days = (now - commit_dt).total_seconds() / 86400.0
    detail = (
        f"last commit {age_days:.1f}d ago at {commit_dt.isoformat()} "
        f"(threshold {LISTINGS_MAX_AGE_DAYS}d, daily 08:00 UTC — commits only on a diff)"
    )
    if age_days > LISTINGS_MAX_AGE_DAYS:
        return CheckResult(
            name=f"sync-listings — {LISTINGS_FILE}",
            status=STATUS_STALE,
            detail=detail,
            actual_age_days=age_days,
            expected_max_age_days=LISTINGS_MAX_AGE_DAYS,
            duration_ms=int((time.monotonic() - t0) * 1000),
        )
    return CheckResult(
        name=f"sync-listings — {LISTINGS_FILE}",
        status=STATUS_PASS,
        detail=detail,
        actual_age_days=age_days,
        expected_max_age_days=LISTINGS_MAX_AGE_DAYS,
        duration_ms=int((time.monotonic() - t0) * 1000),
    )


def check_blog_freshness(
    repo_dir: str,
    *,
    now: Optional[datetime] = None,
    read_fn: Optional[Callable[[str], str]] = None,
) -> CheckResult:
    """Weekly blog calendar — is the newest post in lib/blog.ts still recent?

    Reads publish dates out of the source rather than asking git, because the
    thing being monitored is whether a *post* shipped, not whether the file
    was touched. Unparsable date strings are skipped rather than fatal; only
    an empty result set is an error.
    """
    now = now or datetime.now(timezone.utc)
    name = f"blog cadence — {BLOG_FILE}"
    t0 = time.monotonic()
    path = os.path.join(repo_dir, BLOG_FILE)

    def _default_read(p: str) -> str:
        with open(p, "r", encoding="utf-8") as fh:
            return fh.read()

    try:
        source = (read_fn or _default_read)(path)
    except OSError as exc:
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"could not read {BLOG_FILE}: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    newest: Optional[datetime] = None
    for raw in BLOG_DATE_RE.findall(source):
        try:
            parsed = datetime.strptime(raw.strip(), "%B %d, %Y").replace(
                tzinfo=timezone.utc
            )
        except ValueError:
            continue  # One malformed post shouldn't blind the whole check.
        if newest is None or parsed > newest:
            newest = parsed

    if newest is None:
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"no parsable post dates found in {BLOG_FILE}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    age_days = (now - newest).total_seconds() / 86400.0
    detail = (
        f"newest post dated {newest.date().isoformat()}, {age_days:.1f}d ago "
        f"(threshold {BLOG_MAX_AGE_DAYS}d, weekly calendar in "
        f"docs/content-keyword-strategy.md)"
    )
    return CheckResult(
        name=name,
        status=STATUS_STALE if age_days > BLOG_MAX_AGE_DAYS else STATUS_PASS,
        detail=detail,
        actual_age_days=age_days,
        expected_max_age_days=BLOG_MAX_AGE_DAYS,
        duration_ms=int((time.monotonic() - t0) * 1000),
    )


def check_workflow_last_run(
    workflow_file: str,
    label: str,
    *,
    repo: str,
    token: Optional[str],
    opener: Callable[..., "urllib.request.addinfourl"] = urllib.request.urlopen,
) -> CheckResult:
    """Did the latest completed run of one scheduled workflow succeed?

    Freshness checks are deliberately slow to fire; this is the same-morning
    signal. Without a GITHUB_TOKEN we report a GAP rather than an alert — a
    local run shouldn't page anyone just for lacking credentials.
    """
    name = f"github-actions — {label}"
    t0 = time.monotonic()
    if not token:
        return CheckResult(
            name=name,
            status=STATUS_GAP,
            detail="GITHUB_TOKEN not set — workflow run status not checked",
        )

    url = (
        f"{GITHUB_API_ROOT}/repos/{repo}/actions/workflows/{workflow_file}"
        f"/runs?status=completed&per_page=1"
    )
    try:
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token}",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "joshuafink-morning-healthcheck/1.0",
            },
        )
        with opener(req, timeout=GITHUB_API_TIMEOUT_S) as resp:
            http_status = getattr(resp, "status", None) or resp.getcode()
            body = resp.read(200_000).decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001 — network/HTTP error is the signal
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"Actions API unreachable: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    if http_status != 200:
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"Actions API returned HTTP {http_status} ({body[:120]!r})",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    try:
        runs = json.loads(body).get("workflow_runs") or []
    except (ValueError, AttributeError) as exc:
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"unparsable Actions API response: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    if not runs:
        return CheckResult(
            name=name,
            status=STATUS_GAP,
            detail=f"no completed runs yet for {workflow_file}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    run = runs[0]
    conclusion = run.get("conclusion")
    detail = (
        f"latest completed run concluded {conclusion!r} at "
        f"{run.get('updated_at') or run.get('created_at')} "
        f"({run.get('html_url')})"
    )
    if conclusion == "success":
        status = STATUS_PASS
    elif conclusion in ("failure", "timed_out", "startup_failure", "action_required"):
        status = STATUS_ERROR
    else:
        # cancelled / skipped / neutral — worth showing, not worth paging over.
        status = STATUS_GAP
    return CheckResult(
        name=name,
        status=status,
        detail=detail,
        duration_ms=int((time.monotonic() - t0) * 1000),
    )


def check_stuck_sync_prs(
    *,
    repo: str,
    token: Optional[str],
    now: Optional[datetime] = None,
    opener: Callable[..., "urllib.request.addinfourl"] = urllib.request.urlopen,
) -> CheckResult:
    """Is any sync-listings/* PR sitting open past the auto-merge window?

    Companion to check_workflow_last_run: that check sees a red *run*, but
    twice in Aug 2026 the run stayed green while the PR never merged (a
    rejected push, then an approval gate) and listings went a week stale.
    An open sync PR older than SYNC_PR_MAX_AGE_HOURS is the direct signal
    for every auto-merge failure mode, current and future.
    """
    name = "sync-listings — open PRs"
    now = now or datetime.now(timezone.utc)
    t0 = time.monotonic()
    if not token:
        return CheckResult(
            name=name,
            status=STATUS_GAP,
            detail="GITHUB_TOKEN not set — open sync PRs not checked",
        )

    url = f"{GITHUB_API_ROOT}/repos/{repo}/pulls?state=open&per_page=100"
    try:
        req = urllib.request.Request(
            url,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token}",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "joshuafink-morning-healthcheck/1.0",
            },
        )
        with opener(req, timeout=GITHUB_API_TIMEOUT_S) as resp:
            http_status = getattr(resp, "status", None) or resp.getcode()
            # No read cap: 29 open PRs pushed the payload past 500 KB on
            # 2026-08-19 and a capped read truncated the JSON mid-string,
            # turning the exact jam this check exists for into [ERR] noise.
            body = resp.read().decode("utf-8", errors="replace")
    except Exception as exc:  # noqa: BLE001 — network/HTTP error is the signal
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"Pulls API unreachable: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    if http_status != 200:
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"Pulls API returned HTTP {http_status} ({body[:120]!r})",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    try:
        pulls = json.loads(body)
        sync_prs = [
            p for p in pulls
            if ((p.get("head") or {}).get("ref") or "").startswith(SYNC_PR_BRANCH_PREFIX)
        ]
    except (ValueError, AttributeError, TypeError) as exc:
        return CheckResult(
            name=name,
            status=STATUS_ERROR,
            detail=f"unparsable Pulls API response: {type(exc).__name__}: {exc}",
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    stuck: list[tuple[dict, float]] = []
    for pr in sync_prs:
        try:
            created = datetime.fromisoformat(
                (pr.get("created_at") or "").replace("Z", "+00:00")
            )
        except ValueError:
            # Unparsable timestamp — fail safe: an unknown-age open sync PR
            # counts as stuck rather than being silently skipped.
            stuck.append((pr, float("inf")))
            continue
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age_h = (now - created).total_seconds() / 3600.0
        if age_h > SYNC_PR_MAX_AGE_HOURS:
            stuck.append((pr, age_h))

    if not stuck:
        detail = (
            f"no open {SYNC_PR_BRANCH_PREFIX}* PRs — auto-merge is keeping up"
            if not sync_prs
            else (
                f"{len(sync_prs)} open {SYNC_PR_BRANCH_PREFIX}* PR(s), all "
                f"within the {SYNC_PR_MAX_AGE_HOURS}h auto-merge window"
            )
        )
        return CheckResult(
            name=name,
            status=STATUS_PASS,
            detail=detail,
            duration_ms=int((time.monotonic() - t0) * 1000),
        )

    oldest_pr, oldest_age_h = max(stuck, key=lambda t: t[1])
    age_txt = (
        "unknown age" if oldest_age_h == float("inf")
        else f"{oldest_age_h / 24.0:.1f}d old"
    )
    return CheckResult(
        name=name,
        status=STATUS_STALE,
        detail=(
            f"{len(stuck)} open {SYNC_PR_BRANCH_PREFIX}* PR(s) unmerged for "
            f"over {SYNC_PR_MAX_AGE_HOURS}h — auto-merge is jammed and the "
            f"live site's listings are not updating; oldest is "
            f"{oldest_pr.get('html_url')} ({age_txt})"
        ),
        actual_age_days=(
            None if oldest_age_h == float("inf") else oldest_age_h / 24.0
        ),
        expected_max_age_days=SYNC_PR_MAX_AGE_HOURS / 24.0,
        duration_ms=int((time.monotonic() - t0) * 1000),
    )


def check_site_uptime(
    url: str,
    *,
    opener: Callable[..., "urllib.request.addinfourl"] = urllib.request.urlopen,
) -> CheckResult:
    """GET /api/healthcheck — expects 200 and a JSON body with status=ok."""
    t0 = time.monotonic()
    last_exc: Optional[BaseException] = None
    for attempt in range(HEALTHCHECK_RETRIES + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "joshuafink-morning-healthcheck/1.0"},
            )
            with opener(req, timeout=HEALTHCHECK_TIMEOUT_S) as resp:
                status = getattr(resp, "status", None) or resp.getcode()
                body = resp.read(8192).decode("utf-8", errors="replace")
            if status != 200:
                return CheckResult(
                    name=f"site uptime — {url}",
                    status=STATUS_ERROR,
                    detail=f"HTTP {status} (body: {body[:120]!r})",
                    duration_ms=int((time.monotonic() - t0) * 1000),
                )
            # We expect /api/healthcheck JSON with "status":"ok". A 200
            # served by a different handler (caching layer, error page)
            # would still pass HTTP — sanity-check the body marker.
            if '"status":"ok"' not in body and '"status": "ok"' not in body:
                return CheckResult(
                    name=f"site uptime — {url}",
                    status=STATUS_ERROR,
                    detail=f"200 OK but body missing status:ok marker ({body[:120]!r})",
                    duration_ms=int((time.monotonic() - t0) * 1000),
                )
            return CheckResult(
                name=f"site uptime — {url}",
                status=STATUS_PASS,
                detail=f"HTTP 200 with status:ok marker",
                duration_ms=int((time.monotonic() - t0) * 1000),
            )
        except (urllib.error.URLError, socket.timeout, ssl.SSLError) as exc:
            last_exc = exc
            if attempt < HEALTHCHECK_RETRIES:
                time.sleep(2.0 * (attempt + 1))
        except Exception as exc:  # noqa: BLE001 — last-resort guard
            last_exc = exc
            break

    return CheckResult(
        name=f"site uptime — {url}",
        status=STATUS_ERROR,
        detail=f"unreachable after retries: {type(last_exc).__name__}: {last_exc}",
        duration_ms=int((time.monotonic() - t0) * 1000),
    )


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def run_all_checks(
    *,
    dsn: Optional[str],
    healthcheck_url: str,
    repo_dir: str,
    now: Optional[datetime] = None,
    github_token: Optional[str] = None,
    github_repo: str = GITHUB_REPO_DEFAULT,
) -> list[CheckResult]:
    """Run every check; capture exceptions so one bad check doesn't abort the rest."""
    now = now or datetime.now(timezone.utc)
    results: list[CheckResult] = []

    # 1) Site uptime — independent of DB, run first so we always have a signal.
    try:
        results.append(check_site_uptime(healthcheck_url))
    except Exception as exc:  # noqa: BLE001
        results.append(CheckResult(
            name=f"site uptime — {healthcheck_url}",
            status=STATUS_ERROR,
            detail=f"uncaught {type(exc).__name__}: {exc}",
        ))

    # 2) Git freshness — repo state, no network beyond the local checkout.
    try:
        results.append(check_listings_git_freshness(repo_dir, now=now))
    except Exception as exc:  # noqa: BLE001
        results.append(CheckResult(
            name=f"sync-listings — {LISTINGS_FILE}",
            status=STATUS_ERROR,
            detail=f"uncaught {type(exc).__name__}: {exc}",
        ))

    # 2b) Blog cadence — same repo-state family; no network, no DB.
    try:
        results.append(check_blog_freshness(repo_dir, now=now))
    except Exception as exc:  # noqa: BLE001
        results.append(CheckResult(
            name=f"blog cadence — {BLOG_FILE}",
            status=STATUS_ERROR,
            detail=f"uncaught {type(exc).__name__}: {exc}",
        ))

    # 3) Scheduled GitHub Actions runs — deliberately ahead of the DB block so a
    #    missing DATABASE_URL (which returns early) can't hide a red workflow.
    for workflow_file, label in MONITORED_WORKFLOWS:
        try:
            results.append(check_workflow_last_run(
                workflow_file, label, repo=github_repo, token=github_token
            ))
        except Exception as exc:  # noqa: BLE001
            results.append(CheckResult(
                name=f"github-actions — {label}",
                status=STATUS_ERROR,
                detail=f"uncaught {type(exc).__name__}: {exc}",
            ))

    # 3b) Open sync-listings PRs — the workflow can conclude 'success' while
    #     its PR never merges; an open sync PR older than a day is the jam
    #     itself, seen the morning after instead of at the 17d threshold.
    try:
        results.append(check_stuck_sync_prs(
            repo=github_repo, token=github_token, now=now
        ))
    except Exception as exc:  # noqa: BLE001
        results.append(CheckResult(
            name="sync-listings — open PRs",
            status=STATUS_ERROR,
            detail=f"uncaught {type(exc).__name__}: {exc}",
        ))

    # 4) DB-dependent checks. If DSN missing or DB unreachable, each per-pipeline
    #    check downgrades to a single grouped error rather than 7 duplicate errors.
    if not dsn:
        results.append(CheckResult(
            name="postgres",
            status=STATUS_MISCONFIG,
            detail="DATABASE_URL is not set — DB-dependent checks skipped",
        ))
        return results

    reach = check_postgres_reachable(dsn)
    results.append(reach)
    if reach.status != STATUS_PASS:
        # Skip per-pipeline checks — the single reachability error is the signal.
        results.append(CheckResult(
            name="autoposter pipelines",
            status=STATUS_GAP,
            detail="skipped — postgres unreachable (see prior check)",
        ))
        return results

    try:
        latest = _fetch_last_post_per_channel_job(dsn)
    except Exception as exc:  # noqa: BLE001
        results.append(CheckResult(
            name="post_log MAX(posted_at) query",
            status=STATUS_ERROR,
            detail=f"query failed: {type(exc).__name__}: {exc}",
        ))
        return results

    # Best-effort diagnostic companion — surfaces *why* a job is stale (failed
    # row error_message, stuck dry-run). Never fail the run over it.
    try:
        last_attempt = _fetch_last_attempt_per_channel_job(dsn)
    except Exception as exc:  # noqa: BLE001
        log.warning(
            "last-attempt diagnostic fetch failed (%s) — alerts will lack the reason",
            type(exc).__name__,
        )
        last_attempt = {}

    for job in EXPECTED_JOBS:
        try:
            results.append(check_pipeline_freshness(
                job, latest, now=now, last_attempt_by_key=last_attempt
            ))
        except Exception as exc:  # noqa: BLE001
            results.append(CheckResult(
                name=job.label,
                status=STATUS_ERROR,
                detail=f"uncaught {type(exc).__name__}: {exc}",
            ))

    return results


def determine_exit_code(results: Iterable[CheckResult]) -> int:
    """0 = all-pass-or-gap. 1 = at least one stale or error. 2 = misconfig."""
    has_misconfig = False
    has_alert = False
    for r in results:
        if r.status == STATUS_MISCONFIG:
            has_misconfig = True
        elif r.is_alert:
            has_alert = True
    if has_misconfig:
        return 2
    if has_alert:
        return 1
    return 0


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def _icon(status: str) -> str:
    return {
        STATUS_PASS: "OK",
        STATUS_STALE: "STALE",
        STATUS_ERROR: "ERR",
        STATUS_GAP: "GAP",
        STATUS_MISCONFIG: "MISCONFIG",
    }.get(status, status.upper())


def _remediation_for(result: CheckResult) -> Optional[str]:
    """Map a failing check to a concrete first-action playbook line.

    Returns None for PASS/GAP — only STALE / ERROR / MISCONFIG get tips.
    Match is by case-insensitive substring on the check name so renames
    of EXPECTED_JOBS don't silently break the map.
    """
    if not (result.is_alert or result.status == STATUS_MISCONFIG):
        return None

    name = result.name.lower()
    detail = result.detail.lower()

    # Per-failure-mode tips. Order matters — first match wins.
    # DATABASE_URL-not-set MISCONFIG must come before the postgres-name
    # match below, otherwise the postgres reachability tip wins for both.
    if "database_url" in detail and "not set" in detail:
        return (
            "Set the DATABASE_URL secret in the GitHub repo: Settings → "
            "Secrets and variables → Actions → New repository secret. Use "
            "the DATABASE_PUBLIC_URL from Railway → Postgres → Variables."
        )
    # Must precede the pipeline-name matches — "github-actions — Sync Compass
    # Listings" is about the workflow run, not the lib/listings.ts git mtime.
    if "github-actions" in name:
        return (
            "Open the failing run linked in the detail above → read the red "
            "step, fix, then Actions tab → that workflow → Re-run. A red "
            "'Sync Compass Listings' means Compass updates are NOT reaching "
            "the site even though the scrape itself may have worked."
        )
    if "postgres reachable" in name or "postgres" == name:
        return (
            "Railway → Postgres service → confirm running + reachable. "
            "Verify DATABASE_URL secret at "
            "github.com/chucknmore2-ops/joshuafink-website/settings/secrets/actions "
            "uses the DATABASE_PUBLIC_URL (viaduct.proxy.rlwy.net), not the "
            "internal one."
        )
    if "site uptime" in name:
        return (
            "Open vercel.com → joshuafink-website → check the latest "
            "production deploy. If failed, redeploy. If the deploy is fine, "
            "/api/healthcheck route may have regressed — read its log."
        )
    # Must precede the generic sync-listings match — this one is about a PR
    # that won't merge, not a scrape that won't run.
    if "open prs" in name:
        return (
            "Auto-merge on the nightly listings PR is jammed even though the "
            "workflow reads green. Open the stuck PR linked in the detail "
            "above and read why it hasn't merged (pending approval gate, "
            "failed required check, branch protection). Each sync PR is a "
            "full regeneration from a fresh scrape, so merge the NEWEST open "
            "sync-listings/* PR manually and close the older ones."
        )
    if "sync-listings" in name:
        return (
            "Actions tab → Sync Compass Listings → Run workflow. If repeated "
            "runs fail, the Compass scraper selectors likely drifted — "
            "see scripts/sync-all.sh."
        )
    if "blog cadence" in name:
        return (
            "The weekly blog calendar has stalled. Open "
            "docs/content-keyword-strategy.md, take the next unshipped week "
            "(status column), write the post into lib/blog.ts, and tick the "
            "row. Nothing publishes these automatically — the calendar only "
            "moves when someone writes one."
        )
    if "autoposter-listing" in name:
        return (
            "Railway → services/autoposter → Cron Runs → Run Now. If the log "
            "shows `(#200) pages_manage_posts` → paste the working Page token "
            "from ~/.facebook_tokens on the Mac into Railway FB_PAGE_TOKEN. "
            "If `DRY RUN — no API call made.` → Variables tab, set "
            "AUTOPOSTER_DRY_RUN=0."
        )
    if "monthly-market-update" in name:
        return (
            "This month's figures are probably not in lib/market-snapshot.ts — "
            "paste them from the Greater Nashville REALTORS report (the file "
            "has a template at the top, ~2 min), commit, then Actions tab → "
            "Monthly Market Update → Run workflow. A skip is deliberate, not a "
            "bug: no numbers means no post on any channel."
        )
    if "vercel-cron-linkedin" in name:
        return (
            "Vercel → joshuafink-website → Deployments → Logs → filter "
            "/api/cron/linkedin-post. 401 from LinkedIn means the access token "
            "expired (60-day lifetime) — re-run https://joshuafink.com/api/linkedin/auth, "
            "copy the new access_token into Vercel env LINKEDIN_ACCESS_TOKEN."
        )
    if "vercel-cron-gbp" in name:
        return (
            "Vercel → joshuafink-website → Deployments → Logs → filter "
            "/api/cron/gbp-post. GBP refresh tokens shouldn't expire; if "
            "Google returns 401 the OAuth grant was likely revoked — re-run "
            "the OAuth flow per docs/automation.md."
        )
    if "instagram" in name:
        return (
            "Actions tab → Social Autopost → Run workflow → instagram-post. "
            "A 400/401 from the Graph API means IG_ACCESS_TOKEN expired or "
            "lost instagram_content_publish scope — refresh it in Vercel env "
            "(see docs/IG-SETUP-PLAYBOOK.md)."
        )
    return None  # No tip — generic alert, hand-investigate


# Always-present link block to help the operator click directly into the
# things they'll likely touch. Cheaper than chasing them down each time.
ALERT_QUICK_LINKS: tuple[tuple[str, str], ...] = (
    ("Railway project", "https://railway.com/project/4785ac44-c49b-4d1a-8537-40aba96e60fe"),
    ("Vercel project", "https://vercel.com/chucknmore2-7257s-projects/joshuafink-website"),
    ("/admin dashboard", "https://www.joshuafink.com/admin"),
    ("Re-trigger healthcheck", "https://github.com/chucknmore2-ops/joshuafink-website/actions/workflows/morning_healthcheck.yml"),
    ("GitHub secrets", "https://github.com/chucknmore2-ops/joshuafink-website/settings/secrets/actions"),
    ("FB token debugger", "https://developers.facebook.com/tools/debug/accesstoken/"),
)


def format_text_report(
    results: list[CheckResult],
    *,
    now: Optional[datetime] = None,
    hostname: Optional[str] = None,
) -> str:
    now = now or datetime.now(timezone.utc)
    hostname = hostname or socket.gethostname()
    alerts = [r for r in results if r.is_alert]
    misconfigs = [r for r in results if r.status == STATUS_MISCONFIG]

    lines: list[str] = []
    headline = (
        f"FAIL — {len(alerts)} alert(s)"
        if alerts
        else ("MISCONFIG" if misconfigs else "OK — all pipelines fresh")
    )
    lines.append(f"joshuafink.com morning healthcheck — {headline}")
    lines.append(f"Run at {now.isoformat()} from {hostname}")
    lines.append("")

    if alerts:
        lines.append("=== ALERTS ===")
        for r in alerts:
            lines.append(f"  [{_icon(r.status)}] {r.name}")
            lines.append(f"        {r.detail}")
        lines.append("")

    if misconfigs:
        lines.append("=== MISCONFIG ===")
        for r in misconfigs:
            lines.append(f"  [{_icon(r.status)}] {r.name}")
            lines.append(f"        {r.detail}")
        lines.append("")

    # === HOW TO FIX === — only when we have something to fix.
    # Each alert/misconfig gets a per-failure-mode tip; everything else gets
    # the always-on quick links so you can click straight into the consoles.
    actionable = [r for r in results if r.is_alert or r.status == STATUS_MISCONFIG]
    if actionable:
        lines.append("=== HOW TO FIX ===")
        for r in actionable:
            tip = _remediation_for(r)
            if tip:
                lines.append(f"  → {r.name}")
                lines.append(f"    {tip}")
        lines.append("")
        lines.append("Quick links:")
        for label, url in ALERT_QUICK_LINKS:
            lines.append(f"  - {label}: {url}")
        lines.append("")

    lines.append("=== ALL CHECKS ===")
    for r in results:
        dur = f" ({r.duration_ms}ms)" if r.duration_ms is not None else ""
        lines.append(f"  [{_icon(r.status)}] {r.name}{dur}")
        lines.append(f"        {r.detail}")
    lines.append("")

    lines.append("=== DOCUMENTED GAPS (always present, not failures) ===")
    lines.append(
        "A green run from this monitor proves the items above. The items "
        "below are KNOWN-uncovered — do not interpret silence here as health:"
    )
    for label, why in DOCUMENTED_GAPS:
        lines.append(f"  - {label}")
        lines.append(f"      {why}")
    lines.append("")
    lines.append(
        "Source: scripts/morning_healthcheck.py | "
        "Schedule: .github/workflows/morning_healthcheck.yml"
    )
    return "\n".join(lines)


def send_email(
    *,
    subject: str,
    body: str,
    smtp_user: str,
    smtp_password: str,
    to_addr: str,
) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_addr
    msg.set_content(body)

    with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        smtp.login(smtp_user, smtp_password)
        smtp.send_message(msg)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="morning_healthcheck",
        description="Daily freshness monitor for joshuafink.com automation pipelines.",
    )
    p.add_argument(
        "--no-email",
        action="store_true",
        help="Never send email; print full report to stdout. For local testing.",
    )
    p.add_argument(
        "--always-email",
        action="store_true",
        help="Send email even when all checks pass. For first-run verification.",
    )
    p.add_argument(
        "--repo-dir",
        default=os.getcwd(),
        help="Path to the joshuafink-website checkout (for git freshness).",
    )
    # `os.environ.get(key, default)` returns '' (not default) when the env
    # var is set-but-empty — which is what GitHub Actions does for an
    # undefined `${{ vars.X }}` reference. Use `or` so empty string falls
    # through to the hardcoded default.
    p.add_argument(
        "--healthcheck-url",
        default=os.environ.get("HEALTHCHECK_URL") or HEALTHCHECK_URL_DEFAULT,
        help=f"URL to ping (default: {HEALTHCHECK_URL_DEFAULT}).",
    )
    p.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Increase log verbosity.",
    )
    return p


def main(argv: Optional[list[str]] = None) -> int:
    args = _build_parser().parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    dsn = os.environ.get("DATABASE_URL")

    results = run_all_checks(
        dsn=dsn,
        healthcheck_url=args.healthcheck_url,
        repo_dir=args.repo_dir,
        github_token=os.environ.get("GITHUB_TOKEN"),
        github_repo=os.environ.get("GITHUB_REPOSITORY") or GITHUB_REPO_DEFAULT,
    )
    exit_code = determine_exit_code(results)
    report = format_text_report(results)

    # stdout — always — so manual runs and CI logs both have it.
    print(report)

    should_email = (
        not args.no_email
        and (exit_code != 0 or args.always_email)
    )
    if should_email:
        smtp_user = os.environ.get("GMAIL_USER")
        smtp_password = os.environ.get("GMAIL_APP_PASSWORD")
        to_addr = os.environ.get("ALERT_TO_EMAIL")
        if not (smtp_user and smtp_password and to_addr):
            log.error(
                "Email needed but GMAIL_USER / GMAIL_APP_PASSWORD / "
                "ALERT_TO_EMAIL not set — printing report to stderr only."
            )
            print(report, file=sys.stderr)
            return 2
        subject_prefix = "[joshuafink healthcheck]"
        if exit_code == 0:
            subject = f"{subject_prefix} OK — all pipelines fresh"
        elif exit_code == 2:
            subject = f"{subject_prefix} MISCONFIG"
        else:
            n_alerts = sum(1 for r in results if r.is_alert)
            subject = f"{subject_prefix} FAIL — {n_alerts} alert(s)"
        try:
            send_email(
                subject=subject,
                body=report,
                smtp_user=smtp_user,
                smtp_password=smtp_password,
                to_addr=to_addr,
            )
            log.info("alert email sent to %s", to_addr)
        except Exception as exc:  # noqa: BLE001 — email send must never crash exit code
            log.error("email send failed: %s: %s", type(exc).__name__, exc)
            # Don't suppress the underlying alert exit code — but at least
            # leave a stderr trail.
            print(f"EMAIL SEND FAILED: {type(exc).__name__}: {exc}", file=sys.stderr)

    return exit_code


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
