import { getSuburb } from './suburbs'

/**
 * Per-city cash-offer landing content for /cash-offer/[city].
 *
 * Base facts (name, county, ZIP, median price) are sourced from lib/suburbs.ts so
 * there's a single source of truth — this file only holds the cash-offer-specific
 * prose (local angle + city-flavored FAQs) that makes each page unique for SEO
 * and avoids thin/duplicate content across the 14 markets.
 *
 * Shared sections (situations, how-it-works, comparison table, the licensed-broker
 * disclosure) live in the page template, not here — only what varies by city does.
 */

export type CashOfferCityContent = {
  /** Matches the suburb slug so /cash-offer/<slug> mirrors /sell/<slug>. */
  slug: string
  /** Local neighborhoods/landmarks referenced for natural local-keyword coverage. */
  areas: string
  /** 2–3 sentence city-specific cash-offer intro (renders under the hero copy). */
  intro: string
  /** Who sells for cash here + why — distinct local framing. */
  localAngle: string
  /** 3 city-specific cash-offer FAQs (in addition to the shared global FAQ set). */
  faqs: { q: string; a: string }[]
}

const cityContent: Record<string, CashOfferCityContent> = {
  'franklin-tn': {
    slug: 'franklin-tn',
    areas: 'Cool Springs, Westhaven, Fieldstone Farms, Ladd Park, and historic downtown Franklin',
    intro:
      "Not every Franklin home is ready for a Williamson County showing. If yours needs work, is tied up in an estate, or you simply can't wait out a 21-day listing cycle, a cash sale skips the prep, the repairs, and the showings entirely.",
    localAngle:
      "Franklin's median sits around $650,000, which means even an as-is or dated home carries real equity — and a fair cash offer lets you capture it without sinking $20K into renovations to compete with the move-in-ready inventory in Cool Springs and Westhaven. Joshua prices off real Williamson County comps, not a national algorithm, so the number reflects what your home actually is.",
    faqs: [
      {
        q: 'Can I get a cash offer on a Franklin home that needs major repairs?',
        a: "Yes. Franklin buyers expect pristine, updated homes — so an older or distressed property can be hard to sell traditionally without significant investment. A cash offer is built for exactly that situation: Joshua buys as-is, you skip the renovation spend, and you still capture the equity a $650K-median market provides.",
      },
      {
        q: 'How fast can I sell my house for cash in Franklin, TN?',
        a: "As fast as 7 days. Because there's no lender, no appraisal contingency, and no inspection-repair negotiation, a Franklin cash closing avoids the three things that stall traditional Williamson County sales. A local title attorney clears title and coordinates closing — typically within the same week once you accept.",
      },
      {
        q: 'Will a cash offer be lower than listing my Franklin home with an agent?',
        a: "Usually, yes — a cash offer typically runs 70–85% of after-repair value. The trade is speed and certainty for top retail dollar. For a turnkey Franklin home with time to wait, listing traditionally nets more, and Joshua will tell you so honestly. For a dated, inherited, or time-sensitive property, the cash route often nets more after you subtract repairs, carrying costs, and months of uncertainty.",
      },
    ],
  },
  'brentwood-tn': {
    slug: 'brentwood-tn',
    areas: 'Governors Club, Annandale, Otter Creek, Brentwood Hills, and the Murray Lane corridor',
    intro:
      "Brentwood's luxury buyers expect flawless presentation. If your home is dated, tenant-occupied, caught in an estate, or you just need to move without staging a $900K listing, a cash sale removes the prep, the showings, and the months of carrying costs.",
    localAngle:
      "At a ~$900,000 median, Brentwood homes carry significant equity even in as-is condition — but selling traditionally at this tier means staging, professional photography, and buyers who walk over deferred maintenance. A cash offer lets you convert that equity now, on your timeline, without spending into a high-expectation market.",
    faqs: [
      {
        q: 'Do you buy higher-value Brentwood homes for cash?',
        a: "Yes. Brentwood's price point ($900K median, with Governors Club and Murray Lane estates well above) is squarely in range. Whether it's a luxury home that needs updating, an inherited estate, or a property you need to move quickly without a months-long luxury listing campaign, Joshua makes fair, no-obligation cash offers priced off real Brentwood comps.",
      },
      {
        q: 'I inherited a Brentwood home in probate — can I still sell it for cash?',
        a: "Yes. Probate and estate sales are one of the most common cash situations in Brentwood, where long-held family homes often need updating. Joshua and the closing attorney handle the probate coordination, title clearing, and any liens — you don't need to renovate or even clean it out beyond what you want to keep.",
      },
      {
        q: 'How is a cash offer different from an iBuyer in Brentwood?',
        a: "iBuyers like Opendoor often won't touch Brentwood's higher-value or non-cookie-cutter homes, and they charge 5–14% in service fees. Joshua is a local Tennessee broker pricing off actual Brentwood comps — no national algorithm, no service fee, and he'll buy homes with repairs, occupancy, or title issues that iBuyers decline.",
      },
    ],
  },
  'spring-hill-tn': {
    slug: 'spring-hill-tn',
    areas: 'Bridgemore Village, Kedron Village, Autumn Ridge, Tollgate Village, and the Maury County side',
    intro:
      "Spring Hill straddles Williamson and Maury counties and moves fast — but if your home needs work, you're relocating for a GM or plant job, or you're behind on payments, a cash sale lets you skip the repairs and showings and close on your schedule.",
    localAngle:
      "With a ~$450,000 median, Spring Hill is a value market where many sellers are relocating for work or upsizing quickly. A cash offer is ideal when timing matters more than squeezing the last dollar — Joshua buys as-is across both the Williamson and Maury sides and prices off true local comps.",
    faqs: [
      {
        q: 'I got relocated for work — can you close fast on my Spring Hill home?',
        a: "Yes. Job relocation is one of the most common cash-sale reasons in Spring Hill given the GM Spring Hill plant and broader Middle TN employment base. Joshua can close in as little as 7 days so you're not carrying two mortgages or rushing a traditional listing from out of state.",
      },
      {
        q: 'Does it matter whether my Spring Hill home is in Williamson or Maury County?',
        a: "No — Joshua buys on both sides of the county line. The line affects taxes and school zoning, and he'll factor the correct county comps into your offer, but it doesn't change your ability to get a fast, as-is cash offer.",
      },
      {
        q: 'Can I sell my Spring Hill house as-is without making repairs?',
        a: "Yes. You make zero repairs, do zero cleaning, and host zero showings. Spring Hill's newer-construction inventory sets a high bar for traditional buyers, so an older or worn home often sells far more easily — and nets comparably after repair costs — through a cash offer.",
      },
    ],
  },
  'nolensville-tn': {
    slug: 'nolensville-tn',
    areas: 'Bent Creek, Scales Farmstead, Benington, Winterset Woods, and historic downtown Nolensville',
    intro:
      "Nolensville's newer subdivisions set a high bar for condition. If your home is older, on acreage that needs clearing, or tied to an estate or divorce, a cash offer lets you sell as-is without competing against the move-in-ready inventory in Bent Creek and Scales Farmstead.",
    localAngle:
      "At a ~$580,000 median in fast-growing Williamson County, Nolensville homes hold strong equity — but much of the market is new construction, so an older or distressed property can struggle traditionally. A cash sale converts your equity now, with no prep and no showings.",
    faqs: [
      {
        q: 'Can I sell an older Nolensville home for cash against all the new construction?',
        a: "Yes — that's exactly when cash makes sense. Nolensville buyers gravitate to new builds in Bent Creek and Benington, which can leave an older home sitting if listed as-is. Joshua makes a fair cash offer on the home as it stands, so you don't have to renovate to compete.",
      },
      {
        q: 'I have acreage in Nolensville — do you buy land and homes that need clearing?',
        a: "Yes. Nolensville still has rural and acreage tracts, and Joshua buys homes on land, including properties with outbuildings, deferred maintenance, or overgrowth. You leave what you don't want — the cleanup is handled after closing.",
      },
      {
        q: 'How fast can a Nolensville cash sale close?',
        a: "As little as 7 days, or on your timeline. With no lender, appraisal, or inspection-repair back-and-forth, the only real step is the title attorney clearing title and scheduling closing — usually within the same week you accept.",
      },
    ],
  },
  'thompsons-station-tn': {
    slug: 'thompsons-station-tn',
    areas: 'Bridgewater, Tollgate, Laurelbrook, Southbrooke, and the rural acreage tracts',
    intro:
      "Thompson's Station mixes new subdivisions with rural acreage. Whether your home needs work, sits on land that's become hard to maintain, or you're settling an estate, a cash offer lets you sell as-is and close on your schedule.",
    localAngle:
      "With a ~$420,000 median and a lot of land in the mix, Thompson's Station sellers often value speed and simplicity — especially on acreage or older homes that don't fit the new-build demand. Joshua buys as-is and prices off real Williamson County comps.",
    faqs: [
      {
        q: 'Do you buy homes on acreage in Thompson’s Station?',
        a: "Yes. Thompson's Station has significant rural and large-lot inventory, and Joshua regularly buys homes on acreage — including properties with barns, outbuildings, or land that's gotten hard to maintain. The offer reflects the land and the home together.",
      },
      {
        q: 'My Thompson’s Station home needs a new roof and HVAC — can I still sell for cash?',
        a: "Yes. Major-system repairs are exactly what as-is cash offers are for. You don't replace the roof or HVAC; Joshua factors current condition into the offer, and you avoid spending tens of thousands to make the home listing-ready.",
      },
      {
        q: 'Is a cash offer worth it in a growing market like Thompson’s Station?',
        a: "It depends on your situation. If the home is turnkey and you can wait, listing traditionally in a ~$420K-and-rising market may net more. If it's dated, inherited, or you need to move now, the cash route often nets more after repairs, carrying costs, and time — and Joshua will walk you through both honestly.",
      },
    ],
  },
  'nashville-tn': {
    slug: 'nashville-tn',
    areas: 'East Nashville, Wedgewood-Houston, Madison, Antioch, Donelson, and the urban core',
    intro:
      "Nashville is the most varied market in Middle TN — and the most common place for cash situations: inherited homes, tired rentals, pre-foreclosure, and properties that need more work than a retail buyer will take on. A cash offer lets you sell any of them as-is, fast.",
    localAngle:
      "Across Davidson County, Nashville's ~$425,000 median spans everything from updated East Nashville bungalows to dated homes in Madison, Antioch, and Donelson that are hard to sell traditionally. Cash is the cleanest exit for landlords done with tenants, heirs settling an estate, or owners facing foreclosure — Joshua buys in any condition, anywhere in the metro.",
    faqs: [
      {
        q: 'I’m a landlord ready to sell my Nashville rental — can you buy it with tenants in place?',
        a: "Yes. Tenant-occupied Nashville rentals are one of the most common cash purchases — you don't have to evict, turn the unit, or wait for a lease to end. Joshua buys with tenants in place and handles the occupancy, so you exit the property and the landlord headaches at once.",
      },
      {
        q: 'Can you stop a foreclosure on my Nashville home?',
        a: "Often, yes — but timing is critical. If you're behind on payments or have a sale date approaching, a fast cash close can pay off the lender before foreclosure completes and protect your remaining equity and credit. Call Joshua as early as possible; the more time before the sale date, the more options exist, including a short sale if you're upside-down.",
      },
      {
        q: 'Do you buy homes in every part of Nashville?',
        a: "Yes — East Nashville, Madison, Antioch, Donelson, Bordeaux, Hermitage, and the urban core. Condition and neighborhood don't disqualify a home; Joshua makes as-is cash offers across all of Davidson County and the surrounding metro.",
      },
    ],
  },
  'murfreesboro-tn': {
    slug: 'murfreesboro-tn',
    areas: 'Oaklands, Blackman, Northfield, Ellendale, and downtown Murfreesboro',
    intro:
      "Murfreesboro is one of the fastest-growing cities in the state, but plenty of homes here need work, are caught in an estate, or belong to owners who need to move before MTSU's rental rush. A cash offer lets you sell as-is and close fast.",
    localAngle:
      "With a ~$380,000 median in Rutherford County, Murfreesboro is an affordability-driven market where speed often beats squeezing the last dollar. Joshua buys as-is — including tired student rentals near MTSU, inherited homes, and properties needing major repairs — and prices off real local comps.",
    faqs: [
      {
        q: 'Can you buy my MTSU-area rental property for cash?',
        a: "Yes. Worn student rentals near MTSU are a frequent cash purchase in Murfreesboro. Joshua buys with tenants in place and as-is, so you skip the turn, the repairs, and the leasing cycle, and exit the property cleanly between school years or any time.",
      },
      {
        q: 'How fast can I sell a Murfreesboro house for cash?',
        a: "As little as 7 days. Murfreesboro's growth means traditional listings still move, but a cash sale removes lender, appraisal, and inspection delays entirely — useful when you're relocating, settling an estate, or need certainty on a closing date.",
      },
      {
        q: 'Do you buy Murfreesboro homes that need major repairs?',
        a: "Yes — foundation issues, roof, HVAC, water or fire damage, code violations. Joshua buys completely as-is across Rutherford County, factors condition into the offer, and handles cleanup after closing. You spend nothing on repairs.",
      },
    ],
  },
  'gallatin-tn': {
    slug: 'gallatin-tn',
    areas: 'Station Camp, Lakeside, Sanders Ferry, Wynbrooke, and downtown Gallatin',
    intro:
      "Gallatin blends lakeside living with affordable Sumner County inventory. If your home needs work, is part of an estate, or you need to relocate quickly, a cash offer lets you sell as-is without the wait of a traditional listing.",
    localAngle:
      "At a ~$350,000 median, Gallatin is one of the more affordable Sumner County markets — which means even a dated or distressed home holds usable equity. A cash sale is the simplest path for heirs, downsizers, and owners who'd rather not invest in repairs before selling.",
    faqs: [
      {
        q: 'Can I sell an inherited Gallatin home for cash?',
        a: "Yes. Inherited and estate homes are among the most common cash sales in Gallatin, where long-held family properties often need updating. Joshua and the closing attorney handle probate coordination and title — you don't renovate, and you can leave behind whatever you don't want.",
      },
      {
        q: 'Do you buy lakefront or near-lake homes in Gallatin?',
        a: "Yes. Gallatin's Old Hickory Lake proximity (Sanders Ferry, Lakeside) is a plus, and Joshua buys near-lake and waterfront homes as-is. Condition doesn't disqualify the property — the offer reflects both location and current state.",
      },
      {
        q: 'Is a cash offer competitive in an affordable market like Gallatin?',
        a: "It can be very competitive for the right situation. In a ~$350K market, the repair-and-carry costs of getting a dated home listing-ready often eat much of the retail premium. For as-is, inherited, or time-sensitive sales, the cash net is frequently close to — or better than — a traditional sale, and Joshua will show you both.",
      },
    ],
  },
  'hendersonville-tn': {
    slug: 'hendersonville-tn',
    areas: 'Indian Lake, Sanders Ferry, Drakes Creek, Durham Farms, and Walton Ferry',
    intro:
      "Hendersonville's Old Hickory Lake setting draws steady demand, but lakeside and older homes often need work that retail buyers won't take on. A cash offer lets you sell as-is — no repairs, no showings, no waiting.",
    localAngle:
      "With a ~$410,000 median in Sumner County, Hendersonville sellers facing an estate, a divorce, or a relocation often value certainty over a drawn-out listing. Joshua buys as-is across the lake corridor and prices off real Hendersonville comps.",
    faqs: [
      {
        q: 'Do you buy older lakefront homes in Hendersonville that need work?',
        a: "Yes. Many of Hendersonville's Old Hickory Lake homes are older and need updating, which can stall a traditional listing. Joshua buys them as-is — including dock, seawall, and deferred-maintenance situations — and reflects both the lake value and condition in the offer.",
      },
      {
        q: 'I’m going through a divorce — can you close quickly and cleanly on our Hendersonville home?',
        a: "Yes. Divorce sales call for speed and neutrality, and a cash close avoids the prolonged showings and uncertainty of a listing. Joshua coordinates with both parties and the closing attorney so proceeds are divided cleanly per your agreement, often within a couple of weeks.",
      },
      {
        q: 'How fast can a Hendersonville cash sale close?',
        a: "As little as 7 days, or on your timeline. With no lender or appraisal, the title attorney clears title — including any liens or back taxes — and schedules closing, usually within the same week you accept the offer.",
      },
    ],
  },
  'columbia-tn': {
    slug: 'columbia-tn',
    areas: 'Downtown Columbia, Sunnyside, North Columbia, The Crossings, and Bear Creek',
    intro:
      "Columbia is Maury County's hub — historic, affordable, and growing with the Spring Hill spillover. If your home needs work, is tied to an estate, or you're behind on payments, a cash offer lets you sell as-is and close fast.",
    localAngle:
      "At a ~$340,000 median, Columbia is among the most affordable Middle TN markets, with many older and historic homes that need updating. A cash sale lets owners avoid the repair spend a traditional listing would demand — Joshua buys as-is across Maury County.",
    faqs: [
      {
        q: 'Do you buy historic or older homes in downtown Columbia?',
        a: "Yes. Columbia has a deep stock of historic and older homes that often need significant updating. Joshua buys them as-is — including properties with foundation, electrical, or roof issues — so you don't have to navigate costly restoration before selling.",
      },
      {
        q: 'I’m behind on my mortgage in Columbia — can a cash sale help?',
        a: "Often, yes. If you're behind or facing foreclosure, a fast cash close can pay off the lender and protect your remaining equity and credit. The earlier you reach out, the more options exist — including a short sale if you owe more than the home is worth. Joshua has negotiated these with most major Tennessee lenders.",
      },
      {
        q: 'How does Columbia’s growth affect my cash offer?',
        a: "Columbia's Spring Hill spillover is lifting values, which is good news for your equity. The offer is priced off current Maury County comps, so you benefit from recent appreciation — while still skipping the repairs, showings, and wait of a traditional sale.",
      },
    ],
  },
  'mount-juliet-tn': {
    slug: 'mount-juliet-tn',
    areas: 'Providence, Nichols Vale, Willoughby Station, Del Webb Lake Providence, and Wright Farms',
    intro:
      "Mount Juliet is one of Wilson County's hottest markets, but newer subdivisions set a high bar for condition. If your home is older, an inherited property, or you need to relocate fast, a cash offer lets you sell as-is without competing against new construction.",
    localAngle:
      "With a ~$480,000 median, Mount Juliet homes hold strong equity — but the market favors move-in-ready inventory in Providence and Willoughby Station. A cash sale converts your equity now, with no repairs and no showings, on whatever timeline you need.",
    faqs: [
      {
        q: 'Can I sell an older Mount Juliet home for cash against the newer subdivisions?',
        a: "Yes — that's a classic cash scenario here. Mount Juliet buyers favor newer homes in Providence and Nichols Vale, which can leave an older property sitting if listed as-is. Joshua makes a fair cash offer on the home as it stands, so you don't renovate to compete.",
      },
      {
        q: 'Do you buy 55+ / Del Webb homes in Mount Juliet?',
        a: "Yes. Del Webb Lake Providence and similar 55+ homes are frequent cash sales, often tied to downsizing, health moves, or estates. Joshua buys as-is and can build a flexible timeline — including a rent-back if you need time to transition.",
      },
      {
        q: 'How fast can a Mount Juliet cash sale close?',
        a: "As little as 7 days. No lender, appraisal, or inspection-repair negotiation — the title attorney clears title and schedules closing, typically within the same week you accept. Need more time? Joshua builds the timeline around you.",
      },
    ],
  },
  'lebanon-tn': {
    slug: 'lebanon-tn',
    areas: 'Spence Creek, Hunters Point, Kensington, the Five Oaks area, and downtown Lebanon',
    intro:
      "Lebanon offers affordable Wilson County living with room to grow. If your home needs work, sits on acreage that's hard to maintain, or you're settling an estate, a cash offer lets you sell as-is and close on your schedule.",
    localAngle:
      "At a ~$380,000 median, Lebanon mixes subdivisions with rural acreage, and many sellers value a simple, certain exit over a drawn-out listing. Joshua buys as-is — including homes on land and properties needing major repairs — and prices off real Wilson County comps.",
    faqs: [
      {
        q: 'Do you buy homes on acreage or farmland near Lebanon?',
        a: "Yes. Lebanon and the surrounding Wilson County area still have rural tracts and farmland, and Joshua buys homes on acreage as-is — including outbuildings, barns, and land that's become hard to maintain. The offer reflects the home and the land together.",
      },
      {
        q: 'Can I sell a Lebanon house that needs major repairs for cash?',
        a: "Yes. Roof, HVAC, foundation, water damage, code violations — Joshua buys completely as-is across Wilson County. You spend nothing on repairs; condition is factored into the offer and the cleanup is handled after closing.",
      },
      {
        q: 'How fast can I get a cash offer on my Lebanon home?',
        a: "Within 24 hours of telling Joshua about the property, with a close in as little as 7 days. There's no lender or appraisal to wait on — just the title attorney clearing title and scheduling closing on your timeline.",
      },
    ],
  },
  'smyrna-tn': {
    slug: 'smyrna-tn',
    areas: 'Stewarts Creek, Lee Crossing, Woodmont, Autumn Ridge, and downtown Smyrna',
    intro:
      "Smyrna's affordability and Nissan-anchored job base keep it moving, but plenty of homes here need work or belong to owners relocating fast. A cash offer lets you sell as-is — no repairs, no showings, no waiting on a buyer's loan.",
    localAngle:
      "With a ~$370,000 median in Rutherford County, Smyrna is a value market where relocation and speed often drive sales. Joshua buys as-is — including homes near the Nissan plant tied to job moves, inherited properties, and homes needing major repairs — and prices off real local comps.",
    faqs: [
      {
        q: 'I’m relocating for a job at Nissan — can you close fast on my Smyrna home?',
        a: "Yes. Job relocation tied to the Nissan plant and broader Rutherford County employment is a common reason Smyrna owners sell for cash. Joshua can close in as little as 7 days so you're not carrying the home or rushing a traditional listing from out of state.",
      },
      {
        q: 'Can I sell my Smyrna house as-is without repairs or showings?',
        a: "Yes. Zero repairs, zero cleaning, zero showings. Joshua buys completely as-is across Smyrna, so a worn or dated home that would struggle on the open market sells just as easily — and often nets comparably after you account for repair costs.",
      },
      {
        q: 'How does a cash offer compare to listing my Smyrna home traditionally?',
        a: "A cash offer typically runs 70–85% of after-repair value — you trade some retail price for speed and certainty. For a turnkey Smyrna home with time to wait, listing may net more. For a dated, inherited, or time-sensitive property, the cash route often nets more after repairs and carrying costs. Joshua will lay out both paths.",
      },
    ],
  },
  'la-vergne-tn': {
    slug: 'la-vergne-tn',
    areas: 'Lake Forest, Woodland Hills, the Stones River Road area, Amsterdam, and central La Vergne',
    intro:
      "La Vergne is one of the most affordable doorways into Rutherford County, popular with commuters and investors. If your home needs work, is a tired rental, or you need to move quickly, a cash offer lets you sell as-is and close fast.",
    localAngle:
      "At a ~$330,000 median — the most affordable in this group — La Vergne sees a lot of rental and commuter inventory where speed beats squeezing the last dollar. Joshua buys as-is, including tenant-occupied homes and properties needing major repairs, priced off real Rutherford County comps.",
    faqs: [
      {
        q: 'Can you buy my La Vergne rental property with tenants in place?',
        a: "Yes. La Vergne has a lot of investor-owned and tenant-occupied homes, and Joshua buys them with tenants in place — no eviction, no turn, no waiting for a lease to end. You exit the property and the landlord responsibilities in one closing.",
      },
      {
        q: 'How fast can I sell my La Vergne house for cash?',
        a: "As little as 7 days. With no lender, appraisal, or inspection-repair negotiation, a La Vergne cash sale skips the delays that stall traditional closings — the title attorney clears title and schedules closing, usually within the same week you accept.",
      },
      {
        q: 'Do you buy La Vergne homes that need major repairs?',
        a: "Yes — completely as-is. Roof, HVAC, foundation, water or fire damage, code violations. Joshua factors condition into the offer and handles cleanup after closing, so you spend nothing getting the home ready and skip the showings entirely.",
      },
    ],
  },
}

