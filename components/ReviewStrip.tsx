import { reviews, reviewStats, type Review } from '@/lib/reviews'

type Variant = 'light' | 'dark'

function Stars({ n, variant }: { n: number; variant: Variant }) {
  const clamped = Math.min(5, Math.max(0, Math.round(n)))
  const colorClass = variant === 'dark' ? 'text-yellow-300' : 'text-yellow-500'
  return (
    <span aria-label={`${clamped} out of 5 stars`} className={`${colorClass} text-sm tracking-wider`}>
      {'★★★★★'.slice(0, clamped)}
    </span>
  )
}

export default function ReviewStrip({
  limit = 3,
  variant = 'light',
  showHeader = true,
  filter,
}: {
  limit?: number
  variant?: Variant
  showHeader?: boolean
  filter?: (r: Review) => boolean
}) {
  const picked = (filter ? reviews.filter(filter) : reviews).slice(0, limit)
  const isDark = variant === 'dark'

  return (
    <section
      className={isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}
      aria-labelledby={showHeader ? 'review-strip-heading' : undefined}
      aria-label={showHeader ? undefined : 'Client reviews'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {showHeader && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <p className={`text-xs font-semibold tracking-widest uppercase mb-3 ${
                isDark ? 'text-white/60' : 'text-neutral-500'
              }`}>
                What Clients Say
              </p>
              <h2
                id="review-strip-heading"
                className="text-3xl sm:text-4xl font-black tracking-tight"
              >
                Rated <span className="font-display italic font-semibold">
                  {reviewStats.rating.toFixed(1)}/5.0
                </span> across {reviewStats.total}+ reviews
              </h2>
            </div>
            <a
              href={reviewStats.zillowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex text-sm font-semibold underline underline-offset-4 hover:no-underline self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 rounded-sm ${
                isDark
                  ? 'text-white focus-visible:ring-white'
                  : 'text-black focus-visible:ring-black'
              }`}
            >
              Read all {reviewStats.total}+ reviews on Zillow →
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {picked.map((r) => (
            <figure
              key={`${r.reviewer}-${r.date}`}
              className={`rounded-2xl p-6 border transition-shadow hover:shadow-lg ${
                isDark
                  ? 'border-white/15 bg-white/[0.03]'
                  : 'border-neutral-200 bg-white'
              }`}
            >
              <Stars n={r.rating} variant={variant} />
              <blockquote className={`mt-4 text-base leading-relaxed ${
                isDark ? 'text-white/90' : 'text-neutral-700'
              }`}>
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <figcaption
                className={`mt-5 pt-5 border-t ${isDark ? 'border-white/10' : 'border-neutral-200'}`}
              >
                <p className="font-bold text-sm">{r.reviewer}</p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-white/60' : 'text-neutral-500'}`}>
                  {r.transaction} · {r.date}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
