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
      return { url, imgUrl };
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
      const beds = bedsMatch ? parseInt(bedsMatch[1]) : 0;
      const bathsMatch = desc.match(/([\d.]+)\s*(?:bath|ba)/i);
      const baths = bathsMatch ? parseFloat(bathsMatch[1]) : 0;
      const sqftMatch = desc.match(/([\d,]+)\s*(?:sq|sqft|square)/i);
      const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : 0;

      const listing = {
        address,
        city,
        price,
        status: 'Active',
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
}

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
