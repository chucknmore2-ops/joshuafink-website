'use client'

import { useLayoutEffect } from 'react'

/**
 * City chips are in-page hashes. A full load applies CSS :target immediately.
 * Client navigations from other pages can change the hash without updating
 * :target, so this also stamps data-city for the same CSS rules.
 */
export default function SoldHashFilter({ anchors }: { anchors: readonly string[] }) {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('.sold-page')
    if (!root) return
    const allowed = new Set(anchors)
    const apply = () => {
      const hash = window.location.hash.replace(/^#/, '')
      root.dataset.city = allowed.has(hash) ? hash : 'all'
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [anchors])

  return null
}
