import type { Metadata } from 'next'
import Link from 'next/link'
import CashOfferForm from './CashOfferForm'
import TrustBadges from '@/components/TrustBadges'
import ReviewStrip from '@/components/ReviewStrip'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import { getCashOfferCityLinks } from '@/lib/cash-offer-cities'

export const metadata: Metadata = {
  title: 'Sell My House Fast Nashville | Cash Offer in 24 Hours | Joshua Fink',
  description:
    'Sell your house fast for cash in Nashville, Franklin, Brentwood, Spring Hill, Columbia, and all of Middle Tennessee. Any condition, any situation. Fair cash offer in 24 hours. Close in 7 days. No repairs, no commissions, no fees.',
  keywords:
    'sell my house fast Nashville,cash home buyer Nashville,we buy houses Nashville TN,sell house as-is Nashville,cash offer for home Nashville,sell house fast Franklin TN,cash home buyer Middle Tennessee,sell my house fast Murfreesboro,we buy houses Brentwood TN',
  alternates: {
    canonical: 'https://www.joshuafink.com/cash-offer',
  },
  openGraph: {
    title: 'We Buy Houses Nashville — Cash Offer in 24 Hours',
    description:
      'Get a fair cash offer on your home in 24 hours. No repairs, no commissions, no hassle. Close in as little as 7 days. Serving all of Middle Tennessee.',
    url: 'https://www.joshuafink.com/cash-offer',
    siteName: 'Joshua Fink Group',
    type: 'website',
  },
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
  {
    num: '01',
    title: 'Tell Us About Your Home',
    body: 'Fill out the short form below or call us directly. Takes 60 seconds.',
  },
  {
    num: '02',
    title: 'Get Your Cash Offer',
    body: 'We review your property and call you within 24 hours with a fair, no-obligation cash offer.',
  },
  {
    num: '03',
    title: 'Pick Your Closing Date',
    body: 'Accept the offer and choose when to close — as fast as 7 days or on your own timeline.',
  },
  {
    num: '04',
    title: 'Get Paid',
    body: 'We handle all the paperwork. You walk away with cash. No fees, no commissions, no repairs.',
  },
]

const faqs = [
  {
    q: 'How does selling my house for cash work in Nashville?',
    a: "It's simple: fill out our form or call us, and we'll review your property and make a fair, no-obligation cash offer within 24 hours. If you accept, you pick the closing date — as fast as 7 days. We handle all the paperwork and pay all closing costs. You walk away with cash.",
  },
  {
    q: 'What types of properties do you buy?',
    a: "We buy houses in any condition across Middle Tennessee — homes needing major repairs, fire or water damage, code violations, hoarder houses, tenant-occupied properties, inherited homes, and more. If it has an address, we'll make an offer.",
  },
  {
    q: 'Will I get full market value for my house?',
    a: "An investor cash offer is typically 70–85% of after-repair market value. You trade a portion of retail price for speed, certainty, and zero repairs. For many sellers in distressed, inherited, or time-sensitive situations, that trade is worth it. If you want full market value and can wait 30–90 days, Joshua can also list your home traditionally — ask and we'll walk through both paths so you choose what fits.",
  },
  {
    q: 'Are there any fees or commissions?',
    a: 'Zero. No agent commissions, no closing costs, no hidden fees. The cash offer you receive is the amount you walk away with. We cover all closing costs.',
  },
  {
    q: 'How fast can you close?',
    a: 'As fast as 7 days. Most cash closings happen within 2–3 weeks, but we work on your timeline. Cash closings skip the three biggest delays in traditional sales: there is no lender approval (and therefore no appraisal contingency), no buyer-financing fall-through, and no inspection-negotiation back-and-forth because we are buying as-is. A Tennessee title attorney coordinates the payoff, clears title, and schedules closing — typically within the same week once you accept the offer. Need to close fast? We can. Need more time? No problem.',
  },
  {
    q: 'Do I need to make repairs before selling?',
    a: "No. We buy houses completely as-is. No cleaning, no repairs, no staging, no showings. Leave what you don't want — we'll handle it.",
  },
  {
    q: 'What if my house has liens, back taxes, or code violations?',
    a: 'Not a problem. We handle title issues, back property taxes, IRS liens, HOA liens, code violations, and probate complications all the time. The closing attorney coordinates payoffs and clears title — you just show up and sign.',
  },
  {
    q: 'Do I need to be out on the day of closing, or can I stay for a while?',
    a: "Flexible. We can do same-day possession if that's what you need, or you can stay 1–30 days post-closing via a standard rent-back agreement if you need time to move. Tell us what works — we'll build the timeline around you.",
  },
  {
    q: 'How is this different from Opendoor, Offerpad, or national iBuyers?',
    a: "Three differences: (1) Joshua lives and works in Middle Tennessee, so the offer is based on real local comps, not a national algorithm. (2) No service fees — iBuyers charge 5–14%. (3) You're dealing with a licensed Tennessee Affiliate Broker directly, not a faceless company. iBuyers also often refuse homes with repairs, occupancy issues, or liens — we don't.",
  },
  {
    q: 'Is Joshua buying the house himself, or passing the deal to another investor?',
    a: "You will always know exactly who is buying your house before you sign — no anonymous LLCs, no surprises. Depending on the property and situation, Joshua may act as principal buyer himself or partner with a vetted local investor. Joshua's status as a licensed Tennessee Affiliate Broker is fully disclosed in writing at offer time in accordance with Tennessee Real Estate Commission rules, so the buyer's identity and Joshua's role in the transaction are clear on the first page of the contract.",
  },
  {
    q: 'What if I still owe money on my mortgage?',
    a: "No problem — the closing attorney pays off your mortgage at closing from the cash-offer proceeds. You only net the equity. If you're upside-down (owe more than the home is worth), we can still explore options including a short sale — Joshua has negotiated these with most major Tennessee lenders.",
  },
  {
    q: 'What areas do you serve?',
    a: "All of Middle Tennessee including Nashville, Franklin, Brentwood, Spring Hill, Columbia, Murfreesboro, Gallatin, Hendersonville, Mount Juliet, Lebanon, Smyrna, La Vergne, Nolensville, Thompson's Station, and surrounding areas.",
  },
]

