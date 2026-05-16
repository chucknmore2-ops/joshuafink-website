#!/usr/bin/env node
/**
 * fetch-sold.mjs
 * Scrapes sold/past-sales listings from Joshua Fink's Compass profile
 * (from the "Transactions" section) and writes to lib/sold-listings.ts
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOLD_FILE = path.join(__dirname, '..', 'lib', 'sold-listings.ts');
const COMPASS_URL = 'https://www.compass.com/agents/joshua-fink/';

async function main() {
  console.log('[fetch-sold] Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });

  const page = await ctx.newPage();
  // See fetch-images.mjs — networkidle is unreliable from cloud IPs.
  await page.goto(COMPASS_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Scroll down to load transactions section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);

  // Click "Load more" in transactions if available, up to a few times
  for (let i = 0; i < 5; i++) {
    try {
      const more = await page.$('[data-tn="closedDeals-paginatedSection"] button:has-text("more"), [data-tn*="closedDeals"] button, .closedDeals-paginatedSection button');
      if (more) {
        await more.click();
        await page.waitForTimeout(2000);
      } else break;
    } catch { break; }
  }

  // Extract sold listings from Transactions/closedDeals section
  const soldCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-tn="closedDeals-card"], .closedDeals-card');
    return Array.from(cards).map(card => {
      const link = card.querySelector('a[href*="homedetails"]');
      const img = card.querySelector('img[src*="compass.com"], img[data-src*="compass.com"]');
      const href = link?.getAttribute('href') || '';
      const url = href.startsWith('http') ? href : (href ? 'https://www.compass.com' + href : '');

      // Get image - prefer src, fallback to data-src  
      let imgUrl = img?.getAttribute('src') || img?.getAttribute('data-src') || '';
      // Upgrade resolution
      imgUrl = imgUrl.replace('/165x165.', '/480x320.').replace('.jpg', '.webp');

      // Parse from the card's listing card component
      const titleEl = card.querySelector('[data-testid="cx-react-listingCard-title"]');
      const priceText = titleEl?.textContent?.replace(/[^0-9]/g, '') || '0';

      // Address from the subtitle
      const subtitleEl = card.querySelector('[data-testid="cx-react-listingCard-subtitle"], [data-tn="listing-card-street-address"]');
      const addressText = subtitleEl?.textContent?.trim() || '';

      // Beds/baths/sqft from substats
      const substats = card.querySelectorAll('[data-testid="cx-react-listingCard-substatsSection"] > div');
      let beds = 0, baths = 0, sqft = 0, acres = 0;
      for (const stat of substats) {
        const val = stat.querySelector('dd')?.textContent?.trim() || '';
        const label = stat.querySelector('dt')?.textContent?.trim()?.toLowerCase() || '';
        if (label.includes('bed')) beds = parseInt(val) || 0;
        else if (label.includes('bath')) baths = parseFloat(val) || 0;
        else if (label.includes('sq')) sqft = parseInt(val.replace(/,/g, '')) || 0;
        else if (label.includes('acre')) acres = parseFloat(val) || 0;
      }

      return {
        url,
        imgUrl,
        price: parseInt(priceText) || 0,
        addressText,
        beds,
        baths,
        sqft,
        acres,
      };
    });
  });

  console.log(`[fetch-sold] Found ${soldCards.length} sold cards on page`);

  // For cards missing address, visit the detail page
  const listings = [];
  for (const card of soldCards) {
    let address = '';
    let city = '';

    if (card.addressText) {
      const parts = card.addressText.split(',');
      address = parts[0]?.trim() || '';
      city = parts.slice(1).join(',').trim();
    }

    // If no address from card, try the detail page
    if (!address && card.url) {
      try {
        const lp = await ctx.newPage();
        await lp.goto(card.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await lp.waitForTimeout(1000);
        const meta = await lp.evaluate(() => {
          const og = document.querySelector('meta[property="og:title"]')?.content || '';
          return og.replace(/\s*\|\s*Compass.*$/, '');
        });
        const commaIdx = meta.indexOf(',');
        address = commaIdx > 0 ? meta.substring(0, commaIdx).trim() : meta;
        city = commaIdx > 0 ? meta.substring(commaIdx + 1).trim() : '';
        await lp.close();
      } catch {}
    }

    if (!address && !card.price) continue; // Skip empty

    const listing = {
      address: address || 'Nashville Area',
      city: city || 'TN',
      price: card.price,
      status: 'Sold',
      compassUrl: card.url || COMPASS_URL,
      imageUrl: card.imgUrl || '',
    };
    if (card.beds) listing.beds = card.beds;
    if (card.baths) listing.baths = card.baths;
    if (card.sqft) listing.sqft = card.sqft;
    if (card.acres) listing.acres = card.acres;

    console.log(`  🏠 ${listing.address} — $${card.price.toLocaleString()}`);
    listings.push(listing);
  }

  await browser.close();

  if (listings.length === 0) {
    console.log('[fetch-sold] No sold listings found.');
    process.exit(0);
  }

  // Generate TypeScript
  const timestamp = new Date().toISOString();
  const listingsCode = listings.map(l => {
    const parts = [];
    parts.push(`    address: ${JSON.stringify(l.address)}`);
    parts.push(`    city: ${JSON.stringify(l.city)}`);
    parts.push(`    price: ${l.price}`);
    if (l.beds) parts.push(`    beds: ${l.beds}`);
    if (l.baths) parts.push(`    baths: ${l.baths}`);
    if (l.sqft) parts.push(`    sqft: ${l.sqft}`);
    if (l.acres) parts.push(`    acres: ${l.acres}`);
    parts.push(`    status: "Sold"`);
    parts.push(`    compassUrl: ${JSON.stringify(l.compassUrl)}`);
    if (l.imageUrl) parts.push(`    imageUrl: ${JSON.stringify(l.imageUrl)}`);
    return `  {\n${parts.join(',\n')},\n  }`;
  }).join(',\n');

  const tsContent = `// AUTO-GENERATED — Last synced: ${timestamp}
// Source: ${COMPASS_URL}
// Do not edit manually — run: node scripts/fetch-sold.mjs

import type { Listing } from './listings';

export const soldListings: Listing[] = [
${listingsCode}
];
`;

  fs.writeFileSync(SOLD_FILE, tsContent, 'utf8');
  console.log(`\n[fetch-sold] ✅ Written ${listings.length} sold listings to lib/sold-listings.ts`);
}

main().catch(err => {
  console.error('[fetch-sold] Fatal:', err);
  process.exit(1);
});
