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

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev
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

No environment variables are required for this project.

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

All listings are in `lib/listings.ts`. To add, remove, or update a listing:

1. Open `lib/listings.ts`
2. Edit the `listings` array

```ts
{
  address: "123 Main Street",
  city: "Nashville, TN 37201",
  price: 450000,
  beds: 3,
  baths: 2,
  sqft: 1800,
  acres: 0.25,           // optional
  status: "Active",      // "Active" | "Active Under Contract" | "Open House 3/22"
  note: "Land only",     // optional — replaces beds/baths display
  compassUrl: "https://www.compass.com/homedetails/...",
}
```

**Featured listings** on the home page are automatically the first 3 entries in the array. Reorder the array to change which listings appear featured.

3. Run `npm run build` and deploy

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
