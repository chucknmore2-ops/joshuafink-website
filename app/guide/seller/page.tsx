import type { Metadata } from 'next'
import Link from 'next/link'
import TrackedTelLink from '@/components/TrackedTelLink'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import {
  currentSnapshot,
  marketReadFromSupply,
  marketUpdateSlug,
  monthLabel,
  snapshotDaysStat,
  type MarketSnapshot,
} from '@/lib/market-snapshot'
import { citywideStatsCitation, suburbs, yoyMovement } from '@/lib/suburbs'

const SITE = 'https://www.joshuafink.com'
/** America/Chicago publish day. Must not be in the future or the blog post stays off the index. */
const PUBLISHED = '2026-10-07'

const SELLER_CITY_SLUGS = [
  'franklin-tn',
  'brentwood-tn',
  'spring-hill-tn',
  'nolensville-tn',
  'nashville-tn',
] as const

export const metadata: Metadata = {
  title: "The 2026 Middle Tennessee Seller's Guide — Free",
  description:
    'The 2026 guide to selling a home in Franklin, Brentwood, Spring Hill, Nashville, and the surrounding Middle Tennessee suburbs. Pricing, prep, marketing, offers, and closing from Joshua Fink at Compass, licensed since 2008. Free.',
  alternates: { canonical: `${SITE}/guide/seller` },
  keywords: [
    'Middle Tennessee seller guide',
    'how to sell a house in Tennessee',
    'Nashville home seller guide 2026',
    'Franklin TN selling guide',
    'Brentwood TN selling guide',
    'sell my house Middle Tennessee',
  ],
  openGraph: {
    title: "The 2026 Middle Tennessee Seller's Guide — Free",
    description:
      'Free 2026 guide to selling a home in Middle Tennessee. Pricing, prep, marketing, offers, and closing.',
    url: `${SITE}/guide/seller`,
    type: 'article',
  },
}

function formatReportDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function sellerFaqs(snapshot: MarketSnapshot | null): { q: string; a: string }[] {
  const days = snapshot ? snapshotDaysStat(snapshot) : null
  const label = snapshot ? monthLabel(snapshot.month) : null
  const howLong =
    snapshot && days && label
      ? `${snapshot.source} reported ${days.label.toLowerCase()} of ${snapshot.avgDaysOnMarket} days for ${label}, published ${formatReportDate(snapshot.reportDate)}. That is a nine-county average, not a promise for one house. A home priced to recent comps can move faster; one anchored to an old comp sits past it. Once under contract, a Tennessee closing typically takes 30–45 days.`
      : 'Once a Middle Tennessee home is under contract, a Tennessee closing typically takes 30–45 days. Time to contract depends on price and condition. The current Greater Nashville REALTORS® market update has the regional average.'

  return [
    {
      q: 'What is the first step to selling a house in Middle Tennessee?',
      a: 'Get a comp-backed pricing opinion before you do anything else — before repairs, before photos, before picking a list date. Pricing off recent sold comps within a half-mile, not a Zestimate or an aspirational number, is what determines whether the first two weeks (when buyer attention is highest) work for or against you.',
    },
    {
      q: 'How long does it take to sell a house in Tennessee?',
      a: howLong,
    },
    {
      q: 'What are closing costs for home sellers in Tennessee?',
      a: 'Tennessee sellers typically pay 1–2% in closing costs (title work, transfer tax, prorated property taxes) on top of the real estate commission. That is the same range published on this site’s city sell pages. A net sheet — a side-by-side estimate of proceeds at different offer prices — removes the guesswork before you accept an offer.',
    },
    {
      q: 'Should I make repairs before listing my house?',
      a: 'It depends on scope and timeline. Minor cosmetic fixes — paint, landscaping, light fixtures, deep cleaning — almost always pay for themselves in a faster sale and fewer inspection renegotiations. Major systems (roof, HVAC, foundation) should be disclosed if known, and a pre-listing inspection can prevent a surprise from blowing up a later contract.',
    },
    {
      q: 'Is it worth getting a pre-listing inspection?',
      a: "Often, yes — especially on an older home. A pre-listing inspection surfaces the same issues a buyer's inspector will find, but on your timeline, so you can fix, price around, or disclose them upfront instead of renegotiating under contract with a closing date at risk.",
    },
    {
      q: "How do I sell my house without it sitting on Zillow for months?",
      a: 'Pricing at true market value from day one is the single biggest lever. Professional photography, a pre-MLS Coming Soon period to build early demand, and marketing beyond the MLS to active buyer networks all shorten time on market further. Current active homes are on the listings page.',
    },
    {
      q: "What should I do if my house isn't selling?",
      a:
        days && label
          ? `Time past the ${label} regional ${days.label.toLowerCase()} of ${snapshot!.avgDaysOnMarket} days is usually a pricing signal, not a marketing one. Buyers who toured and passed are telling you something. A price adjustment tied to the newest comps, combined with refreshed photos, usually resets interest faster than waiting it out.`
          : 'Days on market past the local pace is almost always a pricing signal, not a marketing one. A price adjustment tied to the newest comps, combined with refreshed photos, usually resets buyer interest faster than waiting it out.',
    },
    {
      q: 'Do I need a real estate agent to sell my house in Tennessee, or can I sell it myself?',
      a: 'You can sell FSBO (for sale by owner), but you take on pricing, marketing, negotiation, disclosure law, and contract-to-close management yourself — and you lose access to the buyer network and off-market demand an agent brings. Most Tennessee FSBO sellers who get an offer still hire an attorney to handle the contract and closing.',
    },
  ]
}

