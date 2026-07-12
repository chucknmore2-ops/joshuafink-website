'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import TrackedTelLink from '@/components/TrackedTelLink'

// Persistent call-to-action — the fastest path to a lead is a phone call,
// so a click/tap-to-call link stays one action away on every page.
//   • Mobile: full-width sticky bar pinned to the bottom of the viewport.
//   • Desktop (md+): compact floating pill pinned to the bottom-right,
//     so long scroll-heavy pages (neighborhood guides, cash-offer, blog)
//     don't force visitors back up to the navbar to call.
//
// Hidden on /admin so neither element overlaps the dashboard's controls.

const TEL = '6155512727'
const TEL_DISPLAY = '(615) 551-2727'

export default function MobileCallCTA() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  // On buyer-intent pages (listings, buy, neighborhoods), texting converts
  // better than a cash-offer pitch, so swap the secondary CTA for an SMS link.
  // Also swap on cash-offer and sell pages — the Cash Offer link would be
  // self-referential there, so a Text Joshua CTA is the higher-value action.
  const preferText =
    pathname?.startsWith('/listings') ||
    pathname?.startsWith('/buy') ||
    pathname?.startsWith('/neighborhoods') ||
    pathname?.startsWith('/homes-near') ||
    pathname?.startsWith('/cash-offer') ||
    pathname?.startsWith('/sell')

  return (
    <>
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      role="region"
      aria-label="Quick contact"
    >
      <div className="flex items-stretch">
        <TrackedTelLink
          href={`tel:${TEL}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-black text-white text-sm font-bold tracking-wide active:scale-[0.98] transition-transform"
          aria-label={`Call Joshua Fink at ${TEL_DISPLAY}`}
          data-cta="mobile-sticky-call"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2z" />
          </svg>
          Call Joshua · {TEL_DISPLAY}
        </TrackedTelLink>
        {preferText ? (
          <TrackedTelLink
            href={`sms:+1${TEL}`}
            className="flex items-center justify-center gap-1.5 px-4 py-3.5 border-l border-neutral-200 bg-brand-crimson text-white text-sm font-bold tracking-wide active:scale-[0.98] transition-transform"
            aria-label={`Text Joshua Fink at ${TEL_DISPLAY}`}
            data-cta="mobile-sticky-text"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2zm3 6h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
            </svg>
            Text Joshua
          </TrackedTelLink>
        ) : (
          <Link
            href="/cash-offer"
            className="flex items-center justify-center px-4 py-3.5 border-l border-neutral-200 bg-brand-crimson text-white text-sm font-bold tracking-wide active:scale-[0.98] transition-transform"
            aria-label="Get a cash offer"
            data-cta="mobile-sticky-cash"
          >
            Cash Offer
          </Link>
        )}
      </div>
    </div>
    <div
      className="hidden md:flex fixed bottom-6 right-6 z-40 items-stretch rounded-full border border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_8px_28px_rgba(0,0,0,0.14)] overflow-hidden"
      role="region"
      aria-label="Quick contact"
    >
      <TrackedTelLink
        href={`tel:${TEL}`}
        className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-bold tracking-wide hover:bg-neutral-800 transition-colors"
        aria-label={`Call Joshua Fink at ${TEL_DISPLAY}`}
        data-cta="desktop-floating-call"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
          aria-hidden="true"
        >
          <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.24 1.02l-2.21 2.2z" />
        </svg>
        {TEL_DISPLAY}
      </TrackedTelLink>
      {preferText ? (
        <TrackedTelLink
          href={`sms:+1${TEL}`}
          className="flex items-center gap-1.5 px-3 py-2.5 border-l border-neutral-200 bg-brand-crimson text-white text-sm font-bold tracking-wide hover:brightness-110 transition"
          aria-label={`Text Joshua Fink at ${TEL_DISPLAY}`}
          data-cta="desktop-floating-text"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2zm3 6h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
          </svg>
          Text
        </TrackedTelLink>
      ) : (
        <Link
          href="/cash-offer"
          className="flex items-center px-3 py-2.5 border-l border-neutral-200 bg-brand-crimson text-white text-sm font-bold tracking-wide hover:brightness-110 transition"
          aria-label="Get a cash offer"
          data-cta="desktop-floating-cash"
        >
          Cash Offer
        </Link>
      )}
    </div>
    </>
  )
}
