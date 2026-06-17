# Unblock the Off-Site Channels — Action Checklist

**Owner:** Joshua (account access) + Chuck (code/deploy)
**Created:** 2026-06-16
**Why this exists:** The site already has a multi-channel autoposter and content pipeline built. Several channels are **stalled on account access**, not on code. This is the punch list to turn them back on — ordered by leverage. Each item says *who* does it, *what's needed*, and *the file/doc to follow*.

Legend: 🔑 needs Joshua's account login · 💳 costs money · ⏱️ time estimate

---

## Tier 1 — Highest leverage, do first

### 1. 🔑 Restore the Facebook Page (admin dispute) ⏱️ 30 min + Meta review time
The Facebook Page ("Joshua Fink Group") was locked by a defunct ad agency that still holds admin. **Nothing posts to Facebook or Instagram until this is resolved.**
- The attestation letter is already drafted: [`facebook-attestation-letter.md`](../facebook-attestation-letter.md).
- Action: Joshua submits the **Meta Business Help Center → "Request access to a Page you can't claim" / business-verification** flow with the attestation letter and proof of identity/business.
- This is the single biggest off-site blocker. Start it today; the rest of the FB/IG work is wasted until admin is back.

### 2. 🔑 Get Google Business Profile to 100% + photos + reviews ⏱️ 1–2 hrs
The GBP autoposter already runs (Tuesdays) — but a profile only ranks in the map pack if it's complete, photo-rich, and reviewed. Research: profiles with 100+ photos get ~520% more calls; the local 3-pack captures ~1/3 of local clicks.
- 🔑 Complete **every field**: hours, service areas (all 14 cities), services, description, attributes.
- 🔑 Upload **20+ photos** now, then a few weekly: headshot, Compass office, sold-sign/closing photos, neighborhood shots (Franklin Main St, Cool Springs, etc.). Asset list is in the content calendar.
- 🔑 Get to **10+ Google reviews** and respond to every one within 24 hrs (see item 6).
- ✅ Code side already done: `scripts/gbp_post.py` + `/api/cron/gbp-post`. Confirm env vars `GBP_CLIENT_ID / GBP_CLIENT_SECRET / GBP_REFRESH_TOKEN / GBP_ACCOUNT_ID / GBP_LOCATION_ID` are set. Setup helper: `scripts/google_business_auth.py`. Reference: [`docs/automation.md`](./automation.md).

### 3. 🔑💳 Turn on the monthly email newsletter ⏱️ 2–3 hrs setup
Email is the highest-ROI channel (3–8% annual referral rate from past clients) and it's documented but **never activated**.
- 💳 Create **HubSpot Starter (~$20/mo)** — free tier can't do automation. Add a Zapier account.
- 🔑 Verify sending domain (SPF/DKIM) for `joshua@joshuafink.com`.
- Wire it up per [`docs/hubspot-zapier-setup.md`](./hubspot-zapier-setup.md): form → Zapier → HubSpot contact → workflow.
- Content is ready: send **Issue #1** from [`marketing/email-newsletter-monthly.md`](../marketing/email-newsletter-monthly.md) (fill the `[PLACEHOLDER]` specifics first).
- The existing 6-email **seller drip** lives in [`docs/seller-email-sequence.md`](./seller-email-sequence.md) — load that into HubSpot too.

---

## Tier 2 — Strong, do this week

### 4. 🔑 Re-authorize LinkedIn (token expires ~every 60 days) ⏱️ 5 min, recurring
LinkedIn auto-posts Thursdays and is **working**, but the access token is short-lived.
- Action: visit `/api/linkedin/auth` while logged in, complete OAuth, and update `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_AUTHOR_URN` in Vercel env.
- 📌 Recurring: set a calendar reminder every ~55 days. (Candidate for a `/schedule` reminder.)
- Feed it the **two LinkedIn B2B posts** in [`marketing/content-calendar-30day.md`](../marketing/content-calendar-30day.md) aimed at mortgage brokers / builders / relocation managers — LinkedIn is the most underused referral channel.

