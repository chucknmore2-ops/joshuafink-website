import type { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Joshua Fink',
  description:
    'Get in touch with Joshua Fink — Affiliate Broker at Compass Real Estate. Call 615-551-2727 or send a message for buying, selling, or investment guidance in Middle Tennessee.',
}

export default function ContactPage() {
  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Let&apos;s Talk
          </p>
          <h1 className="text-5xl font-black tracking-tight">Contact Joshua</h1>
          <p className="text-neutral-400 text-lg mt-2">
            Ready to buy, sell, or just have questions? Reach out anytime.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Contact info */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-6">
              Direct Contact
            </p>

            <div className="space-y-6">
              <div className="border-l-2 border-black pl-5">
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">
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
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">
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
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">
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
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">
                  Serving
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Nashville · Brentwood · Franklin<br />
                  Gallatin · Madison · Columbia<br />
                  &amp; all of Middle Tennessee
                </p>
              </div>
            </div>

            <div className="mt-10 bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
              <p className="text-sm font-bold text-black mb-2">Ready to close?</p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Joshua responds quickly. Most clients hear back within the hour during business
                hours. For urgent matters, call directly.
              </p>
            </div>
          </div>

          {/* Contact form — client component */}
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-6">
              Send a Message
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}
