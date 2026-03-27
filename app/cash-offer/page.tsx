import type { Metadata } from 'next'
import CashOfferForm from './CashOfferForm'

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
  return (
    <div className="bg-white">

      {/* Hero */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — copy */}
            <div>
              <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
                Middle Tennessee Cash Home Buyers
              </p>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                We Buy Houses.<br />
                <span className="text-neutral-400">Any Condition.</span><br />
                Any Situation.
              </h1>
              <p className="text-neutral-400 text-lg leading-relaxed mb-4">
                Fair cash offer in <strong className="text-white">24 hours</strong>. Close in as little as <strong className="text-white">7 days</strong>. No repairs, no commissions, no showings, no hassle.
              </p>
              <a
                href="tel:6155512727"
                className="inline-flex items-center gap-3 bg-white text-black text-xl font-black px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-lg active:scale-[0.98] mt-2"
              >
                📞 615-551-2727
              </a>
              <p className="text-neutral-500 text-sm mt-3">Call or text anytime — Joshua answers.</p>
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
          <h2 className="text-3xl font-black text-black text-center tracking-tight mb-10">
            Whatever You&apos;re Going Through — We Can Help
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {situations.map((s) => (
              <div key={s.label} className="bg-white border border-neutral-200 rounded-2xl p-6 text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <span className="text-3xl block mb-3">{s.icon}</span>
                <p className="text-sm font-black text-black">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
          Simple Process
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-14">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* No fees comparison */}
      <div className="bg-black text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3 text-center">
            The Numbers
          </p>
          <h2 className="text-4xl font-black tracking-tight text-center mb-14">
            Traditional Sale vs. Cash Offer
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
            <div className="border border-white rounded-2xl p-8">
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

      {/* Trust signals */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-200">
            {[
              { value: '13+', label: 'Years in Middle TN' },
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

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-4">
          Ready to Get Started?
        </p>
        <h2 className="text-4xl font-black text-black tracking-tight mb-4">
          Get Your Cash Offer Today
        </h2>
        <p className="text-neutral-500 text-base mb-10 max-w-xl mx-auto">
          No pressure. No obligation. Just a fair offer and a straight answer within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:6155512727"
            className="inline-flex items-center justify-center bg-black text-white text-base font-black px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-lg active:scale-[0.98]"
          >
            📞 Call 615-551-2727
          </a>
          <a
            href="#cash-offer-form"
            className="inline-flex items-center justify-center border-2 border-black text-black text-base font-black px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-black hover:text-white active:scale-[0.98]"
          >
            Get My Cash Offer →
          </a>
        </div>
        <p className="text-neutral-400 text-sm mt-6">
          Serving Nashville · Franklin · Brentwood · Spring Hill · Columbia · Murfreesboro · and all of Middle Tennessee
        </p>
      </div>

    </div>
  )
}
