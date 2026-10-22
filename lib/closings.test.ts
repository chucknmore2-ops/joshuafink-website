import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { closings } from './closings-data.ts'
import {
  SOLD_CANONICAL,
  SOLD_PATH,
  buildSoldClosingsSchema,
  closingCityAnchor,
  closingCountLabel,
  closingDateSpan,
  closingGroups,
  closingGroupsForSuburb,
  closingSideCounts,
  closingsLastModified,
  formatBaths,
  formatCloseMonthYear,
  formatSoldPrice,
  formatSqft,
  soldFilterCss,
  soldPageDescription,
} from './closings.ts'
import { getAllSuburbSlugs } from './suburbs.ts'
import { getSiteUrlCatalog } from './site-urls.ts'

const CITY_COUNTS: Record<string, number> = {
  Columbia: 84,
  Nashville: 49,
  Brentwood: 20,
  Clarksville: 9,
  Franklin: 9,
  'La Vergne': 8,
  Madison: 8,
  Antioch: 7,
  Smyrna: 4,
  'Old Hickory': 4,
  Hendersonville: 3,
  Gallatin: 3,
  'Mount Pleasant': 3,
  'Spring Hill': 3,
  Hermitage: 2,
  Murfreesboro: 2,
  Arrington: 1,
  McMinnville: 1,
  Portland: 1,
  'College Grove': 1,
  'Thompsons Station': 1,
  Chattanooga: 1,
  Hohenwald: 1,
  Shelbyville: 1,
  Lebanon: 1,
  Springfield: 1,
  Nolensville: 1,
  Goodlettsville: 1,
}

const CITY_SOLD_PRICE_SUMS: Record<string, number> = {
  Columbia: 20867344,
  Nashville: 21136822,
  Brentwood: 38012160,
  Clarksville: 2190000,
  Franklin: 7760300,
  'La Vergne': 2453200,
  Madison: 2466800,
  Antioch: 2539000,
  'Old Hickory': 1228300,
  Smyrna: 1772900,
  Gallatin: 1299990,
  Hendersonville: 1469900,
  'Mount Pleasant': 608800,
  'Spring Hill': 1280000,
  Hermitage: 695000,
  Murfreesboro: 722000,
  Arrington: 725000,
  Chattanooga: 43000,
  'College Grove': 1401326,
  Goodlettsville: 330000,
  Hohenwald: 280000,
  Lebanon: 310000,
  McMinnville: 225000,
  Nolensville: 599900,
  Portland: 550000,
  Shelbyville: 195000,
  Springfield: 625000,
  'Thompsons Station': 365000,
}

const BUY_PAGE_CITIES: Record<string, string> = {
  'franklin-tn': 'franklin',
  'brentwood-tn': 'brentwood',
  'nashville-tn': 'nashville',
  'columbia-tn': 'columbia',
  'smyrna-tn': 'smyrna',
  'la-vergne-tn': 'la-vergne',
  'hendersonville-tn': 'hendersonville',
  'gallatin-tn': 'gallatin',
  'spring-hill-tn': 'spring-hill',
  'murfreesboro-tn': 'murfreesboro',
  'thompsons-station-tn': 'thompsons-station',
  'lebanon-tn': 'lebanon',
  'nolensville-tn': 'nolensville',
}

test('closings are the 30 buy-side and 200 list-side Tennessee sales', () => {
  assert.equal(closings.length, 230)
  const sides = closingSideCounts()
  assert.equal(sides['Represented buyer'], 30)
  assert.equal(sides['Listed and sold'], 200)
  assert.equal(
    closings.every((row) => row.state === 'TN' && row.status === 'Closed'),
    true,
  )
  assert.deepEqual(Object.keys(closings[0]).sort(), [
    'address',
    'baths',
    'beds',
    'city',
    'closeDate',
    'side',
    'soldPrice',
    'sqft',
    'state',
    'status',
    'zip',
  ])
})

test('city counts and sold-price sums are the exact MLS totals', () => {
  const counts = new Map<string, number>()
  const sums = new Map<string, number>()
  for (const row of closings) {
    counts.set(row.city, (counts.get(row.city) ?? 0) + 1)
    sums.set(row.city, (sums.get(row.city) ?? 0) + row.soldPrice)
  }
  assert.equal(counts.size, Object.keys(CITY_COUNTS).length)
  for (const [city, count] of Object.entries(CITY_COUNTS)) {
    assert.equal(counts.get(city), count, city)
    assert.equal(sums.get(city), CITY_SOLD_PRICE_SUMS[city], city)
  }
  assert.equal(
    closings.reduce((sum, row) => sum + row.soldPrice, 0),
    112151742,
  )
  assert.equal(
    Object.values(CITY_COUNTS).reduce((sum, count) => sum + count, 0),
    230,
  )
})

