// Just Listed / Coming Soon GBP copy, address targeting, and the launch
// baseline. These tests never call Google. Run: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listings, type Listing } from '@/lib/listings'
import { isAvailable } from '@/app/listings/page'
import { validateGbpLocalPost } from './cta.ts'
import {
  GBP_JUST_LISTED_BASELINE_ADDRESSES,
  GBP_JUST_LISTED_BASELINE_REF_KEYS,
  JUST_LISTED_GAP_MS,
  JUST_LISTED_PER_RUN,
  buildJustListedDraft,
  draftForAddress,
  findListingByAddress,
  isGbpAnnounceable,
  listingRefKey,
  planJustListedPosts,
} from './just-listed.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..')

function fixture(overrides: Partial<Listing> & Pick<Listing, 'address' | 'city'>): Listing {
  return {
    price: 409900,
    beds: 3,
    baths: 1,
    sqft: 1223,
    status: 'Active',
    compassUrl: 'https://www.compass.com/homedetails/example/ABC_pid/',
    imageUrl:
      'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/2048x1536.webp',
    ...overrides,
  }
}

test('address query posts that listing, not the first card in the file', () => {
  const source = [
    fixture({ address: '511 Wanda Dr', city: 'Nashville, TN 37210' }),
    fixture({ address: '4127 Edwards Ave', city: 'Nashville, TN 37216' }),
  ]
  const match = findListingByAddress('Edwards', source)
  assert.equal(match?.address, '4127 Edwards Ave')
  const draft = draftForAddress('Edwards', source)
  assert.ok(draft)
  assert.equal(draft.refKey, '4127-edwards-ave')
  assert.match(draft.summary, /4127 Edwards Ave/)
  assert.doesNotMatch(draft.summary, /511 Wanda/)
})

test('empty address does not resolve a listing (weekly rotator keeps its own picker)', () => {
  assert.equal(findListingByAddress(''), null)
  assert.equal(findListingByAddress('   '), null)
  assert.equal(draftForAddress(''), null)
})

test('exact address beats a longer street that merely contains the query', () => {
  const source = [
    fixture({ address: '316 7th Ave', city: 'Columbia, TN 38401' }),
    fixture({ address: '7th Ave', city: 'Columbia, TN 38401' }),
  ]
  assert.equal(findListingByAddress('7th Ave', source)?.address, '7th Ave')
  assert.equal(findListingByAddress('316', source)?.address, '316 7th Ave')
})

