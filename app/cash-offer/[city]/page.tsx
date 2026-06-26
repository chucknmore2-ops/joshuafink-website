import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CashOfferForm from '../CashOfferForm'
import TrustBadges from '@/components/TrustBadges'
import ReviewStrip from '@/components/ReviewStrip'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import {
  getCashOfferCity,
  getAllCashOfferCitySlugs,
  getCashOfferCityLinks,
} from '@/lib/cash-offer-cities'
import { getNeighborhoodsByCitySlug } from '@/lib/neighborhoods'
import { linkifyNeighborhoods } from '@/lib/linkify-neighborhoods'

type Props = {
  params: Promise<{ city: string }>
}

export async function generateStaticParams() {
  return getAllCashOfferCitySlugs().map((city) => ({ city }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params
  const city = getCashOfferCity(slug)
  if (!city) return {}

  const url = `https://www.joshuafink.com/cash-offer/${slug}`
  return {
    title: `Sell My House Fast ${city.displayName} | Cash Offer in 24 Hours — Joshua Fink`,
    description: `Sell your ${city.name} house fast for cash — any condition, any situation. Fair cash offer in 24 hours, close in as little as 7 days. No repairs, no commissions, no fees. Serving all of ${city.county}.`,
    keywords: [
      `sell my house fast ${city.name} TN`,
      `we buy houses ${city.name} TN`,
      `cash home buyer ${city.name}`,
      `cash offer for my home ${city.name}`,
      `sell house as-is ${city.name}`,
      `sell my ${city.name} house for cash`,
      `cash for homes ${city.name} TN`,
      'Joshua Fink',
    ],
    alternates: { canonical: url },
    openGraph: {
      title: `We Buy Houses ${city.name}, TN — Cash Offer in 24 Hours`,
      description: `Get a fair cash offer on your ${city.name} home in 24 hours. No repairs, no commissions, no hassle. Close in as little as 7 days.`,
      url,
      siteName: 'Joshua Fink Group',
      type: 'website',
    },
  }
}

const situations = [
  { icon: '🏚️', label: 'Behind on Payments' },
  { icon: '⚖️', label: 'Facing Foreclosure' },
  { icon: '🏠', label: 'Inherited a Property' },
  { icon: '💔', label: 'Going Through Divorce' },
  { icon: '📦', label: 'Need to Move Fast' },
  { icon: '🔧', label: 'Major Repairs Needed' },
  { icon: '👴', label: 'Downsizing' },
  { icon: '💼', label: 'Landlord Done with Tenants' },
]

const steps = [
  { num: '01', title: 'Tell Us About Your Home', body: 'Fill out the short form or call directly. Takes 60 seconds.' },
  { num: '02', title: 'Get Your Cash Offer', body: 'We review your property and call you within 24 hours with a fair, no-obligation cash offer.' },
  { num: '03', title: 'Pick Your Closing Date', body: 'Accept the offer and choose when to close — as fast as 7 days or on your own timeline.' },
  { num: '04', title: 'Get Paid', body: 'We handle all the paperwork. You walk away with cash. No fees, no commissions, no repairs.' },
]

// Evergreen FAQs shown on every city page after the 3 city-specific ones.
const evergreenFaqs = [
  {
    q: 'Will I get full market value for my house?',
    a: 'An investor cash offer is typically 70–85% of after-repair market value. You trade a portion of retail price for speed, certainty, and zero repairs. If you want full market value and can wait 30–90 days, Joshua can also list your home traditionally — ask and he\'ll walk through both paths so you choose what fits.',
  },
  {
    q: 'Are there any fees or commissions?',
    a: 'Zero. No agent commissions, no closing costs, no hidden fees. The cash offer you receive is the amount you walk away with — Joshua covers all closing costs.',
  },
  {
    q: 'What if my house has liens, back taxes, or code violations?',
    a: 'Not a problem. The closing attorney handles title issues, back property taxes, IRS or HOA liens, code violations, and probate complications, coordinating payoffs and clearing title — you just show up and sign.',
  },
  {
    q: 'How is this different from Opendoor or a national iBuyer?',
    a: 'Joshua lives and works in Middle Tennessee, so the offer is based on real local comps, not a national algorithm — and there are no 5–14% service fees. You deal with a licensed Tennessee Affiliate Broker directly, and he buys homes with repairs, occupancy, or liens that iBuyers routinely decline.',
  },
]

export default async function CashOfferCityPage({ params }: Props) {
  const { city: slug } = await params
  const city = getCashOfferCity(slug)
  if (!city) notFound()

  const url = `https://www.joshuafink.com/cash-offer/${slug}`
  const allFaqs = [...city.faqs, ...evergreenFaqs]
  const guides = getNeighborhoodsByCitySlug(slug)
  const otherCities = getCashOfferCityLinks().filter((c) => c.slug !== slug)

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Cash Offer', href: '/cash-offer' },
    { name: city.displayName, href: `/cash-offer/${slug}` },
  ])

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* FAQ Schema (matches visible content) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: allFaqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      {/* Service Schema — city-specific areaServed */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `Cash Home Buying — ${city.displayName}`,
            url,
            mainEntityOfPage: url,
            provider: {
              '@type': 'RealEstateAgent',
              name: 'Joshua Fink Group',
              url: 'https://www.joshuafink.com',
              telephone: '+1-615-551-2727',
            },
            description: `We buy houses for cash in any condition across ${city.displayName} and ${city.county}. Fair offer in 24 hours, close in as little as 7 days. No repairs, no commissions, no fees.`,
            areaServed: {
              '@type': 'City',
              name: city.schemaCity,
              containedInPlace: { '@type': 'State', name: 'Tennessee' },
            },
            serviceType: 'Cash Home Buying',
            offers: {
              '@type': 'Offer',
              priceSpecification: {
                '@type': 'PriceSpecification',
                price: '0',
                priceCurrency: 'USD',
                description: 'Zero fees or commissions — closing costs covered',
              },
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
                {city.county} · Cash Home Buyers
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6 font-display">
                Sell My House Fast<br />
                <span className="italic text-neutral-400">in {city.name}.</span>
              </h1>
              <p className="text-neutral-300 text-lg leading-relaxed mb-6">
                {city.intro}
              </p>
              <p className="text-neutral-400 text-base leading-relaxed mb-6">
                Fair cash offer in <strong className="text-white">24 hours</strong>. Close in as little as{' '}
                <strong className="text-white">7 days</strong>. No repairs, no commissions, no showings.
              </p>
              <a
                href="tel:6155512727"
                className="inline-flex items-center gap-3 bg-brand-crimson text-white text-xl font-black px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-brand-crimson-dark hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Call Joshua at 615-551-2727"
              >
                <span aria-hidden="true">📞</span> 615-551-2727
              </a>
              <p className="text-neutral-400 text-sm mt-3 mb-8">Call or text anytime — Joshua answers.</p>
              <TrustBadges variant="dark" />
            </div>

            <CashOfferForm source={`cash-offer-${slug}`} cityName={city.name} />
          </div>
        </div>
      </div>

      {/* Local angle */}
      <div className="bg-neutral-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Why Sell for Cash in {city.name}
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-6">
            A {city.name} Cash Sale, <span className="font-display italic font-semibold">Priced Locally</span>
          </h2>
          <p className="text-neutral-700 text-lg leading-relaxed mb-4">{city.localAngle}</p>
          <p className="text-neutral-600 text-base leading-relaxed">
            We buy across {linkifyNeighborhoods(city.areas, slug)} — and everywhere else in {city.displayName}.
          </p>
        </div>
      </div>

      {/* Situations */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">
            We Buy in Any Situation
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-black text-center tracking-tight mb-10">
            Whatever You&apos;re Going Through in {city.name} — <span className="font-display italic font-semibold">We Can Help</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {situations.map((s) => (
              <div key={s.label} className="bg-white border border-neutral-200 rounded-2xl p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-3xl block mb-3" aria-hidden="true">{s.icon}</span>
                <p className="text-sm font-black text-black">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social proof */}
      <ReviewStrip variant="light" limit={3} />

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">Simple Process</p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-14">
          How It <span className="font-display italic font-semibold">Works</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="border-t-2 border-black pt-6">
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">Step {step.num}</p>
              <h3 className="text-lg font-black text-black mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">The Numbers</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center mb-14">
            Traditional {city.name} Sale vs. <span className="font-display italic font-semibold">Cash Offer</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border border-neutral-700 rounded-2xl p-8">
              <h3 className="text-lg font-black mb-6 text-neutral-400 uppercase tracking-widest">Traditional Sale</h3>
              <div className="space-y-4">
                {[
                  ['Agent Commission', '5–6%'],
                  ['Closing Costs', '2–3%'],
                  ['Repairs Before Listing', '$5k–$30k+'],
                  ['Time on Market', '30–90 days'],
                  ['Showings & Open Houses', 'Yes'],
                  ['Deal Falls Through Risk', 'High'],
                  ['Closing Timeline', '30–60 days after offer'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center border-b border-neutral-800 pb-3">
                    <span className="text-sm text-neutral-400">{label}</span>
                    <span className="text-sm font-bold text-red-400">{val}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-2 border-brand-crimson rounded-2xl p-8 bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-lg font-black mb-6 text-white uppercase tracking-widest">Joshua&apos;s Cash Offer</h3>
              <div className="space-y-4">
                {[
                  ['Agent Commission', '$0'],
                  ['Closing Costs', '$0 — We Cover It'],
                  ['Repairs', '$0 — As-Is'],
                  ['Time to Offer', '24 Hours'],
                  ['Showings', 'None'],
                  ['Deal Falls Through Risk', 'None'],
                  ['Closing Timeline', '7 Days or Your Choice'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center border-b border-neutral-700 pb-3">
                    <span className="text-sm text-neutral-400">{label}</span>
                    <span className="text-sm font-bold text-white">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Neighborhood guide cross-links (if any exist for this city) */}
      {guides.length > 0 && (
        <div className="py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              {city.name} Neighborhoods
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-8">
              Selling in a Specific {city.name} Neighborhood?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guides.slice(0, 6).map((g) => (
                <Link
                  key={g.slug}
                  href={`/neighborhoods/${g.slug}`}
                  className="block border border-neutral-200 rounded-2xl p-5 hover:border-black transition-colors"
                >
                  <h3 className="text-base font-black text-black mb-1">{g.name}</h3>
                  <p className="text-xs text-neutral-500">{g.priceBand} · Read guide →</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">Common Questions</p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-14 text-center">
          Selling Your {city.name} Home for <span className="font-display italic font-semibold">Cash</span>
        </h2>
        <div className="space-y-8">
          {allFaqs.map((faq) => (
            <div key={faq.q} className="border-b border-neutral-200 pb-6">
              <h3 className="text-lg font-black text-black mb-2">{faq.q}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-500 mt-10 pt-6 border-t border-neutral-200 leading-relaxed">
          <strong>Disclosure:</strong> Joshua Fink is a licensed Tennessee Affiliate Broker (TREC #351484) with Compass
          Real Estate and may act as a principal (owner) in a cash-offer transaction or partner with a local investor.
          Joshua&apos;s status as a licensed broker is disclosed in writing at offer time in accordance with Tennessee
          Real Estate Commission rules. Cash offers are typically 70–85% of after-repair market value; this tradeoff is
          made explicit so you can choose between speed and retail price.
        </p>
      </div>

      {/* Other paths + nearby cities */}
      <div className="bg-neutral-50 py-16 px-4 sm:px-6 lg:px-8 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">Prefer to List?</p>
              <h2 className="text-2xl font-black text-black tracking-tight mb-4">
                Want full market value in {city.name}?
              </h2>
              <p className="text-neutral-600 text-sm leading-relaxed mb-5">
                If your home is in good shape and you can wait 30–90 days, listing traditionally usually nets more.
                Joshua does both — get a free valuation and compare the two paths side by side.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/sell/${slug}`} className="inline-flex items-center justify-center bg-black text-white text-sm font-black px-6 py-3 rounded-full hover:bg-neutral-800 transition-colors">
                  Free {city.name} Valuation →
                </Link>
                <Link href={`/buy/${slug}`} className="inline-flex items-center justify-center border border-black text-black text-sm font-black px-6 py-3 rounded-full hover:bg-black hover:text-white transition-colors">
                  Buying in {city.name}?
                </Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">Other Middle TN Cities</p>
              <h2 className="text-2xl font-black text-black tracking-tight mb-4">We buy across Middle Tennessee</h2>
              <div className="flex flex-wrap gap-2">
                {otherCities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/cash-offer/${c.slug}`}
                    className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-black hover:text-white hover:border-black transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">Ready to Get Started?</p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-4">
          Get Your {city.name} Cash Offer <span className="font-display italic font-semibold">Today</span>
        </h2>
        <p className="text-neutral-600 text-base mb-10 max-w-xl mx-auto">
          No pressure. No obligation. Just a fair offer and a straight answer within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:6155512727"
            className="inline-flex items-center justify-center bg-black text-white text-base font-black px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="Call Joshua at 615-551-2727"
          >
            <span aria-hidden="true">📞</span>&nbsp;Call 615-551-2727
          </a>
          <a
            href="#cash-offer-form"
            className="inline-flex items-center justify-center border-2 border-black text-black text-base font-black px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-black hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Get My Cash Offer <span aria-hidden="true">→</span>
          </a>
        </div>
        <p className="text-neutral-500 text-sm mt-6">
          Serving {city.displayName} · {linkifyNeighborhoods(city.areas, slug)}
        </p>
      </div>
    </div>
  )
}
