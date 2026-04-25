/**
 * Schema.org BreadcrumbList builder.
 *
 * Google renders BreadcrumbList JSON-LD as the breadcrumb trail shown
 * in place of the bare URL on search result snippets, so every
 * navigable page should emit one. Suburb + blog pages already do this
 * inline; this helper standardizes the pattern for top-level pages.
 */

const SITE = 'https://joshuafink.com'

export type Crumb = { name: string; href: string }

export function buildBreadcrumbSchema(trail: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE}${c.href}`,
    })),
  }
}