test('Just Listed copy names the city, stats, price, and Compass — never Parks, phone, or a URL', () => {
  const draft = buildJustListedDraft(
    fixture({
      address: '4127 Edwards Ave',
      city: 'Nashville, TN 37216 | MLS #3319964',
      status: 'Active',
    }),
  )
  assert.equal(draft.headline, 'Just Listed')
  assert.equal(
    draft.summary,
    [
      '🏡 Just Listed — 4127 Edwards Ave, Nashville',
      '',
      '3 bed · 1 bath · 1,223 sq ft · $409,900',
      '',
      'Just listed with Joshua Fink at Compass.',
      '',
      '#JustListed #NashvilleTN #JoshuaFinkGroup #Compass',
    ].join('\n'),
  )
  assert.doesNotMatch(draft.summary, /Parks/)
  assert.doesNotMatch(draft.summary, /615/)
  assert.doesNotMatch(draft.summary, /https?:\/\//)
  assert.equal(validateGbpLocalPost(draft).ok, true)
  assert.equal(
    draft.photoUrl,
    'https://www.compass.com/m/a9acaa52f1af4a5177df8b946004d09e9a06867e02336fcf803a804d4570b560/1200x900.jpg',
  )
})

test('a live Active listing uses the on-site page with UTM, not the Compass URL', () => {
  const live = listings.find((listing) => listing.address === '4127 Edwards Ave' && listing.status === 'Active')
  if (!live) return
  const draft = buildJustListedDraft(live)
  assert.equal(draft.headline, 'Just Listed')
  assert.match(draft.summary, /^🏡 Just Listed — 4127 Edwards Ave, Nashville\n/)
  assert.match(draft.summary, /Joshua Fink at Compass/)
  assert.match(draft.summary, /#Compass/)
  assert.doesNotMatch(draft.summary, /Parks/)
  assert.equal(draft.cta.actionType, 'LEARN_MORE')
  const url = new URL(draft.cta.url)
  assert.equal(url.origin + url.pathname, 'https://www.joshuafink.com/listings/4127-edwards-ave-nashville')
  assert.equal(url.searchParams.get('utm_source'), 'gbp')
  assert.equal(url.searchParams.get('utm_medium'), 'auto')
  assert.equal(url.searchParams.get('utm_campaign'), 'gbp-just-listed')
  assert.equal(url.searchParams.get('utm_content'), '4127-edwards-ave')
  assert.doesNotMatch(draft.cta.url, /compass\.com/)
})

test('Coming Soon status says Coming Soon instead of Just Listed', () => {
  const draft = buildJustListedDraft(
    fixture({
      address: '261 Paragon Mills Rd',
      city: 'Nashville, TN 37211',
      price: 549000,
      beds: 4,
      baths: 3,
      sqft: 2100,
      status: 'Coming Soon',
      compassUrl: 'https://www.compass.com/homedetails/261-Paragon-Mills-Rd-Nashville-TN-37211/PARA_pid/',
    }),
  )
  assert.equal(draft.headline, 'Coming Soon')
  assert.match(draft.summary, /^🏡 Coming Soon — 261 Paragon Mills Rd, Nashville\n/)
  assert.match(draft.summary, /4 bed · 3 bath · 2,100 sq ft · \$549,000/)
  assert.match(draft.summary, /Coming soon with Joshua Fink at Compass\./)
  assert.match(draft.summary, /#ComingSoon #NashvilleTN #JoshuaFinkGroup #Compass/)
  assert.doesNotMatch(draft.summary, /Just Listed/)
  assert.doesNotMatch(draft.summary, /Parks/)
  assert.equal(validateGbpLocalPost(draft).ok, true)
  // Not in lib/listings.ts, so there is no on-site detail page yet.
  assert.match(draft.cta.url, /^https:\/\/www\.compass\.com\/homedetails\/261-Paragon-Mills-Rd/)
  assert.match(draft.cta.url, /utm_campaign=gbp-just-listed/)
})

test('launch baseline is the seven homes already on the site, and not Paragon Mills', () => {
  assert.equal(GBP_JUST_LISTED_BASELINE_ADDRESSES.length, 7)
  for (const address of GBP_JUST_LISTED_BASELINE_ADDRESSES) {
    assert.equal(GBP_JUST_LISTED_BASELINE_REF_KEYS.has(listingRefKey(address)), true)
  }
  assert.equal(GBP_JUST_LISTED_BASELINE_REF_KEYS.has(listingRefKey('261 Paragon Mills Rd')), false)
  assert.equal(GBP_JUST_LISTED_BASELINE_REF_KEYS.has(listingRefKey('261 Paragon Mills')), false)
  for (const listing of listings) {
    if (!/paragon/i.test(listing.address)) continue
    assert.equal(
      GBP_JUST_LISTED_BASELINE_REF_KEYS.has(listingRefKey(listing.address)),
      false,
      `${listing.address} must not be in the launch baseline`,
    )
  }
})

test('auto plan skips the baseline and under-contract homes, and keeps a new Coming Soon', () => {
  const source: Listing[] = [
    ...GBP_JUST_LISTED_BASELINE_ADDRESSES.map((address, i) =>
      fixture({
        address,
        city: 'Nashville, TN 37211',
        status: i === 0 ? 'Active Under Contract' : 'Active',
      }),
    ),
    fixture({
      address: '999 Pending Rd',
      city: 'Franklin, TN 37064',
      status: 'Active Under Contract',
    }),
    fixture({
      address: '261 Paragon Mills Rd',
      city: 'Nashville, TN 37211',
      status: 'Coming Soon',
    }),
  ]
  const plan = planJustListedPosts(source)
  assert.deepEqual(
    plan.eligible.map((draft) => draft.refKey),
    ['261-paragon-mills-rd'],
  )
  assert.equal(plan.eligible[0]?.headline, 'Coming Soon')
  assert.equal(plan.baselined.some((draft) => draft.refKey === '511-wanda-dr'), false)
  assert.ok(plan.baselined.some((draft) => draft.refKey === '4127-edwards-ave'))
})

test('launch homes still in inventory are not eligible for an automatic post', () => {
  for (const address of GBP_JUST_LISTED_BASELINE_ADDRESSES) {
    const live = listings.find((listing) => listing.address === address)
    if (!live || !isGbpAnnounceable(live.status)) continue
    const plan = planJustListedPosts([live])
    assert.deepEqual(plan.eligible, [])
    assert.equal(plan.baselined.length, 1)
    assert.equal(plan.baselined[0]?.refKey, listingRefKey(address))
  }
})

test('announceable statuses match the site for Active and under contract, and include Coming Soon', () => {
  for (const status of ['Active', 'Active Under Contract', 'Pending', 'Sold', 'Coming Soon']) {
    if (status === 'Coming Soon') {
      assert.equal(isGbpAnnounceable(status), true)
      assert.equal(isAvailable(status), true)
    } else {
      assert.equal(isGbpAnnounceable(status), isAvailable(status), status)
    }
  }
  assert.equal(isGbpAnnounceable('coming soon'), true)
  assert.equal(isGbpAnnounceable('Open House Sunday'), true)
  assert.equal(isAvailable('Open House Sunday'), true)
})

test('quota constants match the workflow cap and spacing', () => {
  assert.equal(JUST_LISTED_PER_RUN, 3)
  assert.equal(JUST_LISTED_GAP_MS, 65_000)
  const workflow = readFileSync(join(repoRoot, '.github/workflows/gbp-just-listed.yml'), 'utf8')
  assert.match(workflow, /"\$posted" -lt 3/)
  assert.match(workflow, /sleep 65/)
  assert.match(workflow, /kind=new-listings/)
  assert.match(workflow, /preview=1/)
  assert.match(workflow, /PUSHOVER_TOKEN/)
  assert.doesNotMatch(workflow, /kind=market/)

  const weekly = readFileSync(join(repoRoot, '.github/workflows/social-autopost.yml'), 'utf8')
  assert.match(weekly, /0 14 \* \* 2/)
  assert.match(weekly, /ENDPOINT="gbp-post"/)
  assert.doesNotMatch(weekly, /new-listings/)
  assert.doesNotMatch(weekly, /gbp-just-listed/)
})

test('the weekly route still logs gbp-post and keeps new listings on their own job', () => {
  const route = readFileSync(join(repoRoot, 'app/api/cron/gbp-post/route.ts'), 'utf8')
  assert.match(route, /return buildListingPost\(\)/)
  assert.match(route, /Featured Listing/)
  assert.match(route, /kind === 'new-listings'/)
  assert.match(route, /GBP_JUST_LISTED_JOB/)
  assert.match(route, /: 'gbp-post'/)
})
