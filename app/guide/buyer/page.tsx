import type { Metadata } from 'next'
import Link from 'next/link'
import TrackedTelLink from '@/components/TrackedTelLink'
import TrustBadges from '@/components/TrustBadges'
import SuburbLeadForm from '@/components/SuburbLeadForm'
import { reviews } from '@/lib/reviews'
import { currentSnapshot, monthLabel, type MarketSnapshot } from '@/lib/market-snapshot'

const SITE = 'https://www.joshuafink.com'

export const metadata: Metadata = {
  title: 'The 2026 Middle Tennessee Buyer\'s Guide — Free',
  description:
    'Free 2026 guide for first-time and move-up buyers in Franklin, Brentwood, Spring Hill, Nashville, and the Middle Tennessee suburbs. Suburb fit, schools, pre-approval, and an offer playbook from Joshua Fink at Compass. Read it here.',
  alternates: { canonical: `${SITE}/guide/buyer` },
  keywords: [
    'Middle Tennessee buyer guide',
    'Nashville home buyer guide 2026',
    'Franklin TN buying guide',
    'Brentwood TN buying guide',
    'how to buy a home in Tennessee',
    'first-time home buyer Nashville',
  ],
  openGraph: {
    title: 'The 2026 Middle Tennessee Buyer\'s Guide — Free',
    description:
      'Free 2026 guide to buying in Middle Tennessee: suburbs, schools, pre-approval, and an offer playbook. Read it on the page.',
    url: `${SITE}/guide/buyer`,
    siteName: 'Joshua Fink | Compass Real Estate',
    type: 'article',
  },
}

const GUIDE_SECTIONS: { id: string; label: string }[] = [
  { id: 'start', label: 'Start here' },
  { id: 'suburbs', label: 'Suburbs' },
  { id: 'schools', label: 'Schools' },
  { id: 'preapproval', label: 'Pre-approval' },
  { id: 'off-market', label: 'Off-market' },
  { id: 'offers', label: 'Offers' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'closing', label: 'Closing' },
  { id: 'mistakes', label: 'Mistakes' },
  { id: 'selling-to-buy', label: 'Selling to buy' },
  { id: 'faq', label: 'FAQ' },
]

const START_STEPS: { num: string; title: string; body: string }[] = [
  {
    num: '01',
    title: 'Name the payment you can live with',
    body: 'The loan approval is usually higher than the payment that still lets you live. Write down principal, interest, taxes, insurance, and HOA before you tour.',
  },
  {
    num: '02',
    title: 'Get a real pre-approval',
    body: 'Listing agents in this market expect pay stubs, tax returns, bank statements, and a hard credit pull. A soft-pull estimate is not an offer.',
  },
  {
    num: '03',
    title: 'Pick the suburb, then the house',
    body: 'Franklin, Brentwood, Spring Hill, Nolensville, and the Nashville suburbs behave like different markets. The right neighborhood matters more than the perfect kitchen.',
  },
  {
    num: '04',
    title: 'Write an offer that can win',
    body: 'Strong earnest money, a closing date the seller wants, and a tight inspection window. Keep the inspection. Waiving it is how people buy a problem.',
  },
]