test('known MLS rows are stored without renaming the address or rounding baths', () => {
  const fordham = closings.find((row) => row.address === '9293 Fordham Dr Lot 54')
  assert.deepEqual(
    fordham && {
      city: fordham.city,
      closeDate: fordham.closeDate,
      soldPrice: fordham.soldPrice,
      beds: fordham.beds,
      baths: fordham.baths,
      sqft: fordham.sqft,
      side: fordham.side,
    },
    {
      city: 'Brentwood',
      closeDate: '2023-06-30',
      soldPrice: 5650000,
      beds: 6,
      baths: 7.5,
      sqft: 9812,
      side: 'Represented buyer',
    },
  )

  const secondAve = closings.find((row) => row.address === '314 2nd Ave')
  assert.deepEqual(
    secondAve && {
      city: secondAve.city,
      closeDate: secondAve.closeDate,
      soldPrice: secondAve.soldPrice,
      beds: secondAve.beds,
      baths: secondAve.baths,
      sqft: secondAve.sqft,
      side: secondAve.side,
    },
    {
      city: 'Columbia',
      closeDate: '2019-12-26',
      soldPrice: 178000,
      beds: 3,
      baths: 2,
      sqft: 1225,
      side: 'Listed and sold',
    },
  )

  const linnCove = closings.find((row) => row.address === '1113 Linn Cove Court Lot 28')
  assert.equal(linnCove?.side, 'Represented buyer')
  assert.equal(linnCove?.baths, 3.5)
  assert.equal(linnCove?.soldPrice, 529990)
})

test('the same address on two dates stays two closings', () => {
  const stillbrook = closings.filter((row) => row.address === '9499 Stillbrook Trce')
  assert.equal(stillbrook.length, 2)
  assert.deepEqual(
    stillbrook.map((row) => [row.side, row.closeDate, row.soldPrice]).sort(),
    [
      ['Listed and sold', '2023-03-20', 1599000],
      ['Represented buyer', '2021-11-09', 1340000],
    ].sort(),
  )
})

test('groups are by city, newest first, with stable anchors', () => {
  const groups = closingGroups()
  assert.equal(groups.length, 28)
  assert.equal(
    groups.reduce((sum, group) => sum + group.closings.length, 0),
    closings.length,
  )

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    assert.equal(group.anchor, closingCityAnchor(group.city))
    assert.equal(group.closings.length, CITY_COUNTS[group.city])
    for (let j = 1; j < group.closings.length; j++) {
      assert.ok(group.closings[j - 1].closeDate >= group.closings[j].closeDate)
    }
    if (i > 0) {
      assert.ok(groups[i - 1].closings[0].closeDate >= group.closings[0].closeDate)
    }
  }

  assert.equal(closingCityAnchor('La Vergne'), 'la-vergne')
  assert.equal(closingCityAnchor("Thompson's Station"), 'thompsons-station')
  assert.equal(closingCityAnchor('Thompsons Station'), 'thompsons-station')
  assert.equal(groups[0].city, 'Goodlettsville')
  assert.equal(closingDateSpan().earliest, '2019-11-21')
  assert.equal(closingDateSpan().latest, '2026-09-30')
})

test('buy pages link only the city that matches, not a nearby MLS place name', () => {
  for (const slug of getAllSuburbSlugs()) {
    const groups = closingGroupsForSuburb(slug)
    if (slug in BUY_PAGE_CITIES) {
      assert.equal(groups.length, 1, slug)
      assert.equal(groups[0].anchor, BUY_PAGE_CITIES[slug], slug)
    } else {
      assert.equal(groups.length, 0, slug)
    }
  }
  const nashville = closingGroupsForSuburb('nashville-tn')
  assert.equal(nashville.some((group) => group.city === 'Madison'), false)
  assert.equal(nashville.some((group) => group.city === 'Antioch'), false)
})

test('labels and prices stay exact', () => {
  assert.equal(formatSoldPrice(5650000), '$5,650,000')
  assert.equal(formatSoldPrice(529990), '$529,990')
  assert.equal(formatSoldPrice(43000), '$43,000')
  assert.throws(() => formatSoldPrice(159900.5))
  assert.equal(formatBaths(7.5), '7.5')
  assert.equal(formatBaths(5), '5')
  assert.equal(formatBaths(3.5), '3.5')
  assert.throws(() => formatBaths(2.25))
  assert.equal(formatSqft(9812), '9,812')
  assert.throws(() => formatSqft(9812.4))
  assert.equal(formatCloseMonthYear('2019-11-21'), 'November 2019')
  assert.equal(formatCloseMonthYear('2026-09-30'), 'September 2026')
  assert.equal(formatCloseMonthYear('2019-11-21').includes('21'), false)
  assert.equal(closingCountLabel(1), '1 closing')
  assert.equal(closingCountLabel(84), '84 closings')
  assert.equal(
    soldPageDescription(),
    "230 closed Tennessee sales in Joshua Fink's MLS record, November 2019 through September 2026. 30 Represented buyer and 200 Listed and sold, grouped by city.",
  )
})

