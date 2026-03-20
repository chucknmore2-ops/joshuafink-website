import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-black text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <span className="text-white font-black text-lg tracking-[0.2em] uppercase">
              COMPASS
            </span>
            <p className="mt-3 text-[#A0A0A0] text-sm leading-relaxed">
              Joshua Fink<br />
              Affiliate Broker | Middle Tennessee<br />
              Compass Real Estate
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-[#A0A0A0] mb-4">
              Navigate
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/listings', label: 'Listings' },
                { href: '/about', label: 'About' },
                { href: '/blog', label: 'Blog' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#A0A0A0] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-[#A0A0A0] mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-[#A0A0A0]">
              <li>
                <a
                  href="tel:6155512727"
                  className="hover:text-white transition-colors"
                >
                  615-551-2727
                </a>
              </li>
              <li>
                <a
                  href="mailto:joshua@joshuafink.com"
                  className="hover:text-white transition-colors"
                >
                  joshua@joshuafink.com
                </a>
              </li>
              <li>
                <a
                  href="https://www.compass.com/agents/joshua-fink/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Compass Profile →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#222] pt-6 text-xs text-[#6B6B6B] space-y-2">
          <p>© {year} Joshua Fink. All rights reserved.</p>
          <p>
            Joshua Fink is a licensed real estate agent with Compass Real Estate in Tennessee. Compass is a licensed real estate broker. All material presented herein is intended for informational purposes only. Information is compiled from sources deemed reliable but is subject to errors, omissions, changes in price, condition, sale, or withdrawal without notice. No statement is made as to the accuracy of any description. All measurements and square footages are approximate.
          </p>
        </div>
      </div>
    </footer>
  )
}
