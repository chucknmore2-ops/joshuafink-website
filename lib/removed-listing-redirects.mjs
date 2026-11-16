/**
 * 308s for /listings/<slug> URLs the Compass sync dropped from lib/listings.ts.
 *
 * scripts/record-removed-listings.mjs appends a row when a home leaves active
 * inventory. Destination, chosen once at removal:
 *   1. /sold when the address is in lib/closings-data.ts
 *   2. /buy/{city}-tn when that city page exists
 *   3. /listings otherwise
 *
 * legacy-redirects.mjs reads this file at build time. A slug that is back in
 * active or sold inventory is left out of the redirect list so the live page
 * wins, and the sync deletes that row on the next run. These paths are not
 * sitemap entries — lib/site-urls.ts only emits current detail slugs.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const REMOVED_LISTING_REDIRECTS_FILE = path.join(
  root,
  'lib',
  'removed-listing-redirects.json',
)

/** Abbreviations only. The long form passes through unchanged, so both sides match. */
const STREET_TOKEN = {
  aly: 'alley',
  ave: 'avenue',
  blvd: 'boulevard',
  cir: 'circle',
  ct: 'court',
  cv: 'cove',
  dr: 'drive',
  hwy: 'highway',
  ln: 'lane',
  pkwy: 'parkway',
  pl: 'place',
  pt: 'point',
  rd: 'road',
  sq: 'square',
  st: 'street',
  ter: 'terrace',
  trce: 'trace',
  trl: 'trail',
  xing: 'crossing',
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest',
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Same identity slug as listingSlug() in lib/listing-detail.ts.
 * @param {{ address?: string, city?: string }} listing
 */
export function listingPathSlug(listing) {
  const locality = String(listing?.city ?? '').split('|')[0].split(',')[0]
  return `${listing?.address ?? ''} ${locality}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeListingUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    const u = new URL(trimmed)
    u.hash = ''
    u.search = ''
    const pathname = u.pathname.replace(/\/+$/, '')
    return `${u.origin}${pathname}`.toLowerCase()
  } catch {
    return trimmed.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase()
  }
}

/**
 * Street-suffix and direction abbreviations folded to one form.
 * "St" matches "Street". "Saint" is left as saint, so a saint/street
 * disagreement does not count as the same closing — the URL still
 * redirects, just to the city page or /listings.
 */
export function addressMatchKey(address) {
  const cleaned = String(address ?? '')
    .toLowerCase()
    .replace(/['’‘]/g, '')
    .replace(/[#.,]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  if (!cleaned) return ''
  return cleaned
    .split(/\s+/)
    .map((token) => STREET_TOKEN[token] || token)
    .join(' ')
}

/** City name only, so "Antioch, TN 37013 | MLS #1" matches closings city "Antioch". */
export function localityMatchKey(city) {
  const cityClean = String(city ?? '').split('|')[0].trim()
  const match = cityClean.match(/([A-Za-z][A-Za-z .']+),\s*[A-Z]{2}\s+\d{5}/)
  const name = (match?.[1] || cityClean.split(',')[0] || '').trim()
  return name.toLowerCase().replace(/['’‘]/g, '').replace(/[^a-z0-9]+/g, '')
}

export function closingMatchKey(address, city) {
  return `${addressMatchKey(address)}|${localityMatchKey(city)}`
}

export function closingKeysFromRows(rows) {
  const keys = new Set()
  for (const row of rows || []) {
    const street = addressMatchKey(row?.address)
    const city = localityMatchKey(row?.city)
    if (!street || !city) continue
    keys.add(`${street}|${city}`)
  }
  return keys
}

/**
 * Mirrors getSuburbSlugForListing() in lib/suburbs.ts.
 * @param {string} city
 * @param {Set<string>} suburbSlugs
 */
export function buySlugForListingCity(city, suburbSlugs) {
  const cityClean = String(city ?? '').split('|')[0].trim()
  const localityMatch = cityClean.match(/([A-Za-z][A-Za-z .']+),\s*[A-Z]{2}\s+\d{5}/)
  const cityName = (localityMatch?.[1] || cityClean.split(',')[0] || '').trim()
  if (!cityName) return null
  const slug =
    cityName
      .toLowerCase()
      .replace(/['’‘]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-tn'
  return suburbSlugs.has(slug) ? slug : null
}

/**
 * @param {{ address?: string, city?: string }} listing
 * @param {{ closingKeys: Set<string>, suburbSlugs: Set<string> }} deps
 */
export function chooseRemovedListingDestination(listing, { closingKeys, suburbSlugs }) {
  const street = addressMatchKey(listing?.address)
  const city = localityMatchKey(listing?.city)
  if (street && city && closingKeys.has(`${street}|${city}`)) return '/sold'
  const buy = buySlugForListingCity(listing?.city, suburbSlugs)
  if (buy) return `/buy/${buy}`
  return '/listings'
}

/**
 * Keep a stored destination only when it is /sold, /listings, or a real
 * /buy/{city}-tn page. Anything else (including a city page that no longer
 * exists) falls back to /listings so the redirect itself cannot 404.
 * @param {string} destination
 * @param {Set<string>} suburbSlugs
 */
export function effectiveRemovedDestination(destination, suburbSlugs) {
  if (destination === '/sold' || destination === '/listings') return destination
  const match = /^\/buy\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(destination || '')
  if (match && suburbSlugs.has(match[1])) return destination
  return '/listings'
}

function listingIdentity(listing, normalizeUrl) {
  const url = normalizeUrl(listing?.compassUrl)
  if (url) return `url:${url}`
  const slug = listingPathSlug(listing)
  return slug ? `slug:${slug}` : ''
}

/**
 * Append homes that left `prior` and drop slugs that are active again.
 * An existing row keeps its destination. A slug still served by a current
 * listing is not redirected.
 */
export function updateRemovedListingMap({
  prior,
  current,
  removed,
  closingKeys,
  suburbSlugs,
  normalizeUrl = normalizeListingUrl,
}) {
  const currentIds = new Set()
  const currentSlugs = new Set()
  for (const listing of current || []) {
    const id = listingIdentity(listing, normalizeUrl)
    if (id) currentIds.add(id)
    const slug = listingPathSlug(listing)
    if (slug) currentSlugs.add(slug)
  }

  const kept = []
  const seen = new Set()
  for (const entry of removed || []) {
    if (!entry || typeof entry.slug !== 'string') continue
    if (!SLUG_RE.test(entry.slug) || currentSlugs.has(entry.slug) || seen.has(entry.slug)) continue
    seen.add(entry.slug)
    kept.push({
      slug: entry.slug,
      address: typeof entry.address === 'string' ? entry.address : '',
      city: typeof entry.city === 'string' ? entry.city : '',
      destination: effectiveRemovedDestination(entry.destination, suburbSlugs),
    })
  }

  for (const listing of prior || []) {
    const id = listingIdentity(listing, normalizeUrl)
    if (id && currentIds.has(id)) continue
    const slug = listingPathSlug(listing)
    const address = typeof listing?.address === 'string' ? listing.address.trim() : ''
    if (!slug || !address || currentSlugs.has(slug) || seen.has(slug)) continue
    const city = typeof listing.city === 'string' ? listing.city : ''
    seen.add(slug)
    kept.push({
      slug,
      address: listing.address,
      city,
      destination: chooseRemovedListingDestination(
        { address: listing.address, city },
        { closingKeys, suburbSlugs },
      ),
    })
  }

  return kept
}

export function serializeRemovedListings(entries) {
  return `${JSON.stringify({ removed: entries }, null, 2)}\n`
}

export function readRemovedListings(file = REMOVED_LISTING_REDIRECTS_FILE) {
  if (!fs.existsSync(file)) return []
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    throw new Error(
      `Could not parse ${file}: ${err instanceof Error ? err.message : err}`,
    )
  }
  if (!parsed || !Array.isArray(parsed.removed)) {
    throw new Error(`${file} must be an object with a removed array`)
  }
  return parsed.removed
}

export function writeRemovedListings(entries, file = REMOVED_LISTING_REDIRECTS_FILE) {
  fs.writeFileSync(file, serializeRemovedListings(entries))
}

/**
 * Pull `export const <name> = [ ... ]` out of a generated TS file.
 * Bracket-matches so photo URL arrays inside a listing are not the end.
 * @param {string} source
 * @param {string} exportName
 */
export function listingsArrayFromSource(source, exportName) {
  const marker = new RegExp(`export const ${exportName}\\b(?::[^=]+)?=\\s*\\[`)
  const match = marker.exec(source)
  if (!match) {
    throw new Error(`Could not find export const ${exportName}`)
  }
  const start = match.index + match[0].length - 1
  let depth = 0
  let quote = null
  let escaped = false
  for (let i = start; i < source.length; i++) {
    const ch = source[i]
    if (quote) {
      if (escaped) {
        escaped = false
        continue
      }
      if (ch === '\\') {
        escaped = true
        continue
      }
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      continue
    }
    if (ch === '[') depth += 1
    else if (ch === ']') {
      depth -= 1
      if (depth === 0) {
        const arraySrc = source
          .slice(start, i + 1)
          .replace(/\blistingsSyncedAt\b/g, 'undefined')
        let parsed
        try {
          parsed = Function(`"use strict"; return (${arraySrc})`)()
        } catch (err) {
          throw new Error(
            `Could not parse ${exportName}: ${err instanceof Error ? err.message : err}`,
          )
        }
        if (!Array.isArray(parsed)) {
          throw new Error(`${exportName} did not parse to an array`)
        }
        return parsed
      }
    }
  }
  throw new Error(`Unclosed array for ${exportName}`)
}

export function suburbSlugsFromSource(source) {
  const slugs = new Set()
  const re = /^ {2}'([a-z0-9]+(?:-[a-z0-9]+)*)': \{/gm
  for (const match of source.matchAll(re)) slugs.add(match[1])
  return slugs
}

function isIndexableSold(listing) {
  const city = String(listing?.city ?? '').trim()
  const hasLocality = city.length > 0 && city.toUpperCase() !== 'TN'
  const hasSpec =
    listing?.beds !== undefined ||
    listing?.baths !== undefined ||
    listing?.sqft !== undefined ||
    listing?.acres !== undefined
  return Boolean(
    listing?.address &&
      listing.address !== 'Undisclosed Address' &&
      hasLocality &&
      Number(listing.price) > 0 &&
      hasSpec,
  )
}

function soldDisambiguationToken(listing) {
  const compassUrl = typeof listing?.compassUrl === 'string' ? listing.compassUrl : ''
  const lid = compassUrl.match(/(\d+)_lid/)?.[1]
  if (lid) return lid.slice(-10)
  const pid = compassUrl.match(/\/([A-Za-z0-9]+)_pid/)?.[1]
  if (pid) return pid.toLowerCase()
  return compassUrl.replace(/[^a-z0-9]+/gi, '').slice(-10).toLowerCase() || 'x'
}

/**
 * Page slugs for active + indexable sold homes. Mirrors
 * assignListingDetailSlugs() so a redirect is suppressed when either
 * inventory still serves that URL.
 */
export function collectListingDetailSlugs(activeListings, sold) {
  const slugs = new Set()
  for (const listing of activeListings || []) {
    const slug = listingPathSlug(listing)
    if (slug && !slugs.has(slug)) slugs.add(slug)
  }
  for (const listing of sold || []) {
    if (!isIndexableSold(listing)) continue
    const base = listingPathSlug(listing)
    if (!base) continue
    let slug = base
    if (slugs.has(slug)) slug = `${base}-sold`
    if (slugs.has(slug)) slug = `${base}-sold-${soldDisambiguationToken(listing)}`
    slugs.add(slug)
  }
  return slugs
}

export function liveListingSlugsFromRepo(repoRoot = root) {
  const active = listingsArrayFromSource(
    fs.readFileSync(path.join(repoRoot, 'lib', 'listings.ts'), 'utf8'),
    'listings',
  )
  const sold = listingsArrayFromSource(
    fs.readFileSync(path.join(repoRoot, 'lib', 'sold-listings.ts'), 'utf8'),
    'soldListings',
  )
  return collectListingDetailSlugs(active, sold)
}

export function suburbSlugsFromRepo(repoRoot = root) {
  return suburbSlugsFromSource(
    fs.readFileSync(path.join(repoRoot, 'lib', 'suburbs.ts'), 'utf8'),
  )
}

export function closingKeysFromRepo(repoRoot = root) {
  const rows = listingsArrayFromSource(
    fs.readFileSync(path.join(repoRoot, 'lib', 'closings-data.ts'), 'utf8'),
    'closings',
  )
  return closingKeysFromRows(rows)
}

/**
 * Permanent redirects for removed slugs. Live detail slugs are omitted.
 * @param {Array<{ slug?: string, destination?: string }>} entries
 * @param {{ liveSlugs: Set<string>, suburbSlugs: Set<string> }} deps
 */
export function listingRedirectsFromRemoved(entries, { liveSlugs, suburbSlugs }) {
  const rules = []
  const seen = new Set()
  for (const entry of entries || []) {
    const slug = entry?.slug
    if (typeof slug !== 'string' || !SLUG_RE.test(slug)) continue
    if (liveSlugs.has(slug) || seen.has(slug)) continue
    const destination = effectiveRemovedDestination(entry.destination, suburbSlugs)
    const source = `/listings/${slug}`
    if (source === destination) continue
    seen.add(slug)
    rules.push({ source, destination, permanent: true })
  }
  return rules
}
