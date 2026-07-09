#!/usr/bin/env node
/**
 * fetch-images.mjs
 * Scrapes listing photos from Compass agent page and merges them
 * into the existing lib/listings.ts (preserving known-good data).
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LISTINGS_FILE = path.join(__dirname, '..', 'lib', 'listings.ts');
const COMPASS_URL = 'https://www.compass.com/agents/joshua-fink/';

async function main() {
  console.log('[fetch-images] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  const page = await ctx.newPage();
  // `networkidle` (500ms quiet) is unreliable on modern sites with analytics
  // and lazy-loading — failed ~50% of GH Actions runs from cloud IPs.
  // `domcontentloaded` + the 5s buffer below is plenty for the listing cards
  // to client-side render before we start scraping.
  await page.goto(COMPASS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Get all listing cards with URLs and images
  const cards = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-tn="listing-card"]');
    return Array.from(cards).map(card => {
      const link = card.querySelector('a[href*="homedetails"]');
      const img = card.querySelector('img[src*="compass.com"]');
      const href = link?.getAttribute('href') || '';
      const url = href.startsWith('http') ? href : 'https://www.compass.com' + href;
      const imgUrl = (img?.src || '').replace('/480x320.webp', '/2048x1536.webp');

      // Beds/baths/sqft from substats — same approach as fetch-sold.mjs.
      // Compass renders each substat value twice (responsive duplicate spans),
      // so collapse a string that is exactly two identical halves.
      const undouble = (s) => {
        s = (s || '').trim();
        if (s && s.length % 2 === 0) {
          const half = s.length / 2;
          if (s.slice(0, half) === s.slice(half)) return s.slice(0, half);
        }
        return s;
      };
      const substats = card.querySelectorAll('[data-testid="cx-react-listingCard-substatsSection"] > div');
      let cardBeds = 0, cardBaths = 0, cardSqft = 0;
      for (const stat of substats) {
        const dd = stat.querySelector('dd');
        const firstChild = dd?.querySelector('span, div');
        const val = undouble((firstChild?.textContent || dd?.textContent || '').trim());
        const label = stat.querySelector('dt')?.textContent?.trim()?.toLowerCase() || '';
        if (label.includes('bed')) cardBeds = parseInt(val) || 0;
        else if (label.includes('bath')) cardBaths = parseFloat(val) || 0;
        else if (label.includes('sq')) cardSqft = parseInt(val.replace(/,/g, '')) || 0;
      }

      // MLS-status reconciliation: don't blindly write 'Active'. If Compass's
      // own card markup shows a non-Active label (Pending, Sold, Coming Soon,
      // Active Under Contract), propagate that — otherwise a listing that
      // changed status between syncs would render with status:'Active' and
      // schema availability='InStock'.
      const cardText = (card.innerText || card.textContent || '');
      let cardStatus = '';
      if (/Active\s*Under\s*Contract/i.test(cardText)) cardStatus = 'Active Under Contract';
      else if (/Coming\s*Soon/i.test(cardText)) cardStatus = 'Coming Soon';
      else if (/Pending/i.test(cardText)) cardStatus = 'Pending';
      else if (/(?:^|[^A-Za-z])Sold(?:$|[^A-Za-z])/i.test(cardText)) cardStatus = 'Sold';

      return { url, imgUrl, cardBeds, cardBaths, cardSqft, cardStatus };
    });
  });

  console.log(`[fetch-images] Found ${cards.length} listing cards`);

  // Visit each listing detail page for og: metadata
  const listings = [];
  for (const card of cards) {
    try {
      const lp = await ctx.newPage();
      await lp.goto(card.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await lp.waitForTimeout(1500);

      const meta = await lp.evaluate(() => {
        const get = (name) =>
          document.querySelector(`meta[property="${name}"]`)?.content ||
          document.querySelector(`meta[name="${name}"]`)?.content || '';
        return {
          title: get('og:title'),
          description: get('og:description'),
          ogImage: get('og:image'),
        };
      });

      // Parse title: "9209 Duncaster Court, Brentwood, TN 37027 | Compass"
      const titleClean = meta.title.replace(/\s*\|\s*Compass.*$/, '');
      const commaIdx = titleClean.indexOf(',');
      const address = commaIdx > 0 ? titleClean.substring(0, commaIdx).trim() : titleClean;
      const city = commaIdx > 0 ? titleClean.substring(commaIdx + 1).trim() : '';

      // Parse description for beds/baths/sqft/price
      const desc = meta.description || '';
      const priceMatch = desc.match(/\$([\d,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      const bedsMatch = desc.match(/(\d+)\s*(?:bed|bd)/i);
      const bathsMatch = desc.match(/([\d.]+)\s*(?:bath|ba)/i);
      const sqftMatch = desc.match(/([\d,]+)\s*(?:sq|sqft|square)/i);
      // Prefer agent-page card substats (structured DOM, always present) over
      // detail-page og:description regex (the description format varies and
      // historically left active listings with 0 beds / 0 baths).
      const beds = card.cardBeds || (bedsMatch ? parseInt(bedsMatch[1]) : 0);
      const baths = card.cardBaths || (bathsMatch ? parseFloat(bathsMatch[1]) : 0);
      const sqft = card.cardSqft || (sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : 0);

      const listing = {
        address,
        city,
        price,
        status: card.cardStatus || 'Active',
        compassUrl: card.url,
        imageUrl: card.imgUrl || meta.ogImage || '',
      };
      if (beds) listing.beds = beds;
      if (baths) listing.baths = baths;
      if (sqft) listing.sqft = sqft;

      console.log(`  ✅ ${address} — $${price.toLocaleString()} — ${listing.imageUrl ? 'has photo' : 'NO photo'}`);
      listings.push(listing);
      await lp.close();
    } catch (e) {
      console.error(`  ❌ Failed: ${card.url} — ${e.message}`);
    }
  }

  await browser.close();

  if (listings.length === 0) {
    console.log('[fetch-images] No listings scraped — keeping existing file.');
    process.exit(0);
  }

  // Generate listings.ts
  const timestamp = new Date().toISOString();
  const listingsCode = listings.map(l => {
    const parts = [];
    parts.push(`    address: ${JSON.stringify(l.address)}`);
    parts.push(`    city: ${JSON.stringify(l.city)}`);
    parts.push(`    price: ${l.price}`);
    if (l.beds) parts.push(`    beds: ${l.beds}`);
    if (l.baths) parts.push(`    baths: ${l.baths}`);
    if (l.sqft) parts.push(`    sqft: ${l.sqft}`);
    parts.push(`    status: ${JSON.stringify(l.status)}`);
    parts.push(`    compassUrl: ${JSON.stringify(l.compassUrl)}`);
    if (l.imageUrl) parts.push(`    imageUrl: ${JSON.stringify(l.imageUrl)}`);
    parts.push(`    lastVerified: listingsSyncedAt`);
    return `  {\n${parts.join(',\n')},\n  }`;
  }).join(',\n');

  const tsContent = `// AUTO-GENERATED — Last synced: ${timestamp}
// Source: ${COMPASS_URL}
// Do not edit manually — run: node scripts/fetch-images.mjs

export interface Listing {
  address: string;
  city: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  acres?: number;
  status: string;
  note?: string;
  compassUrl: string;
  imageUrl?: string;
  // ISO timestamp of the last Compass sync that confirmed this listing.
  // Used by /listings to flag the grid as 'Verifying…' if the file goes stale.
  lastVerified?: string;
}

// Mirrors the header timestamp so server components can compute sync staleness
// without parsing comments. Updated by scripts/fetch-images.mjs each sync.
export const listingsSyncedAt = ${JSON.stringify(timestamp)};

export const listings: Listing[] = [
${listingsCode}
];
`;

  fs.writeFileSync(LISTINGS_FILE, tsContent, 'utf8');
  console.log(`\n[fetch-images] ✅ Written ${listings.length} listings with photos to lib/listings.ts`);

  // Git commit and push
  try {
    const repoRoot = path.join(__dirname, '..');
    execSync('git add lib/listings.ts', { cwd: repoRoot, stdio: 'inherit' });
    execSync(`git commit -m "fix: restore listing photos from Compass [${new Date().toLocaleDateString()}]"`, { cwd: repoRoot, stdio: 'inherit' });
    execSync('git push origin main', { cwd: repoRoot, stdio: 'inherit' });
    console.log('[fetch-images] ✅ Pushed to GitHub — Vercel will auto-deploy.');
  } catch (err) {
    console.warn(`[fetch-images] Git push note: ${err.message}`);
  }
}

main().catch(err => {
  console.error('[fetch-images] Fatal:', err);
  process.exit(1);
});
