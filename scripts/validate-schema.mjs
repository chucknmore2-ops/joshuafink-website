#!/usr/bin/env node
/**
 * Schema validation CI.
 *
 * Fetches the highest-traffic pages, extracts every
 * <script type="application/ld+json"> block, parses each, and asserts a
 * minimal required shape per @type. Exits non-zero on any violation.
 *
 * Assumes a local Next.js server on BASE_URL (defaults to
 * http://localhost:3000). The lighthouse-ci workflow already starts one;
 * this reuses the same pattern.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/validate-schema.mjs
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const URLS = [
  '/',
  '/about',
  '/cash-offer',
  '/blog',
  '/blog/nashville-real-estate-market-2025',
  '/blog/we-buy-houses-nashville-how-it-works',
  '/sell/franklin-tn',
  '/buy/franklin-tn',
]

// Minimum required fields per @type. Keyed by @type; value is required keys.
const REQUIRED_FIELDS = {
  BlogPosting: ['headline', 'datePublished', 'author', 'publisher'],
  Article: ['headline', 'datePublished', 'author'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
  RealEstateAgent: ['name', 'url'],
  Person: ['name'],
  Organization: ['name'],
  WebSite: ['url', 'name'],
  Service: ['name', 'provider'],
  ProfilePage: ['mainEntity'],
  Review: ['reviewRating', 'author'],
  AggregateRating: ['ratingValue'],
  ImageObject: ['url'],
  SpeakableSpecification: ['cssSelector'],
  PostalAddress: ['addressCountry'],
  OpeningHoursSpecification: ['dayOfWeek', 'opens', 'closes'],
  EducationalOccupationalCredential: ['name'],
  Offer: ['availability'],
}

let errorCount = 0
let scriptsValidated = 0

function recordError(url, msg) {
  console.error(`  ❌ ${msg}`)
  errorCount++
}

function recordInfo(msg) {
  console.log(`  ✓ ${msg}`)
}

function* iterateNodes(root) {
  const stack = [root]
  while (stack.length) {
    const node = stack.pop()
    if (Array.isArray(node)) {
      stack.push(...node)
      continue
    }
    if (node && typeof node === 'object') {
      yield node
      for (const v of Object.values(node)) {
        if (v && (Array.isArray(v) || typeof v === 'object')) stack.push(v)
      }
    }
  }
}

function validateNode(url, node, path = '(root)') {
  const type = node['@type']
  if (!type) return // untyped sub-nodes are fine (e.g. ListItem.item with only @id)

  const types = Array.isArray(type) ? type : [type]
  for (const t of types) {
    const required = REQUIRED_FIELDS[t]
    if (!required) continue // unknown @type — don't fail, just skip
    for (const field of required) {
      if (!(field in node) && !('@id' in node)) {
        recordError(
          url,
          `${path} @type=${t} missing required field "${field}"`,
        )
      }
    }
  }
}

async function validateUrl(url) {
  const fullUrl = `${BASE_URL}${url}`
  console.log(`\n→ ${url}`)
  let html
  try {
    const res = await fetch(fullUrl, { redirect: 'follow' })
    if (!res.ok) {
      recordError(url, `HTTP ${res.status} fetching ${fullUrl}`)
      return
    }
    html = await res.text()
  } catch (err) {
    recordError(url, `fetch failed: ${err.message}`)
    return
  }

  const scripts = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((m) => m[1].trim())

  if (scripts.length === 0) {
    recordError(url, 'no JSON-LD script tags found')
    return
  }
  recordInfo(`${scripts.length} JSON-LD block(s) found`)

  scripts.forEach((raw, i) => {
    const tag = `block ${i + 1}`
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      recordError(url, `${tag} failed JSON.parse: ${err.message}`)
      return
    }
    scriptsValidated++

    // Top-level must have @context (graph or node)
    if (!parsed['@context']) {
      recordError(url, `${tag} missing @context at top level`)
    }

    // Walk the tree — validate every typed node
    let nodeCount = 0
    for (const node of iterateNodes(parsed)) {
      validateNode(url, node, `${tag}.node[${nodeCount}]`)
      nodeCount++
    }
    recordInfo(`${tag} parsed OK, ${nodeCount} typed nodes scanned`)
  })
}

async function main() {
  console.log(`Schema validation against ${BASE_URL}\n`)
  for (const url of URLS) {
    await validateUrl(url)
  }
  console.log(
    `\n──── ${scriptsValidated} JSON-LD blocks validated, ${errorCount} error(s) ────`,
  )
  if (errorCount > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`)
  process.exit(2)
})
