'use client'

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { GOOGLE_REVIEW_URL } from '@/lib/reviews'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  children: ReactNode
  /** GA4 event_label. The /review page uses this to count review requests. */
  cta?: string
}

// Past-client review asks are the map-pack lever. Call and text clicks already
// fire gtag events; this does the same for the write-a-review link.
export default function ReviewRequestLink({
  children,
  cta = 'google-review',
  onClick,
  ...rest
}: Props) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof window !== 'undefined') {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void }
      if (w.gtag) {
        w.gtag('event', 'review_request', {
          event_category: 'engagement',
          event_label: cta,
        })
      }
    }
    onClick?.(e)
  }

  return (
    <a
      href={GOOGLE_REVIEW_URL}
      target="_blank"
      rel="noopener noreferrer"
      data-cta={cta}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  )
}
