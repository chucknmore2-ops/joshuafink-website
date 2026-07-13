import type { Metadata } from 'next'
import Link from 'next/link'
import TrackedTelLink from '@/components/TrackedTelLink'
import SuburbLeadForm from '@/components/SuburbLeadForm'

const SITE = 'https://www.joshuafink.com'

export const metadata: Metadata = {
  title: 'The 2026 Middle Tennessee Buyer\'s Guide — Free | Joshua Fink, Compass',
  description:
    'The complete 2026 guide to buying a home in Franklin, Brentwood, Spring Hill, Nashville, and the surrounding Middle Tennessee suburbs. Pricing, schools, neighborhoods, financing, and an offer playbook from a 17-year veteran. Free.',
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
    description: 'Free, complete 2026 guide to buying a home in Middle Tennessee. Schools, neighborhoods, pricing, offer playbook.',
    url: `${SITE}/guide/buyer`,
    type: 'article',
  },
}

export default function BuyerGuidePage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Guide',
    name: 'The 2026 Middle Tennessee Buyer\'s Guide',
    description:
      'Complete guide to buying a home in Middle Tennessee in 2026: pricing, schools, neighborhoods, financing, and an offer playbook from Joshua Fink at Compass Real Estate.',
    url: `${SITE}/guide/buyer`,
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

      <div className="bg-white">
        {/* Hero */}
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold" style={{ color: '#A0A0A0' }}>
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                <li aria-hidden="true">·</li>
                <li>Buyer&apos;s Guide</li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#C41E3A' }}>
              Free · Updated for 2026
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              The Middle Tennessee{' '}
              <span style={{ color: '#C41E3A' }}>Buyer&apos;s Guide</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              Everything you need to buy smart in Franklin, Brentwood, Spring Hill, Nolensville,
              Nashville, and the surrounding Middle Tennessee suburbs. Written by Joshua Fink,
              17-year Compass agent closing 100+ transactions annually. No fluff, no sales pitch,
              no sign-up to read.
            </p>
          </div>
        </div>

        {/* Email capture — moved high for visibility */}
        <div id="get-guide" className="bg-[#F9F9F9] border-b border-[#E8E8E8] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white border border-[#E8E8E8] p-8 sm:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
                    Optional — Get Joshua&apos;s Off-Market List
                  </p>
                  <h2 className="text-2xl font-black text-black tracking-tight mb-3">
                    See homes before they hit Zillow
                  </h2>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">
                    The full guide above is free to read — no sign-up. Drop your email and Joshua
                    will also send you:
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-[#444]">
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C41E3A' }} className="mt-0.5">→</span>
                      <span>His weekly off-market &amp; Coming Soon list — Compass-exclusive homes you won&apos;t find on Zillow</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C41E3A' }} className="mt-0.5">→</span>
                      <span>A personal, same-day reply — tell him your budget &amp; timeline and he&apos;ll narrow it to the right 2-3 neighborhoods</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#C41E3A' }} className="mt-0.5">→</span>
                      <span>No spam, no pressure — unsubscribe anytime</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:col-span-3">
                  <SuburbLeadForm
                    successTitle="You're on the list!"
                    successMessage={
                      <>
                        Joshua will email you his off-market list and a personal reply — usually
                        same-day. For anything urgent, call{' '}
                        <a href="tel:6155512727" className="text-black font-semibold underline">615-551-2727</a>.
                      </>
                    }
                    resetLabel="Submit Another"
                  >
                    <input type="hidden" name="lead_type" value="buyer-guide" />
                    <input type="hidden" name="source" value="buyer-guide" />
                    <input type="hidden" name="subject" value="buyer-guide-offmarket-list" />
                    {/* Honeypot — bots fill, humans don't see */}
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

                    <p className="text-xs text-[#A0A0A0]">
                      Joshua responds same-day. No spam, no pressure, unsubscribe anytime.
                    </p>

                    <button
                      type="submit"
                      className="w-full sm:w-auto text-white text-sm font-bold px-8 py-4 tracking-wide transition-colors"
                      style={{ backgroundColor: '#C41E3A' }}
                    >
                      Get the Off-Market List →
                    </button>
                  </SuburbLeadForm>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body — the guide content (works without email signup) */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
            A starting framework:
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
          <p className="text-[#444] text-base leading-relaxed mb-4">
            For deeper comparisons, see the{' '}
            <Link href="/compare" className="text-black underline hover:no-underline">
              suburb head-to-head comparisons
            </Link>{' '}
            or pick a specific market in the{' '}
            <Link href="/market" className="text-black underline hover:no-underline">
              market report hub
            </Link>.
          </p>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
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

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
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

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
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
          <p className="text-[#444] text-base leading-relaxed mb-4">
            Joshua monitors this layer for every client. If you want on the off-market list for
            a specific suburb or price tier, just email — there&apos;s no obligation to receive it.
          </p>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
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

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
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

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
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
          <p className="text-[#444] text-base leading-relaxed mb-4">
            <strong>Wire fraud is real and aggressive.</strong> Always verify wire instructions
            verbally with your title company using a phone number you got from a separate source —
            not the email signature. Wire fraud has cost real Middle Tennessee buyers six-figure
            losses. This isn&apos;t hypothetical.
          </p>

          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 mt-12">
            Section 8
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-6">
            The Most Common Mistakes — Avoid These
          </h2>
          <ul className="space-y-2 mb-6 text-base text-[#444]">
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

          <div className="mt-16 p-8 bg-[#F9F9F9] border-l-4" style={{ borderColor: '#C41E3A' }}>
            <p className="text-xs font-semibold tracking-widest text-[#C41E3A] uppercase mb-3">
              Next Step
            </p>
            <h3 className="text-2xl font-black text-black tracking-tight mb-3">
              Talk to Joshua — Free, No Pressure
            </h3>
            <p className="text-base text-[#444] leading-relaxed mb-5">
              The fastest path to clarity is a 30-minute call. Tell Joshua your budget, timeline,
              and what you&apos;re optimizing for. He&apos;ll narrow your search to the right 2-3
              neighborhoods and tell you whether buying right now makes sense for your specific
              situation — even if the answer is &ldquo;not yet.&rdquo;
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <TrackedTelLink
                href="tel:6155512727"
                className="inline-flex items-center justify-center text-white text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}
                data-cta="buyer-guide-cta-call"
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
                Or get the off-market list →
              </a>
            </div>
          </div>
        </article>
      </div>
    </>
  )
}
