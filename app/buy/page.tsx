import type { Metadata } from 'next'
import Link from 'next/link'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import TrackedTelLink from '@/components/TrackedTelLink'
import TrustBadges from '@/components/TrustBadges'
import ReviewStrip from '@/components/ReviewStrip'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import { getAllSuburbSlugs, getSuburb } from '@/lib/suburbs'
import { getNeighborhoodsByCitySlug } from '@/lib/neighborhoods'
import { reviewStats } from '@/lib/reviews'

export const metadata: Metadata = {
  title: "Homes for Sale in Middle Tennessee | Buyer's Agent — Joshua Fink",
  description:
    "Buy a home anywhere in Middle Tennessee with Joshua Fink at Compass. Franklin, Brentwood, Nashville, Spring Hill, Murfreesboro and every surrounding town — local market expert, off-market and Compass Private Exclusive access, school-zone guidance. Free buyer consultation, no cost to work with a buyer's agent.",
  keywords:
    "homes for sale Middle Tennessee,Middle Tennessee buyer's agent,buy a home in Nashville TN,Franklin TN homes for sale,Brentwood TN real estate,Spring Hill TN homes,Murfreesboro homes for sale,Middle TN real estate agent,buyer representation Nashville,off-market homes Middle Tennessee",
  alternates: {
    canonical: 'https://www.joshuafink.com/buy',
  },
  openGraph: {
    title: "Homes for Sale in Middle Tennessee — Buyer's Agent Joshua Fink",
    description:
      "Insider access to every Middle Tennessee market — including off-market and Compass Coming Soon homes. Free buyer consultation with Joshua Fink at Compass.",
    url: 'https://www.joshuafink.com/buy',
    siteName: 'Joshua Fink Group',
    type: 'website',
  },
}

const whyBuy = [
  {
    icon: '🔑',
    title: 'Off-Market & Coming Soon Access',
    body: 'Joshua surfaces Compass Private Exclusives and Coming Soon homes that never hit the public portals — real inventory you cannot find on Zillow.',
  },
  {
    icon: '🎓',
    title: 'School-Zone & Commute Expertise',
    body: 'Every Middle TN town has micro-markets with very different school zones and commute times. Joshua maps the right neighborhoods to your family and your drive.',
  },
  {
    icon: '🤝',
    title: 'A Negotiator on Your Side',
    body: '17+ years and 100+ closings a year of local comps and contract experience — working to get you the right home at the right terms, not just any home.',
  },
  {
    icon: '💵',
    title: 'No Cost to Buyers',
    body: "Buyer representation is typically paid through the transaction, not out of your pocket. You get a full-time local expert with no separate fee to work with Joshua.",
  },
]

const faqs = [
  {
    q: 'Does it cost anything to work with a buyer’s agent?',
    a: "In most Middle Tennessee transactions, buyer-agent compensation is handled within the deal, so there is typically no separate out-of-pocket cost to you for representation. Joshua walks you through exactly how it works up front and puts any agreement in writing before you tour a single home — no surprises.",
  },
  {
    q: 'Which Middle Tennessee areas does Joshua cover?',
    a: "All of it — Franklin, Brentwood, Spring Hill, Nolensville, Thompson's Station, Nashville, Murfreesboro, Gallatin, Hendersonville, Mount Juliet, Columbia, Lebanon, Smyrna, and La Vergne. Each town has its own dedicated buyer guide below with median prices, school notes, and neighborhood breakdowns.",
  },
  {
    q: 'How do I see homes that aren’t on Zillow yet?',
    a: 'As a Compass agent, Joshua has access to Private Exclusive and Coming Soon listings that are marketed before (or entirely outside of) the public MLS feeds. Tell him what you’re looking for and he’ll set you up on a private search that includes those off-market homes as they surface.',
  },
  {
    q: 'I’m relocating from out of state — can you help before I move?',
    a: "Absolutely — a large share of Middle TN buyers are relocating. Joshua does video tours, neighborhood orientation calls, school-district walkthroughs, and commute analysis remotely, then has everything ready for an efficient in-person trip. Start with the Moving to Middle Tennessee guide and a quick call.",
  },
  {
    q: 'How fast should I get pre-approved?',
    a: 'Before you tour, if you can. In competitive Middle TN price bands, homes can move in days, and a pre-approval letter is what makes your offer credible. Joshua can connect you with trusted local lenders and time your search around your financing so you’re ready to move when the right home appears.',
  },
  {
    q: 'What’s the first step?',
    a: 'Send Joshua a note with your target area, price range, and timeline using the form on this page, or call or text 615-551-2727. You’ll get a same-day reply, a private search set up around your criteria, and an honest read on what your budget buys in each Middle TN market.',
  },
]

