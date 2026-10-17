import type { Metadata } from 'next'
import Link from 'next/link'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import TrackedTelLink from '@/components/TrackedTelLink'
import { reviewStats } from '@/lib/reviews'
import {
  FRANKLIN_FAMILY_GUIDE_PATH,
  FRANKLIN_FAMILY_GUIDE_VERIFIED,
  franklinAreas,
  franklinCityParkNames,
  franklinCommuteSentence,
  franklinFamilyFaqs,
  franklinFamilyLead,
  franklinFamilySources,
  franklinPopulationSentence,
  franklinPriceSentence,
  fssdSchools,
} from '@/lib/franklin-family-guide'

const SITE = 'https://www.joshuafink.com'
const PAGE_URL = `${SITE}${FRANKLIN_FAMILY_GUIDE_PATH}`
const TITLE = 'Franklin, TN Neighborhoods for Families (2026)'
const DESCRIPTION =
  'Compare Franklin, TN neighborhoods for families: Westhaven, McKay’s Mill, Fieldstone Farms, Berry Farms, the Highlands, and Cool Springs. Williamson County Schools and Franklin Special District, city parks, commute, and the Redfin citywide price. Compass agent Joshua Fink.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: 'Joshua Fink | Compass Real Estate',
    type: 'article',
  },
}

const relatedReading = [
  { href: '/buy/franklin-tn', label: 'Buy in Franklin' },
  { href: '/market/franklin-tn', label: 'Franklin market report' },
  { href: '/sell/franklin-tn', label: 'Sell in Franklin' },
  { href: '/neighborhoods', label: 'All neighborhood guides' },
  { href: '/homes-near', label: 'Homes by school' },
  { href: '/compare/franklin-tn-vs-brentwood-tn', label: 'Franklin vs Brentwood' },
  { href: '/compare/franklin-tn-vs-spring-hill-tn', label: 'Franklin vs Spring Hill' },
  { href: '/blog/living-in-franklin-tn-guide', label: 'Living in Franklin' },
  { href: '/blog/moving-to-franklin-tn', label: 'Moving to Franklin' },
  { href: '/moving-to-middle-tennessee', label: 'Moving to Middle Tennessee' },
]

