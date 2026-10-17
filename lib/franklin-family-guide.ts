// Franklin family-neighborhood chooser.
//
// This is the comparison page. It does not repeat a subdivision guide, the
// Franklin buyer page, or the living-in / moving-to blog posts. Every figure
// below is either pulled from lib/suburbs.ts (Redfin city medians, Census
// population already published there) or copied from an official page checked
// on FRANKLIN_FAMILY_GUIDE_VERIFIED. Neighborhood price bands in
// lib/neighborhoods.ts are not cited with an as-of date, so they are not
// repeated here.

import {
  citywideStatsCitation,
  formatStatsDate,
  suburbs,
  yoyMovement,
} from './suburbs.ts'

export const FRANKLIN_FAMILY_GUIDE_PATH = '/neighborhoods/franklin-tn'
export const FRANKLIN_FAMILY_GUIDE_VERIFIED = '2026-10-17'

const SITE = 'https://www.joshuafink.com'
const franklin = suburbs['franklin-tn']

export const FRANKLIN_CENSUS_QUICKFACTS_URL =
  'https://www.census.gov/quickfacts/fact/table/franklincitytennessee/PST045224'

/** Mean travel time to work, Franklin city, ACS 2020–2024, QuickFacts. */
export const FRANKLIN_MEAN_TRAVEL_MINUTES = 23.9

export type GuideLink = { href: string; label: string }

export type FranklinArea = {
  name: string
  /** Dedicated guide. Null when this site has no subdivision page yet. */
  href: string | null
  place: string
  housing: string
  schoolCheck: string
  also: GuideLink[]
}

export type CitedSource = {
  name: string
  supports: string
  asOf: string
  url: string
}

