import type { Metadata } from 'next'
import Link from 'next/link'
import TrustBadges from '@/components/TrustBadges'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'
import { suburbs, getAllSuburbSlugs } from '@/lib/suburbs'
import { neighborhoods } from '@/lib/neighborhoods'
import { getAllCashOfferCitySlugs } from '@/lib/cash-offer-cities'
import { reviewStats } from '@/lib/reviews'

export const metadata: Metadata = {
  title: 'Homes for Sale in Middle Tennessee | Buyer\'s Agent — Joshua Fink',
  description:
    'Looking to buy a home in Middle Tennessee? Joshua Fink at Compass represents buyers across Nashville, Franklin, Brentwood, Spring Hill, and every suburb in between. Off-market access, local-comp pricing, and proven negotiation. Free buyer consultation.',
  keywords:
    'homes for sale Middle Tennessee, Middle Tennessee buyer\'s agent, homes for sale Nashville TN, buy a home in Franklin TN, Nashville buyer\'s agent, real estate agent Middle Tennessee',
  alternates: {
    canonical: 'https://www.joshuafink.com/buy',
  },
  openGraph: {
    title: 'Homes for Sale in Middle Tennessee | Joshua Fink — Compass',
    description:
      'Buy your next home in Middle Tennessee with a local Compass agent. Off-market listings, neighborhood-level expertise, and same-day responses. Serving Nashville, Franklin, Brentwood, Spring Hill, and all of Middle TN.',
    url: 'https://www.joshuafink.com/buy',
    siteName: 'Joshua Fink Group',
    type: 'website',
  },
}

const steps = [
  {
    num: '01',
    title: 'Free Buyer Consultation',
    body: 'Joshua learns your budget, must-haves, school priorities, and timeline — then maps them to the Middle Tennessee submarkets that actually fit. No spam, no pressure.',
  },
  {
    num: '02',
    title: 'Off-Market & MLS Search',
    body: 'You get first-look access to Compass Coming Soon and Private Exclusive listings before they hit Zillow — plus a curated MLS feed dialed to your criteria.',
  },
  {
    num: '03',
    title: 'Tour & Diligence',
    body: 'Joshua tours homes with you, pulls real local comps, flags school-zone and HOA gotchas, and tells you which homes are priced to win vs. to wait out.',
  },
  {
    num: '04',
    title: 'Negotiate & Close',
    body: 'Offer strategy built for a competitive market — escalation clauses, appraisal-gap language, inspection leverage — through inspections, appraisal, and a clean close.',
  },
]

const reasons = [
  {
    icon: '🗺️',
    title: 'Hyperlocal Expertise',
    body: 'Joshua knows every Middle TN submarket — Williamson, Davidson, Maury, Rutherford, Sumner, and Wilson Counties — block by block, school zone by school zone.',
  },
  {
    icon: '🔑',
    title: 'Off-Market Access',
    body: "Compass Coming Soon and Private Exclusive listings surface to Joshua's clients first. In a tight market, that early look often wins the home.",
  },
  {
    icon: '🤝',
    title: 'Real Negotiation',
    body: '17+ years of Middle TN deals means Joshua knows what concessions actually move sellers and which terms cost you more than they save.',
  },
  {
    icon: '⚡',
    title: 'Same-Day Response',
    body: 'Text or call and you hear back the same day, often within minutes. In a fast market, response time is the difference between winning and watching it sell.',
  },
]