export default function FranklinFamilyNeighborhoodGuidePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: franklinFamilyFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: TITLE,
    url: PAGE_URL,
    description: DESCRIPTION,
    datePublished: FRANKLIN_FAMILY_GUIDE_VERIFIED,
    dateModified: FRANKLIN_FAMILY_GUIDE_VERIFIED,
    inLanguage: 'en-US',
    author: {
      '@type': 'Person',
      name: 'Joshua Fink',
      url: `${SITE}/about`,
      jobTitle: 'Affiliate Broker',
      worksFor: { '@type': 'Organization', name: 'Compass Real Estate' },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Joshua Fink Group',
      url: SITE,
      logo: { '@type': 'ImageObject', url: `${SITE}/compass-logo-black.png` },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Neighborhoods', item: `${SITE}/neighborhoods` },
      { '@type': 'ListItem', position: 3, name: 'Franklin neighborhoods for families', item: PAGE_URL },
    ],
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Franklin, TN neighborhoods compared for families',
    itemListElement: franklinAreas
      .filter((area) => area.href)
      .map((area, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: area.name,
        url: `${SITE}${area.href}`,
      })),
  }

  const agentSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${SITE}/#agent`,
    name: 'Joshua Fink',
    url: `${SITE}/about`,
    telephone: '+16155512727',
    email: 'joshua@joshuafink.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8119 Isabella Lane, Suite 105',
      addressLocality: 'Brentwood',
      addressRegion: 'TN',
      postalCode: '37027',
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: 'Franklin',
      addressRegion: 'TN',
      addressCountry: 'US',
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=100064076493905',
      'https://www.instagram.com/joshuafinkgroup',
      'https://www.linkedin.com/in/joshuafinkgroup/',
      'https://x.com/JoshuaFinkGroup',
      'https://www.youtube.com/channel/UCc6j1NWgJeb00pT5xsenz3g',
      'https://www.compass.com/agents/joshua-fink/',
      'https://www.zillow.com/profile/JoshuaFinkGroup',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.rating.toFixed(1),
      reviewCount: reviewStats.total,
      bestRating: '5',
      worstRating: '1',
    },
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Joshua Fink Group — Compass Real Estate',
    url: PAGE_URL,
    telephone: '+16155512727',
    email: 'joshua@joshuafink.com',
    parentOrganization: { '@id': `${SITE}/#agent` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8119 Isabella Lane, Suite 105',
      addressLocality: 'Brentwood',
      addressRegion: 'TN',
      postalCode: '37027',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 36.0234,
      longitude: -86.7838,
    },
    areaServed: {
      '@type': 'City',
      name: 'Franklin',
      addressRegion: 'TN',
      addressCountry: 'US',
    },
    priceRange: '$$$',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <div className="bg-white">
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-2 text-xs tracking-widest uppercase font-semibold" style={{ color: '#A0A0A0' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li aria-hidden="true">·</li>
                <li><Link href="/neighborhoods" className="hover:text-white transition-colors">Neighborhoods</Link></li>
                <li aria-hidden="true">·</li>
                <li>Franklin</li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              Franklin, TN · Family neighborhood guide · Checked {FRANKLIN_FAMILY_GUIDE_VERIFIED}
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Franklin, TN neighborhoods{' '}
              <span style={{ color: '#C41E3A' }}>for families</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed text-white">
              {franklinFamilyLead}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#neighborhoods"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Compare the neighborhoods
              </a>
              <Link
                href="/buy/franklin-tn"
                className="inline-block border text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                style={{ borderColor: '#FFFFFF' }}
              >
                Buy in Franklin
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            How to use this page
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Pick the area, then open its guide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
              <h3 className="text-base font-black text-black mb-3">This page</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Which named Franklin area fits the school district, the housing type, the city parks, and the drive. Citywide price only, with the source and date on every figure.
              </p>
            </div>
            <div className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
              <h3 className="text-base font-black text-black mb-3">Subdivision guides</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                One community at a time: housing, HOA, and the school names buyers usually hear. Those pages are the detail. This page links to them.
              </p>
            </div>
            <div className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
              <h3 className="text-base font-black text-black mb-3">Buyer and city pages</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                <Link href="/buy/franklin-tn" className="font-semibold text-black underline">Buy in Franklin</Link>{' '}
                is the search and offer page.{' '}
                <Link href="/blog/living-in-franklin-tn-guide" className="font-semibold text-black underline">Living in Franklin</Link>{' '}
                and{' '}
                <Link href="/blog/moving-to-franklin-tn" className="font-semibold text-black underline">Moving to Franklin</Link>{' '}
                cover the city, not this comparison.
              </p>
            </div>
          </div>
        </div>

        <div id="neighborhoods" className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Named areas
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-3">
              Franklin neighborhoods to compare
            </h2>
            <p className="text-sm text-[#6B6B6B] max-w-3xl mb-10 leading-relaxed">
              Six of these already have a guide. Downtown does not. Price ranges that are not tied to a cited median are left on the subdivision pages, where Joshua can replace them with comps for the street you are touring.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {franklinAreas.map((area) => (
                <article key={area.name} className="bg-white border border-[#E8E8E8] p-6 sm:p-8">
                  <h3 className="text-2xl font-black text-black tracking-tight mb-2">
                    {area.href ? (
                      <Link href={area.href} className="hover:underline">{area.name}</Link>
                    ) : (
                      area.name
                    )}
                  </h3>
                  <p className="text-sm text-[#444] leading-relaxed mb-3">{area.place}</p>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed mb-4">{area.housing}</p>
                  <p className="text-sm text-[#444] leading-relaxed mb-4">
                    <span className="font-semibold text-black">Schools to verify. </span>
                    {area.schoolCheck}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {area.href && (
                      <Link
                        href={area.href}
                        className="text-sm font-bold px-4 py-2 bg-black text-white hover:bg-[#222] transition-colors"
                      >
                        {area.name} guide
                      </Link>
                    )}
                    {area.also.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-sm font-semibold px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Schools
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-4">
                Two public districts, not one
              </h2>
              <p className="text-sm text-[#444] leading-relaxed mb-4">
                {franklinFamilyFaqs[1].a}
              </p>
              <h3 className="text-base font-black text-black mb-3">Franklin Special District schools</h3>
              <ul className="space-y-2 mb-4">
                {fssdSchools.map((school) => (
                  <li key={school} className="text-sm text-[#444] flex gap-2">
                    <span style={{ color: '#C41E3A' }} aria-hidden="true">→</span>
                    <span>{school}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                District office: 205 Eddy Lane, Franklin, TN 37064. Williamson County Schools: 1320 West Main Street, Franklin, TN 37064. Start with{' '}
                <a href="https://www.fssd.org/faq" className="font-semibold text-black underline">the FSD FAQ</a>
                {' '}and{' '}
                <a href="https://www.wcs.edu/schools" className="font-semibold text-black underline">the WCS schools page</a>
                , then confirm the house.
              </p>
            </section>

            <section>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Price
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-4">
                Citywide price, then the street
              </h2>
              <p className="text-sm text-[#444] leading-relaxed mb-4">{franklinPriceSentence()}</p>
              <p className="text-sm text-[#444] leading-relaxed mb-4">{franklinPopulationSentence()}</p>
              <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
                A Cool Springs condo and a Westhaven custom home are not the same market as that median. The subdivision guides describe each place. Joshua prices the street from closed comps before you tour.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/buy/franklin-tn" className="text-sm font-bold px-4 py-2 bg-black text-white">Franklin buyer page</Link>
                <Link href="/market/franklin-tn" className="text-sm font-semibold px-4 py-2 border border-black text-black">Franklin market report</Link>
              </div>
            </section>
          </div>
        </div>

        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                City parks
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-4">
                City parks, separate from HOA pools
              </h2>
              <p className="text-sm text-[#444] leading-relaxed mb-4">
                The park department snapshot lists 18 city parks and 900 acres of land. City parks are open from dawn until dark. The park-locations page names the parks below. Those two city pages do not list the same count, so nothing is added here to force them to match.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                {franklinCityParkNames.map((park) => (
                  <li key={park} className="text-sm text-[#444]">{park}</li>
                ))}
              </ul>
              <p className="text-sm text-[#444] leading-relaxed">
                Pinkerton Park is 34 acres at 405 Murfreesboro Road, with the Harpeth River on the west side, Fort Granger to the north, and a one-mile paved track. The Park at Harlinsdale Farm is 200 acres, south entrance at 239 Franklin Road, with a 4-acre dog park, a 3-acre pond, and a 5K turf track. Fieldstone Park is a city park. Fieldstone Farms is a subdivision with its own guide.
              </p>
            </section>

            <section>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Commute
              </p>
              <h2 className="text-3xl font-black text-black tracking-tight mb-4">
                The citywide commute, then the address
              </h2>
              <p className="text-sm text-[#444] leading-relaxed mb-4">{franklinCommuteSentence()}</p>
              <ul className="space-y-3 text-sm text-[#444] leading-relaxed">
                <li>Cool Springs is the I-65 employment and retail corridor. The Cool Springs guide is the place to shop that drive.</li>
                <li>Westhaven and Fieldstone Farms sit toward Mack Hatcher and the west side. McEwen Drive is the Westhaven edge.</li>
                <li>Berry Farms and The Highlands at Ladd Park sit south, toward Goose Creek Bypass.</li>
                <li>McKay’s Mill is on the east side, with the guide describing access toward I-65.</li>
              </ul>
            </section>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Related pages
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Keep going from here
          </h2>
          <ul className="flex flex-wrap gap-3">
            {relatedReading.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block text-sm font-semibold px-4 py-2 border border-[#E8E8E8] text-black hover:border-black transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Questions families ask
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              Franklin neighborhood FAQ
            </h2>
            <div className="space-y-6">
              {franklinFamilyFaqs.map((faq) => (
                <div key={faq.q} className="bg-white p-8 border-l-4" style={{ borderColor: '#0A1628' }}>
                  <h3 className="text-base font-black text-black mb-3">{faq.q}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Sources
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Where the numbers come from
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8">
            Page checked {FRANKLIN_FAMILY_GUIDE_VERIFIED}. A retrieval date is the as-of date when the official page itself does not print one.
          </p>
          <ul className="space-y-6">
            {franklinFamilySources.map((source) => (
              <li key={source.url} className="border-b border-[#E8E8E8] pb-6">
                <a href={source.url} className="text-base font-black text-black underline">
                  {source.name}
                </a>
                <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mt-1 mb-2">
                  As of {source.asOf}
                </p>
                <p className="text-sm text-[#444] leading-relaxed">{source.supports}</p>
              </li>
            ))}
          </ul>
        </div>

        <div id="tour" className="text-white py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20" style={{ backgroundColor: '#0A1628' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Want a Franklin shortlist?</h2>
              <p className="mt-2 text-sm max-w-2xl" style={{ color: '#A0A0A0' }}>
                Tell Joshua the school zone, the drive, and the housing type. He will confirm the address and send the matching streets. Call or text 615-551-2727.
              </p>
            </div>
            <TrackedTelLink
              href="tel:6155512727"
              className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              data-cta="franklin-family-guide-call"
            >
              Call 615-551-2727
            </TrackedTelLink>
          </div>

          <div className="max-w-3xl mx-auto mt-12 bg-white p-8 sm:p-10 text-black">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Ask Joshua about a Franklin neighborhood
            </p>
            <SuburbLeadForm
              successTitle="Message sent"
              successMessage={
                <>
                  Joshua will reply same-day with the school check and the streets that fit. For anything urgent, call{' '}
                  <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="franklin-family-guide-success-call">
                    615-551-2727
                  </TrackedTelLink>.
                </>
              }
              resetLabel="Submit another"
            >
              <input type="hidden" name="lead_type" value="buyer" />
              <input type="hidden" name="source" value="franklin-family-guide" />
              <input type="hidden" name="suburb" value="Franklin, TN" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full name *</label>
                  <input type="text" id="name" name="name" required placeholder="Jane Smith" autoComplete="name"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone *</label>
                  <input type="tel" id="phone" name="phone" required placeholder="615-555-0000" autoComplete="tel"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email *</label>
                <input type="email" id="email" name="email" required placeholder="you@example.com" autoComplete="email"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
              </div>

              <div>
                <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">What should the neighborhood handle? (optional)</label>
                <textarea id="body" name="body" rows={4}
                  placeholder="School zone, commute, town center or traditional subdivision, beds."
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
              </div>

              <button type="submit"
                className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}>
                Send to Joshua
              </button>
            </SuburbLeadForm>
          </div>
        </div>
      </div>
    </>
  )
}
