'use client'

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: ReactNode
}

// Priority-1 conversion metric is "lead form submissions + click-to-call".
// Forms already fire gtag('event','generate_lead'); this wrapper does the
// equivalent for every tel:/sms: link so channel ROI is visible in GA4.
export default function TrackedTelLink({ href, children, onClick, ...rest }: Props) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const eventName = href.startsWith('sms:') ? 'text_click' : 'call_click'
    if (typeof window !== 'undefined') {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void }
      if (w.gtag) {
        const label = (rest as Record<string, unknown>)['data-cta']
        w.gtag('event', eventName, {
          event_category: 'engagement',
          event_label: typeof label === 'string' ? label : href,
        })
      }
    }
    onClick?.(e)
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
