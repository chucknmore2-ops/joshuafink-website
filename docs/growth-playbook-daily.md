# Daily Growth Playbook — joshuafink.com

**Goals:** (1) first page of Google for Middle TN real-estate queries + the local map pack, and (2) a high GEO score (cited by ChatGPT / Perplexity / Claude). **More importantly: qualified leads.**

**Strategic reality:** on-page SEO is essentially maxed. Both goals now move on three off-page engines — **(a) Google Business Profile + reviews → map pack, (b) off-site authority (citations/backlinks/mentions) → both Google rank AND AI citations, (c) fresh useful content** (largely automated by the research bot). This playbook keeps both of us working those engines every day with a scoreboard.

Legend: 🤖 automated · 🧑 Chuck (Claude, per session/cron) · 🙋 Josh (needs your accounts)

---

## Chuck's daily loop (🧑 / 🤖)

Run this order every day. It's **measure → improve one thing → find one link → protect leads → report.**

1. **Measure.** Read the GEO scoreboard (`/api/cron/geo-audit` result): today's GEO score, per-engine breakdown, and the **gap list** (which buyer/seller questions we lost + the page to fix). Note week-over-week trend.
2. **Improve one page.** Take the #1 GEO gap (or a thin/decaying page) and strengthen it — more sourced local stats, a tighter direct-answer intro, FAQ + schema, entity/NAP consistency. Ship on a branch → PR. Low-risk SEO edits ride the existing auto-merge-on-green; anything client-facing (bio, contact, claims) is flagged for Josh.
3. **Find one link.** Identify **one specific, named** off-site authority target for the day (local directory, chamber/association, local blog/news, a HARO/Qwoted query, a relevant Reddit/Nextdoor thread, a partner site). Hand Josh the exact action + copy.
4. **Protect the leads.** Confirm the lead pipeline is healthy (form → `/api/contact` → Slack + email + Google Sheet CRM + Pushover). Watch for indexing regressions (GSC "not indexed" reasons, sitemap/canonical issues, broken pages).
5. **Report.** Post a short daily digest to Josh: GEO score + trend, what shipped, **today's link target**, and anything needing him.

Weekly (Chuck): refresh the backlink target rotation; summarize rank movement; re-run the completeness pass on the newest pages; propose the next content batch.

---

## Josh's daily list (🙋 ~5–10 min)

1. **Work new CRM leads FAST.** Speed-to-lead wins deals — call/text new rows in the CRM tab within minutes when you can. Update the `status` column.
2. **Ask one client for a Google review.** Text/email one recent or happy past client your Google review link. Reviews are the #1 map-pack driver. *(You're on this — 👍)*

## Josh's weekly list (🙋 ~30 min)

3. **Google Business Profile:** 1 post + 3 photos (sold signs, closings, neighborhoods, headshot). Profiles with 100+ photos get ~5× more calls.
4. **One backlink/citation action** — the specific target Chuck hands you that week (10 min).
5. **Skim the scoreboard:** Google Search Console → Performance (avg position + top queries) and the GEO score. Are we trending up?
6. **Approve any research-bot PRs** flagged "for human review."

## Josh's one-time / setup (🙋)

- [ ] **Google Business Profile to 100%** — every field, service areas (all 14 cities), 20+ photos. *(Biggest single lever — see `docs/unblock-channels-checklist.md` item 2.)*
- [ ] **Send Chuck the GBP "get more reviews" link** → he sets `GOOGLE_REVIEW_URL` and the on-site review button goes live everywhere (already built, currently dark).
- [ ] **Turn on the GEO scoreboard** — add `PERPLEXITY_API_KEY` (cheapest, ~pennies/day) to Vercel. Nothing scores until then.

---

## The scoreboard

| Goal | Where | Cadence |
|---|---|---|
| Google rank (map pack + organic) | Google Search Console → Performance | Weekly skim |
| GEO score (AI citations) | `/api/cron/geo-audit` (once a key is set) → weekly digest | Chuck reports |
| Leads | Google Sheet **CRM** tab + Pushover | Real-time |

**If Josh does only one thing each week: GBP posts + review asks.** That's the biggest needle-mover for local leads.
