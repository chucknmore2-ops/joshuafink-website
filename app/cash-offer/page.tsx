import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get a Cash Offer for Your Home | We Buy Houses Nashville TN',
  description:
    'Sell your house fast for cash in Nashville, Franklin, Brentwood, Spring Hill, Columbia, and all of Middle Tennessee. Any condition, any situation. Fair cash offer in 24 hours. Close in 7 days.',
  openGraph: {
    title: 'We Buy Houses Nashville — Cash Offer in 24 Hours',
    description:
      'Get a fair cash offer on your home in 24 hours. No repairs, no commissions, no hassle. Close in as little as 7 days. Serving all of Middle Tennessee.',
    url: 'https://joshuafink.com/cash-offer',
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

export default function CashOfferPage() {
  const formspreeUrl = '/api/contact'

  return (
    <div className="bg-white">

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
                Middle Tennessee Cash Home Buyers
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                We Buy Houses.<br />
                <span className="text-[#C0392B]">Any Condition.</span><br />
                Any Situation.
              </h1>
              <p className="text-[#A0A0A0] text-lg leading-relaxed mb-4">
                Fair cash offer in <strong className="text-white">24 hours</strong>. Close in as little as <strong className="text-white">7 days</strong>. No repairs, no commissions, no showings, no hassle.
              </p>
              <a
                href="tel:6155512727"
                className="inline-flex items-center gap-3 bg-[#C0392B] text-white text-xl font-black px-8 py-5 tracking-wide hover:bg-[#A93226] transition-colors mt-2"
              >
                📞 615-551-2727
              </a>
              <p className="text-[#666] text-sm mt-3">Call or text anytime — Joshua answers.</p>
            </div>

            {/* Right — inline form */}
            <div id="cash-offer-form" className="bg-white text-black p-8">
              <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-2">
                Get Your Cash Offer
              </p>
              <h2 className="text-2xl font-black text-black mb-6">
                Free. No Obligation. 24 Hours.
              </h2>

              <form action={formspreeUrl} method="POST" className="space-y-4">
                <input type="hidden" name="lead_type" value="sell" />
                <input type="hidden" name="subject" value="sell" />
                <input type="hidden" name="source" value="cash-offer" />

                <div>
                  <input
                    type="text" name="name" required placeholder="Your Name *"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="tel" name="phone" required placeholder="Your Phone Number *"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="text" name="property_address" required placeholder="Property Address *"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <select
                    name="situation"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors appearance-none"
                  >
                    <option value="">My Situation (optional)</option>
                    <option value="behind_payments">Behind on Payments</option>
                    <option value="foreclosure">Facing Foreclosure</option>
                    <option value="inherited">Inherited Property</option>
                    <option value="divorce">Going Through Divorce</option>
                    <option value="move_fast">Need to Move Fast</option>
                    <option value="repairs">Major Repairs Needed</option>
                    <option value="downsizing">Downsizing</option>
                    <option value="landlord">Done Being a Landlord</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#C0392B] text-white text-base font-black py-4 tracking-wide hover:bg-[#A93226] transition-colors"
                >
                  Get My Cash Offer →
                </button>
                <p className="text-xs text-[#A0A0A0] text-center">
                  No spam. No obligation. Joshua calls you personally.
                </p>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* Situations */}
      <div className="bg-[#F5F5F5] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 text-center">
            We Buy in Any Situation
          </p>
          <h2 className="text-3xl font-black text-black text-center tracking-tight mb-10">
            Whatever You&apos;re Going Through — We Can Help
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {situations.map((s) => (
              <div key={s.label} className="bg-white p-6 text-center">
                <span className="text-3xl block mb-3">{s.icon}</span>
                <p className="text-sm font-black text-black">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
          Simple Process
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-14">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* No fees comparison */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3 text-center">
            The Numbers
          </p>
          <h2 className="text-4xl font-black tracking-tight text-center mb-14">
            Traditional Sale vs. Cash Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Traditional */}
            <div className="border border-[#333] p-8">
              <h3 className="text-lg font-black mb-6 text-[#A0A0A0] uppercase tracking-widest">Traditional Sale</h3>
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
                  <div key={label} className="flex justify-between items-center border-b border-[#222] pb-3">
                    <span className="text-sm text-[#A0A0A0]">{label}</span>
                    <span className="text-sm font-bold text-[#C0392B]">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash offer */}
            <div className="border border-white p-8">
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
                  <div key={label} className="flex justify-between items-center border-b border-[#333] pb-3">
                    <span className="text-sm text-[#A0A0A0]">{label}</span>
                    <span className="text-sm font-bold text-white">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust signals */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E8E8E8]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#E8E8E8]">
            {[
              { value: '13+', label: 'Years in Middle TN' },
              { value: '100+', label: 'Homes Bought Annually' },
              { value: '7 Days', label: 'Fastest Close' },
              { value: '$0', label: 'Fees or Commissions' },
            ].map((s) => (
              <div key={s.label} className="py-8 px-6 text-center">
                <p className="text-3xl font-black text-black">{s.value}</p>
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
          Ready to Get Started?
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-4">
          Get Your Cash Offer Today
        </h2>
        <p className="text-[#6B6B6B] text-base mb-10 max-w-xl mx-auto">
          No pressure. No obligation. Just a fair offer and a straight answer within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:6155512727"
            className="inline-flex items-center justify-center bg-[#C0392B] text-white text-base font-black px-10 py-5 tracking-wide hover:bg-[#A93226] transition-colors"
          >
            📞 Call 615-551-2727
          </a>
          <a
            href="#cash-offer-form"
            className="inline-flex items-center justify-center border-2 border-black text-black text-base font-black px-10 py-5 tracking-wide hover:bg-black hover:text-white transition-colors"
          >
            Get My Cash Offer →
          </a>
        </div>
        <p className="text-[#A0A0A0] text-sm mt-6">
          Serving Nashville · Franklin · Brentwood · Spring Hill · Columbia · Murfreesboro · and all of Middle Tennessee
        </p>
      </div>

    </div>
  )
}
