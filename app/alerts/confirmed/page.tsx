import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Listing alerts confirmed',
  robots: { index: false, follow: false },
}

export default async function AlertsConfirmedPage({
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
          {ok ? "You're signed up for listing alerts" : 'That confirmation link did not work'}
        </h1>
        <p className="mt-4 text-[#444] leading-relaxed">
          {ok
            ? 'Joshua will email you when a Compass listing is new or the price drops. Every email has a one-click unsubscribe.'
            : 'The link may have already been used, or the list is not available right now. You can sign up from the alerts page.'}
        </p>
        <Link href="/alerts" className="inline-block mt-6 text-sm font-semibold underline">
          Listing alerts
        </Link>
      </div>
    </div>
  )
}
