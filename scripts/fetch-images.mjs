#!/usr/bin/env node
/**
 * fetch-images.mjs
 * Scrapes listing photos from Compass agent page and merges them
 * into the existing lib/listings.ts (preserving known-good data).
 *
 * A failed detail fetch (or blank address / missing price) salvages the
 * prior entry for that Compass URL instead of dropping the home. If an
 * agent-page card cannot be scraped AND cannot be salvaged, the script
 * exits non-zero without writing so yesterday's file stays live.
 * Does not commit or push — scripts/sync-all.sh / the workflow owns git.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  loadExistingListingsMap,
  isUnusableScrapedListing,
  salvagePriorListing,
  decideFetchImagesWrite,
  firstSeenForListing,
  openHouseFromCardText,
  normalizeCompassUrl,
  renderActiveListingsFile,
} from './listings-file.mjs';
import {
  galleryFromMedia,
  galleryFromHtml,
  choosePhotoSet,
} from './compass-gallery.mjs';

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

      return { url, imgUrl, cardBeds, cardBaths, cardSqft, cardStatus, cardText };
    });
  });

  console.log(`[fetch-images] Found ${cards.length} listing cards`);

  const priorByUrl = loadExistingListingsMap(LISTINGS_FILE, 'listings');
  console.log(`[fetch-images] Loaded ${priorByUrl.size} prior listing(s) for salvage`);

  // Visit each listing detail page for og: metadata
  const listings = [];
  const unresolved = [];
  for (const card of cards) {
    let lp;
    try {
      lp = await ctx.newPage();
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

      let media = [];
      try {
        media = await lp.evaluate(() => {
          const data = window.__INITIAL_DATA__;
          const listingMedia = data && data.props && data.props.listingRelation
            && data.props.listingRelation.listing
            && data.props.listingRelation.listing.media;
          if (!Array.isArray(listingMedia)) return [];
          return listingMedia.slice(0, 40).map((item) => ({
            originalUrl: (item && item.originalUrl) || '',
            thumbnailUrl: (item && item.thumbnailUrl) || '',
            category: item ? item.category : undefined,
          }));
        });
      } catch (galleryErr) {
        console.warn(`  gallery evaluate failed: ${galleryErr.message}`);
      }
      let gallery = galleryFromMedia(media);
      if (gallery.length <= 1) {
        try {
          const fromHtml = galleryFromHtml(await lp.content());
          if (fromHtml.length > gallery.length) gallery = fromHtml;
        } catch (galleryErr) {
          console.warn(`  gallery html failed: ${galleryErr.message}`);
        }
      }
      const prior = priorByUrl.get(normalizeCompassUrl(card.url));
      const photos = choosePhotoSet({
        gallery,
        hero: card.imgUrl || meta.ogImage || '',
        prior,
      });

      const listing = {
        address,
        city,
        price,
        status: card.cardStatus || 'Active',
        compassUrl: card.url,
        imageUrl: photos.imageUrl,
        photoUrls: photos.photoUrls,
      };
      if (beds) listing.beds = beds;
      if (baths) listing.baths = baths;
      if (sqft) listing.sqft = sqft;
      const openHouse = openHouseFromCardText(card.cardText);
      if (openHouse) listing.openHouse = openHouse;

      if (isUnusableScrapedListing(listing)) {
        throw new Error(`blank address or missing/zero price (address=${JSON.stringify(address)} price=${price})`);
      }

      console.log(`  ✅ ${address} — $${price.toLocaleString()} — ${photos.photoUrls.length} photo(s)`);
      listings.push(listing);
      await lp.close();
    } catch (e) {
      if (lp) {
        try { await lp.close(); } catch { /* already closed or never opened */ }
      }
      console.error(`  ❌ Failed: ${card.url} — ${e.message}`);
      const prior = salvagePriorListing(priorByUrl, card.url);
      if (prior) {
        console.warn(`  ↩︎ salvaged prior listing for ${card.url}: ${prior.address} — $${Number(prior.price).toLocaleString()}`);
        listings.push(prior);
      } else {
        unresolved.push(card.url || '(missing compassUrl)');
      }
    }
  }

  await browser.close();

  const decision = decideFetchImagesWrite({
    resolvedCount: listings.length,
    unresolvedCount: unresolved.length,
  });
  if (!decision.write) {
    if (decision.reason === 'unresolved-cards') {
      console.error(`[fetch-images] ${unresolved.length} agent-page card(s) could not be resolved (no successful scrape and no salvage). Leaving lib/listings.ts unchanged.`);
      for (const url of unresolved) {
        console.error(`  • ${url}`);
      }
    } else {
      console.log('[fetch-images] No listings scraped — keeping existing file.');
    }
    process.exit(decision.exitCode);
  }

  const timestamp = new Date().toISOString();
  for (const l of listings) {
    const prior = priorByUrl.get(normalizeCompassUrl(l.compassUrl));
    l.firstSeen = firstSeenForListing(prior, timestamp);
  }
  const tsContent = renderActiveListingsFile(listings, timestamp, COMPASS_URL);

  fs.writeFileSync(LISTINGS_FILE, tsContent, 'utf8');
  console.log(`\n[fetch-images] ✅ Written ${listings.length} listings with photos to lib/listings.ts`);
}

main().catch(err => {
  console.error('[fetch-images] Fatal:', err);
  process.exit(1);
});