const sellerReviewFilter = (r: { transaction: string }) =>
  /\bsold\b|\bsell\b|bought and sold/i.test(r.transaction)

export default function CashOfferPage() {
  const cityLinks = getCashOfferCityLinks()
  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Cash Offer', href: '/cash-offer' },
  ])
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy + trust badges */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
                Middle Tennessee Cash Home Buyers
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6 font-display">
                We Buy Houses.<br />
                <span className="italic text-neutral-400">Any Condition.</span><br />
                Any Situation.
              </h1>
              <p className="text-neutral-300 text-lg leading-relaxed mb-6">
                Fair cash offer in <strong className="text-white">24 hours</strong>. Close in as little as <strong className="text-white">7 days</strong>. No repairs, no commissions, no showings, no hassle.
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

            {/* Right — inline form (client component) */}
            <CashOfferForm />
          </div>
        </div>
      </div>

      {/* Situations */}
      <div className="bg-neutral-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">
            We Buy in Any Situation
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-black text-center tracking-tight mb-10">
            Whatever You&apos;re Going Through — <span className="font-display italic font-semibold">We Can Help</span>
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

      {/* Social proof — seller reviews */}
      <ReviewStrip variant="light" limit={3} filter={sellerReviewFilter} />

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          Simple Process
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-14">
          How It <span className="font-display italic font-semibold">Works</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="border-t-2 border-black pt-6">
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
                Step {step.num}
              </p>
              <h3 className="text-lg font-black text-black mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* No fees comparison */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">
            The Numbers
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center mb-14">
            Traditional Sale vs. <span className="font-display italic font-semibold">Cash Offer</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Traditional */}
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

            {/* Cash offer */}
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

      {/* Trust signals (quick stats) */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-200">
            {[
              { value: '17+', label: 'Years in Middle TN' },
              { value: '100+', label: 'Homes Bought Annually' },
              { value: '7 Days', label: 'Fastest Close' },
              { value: '$0', label: 'Fees or Commissions' },
            ].map((s) => (
              <div key={s.label} className="py-8 px-6 text-center">
                <p className="text-3xl font-black text-black">{s.value}</p>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Suburb callouts */}
      <div className="bg-neutral-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-8">
            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
              Sell in Your Neighborhood
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-3">
              Serving every suburb across <span className="font-display italic font-semibold">Middle Tennessee</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Offers are priced off real local comps — not a national algorithm. Tap your city below for a local cash-offer page built around your market.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cityLinks.map(({ slug, name }) => (
              <Link
                key={slug}
                href={`/cash-offer/${slug}`}
                className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-semibold text-black transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Sell My House Fast in {name}, TN <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ — SEO content (12 Q&A) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">
          Common Questions
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-14 text-center">
          Frequently Asked <span className="font-display italic font-semibold">Questions</span>
        </h2>
        <div className="space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-neutral-200 pb-6">
              <h3 className="text-lg font-black text-black mb-2">{faq.q}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-neutral-500 mt-10 pt-6 border-t border-neutral-200 leading-relaxed">
          <strong>Disclosure:</strong> Joshua Fink is a licensed Tennessee Affiliate Broker with Compass Real Estate and may act as a principal (owner) in a cash-offer transaction or partner with a local investor. Joshua&apos;s status as a licensed broker is disclosed in writing at offer time in accordance with Tennessee Real Estate Commission rules. Cash offers are typically 70–85% of after-repair market value; this tradeoff is made explicit so you can choose between speed and retail price.
        </p>
      </div>

      {/* FAQ Schema (matches visible content) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      {/* Service Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Cash Home Buying — Nashville & Middle Tennessee',
            url: 'https://www.joshuafink.com/cash-offer',
            mainEntityOfPage: 'https://www.joshuafink.com/cash-offer',
            provider: {
              '@type': 'RealEstateAgent',
              '@id': 'https://www.joshuafink.com/#agent',
              name: 'Joshua Fink Group',
              url: 'https://www.joshuafink.com',
              telephone: '+1-615-551-2727',
            },
            description:
              'We buy houses for cash in any condition across Middle Tennessee. Fair offer in 24 hours, close in as little as 7 days. No repairs, no commissions, no fees.',
            areaServed: [
              { '@type': 'City', name: 'Nashville', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'City', name: 'Franklin', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'City', name: 'Brentwood', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'City', name: 'Spring Hill', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'City', name: 'Murfreesboro', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'City', name: 'Columbia', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'City', name: 'Hendersonville', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'City', name: 'Mount Juliet', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
              { '@type': 'State', name: 'Tennessee' },
            ],
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

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
          Ready to Get Started?
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-4">
          Get Your Cash Offer <span className="font-display italic font-semibold">Today</span>
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
          Serving Nashville · Franklin · Brentwood · Spring Hill · Columbia · Murfreesboro · and all of Middle Tennessee
        </p>
      </div>

    </div>
  )
}
