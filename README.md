# Joshua Fink | Compass Real Estate Website

A production-quality real estate agent website for **Joshua Fink**, Affiliate Broker at Compass Real Estate in Middle Tennessee. Built with Next.js 14, Tailwind CSS, and TypeScript.

---

## Tech Stack

- **Next.js 14** (App Router, fully static output)
- **Tailwind CSS** (Compass black/white/gray branding)
- **TypeScript** (strict mode, zero type errors)
- **Google Fonts** — Inter

---

## Getting Started

### Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm

### Install & Run Locally

For a fresh machine (or after a long absence), run the bootstrap:

```bash
npm run setup
```

This verifies tooling, installs npm + Python deps, installs the Vercel CLI,
links the project, and pulls `.env.local` from Vercel. Idempotent — safe to
re-run anytime.

For day-to-day development:

```bash
npm install          # only when package.json changes
npm run dev          # hot-reload dev server on :3000
npm run typecheck    # strict TypeScript pass
npm run build        # production build (run before opening a PR)
npm run lint         # ESLint
npm run healthcheck  # run morning_healthcheck.py against prod DB (requires .env.local)
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Home Page Hero

The home page uses `components/CinematicHero.tsx` — a rotating, listings-forward hero that pulls imagery and addresses from `lib/listings.ts`. It auto-rotates every 6.5 seconds, pauses on hover/focus, and respects `prefers-reduced-motion`.

To change which listings are featured, reorder `lib/listings.ts` — the hero uses the first 5 entries that have `imageUrl`. To swap the headline or copy, edit `components/CinematicHero.tsx` directly.

## Updating Joshua's Headshot (About page)

The headshot still appears on the **About page** and in Schema.org metadata:

1. Get a high-quality photo of Joshua (recommended: portrait orientation, at least 800×1000px)
2. Name it `headshot.jpg`
3. Replace `public/headshot.jpg` with the new file

---

## Deploy to Vercel

### One-Click Deploy

1. Push this repo to GitHub (or GitLab/Bitbucket)
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Leave all default settings — Vercel auto-detects Next.js
5. Click **Deploy**

Vercel will assign you a free URL like `joshuafink-website.vercel.app` in ~90 seconds.

### Environment Variables

Production secrets live in **Vercel → project Settings → Environment Variables**.
The site renders fully without any env vars for the public, statically-generated
routes — but the following features require them:

| Feature | Env vars |
| --- | --- |
| Google Analytics | `NEXT_PUBLIC_GA_ID` |
| Lead capture (`/api/contact`) — email + Google Sheet + Pushover | `RESEND_API_KEY`, `EMAIL_FROM`, `GOOGLE_SHEET_WEBHOOK_URL`, `PUSHOVER_TOKEN`, `PUSHOVER_USER`, `N8N_WEBHOOK_BASE`, `CASH_OFFER_WEBHOOK_BASE`, `BUYER_LEAD_WEBHOOK_BASE` (localhost defaults are skipped on the contact route so they cannot hang Vercel). ClickUp is **not** a lead destination (default off). To opt in: `CLICKUP_LEADS_ENABLED=true` plus `CLICKUP_API_TOKEN` and `CLICKUP_LEADS_LIST_ID` (a dedicated Leads list — never the research/briefing board `901415978281`). ClickUp is retired as of 2026-09-15, so leave it off. |
| Cron routes (IndexNow, GBP, LinkedIn, Instagram) | `CRON_SECRET` |
| Google Business Profile auto-poster | `GBP_CLIENT_ID`, `GBP_CLIENT_SECRET`, `GBP_REFRESH_TOKEN`, `GBP_ACCOUNT_ID`, `GBP_LOCATION_ID` |
| LinkedIn auto-poster | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`, `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_AUTHOR_URN`, `LINKEDIN_TOKEN_EXPIRES_AT_MS` (all three token values are printed by `/api/linkedin/callback`) |
| Instagram auto-poster | Buffer Free via GitHub secrets `BUFFER_API_KEY`, `BUFFER_IG_CHANNEL_ID` (`IG_AUTOPOST=buffer`). Graph tokens are not the live path. |
| Morning healthcheck (`scripts/morning_healthcheck.py`) | `DATABASE_URL` |
| Content engine (Phase 2A+) | `ANTHROPIC_API_KEY` |

