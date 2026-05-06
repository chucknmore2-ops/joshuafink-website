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

  'fieldstone-farms-franklin-tn': {
    slug: 'fieldstone-farms-franklin-tn',
    name: 'Fieldstone Farms',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'Fieldstone Farms Neighborhood Guide — Franklin, TN | Joshua Fink',
    metaDescription:
      'Fieldstone Farms is one of the largest, most popular family subdivisions in Franklin, TN. Local insight from Compass agent Joshua Fink — homes, schools, HOA, amenities, and pricing.',
    intro:
      'Fieldstone Farms is one of the most established and recognizable family subdivisions in Franklin, Tennessee — over 1,200 homes spread across the west side of Franklin near the Mack Hatcher Parkway corridor. If you have ever cut through Liberty Pike or Hillsboro Road and seen the long stone-and-iron entries, you have driven the edge of Fieldstone Farms.',
    about:
      "Fieldstone Farms was developed primarily through the late 1990s and 2000s as a large traditional master-planned subdivision rather than a new-urbanism community — meaning conventional residential streets, sidewalks, and a clear residential character with no commercial center inside the community itself. The lots are generally larger than what you'll find in newer Franklin builds, with mature landscaping and tree canopy that newer subdivisions can't match. Architecture is classic Southern traditional with brick fronts, hardiplank sides, and family-sized floor plans typically running 2,500–4,500 square feet. The community is anchored by an active HOA that maintains multiple pools, a clubhouse, tennis courts, walking paths, and a busy social calendar. The location — close to downtown Franklin, Cool Springs, and major commuter routes — has kept it consistently in demand even as newer subdivisions have come online further south.",
    vibe: 'Large, established family subdivision with mature trees and strong amenities.',
    priceBand: '$650K – $1.1M',
    buildYears: 'Late 1990s through mid-2000s, with selected custom infill',
    hoa: 'Active HOA with annual dues; covers the pools, clubhouse, tennis, common-area landscaping, and community events. Generally considered reasonable for the amenity package.',
    schoolNotes:
      'Fieldstone Farms is zoned to Williamson County Schools — typically Johnson Elementary, Freedom Middle, and Franklin High School (zoning can vary by section of the community). Williamson County Schools regularly rank among the strongest in Tennessee, and the zoning is a meaningful piece of the Fieldstone Farms resale story.',
    amenities: [
      'Multiple resort-style pools',
      'Clubhouse with active social programming',
      'Tennis and pickleball courts',
      'Walking and jogging paths throughout the community',
      'Playgrounds and sports fields',
      'Long-tenured HOA with year-round events',
    ],
    homeStyles: [
      'Southern traditional two-story',
      'Brick-front with hardiplank sides',
      'Family-sized 4–5 bedroom floor plans',
      'Selected ranch and one-story homes on premium lots',
      'Mature landscaping and established tree canopy',
    ],
    whyBullets: [
      'Mature beats new in this price band: At $650K–$1.1M, Fieldstone Farms gives you bigger lots and mature trees than newer Franklin builds in the same range — both of which appraise and resell well.',
      'Long-term resident density: Fieldstone Farms is the kind of community where families stay for 10–20 years. That stability shows up in the school feeder pattern, neighborhood feel, and consistent resale demand.',
      "Location is the cheat code: Fieldstone Farms is genuinely close to downtown Franklin (5–10 min) and Cool Springs employment. Few Franklin subdivisions in this price band match that combination of price, lot size, and commute.",
    ],
    faqs: [
      {
        q: 'How much do homes in Fieldstone Farms cost in 2026?',
        a: 'Most resale activity in Fieldstone Farms in 2026 runs between $650,000 and $1.1M, with the bulk in the $750K–$925K range for traditional 4-bedroom family homes. Updated kitchens, finished basements, and premium lots near the pools or on cul-de-sacs push toward the upper end. Joshua can pull current closed comps for any specific street.',
      },
      {
        q: 'What schools are zoned to Fieldstone Farms?',
        a: 'Fieldstone Farms is generally zoned to Williamson County Schools — most often Johnson Elementary, Freedom Middle, and Franklin High School — though zoning varies by specific section. Always confirm against the current Williamson County Schools zoning map for the exact address before writing an offer.',
      },
      {
        q: 'Does Fieldstone Farms have an HOA, and what does it cover?',
        a: 'Yes. The HOA collects annual dues and covers multiple pools, the clubhouse, tennis courts, common-area landscaping, and community events. Dues are generally considered reasonable given the amenity package. Joshua will walk through the current dues and any community rules during your tour.',
      },
      {
        q: 'How does Fieldstone Farms compare to McKay\'s Mill or Westhaven?',
        a: "Fieldstone Farms is more established than McKay's Mill (it's older and has more mature trees) and more traditional than Westhaven (no town center, no walkable retail core, larger conventional lots). Pricing tends to be similar to McKay's Mill and below Westhaven. Buyers prioritizing larger lots, mature landscaping, and a downtown-Franklin commute often choose Fieldstone Farms.",
      },
      {
        q: 'Is Fieldstone Farms a good investment for the long term?',
        a: 'Historically, yes. Fieldstone Farms has held value strongly through multiple market cycles because of its size, established amenities, school zoning, and location. The community is built out — there are no new construction homes coming online — which keeps inventory tight relative to demand.',
      },
    ],
    schemaCity: 'Franklin',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'berry-farms-franklin-tn': {
    slug: 'berry-farms-franklin-tn',
    name: 'Berry Farms',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'Berry Farms Neighborhood Guide — Franklin, TN | Joshua Fink',
    metaDescription:
      'Berry Farms is the newer mixed-use master-planned community in south Franklin, TN — walkable, modern, and growing fast. Local insight from Compass agent Joshua Fink.',
    intro:
      'Berry Farms is the master-planned mixed-use community on the south end of Franklin, Tennessee — a newer community built around walkability, a town center with restaurants and offices, and a wide range of home types from townhomes to custom estates. If you have driven I-65 south of Cool Springs and seen the modern town-center buildings off Goose Creek Bypass, that is Berry Farms.',
    about:
      'Berry Farms began development in the early 2010s and is still actively growing — meaning newer construction stock, modern floor plans, and contemporary architecture rather than the brick-front traditional you find in older Franklin subdivisions. The community is intentionally mixed-use: in addition to single-family homes, townhomes, and condos, the Town Center includes restaurants, professional offices, a hotel, and select retail. This is Franklin\'s closest answer to a Westhaven-style walkable lifestyle, on the south side of town. Architecture leans modern farmhouse, transitional contemporary, low-country, and traditional — generally with cleaner, more current finishes than older Franklin stock. Lot sizes vary widely by section, from townhome footprints near the town center to half-acre+ custom homesites further out.',
    vibe: 'Newer mixed-use master-planned community with a walkable town center.',
    priceBand: '$550K – $1.8M',
    buildYears: 'Early 2010s to present (still actively developing)',
    hoa: 'Active HOA with monthly dues; covers common areas, town-center upkeep, pools, and amenity maintenance. Townhome and condo sub-associations layer in additional dues for exterior maintenance — confirm by section before purchase.',
    schoolNotes:
      'Berry Farms is generally zoned to Williamson County Schools — typically Trinity Elementary, Hillsboro Middle, and Independence High School (zoning can vary by section and address). WCS schools rank among the strongest in Tennessee. Always verify the current zoning for the specific home you\'re considering.',
    amenities: [
      'Berry Farms Town Center — restaurants, coffee, retail, professional offices',
      'Community pools',
      'Walking and biking paths',
      'Modern playgrounds and parks',
      'On-site hotel and event space within the town center',
      'Newer construction with current-spec finishes',
    ],
    homeStyles: [
      'Modern farmhouse with metal-accent roofs',
      'Transitional contemporary',
      'Low-country and craftsman influences',
      'Luxury townhomes near the town center',
      'Custom estate homes on larger perimeter lots',
    ],
    whyBullets: [
      'Newer stock matters: For buyers relocating from larger metros, Berry Farms offers the newer construction, modern floor plans, and current-spec finishes that older Franklin subdivisions simply don\'t have. That cuts down on first-year update costs.',
      'Walkability without leaving Franklin: Berry Farms gives you a walkable town center with restaurants and shops — a Westhaven-style lifestyle on the south side of Franklin. For buyers torn between Franklin and Nashville, it\'s a strong middle ground.',
      'Wide price range under one address: Townhomes start in the $500s; custom estates push past $1.5M. That breadth means Berry Farms works for first-time-in-Franklin buyers and luxury buyers alike — a rare profile for a newer community.',
    ],
    faqs: [
      {
        q: 'How much do homes in Berry Farms cost in 2026?',
        a: 'Pricing in Berry Farms runs from roughly the mid-$500s for townhomes and smaller condos near the town center up past $1.8M for custom estates on premium lots. Most single-family activity sits in the $750K–$1.2M range. Because Berry Farms is still actively developing, new-construction pricing can move quickly — Joshua can pull both resale comps and current builder inventory for any block.',
      },
      {
        q: 'What schools are zoned to Berry Farms?',
        a: 'Berry Farms is generally zoned to Williamson County Schools — most often Trinity Elementary, Hillsboro Middle, and Independence High School — though zoning varies by section. Always confirm against the current Williamson County Schools zoning map for the exact address.',
      },
      {
        q: 'Is Berry Farms still being built out?',
        a: 'Yes. Berry Farms is an active master-planned community with new sections and home types still coming online as of 2026. That means current new-construction options for buyers willing to wait, but it also means construction activity in some pockets — Joshua can advise on which sections are stable and which are still under active build.',
      },
      {
        q: 'Does Berry Farms have an HOA?',
        a: 'Yes — an active HOA with monthly dues covering common areas, the town-center maintenance, pools, and amenity programming. Townhome and condo buyers also pay sub-association dues for exterior maintenance. Always confirm both layers of dues for the specific home before closing.',
      },
      {
        q: 'How does Berry Farms compare to Westhaven?',
        a: 'Both are walkable master-planned communities with a true town center, but Berry Farms is on the south side of Franklin (closer to the I-65 corridor) and is generally newer, while Westhaven is on the west side and more established. Berry Farms tends to skew slightly less expensive than Westhaven for comparable square footage. Buyers prioritizing newer construction and a south-side commute often choose Berry Farms; buyers prioritizing the largest, most mature walkable community in Franklin choose Westhaven.',
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
