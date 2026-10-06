import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unsubscribed from listing alerts',
  robots: { index: false, follow: false },
}

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const ok = status === 'ok'
  return (
    <div className="bg-white">
      <div className="max-w-xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-black tracking-tight">
          {ok ? 'You are unsubscribed' : 'Unsubscribe link not recognized'}
        </h1>
        <p className="mt-4 text-[#444] leading-relaxed">
          {ok
            ? 'You will not get new listing or price-drop emails from Joshua Fink. A showing request or other message you send is separate from this list.'
            : 'That link does not match a subscriber. If you still get listing emails, use the unsubscribe link in the latest one.'}
        </p>
        <Link href="/listings" className="inline-block mt-6 text-sm font-semibold underline">
          Browse listings
        </Link>
      </div>
    </div>
  )
}
