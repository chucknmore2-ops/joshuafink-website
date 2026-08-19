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
      if (!(field in node)) {
        recordError(
          url,
          `${path} @type=${t} missing required field "${field}"`,
        )
      }
    }
  }
}

/**
 * Fold every node that shares an `@id` into one object, the way a consumer
 * does. Two things depend on this:
 *
 *   - Required-field checks used to be skipped entirely for any node carrying
 *     an `@id` — which is every node that matters — so this gate was green by
 *     construction on exactly the entities it claimed to protect. The escape
 *     existed for a real reason (a bare `{ '@id': ... }` reference legitimately
 *     has no other fields), but it was far too broad. Merging first solves it
 *     properly: a reference contributes nothing and the real declaration
 *     supplies the fields, so partial nodes are fine and genuine omissions
 *     still fail.
 *   - Conflicting identity is caught. On 2026-08-18 seven page templates
 *     re-declared `#agent` with a different `name` and `url` than the canonical
 *     definition in app/layout.tsx, so Google merged them and received two
 *     contradictory identities for the entity the whole strategy rests on.
 *     Scalar disagreement on a shared `@id` is now an error.
 */
function mergeById(url, roots, tag) {
  const byId = new Map()
  const anonymous = []
  const IGNORE_CONFLICT = new Set(['@id', '@context'])

  for (const node of iterateNodes(roots)) {
    if (!node['@type']) continue // pure reference or untyped sub-node
    const id = node['@id']
    if (typeof id !== 'string') {
      anonymous.push(node)
      continue
    }
    const prev = byId.get(id)
    if (!prev) {
      byId.set(id, { ...node })
      continue
    }
    for (const [k, v] of Object.entries(node)) {
      if (IGNORE_CONFLICT.has(k)) continue
      if (!(k in prev)) {
        prev[k] = v
        continue
      }
      // Only scalars are compared; objects/arrays legitimately accumulate.
      const bothScalar =
        (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') &&
        (typeof prev[k] === 'string' ||
          typeof prev[k] === 'number' ||
          typeof prev[k] === 'boolean')
      if (bothScalar && prev[k] !== v) {
        recordError(
          url,
          `${tag} @id=${id} declared twice with conflicting "${k}": ` +
            `${JSON.stringify(prev[k])} vs ${JSON.stringify(v)}`,
        )
      }
    }
  }
  return { byId, anonymous }
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

  const parsedBlocks = []
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
    parsedBlocks.push(parsed)
  })

  // Merge across EVERY block on the page, not within each one. A consumer sees
  // a single graph per document, and this site deliberately splits it:
  // app/layout.tsx emits the canonical #agent in its own <script>, while a page
  // template contributes extra properties to that same @id from a separate one.
  // Validating block-by-block would report the page-level partial as missing
  // the name/url that the layout block already supplies.
  const { byId, anonymous } = mergeById(url, parsedBlocks, 'page')
  byId.forEach((node, id) => validateNode(url, node, `@id=${id}`))
  anonymous.forEach((node, i) => validateNode(url, node, `inline[${i}]`))
  recordInfo(
    `${byId.size} identified + ${anonymous.length} inline node(s) validated across ${parsedBlocks.length} block(s)`,
  )
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