const buyerReviewFilter = (r: { transaction: string }) =>
  /\bbought\b|\bbuy\b|\bpurchas/i.test(r.transaction)

export default function BuyHubPage() {
  const cities = getAllSuburbSlugs()
    .map((slug) => getSuburb(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))

  // Cities that have at least one neighborhood guide, for the internal-link directory.
  const cityGuideGroups = cities
    .map((city) => ({ city, guides: getNeighborhoodsByCitySlug(city.slug) }))
    .filter((g) => g.guides.length > 0)

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Buy', href: '/buy' },
  ])

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Buyer Representation — Middle Tennessee',
    url: 'https://www.joshuafink.com/buy',
    mainEntityOfPage: 'https://www.joshuafink.com/buy',
    serviceType: 'Real Estate Buyer Agent',
    // Reference the canonical agent entity defined in app/layout.tsx (#agent)
    // so all pages consolidate signals onto one knowledge-graph node.
    provider: { '@id': 'https://www.joshuafink.com/#agent' },
    description:
      'Full-service buyer representation across Middle Tennessee — off-market and Compass Private Exclusive access, school-zone and commute guidance, and local negotiation. No separate cost to buyers.',
    areaServed: cities.map((c) => ({
      '@type': 'City',
      name: c.schemaCity,
      addressRegion: c.schemaState,
      addressCountry: 'US',
    })),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.rating.toFixed(1),
      reviewCount: reviewStats.total,
      bestRating: '5',
      worstRating: '1',
    },
  }

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy + trust */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
                Middle Tennessee Buyer&apos;s Agent
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6 font-display">
                Find Your Home in<br />
                <span className="italic text-neutral-400">Middle Tennessee.</span>
              </h1>
              <p className="text-neutral-300 text-lg leading-relaxed mb-6">
                From Franklin to Nashville to Murfreesboro — get insider access to every market, including
                <strong className="text-white"> off-market and Coming Soon homes</strong> you won&apos;t find online.
                Local expertise, honest guidance, and no cost to work with a buyer&apos;s agent.
              </p>
              <TrackedTelLink
                href="tel:6155512727"
                className="inline-flex items-center gap-3 bg-brand-crimson text-white text-xl font-black px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-brand-crimson-dark hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Call Joshua at 615-551-2727"
                data-cta="buy-hero-call"
              >
                <span aria-hidden="true">📞</span> 615-551-2727
              </TrackedTelLink>
              <p className="text-neutral-400 text-sm mt-3 mb-8">Call or text anytime — Joshua answers.</p>

              <TrustBadges variant="dark" />
            </div>

            {/* Right — inline lead form (mobile: shown first for lead capture) */}
            <div id="buyer-form" className="order-first lg:order-last bg-white text-black p-8 sm:p-10 rounded-2xl">
              <h2 className="text-2xl font-black tracking-tight mb-2">Start Your Home Search</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Tell Joshua what you&apos;re after and get a same-day reply with matching homes — including
                off-market listings.
              </p>
              <SuburbLeadForm
                successTitle="Search Started!"
                successMessage={
                  <>
                    Joshua will reach out same-day with matching homes. For anything urgent, call{' '}
                    <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="buy-form-success-call">615-551-2727</TrackedTelLink>.
                  </>
                }
                resetLabel="Submit Another"
              >
                <input type="hidden" name="lead_type" value="buyer" />
                <input type="hidden" name="source" value="buy-hub" />
                {/* Honeypot — real users never see or fill this */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px] h-0 w-0 opacity-0"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full Name *</label>
                    <input type="text" id="name" name="name" required placeholder="Jane Smith"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone *</label>
                    <input type="tel" id="phone" name="phone" required placeholder="(615) 555-0123" autoComplete="tel"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email Address *</label>
                  <input type="email" id="email" name="email" required placeholder="you@example.com" autoComplete="email"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>

                <div>
                  <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">What Are You Looking For? (optional)</label>
                  <textarea id="body" name="body" rows={3}
                    placeholder="Area, price range, beds, school zone, must-haves — anything helps Joshua send the right matches."
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#222] transition-colors">
                    Send to Joshua →
                  </button>
                  <TrackedTelLink
                    href="tel:6155512727"
                    className="w-full sm:w-auto inline-flex items-center justify-center border-2 border-black text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-black hover:text-white transition-colors"
                    data-cta="buy-form-inline-call"
                  >
                    Or Call 615-551-2727
                  </TrackedTelLink>
                </div>
              </SuburbLeadForm>
            </div>
          </div>
        </div>
      </div>

      {/* Why buy with Joshua */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          Why Buyers Choose Joshua
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-14">
          A Local Expert <span className="font-display italic font-semibold">On Your Side</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyBuy.map((w) => (
            <div key={w.title} className="border-t-2 border-black pt-6">
              <span className="text-3xl block mb-4" aria-hidden="true">{w.icon}</span>
              <h3 className="text-lg font-black text-black mb-3">{w.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{w.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <ReviewStrip variant="light" limit={3} filter={buyerReviewFilter} />

      {/* City directory */}
      <div className="bg-neutral-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-8">
            <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-3">
              Buy in Your City
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-3">
              Homes for sale across <span className="font-display italic font-semibold">Middle Tennessee</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Every town has its own buyer guide with current median prices, days on market, school notes, and
              neighborhood breakdowns. Tap your city to dig in.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/buy/${c.slug}`}
                className="group rounded-2xl border border-neutral-200 bg-white px-6 py-5 transition-all duration-200 hover:border-black hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-lg font-black text-black">{c.displayName}</span>
                  <span className="text-black opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
                </div>
                <p className="text-xs text-neutral-500">{c.county}</p>
                <div className="flex gap-4 mt-3 text-xs text-neutral-600">
                  <span>Median <strong className="text-black">{c.medianPrice}</strong></span>
                  <span>{c.avgDaysOnMarket} days on market</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Neighborhood guide directory (internal linking) */}
      {cityGuideGroups.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Explore by Neighborhood
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black mb-3">
              In-depth <span className="font-display italic font-semibold">neighborhood guides</span>
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Detailed guides to Middle Tennessee&apos;s most-searched neighborhoods — home styles, price bands,
              HOA and school notes, and what it&apos;s really like to live there.
            </p>
          </div>

          <div className="space-y-10">
            {cityGuideGroups.map(({ city, guides }) => (
              <div key={city.slug}>
                <h3 className="text-sm font-black text-black uppercase tracking-widest mb-4">
                  {city.displayName}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {guides.map((g) => (
                    <Link
                      key={g.slug}
                      href={`/neighborhoods/${g.slug}`}
                      className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-black hover:text-white hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    >
                      {g.name} <span aria-hidden="true">→</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-neutral-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">
            Common Questions
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-14 text-center">
            Buying in <span className="font-display italic font-semibold">Middle Tennessee</span>
          </h2>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div key={faq.q} className="border-b border-neutral-200 pb-6">
                <h3 className="text-lg font-black text-black mb-2">{faq.q}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
          Ready When You Are
        </p>
        <h2 className="text-4xl sm:text-5xl font-black text-black tracking-tight mb-4">
          Let&apos;s Find Your <span className="font-display italic font-semibold">Next Home</span>
        </h2>
        <p className="text-neutral-600 text-base mb-10 max-w-xl mx-auto">
          No pressure, no obligation — just a local expert who knows every market in Middle Tennessee.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#buyer-form"
            className="inline-flex items-center justify-center bg-black text-white text-base font-black px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Start My Home Search <span aria-hidden="true">→</span>
          </a>
          <TrackedTelLink
            href="tel:6155512727"
            className="inline-flex items-center justify-center border-2 border-black text-black text-base font-black px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-black hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            data-cta="buy-bottom-cta-call"
          >
            <span aria-hidden="true">📞</span>&nbsp;Call 615-551-2727
          </TrackedTelLink>
        </div>
        <p className="text-neutral-500 text-sm mt-6">
          Serving Nashville · Franklin · Brentwood · Spring Hill · Murfreesboro · and all of Middle Tennessee
        </p>
      </div>
    </div>
  )
}
