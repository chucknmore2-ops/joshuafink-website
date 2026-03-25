#!/usr/bin/env python3
"""
Google Business Profile Auto-Poster
Posts listings, market updates, and tips to Joshua Fink Group GBP.
Requires approved API access + token from google_business_auth.py
"""

import json
import requests
import logging
from pathlib import Path
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

log = logging.getLogger("gbp_post")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

TOKEN_FILE  = Path.home() / ".openclaw" / "credentials" / "google-business-token.json"
CONFIG_FILE = Path.home() / ".openclaw" / "credentials" / "google-business-config.json"

ACCOUNTS_API  = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
LOCATIONS_API = "https://mybusinessbusinessinformation.googleapis.com/v1/{account}/locations"
POSTS_API     = "https://mybusiness.googleapis.com/v4/{location}/localPosts"


def get_creds() -> Credentials:
    t = json.loads(TOKEN_FILE.read_text())
    creds = Credentials(
        token=t["token"],
        refresh_token=t["refresh_token"],
        token_uri=t["token_uri"],
        client_id=t["client_id"],
        client_secret=t["client_secret"],
        scopes=t["scopes"],
    )
    if creds.expired or not creds.valid:
        creds.refresh(Request())
        t["token"] = creds.token
        TOKEN_FILE.write_text(json.dumps(t, indent=2))
    return creds


def get_headers(creds: Credentials) -> dict:
    return {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}


def get_account_id(creds: Credentials) -> str:
    if CONFIG_FILE.exists():
        cfg = json.loads(CONFIG_FILE.read_text())
        if cfg.get("account_id"):
            return cfg["account_id"]
    resp = requests.get(ACCOUNTS_API, headers=get_headers(creds))
    resp.raise_for_status()
    accounts = resp.json().get("accounts", [])
    if not accounts:
        raise ValueError("No Google Business accounts found")
    account_id = accounts[0]["name"]
    log.info(f"Account: {account_id}")
    save_config({"account_id": account_id})
    return account_id


def get_location_id(creds: Credentials, account_id: str) -> str:
    if CONFIG_FILE.exists():
        cfg = json.loads(CONFIG_FILE.read_text())
        if cfg.get("location_id"):
            return cfg["location_id"]
    url = LOCATIONS_API.format(account=account_id)
    resp = requests.get(url, headers=get_headers(creds), params={"readMask": "name,title"})
    resp.raise_for_status()
    locations = resp.json().get("locations", [])
    if not locations:
        raise ValueError("No locations found")
    for loc in locations:
        log.info(f"  Location: {loc['name']} — {loc.get('title', '')}")
    location_id = locations[0]["name"]
    cfg = json.loads(CONFIG_FILE.read_text()) if CONFIG_FILE.exists() else {}
    cfg["location_id"] = location_id
    save_config(cfg)
    return location_id


def save_config(data: dict):
    existing = json.loads(CONFIG_FILE.read_text()) if CONFIG_FILE.exists() else {}
    existing.update(data)
    CONFIG_FILE.write_text(json.dumps(existing, indent=2))
    CONFIG_FILE.chmod(0o600)


def post_to_gbp(location_id: str, creds: Credentials, summary: str, call_to_action: dict = None, event: dict = None):
    """Post a Local Post to Google Business Profile."""
    url = POSTS_API.format(location=location_id)
    payload = {
        "languageCode": "en-US",
        "summary": summary,
        "topicType": "STANDARD",
    }
    if call_to_action:
        payload["callToAction"] = call_to_action
    if event:
        payload["event"] = event

    resp = requests.post(url, headers=get_headers(creds), json=payload)
    if resp.status_code == 200:
        log.info(f"✅ Posted: {summary[:60]}...")
    else:
        log.error(f"❌ Failed: {resp.status_code} — {resp.text}")
    return resp.json()


def post_listing(address: str, city: str, price: int, beds: int, baths: int, sqft: int, url: str, creds: Credentials, location_id: str):
    price_fmt = f"${price:,.0f}"
    summary = (
        f"🏡 NEW LISTING — {address}, {city}\n\n"
        f"{beds} bed · {baths} bath · {sqft:,} sq ft · {price_fmt}\n\n"
        f"Just listed in {city.split(',')[0]}! Priced right, showing now. "
        f"Call or text Joshua Fink at 615-551-2727 to schedule a private tour.\n\n"
        f"#NashvilleRealEstate #{city.split(',')[0].replace(' ','')}Homes #JoshuaFinkGroup #Compass"
    )
    return post_to_gbp(location_id, creds, summary, call_to_action={"actionType": "CALL", "url": "tel:6155512727"})


def post_market_update(suburb: str, median_price: str, dom: int, yoy: str, creds: Credentials, location_id: str):
    summary = (
        f"📊 {suburb} Market Update — {datetime.now().strftime('%B %Y')}\n\n"
        f"• Median sale price: {median_price}\n"
        f"• Average days on market: {dom} days\n"
        f"• Year-over-year appreciation: {yoy}\n\n"
        f"Thinking about buying or selling in {suburb}? Get a free, no-obligation consultation with Joshua Fink at Compass. "
        f"Call 615-551-2727 or visit joshuafink.com.\n\n"
        f"#NashvilleRealEstate #{suburb.replace(' ','')}TN #MiddleTennessee #JoshuaFinkGroup"
    )
    return post_to_gbp(location_id, creds, summary, call_to_action={"actionType": "LEARN_MORE", "url": "https://joshuafink.com"})


