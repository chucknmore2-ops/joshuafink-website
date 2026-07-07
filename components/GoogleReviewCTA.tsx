import { GOOGLE_REVIEW_URL, hasGoogleReviewLink } from '@/lib/reviews'

type Props = {
  /** 'dark' = white card on black bg; 'light' = black card on white bg. */
  variant?: 'dark' | 'light'
  heading?: string
  body?: string
}

/**
 * "Leave Joshua a Google review" call-to-action.
 *
 * Google reviews power the local map pack, so growing them is the top local-SEO
 * lever. This component is config-gated: it renders NOTHING until
 * `GOOGLE_REVIEW_URL` is set in lib/reviews.ts, so it is safe to place anywhere
 * and merge before the link exists — it simply stays hidden until activated.
 */
export default function GoogleReviewCTA({
  variant = 'light',
  heading = 'Loved working with Joshua?',
  body = 'A quick Google review takes 30 seconds and helps other Middle Tennessee families find him. Thank you!',
}: Props) {
  if (!hasGoogleReviewLink) return null

  const isDark = variant === 'dark'
  const wrap = isDark
    ? 'bg-black text-white'
    : 'bg-neutral-50 text-black border border-neutral-200'
  const btn = isDark
    ? 'bg-white text-black hover:bg-neutral-200'
    : 'bg-black text-white hover:bg-neutral-800'
  const sub = isDark ? 'text-neutral-400' : 'text-neutral-600'

  return (
    <div className={`${wrap} rounded-2xl p-8 sm:p-10 text-center`}>
      <div className="text-3xl mb-3" aria-hidden="true">⭐️</div>
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">{heading}</h2>
      <p className={`${sub} text-sm max-w-xl mx-auto mb-8 leading-relaxed`}>{body}</p>
      <a
        href={GOOGLE_REVIEW_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} inline-flex items-center justify-center text-sm font-black px-10 py-4 rounded-full tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-crimson focus-visible:ring-offset-2`}
      >
        <span aria-hidden="true">★</span>&nbsp;Leave a Google Review&nbsp;<span aria-hidden="true">→</span>
      </a>
    </div>
  )
}
