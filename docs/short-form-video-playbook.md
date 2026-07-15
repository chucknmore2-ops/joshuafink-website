# Short-Form Video Playbook — Joshua Fink Group

**Purpose:** Stand up short-form video (YouTube Shorts + Instagram Reels + Facebook + TikTok) as a new lead + ranking channel. In the May 2026 James Dooley × Sterling Sky interview, video was called a **top-3 SEO strategy for 2026** — Shorts show up in Google video carousels, feed YouTube search, get cited by the LLMs, and (embedded on-site) lift dwell time, which is itself a ranking signal. It's currently a **gap** for Josh: on-page and technical SEO are maxed, and there's no Middle-TN video presence.

**How this fits:** This is a new content engine alongside the blog, listings, and the LinkedIn/Instagram autoposters. It reuses the exact 2026 formula from [`offsite-authority-plan.md`](./offsite-authority-plan.md#2026-field-notes--whats-actually-moving-rankings-now) (entity-first, keyword-first, semantic triples).

---

## ⚠️ STEP 0 — set up the RIGHT channel first

**The existing `youtube.com/channel/UCc6j1NWgJeb00pT5xsenz3g` is NOT Josh's** — it belongs to a *different* Joshua Fink, a real-estate agent in **Reno/Sparks, Nevada** (every video is a NV listing: Reno, Sparks, Dayton, Carson City, Gardnerville). **Do not use, claim, or link the site to it** — that would create brand confusion between the two agents.

1. **Create a new YouTube channel:** "Joshua Fink Group | Middle Tennessee Real Estate." Grab the handle `@JoshuaFinkGroup` if free.
2. Channel art + "About" → link to `https://www.joshuafink.com`, canonical NAP (Compass, Brentwood, 615-551-2727), service area = "Nashville & Middle Tennessee." State the market clearly so Google/AI don't merge you with the NV Joshua Fink.
3. Post every clip natively to **IG Reels, Facebook, and TikTok** too (same 9:16 file) — one film session, four platforms.

---

## What to film first (mapped to high-intent keywords + existing site pages)

Each Short is built to embed on its matching page (dwell time + internal video) and to target a keyword the site already ranks for. Prioritized:

1. **Suburb showdowns → `/compare/[pair]`** — "Franklin vs Brentwood, TN — which suburb should you buy in?" (compare pages already exist for these pairs). Highest-intent, most shareable.
2. **Neighborhood tours → `/neighborhoods/[slug]`** — drive-through + honest vibe of Witherspoon, The Laurels, Governors Club, etc. Josh's firsthand knowledge is the moat.
3. **"What $X buys in [city]" → `/buy/[city]` / `/market`** — price-anchored, extremely shareable ("What $750K buys in Nolensville").
4. **Monthly market-update Shorts → `/market/[suburb]` + market blog posts** — 30-sec stat rundown; repurpose the numbers already in the market posts.
5. **School-zone Shorts → `/homes-near/[school]`** — "Homes in the Ravenwood / Page High zone — what to know."
6. **Relocation tips → `/moving-to-middle-tennessee`** — "5 things to know before moving to Middle Tennessee."
7. **Just-listed walkthroughs → `/listings/[slug]`** — 30–60s vertical tour. (The autoposters already promote listings as image posts; video is additive.)
8. **FAQ answers → `/about` FAQ, `/cash-offer`, `/guide/buyer`** — "How does a cash offer work?", "First-time buyer in TN — where do you start?"

---

## Format & production (cheap + fast)

- **Vertical 9:16, under 60 seconds** (works as a Short, Reel, and TikTok).
- **Hook in the first 3 seconds** — a question or bold claim ("Franklin or Brentwood? Here's the honest answer."). One idea per video.
- **Burn in captions** — most people watch muted (CapCut auto-captions are fine).
- Shoot on a phone; **batch-film 4–8 at once**; prioritize good light + **clean audio** (lav mic or quiet room).
- **End with a CTA:** "Call or text 615-551-2727" or "link in bio → joshuafink.com."

---

## Optimize every video (reuse the 2026 formula)

Same entity-first / keyword-first rule as the social autoposts:

- **Title** — entity + keyword in the first few words (the title is the ranking surface): *"Franklin vs Brentwood, TN — which suburb should you buy in 2026? | Joshua Fink Group."*
- **Description** — 2–3 sentences in **semantic triples** (entity → predicate → object), keyword-rich, then a **link to the matching joshuafink.com page** + NAP (Joshua Fink Group, Compass, Brentwood, 615-551-2727). Repeat the link in a **pinned comment**.
- **Tags / on-screen text** — `#NashvilleRealEstate`, `#FranklinTN`, `#MiddleTennessee`, the neighborhood name, etc.
- **File name** — include the keyword before uploading.

---

## Put them on the site (ready to build on your first videos)

Once there are real videos, this repo can:
- Add a reusable **`VideoEmbed` component + `VideoObject` JSON-LD** so each embedded Short is eligible for Google **video rich results / carousels** and gets pulled by AI answer engines. Embedding on the matching page also lifts **dwell time** (a ranking signal).
- Optionally add a **`/videos` hub page** once there are ~5+ videos.

*Not built yet on purpose — empty video scaffolding would be dead code. Send the first YouTube video IDs (and which page each maps to) and it's a quick PR to embed them with schema.*

---

## Distribution & repurposing

- **1 clip → 4 platforms:** YouTube Short + IG Reel + Facebook + TikTok (same file). Cross-posting multiplies reach per film session.
- **1 long-form → many Shorts:** a full neighborhood walkthrough slices into 3–5 Shorts.
- The LinkedIn/Instagram autoposters already cover listings + blog; video is a **new, additive** channel (don't remove those).

---

## Cadence & measurement

- Start **1–2 Shorts/week**; batch-film monthly so it's sustainable.
- Watch the **geo-audit** (daily Pushover score) + GA for video carousels and "recommended you" mentions climbing.
- Reviews + video + branded search **compound** — under AI Overviews, brand is what converts (buyers search "Joshua Fink" after AI surfaces him).

---

## First-week starter (concrete)

Film **3** this week and post to YouTube Shorts + IG Reels + Facebook:
1. **Franklin vs Brentwood** — which suburb wins in 2026 (→ `/compare/franklin-tn-vs-brentwood-tn`).
2. **A neighborhood tour** — Witherspoon or The Laurels (→ the matching `/neighborhoods/[slug]`).
3. **"What $750K buys in Nolensville"** (→ `/buy/nolensville-tn`).

Title + description each per the formula above. **Send the video IDs + the page each maps to, and I'll embed them on-site with `VideoObject` schema.**