// Direct-answer FAQs for AI answer engines (ChatGPT/Perplexity/Claude) and
// Google's FAQ rich results. Every answer restates a fact already published
// in the guide body above — no new numbers or claims introduced here.
const BUYER_GUIDE_FAQS: { q: string; a: string }[] = [
  {
    q: 'Do I need to be pre-approved before touring homes in Middle Tennessee?',
    a: 'Yes. Pre-approval is non-negotiable in 2026 — listing agents generally won\'t entertain offers without it. Get a real pre-approval (pay stubs, tax returns, bank statements, hard credit pull), not a soft-pull estimate, before you start touring.',
  },
  {
    q: 'How much are closing costs for home buyers in Tennessee?',
    a: 'Total buyer closing costs typically run 2-4% of the purchase price. The main line items are lender fees, title insurance, transfer/recordation tax, escrow setup for taxes and insurance, and the first-year homeowners insurance premium. Tennessee closings are conducted by attorneys or title companies, usually 30-45 days from contract.',
  },
  {
    q: 'How much earnest money should I offer in a competitive Middle Tennessee market?',
    a: 'Strong earnest money — typically $5,000 to $15,000 depending on the price tier — signals serious intent to a seller. Pairing it with a flexible closing timeline and a tight but real inspection window strengthens an offer without necessarily requiring the highest price.',
  },
  {
    q: 'Should I waive the home inspection to win a bidding war?',
    a: 'No — never waive inspection. The savings from "winning" a bid are nothing compared to the cost of an undisclosed structural issue. A tight inspection contingency (7-10 days) gives you real diligence time without slowing the offer down.',
  },
  {
    q: 'What does a typical Middle Tennessee home inspection turn up?',
    a: 'A typical inspection finds 30-80 items, which is normal. Worth negotiating: HVAC, roof, or water heater at end of life, active leaks, electrical safety issues, foundation concerns, and crawl space moisture. Reasons to walk away: extensive mold, structural foundation issues, polybutylene plumbing with active failures, or sewer line collapse.',
  },
  {
    q: 'How do I find off-market homes in Franklin, Brentwood, or Nashville?',
    a: 'A meaningful share of Middle Tennessee transactions — especially $1M+ and established luxury neighborhoods — never hit public MLS. Compass Coming Soon listings, pocket listings, and word-of-mouth deals fill that gap, so buyers searching only Zillow miss real inventory. Tell Joshua your target suburb or price tier and he will share relevant off-market and Coming Soon opportunities as they surface.',
  },
  {
    q: 'What is the biggest mistake first-time buyers make in this market?',
    a: 'Buying at the top of loan approval — the qualification number is usually 20-30% higher than most buyers\' actual comfort level. Other common mistakes: skipping the inspection to win a bid, letting emotion drive the offer, and not reading HOA CC&Rs before falling in love with a property.',
  },
  {
    q: 'Which Middle Tennessee suburb fits my budget?',
    a: 'Roughly: $300K-$425K reaches Murfreesboro, Smyrna, Gallatin, Lebanon, Columbia, and La Vergne. $425K-$600K opens Spring Hill, Thompson\'s Station, Hendersonville, and Mount Juliet. $600K-$900K reaches Nolensville and Franklin. $900K+ is Brentwood, core Franklin, and luxury Nolensville. See the suburb head-to-head comparisons or market report hub for specifics.',
  },
]

const LOCAL_QUOTE = reviews.find((r) => r.reviewer === 'Joseph C.')

type CtaLink = {
  href: string
  label: string
  cta: string
  tel?: boolean
}

