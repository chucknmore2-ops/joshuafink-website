import type { Metadata } from 'next'
import Link from 'next/link'
import { suburbs } from '@/lib/suburbs'
import SuburbLeadForm from '@/components/SuburbLeadForm'

const SITE = 'https://www.joshuafink.com'

// Relocation pillar page. Targets the high-intent "moving to Middle Tennessee /
// moving to [city] TN" cluster that had zero on-site coverage, and acts as a
// hub linking out to every /buy/[city], /market/[city], /neighborhoods, and
// /homes-near surface — concentrating internal link equity on the city pages
// while capturing relocation leads directly.

const RELO_FAQS: { q: string; a: string }[] = [
  {
    q: 'Why are so many people moving to Middle Tennessee?',
    a: 'A few reasons keep coming up with the buyers Joshua works with: Tennessee has no state income tax on wages, the cost of living is lower than the large coastal and Northern metros people are relocating from, the job market across Nashville (healthcare, music, tech, auto and advanced manufacturing) keeps growing, and the lifestyle — historic downtowns, lakes, state parks, and a central US location — is a genuine draw. Williamson County’s schools are a separate, powerful magnet for relocating families.',
  },
  {
    q: 'Does Tennessee have a state income tax?',
    a: 'No. Tennessee does not tax wage and salary income, and the former Hall tax on interest and dividend income has been fully phased out. For households relocating from high-tax states, the take-home difference is often the single biggest financial reason they move — but always confirm your specific situation with a tax professional.',
  },
  {
    q: 'How much do homes cost across Middle Tennessee in 2026?',
    a: 'It varies widely by city. On the more accessible end, median prices run in the low-to-mid $300Ks (La Vergne, Columbia, Gallatin) and mid-$300Ks to $400Ks (Murfreesboro, Smyrna, Hendersonville, Lebanon). The Williamson County core is higher — Spring Hill around the $450Ks, Nolensville near $580K, Franklin around $650K, and Brentwood around $900K. Joshua can pull exact, current comps for any specific area.',
  },
  {
    q: 'Which Middle TN city is right for me?',
    a: 'It depends on your priorities — budget, schools, commute, and lifestyle. Families focused on top-rated public schools often look at Williamson County (Franklin, Brentwood, Nolensville, Thompson’s Station). Buyers prioritizing value and newer construction frequently look at Spring Hill, Murfreesboro, Columbia, or the Sumner and Wilson County towns. Buyers who want walkable urban living look inside Nashville. Joshua’s job is to match you to the right fit rather than push one place — start with a conversation.',
  },
  {
    q: 'How far are these suburbs from downtown Nashville?',
    a: 'Most of the core suburbs are roughly 20–45 minutes from downtown Nashville depending on traffic and time of day. Commute matters a lot in this region because growth has outpaced some roads — Joshua factors your actual commute (not just the map estimate) into where he recommends you look.',
  },
  {
    q: 'Can Joshua help me relocate from out of state?',
    a: 'Yes — a large share of Joshua’s clients are relocating from other states. He runs remote searches with video walkthroughs, neighborhood breakdowns, school-zone verification, and coordinated closings so you can buy confidently before or shortly after you arrive. Reach out and he’ll set up a relocation plan around your timeline.',
  },
]

const MOVE_REASONS: { title: string; body: string }[] = [
  {
    title: 'No state income tax',
    body: 'Tennessee doesn’t tax wage income, and the old Hall tax on investment income is gone. For relocating households, that take-home difference is often the headline reason to move.',
  },
  {
    title: 'Lower cost of living',
    body: 'Housing, taxes, and day-to-day costs run below the large coastal and Northern metros most buyers are coming from — the same budget simply buys more here.',
  },
  {
    title: 'A growing job market',
    body: 'Nashville’s economy keeps expanding across healthcare, music and entertainment, tech, and advanced manufacturing — with major employers and relocations driving steady demand.',
  },
  {
    title: 'Top-rated schools',
    body: 'Williamson County Schools consistently rank among the best in Tennessee, and families relocate specifically for the K-12 path. School zone is one of the strongest resale drivers in the region.',
  },
  {
    title: 'Central location',
    body: 'Middle Tennessee sits within a day’s drive of much of the country, with a major airport in Nashville — convenient for work travel and for family who’ll want to visit.',
  },
  {
    title: 'Lifestyle & the outdoors',
    body: 'Historic downtowns, live music, lakes, greenways, and state parks — plus four real (but mild) seasons — give the area a quality-of-life pull beyond the numbers.',
  },
]

