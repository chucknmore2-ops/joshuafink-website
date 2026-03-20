'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/listings', label: 'Listings' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E8E8E8]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <span className="text-black font-black text-xl tracking-[0.2em] uppercase select-none">
            COMPASS
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-colors hover:text-black ${
                pathname === link.href
                  ? 'text-black border-b-2 border-black pb-0.5'
                  : 'text-[#6B6B6B]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-4">
          <a
            href="tel:6155512727"
            className="hidden sm:inline-flex items-center bg-black text-white text-sm font-semibold px-5 py-2.5 tracking-wide hover:bg-[#222] transition-colors"
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
        <div className="md:hidden bg-white border-t border-[#E8E8E8] px-4 pb-4 pt-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-3 text-sm font-medium border-b border-[#E8E8E8] last:border-0 ${
                pathname === link.href ? 'text-black' : 'text-[#6B6B6B]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="tel:6155512727"
            className="mt-4 block text-center bg-black text-white text-sm font-semibold px-5 py-3 tracking-wide"
          >
            Call Now — 615-551-2727
          </a>
        </div>
      )}
    </header>
  )
}
