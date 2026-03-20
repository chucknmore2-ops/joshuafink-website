import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Joshua Fink',
  description:
    'Get in touch with Joshua Fink — Affiliate Broker at Compass Real Estate. Call 615-551-2727 or send a message for buying, selling, or investment guidance in Middle Tennessee.',
}

export default function ContactPage() {
  const mailtoBase = 'mailto:joshua@joshuafink.com'

  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Let&apos;s Talk
          </p>
          <h1 className="text-5xl font-black tracking-tight">Contact Joshua</h1>
          <p className="text-[#A0A0A0] text-lg mt-2">
            Ready to buy, sell, or just have questions? Reach out anytime.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Direct Contact
            </p>

            <div className="space-y-6">
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">
                  Phone
                </p>
                <a
                  href="tel:6155512727"
                  className="text-xl font-black text-black hover:underline"
                >
                  615-551-2727
                </a>
              </div>

              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">
                  Email
                </p>
                <a
                  href="mailto:joshua@joshuafink.com"
                  className="text-base font-semibold text-black hover:underline break-all"
                >
                  joshua@joshuafink.com
                </a>
              </div>

              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">
                  Compass Profile
                </p>
                <a
                  href="https://www.compass.com/agents/joshua-fink/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-black hover:underline"
                >
                  compass.com/agents/joshua-fink →
                </a>
              </div>

              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mb-1">
                  Serving
                </p>
                <p className="text-sm text-[#444] leading-relaxed">
                  Nashville · Brentwood · Franklin<br />
                  Gallatin · Madison · Columbia<br />
                  &amp; all of Middle Tennessee
                </p>
              </div>
            </div>

            <div className="mt-10 bg-[#F5F5F5] p-6">
              <p className="text-sm font-bold text-black mb-2">Ready to close?</p>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Joshua responds quickly. Most clients hear back within the hour during business
                hours. For urgent matters, call directly.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-6">
              Send a Message
            </p>

            <form
              action={mailtoBase}
              method="get"
              className="space-y-5"
            >
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
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="615-555-0000"
                    className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
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
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                >
                  I&apos;m Looking To
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors appearance-none"
                >
                  <option value="">Select an option...</option>
                  <option value="buy">Buy a Home</option>
                  <option value="sell">Sell a Home</option>
                  <option value="both">Buy &amp; Sell</option>
                  <option value="invest">Investment Property</option>
                  <option value="rent">Rental / Landlord</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="body"
                  className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="body"
                  name="body"
                  required
                  rows={6}
                  placeholder="Tell Joshua what you're looking for, your timeline, budget, or any questions you have..."
                  className="w-full border border-[#E8E8E8] px-4 py-3 text-sm text-black placeholder-[#A0A0A0] focus:outline-none focus:border-black transition-colors resize-y"
                />
              </div>

              <p className="text-xs text-[#A0A0A0]">
                * This form opens your email client with a pre-filled message. For immediate
                response, call{' '}
                <a href="tel:6155512727" className="underline text-black">
                  615-551-2727
                </a>
                .
              </p>

              <button
                type="submit"
                className="w-full sm:w-auto bg-black text-white text-sm font-bold px-10 py-4 tracking-wide hover:bg-[#222] transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
