import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Listing } from './listings.ts'
import { listings } from './listings.ts'
import { similarListings, suggestedPriceBand } from './similar-listings.ts'

function home(partial: Partial<Listing> & Pick<Listing, 'address' | 'city' | 'price' | 'status'>): Listing {
  return {
    compassUrl: `https://www.compass.com/homedetails/${partial.address.replace(/\s+/g, '-')}/`,
    ...partial,
  }
}

test('similar homes share a city or a price band and never include the home itself', () => {
  const subject = home({
    address: '10 Oak St',
    city: 'Nashville, TN 37210',
    price: 400000,
    status: 'Active',
  })
  const sameCity = home({
    address: '20 Pine St',
    city: 'Nashville, TN 37216 | MLS #1',
    price: 250000,
    status: 'Active',
  })
  const sameBand = home({
    address: '30 Elm St',
    city: 'Franklin, TN 37069',
    price: 420000,
    status: 'Active Under Contract',
  })
  const neither = home({
    address: '40 Far St',
    city: 'Columbia, TN 38401',
    price: 900000,
    status: 'Active',
  })
  const found = similarListings(subject, [subject, sameCity, sameBand, neither])
  assert.deepEqual(found.map((l) => l.address), ['20 Pine St', '30 Elm St'])
})

test('active homes in the same city sort ahead of a closer under-contract price', () => {
  const subject = home({
    address: '10 Oak St',
    city: 'Nashville, TN 37210',
    price: 400000,
    status: 'Active',
  })
  const under = home({
    address: '11 Oak St',
    city: 'Nashville, TN 37210',
    price: 401000,
    status: 'Active Under Contract',
  })
  const active = home({
    address: '12 Oak St',
    city: 'Nashville, TN 37210',
    price: 360000,
    status: 'Active',
  })
  const found = similarListings(subject, [subject, under, active], 1)
  assert.equal(found[0].address, '12 Oak St')
})

test('the price band is the wider of 15 percent and $50,000', () => {
  assert.deepEqual(suggestedPriceBand(200000), { min: 150000, max: 250000 })
  const wide = suggestedPriceBand(1_000_000)
  assert.equal(wide.min, 850000)
  assert.equal(wide.max, 1_150_000)
})

test('live inventory similar homes stay inside lib/listings.ts and exclude the subject', () => {
  const subject = listings.find((l) => l.status === 'Active')
  assert.ok(subject)
  const found = similarListings(subject, listings)
  assert.ok(found.length > 0)
  assert.equal(found.some((l) => l.compassUrl === subject.compassUrl), false)
  for (const other of found) {
    assert.ok(listings.some((l) => l.compassUrl === other.compassUrl))
  }
})
