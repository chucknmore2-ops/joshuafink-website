import Link from 'next/link'
import type { ReactNode } from 'react'
import { getNeighborhoodsByCitySlug } from './neighborhoods'

// Shorter or alternate phrasings that should also link to a guide. Use when
// in-copy prose names a guide differently from its display name
// (e.g., "Ladd Park" stands in for "The Highlands at Ladd Park").
const neighborhoodAliases: Record<string, string[]> = {
  'highlands-at-ladd-park-franklin-tn': ['Ladd Park'],
}

/**
 * Wraps the first occurrence of each in-city neighborhood guide name (or alias)
 * with a Link to /neighborhoods/[slug]. Used on the money pages
 * (/cash-offer, /sell, /buy) to push internal PageRank into the long-tail guide
 * pages and surface deeper content to in-funnel readers.
 */
export function linkifyNeighborhoods(text: string, citySlug: string): ReactNode[] {
  const guides = getNeighborhoodsByCitySlug(citySlug)
  if (guides.length === 0) return [text]

  // Build (phrase, slug) pairs, longest first so multi-word names match before
  // any shorter prefix they might contain.
  const pairs: Array<{ phrase: string; slug: string }> = []
  for (const g of guides) {
    pairs.push({ phrase: g.name, slug: g.slug })
    for (const alias of neighborhoodAliases[g.slug] ?? []) {
      pairs.push({ phrase: alias, slug: g.slug })
    }
  }
  pairs.sort((a, b) => b.phrase.length - a.phrase.length)

  let nodes: ReactNode[] = [text]
  const linked = new Set<string>()

  for (const { phrase, slug } of pairs) {
    if (linked.has(slug)) continue
    const next: ReactNode[] = []
    let replacedThisPhrase = false
    for (const node of nodes) {
      if (replacedThisPhrase || typeof node !== 'string') {
        next.push(node)
        continue
      }
      const idx = node.indexOf(phrase)
      if (idx < 0) {
        next.push(node)
        continue
      }
      const before = node.slice(0, idx)
      const after = node.slice(idx + phrase.length)
      if (before) next.push(before)
      next.push(
        <Link
          key={`guide-${slug}`}
          href={`/neighborhoods/${slug}`}
          className="underline underline-offset-2 hover:no-underline"
        >
          {phrase}
        </Link>,
      )
      if (after) next.push(after)
      replacedThisPhrase = true
      linked.add(slug)
    }
    nodes = next
  }

  return nodes
}
