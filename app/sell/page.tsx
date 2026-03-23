import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sell Your Home in Nashville | Joshua Fink — Compass Real Estate',
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
    body: 'Joshua analyzes recent comps, your neighborhood trends, and your home\'s specific features to give you an accurate, data-backed price range — not a Zestimate.',
  },
  {
    num: '02',
    title: 'Prep & Listing Strategy',
    body: 'Professional photography, targeted pricing, and a marketing plan built for your timeline. We position your home to attract serious buyers fast.',
  },
  {
    num: '03',
    title: 'Maximum Exposure',
    body: 'Listed on MLS, Zillow, Realtor.com, Compass.com, and promoted via social and email to Joshua\'s buyer network across Middle Tennessee.',
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
    body: 'Most listings under contract within weeks, not months. Joshua\'s pricing strategy and buyer network make the difference.',
  },
  {
    icon: '💰',
    title: 'More Money',
    body: 'Compass agents close an average of 2.9% more than the competition. The right agent pays for themselves.',
  },
  {
    icon: '🔒',
    title: 'No Pressure',
    body: 'Free valuation with zero obligation. If the numbers don\'t work for you right now, Joshua will tell you honestly.',
  },
]

export default function SellPage() {
  const formspreeUrl = 'https://formspree.io/f/xjgazeqa'

  return (
    <div className="bg-white">

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Selling Your Home
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] max-w-3xl">
            Get the Most for Your Home.
          </h1>
          <p className="text-[#A0A0A0] text-lg mt-4 max-w-xl leading-relaxed">
            Free home valuation. No obligation. Joshua Fink at Compass has the data, the network,
            and the strategy to sell fast and at top dollar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href="#seller-form"
              className="inline-block bg-white text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#E8E8E8] transition-colors text-center"
            >
              Get My Free Valuation
            </a>
            <a
              href="tel:6155512727"
              className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
            >
              Call 615-551-2727
            </a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-[#E8E8E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E8E8E8]">
            {stats.map((s) => (
              <div key={s.label} className="py-8 px-6 text-center">
                <p className="text-3xl font-black text-black">{s.value}</p>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
          The Process
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-14">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="border-t-2 border-black pt-6">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
                Step {step.num}
              </p>
              <h3 className="text-lg font-black text-black mb-3">{step.title}</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Why Joshua */}
      <div className="bg-[#F5F5F5] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Why Work With Joshua
          </p>
          <h2 className="text-4xl font-black text-black tracking-tight mb-14">
            The Difference Is the Agent
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {reasons.map((r) => (
              <div key={r.title} className="bg-white p-8">
                <span className="text-3xl">{r.icon}</span>
                <h3 className="text-base font-black text-black mt-4 mb-2">{r.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{r.body}</p>
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
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
              Free Valuation
            </p>
            <h2 className="text-4xl font-black text-black tracking-tight leading-tight mb-6">
              What Is Your Home Worth?
            </h2>
            <p className="text-[#6B6B6B] text-sm leading-relaxed mb-8">
              Fill out the form and Joshua will personally reach out within a few hours with a
              no-obligation market analysis for your home — real comps, real numbers.
            </p>

            <div className="space-y-5">
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Phone</p>
                <a href="tel:6155512727" className="text-xl font-black text-black hover:underline">
                  615-551-2727
                </a>
              </div>
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Email</p>
                <a href="mailto:joshua@joshuafink.com" className="text-sm font-semibold text-black hover:underline">
                  joshua@joshuafink.com
                </a>
              </div>
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">Serving</p>
                <p className="text-sm text-[#444]">
                  Nashville · Franklin · Brentwood<br />
                  Spring Hill · Columbia · Gallatin<br />
                  &amp; all of Middle Tennessee
                </p>
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Tell Us About Your Home
            </p>
            <form action={formspreeUrl} method="POST" className="space-y-5">

              {/* Hidden fields to tag this as a seller lead */}
              <input type="hidden" name="_subject" value="🏡 New Seller Lead — joshuafink.com" />
              <input type="hidden" name="lead_type" value="seller" />
              <input type="hidden" name="_next" value="https://joshuafink.com/sell" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text" id="name" name="name" required placeholder="Jane Smith"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel" id="phone" name="phone" required placeholder="615-555-0000"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                  Email Address *
                </label>
                <input
                  type="email" id="email" name="email" required placeholder="you@example.com"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label htmlFor="property_address" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                  Property Address *
                </label>
                <input
                  type="text" id="property_address" name="property_address" required
                  placeholder="123 Main St, Nashville, TN 37201"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="bedrooms" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Bedrooms
                  </label>
                  <select
                    id="bedrooms" name="bedrooms"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors appearance-none"
                  >
                    <option value="">—</option>
                    <option>1</option>
                    <option>2</option>
                    <option>3</option>
                    <option>4</option>
                    <option>5+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bathrooms" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Bathrooms
                  </label>
                  <select
                    id="bathrooms" name="bathrooms"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors appearance-none"
                  >
                    <option value="">—</option>
                    <option>1</option>
                    <option>1.5</option>
                    <option>2</option>
                    <option>2.5</option>
                    <option>3</option>
                    <option>3.5+</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="timeline" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                    Timeline
                  </label>
                  <select
                    id="timeline" name="timeline"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors appearance-none"
                  >
                    <option value="">—</option>
                    <option value="asap">ASAP</option>
                    <option value="1-3mo">1–3 months</option>
                    <option value="3-6mo">3–6 months</option>
                    <option value="6mo+">6+ months</option>
                    <option value="just-curious">Just curious</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="body" className="block text-xs font-semibold text-black tracking-widest uppercase mb-2">
                  Anything Else? (optional)
                </label>
                <textarea
                  id="body" name="body" rows={4}
                  placeholder="Condition of the home, recent updates, situation you're working through — anything helps..."
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y"
                />
              </div>

              <p className="text-xs text-[#A0A0A0]">
                * Joshua responds same-day. No spam, no pressure. Just real numbers.
              </p>

              <button
                type="submit"
                className="w-full sm:w-auto bg-black text-white text-sm font-bold px-10 py-4 tracking-wide hover:bg-[#222] transition-colors"
              >
                Get My Free Valuation →
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom CTA strip */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Not ready to list yet?</h2>
            <p className="text-[#A0A0A0] mt-2 text-sm">
              That&apos;s fine. The valuation is free and there&apos;s zero obligation to do anything with it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            <a
              href="#seller-form"
              className="inline-block bg-white text-black text-sm font-bold px-8 py-4 tracking-wide hover:bg-[#E8E8E8] transition-colors text-center"
            >
              Get My Valuation
            </a>
            <Link
              href="/contact"
              className="inline-block border border-white text-white text-sm font-bold px-8 py-4 tracking-wide hover:bg-white hover:text-black transition-colors text-center"
            >
              Other Questions
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
