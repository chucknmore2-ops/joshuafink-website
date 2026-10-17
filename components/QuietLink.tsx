import Link from 'next/link'
import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof Link>

/**
 * Next.js 14 prefetches every Link that enters the viewport. On pages with
 * dozens of links that prefetch becomes a burst of ISR reads. Use this for
 * the footer, nav, and long lists. Pass prefetch={true} to opt back in.
 */
export default function QuietLink({ prefetch = false, ...props }: Props) {
  return <Link prefetch={prefetch} {...props} />
}
