'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/listings', label: 'Listings' },
  { href: '/sell', label: 'Sell' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-black font-black text-xl tracking-[0.2em] uppercase select-none">
            COMPASS
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors duration-150 hover:text-black ${
                pathname === link.href
                  ? 'text-black border-b-2 border-black pb-0.5'
                  : 'text-neutral-500'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTAs + hamburger */}
        <div className="flex items-center gap-3">
          {/* Cash Offer — primary pill CTA, visible on all screens ≥ sm */}
          <Link
            href="/cash-offer"
            className="hidden sm:inline-flex items-center bg-black text-white text-sm font-semibold px-5 py-2 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98]"
          >
            Cash Offer
          </Link>

          {/* Call Now — outline pill, desktop only */}
          <a
            href="tel:6155512727"
            className="hidden md:inline-flex items-center border border-neutral-300 text-black text-sm font-semibold px-5 py-2 rounded-full tracking-wide transition-all duration-200 hover:border-black hover:shadow-sm active:scale-[0.98]"
          >
            Call Now
          </a>

          {/* Hamburger */}
          <button
            className="md:hidden p-2 text-black"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className="sr-only">Menu</span>
            <div className="w-6 flex flex-col gap-1.5">
              <span
                className={`block h-0.5 bg-black transition-all duration-200 ${
                  menuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 bg-black transition-all duration-200 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 bg-black transition-all duration-200 ${
                  menuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 px-4 pb-4 pt-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-3 text-sm font-medium border-b border-neutral-100 last:border-0 ${
                pathname === link.href ? 'text-black' : 'text-neutral-500'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/cash-offer"
              onClick={() => setMenuOpen(false)}
              className="block text-center bg-black text-white text-sm font-semibold px-5 py-3 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800"
            >
              Get a Cash Offer
            </Link>
            <a
              href="tel:6155512727"
              className="block text-center border border-neutral-300 text-black text-sm font-semibold px-5 py-3 rounded-full tracking-wide transition-all duration-200 hover:border-black"
            >
              Call 615-551-2727
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