def post_tip(tip_text: str, creds: Credentials, location_id: str):
    return post_to_gbp(location_id, creds, tip_text, call_to_action={"actionType": "LEARN_MORE", "url": "https://joshuafink.com"})


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Post to Google Business Profile")
    parser.add_argument("--list-locations", action="store_true")
    parser.add_argument("--post-all", action="store_true", help="Post all 5 prepared posts")
    parser.add_argument("--market", metavar="SUBURB", help="Post market update for suburb")
    args = parser.parse_args()

    creds = get_creds()
    account_id = get_account_id(creds)

    if args.list_locations:
        get_location_id(creds, account_id)
        return

    location_id = get_location_id(creds, account_id)

    if args.post_all:
        posts = get_prepared_posts()
        for p in posts:
            post_to_gbp(location_id, creds, p["summary"], p.get("cta"))
            import time; time.sleep(2)
        return

    if args.market:
        MARKET_DATA = {
            "Franklin": ("$650,000", 21, "+4.2%"),
            "Brentwood": ("$900,000", 26, "+3.8%"),
            "Spring Hill": ("$450,000", 28, "+5.1%"),
            "Nolensville": ("$580,000", 22, "+4.7%"),
            "Thompson's Station": ("$420,000", 30, "+5.8%"),
        }
        if args.market in MARKET_DATA:
            price, dom, yoy = MARKET_DATA[args.market]
            post_market_update(args.market, price, dom, yoy, creds, location_id)
        else:
            log.error(f"Unknown suburb: {args.market}. Options: {list(MARKET_DATA.keys())}")


def get_prepared_posts() -> list:
    """5 ready-to-go posts for today."""
    return [
        {
            "summary": (
                "🏡 Just Listed — 159 North Berwick Lane, Franklin TN\n\n"
                "5 bed · 5 bath · 4,948 sq ft · $1,249,900\n\n"
                "Stunning home in one of Franklin's most sought-after neighborhoods. "
                "Spacious layout, premium finishes, and Williamson County schools. "
                "Call Joshua Fink at 615-551-2727 to schedule your private showing today.\n\n"
                "#FranklinTN #JustListed #JoshuaFinkGroup #Compass #WilliamsonCounty"
            ),
            "cta": {"actionType": "CALL", "url": "tel:6155512727"},
        },
        {
            "summary": (
                "📊 Franklin, TN Market Update — March 2026\n\n"
                "• Median sale price: $650,000 (+4.2% YoY)\n"
                "• Average days on market: 21 days\n"
                "• Price per sq ft: $248\n\n"
                "Franklin remains one of the strongest seller's markets in the Southeast. "
                "If you're thinking about selling, now is an excellent time to find out what your home is worth. "
                "Free, no-obligation valuation — call or text 615-551-2727.\n\n"
                "#FranklinTN #NashvilleRealEstate #MiddleTennessee #JoshuaFinkGroup"
            ),
            "cta": {"actionType": "LEARN_MORE", "url": "https://joshuafink.com/sell/franklin-tn"},
        },
        {
            "summary": (
                "💡 Thinking of buying in Middle Tennessee? Here's what you need to know in 2026:\n\n"
                "✅ Get pre-approved BEFORE you start touring — the best homes move in days\n"
                "✅ School zone matters more than you think — it can affect value by $20K–$40K\n"
                "✅ Work with a local agent who has off-market access — Compass Coming Soon listings give buyers first look\n"
                "✅ Know your must-haves vs. nice-to-haves before you start\n\n"
                "Ready to buy? Let's talk — 615-551-2727 | joshuafink.com\n\n"
                "#BuyingAHome #NashvilleRealEstate #FranklinTN #BrentwoodTN #JoshuaFinkGroup"
            ),
            "cta": {"actionType": "LEARN_MORE", "url": "https://joshuafink.com/buy/franklin-tn"},
        },
        {
            "summary": (
                "🏘️ Spring Hill, TN — One of Middle Tennessee's Best Buys in 2026\n\n"
                "• Median price: $450,000\n"
                "• Williamson County schools\n"
                "• 5.1% year-over-year appreciation\n"
                "• 30 min to downtown Nashville\n\n"
                "Spring Hill offers Williamson County schools and strong appreciation at a price point "
                "that still makes sense. Whether you're buying or selling, Joshua Fink knows this market inside and out.\n\n"
                "📞 615-551-2727 | joshuafink.com/buy/spring-hill-tn\n\n"
                "#SpringHillTN #NashvilleSuburbs #JoshuaFinkGroup #Compass"
            ),
            "cta": {"actionType": "LEARN_MORE", "url": "https://joshuafink.com/buy/spring-hill-tn"},
        },
        {
            "summary": (
                "⭐ What clients are saying about Joshua Fink Group:\n\n"
                "\"Josh is, without a doubt, the best realtor we've ever worked with. "
                "He went above and beyond to help us find a home that we love. "
                "He is an expert on all of the important things — negotiation, market knowledge, timing — "
                "and made the entire process seamless from start to finish.\"\n"
                "— Lindsay D., Gallatin TN\n\n"
                "Ready to buy or sell in Middle Tennessee? Call Joshua at 615-551-2727.\n\n"
                "#ClientReview #NashvilleRealEstate #JoshuaFinkGroup #Compass #5Stars"
            ),
            "cta": {"actionType": "CALL", "url": "tel:6155512727"},
        },
    ]


if __name__ == "__main__":
    main()