const faqs = [
  {
    q: "What does a Middle Tennessee buyer's agent actually do?",
    a: "Joshua represents you — not the seller — through the entire purchase. That includes tuning your search to the right submarkets, surfacing off-market and Coming Soon listings, touring homes, pulling local comps to set your offer, writing the contract, coordinating inspections and appraisal, and negotiating repairs and credits all the way through close. Buyer-agent compensation is negotiated up front and disclosed in writing before you tour.",
  },
  {
    q: 'How much does it cost to use a buyer\'s agent?',
    a: 'In most Middle Tennessee transactions, buyer-agent compensation is paid out of the deal proceeds — historically by the seller through the listing brokerage, though as of August 2024 NAR rule changes it can also be negotiated as a seller concession or paid directly by the buyer. Joshua walks through the exact options at your first consult and you sign a buyer representation agreement that spells out fees before any tours, so there are zero surprises later.',
  },
  {
    q: 'Which Middle Tennessee cities and suburbs does Joshua cover?',
    a: 'All of them. Joshua actively writes deals in Nashville, Franklin, Brentwood, Spring Hill, Nolensville, Thompson\'s Station, Murfreesboro, Smyrna, La Vergne, Gallatin, Hendersonville, Mount Juliet, Lebanon, and Columbia — plus the smaller communities in between. If you\'re looking inside about a 45-minute radius of Nashville, he covers it.',
  },
  {
    q: 'How competitive is the Middle Tennessee buyer market in 2026?',
    a: 'It varies by submarket and price band. Williamson County (Franklin, Brentwood, Nolensville) is the most competitive — well-priced homes in top school zones often see multiple offers within days. Davidson County is more balanced. Maury (Spring Hill, Columbia) and Rutherford (Murfreesboro, Smyrna) sit somewhere in between. Joshua tells you upfront which markets favor buyers and which require an aggressive offer strategy.',
  },
  {
    q: 'Do I need to be pre-approved before touring homes?',
    a: 'Yes — or at least pre-qualified. In a competitive Middle TN market, sellers expect a pre-approval letter alongside any offer, and many listing agents will not schedule showings without one. If you don\'t have a lender yet, Joshua can connect you with local lenders who close on time. Cash buyers should be ready to show proof of funds.',
  },
  {
    q: 'How long does it take to buy a home in Middle Tennessee?',
    a: 'Typical timeline is 60–90 days from active search to keys in hand. The search itself varies — pre-approved, decisive buyers often find the right home in 2–4 weeks; pickier searches can stretch 3–6 months. Once you\'re under contract, closing in Tennessee usually takes 30–45 days, driven mostly by your lender\'s underwriting timeline.',
  },
  {
    q: 'Can Joshua help me if I\'m relocating from out of state?',
    a: 'Yes — relocations are a meaningful share of his business. He can video-tour homes, coordinate inspections remotely, and provide neighborhood-level briefings on schools, commutes, taxes, and HOA quirks so you can make informed offers without flying in for every showing. Many of his clients close on Middle TN homes having visited the area only once or twice.',
  },
  {
    q: 'I might also need to sell. Can Joshua handle both sides?',
    a: 'Yes. Most Middle TN move-up buyers are also selling something — a current home, a rental, or an inherited property. Joshua runs traditional listings and investor cash offers, so the conversation about how you fund the next home starts with the same call. See /sell for traditional listings and /cash-offer for the cash route.',
  },
]

const cityList: { slug: string; name: string; county: string; medianPrice: string }[] =
  getAllSuburbSlugs().map((slug) => {
    const s = suburbs[slug]
    return { slug, name: s.name, county: s.county, medianPrice: s.medianPrice }
  })

const neighborhoodList = Object.values(neighborhoods)
  .slice()
  .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name))

// Cities that also have a cash-offer landing page, so the hub can hand its
// link authority to those high-intent seller pages (the /buy hub linked to
// /buy/[city] and the neighborhood guides but never to /cash-offer/[city]).
// Guarded as a Set so a future slug drift between suburbs and cash-offer
// cities silently omits the link instead of 404-ing.
const cashOfferSlugs = new Set(getAllCashOfferCitySlugs())

