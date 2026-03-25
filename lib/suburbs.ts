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
  // Buyer-side data
  buyerDescription?: string
  buyerWhyBullets?: string[]
  buyerFaqs?: { q: string; a: string }[]
  topNeighborhoods?: string[]
  schoolDistrict?: string
  commuteNote?: string
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
    buyerDescription: 'Franklin is one of the most competitive buyer markets in the Southeast — and for good reason. Top-rated schools, a thriving downtown, and strong appreciation make it a perennial target for buyers relocating from major metros. The 2026 median price sits at $650,000, with the most desirable neighborhoods — Cool Springs, Westhaven, Fieldstone Farms — moving fast. If you\'re buying in Franklin, preparation is everything: pre-approval before you tour, a local agent who knows which streets command a premium, and the ability to move decisively when the right home hits.',
    buyerWhyBullets: [
      'Off-market access: Joshua\'s Compass network surfaces Coming Soon and pocket listings before they hit Zillow — giving you first-look advantage in a market where good homes disappear quickly.',
      'Neighborhood-level intelligence: Franklin spans dozens of distinct subdivisions. Joshua knows which offer the best resale value, which are zoned to the highest-rated schools, and which have HOA restrictions that matter to your lifestyle.',
      'Negotiation in a seller\'s market: When you\'re competing against multiple offers, your agent\'s strategy is the differentiator. Joshua\'s offer structuring and escalation clause expertise consistently wins deals at or below asking.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Franklin, TN in 2026?', a: 'The median home price in Franklin is approximately $650,000. Entry-level homes in outer neighborhoods start around $450K; luxury properties in Westhaven or Governors Club run $1M+. The sweet spot for most buyers is $550K–$800K.' },
      { q: 'How competitive is the Franklin buyer market?', a: 'Very competitive. Well-priced homes in Franklin\'s top areas routinely receive multiple offers within days. Coming in with a clean pre-approval, flexible closing date, and strong earnest money significantly improves your position.' },
      { q: 'What are the best neighborhoods to buy in Franklin, TN?', a: 'It depends on your priorities. Westhaven offers walkability and community amenities. Fieldstone Farms balances price and location. Cool Springs is ideal for proximity to employment and retail. Joshua will match you to the right neighborhood based on budget, lifestyle, and investment goals.' },
      { q: 'How long does it take to buy a home in Franklin?', a: 'From active search to closing, most buyers are in their new home within 60–90 days. The search phase varies widely — competitive buyers who are pre-approved and decisive often find something in 2–4 weeks. Closing itself typically takes 30–45 days after contract.' },
    ],
    topNeighborhoods: ['Westhaven', 'Fieldstone Farms', 'Cool Springs', 'Crockett Park', 'Ladd Park'],
    schoolDistrict: 'Williamson County Schools',
    commuteNote: '20 min to downtown Nashville via I-65',
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
    buyerDescription: 'Brentwood sets the standard for luxury suburban living in Middle Tennessee. With a median price near $900,000, it attracts executives, physicians, and families who want exceptional schools, large lots, and a safe, established community. Inventory here is always limited — serious buyers need a pre-approval in hand and an agent with relationships. Homes in Governors Club, Otter Creek, and Annandale rarely last more than a few weeks. If Brentwood is your target, working with a local expert who can surface off-market opportunities is the edge that makes the difference.',
    buyerWhyBullets: [
      'Luxury market expertise: Joshua understands the nuances of Brentwood\'s premium subdivisions — HOA rules, lot premiums, and which streets hold value best. You\'re not just buying a home, you\'re making a $900K+ investment decision.',
      'Compass Private Exclusives: Joshua has access to Compass\'s exclusive off-market listings, giving Brentwood buyers first access to properties that never reach public portals.',
      'Relocation concierge: Many Brentwood buyers are corporate relocations. Joshua coordinates with relo companies, handles tight timelines, and makes the process seamless even when you\'re moving from out of state.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Brentwood, TN in 2026?', a: 'The median home price in Brentwood is approximately $900,000. Entry-level homes in Brentwood start around $650K; luxury estates in Governors Club or custom builds run $2M+.' },
      { q: 'What are the top neighborhoods to buy in Brentwood?', a: 'Governors Club for gated luxury and golf. Otter Creek for established tree-lined streets. Annandale for newer construction in the heart of Brentwood. Each offers a distinct lifestyle — Joshua can help you find the right fit.' },
      { q: 'Are Brentwood schools as good as advertised?', a: 'Yes. Brentwood Academy, Ravenwood High School, and the broader Williamson County school system consistently rank among the top in Tennessee and nationally. School assignment is a major value driver and Joshua factors it into every buyer consultation.' },
      { q: 'How do I compete in Brentwood\'s luxury market?', a: 'Preparation is everything. Have your financing tight (pre-approval or proof of funds), know your must-haves vs. nice-to-haves, and be ready to move when the right home appears. Joshua\'s off-market network also means you can find homes before the competition does.' },
    ],
    topNeighborhoods: ['Governors Club', 'Otter Creek', 'Annandale', 'Brentwood Hills', 'Murray Lane'],
    schoolDistrict: 'Williamson County Schools',
    commuteNote: '15 min to downtown Nashville via I-65',
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
    buyerDescription: 'Spring Hill is the smart buyer\'s play in 2026 — Williamson County schools, new construction communities, and a price point that still makes sense. With a median around $450,000, it\'s the most accessible entry into the Nashville suburban market. Buyers love the new neighborhoods, growing restaurant and retail scene, and the I-65 corridor that puts you in downtown Nashville in under 30 minutes. Competition is real here — Spring Hill attracts first-time buyers, move-up families, and out-of-state relocators in equal measure.',
    buyerWhyBullets: [
      'New construction navigation: Spring Hill has dozens of active builder communities. Joshua knows which builders deliver quality, which floor plans hold resale value, and how to negotiate upgrades and lot premiums that builders rarely advertise.',
      'School zone precision: The Williamson/Maury County line runs through Spring Hill — and it matters. Joshua will confirm your exact school assignment before you make an offer, not after.',
      'First-time buyer guidance: Many Spring Hill buyers are purchasing their first home. Joshua walks you through every step — inspection, negotiation, closing — with no surprises and no pressure.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Spring Hill, TN in 2026?', a: 'The median home price in Spring Hill is approximately $450,000. Entry-level new construction starts around $380K; larger homes with premium lots run $550K–$650K.' },
      { q: 'Should I buy new construction or resale in Spring Hill?', a: 'Both have advantages. New construction offers warranties, modern layouts, and customization — but builder timelines can be long and lots are often small. Resale homes offer established landscaping, larger lots, and faster move-in. Joshua can walk you through both options side-by-side.' },
      { q: 'Which part of Spring Hill is in Williamson County schools?', a: 'The northern portion of Spring Hill (ZIP 37174) is generally Williamson County Schools; southern sections may fall under Maury County. This distinction can affect home values by $20K–$40K. Joshua verifies school assignment for every home before you tour.' },
      { q: 'Is Spring Hill a good investment?', a: 'Spring Hill has seen 5%+ annual appreciation in recent years and continues to attract new employers and residents. It remains one of the best value-to-appreciation opportunities in Middle Tennessee.' },
    ],
    topNeighborhoods: ['Autumn Ridge', 'Bridgemore Village', 'Kedron Village', 'Tollgate Village', 'Port Royal Place'],
    schoolDistrict: 'Williamson County Schools (north) / Maury County (south)',
    commuteNote: '30 min to downtown Nashville via I-65',
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
    buyerDescription: 'Nolensville offers something increasingly rare in Middle Tennessee: small-town charm inside Williamson County. With a median price around $580,000, it sits between Franklin and Spring Hill in both price and character. Buyers are drawn to the established neighborhoods, top-tier schools, charming downtown, and the tight-knit community feel that larger suburbs can\'t replicate. Homes move fast here — averaging just 22 days on market — so buyers need to be pre-approved and decisive.',
    buyerWhyBullets: [
      'Hyperlocal subdivision knowledge: Nolensville has distinct neighborhoods — Bent Creek, Scales Farmstead, Benington — each with different price points and community feel. Joshua knows them all intimately and will match you to the right one.',
      'Speed advantage: Nolensville homes sell quickly. Joshua sets up instant MLS alerts and can typically get you into a showing within hours of a new listing hitting the market.',
      'Community connection: Nolensville is a small town — and Joshua is plugged into it. Off-market deals, coming-soon properties, and word-of-mouth opportunities come through relationships, not just the MLS.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Nolensville, TN in 2026?', a: 'The median home price in Nolensville is approximately $580,000, with price per square foot around $228. Larger homes in premium subdivisions regularly exceed $700K.' },
      { q: 'How competitive is the Nolensville housing market?', a: 'Very competitive. With only 22 average days on market, desirable homes often receive multiple offers. Having your financing ready and a decisive mindset is critical. Joshua will help you build offers that win without overpaying.' },
      { q: 'What are the best neighborhoods in Nolensville for families?', a: 'Bent Creek and Scales Farmstead are popular for families with strong community amenities and top school assignments. Benington offers newer construction at a slight premium. Joshua will show you options based on your budget and priorities.' },
      { q: 'Is Nolensville still growing?', a: 'Yes, but more slowly than Spring Hill or Thompson\'s Station. That controlled growth is actually a selling point — Nolensville has managed development carefully to preserve its character, which supports long-term value.' },
    ],
    topNeighborhoods: ['Bent Creek', 'Scales Farmstead', 'Benington', 'Winterset Woods', 'Nolen Mill'],
    schoolDistrict: 'Williamson County Schools',
    commuteNote: '25 min to downtown Nashville via Nolensville Pike',
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
    buyerDescription: "Thompson's Station is Williamson County's best-kept secret for buyers who want space and schools without the Franklin price tag. At a median of $420,000, it's the most affordable Williamson County entry point — and it's appreciating faster than anywhere else in the area at nearly 6% year-over-year. Many homes sit on half-acre to multi-acre lots, offering privacy that's impossible to find in denser suburbs. If you're a buyer who wants land, quality schools, and long-term upside, this is the market to be in.",
    buyerWhyBullets: [
      "Value play with upside: Thompson's Station offers the lowest price-per-square-foot in Williamson County while delivering the same school district as Franklin and Brentwood. Joshua helps buyers understand exactly what they're getting and why the appreciation trajectory is compelling.",
      'Land expertise: Evaluating acreage, well/septic systems, and rural property nuances requires specialized knowledge. Joshua has hands-on experience with Thompson\'s Station\'s larger-lot inventory and can guide you through inspections and due diligence.',
      "Growth timing: Development is moving south along I-65. Buyers who get into Thompson's Station now are ahead of the curve — Joshua can show you which areas are positioned for the most upside as infrastructure catches up.",
    ],
    buyerFaqs: [
      { q: "What is the average home price in Thompson's Station, TN in 2026?", a: "The median home price is approximately $420,000 — the most affordable Williamson County option. Entry-level homes start around $350K; larger properties on acreage run $500K–$700K+" },
      { q: "Is Thompson's Station a good place to buy?", a: "For buyers seeking space, schools, and value, it's one of the best opportunities in Middle Tennessee right now. Nearly 6% year-over-year appreciation, Williamson County schools, and a rural character that's increasingly scarce." },
      { q: "What should I know about buying a home with a well and septic in Thompson's Station?", a: "Many homes use private well and septic. Before closing, Joshua recommends a septic inspection and water quality test. These aren't dealbreakers — they're standard — but knowing their condition protects you from post-closing surprises." },
      { q: "How far is Thompson's Station from Nashville?", a: "About 35–40 minutes from downtown Nashville via I-65, depending on traffic. Many buyers find it a reasonable commute given the price and space advantages. Franklin is only 10–15 minutes north." },
    ],
    topNeighborhoods: ['Bridgewater', 'Tollgate', 'Laurelbrook', 'Southbrooke', 'Rural acreage tracts'],
    schoolDistrict: 'Williamson County Schools',
    commuteNote: '35 min to downtown Nashville via I-65',
  },
}

export function getSuburb(slug: string): Suburb | undefined {
  return suburbs[slug]
}

export function getAllSuburbSlugs(): string[] {
  return Object.keys(suburbs)
}