test('schema is a RealEstateAgent whose subject is an ItemList of every sale', () => {
  const schema = buildSoldClosingsSchema()
  assert.equal(schema['@type'], 'RealEstateAgent')
  assert.equal(schema['@id'], 'https://www.joshuafink.com/#agent')
  assert.equal(schema.name, 'Joshua Fink')
  assert.equal(schema.url, 'https://www.joshuafink.com')
  assert.equal('description' in schema, false)
  assert.equal('telephone' in schema, false)

  const list = schema.subjectOf
  assert.equal(list['@type'], 'ItemList')
  assert.equal(list.numberOfItems, 230)
  assert.equal(list.itemListElement.length, 230)

  const flat = closingGroups().flatMap((group) => group.closings)
  list.itemListElement.forEach((entry, index) => {
    assert.equal(entry.position, index + 1)
    assert.equal(entry.item['@type'], 'Offer')
    assert.equal(entry.item.price, flat[index].soldPrice)
    assert.equal(entry.item.priceCurrency, 'USD')
    assert.equal(entry.item.availability, 'https://schema.org/SoldOut')
    assert.equal(entry.item.itemOffered.address.addressCountry, 'US')
    assert.equal(entry.item.itemOffered.address.addressLocality, flat[index].city)
    assert.equal(entry.item.additionalProperty.value, flat[index].closeDate)
    assert.match(entry.item.description, /^Closed [A-Z][a-z]+ \d{4}\. /)
    assert.doesNotMatch(entry.item.description, /\d{4}-\d{2}-\d{2}/)
  })

  const json = JSON.stringify(schema)
  assert.doesNotMatch(json, /Parks/)
  assert.doesNotMatch(json, /clientName|sellerName|buyerName|ownerName/i)
})

test('sold filter css only hides non-targeted cities', () => {
  const css = soldFilterCss(['franklin', 'la-vergne'])
  assert.match(css, /#franklin:target/)
  assert.match(css, /#la-vergne:target/)
  assert.match(css, /\[data-city="franklin"\] #franklin\{display:block\}/)
  assert.doesNotMatch(css, /Parks/)
  assert.throws(() => soldFilterCss(['franklin tn']))
})

test('/sold is in the sitemap once, dated by the newest closing', () => {
  const matches = getSiteUrlCatalog().filter((entry) => entry.path === SOLD_PATH)
  assert.equal(matches.length, 1)
  assert.equal(matches[0].changeFrequency, 'monthly')
  assert.equal(matches[0].lastModified?.toISOString(), '2026-09-30T12:00:00.000Z')
  assert.equal(closingsLastModified().toISOString(), '2026-09-30T12:00:00.000Z')
  assert.equal(SOLD_CANONICAL, 'https://www.joshuafink.com/sold')
})

test('the sold page, about page, and buy pages point at the city anchors', () => {
  const sold = readFileSync(new URL('../app/sold/page.tsx', import.meta.url), 'utf8')
  const about = readFileSync(new URL('../app/about/page.tsx', import.meta.url), 'utf8')
  const buy = readFileSync(new URL('../app/buy/[suburb]/page.tsx', import.meta.url), 'utf8')
  const validator = readFileSync(new URL('../scripts/validate-schema.mjs', import.meta.url), 'utf8')

  assert.match(sold, /force-static/)
  assert.match(sold, /canonical: SOLD_CANONICAL/)
  assert.match(sold, /url: SOLD_CANONICAL/)
  assert.match(sold, /buildSoldClosingsSchema/)
  assert.match(sold, /SoldHashFilter/)
  assert.match(sold, /closings\.length/)
  assert.doesNotMatch(sold, /use client/)
  assert.doesNotMatch(sold, /useSearchParams|cookies\(|headers\(/)
  assert.doesNotMatch(sold, /Parks/)
  assert.doesNotMatch(sold, /toFixed|Math\.round/)

  assert.match(about, /See homes Josh has sold in \$\{group\.city\}/)
  assert.match(about, /\/sold#\$\{group\.anchor\}/)
  assert.doesNotMatch(about, /Parks/)

  assert.match(buy, /closingGroupsForSuburb/)
  assert.match(buy, /See homes Josh has sold in \$\{suburb\.name\} →/)
  assert.match(buy, /\/sold#\$\{group\.anchor\}/)
  assert.doesNotMatch(buy, /Parks/)

  assert.match(validator, /'\/sold'/)
})
