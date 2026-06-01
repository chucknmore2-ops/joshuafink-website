'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { HeroSlide } from '@/lib/hero-slides'
import TrustBadges from '@/components/TrustBadges'

const SLIDE_MS = 6500

export default function CinematicHero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setIndex(0)
  }, [slides.length])

  useEffect(() => {
    if (paused || slides.length <= 1) return
    // Respect reduced-motion preference: don't auto-advance.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [slides.length, paused])

  const active = slides[index]

  return (
    <section
      className="relative bg-black min-h-[92vh] flex items-end overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured Middle Tennessee properties"
    >
      {/* Background stack — CSS opacity crossfade between hero images */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, i) => (
          <div
            key={slide.imageUrl}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-editorial motion-reduce:transition-none ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={i === index ? undefined : 'true'}
          >
            <div className="w-full h-full animate-ken-burns motion-reduce:animate-none">
              <Image
                src={slide.imageUrl}
                alt={slide.alt}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Cinematic gradient — stronger scrim for WCAG contrast over variable imagery */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 pt-32">
        <p
          className="text-white font-semibold text-xs sm:text-sm tracking-[0.4em] uppercase mb-5 sm:mb-6 text-white/85 animate-fade-in motion-reduce:animate-none"
          style={{ animationDelay: '100ms' }}
        >
          Compass · Middle Tennessee
        </p>

        <h1
          className="font-display text-white leading-[0.95] tracking-tight mb-5 sm:mb-7 max-w-4xl animate-fade-in-up motion-reduce:animate-none"
          style={{ animationDelay: '200ms' }}
        >
          <span className="block text-5xl sm:text-7xl lg:text-8xl font-black">Live Middle</span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl font-black italic text-white/95">
            Tennessee.
          </span>
        </h1>

        <p
          className="text-lg sm:text-xl text-white/90 font-light leading-relaxed max-w-xl mb-10 animate-fade-in-up motion-reduce:animate-none"
          style={{ animationDelay: '350ms' }}
        >
          Joshua Fink — Affiliate Broker at Compass Real Estate. <span className="font-semibold text-white">17+ years</span>,{' '}
          <span className="font-semibold text-white">100+ homes sold annually</span>, and a home-field
          advantage in every Nashville suburb.
        </p>

        <div className="mb-7 animate-fade-in-up motion-reduce:animate-none" style={{ animationDelay: '450ms' }}>
          <TrustBadges variant="dark" />
        </div>

        <div
          className="flex flex-col sm:flex-row flex-wrap gap-3 animate-fade-in-up motion-reduce:animate-none"
          style={{ animationDelay: '500ms' }}
        >
          <Link
            href="/sell"
            className="inline-flex items-center justify-center bg-white text-black text-sm font-bold px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-100 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            What&apos;s My Home Worth?
          </Link>
          <Link
            href="/cash-offer"
            className="inline-flex items-center justify-center bg-brand-crimson text-white text-sm font-bold px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-brand-crimson-dark hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Get a Cash Offer
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center bg-transparent border border-white/50 text-white text-sm font-semibold px-8 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-white/10 hover:border-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Browse Listings <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Slide caption (status + city, no price) + indicator dots */}
        {active && (
          <div
            className="mt-12 sm:mt-16 flex items-end justify-between gap-6 border-t border-white/15 pt-6 animate-fade-in motion-reduce:animate-none"
            style={{ animationDelay: '800ms' }}
          >
            <div
              className="min-w-0"
              role="region"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] text-white/60 uppercase mb-2">
                {paused ? 'Paused · Featured Property' : 'Featured Property'}
              </p>
              <Link
                href={active.href}
                target={active.href.startsWith('http') ? '_blank' : undefined}
                rel={active.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="group inline-flex items-baseline gap-3 flex-wrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm"
              >
                <span className="text-white font-display font-semibold text-lg sm:text-2xl group-hover:underline underline-offset-4">
                  {active.status}
                </span>
                <span className="text-white/75 text-sm sm:text-base">{active.cityShort}</span>
                <span className="text-white/85 text-sm sm:text-base font-medium">
                  · View details <span aria-hidden="true">→</span>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-1 shrink-0" role="tablist" aria-label="Select featured property">
              {slides.map((slide, i) => (
                <button
                  key={slide.imageUrl}
                  type="button"
                  role="tab"
                  aria-label={`Show property ${i + 1} of ${slides.length}`}
                  aria-selected={i === index}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                  className="group relative p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-md"
                >
                  <span
                    className={`block h-[3px] rounded-full transition-all duration-500 ${
                      i === index ? 'w-10 bg-white' : 'w-4 bg-white/40 group-hover:bg-white/70'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom scroll hint */}
      <div
        className="hidden lg:flex absolute bottom-6 right-6 z-20 text-white/60 text-[10px] tracking-[0.3em] uppercase font-semibold items-center gap-3 animate-fade-in motion-reduce:animate-none"
        style={{ animationDelay: '1100ms' }}
        aria-hidden="true"
      >
        <span>Scroll</span>
        <span className="block w-8 h-[1px] bg-white/40" />
      </div>
    </section>
  )
}
