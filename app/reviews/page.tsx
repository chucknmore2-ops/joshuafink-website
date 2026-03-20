import type { Metadata } from 'next'
import { reviews, reviewStats } from '@/lib/reviews'

export const metadata: Metadata = {
  title: 'Client Reviews | Joshua Fink | Compass Real Estate Nashville',
  description: `Joshua Fink has ${reviewStats.total} five-star reviews on Zillow. Read what buyers and sellers across Middle Tennessee say about working with Joshua.`,
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-black' : 'text-[#E8E8E8]'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            Client Reviews
          </p>
          <h1 className="text-5xl font-black tracking-tight">What Clients Say</h1>
          <p className="text-[#A0A0A0] text-lg mt-2">
            {reviewStats.total} five-star reviews on Zillow — and counting.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-[#E8E8E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl font-black text-black">{reviewStats.rating}</p>
              <div className="flex justify-center mt-2">
                <StarRating rating={reviewStats.rating} />
              </div>
              <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-2">Average Rating</p>
            </div>
            <div>
              <p className="text-5xl font-black text-black">{reviewStats.total}</p>
              <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-2">Total Reviews</p>
            </div>
            <div>
              <p className="text-5xl font-black text-black">13+</p>
              <p className="text-xs text-[#A0A0A0] uppercase tracking-widest font-semibold mt-2">Years Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="border border-[#E8E8E8] p-8 hover:border-black transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-black text-black text-sm">{review.reviewer}</p>
                  <p className="text-xs text-[#A0A0A0] mt-0.5">{review.transaction}</p>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} />
                  <p className="text-xs text-[#A0A0A0] mt-1">{review.date}</p>
                </div>
              </div>
              <p className="text-sm text-[#444] leading-relaxed">&ldquo;{review.text}&rdquo;</p>
              <div className="mt-4 pt-4 border-t border-[#E8E8E8]">
                <span className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-widest">
                  Via Zillow ✓
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to Zillow */}
        <div className="mt-16 bg-black text-white p-10 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-3">
            See More
          </p>
          <h2 className="text-3xl font-black mb-4">
            {reviewStats.total} Reviews on Zillow
          </h2>
          <p className="text-[#A0A0A0] mb-8 max-w-xl mx-auto">
            These are just a sample. Read all {reviewStats.total} verified client reviews on Zillow to see why Joshua Fink is Middle Tennessee&apos;s most trusted realtor.
          </p>
          <a
            href={reviewStats.zillowUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-black text-sm font-black px-10 py-4 tracking-wide hover:bg-[#E8E8E8] transition-colors"
          >
            Read All Reviews on Zillow →
          </a>
        </div>

        {/* Work with Josh CTA */}
        <div className="mt-12 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#A0A0A0] uppercase mb-4">
            Ready to work together?
          </p>
          <h2 className="text-3xl font-black text-black mb-6">Join 200+ Happy Clients</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-black text-white text-sm font-black px-10 py-4 tracking-wide hover:bg-[#222] transition-colors"
            >
              Contact Joshua
            </a>
            <a
              href="/listings"
              className="border-2 border-black text-black text-sm font-black px-10 py-4 tracking-wide hover:bg-black hover:text-white transition-colors"
            >
              View Listings
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