export default function BuyPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const agentLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Joshua Fink — Compass Real Estate',
    url: 'https://www.joshuafink.com/buy',
    telephone: '+16155512727',
    email: 'joshua@joshuafink.com',
    image: 'https://www.joshuafink.com/headshot.webp',
    description:
      "Joshua Fink is a buyer's agent at Compass Real Estate representing buyers across Middle Tennessee — Nashville, Franklin, Brentwood, Spring Hill, and every suburb in between.",
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Middle Tennessee',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.rating.toFixed(1),
      reviewCount: reviewStats.total,
      bestRating: '5',
      worstRating: '1',
    },
  }

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Buy', href: '/buy' },
  ])

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agentLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Buying a Home
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl">
            Homes for Sale in Middle Tennessee.
          </h1>
          <p className="text-neutral-400 text-lg mt-4 max-w-xl leading-relaxed">
            Work with a Compass buyer&apos;s agent who knows every Middle TN submarket — Nashville,
            Franklin, Brentwood, Spring Hill, and every suburb in between. Off-market access,
            local-comp pricing, real negotiation.
          </p>
          <div className="mt-7">
            <TrustBadges variant="dark" />
          </div>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a
              href="#buyer-form"
              className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-lg active:scale-[0.98] text-center"
            >
              Start My Home Search
            </a>
            <Link
              href="/listings"
              className="inline-flex items-center justify-center border border-neutral-600 text-white text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98] text-center"
            >
              View Active Listings
            </Link>
            <a
              href="tel:6155512727"
              className="inline-flex items-center justify-center border border-neutral-600 text-white text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98] text-center"
            >
              Call 615-551-2727
            </a>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          The Process
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-14">
          How Buying With Joshua Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="border-t-2 border-black pt-6">
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
                Step {step.num}
              </p>
              <h3 className="text-lg font-black text-black mb-3">{step.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Joshua */}
      <div className="bg-neutral-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Why Buyers Choose Joshua
          </p>
          <h2 className="text-4xl font-black text-black tracking-tight mb-14">
            Your Unfair Advantage in Middle TN
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((r) => (
              <div
                key={r.title}
                className="bg-white border border-neutral-200 rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <span className="text-3xl">{r.icon}</span>
                <h3 className="text-base font-black text-black mt-4 mb-2">{r.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* City grid — links into every /buy/[city] page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          Buy By City
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-3">
          Every Middle Tennessee Submarket.
        </h2>
        <p className="text-neutral-600 text-base max-w-2xl mb-10 leading-relaxed">
          Tap any city for a dedicated buyer page — current median price, days on market, top
          neighborhoods, and a buyer-specific FAQ for that submarket.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cityList.map(({ slug, name, county, medianPrice }) => (
            <div
              key={slug}
              className="rounded-2xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:border-black hover:shadow-md"
            >
              <Link href={`/buy/${slug}`} className="group block">
                <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-1">
                  {county}
                </p>
                <p className="text-base font-black text-black mb-1 group-hover:underline">
                  Homes for Sale in {name}, TN
                </p>
                <p className="text-xs text-neutral-500">
                  Median {medianPrice} · See buyer guide →
                </p>
              </Link>
              {cashOfferSlugs.has(slug) && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <Link
                    href={`/cash-offer/${slug}`}
                    className="text-xs font-semibold text-neutral-500 underline-offset-4 hover:text-black hover:underline"
                  >
                    Need to sell first? Get a {name} cash offer →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Buyer Lead Form */}
      <div id="buyer-form" className="bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
                Free Buyer Consultation
              </p>
              <h2 className="text-4xl font-black text-black tracking-tight leading-tight mb-6">
                Start Your Middle TN Home Search.
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                Tell Joshua what you&apos;re looking for and he&apos;ll reach out same-day with a
                personalized search strategy — real listings, real numbers, no pressure.
              </p>

              <div className="space-y-5">
                <div className="border-l-2 border-black pl-5">
                  <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">
                    Phone
                  </p>
                  <a href="tel:6155512727" className="text-xl font-black text-black hover:underline">
                    615-551-2727
                  </a>
                </div>
                <div className="border-l-2 border-black pl-5">
                  <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">
                    Email
                  </p>
                  <a
                    href="mailto:joshua@joshuafink.com"
                    className="text-sm font-semibold text-black hover:underline"
                  >
                    joshua@joshuafink.com
                  </a>
                </div>
                <div className="border-l-2 border-black pl-5">
                  <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">
                    Serving
                  </p>
                  <p className="text-sm text-neutral-600">
                    Nashville · Franklin · Brentwood
                    <br />
                    Spring Hill · Columbia · Gallatin
                    <br />
                    &amp; all of Middle Tennessee
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-6">
                Tell Joshua What You&apos;re Looking For
              </p>
              <SuburbLeadForm
                successTitle="Request Sent!"
                successMessage={
                  <>
                    Joshua will reach out same-day with Middle TN listings that fit. For anything
                    urgent, call{' '}
                    <a href="tel:6155512727" className="text-black font-semibold underline">
                      615-551-2727
                    </a>
                    .
                  </>
                }
                resetLabel="Submit Another"
              >
                <input type="hidden" name="lead_type" value="buyer" />
                <input type="hidden" name="source" value="buy-index" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Jane Smith"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                    >
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      placeholder="615-555-0000"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full border border-neutral-200 px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label
                      htmlFor="suburb"
                      className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                    >
                      Target City
                    </label>
                    <select
                      id="suburb"
                      name="suburb"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="">—</option>
                      {cityList.map(({ slug, name }) => (
                        <option key={slug} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value="Open / Multiple">Open / Multiple</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="budget"
                      className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                    >
                      Budget
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="">—</option>
                      <option>Under $300K</option>
                      <option>$300K–$450K</option>
                      <option>$450K–$600K</option>
                      <option>$600K–$800K</option>
                      <option>$800K–$1M</option>
                      <option>$1M+</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="timeline"
                      className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                    >
                      Timeline
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      className="w-full border border-neutral-200 px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="">—</option>
                      <option value="asap">ASAP</option>
                      <option value="1-3mo">1–3 months</option>
                      <option value="3-6mo">3–6 months</option>
                      <option value="6mo+">6+ months</option>
                      <option value="just-looking">Just exploring</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="body"
                    className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                  >
                    What Are You Looking For? (optional)
                  </label>
                  <textarea
                    id="body"
                    name="body"
                    rows={4}
                    placeholder="Tell Joshua your must-haves — school zone, neighborhood, lot size, style. Anything helps."
                    className="w-full border border-neutral-200 px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors resize-y"
                  />
                </div>

                <p className="text-xs text-neutral-400">
                  * Joshua responds same-day. No spam, no pressure.
                </p>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-black text-white text-sm font-bold px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98]"
                >
                  Start My Middle TN Home Search →
                </button>
              </SuburbLeadForm>
            </div>
          </div>
        </div>
      </div>

      {/* Neighborhood guides — links into every /neighborhoods/[slug] page */}
      {neighborhoodList.length > 0 && (
        <div className="bg-white border-t border-neutral-200 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Neighborhood Guides
            </p>
            <h2 className="text-4xl font-black text-black tracking-tight mb-3">
              Go Deeper: Pick a Neighborhood.
            </h2>
            <p className="text-neutral-600 text-base max-w-2xl mb-10 leading-relaxed">
              Honest, in-depth guides to Middle Tennessee&apos;s most-searched neighborhoods —
              schools, HOA, amenities, home styles, and current price ranges. Live listings are
              served on Compass with Joshua as your attributed agent.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
              {neighborhoodList.map((n) => (
                <li key={n.slug}>
                  <Link
                    href={`/neighborhoods/${n.slug}`}
                    className="block py-2 text-sm text-neutral-700 hover:text-black hover:underline"
                  >
                    <span className="font-semibold text-black">{n.name}</span>{' '}
                    <span className="text-neutral-500">— {n.city}, TN</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-neutral-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Common Questions
          </p>
          <h2 className="text-4xl font-black text-black tracking-tight mb-10">
            Buying in Middle Tennessee, Answered.
          </h2>
          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {faqs.map((f, i) => (
              <details key={i} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-base sm:text-lg font-semibold text-black pr-6">{f.q}</span>
                  <span
                    className="shrink-0 w-6 h-6 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              Ready to find your Middle TN home?
            </h2>
            <p className="text-neutral-400 mt-2 text-sm">
              Free consultation. Local expertise. Same-day response.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="#buyer-form"
              className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-md active:scale-[0.98] text-center"
            >
              Start My Search
            </a>
            <a
              href="tel:6155512727"
              className="inline-flex items-center justify-center border border-neutral-600 text-white text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98] text-center"
            >
              Call 615-551-2727
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
