import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { neighborhoods } from './neighborhoods.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

test('every neighborhood page has FAQ questions and answers', () => {
  const page = readFileSync(join(repoRoot, 'app/neighborhoods/[slug]/page.tsx'), 'utf8')
  assert.match(page, /'@type': 'FAQPage'/)
  assert.match(page, /n\.faqs\.map/)
  assert.match(page, /Frequently Asked Questions/)

  const rows = Object.values(neighborhoods)
  assert.ok(rows.length > 0)
  for (const neighborhood of rows) {
    assert.ok(neighborhood.faqs.length >= 1, `${neighborhood.slug} has no FAQs`)
    for (const faq of neighborhood.faqs) {
      assert.ok(faq.q.trim().length > 0, `${neighborhood.slug} has an empty question`)
      assert.ok(faq.a.trim().length > 0, `${neighborhood.slug} has an empty answer`)
    }
  }
})