function GuideCta({
  eyebrow = 'Next step',
  title,
  body,
  links,
}: {
  eyebrow?: string
  title: string
  body: string
  links: CtaLink[]
}) {
  return (
    <div className="my-10 p-6 sm:p-8 bg-[#F9F9F9] border-l-4" style={{ borderColor: '#C41E3A' }}>
      <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
        {eyebrow}
      </p>
      <h3 className="text-2xl font-black text-black tracking-tight mb-3">{title}</h3>
      <p className="text-base text-[#444] leading-relaxed mb-5">{body}</p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {links.map((link, i) => {
          const className =
            i === 0
              ? 'inline-flex items-center justify-center text-white text-sm font-bold px-6 py-3 tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] focus-visible:ring-offset-2'
              : 'inline-flex items-center justify-center border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2'
          const style = i === 0 ? { backgroundColor: '#C41E3A' } : undefined
          if (link.tel) {
            return (
              <TrackedTelLink
                key={link.cta}
                href={link.href}
                className={className}
                style={style}
                data-cta={link.cta}
              >
                {link.label}
              </TrackedTelLink>
            )
          }
          if (link.href.startsWith('#')) {
            return (
              <a key={link.cta} href={link.href} className={className} style={style} data-cta={link.cta}>
                {link.label}
              </a>
            )
          }
          return (
            <Link key={link.cta} href={link.href} className={className} style={style} data-cta={link.cta}>
              {link.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
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

function RegionalSnapshot({ snapshot }: { snapshot: MarketSnapshot }) {
  const stats: { label: string; value: string }[] = [
    { label: 'Median sale price', value: snapshot.medianSalePrice },
    { label: 'Avg. days on market', value: String(snapshot.avgDaysOnMarket) },
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

  return (
    <aside className="mb-8 border border-[#E8E8E8] bg-[#F9F9F9] p-6" aria-label="Greater Nashville market snapshot">
      <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-2">
        Greater Nashville · {monthLabel(snapshot.month)}
      </p>
      <h3 className="text-lg font-black text-black tracking-tight mb-4">
        The nine-county picture, from the published report
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
      <p className="text-sm text-[#444] leading-relaxed mb-3">{snapshot.takeaways[0]}</p>
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
        Franklin, Brentwood, and Nashville each trade differently — these figures are the regional total, not a single-city price.
      </p>
    </aside>
  )
}

export default function BuyerGuidePage() {
  const snapshot = currentSnapshot()

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Guide',
    name: 'The 2026 Middle Tennessee Buyer\'s Guide',
    description:
      'Complete guide to buying a home in Middle Tennessee in 2026: pricing, schools, neighborhoods, financing, and an offer playbook from Joshua Fink at Compass Real Estate.',
    url: `${SITE}/guide/buyer`,
    dateModified: '2026-09-25',
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
      { '@type': 'ListItem', position: 2, name: "Buyer's Guide", item: `${SITE}/guide/buyer` },
    ],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: BUYER_GUIDE_FAQS.map((f) => ({
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
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12 items-start">
              <div className="lg:col-span-3">
                <nav aria-label="Breadcrumb" className="mb-6">
                  <ol className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold" style={{ color: '#A0A0A0' }}>
                    <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                    <li aria-hidden="true">·</li>
                    <li>Buyer&apos;s Guide</li>
                  </ol>
                </nav>
                <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#C41E3A' }}>
                  Free · Compass, Brentwood · 2026
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                  The Middle Tennessee{' '}
                  <span style={{ color: '#C41E3A' }}>Buyer&apos;s Guide</span>
                </h1>
                <p className="text-lg mt-5 max-w-xl leading-relaxed" style={{ color: '#C8C8C8' }}>
                  For a first home, or the next one, in Franklin, Brentwood, Spring Hill,
                  Nolensville, Nashville, and the suburbs around them. Read it here. If you want
                  the search narrowed to two or three neighborhoods, Joshua will do that on a call.
                </p>
                <p className="text-sm mt-4 leading-relaxed" style={{ color: '#A0A0A0' }}>
                  Joshua Fink · Affiliate Broker, Compass Real Estate · TN license #351484 · 17 years in Middle Tennessee
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-8">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center text-white text-sm font-bold px-6 py-3.5 tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628]"
                    style={{ backgroundColor: '#C41E3A' }}
                    data-cta="buyer-guide-hero-contact"
                  >
                    Talk through your search
                  </Link>
                  <TrackedTelLink
                    href="tel:6155512727"
                    className="inline-flex items-center justify-center border border-white/40 text-white text-sm font-bold px-6 py-3.5 tracking-wide hover:bg-white hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1628]"
                    data-cta="buyer-guide-hero-call"
                  >
                    Call 615-551-2727
                  </TrackedTelLink>
                  <a
                    href="#start"
                    className="inline-flex items-center justify-center text-sm font-bold px-2 py-3.5 tracking-wide text-white underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    data-cta="buyer-guide-hero-read"
                  >
                    Start reading
                  </a>
                </div>
              </div>

              <div className="lg:col-span-2 border border-white/15 p-6">
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#C41E3A' }}>
                  In this guide
                </p>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a href="#suburbs" className="text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      Which suburb fits the budget →
                    </a>
                  </li>
                  <li>
                    <a href="#schools" className="text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      Schools before the house →
                    </a>
                  </li>
                  <li>
                    <a href="#preapproval" className="text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      Pre-approval listing agents accept →
                    </a>
                  </li>
                  <li>
                    <a href="#offers" className="text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      Offers, inspection, and closing costs →
                    </a>
                  </li>
                  <li>
                    <a href="#selling-to-buy" className="text-white hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                      Already own and need to sell first →
                    </a>
                  </li>
                </ul>
                <p className="text-xs mt-5 leading-relaxed" style={{ color: '#A0A0A0' }}>
                  City-by-city buyer pages, with that market&apos;s own notes, are on{' '}
                  <Link href="/buy" className="text-white underline underline-offset-4 hover:no-underline" data-cta="buyer-guide-hero-buy">
                    the buy hub
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="mt-10">
              <TrustBadges variant="dark" />
            </div>
          </div>
        </div>

        <nav aria-label="Guide sections" className="sticky top-16 z-40 bg-white border-b border-[#E8E8E8]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex gap-1 overflow-x-auto py-2">
              {GUIDE_SECTIONS.map((section) => (
                <li key={section.id} className="shrink-0">
                  <a
                    href={`#${section.id}`}
                    className="inline-block whitespace-nowrap text-xs font-semibold tracking-wide text-[#444] px-3 py-2 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <section id="start" className="scroll-mt-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Where to start
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-4 max-w-3xl">
            First home or the next one — same order of operations
          </h2>
          <p className="text-[#444] text-base leading-relaxed max-w-3xl mb-8">
            Most buyers who stall here are trying to pick a house before they have a payment
            and a suburb. Do those two first. The{' '}
            <Link href="/blog/first-time-home-buyer-nashville-middle-tennessee-2026" className="text-black underline hover:no-underline">
              first-time buyer walkthrough
            </Link>{' '}
            goes deeper on programs and payment math if this is purchase number one.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <a
              href="#preapproval"
              className="block border border-[#E8E8E8] p-6 hover:border-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              data-cta="buyer-guide-path-first-home"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-[#C41E3A] mb-2">
                First home
              </p>
              <h3 className="text-xl font-black text-black mb-2">Buying for the first time</h3>
              <p className="text-sm text-[#444] leading-relaxed">
                A payment you can live with, a real pre-approval, then the suburb. Tours come after the lender letter.
              </p>
              <p className="mt-4 text-sm font-bold text-black">Pre-approval, then suburbs →</p>
            </a>
            <a
              href="#selling-to-buy"
              className="block border border-[#E8E8E8] p-6 hover:border-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              data-cta="buyer-guide-path-move-up"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-[#C41E3A] mb-2">
                You already own
              </p>
              <h3 className="text-xl font-black text-black mb-2">Preparing to buy the next one</h3>
              <p className="text-sm text-[#444] leading-relaxed">
                The next house usually waits on the current one. Joshua will put a traditional listing and a cash offer side by side before you write.
              </p>
              <p className="mt-4 text-sm font-bold text-black">Selling so you can buy →</p>
            </a>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {START_STEPS.map((step) => (
              <li key={step.num} className="border-t-2 border-black pt-4">
                <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-2">
                  {step.num}
                </p>
                <h3 className="text-lg font-black text-black mb-2">{step.title}</h3>
                <p className="text-sm text-[#444] leading-relaxed">{step.body}</p>
              </li>
            ))}
          </ol>

          {LOCAL_QUOTE ? (
            <figure className="mt-10 max-w-3xl border-l-4 pl-5" style={{ borderColor: '#0A1628' }}>
              <blockquote className="text-[#444] leading-relaxed">
                &ldquo;{LOCAL_QUOTE.text}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-xs font-semibold tracking-widest uppercase text-[#A0A0A0]">
                {LOCAL_QUOTE.reviewer} · {LOCAL_QUOTE.transaction} ·{' '}
                <Link href="/reviews" className="text-black underline hover:no-underline normal-case tracking-normal font-semibold">
                  More reviews
                </Link>
              </figcaption>
            </figure>
          ) : null}
        </section>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <section id="suburbs" className="scroll-mt-32">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 1
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              Pick the Right Suburb Before You Pick a House
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              The single biggest decision a Middle Tennessee buyer makes isn&apos;t which house — it&apos;s
              which suburb. Get this right and almost any home in the right neighborhood will work.
              Get it wrong and you&apos;ll be unhappy in even the perfect home.
            </p>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              A starting framework Joshua uses with buyers. These are planning bands, not a published median for any one city:
            </p>
            <ul className="space-y-2 mb-6 text-base text-[#444]">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span>
                  <strong>$300K-$425K:</strong> Murfreesboro, Smyrna, Gallatin, Lebanon, Columbia,
                  La Vergne. Strongest value plays in the metro.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span>
                  <strong>$425K-$600K:</strong>{' '}
                  <Link href="/buy/spring-hill-tn" className="underline">Spring Hill</Link>,{' '}
                  <Link href="/buy/thompsons-station-tn" className="underline">Thompson&apos;s Station</Link>,{' '}
                  <Link href="/buy/hendersonville-tn" className="underline">Hendersonville</Link>,{' '}
                  <Link href="/buy/mount-juliet-tn" className="underline">Mount Juliet</Link>.
                  The Williamson County door starts to open here.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span>
                  <strong>$600K-$900K:</strong>{' '}
                  <Link href="/buy/nolensville-tn" className="underline">Nolensville</Link>,{' '}
                  <Link href="/buy/franklin-tn" className="underline">Franklin</Link>{' '}
                  opens up at the lower end, established Brentwood-adjacent areas.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span>
                  <strong>$900K+:</strong>{' '}
                  <Link href="/buy/brentwood-tn" className="underline">Brentwood</Link>,
                  core Franklin, luxury Nolensville. Premium school zones,
                  established neighborhoods, larger lots.
                </span>
              </li>
            </ul>

            {snapshot ? <RegionalSnapshot snapshot={snapshot} /> : null}

            <p className="text-[#444] text-base leading-relaxed mb-4">
              For deeper comparisons, see the{' '}
              <Link href="/compare" className="text-black underline hover:no-underline">
                suburb head-to-head comparisons
              </Link>{' '}
              or pick a specific market in the{' '}
              <Link href="/market" className="text-black underline hover:no-underline">
                market report hub
              </Link>
              . Each city also has its own{' '}
              <Link href="/buy" className="text-black underline hover:no-underline">
                buyer page
              </Link>
              .
            </p>

            <GuideCta
              title="Not sure which two or three towns fit?"
              body="Tell Joshua the monthly payment, the commute, and whether schools are the filter. He will name the suburbs that actually match — and say so if buying right now is the wrong move."
              links={[
                { href: '/contact', label: 'Tell Joshua your budget', cta: 'buyer-guide-suburb-contact' },
                { href: '/buy', label: 'Browse cities', cta: 'buyer-guide-suburb-buy' },
                { href: 'tel:6155512727', label: 'Call 615-551-2727', cta: 'buyer-guide-suburb-call', tel: true },
              ]}
            />
          </section>

          <section id="schools" className="scroll-mt-32 mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 2
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              Schools — The Filter Most Families Should Start With
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              School zone drives more Williamson County home decisions than any other factor. For
              relocating families, the school district often outranks budget on the priority list.
              A few practical points:
            </p>
            <ul className="space-y-2 mb-6 text-base text-[#444]">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Williamson County Schools</strong> consistently rank at the top of Tennessee. Specific schools rotate; the system is uniformly strong.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span>Zoning can vary <em>within</em> subdivisions. Always confirm against the current Williamson County Schools map for the exact address.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span>Tour homes by zone if schools are your top priority. Start at the{' '}
                  <Link href="/homes-near" className="underline">homes-near-schools hub</Link>{' '}
                  — covers Ravenwood, Brentwood, Page, Independence, Centennial, and Nolensville High zones.
                </span>
              </li>
            </ul>
          </section>

          <section id="preapproval" className="scroll-mt-32 mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 3
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              Get Pre-Approved Before You Tour
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              Pre-approval is non-negotiable in 2026. Listing agents won&apos;t entertain offers
              without it. A real pre-approval — not a soft credit pull estimate — typically
              requires pay stubs, tax returns, bank statements, and a hard credit pull.
            </p>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              The math you actually need:
            </p>
            <ul className="space-y-2 mb-6 text-base text-[#444]">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Maximum comfortable monthly payment</strong> — including principal, interest, taxes, insurance, HOA. Not the maximum your lender approves; the maximum that lets you live.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Down payment + closing costs + reserves</strong> in cash. Closing costs typically run 2-4% of purchase price. Don&apos;t forget 2-3 months of reserves.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Lender you trust</strong>. The lowest advertised rate often comes from lenders who can&apos;t close on time. Ask Joshua for the current shortlist.</span>
              </li>
            </ul>
            <GuideCta
              title="Ask for the lender shortlist"
              body="Joshua keeps a short list of local lenders who actually close on Middle Tennessee timelines. Send the budget and the target suburb and he will point you at who to call."
              links={[
                { href: '/contact', label: 'Request the shortlist', cta: 'buyer-guide-preapproval-contact' },
                { href: 'tel:6155512727', label: 'Call 615-551-2727', cta: 'buyer-guide-preapproval-call', tel: true },
              ]}
            />
          </section>

          <section id="off-market" className="scroll-mt-32 mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 4
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              Off-Market Access is Where Deals Happen
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              A meaningful percentage of Middle Tennessee transactions — especially in the
              $1M+ tier and in established luxury neighborhoods — never hit public MLS. Compass
              Coming Soon listings, pocket listings, and word-of-mouth transactions fill that gap.
              Buyers using only Zillow miss real inventory.
            </p>
            <p className="text-[#444] text-base leading-relaxed mb-6">
              Joshua monitors this layer for every client. The form is optional. Use it when you
              want him watching a specific suburb. He replies personally, usually the same day.
              Unsubscribe anytime.
            </p>

            <div id="get-guide" className="scroll-mt-32 border border-[#E8E8E8] p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
                Optional — off-market alerts for one suburb
              </p>
              <h3 className="text-2xl font-black text-black tracking-tight mb-3">
                Tell Joshua what to watch
              </h3>
              <SuburbLeadForm
                successTitle="You're in."
                successMessage={
                  <>
                    Joshua will reply personally — usually same-day — and share relevant
                    off-market opportunities as they come up. For anything urgent, call{' '}
                    <TrackedTelLink href="tel:6155512727" className="text-black font-semibold underline" data-cta="guide-buyer-form-success-call">615-551-2727</TrackedTelLink>.
                  </>
                }
                resetLabel="Submit Another"
              >
                <input type="hidden" name="lead_type" value="buyer-guide" />
                <input type="hidden" name="source" value="buyer-guide" />
                <input type="hidden" name="subject" value="buyer-guide-offmarket-list" />
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }}
                  aria-hidden="true"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bg-name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="bg-name"
                      name="name"
                      required
                      placeholder="Jane Smith"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="bg-email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="bg-email"
                      name="email"
                      required
                      placeholder="you@example.com"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bg-phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      id="bg-phone"
                      name="phone"
                      placeholder="615-555-0000"
                      className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="bg-target" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                      Target Suburb
                    </label>
                    <select
                      id="bg-target"
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
                      <option>Still deciding</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto text-white text-sm font-bold px-8 py-4 tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] focus-visible:ring-offset-2"
                  style={{ backgroundColor: '#C41E3A' }}
                >
                  Ask Joshua to watch this suburb →
                </button>
              </SuburbLeadForm>
            </div>
          </section>

          <section id="offers" className="scroll-mt-32 mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 5
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              The Offer Playbook — What Actually Wins in 2026
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              Offers don&apos;t have to be desperate to win, even in tight markets. What
              consistently works:
            </p>
            <ul className="space-y-2 mb-6 text-base text-[#444]">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Strong earnest money</strong> ($5K-$15K depending on price tier) signals serious intent.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Flexible closing</strong> — match the seller&apos;s preferred timeline if possible.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Tight inspection contingency</strong> (7-10 days) — fast but still gives you real diligence time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Escalation clauses</strong> — &ldquo;I&apos;ll pay $X over the highest competing offer up to a cap of $Y&rdquo; — win multiple-offer situations without overpaying.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Never waive inspection</strong>. The savings from &ldquo;winning&rdquo; the bid are nothing compared to the cost of an undisclosed structural issue.</span>
              </li>
            </ul>
            <GuideCta
              title="Have an offer coming up?"
              body="Send the address, your ceiling, and the seller's timeline. Joshua will tell you what a competitive Middle Tennessee offer looks like for that house before you write it."
              links={[
                { href: '/contact', label: 'Run an offer by Joshua', cta: 'buyer-guide-offers-contact' },
                { href: 'tel:6155512727', label: 'Call 615-551-2727', cta: 'buyer-guide-offers-call', tel: true },
              ]}
            />
          </section>

          <section id="inspection" className="scroll-mt-32 mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 6
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              Inspection — What to Expect, What to Negotiate
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              A typical Middle Tennessee home inspection finds 30-80 items. That&apos;s normal.
              The question is which items matter:
            </p>
            <ul className="space-y-2 mb-6 text-base text-[#444]">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Negotiate</strong>: HVAC/roof/water heater at end of life, active leaks, electrical safety, foundation concerns, crawl space moisture.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Walk away</strong>: extensive mold, structural foundation issues, polybutylene plumbing with active failures, sewer line collapse.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span>Read the full{' '}
                  <Link href="/blog/tennessee-home-inspection-guide" className="underline">
                    Tennessee inspection guide
                  </Link>{' '}
                  for line-by-line specifics.
                </span>
              </li>
            </ul>
          </section>

          <section id="closing" className="scroll-mt-32 mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 7
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              Closing — What Tennessee Buyers Actually Pay
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              Tennessee closings are conducted by attorneys or title companies, typically 30-45
              days from contract. Total buyer closing costs run roughly 2-4% of the purchase price.
              Major line items: lender fees, title insurance, transfer/recordation tax, escrow
              establishment (taxes + insurance), first-year homeowners insurance premium.
            </p>
            <p className="text-[#444] text-base leading-relaxed">
              <strong>Wire fraud is real and aggressive.</strong> Always verify wire instructions
              verbally with your title company using a phone number you got from a separate source —
              not the email signature. Wire fraud has cost real Middle Tennessee buyers six-figure
              losses. This isn&apos;t hypothetical.
            </p>
          </section>

          <section id="mistakes" className="scroll-mt-32 mt-12">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Section 8
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              The Most Common Mistakes — Avoid These
            </h2>
            <ul className="space-y-2 text-base text-[#444]">
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Buying at the top of your approval.</strong> The qualification number is usually 20-30% higher than your comfort number.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Skipping the inspection to win.</strong> Never. Don&apos;t do this. Ever.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Letting emotion drive offers.</strong> Anchor to the first home you fall in love with at your peril.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Ignoring HOA documents.</strong> Read CC&amp;Rs before falling in love, not after.</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: '#C41E3A' }} className="mt-1">→</span>
                <span><strong>Using your out-of-state agent.</strong> Tennessee has its own contracts and customs — work with someone local.</span>
              </li>
            </ul>
          </section>
        </article>

        <section id="selling-to-buy" className="scroll-mt-32 bg-[#F9F9F9] border-y border-[#E8E8E8] py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
              If the current house has to sell first
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-4">
              Two ways out of the home you have
            </h2>
            <p className="text-[#444] text-base leading-relaxed mb-4">
              A lot of people reading this already own in Middle Tennessee. Joshua will show both
              numbers before you choose: a traditional Compass listing aimed at the retail market,
              and a cash offer when you need speed, certainty, or to skip repairs. You can buy
              the next house with him either way.
            </p>
            <p className="text-[#444] text-base leading-relaxed mb-6">
              The cash-offer page spells out how that path works. The sell page is the traditional
              listing. If you are unsure which one fits the move, start with a conversation.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center text-white text-sm font-bold px-6 py-3 tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C41E3A] focus-visible:ring-offset-2"
                style={{ backgroundColor: '#C41E3A' }}
                data-cta="buyer-guide-sell-to-buy-contact"
              >
                Talk through both paths
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center justify-center border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                data-cta="buyer-guide-sell-to-buy-list"
              >
                List it traditionally
              </Link>
              <Link
                href="/cash-offer"
                className="inline-flex items-center justify-center border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                data-cta="buyer-guide-sell-to-buy-cash"
              >
                See the cash offer
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <section id="faq" className="scroll-mt-32">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-6">
              Buyer&apos;s Guide — Quick Answers
            </h2>
            <div className="space-y-6">
              {BUYER_GUIDE_FAQS.map((f) => (
                <div key={f.q} className="bg-[#F9F9F9] p-6 border-l-4" style={{ borderColor: '#0A1628' }}>
                  <h3 className="text-base font-black text-black mb-2">{f.q}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <GuideCta
            eyebrow="When you are ready"
            title="Thirty minutes. A straight answer."
            body="Tell Joshua the budget, the timeline, and what you are optimizing for. He will narrow the search to the right two or three neighborhoods and tell you whether buying now makes sense — including when the answer is to wait."
            links={[
              { href: '/contact', label: 'Email Joshua', cta: 'buyer-guide-final-contact' },
              { href: 'tel:6155512727', label: 'Call 615-551-2727', cta: 'buyer-guide-final-call', tel: true },
              { href: '#get-guide', label: 'Or ask about off-market homes', cta: 'buyer-guide-final-offmarket' },
            ]}
          />
        </div>
      </div>
    </>
  )
}
