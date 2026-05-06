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

  'annandale-brentwood-tn': {
    slug: 'annandale-brentwood-tn',
    name: 'Annandale',
    city: 'Brentwood',
    citySlug: 'brentwood-tn',
    county: 'Williamson County',
    metaTitle: 'Annandale Neighborhood Guide — Brentwood, TN | Joshua Fink',
    metaDescription:
      'Annandale is one of the most prestigious non-gated communities in Brentwood, TN — large estate lots, custom homes, and Williamson County Schools. Local insight from Compass agent Joshua Fink.',
    intro:
      'Annandale is one of the most established luxury communities in Brentwood, Tennessee — large lots, custom homes, mature landscaping, and the kind of quiet street presence that long-time Brentwood residents associate with the very top tier of the market. If you have ever driven Concord Road and admired the deeper, tree-lined estate streets, you have driven the edges of Annandale.',
    about:
      'Annandale sits in central Brentwood with easy access to Concord Road and I-65, surrounded by the kind of established Williamson County landscape that newer subdivisions cannot replicate at any price. Lot sizes are generous (typically half-acre to over an acre), homes are predominantly large custom builds rather than production-builder stock, and the architectural character runs from traditional Southern brick to French country and transitional contemporary. Unlike Governors Club, Annandale is not gated — it is a residentially-zoned, professionally-quiet community where privacy comes from lot size and tree cover rather than a manned entry. The buyer profile is heavy executive and physician, with strong long-term residency and predictable resale demand.',
    vibe: 'Established non-gated luxury — large lots, custom homes, mature trees.',
    priceBand: '$1.4M – $4M+',
    buildYears: 'Late 1980s through present, with active custom infill on premium lots',
    hoa: 'Active HOA with annual dues; covers common-area maintenance and community standards. Considered modest for the price point. No mandatory club membership.',
    schoolNotes:
      'Annandale is generally zoned to Williamson County Schools — typically Edmondson Elementary, Brentwood Middle, and Brentwood High School (zoning can vary by section and address). Williamson County Schools rank among the strongest in Tennessee. Always verify current zoning for the specific address.',
    amenities: [
      'Large estate lots (typically 0.5 to 1+ acres)',
      'Mature tree canopy and established landscaping',
      'Quiet residential streets — low through-traffic',
      'Easy access to downtown Brentwood and I-65',
      'Williamson County Schools zoning',
      'Strong long-term resident community',
    ],
    homeStyles: [
      'Traditional Southern brick custom builds',
      'French country and provincial estates',
      'Transitional contemporary',
      'Selected modern custom homes on premium lots',
      'Newer infill builds replacing older homes on choice lots',
    ],
    whyBullets: [
      'Lot size is the moat: At $1.5M+ in Brentwood, half-acre to acre lots with mature trees are increasingly rare. Annandale was platted with generous footprints — newer subdivisions in the same price band offer noticeably less land.',
      'Privacy without gating: For buyers who want top-tier Brentwood without paying the gated-community premium of Governors Club, Annandale offers comparable privacy via lot size and tree cover at a meaningfully lower entry point.',
      "Off-market activity is real: A meaningful share of Annandale transactions never hit public MLS. Joshua's Compass network and direct relationships with neighborhood owners surface opportunities that public listing portals will never show.",
    ],
    faqs: [
      {
        q: 'How much do homes in Annandale cost in 2026?',
        a: 'Most resale activity in Annandale falls between $1.4M and $3M, with premium lots and recently built or extensively renovated custom homes pushing past $4M. Pricing is highly lot-driven — acreage, mature trees, and street position carry significant premiums. Joshua can pull current closed comps for any specific street.',
      },
      {
        q: 'Is Annandale a gated community?',
        a: 'No. Annandale is not gated — it is intentionally a quiet residential community where privacy comes from large lots, tree cover, and low through-traffic. If you specifically need a gated entry, Governors Club is the closest comparable Brentwood option.',
      },
      {
        q: 'What schools are zoned to Annandale?',
        a: 'Annandale is typically zoned to Williamson County Schools — most commonly Edmondson Elementary, Brentwood Middle, and Brentwood High School — though zoning varies by section and address. Always verify current zoning against the Williamson County Schools zoning map for the specific address you are considering.',
      },
      {
        q: 'How does Annandale compare to Governors Club?',
        a: 'Both are top-tier Brentwood luxury communities, but Governors Club is gated and built around a Greg Norman golf course with mandatory HOA infrastructure tied to the club. Annandale is non-gated, has no club component, and tends to enter at a lower price point for comparable square footage. Buyers who do not need golf or gating often prefer Annandale; buyers prioritizing the country-club lifestyle choose Governors Club.',
      },
      {
        q: 'Is Annandale a good long-term investment?',
        a: 'Historically, yes. Annandale benefits from limited inventory (it is built out, with only occasional teardown infill), strong school zoning, and a stable executive buyer base. Days-on-market and price stability have outperformed the broader Brentwood average through multiple market cycles.',
      },
    ],
    schemaCity: 'Brentwood',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'raintree-forest-brentwood-tn': {
    slug: 'raintree-forest-brentwood-tn',
    name: 'Raintree Forest',
    city: 'Brentwood',
    citySlug: 'brentwood-tn',
    county: 'Williamson County',
    metaTitle: 'Raintree Forest Neighborhood Guide — Brentwood, TN | Joshua Fink',
    metaDescription:
      'Raintree Forest is one of Brentwood\'s most established luxury subdivisions — wooded lots, brick traditional estates, and Williamson County Schools. Compass agent Joshua Fink walks you through what to know.',
    intro:
      'Raintree Forest is one of the most recognizable established luxury subdivisions in Brentwood, Tennessee — wooded acre-plus lots, classic brick traditional homes, and the kind of mature, settled feel that newer Brentwood communities cannot manufacture. If you have driven the streets off Concord Road or Granny White Pike and seen the long, tree-lined drives, you have driven through Raintree Forest.',
    about:
      'Raintree Forest was developed primarily through the late 1980s and 1990s on the rolling Williamson County terrain east and south of central Brentwood. Lot sizes are intentionally generous — typically one acre or larger, many wooded — and the architecture is dominated by classic Southern brick traditional estates of 4,000–6,000+ square feet, with selected newer custom infill replacing older homes on premium lots. There is no gating, no golf course, and no commercial component — Raintree Forest is purely a quiet residential community where privacy comes from acreage and tree cover. Buyer demographics skew heavily executive and long-term: many homes have been owned by the same families for 15+ years, and intergenerational sales (parents to adult children) are not uncommon.',
    vibe: 'Established wooded-lot luxury with classic brick traditional architecture.',
    priceBand: '$1.3M – $3.5M',
    buildYears: 'Late 1980s through 1990s, with selected custom infill since',
    hoa: 'Modest annual HOA dues; covers community standards and limited common-area upkeep. No club, no pool, no gate — the dues are intentionally low for the price band.',
    schoolNotes:
      'Raintree Forest is generally zoned to Williamson County Schools — most often Edmondson Elementary, Brentwood Middle, and Brentwood High School — though zoning can vary by specific section. Always verify current zoning for the exact address you are considering.',
    amenities: [
      'Acre-plus wooded lots throughout',
      'Mature tree canopy and rolling Williamson County terrain',
      'Quiet, low-traffic residential streets',
      'Williamson County Schools zoning',
      'Easy access to Concord Road, Granny White Pike, and I-65',
      'Strong long-term resident base',
    ],
    homeStyles: [
      'Classic Southern brick traditional (dominant)',
      'Georgian and colonial influences',
      'Transitional contemporary on newer infill lots',
      'French country and provincial estates',
      'Larger custom builds on premium wooded lots',
    ],
    whyBullets: [
      'Acreage is the differentiator: One-acre+ wooded lots in central Brentwood are increasingly scarce and difficult to replicate. Raintree Forest delivers them at a price point below comparable acreage in newer luxury subdivisions.',
      'Renovation upside: Many original 1990s homes are excellent renovation candidates — strong bones, generous square footage, prime lots — at a meaningful discount to new-construction pricing for equivalent finished space.',
      "Long-term-resident community: Raintree Forest turns over slowly. That stability shows up in the neighborhood feel, the school feeder pattern, and the predictability of resale.",
    ],
    faqs: [
      {
        q: 'How much do homes in Raintree Forest cost in 2026?',
        a: 'Most resale activity in Raintree Forest sits between $1.3M and $2.6M, with renovated and recently rebuilt homes on premium wooded lots pushing past $3M. Pricing is heavily lot-driven — acreage, tree cover, and topography all carry premiums. Joshua can pull current closed comps for any specific street.',
      },
      {
        q: 'Is Raintree Forest gated?',
        a: 'No. Raintree Forest is non-gated by design — privacy comes from large wooded lots and quiet residential streets rather than a manned entry. If gating is essential, Governors Club is the closest gated Brentwood luxury comparable.',
      },
      {
        q: 'What schools are zoned to Raintree Forest?',
        a: 'Raintree Forest is generally zoned to Williamson County Schools — typically Edmondson Elementary, Brentwood Middle, and Brentwood High School — though zoning can vary by section. Always confirm against the current Williamson County Schools zoning map for the specific address.',
      },
      {
        q: 'Are most Raintree Forest homes original or renovated?',
        a: 'Both. Many homes are still in their original 1990s configuration with the classic brick traditional layout, while others have been thoughtfully renovated or fully rebuilt on the original lot. The mix means pricing varies widely within the same community — Joshua can help you understand what is realistic at each finish level.',
      },
      {
        q: 'How does Raintree Forest compare to Annandale?',
        a: 'Both are established non-gated Brentwood luxury communities with large lots and traditional architecture. Raintree Forest tends toward larger wooded lots and older original homes; Annandale skews slightly newer with more custom-builder activity. Pricing is broadly comparable. Buyers prioritizing the wooded/private feel often choose Raintree Forest; buyers wanting more recently built finished space lean Annandale.',
      },
    ],
    schemaCity: 'Brentwood',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'highlands-at-ladd-park-franklin-tn': {
    slug: 'highlands-at-ladd-park-franklin-tn',
    name: 'The Highlands at Ladd Park',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'The Highlands at Ladd Park Guide — Franklin, TN | Joshua Fink',
    metaDescription:
      'The Highlands at Ladd Park is a newer upscale Franklin community — modern construction, larger lots, and Williamson County Schools. Local insight from Compass agent Joshua Fink.',
    intro:
      'The Highlands at Ladd Park is one of the newer upscale residential communities on the south end of Franklin, Tennessee — modern construction, larger lots than the production-builder stock you find further south, and the kind of architectural character that signals a community built for long-term ownership rather than fast turnover. For buyers who want Franklin without the mature-tree look of older subdivisions, this is one of the most relevant options on the market.',
    about:
      'The Highlands at Ladd Park sits south of downtown Franklin with easy access to the Goose Creek Bypass and the broader Cool Springs employment corridor. Homes are predominantly newer construction (mid-2010s onward) on lots that meaningfully exceed what you find in production-builder subdivisions of the same vintage — which translates to better separation, better landscaping potential, and stronger appraisal support. Architecture leans modern farmhouse, transitional contemporary, and traditional Southern with current finish levels (open-concept floor plans, large kitchen islands, primary-on-main options). The community is residential-only — no town center, no commercial component — and benefits from Williamson County Schools zoning and proximity to both Franklin and the I-65 corridor.',
    vibe: 'Newer upscale Franklin community with larger-than-builder lots and current architecture.',
    priceBand: '$900K – $2M',
    buildYears: 'Mid-2010s through present, still actively building',
    hoa: 'Active HOA with monthly dues; covers common areas and community standards. Modest for the price point. No club component.',
    schoolNotes:
      'The Highlands at Ladd Park is typically zoned to Williamson County Schools — common assignments include Pearre Creek Elementary, Hillsboro Middle, and Independence High School, but zoning varies by specific section and address. Always confirm current zoning against the Williamson County Schools map.',
    amenities: [
      'Larger-than-typical lots for newer Franklin construction',
      'Modern home stock with current finishes',
      'Walking paths and community open space',
      'Williamson County Schools zoning',
      'Quick access to Cool Springs and I-65',
      'Quiet residential character',
    ],
    homeStyles: [
      'Modern farmhouse with metal-accent roofs',
      'Transitional contemporary',
      'Traditional Southern with current finish levels',
      'Open-concept floor plans with large kitchen islands',
      'Primary-on-main and ranch-style options',
    ],
    whyBullets: [
      'Newer construction matters in this price band: For buyers relocating from larger metros, current-spec finishes, modern floor plans, and energy-efficient build standards reduce first-year update costs versus comparable resale stock in older Franklin subdivisions.',
      'Lot size beats nearby production-builder stock: The Highlands was platted with more generous footprints than the mass-produced Franklin subdivisions immediately south. That separation appraises and resells well.',
      'Williamson County Schools at a meaningfully lower price than Westhaven: Buyers who want the school zoning and Franklin address but cannot stretch to $1.5M+ Westhaven inventory often find their fit here.',
    ],
    faqs: [
      {
        q: 'How much do homes in The Highlands at Ladd Park cost in 2026?',
        a: 'Most resale activity in The Highlands runs between $900,000 and $1.6M, with newer custom builds and premium lots pushing past $1.8M. Because the community is still actively building, current new-construction options can move quickly — Joshua can pull both resale comps and any active builder inventory.',
      },
      {
        q: 'Is The Highlands still being built out?',
        a: 'Yes. The Highlands at Ladd Park is an active master-planned community with new sections coming online as of 2026. That means new-construction options for buyers willing to wait, but it also means construction activity in some pockets — Joshua can advise on which sections are stable.',
      },
      {
        q: 'What schools are zoned to The Highlands at Ladd Park?',
        a: 'Most addresses are zoned to Williamson County Schools — typically Pearre Creek Elementary, Hillsboro Middle, and Independence High School — though zoning varies by section. Always verify current zoning for the specific address before writing an offer.',
      },
      {
        q: 'How does The Highlands compare to Westhaven?',
        a: 'Westhaven is a much larger, more established walkable community with a true town center, while The Highlands at Ladd Park is a smaller residential-only neighborhood without a commercial core. Pricing in The Highlands tends to enter below comparable Westhaven square footage. Buyers who want a Westhaven-style address without the lifestyle premium often consider The Highlands.',
      },
      {
        q: 'Does The Highlands have an HOA?',
        a: 'Yes — an active HOA with monthly dues covering common areas, walking paths, and community standards. Dues are generally considered modest for the price band. There is no club, no pool complex, no gate — the dues reflect that.',
      },
    ],
    schemaCity: 'Franklin',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'tollgate-village-thompsons-station-tn': {
    slug: 'tollgate-village-thompsons-station-tn',
    name: 'Tollgate Village',
    city: "Thompson's Station",
    citySlug: 'thompsons-station-tn',
    county: 'Williamson County',
    metaTitle: "Tollgate Village Neighborhood Guide — Thompson's Station, TN | Joshua Fink",
    metaDescription:
      "Tollgate Village is one of the largest, fastest-growing master-planned communities in Thompson's Station, TN. Compass agent Joshua Fink covers homes, schools, HOA, and price ranges.",
    intro:
      "Tollgate Village is one of the largest and fastest-growing master-planned communities in Thompson's Station, Tennessee — a sprawling residential community on the south end of Williamson County with a wide range of home types, an active community calendar, and Williamson County Schools zoning. For buyers priced out of Franklin who still want WCS schools and a strong neighborhood feel, Tollgate Village is one of the most relevant options on the map.",
    about:
      "Tollgate Village sits along Columbia Pike (US-31) in southern Williamson County, blending easy commute access toward Cool Springs and Franklin with a noticeably more affordable entry point than its neighbors to the north. The community is large — well over a thousand homes spread across multiple sections built progressively from the late 2000s onward — and offers an unusually wide range of home types: traditional single-family detached, townhomes, and a smaller number of cottage-style homes. Architecture is current-vintage Southern traditional and modern farmhouse, with floor plans that lean family-functional rather than estate-grand. The community amenities include pools, walking paths, playgrounds, and a clubhouse, with an active HOA programming community events year-round.",
    vibe: 'Large, growing master-planned community with mixed home types and Williamson County Schools.',
    priceBand: '$500K – $1M',
    buildYears: 'Late 2000s through present, still actively building',
    hoa: 'Active HOA with monthly dues; covers pools, clubhouse, common areas, walking paths, and community programming. Townhome sub-association adds exterior-maintenance dues — confirm by section.',
    schoolNotes:
      "Tollgate Village is generally zoned to Williamson County Schools — common assignments include Heritage Elementary, Heritage Middle, and Independence High School, though zoning varies by specific section and address. Always verify current zoning before writing an offer.",
    amenities: [
      'Multiple resort-style pools',
      'Clubhouse with active social programming',
      'Walking paths and community open space',
      'Playgrounds and sports fields',
      'Active HOA event calendar',
      'Mix of detached, townhome, and cottage home types',
    ],
    homeStyles: [
      'Current-vintage Southern traditional',
      'Modern farmhouse',
      'Family-functional 4-5 bedroom floor plans',
      'Townhomes (lower-maintenance ownership)',
      'Cottage-style smaller-footprint detached homes',
    ],
    whyBullets: [
      'Williamson County Schools at a meaningfully lower entry point: For families who want WCS zoning but cannot stretch to Franklin or Brentwood pricing, Tollgate Village delivers the same school district at a price point that is often $200-400K below comparable square footage further north.',
      "Fastest-growing pocket in southern Williamson: Thompson's Station is one of the fastest-growing municipalities in Tennessee. Tollgate Village is the largest master-planned community at the center of that growth — meaning strong buyer demand and predictable resale activity.",
      'Wide buyer fit: With townhomes from the $500s and detached homes pushing past $900K, Tollgate Village works for first-time buyers, move-up families, and right-sizing empty-nesters all within the same community.',
    ],
    faqs: [
      {
        q: "How much do homes in Tollgate Village cost in 2026?",
        a: 'Pricing in Tollgate Village runs from roughly the low $500s for townhomes and smaller detached homes up past $1M for newer custom builds and larger family floor plans. Most resale activity sits in the $650K–$850K range. Joshua can pull current closed comps for any section.',
      },
      {
        q: "What schools are zoned to Tollgate Village?",
        a: 'Most addresses in Tollgate Village are zoned to Williamson County Schools — typically Heritage Elementary, Heritage Middle, and Independence High School. Williamson County Schools rank among the strongest in Tennessee. Always verify current zoning for the specific address.',
      },
      {
        q: 'Is Tollgate Village still being built out?',
        a: 'Yes. Tollgate Village has new sections under active construction as of 2026, with both production builders and selected custom builders releasing inventory. Joshua can advise on which sections are stable and which are still under active build.',
      },
      {
        q: "How does Tollgate Village compare to Franklin subdivisions like McKay's Mill?",
        a: "Tollgate Village is generally newer, has a wider range of home types (townhomes through detached), and tends to enter at a noticeably lower price point than established Franklin subdivisions. McKay's Mill offers more mature trees and longer-tenured resident base; Tollgate Village offers newer construction and Williamson County Schools at a meaningfully lower entry point.",
      },
      {
        q: 'Is the commute from Tollgate Village to Cool Springs manageable?',
        a: 'Yes — most residents reach Cool Springs in 15-25 minutes depending on time of day. Columbia Pike (US-31) is the primary corridor north toward Franklin; I-65 access via Saturn Parkway in nearby Spring Hill provides the I-65 alternative. Joshua can walk through commute math for your specific employer.',
      },
    ],
    schemaCity: "Thompson's Station",
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'burberry-glen-nolensville-tn': {
    slug: 'burberry-glen-nolensville-tn',
    name: 'Burberry Glen',
    city: 'Nolensville',
    citySlug: 'nolensville-tn',
    county: 'Williamson County',
    metaTitle: 'Burberry Glen Neighborhood Guide — Nolensville, TN | Joshua Fink',
    metaDescription:
      'Burberry Glen is one of the most popular newer family subdivisions in Nolensville, TN — modern homes, Williamson County Schools, and quick access to Cool Springs. Local insight from Compass agent Joshua Fink.',
    intro:
      'Burberry Glen is one of the most popular newer family subdivisions in Nolensville, Tennessee — current-vintage construction, family-sized floor plans, an active amenity package, and Williamson County Schools zoning. For families who want modern stock and a Nolensville address without the older-build trade-offs, Burberry Glen is a top choice.',
    about:
      'Burberry Glen sits in central Nolensville with easy access to Nolensville Road (TN-31A) and the broader corridor connecting Nolensville to Cool Springs and the I-65 employment centers. The community was developed primarily in the 2010s and continues to see selected newer builds, with home stock that leans heavily toward family-functional floor plans of 2,800-4,500 square feet. Architecture is current-vintage Southern traditional and modern farmhouse with finishes that match what relocating buyers expect (open-concept layouts, large primary suites, dedicated home-office space). The community amenity package includes pools, walking paths, and playgrounds, with an HOA programming an active community calendar.',
    vibe: 'Newer family subdivision with current-vintage homes and active amenity package.',
    priceBand: '$700K – $1.1M',
    buildYears: '2010s through present',
    hoa: 'Active HOA with monthly dues; covers pools, common areas, and community programming. Modest for the price band.',
    schoolNotes:
      'Burberry Glen is generally zoned to Williamson County Schools — common assignments include Sunset Elementary, Sunset Middle, and Nolensville High School, though zoning varies by section. Always confirm current zoning against the Williamson County Schools map for the specific address.',
    amenities: [
      'Resort-style community pool',
      'Walking paths and community open space',
      'Playgrounds and family amenities',
      'Active HOA event calendar',
      'Williamson County Schools zoning',
      'Quick access to Nolensville Road and Cool Springs',
    ],
    homeStyles: [
      'Modern farmhouse with current finish levels',
      'Current-vintage Southern traditional',
      'Family-sized 4-5 bedroom floor plans',
      'Open-concept layouts with large kitchen islands',
      'Dedicated home-office and flex-space configurations',
    ],
    whyBullets: [
      'Newer build, established community: Burberry Glen sits in the sweet spot between brand-new builder inventory and fully built-out older subdivisions — modern construction with established amenities and a stable resident base.',
      'Nolensville schools are the cheat code: Nolensville is one of the fastest-rising parts of Williamson County for families specifically because of strong school zoning combined with a relatively lower price point than Brentwood or Franklin.',
      'Floor plans match relocating-buyer expectations: For buyers moving from larger metros, the open-concept layouts, dedicated home-office space, and large primary suites here match expectations far better than older Franklin/Brentwood resale stock.',
    ],
    faqs: [
      {
        q: 'How much do homes in Burberry Glen cost in 2026?',
        a: 'Most resale activity in Burberry Glen runs between $700,000 and $1.05M, with newer custom builds and premium lots pushing past $1.1M. The bulk of activity sits in the $800K–$950K range for traditional 4-bedroom family homes. Joshua can pull current closed comps for any specific street.',
      },
      {
        q: 'What schools are zoned to Burberry Glen?',
        a: 'Most Burberry Glen addresses are zoned to Williamson County Schools — typically Sunset Elementary, Sunset Middle, and Nolensville High School — though zoning varies by section. Always verify against the current Williamson County Schools zoning map.',
      },
      {
        q: 'Is Burberry Glen a good fit for relocating families?',
        a: 'Yes — the combination of newer construction stock, current-spec floor plans, Williamson County Schools zoning, and active community amenities makes it consistently popular with families relocating from larger metros. Joshua works with relocating buyers regularly and can flag the sections best-suited to common relocation needs.',
      },
      {
        q: 'Does Burberry Glen have an HOA?',
        a: 'Yes — an active HOA with monthly dues covering the community pool, walking paths, common areas, and community programming. Dues are generally considered reasonable for the amenity package.',
      },
      {
        q: 'How does Burberry Glen compare to Bent Creek (also in Nolensville)?',
        a: 'Both are popular Nolensville family subdivisions with Williamson County Schools, but Bent Creek is larger, slightly older, and tends to enter at a marginally lower price point with more mature trees. Burberry Glen tends to feel newer and offer more current-vintage finishes. Pricing overlaps significantly. Buyers prioritizing newer construction often lean Burberry Glen; buyers wanting larger lots and mature trees lean Bent Creek.',
      },
    ],
    schemaCity: 'Nolensville',
    schemaState: 'TN',
    compassSearchUrl: COMPASS_AGENT_URL,
  },

  'bent-creek-nolensville-tn': {
    slug: 'bent-creek-nolensville-tn',
    name: 'Bent Creek',
    city: 'Nolensville',
    citySlug: 'nolensville-tn',
    county: 'Williamson County',
    metaTitle: 'Bent Creek Neighborhood Guide — Nolensville, TN | Joshua Fink',
    metaDescription:
      'Bent Creek is one of the largest and most popular family subdivisions in Nolensville, TN — established homes, mature trees, and Williamson County Schools. Compass agent Joshua Fink walks you through what to know.',
    intro:
      'Bent Creek is one of the largest and most consistently popular family subdivisions in Nolensville, Tennessee — well over a thousand homes, multiple pools, mature tree canopy, and a long-tenured family resident base. If you have ever spent a Saturday at the Bent Creek pool or driven the long curving streets off Nolensville Road, you have driven through one of the most established family communities in the southern Williamson County corridor.',
    about:
      "Bent Creek was developed primarily through the 2000s and into the early 2010s on the east side of Nolensville, with home stock dominated by traditional Southern brick-and-hardiplank family homes typically ranging from 2,500 to 4,500 square feet. Lot sizes are notably more generous than what you find in newer Nolensville builds — many lots run a third of an acre or larger, with mature tree canopy and established landscaping that newer subdivisions can't match at any price. Amenities include multiple pools, a clubhouse, tennis courts, walking paths, and an active HOA event calendar. The community sits squarely within the Williamson County Schools attendance zone and offers reasonable commute access to Cool Springs (15-25 minutes), Brentwood (20-30 minutes), and the I-65 corridor.",
    vibe: 'Large established family subdivision with mature trees and strong amenities.',
    priceBand: '$650K – $1M',
    buildYears: '2000s through early 2010s, with selected custom infill since',
    hoa: 'Active HOA with annual dues; covers multiple pools, clubhouse, tennis courts, walking paths, and community events. Generally considered reasonable for the amenity package.',
    schoolNotes:
      'Bent Creek is generally zoned to Williamson County Schools — common assignments include Sunset Elementary, Sunset Middle, and Nolensville High School, though zoning varies by specific section and address. Always verify current zoning before writing an offer.',
    amenities: [
      'Multiple resort-style pools',
      'Clubhouse with active social programming',
      'Tennis courts and sports fields',
      'Mature tree canopy and established landscaping',
      'Walking paths throughout the community',
      'Long-tenured HOA with year-round events',
    ],
    homeStyles: [
      'Traditional Southern brick with hardiplank accents',
      'Family-sized 4-5 bedroom floor plans',
      'Selected ranch and primary-on-main homes',
      'Custom infill builds on premium lots',
      'Mature 2-story family homes (dominant)',
    ],
    whyBullets: [
      'Mature trees beat newer subdivisions in this price band: At $650K-$1M, mature tree canopy and established landscaping are increasingly rare in Nolensville. Bent Creek delivers them at a price point comparable to brand-new builder inventory in the same area.',
      'Long-tenured family resident base: Bent Creek is the kind of subdivision where families buy in and stay for 10+ years. That stability translates to a strong school feeder pattern, a consistent neighborhood feel, and predictable resale demand.',
      'Williamson County Schools at the south end of the county: Bent Creek delivers WCS zoning at one of the most accessible price points in the school district — a meaningful value for families prioritizing schools above all else.',
    ],
    faqs: [
      {
        q: 'How much do homes in Bent Creek cost in 2026?',
        a: 'Most resale activity in Bent Creek falls between $650,000 and $950,000, with the bulk in the $750K-$875K range for traditional 4-bedroom family homes. Updated kitchens, finished basements, and premium lots near the pools push toward the upper end. Joshua can pull current closed comps for any specific street.',
      },
      {
        q: 'What schools are zoned to Bent Creek?',
        a: 'Most Bent Creek addresses are zoned to Williamson County Schools — typically Sunset Elementary, Sunset Middle, and Nolensville High School — though zoning can vary by section. Always confirm against the current Williamson County Schools zoning map for the exact address.',
      },
      {
        q: 'Does Bent Creek have an HOA, and what does it cover?',
        a: 'Yes — an active HOA with annual dues covering multiple pools, the clubhouse, tennis courts, walking paths, and community events. Dues are generally considered reasonable for the amenity package.',
      },
      {
        q: 'Is the commute from Bent Creek to Cool Springs manageable?',
        a: 'Yes — most residents reach Cool Springs in 15-25 minutes depending on time of day. Nolensville Road (TN-31A) is the primary corridor; I-65 access via Concord Road in Brentwood adds an alternative. Joshua can walk through commute math for your specific employer.',
      },
      {
        q: 'How does Bent Creek compare to other Nolensville subdivisions?',
        a: 'Bent Creek is one of the largest and most established family subdivisions in Nolensville. Compared to newer communities like Burberry Glen, Bent Creek offers more mature trees, larger lots on average, and a longer-tenured resident base — at a comparable or marginally lower price point. Buyers prioritizing newer finishes lean toward newer Nolensville stock; buyers prioritizing mature, established neighborhood feel lean Bent Creek.',
      },
    ],
    schemaCity: 'Nolensville',
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
