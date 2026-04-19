#!/usr/bin/env python3
"""
One-shot Google Business Profile re-auth + Vercel env var printer.

Re-uses your existing OAuth client (stored at
~/.openclaw/credentials/google-business-oauth.json from the original setup),
runs the installed-app OAuth loopback flow to get a fresh refresh_token,
saves it back to ~/.openclaw/credentials/google-business-token.json, then
calls the GBP APIs to discover your account + location IDs.

Finally prints all 5 values ready to paste into Vercel env.

Usage:
    pip install google-auth google-auth-oauthlib requests
    python scripts/google_business_auth.py
"""
import json
import sys
from pathlib import Path

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    import requests
except ImportError:
    print("Missing deps. Install with:")
    print("  pip install google-auth google-auth-oauthlib requests")
    sys.exit(1)

CREDS_DIR = Path.home() / ".openclaw" / "credentials"
OAUTH_FILE = CREDS_DIR / "google-business-oauth.json"
TOKEN_FILE = CREDS_DIR / "google-business-token.json"
CONFIG_FILE = CREDS_DIR / "google-business-config.json"
SCOPES = ["https://www.googleapis.com/auth/business.manage"]


def authenticate():
    """Run the installed-app loopback OAuth flow."""
    if not OAUTH_FILE.exists():
        print(f"OAuth client file missing at {OAUTH_FILE}")
        print("Re-download it from Google Cloud Console → Credentials → OAuth 2.0 Client IDs.")
        sys.exit(1)

    print(f"[auth] loading OAuth client from {OAUTH_FILE}")
    flow = InstalledAppFlow.from_client_secrets_file(str(OAUTH_FILE), SCOPES)
    print("[auth] opening browser — approve access then return here…")
    # prompt='consent' forces Google to return a refresh_token even on re-auth
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
    return creds


def get_account_and_location(access_token: str):
    """Call the Business Profile APIs to discover account + location IDs."""
    H = {"Authorization": f"Bearer {access_token}"}

    print("[gbp] listing accounts…")
    r = requests.get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", headers=H)
    r.raise_for_status()
    accounts = r.json().get("accounts", [])
    if not accounts:
        print("No GBP accounts found on this Google identity.")
        sys.exit(1)
    print(f"[gbp] found {len(accounts)} account(s):")
    for i, a in enumerate(accounts):
        label = a.get("accountName") or a.get("displayName") or a.get("name", "")
        print(f"  [{i}] {a['name']}  — {label}")

    account = accounts[0] if len(accounts) == 1 else accounts[int(input("Pick account by index: "))]
    account_id = account["name"]  # "accounts/123456789012345"

    print(f"[gbp] listing locations under {account_id}…")
    r = requests.get(
        f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_id}/locations",
        headers=H,
        params={"readMask": "name,title,storefrontAddress"},
    )
    r.raise_for_status()
    locations = r.json().get("locations", [])
    if not locations:
        print("No locations found under that account.")
        sys.exit(1)
    print(f"[gbp] found {len(locations)} location(s):")
    for i, loc in enumerate(locations):
        addr = loc.get("storefrontAddress", {}).get("locality", "")
        print(f"  [{i}] {loc['name']}  — {loc.get('title', '')} ({addr})")

    location = locations[0] if len(locations) == 1 else locations[int(input("Pick location by index: "))]
    location_id = location["name"]  # "accounts/.../locations/987654321"

    # Save for reference
    cfg = {"account_id": account_id, "location_id": location_id}
    if CONFIG_FILE.exists():
        existing = json.loads(CONFIG_FILE.read_text())
        existing.update(cfg)
        cfg = existing
    CONFIG_FILE.write_text(json.dumps(cfg, indent=2))
    CONFIG_FILE.chmod(0o600)
    return account_id, location_id


def main():
    creds = authenticate()
    if creds.expired:
        creds.refresh(Request())

    try:
        account_id, location_id = get_account_and_location(creds.token)
    except requests.HTTPError as e:
        print(f"GBP API call failed: {e}")
        print(f"  status: {e.response.status_code}")
        print(f"  body: {e.response.text[:400]}")
        sys.exit(1)

    print()
    print("=" * 60)
    print("  Vercel env vars — paste these into Settings → Environment Variables")
    print("  (Production, Preview, Development — check all three)")
    print("=" * 60)
    print(f"GBP_CLIENT_ID={creds.client_id}")
    print(f"GBP_CLIENT_SECRET={creds.client_secret}")
    print(f"GBP_REFRESH_TOKEN={creds.refresh_token}")
    print(f"GBP_ACCOUNT_ID={account_id}")
    print(f"GBP_LOCATION_ID={location_id}")
    print("=" * 60)
    print()
    print("After pasting, redeploy Vercel and test with:")
    print(
        '  curl -H "Authorization: Bearer $CRON_SECRET" '
        "https://joshuafink.com/api/cron/gbp-post"
    )


if __name__ == "__main__":
    main()
