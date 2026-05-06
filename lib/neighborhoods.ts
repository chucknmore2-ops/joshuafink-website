export type Neighborhood = {
  slug: string
  name: string
  city: string
  citySlug: string
  county: string
  metaTitle: string
  metaDescription: string
  intro: string
  about: string
  vibe: string
  priceBand: string
  buildYears: string
  hoa: string
  schoolNotes: string
  amenities: string[]
  homeStyles: string[]
  whyBullets: string[]
  faqs: { q: string; a: string }[]
  schemaCity: string
  schemaState: string
  compassSearchUrl?: string
}

const COMPASS_AGENT_URL = 'https://www.compass.com/agents/joshua-fink/'

export const neighborhoods: Record<string, Neighborhood> = {
  'westhaven-franklin-tn': {
    slug: 'westhaven-franklin-tn',
    name: 'Westhaven',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'Westhaven Neighborhood Guide — Franklin, TN | Joshua Fink',
    metaDescription:
      'Everything you need to know about Westhaven in Franklin, TN: amenities, schools, home styles, HOA, and current price ranges. Local insight from Compass agent Joshua Fink.',
    intro:
      'Westhaven is the most recognizable master-planned community on the west side of Franklin, Tennessee — about 1,500 acres of traditional-neighborhood-design homes, walkable streets, a private golf course, and an actual town center with restaurants and shops. If you have driven McEwen Drive past Mack Hatcher, you have driven the edge of Westhaven.',
    about:
      'Westhaven was built on new-urbanism principles: front porches close to the sidewalk, alley-loaded garages, mixed housing types within the same blocks, and a true commercial center residents can walk to. Inside the community you will find single-family homes on small to medium lots, townhomes, and a smaller number of condos clustered near the town center. Architecture leans Southern traditional, low-country, and craftsman. The Westhaven Golf Club, multiple pools, miles of paved trails, a fitness center, and the Westhaven Town Center (with restaurants, a coffee shop, and small retail) anchor the lifestyle. It is the kind of neighborhood where families bike to dinner and kids walk to the pool on summer afternoons.',
    vibe: 'Walkable master-planned community with a real town center.',
    priceBand: '$650K – $2.5M+',
    buildYears: 'Early 2000s to present (still actively developing)',
    hoa: 'Active HOA with monthly dues; covers common areas, pools, trails, and town-center upkeep. Optional golf and social memberships available.',
    schoolNotes:
      'Westhaven is generally zoned to Williamson County Schools — Pearre Creek Elementary, Hillsboro Middle, and Independence High School being the most common assignments. School zones can change at the district level, so always confirm against the current Williamson County Schools zoning map for the specific address.',
    amenities: [
      'Westhaven Golf Club (private, members and resident play)',
      'Multiple resort-style pools and a lap pool',
      'Westhaven Town Center — restaurants, coffee, retail',
      'Paved walking and biking trails throughout',
      'Resident fitness center',
      'Tennis courts, pickleball, playgrounds, and parks',
    ],
    homeStyles: [
      'Southern traditional with deep front porches',
      'Low-country and coastal-influenced cottages',
      'Craftsman bungalows',
      'Larger custom homes on the golf course',
      'Townhomes near the town center',
    ],
    whyBullets: [
      'Lifestyle is the differentiator: Westhaven buyers are not just buying a house — they are buying walkability to dinner, a pool day for the kids, and a community calendar of events. That premium shows up in resale.',
      'Wide price range under one address: From $650K townhomes to $2M+ custom homes on the golf course, Westhaven works for first-move-up buyers and luxury buyers alike. Joshua can help you target the right pocket of the community.',
      'Resale strength: Westhaven consistently outperforms generic Franklin subdivisions on days-on-market because the brand is well-known to relocating buyers.',
    ],
    faqs: [
      {
        q: 'How much do homes in Westhaven cost in 2026?',
        a: 'Pricing in Westhaven runs roughly from the mid-$600s for townhomes and smaller cottages up past $2.5M for custom homes on premium lots or the golf course. Most single-family activity sits in the $900K–$1.5M range. For an exact read on a specific block, Joshua can pull recent closed comps within Westhaven.',
      },
      {
        q: 'Is Westhaven a gated community?',
        a: 'No. Westhaven is not gated — it is intentionally designed as an open, walkable community with public-feeling streets. The golf club and pools are private to residents and members.',
      },
      {
        q: 'What schools are zoned to Westhaven?',
        a: 'Most Westhaven addresses are zoned to Williamson County Schools — typically Pearre Creek Elementary, Hillsboro Middle, and Independence High School — but zoning can change. Always verify the current zoning for the specific address you are considering before writing an offer.',
      },
      {
        q: 'Does Westhaven have an HOA, and what does it cover?',
        a: 'Yes. The HOA covers common areas, the trail system, pools, town-center maintenance, and community events. Dues are paid monthly. Golf and social memberships at Westhaven Golf Club are separate and optional.',
      },
      {
        q: 'How is Westhaven different from other Franklin subdivisions?',
        a: 'The biggest difference is the town center and the new-urbanism layout. Most Franklin subdivisions are residential-only; Westhaven has restaurants, retail, and a daily-life walkable core inside the community itself. That changes how the neighborhood feels and how it appreciates.',
      },
    ],
    schemaCity: 'Franklin',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'governors-club-brentwood-tn': {
    slug: 'governors-club-brentwood-tn',
    name: 'Governors Club',
    city: 'Brentwood',
    citySlug: 'brentwood-tn',
    county: 'Williamson County',
    metaTitle: 'Governors Club Neighborhood Guide — Brentwood, TN | Joshua Fink',
    metaDescription:
      'Governors Club is the gated, Greg Norman-designed luxury golf community in Brentwood, TN. Real insight from Compass agent Joshua Fink — homes, club, schools, and price ranges.',
    intro:
      'Governors Club is the gated luxury golf community that anchors the south end of Brentwood — a Greg Norman-designed course, large estate lots, manned gate, and a country-club lifestyle in one of the most affluent zip codes in the South. If a buyer is searching for "Governors Club homes for sale," they already know what they want.',
    about:
      'Governors Club sits on rolling Williamson County terrain just south of downtown Brentwood, with a Brentwood mailing address and Williamson County Schools assignment. The community is built around a Greg Norman-designed championship golf course, a full-service clubhouse, tennis, pickleball, fitness, and resort-style amenities. Homes are predominantly large custom builds on lots ranging from one-third acre on the interior to multi-acre estate lots along the perimeter and the course. Architecture spans traditional Southern, French country, transitional contemporary, and a smaller number of modern custom builds. The buyer profile is heavily executive — physicians, business owners, music-industry executives, and corporate transferees relocating from larger metros.',
    vibe: 'Gated luxury golf community — country-club living at scale.',
    priceBand: '$1.5M – $5M+',
    buildYears: 'Mid-1990s to present',
    hoa: 'HOA dues plus separate club membership structure (golf, social, sports tiers available). Membership is not automatic with home purchase — confirm initiation and dues with the club directly.',
    schoolNotes:
      'Governors Club is zoned to Williamson County Schools — typically Crockett Elementary, Woodland Middle, and Ravenwood High School. WCS regularly tops state and regional rankings, and the zoning is a meaningful piece of the resale story here.',
    amenities: [
      'Greg Norman-designed 18-hole championship golf course',
      'Full-service clubhouse with dining',
      'Tennis, pickleball, and resort-style pool',
      'Fitness center',
      '24-hour gated and manned entry',
      'Active social calendar',
    ],
    homeStyles: [
      'Custom Southern traditional estates',
      'French country and provincial',
      'Transitional contemporary',
      'Selected modern custom builds on premium lots',
      'A small number of patio homes for low-maintenance luxury',
    ],
    whyBullets: [
      'Gated and quiet matters at this price point: At $2M+, buyers are paying for privacy and security as much as square footage. Governors Club is one of very few gated golf communities in the immediate Nashville area.',
      'Negotiation matters more, not less: Luxury homes have wider bid-ask spreads and more inspection give. Joshua\'s 97%+ list-to-sale ratio at this tier means real dollars at the closing table.',
      'Off-market is normal here: A meaningful share of Governors Club transactions never hit public MLS. Joshua\'s Compass network and direct relationships with neighborhood owners surface opportunities buyers using Zillow will never see.',
    ],
    faqs: [
      {
        q: 'How much do homes in Governors Club cost in 2026?',
        a: 'Most resale activity in Governors Club sits between $1.5M and $4M, with premium estate lots and recently built custom homes pushing past $5M. Smaller patio homes occasionally trade closer to $1.2M. Pricing is highly lot-driven — golf-course frontage and acreage carry significant premiums.',
      },
      {
        q: 'Is club membership required to buy in Governors Club?',
        a: 'Membership is not automatic with the home purchase. Buyers join the club separately and choose a membership tier based on intended use (golf, social, sports). Initiation fees and monthly dues should be confirmed directly with the club before closing — they are a real line item.',
      },
      {
        q: 'What schools are zoned to Governors Club?',
        a: 'Governors Club is zoned to Williamson County Schools — typically Crockett Elementary, Woodland Middle, and Ravenwood High School. WCS schools are routinely top-ranked at the state level. Always verify the current zoning for a specific address.',
      },
      {
        q: 'Are there off-market opportunities in Governors Club?',
        a: 'Yes. A meaningful share of transactions in Governors Club happen off-market or as Compass Coming Soon listings. Joshua actively monitors the community and has direct relationships with owners who may sell quietly. If Governors Club is your target, working with an agent who has access to the off-market layer is the difference.',
      },
      {
        q: 'How does Governors Club compare to other Brentwood luxury communities?',
        a: 'Governors Club is the only gated golf community of its scale in Brentwood. Annandale and Raintree Forest offer comparable price points but are not gated and do not have a private course. If gating, golf, and a club lifestyle are priorities, Governors Club is essentially without direct competition in the immediate area.',
      },
    ],
    schemaCity: 'Brentwood',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'mckays-mill-franklin-tn': {
    slug: 'mckays-mill-franklin-tn',
    name: "McKay's Mill",
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: "McKay's Mill Neighborhood Guide — Franklin, TN | Joshua Fink",
    metaDescription:
      "McKay's Mill is one of Franklin's largest and most popular family subdivisions. Local insight from Compass agent Joshua Fink — homes, schools, amenities, HOA, and current pricing.",
    intro:
      "McKay's Mill is one of the largest and most consistently popular family subdivisions in Franklin, Tennessee — well over a thousand homes, multiple pools, a clubhouse, and a strong reputation as a place where families actually stay long-term. If you have spent a Saturday at the McKay's Mill pool or the soccer fields, you understand the appeal.",
    about:
      "Built primarily through the early-to-mid 2000s on the east side of Franklin, McKay's Mill is a traditional master-planned subdivision rather than a new-urbanism community — meaning more conventional residential streets, larger lots than Westhaven on average, and a clearly residential character with no commercial center inside the community. The architecture is Southern traditional with hardiplank exteriors, brick fronts, and family-sized floor plans typically in the 2,500–4,500 square-foot range. Amenities include multiple pools, a clubhouse, tennis courts, playgrounds, and miles of sidewalks. The community sits in a strong Williamson County Schools zone and offers easy access to I-65 for commuting toward Cool Springs, Brentwood, and downtown Nashville.",
    vibe: 'Large, family-oriented traditional subdivision with strong amenities.',
    priceBand: '$650K – $1.2M',
    buildYears: 'Early-to-mid 2000s, with a small number of newer custom infill builds',
    hoa: 'Active HOA with annual dues; covers the pools, clubhouse, common areas, and community events. Generally considered reasonable for the amenity level.',
    schoolNotes:
      "McKay's Mill is zoned to Williamson County Schools — typically Clovercroft Elementary, Woodland Middle, and Page High School (zoning can vary by section of the community). Always verify current zoning for the specific address.",
    amenities: [
      'Multiple resort-style pools',
      'Clubhouse with social events',
      'Tennis courts and sports fields',
      'Playgrounds and walking paths',
      'Active HOA with year-round community programming',
      'Strong sense of long-term resident community',
    ],
    homeStyles: [
      'Southern traditional two-story',
      'Brick-front with hardiplank sides',
      'Family-sized 4-5 bedroom floor plans',
      'Selected ranch and one-story homes',
      'Custom infill on premium lots',
    ],
    whyBullets: [
      "Family scale and stability: McKay's Mill is the kind of subdivision where families buy in and stay for 10+ years. Long-term resident density translates into a strong neighborhood feel and predictable resale.",
      'Sweet-spot pricing for Franklin: At $650K–$1.2M, the community covers the heart of the Williamson County family-buyer market — better square footage than newer construction at the same price, with mature trees and established amenities.',
      'Schools and commute: Strong WCS zoning combined with quick access to I-65 makes this one of the most practical subdivisions for families with one or both parents commuting north.',
    ],
    faqs: [
      {
        q: "How much do homes in McKay's Mill cost in 2026?",
        a: "Most McKay's Mill resale activity in 2026 falls between $650,000 and $1.2M, with the bulk in the $750K–$950K range for traditional 4-bedroom family homes. Updated kitchens, finished basements, and premium lots push toward the upper end. Joshua can pull current comps for any specific street.",
      },
      {
        q: "Is McKay's Mill a good neighborhood for families?",
        a: "Yes — it is one of the most family-oriented subdivisions in Franklin. The combination of Williamson County Schools zoning, multiple pools, an active HOA, and a long-term resident base makes it consistently popular with relocating families.",
      },
      {
        q: "What schools are zoned to McKay's Mill?",
        a: "McKay's Mill is generally zoned to Williamson County Schools — most often Clovercroft Elementary, Woodland Middle, and Page High School, though zoning varies by specific section. Always confirm against the current Williamson County Schools zoning map for the exact address.",
      },
      {
        q: "Does McKay's Mill have an HOA?",
        a: 'Yes, with annual dues that fund the pools, clubhouse, common-area maintenance, and community events. Dues are generally considered reasonable for the amenity package.',
      },
      {
        q: "How does McKay's Mill compare to Westhaven or Fieldstone Farms?",
        a: "McKay's Mill is more traditionally suburban than Westhaven (no town center, larger lots, more conventional streets) and slightly larger and more amenity-rich than Fieldstone Farms. Pricing tends to sit between the two. Buyers prioritizing pool/clubhouse community life with classic family floor plans gravitate to McKay's Mill.",
      },
    ],
    schemaCity: 'Franklin',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },
}

export function getNeighborhood(slug: string): Neighborhood | undefined {
  return neighborhoods[slug]
}

export function getAllNeighborhoodSlugs(): string[] {
  return Object.keys(neighborhoods)
}

export function getNeighborhoodsByCitySlug(citySlug: string): Neighborhood[] {
  return Object.values(neighborhoods).filter((n) => n.citySlug === citySlug)
}

// Returns up to `limit` related neighborhood guides, preferring same city,
// then same county, then any other Middle Tennessee guide. Used by the
// /neighborhoods/[slug] template to surface internal cross-links and
// distribute link equity between guide pages.
export function getRelatedNeighborhoods(slug: string, limit = 3): Neighborhood[] {
  const current = neighborhoods[slug]
  if (!current) return []
  const others = Object.values(neighborhoods).filter((n) => n.slug !== slug)
  const sameCity = others.filter((n) => n.citySlug === current.citySlug)
  const sameCounty = others.filter(
    (n) => n.county === current.county && n.citySlug !== current.citySlug,
  )
  const rest = others.filter(
    (n) => n.citySlug !== current.citySlug && n.county !== current.county,
  )
  return [...sameCity, ...sameCounty, ...rest].slice(0, limit)
}
