#!/usr/bin/env python3
"""Print the five GBP_* values to paste into Vercel.

Reads the OAuth client + token already saved on this Mac and prints the exact
env-var lines. Nothing is fetched and nothing is written — this only reformats
credentials that are already on disk.

    python3 scripts/gbp_print_env.py

The account/location IDs are discovered live, so they stay correct if Joshua
ever adds or changes a Business Profile location.

Treat the output as secret: GBP_CLIENT_SECRET and GBP_REFRESH_TOKEN are live
credentials. Paste them straight into Vercel; don't paste them into a chat,
an issue, or a commit.
"""

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

CRED_DIR = Path.home() / ".openclaw" / "credentials"
CLIENT_FILE = CRED_DIR / "google-business-oauth.json"
TOKEN_FILE = CRED_DIR / "google-business-token.json"


def die(msg: str) -> None:
    sys.exit(f"error: {msg}")


def main() -> None:
    for f in (CLIENT_FILE, TOKEN_FILE):
        if not f.exists():
            die(f"missing {f} — see the GBP setup notes before running this")

    raw = json.loads(CLIENT_FILE.read_text())
    client = raw.get("installed") or raw.get("web") or raw
    client_id = client["client_id"]
    client_secret = client["client_secret"]

    refresh_token = json.loads(TOKEN_FILE.read_text()).get("refresh_token")
    if not refresh_token:
        die("no refresh_token in the token file — re-run scripts/google_business_auth.py")

    # Exchange for a short-lived access token so we can discover the IDs.
    body = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }).encode()
    try:
        req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
        access_token = json.load(urllib.request.urlopen(req))["access_token"]
    except Exception as e:  # noqa: BLE001 - surface the raw failure, it's diagnostic
        die(f"token refresh failed ({e}) — re-run scripts/google_business_auth.py")

    auth = {"Authorization": f"Bearer {access_token}"}

    accounts = json.load(urllib.request.urlopen(urllib.request.Request(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts", headers=auth,
    ))).get("accounts", [])
    if not accounts:
        die("no Business Profile accounts visible to this login")
    account = accounts[0]["name"]  # e.g. "accounts/1149..."

    locs = json.load(urllib.request.urlopen(urllib.request.Request(
        f"https://mybusinessbusinessinformation.googleapis.com/v1/{account}"
        "/locations?readMask=name,title&pageSize=20", headers=auth,
    ))).get("locations", [])
    if not locs:
        die(f"no locations under {account}")
    if len(locs) > 1:
        print("# NOTE: multiple locations found; using the first:", file=sys.stderr)
        for l in locs:
            print(f"#   {l.get('name')}  {l.get('title')}", file=sys.stderr)

    # v4 localPosts needs the full accounts/.../locations/... path.
    location_path = f"{account}/{locs[0]['name']}"

    print(f"# Location: {locs[0].get('title')}")
    print("# Paste these into Vercel → Settings → Environment Variables")
    print("# (tick Production, Preview AND Development), then Redeploy.\n")
    print(f"GBP_CLIENT_ID={client_id}")
    print(f"GBP_CLIENT_SECRET={client_secret}")
    print(f"GBP_REFRESH_TOKEN={refresh_token}")
    print(f"GBP_ACCOUNT_ID={account}")
    print(f"GBP_LOCATION_ID={location_path}")


if __name__ == "__main__":
    main()