export type CashOfferCity = CashOfferCityContent & {
  name: string
  displayName: string
  county: string
  schemaCity: string
  schemaState: string
  schemaZip: string
  medianPrice: string
  medianPriceNum: number
}

/** Merge cash-offer prose with the suburb base facts. Returns undefined if either is missing. */
export function getCashOfferCity(slug: string): CashOfferCity | undefined {
  const content = cityContent[slug]
  const suburb = getSuburb(slug)
  if (!content || !suburb) return undefined
  return {
    ...content,
    name: suburb.name,
    displayName: suburb.displayName,
    county: suburb.county,
    schemaCity: suburb.schemaCity,
    schemaState: suburb.schemaState,
    schemaZip: suburb.schemaZip,
    medianPrice: suburb.medianPrice,
    medianPriceNum: suburb.medianPriceNum,
  }
}

export function getAllCashOfferCitySlugs(): string[] {
  return Object.keys(cityContent)
}

/** Lightweight list for nav/grid linking (slug + display name), in declared order. */
export function getCashOfferCityLinks(): Array<{ slug: string; name: string }> {
  return Object.keys(cityContent)
    .map((slug) => {
      const s = getSuburb(slug)
      return s ? { slug, name: s.name } : null
    })
    .filter((x): x is { slug: string; name: string } => x !== null)
}
