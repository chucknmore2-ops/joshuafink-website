import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { blogDateToIso, blogPosts } from './blog.ts'
import { chicagoIsoDate } from './gnar-snapshot.ts'

const SELLER_PAGE = readFileSync('app/guide/seller/page.tsx', 'utf8')
const post = blogPosts.find((p) => p.slug === 'middle-tennessee-sellers-guide-2026')

test('seller guide drops stale experience claims and stays Compass-only', () => {
  const blob = `${SELLER_PAGE}\n${post?.content ?? ''}\n${post?.excerpt ?? ''}`
  assert.doesNotMatch(blob, /Parks|RE\/MAX|17-year|17 years|13 years|100\+ homes|100\+ transactions/i)
  assert.match(SELLER_PAGE, /licensed since 2008/)
  assert.match(SELLER_PAGE, /40\+ homes a year/)
  assert.match(SELLER_PAGE, /8119 Isabella Lane, Suite 105, Brentwood, TN 37027/)
  assert.match(SELLER_PAGE, /TREC #351484/)
  assert.match(SELLER_PAGE, /615-551-2727/)
  assert.doesNotMatch(SELLER_PAGE, /name="website"/)
})

test('seller guide cites the current GNAR and Redfin sources and live links', () => {
  assert.match(SELLER_PAGE, /middle-tennessee-market-update-september-2026/)
  assert.match(SELLER_PAGE, /\/listings/)
  assert.match(SELLER_PAGE, /\/cash-offer/)
  assert.match(SELLER_PAGE, /\/cash-offer\/nashville-tn/)
  assert.match(SELLER_PAGE, /\/cash-offer\/franklin-tn/)
  assert.match(SELLER_PAGE, /datePublished: PUBLISHED/)
  assert.match(SELLER_PAGE, /const PUBLISHED = '2026-10-07'/)
  assert.ok(post)
  assert.equal(post.title, "The 2026 Middle Tennessee Seller's Guide")
  assert.equal(post.date, 'October 7, 2026')
  assert.equal(blogDateToIso(post.date), '2026-10-07')
  assert.ok(blogDateToIso(post.date)! <= chicagoIsoDate(new Date()))
  assert.match(post.content, /\$510,000/)
  assert.match(post.content, /57 days/)
  assert.match(post.content, /5\.7/)
  assert.match(post.content, /\$862,929/)
  assert.match(post.content, /Redfin/)
  assert.match(post.content, /\/guide\/seller/)
  assert.match(post.content, /\/listings/)
})