### 5. 🔑 Re-link Instagram Business account ⏱️ 30 min (after item 1)
The IG Graph API pipeline (`/api/cron/instagram-post`, Wednesdays) is coded but blocked on Meta Business Suite linkage. **Do this after the Facebook Page is restored (item 1).**
- 🔑 In Meta Business Suite: link the IG Business/Creator account to the restored Page.
- 🔑 Generate a Page access token with `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`; set `IG_BUSINESS_ACCOUNT_ID` + `IG_ACCESS_TOKEN` in Vercel.
- Content queue: the IG/Reels-ready posts in the 30-day calendar + repurposed YouTube clips (item 8).

### 6. 🔑 Stand up a Google review-generation flow ⏱️ 1 hr setup, then per-close
The site surfaces static Zillow reviews (`lib/reviews.ts`), but **Google reviews drive the map pack** and we have a thin Google presence.
- 🔑 Grab the GBP "Get more reviews" short link from the Business Profile.
- Build a simple post-close cadence: text + email the review link 1–3 days after every closing. The "Just Sold" newsletter/email tactic in the newsletter doc pairs well with this.
- Optional code follow-up: add the Google review link to the post-close email template and `/reviews` page CTA.

---

## Tier 3 — Finish the build / lower urgency

### 7. 🔑 Complete the Facebook autoposter (4 of 5 jobs unbuilt) ⏱️ 1–2 hrs (after item 1)
Only `autoposter-listing` exists on Railway, and it hits a token-scope error. After the Page is restored:
- 🔑 Re-derive the Page token with `pages_manage_posts` + `pages_read_engagement`; set `FB_PAGE_ID` + `FB_PAGE_TOKEN`.
- Create the remaining Railway services (stats / testimonial / tips / engagement) per [`docs/railway-autoposter-runbook.md`](./railway-autoposter-runbook.md).

### 8. 🔑 Produce the YouTube "Moving to [city]" videos ⏱️ ongoing
Scripts are written and ready in [`marketing/youtube-moving-to-scripts.md`](../marketing/youtube-moving-to-scripts.md) (Franklin, Brentwood, Spring Hill) — proven local lead-gen format that pulls leads for months.
- 🔑 Record + edit (CapCut workflow in `marketing/youtube-shorts-scripts.md`), upload to a YouTube channel, fill the `[PLACEHOLDER]` specifics.
- 📌 Once a video is live, add `VideoObject` JSON-LD + embed it on the matching `/buy/[city]` or `/neighborhoods/[slug]` page (deferred in code until real video URLs exist — flagged in the PR).
- Repurpose vertical clips → Instagram Reels (after item 5).

### 9. Craigslist + Nextdoor + community FB groups ⏱️ ongoing manual
Fresh 2026 templates ready in [`marketing/craigslist-nextdoor-refresh.md`](../marketing/craigslist-nextdoor-refresh.md): Craigslist (48-hr repost rotation), 5 Nextdoor posts, 3 community-group posts. All manual posting from Joshua's personal/agent accounts; follow each platform's anti-spam rules.

---

## Quick status board

| # | Channel | Status today | Blocker | Owner |
|---|---------|--------------|---------|-------|
| 1 | Facebook Page | ⛔ Locked | Meta admin dispute | 🔑 Joshua |
| 2 | Google Business Profile | 🟡 Posting, under-optimized | Photos + reviews | 🔑 Joshua |
| 3 | Email newsletter | 📋 Built, not live | HubSpot/Zapier + domain | 🔑💳 Joshua |
| 4 | LinkedIn | ✅ Working | Token re-auth (recurring) | 🔑 Joshua |
| 5 | Instagram | ⛔ Blocked | Page link (needs #1) | 🔑 Joshua |
| 6 | Google reviews | 🟡 Static only | Review-request flow | 🔑 Joshua |
| 7 | FB autoposter | 🟡 1 of 5 jobs | Needs #1 + token scope | 🔑 Joshua + Chuck |
| 8 | YouTube | 📝 Scripts ready | Record/upload | 🔑 Joshua |
| 9 | Craigslist/Nextdoor | 📝 Templates ready | Manual posting | 🔑 Joshua |
