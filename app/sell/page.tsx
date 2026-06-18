import type { Metadata } from 'next'
import Link from 'next/link'
import SellForm from './SellForm'
import TrustBadges from '@/components/TrustBadges'
import { buildBreadcrumbSchema } from '@/lib/breadcrumbs'

export const metadata: Metadata = {
  title: 'Sell Your Home in Nashville',
  description:
    'Ready to sell? Get a free home valuation and expert guidance from Joshua Fink at Compass. Serving Nashville, Franklin, Brentwood, Spring Hill, and all of Middle Tennessee.',
  openGraph: {
    title: 'Sell Your Home | Joshua Fink Group',
    description:
      'Get a free, no-obligation home valuation from Joshua Fink — top-rated Compass agent in Middle Tennessee. Fast offers, local expertise, real results.',
    url: 'https://joshuafink.com/sell',
    siteName: 'Joshua Fink Group',
    type: 'website',
  },
}

const stats = [
  { value: '97%', label: 'List-to-Sale Price' },
  { value: '18', label: 'Avg. Days on Market' },
  { value: '$50M+', label: 'In Sales Volume' },
  { value: '5★', label: 'Avg. Client Rating' },
]

const steps = [
  {
    num: '01',
    title: 'Free Home Valuation',
    body: "Joshua analyzes recent comps, your neighborhood trends, and your home's specific features to give you an accurate, data-backed price range — not a Zestimate.",
  },
  {
    num: '02',
    title: 'Prep & Listing Strategy',
    body: 'Professional photography, targeted pricing, and a marketing plan built for your timeline. We position your home to attract serious buyers fast.',
  },
  {
    num: '03',
    title: 'Maximum Exposure',
    body: "Listed on MLS, Zillow, Realtor.com, Compass.com, and promoted via social and email to Joshua's buyer network across Middle Tennessee.",
  },
  {
    num: '04',
    title: 'Negotiate & Close',
    body: 'Joshua handles every offer, counter, inspection, and closing detail — so you walk away with the most money and the least stress.',
  },
]

const reasons = [
  {
    icon: '📍',
    title: 'Local Expert',
    body: 'Deep knowledge of Nashville, Franklin, Brentwood, Spring Hill, Columbia, and every pocket market in between.',
  },
  {
    icon: '⚡',
    title: 'Fast Results',
    body: "Most listings under contract within weeks, not months. Joshua's pricing strategy and buyer network make the difference.",
  },
  {
    icon: '💰',
    title: 'More Money',
    body: 'Compass agents close an average of 2.9% more than the competition. The right agent pays for themselves.',
  },
  {
    icon: '🔒',
    title: 'No Pressure',
    body: "Free valuation with zero obligation. If the numbers don't work for you right now, Joshua will tell you honestly.",
  },
]

const faqs = [
  {
    q: 'How long does it take to sell a home in Middle Tennessee?',
    a: "It depends on your suburb and price band, but Joshua's listings average 18 days on market versus 30+ for the broader Middle Tennessee MLS. Pricing strategy and Compass-network promotion are the biggest levers.",
  },
  {
    q: 'How do you decide what my home is worth?',
    a: "Joshua pulls live comps from the past 60–90 days within your subdivision, adjusts for square footage, lot, age, and condition, then layers in current absorption rate (how fast inventory is moving). You get a defensible price range, not a Zestimate.",
  },
  {
    q: 'What does Joshua charge to sell my home?',
    a: 'Compass commissions are negotiable and depend on the home and scope of service. Joshua will walk you through the full proposal — including what the buyer-side cooperating commission looks like — at the valuation appointment. There is no fee to get the valuation itself.',
  },
  {
    q: 'Can I sell without putting my home on the MLS?',
    a: 'Yes — Compass Private Exclusives let you market off-market to vetted buyer agents inside Compass before any public listing. It is a good fit if you want privacy, are testing a price point, or are not 100% committed yet.',
  },
  {
    q: "I don't want to do showings. Is there a faster option?",
    a: "Yes. Joshua also brings investor-direct cash offers for homeowners who want to skip showings, repairs, and contingencies entirely. It is a separate path from a traditional listing — see the cash-offer page for how it works.",
  },
  {
    q: 'Do I need to make repairs or updates before listing?',
    a: 'Sometimes — sometimes not. Joshua does a walkthrough first and tells you which $1,000 of work returns $5,000 at sale (and which work is wasted money). The goal is the highest net to you, not the prettiest house.',
  },
]

