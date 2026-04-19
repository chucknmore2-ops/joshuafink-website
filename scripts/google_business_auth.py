#!/usr/bin/env python3
"""
Google Business Profile re-auth + Vercel env var printer.

Two modes:

  python3 scripts/google_business_auth.py
      Full flow: OAuth browser consent -> save refresh_token -> discover
      account/location -> print env vars.

  python3 scripts/google_business_auth.py --skip-auth
      Re-use the refresh_token already on disk (no browser). Use this when
      you got rate-limited mid-run or just want to re-print the env vars
      without redoing OAuth.

All network calls for token refresh + GBP API are pure stdlib, so the only
dep needed for --skip-auth mode is... nothing. The browser-auth mode still
needs google-auth-oauthlib for the loopback server.

Install deps:
  brew install python@3.12             # if python3 is missing
  pip3 install --break-system-packages google-auth google-auth-oauthlib
  # or for venv:
  python3 -m venv .venv && source .venv/bin/activate && pip install google-auth-oauthlib

Usage:
  python3 scripts/google_business_auth.py
  python3 scripts/google_business_auth.py --skip-auth
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CREDS_DIR = Path.home() / ".openclaw" / "credentials"
OAUTH_FILE = CREDS_DIR / "google-business-oauth.json"
TOKEN_FILE = CREDS_DIR / "google-business-token.json"
CONFIG_FILE = CREDS_DIR / "google-business-config.json"
SCOPES = ["https://www.googleapis.com/auth/business.manage"]

TOKEN_URL = "https://oauth2.googleapis.com/token"
ACCOUNTS_URL = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
LOCATIONS_URL = (
    "https://mybusinessbusinessinformation.googleapis.com/v1"
    "/{account}/locations?readMask=name,title,storefrontAddress"
)

# ── Browser-OAuth helpers ─────────────────────────────────────────────


def run_browser_auth() -> dict:
    """Run the installed-app loopback OAuth flow. Saves + returns a token dict."""
    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("Missing google-auth-oauthlib. Install with:")
        print("  pip3 install --break-system-packages google-auth-oauthlib")
        print("Or re-run this script with --skip-auth if you already have a saved token.")
        sys.exit(1)

    if not OAUTH_FILE.exists():
        print(f"OAuth client file missing at {OAUTH_FILE}")
        print("Re-download it from Google Cloud Console → Credentials → OAuth 2.0 Client IDs.")
        sys.exit(1)

    print(f"[auth] loading OAuth client from {OAUTH_FILE}")
    flow = InstalledAppFlow.from_client_secrets_file(str(OAUTH_FILE), SCOPES)
    print("[auth] opening browser — approve access then return here…")
    creds = flow.run_local_server(port=0, prompt="consent", open_browser=True)

    token_data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": list(creds.scopes),
    }
    TOKEN_FILE.write_text(json.dumps(token_data, indent=2))
    TOKEN_FILE.chmod(0o600)
    print(f"[auth] saved fresh token to {TOKEN_FILE}")
    return token_data


def load_saved_token() -> dict:
    if not TOKEN_FILE.exists():
        print(f"No saved token at {TOKEN_FILE}. Remove --skip-auth and run again to do the OAuth flow.")
        sys.exit(1)
    return json.loads(TOKEN_FILE.read_text())


# ── Stdlib HTTP helpers with retry/backoff ────────────────────────────


def _http_post_form(url: str, form: dict) -> dict:
    data = urlencode(form).encode()
    req = Request(
        url,
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp = urlopen(req, timeout=30)
    return json.loads(resp.read().decode())


def _http_get_json(url: str, bearer: str, tries: int = 5, base_wait: int = 60) -> dict:
    """GET with exponential backoff on 429 (Google Business Profile default
    quota is ~1 req/min, so patience is the whole story)."""
    for attempt in range(tries):
        try:
            req = Request(url, headers={"Authorization": f"Bearer {bearer}"})
            resp = urlopen(req, timeout=30)
            return json.loads(resp.read().decode())
        except HTTPError as e:
            status = e.code
            body_snippet = ""
            try:
                body_snippet = e.read().decode()[:200]
            except Exception:
                pass
            if status == 429 and attempt < tries - 1:
                wait = base_wait * (attempt + 1)
                print(f"[rate-limit] 429 — waiting {wait}s (attempt {attempt + 1}/{tries})")
                time.sleep(wait)
                continue
            raise RuntimeError(f"GBP API {url} returned {status}: {body_snippet}") from e


def refresh_access_token(tok: dict) -> str:
    resp = _http_post_form(
        TOKEN_URL,
        {
            "client_id": tok["client_id"],
            "client_secret": tok["client_secret"],
            "refresh_token": tok["refresh_token"],
            "grant_type": "refresh_token",
        },
    )
    if "access_token" not in resp:
        raise RuntimeError(f"token refresh missing access_token: {resp}")
    print(f"[ok] access_token refreshed (expires in {resp.get('expires_in')}s)")
    return resp["access_token"]


def get_account_and_location(access_token: str) -> tuple[str, str]:
    print("[gbp] listing accounts…")
    accounts = _http_get_json(ACCOUNTS_URL, access_token).get("accounts", [])
    if not accounts:
        raise SystemExit("No GBP accounts visible to this Google identity.")
    print(f"[ok] found {len(accounts)} account(s):")
    for i, a in enumerate(accounts):
        label = a.get("accountName") or a.get("displayName") or a.get("name", "")
        print(f"  [{i}] {a['name']}  — {label}")

    account = accounts[0] if len(accounts) == 1 else accounts[int(input("Pick account by index: "))]
    account_id = account["name"]

    # Give GBP's rate limiter a breather before the second call.
    time.sleep(10)

    print(f"[gbp] listing locations under {account_id}…")
    locations = _http_get_json(LOCATIONS_URL.format(account=account_id), access_token).get(
        "locations", []
    )
    if not locations:
        raise SystemExit("No locations under that account.")
    print(f"[ok] found {len(locations)} location(s):")
    for i, loc in enumerate(locations):
        addr = (loc.get("storefrontAddress") or {}).get("locality", "")
        print(f"  [{i}] {loc['name']}  — {loc.get('title', '')} ({addr})")

    location = locations[0] if len(locations) == 1 else locations[int(input("Pick location by index: "))]
    location_id = location["name"]

    # Cache for future runs.
    cfg = json.loads(CONFIG_FILE.read_text()) if CONFIG_FILE.exists() else {}
    cfg.update({"account_id": account_id, "location_id": location_id})
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2))
    CONFIG_FILE.chmod(0o600)
    return account_id, location_id


# ── Entry ──────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description="GBP re-auth + Vercel env printer")
    parser.add_argument(
        "--skip-auth",
        action="store_true",
        help="Re-use the refresh_token already saved to disk; skip browser OAuth.",
    )
    args = parser.parse_args()

    tok = load_saved_token() if args.skip_auth else run_browser_auth()

    try:
        access_token = refresh_access_token(tok)
    except Exception as e:
        print(f"Token refresh failed: {e}")
        sys.exit(1)

    try:
        account_id, location_id = get_account_and_location(access_token)
    except Exception as e:
        print(f"GBP discovery failed: {e}")
        sys.exit(1)

    print()
    print("=" * 64)
    print("  Vercel env vars — paste into Settings → Environment Variables")
    print("  (check all 3 environments)")
    print("=" * 64)
    print(f"GBP_CLIENT_ID={tok['client_id']}")
    print(f"GBP_CLIENT_SECRET={tok['client_secret']}")
    print(f"GBP_REFRESH_TOKEN={tok['refresh_token']}")
    print(f"GBP_ACCOUNT_ID={account_id}")
    print(f"GBP_LOCATION_ID={location_id}")
    print("=" * 64)
    print()
    print("After pasting, redeploy Vercel and test with:")
    print(
        '  curl -H "Authorization: Bearer $CRON_SECRET" '
        "https://joshuafink.com/api/cron/gbp-post"
    )


if __name__ == "__main__":
    main()
