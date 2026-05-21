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
