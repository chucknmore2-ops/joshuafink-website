#!/usr/bin/env node
/**
 * sync-listings.mjs
 * Uses Playwright to scrape Joshua Fink's active listings from Compass,
 * then updates lib/listings.ts and pushes to GitHub so Vercel auto-deploys.
 *
 * Run manually: node scripts/sync-listings.mjs
 * Scheduled: daily at 7am CT via OpenClaw cron
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LISTINGS_FILE = path.join(__dirname, '..', 'lib', 'listings.ts');
const COMPASS_URL = 'https://www.compass.com/agents/joshua-fink/';

async function scrapeListings() {
  console.log('[sync-listings] Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  console.log(`[sync-listings] Navigating to ${COMPASS_URL}`);
  await page.goto(COMPASS_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for listing cards to render
  await page.waitForTimeout(3000);

  // Extract listings from page
  const listings = await page.evaluate(() => {
    const results = [];

    // Try to find listing cards — Compass uses data-* attributes and structured markup
    const cards = document.querySelectorAll('[data-tn="listing-card"], .uc-listingCard, [class*="listingCard"], [class*="listing-card"]');

    cards.forEach(card => {
      try {
        const priceEl = card.querySelector('[data-tn="listing-card-price"], [class*="price"]');
        const addressEl = card.querySelector('[data-tn="listing-card-street-address"], [class*="streetAddress"], [class*="address"]');
        const cityEl = card.querySelector('[data-tn="listing-card-city-state-zip"], [class*="cityState"]');
        const bedsEl = card.querySelector('[data-tn*="bed"], [class*="bed"]');
        const bathsEl = card.querySelector('[data-tn*="bath"], [class*="bath"]');
        const sqftEl = card.querySelector('[data-tn*="sqft"], [data-tn*="squareFeet"], [class*="sqft"]');
        const linkEl = card.querySelector('a[href*="/homedetails/"], a[href*="/listing/"]');
        const statusEl = card.querySelector('[data-tn*="status"], [class*="status"], [class*="badge"]');

        const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '');
        const price = priceText ? parseInt(priceText) : 0;
        const address = addressEl?.textContent?.trim() || '';
        const city = cityEl?.textContent?.trim() || '';
        const beds = parseInt(bedsEl?.textContent?.match(/\d+/)?.[0] || '0');
        const baths = parseFloat(bathsEl?.textContent?.match(/[\d.]+/)?.[0] || '0');
        const sqft = parseInt(sqftEl?.textContent?.replace(/[^0-9]/g, '') || '0');
        const compassUrl = linkEl ? 'https://www.compass.com' + linkEl.getAttribute('href') : '';
        const status = statusEl?.textContent?.trim() || 'Active';

        if (address && price > 0) {
          results.push({ address, city, price, beds, baths, sqft, status, compassUrl });
        }
      } catch (e) {}
    });

    // Fallback: try __NEXT_DATA__
    if (results.length === 0) {
      try {
        const nextDataEl = document.getElementById('__NEXT_DATA__');
        if (nextDataEl) {
          const data = JSON.parse(nextDataEl.textContent);
          // Walk the data tree looking for listing arrays
          const findListings = (obj, depth = 0) => {
            if (depth > 12 || !obj || typeof obj !== 'object') return [];
            const found = [];
            if (Array.isArray(obj)) {
              obj.forEach(item => found.push(...findListings(item, depth + 1)));
              return found;
            }
            if (obj.listPrice && obj.streetAddress) {
              found.push({
                address: obj.streetAddress || '',
                city: [obj.city, obj.state, obj.zipCode].filter(Boolean).join(', '),
                price: parseInt(obj.listPrice) || 0,
                beds: parseInt(obj.bedrooms) || 0,
                baths: parseFloat(obj.bathrooms) || 0,
                sqft: parseInt(obj.squareFeet) || 0,
                status: obj.listingStatus || obj.status || 'Active',
                compassUrl: obj.url || obj.detailUrl || 'https://www.compass.com/agents/joshua-fink/',
              });
              return found;
            }
            Object.values(obj).forEach(v => found.push(...findListings(v, depth + 1)));
            return found;
          };
          found.push(...findListings(data));
          results.push(...found);
        }
      } catch (e) {}
    }

    return results;
  });

  await browser.close();
  return listings;
}

function generateListingsTs(listings) {
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
    return `  {\n${parts.join(',\n')},\n  }`;
  }).join(',\n');

  return `// AUTO-GENERATED — Last synced: ${timestamp}
// Source: https://www.compass.com/agents/joshua-fink/
// Do not edit manually — run: node scripts/sync-listings.mjs

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
}

export const listings: Listing[] = [
${listingsCode}
];
`;
}

async function main() {
  let listings = [];

  try {
    listings = await scrapeListings();
    console.log(`[sync-listings] Scraped ${listings.length} listings`);
  } catch (err) {
    console.error(`[sync-listings] Scrape failed: ${err.message}`);
    process.exit(1);
  }

  if (listings.length === 0) {
    console.log('[sync-listings] No listings found — keeping existing listings.ts unchanged.');
    process.exit(0);
  }

  const tsContent = generateListingsTs(listings);
  fs.writeFileSync(LISTINGS_FILE, tsContent, 'utf8');
  console.log(`[sync-listings] ✅ Written ${listings.length} listings to lib/listings.ts`);

  // Git commit and push so Vercel auto-deploys
  try {
    const repoRoot = path.join(__dirname, '..');
    execSync('git add lib/listings.ts', { cwd: repoRoot, stdio: 'inherit' });
    execSync(`git commit -m "chore: auto-sync listings from Compass [${new Date().toLocaleDateString()}]"`, { cwd: repoRoot, stdio: 'inherit' });
    execSync('git push origin main', { cwd: repoRoot, stdio: 'inherit' });
    console.log('[sync-listings] ✅ Pushed to GitHub — Vercel will auto-deploy.');
  } catch (err) {
    console.warn(`[sync-listings] Git push failed (may be no changes): ${err.message}`);
  }
}

main().catch(err => {
  console.error('[sync-listings] Fatal:', err);
  process.exit(1);
});
