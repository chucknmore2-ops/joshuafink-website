#!/usr/bin/env python3
"""Morning healthcheck for joshuafink.com automation pipelines.

External monitor, run from GitHub Actions on a weekday morning cron.
Verifies every background pipeline that writes to the Railway Postgres
`post_log` table is still producing fresh rows, plus a git freshness
probe on the bi-weekly listings sync and an HTTPS probe on the public
healthcheck endpoint. Emails a per-check failure report via Gmail SMTP
when anything is stale or errors.

============================================================================
WHAT THIS MONITOR DOES AND DOES NOT COVER
============================================================================

COVERED (per `lib/admin-schedule.ts`):
  Railway autoposter jobs (FB channel) — listing-spotlight (M/W/F),
    content-market-stats (Tue), content-testimonial (Wed),
    content-tips (Thu), content-engagement (Fri)
  Vercel cron LinkedIn + GBP — both routes write to post_log on every
    fire (success and failure) since the lib/admin-db logPost wiring.
    A channel can still show as NEVER_LOGGED if the route has never
    fired since post_log existed — that's expected for a freshly-cut
    branch, not a failure.
  GitHub Actions sync-listings — checked via git mtime of lib/listings.ts
  Public uptime — GET https://joshuafink.com/api/healthcheck

NOT COVERED (documented gaps — listed in every alert email):
  /api/cron/indexnow            no DB write; signal lives in Vercel logs
  /api/cron/agent-briefing      sends email + ClickUp task, no DB write
  /api/cron/instagram-post      currently blocked at Meta Business Suite
                                linkage (docs/IG-SETUP-PLAYBOOK.md), not
                                yet emitting post_log rows
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
import logging
import os
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
# Schedule — mirror of lib/admin-schedule.ts plus the bi-weekly sync.
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
    # Railway autoposter — once weekly each. 7d nominal + 2d weekend buffer = 9d.
    ExpectedJob(
        label="autoposter-stats (FB) — content-market-stats",
        channel="facebook",
        job_name="content-market-stats",
        cadence_ct="Tue 10:00am CT",
        max_age_days=9,
    ),
    ExpectedJob(
        label="autoposter-testimonial (FB) — content-testimonial",
        channel="facebook",
        job_name="content-testimonial",
        cadence_ct="Wed 10:00am CT",
        max_age_days=9,
    ),
    ExpectedJob(
        label="autoposter-tips (FB) — content-tips",
        channel="facebook",
        job_name="content-tips",
        cadence_ct="Thu 10:00am CT",
        max_age_days=9,
    ),
    ExpectedJob(
        label="autoposter-engagement (FB) — content-engagement",
        channel="facebook",
        job_name="content-engagement",
        cadence_ct="Fri 10:00am CT",
        max_age_days=9,
    ),
    # Vercel-side crons. Today no INSERT INTO post_log lives in this repo;
    # if these channels never appear we surface a gap instead of a failure.
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
)

# Bi-weekly Compass scrape (.github/workflows/sync-listings.yml).
# Schedule is every other Monday 08:00 UTC, so worst case is 14d + 3d buffer.
LISTINGS_FILE = "lib/listings.ts"
LISTINGS_MAX_AGE_DAYS = 17

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
        "/api/cron/instagram-post",
        "Currently blocked at Meta Business Suite — IG account not linked "
        "to the FB Page (see docs/IG-SETUP-PLAYBOOK.md). Will show in "
        "post_log once Railway autoposter ships the IG channel.",
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
    """
    conn = connect_fn(dsn)
    try:
        with conn.cursor() as cur:  # type: ignore[attr-defined]
            cur.execute(f"SET statement_timeout = {DB_STATEMENT_TIMEOUT_MS}")
            cur.execute(
                """
                SELECT channel, job_name, MAX(posted_at) AS last_at
                  FROM post_log
                 WHERE status IN ('posted', 'dry_run')
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


def check_pipeline_freshness(
    job: ExpectedJob,
    latest_by_key: dict[tuple[str, str], datetime],
    *,
    now: Optional[datetime] = None,
) -> CheckResult:
    """One pipeline freshness check.

    NEVER_LOGGED ⇒ GAP (warning, not failure). Stale ⇒ STALE (failure).
    """
    now = now or datetime.now(timezone.utc)
    last_at = latest_by_key.get((job.channel, job.job_name))
    if last_at is None:
        return CheckResult(
            name=job.label,
            status=STATUS_GAP,
            detail=(
                f"no rows ever in post_log for channel='{job.channel}', "
                f"job_name='{job.job_name}'. Pipeline may run but is not "
                f"logging — track via Vercel/Railway function logs."
            ),
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
            detail=detail,
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
    """Bi-weekly sync-listings workflow — verify lib/listings.ts isn't stale."""
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
        f"(threshold {LISTINGS_MAX_AGE_DAYS}d, bi-weekly Mon 08:00 UTC)"
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

    # 3) DB-dependent checks. If DSN missing or DB unreachable, each per-pipeline
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

    for job in EXPECTED_JOBS:
        try:
            results.append(check_pipeline_freshness(job, latest, now=now))
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