export const franklinFamilySources: CitedSource[] = [
  {
    name: 'Redfin Data Center',
    supports:
      'Franklin city median sale price, median days on market, median price per square foot, and sale-price year-over-year change. Rolling three months ending August 31, 2026. Public city file last updated September 3, 2026.',
    asOf: formatStatsDate('2026-10-05'),
    url: 'https://www.redfin.com/news/data-center/downloads/',
  },
  {
    name: 'U.S. Census Bureau QuickFacts — Franklin city, Tennessee',
    supports:
      'April 1, 2020 Census count of 83,454. July 1, 2025 population estimate of 90,226, which is 8.0% above the April 1, 2020 estimates base (Population Estimates, Vintage 2025). Mean travel time to work of 23.9 minutes for workers age 16 and older (American Community Survey 2020–2024 5-year estimates).',
    asOf: 'October 17, 2026',
    url: FRANKLIN_CENSUS_QUICKFACTS_URL,
  },
  {
    name: 'Franklin Special District — homepage',
    supports:
      '3,130 students enrolled. Eight schools serving pre-kindergarten through 8th grade. District statement that FSD ranks in the top 10% of Tennessee districts on TCAP achievement.',
    asOf: 'October 17, 2026',
    url: 'https://www.fssd.org/',
  },
  {
    name: 'Franklin Special District — FAQ',
    supports:
      'Public district established in 1906. 1949 legislative act made it the first special school district in Tennessee. Serves residents of the city’s Ninth Special District. After 8th grade, students enter Williamson County Schools high schools, most often Franklin High School or Centennial High School. Out-of-district tuition is $2,000 a year per student for Williamson County residents and $4,000 a year per student from outside the county.',
    asOf: 'October 17, 2026',
    url: 'https://www.fssd.org/faq',
  },
  {
    name: 'Franklin Special District — New to FSD',
    supports:
      'The eight schools and grade spans: Franklin, Johnson, Liberty, Moore, and Poplar Grove elementaries (pre-K–4); Poplar Grove Middle (5–8); Freedom Intermediate (5–6); Freedom Middle (7–8).',
    asOf: 'October 17, 2026',
    url: 'https://www.fssd.org/new-to-fsd',
  },
  {
    name: 'Williamson County Schools — Schools',
    supports:
      'About 42,000 students in pre-K through 12 for the 2025–2026 school year. 52 schools: 11 high schools, 11 middle schools, 29 elementary schools, and one K–8 school. Class of 2025 ACT composite of 25.3, compared with a state average composite of 19.3.',
    asOf: 'October 17, 2026',
    url: 'https://www.wcs.edu/schools',
  },
  {
    name: 'Williamson County Schools — High schools',
    supports:
      'Centennial High School, 5050 Mallory Lane, Franklin, TN 37067. Franklin High School, 810 Hillsboro Road, Franklin, TN 37064. Page High School, 6281 Arno Road, Franklin, TN 37064. Independence High School, 1776 Declaration Way, Thompson’s Station, TN 37179.',
    asOf: 'October 17, 2026',
    url: 'https://www.wcs.edu/schools/high-schools',
  },
  {
    name: 'City of Franklin Parks and Recreation',
    supports:
      'Department snapshot: 18 city parks and 900 acres of land, plus 24 acres of historic parks. City parks are open from dawn until dark.',
    asOf: 'October 17, 2026',
    url: 'https://www.franklintn.gov/government/departments-k-z/parks',
  },
  {
    name: 'City of Franklin — Park locations',
    supports:
      'Named city parks, including Pinkerton Park, Jim Warren Park, The Park at Harlinsdale Farm, Fieldstone Park, Fort Granger, and Winstead Hill Park. The locations page and the 18-park snapshot do not match one-for-one; this guide lists only parks the locations page names.',
    asOf: 'October 17, 2026',
    url: 'https://www.franklintn.gov/government/departments-k-z/parks/park-locations',
  },
  {
    name: 'City of Franklin — Pinkerton Park',
    supports:
      '34 acres at 405 Murfreesboro Road. The Harpeth River is along the west side and Fort Granger is to the north. One-mile paved pedestrian track.',
    asOf: 'October 17, 2026',
    url: 'https://www.franklintn.gov/government/departments-k-z/parks/park-locations/pinkerton-park',
  },
  {
    name: 'City of Franklin — The Park at Harlinsdale Farm',
    supports:
      '200 acres. South entrance at 239 Franklin Road. Passive park with a 4-acre dog park, a 3-acre pond, and a 5K turf track.',
    asOf: 'October 17, 2026',
    url: 'https://www.franklintn.gov/government/departments-k-z/parks/park-locations/the-park-at-harlinsdale-farm',
  },
]

export const franklinCityParkNames = [
  'Aspen Grove Park',
  'Bicentennial Park',
  "Carter's Hill Park",
  'Collins Farm',
  'Del Rio Park',
  'Dry Branch Water Quality Wetlands',
  'Eastern Flank Battlefield Park',
  'Fieldstone Park',
  'Fort Granger',
  'The Park at Harlinsdale Farm',
  'Jim Warren Park',
  'Liberty Park',
  'Pinkerton Park',
  'Thompson Alley Neighborhood Park',
  'Winstead Hill Park',
  'Pearlene M. Bransford Complex (listed as under construction)',
] as const

export const fssdSchools = [
  'Franklin Elementary (pre-K–4)',
  'Johnson Elementary (pre-K–4)',
  'Liberty Elementary (pre-K–4)',
  'Moore Elementary (pre-K–4)',
  'Poplar Grove Elementary (pre-K–4)',
  'Poplar Grove Middle (grades 5–8)',
  'Freedom Intermediate (grades 5–6)',
  'Freedom Middle (grades 7–8)',
] as const

