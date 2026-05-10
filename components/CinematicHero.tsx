'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { HeroSlide } from '@/lib/hero-slides'
import TrustBadges from '@/components/TrustBadges'

const SLIDE_MS = 6500

export default function CinematicHero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    setIndex(0)
  }, [slides.length])

  useEffect(() => {
    if (reduceMotion || paused || slides.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearInterval(id)
  }, [slides.length, reduceMotion, paused])

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
      {/* Preload hint for first slide (improves LCP) */}
      {slides[0] && (
        // eslint-disable-next-line @next/next/no-head-element
        <link
          rel="preload"
          as="image"
          href={slides[0].imageUrl}
          // @ts-expect-error fetchpriority is valid but not yet in React types
          fetchpriority="high"
        />
      )}

      {/* Background stack — crossfading hero imagery */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="sync">
          {active && (
            <motion.div
              key={active.imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 1.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-0"
            >
              <div className={reduceMotion ? 'w-full h-full' : 'w-full h-full animate-ken-burns'}>
                <Image
                  src={active.imageUrl}
                  alt={active.alt}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cinematic gradient — stronger scrim for WCAG contrast over variable imagery */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
      <div className="absolute inset-x-0 bottom-0 z-10 h-1/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 pt-32">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.1 }}
          className="text-white font-semibold text-xs sm:text-sm tracking-[0.4em] uppercase mb-5 sm:mb-6 text-white/85"
        >
          Compass · Middle Tennessee
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display text-white leading-[0.95] tracking-tight mb-5 sm:mb-7 max-w-4xl"
        >
          <span className="block text-5xl sm:text-7xl lg:text-8xl font-black">Live Middle</span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl font-black italic text-white/95">
            Tennessee.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.35 }}
          className="text-lg sm:text-xl text-white/90 font-light leading-relaxed max-w-xl mb-10"
        >
          Joshua Fink — Affiliate Broker at Compass Real Estate. <span className="font-semibold text-white">17+ years</span>,{' '}
          <span className="font-semibold text-white">100+ homes sold annually</span>, and a home-field
          advantage in every Nashville suburb.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.45 }}
          className="mb-7"
        >
          <TrustBadges variant="dark" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row flex-wrap gap-3"
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
        </motion.div>

        {/* Slide caption (status + city, no price) + indicator dots */}
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1, delay: 0.8 }}
            className="mt-12 sm:mt-16 flex items-end justify-between gap-6 border-t border-white/15 pt-6"
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
          </motion.div>
        )}
      </div>

      {/* Bottom scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.8, delay: 1.1 }}
        className="hidden lg:flex absolute bottom-6 right-6 z-20 text-white/60 text-[10px] tracking-[0.3em] uppercase font-semibold items-center gap-3"
        aria-hidden="true"
      >
        <span>Scroll</span>
        <span className="block w-8 h-[1px] bg-white/40" />
      </motion.div>
    </section>
  )
}
