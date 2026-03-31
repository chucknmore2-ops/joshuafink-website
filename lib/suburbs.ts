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

  'nashville-tn': {
    slug: 'nashville-tn',
    name: 'Nashville',
    displayName: 'Nashville, TN',
    county: 'Davidson County',
    medianPrice: '$425,000',
    medianPriceNum: 425000,
    avgDaysOnMarket: 32,
    pricePerSqft: 245,
    yoyChange: '+3.1%',
    description: 'Nashville is the engine that drives Middle Tennessee real estate — and the city\'s housing market reflects its status as one of the fastest-growing metros in the country. With a 2026 median home price of $425,000, Nashville offers more entry points than its suburbs, with a wildly diverse range of neighborhoods: from the luxury high-rises of Gulch and SoBro to the charming bungalows of East Nashville, Germantown, and 12 South. The market rewards sellers who know their micro-market — price per square foot and days on market vary dramatically by zip code and neighborhood. Working with a Nashville agent who understands hyperlocal dynamics isn\'t just helpful — it\'s the difference between leaving money on the table and maximizing your return.',
    whyBullets: [
      'Neighborhood-level pricing intelligence: Nashville has dozens of distinct submarkets. Joshua understands how East Nashville differs from Sylvan Park, how 12 South compares to Wedgewood-Houston, and how to price your specific home in your specific neighborhood for maximum return.',
      'Deep buyer network: Nashville attracts buyers from across the country — tech workers, healthcare professionals, entertainment industry relocators. Joshua\'s Compass network connects your listing to these motivated, pre-approved buyers.',
      'Investment property expertise: Nashville\'s strong rental market makes it a top target for investors. Joshua understands the investment angle and can help you position your property to attract both owner-occupant and investor buyers — widening your pool.',
    ],
    faqs: [
      { q: 'What is my Nashville, TN home worth in 2026?', a: 'Nashville\'s median home price is approximately $425,000 in 2026, but values vary enormously by neighborhood. A home in East Nashville or 12 South may trade at $300–$400/sqft, while Germantown or Gulch condos can exceed $500/sqft. Joshua will pull neighborhood-specific comps for an accurate valuation.' },
      { q: 'Which Nashville neighborhoods are appreciating fastest?', a: 'Historically, East Nashville, Wedgewood-Houston, and Sylvan Park have led appreciation. Emerging areas like Bordeaux, North Nashville, and parts of Madison are showing strong momentum in 2026 as buyers seek value within city limits.' },
      { q: 'Is Nashville still a good time to sell?', a: 'Yes. Nashville\'s market has moderated from its 2021-2022 peak but remains firmly seller-favorable. Inventory is below pre-pandemic levels, corporate relocations continue, and demand from out-of-state buyers remains strong. Well-priced homes in desirable neighborhoods are still selling in 3-5 weeks.' },
      { q: 'What are closing costs for Nashville sellers?', a: 'Tennessee sellers typically pay 1-2% in closing costs plus commission. Nashville\'s transfer tax is $0.37 per $100 of value. Joshua provides a detailed net sheet before you list so you know exactly what you\'ll walk away with.' },
    ],
    schemaCity: 'Nashville',
    schemaState: 'TN',
    schemaZip: '37201',
    buyerDescription: 'Nashville offers something its suburbs can\'t: energy, culture, and urban lifestyle — all in one of the fastest-growing cities in America. Whether you\'re eyeing a craftsman bungalow in East Nashville, a modern townhome in Germantown, or a condo in the Gulch, the city has options at every price point. The 2026 median is $425,000, but entry-level condos start around $250K and luxury penthouses top $3M. Nashville buyers need to move fast — the best neighborhoods are competitive — and they need an agent who knows the difference between a value play and an overpriced flip.',
    buyerWhyBullets: [
      'Neighborhood expertise: Nashville\'s submarkets are dramatically different in character, price, and lifestyle. Joshua knows which streets in East Nashville are gentrifying, which 12 South blocks have the best walkability, and where the next Germantown is emerging.',
      'Investment lens: Many Nashville buyers are thinking about short-term rental potential, appreciation upside, or house hacking. Joshua understands the investment angle and can help you evaluate any property through that lens.',
      'Compass Coming Soon access: Nashville\'s most desirable neighborhoods have tight inventory. Joshua\'s Compass network surfaces off-market and pre-market listings before they hit Zillow — critical in a competitive market.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Nashville, TN in 2026?', a: 'The median is approximately $425,000, but it varies dramatically by neighborhood. East Nashville and 12 South run $450K–$700K+. Emerging areas like Bordeaux or parts of Madison offer entry points under $350K.' },
      { q: 'What are the best Nashville neighborhoods to buy in?', a: 'It depends on your lifestyle and budget. East Nashville for walkability and character. Germantown for luxury and history. 12 South for boutique shopping and restaurants. Sylvan Park for family-friendly and undervalued. Joshua will match you to the right neighborhood.' },
      { q: 'Can I short-term rent (Airbnb) in Nashville?', a: 'Nashville has regulations on short-term rentals that vary by property type and zone. Owner-occupied STRs are generally permitted with a permit; non-owner-occupied STRs have stricter rules. Joshua can help you evaluate a property\'s STR viability before you buy.' },
      { q: 'How competitive is the Nashville buyer market in 2026?', a: 'Competitive in desirable areas. East Nashville, 12 South, and Germantown see multiple offers on well-priced homes. Having pre-approval ready and a decisive mindset is essential. Less competitive in emerging neighborhoods where the value opportunity is higher.' },
    ],
    topNeighborhoods: ['East Nashville', '12 South', 'Germantown', 'Sylvan Park', 'Wedgewood-Houston', 'The Gulch'],
    schoolDistrict: 'Metro Nashville Public Schools',
    commuteNote: 'Urban core — walkable/bikeable to many areas',
  },

  'murfreesboro-tn': {
    slug: 'murfreesboro-tn',
    name: 'Murfreesboro',
    displayName: 'Murfreesboro, TN',
    county: 'Rutherford County',
    medianPrice: '$380,000',
    medianPriceNum: 380000,
    avgDaysOnMarket: 35,
    pricePerSqft: 168,
    yoyChange: '+4.8%',
    description: 'Murfreesboro is one of the fastest-growing cities in Tennessee — and its real estate market tells the story. With a 2026 median home price of $380,000 and strong year-over-year appreciation near 5%, Murfreesboro offers buyers and sellers one of the best value propositions in Middle Tennessee. Home to MTSU and a massive healthcare employment base, the city draws young professionals, families, and investors in equal measure. Sellers benefit from a steady stream of demand driven by Murfreesboro\'s continued population growth — the city has been among the fastest-growing in the U.S. for over a decade and shows no signs of slowing.',
    whyBullets: [
      'Rutherford County market mastery: Murfreesboro spans diverse price points and neighborhoods — from starter homes near MTSU to executive properties in Oaklands and newer luxury builds in the northeast corridor. Joshua knows where value lives and how to position your home against the right competition.',
      'Growth corridor positioning: Murfreesboro\'s I-24 corridor is a major employment and commercial hub. Joshua understands how proximity to the medical center district, Amazon facilities, and downtown square affects your home\'s value and buyer appeal.',
      'Investor-aware marketing: A significant share of Murfreesboro buyers are investors targeting the strong rental market. Joshua knows how to present rental metrics alongside traditional MLS marketing to attract this buyer segment and drive competitive offers.',
    ],
    faqs: [
      { q: 'What is my Murfreesboro, TN home worth in 2026?', a: 'The median home price in Murfreesboro is approximately $380,000. Homes in established neighborhoods like Oaklands or newer developments in the northeast command a premium; starter homes near MTSU offer lower entry points. Joshua will pull specific comps for your address.' },
      { q: 'Is Murfreesboro still growing?', a: 'Significantly. Murfreesboro has been one of the fastest-growing cities in the U.S. for over a decade. New employers, the MTSU effect, and proximity to Nashville continue to drive demand. Population growth translates directly to housing demand — a favorable tailwind for sellers.' },
      { q: 'How does the MTSU rental market affect home values?', a: 'Rental demand near MTSU creates a strong investor buyer pool for certain price points. This is a positive for sellers — it adds another layer of buyer demand beyond traditional owner-occupants. Joshua can help you identify if your home is positioned to attract this segment.' },
      { q: 'How far is Murfreesboro from Nashville?', a: 'About 35 miles southeast of Nashville via I-24 — typically 35-45 minutes without traffic. Many residents commute to Nashville for work. The distance creates an attractive price-to-space ratio that continues to draw buyers from the Nashville metro.' },
    ],
    schemaCity: 'Murfreesboro',
    schemaState: 'TN',
    schemaZip: '37129',
    buyerDescription: 'Murfreesboro is the value play for buyers who want space, good schools, and strong appreciation without the Williamson County price tag. At a median of $380,000, it\'s one of the most affordable markets in the Nashville metro with one of the highest appreciation rates. MTSU, a massive healthcare employment base, and a booming downtown square make it a genuinely livable city — not just a suburb. Buyers who get in now are ahead of a growth curve that shows no signs of stopping.',
    buyerWhyBullets: [
      'Value maximization: Murfreesboro offers more square footage per dollar than any Nashville suburb. Joshua helps buyers understand the price-to-value equation and find properties with the best upside in the market.',
      'Investment potential: Murfreesboro\'s strong rental market — driven by MTSU and healthcare employment — makes it attractive for house hackers and investors. Joshua evaluates every property through both an owner-occupant and investor lens.',
      'Growth trajectory knowledge: Not all Murfreesboro neighborhoods appreciate equally. Joshua tracks which corridors are improving fastest and can steer you toward the best long-term positions.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Murfreesboro, TN in 2026?', a: 'The median is approximately $380,000. Entry-level homes start around $280K; newer construction in the northeast corridor runs $450K–$550K.' },
      { q: 'What are the best Murfreesboro neighborhoods?', a: 'Oaklands for established, tree-lined streets and proximity to the historic district. Northeast Murfreesboro for newer construction and top schools. Near downtown for walkability and the growing restaurant/bar scene. Joshua will match you based on your priorities.' },
      { q: 'Are Rutherford County schools good?', a: 'Rutherford County Schools has several highly-rated schools, particularly in the northeast and established suburban areas. Specific school assignments vary significantly by address — Joshua verifies school assignment for every home before you tour.' },
      { q: 'Is Murfreesboro a good investment?', a: 'One of the best in Middle Tennessee. Strong population growth, MTSU rental demand, healthcare employment, and an affordable entry point make it a compelling buy-and-hold market. Appreciation has run nearly 5% year-over-year.' },
    ],
    topNeighborhoods: ['Oaklands', 'Northfield', 'Ellendale', 'Blackman', 'Downtown Murfreesboro'],
    schoolDistrict: 'Rutherford County Schools',
    commuteNote: '35 min to Nashville via I-24',
  },

  'gallatin-tn': {
    slug: 'gallatin-tn',
    name: 'Gallatin',
    displayName: 'Gallatin, TN',
    county: 'Sumner County',
    medianPrice: '$350,000',
    medianPriceNum: 350000,
    avgDaysOnMarket: 38,
    pricePerSqft: 158,
    yoyChange: '+5.5%',
    description: 'Gallatin is having a moment. One of the most affordable entry points into the Nashville metro, Gallatin has seen dramatic appreciation — nearly 5.5% year-over-year — as buyers priced out of Williamson County and Davidson County increasingly look north to Sumner County. The 2026 median home price is approximately $350,000, making it the value choice for families and first-time buyers who want space and community without the premium prices of Franklin or Brentwood. Gallatin offers a genuine small-town feel with a growing downtown, lakefront access to Old Hickory Lake, and easy access to Hendersonville and the Gallatin Pike corridor to Nashville.',
    whyBullets: [
      'Sumner County value positioning: Gallatin buyers are often comparing against Hendersonville and Madison. Joshua understands how to price and position your home in this competitive set and attract the motivated buyers flowing north from Davidson County.',
      'Old Hickory Lake premium: Waterfront and lake-access properties in Gallatin command a significant premium. Joshua has experience marketing these lifestyle properties and knows how to attract the specific buyer profile that pays top dollar for lake living.',
      'First-time buyer pipeline: Gallatin attracts a high volume of first-time buyers. Joshua\'s experience guiding first-time buyers through the process — from pre-approval to closing — means your listing gets shown to qualified, motivated buyers who are ready to move.',
    ],
    faqs: [
      { q: 'What is my Gallatin, TN home worth in 2026?', a: 'The median home price in Gallatin is approximately $350,000. Waterfront or lake-access properties on Old Hickory Lake can command significant premiums above median. Joshua will pull recent sold comps specific to your neighborhood and property type.' },
      { q: 'Is Gallatin growing?', a: 'Yes — rapidly. Gallatin is one of the fastest-growing cities in Sumner County, driven by affordability relative to the Nashville core and ongoing infrastructure investment. The I-265 connector project is expected to improve commute times significantly.' },
      { q: 'What makes Gallatin different from Hendersonville?', a: 'Gallatin tends to be slightly more affordable than Hendersonville with a stronger small-town downtown feel. Hendersonville has more established retail and amenities. Both are in Sumner County with similar school systems. Joshua can help you understand how the differences affect value.' },
      { q: 'How far is Gallatin from Nashville?', a: 'About 30 miles northeast of Nashville — typically 35-45 minutes via US-31E or Vietnam Veterans Blvd. The planned I-265 connector will improve this commute significantly when completed.' },
    ],
    schemaCity: 'Gallatin',
    schemaState: 'TN',
    schemaZip: '37066',
    buyerDescription: 'Gallatin is where smart buyers are going in 2026. At a median of $350,000 — the lowest entry point in the Nashville metro with access to Old Hickory Lake — it offers space, community, and one of the strongest appreciation rates in Middle Tennessee at 5.5% year-over-year. Buyers who moved here 3-5 years ago are sitting on significant equity. Those buying now are positioned for the next wave of growth as Nashville\'s sprawl continues northeast and the I-265 connector project improves commute times.',
    buyerWhyBullets: [
      'Best value in the metro: Gallatin offers the lowest price-per-square-foot of any Nashville suburb while delivering the lifestyle and community buyers want. Joshua helps you find the right property in the right pocket to maximize your upside.',
      'Lake access expertise: Old Hickory Lake waterfront and lake-access properties require specific due diligence — dock permits, flood zones, shoreline restrictions. Joshua knows what to look for and how to evaluate lake properties correctly.',
      'Growth timing: Gallatin is at an inflection point. The I-265 connector will change commute math significantly. Buyers who get in before that project completes are buying ahead of a likely appreciation surge.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Gallatin, TN in 2026?', a: 'The median is approximately $350,000 — one of the most affordable in the Nashville metro. Entry-level homes start under $280K; waterfront properties on Old Hickory Lake run $500K–$1M+.' },
      { q: 'Are there good schools in Gallatin?', a: 'Sumner County Schools serves Gallatin with several well-regarded schools. Station Camp High School is particularly well-rated. Joshua verifies school assignment for every home before you make an offer.' },
      { q: 'Can I find waterfront homes in Gallatin?', a: 'Yes — Old Hickory Lake has significant waterfront and lake-access inventory in and around Gallatin. These properties require specific inspection considerations (dock permits, flood zones, septic on waterfront). Joshua has experience navigating waterfront purchases in this market.' },
      { q: 'Is Gallatin a good long-term investment?', a: 'Strong case for it. Affordability relative to the metro, consistent 5%+ appreciation, lakefront lifestyle appeal, and the coming I-265 infrastructure improvement all support a positive outlook. One of the best value propositions in Middle Tennessee.' },
    ],
    topNeighborhoods: ['Station Camp', 'Lakeside', 'Sanders Ferry', 'Downtown Gallatin', 'Wynbrooke'],
    schoolDistrict: 'Sumner County Schools',
    commuteNote: '35-45 min to Nashville via US-31E',
  },

  'hendersonville-tn': {
    slug: 'hendersonville-tn',
    name: 'Hendersonville',
    displayName: 'Hendersonville, TN',
    county: 'Sumner County',
    medianPrice: '$410,000',
    medianPriceNum: 410000,
    avgDaysOnMarket: 30,
    pricePerSqft: 178,
    yoyChange: '+4.3%',
    description: 'Hendersonville is Sumner County\'s crown jewel — a well-established community with lakefront living on Old Hickory Lake, strong schools, and a market that consistently outperforms surrounding areas. The 2026 median home price is approximately $410,000, reflecting Hendersonville\'s reputation as a desirable, family-friendly community with strong infrastructure and a loyal buyer base. Homes here sell faster than in neighboring Gallatin — averaging 30 days on market — due to the combination of established amenities, school quality, and lake lifestyle. Hendersonville sellers benefit from a steady stream of Nashville metro buyers willing to pay a premium for what the community offers.',
    whyBullets: [
      'Established community premium: Hendersonville\'s mature neighborhoods, established schools, and lake lifestyle create consistent buyer demand. Joshua knows how to position your home to capture the premium buyers are willing to pay for the Hendersonville address.',
      'Old Hickory Lake expertise: Lakefront and lake-access properties are among Hendersonville\'s most sought-after. Joshua has deep experience marketing these lifestyle properties and understands the specific buyer who seeks lake living — and what they pay for it.',
      'Nashville metro overflow: As Nashville and Williamson County prices push buyers further out, Hendersonville captures the overflow. Joshua\'s connections with Nashville-area agents and relo companies mean your listing gets maximum regional exposure.',
    ],
    faqs: [
      { q: 'What is my Hendersonville, TN home worth in 2026?', a: 'The median home price in Hendersonville is approximately $410,000. Lake-access and waterfront properties command a significant premium. Joshua will pull neighborhood-specific comps and factor in any lake access or views for an accurate valuation.' },
      { q: 'How does Hendersonville compare to Gallatin for sellers?', a: 'Hendersonville tends to command a slightly higher price and sell faster than Gallatin — reflecting its more established infrastructure and amenities. Both markets are healthy, but Hendersonville\'s lake lifestyle creates a specific premium buyer pool.' },
      { q: 'Are Hendersonville schools good?', a: 'Sumner County Schools serves Hendersonville with several high-performing options. Beech High School and Indian Lake Elementary are well-regarded. School assignment affects value — Joshua always factors it into your pricing strategy.' },
      { q: 'Is Hendersonville a seller\'s market?', a: 'Yes. With 30 average days on market and consistent appreciation, Hendersonville leans seller-favorable. Well-priced, well-presented homes — especially with lake access — are seeing competitive offers.' },
    ],
    schemaCity: 'Hendersonville',
    schemaState: 'TN',
    schemaZip: '37075',
    buyerDescription: 'Hendersonville gives buyers the best of both worlds: the community feel and lake lifestyle of a small city, with the amenities and access of a Nashville suburb. At a median of $410,000, it\'s more accessible than Williamson County while offering comparable quality of life. Old Hickory Lake waterfront properties, strong schools, and established neighborhoods make it a perennial favorite for families relocating from out of state and Nashville buyers ready to slow down without leaving the metro.',
    buyerWhyBullets: [
      'Lake lifestyle access: Few Nashville suburbs offer the lake lifestyle that Hendersonville does. Old Hickory Lake waterfront and dock-access properties are rare and hold their value exceptionally well. Joshua knows this inventory intimately.',
      'School zone precision: Hendersonville\'s school assignments matter. Being in the right zone can affect home values by $15K–$25K. Joshua confirms school assignment for every property before you tour — no surprises.',
      'Nashville metro connectivity: Hendersonville is 25 miles from downtown Nashville with improving infrastructure. It attracts buyers who want the Nashville metro access without the Davidson County price or density.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Hendersonville, TN in 2026?', a: 'The median is approximately $410,000. Entry-level homes start around $320K; lakefront properties on Old Hickory run $600K–$1.5M+.' },
      { q: 'What are the best Hendersonville neighborhoods?', a: 'Indian Lake for newer construction and amenities. Sanders Ferry for lake access. Drakes Creek for established, family-friendly streets. Downtown Hendersonville for walkability. Joshua will match you based on your lifestyle priorities and budget.' },
      { q: 'Can I find homes with dock access in Hendersonville?', a: 'Yes — Old Hickory Lake runs through Hendersonville with significant waterfront and dock-access inventory. These properties require specific due diligence. Joshua has experience evaluating and purchasing lake properties in Sumner County.' },
      { q: 'How far is Hendersonville from Nashville?', a: 'About 25 miles northeast of Nashville — typically 30-40 minutes depending on traffic. Vietnam Veterans Blvd and US-31E are the main corridors. Closer than Gallatin, with better established amenities.' },
    ],
    topNeighborhoods: ['Indian Lake', 'Sanders Ferry', 'Drakes Creek', 'Walton Ferry', 'Durham Farms'],
    schoolDistrict: 'Sumner County Schools',
    commuteNote: '30-40 min to Nashville via Vietnam Veterans Blvd',
  },

  'columbia-tn': {
    slug: 'columbia-tn',
    name: 'Columbia',
    displayName: 'Columbia, TN',
    county: 'Maury County',
    medianPrice: '$340,000',
    medianPriceNum: 340000,
    avgDaysOnMarket: 28,
    pricePerSqft: 185,
    yoyChange: '+5.1%',
    description: 'Columbia is one of Middle Tennessee\'s most compelling value markets in 2026. Located in Maury County just south of Spring Hill, Columbia blends historic charm, strong growth, and attainable price points that continue to draw both first-time buyers and move-up families. With a median home price around $340,000 and appreciation over 5%, sellers are benefiting from expanding buyer demand as Nashville-area affordability pushes more households south. Joshua Fink and Compass position Columbia listings with a data-backed strategy that highlights both lifestyle and long-term upside.',
    whyBullets: [
      'Local buyer demand is accelerating: Joshua actively markets Columbia homes to buyers relocating from Nashville and Spring Hill who want more space and better value at this price point.',
      'Hyperlocal pricing strategy: From downtown Columbia historic homes to newer subdivisions off James Campbell Blvd, Joshua prices by micro-area so your home launches with precision.',
      'Compass marketing advantage: Professional media, targeted digital campaigns, and Compass network exposure help Columbia sellers reach qualified buyers quickly.',
    ],
    faqs: [
      { q: 'What is my Columbia, TN home worth in 2026?', a: 'The median price is approximately $340,000 with price per square foot near $185. Final value depends on neighborhood, updates, lot size, and proximity to downtown Columbia or key corridors. Joshua will provide a precise CMA based on nearby sold comps.' },
      { q: 'How fast are homes selling in Columbia?', a: 'Well-priced homes are averaging about 28 days on market. Updated properties and homes in desirable school zones can move faster, especially in the spring and summer selling seasons.' },
      { q: 'Is Columbia still appreciating?', a: 'Yes. Columbia is currently showing around 5.1% year-over-year appreciation, supported by population growth and affordability relative to northern suburbs.' },
      { q: 'Should I renovate before listing in Columbia?', a: 'Strategic updates can increase your net, especially paint, curb appeal, and light kitchen/bath improvements. Joshua will help you focus only on upgrades with clear ROI.' },
    ],
    schemaCity: 'Columbia',
    schemaState: 'TN',
    schemaZip: '38401',
    buyerDescription: 'Columbia gives buyers strong value with meaningful upside. At a $340,000 median, it offers an attainable entry point with room to grow, while still keeping access to Spring Hill, Franklin, and Nashville job centers. Joshua and Compass help buyers identify the neighborhoods where appreciation, livability, and long-term resale value align best.',
    buyerWhyBullets: [
      'Affordability with upside: Columbia offers lower entry pricing than many nearby markets while still delivering solid appreciation potential.',
      'Neighborhood matching: Joshua helps buyers compare historic districts, newer communities, and commuter-friendly pockets based on lifestyle and budget.',
      'Offer strategy that wins: In competitive segments, Joshua structures strong, clean offers that protect your interests while improving acceptance odds.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Columbia, TN in 2026?', a: 'The median home price is around $340,000, with entry-level options below that and larger updated homes generally ranging higher.' },
      { q: 'Is Columbia a good place for first-time buyers?', a: 'Yes. Columbia is one of the most first-time-buyer-friendly markets in Middle Tennessee due to price point, inventory variety, and growth momentum.' },
      { q: 'What are the best neighborhoods in Columbia?', a: 'Popular areas include Downtown Columbia, Sunnyside, Bear Creek Pike corridors, The Crossings, and North Columbia growth pockets. Joshua can match you to the best fit.' },
      { q: 'How long does it take to buy in Columbia?', a: 'Most buyers close within 45–75 days depending on financing and inventory. Preparation and fast showings are key in competitive price ranges.' },
    ],
    topNeighborhoods: ['Downtown Columbia', 'Sunnyside', 'North Columbia', 'The Crossings', 'Bear Creek Pike area'],
    schoolDistrict: 'Maury County Public Schools',
    commuteNote: '45 min to downtown Nashville via I-65 (varies by traffic)',
  },

  'mount-juliet-tn': {
    slug: 'mount-juliet-tn',
    name: 'Mount Juliet',
    displayName: 'Mount Juliet, TN',
    county: 'Wilson County',
    medianPrice: '$480,000',
    medianPriceNum: 480000,
    avgDaysOnMarket: 19,
    pricePerSqft: 225,
    yoyChange: '+3.8%',
    description: 'Mount Juliet is one of the strongest-performing suburban markets east of Nashville. Known for top amenities, family-friendly neighborhoods, and a direct commuter route into the city, Mount Juliet continues to attract high-intent buyers. With a 2026 median home price around $480,000 and only 19 average days on market, sellers benefit from a fast-moving environment where quality listings receive immediate attention. Joshua Fink and Compass bring the strategy and exposure needed to maximize outcomes in this competitive market.',
    whyBullets: [
      'Speed-focused launch strategy: With homes moving quickly, Joshua times listing prep, photography, and launch windows to capture peak buyer demand.',
      'Subdivision-level pricing expertise: Mount Juliet has meaningful price differences by community and school assignment; Joshua calibrates your pricing to your exact micro-market.',
      'Commuter and relocation buyer reach: Compass network exposure helps attract Nashville-area commuters and out-of-state transferees targeting Wilson County.',
    ],
    faqs: [
      { q: 'What is my Mount Juliet home worth in 2026?', a: 'The local median is about $480,000 with average pricing near $225 per square foot. Final value depends on subdivision, lot quality, updates, and school zone. Joshua provides a comp-backed valuation before listing.' },
      { q: 'How quickly do homes sell in Mount Juliet?', a: 'Average market time is approximately 19 days. Well-presented homes in desirable neighborhoods often move faster and may receive multiple offers.' },
      { q: 'Is Mount Juliet still a seller-friendly market?', a: 'Yes. Inventory remains relatively tight versus demand, especially for move-in-ready homes in popular family neighborhoods.' },
      { q: 'What prep matters most before listing?', a: 'Professional photos, clean curb appeal, neutral interior touch-ups, and correct initial pricing are the biggest levers. Joshua coordinates this process end-to-end.' },
    ],
    schemaCity: 'Mount Juliet',
    schemaState: 'TN',
    schemaZip: '37122',
    buyerDescription: 'Mount Juliet is ideal for buyers who want suburban convenience, strong schools, and quick Nashville access. The median sits around $480,000 with tight market time, so preparation matters. Joshua and Compass help buyers move quickly, evaluate value accurately, and compete effectively in one of Wilson County\'s most active markets.',
    buyerWhyBullets: [
      'Fast-market execution: Joshua sets up targeted alerts and rapid tours so you can act quickly on the right opportunities.',
      'Commuter-friendly guidance: Mount Juliet has multiple pockets with different commute profiles; Joshua helps you choose based on your daily routine.',
      'Negotiation clarity: In competitive situations, Joshua builds offers that are strong, clean, and data-supported to reduce overpay risk.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Mount Juliet, TN in 2026?', a: 'The median is approximately $480,000, with varied options from townhomes to larger single-family homes in master-planned communities.' },
      { q: 'Is Mount Juliet good for Nashville commuters?', a: 'Yes. It offers strong commuter access by road and rail options, making it a top choice for buyers who work in or near Nashville.' },
      { q: 'What neighborhoods should I consider in Mount Juliet?', a: 'Providence, Del Webb Lake Providence, Wright Farms, Nichols Vale, and Willoughby Station are common starting points depending on budget and lifestyle.' },
      { q: 'How competitive is the buyer market in Mount Juliet?', a: 'It is competitive, especially for updated homes in top neighborhoods. Being pre-approved and ready to tour quickly gives you a major advantage.' },
    ],
    topNeighborhoods: ['Providence', 'Nichols Vale', 'Willoughby Station', 'Wright Farms', 'Del Webb Lake Providence'],
    schoolDistrict: 'Wilson County Schools',
    commuteNote: '25-35 min to downtown Nashville depending on traffic',
  },

  'lebanon-tn': {
    slug: 'lebanon-tn',
    name: 'Lebanon',
    displayName: 'Lebanon, TN',
    county: 'Wilson County',
    medianPrice: '$380,000',
    medianPriceNum: 380000,
    avgDaysOnMarket: 24,
    pricePerSqft: 195,
    yoyChange: '+4.5%',
    description: 'Lebanon offers buyers a balanced mix of affordability, growth, and commuter access in Wilson County. With a 2026 median home price around $380,000 and solid year-over-year appreciation, Lebanon has become a go-to market for buyers seeking more space without stretching into higher-priced suburbs. Sellers benefit from steady demand and a broad buyer pool that includes first-time purchasers, move-up families, and investors. Joshua Fink and Compass deliver a strategic listing plan that captures this demand and drives strong outcomes.',
    whyBullets: [
      'Broad buyer pool: Lebanon attracts commuters, families, and investors, giving sellers multiple demand channels and more pricing support.',
      'Wilson County market knowledge: Joshua tracks neighborhood-level movement and recent comps so your home is priced to attract offers quickly.',
      'Compass-backed marketing: Listing media and digital distribution are designed to maximize visibility in a market where polished presentation wins.',
    ],
    faqs: [
      { q: 'What is my Lebanon, TN home worth in 2026?', a: 'The median is roughly $380,000 with pricing around $195 per square foot. Your specific value depends on condition, location, and lot features. Joshua provides a tailored valuation using recent neighborhood comps.' },
      { q: 'How long do homes stay on market in Lebanon?', a: 'Average days on market are around 24 days. Properly priced homes in move-in-ready condition often move faster.' },
      { q: 'Is Lebanon still appreciating?', a: 'Yes. Current year-over-year change is about +4.5%, supported by continued regional growth and commuter demand.' },
      { q: 'What improvements help sellers most in Lebanon?', a: 'Clean exterior presentation, fresh paint, lighting updates, and pre-listing maintenance checks usually deliver the best return for sellers.' },
    ],
    schemaCity: 'Lebanon',
    schemaState: 'TN',
    schemaZip: '37087',
    buyerDescription: 'Lebanon is a strong option for buyers who want value and space with reliable access to Nashville and surrounding job centers. At a $380,000 median, it remains more attainable than many inner-ring suburbs while still offering stable appreciation. Joshua and Compass help buyers target neighborhoods with the best blend of price, lifestyle, and long-term resale value.',
    buyerWhyBullets: [
      'Value-focused search strategy: Joshua helps you prioritize neighborhoods where your budget goes further without sacrificing market strength.',
      'Commuter-aware home selection: Lebanon has multiple access points and commute profiles; Joshua helps you choose based on your schedule.',
      'Guided transaction support: From tour strategy to inspection and contract terms, Joshua keeps the process clear and efficient.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Lebanon, TN in 2026?', a: 'The median home price is approximately $380,000, with options across entry-level, new construction, and larger move-up inventory.' },
      { q: 'Is Lebanon a good market for first-time buyers?', a: 'Yes. Relative affordability and inventory variety make Lebanon attractive for first-time and value-driven buyers.' },
      { q: 'What neighborhoods are popular in Lebanon?', a: 'Popular areas include Five Oaks vicinity, Spence Creek, Hunters Point, Kensington, and downtown-adjacent neighborhoods.' },
      { q: 'How competitive is Lebanon for buyers?', a: 'It is active but manageable. Well-priced homes can move quickly, so pre-approval and responsive scheduling remain important.' },
    ],
    topNeighborhoods: ['Five Oaks area', 'Spence Creek', 'Hunters Point', 'Kensington', 'Downtown Lebanon'],
    schoolDistrict: 'Wilson County Schools',
    commuteNote: '35-45 min to downtown Nashville via I-40',
  },

  'smyrna-tn': {
    slug: 'smyrna-tn',
    name: 'Smyrna',
    displayName: 'Smyrna, TN',
    county: 'Rutherford County',
    medianPrice: '$370,000',
    medianPriceNum: 370000,
    avgDaysOnMarket: 22,
    pricePerSqft: 190,
    yoyChange: '+3.9%',
    description: 'Smyrna remains one of Rutherford County\'s most dependable markets for both buyers and sellers. Its central location, strong employment base, and neighborhood diversity keep demand steady across price ranges. With a 2026 median near $370,000 and average market time around 22 days, sellers are seeing solid activity when homes are launched with the right strategy. Joshua Fink and Compass combine local insight with modern marketing to position Smyrna properties for maximum visibility and return.',
    whyBullets: [
      'Consistent demand profile: Smyrna attracts first-time buyers, commuters, and move-up families, creating broad exposure for sellers.',
      'Data-driven pricing: Joshua uses current comparable sales and neighborhood trends to position your listing where demand is strongest.',
      'High-impact marketing execution: Compass-level photography, copy, and promotion help your home stand out in a fast-moving market.',
    ],
    faqs: [
      { q: 'What is my Smyrna, TN home worth in 2026?', a: 'The median home price is approximately $370,000 with average pricing around $190 per square foot. Joshua will evaluate your exact location and upgrades for a precise valuation.' },
      { q: 'How quickly are homes selling in Smyrna?', a: 'Homes are averaging around 22 days on market. Updated homes in desirable pockets can move even faster.' },
      { q: 'Is Smyrna a balanced or seller-leaning market?', a: 'Smyrna currently leans seller-friendly in many segments, especially for clean, move-in-ready homes at competitive price points.' },
      { q: 'What should I do before listing in Smyrna?', a: 'Start with a pricing consultation, minor repairs, and staging-friendly preparation. Joshua can provide a prioritized list of updates that typically improve final sale price.' },
    ],
    schemaCity: 'Smyrna',
    schemaState: 'TN',
    schemaZip: '37167',
    buyerDescription: 'Smyrna gives buyers strong value, practical commute options, and stable market fundamentals. The $370,000 median makes it accessible for a wide range of budgets, while local employment and growth continue to support demand. Joshua and Compass help buyers identify the best-fit neighborhoods and negotiate confidently in a market where good homes move quickly.',
    buyerWhyBullets: [
      'Value and commute balance: Joshua helps you target areas that align with both budget goals and daily drive times.',
      'Market-speed readiness: With many homes moving quickly, Joshua prepares buyers to tour early and write strong offers when needed.',
      'Neighborhood fit first: From schools to community style, Joshua narrows options to places that match your lifestyle and long-term goals.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in Smyrna, TN in 2026?', a: 'The median is around $370,000, with a broad mix of starter homes, newer builds, and move-up properties.' },
      { q: 'Is Smyrna good for commuters?', a: 'Yes. Smyrna provides convenient access to Nashville and surrounding employment hubs, making it popular with commuters.' },
      { q: 'What neighborhoods are popular in Smyrna?', a: 'Commonly searched areas include Autumn Ridge, Lee Crossing, Stewarts Creek area, Woodmont, and downtown-adjacent communities.' },
      { q: 'Is Smyrna a good long-term buy?', a: 'Smyrna has shown steady appreciation and consistent demand, making it a strong long-term option for many buyers.' },
    ],
    topNeighborhoods: ['Autumn Ridge', 'Lee Crossing', 'Stewarts Creek area', 'Woodmont', 'Downtown Smyrna'],
    schoolDistrict: 'Rutherford County Schools',
    commuteNote: '25-35 min to Nashville via I-24 (traffic dependent)',
  },

  'la-vergne-tn': {
    slug: 'la-vergne-tn',
    name: 'La Vergne',
    displayName: 'La Vergne, TN',
    county: 'Rutherford County',
    medianPrice: '$330,000',
    medianPriceNum: 330000,
    avgDaysOnMarket: 25,
    pricePerSqft: 180,
    yoyChange: '+4.0%',
    description: 'La Vergne offers one of the most affordable entry points in the Nashville metro while maintaining strong access to major employment corridors. With a 2026 median home price around $330,000, demand remains healthy among first-time buyers and budget-conscious commuters. Sellers in La Vergne benefit from this affordability-driven buyer pool and steady appreciation. Joshua Fink and Compass provide the local strategy needed to price accurately, market effectively, and move quickly in this active segment.',
    whyBullets: [
      'Affordability-driven demand: La Vergne consistently attracts qualified buyers looking for attainable ownership near Nashville job centers.',
      'Precision pricing for fast movement: Joshua aligns list price to current buyer behavior so your home enters the market with momentum.',
      'Compass marketing reach: Professional presentation and broad digital exposure help La Vergne listings stand out in a competitive price band.',
    ],
    faqs: [
      { q: 'What is my La Vergne, TN home worth in 2026?', a: 'Median pricing is around $330,000 with approximately $180 per square foot. Your home\'s value depends on condition, neighborhood, and upgrades. Joshua can provide a street-level valuation using recent sales.' },
      { q: 'How long does it take to sell in La Vergne?', a: 'Average days on market are roughly 25 days, with well-prepared homes often selling faster.' },
      { q: 'Is La Vergne still growing?', a: 'Yes. La Vergne continues to benefit from metro expansion and remains attractive due to relative affordability and location.' },
      { q: 'Should sellers stage homes in La Vergne?', a: 'Even light staging and decluttering can improve showings and offer strength. Joshua can recommend practical prep steps that fit your timeline and budget.' },
    ],
    schemaCity: 'La Vergne',
    schemaState: 'TN',
    schemaZip: '37086',
    buyerDescription: 'La Vergne is a practical choice for buyers who want affordability, accessibility, and long-term ownership potential. At a $330,000 median, it remains one of the better value opportunities in Rutherford County. Joshua and Compass help buyers evaluate neighborhoods, commute tradeoffs, and property condition so they can buy confidently and avoid costly surprises.',
    buyerWhyBullets: [
      'Strong affordability profile: La Vergne offers a lower entry price than many surrounding markets while maintaining metro access.',
      'Guided first-home strategy: Joshua helps first-time buyers navigate financing, inspections, and offer structure with clarity.',
      'Commuter-aware neighborhood selection: Joshua pinpoints locations that balance budget with convenient access to Nashville and local employers.',
    ],
    buyerFaqs: [
      { q: 'What is the average home price in La Vergne, TN in 2026?', a: 'The median is approximately $330,000, with options across entry-level single-family homes and newer subdivisions.' },
      { q: 'Is La Vergne good for first-time buyers?', a: 'Yes. It is one of the more attainable markets in the metro and often a strong starting point for first-time homeowners.' },
      { q: 'What neighborhoods should buyers explore in La Vergne?', a: 'Popular areas include Lake Forest, Woodland Hills, Stones River Road corridors, Amsterdam, and central La Vergne communities.' },
      { q: 'How competitive is La Vergne for buyers?', a: 'Competition can be strong in entry-level price points. Pre-approval and fast response time help buyers secure better opportunities.' },
    ],
    topNeighborhoods: ['Lake Forest', 'Woodland Hills', 'Stones River Road area', 'Amsterdam', 'Central La Vergne'],
    schoolDistrict: 'Rutherford County Schools',
    commuteNote: '20-30 min to Nashville via I-24 (traffic dependent)',
  },
}

export function getSuburb(slug: string): Suburb | undefined {
  return suburbs[slug]
}

export function getAllSuburbSlugs(): string[] {
  return Object.keys(suburbs)
}
