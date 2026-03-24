export type Suburb = {
  slug: string
  name: string
  displayName: string
  county: string
  medianPrice: string
  medianPriceNum: number
  avgDaysOnMarket: number
  pricePerSqft: number
  yoyChange: string
  description: string
  whyBullets: string[]
  faqs: { q: string; a: string }[]
  schemaCity: string
  schemaState: string
  schemaZip: string
}

export const suburbs: Record<string, Suburb> = {
  'franklin-tn': {
    slug: 'franklin-tn',
    name: 'Franklin',
    displayName: 'Franklin, TN',
    county: 'Williamson County',
    medianPrice: '$650,000',
    medianPriceNum: 650000,
    avgDaysOnMarket: 21,
    pricePerSqft: 248,
    yoyChange: '+4.2%',
    description:
      'Franklin, Tennessee is one of the most desirable suburbs in the entire Southeast. Anchored by a charming historic downtown, top-rated schools, and easy access to I-65, Franklin consistently ranks among the best places to live and invest in the country. The local real estate market has shown remarkable resilience — median home prices have climbed to $650,000 in 2026, driven by continued corporate relocations, limited inventory, and overwhelming buyer demand from out-of-state movers. Sellers in Franklin are well-positioned: well-maintained homes priced correctly are routinely fielding multiple offers within the first weekend.',
    whyBullets: [
      'Deep buyer network: Joshua works directly with buyers relocating from Atlanta, Dallas, and Chicago who are actively searching in Franklin — your home gets shown to qualified buyers before it ever hits Zillow.',
      'Franklin-specific pricing expertise: From Cool Springs condos to Fieldstone Farms single-family homes, Joshua knows how hyperlocal factors (school zone, HOA, subdivision prestige) affect your final sale price.',
      'Compass Coming Soon advantage: Your listing can be marketed to Compass\'s exclusive network before public MLS launch, generating early buzz and often pre-market offers at strong prices.',
    ],
    faqs: [
      {
        q: 'How much is my Franklin, TN home worth in 2026?',
        a: 'The median home price in Franklin is currently around $650,000, with price per square foot running approximately $248. However, your home\'s actual value depends on specific neighborhood, condition, updates, lot size, and school assignment. Joshua will pull the most recent sold comps within a half-mile of your address for a precise, defensible number.',
      },
      {
        q: 'How long does it take to sell a home in Franklin?',
        a: 'Well-priced homes in Franklin are averaging about 21 days on market in 2026. Homes in top school zones and updated interiors often sell in a weekend. The key is professional photography, accurate pricing, and launching on a Thursday to capture weekend traffic.',
      },
      {
        q: 'What are closing costs for sellers in Franklin, TN?',
        a: 'Tennessee sellers typically pay 1–2% in closing costs (title, transfer tax, prorated taxes) plus the real estate commission. Joshua can give you a net sheet — a side-by-side estimate of what you\'ll walk away with at different price points — so there are zero surprises at the closing table.',
      },
      {
        q: 'Should I make repairs before listing my Franklin home?',
        a: 'It depends on scope and your timeline. Minor cosmetic updates — paint, landscaping, light fixtures — almost always yield a return. Major systems (roof, HVAC) should be disclosed if known issues exist. Joshua will walk through your home and give you an honest list of what will move the needle vs. what\'s not worth the spend.',
      },
    ],
    schemaCity: 'Franklin',
    schemaState: 'TN',
    schemaZip: '37064',
  },

  'brentwood-tn': {
    slug: 'brentwood-tn',
    name: 'Brentwood',
    displayName: 'Brentwood, TN',
    county: 'Williamson County',
    medianPrice: '$900,000',
    medianPriceNum: 900000,
    avgDaysOnMarket: 26,
    pricePerSqft: 312,
    yoyChange: '+3.8%',
    description:
      'Brentwood, Tennessee carries a reputation as one of the wealthiest ZIP codes in the South — and the data backs it up. With a 2026 median home price approaching $900,000 and some of the highest-performing schools in the state, Brentwood attracts executives, professionals, and families who want space, safety, and community. The market here rewards sellers who present correctly: buyers at this price point have high expectations for condition, finishes, and marketing. Working with the right agent isn\'t just helpful in Brentwood — it directly impacts your final number. Inventory remains tight relative to demand, keeping the market squarely in seller-favoring territory.',
    whyBullets: [
      'Luxury listing experience: Joshua markets Brentwood homes with professional HDR photography, 3D virtual tours, and targeted digital ads — the standard buyers at this price point expect and the presentation that generates competitive offers.',
      'Executive relocation network: A significant share of Brentwood buyers are corporate transferees with company relocation packages. Joshua\'s connections with relo coordinators keep your listing in front of buyers who are pre-approved and motivated.',
      'Negotiation at a high-dollar level: At $900K+, each point of negotiation represents $9,000+ to your bottom line. Joshua\'s track record of 97%+ list-to-sale ratios means you\'re not leaving money on the table.',
    ],
    faqs: [
      {
        q: 'What is my Brentwood, TN home worth in 2026?',
        a: 'The median sale price in Brentwood has reached approximately $900,000 in 2026, with price per square foot near $312. Luxury homes in established neighborhoods like Governors Club, Otter Creek, or Annandale may command a premium. Joshua conducts a thorough comparative market analysis using recent closed sales within your specific subdivision — not just city-wide averages.',
      },
      {
        q: 'How competitive is the Brentwood real estate market?',
        a: 'Brentwood remains a seller\'s market in 2026. Inventory is limited relative to buyer demand, and well-presented homes priced correctly are selling in 3–4 weeks on average. Move-in ready homes with updated kitchens and primary suites are generating the most activity.',
      },
      {
        q: 'Are there HOA considerations when selling in Brentwood?',
        a: 'Many Brentwood subdivisions have active HOAs. Sellers must typically provide HOA disclosures, current dues statements, and any outstanding violation letters. Joshua can walk you through what documentation to gather before listing so nothing slows down your closing.',
      },
      {
        q: 'Do I need to stage my Brentwood home?',
        a: 'At the $800K–$1.2M price point, professional staging or at minimum a pre-listing consultation is highly recommended. Joshua partners with local staging professionals and can coordinate at a preferred rate. Staged homes in this price range consistently sell faster and at higher prices than vacant or unstaged alternatives.',
      },
    ],
    schemaCity: 'Brentwood',
    schemaState: 'TN',
    schemaZip: '37027',
  },

  'spring-hill-tn': {
    slug: 'spring-hill-tn',
    name: 'Spring Hill',
    displayName: 'Spring Hill, TN',
    county: 'Williamson / Maury County',
    medianPrice: '$450,000',
    medianPriceNum: 450000,
    avgDaysOnMarket: 28,
    pricePerSqft: 192,
    yoyChange: '+5.1%',
    description:
      'Spring Hill is one of the fastest-growing cities in Tennessee — and that growth is showing up in real estate values. Straddling the Williamson/Maury County line, Spring Hill offers new construction communities, highly rated Williamson County schools, and a more attainable entry point than Franklin or Brentwood without sacrificing convenience. The 2026 median home price is approximately $450,000, representing some of the strongest year-over-year appreciation in Middle Tennessee. Buyers love Spring Hill\'s mix of newer neighborhoods, growing retail and dining scene, and quick access to I-65. If you own here, you own in a market that continues to attract first-time buyers and move-up purchasers in equal measure — making your exit strategy strong.',
    whyBullets: [
      'High-volume market expertise: Spring Hill\'s rapid growth means Joshua has navigated dozens of transactions across the newest subdivisions — from Autumn Ridge to Bridgemore Village — with intimate knowledge of which communities command the strongest resale premiums.',
      'Move-up buyer pipeline: Many Spring Hill sellers are upgrading to larger homes in Franklin or Brentwood. Joshua often represents both sides of that transaction chain, giving him insight into what motivated buyers in your price range are actively searching for.',
      'New construction competition strategy: With builder inventory nearby, proper pricing and condition are critical. Joshua knows how to position your resale home to compete with — and beat — model homes down the street.',
    ],
    faqs: [
      {
        q: 'How much is my Spring Hill, TN home worth in 2026?',
        a: 'Spring Hill\'s median home price is approximately $450,000 in 2026, with price per square foot around $192. Homes in Williamson County school zones often carry a noticeable premium over those zoned to Maury County. Joshua will pinpoint exactly where your home sits and price accordingly.',
      },
      {
        q: 'How does new construction affect my home\'s value in Spring Hill?',
        a: 'Active builder communities can create competition, especially at similar price points. The good news: resale homes often offer larger lots, mature landscaping, and established community features that new construction can\'t match. Joshua knows how to position and market your specific advantages.',
      },
      {
        q: 'Is Spring Hill a buyer\'s or seller\'s market in 2026?',
        a: 'Spring Hill still leans seller-favorable, though inventory has increased slightly with new construction deliveries. Well-priced, well-presented resale homes are averaging 28 days on market. Homes priced at or below the median are seeing the strongest activity and most competitive offer situations.',
      },
      {
        q: 'What school zone am I in and does it matter?',
        a: 'Absolutely. School zone (Williamson vs. Maury County) can affect your home\'s value by $20,000–$40,000 or more. Joshua will confirm your exact school assignment and incorporate that into your pricing strategy and marketing — it\'s a major selling point for family buyers.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    schemaZip: '37174',
  },

  'nolensville-tn': {
    slug: 'nolensville-tn',
    name: 'Nolensville',
    displayName: 'Nolensville, TN',
    county: 'Williamson County',
    medianPrice: '$580,000',
    medianPriceNum: 580000,
    avgDaysOnMarket: 22,
    pricePerSqft: 228,
    yoyChange: '+4.7%',
    description:
      'Nolensville has quietly become one of the most sought-after communities in Williamson County. What was once a quiet bedroom community has grown into a vibrant suburban town with top-tier schools, charming small-town character, and real estate prices to match the demand. The 2026 median home price in Nolensville sits around $580,000 — a number that reflects both Williamson County\'s premium reputation and the community\'s unique appeal to buyers who want space and quality without the congestion of Franklin or Brentwood. Homes here move quickly when priced right: the average days on market is just 22 days, and multiple-offer situations remain common for desirable properties. If you\'re considering selling in Nolensville, 2026 is a compelling moment.',
    whyBullets: [
      'Nolensville neighborhood intelligence: From Bent Creek to Scales Farmstead to Benington, Joshua knows how subdivision location, lot backing, and community amenities translate to buyer willingness to pay — and he\'ll leverage that in your favor.',
      'Small-town feel, big-city marketing: Nolensville buyers often hear about listings through word-of-mouth and community networks. Joshua is active in this market and can generate pre-listing buzz through his buyer pipeline before you even hit the MLS.',
      'Williamson County school premium: Joshua consistently highlights school ratings in all Nolensville marketing materials, because buyers actively filter by school zone. Your listing gets seen by the right families.',
    ],
    faqs: [
      {
        q: 'What is my Nolensville, TN home worth in 2026?',
        a: 'The median sale price in Nolensville is approximately $580,000 in 2026, with price per square foot near $228. Homes in newer subdivisions with premium lots, 4+ bedrooms, and community pools are consistently selling above median. Joshua will run comps specific to your street and subdivision for an accurate valuation.',
      },
      {
        q: 'How quickly are homes selling in Nolensville right now?',
        a: 'Homes in Nolensville are averaging just 22 days on market in early 2026 — one of the tightest in the region. Correctly priced, well-presented homes in desirable subdivisions are still seeing multiple offers, especially in the $500K–$650K range.',
      },
      {
        q: 'What makes Nolensville different from Franklin or Brentwood for sellers?',
        a: 'Nolensville offers a slightly lower price point than Franklin or Brentwood, which actually expands your buyer pool significantly. You attract both move-up buyers from Spring Hill and buyers priced out of Brentwood — giving you more competition and stronger offers.',
      },
      {
        q: 'Are there any upcoming developments that could affect my home\'s value?',
        a: 'Nolensville has ongoing commercial and residential development. Some areas benefit from new retail and dining; others may face increased traffic. Joshua stays current on local planning and can advise on how upcoming changes affect your listing timing.',
      },
    ],
    schemaCity: 'Nolensville',
    schemaState: 'TN',
    schemaZip: '37135',
  },

  'thompsons-station-tn': {
    slug: 'thompsons-station-tn',
    name: "Thompson's Station",
    displayName: "Thompson's Station, TN",
    county: 'Williamson County',
    medianPrice: '$420,000',
    medianPriceNum: 420000,
    avgDaysOnMarket: 30,
    pricePerSqft: 182,
    yoyChange: '+5.8%',
    description:
      "Thompson's Station is one of Middle Tennessee's best-kept secrets — and that's starting to change. Located just south of Spring Hill along the I-65 corridor in Williamson County, Thompson's Station offers the county's prized school district, acreage lots not found elsewhere at this price point, and a rural character that's increasingly rare as the region grows. The 2026 median home price is approximately $420,000, making it one of the most affordable entry points into Williamson County real estate. Year-over-year appreciation is running nearly 6% — the strongest of any of the communities in this area. Buyers are actively seeking Thompson's Station for its space, its schools, and its value relative to neighboring Franklin and Spring Hill. If you own here, you own something buyers are genuinely competing for.",
    whyBullets: [
      "Williamson County at a discount: Joshua positions Thompson's Station homes as the smart buyer's path into the county's school district — a compelling message that attracts motivated, qualified buyers actively comparing you to pricier alternatives.",
      "Land and space story: Many Thompson's Station homes sit on larger lots — sometimes half an acre to several acres. Joshua knows how to market this lifestyle advantage, especially to buyers moving from urban markets where space is scarce.",
      "Growth trajectory marketing: Joshua highlights the area's appreciation trend and development pipeline to buyers who are thinking long-term, converting them from 'maybe' to 'offer submitted' faster.",
    ],
    faqs: [
      {
        q: "What is my Thompson's Station, TN home worth in 2026?",
        a: "The median sale price in Thompson's Station is approximately $420,000 in 2026, with price per square foot near $182. Homes with larger lots, updated kitchens, and primary-level living often sell at a notable premium to area medians. Joshua will pull recent sold comparables within your specific area for an accurate, defensible valuation.",
      },
      {
        q: "Is Thompson's Station growing in popularity?",
        a: "Yes — significantly. Thompson's Station is seeing some of the strongest appreciation in Williamson County, with year-over-year price gains around 5.8% in early 2026. Buyers priced out of Franklin and Spring Hill are actively looking here, and inventory remains tight.",
      },
      {
        q: "How does acreage affect my home's value in Thompson's Station?",
        a: 'Land is a meaningful value driver in this market. Homes on half-acre or larger lots command a premium, particularly as buyers increasingly seek privacy and outdoor space. Joshua understands how to appraise and market land value in a way that resonates with buyers coming from more densely developed areas.',
      },
      {
        q: "What should I know about selling a home with a septic system or well?",
        a: "Many Thompson's Station homes use private well and septic rather than municipal utilities. Buyers may request inspections of both systems. Joshua recommends a pre-listing septic inspection if your system is older — it's far easier to address issues before a buyer's contingency than during contract negotiations.",
      },
    ],
    schemaCity: "Thompson's Station",
    schemaState: 'TN',
    schemaZip: '37179',
  },
}

export function getSuburb(slug: string): Suburb | undefined {
  return suburbs[slug]
}

export function getAllSuburbSlugs(): string[] {
  return Object.keys(suburbs)
}
