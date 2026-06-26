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
  latitude?: number
  longitude?: number
  compassSearchUrl?: string
}

export const neighborhoods: Record<string, Neighborhood> = {
  'westhaven-franklin-tn': {
    slug: 'westhaven-franklin-tn',
    name: 'Westhaven',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'Westhaven Neighborhood Guide — Franklin, TN',
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
    latitude: 35.9337,
    longitude: -86.9557,
  },

  'east-nashville-tn': {
    slug: 'east-nashville-tn',
    name: 'East Nashville',
    city: 'Nashville',
    citySlug: 'nashville-tn',
    county: 'Davidson County',
    metaTitle: 'East Nashville Neighborhood Guide — Nashville, TN',
    metaDescription:
      'East Nashville homes for sale, explained: historic bungalows, Five Points walkability, vibe, prices, and what to know before you buy. Local insight from Compass agent Joshua Fink.',
    intro:
      'East Nashville is the city’s most-talked-about neighborhood east of the Cumberland River — a collection of historic streetcar-era pockets like Lockeland Springs, Eastwood, and Cleveland Park, anchored by the Five Points and Riverside Village commercial nodes. It is walkable, design-forward, and the first stop for buyers who want character over cul-de-sac.',
    about:
      'East Nashville is really a cluster of distinct micro-neighborhoods — Lockeland Springs, Eastwood, Cleveland Park, Greenwood, and Inglewood among them — stitched together by Eastland and Gallatin Avenues and the Five Points hub. The housing stock leans heavily on early-1900s craftsman bungalows, four-squares, and Victorian cottages, many beautifully renovated, interspersed with modern infill builds and tall-skinny duplexes. The draw is lifestyle: independent restaurants, coffee shops, music venues, and boutiques you can walk or bike to, plus quick access to downtown over the river. It attracts a creative, professional, and small-business crowd that prizes walkability and architectural character. Inventory ranges from entry-level renovation projects to fully restored historic homes and new modern builds, so the price spread inside East Nashville is wide.',
    vibe: 'Historic, walkable, creative — Nashville’s character-home favorite.',
    priceBand: '$450K – $1.2M+',
    buildYears: 'Early 1900s historic stock with ongoing modern infill',
    hoa: 'Most single-family historic homes have no HOA. Newer infill, townhome, and condo developments may carry HOA dues — confirm per property. Parts of East Nashville sit inside historic-overlay zoning that governs exterior changes.',
    schoolNotes:
      'East Nashville falls within Metro Nashville Public Schools (MNPS), which combines zoned schools with magnet, optional, and charter choices assigned partly by address and partly by application or lottery. Many Nashville buyers weigh zoned, magnet, charter, and private options together. Always confirm current MNPS zoning and any application deadlines for the exact address.',
    amenities: [
      'Five Points and Riverside Village walkable dining and retail',
      'Independent restaurants, coffee, and live-music venues',
      'Shelby Park and the Shelby Bottoms Greenway',
      'Quick bridge access to downtown Nashville',
      'Historic-overlay districts protecting neighborhood character',
      'Bikeable, grid-pattern streets',
    ],
    homeStyles: [
      'Craftsman bungalows and four-squares (early 1900s)',
      'Victorian cottages',
      'Fully renovated historic homes',
      'Modern infill new construction',
      'Tall-skinny duplexes and townhomes',
    ],
    whyBullets: [
      'Character is the whole point: East Nashville buyers are choosing architecture, walkability, and a creative neighborhood culture you can’t replicate in a new subdivision. Joshua helps you separate a well-done historic renovation from a flip with lipstick on it.',
      'Micro-neighborhoods matter: Lockeland Springs lives very differently from Inglewood or Cleveland Park on price, walk score, and feel. Joshua knows the pockets and can target the right one for your budget and commute.',
      'Wide entry range: From renovation projects in the $400s to restored showpieces past $1M, East Nashville works for a broad range of buyers — if you know where to look.',
    ],
    faqs: [
      {
        q: 'How much do homes in East Nashville cost in 2026?',
        a: 'East Nashville spans a wide range — roughly the mid-$400s for smaller cottages and renovation candidates up past $1.2M for large, fully restored historic homes and premium modern infill. Most renovated single-family activity sits in the $600K–$900K range. For a specific street, Joshua can pull recent closed comps.',
      },
      {
        q: 'Is East Nashville a good place to buy?',
        a: 'For buyers who value walkability, historic character, and proximity to downtown, it is one of the most desirable parts of the city. The trade-off versus the suburbs is smaller lots, older systems in unrenovated homes, and MNPS school decisions that often require a little homework. Joshua walks you through both sides.',
      },
      {
        q: 'What are the main East Nashville sub-neighborhoods?',
        a: 'Lockeland Springs, Eastwood, Cleveland Park, Greenwood, and Inglewood are the most searched, each with its own price point and personality. Five Points and Riverside Village are the two main walkable commercial hubs.',
      },
      {
        q: 'Do East Nashville homes have HOAs?',
        a: 'Most historic single-family homes do not. Newer townhome, condo, and infill developments sometimes do. Separately, several East Nashville pockets sit in historic-overlay districts that regulate exterior changes — important to know before you plan a renovation. Joshua confirms both per property.',
      },
      {
        q: 'What schools serve East Nashville?',
        a: 'East Nashville is part of Metro Nashville Public Schools, which uses a mix of zoned, magnet, optional, and charter schools. Assignment depends on the exact address plus application or lottery for choice programs. Confirm current zoning and deadlines for any specific home before writing an offer.',
      },
    ],
    schemaCity: 'Nashville',
    schemaState: 'TN',
    latitude: 36.1782,
    longitude: -86.7452,
  },

  '12-south-nashville-tn': {
    slug: '12-south-nashville-tn',
    name: '12 South',
    city: 'Nashville',
    citySlug: 'nashville-tn',
    county: 'Davidson County',
    metaTitle: '12 South Neighborhood Guide — Nashville, TN',
    metaDescription:
      '12 South is one of Nashville’s most walkable, in-demand neighborhoods: bungalows, boutiques, and a buzzing main strip. Prices, vibe, and buyer advice from Compass agent Joshua Fink.',
    intro:
      '12 South is the compact, intensely walkable neighborhood just south of downtown Nashville built around the 12th Avenue South retail strip — boutiques, coffee, ice cream, and some of the most photographed storefronts in the city. It pairs early-1900s bungalows with high-end renovations and modern infill, and demand here is consistently among the strongest in the urban core.',
    about:
      '12 South runs along 12th Avenue South between roughly Linden and Kirkwood, a short hop from downtown, the Gulch, and Belmont. The commercial spine is the draw: a tight, leafy main street of independent boutiques, restaurants, a popular neighborhood park (Sevier Park), and the weekend foot traffic that comes with being a destination. Housing is a mix of restored craftsman bungalows, larger rebuilt homes, modern infill, and townhomes. Lots are small and walkability is high — residents routinely leave the car at home. Because it is both a lifestyle destination and a limited-supply historic grid, 12 South commands a premium over many comparable-size Nashville neighborhoods.',
    vibe: 'Boutique-lined, ultra-walkable, high-demand urban living.',
    priceBand: '$700K – $1.8M+',
    buildYears: 'Early 1900s bungalows with extensive renovation and infill',
    hoa: 'Detached single-family homes typically have no HOA; newer townhome and condo projects may. Lots are small and street parking is at a premium — worth factoring in.',
    schoolNotes:
      '12 South is served by Metro Nashville Public Schools (MNPS), a mix of zoned, magnet, optional, and charter schools assigned by address plus application or lottery for choice programs. Confirm current MNPS zoning and deadlines for the exact address before writing an offer.',
    amenities: [
      'The 12th Avenue South boutique and restaurant strip',
      'Sevier Park and the Sevier Park Community Center',
      'Walk/bike distance to downtown, the Gulch, and Belmont',
      'Highly walkable, destination main street',
      'Strong, consistent resale demand',
      'Coffee shops, ice cream, and independent retail at your doorstep',
    ],
    homeStyles: [
      'Restored craftsman bungalows',
      'Larger rebuilt and expanded historic homes',
      'Modern infill new construction',
      'Townhomes near the commercial strip',
    ],
    whyBullets: [
      'Walkability commands a premium: 12 South is a true leave-the-car neighborhood, and that lifestyle holds value through market cycles. Joshua helps you judge whether a specific block delivers the walkability you’re paying for.',
      'Supply is genuinely limited: It’s a small, built-out historic grid, so well-located homes move fast. Joshua’s Compass access and off-market network matter most in tight neighborhoods like this.',
      'Renovation quality varies widely: At these prices you want to know which “fully renovated” homes are done right. Joshua has walked enough of them to flag the difference.',
    ],
    faqs: [
      {
        q: 'How much do homes in 12 South cost in 2026?',
        a: 'Most 12 South single-family homes trade between roughly $700K and $1.8M, with premium renovated and larger homes pushing higher and some townhomes/condos entering below that. For an exact read on a specific block, Joshua can pull recent closed comps.',
      },
      {
        q: 'Why is 12 South so popular?',
        a: 'It combines a genuine walkable main street, proximity to downtown and the Gulch, historic bungalow charm, and a destination retail/dining scene in one compact neighborhood. That mix keeps demand — and prices — strong.',
      },
      {
        q: 'Is parking a problem in 12 South?',
        a: 'It can be. Lots are small and the commercial strip draws weekend visitors, so on-street parking is competitive in spots. Off-street parking and garage access are worth prioritizing in your search — Joshua factors it into showings.',
      },
      {
        q: 'What schools serve 12 South?',
        a: '12 South is part of Metro Nashville Public Schools, which uses zoned, magnet, optional, and charter options assigned by address plus application or lottery. Confirm current zoning and any deadlines for the specific address before you buy.',
      },
    ],
    schemaCity: 'Nashville',
    schemaState: 'TN',
    latitude: 36.1234,
    longitude: -86.7895,
  },

  'germantown-nashville-tn': {
    slug: 'germantown-nashville-tn',
    name: 'Germantown',
    city: 'Nashville',
    citySlug: 'nashville-tn',
    county: 'Davidson County',
    metaTitle: 'Germantown Neighborhood Guide — Nashville, TN',
    metaDescription:
      'Germantown is Nashville’s historic, upscale urban neighborhood just north of downtown — Victorian homes, top restaurants, and the Farmers’ Market. Prices and buyer insight from Compass agent Joshua Fink.',
    intro:
      'Germantown is Nashville’s oldest residential neighborhood — a compact, historic district just north of downtown known for restored Victorians, brick streets, a celebrated restaurant scene, and the Nashville Farmers’ Market. It blends 19th-century character with new luxury townhomes and condos, and it is one of the most walkable upscale addresses in the city.',
    about:
      'Germantown sits immediately north of the central business district, bordered by the Farmers’ Market and Bicentennial Capitol Mall State Park. The neighborhood is small and dense, with tree-lined streets of restored Victorian and Italianate homes alongside newer luxury townhomes, condos, and a handful of mid-rise developments. It punches well above its size on dining — several of Nashville’s most acclaimed restaurants are here — and residents walk to the Farmers’ Market, First Horizon Park (the Sounds’ ballpark), and downtown. The buyer profile skews professional, empty-nester, and second-home, drawn by low-maintenance urban living with genuine history. Because detached historic homes are scarce, much of the for-sale activity is townhomes and condos.',
    vibe: 'Historic, upscale, walkable — Nashville’s urban dining district.',
    priceBand: '$500K – $1.5M+',
    buildYears: '19th-century historic homes plus modern luxury townhomes/condos',
    hoa: 'Townhomes and condos — a large share of Germantown inventory — carry HOA dues covering shared structures and amenities. Detached historic homes generally do not, though some sit in a historic-overlay district that regulates exterior changes.',
    schoolNotes:
      'Germantown is part of Metro Nashville Public Schools (MNPS), which blends zoned schools with magnet, optional, and charter options assigned by address plus application or lottery. Confirm current MNPS zoning and deadlines for the exact address before writing an offer.',
    amenities: [
      'Nashville Farmers’ Market at the neighborhood edge',
      'Acclaimed, walkable restaurant scene',
      'First Horizon Park (Nashville Sounds) and Bicentennial Mall State Park',
      'Walk to downtown and the riverfront',
      'Historic brick streets and restored architecture',
      'Low-maintenance townhome and condo living',
    ],
    homeStyles: [
      'Restored Victorian and Italianate homes',
      'Luxury new-construction townhomes',
      'Condos and mid-rise units',
      'Selected modern detached infill',
    ],
    whyBullets: [
      'Low-maintenance urban luxury: Germantown is ideal for buyers who want walkable, lock-and-leave living with real history — not a suburban yard. Joshua helps match you to the right product type, from a Victorian to a new townhome.',
      'Scarcity at the top: Detached historic homes rarely come up and move quickly when they do. Joshua’s Compass and off-market access is a real edge in a neighborhood this small.',
      'HOA and overlay due diligence: Much of Germantown is townhome/condo with HOAs, and some blocks are historic-overlay. Joshua reviews the documents so there are no surprises after closing.',
    ],
    faqs: [
      {
        q: 'How much do homes in Germantown cost in 2026?',
        a: 'Germantown generally runs from the low-$500s for condos and smaller townhomes up past $1.5M for large luxury townhomes and restored detached Victorians. Most activity is townhome and condo product in between. Joshua can pull exact closed comps for a specific building or street.',
      },
      {
        q: 'Is Germantown mostly condos and townhomes?',
        a: 'A large share of for-sale inventory is townhomes and condos, because detached historic homes are scarce and tightly held. If you specifically want a detached historic home, expect to wait for the right one — Joshua can set up off-market and new-listing alerts.',
      },
      {
        q: 'What’s the appeal of living in Germantown?',
        a: 'Walkable upscale living next to downtown, one of the best restaurant clusters in Nashville, the Farmers’ Market, parks, and genuine 19th-century architecture — all in a compact, low-maintenance footprint. It’s a favorite for professionals and empty-nesters.',
      },
      {
        q: 'What schools serve Germantown?',
        a: 'Germantown is served by Metro Nashville Public Schools, a mix of zoned, magnet, optional, and charter schools assigned by address plus application or lottery for choice programs. Confirm current zoning and deadlines for the exact address before you buy.',
      },
    ],
    schemaCity: 'Nashville',
    schemaState: 'TN',
    latitude: 36.1808,
    longitude: -86.7886,
  },

  'sylvan-park-nashville-tn': {
    slug: 'sylvan-park-nashville-tn',
    name: 'Sylvan Park',
    city: 'Nashville',
    citySlug: 'nashville-tn',
    county: 'Davidson County',
    metaTitle: 'Sylvan Park Neighborhood Guide — Nashville, TN',
    metaDescription:
      'Sylvan Park is a leafy, family-friendly West Nashville neighborhood of cottages and bungalows near McCabe Park. Prices, schools, and buyer advice from Compass agent Joshua Fink.',
    intro:
      'Sylvan Park is a leafy, established neighborhood in West Nashville known for its cottages and bungalows, the McCabe Park golf course and community center, and a small, walkable restaurant row on Murphy Road and 46th Avenue. It is one of the more family-friendly pockets of the urban core, popular with buyers who want character and green space without leaving the city.',
    about:
      'Sylvan Park sits west of I-440 between Charlotte Avenue and the Nations, organized on a tidy grid with streets named after U.S. presidents. The housing stock is dominated by early-to-mid-1900s cottages, bungalows, and Tudor-influenced homes, with steady renovation activity and newer infill on former tear-down lots. The neighborhood wraps around McCabe Park, which includes a public golf course, greenway access, ball fields, and a community center — a meaningful amenity for active and family buyers. A compact set of neighborhood restaurants and shops keeps daily life walkable. Sylvan Park appeals to buyers who want established trees, a real sense of community, and quick access to downtown and West End, but with a calmer, more residential feel than 12 South or East Nashville.',
    vibe: 'Leafy, established, family-friendly West Nashville.',
    priceBand: '$550K – $1.3M+',
    buildYears: 'Early-to-mid 1900s cottages with ongoing renovation and infill',
    hoa: 'Most Sylvan Park single-family homes have no HOA. Newer townhome and infill developments may carry dues — confirm per property.',
    schoolNotes:
      'Sylvan Park is part of Metro Nashville Public Schools (MNPS), which uses zoned schools alongside magnet, optional, and charter options assigned by address plus application or lottery. Confirm current MNPS zoning and deadlines for the specific address before writing an offer.',
    amenities: [
      'McCabe Park — public golf course, ball fields, community center',
      'Richland Creek Greenway access',
      'Neighborhood restaurant row on Murphy Road / 46th Ave',
      'Established tree canopy and grid streets',
      'Quick access to West End, downtown, and the Nations',
      'Family-friendly, residential feel',
    ],
    homeStyles: [
      'Early-1900s cottages and bungalows',
      'Tudor-influenced homes',
      'Renovated and expanded historic homes',
      'Modern infill new construction',
      'Selected townhomes',
    ],
    whyBullets: [
      'Family-friendly without the suburbs: Sylvan Park gives buyers green space, a golf course, and a community feel while staying minutes from downtown. Joshua helps you weigh it against suburban options on price-per-square-foot and schools.',
      'Renovation vs. infill: The neighborhood has both charming originals and new builds on small lots. Joshua helps you decide which fits your maintenance appetite and resale goals.',
      'Established and stable: Mature trees, a tidy grid, and consistent demand make Sylvan Park one of West Nashville’s steadier neighborhoods — Joshua can show how it has held value.',
    ],
    faqs: [
      {
        q: 'How much do homes in Sylvan Park cost in 2026?',
        a: 'Most Sylvan Park homes trade between roughly $550K and $1.3M, with renovated and new-infill homes at the upper end and smaller original cottages below. Joshua can pull recent closed comps for any specific street.',
      },
      {
        q: 'Is Sylvan Park good for families?',
        a: 'It’s one of the more family-oriented neighborhoods in the urban core, thanks to McCabe Park, greenway access, established trees, and a residential grid. As with anywhere in Nashville, school assignment takes a little homework — Joshua helps with that.',
      },
      {
        q: 'What’s the difference between Sylvan Park and the Nations?',
        a: 'They’re neighbors in West Nashville. Sylvan Park is older and more established with mature trees and cottages; the Nations has seen heavier new-construction and modern infill. Joshua can tour both so you feel the difference firsthand.',
      },
      {
        q: 'What schools serve Sylvan Park?',
        a: 'Sylvan Park is served by Metro Nashville Public Schools, a mix of zoned, magnet, optional, and charter schools assigned by address plus application or lottery for choice programs. Confirm current zoning and deadlines for the exact address before buying.',
      },
    ],
    schemaCity: 'Nashville',
    schemaState: 'TN',
    latitude: 36.1503,
    longitude: -86.8403,
  },

  'the-gulch-nashville-tn': {
    slug: 'the-gulch-nashville-tn',
    name: 'The Gulch',
    city: 'Nashville',
    citySlug: 'nashville-tn',
    county: 'Davidson County',
    metaTitle: 'The Gulch Neighborhood Guide — Nashville, TN',
    metaDescription:
      'The Gulch is Nashville’s walkable high-rise condo district — LEED-certified buildings, nightlife, and downtown at your doorstep. Condo prices and buyer advice from Compass agent Joshua Fink.',
    intro:
      'The Gulch is Nashville’s dense, walkable condo district on the southwest edge of downtown — a cluster of mid- and high-rise residential buildings, restaurants, rooftop bars, and the famous “What Lifts You” wings mural. It was one of the first LEED-certified neighborhoods in the South, and it is the go-to for buyers who want lock-and-leave, amenity-rich urban living.',
    about:
      'The Gulch sits between downtown and 12 South, built around 11th and 12th Avenues. It is overwhelmingly condo and apartment product — mid- and high-rise buildings with concierge service, fitness centers, rooftop pools, and secured parking — mixed with ground-floor retail, restaurants, and nightlife. There are very few single-family homes; the for-sale market here is condos, from compact one-bedrooms to large luxury penthouses. The neighborhood is built for walkability and a low-maintenance lifestyle: residents walk to dinner, music, and the office downtown. Buyers tend to be professionals, downsizers, investors, and second-home owners who value amenities and location over a yard. Because product is building-specific, HOA dues, rental rules, and amenity packages vary widely from tower to tower — which is exactly where an experienced agent earns their keep.',
    vibe: 'Walkable high-rise condos, nightlife, and downtown at your door.',
    priceBand: '$400K – $1.5M+ (condos)',
    buildYears: 'Mostly 2000s–present mid- and high-rise development',
    hoa: 'Effectively all Gulch inventory is condo product with monthly HOA/condo dues that cover building amenities, security, and often some utilities. Dues, reserves, and short-term-rental rules vary significantly by building — reviewing them carefully is essential.',
    schoolNotes:
      'The Gulch is within Metro Nashville Public Schools (MNPS), which uses zoned, magnet, optional, and charter schools assigned by address plus application or lottery. The Gulch skews toward professionals and downsizers, but for families, confirm current MNPS zoning and choice-program deadlines for the exact address.',
    amenities: [
      'Walkable restaurants, rooftop bars, and live music',
      'LEED-certified, sustainability-focused development',
      'Building amenities: concierge, fitness, rooftop pools, secured parking',
      'Steps from downtown and the future riverfront',
      'The “What Lifts You” wings mural and destination retail',
      'Lock-and-leave, low-maintenance lifestyle',
    ],
    homeStyles: [
      'High-rise luxury condos and penthouses',
      'Mid-rise condo units',
      'Compact urban one- and two-bedrooms',
      'Live/work and loft-style units',
    ],
    whyBullets: [
      'Building selection is everything: In the Gulch you’re buying the building as much as the unit — HOA health, reserves, rental rules, and amenities vary widely. Joshua helps you compare towers, not just floor plans.',
      'Lock-and-leave urban living: For professionals, downsizers, and second-home buyers, the Gulch offers walkable, amenity-rich living with no yard to maintain. Joshua matches you to the right building and view.',
      'Investor and rental nuance: Short-term-rental rules differ by building and are changing. If you’re buying with rental income in mind, Joshua helps you confirm what’s actually allowed before you commit.',
    ],
    faqs: [
      {
        q: 'How much do condos in The Gulch cost in 2026?',
        a: 'Gulch condos generally range from around $400K for smaller one-bedrooms to $1.5M and well beyond for large luxury units and penthouses, depending on building, floor, and view. Joshua can pull recent closed comps within a specific building.',
      },
      {
        q: 'Are there single-family homes in The Gulch?',
        a: 'Very few — the Gulch is almost entirely condo and apartment product. If you want a detached home nearby, neighboring 12 South or the edges of downtown are better targets, and Joshua can show you both.',
      },
      {
        q: 'What should I check before buying a Gulch condo?',
        a: 'The building’s HOA dues and reserves, special-assessment history, rental and short-term-rental rules, amenity package, and parking. These vary a lot tower to tower. Joshua reviews the condo documents with you before you write an offer.',
      },
      {
        q: 'Is The Gulch a good investment?',
        a: 'It can be, given its walkability and demand, but returns depend heavily on the specific building and its rental rules — especially around short-term rentals, which differ by tower and are subject to change. Joshua helps you confirm the rules and run the numbers.',
      },
    ],
    schemaCity: 'Nashville',
    schemaState: 'TN',
    latitude: 36.1512,
    longitude: -86.7855,
  },

  'governors-club-brentwood-tn': {
    slug: 'governors-club-brentwood-tn',
    name: 'Governors Club',
    city: 'Brentwood',
    citySlug: 'brentwood-tn',
    county: 'Williamson County',
    metaTitle: 'Governors Club Neighborhood Guide — Brentwood, TN',
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
    latitude: 35.9620,
    longitude: -86.7610,
  },

  'mckays-mill-franklin-tn': {
    slug: 'mckays-mill-franklin-tn',
    name: "McKay's Mill",
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: "McKay's Mill Neighborhood Guide — Franklin, TN",
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
    latitude: 35.9665,
    longitude: -86.8590,
  },

  'fieldstone-farms-franklin-tn': {
    slug: 'fieldstone-farms-franklin-tn',
    name: 'Fieldstone Farms',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'Fieldstone Farms Neighborhood Guide — Franklin, TN',
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
    latitude: 35.9270,
    longitude: -86.9130,
  },

  'berry-farms-franklin-tn': {
    slug: 'berry-farms-franklin-tn',
    name: 'Berry Farms',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'Berry Farms Neighborhood Guide — Franklin, TN',
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
    latitude: 35.8810,
    longitude: -86.8580,
  },

  'annandale-brentwood-tn': {
    slug: 'annandale-brentwood-tn',
    name: 'Annandale',
    city: 'Brentwood',
    citySlug: 'brentwood-tn',
    county: 'Williamson County',
    metaTitle: 'Annandale Neighborhood Guide — Brentwood, TN',
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
    latitude: 35.9700,
    longitude: -86.8200,
  },

  'raintree-forest-brentwood-tn': {
    slug: 'raintree-forest-brentwood-tn',
    name: 'Raintree Forest',
    city: 'Brentwood',
    citySlug: 'brentwood-tn',
    county: 'Williamson County',
    metaTitle: 'Raintree Forest Neighborhood Guide — Brentwood, TN',
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
    latitude: 36.0095,
    longitude: -86.7785,
  },

  'highlands-at-ladd-park-franklin-tn': {
    slug: 'highlands-at-ladd-park-franklin-tn',
    name: 'The Highlands at Ladd Park',
    city: 'Franklin',
    citySlug: 'franklin-tn',
    county: 'Williamson County',
    metaTitle: 'The Highlands at Ladd Park Guide — Franklin, TN',
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
    latitude: 35.9030,
    longitude: -86.8900,
  },

  'tollgate-village-thompsons-station-tn': {
    slug: 'tollgate-village-thompsons-station-tn',
    name: 'Tollgate Village',
    city: "Thompson's Station",
    citySlug: 'thompsons-station-tn',
    county: 'Williamson County',
    metaTitle: "Tollgate Village Neighborhood Guide — Thompson's Station, TN",
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
    latitude: 35.8370,
    longitude: -86.9130,
  },

  'burberry-glen-nolensville-tn': {
    slug: 'burberry-glen-nolensville-tn',
    name: 'Burberry Glen',
    city: 'Nolensville',
    citySlug: 'nolensville-tn',
    county: 'Williamson County',
    metaTitle: 'Burberry Glen Neighborhood Guide — Nolensville, TN',
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
    latitude: 35.9525,
    longitude: -86.6610,
  },

  'bent-creek-nolensville-tn': {
    slug: 'bent-creek-nolensville-tn',
    name: 'Bent Creek',
    city: 'Nolensville',
    citySlug: 'nolensville-tn',
    county: 'Williamson County',
    metaTitle: 'Bent Creek Neighborhood Guide — Nolensville, TN',
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
    latitude: 35.9430,
    longitude: -86.6740,
  },

  // ───────────────────────────────────────────────────────────────────────
  // SPRING HILL, TN (added 2026-06-02). All six are on the Williamson County
  // side of Spring Hill (the premium, established side — Spring Hill straddles
  // the Williamson/Maury line). Price bands and school-zone assignments below
  // are sourced from public listing/brokerage data + district info and are
  // FLAGGED FOR JOSHUA TO VERIFY before treating as authoritative — pricing is
  // early-2026 and small-sample on some communities; WCS rezones periodically.
  // Benevento's lat/long is approximate (no reliable subdivision centroid found).
  // ───────────────────────────────────────────────────────────────────────
  'wades-grove-spring-hill-tn': {
    slug: 'wades-grove-spring-hill-tn',
    name: 'Wades Grove',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Williamson County',
    metaTitle: 'Wades Grove Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Wades Grove in Spring Hill, TN: a large all-brick community off Buckner Lane in Williamson County, with a pool, pavilion, and Williamson County Schools zoning. Local insight from Compass agent Joshua Fink.',
    intro:
      'Wades Grove is one of the largest and best-known subdivisions on the Williamson County side of Spring Hill — roughly 700 all-brick homes off Buckner Lane, built from 2006 onward, with a community pool and pavilion and the Williamson County Schools zoning buyers move here for.',
    about:
      'Wades Grove sits along Buckner Lane in the 37174 ZIP, on the Williamson County side of the Williamson/Maury line that runs through Spring Hill. It is a large, established subdivision — cited at roughly 700 homes — developed in phases from 2006 onward, which means a mix of mature, landscaped older sections and newer construction. Homes are predominantly all-brick (some brick-and-stone or brick-with-siding) in traditional and contemporary styles, generally ranging from around 1,440 to 3,950 square feet with three to five bedrooms. The community amenity package centers on a swimming pool and a reservable pavilion, with a playground, sidewalks, and maintained common areas; the Spring Hill Sports Complex and Harvey Park are nearby. Commuters reach I-65 via the Saturn Parkway / June Lake interchange.',
    vibe: 'Large, established, family-friendly all-brick community with a pool and pavilion.',
    priceBand: '$470K – $725K (approx.)',
    buildYears: '2006 to present (phased development)',
    hoa: 'Active HOA with modest dues (roughly $40–$50/month). Covers common-area landscaping, the community pool and pavilion, and amenity upkeep. Confirm current dues with the HOA before writing an offer.',
    schoolNotes:
      'Wades Grove is generally zoned to Williamson County Schools — most commonly Bethesda Elementary, Spring Station Middle, and Summit High School, though a few edge lots may fall to Allendale Elementary. WCS rezones periodically, so always verify the assignment for the specific address against the current Williamson County Schools zoning map.',
    amenities: [
      'Community swimming pool',
      'Reservable community pavilion',
      'Playground',
      'Sidewalks and maintained common green spaces',
      'Near Spring Hill Sports Complex and Harvey Park',
    ],
    homeStyles: [
      'All-brick traditional two-story homes',
      'Brick-and-stone and brick-with-siding elevations',
      'Contemporary open floor plans',
      'Single-family homes from roughly 1,440 to 3,950 sq ft',
    ],
    whyBullets: [
      'Williamson County Schools at a Spring Hill price: Wades Grove pairs sought-after WCS zoning with a more attainable entry point than Franklin or Brentwood — a major draw for relocating families.',
      'Scale and stability: At roughly 700 homes built across many phases, Wades Grove has a deep, established resident base and consistent all-brick construction that holds its look over time.',
      'Everyday convenience: Buckner Lane location puts shopping, the Spring Hill Sports Complex, and the I-65 corridor minutes away.',
    ],
    faqs: [
      {
        q: 'How much do homes in Wades Grove cost in 2026?',
        a: 'As of early 2026, Wades Grove homes generally trade in roughly the $470K–$725K range, with most activity clustered around a high-$500s median. Active inventory is small, so figures move quickly — Joshua can pull current closed comps within the community for an exact read.',
      },
      {
        q: 'Is Wades Grove in Williamson or Maury County?',
        a: 'Williamson County. Spring Hill straddles the Williamson/Maury line, and a few aggregator sites mislabel Wades Grove as Maury because the 37174 ZIP is majority-Maury — but the Buckner Lane parcels and Williamson County Schools zoning confirm it sits in Williamson.',
      },
      {
        q: 'What schools are zoned to Wades Grove?',
        a: 'Most addresses are zoned to Williamson County Schools — typically Bethesda Elementary, Spring Station Middle, and Summit High — with a few edge lots possibly assigned to Allendale Elementary. Zoning can change, so verify the specific address with the district before you make an offer.',
      },
      {
        q: 'Does Wades Grove have a pool and an HOA?',
        a: 'Yes. There is a community pool and a reservable pavilion, plus a playground and sidewalks, maintained by an active HOA with modest monthly dues. Confirm the current dues amount with the HOA.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7574,
    longitude: -86.8788,
  },

  'cherry-grove-spring-hill-tn': {
    slug: 'cherry-grove-spring-hill-tn',
    name: 'Cherry Grove',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Williamson County',
    metaTitle: 'Cherry Grove Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Cherry Grove in Spring Hill, TN: an established all-brick Williamson County community on larger lots near the Thompson’s Station line, zoned to Summit High. Local insight from Compass agent Joshua Fink.',
    intro:
      'Cherry Grove is an established, spacious all-brick community off Buckner Lane on the Spring Hill / Thompson’s Station border — known for larger lots, its distinctive Australian-themed street names, and a coveted Williamson County school zone anchored by Summit High.',
    about:
      'Cherry Grove sits on the north side of Spring Hill near the Thompson’s Station line, in Williamson County (37174/37179). Built across multiple phases over roughly two decades — from about 2001/2002 through the late 2010s — it is now essentially built out, trading as resales. Homes are predominantly all-brick (some brick-and-stone) traditional designs, generally in the 2,400–4,800 square-foot range with four to five bedrooms, bonus rooms, and two- to three-car garages, on lots of roughly 0.19 to 0.43 acre — noticeably larger than many newer Spring Hill developments. The community is recognizable for its Australian-themed streets (Brisbane, Canberra, Alice Springs, Wallaby) and a shared amenity set of pool, clubhouse, and playground. Buckner Lane — currently being widened — is the main corridor, with I-65 and Spring Hill Marketplace minutes away.',
    vibe: 'Established, spacious all-brick neighborhood on larger lots with a top Williamson school zone.',
    priceBand: '$560K – $1.07M (approx.)',
    buildYears: 'Early 2000s to roughly 2019 (built out)',
    hoa: 'Active HOA with modest dues (roughly $38–$55/month, varying by phase). Covers the community pool, clubhouse, playground, and common areas. Confirm current dues with the HOA.',
    schoolNotes:
      'Cherry Grove is zoned to Williamson County Schools, with Summit High serving the community. Elementary and middle assignments vary by phase/address — commonly Allendale or Bethesda Elementary and Spring Station or Thompson’s Station Middle. WCS rezones periodically, so verify the specific address against the current district zoning map.',
    amenities: [
      'Community swimming pool',
      'Clubhouse',
      'Playground',
      'Sidewalk network throughout',
      'Larger-than-average lots with mature landscaping',
    ],
    homeStyles: [
      'All-brick and brick-and-stone traditional homes',
      'Four- and five-bedroom plans with bonus rooms',
      'Two- to three-car garages',
      'Lots roughly 0.19–0.43 acre',
    ],
    whyBullets: [
      'Land and maturity: Cherry Grove’s larger lots and mature tree canopy are increasingly rare in Spring Hill, where newer subdivisions pack homes closer together.',
      'Summit High zoning: A consistent Williamson County Schools assignment — with Summit High serving the neighborhood — is the resale anchor here.',
      'Built out and stable: With construction long finished, Cherry Grove trades as a tight resale market with a settled, long-tenured resident base.',
    ],
    faqs: [
      {
        q: 'How much do homes in Cherry Grove cost in 2026?',
        a: 'Recent listings have generally run from the high $500s to just over $1M, with a median around the mid-$700s. Larger all-brick homes on premium lots sit at the top of that range. Joshua can pull current Cherry Grove comps for an exact, up-to-date read.',
      },
      {
        q: 'Is Cherry Grove in Williamson or Maury County?',
        a: 'Williamson County. It sits on the north/Thompson’s Station side of Spring Hill and is zoned to Williamson County Schools (Summit High). A few listing portals mistag it as Maury, but the district and county records place it in Williamson.',
      },
      {
        q: 'What schools are zoned to Cherry Grove?',
        a: 'Williamson County Schools, with Summit High serving the community. Elementary and middle assignments vary by phase — typically Allendale or Bethesda Elementary and Spring Station or Thompson’s Station Middle — so confirm the exact address with the district before making an offer.',
      },
      {
        q: 'What makes Cherry Grove different from newer Spring Hill subdivisions?',
        a: 'Lot size and maturity. Cherry Grove was built on larger lots with established landscaping, and it’s fully built out, so you’re buying into a settled community rather than an active construction site — at a Williamson County school address.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7730,
    longitude: -86.8880,
  },

  'campbell-station-spring-hill-tn': {
    slug: 'campbell-station-spring-hill-tn',
    name: 'Campbell Station',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Williamson County',
    metaTitle: 'Campbell Station Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Campbell Station in Spring Hill, TN: an established all-brick Williamson County community off Columbia Pike, walkable to Main Street, on generous lots. Local insight from Compass agent Joshua Fink.',
    intro:
      'Campbell Station is one of Spring Hill’s premier established communities — roughly 485 all-brick homes off Columbia Pike on the Williamson County side, on generous lots and within walking distance of Main Street shops and grocery.',
    about:
      'Campbell Station sits off Columbia Pike along Campbell Station Parkway, on the Williamson County side of Spring Hill. Built largely in the 2000s (roughly 2003–2013), it is a sizable, settled community of about 485 homes — predominantly all-brick single-family homes in traditional and colonial styling, both ranch and two-story, plus a separate townhome enclave (The Highlands) governed by its own HOA. Single-family homes are substantial, often 2,800 to 5,800 square feet with three or more bedrooms, formal living and dining rooms, bonus rooms, and frequently three-car garages, on generous lots ranging from about a quarter acre to over three-quarters of an acre. Amenities center on a community pool and cabana along sidewalk-lined streets with mature landscaping; the standout feature is location — walkable to Spring Hill’s Main Street retail.',
    vibe: 'Premier established all-brick community on large lots, walkable to Main Street.',
    priceBand: '$650K – $1.1M (approx.)',
    buildYears: 'Roughly 2003 to 2013',
    hoa: 'Active HOA (roughly $55–$57/month) covering common areas, entrance landscaping, and the community pool. The Highlands townhome section has its own separate HOA. Confirm current dues before writing an offer.',
    schoolNotes:
      'Campbell Station is zoned to Williamson County Schools — typically Heritage Middle and Independence High, with elementary assignment varying by location within the subdivision (Longview, Amanda H. North, or Heritage Elementary; the portion north of Campbell Station Parkway has been sent to Heritage). WCS rezones periodically, so verify the specific address with the district.',
    amenities: [
      'Community swimming pool',
      'Pool cabana',
      'Sidewalk-lined streets',
      'Mature landscaping and maintained common areas',
      'Walking distance to Main Street retail and grocery',
    ],
    homeStyles: [
      'All-brick traditional and colonial single-family homes',
      'Both ranch and two-story plans, roughly 2,800–5,800 sq ft',
      'Formal living/dining rooms, bonus rooms, three-car garages',
      'Separate townhome enclave (The Highlands)',
      'Generous lots from about 0.26 to 0.84 acre',
    ],
    whyBullets: [
      'Walkability is rare here: Few Spring Hill subdivisions put you within walking distance of Main Street shops and grocery — Campbell Station does.',
      'Space and presence: Larger lots and substantial all-brick homes give Campbell Station a more established, settled feel than newer tract communities.',
      'Williamson County Schools: A consistent WCS assignment (Heritage Middle / Independence High) underpins long-term resale.',
    ],
    faqs: [
      {
        q: 'How much do homes in Campbell Station cost in 2026?',
        a: 'As of early 2026, active listings have generally run from roughly $690K to $975K, with a broader trailing-year range of about $650K to $1.1M for larger homes on premium lots. Joshua can pull current Campbell Station comps for an exact figure.',
      },
      {
        q: 'Is Campbell Station in Williamson or Maury County?',
        a: 'Williamson County. The community’s own HOA describes it as being in southern Williamson County, and it falls within Williamson County Schools attendance zones.',
      },
      {
        q: 'What schools are zoned to Campbell Station?',
        a: 'Williamson County Schools — generally Heritage Middle and Independence High, with the elementary assignment varying by section (Longview, Amanda H. North, or Heritage). Because the subdivision is split by Campbell Station Parkway and WCS rezones periodically, verify your specific address with the district.',
      },
      {
        q: 'Are there townhomes in Campbell Station?',
        a: 'Yes — The Highlands is a townhome enclave within Campbell Station, governed by its own separate HOA. The bulk of the community is larger all-brick single-family homes.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7510,
    longitude: -86.9120,
  },

  'autumn-ridge-spring-hill-tn': {
    slug: 'autumn-ridge-spring-hill-tn',
    name: 'Autumn Ridge',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Williamson County',
    metaTitle: 'Autumn Ridge Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Autumn Ridge in Spring Hill, TN: an upscale custom-home community off Miles Johnson Parkway in Williamson County with a pool, clubhouse, and pond on larger lots. Local insight from Compass agent Joshua Fink.',
    intro:
      'Autumn Ridge is an upscale, custom-home enclave off Miles Johnson Parkway on the Williamson County side of Spring Hill — large all-brick homes on generous lots, a full amenity package (pool, clubhouse, pond), and a top-rated WCS school zone.',
    about:
      'Autumn Ridge sits off Miles Johnson Parkway in central Spring Hill (37174), with quick I-65 access and walkability to Harvey Park. Developed across multiple phases from roughly 2007/2008 onward by a roster of custom builders, it sits at the higher end of the Spring Hill market. Homes are all-brick and brick-and-stone custom builds, generally 3,000 to 4,600 square feet (some larger), typically four to five-plus bedrooms with three-car garages, on lots around a third of an acre and up — larger than many neighboring communities. The amenity package, built out around 2014, includes a community pool and clubhouse, a catch-and-release pond, a playground, and walking trails. (Note: Autumn Ridge and the adjacent, separately-named "Arbors at Autumn Ridge" are distinct communities with different HOAs, amenities, and price points — this guide covers Autumn Ridge proper.)',
    vibe: 'Upscale custom-home community on larger lots with resort-style amenities.',
    priceBand: '$510K – $1.35M (approx.)',
    buildYears: 'Roughly 2007/2008 to present (phased)',
    hoa: 'Active HOA (roughly $61–$62/month) covering the clubhouse, pool, pond, playground/trails, and common-area upkeep. Confirm current dues with the HOA.',
    schoolNotes:
      'Autumn Ridge is zoned to Williamson County Schools — typically Heritage Middle and Independence High, with elementary assignment varying by address (Longview or Amanda H. North). Some older listings reference Spring Hill High. WCS rezones periodically, so verify the specific address with the district.',
    amenities: [
      'Community swimming pool (built ~2014)',
      'Clubhouse (built ~2014)',
      'Catch-and-release pond',
      'Playground and walking trails',
      'Underground utilities; adjacent to Harvey Park',
    ],
    homeStyles: [
      'All-brick and brick-and-stone custom homes',
      'Generally 3,000–4,600+ sq ft, four to five-plus bedrooms',
      'Three-car (some four-car) garages',
      'Larger lots, roughly a third of an acre and up',
    ],
    whyBullets: [
      'Custom, not tract: Autumn Ridge was built by a roster of custom builders, so the homes have more individual character than typical production neighborhoods.',
      'Full amenity package: Pool, clubhouse, pond, and trails put it among the more amenity-rich communities in Spring Hill.',
      'Upper-end WCS address: Larger lots, larger homes, and Williamson County Schools place it at the higher end of the local market with strong relocation appeal.',
    ],
    faqs: [
      {
        q: 'How much do homes in Autumn Ridge cost in 2026?',
        a: 'As of early 2026, Autumn Ridge spans a wide range — roughly $510K to $1.35M — with recent medians often in the high-$700s to low-seven-figures depending on size and lot. It’s one of Spring Hill’s upper-end communities. Joshua can pull current comps for a precise read.',
      },
      {
        q: 'Is Autumn Ridge the same as Arbors at Autumn Ridge?',
        a: 'No. They are two distinct, adjacent communities that share a name. Autumn Ridge (off Miles Johnson Parkway) has the pool, clubhouse, and pond and larger lots; Arbors at Autumn Ridge (off Wilkes Lane) is smaller-lot with a lower HOA and no pool/clubhouse. This guide covers Autumn Ridge proper.',
      },
      {
        q: 'What schools are zoned to Autumn Ridge?',
        a: 'Williamson County Schools — generally Heritage Middle and Independence High, with the elementary (Longview or Amanda H. North) varying by address. Zoning can change, so confirm the specific address with the district before making an offer.',
      },
      {
        q: 'Is Autumn Ridge in Williamson or Maury County?',
        a: 'Williamson County. Multiple independent sources and its WCS school zoning confirm Autumn Ridge proper sits entirely on the Williamson side of Spring Hill.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7600,
    longitude: -86.9310,
  },

  'benevento-spring-hill-tn': {
    slug: 'benevento-spring-hill-tn',
    name: 'Benevento',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Williamson County',
    metaTitle: 'Benevento Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Benevento in Spring Hill, TN: an Italian-themed, all-brick Williamson County community off Buckner Lane with fountains, tree-lined sidewalks, and Summit High zoning. Local insight from Compass agent Joshua Fink.',
    intro:
      'Benevento is a small, upscale, Italian-inspired community off Buckner Lane on the Williamson County side of Spring Hill — all-brick and brick-and-stone homes, cascading fountains, arched entrances, and Italian street names, just outside Franklin.',
    about:
      'Benevento sits off Buckner Lane near Duplex Road in the 37174 ZIP, between US-31 and I-65, on the Williamson County side of Spring Hill. Developed from the mid-2000s onward — the original Benevento (roughly 80–85 homes) starting around 2006, with the adjacent Benevento East phase running from about 2010 to 2018 and newer construction since — it is a relatively small, cohesive community of roughly 100-plus acres. The architecture leans Italian: arched and columned entrances, cascading fountains, tree-canopied sidewalks, and Italian-themed street names (Maleventum Way, Via Francesco Drive, Appian Way). Homes are mainly all-brick or brick-and-stone, generally 2,500 to 4,500 square feet with three to five bedrooms, on lots of roughly a quarter to a half acre. The original section has a community pool and playground; Benevento East has a lower HOA and relies on nearby Port Royal Park and greenways. Saturn Parkway puts Franklin, Brentwood, and Nashville within an easy commute.',
    vibe: 'Small, elegant, Italian-themed all-brick enclave with fountains and tree-lined sidewalks.',
    priceBand: '$675K – $1.2M (approx.)',
    buildYears: 'Roughly 2006 to present (Benevento East ~2010–2018)',
    hoa: 'Active HOA; dues vary by section (roughly $32–$50/month). The original section’s dues cover a community pool and common areas; Benevento East carries lower dues and no pool. Confirm current dues with the HOA.',
    schoolNotes:
      'Benevento is zoned to Williamson County Schools — most commonly Allendale Elementary, Spring Station Middle, and Summit High. WCS rezones periodically and the official district map governs, so verify the specific address before writing an offer.',
    amenities: [
      'Community pool and playground (original Benevento section)',
      'Cascading fountains and arched, Italian-themed entrances',
      'Tree-canopied sidewalks throughout',
      'Near Port Royal Park and greenways',
    ],
    homeStyles: [
      'Italian-aesthetic traditional homes',
      'All-brick and brick-and-stone exteriors with columned porches',
      'Generally 2,500–4,500 sq ft, three to five bedrooms',
      'Lots roughly a quarter to a half acre',
    ],
    whyBullets: [
      'A distinctive look: Benevento’s consistent Italian theme — fountains, arched entrances, brick-and-stone elevations — gives it a more elegant, cohesive feel than typical Spring Hill subdivisions.',
      'Small and cohesive: At roughly 80–85 original homes plus the East phase, it’s an intimate community rather than a sprawling one.',
      'Williamson schools, easy commute: Summit High zoning plus quick Saturn Parkway/I-65 access to Franklin, Brentwood, and Nashville.',
    ],
    faqs: [
      {
        q: 'How much do homes in Benevento cost in 2026?',
        a: 'As of early 2026, Benevento homes have generally run from roughly $675K to $1.2M, with recent active listings in the $730K–$950K range and a median in the high $700s. Joshua can pull current comps for the original section versus Benevento East.',
      },
      {
        q: 'Is Benevento in Williamson or Maury County?',
        a: 'Williamson County. Multiple independent sources and its Williamson County Schools zoning place Benevento on the Williamson side of Spring Hill, just outside Franklin — despite an occasional online mistag as Maury.',
      },
      {
        q: 'What schools are zoned to Benevento?',
        a: 'Williamson County Schools — commonly Allendale Elementary, Spring Station Middle, and Summit High. Zoning can change, so confirm the specific address against the current district map before making an offer.',
      },
      {
        q: 'What is the difference between Benevento and Benevento East?',
        a: 'They’re adjacent phases of the same community. The original Benevento (mid-2000s) has a community pool and a slightly higher HOA; Benevento East (roughly 2010 onward) is newer, carries lower dues, and has no pool of its own, with residents using nearby Port Royal Park.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7280,
    longitude: -86.8820,
  },

  'spring-hill-place-spring-hill-tn': {
    slug: 'spring-hill-place-spring-hill-tn',
    name: 'Spring Hill Place',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Williamson County',
    metaTitle: 'Spring Hill Place Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Spring Hill Place in Spring Hill, TN: an established Williamson County community off Buckner Lane with a pool, clubhouse, tennis, and a pond, zoned to Summit High. Local insight from Compass agent Joshua Fink.',
    intro:
      'Spring Hill Place is an established, amenity-rich community off Buckner Lane on the Williamson County side of Spring Hill — roughly 200 brick homes with a pool, clubhouse, tennis courts, and a neighborhood pond, zoned to Summit High.',
    about:
      'Spring Hill Place sits off Buckner Lane between US-31 and I-65 in the 37174 ZIP, on the Williamson County side of Spring Hill. Built out from roughly 2002 to the mid-2010s as an approximately 200-home community, it offers traditional and transitional single-family homes — multiple gables, front porches, and columns — in all-brick and brick-and-siding, generally 2,000 to 4,500 square feet on lots of about a quarter to a third of an acre. It is one of the more amenity-rich established neighborhoods in this part of Spring Hill, with a community pool, clubhouse, tennis courts, and a pond, along with sidewalks and mature landscaping. It is not gated. Saturn Parkway and I-65 put Cool Springs, Franklin, and Nashville within easy reach.',
    vibe: 'Established, amenity-rich Williamson-County community with pool, clubhouse, and tennis.',
    priceBand: '$615K – $1.22M (approx.)',
    buildYears: 'Roughly 2002 to 2014',
    hoa: 'Active HOA (recent figures around $75–$82/month; older sources cite less). Covers the pool, clubhouse, tennis courts, and common-area landscaping. Confirm current dues with the HOA before writing an offer.',
    schoolNotes:
      'Spring Hill Place is zoned to Williamson County Schools — typically Allendale Elementary, Spring Station Middle, and Summit High. WCS rezones periodically as schools reach capacity, so verify the specific address against the current district zoning map.',
    amenities: [
      'Community swimming pool',
      'Clubhouse',
      'Tennis courts',
      'Neighborhood pond',
      'Sidewalks and mature landscaping (not gated)',
    ],
    homeStyles: [
      'Traditional and transitional single-family homes',
      'All-brick and brick-and-siding exteriors with gables and porches',
      'Generally 2,000–4,500 sq ft',
      'Lots roughly 0.23–0.41 acre',
    ],
    whyBullets: [
      'Amenities for the price band: Pool, clubhouse, tennis, and a pond make Spring Hill Place one of the more amenity-rich established communities in this pocket of Spring Hill.',
      'Summit High zoning: A consistent Williamson County Schools assignment is a core part of the resale story.',
      'Established and convenient: Built out by the mid-2010s with mature landscaping, and minutes from Buckner Lane shopping and the I-65 corridor.',
    ],
    faqs: [
      {
        q: 'How much do homes in Spring Hill Place cost in 2026?',
        a: 'As of early 2026, active listings have generally run from the mid-$600s to about $1.22M, with a trailing-year median in the high-$800s to low-$900s. Active inventory is small, so Joshua can pull current closed comps for an exact, up-to-date number.',
      },
      {
        q: 'Is Spring Hill Place in Williamson or Maury County?',
        a: 'Williamson County. Every source consistently places it on the Williamson side of Spring Hill, off Buckner Lane, with Williamson County Schools zoning.',
      },
      {
        q: 'What schools are zoned to Spring Hill Place?',
        a: 'Williamson County Schools — typically Allendale Elementary, Spring Station Middle, and Summit High. Because WCS rezones periodically, verify the specific address against the current district map before making an offer.',
      },
      {
        q: 'Does Spring Hill Place have an HOA, and what does it cover?',
        a: 'Yes. The HOA covers the pool, clubhouse, tennis courts, and common-area landscaping. Recent dues figures are around $75–$82/month, though older sources cite less — confirm the current amount with the HOA.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7120,
    longitude: -86.9020,
  },

  // ───────────────────────────────────────────────────────────────────────
  // SPRING HILL, TN — MAURY COUNTY side (added 2026-06-03). The more attainable
  // side of the Williamson/Maury line, zoned to Maury County Public Schools
  // (lower property taxes than the Williamson side). Price bands and school
  // zoning are research-sourced from public listing/brokerage/district data and
  // FLAGGED FOR JOSHUA TO VERIFY (see PR). Notes: Port Royal Estates and Dartford
  // genuinely STRADDLE the county line (some addresses are Williamson) — the
  // guides say so and tell buyers to confirm per address. Hampton Springs was
  // recently rezoned to the newer Battle Creek schools. HOA dues are estimates.
  // ───────────────────────────────────────────────────────────────────────
  'harvest-point-spring-hill-tn': {
    slug: 'harvest-point-spring-hill-tn',
    name: 'Harvest Point',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Maury County',
    metaTitle: 'Harvest Point Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Harvest Point in Spring Hill, TN: a large, amenity-rich master-planned community on the Maury County side off Cleburne Road — pool, trails, dog park, and a wide price range. Local insight from Compass agent Joshua Fink.',
    intro:
      'Harvest Point is one of Spring Hill’s largest and most amenity-rich master-planned communities — a walkable, resort-style neighborhood off Cleburne Road on the Maury County side, with everything from townhomes to larger single-family homes and a deep amenity package.',
    about:
      'Harvest Point sits in southwest Spring Hill off Cleburne Road, on the Maury County side of the city, just past Spring Hill Middle School (which abuts the community). Built out across 16+ phases since 2018 by builders including D.R. Horton and Celebration Homes (with Regent and Phillips also active in places), it offers a broad mix of product — townhomes from around 1,240 square feet up to single-family homes near 4,000 square feet, mostly traditional architecture with fiber-cement and brick exteriors on compact suburban lots. The draw is the lifestyle: a resort-style pool with a splash pad, a clubhouse, dog park, tennis courts, playgrounds, walking trails along the creeks, a community garden, and on-site/adjacent shopping. Being on the Maury side, it carries lower Maury County property taxes than comparable Williamson County addresses, with Franklin/Cool Springs and Columbia each roughly 15–25 minutes away.',
    vibe: 'Large, amenity-rich master-planned community with a “small-town meets resort” feel at an attainable price.',
    priceBand: '$350K – $850K (approx.)',
    buildYears: '2018 to present (16+ phases, still building)',
    hoa: 'Active HOA. Single-family dues are modest (roughly $65–$90/month, some phases billed quarterly); townhomes run higher (~$215–$225/month) and cover exterior maintenance. Confirm current dues for the specific phase with the HOA.',
    schoolNotes:
      'Harvest Point is served by Maury County Public Schools — most commonly Spring Hill Elementary, Spring Hill Middle (adjacent to the community), and Spring Hill High. A small number of homes may zone differently, and Maury County adjusts boundaries over time, so verify the assignment for the specific address with the district.',
    amenities: [
      'Resort-style pool with splash pad',
      'Clubhouse / pool house',
      'Dog park and tennis courts',
      'Playgrounds and walking/nature trails',
      'Community garden and on-site/adjacent shopping',
    ],
    homeStyles: [
      'Single-family homes roughly 1,672–3,971 sq ft',
      'Townhomes roughly 1,240–2,460 sq ft',
      'Traditional architecture, fiber-cement/brick exteriors',
      'Builders include D.R. Horton and Celebration Homes',
      'Compact suburban lots (~0.15–0.25 acre)',
    ],
    whyBullets: [
      'Amenities for the money: Harvest Point’s pool, clubhouse, dog park, tennis, and trails rival far pricier communities — at a Maury-County price point.',
      'Something for every buyer: Townhomes for first-time buyers through larger single-family homes for move-up families, all under one HOA.',
      'Lower taxes, easy commute: The Maury-side location means lower property taxes, with quick access to retail, I-65, and both Franklin and Columbia.',
    ],
    faqs: [
      {
        q: 'How much do homes in Harvest Point cost in 2026?',
        a: 'As of mid-2026, Harvest Point spans roughly $350K to $850K — townhomes generally in the $350K–$475K range and single-family homes from the mid-$400s into the $800s, with new construction available. Joshua can pull current comps for the specific product and phase you’re considering.',
      },
      {
        q: 'Is Harvest Point in Williamson or Maury County?',
        a: 'Maury County. It sits in southwest Spring Hill off Cleburne Road, is served by Maury County Public Schools, and carries Maury County’s lower property-tax rate compared with the Williamson side of Spring Hill.',
      },
      {
        q: 'What schools are zoned to Harvest Point?',
        a: 'Maury County Public Schools — most commonly Spring Hill Elementary, Spring Hill Middle (right next to the community), and Spring Hill High. Zoning can change and a few homes may differ, so verify the specific address with the district before making an offer.',
      },
      {
        q: 'What amenities does Harvest Point have?',
        a: 'A lot — a resort-style pool with splash pad, clubhouse, dog park, tennis courts, playgrounds, walking trails, and a community garden, plus on-site and adjacent shopping. It’s one of the most amenity-rich communities in Spring Hill.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7379,
    longitude: -86.9777,
  },

  'port-royal-estates-spring-hill-tn': {
    slug: 'port-royal-estates-spring-hill-tn',
    name: 'Port Royal Estates',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Maury County',
    metaTitle: 'Port Royal Estates Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Port Royal Estates in Spring Hill, TN: an attainable, established community off Port Royal Road, mostly Maury County with a Williamson-zoned pocket. Local insight from Compass agent Joshua Fink.',
    intro:
      'Port Royal Estates is one of Spring Hill’s more attainable established neighborhoods — mid-size brick homes off Port Royal Road with neighborhood pools and easy I-65 access. Most of it is Maury County, but it straddles the county line, so a handful of addresses fall in Williamson.',
    about:
      'Port Royal Estates sits off Port Royal Road in the 37174 ZIP, developed from the mid-2000s onward in phases. It’s part of a cluster of related-but-distinct communities under the “Port Royal” name — Port Royal Estates (the original sections), The Reserve at Port Royal (larger single-family sections), and the Villas at Port Royal (attached townhomes) — so it pays to know which one a listing is in. Homes here are traditional suburban single-family designs, typically all-brick or brick-and-vinyl, three to four bedrooms, roughly 1,700–3,000 square feet on quarter-acre-ish lots. The neighborhood’s defining quirk is that it straddles the Maury/Williamson county line: most homes are Maury County (Marvin Wright / Spring Hill schools), but a subset in Section 2 falls in Williamson County (Chapman’s Retreat / Spring Station / Summit) — meaning two homes a few doors apart can sit in different counties and school districts. Modest HOA dues fund shared amenities, and Saturn Parkway puts I-65 about five minutes away.',
    vibe: 'Attainable, established brick-home neighborhood with pools and easy I-65 access.',
    priceBand: '$415K – $585K single-family (townhomes from ~$289K)',
    buildYears: 'Roughly 2006 to 2016',
    hoa: 'Active HOA. Single-family dues are modest (roughly $44–$55/month); the Villas townhomes run higher (~$130–$180/month) for exterior maintenance. Confirm current dues with the HOA.',
    schoolNotes:
      'Most Port Royal Estates addresses are Maury County Public Schools — typically Marvin Wright Elementary, Spring Hill Middle, and Spring Hill High. However, some Section 2 addresses fall in Williamson County Schools (Chapman’s Retreat Elementary, Spring Station Middle, Summit High). Because the county line runs through the area, you MUST verify the county and school assignment for the exact address.',
    amenities: [
      'Community pool(s)',
      'Playground(s)',
      'Sidewalks and (in some sections) underground utilities',
      'About 5 minutes to Saturn Parkway / I-65',
      'Near the Port Royal Publix',
    ],
    homeStyles: [
      'Traditional suburban single-family homes',
      'All-brick and brick-and-vinyl exteriors',
      'Typically 3–4 bedrooms, roughly 1,700–3,000 sq ft',
      'Quarter-acre-ish lots (townhomes much smaller)',
    ],
    whyBullets: [
      'Attainable entry to Spring Hill: Single-family homes here generally sit below the Williamson-side communities, and the Villas townhomes open the door near $300K.',
      'Pools and convenience: Neighborhood pools, sidewalks, and a five-minute hop to I-65 make it an easy commuter pick.',
      'Know your county line: The Maury/Williamson split is a feature if you understand it — Joshua confirms the exact county, tax rate, and schools before you write an offer.',
    ],
    faqs: [
      {
        q: 'How much do homes in Port Royal Estates cost in 2026?',
        a: 'As of mid-2026, detached single-family homes generally run from roughly $415K to $585K, while the attached Villas townhomes have started near $289K. The widely-seen “from $289K” headline refers to those townhomes, not detached homes. Joshua can pull current comps for the exact section.',
      },
      {
        q: 'Is Port Royal Estates in Williamson or Maury County?',
        a: 'Mostly Maury County, but it straddles the line — a subset of Section 2 addresses are in Williamson County. That changes both the property-tax rate and the school district, so it’s essential to verify the specific address.',
      },
      {
        q: 'What schools are zoned to Port Royal Estates?',
        a: 'Maury-side homes are typically zoned to Marvin Wright Elementary, Spring Hill Middle, and Spring Hill High (Maury County Public Schools). Williamson-side (Section 2) homes are zoned to Chapman’s Retreat Elementary, Spring Station Middle, and Summit High (Williamson County Schools). Confirm the exact address before making an offer.',
      },
      {
        q: 'What’s the difference between Port Royal Estates, The Reserve at Port Royal, and the Villas?',
        a: 'They’re related but separate. Port Royal Estates is the original single-family sections; The Reserve at Port Royal is a larger, somewhat newer single-family development (300+ homes); and the Villas at Port Royal are attached townhomes with their own pool. Listings under “Port Royal” can be any of the three, so check which one.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7380,
    longitude: -86.9040,
  },

  'reserve-at-port-royal-spring-hill-tn': {
    slug: 'reserve-at-port-royal-spring-hill-tn',
    name: 'The Reserve at Port Royal',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Maury County',
    metaTitle: 'The Reserve at Port Royal Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'The Reserve at Port Royal in Spring Hill, TN: a 300+ home single-family community off Reserve Boulevard on the Maury County side, with a pool and playground. Local insight from Compass agent Joshua Fink.',
    intro:
      'The Reserve at Port Royal is a large single-family community — over 300 homes off Reserve Boulevard on the Maury County side of Spring Hill, with a neighborhood pool, playground, and quick I-65 access. It’s distinct from the older Port Royal Estates next door.',
    about:
      'The Reserve at Port Royal is the larger single-family component of the broader “Port Royal” area in Spring Hill, off Reserve Boulevard in the 37174 ZIP — not to be confused with the adjacent, older Port Royal Estates or the Villas at Port Royal townhomes. Built largely from the mid-2000s through the 2010s, it’s a family-oriented community of 300-plus homes on compact suburban lots (roughly 0.20–0.25 acre), generally 2,200–4,100 square feet with three to four bedrooms in traditional suburban styling. A community pool and playground anchor the amenities, and the location is minutes from I-65, shopping, and dining. Most addresses are Maury County (served by Maury County Public Schools), though the wider Port Royal area touches the Williamson line, so the exact county and school assignment should be confirmed per address.',
    vibe: 'Large, family-friendly single-family community with a neighborhood pool, value-priced on the Maury side.',
    priceBand: '$465K – $720K (approx.)',
    buildYears: 'Roughly mid-2000s to mid-2010s',
    hoa: 'Active HOA (managed by Acclaimed Property Management) covering the community pool, playground, and common areas. Specific dues weren’t publicly listed — confirm the current amount with the HOA.',
    schoolNotes:
      'The Reserve at Port Royal is primarily Maury County Public Schools — typically Marvin Wright Elementary, Spring Hill Middle, and Spring Hill High (some addresses surface Spring Hill Elementary). Because the broader Port Royal area straddles the county line, verify the county and school assignment for the specific address.',
    amenities: [
      'Community swimming pool',
      'Playground',
      'Sidewalks and green space (300+ homes)',
      'Minutes from I-65, shopping, and dining',
    ],
    homeStyles: [
      'Traditional suburban single-family homes',
      'Typically 3–4 bedrooms, roughly 2,200–4,100 sq ft',
      'Compact suburban lots (~0.20–0.25 acre)',
    ],
    whyBullets: [
      'Scale and amenities: At 300-plus homes with a pool and playground, The Reserve offers a full neighborhood feel at a Maury-County price.',
      'Newer, larger product: Generally larger single-family homes than the adjacent Port Royal Estates, appealing to move-up families.',
      'Commuter-friendly value: Minutes to I-65 with lower Maury property taxes than the Williamson side of town.',
    ],
    faqs: [
      {
        q: 'How much do homes in The Reserve at Port Royal cost in 2026?',
        a: 'Recent single-family listings have generally run from roughly $465K to $720K depending on size and lot. Active inventory is small, so figures move quickly — Joshua can pull current closed comps for an exact read.',
      },
      {
        q: 'Is The Reserve at Port Royal the same as Port Royal Estates?',
        a: 'No. They’re adjacent and share the “Port Royal” name, but they’re separate communities. The Reserve is a larger, somewhat newer single-family development (300+ homes off Reserve Boulevard); Port Royal Estates is the older original sections. There are also the Villas at Port Royal townhomes.',
      },
      {
        q: 'Is The Reserve at Port Royal in Williamson or Maury County?',
        a: 'Most addresses are Maury County (Maury County Public Schools). The broader Port Royal area sits near the county line, so confirm the exact county, tax rate, and school zone for the specific address before making an offer.',
      },
      {
        q: 'What schools serve The Reserve at Port Royal?',
        a: 'Primarily Maury County Public Schools — typically Marvin Wright Elementary, Spring Hill Middle, and Spring Hill High (some addresses show Spring Hill Elementary). Zoning can change, so verify per address.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7385,
    longitude: -86.9045,
  },

  'hampton-springs-spring-hill-tn': {
    slug: 'hampton-springs-spring-hill-tn',
    name: 'Hampton Springs',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Maury County',
    metaTitle: 'Hampton Springs Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Hampton Springs in Spring Hill, TN: an attainable, established Maury County community off Kedron Road with a pool, single-family homes and townhomes, and low HOA dues. Local insight from Compass agent Joshua Fink.',
    intro:
      'Hampton Springs is one of the more affordable established communities on the Maury County side of Spring Hill — a mix of mature single-family streets and newer townhomes off Kedron Road, with a pool, low single-family HOA dues, and quick I-65 access.',
    about:
      'Hampton Springs sits off Kedron Road (via Port Royal Road) in the 37174 ZIP, on the Maury County side of Spring Hill. Built out over roughly 15 years — single-family from around 2004/2006 and townhomes added from the mid-2010s through about 2021 — it offers both established and newer product. Single-family homes run roughly 1,774–2,812 square feet (three to five bedrooms) in traditional and ranch styles with partial-brick or all-brick exteriors; the townhomes are around 1,620–1,772 square feet with attached two-car garages. A community pool and playground anchor the amenities along a walkable, sidewalk-connected layout. Notably low single-family HOA dues (around $30/month) make it attractive to budget-conscious buyers. The community was recently rezoned into the newer Battle Creek schools, which buyers should confirm per address.',
    vibe: 'Established, attainably-priced community mixing brick homes and townhomes with a pool and low dues.',
    priceBand: '$412K – $545K single-family (townhomes ~$340K–$385K)',
    buildYears: 'Roughly 2004/2006 to 2021',
    hoa: 'Active HOA with low single-family dues (around $27–$30/month); townhomes run higher (~$175–$190/month) for exterior maintenance. Confirm current dues with the HOA.',
    schoolNotes:
      'Hampton Springs is served by Maury County Public Schools. After the Battle Creek schools opened (~2021), much of this area rezoned to Battle Creek Elementary and Battle Creek Middle, with Spring Hill High for high school — though some older listings still cite Marvin Wright Elementary and Spring Hill Middle. Because this zoning changed recently, verify the specific address against the Maury County Public Schools street list.',
    amenities: [
      'Community swimming pool',
      'Playground',
      'Sidewalk-connected, walkable streets',
      'Underground utilities (portions)',
      'Minutes to Spring Hill retail and I-65',
    ],
    homeStyles: [
      'Single-family homes ~1,774–2,812 sq ft, 3–5 bedrooms',
      'Townhomes ~1,620–1,772 sq ft with 2-car garages',
      'Traditional and ranch styles, partial- or all-brick',
      'Midsize suburban lots on a sidewalk grid',
    ],
    whyBullets: [
      'Low cost of ownership: Single-family HOA dues around $30/month are among the lowest of any amenity neighborhood in Spring Hill.',
      'Options for every buyer: Newer townhomes for first-time buyers and established single-family homes for growing families.',
      'Newer schools nearby: Recent rezoning into the Battle Creek schools (opened ~2021) is a plus — just confirm the assignment for your exact address.',
    ],
    faqs: [
      {
        q: 'How much do homes in Hampton Springs cost in 2026?',
        a: 'As of mid-2026, single-family homes generally run from roughly $412K to $545K, with townhomes around $340K–$385K. Active inventory is small, so Joshua can pull current comps for the specific product type.',
      },
      {
        q: 'Is Hampton Springs in Williamson or Maury County?',
        a: 'Maury County. Property records for the Kedron Road area and its Maury County Public Schools zoning confirm it — despite a couple of generic directory pages that loosely say Williamson.',
      },
      {
        q: 'What schools are zoned to Hampton Springs?',
        a: 'Maury County Public Schools. Much of the area was rezoned to the newer Battle Creek Elementary and Battle Creek Middle (opened ~2021), with Spring Hill High for high school; some older listings still reference Marvin Wright Elementary and Spring Hill Middle. Because this changed recently, verify the exact address with the district.',
      },
      {
        q: 'Does Hampton Springs have townhomes?',
        a: 'Yes — newer townhomes (roughly 1,620–1,772 sq ft, three-bed, two-car garage) were added alongside the established single-family homes. Townhome HOA dues are higher than single-family because they cover exterior maintenance.',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7200,
    longitude: -86.9240,
  },

  'dartford-spring-hill-tn': {
    slug: 'dartford-spring-hill-tn',
    name: 'Dartford',
    city: 'Spring Hill',
    citySlug: 'spring-hill-tn',
    county: 'Maury County',
    metaTitle: 'Dartford Neighborhood Guide — Spring Hill, TN',
    metaDescription:
      'Dartford in Spring Hill, TN: a newer Pulte-built community off Port Royal Road on the Maury County side, with trail access and low HOA dues. Local insight from Compass agent Joshua Fink.',
    intro:
      'Dartford is a newer, compact Pulte-built community off Port Royal Road on the Maury County side of Spring Hill — sub-$500K homes, low HOA dues, and trail access near Port Royal Park, with easy I-65/Saturn Parkway commuting.',
    about:
      'Dartford is a small, uniform Pulte community delivered around 2019–2021 off Port Royal Road in the 37174 ZIP. The core streets — Lonergan Circle, Cadence Drive, Sercy Drive — sit in Maury County, with homes typically three to four bedrooms, around 2,060–2,440 square feet, featuring open-concept layouts, nine-foot main-level ceilings, and two-car garages on small suburban lots (~0.15–0.21 acre). It’s a popular choice for first-time and relocating buyers thanks to its sub-$500K Maury-side pricing and low (~$55/month) HOA. The single most important buyer detail is the county line: Dartford sits right on it, and a separately-marketed “Phase 2” pocket (Posada Court) is actually Williamson County (Chapman’s Retreat / Spring Station / Summit), so county, tax rate, and schools can differ by exact address. Amenities are modest — trails and proximity to Port Royal Park rather than a pool or clubhouse.',
    vibe: 'Newer, compact Pulte enclave with trail access and attainable Maury-side pricing.',
    priceBand: '$435K – $530K (approx., Maury-side homes)',
    buildYears: 'Roughly 2019 to 2021',
    hoa: 'Active HOA (around $55/month) covering common-area and grounds maintenance. No community pool or clubhouse. Confirm current dues with the HOA.',
    schoolNotes:
      'The Maury-side core of Dartford (Lonergan/Cadence/Sercy) is zoned to Maury County Public Schools — Marvin Wright Elementary, Spring Hill Middle, and Spring Hill High. A separately-marketed “Phase 2” pocket on Posada Court is in Williamson County (Chapman’s Retreat Elementary, Spring Station Middle, Summit High). Because Dartford sits on the county line, verify the county and school assignment for the exact address.',
    amenities: [
      'Walking / multi-use trails',
      'Near Port Royal Park (disc golf, picnic areas, river access)',
      'Saturn Parkway greenway nearby',
      'No on-site pool or clubhouse',
      'Quick access to Port Royal Road retail and I-65',
    ],
    homeStyles: [
      'Pulte production homes, early-2020s build',
      'Typically 3–4 bedrooms, ~2,060–2,440 sq ft',
      'Open-concept layouts, 9-ft main-level ceilings, 2-car garages',
      'Small suburban lots (~0.15–0.21 acre)',
    ],
    whyBullets: [
      'Newer at an attainable price: Early-2020s Pulte construction under $500K on the Maury side is increasingly hard to find in Spring Hill.',
      'Low carrying cost: A ~$55/month HOA and Maury County tax rate keep ownership costs down.',
      'Mind the county line: Dartford sits right on it — Joshua confirms whether a given address is Maury or Williamson (and which schools) before you write an offer.',
    ],
    faqs: [
      {
        q: 'How much do homes in Dartford cost in 2026?',
        a: 'On the Maury side, Dartford homes have generally run from roughly $435K to $530K. A few Williamson-side “Phase 2” homes have listed higher. Joshua can pull current comps for the specific section.',
      },
      {
        q: 'Is Dartford in Williamson or Maury County?',
        a: 'It straddles the line. The core community (Lonergan Circle, Cadence Drive, Sercy Drive) is Maury County, but a separately-marketed “Phase 2” pocket on Posada Court is Williamson County. That changes the tax rate and schools, so verify the exact address.',
      },
      {
        q: 'What schools are zoned to Dartford?',
        a: 'The Maury-side core is zoned to Marvin Wright Elementary, Spring Hill Middle, and Spring Hill High (Maury County Public Schools). The Williamson-side Phase 2 is zoned to Chapman’s Retreat Elementary, Spring Station Middle, and Summit High (Williamson County Schools). Confirm per address before making an offer.',
      },
      {
        q: 'Who built Dartford and does it have a pool?',
        a: 'Dartford is a PulteGroup community built around 2019–2021. It does not have a community pool or clubhouse — amenities are modest, centered on trails and nearby Port Royal Park. (Note: a separate rental “Dartford Townhomes” shares the name but is not the for-sale single-family subdivision.)',
      },
    ],
    schemaCity: 'Spring Hill',
    schemaState: 'TN',
    latitude: 35.7490,
    longitude: -86.9030,
  },
  'blackman-murfreesboro-tn': {
    slug: 'blackman-murfreesboro-tn',
    name: "Blackman (West Murfreesboro)",
    city: "Murfreesboro",
    citySlug: 'murfreesboro-tn',
    county: "Rutherford County",
    metaTitle: "Blackman (West Murfreesboro) Neighborhood Guide | Murfreesboro, TN",
    metaDescription: "Blackman (West Murfreesboro) in Murfreesboro, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Blackman is the name buyers say first when they want West Murfreesboro's strong schools and quick interstate access. Spread across a cluster of 2000s-and-newer subdivisions, it pairs suburban housing stock with parks, trails, and shopping just minutes away.",
    about: "Blackman anchors the fast-growing west side of Murfreesboro, generally framed by Veterans Parkway, Franklin Road, and the Rutherford County line. It is less a single subdivision than a recognized area built out across many neighborhoods — names like Blackman Farm, Berkshire, Blackman Oaks, Puckett Station, and Royal Glen — most constructed through the 2000s and 2010s. Housing skews to traditional and craftsman two-stories in brick or brick-and-vinyl, typically with two-car garages and tidy suburban lots, with prices that run from the low $300,000s into seven figures for custom builds. The lifestyle draw is practical: the Blackman school cluster is a top reason families move here, Veterans Parkway feeds directly onto I-24 toward Nashville, and everyday needs are covered by the Fortress Boulevard retail corridor, grocery anchors, and green space at Barfield Crescent Park and the General Bragg Trailhead.",
    vibe: "West Murfreesboro's school-driven hot spot, where families chase the A-rated Blackman zone and easy I-24 access to Nashville.",
    priceBand: "$300K – $1M+",
    buildYears: "Primarily 2000s–2010s, with newer construction ongoing",
    hoa: "Varies by subdivision; many neighborhoods have active HOAs with modest dues (roughly $35/mo / ~$420/yr in communities like Blackman Farm) — confirm dues for the specific subdivision.",
    schoolNotes: "Commonly zoned to the Blackman cluster — Blackman Elementary, Blackman Middle, and Blackman High (Rutherford County Schools) — a primary buyer draw; some streets fall in adjacent zones, so verify current zoning for the specific address.",
    amenities: [
      "Direct I-24 access via Veterans Parkway for Nashville commuters",
      "Shopping and dining along the Fortress Boulevard corridor",
      "Publix and Kroger grocery nearby",
      "General Bragg Trailhead with paved walking trails",
      "Barfield Crescent Park (sports fields and nature center)",
      "Well-maintained common areas in many subdivisions",
    ],
    homeStyles: [
      "Traditional two-story",
      "Craftsman",
      "Brick and brick-and-vinyl elevations",
      "Two-car-garage suburban homes",
      "Some custom builds at the upper end",
    ],
    whyBullets: [
      "Buyers target Blackman first for the consistently high-performing Blackman school cluster, often the single biggest reason families choose this part of town.",
      "Veterans Parkway feeds straight onto I-24, making it one of the most commuter-friendly areas of Murfreesboro for Nashville and Cool Springs workers.",
      "A wide price range — from low-$300s starter homes to seven-figure custom builds — lets buyers at many budgets stay inside the same desirable zone.",
    ],
    faqs: [
      { q: "How much do homes in Blackman cost?", a: "Approximately. Most Blackman-area homes fall in the $350,000–$550,000 range, with starter homes in the low $300,000s and custom builds climbing above $1,000,000. Treat these as rough ranges that shift with the market — ask for current comps." },
      { q: "What schools is Blackman zoned for?", a: "It is commonly zoned to the Blackman cluster — Blackman Elementary, Blackman Middle, and Blackman High (Rutherford County Schools) — which is a major reason families buy here. Zoning can vary street to street, so verify current zoning for the specific address." },
      { q: "Is there an HOA?", a: "It depends on the subdivision. Many Blackman neighborhoods have active HOAs with modest dues (for example, around $35/month in Blackman Farm), while others have little or none. Confirm dues and rules for the exact community you're considering." },
      { q: "What makes Blackman different from other Murfreesboro areas?", a: "Two things: the well-regarded Blackman school zone and unusually direct interstate access. Veterans Parkway connects straight to I-24, so Blackman tends to be one of the more commuter-friendly and school-motivated submarkets in town." },
      { q: "How is the Nashville commute from Blackman?", a: "Roughly 35–40 minutes to downtown Nashville depending on traffic, and around 25 minutes to the Cool Springs/Brentwood job centers, thanks to the I-24 on-ramp at Veterans Parkway. Note Veterans Parkway can back up during rush hour." },
    ],
    schemaCity: "Murfreesboro",
    schemaState: 'TN',
    latitude: 35.86,
    longitude: -86.49,
  },
  'indian-hills-murfreesboro-tn': {
    slug: 'indian-hills-murfreesboro-tn',
    name: "Indian Hills",
    city: "Murfreesboro",
    citySlug: 'murfreesboro-tn',
    county: "Rutherford County",
    metaTitle: "Indian Hills Neighborhood Guide | Murfreesboro, TN",
    metaDescription: "Indian Hills in Murfreesboro, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Indian Hills is Murfreesboro's best-known golf-course neighborhood, wrapped around a public 18-hole course on the city's southeast side. Built mostly in the 1990s and early 2000s, it offers established, predominantly all-brick homes with a community pool, tennis, and clubhouse access.",
    about: "Indian Hills sits in the 37127 zip on Murfreesboro's southeast side, centered on the public Indian Hills Golf Course (par-72, opened 1986) off Calumet Trace. The subdivision developed largely between 1990 and 2005, so it reads as established rather than brand-new — mature landscaping, settled streets, and predominantly all-brick or brick-and-vinyl homes. Floor plans range from roughly 1,500 to over 4,000 square feet, mostly two-story layouts with three to five bedrooms, and recent sales have spanned the high-$300,000s to nearly $950,000. The neighborhood's identity is its amenity package: residents have walkable access to the golf course, driving range, and a roughly 10,000-square-foot clubhouse, plus an HOA-maintained pool, tennis courts, and playground inside the community. Whimsical street names — Council Bluff Parkway, Crazy Horse Drive, Calumet Trace — give it a recognizable, family-friendly character.",
    vibe: "An established golf-course community on Murfreesboro's southeast side where all-brick homes wrap a public 18-hole course, pool, and tennis courts.",
    priceBand: "$370K – $950K",
    buildYears: "Primarily 1990–2005 (golf course built 1986)",
    hoa: "Yes — active association; commonly around $150/quarter (~$600/yr), though dues vary by section (roughly $396–$1,388/yr). Verify the dues for the specific section.",
    schoolNotes: "Commonly zoned (37127, southeast Murfreesboro) to Barfield Elementary, Christiana Middle, and Riverdale High — verify current zoning for the specific address, as sources vary and boundaries can change.",
    amenities: [
      "Indian Hills Golf Course — public 18-hole, par-72 with driving range",
      "10,000-sq-ft clubhouse on the course",
      "Community swimming pool",
      "Tennis courts",
      "Playground",
      "Underground utilities throughout",
    ],
    homeStyles: [
      "All-brick traditional",
      "Brick-and-vinyl two-story",
      "Larger family homes (3–5 bedrooms)",
      "Golf-frontage homes with fairway views",
    ],
    whyBullets: [
      "Buyers choose Indian Hills for resort-style amenities baked into the neighborhood — golf, pool, tennis, and a clubhouse all within walking distance of home.",
      "As one of southeast Murfreesboro's more established subdivisions (built largely 1990–2005), it offers mature trees, solid all-brick construction, and a settled streetscape rather than new-build sameness.",
      "The mix of mid-$300s to near-$1M homes lets move-up buyers find size and golf-course frontage while still staying in a recognizable, amenity-rich community.",
    ],
    faqs: [
      { q: "How much do homes in Indian Hills cost?", a: "Approximately. Recent sales have ranged from about $370,000 to $950,000, with a median in the mid-$400,000s. These are rough, market-dependent figures — ask for current comps for the section you like." },
      { q: "What schools is Indian Hills zoned for?", a: "It is commonly zoned to Barfield Elementary, Christiana Middle, and Riverdale High (Rutherford County). Sources vary and boundaries shift, so verify current zoning for the specific address before relying on it." },
      { q: "Is there an HOA, and what does it cover?", a: "Yes. Indian Hills has an active HOA, most commonly around $150/quarter (~$600/year), though it varies by section. Dues support community amenities including the pool, tennis courts, and playground. Confirm the exact dues for the section you're considering." },
      { q: "Is Indian Hills a gated, golf-only community?", a: "No — it's an open (non-gated), family-friendly residential neighborhood built around a public golf course. You don't have to be a golfer to live there, and the course, pool, tennis, and clubhouse are part of what makes it distinctive." },
      { q: "What makes Indian Hills different from newer Murfreesboro subdivisions?", a: "It's an established, amenity-rich golf community rather than a new build-out. Buyers get mature trees, solid all-brick homes, and built-in golf/pool/tennis amenities — a combination most newer subdivisions in town don't offer." },
    ],
    schemaCity: "Murfreesboro",
    schemaState: 'TN',
    latitude: 35.79,
    longitude: -86.34,
  },
  'evergreen-farms-murfreesboro-tn': {
    slug: 'evergreen-farms-murfreesboro-tn',
    name: "Evergreen Farms",
    city: "Murfreesboro",
    citySlug: 'murfreesboro-tn',
    county: "Rutherford County",
    metaTitle: "Evergreen Farms Neighborhood Guide | Murfreesboro, TN",
    metaDescription: "Evergreen Farms in Murfreesboro, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Evergreen Farms is a large, established Ole South community off Cason Lane in southwest Murfreesboro (37128). Built out in phases since the late 1990s and still adding homes, it's a popular, attainably priced choice for buyers wanting newer single-family construction with low HOA dues.",
    about: "Evergreen Farms is one of southwest Murfreesboro's most recognized single-family communities, anchored off Cason Lane (reached via Old Fort Parkway/Hwy 96) in the 37128 zip. Primarily an Ole South Builders development, it has grown across more than 30 sections from 1997 all the way to current new construction, so it blends settled resale streets with fresh build phases under one familiar name. Homes are practical and attainable — roughly 1,150 to 2,600 square feet, two to five bedrooms, most with two-car garages — in cottage, Cape Cod, ranch, traditional, and contemporary styles on modest 0.11–0.38-acre lots. Recent prices have run from about $275,000 to $480,000, keeping it within reach for first-time and move-up buyers alike. HOA dues are light (around $10/month), and the community keeps a tidy, walkable feel with sidewalks throughout, a playground, underground utilities, and dog-park areas in certain sections.",
    vibe: "A large, well-known Ole South community off Cason Lane that's one of southwest Murfreesboro's go-to spots for attainable single-family homes.",
    priceBand: "$275K – $480K",
    buildYears: "1997–2025 (multi-phase build-out, still active)",
    hoa: "Yes — low dues, roughly $85–$125/year (~$10/mo) depending on phase. Verify the current dues for the specific section.",
    schoolNotes: "Commonly zoned to Scales Elementary (or Cason Lane Academy), Rockvale Middle, and Rockvale High (Rutherford County) — verify current zoning for the specific address, as boundaries shift across the many phases.",
    amenities: [
      "Playground",
      "Sidewalks throughout",
      "Underground utilities",
      "Dog park in certain sections",
      "Close to Old Fort Parkway (Hwy 96) shopping and dining",
      "Quick access to the interstate corridor",
    ],
    homeStyles: [
      "Cottage",
      "Cape Cod",
      "Ranch",
      "Traditional",
      "Contemporary",
    ],
    whyBullets: [
      "Buyers pick Evergreen Farms for attainable, newer single-family homes — prices that start in the high $200,000s make it one of southwest Murfreesboro's more accessible recognized communities.",
      "With 30-plus phases built over nearly three decades, buyers can choose between move-in-ready resale homes and newer Ole South construction, all under the same well-known name.",
      "Low HOA dues (roughly $10/month) plus sidewalks, a playground, and dog-park sections deliver a tidy, walkable, family-friendly feel without a heavy monthly fee.",
    ],
    faqs: [
      { q: "How much do homes in Evergreen Farms cost?", a: "Approximately. Recent sales have ranged from about $275,000 to $480,000, with a median around the high $300,000s. These are rough, market-dependent figures, and newer Ole South phases can price differently than older resales — ask for current comps." },
      { q: "What schools is Evergreen Farms zoned for?", a: "It is commonly zoned to Scales Elementary (or Cason Lane Academy), Rockvale Middle, and Rockvale High (Rutherford County). Because the community spans many phases, verify current zoning for the specific address." },
      { q: "Is there an HOA?", a: "Yes, but it's light — dues run roughly $85–$125 per year (about $10/month) depending on the phase. Confirm the exact amount and what it covers for the section you're considering." },
      { q: "Is Evergreen Farms family-friendly?", a: "Yes. It's an open (non-gated), family-oriented community with sidewalks throughout, a playground, and dog-park areas in some sections, plus shopping and dining a short drive away on Old Fort Parkway." },
      { q: "What makes Evergreen Farms different from other Murfreesboro subdivisions?", a: "Scale and attainability. It's a large, well-known Ole South community where you can find both established resales and brand-new construction at relatively accessible prices, with low HOA dues — a combination that draws first-time and value-focused buyers." },
    ],
    schemaCity: "Murfreesboro",
    schemaState: 'TN',
    latitude: 35.83,
    longitude: -86.46,
  },
  'providence-mount-juliet-tn': {
    slug: 'providence-mount-juliet-tn',
    name: "Providence",
    city: "Mount Juliet",
    citySlug: 'mount-juliet-tn',
    county: "Wilson County",
    metaTitle: "Providence Neighborhood Guide | Mount Juliet, TN",
    metaDescription: "Providence in Mount Juliet, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Providence is the largest master-planned community in Mount Juliet, sprawling across roughly 1,000 acres of rolling Wilson County hills. Anchored by the Providence Marketplace shopping center, it blends townhomes, single-family homes, and a 55+ cottage section into one walkable, amenity-rich address. It remains one of the most searched-for and actively traded neighborhoods in the city.",
    about: "Providence is Mount Juliet's signature master-planned community, developed in phases roughly between 2005 and 2015 across nearly 1,000 acres on the city's growing northwest side. The community is built around the 100-plus-acre Providence Marketplace, putting Kroger, Target, Home Depot, restaurants, and a movie theater within a short walk or bike ride of most homes — a degree of walkable retail access that is uncommon in suburban Middle Tennessee. Inside, Providence is organized into numerous distinct sub-neighborhoods offering everything from townhomes to larger single-family homes, plus a dedicated 55-plus cottage section. Residents enjoy neighborhood parks, extensive sidewalks, and a private lake amenity area, and families benefit from Rutland Elementary School located within the community itself. Because the development spans so many sections and price points, both home styles and HOA dues vary; buyers should confirm the specifics for any given section. Providence consistently ranks among Wilson County's most active resale markets.",
    vibe: "Middle Tennessee's flagship master-planned community where you can walk to Target, Kroger, and a movie theater from your front porch.",
    priceBand: "$385K – $900K (approx; most homes mid-$400s to high-$500s)",
    buildYears: "Built out in phases roughly 2005–2015 across nearly 1,000 acres",
    hoa: "Active HOA covering common areas, parks, sidewalks, and lake amenities; dues vary by sub-neighborhood — verify the specific section's dues and what they include.",
    schoolNotes: "Commonly zoned to Wilson County Schools — Rutland Elementary sits inside the community, with middle school varying by section (Mt. Juliet, West Wilson, or Gladeville) and Wilson Central High commonly serving the area. Zone lines cross the community, so verify current zoning for the specific address.",
    amenities: [
      "Providence Marketplace shopping center at the entrance (grocery, retail, dining, theater)",
      "Neighborhood parks and green spaces",
      "Extensive sidewalks and walkable street design",
      "Private lake amenity area",
      "Multiple distinct sub-neighborhoods/districts",
      "On-site Rutland Elementary School",
    ],
    homeStyles: [
      "Traditional single-family homes",
      "Townhomes",
      "Newer-construction homes with open floor plans",
      "Brick and mixed-material exteriors",
      "A 55+ cottage section (The Cottages of Providence)",
    ],
    whyBullets: [
      "Rare walkable retail access — many homes are a short walk or bike ride from a full grocery, big-box, and dining hub.",
      "One of Wilson County's most active resale markets, meaning steady demand and a range of price points and home sizes.",
      "An elementary school inside the community plus parks and a private lake make it a strong fit for families.",
    ],
    faqs: [
      { q: "Is Providence really within walking distance of shopping?", a: "Yes — Providence Marketplace sits at the community's entrance, and many homes are a short walk or bike ride from grocery stores, big-box retail, restaurants, and a movie theater. Walkability is the community's signature feature, though distance varies by which sub-neighborhood you choose." },
      { q: "What price range should I expect in Providence?", a: "Approximately the high $300s to around $900k, with most homes landing in the mid-$400s to high-$500s. Townhomes and the cottage section sit at the lower end, while larger single-family homes reach higher. These are approximate ranges — ask for current comparable sales for the exact section you're considering." },
      { q: "What schools serve Providence?", a: "Providence is commonly zoned to Wilson County Schools, with Rutland Elementary located inside the community and Wilson Central High commonly serving the area; middle school assignment varies by section. Zone lines run through the community, so always verify current zoning for the specific address." },
      { q: "Does Providence have an HOA?", a: "Yes. Providence has an active HOA, but because the community contains many sub-neighborhoods, dues and what they cover differ from section to section. Confirm the exact dues and inclusions for the specific home you're considering." },
      { q: "Is there a 55+ option in Providence?", a: "Yes — The Cottages of Providence is a 55-plus active-adult section within the larger community. (Note this is separate from Del Webb at Lake Providence, a different 55+ community in Mount Juliet.)" },
    ],
    schemaCity: "Mount Juliet",
    schemaState: 'TN',
    latitude: 36.2,
    longitude: -86.5,
  },
  'willoughby-station-mount-juliet-tn': {
    slug: 'willoughby-station-mount-juliet-tn',
    name: "Willoughby Station",
    city: "Mount Juliet",
    citySlug: 'mount-juliet-tn',
    county: "Wilson County",
    metaTitle: "Willoughby Station Neighborhood Guide | Mount Juliet, TN",
    metaDescription: "Willoughby Station in Mount Juliet, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Willoughby Station is one of the first planned unit developments in Mount Juliet, begun in 1988 on land purchased from the Willoughby family and eventually growing toward roughly 750 homes. Located off Greenhill Road, it's an established, amenity-rich neighborhood known for generous lots, mature trees, and unusually low HOA dues. It's a frequent search target for buyers who want space and value over brand-new construction.",
    about: "Willoughby Station is one of Mount Juliet's original planned communities, with development beginning in 1988 and continuing through about 2008. Set on roughly 300 acres off Greenhill Road, the neighborhood was planned for around 750 homes and today is an established, almost entirely resale market. Its appeal centers on space and value: lots typically run from about 0.17 to nearly half an acre — markedly larger than the 0.10–0.15-acre lots common in Mount Juliet's newer subdivisions — and homes range from roughly 2,000 to 4,700 square feet with three to five bedrooms and two- or three-car garages. The community amenity area includes a swimming pool, a junior Olympic-size pool added in 1998, a baby pool and pool house, tennis courts, a basketball court, and park space, all maintained by an HOA whose dues are reported to be among the lowest in the city. Mature landscaping and a long-running youth swim team, the Willoughby Waves, give the neighborhood a settled, family-oriented character just minutes from Providence Marketplace and roughly 25 minutes from downtown Nashville.",
    vibe: "One of Mount Juliet's original planned communities, prized for mature trees, bigger lots, and one of the lowest HOA dues in town.",
    priceBand: "$399K – $760K (approx; many in the $500s)",
    buildYears: "Developed from roughly 1989 through 2008 (established, mostly resale)",
    hoa: "Low annual HOA, reportedly around $300–$500/year — among the lowest in Mount Juliet — covering amenity areas; verify current dues and inclusions.",
    schoolNotes: "Commonly zoned to Wilson County Schools — often Mt. Juliet Elementary, Mt. Juliet Middle, and Green Hill High, with some sections tied to Mt. Juliet High. Verify current zoning for the specific address.",
    amenities: [
      "Community swimming pool plus a junior Olympic-size pool (added 1998)",
      "Baby/wading pool and pool house",
      "Tennis courts",
      "Basketball court",
      "Park areas and green space",
      "Sidewalks throughout",
    ],
    homeStyles: [
      "Predominantly two-story single-family homes",
      "Some ranch/one-level plans",
      "A few three-story homes",
      "Traditional brick and siding exteriors",
      "3–5 bedroom layouts with 2–3 car garages",
    ],
    whyBullets: [
      "Larger lots than newer Mount Juliet subdivisions — many sites run 0.17 to nearly 0.5 acre versus 0.10–0.15 acre in newer builds.",
      "Notably low HOA dues for a community with a pool, tennis, and amenity areas — strong value for the upkeep provided.",
      "An established neighborhood with mature landscaping and a long-running community swim team, giving it a settled, family-friendly feel.",
    ],
    faqs: [
      { q: "How old are the homes in Willoughby Station?", a: "Most were built between roughly 1989 and 2008, so it is an established, mostly resale neighborhood rather than a new-construction community. Expect mature landscaping and larger lots, with homes generally well-maintained." },
      { q: "Why are the HOA dues so low here?", a: "Reported annual dues run roughly $300–$500, among the lowest in Mount Juliet, while still covering the pool, tennis, and amenity areas. Always confirm the current dues and exactly what they include before you buy." },
      { q: "What amenities does Willoughby Station offer?", a: "The community amenity area includes a main pool, a junior Olympic-size pool added in 1998, a baby pool and pool house, tennis courts, a basketball court, and park space, with sidewalks throughout. It's also home to the Willoughby Waves youth swim team." },
      { q: "What schools serve Willoughby Station?", a: "It's commonly zoned to Wilson County Schools — often Mt. Juliet Elementary, Mt. Juliet Middle, and Green Hill High, with some sections tied to Mt. Juliet High. Because zoning can change and varies by section, verify the current assignment for the specific address." },
      { q: "How are the lot sizes compared to newer neighborhoods?", a: "Generous — lots typically run from about 0.17 to nearly 0.5 acre, with a median around 0.27 acre, which is noticeably larger than the 0.10–0.15-acre lots common in newer Mount Juliet subdivisions. That extra space is a big part of the neighborhood's appeal." },
    ],
    schemaCity: "Mount Juliet",
    schemaState: 'TN',
    latitude: 36.2068,
    longitude: -86.558,
  },
  'nichols-vale-mount-juliet-tn': {
    slug: 'nichols-vale-mount-juliet-tn',
    name: "Nichols Vale",
    city: "Mount Juliet",
    citySlug: 'mount-juliet-tn',
    county: "Wilson County",
    metaTitle: "Nichols Vale Neighborhood Guide | Mount Juliet, TN",
    metaDescription: "Nichols Vale in Mount Juliet, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Nichols Vale is a newer master-planned community of about 402 home sites off Lebanon Road in Mount Juliet, with active development from around 2018 onward. It offers modern single-family homes and townhomes from builders including Beazer and Goodall, anchored by a central pool and clubhouse. Its blend of new construction and a quiet, settled layout makes it a popular search for buyers wanting contemporary homes in Wilson County.",
    about: "Nichols Vale is a newer single-family and townhome community of roughly 402 home sites located off Lebanon Road in Mount Juliet's 37122 zip code. Ashlar Development acquired the community in 2018, and homes have been delivered since by a roster of well-known builders including Beazer Homes, Goodall Homes, Ryan Homes, Smith Douglas Homes, and Eastland Construction. The result is a neighborhood of modern floor plans with open living spaces, contemporary finishes, and attached garages, ranging from about 1,450 to 3,700 square feet. At its center sits a community swimming pool paired with a breezeway clubhouse and a community front porch designed for neighborly gatherings. Residents enjoy a relaxed, low-traffic residential atmosphere while staying minutes from canoe launches, public parks, and trails, as well as shopping, dining, and medical care along Lebanon Road. Its central location also puts Old Hickory and Percy Priest lakes and the broader Nashville area within easy reach. The mix of single-family homes and townhomes offers buyers multiple price points within one community.",
    vibe: "A newer, builder-driven community off Lebanon Road offering modern single-family homes and townhomes with a relaxed, low-traffic feel.",
    priceBand: "$400K – $700K (approx; many in the high $500s to mid $600s)",
    buildYears: "Newer construction; active development from about 2018 onward (402 home sites)",
    hoa: "HOA covers common areas and the central pool/clubhouse; some pool-club costs may be separate. Verify current dues and what they include.",
    schoolNotes: "Commonly zoned to Wilson County Schools — often cited as Mt. Juliet Elementary, Mt. Juliet Middle, and Mt. Juliet High or Green Hill High depending on section. Verify current zoning for the specific address.",
    amenities: [
      "Centrally located community swimming pool",
      "Breezeway clubhouse",
      "Community front porch gathering space",
      "Minutes from canoe launches, public parks, and trails",
      "Close to Lebanon Road shopping, dining, and medical care",
      "Near Old Hickory and Percy Priest lakes",
    ],
    homeStyles: [
      "Newer single-family homes with modern open floor plans",
      "Townhomes",
      "Contemporary finishes and attached garages",
      "Homes ranging from about 1,450 to 3,700 sq ft",
      "Built by Beazer, Goodall, Ryan, Smith Douglas, and Eastland",
    ],
    whyBullets: [
      "Newer construction with modern layouts and finishes — appealing to buyers who want move-in-ready homes without dated systems.",
      "A mix of single-family homes and townhomes provides entry points at different price levels within one community.",
      "A quiet, low-traffic residential layout near lakes, parks, and Lebanon Road conveniences, with multiple respected builders behind the homes.",
    ],
    faqs: [
      { q: "Is Nichols Vale a new-construction neighborhood?", a: "It's a newer community with active development from around 2018 onward across roughly 402 home sites, so you'll find recently built homes and contemporary finishes. Both single-family homes and townhomes have been built here by multiple national and regional builders." },
      { q: "Who built the homes in Nichols Vale?", a: "Builders associated with the community include Beazer Homes, Goodall Homes, Ryan Homes, Smith Douglas Homes, and Eastland Construction, with Ashlar Development as the master developer. Floor plans feature open layouts, modern finishes, and attached garages." },
      { q: "What amenities does Nichols Vale have?", a: "The community centers on a swimming pool with a breezeway clubhouse and a community front porch for gatherings, and it sits minutes from canoe launches, public parks, and trails. It's also close to Lebanon Road shopping, dining, and medical care." },
      { q: "What schools serve Nichols Vale?", a: "Nichols Vale is commonly zoned to Wilson County Schools, with Mt. Juliet Elementary and Mt. Juliet Middle frequently cited and high school assignment (Mt. Juliet High or Green Hill High) varying by section. Verify current zoning for the specific address before you buy." },
      { q: "What price range should I expect?", a: "Approximately the low $400s to around $700k, with many recent listings in the high $500s to mid $600s. These figures are approximate and reflect 2026 listings — ask for current comparable sales for the home type you want." },
    ],
    schemaCity: "Mount Juliet",
    schemaState: 'TN',
    latitude: 36.2245,
    longitude: -86.5313,
  },
  'durham-farms-hendersonville-tn': {
    slug: 'durham-farms-hendersonville-tn',
    name: "Durham Farms",
    city: "Hendersonville",
    citySlug: 'hendersonville-tn',
    county: "Sumner County",
    metaTitle: "Durham Farms Neighborhood Guide | Hendersonville, TN",
    metaDescription: "Durham Farms in Hendersonville, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Durham Farms is Hendersonville's premier master-planned community, blending walkable streets, modern farmhouse architecture, and a robust amenity package. Built from 2016 onward by several national and regional builders, it is the go-to for buyers who want new construction in Sumner County.",
    about: "Durham Farms sits off Drakes Creek Road in northeast Hendersonville and is the area's standout master-planned community. Since breaking ground in 2016, builders including Lennar, Schell Brothers, David Weekley, Drees, and Ryan Homes (with Pulte having sold out) have delivered a mix of traditional and modern farmhouse designs, generally ranging from roughly 1,700 to 5,000 square feet. The social heart is the Farmhouse amenity center, with a resort-style pool, splash pad, fitness studio, Wi-Fi cafe, dog park, playground, and walking trails, all backed by a lifestyle director who runs a steady calendar of community events. HOA dues vary by section and product type and cover amenity access and grounds upkeep. With elementary and middle schools nearby and quick access toward I-65, Durham Farms appeals to families and professionals who want turnkey new construction, an amenity-rich lifestyle, and an easy Nashville-area commute. Pricing is approximate and moves with the market.",
    vibe: "Hendersonville's flagship master-planned community where new-construction farmhouses meet a resort-style amenity center and a true neighborhood lifestyle.",
    priceBand: "$375K – $1.3M (approximate)",
    buildYears: "2016–present (active new construction)",
    hoa: "Active HOA; dues vary by section/home type, roughly $85–$393/month, covering the amenity center, pool, fitness, events, and grounds — verify current dues for the specific section.",
    schoolNotes: "Commonly zoned to Dr. William Burrus Elementary at Drakes Creek, Knox Doss Middle at Drakes Creek, and Beech Senior High School (Sumner County Schools) — verify current zoning for the specific address.",
    amenities: [
      "The Farmhouse amenity center",
      "Resort-style pool and splash pad",
      "Fitness studio and Wi-Fi cafe",
      "Dog park and playground",
      "Walking trails and pocket parks",
      "Lifestyle director with year-round community events",
    ],
    homeStyles: [
      "Traditional farmhouse",
      "Modern farmhouse",
      "Partial-brick elevations",
      "Two-story single-family",
      "Optional-basement plans",
    ],
    whyBullets: [
      "One of the few large-scale new-construction options in Hendersonville, so buyers get modern floor plans, warranties, and energy efficiency without a custom build.",
      "Amenities and lifestyle programming are genuinely resort-grade, with a full event calendar that makes it easy to meet neighbors.",
      "Multiple builders and price points let buyers right-size from first homes to larger family plans within one community.",
    ],
    faqs: [
      { q: "Is Durham Farms new construction or resale?", a: "Both. The community has been building since 2016 and still has active new-construction sections from several builders, alongside a growing pool of resale homes." },
      { q: "What amenities does Durham Farms offer?", a: "The centerpiece is the Farmhouse amenity center with a resort-style pool and splash pad, fitness studio, Wi-Fi cafe, dog park, playground, walking trails, and a lifestyle director who organizes community events." },
      { q: "What is the HOA like?", a: "There is an active HOA, with dues that vary by section and home type (roughly $85–$393/month) covering amenity access and grounds maintenance. Confirm the exact dues for the specific home and section." },
      { q: "What schools serve Durham Farms?", a: "It is commonly zoned to Dr. William Burrus Elementary at Drakes Creek, Knox Doss Middle at Drakes Creek, and Beech Senior High in Sumner County Schools — always verify current zoning for the specific address." },
      { q: "Does Durham Farms have lake access?", a: "Durham Farms is an inland master-planned community and is not a waterfront neighborhood, though Old Hickory Lake recreation is a short drive away elsewhere in Hendersonville." },
    ],
    schemaCity: "Hendersonville",
    schemaState: 'TN',
    latitude: 36.345,
    longitude: -86.583,
  },
  'indian-lake-peninsula-hendersonville-tn': {
    slug: 'indian-lake-peninsula-hendersonville-tn',
    name: "Indian Lake Peninsula",
    city: "Hendersonville",
    citySlug: 'hendersonville-tn',
    county: "Sumner County",
    metaTitle: "Indian Lake Peninsula Neighborhood Guide | Hendersonville, TN",
    metaDescription: "Indian Lake Peninsula in Hendersonville, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Indian Lake Peninsula is the heart of lake living in Hendersonville, a collection of established sub-neighborhoods that juts into Old Hickory Lake. With only a couple of ways on and off the peninsula, it offers a quiet, water-oriented lifestyle minutes from everyday conveniences.",
    about: "Indian Lake Peninsula is less a single subdivision than an umbrella of established sub-communities — names like Governors Point, Cumberland Hills, Lake Club Estates, Sterling Cove, Edgewater, Northlake, and Watermark — that together form a peninsula reaching into Old Hickory Lake in Sumner County. Most homes date from roughly the 1960s through the early 2000s, giving the area mature landscaping, generous lots, and a settled character. Lake access is the defining draw: many properties offer water views, private docks, or quick proximity to marinas and launches for boating, fishing, and paddleboarding. Because only a couple of roads serve the peninsula, through-traffic is minimal and the feel is private despite being close to The Streets of Indian Lake shopping, dining, and medical services. Pricing spans widely — inland homes start in the mid-$400s while true lakefront estates can reach into the millions — and varies with condition, water access, and the specific sub-neighborhood. All figures are approximate.",
    vibe: "Hendersonville's iconic lake-living enclave, a low-traffic peninsula jutting into Old Hickory Lake where mature, established homes trade on water views and dock access.",
    priceBand: "$450K – $3M+ (approximate; lakefront commands the high end)",
    buildYears: "Primarily 1960s–early 2000s (established, with mature lots)",
    hoa: "Not a single neighborhood but an umbrella of sub-communities; HOA structure and dues vary by sub-neighborhood — verify the specific subdivision's HOA before relying on it.",
    schoolNotes: "Commonly zoned to Indian Lake Elementary, Robert E. Ellis Middle, and Hendersonville High School (Sumner County Schools) — verify current zoning for the specific address.",
    amenities: [
      "Old Hickory Lake frontage and water views",
      "Private docks on many properties",
      "Proximity to marinas and boat launches",
      "Boating, fishing, and paddleboarding access",
      "Very low through-traffic (limited points on and off)",
      "Mature landscaping and established lots",
    ],
    homeStyles: [
      "Established single-family ranches",
      "Two-story traditional homes",
      "Updated/renovated resales",
      "Lakefront estate homes",
      "Varied styles reflecting decades of build-out",
    ],
    whyBullets: [
      "This is the most recognized true lake-living address in Hendersonville, prized for direct or near-water access to Old Hickory Lake and a boating lifestyle.",
      "The peninsula's limited access points mean very little cut-through traffic, giving it a quiet, tucked-away feel close to shopping and dining.",
      "Mature lots and landscaping deliver a sense of place and lot sizes that new construction in the area simply can't replicate.",
    ],
    faqs: [
      { q: "Is Indian Lake Peninsula one subdivision or several?", a: "It is really an umbrella of established sub-neighborhoods on the peninsula — including names like Governors Point, Cumberland Hills, Lake Club Estates, and Sterling Cove — so HOA rules, dues, and amenities vary by the specific subdivision." },
      { q: "Do homes have lake access or docks?", a: "Many do. Some properties are true lakefront with private docks, others offer water views or quick access to nearby marinas and launches on Old Hickory Lake. Dock rights and water access vary by lot, so confirm for each home." },
      { q: "What is the price range?", a: "Approximately mid-$400s for inland homes up past $1.9M–$3M for premium lakefront properties. Pricing depends heavily on water access, condition, and sub-neighborhood, and moves with the market." },
      { q: "What schools serve the peninsula?", a: "Homes are commonly zoned to Indian Lake Elementary, Robert E. Ellis Middle, and Hendersonville High in Sumner County Schools — verify current zoning for the specific address." },
      { q: "What is the vibe and traffic like?", a: "Quiet and water-oriented. Because the peninsula has only a couple of access points, there is very little through-traffic, yet shopping and dining at The Streets of Indian Lake are close by." },
    ],
    schemaCity: "Hendersonville",
    schemaState: 'TN',
    latitude: 36.305,
    longitude: -86.585,
  },
  'walton-trace-hendersonville-tn': {
    slug: 'walton-trace-hendersonville-tn',
    name: "Walton Trace",
    city: "Hendersonville",
    citySlug: 'hendersonville-tn',
    county: "Sumner County",
    metaTitle: "Walton Trace Neighborhood Guide | Hendersonville, TN",
    metaDescription: "Walton Trace in Hendersonville, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Walton Trace is an established single-family neighborhood off Walton Ferry Road in Hendersonville, known for well-built, sensibly priced homes on pedestrian-friendly streets. Dating to the late 1990s, it appeals to families wanting a settled community close to Old Hickory Lake and Hendersonville's amenities.",
    about: "Walton Trace is an established single-family subdivision off Walton Ferry Road in the southern part of Hendersonville, in Sumner County. The community took shape in the late 1990s and built out over the following years, so homes are mature and well-settled rather than new construction. Streets such as Walton Trace North and South, Hazelwood Court, and Polk Court feature a mix of traditional brick and more contemporary designs, generally midsize family homes with spacious floor plans. Wide, sidewalk-lined streets give the neighborhood a pedestrian-friendly, family-oriented feel. Pricing is among the more attainable for a named Hendersonville subdivision, with recent listings roughly in the high-$300s to mid-$700s depending on size and updates. The location keeps residents minutes from Old Hickory Lake parks and marinas as well as Hendersonville's shopping and dining, and it is zoned to several of the city's core Sumner County schools. All prices and details are approximate and should be verified per listing.",
    vibe: "An established, family-friendly Hendersonville subdivision of well-built homes on sidewalk-lined streets, zoned to the city's core schools and minutes from Old Hickory Lake.",
    priceBand: "$385K – $750K (approximate)",
    buildYears: "Late 1990s onward (established ~1997, built out over following years)",
    hoa: "HOA presence/dues not consistently documented in sources — verify whether an active HOA and dues apply before relying on it.",
    schoolNotes: "Commonly zoned to Walton Ferry Elementary, V.G. Hawkins Middle, and Hendersonville High School (Sumner County Schools) — verify current zoning for the specific address.",
    amenities: [
      "Sidewalk-lined, pedestrian-friendly streets",
      "Wide streets suited to families",
      "Close to Old Hickory Lake recreation and parks",
      "Convenient to Hendersonville shopping and dining",
      "Established, mature neighborhood setting",
    ],
    homeStyles: [
      "Traditional brick homes",
      "Midsize single-family homes",
      "Contemporary designs",
      "Spacious family floor plans",
    ],
    whyBullets: [
      "A reasonably priced, established Hendersonville address with solid, well-crafted homes — a strong value among the city's named subdivisions.",
      "Sidewalk-lined, wide streets make it genuinely walkable and family-friendly.",
      "Zoned to Hendersonville's core schools and only minutes from Old Hickory Lake parks, marinas, and the city's shopping corridors.",
    ],
    faqs: [
      { q: "When was Walton Trace built?", a: "The subdivision dates to roughly 1997 and built out over the following years, so it is an established neighborhood of mature homes rather than new construction." },
      { q: "What do homes cost in Walton Trace?", a: "Recent listings have ranged roughly from the high-$300s to the mid-$700s depending on size, lot, and updates. These figures are approximate and move with the market." },
      { q: "What schools serve Walton Trace?", a: "It is commonly zoned to Walton Ferry Elementary, V.G. Hawkins Middle, and Hendersonville High School in Sumner County Schools — verify current zoning for the specific address." },
      { q: "Is Walton Trace good for families?", a: "Yes. Wide, sidewalk-lined streets make it pedestrian-friendly, and it is close to Hendersonville's schools, parks, and shopping, with Old Hickory Lake recreation only minutes away." },
      { q: "Does Walton Trace have lake access?", a: "It is an inland neighborhood without its own waterfront, but it sits close to Old Hickory Lake's parks, marinas, and boat access points elsewhere in Hendersonville." },
    ],
    schemaCity: "Hendersonville",
    schemaState: 'TN',
    latitude: 36.295,
    longitude: -86.605,
  },
  'fairvue-plantation-gallatin-tn': {
    slug: 'fairvue-plantation-gallatin-tn',
    name: "Fairvue Plantation",
    city: "Gallatin",
    citySlug: 'gallatin-tn',
    county: "Sumner County",
    metaTitle: "Fairvue Plantation Neighborhood Guide | Gallatin, TN",
    metaDescription: "Fairvue Plantation in Gallatin, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Fairvue Plantation is Gallatin's signature luxury golf-and-lake community, set on the shores of Old Hickory Lake about 30 minutes northeast of downtown Nashville. Built around a historic estate and a championship country club, it pairs resort-style amenities with a wide range of home types.",
    about: "Fairvue Plantation transformed the grounds of Isaac Franklin's historic 1832 estate into a residential golf community that opened around 2004 on Old Hickory Lake in Gallatin. Today it spans hundreds of acres off the Hartsville Pike/Long Hollow Pike corridor and centers on the Fairvue Plantation Country Club, with an 18-hole championship golf course, clubhouse dining, a pool, tennis courts, and a fitness center. Homes range dramatically, from townhomes and villas in the low $300,000s to brick-and-stone estate homes and multimillion-dollar lakefront properties with private docks; recent sales have topped $6 million. Most of the community is commonly zoned to the well-regarded Station Camp school cluster (Sumner County Schools), while some western sections fall in the Gallatin Senior High zone. With its blend of golf, lake access, restored historic character, and proximity to Nashville, Fairvue remains one of the highest-profile addresses in Sumner County.",
    vibe: "Gallatin's flagship gated golf-and-lake community, anchored by a historic 1832 mansion and championship country club on Old Hickory Lake.",
    priceBand: "$320K – $6.4M",
    buildYears: "Residential golf community opened ~2004; most homes built 2002–2026 across multiple phases",
    hoa: "Mandatory HOA with dues varying by section (roughly $575–$1,950/yr for estate areas; townhome/villa sections such as The Knoll and The Retreat run higher, ~$210–$375/month). Country club membership is separate and optional. Verify current dues and what they cover for the specific property.",
    schoolNotes: "Most homes are commonly zoned to Jack Anderson Elementary, Station Camp Middle, and Station Camp High; western sections commonly zoned to Howard Elementary, Rucker Stewart Middle, and Gallatin Senior High (Sumner County Schools). Verify current zoning for the specific address.",
    amenities: [
      "18-hole championship golf course and country club",
      "Clubhouse with dining",
      "Swimming pool",
      "Tennis courts",
      "Fitness center",
      "Old Hickory Lake access for boating and fishing, walking trails and green spaces",
    ],
    homeStyles: [
      "Brick-and-stone traditional estate homes",
      "Lakefront homes with private docks",
      "Maintenance-friendly attached/zero-lot-line villas (The Knoll, The Retreat)",
      "Custom luxury estates",
    ],
    whyBullets: [
      "One of Middle Tennessee's most recognized luxury addresses, combining a championship golf course, country club, and direct Old Hickory Lake frontage.",
      "Wide price range means buyers can enter via a townhome/villa or move up to multimillion-dollar lakefront estates within the same community.",
      "Strong, sought-after Sumner County school zoning (commonly Station Camp cluster) plus an easy ~30-minute drive to downtown Nashville.",
    ],
    faqs: [
      { q: "Is Fairvue Plantation a gated community?", a: "Fairvue is a guard/amenity-rich master-planned golf community, and at least its premium section, The Peninsula, is gated. Gated access can vary by section, so confirm the specific entry and security arrangement for the property you are considering." },
      { q: "Do you have to join the golf or country club to live there?", a: "No. Living in Fairvue Plantation requires HOA membership, but Fairvue Plantation Country Club membership (golf, dining, etc.) is generally separate and optional. Ask about current membership tiers and initiation costs." },
      { q: "What price range should I expect in Fairvue Plantation?", a: "Approximately, townhomes/villas have sold in the low-to-mid $300,000s to $500,000s, while estate and lakefront homes range from the $600,000s into the multimillions, with recent top sales above $6 million. These are rough, approximate figures that shift with the market." },
      { q: "Which schools is Fairvue Plantation zoned for?", a: "Most homes are commonly zoned to Jack Anderson Elementary, Station Camp Middle, and Station Camp High, while western sections are commonly zoned to Howard Elementary, Rucker Stewart Middle, and Gallatin Senior High. Always verify current zoning for the exact address with Sumner County Schools." },
      { q: "Does Fairvue Plantation have lake access?", a: "Yes. The community sits on Old Hickory Lake, with lakefront homesites (some with private docks) and shared access for boating and fishing. Dock rights and availability depend on the specific lot, so confirm before purchasing." },
    ],
    schemaCity: "Gallatin",
    schemaState: 'TN',
    latitude: 36.3448,
    longitude: -86.4932,
  },
  'foxland-harbor-gallatin-tn': {
    slug: 'foxland-harbor-gallatin-tn',
    name: "Foxland Harbor",
    city: "Gallatin",
    citySlug: 'gallatin-tn',
    county: "Sumner County",
    metaTitle: "Foxland Harbor Neighborhood Guide | Gallatin, TN",
    metaDescription: "Foxland Harbor in Gallatin, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Foxland Harbor is a newer luxury lakefront community spanning over 500 acres on the north shore of Old Hickory Lake in Gallatin, about 25 minutes from downtown Nashville. It is unusual for the area in offering condos, townhomes, and custom estates all in one resort-style setting with golf and a marina.",
    about: "Foxland Harbor is a master-planned lakefront community of more than 500 acres on the northern shoreline of Old Hickory Lake in Gallatin, developed beginning around 2014 with most homes built between 2014 and 2023 and newer phases still underway. It is one of the few addresses in Sumner County where buyers can choose a site-built single-family home, a townhome, or a lakefront condo within the same community. The neighborhood is built around resort-style amenities, including the Foxland Harbor Marina, a lakefront clubhouse with dining at the Foxland Southern Grill, a fitness center overlooking the lake, pools, and tennis, and it sits beside the championship Tennessee Grasslands Golf & Country Club. Builders have included Drees Custom Homes among others, and home styles range from contemporary to traditional brick with open floor plans and outdoor living. Homes are commonly zoned to the sought-after Station Camp school cluster, making Foxland a popular choice for both families and lake-lifestyle buyers.",
    vibe: "A newer 500-acre lakefront resort community on Old Hickory Lake where you can choose a condo, townhome, or custom estate beside championship golf and a marina.",
    priceBand: "$260K – $1.2M+",
    buildYears: "Developed beginning ~2014; most homes built 2014–2023, with newer phases (e.g., Revery Point condos/townhomes) still underway in 2026",
    hoa: "Mandatory HOA with dues that vary widely by product type (roughly $300–$9,200/yr; attached homes/condos carry higher fees that typically cover exterior maintenance and landscaping). Verify current dues and inclusions for the specific home.",
    schoolNotes: "Commonly zoned to Jack Anderson Elementary, Station Camp Middle, and Station Camp High (Sumner County Schools). Verify current zoning for the specific address.",
    amenities: [
      "Old Hickory Lake frontage and marina (Foxland Harbor Marina)",
      "Championship golf at the adjacent Tennessee Grasslands Golf & Country Club",
      "Lakefront clubhouse with dining (Foxland Southern Grill)",
      "Fitness center overlooking the lake",
      "Swimming pool(s) and tennis courts",
      "Multiple distinct neighborhoods/condos within one community",
    ],
    homeStyles: [
      "Luxury lakefront condos",
      "Golf-course and lakefront townhomes/villas",
      "Single-family golf-course homes",
      "Custom lakefront and interior estate homes (contemporary to traditional brick)",
    ],
    whyBullets: [
      "Rare flexibility: buyers can choose a low-maintenance condo or townhome or a custom estate, all within one gated lakefront community with golf and a marina.",
      "Resort-style living on Old Hickory Lake with a marina, championship golf, clubhouse dining, and fitness, roughly 25 minutes from downtown Nashville.",
      "Sits in the desirable Station Camp school cluster (Sumner County), making it appealing to families as well as second-home and lake-lifestyle buyers.",
    ],
    faqs: [
      { q: "Is Foxland Harbor a gated community?", a: "Foxland Harbor markets itself as a gated lakefront community, though access arrangements can differ by section and the public sources reviewed did not state gating uniformly. Confirm the specific entry and security setup for the property you are considering." },
      { q: "What types of homes are available in Foxland Harbor?", a: "Foxland Harbor is unusually varied for the area, offering lakefront condos, golf-course and lakefront townhomes, single-family golf-course homes, and custom lakefront estates, all within one community. This lets buyers pick a maintenance level and price point that fits them." },
      { q: "What price range should I expect in Foxland Harbor?", a: "Approximately, attached homes/townhomes have started in the high $200,000s, golf-course single-family homes commonly fall in the mid $300,000s to high $400,000s, and custom and lakefront estates range from the $600,000s to over $1 million. These are rough, approximate figures and move with the market." },
      { q: "Does Foxland Harbor have golf and lake access?", a: "Yes. The community sits on Old Hickory Lake with the Foxland Harbor Marina, and it borders the championship Tennessee Grasslands Golf & Country Club. Specific dock rights, slip availability, and golf membership terms vary, so confirm details before purchasing." },
      { q: "Which schools is Foxland Harbor zoned for?", a: "Homes are commonly zoned to Jack Anderson Elementary, Station Camp Middle, and Station Camp High in Sumner County Schools. Always verify current zoning for the exact address, as boundaries can change." },
    ],
    schemaCity: "Gallatin",
    schemaState: 'TN',
    latitude: 36.4012,
    longitude: -86.4495,
  },
  'historic-downtown-columbia-tn': {
    slug: 'historic-downtown-columbia-tn',
    name: "Historic Downtown Columbia",
    city: "Columbia",
    citySlug: 'columbia-tn',
    county: "Maury County",
    metaTitle: "Historic Downtown Columbia Neighborhood Guide | Columbia, TN",
    metaDescription: "Historic Downtown Columbia in Columbia, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Historic Downtown Columbia is the cultural and architectural heart of Maury County, centered on a lovingly preserved courthouse square. Here you'll find antebellum mansions, Victorian gems, and Craftsman bungalows within walking distance of shops, breweries, and the Arts District. It's a rare chance to own real history at Middle Tennessee's most accessible price point.",
    about: "Chartered in 1807, Columbia's downtown core blends deep history with a lively, modern Main Street energy. The Columbia Commercial Historic Downtown District was listed on the National Register of Historic Places in 1984, recognized for its Federal, Victorian, and mid-19th-century Revival architecture, and the surrounding residential streets are famous enough that Columbia is often called the 'Antebellum Homes Capital of Tennessee.' Homebuyers are drawn to the stately Greek Revival porches, ornate Victorian woodwork, and cozy Craftsman bungalows, all set around a courthouse square ringed with boutiques, antique stores, and eateries like Bad Idea Brewing and American Barrel. The Arts District sits a block south, the James K. Polk Home is two blocks west, and monthly First Fridays bring live music and extended shop hours. Compared with Williamson County, prices remain notably attainable — though older homes can mean more maintenance, and historic-overlay properties may face design review.",
    vibe: "Walkable, character-rich antebellum and Victorian streets wrapped around one of Tennessee's most charming courthouse squares.",
    priceBand: "$200K – $600K+ (approximate; highly variable by condition)",
    buildYears: "Largely 1840s–1930s (Antebellum/Greek Revival, Victorian, and Craftsman-era homes)",
    hoa: "Generally no HOA; however, properties within Columbia's locally designated historic-zoning overlay may be subject to Historic Zoning Commission design review — verify for the specific address.",
    schoolNotes: "In-town Columbia addresses are commonly zoned to Maury County Public Schools (e.g., McDowell Elementary, Whitthorne Middle, and Columbia Central High have served parts of the area) — verify current zoning for the specific address.",
    amenities: [
      "Walkable courthouse square with boutiques, antique shops, and restaurants",
      "Adjacent Arts District one block south with galleries and creative culture",
      "First Fridays monthly events with live music and extended shop hours",
      "James K. Polk Home & Museum two blocks west",
      "Tennessee 'Main Street' designated downtown core",
      "Proximity to the Duck River and city parks",
    ],
    homeStyles: [
      "Antebellum / Greek Revival",
      "Victorian",
      "Craftsman bungalow",
      "Federal",
      "Early-20th-century cottages",
    ],
    whyBullets: [
      "Buy genuine historic character and a true walkable downtown lifestyle at prices well below comparable Williamson County towns.",
      "Strong, identifiable resale identity as the heart of Maury County's 'Antebellum Homes Capital of Tennessee.'",
      "Restaurants, breweries, shops, and arts events are steps from the front door rather than a drive away.",
    ],
    faqs: [
      { q: "Are homes downtown actually historic, or just old?", a: "Many are genuinely historic — the area is anchored by the National Register-listed Columbia Commercial Historic Downtown District (listed 1984), and Columbia is widely promoted as the 'Antebellum Homes Capital of Tennessee.' Always confirm a specific home's age and any historic designation during due diligence." },
      { q: "Will I have to follow historic preservation rules if I buy here?", a: "Possibly. Columbia has a Historic Zoning Commission, and homes within a locally designated historic-zoning overlay may need design review for exterior changes. This varies block by block, so verify the overlay status for the exact address before buying." },
      { q: "What schools serve downtown Columbia?", a: "In-town Columbia addresses are part of Maury County Public Schools, with schools such as McDowell Elementary, Whitthorne Middle, and Columbia Central High serving portions of the area. Zoning is address-specific, so verify current zoning for the home you're considering." },
      { q: "How affordable is downtown Columbia compared to Williamson County?", a: "Roughly, downtown homes have ranged from about $200k for smaller or fixer properties to $600k+ for restored landmark homes — generally well below comparable historic towns in Williamson County. Treat these as approximate; condition and lot drive price heavily." },
      { q: "Is it actually walkable?", a: "Yes for the core square — boutiques, restaurants, breweries, and the Arts District are within walking distance, and the city hosts regular downtown events. Walkability decreases the farther a home sits from the square, so check the specific block." },
    ],
    schemaCity: "Columbia",
    schemaState: 'TN',
    latitude: 35.615,
    longitude: -87.035,
  },
  'north-columbia-carters-creek-tn': {
    slug: 'north-columbia-carters-creek-tn',
    name: "North Columbia / Carters Creek (Spring Hill-Adjacent)",
    city: "Columbia",
    citySlug: 'columbia-tn',
    county: "Maury County",
    metaTitle: "North Columbia / Carters Creek (Spring Hill-Adjacent) Neighborhood Guide | Columbia, TN",
    metaDescription: "North Columbia / Carters Creek (Spring Hill-Adjacent) in Columbia, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "North Columbia — the Carters Creek Pike and US-31 corridor toward Spring Hill — is where the city's fastest growth is happening. Modern subdivisions like Reserve at Silver Springs, Overlook at Carters Creek, and Carters Station deliver brand-new homes on rolling hills, just minutes from the GM plant and Spring Hill's shopping. It's the value play for commuters who want new construction without Williamson County prices.",
    about: "Stretching across north Columbia between Carters Creek Pike and US-31, this Spring Hill-adjacent corridor has become one of Maury County's most in-demand areas over the past decade as young families and commuters move in for affordability. New-construction communities lead the way: M/I Homes' Reserve at Silver Springs offers two-story plans from roughly 2,000 to 2,900 square feet (with options like first-floor owner's suites, 3-car garages, and pickleball courts), while Overlook at Carters Creek dates to around 2008 and Carters Station and The Ridge at Carter's Station continue to expand the inventory. The big draw is location: the GM Spring Hill assembly plant — the largest GM facility in North America — sits roughly six miles away, with quick access to US-31 and I-65 for Cool Springs and Nashville commuters. Buyers get modern, lower-maintenance homes and active HOA communities at prices that remain meaningfully below comparable new construction in Spring Hill and Williamson County. School zoning here is tied to Maury County Schools' Spring Hill-area attendance zones.",
    vibe: "Columbia's fast-growing new-construction corridor — modern subdivisions on rolling hills, minutes from Spring Hill and the GM plant at Maury County prices.",
    priceBand: "$300K – $550K+ (approximate; new construction skews higher)",
    buildYears: "Mostly 2000s–2020s, with active new construction (e.g., Reserve at Silver Springs, Overlook at Carters Creek)",
    hoa: "Most newer subdivisions here have an active HOA with dues; norms vary by community — verify dues and covenants for the specific subdivision.",
    schoolNotes: "North Columbia subdivisions fall within Maury County Public Schools, and several are commonly associated with the Spring Hill attendance zone (e.g., Spring Hill Elementary/Middle/High); some builders cite Maury County's Spring Hill schools — verify current zoning for the specific address.",
    amenities: [
      "New-construction communities with modern open floor plans (Reserve at Silver Springs, Overlook at Carters Creek, Carters Station)",
      "Community amenities in select neighborhoods such as pickleball courts",
      "Quick access to US-31, Carters Creek Pike, and I-65/I-840",
      "Roughly 6 miles to the GM Spring Hill assembly plant",
      "Close to Spring Hill retail, dining, and services to the north",
      "Scenic rolling-hill topography with larger homesites in some communities",
    ],
    homeStyles: [
      "Two-story production new construction",
      "Modern farmhouse / traditional builder elevations",
      "First-floor owner's suite plans",
      "3-car-garage layouts",
      "Ranch and ranch-with-bonus floor plans",
    ],
    whyBullets: [
      "Newer, lower-maintenance homes with modern layouts at prices well under Spring Hill and Williamson County for comparable square footage.",
      "Ideal for GM Spring Hill and Cool Springs/Nashville commuters who want a short drive to work and more house for the money.",
      "Active, amenity-equipped subdivisions appeal to young families wanting sidewalks, community spaces, and newer schools.",
    ],
    faqs: [
      { q: "How far is this area from the GM Spring Hill plant?", a: "Communities along the Carters Creek/US-31 corridor in north Columbia, such as Reserve at Silver Springs, are roughly six miles from the GM Spring Hill assembly plant — typically a short drive — making the area popular with plant employees. Confirm exact distance from the specific subdivision." },
      { q: "What schools serve north Columbia subdivisions?", a: "These neighborhoods are in Maury County Public Schools, and several are commonly associated with the Spring Hill attendance zone (Spring Hill Elementary, Middle, and High). Boundaries can shift with growth, so verify current zoning for the specific address." },
      { q: "Is this mostly new construction?", a: "Largely, yes. The area is one of Columbia's most active new-construction corridors — communities like Reserve at Silver Springs are actively selling, while others such as Overlook at Carters Creek have been building out since around 2008. You'll find a mix of brand-new and recently built resale homes." },
      { q: "Do these neighborhoods have HOAs?", a: "Most newer subdivisions in this corridor have an active HOA with dues and covenants, and some include amenities like pickleball courts. Dues and rules vary by community, so review the HOA documents for the specific subdivision before buying." },
      { q: "Why buy here instead of in Spring Hill itself?", a: "You generally get newer homes with comparable access to Spring Hill jobs, shopping, and the GM plant, but at lower Maury County prices than equivalent Williamson County / Spring Hill new construction. Buyers trade a few extra minutes of drive time for more house and land for the money." },
    ],
    schemaCity: "Columbia",
    schemaState: 'TN',
    latitude: 35.68,
    longitude: -87,
  },
  'bridgemore-village-thompsons-station-tn': {
    slug: 'bridgemore-village-thompsons-station-tn',
    name: "Bridgemore Village",
    city: "Thompson's Station",
    citySlug: 'thompsons-station-tn',
    county: "Williamson County",
    metaTitle: "Bridgemore Village Neighborhood Guide | Thompson's Station, TN",
    metaDescription: "Bridgemore Village in Thompson's Station, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Bridgemore Village is one of Thompson's Station's most recognizable established communities — a brick-and-stone neighborhood of larger custom homes set on generous lots along Martins Mill and Clayton Arnold Roads. If you've driven the rolling pastureland of southern Williamson County, you've driven past Bridgemore.",
    about: "Bridgemore Village built its reputation on a strict exterior standard: every home is brick or stone, with no vinyl siding anywhere in the community. Developed across more than a dozen named sections between roughly 2007 and 2020, it has the architectural variety and mature landscaping of an established neighborhood rather than a brand-new build-out. Homes generally range from about 2,400 to over 5,000 square feet on larger lots — many a half-acre or more — giving the community a more private, estate-like feel than the tighter subdivisions nearby. Select sections add a community pool and tennis courts, and the location is a standout for families: portions of the neighborhood sit within walking distance of the Thompson's Station Elementary and Middle campus. Surrounded by the rolling hills of southern Williamson County yet minutes from Cool Springs retail and I-65, Bridgemore appeals to move-up and luxury buyers who want space and a polished look close to Franklin.",
    vibe: "Established all-brick-and-stone community of larger custom homes on bigger lots, with no vinyl siding anywhere in sight.",
    priceBand: "$840K – $1.8M (approx.)",
    buildYears: "Roughly 2007 to 2020, across 12+ named sections (established, with mature landscaping)",
    hoa: "Active HOA. Dues approximately $95–$100/month for standard sections; sections with pool and tennis access run closer to $300/quarter. Verify the current dues and what they cover for the specific section.",
    schoolNotes: "Commonly zoned to Williamson County Schools — typically Thompson's Station Elementary and Thompson's Station Middle, with high school usually Summit, though some sources list certain sections at Independence. High school assignment can vary by section — verify current zoning for the specific address with Williamson County Schools.",
    amenities: [
      "Community swimming pool (select sections)",
      "Tennis courts (select sections)",
      "Walking trails and sidewalks throughout",
      "Larger lots, often half-acre and up, with mature trees",
      "Walking-distance access to the Thompson's Station Elementary/Middle campus from some sections",
      "Clubhouse",
    ],
    homeStyles: [
      "All-brick exteriors (no vinyl siding anywhere in the community)",
      "Brick-and-stone custom homes",
      "Traditional Southern architecture",
      "Larger two-story family homes (roughly 2,400–5,000 sq ft)",
      "Estate-style homes on premium lots",
    ],
    whyBullets: [
      "Bridgemore Village's all-brick-or-stone building standard and half-acre-plus lots give it a higher-end, established feel that newer cookie-cutter subdivisions in the area can't match, which supports resale.",
      "Several sections sit within walking distance of the Thompson's Station Elementary and Middle campus on Martins Mill Road — a genuine draw for families who'd rather skip the morning car line.",
      "You get rolling-hills, southern-Williamson-County privacy while staying minutes from Cool Springs retail, I-65, and downtown Franklin.",
    ],
    faqs: [
      { q: "How much do homes in Bridgemore Village cost?", a: "Recent sales have run roughly from the low $800s up to around $1.8M, with most activity in the $1M–$1.3M range. These are approximate ranges that shift with the market — Joshua can pull recent closed comps for the specific section you're considering." },
      { q: "What schools is Bridgemore Village zoned to?", a: "Most addresses are zoned to Williamson County Schools — typically Thompson's Station Elementary and Thompson's Station Middle, with the high school commonly Summit (some sources list certain sections at Independence). High school assignment can vary by section, so always verify the current zoning for the specific address with Williamson County Schools before writing an offer." },
      { q: "Does Bridgemore Village have a pool and an HOA?", a: "Yes. There's an active HOA, and select sections include a community pool and tennis courts. Standard dues are roughly $95–$100/month, with pool/tennis sections running closer to $300/quarter. Confirm the exact dues and amenities for the specific section." },
      { q: "What makes Bridgemore Village different from newer Thompson's Station subdivisions?", a: "Two things stand out: the all-brick-or-stone exterior requirement (no vinyl anywhere) and the larger lots, many a half-acre or more. That combination gives it a more established, higher-end feel than many of the newer, denser communities in the area." },
      { q: "Where exactly is Bridgemore Village?", a: "It sits in the 37179 ZIP in Thompson's Station, off Clayton Arnold and Martins Mill Roads in the heart of southern Williamson County — minutes from I-65, Cool Springs, and downtown Franklin." },
    ],
    schemaCity: "Thompson's Station",
    schemaState: 'TN',
    latitude: 35.803,
    longitude: -86.872,
  },
  'fields-of-canterbury-thompsons-station-tn': {
    slug: 'fields-of-canterbury-thompsons-station-tn',
    name: "Fields of Canterbury",
    city: "Thompson's Station",
    citySlug: 'thompsons-station-tn',
    county: "Williamson County",
    metaTitle: "Fields of Canterbury Neighborhood Guide | Thompson's Station, TN",
    metaDescription: "Fields of Canterbury in Thompson's Station, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Fields of Canterbury is one of Thompson's Station's largest and most amenity-rich communities — hundreds of homes across 20-plus sections, anchored by two pools, parks, and Old World European styling. Located off Clayton Arnold Road near the Thompson's Station school campus, it's a go-to for families wanting amenities and a wide range of price points.",
    about: "Developed since roughly 2012 across more than 20 sections, Fields of Canterbury has grown into one of Thompson's Station's largest master-planned communities, with hundreds of homes and dozens of sales each year. Its design blends Old World European exterior elements — tree-lined sidewalks, traditional lamp posts, and a park-like layout — with contemporary interiors. The amenity package is a real differentiator at this price point: two pool areas (a junior-Olympic pool with cabana plus a children's pool with water features), multiple playgrounds, and park areas with fire pits and grills. Housing runs the gamut, from townhomes in the low $400s with exterior maintenance covered to single-family homes approaching $1.2M, so the community works for first-time buyers, downsizers, and move-up families alike. The location is a strong selling point — minutes from Cool Springs and downtown Franklin, with quick I-840 access and the Thompson's Station Elementary and Middle campus just down Clayton Arnold Road.",
    vibe: "A big, amenity-rich master-planned community with Old World European styling, two pools, and a wide price range from townhomes to larger single-family homes.",
    priceBand: "$415K – $1.2M (approx.)",
    buildYears: "Built since roughly 2012 across 20+ sections (still developing in newer phases)",
    hoa: "Active HOA. Single-family dues run approximately $115/month; townhomes roughly $255–$285/month (the higher townhome dues include exterior maintenance). Verify current dues and coverage for the specific home type and section.",
    schoolNotes: "Commonly zoned to Williamson County Schools — typically Thompson's Station Elementary and Thompson's Station Middle (both adjacent on Clayton Arnold Road), with high school commonly Independence, though some sections may feed Summit. High school assignment can vary by section — verify current zoning for the specific address with Williamson County Schools.",
    amenities: [
      "Two pool areas — a junior-Olympic pool with cabana plus a separate children's pool with water features",
      "Multiple playgrounds",
      "Park areas with fire pits and grills",
      "Amenity/community center",
      "Tree-lined sidewalks with traditional lamp posts",
      "Green corridors and common areas maintained by the HOA",
    ],
    homeStyles: [
      "Old World European–influenced exteriors with contemporary interiors",
      "Manor and cottage-style single-family homes",
      "Townhomes (lower-maintenance, exterior covered by HOA)",
      "Homes roughly 1,700–3,900 sq ft, 3–5 bedrooms",
      "Traditional family two-story plans",
    ],
    whyBullets: [
      "The two-pool, playground, and park amenity package punches above its price point, making Fields of Canterbury a strong value play for families who want resort-style amenities without a luxury-tier price.",
      "An unusually wide price range — from townhomes in the low $400s to single-family homes near $1.2M — means buyers at very different budgets can find a fit under one well-known community name.",
      "It sits minutes from Cool Springs, downtown Franklin, and I-840, with Thompson's Station Elementary and Middle right on Clayton Arnold Road — a practical, commuter-and-family-friendly location.",
    ],
    faqs: [
      { q: "How much do homes in Fields of Canterbury cost?", a: "Pricing is approximate and broad: townhomes have run roughly $415K–$580K, while single-family homes range from about $470K up to roughly $1.2M, with the overall median around the high $700s. The market shifts, so Joshua can pull recent closed comps for the specific section and home type you're after." },
      { q: "What schools is Fields of Canterbury zoned to?", a: "Most addresses are zoned to Williamson County Schools — typically Thompson's Station Elementary and Thompson's Station Middle (both on Clayton Arnold Road), with the high school commonly Independence, though some sections may feed Summit. High school assignment can vary by section, so verify the current zoning for the specific address with Williamson County Schools." },
      { q: "Does Fields of Canterbury have pools and an HOA?", a: "Yes — it has two pool areas (a junior-Olympic pool with cabana and a separate children's pool), plus playgrounds and parks. There's an active HOA: single-family dues are roughly $115/month, and townhome dues run about $255–$285/month with exterior maintenance included. Confirm current dues and coverage for your home type." },
      { q: "Is there a difference between Fields of Canterbury and Canterbury?", a: "Yes — these are commonly confused. Fields of Canterbury is the larger, more established community (20+ sections built since about 2012 with two pools). 'Canterbury' is a separate, newer Willow Branch community (roughly 2020–2025). Make sure the listing you're looking at names the exact community, since amenities, pricing, and dues differ." },
      { q: "Where is Fields of Canterbury located?", a: "It's in the 37179 ZIP in Thompson's Station, off Clayton Arnold Road near Critz Lane — south of I-840 and east of Columbia Pike (Hwy 31) — minutes from Cool Springs, downtown Franklin, and I-840." },
    ],
    schemaCity: "Thompson's Station",
    schemaState: 'TN',
    latitude: 35.808,
    longitude: -86.884,
  },
  'five-oaks-lebanon-tn': {
    slug: 'five-oaks-lebanon-tn',
    name: "Five Oaks",
    city: "Lebanon",
    citySlug: 'lebanon-tn',
    county: "Wilson County",
    metaTitle: "Five Oaks Neighborhood Guide | Lebanon, TN",
    metaDescription: "Five Oaks in Lebanon, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Five Oaks is Lebanon's best-known golf-course community, set on more than 500 rolling acres around the par-72 Club at Five Oaks in the 37087 ZIP. Buyers find everything from townhomes to all-brick executive estates, many with fairway views.",
    about: "Five Oaks sits on the east side of Lebanon in Wilson County, built around the Club at Five Oaks, a par-72 layout that opened in 2001 and is regarded as one of Middle Tennessee's stronger courses. The neighborhood pairs established, mature streets of all-brick traditional homes and custom estates with newer sections — including The Preserve at Five Oaks (David Weekley Homes), The Grove townhomes, and The Villages — that are still adding inventory. Prices typically run from around $430k for townhomes and smaller single-family homes up to roughly $1.5M for larger custom estates, with occasional listings above that. Homes range broadly in size, and many lots offer golf-course frontage or views. Club and social memberships are available but separate from home purchase. The setting is rolling and wooded, with a clubhouse used for dining and events. Easy access to Highway 70 and I-40 keeps residents within reach of downtown Lebanon and the broader Nashville metro.",
    vibe: "Lebanon's premier golf-course community of brick executive homes and townhomes wrapped around the par-72 Club at Five Oaks.",
    priceBand: "$430K – $1.5M (some custom estates list higher)",
    buildYears: "Late 1990s/early 2000s through new construction (golf course built 2001; newer sections like The Preserve, The Grove, and The Villages still building)",
    hoa: "Yes — HOA in most sections; golf/social club membership at The Club at Five Oaks is separate and optional. Verify dues and what's included for the specific section/home.",
    schoolNotes: "Commonly zoned to Coles Ferry Elementary, Walter J. Baird Middle, and Lebanon High (Wilson County Schools) — verify current zoning for the specific address.",
    amenities: [
      "The Club at Five Oaks par-72 golf course (approx. 6,954 yards)",
      "Clubhouse with dining and event/wedding space",
      "Rolling, wooded 500+ acre setting with fairway views",
      "Walking areas and green space",
      "Optional golf and social club memberships",
      "New-construction sections (The Preserve, The Grove, The Villages)",
    ],
    homeStyles: [
      "All-brick traditional single-family homes",
      "Custom executive estates",
      "Newer open-concept David Weekley homes",
      "Golf-frontage homes",
      "Townhomes/condos",
    ],
    whyBullets: [
      "One of the few true golf-course communities in Lebanon, with homes that back to or look over the Club at Five Oaks fairways.",
      "A wide price spread — from townhomes and entry single-family homes near $430k up to large custom estates — lets buyers move up without leaving the neighborhood.",
      "Established, mature streets combined with active new-construction sections give buyers a choice between resale character and brand-new builds.",
    ],
    faqs: [
      { q: "Is Five Oaks a golf community?", a: "Yes. The neighborhood is built around the Club at Five Oaks, a par-72 course of roughly 6,954 yards. Golf and social club memberships are available separately from buying a home, so you can live in Five Oaks without joining the club." },
      { q: "What price range do homes in Five Oaks sell for?", a: "Approximately $430k for townhomes and smaller single-family homes up to around $1.5M for larger custom estates, with some listings higher. These are rough, approximate ranges that shift with the market." },
      { q: "Are there new-construction homes in Five Oaks?", a: "Yes. Established resale streets are paired with newer sections still building, including The Preserve at Five Oaks (David Weekley Homes), The Grove townhomes, and The Villages. Availability changes often, so confirm what's currently for sale." },
      { q: "What schools serve Five Oaks?", a: "It is commonly zoned to Coles Ferry Elementary, Walter J. Baird Middle, and Lebanon High in Wilson County Schools. Always verify current zoning for the specific address, as boundaries can change." },
      { q: "Is there an HOA in Five Oaks?", a: "Most sections have an HOA, and dues and coverage vary by section and home type. Golf/social club membership at the Club at Five Oaks is separate and optional. Confirm the specific HOA dues and rules before you buy." },
    ],
    schemaCity: "Lebanon",
    schemaState: 'TN',
    latitude: 36.251,
    longitude: -86.375,
  },
  'villages-of-hunters-point-lebanon-tn': {
    slug: 'villages-of-hunters-point-lebanon-tn',
    name: "Villages of Hunters Point",
    city: "Lebanon",
    citySlug: 'lebanon-tn',
    county: "Wilson County",
    metaTitle: "Villages of Hunters Point Neighborhood Guide | Lebanon, TN",
    metaDescription: "Villages of Hunters Point in Lebanon, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Villages of Hunters Point is a newer, amenity-rich D.R. Horton community just north of downtown Lebanon, off N. Cumberland Street near Hunters Point Pike. It offers brand-new Craftsman-style homes, a resort-style pool, and easy access to I-40.",
    about: "Villages of Hunters Point is one of Lebanon's most active newer subdivisions, developed by D.R. Horton on a large site (hundreds of single-family lots planned) just north of the historic Lebanon Square in Wilson County. Most homes are recent construction — many built around 2023 — in a Craftsman style with open-concept, one- and two-story floor plans ranging from three to five bedrooms with two-car garages. The community is built for an active lifestyle, with a resort-style swimming pool, clubhouse, walking trails and sidewalks, a playground, and a community amphitheater; an HOA maintains these shared amenities, with dues commonly cited in the $50–$100/month range. The neighborhood sits across from the public Hunters Point Golf Course (a separate facility, not an exclusive community amenity). Prices typically run from the mid-$300s to mid-$400s, making it a strong option for buyers who want a brand-new home near downtown Lebanon. Quick access to I-40 keeps the Nashville metro within easy reach.",
    vibe: "A large, amenity-rich D.R. Horton community of newer Craftsman-style homes just north of historic downtown Lebanon, across from the Hunters Point golf course.",
    priceBand: "$375K – $475K (approximate)",
    buildYears: "Roughly 2022–present (active new construction; many homes built around 2023)",
    hoa: "Yes — HOA covers shared amenities (pool, clubhouse/common areas, landscaping of common areas); dues frequently cited around $50–$100/month. Verify current dues and coverage.",
    schoolNotes: "Commonly zoned to Sam Houston Elementary, Walter J. Baird Middle, and Lebanon High (Wilson County Schools) — verify current zoning for the specific address.",
    amenities: [
      "Resort-style community swimming pool",
      "Clubhouse for social/community events",
      "Walking trails and sidewalks",
      "Playground",
      "Community amphitheater",
      "Near the public Hunters Point Golf Course",
    ],
    homeStyles: [
      "Craftsman-style single-family homes",
      "One- and two-story floor plans",
      "Open-concept layouts",
      "3–5 bedroom plans with 2-car garages",
    ],
    whyBullets: [
      "A modern, master-planned D.R. Horton community (hundreds of lots planned) offering brand-new homes with warranties and current finishes.",
      "Resort-style amenities — pool, clubhouse, trails, playground, and amphitheater — give an active, social neighborhood feel at an accessible price point.",
      "Located minutes from historic Lebanon Square with quick I-40 access and the Hunters Point golf course right across the way.",
    ],
    faqs: [
      { q: "Who builds homes in Villages of Hunters Point?", a: "The community is developed by D.R. Horton, with several Craftsman-style floor plans ranging from one to two stories and three to five bedrooms. Plan availability and pricing change as the community builds out." },
      { q: "What amenities does Villages of Hunters Point offer?", a: "Residents typically have access to a resort-style swimming pool, clubhouse, walking trails and sidewalks, a playground, and a community amphitheater. Confirm current amenity status and HOA dues before purchase." },
      { q: "Is this the same as the Hunters Point golf course?", a: "No. Villages of Hunters Point is a D.R. Horton residential community located across from the public Hunters Point Golf Course. The golf course is a separate facility, not a private community amenity." },
      { q: "What price range are homes in Villages of Hunters Point?", a: "Roughly the mid-$300s to mid-$400s for new single-family homes, an approximate range that moves with the market and available floor plans." },
      { q: "What schools serve Villages of Hunters Point?", a: "It is commonly zoned to Sam Houston Elementary, Walter J. Baird Middle, and Lebanon High in Wilson County Schools. Verify current zoning for the specific address, since boundaries can change." },
    ],
    schemaCity: "Lebanon",
    schemaState: 'TN',
    latitude: 36.24,
    longitude: -86.29,
  },
  'preserve-at-stewart-creek-smyrna-tn': {
    slug: 'preserve-at-stewart-creek-smyrna-tn',
    name: "Preserve at Stewart Creek",
    city: "Smyrna",
    citySlug: 'smyrna-tn',
    county: "Rutherford County",
    metaTitle: "Preserve at Stewart Creek Neighborhood Guide | Smyrna, TN",
    metaDescription: "Preserve at Stewart Creek in Smyrna, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "The Preserve at Stewart Creek is an established single-family neighborhood off Almaville Road in Smyrna, built by Ole South in the late 2010s. It blends modern, low-maintenance homes with sidewalks and shared green space, all within Rutherford County's rapidly growing Stewarts Creek corridor.",
    about: "The Preserve at Stewart Creek is a single-family community located off Almaville Road in southern Smyrna, Tennessee (37167), in Rutherford County. Developed primarily by Ole South, the bulk of the homes were built between roughly 2017 and 2020, giving the neighborhood a cohesive, newer feel without the cost of brand-new construction. Homes are predominantly two-story with fiber-cement and stone exteriors, typically offering three to four bedrooms and roughly 1,600 to 2,100 square feet, with several plans featuring a main-level primary suite. The neighborhood is laid out with sidewalks and includes a playground, pavilion, and park green space, though there is no community pool. A modest HOA, billed quarterly, maintains the shared areas. Its location places residents minutes from Sam Ridley Parkway and I-24, making both Nashville and Murfreesboro convenient commutes, and close to the Nissan plant. Recent sale and listing prices have generally ranged from the high $420,000s into the low $530,000s. Buyers should confirm current pricing, HOA dues, and school zoning for any specific address.",
    vibe: "A newer Ole South single-family community of low-maintenance homes off Almaville Road, popular with first-time and right-sizing buyers who want a walkable, sidewalk-lined neighborhood close to Smyrna's Stewarts Creek corridor.",
    priceBand: "$430K – $530K (approx.)",
    buildYears: "Roughly 2017–2020",
    hoa: "Yes — modest dues, roughly $90–$100 per quarter (~$30–$33/month); covers common-area upkeep. Verify current dues with the HOA.",
    schoolNotes: "Commonly zoned to the Stewarts Creek cluster (Stewarts Creek Elementary or Brown's Chapel Elementary, Stewarts Creek Middle, Stewarts Creek High) in Rutherford County Schools — verify current zoning for the specific address.",
    amenities: [
      "Neighborhood playground",
      "Pavilion / picnic area",
      "Park green space",
      "Sidewalks throughout",
      "No community pool",
    ],
    homeStyles: [
      "Two-story single-family homes",
      "Main-level primary suite floor plans",
      "Fiber-cement and stone exteriors",
      "3–4 bedrooms, ~1,600–2,100 sq ft",
    ],
    whyBullets: [
      "Newer construction (late-2010s) means lower maintenance and modern, open floor plans without the premium of brand-new builds.",
      "Sits in Smyrna's fast-growing Almaville/Stewarts Creek corridor with quick access to Sam Ridley Parkway, I-24, the Nissan plant, and Murfreesboro.",
      "Modest HOA dues plus sidewalks, a playground, and green space make it an approachable, family- and commuter-friendly price point for the area.",
    ],
    faqs: [
      { q: "What county is the Preserve at Stewart Creek in?", a: "It is in Rutherford County, Tennessee, within the town of Smyrna (zip code 37167)." },
      { q: "Who built the Preserve at Stewart Creek?", a: "The community was developed primarily by Ole South, with most homes constructed between roughly 2017 and 2020." },
      { q: "What schools serve the neighborhood?", a: "Homes are commonly zoned to the Stewarts Creek cluster — Stewarts Creek (or Brown's Chapel) Elementary, Stewarts Creek Middle, and Stewarts Creek High in Rutherford County Schools. Always verify current zoning for the specific address." },
      { q: "Is there an HOA and a pool?", a: "Yes, there is an HOA with modest dues billed quarterly (roughly $90–$100 per quarter). The community has a playground, pavilion, and green space but no community pool. Confirm current dues with the HOA." },
      { q: "What do homes typically cost here?", a: "Approximately the high $420,000s to the low $530,000s in recent activity, though prices change with the market — these are rough estimates only." },
    ],
    schemaCity: "Smyrna",
    schemaState: 'TN',
    latitude: 35.93,
    longitude: -86.53,
  },
  'woodmont-smyrna-tn': {
    slug: 'woodmont-smyrna-tn',
    name: "Woodmont",
    city: "Smyrna",
    citySlug: 'smyrna-tn',
    county: "Rutherford County",
    metaTitle: "Woodmont Neighborhood Guide | Smyrna, TN",
    metaDescription: "Woodmont in Smyrna, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Woodmont is one of Smyrna's larger and longer-running master-planned communities, sitting in the Stewarts Creek corridor with direct access to Sam Ridley Parkway. Developed in phases since around 2006 — with Meritage Homes a major recent builder — it offers traditional single-family homes plus a pool, tennis courts, and playground.",
    about: "Woodmont is an established single-family community in Smyrna, Tennessee (37167), entirely within Rutherford County. Begun around 2006 and built out in phases into the mid-2020s, it has grown into one of the area's larger and most recognizable neighborhoods, with Meritage Homes accounting for a significant share of recent sales. Homes are predominantly traditional two-story residences with brick and mixed-material exteriors, typically offering three to five bedrooms, two to four baths, and roughly 1,500 to 3,300 square feet. Community amenities include a pool, tennis courts, and a playground, with newer phases adding an expanded amenity center and pool house; the neighborhood sits near the Stewarts Creek greenway. Because it was built over many years, Woodmont offers both mature, settled streets and newer construction. HOA dues vary by phase. Its location feeds directly onto Sam Ridley Parkway, minutes from I-24, making it popular with Nashville and Murfreesboro commuters and those working at the nearby Nissan plant. Recent sale prices have ranged broadly from the low $300,000s into the low $600,000s. Confirm current pricing, HOA dues by section, and school zoning for any specific address.",
    vibe: "One of Smyrna's larger, more established master-planned communities along the Sam Ridley Parkway / Stewarts Creek corridor, with traditional single-family homes, a pool and tennis courts, and easy I-24 access for Nashville commuters.",
    priceBand: "$320K – $610K (approx.)",
    buildYears: "Roughly 2006–2025 (phased over many years)",
    hoa: "Yes — dues vary by phase, roughly $49–$195/month (about $588–$2,340/year) depending on section and amenities. Verify current dues for the specific section.",
    schoolNotes: "Commonly zoned to the Stewarts Creek cluster (Stewarts Creek Elementary, Middle, and High); some homes feed to Rock Springs schools — verify current zoning for the specific address in Rutherford County Schools.",
    amenities: [
      "Community pool / amenity center",
      "Tennis courts",
      "Playground",
      "Pool house (newer phases)",
      "Sidewalks",
      "Near Stewarts Creek greenway",
    ],
    homeStyles: [
      "Traditional two-story single-family homes",
      "Brick and mixed-material exteriors",
      "3–5 bedrooms, 2–4 baths",
      "Roughly 1,500–3,300 sq ft",
    ],
    whyBullets: [
      "A well-established, amenity-rich community (pool, tennis, playground) developed in phases since 2006, offering mature sections alongside newer Meritage construction.",
      "Direct access to Sam Ridley Parkway and minutes from I-24 puts downtown Nashville roughly 25–30 minutes away, with Murfreesboro and the Nissan plant close by.",
      "A wide price and size range — from the low $300,000s into the $600,000s — gives both first-time and move-up buyers options within one recognizable neighborhood name.",
    ],
    faqs: [
      { q: "Where is Woodmont located in Smyrna?", a: "Woodmont is in the Stewarts Creek corridor of Smyrna (zip code 37167), Rutherford County, with direct access to Sam Ridley Parkway and just minutes from I-24." },
      { q: "How established is Woodmont?", a: "The earliest homes date to around 2006, and the community was built out in phases over nearly two decades, so it includes both mature sections and newer construction — Meritage Homes has been a major recent builder." },
      { q: "What amenities does Woodmont have?", a: "Amenities include a community pool, tennis courts, and a playground, with newer phases adding an expanded amenity center and pool house. It also sits near the Stewarts Creek greenway." },
      { q: "What schools serve Woodmont?", a: "Most homes are commonly zoned to the Stewarts Creek cluster (Stewarts Creek Elementary, Middle, and High), and some feed to Rock Springs schools. Verify current zoning for the specific address with Rutherford County Schools." },
      { q: "What is the price range in Woodmont?", a: "Recent activity has ranged roughly from the low $300,000s into the low $600,000s, reflecting the mix of older and newer homes and sizes. These are approximate figures that shift with the market." },
    ],
    schemaCity: "Smyrna",
    schemaState: 'TN',
    latitude: 35.97,
    longitude: -86.53,
  },
  'lake-forest-estates-la-vergne-tn': {
    slug: 'lake-forest-estates-la-vergne-tn',
    name: "Lake Forest Estates",
    city: "La Vergne",
    citySlug: 'la-vergne-tn',
    county: "Rutherford County",
    metaTitle: "Lake Forest Estates Neighborhood Guide | La Vergne, TN",
    metaDescription: "Lake Forest Estates in La Vergne, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Lake Forest Estates is La Vergne's largest and most established residential community, offering an affordable foothold in Rutherford County just off I-24. With a long build history and a deep mix of detached homes plus townhome and villa sections, it's a go-to neighborhood for first-time buyers and Nashville commuters seeking value.",
    about: "Lake Forest Estates is one of the largest subdivisions in the area, with several thousand homes spread across phases built from the early 1990s through the late 2010s. The community sits in the heart of La Vergne, generally bounded by Bill Stewart Boulevard, Stones River Road, Hollandale Road and Sand Hill Road, with mature landscaping that reflects its age. Housing is intentionally diverse — modest ranch and split-level homes, traditional two-stories, and attached townhome/villa enclaves like Holland Ridge and the Cottages of Lake Forest — so price points span a wide affordable band. Median sale prices have hovered around the low-$300k range, with many homes trading well below $400k, making it one of the most accessible markets in Rutherford County. Its biggest draws are location and value: quick I-24 access shortens the Nashville commute, and Percy Priest Lake recreation is close by. Buyers should confirm section-specific HOA terms and current school zoning before purchasing.",
    vibe: "La Vergne's largest and most recognizable master-planned community, a sprawling, mature neighborhood of affordable single-family homes minutes from I-24 and Percy Priest Lake.",
    priceBand: "$280K – $520K",
    buildYears: "approx. 1991–2018 (community established 1993; built out in phases over ~25 years)",
    hoa: "Mixed/varies by section — many detached homes have little or no HOA, while attached/villa sections (e.g., Holland Ridge) carry modest dues; verify HOA status and fees for the specific section and address.",
    schoolNotes: "Rutherford County Schools; commonly zoned to LaVergne Lake Elementary, LaVergne Middle, and La Vergne High School — verify current zoning for the specific address using the Rutherford County Schools/Edulog lookup.",
    amenities: [
      "Easy I-24 access for the Nashville commute",
      "Close to Percy Priest Lake recreation",
      "Mature tree-lined streets and established landscaping",
      "Mix of detached homes plus townhome/villa sections (Holland Ridge, Cottages of Lake Forest)",
      "Near La Vergne city parks, shopping, and dining",
      "Sidewalk-friendly residential street grid",
    ],
    homeStyles: [
      "Traditional two-story and split-level homes",
      "Brick and vinyl-sided single-family homes",
      "Ranch-style one-level homes",
      "Attached townhomes/villas in some sections",
    ],
    whyBullets: [
      "One of the most affordable entry points into Rutherford County homeownership, with a median sale price around $330k and many homes well under $400k.",
      "As La Vergne's largest and best-known subdivision, it has deep resale activity and strong name recognition, which helps liquidity for buyers.",
      "Excellent value for Nashville commuters — quick I-24 access and proximity to Percy Priest Lake make it a practical, lower-cost alternative to closer-in metro neighborhoods.",
    ],
    faqs: [
      { q: "Where is Lake Forest Estates located in La Vergne?", a: "It sits in central La Vergne (Rutherford County, ZIP 37086), generally bounded by Bill Stewart Boulevard, Stones River Road, Hollandale Road and Sand Hill Road, with easy access to I-24 and Percy Priest Lake." },
      { q: "How much do homes in Lake Forest Estates cost?", a: "Prices are approximate and change with the market, but homes have generally ranged from roughly the high-$200k range up to about $520k, with a median sale price around $330k — among the more affordable in Rutherford County." },
      { q: "When was Lake Forest Estates built?", a: "The community was established around 1993 and was built out in phases, with homes dating from roughly 1991 through about 2018." },
      { q: "What schools serve Lake Forest Estates?", a: "It is in Rutherford County Schools and is commonly zoned to LaVergne Lake Elementary, LaVergne Middle, and La Vergne High School. Zoning depends on the exact address, so verify current assignments with the Rutherford County Schools lookup tool." },
      { q: "Does Lake Forest Estates have an HOA?", a: "It varies by section — many detached homes have little or no HOA, while some attached townhome/villa areas carry modest dues. Confirm the HOA status and fees for the specific section and address." },
    ],
    schemaCity: "La Vergne",
    schemaState: 'TN',
    latitude: 36.013,
    longitude: -86.565,
  },
  'stones-river-cove-la-vergne-tn': {
    slug: 'stones-river-cove-la-vergne-tn',
    name: "Stones River Cove",
    city: "La Vergne",
    citySlug: 'la-vergne-tn',
    county: "Rutherford County",
    metaTitle: "Stones River Cove Neighborhood Guide | La Vergne, TN",
    metaDescription: "Stones River Cove in La Vergne, TN: home prices, schools, HOA, amenities, and what to know before you buy. Local neighborhood insight from Compass agent Joshua Fink.",
    intro: "Stones River Cove is a small, established single-family subdivision in central La Vergne, built in the mid-2000s off Murfreesboro Road. With modestly sized, reasonably priced homes, it's a practical pick for value-focused buyers and commuters who want an affordable Rutherford County address close to I-24.",
    about: "Stones River Cove is a tidy, fully built-out single-family community in La Vergne (Rutherford County, ZIP 37086), located off Murfreesboro Road with streets including Anna Gannon Drive, Floyd Mayfield Drive, Herman B Rader Drive and Ronnie Erwin Lane. Construction dates to roughly 2003–2005, so the neighborhood has the settled feel of an established subdivision rather than new construction. Homes here are described as midsize and very reasonably priced, generally in the range of about 1,200 to 2,000 square feet — a profile that keeps it among the more affordable options in the county and appealing to first-time and move-up buyers. Its central La Vergne setting puts owners minutes from Murfreesboro Road, I-24, and Percy Priest Lake, with the broader shopping, dining, parks, and city services of La Vergne close by. Because it's a smaller community, buyers should verify HOA status, current school zoning, and recent comparable sales for accurate, address-specific pricing.",
    vibe: "A compact, established early-2000s pocket of modestly priced single-family homes off Murfreesboro Road, well suited to budget-conscious buyers and Nashville commuters.",
    priceBand: "$280K – $400K (approximate)",
    buildYears: "approx. 2003–2005",
    hoa: "Likely little to no HOA typical for a small early-2000s La Vergne subdivision, but this is not confirmed — verify HOA status and any fees before purchase.",
    schoolNotes: "Rutherford County Schools; commonly zoned to La Vergne–area elementary, middle, and high schools (e.g., LaVergne Lake / LaVergne Middle / La Vergne High) — verify current zoning for the specific address using the Rutherford County Schools/Edulog lookup.",
    amenities: [
      "Convenient access to Murfreesboro Road and I-24",
      "Short drive to Percy Priest Lake",
      "Quiet, low-traffic residential streets",
      "Close to La Vergne shopping, dining, and city services",
      "Central La Vergne location near larger Lake Forest Estates amenities and parks",
    ],
    homeStyles: [
      "Single-story ranch-style homes",
      "Traditional two-story homes",
      "Brick and vinyl-sided starter/move-up homes",
    ],
    whyBullets: [
      "A genuinely affordable, established neighborhood where right-sized homes (roughly 1,200–2,000 sq ft) keep entry prices low for first-time buyers.",
      "Built out in the mid-2000s, it offers settled, mature streets without the premium of brand-new construction.",
      "Central La Vergne location delivers quick I-24/Murfreesboro Road access for the Nashville commute plus proximity to Percy Priest Lake recreation.",
    ],
    faqs: [
      { q: "Where is Stones River Cove located?", a: "It's in central La Vergne, Rutherford County (ZIP 37086), off Murfreesboro Road, with quick access to I-24 and a short drive to Percy Priest Lake." },
      { q: "When was Stones River Cove built?", a: "The subdivision dates to the early-to-mid 2000s, with construction generally occurring around 2003–2005, and it is fully built out today." },
      { q: "How much do homes in Stones River Cove cost?", a: "Pricing is approximate and market-dependent, but its modestly sized homes typically fall in the affordable range of roughly the high-$200k to around $400k — confirm with current comparable sales." },
      { q: "What schools serve Stones River Cove?", a: "It is in Rutherford County Schools and is commonly zoned to La Vergne–area schools. Because assignments depend on the exact address, verify current zoning with the Rutherford County Schools/Edulog lookup tool." },
      { q: "Does Stones River Cove have an HOA?", a: "Small early-2000s La Vergne subdivisions often have little or no HOA, but this is not confirmed for Stones River Cove — verify HOA status and any fees before buying." },
    ],
    schemaCity: "La Vergne",
    schemaState: 'TN',
    latitude: 36.005,
    longitude: -86.558,
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
