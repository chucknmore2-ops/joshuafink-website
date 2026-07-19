// Top-rated public schools across Joshua's service area, organized for the
// /homes-near/[school] landing pages. Each entry maps a school to the
// suburb it lives in (so the page can pull market data) plus an editorial
// blurb that gives the page substance beyond a thin doorway.

import { getSuburb, type Suburb } from './suburbs'

export type School = {
  slug: string
  name: string
  level: 'Elementary' | 'Middle' | 'High'
  district: string
  suburbSlug: string
  ratingNote: string
  blurb: string
  neighborhoods: string[]
  faqs: { q: string; a: string }[]
}

export const schools: Record<string, School> = {
  'ravenwood-high-school-brentwood-tn': {
    slug: 'ravenwood-high-school-brentwood-tn',
    name: 'Ravenwood High School',
    level: 'High',
    district: 'Williamson County Schools',
    suburbSlug: 'brentwood-tn',
    ratingNote: 'Consistently ranks among the top public high schools in Tennessee.',
    blurb:
      "Ravenwood High School is one of the most academically distinguished public high schools in the Southeast, drawing families to south Brentwood specifically for its school zone. Strong AP participation, competitive athletics, and a long track record of college placement at top universities make Ravenwood-zoned homes a meaningful resale-value driver in Brentwood — buyers actively filter by 'Ravenwood zone' when searching.",
    neighborhoods: ['Governors Club', 'Annandale', 'Raintree Forest', 'Taramore'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Ravenwood High School?',
        a: 'Ravenwood draws from much of southern Brentwood including Governors Club, Annandale, Raintree Forest, Taramore, and surrounding subdivisions. Zoning can change at the district level, so always confirm with Williamson County Schools for any specific address before writing an offer.',
      },
      {
        q: 'How much do homes in the Ravenwood High zone cost?',
        a: 'Most Ravenwood-zoned homes trade between $1.2M and $4M+, depending on subdivision and lot. Governors Club estates push past $5M; smaller Brentwood pockets within the zone can enter in the $900s. Joshua can pull exact comps for any street.',
      },
      {
        q: 'Does buying in the Ravenwood zone affect resale value?',
        a: 'Significantly. Williamson County school zoning is one of the most consistently quoted reasons relocating families pay a premium in Brentwood. Ravenwood-zoned homes have historically resold faster and at stronger price-to-list ratios than otherwise-comparable homes outside the zone.',
      },
    ],
  },

  'brentwood-high-school-brentwood-tn': {
    slug: 'brentwood-high-school-brentwood-tn',
    name: 'Brentwood High School',
    level: 'High',
    district: 'Williamson County Schools',
    suburbSlug: 'brentwood-tn',
    ratingNote: 'A perennial top-ranked Williamson County public high school.',
    blurb:
      "Brentwood High School serves central and northern Brentwood and has built a long reputation for academic rigor, strong AP offerings, and standout athletics. Families relocating to Brentwood often shortlist by Brentwood High vs Ravenwood — both are excellent, but each draws from different sub-areas of the city, and the zoning line meaningfully affects which subdivisions fit.",
    neighborhoods: ['Brentwood Hills', 'Murray Lane', 'Concord', 'Annandale (partial)'],
    faqs: [
      {
        q: 'What neighborhoods feed Brentwood High School?',
        a: 'Central and northern Brentwood including Brentwood Hills, Murray Lane, Concord area, and parts of Annandale. The Brentwood High vs Ravenwood zoning line matters — confirm any specific address with Williamson County Schools before purchase.',
      },
      {
        q: 'How does Brentwood High compare to Ravenwood?',
        a: 'Both consistently rank among the top public high schools in Tennessee. Brentwood High tends to draw from more established central Brentwood neighborhoods; Ravenwood draws from southern Brentwood and Governors Club. For families, school assignment is a function of address — Joshua confirms zoning before every tour.',
      },
      {
        q: 'What are home prices like in the Brentwood High zone?',
        a: 'Most Brentwood High-zoned homes trade between $900K and $3M+, depending on neighborhood and lot. Established central Brentwood neighborhoods carry a meaningful premium for the school zoning. Joshua can pull comps for any specific street.',
      },
    ],
  },

  'page-high-school-franklin-tn': {
    slug: 'page-high-school-franklin-tn',
    name: 'Page High School',
    level: 'High',
    district: 'Williamson County Schools',
    suburbSlug: 'franklin-tn',
    ratingNote: 'A well-regarded Williamson County public high school.',
    blurb:
      "Page High School serves a large family-residential portion of east Franklin and Thompson's Station, including some of the most popular family subdivisions in Williamson County — McKay's Mill, Brixworth, and Berry Farms among them. Strong academics, established athletics, and consistent college placement make the Page zone a high-demand pocket for relocating families targeting Williamson County schools at a more accessible Franklin price point.",
    neighborhoods: ["McKay's Mill", 'Brixworth', 'Berry Farms', 'Cottonwood'],
    faqs: [
      {
        q: 'What Franklin neighborhoods feed Page High School?',
        a: "Page draws from a broad eastern-Franklin and Thompson's Station footprint including McKay's Mill, Brixworth, Berry Farms, and Cottonwood among others. Zoning varies by section within larger subdivisions — confirm with Williamson County Schools for any specific address.",
      },
      {
        q: 'How do Page-zoned home prices compare to Independence-zoned?',
        a: 'Page-zoned homes generally enter at a slightly more accessible price point than the Westhaven/Independence corridor on the west side of Franklin. The school is well-regarded, the inventory is family-functional, and buyers focused on value within Williamson County often shortlist Page-zoned subdivisions first.',
      },
      {
        q: 'Is the Page zone a good long-term family bet?',
        a: 'Yes. Williamson County school zoning consistently drives resale demand, and Page is a stable, well-rated school in a built-out part of east Franklin and Thompson&apos;s Station with limited future inventory growth — supportive of long-term value.',
      },
    ],
  },

  'independence-high-school-thompsons-station-tn': {
    slug: 'independence-high-school-thompsons-station-tn',
    name: 'Independence High School',
    level: 'High',
    district: 'Williamson County Schools',
    suburbSlug: 'thompsons-station-tn',
    ratingNote: 'A top-tier Williamson County public high school with strong academics and athletics.',
    blurb:
      "Independence High School is the high school of choice for much of west Franklin and Thompson's Station, drawing from premier master-planned communities like Westhaven, The Highlands at Ladd Park, Berry Farms, and Tollgate Village. Strong AP offerings, competitive athletics, and consistent placement at top Tennessee and out-of-state universities make the Independence zone one of the most demanded school footprints in Williamson County.",
    neighborhoods: ['Westhaven', 'The Highlands at Ladd Park', 'Berry Farms', 'Tollgate Village'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Independence High School?',
        a: "Independence draws from Westhaven, The Highlands at Ladd Park, Berry Farms, and most of Tollgate Village in Thompson&apos;s Station, among others. Zoning lines run inside some larger communities — confirm with Williamson County Schools for the exact address.",
      },
      {
        q: 'How much do Independence-zoned homes cost?',
        a: "Pricing varies widely by subdivision. Westhaven runs $650K to $2.5M+, Berry Farms $550K to $1.8M, Tollgate Village $500K to $1M. Joshua can pull exact recent comps for any street within the zone.",
      },
      {
        q: 'Is the Independence zone a good investment for families?',
        a: 'Historically yes. Williamson County Schools are a major resale driver, and Independence is consistently one of the top-rated public high schools in Tennessee. Combined with strong master-planned communities like Westhaven, the zone has demonstrated reliable demand through multiple market cycles.',
      },
    ],
  },

  'nolensville-high-school-nolensville-tn': {
    slug: 'nolensville-high-school-nolensville-tn',
    name: 'Nolensville High School',
    level: 'High',
    district: 'Williamson County Schools',
    suburbSlug: 'nolensville-tn',
    ratingNote: 'A newer Williamson County high school with strong community engagement and rising academic performance.',
    blurb:
      "Nolensville High School opened to consolidate Nolensville's rapidly growing student population and quickly became a defining piece of the Nolensville identity. The school draws from the entire Nolensville footprint plus parts of southeast Brentwood and central southern Williamson County — Bent Creek, Burberry Glen, Scales Farmstead, and Benington all feed in. Strong academics, growing AP programs, and a tight community atmosphere make the Nolensville zone increasingly competitive for relocating families.",
    neighborhoods: ['Bent Creek', 'Burberry Glen', 'Scales Farmstead', 'Benington'],
    faqs: [
      {
        q: 'What subdivisions feed Nolensville High School?',
        a: 'Most of Nolensville including Bent Creek, Burberry Glen, Scales Farmstead, Benington, and Winterset Woods, plus selected southeast Brentwood addresses. Zoning is confirmed at the district level — Joshua verifies for every home before tour.',
      },
      {
        q: 'How does Nolensville High compare to other Williamson County high schools?',
        a: 'Nolensville is newer than Brentwood, Ravenwood, or Page but is in the same district and has rapidly built academic and athletic credibility. The school is a major reason Nolensville has emerged as one of the fastest-growing family destinations in Middle Tennessee.',
      },
      {
        q: 'How much do homes in the Nolensville High zone cost?',
        a: 'Most Nolensville-zoned homes trade between $580K and $1.1M, with newer construction in Burberry Glen and custom builds running higher. Joshua can pull exact comps for any street.',
      },
    ],
  },

  'centennial-high-school-franklin-tn': {
    slug: 'centennial-high-school-franklin-tn',
    name: 'Centennial High School',
    level: 'High',
    district: 'Williamson County Schools',
    suburbSlug: 'franklin-tn',
    ratingNote: 'A long-established Williamson County public high school with strong academic and athletic programs.',
    blurb:
      'Centennial High School serves much of central and southwest Franklin including the established Fieldstone Farms and Cool Springs corridor neighborhoods. A long-standing pillar of the Franklin community, Centennial offers strong AP programs, established athletics, and steady college placement. Buyers targeting the Centennial zone often prioritize the combination of mature trees, established subdivisions, and downtown-Franklin proximity that the feeder area provides.',
    neighborhoods: ['Fieldstone Farms', 'Cool Springs corridor', 'Sullivan Farms', 'Downtown-adjacent Franklin'],
    faqs: [
      {
        q: 'What Franklin neighborhoods feed Centennial High?',
        a: 'Central and southwest Franklin including Fieldstone Farms, Sullivan Farms, much of the Cool Springs corridor, and various downtown-adjacent subdivisions. Zoning lines exist inside some larger areas — always confirm with Williamson County Schools.',
      },
      {
        q: 'How does Centennial compare to Franklin High School?',
        a: 'Both are well-regarded Williamson County public high schools, just serving different parts of the city. Franklin High generally draws from north and west; Centennial from central and southwest. The schools are comparable academically — the choice usually comes down to which subdivision you fall in love with.',
      },
      {
        q: 'What are typical home prices in the Centennial zone?',
        a: 'Most Centennial-zoned homes trade between $700K and $1.5M, with Fieldstone Farms anchoring the more accessible end and downtown-adjacent custom homes pushing higher. Joshua can pull street-level comps.',
      },
    ],
  },

  'pearre-creek-elementary-franklin-tn': {
    slug: 'pearre-creek-elementary-franklin-tn',
    name: 'Pearre Creek Elementary',
    level: 'Elementary',
    district: 'Williamson County Schools',
    suburbSlug: 'franklin-tn',
    ratingNote: 'A well-regarded Williamson County elementary serving west Franklin families.',
    blurb:
      'Pearre Creek Elementary serves a fast-growing slice of west Franklin and is one of the elementary schools most associated with the Westhaven master-planned community and the surrounding McEwen Drive corridor. Williamson County Schools is consistently among the highest-performing districts in Tennessee, and at the elementary level families search hard by zone — a strong, convenient elementary is often the first filter for relocating parents. Pearre Creek-area homes draw demand for exactly that reason.',
    neighborhoods: ['Westhaven', 'Sullivan Farms', 'West Franklin / McEwen corridor'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Pearre Creek Elementary?',
        a: 'Pearre Creek commonly serves Westhaven, Sullivan Farms, and surrounding west Franklin subdivisions along the McEwen corridor. Elementary zones in Williamson County can change as new schools open, so always confirm the current assignment with Williamson County Schools for the exact address before writing an offer.',
      },
      {
        q: 'How much do homes near Pearre Creek Elementary cost?',
        a: 'Most homes in the west Franklin area Pearre Creek serves trade from the mid-$600s into the $2M+ range, with Westhaven spanning that full band. Joshua can pull recent closed comps for any specific street or subdivision.',
      },
      {
        q: 'Does the elementary zone really affect resale value?',
        a: 'In Williamson County, yes. Buyers with young children filter aggressively by elementary zone, and a desirable, convenient elementary supports demand and resale even years before a family has school-age kids. Joshua factors school zoning into every west Franklin search.',
      },
    ],
  },

  'crockett-elementary-brentwood-tn': {
    slug: 'crockett-elementary-brentwood-tn',
    name: 'Crockett Elementary',
    level: 'Elementary',
    district: 'Williamson County Schools',
    suburbSlug: 'brentwood-tn',
    ratingNote: 'A sought-after Williamson County elementary in the Brentwood area.',
    blurb:
      'Crockett Elementary is one of the elementary schools tied to southern Brentwood and the Ravenwood High feeder pattern, including the Governors Club area. For families targeting Brentwood specifically for schools, the elementary assignment is the starting point — and Crockett-zoned neighborhoods see steady demand from buyers who want the full Williamson County K-12 path in one of the most affluent zip codes in the region.',
    neighborhoods: ['Governors Club', 'Taramore', 'Southern Brentwood subdivisions'],
    faqs: [
      {
        q: 'What neighborhoods feed Crockett Elementary?',
        a: 'Crockett commonly serves portions of southern Brentwood including the Governors Club area and surrounding subdivisions on the Ravenwood feeder path. Zoning lines run inside some larger areas and can change, so confirm the current assignment with Williamson County Schools for any specific address.',
      },
      {
        q: 'How do Crockett-zoned home prices compare?',
        a: 'Homes in the southern Brentwood area Crockett serves generally trade from the $900s into the multi-millions, with Governors Club estates at the top of the range. Joshua can pull exact comps for any street.',
      },
      {
        q: 'Why do families target a specific elementary zone in Brentwood?',
        a: 'Because the elementary assignment sets the tone for the entire K-12 path and drives resale. Brentwood buyers routinely shortlist homes by elementary and high-school zone together — Joshua confirms both before every tour.',
      },
    ],
  },

  'woodland-middle-school-brentwood-tn': {
    slug: 'woodland-middle-school-brentwood-tn',
    name: 'Woodland Middle School',
    level: 'Middle',
    district: 'Williamson County Schools',
    suburbSlug: 'brentwood-tn',
    ratingNote: 'A strong Williamson County middle school on the Brentwood / Ravenwood feeder path.',
    blurb:
      'Woodland Middle School is a key part of the southern Brentwood feeder pattern that leads to Ravenwood High School, one of the top-rated public high schools in Tennessee. Families relocating to Brentwood for schools think in terms of the full feeder chain — elementary to middle to high — and Woodland is the middle-school link for several of the most demanded south-Brentwood subdivisions, including the Governors Club area.',
    neighborhoods: ['Governors Club', 'Annandale', 'Taramore', 'Raintree Forest'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Woodland Middle School?',
        a: 'Woodland commonly serves much of southern Brentwood on the Ravenwood feeder path, including the Governors Club area, Annandale, Taramore, and Raintree Forest among others. Confirm the current assignment with Williamson County Schools for the exact address — zoning can change.',
      },
      {
        q: 'Does Woodland feed into Ravenwood High School?',
        a: 'For much of its zone, yes — Woodland Middle sits on the southern Brentwood feeder path that leads to Ravenwood High, which is part of why these neighborhoods stay in such high demand. Always verify the specific feeder assignment for a given address before you buy.',
      },
      {
        q: 'What do homes in the Woodland Middle zone cost?',
        a: 'Most homes in the southern Brentwood area Woodland serves trade between roughly $1.2M and $4M+, with Governors Club estates higher. Joshua can pull recent comps for any specific subdivision.',
      },
    ],
  },

  'sunset-middle-school-brentwood-tn': {
    slug: 'sunset-middle-school-brentwood-tn',
    name: 'Sunset Middle School',
    level: 'Middle',
    district: 'Williamson County Schools',
    suburbSlug: 'brentwood-tn',
    ratingNote: 'A well-regarded Williamson County middle school serving central Brentwood.',
    blurb:
      'Sunset Middle School serves a large, central-Brentwood population and is one of the busiest middle schools in Williamson County. For families weighing the central Brentwood vs southern Brentwood decision, the Sunset feeder path is a frequent shortlist — established neighborhoods, convenient location, and the consistent academic reputation that makes Williamson County Schools a relocation magnet.',
    neighborhoods: ['Brentwood Hills', 'Central Brentwood subdivisions', 'Concord area'],
    faqs: [
      {
        q: 'What neighborhoods feed Sunset Middle School?',
        a: 'Sunset commonly serves central Brentwood including Brentwood Hills, the Concord area, and surrounding established subdivisions. Zoning lines exist within some larger areas and can change — confirm the current assignment with Williamson County Schools for any specific address.',
      },
      {
        q: 'How does the Sunset zone compare to the southern Brentwood zones?',
        a: 'Sunset draws from more central, established Brentwood neighborhoods, while the southern Brentwood schools (like Woodland) draw from newer subdivisions including Governors Club. Both are excellent — the choice usually comes down to which neighborhood and price point fit. Joshua can tour both feeder areas.',
      },
      {
        q: 'What are home prices like in the Sunset Middle zone?',
        a: 'Most homes in the central Brentwood area Sunset serves trade between roughly $900K and $3M, depending on neighborhood and lot. Joshua can pull street-level comps.',
      },
    ],
  },

  'mill-creek-elementary-nolensville-tn': {
    slug: 'mill-creek-elementary-nolensville-tn',
    name: 'Mill Creek Elementary',
    level: 'Elementary',
    district: 'Williamson County Schools',
    suburbSlug: 'nolensville-tn',
    ratingNote: 'A growing Williamson County elementary serving the Nolensville area.',
    blurb:
      'Mill Creek Elementary serves the rapidly growing Nolensville area, part of the Nolensville High feeder pattern that has helped make the town one of the fastest-growing family destinations in Middle Tennessee. Williamson County Schools is the draw, and at the elementary level Nolensville families search tightly by zone — newer subdivisions with a convenient, well-regarded elementary see strong, sustained demand.',
    neighborhoods: ['Bent Creek', 'Burberry Glen', 'Scales Farmstead', 'Benington'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Mill Creek Elementary?',
        a: 'Mill Creek commonly serves Nolensville subdivisions including Bent Creek, Burberry Glen, Scales Farmstead, and Benington among others. Nolensville is growing quickly and elementary zones can shift as new schools open, so always confirm with Williamson County Schools for the exact address.',
      },
      {
        q: 'How much do homes near Mill Creek Elementary cost?',
        a: 'Most Nolensville homes in the Mill Creek area trade between roughly $580K and $1.1M, with newer construction and custom builds higher. Joshua can pull recent closed comps for any specific subdivision.',
      },
      {
        q: 'Is the Nolensville area a good long-term family bet?',
        a: 'Many families think so. Williamson County school zoning drives resale demand, and Nolensville has emerged as one of the most popular family destinations in the region. As always, confirm the specific feeder assignment for an address before you buy.',
      },
    ],
  },

  'blackman-high-school-murfreesboro-tn': {
    slug: 'blackman-high-school-murfreesboro-tn',
    name: 'Blackman High School',
    level: 'High',
    district: 'Rutherford County Schools',
    suburbSlug: 'murfreesboro-tn',
    ratingNote: 'A top-tier Rutherford County public high school with a 4-star SchoolDigger rating and an A rating on Niche.',
    blurb:
      'Blackman High School anchors the fast-growing Blackman area on the northwest side of Murfreesboro, one of the most in-demand school zones in Rutherford County. The school consistently ranks near the top of Rutherford County Schools on independent ratings sites, and its cluster (Blackman Elementary and Blackman Middle feed into it) gives families a full K-12 path in one zone. For buyers who want Williamson County-caliber schools without the Williamson County price tag, Blackman is one of the strongest arguments for choosing Murfreesboro.',
    neighborhoods: ['Berkshire', 'Shelton Square', 'Blackman Oaks', 'Puckett Station', 'Royal Glen'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Blackman High School?',
        a: 'The Blackman area on the northwest side of Murfreesboro includes established subdivisions like Berkshire, Shelton Square, Blackman Oaks, Puckett Station, and Royal Glen, most built in the 2000s and 2010s. Rutherford County sets attendance zones by address, not by subdivision or city boundary, so always confirm the current zone assignment with Rutherford County Schools before writing an offer.',
      },
      {
        q: 'Is Blackman High School a good school?',
        a: 'Yes. Blackman has held a 4-star rating from SchoolDigger for most of the past decade and carries an A rating and an 8/10 GreatSchools score on Niche, ranking near the top of Rutherford County Schools. It is one of the main reasons families choose the Blackman area over other parts of Murfreesboro.',
      },
      {
        q: 'How much do homes cost in the Blackman school zone?',
        a: "Pricing in the Blackman area generally tracks Murfreesboro's citywide market rather than commanding a large standalone premium — see the current Murfreesboro market report for up-to-date medians. Joshua can pull recent closed comps for any specific street in Berkshire, Shelton Square, Blackman Oaks, Puckett Station, or Royal Glen.",
      },
      {
        q: 'Why do buyers choose Murfreesboro over Williamson County for schools?',
        a: "Rutherford County Schools — and Blackman specifically — deliver strong, well-rated public education at a meaningfully lower price point than Franklin or Brentwood. For families prioritizing value alongside a solid school, the Blackman zone is one of the most frequently shortlisted areas in Middle Tennessee.",
      },
    ],
  },

  'spring-station-middle-school-thompsons-station-tn': {
    slug: 'spring-station-middle-school-thompsons-station-tn',
    name: 'Spring Station Middle School',
    level: 'Middle',
    district: 'Williamson County Schools',
    suburbSlug: 'thompsons-station-tn',
    ratingNote: 'A well-regarded Williamson County middle school serving the Thompson’s Station and Spring Hill area.',
    blurb:
      'Spring Station Middle School serves the Thompson’s Station and Williamson-County side of the Spring Hill area, a stretch that has seen heavy family-driven growth. For buyers chasing Williamson County Schools at a more accessible price point than Franklin or Brentwood, the Spring Station feeder path is a frequent target — newer master-planned communities, room to grow, and the WCS academic reputation that anchors resale.',
    neighborhoods: ['Tollgate Village', 'Bridgemore Village', "Thompson's Station subdivisions"],
    faqs: [
      {
        q: 'What neighborhoods feed Spring Station Middle School?',
        a: 'Spring Station commonly serves Thompson&apos;s Station and the Williamson-County side of the Spring Hill area, including communities like Tollgate Village and Bridgemore Village. Zoning can change with growth, so confirm the current assignment with Williamson County Schools for any specific address.',
      },
      {
        q: 'Why do buyers target the Spring Station zone?',
        a: 'It offers the Williamson County Schools path at a more accessible entry point than Franklin or Brentwood, with newer master-planned communities and more space. For value-focused families set on WCS, it is one of the most popular trade-offs in the county.',
      },
      {
        q: 'What do homes in the Spring Station Middle zone cost?',
        a: 'Most homes in the Thompson&apos;s Station area Spring Station serves trade between roughly $420K and $1M, depending on community and lot. Joshua can pull recent comps for any specific subdivision.',
      },
    ],
  },

  'summit-high-school-spring-hill-tn': {
    slug: 'summit-high-school-spring-hill-tn',
    name: 'Summit High School',
    level: 'High',
    district: 'Williamson County Schools',
    suburbSlug: 'spring-hill-tn',
    ratingNote: 'A top-tier Williamson County Schools high school serving the fast-growing Williamson-County side of Spring Hill.',
    blurb:
      'Summit High School serves the Williamson County side of Spring Hill, one of the fastest-growing cities in Tennessee. It carries the same Williamson County Schools reputation that draws families to Franklin and Brentwood, but at Spring Hill\'s more accessible price point — which is why the Summit zone is a frequent shortlist item for value-focused relocating families who still want WCS on the school report. Buyers should note Spring Hill straddles the Williamson/Maury County line, so confirming the exact zone for a specific address matters more here than almost anywhere else Joshua works.',
    neighborhoods: ['Autumn Ridge', 'Campbell Station', 'Cherry Grove', 'Copper Ridge'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Summit High School?',
        a: 'Summit draws from the Williamson County side of Spring Hill, including communities like Autumn Ridge, Campbell Station, Cherry Grove, and Copper Ridge. Spring Hill straddles the Williamson/Maury County line, so always confirm the current zone assignment with Williamson County Schools for any specific address before writing an offer.',
      },
      {
        q: 'How much do homes in the Summit High zone cost?',
        a: 'Summit-zoned homes are part of the broader Spring Hill market — see the current Spring Hill market report for up-to-date medians and price-per-square-foot. Joshua can pull exact, current comps for any specific street.',
      },
      {
        q: 'Does being zoned to Summit High School affect resale value?',
        a: 'Yes. Williamson County school zoning is one of the most consistently quoted reasons buyers pay a premium in Spring Hill over comparable homes on the Maury County side. Confirming a Williamson County assignment — Summit or otherwise — before you buy is one of the highest-leverage checks Joshua runs for clients targeting Spring Hill.',
      },
    ],
  },

  'mount-juliet-high-school-mount-juliet-tn': {
    slug: 'mount-juliet-high-school-mount-juliet-tn',
    name: 'Mount Juliet High School',
    level: 'High',
    district: 'Wilson County Schools',
    suburbSlug: 'mount-juliet-tn',
    ratingNote: 'One of Wilson County Schools’ two comprehensive high schools, serving the fast-growing core of Mount Juliet east of Nashville.',
    blurb:
      'Mount Juliet High School serves the core of Mount Juliet, a Wilson County city that has become one of the busiest relocation destinations east of Nashville thanks to its direct I-40 commute, newer master-planned communities, and lower price point than Williamson County. The Mount Juliet zone covers a mix of established neighborhoods and large newer developments, including the Providence corridor that has grown into its own shopping and dining hub. As with any fast-growing county, Wilson County periodically adjusts attendance lines as new schools come online, so confirming the current zone for a specific address is a necessary step before writing an offer.',
    neighborhoods: ['Providence', 'Del Webb Lake Providence', 'Nichols Vale', 'Willoughby Station'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Mount Juliet High School?',
        a: 'The Mount Juliet High School zone draws from communities across the city core, including Providence, Del Webb Lake Providence (a 55+ community), Nichols Vale, and Willoughby Station. Wilson County has added schools as the area has grown, which can shift attendance lines, so always confirm the current zone assignment with Wilson County Schools for any specific address before writing an offer.',
      },
      {
        q: 'How much do homes near Mount Juliet High School cost?',
        a: 'Mount Juliet High School-zoned homes are part of the broader Mount Juliet market — see the current Mount Juliet market report for up-to-date medians and price-per-square-foot. Joshua can pull exact, current comps for any specific street or subdivision.',
      },
      {
        q: 'Why are buyers targeting Mount Juliet over Nashville or Williamson County?',
        a: 'Mount Juliet offers a direct I-40 commute into Nashville, newer inventory, and meaningfully lower price points than Franklin or Brentwood, while still delivering fast-moving demand and strong days-on-market performance. It is one of the most frequently shortlisted trade-offs for buyers who want space and value without giving up an easy commute.',
      },
    ],
  },

  'beech-senior-high-school-hendersonville-tn': {
    slug: 'beech-senior-high-school-hendersonville-tn',
    name: 'Beech Senior High School',
    level: 'High',
    district: 'Sumner County Schools',
    suburbSlug: 'hendersonville-tn',
    ratingNote: 'Ranked 26th of 389 Tennessee public high schools by SchoolDigger, with a 94% graduation rate versus the state’s 90% average.',
    blurb:
      'Beech Senior High School is one of four distinct high school zones inside Hendersonville, and consistently the one families ask for first when newer construction and amenities matter. SchoolDigger places Beech in the top 10% of Tennessee public high schools, and its 94% graduation rate outpaces the state average. The zone overlaps some of Hendersonville’s most active newer-build corridors, including Durham Farms, alongside established Old Hickory Lake-area neighborhoods like Indian Lake and Walton Ferry.',
    neighborhoods: ['Durham Farms', 'Indian Lake', 'Walton Ferry', 'Sanders Ferry'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Beech Senior High School?',
        a: 'The Beech zone covers a large slice of Hendersonville, including the newer-construction Durham Farms community and established areas around Indian Lake, Walton Ferry, and Sanders Ferry. Hendersonville has four separate high school zones inside one city boundary, so always confirm the current assignment with Sumner County Schools for the exact address before writing an offer.',
      },
      {
        q: 'Is Beech Senior High School a good school?',
        a: 'Yes. SchoolDigger ranks Beech 26th out of 389 Tennessee public high schools, and it carries a 94% graduation rate compared to the state’s 90% average, with a B+ rating on Niche. It’s one of the strongest-performing options in Sumner County Schools.',
      },
      {
        q: 'How much do homes near Beech Senior High School cost?',
        a: 'Beech-zoned homes are part of the broader Hendersonville market — see the current Hendersonville market report for up-to-date medians and price-per-square-foot. Joshua can pull exact, current comps for any specific street in Durham Farms, Indian Lake, or the surrounding Beech zone.',
      },
      {
        q: 'Why do families choose the Beech zone over other Hendersonville school zones?',
        a: 'Hendersonville splits into four high school zones, and Beech (along with Station Camp) tends to draw families prioritizing newer construction and updated amenities over the more established, central parts of the city. The right zone depends on whether you’re optimizing for new-build inventory or established, mature neighborhoods — Joshua walks through that trade-off before you tour.',
      },
    ],
  },

  'station-camp-high-school-gallatin-tn': {
    slug: 'station-camp-high-school-gallatin-tn',
    name: 'Station Camp High School',
    level: 'High',
    district: 'Sumner County Schools',
    suburbSlug: 'gallatin-tn',
    ratingNote: 'Ranked 30th of 389 Tennessee public high schools by SchoolDigger (5-star rating, 3rd among Sumner County high schools), with a 95.9% four-year graduation rate and a Niche A- grade.',
    blurb:
      'Station Camp High School sits off Long Hollow Pike in Gallatin and is consistently the first school families ask about when comparing Sumner County zones. SchoolDigger ranks it 30th out of 389 Tennessee public high schools and 3rd among Sumner County’s nine ranked high schools, while Niche grades it an A- and puts it at #2 countywide. Its 95.9% four-year graduation rate outpaces both the Sumner County and Tennessee state averages. The zone runs through the heart of Gallatin’s 37066 ZIP and reaches into the eastern edge of Hendersonville’s 37075 — the same overlap referenced on the Beech Senior High School zone page, since the two schools split Sumner County’s fastest-growing corridor.',
    neighborhoods: ['Station Camp', 'Sanders Ferry', 'Lakeside'],
    faqs: [
      {
        q: 'What neighborhoods are zoned to Station Camp High School?',
        a: 'The Station Camp zone covers the Station Camp, Sanders Ferry, and Lakeside areas of Gallatin, and extends into a slice of eastern Hendersonville near Drakes Creek. Sumner County has adjusted attendance lines in this corridor as it has grown, so always confirm the current zone assignment with Sumner County Schools for a specific address before writing an offer.',
      },
      {
        q: 'Is Station Camp High School a good school?',
        a: 'Yes. SchoolDigger ranks Station Camp 30th out of 389 Tennessee public high schools with a 5-star rating — 3rd among Sumner County’s high schools — and Niche grades it an A-, ranking it #2 in the county. Its four-year graduation rate of 95.9% is well above both the county and state averages.',
      },
      {
        q: 'How much do homes near Station Camp High School cost?',
        a: 'Station Camp-zoned homes are part of the broader Gallatin market — see the current Gallatin market report for up-to-date medians and price-per-square-foot, including the Old Hickory Lake waterfront premium in nearby Station Camp and Sanders Ferry. Joshua can pull exact, current comps for any specific street.',
      },
      {
        q: 'How does Station Camp compare to Beech Senior High School in Hendersonville?',
        a: 'Both are strong Sumner County Schools options with overlapping catchment near the Gallatin/Hendersonville line — Station Camp ranks 3rd and Beech 26th-to-30th-range among the county’s high schools depending on the year, and both carry graduation rates well above the state average. The right one usually comes down to which side of that boundary a specific address falls on, plus whether new-construction inventory (more common near Station Camp) or established neighborhoods (more common near Beech) matter more to you.',
      },
    ],
  },
}

export function getSchool(slug: string): School | undefined {
  return schools[slug]
}

export function getAllSchoolSlugs(): string[] {
  return Object.keys(schools)
}

export function getSchoolSuburb(s: School): Suburb | undefined {
  return getSuburb(s.suburbSlug)
}