export const franklinAreas: FranklinArea[] = [
  {
    name: 'Westhaven',
    href: '/neighborhoods/westhaven-franklin-tn',
    place: 'West Franklin, along McEwen Drive past Mack Hatcher.',
    housing:
      'Master-planned streets with a town center, alleys, and a mix of single-family homes and townhomes. The Westhaven guide describes it as open to the street, not gated.',
    schoolCheck:
      'The Westhaven guide names Pearre Creek Elementary, Hillsboro Middle, and Independence High as the usual Williamson County assignments. None of those three is on the Franklin Special District’s eight-school list. Independence High’s campus is in Thompson’s Station.',
    also: [
      { href: '/homes-near/pearre-creek-elementary-franklin-tn', label: 'Homes near Pearre Creek Elementary' },
      { href: '/homes-near/independence-high-school-thompsons-station-tn', label: 'Homes near Independence High' },
    ],
  },
  {
    name: "McKay's Mill",
    href: '/neighborhoods/mckays-mill-franklin-tn',
    place: 'East Franklin, with access toward I-65.',
    housing:
      'A large traditional subdivision: conventional residential streets, pool and clubhouse amenities, and no retail center inside the community.',
    schoolCheck:
      'The McKay’s Mill guide names Clovercroft Elementary, Woodland Middle, and Page High as the usual Williamson County assignments. None of those three is on the Franklin Special District list. Page High is at 6281 Arno Road in Franklin.',
    also: [
      { href: '/homes-near/page-high-school-franklin-tn', label: 'Homes near Page High School' },
    ],
  },
  {
    name: 'Fieldstone Farms',
    href: '/neighborhoods/fieldstone-farms-franklin-tn',
    place: 'West side of Franklin, near Mack Hatcher, Liberty Pike, and Hillsboro Road.',
    housing:
      'An established subdivision with larger lots and mature trees than many newer Franklin builds, and a pool and clubhouse rather than a town center.',
    schoolCheck:
      'The Fieldstone Farms guide names Johnson Elementary, Freedom Middle, and Franklin High. Johnson Elementary and Freedom Middle are Franklin Special District schools. Franklin High is a Williamson County high school at 810 Hillsboro Road. Confirm the address with both districts.',
    also: [
      { href: '/homes-near/centennial-high-school-franklin-tn', label: 'Homes near Centennial High' },
    ],
  },
  {
    name: 'Berry Farms',
    href: '/neighborhoods/berry-farms-franklin-tn',
    place: 'South Franklin, off Goose Creek Bypass near I-65.',
    housing:
      'A newer mixed-use community with a town center, plus townhomes, single-family homes, and larger custom lots. Still building.',
    schoolCheck:
      'The Berry Farms guide names Trinity Elementary, Hillsboro Middle, and Independence High as the usual Williamson County assignments. None of those three is on the Franklin Special District list.',
    also: [
      { href: '/homes-near/independence-high-school-thompsons-station-tn', label: 'Homes near Independence High' },
    ],
  },
  {
    name: 'The Highlands at Ladd Park',
    href: '/neighborhoods/highlands-at-ladd-park-franklin-tn',
    place: 'South of downtown Franklin, with access to Goose Creek Bypass and the Cool Springs corridor.',
    housing:
      'Newer residential streets without a town center. The guide describes larger lots than nearby production subdivisions of the same era.',
    schoolCheck:
      'The Highlands guide names Pearre Creek Elementary, Hillsboro Middle, and Independence High as common Williamson County assignments. None of those three is on the Franklin Special District list.',
    also: [
      { href: '/homes-near/pearre-creek-elementary-franklin-tn', label: 'Homes near Pearre Creek Elementary' },
    ],
  },
  {
    name: 'Cool Springs',
    href: '/neighborhoods/cool-springs-franklin-tn',
    place: 'North-central Franklin along I-65, Cool Springs Boulevard, and the Mack Hatcher / Carothers Parkway loop.',
    housing:
      'A corridor, not one HOA. Condos and townhomes sit near the Galleria and office parks. Single-family streets are in the surrounding subdivisions.',
    schoolCheck:
      'The Cool Springs guide treats most of the corridor as Williamson County Schools in the Centennial High area. Elementary and middle schools change by street. Centennial High is at 5050 Mallory Lane in Franklin.',
    also: [
      { href: '/homes-near/centennial-high-school-franklin-tn', label: 'Homes near Centennial High' },
    ],
  },
  {
    name: 'Downtown and historic Franklin',
    href: null,
    place: 'The historic core, including Main Street and the streets around it.',
    housing:
      'Historic houses and newer infill, with little of the subdivision HOA pattern used in Westhaven or Fieldstone Farms. This site does not have a separate downtown subdivision guide.',
    schoolCheck:
      'Franklin Special District describes itself as the public pre-K–8 system for the city’s Ninth Special District in historic Franklin. A downtown address can still fall outside that boundary. Confirm it before you treat FSD as the assignment.',
    also: [
      { href: '/blog/living-in-franklin-tn-guide', label: 'Living in Franklin guide' },
      { href: '/blog/moving-to-franklin-tn', label: 'Moving to Franklin' },
    ],
  },
]