See [docs/automation.md](docs/automation.md) for the full env var list and the
one-time OAuth setup for each social channel.

For local development, run `npm run setup` (or `vercel env pull .env.local`)
to pull a `.env.local` snapshot of the development-environment values. The
file is gitignored — never commit it.

---

## Point a GoDaddy Domain to Vercel

Once deployed on Vercel:

1. **In Vercel** → Your Project → Settings → Domains
   - Add your domain, e.g. `joshuafink.com` and `www.joshuafink.com`
   - Vercel will show you the DNS records needed

2. **In GoDaddy** → DNS Management for your domain:

   | Type  | Name | Value                      |
   |-------|------|----------------------------|
   | A     | @    | `76.76.21.21`              |
   | CNAME | www  | `cname.vercel-dns.com`     |

3. Wait 5–30 minutes for DNS propagation. Vercel auto-provisions SSL.

> **Tip:** If GoDaddy doesn't allow CNAME on root (@), use the A record above. Vercel's IP handles it.

---

## Adding Blog Posts

Blog posts live in `lib/blog.ts` as TypeScript objects. To add a new post:

1. Open `lib/blog.ts`
2. Add a new entry to the `blogPosts` array:

```ts
{
  slug: "your-url-slug",           // URL: /blog/your-url-slug
  title: "Your Post Title",
  date: "April 1, 2025",
  excerpt: "One or two sentences summarizing the post.",
  content: `
Your full article content here.

## Section Heading

Paragraph text goes here. You can use **bold text** with double asterisks.

- Bullet item one
- Bullet item two
  `.trim(),
}
```

3. Run `npm run build` to verify no errors
4. Deploy — the new post will appear on `/blog` and `/blog/your-url-slug`

### Content Formatting

The blog renderer supports:
- `## Heading` — section headings
- `**bold**` — inline bold text
- `- item` — unordered lists
- Plain paragraphs (separated by blank lines)

---

## Updating Listings

Don't hand-edit `lib/listings.ts` or `lib/sold-listings.ts` — both are generated. The **Sync Compass Listings** workflow (`.github/workflows/sync-listings.yml`) scrapes Joshua's Compass profile nightly (08:00 UTC), regenerates both files, and opens a PR that merges itself once the `build` check passes. A manual edit is overwritten by the next sync.

- **Refresh now:** GitHub → Actions → Sync Compass Listings → Run workflow.
- **A listing is wrong or missing:** fix it on Compass; the next sync picks it up.
- **Featured order** (home page, hero) follows the synced array, i.e. Compass's order.
- The sync opens its PR with the `SYNC_PAT` secret; the workflow's `SYNC_PAT expiry` job turns the run red two weeks before that token expires.

---

## File Structure

```
joshuafink-website/
├── app/
│   ├── layout.tsx          # Global layout, Navbar, Footer, metadata
│   ├── page.tsx            # Home page (hero, stats, featured listings, about teaser)
│   ├── listings/page.tsx   # All listings grid
│   ├── about/page.tsx      # Bio, awards, specialties
│   ├── blog/
│   │   ├── page.tsx        # Blog listing
│   │   └── [slug]/page.tsx # Individual post
│   ├── contact/page.tsx    # Contact form + info
│   └── globals.css         # Tailwind + Google Fonts + prose styles
├── components/
│   ├── Navbar.tsx          # Sticky nav with mobile hamburger
│   ├── Footer.tsx          # Footer with links and disclaimer
│   ├── ListingCard.tsx     # Reusable listing card component
│   └── BlogCard.tsx        # Reusable blog post card component
├── lib/
│   ├── listings.ts         # All listing data
│   └── blog.ts             # All blog post data
├── public/
│   ├── headshot.jpg        # Replace with Joshua's real photo
│   ├── robots.txt          # SEO crawler directives
│   └── sitemap.xml         # Update domain before deploy
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Before Going Live Checklist

- [ ] Replace `public/headshot.jpg` with Joshua's actual photo
- [ ] Update domain in `public/sitemap.xml` and `public/robots.txt` (replace `joshuafink.com` with actual domain)
- [ ] Verify all listing Compass URLs are current
- [ ] Set up domain in Vercel (see above)
- [ ] Test on mobile devices
- [ ] Test contact form mailto behavior

---

## License

Private. All rights reserved — Joshua Fink / Compass Real Estate.