export const metadata: Metadata = {
  title: 'Moving to Middle Tennessee — Relocation Guide (2026)',
  description:
    'Thinking about moving to Middle Tennessee? Compare Franklin, Brentwood, Spring Hill, Nashville, Murfreesboro and more — prices, schools, commutes, and why people relocate here. Local relocation help from Compass agent Joshua Fink.',
  keywords: [
    'moving to Middle Tennessee',
    'moving to Nashville TN',
    'relocating to Tennessee',
    'best Nashville suburbs',
    'moving to Franklin TN',
    'moving to Brentwood TN',
    'moving to Spring Hill TN',
    'Tennessee no state income tax',
    'best places to live near Nashville',
    'Joshua Fink',
    'Compass Real Estate',
  ],
  alternates: { canonical: `${SITE}/moving-to-middle-tennessee` },
  openGraph: {
    title: 'Moving to Middle Tennessee — Relocation Guide (2026)',
    description:
      'Compare Franklin, Brentwood, Spring Hill, Nashville, Murfreesboro and more — prices, schools, commutes, and why people relocate to Middle TN.',
    url: `${SITE}/moving-to-middle-tennessee`,
    siteName: 'Joshua Fink | Compass Real Estate',
    type: 'article',
  },
}

export default function MovingToMiddleTennesseePage() {
  // City cards sorted most→least expensive for a clean "luxury to accessible" read.
  const cities = Object.values(suburbs).sort((a, b) => b.medianPriceNum - a.medianPriceNum)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: RELO_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Moving to Middle Tennessee',
        item: `${SITE}/moving-to-middle-tennessee`,
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="bg-white">
        {/* Hero */}
        <div style={{ backgroundColor: '#0A1628' }} className="text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-xs tracking-widest uppercase font-semibold" style={{ color: '#A0A0A0' }}>
                <li>
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                </li>
                <li aria-hidden="true">·</li>
                <li>Moving to Middle Tennessee</li>
              </ol>
            </nav>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
              Relocation Guide · 2026
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] max-w-4xl">
              Moving to{' '}
              <span style={{ color: '#C41E3A' }}>Middle Tennessee</span>
            </h1>
            <p className="text-lg mt-5 max-w-3xl leading-relaxed" style={{ color: '#A0A0A0' }}>
              No state income tax, a lower cost of living, a growing job market, and some of the
              best schools in the state — Middle Tennessee is one of the most relocated-to regions
              in the country. Here’s how the cities compare, and how to land in the right one.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#cities"
                className="inline-block text-sm font-bold px-8 py-4 tracking-wide transition-colors text-center"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Compare the Cities ↓
              </a>
              <Link
                href="#relocation-help"
                className="inline-block border text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                style={{ borderColor: '#FFFFFF' }}
              >
                Get a Relocation Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Why people move here */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Why People Relocate Here
          </p>
          <h2 className="text-3xl font-black text-black tracking-tight mb-10">
            What’s pulling people to Middle Tennessee
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOVE_REASONS.map((r, i) => (
              <div key={i} className="bg-white p-8 border-t-4" style={{ borderColor: '#C41E3A' }}>
                <h3 className="text-base font-black text-black mb-3">{r.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#A0A0A0] mt-6 max-w-3xl leading-relaxed">
            Tax treatment varies by household — confirm your specific situation with a tax
            professional. Market figures below are 2026 medians and move over time.
          </p>
        </div>

        {/* City comparison */}
        <div id="cities" className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Choose Your City
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-3">
              Middle TN cities, compared
            </h2>
            <p className="text-sm text-[#6B6B6B] max-w-2xl mb-10 leading-relaxed">
              Fourteen cities and towns Joshua covers, from the luxury Williamson County core to the
              fast-growing, more accessible markets. Open any city for buyer guides, market data,
              and neighborhood detail.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cities.map((c) => (
                <div key={c.slug} className="bg-white border border-[#E8E8E8] p-6 flex flex-col">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-xl font-black text-black">{c.name}</h3>
                    <span className="text-sm font-black" style={{ color: '#C41E3A' }}>{c.medianPrice}</span>
                  </div>
                  <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-3">
                    {c.county} · Median
                  </p>
                  <dl className="text-xs text-[#6B6B6B] space-y-1 mb-5">
                    {c.schoolDistrict && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-black shrink-0">Schools:</dt>
                        <dd>{c.schoolDistrict}</dd>
                      </div>
                    )}
                    {c.commuteNote && (
                      <div className="flex gap-2">
                        <dt className="font-semibold text-black shrink-0">Commute:</dt>
                        <dd>{c.commuteNote}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <Link href={`/buy/${c.slug}`} className="font-semibold text-black hover:underline">
                      Buy in {c.name} →
                    </Link>
                    <Link href={`/market/${c.slug}`} className="font-semibold text-black hover:underline">
                      Market report →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search by schools / neighborhoods */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0A1628] text-white p-10">
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#A0A0A0' }}>
                Relocating With Kids?
              </p>
              <h2 className="text-2xl font-black tracking-tight mb-4">Search by school zone</h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#A0A0A0' }}>
                In Middle Tennessee — especially Williamson County — the school zone drives both fit
                and resale. Start from the school and work backward to the right neighborhoods.
              </p>
              <Link
                href="/homes-near"
                className="inline-block text-sm font-bold px-6 py-3 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A', color: '#FFFFFF' }}
              >
                Browse Homes by School →
              </Link>
            </div>
            <div className="bg-[#F9F9F9] border border-[#E8E8E8] p-10">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Get Into the Detail
              </p>
              <h2 className="text-2xl font-black text-black tracking-tight mb-4">Neighborhood guides</h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed mb-6">
                Once you’ve narrowed the city, the neighborhood is everything. Joshua’s guides cover
                price bands, HOA, build years, schools, and what each community actually feels like
                — from Westhaven to East Nashville.
              </p>
              <Link
                href="/neighborhoods"
                className="inline-block border border-black text-black text-sm font-bold px-6 py-3 tracking-wide hover:bg-black hover:text-white transition-colors"
              >
                Explore Neighborhood Guides →
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Relocation Questions
            </p>
            <h2 className="text-3xl font-black text-black tracking-tight mb-10">
              Moving to Middle Tennessee — FAQ
            </h2>
            <div className="space-y-6">
              {RELO_FAQS.map((f, i) => (
                <div key={i} className="bg-white p-8 border-l-4" style={{ borderColor: '#0A1628' }}>
                  <h3 className="text-base font-black text-black mb-3">{f.q}</h3>
                  <p className="text-sm text-[#6B6B6B] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA + lead form */}
        <div id="relocation-help" className="text-white py-16 px-4 sm:px-6 lg:px-8 scroll-mt-20" style={{ backgroundColor: '#0A1628' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Planning a move to Middle TN?</h2>
              <p className="mt-2 text-sm" style={{ color: '#A0A0A0' }}>
                Tell Joshua your timeline, budget, and what matters most — schools, commute, lifestyle —
                and he’ll build a relocation plan and a shortlist of the right cities and neighborhoods.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <a
                href="tel:6155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              >
                Call 615-551-2727
              </a>
              <a
                href="sms:+16155512727"
                className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
              >
                Text 615-551-2727
              </a>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-12 bg-white p-8 sm:p-10">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Start Your Relocation Plan
            </p>
            <SuburbLeadForm
              successTitle="Request Sent!"
              successMessage={
                <>
                  Joshua will reach out same-day to start your Middle Tennessee relocation plan. For
                  anything urgent, call{' '}
                  <a href="tel:6155512727" className="text-black font-semibold underline">615-551-2727</a>.
                </>
              }
              resetLabel="Submit Another"
            >
              <input type="hidden" name="lead_type" value="relocation" />
              <input type="hidden" name="source" value="moving-to-middle-tennessee" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Full Name *</label>
                  <input type="text" id="name" name="name" required placeholder="Jane Smith"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Phone *</label>
                  <input type="tel" id="phone" name="phone" required placeholder="615-555-0000"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Email Address *</label>
                <input type="email" id="email" name="email" required placeholder="you@example.com"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors" />
              </div>

              <div>
                <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">Tell Joshua about your move (optional)</label>
                <textarea id="body" name="body" rows={4}
                  placeholder="Where are you moving from? Timeline, budget, must-haves (school zone, commute, single-story, acreage)? Anything helps."
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y" />
              </div>

              <p className="text-xs text-[#A0A0A0]">* Joshua responds same-day. No spam, no pressure.</p>

              <button type="submit"
                className="w-full sm:w-auto text-white text-sm font-bold px-10 py-4 tracking-wide transition-colors"
                style={{ backgroundColor: '#C41E3A' }}>
                Build My Relocation Plan →
              </button>
            </SuburbLeadForm>
          </div>
        </div>
      </div>
    </>
  )
}
