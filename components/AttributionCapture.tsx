'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { captureAttribution } from '@/lib/attribution'

/**
 * Stash first-touch and last-touch attribution on every page, including
 * pages that have no form. Lead forms read it back at submit time.
 */
export default function AttributionCapture() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    captureAttribution()
  }, [pathname, search])

  return null
}