export function franklinPriceSentence(): string {
  const perSqft = franklin.pricePerSqft.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `The citywide median sale price in Franklin is ${franklin.medianPrice}, the median days on market is ${franklin.avgDaysOnMarket}, and the median price per square foot is $${perSqft}, ${yoyMovement(franklin.yoyChange)} year over year (${citywideStatsCitation(franklin)}).`
}

export function franklinPopulationSentence(): string {
  return 'The April 1, 2020 Census counted 83,454 residents. The U.S. Census Bureau estimates 90,226 as of July 1, 2025, which is 8.0% above the April 1, 2020 estimates base (U.S. Census Bureau QuickFacts; Population Estimates, Vintage 2025).'
}

export function franklinCommuteSentence(): string {
  return `Workers age 16 and older who live in Franklin city had a mean travel time to work of ${FRANKLIN_MEAN_TRAVEL_MINUTES} minutes (U.S. Census Bureau QuickFacts; American Community Survey 2020–2024 5-year estimates, checked October 17, 2026). That is the average commute of people who live in the city. It is not a drive time from one neighborhood to downtown Nashville.`
}

export const franklinFamilyLead = `There is no single best Franklin neighborhood. The decision is the school assignment for the exact address, the housing type, and the drive you will actually make. Families usually start with six areas that already have guides on this site: Westhaven, McKay's Mill, Fieldstone Farms, Berry Farms, The Highlands at Ladd Park, and Cool Springs. Historic downtown is a separate search and does not have its own subdivision guide. Public school is not one district. Franklin Special District serves pre-kindergarten through 8th grade inside the city's Ninth Special District, and Williamson County Schools serves many other Franklin addresses plus the high schools. ${franklinPriceSentence()}`

