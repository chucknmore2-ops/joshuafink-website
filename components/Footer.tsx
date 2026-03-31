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

            <h3 className="text-xs font-semibold tracking-widest uppercase text-[#A0A0A0] mt-6 mb-4">
              Follow
            </h3>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/joshuafinkgroup"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-[#A0A0A0] hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6h1.7V4.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.3V11H8v3h2.4v8h3.1z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/joshuafinkgroup"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-[#A0A0A0] hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/joshuafinkgroup/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-[#A0A0A0] hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M6.9 8.6A1.9 1.9 0 1 1 6.9 4.8a1.9 1.9 0 0 1 0 3.8zM5.3 9.9h3.1V20H5.3V9.9zm5 0h3v1.4h.1c.4-.8 1.5-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.9V20h-3.1v-4.8c0-1.1 0-2.6-1.6-2.6s-1.8 1.2-1.8 2.5V20h-3.1V9.9z" />
                </svg>
              </a>
              <a
                href="https://x.com/JoshuaFinkGroup"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
                className="text-[#A0A0A0] hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M18.9 3H22l-6.8 7.7L23 21h-6.2l-4.8-6.3L6.4 21H3.3l7.3-8.3L1 3h6.4l4.3 5.7L18.9 3zm-1.1 16h1.7L6.5 4.9H4.6L17.8 19z" />
                </svg>
              </a>
            </div>
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
