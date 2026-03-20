#!/usr/bin/env node
/**
 * parse-listings.mjs
 * Accepts Compass agent page HTML via stdin, parses listings, 
 * writes lib/listings.ts, commits and pushes to GitHub.
 *
 * Usage: echo "<html>" | node scripts/parse-listings.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LISTINGS_FILE = path.join(__dirname, '..', 'lib', 'listings.ts');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

function parseListingsFromText(text) {
  const listings = [];
  const seen = new Set();

  // Match listing blocks: address + city + price + details
  // Compass page text format from web_fetch readability extractor:
  // e.g. "9209 Duncaster Court, Brentwood, TN 37027\n...\n$2,699,000\n6Bedrooms\n6Bathrooms\n5,392Square Feet"

  const priceRegex = /\$([0-9,]+)/g;
  const listingBlockRegex = /(\d+\s+[A-Za-z0-9 .]+(?:Drive|Court|Street|Avenue|Road|Lane|Way|Circle|Place|Boulevard|Blvd|Trace|Square|Bend|Cv|Loop|Pike|Highway|Hwy|Dr|Ct|St|Ave|Rd|Ln|Wy|Cir|Pl|Blvd|Sq)[^$\n]*),\s*([A-Za-z\s]+,\s*TN\s*\d{5})[^\$]*?\$([0-9,]+)/gi;

  // Try structured extraction from readability text
  // Format seen in actual fetch: address line, city line, price, beds, baths, sqft, compass link
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for Compass homedetails links
    if (line.includes('/homedetails/') || line.includes('compass.com/homedetails')) {
      // Extract URL
      const urlMatch = line.match(/\(?(https?:\/\/(?:www\.)?compass\.com\/homedetails\/[^\s\)]+)\)?/);
      if (!urlMatch) continue;

      const compassUrl = urlMatch[1].replace(/\/$/, '') + '/';

      // Look backwards for address, price, beds, baths, sqft
      let address = '', city = '', price = 0, beds = 0, baths = 0, sqft = 0, status = 'Active';

      for (let j = Math.max(0, i - 15); j < i; j++) {
        const l = lines[j];

        // Price line: $2,699,000
        if (/^\$[0-9,]+$/.test(l)) {
          price = parseInt(l.replace(/[^0-9]/g, ''));
        }

        // Beds: "6Bedrooms" or "6 Bedrooms"  
        if (/^\d+\s*Bedrooms?$/i.test(l)) {
          beds = parseInt(l);
        }

        // Baths: "6Bathrooms"
        if (/^\d+\s*Bathrooms?$/i.test(l)) {
          baths = parseFloat(l);
        }

        // Sqft: "5,392Square Feet"
        if (/^[\d,]+\s*Square\s*Feet?$/i.test(l)) {
          sqft = parseInt(l.replace(/[^0-9]/g, ''));
        }

        // Status badges
        if (/active under contract/i.test(l)) status = 'Active Under Contract';
        else if (/coming soon/i.test(l)) status = 'Coming Soon';
        else if (/pending/i.test(l)) status = 'Pending';
        else if (/open.*house/i.test(l)) status = l.trim();

        // Address: starts with number, has street type
        if (/^\d+\s+[A-Za-z]/.test(l) && /Drive|Court|Street|Avenue|Road|Lane|Way|Circle|Place|Boulevard|Blvd|Trace|Square|Bend|Cv|Loop|Dr|Ct|St|Ave|Rd|Ln|Wy|Cir|Pl|Sq/i.test(l)) {
          address = l;
        }

        // City: "Brentwood, TN 37027"
        if (/^[A-Za-z\s]+,\s*TN\s*\d{5}$/.test(l)) {
          city = l;
        }
      }

      const key = compassUrl;
      if (address && price > 0 && !seen.has(key)) {
        seen.add(key);
        listings.push({ address, city, price, beds, baths, sqft, status, compassUrl });
      }
    }
  }

  return listings;
}

function generateListingsTs(listings) {
  const timestamp = new Date().toISOString();

  const listingsCode = listings.map(l => {
    const parts = [
      `    address: ${JSON.stringify(l.address)}`,
      `    city: ${JSON.stringify(l.city)}`,
      `    price: ${l.price}`,
    ];
    if (l.beds) parts.push(`    beds: ${l.beds}`);
    if (l.baths) parts.push(`    baths: ${l.baths}`);
    if (l.sqft) parts.push(`    sqft: ${l.sqft}`);
    parts.push(`    status: ${JSON.stringify(l.status)}`);
    parts.push(`    compassUrl: ${JSON.stringify(l.compassUrl)}`);
    return `  {\n${parts.join(',\n')},\n  }`;
  }).join(',\n');

  return `// AUTO-GENERATED — Last synced: ${timestamp}
// Source: https://www.compass.com/agents/joshua-fink/
// Do not edit manually — updated automatically by OpenClaw daily cron

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
  const input = await readStdin();

  if (!input.trim()) {
    console.error('[parse-listings] No input received on stdin');
    process.exit(1);
  }

  console.log(`[parse-listings] Parsing ${input.length} chars of input...`);
  const listings = parseListingsFromText(input);
  console.log(`[parse-listings] Found ${listings.length} listings`);

  if (listings.length === 0) {
    console.log('[parse-listings] No listings found — keeping existing file unchanged.');
    process.exit(0);
  }

  // Print parsed listings for review
  listings.forEach((l, i) => {
    console.log(`  ${i+1}. ${l.address}, ${l.city} — $${l.price.toLocaleString()} | ${l.beds}bd/${l.baths}ba | ${l.status}`);
  });

  const tsContent = generateListingsTs(listings);
  fs.writeFileSync(LISTINGS_FILE, tsContent, 'utf8');
  console.log(`[parse-listings] ✅ Written to lib/listings.ts`);

  // Git commit and push
  try {
    const repoRoot = path.join(__dirname, '..');
    execSync('git add lib/listings.ts', { cwd: repoRoot, stdio: 'pipe' });
    
    // Check if there are actual changes
    const status = execSync('git status --porcelain lib/listings.ts', { cwd: repoRoot }).toString().trim();
    if (!status) {
      console.log('[parse-listings] No changes detected — skipping commit.');
      process.exit(0);
    }

    execSync(`git commit -m "chore: auto-sync listings [${new Date().toLocaleDateString('en-US')}]"`, { cwd: repoRoot, stdio: 'pipe' });
    execSync('git push origin main', { cwd: repoRoot, stdio: 'pipe' });
    console.log('[parse-listings] ✅ Pushed to GitHub — Vercel will auto-deploy in ~60 seconds.');
  } catch (err) {
    console.warn(`[parse-listings] Git error: ${err.message}`);
  }
}

main().catch(err => {
  console.error('[parse-listings] Fatal:', err);
  process.exit(1);
});