export const franklinFamilyFaqs: { q: string; a: string }[] = [
  {
    q: 'What are the best neighborhoods in Franklin, TN for families?',
    a: `${franklinFamilyLead} Open the comparison at ${SITE}${FRANKLIN_FAMILY_GUIDE_PATH} and the Franklin buyer page at ${SITE}/buy/franklin-tn.`,
  },
  {
    q: 'Do Franklin, TN homes use Williamson County Schools or Franklin Special School District?',
    a: 'Both exist, and they are not the same assignment. Franklin Special District is a public pre-kindergarten through 8th grade system of eight schools for the city\'s Ninth Special District (Franklin Special District FAQ and New to FSD page, retrieved October 17, 2026). Its schools are Franklin, Johnson, Liberty, Moore, and Poplar Grove elementaries, Poplar Grove Middle, Freedom Intermediate, and Freedom Middle. The district homepage lists 3,130 students. After 8th grade, FSD students enter Williamson County Schools high schools, most often Franklin High School or Centennial High School. Williamson County Schools reports about 42,000 students in pre-K through 12 for 2025–2026, across 52 schools, and a class of 2025 ACT composite of 25.3 compared with a state average of 19.3 (wcs.edu/schools, retrieved October 17, 2026). Westhaven, McKay\'s Mill, Berry Farms, The Highlands at Ladd Park, and Cool Springs are described on their guides with Williamson County school names that are not on the FSD list. Fieldstone Farms is the exception on this site: its guide names Johnson Elementary and Freedom Middle, which are FSD schools, and Franklin High, which is a Williamson County high school. Confirm every address with both districts. Zoning changes.',
  },
  {
    q: 'What is the median home price in Franklin, TN?',
    a: `${franklinPriceSentence()} ${franklinPopulationSentence()} This page does not publish a median for Westhaven, McKay's Mill, Fieldstone Farms, Berry Farms, the Highlands, or Cool Springs. The subdivision guides describe each place, and a street-level price comes from closed comps, not from the citywide median. The Franklin buyer page is ${SITE}/buy/franklin-tn and the market page is ${SITE}/market/franklin-tn.`,
  },
  {
    q: 'How long is the commute from Franklin, TN?',
    a: `${franklinCommuteSentence()} The roads that change the day are I-65, the Cool Springs employment corridor, Mack Hatcher and McEwen on the west side, and Goose Creek Bypass on the south side. Joshua checks the drive from the specific house rather than quoting one citywide minute count for downtown Nashville.`,
  },
  {
    q: 'What parks does the City of Franklin operate?',
    a: 'The City of Franklin park department snapshot lists 18 city parks and 900 acres of land, and city parks are open from dawn until dark (franklintn.gov parks page, retrieved October 17, 2026). The park-locations page names Aspen Grove Park, Bicentennial Park, Carter\'s Hill Park, Collins Farm, Del Rio Park, Dry Branch Water Quality Wetlands, Eastern Flank Battlefield Park, Fieldstone Park, Fort Granger, The Park at Harlinsdale Farm, Jim Warren Park, Liberty Park, Pinkerton Park, Thompson Alley Neighborhood Park, Winstead Hill Park, and the Pearlene M. Bransford Complex, which that page lists as under construction. Pinkerton Park is 34 acres at 405 Murfreesboro Road, with the Harpeth River on the west side and a one-mile paved track. The Park at Harlinsdale Farm is 200 acres, with the south entrance at 239 Franklin Road. Fieldstone Park is a city park. Fieldstone Farms is a subdivision. They are not the same listing. Subdivision pools and clubhouses are HOA amenities, not these city parks.',
  },
  {
    q: 'How is this Franklin neighborhood guide different from the other Franklin pages?',
    a: `This page compares named Franklin areas in one place and stops at the school-district, park, commute, and citywide-price facts that have a source. The buyer page at ${SITE}/buy/franklin-tn is how to buy in Franklin and carries the same citywide Redfin figures. Each subdivision guide covers one community's housing, HOA, and the school names buyers usually hear. The living-in Franklin post at ${SITE}/blog/living-in-franklin-tn-guide and the moving-to Franklin post at ${SITE}/blog/moving-to-franklin-tn are city relocation narratives. Use those pages for that detail instead of expecting it to be repeated here.`,
  },
  {
    q: 'Who should I hire to buy in a Franklin, TN neighborhood?',
    a: 'Joshua Fink is a Compass Affiliate Broker at the Compass Brentwood office, 8119 Isabella Lane, Suite 105, Brentwood, TN 37027 (TREC #351484). Licensed since 2008, he sells 40+ homes a year in Middle Tennessee. Call or text 615-551-2727. He confirms the school zone for the exact address before you write, including whether the house sits in Franklin Special District or Williamson County Schools.',
  },
]

export function franklinFamilyGuideText(): string {
  return [
    franklinPriceSentence(),
    franklinPopulationSentence(),
    franklinCommuteSentence(),
    ...franklinAreas.flatMap((area) => [area.name, area.place, area.housing, area.schoolCheck]),
    ...franklinFamilyFaqs.map((faq) => `${faq.q} ${faq.a}`),
    ...franklinFamilySources.map((source) => `${source.name} ${source.supports} ${source.asOf} ${source.url}`),
    ...franklinCityParkNames,
    ...fssdSchools,
  ].join('\n')
}