function RegionalSnapshot({ snapshot }: { snapshot: MarketSnapshot }) {
  const days = snapshotDaysStat(snapshot)
  const marketRead = marketReadFromSupply(snapshot.monthsOfInventory)
  const stats: { label: string; value: string }[] = [
    { label: 'Median sale price', value: snapshot.medianSalePrice },
    { label: days.label, value: days.value },
    { label: 'Closed sales', value: snapshot.closedSales.toLocaleString('en-US') },
    { label: 'Active listings', value: snapshot.activeListings.toLocaleString('en-US') },
  ]
  if (snapshot.pendingSales != null) {
    stats.push({ label: 'Pending sales', value: snapshot.pendingSales.toLocaleString('en-US') })
  }
  if (snapshot.condoMedianPrice) {
    stats.push({ label: 'Condo median', value: snapshot.condoMedianPrice })
  }
  if (snapshot.monthsOfInventory != null) {
    stats.push({ label: 'Months of supply', value: String(snapshot.monthsOfInventory) })
  }
  if (snapshot.medianYoyChange) {
    stats.push({ label: 'Median vs. prior year', value: snapshot.medianYoyChange })
  }
  const updateHref = `/blog/${marketUpdateSlug(snapshot.month)}`

  return (
    <aside className="my-8 border border-[#E8E8E8] bg-[#F9F9F9] p-6" aria-label="Greater Nashville market snapshot">
      <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-2">
        Greater Nashville · {monthLabel(snapshot.month)}
      </p>
      <h3 className="text-lg font-black text-black tracking-tight mb-4">
        The nine-county picture sellers are pricing into
      </h3>
      <dl className="grid grid-cols-2 gap-4 mb-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-[10px] font-semibold tracking-widest uppercase text-[#A0A0A0]">
              {stat.label}
            </dt>
            <dd className="text-base font-black text-black mt-1">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-[#444] leading-relaxed mb-3">
        {snapshot.takeaways[0]}
        {marketRead
          ? ` At ${snapshot.monthsOfInventory} months of supply, the metro reads as ${marketRead}.`
          : null}{' '}
        Your street can trade differently from that regional total.
      </p>
      <p className="text-xs text-[#6B6B6B] leading-relaxed">
        Nine-county totals from {snapshot.source}, published {formatReportDate(snapshot.reportDate)}.
        {snapshot.sourceUrl ? (
          <>
            {' '}
            <a
              href={snapshot.sourceUrl}
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source report
            </a>
            .
          </>
        ) : null}{' '}
        The write-up on this site is the{' '}
        <Link href={updateHref} className="underline hover:no-underline">
          {monthLabel(snapshot.month)} market update
        </Link>
        .
      </p>
    </aside>
  )
}

export default function SellerGuidePage() {
  const snapshot = currentSnapshot()
  const faqs = sellerFaqs(snapshot)
  const cities = SELLER_CITY_SLUGS.map((slug) => suburbs[slug]).filter(Boolean)
  const cityCitation = cities[0] ? citywideStatsCitation(cities[0]) : null

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Guide',
    name: "The 2026 Middle Tennessee Seller's Guide",
    description:
      'Guide to selling a home in Middle Tennessee in 2026: pricing strategy, prep, marketing, offers, and closing from Joshua Fink at Compass Real Estate.',
    url: `${SITE}/guide/seller`,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
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
      { '@type': 'ListItem', position: 2, name: "Seller's Guide", item: `${SITE}/guide/seller` },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="bg-white">
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold" style={{ color: '#A0A0A0' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li aria-hidden="true">·</li>
                <li>Seller&apos;s Guide</li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#C41E3A' }}>
              Free · Updated October 7, 2026
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              The Middle Tennessee{' '}
              <span style={{ color: '#C41E3A' }}>Seller&apos;s Guide</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Pricing, prep, marketing, offers, and closing for Franklin, Brentwood, Spring Hill,
              Nolensville, Nashville, and the surrounding suburbs. Written by Joshua Fink, a Compass
              Affiliate Broker licensed since 2008 who sells 40+ homes a year in Middle Tennessee.
            </p>
            <p className="text-sm mt-4 leading-relaxed" style={{ color: '#A0A0A0' }}>
              Compass · 8119 Isabella Lane, Suite 105, Brentwood, TN 37027 · TREC #351484 ·{' '}
              <TrackedTelLink href="tel:6155512727" className="underline underline-offset-4" data-cta="seller-guide-hero-call">
                615-551-2727
              </TrackedTelLink>
            </p>
          </div>
        </div>

        <div id="get-guide" className="bg-[#F9F9F9] border-b border-[#E8E8E8] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white border border-[#E8E8E8] p-8 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
                    Optional — Get a Comp-Backed Valuation
                  </p>
                  <h2 className="text-2xl font-black text-black tracking-tight mb-3">
                    Know your number before you list
                  </h2>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">
                    The guide on this page is free to read — no sign-up. Drop your info and Joshua
                    will also send you:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#444]">
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C41E3A' }} className="mt-0.5">→</span>
                      <span>A real, comp-backed valuation — recent sold comps within a half-mile, not an algorithm</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C41E3A' }} className="mt-0.5">→</span>
                      <span>A personal, same-day reply — tell him your timeline and he&apos;ll give you a straight read on pricing and prep</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C41E3A' }} className="mt-0.5">→</span>
                      <span>No spam, no pressure — unsubscribe anytime</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-3">
                  <SuburbLeadForm
                    successTitle="Got it!"
                    successMessage={
                      <>
                        Joshua will follow up with your valuation and a personal reply — usually
                        same-day. For anything urgent, call{' '}
                        <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="guide-seller-form-success-call">615-551-2727</TrackedTelLink>.
                      </>
                    }
                    resetLabel="Submit Another"
                  >
                    <input type="hidden" name="lead_type" value="seller-guide" />
                    <input type="hidden" name="source" value="seller-guide" />
                    <input type="hidden" name="subject" value="seller-guide-valuation" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sg-name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          id="sg-name"
                          name="name"
                          required
                          placeholder="Jane Smith"
                          className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="sg-email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="sg-email"
                          name="email"
                          required
                          placeholder="you@example.com"
                          className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sg-phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                          Phone (optional)
                        </label>
                        <input
                          type="tel"
                          id="sg-phone"
                          name="phone"
                          placeholder="615-555-0000"
                          className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                        />
                      </div>
                      <div>
                        <label htmlFor="sg-target" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                          Property Location
                        </label>
                        <select
                          id="sg-target"
                          name="target_suburb"
                          className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors"
                        >
                          <option value="">— Pick one —</option>
                          <option>Franklin</option>
                          <option>Brentwood</option>
                          <option>Spring Hill</option>
                          <option>Nolensville</option>
                          <option>Thompson&apos;s Station</option>
                          <option>Nashville</option>
                          <option>Murfreesboro</option>
                          <option>Mount Juliet</option>
                          <option>Hendersonville</option>
                          <option>Gallatin</option>
                          <option>Somewhere else in Middle TN</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-[#A0A0A0]">
                      Joshua responds same-day. No spam, no pressure, unsubscribe anytime.
                    </p>

                    <button
                      type="submit"
                      className="w-full sm:w-auto text-white text-sm font-bold px-8 py-4 tracking-wide transition-colors"
                      style={{ backgroundColor: '#C41E3A' }}
                    >
                      Get My Free Valuation →
                    </button>
                  </SuburbLeadForm>
                </div>
              </div>
            </div>
          </div>
        </div>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Section 1
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Pricing Is the Decision — Everything Else Is Execution
          </h2>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            More Middle Tennessee sales are won or lost at the pricing conversation than at any
            other point in the process. A new listing gets a burst of attention in the first two
            weeks that it does not get back. Price at true market value and that window works for
            you. Price aspirationally and every day past it compounds a stigma that a later price
            cut rarely fully recovers.
          </p>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            A defensible price comes from sold comps within a half-mile, adjusted for condition,
            lot, and updates — not a Zestimate, not what the neighbor got two years ago, and not
            what you need the number to be. Start with a{' '}
            <Link href="/sell" className="underline">
              free, comp-backed valuation
            </Link>{' '}
            before you commit to a list price. Homes already on the market are on{' '}
            <Link href="/listings" className="underline">
              the listings page
            </Link>
            .
          </p>

          {snapshot ? <RegionalSnapshot snapshot={snapshot} /> : null}

          {cities.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-lg font-black text-black tracking-tight mb-3">
                City medians, not the regional one
              </h3>
              <p className="text-[#444] text-base leading-relaxed mb-4">
                The nine-county median is not the price of a house in Franklin or Nashville.
                These city figures are the ones this site publishes for seller planning.
              </p>
              <div className="overflow-x-auto border border-[#E8E8E8]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#F9F9F9] text-[10px] font-semibold tracking-widest uppercase text-[#A0A0A0]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">City</th>
                      <th className="px-4 py-3 font-semibold">Median sale price</th>
                      <th className="px-4 py-3 font-semibold">Days on market</th>
                      <th className="px-4 py-3 font-semibold">Sale price vs. prior year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map((city) => (
                      <tr key={city.slug} className="border-t border-[#E8E8E8]">
                        <td className="px-4 py-3 font-semibold text-black">
                          <Link href={`/sell/${city.slug}`} className="underline hover:no-underline">
                            {city.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-[#444]">{city.medianPrice}</td>
                        <td className="px-4 py-3 text-[#444]">{city.avgDaysOnMarket}</td>
                        <td className="px-4 py-3 text-[#444]">{yoyMovement(city.yoyChange)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cityCitation ? (
                <p className="text-xs text-[#6B6B6B] leading-relaxed mt-3">
                  Median sale price, median days on market, and sale-price change. {cityCitation}.
                  These are citywide figures, not a price for your street.
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            Section 2
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Prep &amp; Presentation — What Actually Moves the Needle
          </h2>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            Buyers decide within seconds of walking in whether a home feels cared for. Prep
            doesn&apos;t mean a renovation — it means removing friction between the buyer and
            saying yes:
          </p>
          <ul className="space-y-2 mb-6 text-base text-[#444]">
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Deep clean and declutter</strong> every room, including closets and garage — buyers open them.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Neutralize bold paint and heavy personalization</strong> so buyers can picture their own furniture in the space.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Fix the obvious</strong> — burnt-out bulbs, leaky faucets, squeaky doors, scuffed walls. Small, cheap, and buyers notice.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Professional photography, always.</strong> Phone photos are the most common reason a well-priced home underperforms online.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Consider a pre-listing inspection</strong> on an older home — it lets you fix, price around, or disclose issues on your own timeline instead of renegotiating under contract.</span>
            </li>
          </ul>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            Section 3
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Marketing Beyond the MLS
          </h2>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            A public MLS listing reaches buyers actively searching that day. It does not reach
            buyers who are not searching yet but would move for the right home. A Compass Coming
            Soon period builds early interest inside the Compass network before the public listing
            goes live, and in the right market that produces pre-market interest.
          </p>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            Beyond Coming Soon: targeted digital ads to relocating buyers, an agent-to-agent
            network for off-market matches, and first-weekend timing. Listing live Thursday
            evening captures the full weekend showing window.
          </p>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            Section 4
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Evaluating Offers — Price Isn&apos;t the Whole Story
          </h2>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            The highest number on paper isn&apos;t always the strongest offer. Before accepting,
            weigh:
          </p>
          <ul className="space-y-2 mb-6 text-base text-[#444]">
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Financing strength</strong> — a cash offer or a strong conventional pre-approval closes with less risk than a thin approval at a stretched debt-to-income ratio.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Contingencies</strong> — an offer contingent on the buyer selling their own home first carries real timeline risk.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Earnest money and appraisal gap coverage</strong> — a buyer willing to cover a gap between contract price and appraised value signals genuine commitment.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Closing timeline fit</strong> — the second-highest offer with a closing date that matches your move is sometimes the better deal.</span>
            </li>
          </ul>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            Section 5
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Closing — What Tennessee Sellers Actually Pay
          </h2>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            Tennessee closings are conducted by attorneys or title companies, typically 30–45
            days from contract. Sellers generally pay 1–2% in closing costs — title work, transfer
            tax, prorated property taxes — on top of the real estate commission. Ask for a net
            sheet at any offer price so there are no surprises at the closing table. The{' '}
            <Link href="/blog/cost-to-sell-home-tennessee-2026-net-sheet" className="underline">
              Tennessee net-sheet breakdown
            </Link>{' '}
            walks through the line items.
          </p>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            <strong>Wire fraud is real.</strong> Verify wire instructions for your proceeds by
            phone with the title company, using a number you already have — not one from the
            closing email.
          </p>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            Section 6
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            If You Need to Sell Fast
          </h2>
          <p className="text-[#444] text-base leading-relaxed mb-4">
            Job relocation, inherited property, a house that needs more work than you can take on,
            or a timeline that will not stretch for a traditional listing — a cash offer trades
            some top-line price for speed and certainty: no showings, no repairs, no financing
            contingency, a close on your schedule. Compare that number with a traditional listing
            before you choose.
          </p>
          <ul className="space-y-2 mb-6 text-base text-[#444]">
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span>
                <Link href="/cash-offer" className="underline">How a cash offer works</Link>
                {' '}— the overview, including Nashville, Franklin, and the other city pages.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span>
                <Link href="/cash-offer/nashville-tn" className="underline">Nashville cash offer</Link>
                {' '}and{' '}
                <Link href="/cash-offer/franklin-tn" className="underline">Franklin cash offer</Link>.
              </span>
            </li>
          </ul>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            Section 7
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            The Most Common Seller Mistakes — Avoid These
          </h2>
          <ul className="space-y-2 mb-6 text-base text-[#444]">
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Pricing to leave room to negotiate.</strong> Buyers filter by price band online and never see a home priced above the band they are searching.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Skipping professional photography.</strong> The first impression happens online, not in person.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Being present for showings.</strong> Buyers don&apos;t speak freely — or stay long — with the seller in the house.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Ignoring the first price-reduction signal.</strong> Low showing traffic in the opening weeks is information. Adjusting to the newest comps costs less than waiting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
              <span><strong>Not reading the disclosure form carefully.</strong> Known material defects need to be disclosed. Getting this wrong creates legal exposure after closing.</span>
            </li>
          </ul>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            FAQ
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            Seller&apos;s Guide — Quick Answers
          </h2>
          <div className="space-y-6 mb-6">
            {faqs.map((f) => (
              <div key={f.q} className="bg-[#F9F9F9] p-6 border-l-4" style={{ borderColor: '#0A1628' }}>
                <h3 className="text-base font-black text-black mb-2">{f.q}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <p className="text-[#444] text-base leading-relaxed mb-4">
            Buying your next home at the same time?{' '}
            <Link href="/guide/buyer" className="text-black underline hover:no-underline">
              Read the companion Buyer&apos;s Guide
            </Link>
            . The same article is also on the{' '}
            <Link href="/blog/middle-tennessee-sellers-guide-2026" className="text-black underline hover:no-underline">
              blog
            </Link>
            .
          </p>

          <div className="mt-16 p-8 bg-[#F9F9F9] border-l-4" style={{ borderColor: '#C41E3A' }}>
            <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
              Next Step
            </p>
            <h3 className="text-2xl font-black text-black tracking-tight mb-3">
              Talk to Joshua — Free, No Pressure
            </h3>
            <p className="text-base text-[#444] leading-relaxed mb-5">
              The fastest path to clarity is a 30-minute call. Tell Joshua about your home and
              timeline and he&apos;ll give you a comp-backed number and an honest read on whether
              now is the right time to list — even if the answer is not yet. Compass, 8119
              Isabella Lane, Suite 105, Brentwood, TN 37027.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <TrackedTelLink
                href="tel:6155512727"
                className="inline-flex items-center justify-center text-white text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}
                data-cta="seller-guide-cta-call"
              >
                Call 615-551-2727
              </TrackedTelLink>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors"
              >
                Email Joshua
              </Link>
              <a
                href="#get-guide"
                className="inline-flex items-center justify-center text-sm font-bold px-6 py-3 tracking-wide text-black underline underline-offset-4"
              >
                Or get a free valuation →
              </a>
            </div>
          </div>
        </article>
      </div>
    </>
  )
}