export default function SellPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  // HowTo schema for the 4-step "Sell with Joshua" process. Eligible for
  // Google's HowTo rich result and AI-overview citations on queries like
  // "how to sell a home in Tennessee" / "steps to sell house in Nashville".
  const howToLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Sell a Home in Middle Tennessee with Joshua Fink',
    description:
      "A 4-step process to sell your home in Middle Tennessee: free comp-backed valuation, listing prep + marketing strategy, maximum buyer exposure, and negotiation through to close.",
    totalTime: 'P30D',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0',
    },
    supply: [
      { '@type': 'HowToSupply', name: 'Recent home maintenance records (optional)' },
      { '@type': 'HowToSupply', name: 'Mortgage payoff statement from your lender' },
    ],
    tool: [
      { '@type': 'HowToTool', name: 'Compass MLS + agent-network distribution' },
      { '@type': 'HowToTool', name: 'Professional listing photography and 3D tour' },
    ],
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.body,
      url: `https://joshuafink.com/sell#step-${i + 1}`,
    })),
  }

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Sell', href: '/sell' },
  ])
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Selling Your Home
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl">
            Get the Most for Your Home.
          </h1>
          <p className="text-neutral-400 text-lg mt-4 max-w-xl leading-relaxed">
            Free home valuation. No obligation. Joshua Fink at Compass has the data, the network,
            and the strategy to sell fast and at top dollar.
          </p>
          <div className="mt-7">
            <TrustBadges variant="dark" />
          </div>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <a
              href="#seller-form"
              className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-lg active:scale-[0.98] text-center"
            >
              Get My Free Valuation
            </a>
            <a
              href="sms:+16155512727"
              className="inline-flex items-center justify-center border border-neutral-600 text-white text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98] text-center"
            >
              Text 615-551-2727
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

      {/* Stats bar */}
      <div className="border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-200">
            {stats.map((s) => (
              <div key={s.label} className="py-8 px-6 text-center">
                <p className="text-3xl font-black text-black">{s.value}</p>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          The Process
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-14">
          How It Works
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
            Why Work With Joshua
          </p>
          <h2 className="text-4xl font-black text-black tracking-tight mb-14">
            The Difference Is the Agent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((r) => (
              <div key={r.title} className="bg-white border border-neutral-200 rounded-2xl p-8 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-3xl">{r.icon}</span>
                <h3 className="text-base font-black text-black mt-4 mb-2">{r.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Seller Lead Form */}
      <div id="seller-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">

          {/* Left — context */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
              Free Valuation
            </p>
            <h2 className="text-4xl font-black text-black tracking-tight leading-tight mb-6">
              What Is Your Home Worth?
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed mb-8">
              Fill out the form and Joshua will personally reach out within a few hours with a
              no-obligation market analysis for your home — real comps, real numbers.
            </p>

            <div className="space-y-5">
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">Phone</p>
                <a href="tel:6155512727" className="text-xl font-black text-black hover:underline">
                  615-551-2727
                </a>
              </div>
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">Email</p>
                <a href="mailto:joshua@joshuafink.com" className="text-sm font-semibold text-black hover:underline">
                  joshua@joshuafink.com
                </a>
              </div>
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">Serving</p>
                <p className="text-sm text-neutral-600">
                  Nashville · Franklin · Brentwood<br />
                  Spring Hill · Columbia · Gallatin<br />
                  &amp; all of Middle Tennessee
                </p>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-6">
              Tell Us About Your Home
            </p>
            <SellForm />
          </div>
        </div>
      </div>

      {/* Two ways to sell — traditional vs cash offer */}
      <div className="bg-neutral-50 border-t border-neutral-200 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Your Options
          </p>
          <h2 className="text-4xl font-black text-black tracking-tight mb-3">
            Two Ways to Sell.
          </h2>
          <p className="text-neutral-600 text-base max-w-2xl mb-12 leading-relaxed">
            Most sellers come to Joshua for a traditional listing — the path that historically nets
            the most money. But if speed, certainty, or skipping showings matters more than top
            dollar, an investor cash offer may be a better fit. Both options start with the same
            free conversation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-neutral-200 rounded-2xl p-8">
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
                Traditional Listing
              </p>
              <h3 className="text-2xl font-black text-black mb-3">List with Joshua</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                MLS exposure, Compass-network promotion, professional photos, and the highest
                expected sale price. Best for sellers who can wait 2–6 weeks and want maximum net.
              </p>
              <a
                href="#seller-form"
                className="inline-flex items-center justify-center bg-black text-white text-sm font-bold px-6 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98]"
              >
                Get My Free Valuation
              </a>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl p-8">
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
                Cash Offer
              </p>
              <h3 className="text-2xl font-black text-black mb-3">Skip the Listing</h3>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                No showings, no repairs, no contingencies. Joshua taps a vetted investor network
                for a written cash offer typically within 72 hours. Best for inherited homes,
                relocations, or distressed properties.
              </p>
              <Link
                href="/cash-offer"
                className="inline-flex items-center justify-center bg-brand-crimson text-white text-sm font-bold px-6 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-brand-crimson-dark hover:shadow-md active:scale-[0.98]"
              >
                See Cash Offer Process →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Common Questions
          </p>
          <h2 className="text-4xl font-black text-black tracking-tight mb-10">
            Selling, Answered.
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

      {/* Bottom CTA strip */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Not ready to list yet?</h2>
            <p className="text-neutral-400 mt-2 text-sm">
              That&apos;s fine. The valuation is free and there&apos;s zero obligation to do anything with it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href="#seller-form"
              className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-md active:scale-[0.98] text-center"
            >
              Get My Valuation
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border border-neutral-600 text-white text-sm font-bold px-8 py-3 rounded-full tracking-wide transition-all duration-200 hover:border-white hover:bg-white/10 active:scale-[0.98] text-center"
            >
              Other Questions
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
