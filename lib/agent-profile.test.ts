import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AGENT_SAME_AS, siteJsonLdGraph } from './agent-profile.ts'
import { OFFICE_ADDRESS, OFFICE_STREET } from './office.ts'

test('site-wide RealEstateAgent JSON-LD names Joshua Fink and the group brand', () => {
  const graph = siteJsonLdGraph()
  const json = JSON.stringify(graph)
  const parsed = JSON.parse(json) as {
    '@context': string
    '@graph': Array<Record<string, unknown>>
  }

  assert.equal(parsed['@context'], 'https://schema.org')
  assert.doesNotMatch(json, /Parks/)
  assert.match(json, /Compass Real Estate/)

  const agent = parsed['@graph'].find((node) => node['@type'] === 'RealEstateAgent')
  assert.ok(agent)
  assert.equal(agent['@id'], 'https://www.joshuafink.com/#agent')
  assert.equal(agent.name, 'Joshua Fink')
  assert.equal(agent.alternateName, 'Joshua Fink Group')
  assert.equal((agent.brand as { name: string }).name, 'Joshua Fink Group')
  assert.equal(agent.telephone, '+1-615-551-2727')
  assert.equal(agent.url, 'https://www.joshuafink.com')

  const address = agent.address as {
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
  }
  assert.equal(address.streetAddress, OFFICE_STREET)
  assert.equal(
    `${address.streetAddress}, ${address.addressLocality}, ${address.addressRegion} ${address.postalCode}`,
    OFFICE_ADDRESS,
  )

  const parent = agent.parentOrganization as { name: string; url: string }
  assert.equal(parent.name, 'Compass Real Estate')
  assert.equal(parent.url, 'https://www.compass.com')

  const identifier = agent.identifier as { propertyID: string; value: string }
  assert.equal(identifier.propertyID, 'TREC')
  assert.equal(identifier.value, '351484')

  const areas = (agent.areaServed as Array<{ name: string }>).map((area) => area.name)
  for (const name of ['Franklin, TN', 'Brentwood, TN', 'Nashville, TN', 'Middle Tennessee']) {
    assert.ok(areas.includes(name), name)
  }

  const sameAs = agent.sameAs as string[]
  assert.deepEqual(sameAs, [...AGENT_SAME_AS])
  for (const url of sameAs) {
    assert.match(url, /^https:\/\//)
  }
  assert.ok(sameAs.includes('https://www.compass.com/agents/joshua-fink/'))
  assert.ok(sameAs.includes('https://www.zillow.com/profile/JoshuaFinkGroup'))
  assert.ok(sameAs.includes('https://www.fastexpert.com/agents/joshua-fink-143374/'))
  assert.ok(sameAs.includes('https://www.homelight.com/agents/joshua-fink-nv-hl9585247'))
  assert.ok(sameAs.includes('https://www.youtube.com/channel/UCc6j1NWgJeb00pT5xsenz3g'))

  const person = parsed['@graph'].find((node) => node['@type'] === 'Person')
  assert.ok(person)
  const credential = (person.hasCredential as Array<{ identifier: string }>)[0]
  assert.equal(credential.identifier, '351484')
})
