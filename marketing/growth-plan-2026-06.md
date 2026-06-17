# Middle TN Growth Plan — June 2026

**Goal:** More qualified buyer/seller leads for Joshua Fink (Affiliate Broker, Compass) via local organic search **and off-site channels** — "more than just website content."

This plan and the deliverables it references were produced 2026-06-16. It pairs competitor/keyword research with an honest audit of what's already built, then lists the 10 highest-leverage moves and what shipped in this PR.

---

## The reframe: this site is already past "just website content"

The repo already contains 200+ SEO pages **and** a multi-channel autoposter + content pipeline. The problem is not missing infrastructure — it's that several channels are **stalled on account access**, and a few high-value SEO clusters had no pages.

| Channel | Status |
|---|---|
| LinkedIn autoposter | ✅ Working (token needs ~60-day re-auth) |
| Google Business Profile autoposter | ✅ Working — but profile under-optimized (photos/reviews) |
| Facebook | ⛔ Page locked by a defunct ad agency (admin dispute) |
| Instagram | ⛔ Graph API coded, blocked on Meta Business linkage |
| Email / CRM (HubSpot+Zapier) | 📋 Fully documented, never activated |
| YouTube | 📝 Cash-offer shorts scripted; no "moving to" content, nothing uploaded |
| Craigslist | 📝 Templates only |

Full unblock punch list: [`docs/unblock-channels-checklist.md`](../docs/unblock-channels-checklist.md).

---

## What competitor research says wins in 2026 (sources)

- **Google Business Profile is #1 for local.** 100+ photos → ~520% more calls; the 3-pack captures ~1/3 of local clicks; weekly posts + 10+ reviews matter. — [Jeff Lenney](https://jefflenney.com/real-estate/google-business-profile/), [Agent Image](https://www.agentimage.com/blog/local-seo-for-real-estate-2026/)
- **Email is the highest-ROI channel.** Monthly newsletter to past clients → 3–8% annual referral rate. — [HousingWire](https://www.housingwire.com/articles/real-estate-newsletters/), [Luxury Presence](https://www.luxurypresence.com/blogs/real-estate-email-marketing/)
- **YouTube "Moving to [city]" + neighborhood tours** generate leads for months after posting. — [Building Better Agents](https://buildingbetteragents.com/videos-every-real-estate-agent-should-create/), [Jamil Academy](https://www.jamilacademy.com/blog/youtube-for-real-estate-agents)
- **LinkedIn is the most underused, highest-quality referral channel** (mortgage brokers, builders, relocation). — [SocialPilot](https://www.socialpilot.co/blog/real-estate-social-network)
- **Hyperlocal + consistent + authentic beats polished volume.** — [Luxury Presence](https://www.luxurypresence.com/blogs/real-estate-social-media-marketing/), [Katalysts](https://www.katalysts.net/post/content-marketing-for-real-estate-in-2026-how-hyperlocal-seo-is-driving-high-intent-buyer-leads)

---

## SEO keyword clusters we were NOT covering (now addressed)

1. **"Moving to / relocating to Middle Tennessee / [city] TN"** — high-intent relocation; zero pages → ✅ new pillar page.
2. **Nashville urban neighborhoods** — "East Nashville / 12 South / Germantown / Sylvan Park / The Gulch homes for sale" — 0 guides → ✅ 5 new guides.
3. **"Homes near [elementary/middle school]"** — only 6 high schools existed → ✅ 6 elementary/middle pages added.
4. **"Pros and cons of living in [city]" / "is [city] a good place to live"** — top YouTube + snippet format → ✅ YouTube scripts + relocation FAQ.
5. **"[city] cost of living / no state income tax / property taxes"** — relocation research long-tail → ✅ covered in the pillar page.

---

## The 10 things — and where each one landed

Tags: 🟢 shipped in code (this PR) · ✍️ content drafted (ready to publish) · 🔑 needs Joshua's account access (see checklist)

1. **🔑 Unblock the Facebook Page** (Meta admin dispute) — checklist item 1.
2. **🔑✍️ Optimize Google Business Profile** (photos, reviews, weekly posts) — checklist item 2; photo/post assets in the calendar.
3. **🔑💳✍️ Launch the monthly email newsletter** — [`email-newsletter-monthly.md`](./email-newsletter-monthly.md) (template + Issue #1); activate per checklist item 3.
4. **✍️ YouTube "Moving to [city]" scripts** — [`youtube-moving-to-scripts.md`](./youtube-moving-to-scripts.md) (Franklin, Brentwood, Spring Hill).
5. **✍️ 30-day multi-channel content calendar** — [`content-calendar-30day.md`](./content-calendar-30day.md) (LinkedIn/FB/IG/GBP copy + assets).
6. **🔑✍️ LinkedIn re-auth + B2B referral cadence** — checklist item 4; B2B posts in the calendar.
7. **🟢 Missing high-intent SEO pages** — 5 Nashville neighborhood guides + 6 elementary/middle school pages (auto-rendered + schema + sitemap).
8. **🟢 Social share images** — added the missing per-neighborhood OG card (blog, school, and site-wide defaults already existed). `VideoObject` deferred until real videos exist.
9. **🔑✍️ Review-generation flow** — checklist item 6; "just sold" referral tactic in the newsletter doc.
10. **🟢✍️ "Moving to Middle TN" pillar page + community angle** — [`/moving-to-middle-tennessee`](../app/moving-to-middle-tennessee/page.tsx) + Craigslist/Nextdoor/FB-group pack in [`craigslist-nextdoor-refresh.md`](./craigslist-nextdoor-refresh.md).

---

## Compliance notes (carried through every deliverable)
- "Affiliate Broker" (never "Broker"); TREC #351484.
- No invented market stats — only the 14 approved city medians + Tennessee's no-state-income-tax fact are cited; everything else is a marked `[PLACEHOLDER]`.
- Fair Housing: copy describes properties/places, never people; no steering by protected class.
- Cash offers framed as ~70–85% of after-repair value, as-is, no obligation.
- These align with several already-approved items in `.research-queue.json` (e.g., the Nashville/urban neighborhood guides in findings `81849b` and `327884`).
