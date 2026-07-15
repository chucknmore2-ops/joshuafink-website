import type { Metadata } from 'next'
import GoogleReviewCTA from '@/components/GoogleReviewCTA'
import { hasGoogleReviewLink } from '@/lib/reviews'
import TrackedTelLink from '@/components/TrackedTelLink'

// Shareable "leave a review" landing page. Joshua sends past clients here after
// closing (text/email/business card/closing gift) instead of the raw g.page
// link — a clean joshuafink.com/review URL is easier to share, keeps the ask
// on-brand, and lets the button's GA click-tracking measure review requests.
//
// noindex: this is a utility/share page, not organic-search content, so it's
// kept out of the index and the sitemap (it isn't in lib/site-urls.ts).
export const metadata: Metadata = {
  title: 'Leave a Review | Joshua Fink Group',
  description:
    'Share your experience working with Joshua Fink — it takes about 30 seconds and helps other Middle Tennessee families find a realtor they can trust.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://www.joshuafink.com/review' },
}

export default function ReviewPage() {
  return (
    <div className="bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-3">
            Thank you
          </p>
          <h1 className="text-4xl font-black text-black tracking-tight mb-4">
            Enjoyed working with Joshua?
          </h1>
          <p className="text-neutral-600 leading-relaxed">
            Your experience is the best part of the job — and a quick Google review helps other
            Middle Tennessee families find a realtor they can trust. It takes about 30 seconds:
            just a star rating and a sentence or two is perfect. Thank you!
          </p>
        </div>

        {hasGoogleReviewLink ? (
          <GoogleReviewCTA
            variant="light"
            heading="Leave a Google review"
            body="One tap opens Google — no account setup, just tap the stars and share a quick thought."
          />
        ) : (
          <div className="border border-neutral-200 rounded-2xl p-10 text-center">
            <p className="text-neutral-600 leading-relaxed">
              The review link is being set up. In the meantime, feel free to text your feedback
              straight to Joshua at{' '}
              <TrackedTelLink
                href="tel:6155512727"
                className="text-black font-semibold underline"
                data-cta="review-page-fallback-call"
              >
                615-551-2727
              </TrackedTelLink>
              . Thank you!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
