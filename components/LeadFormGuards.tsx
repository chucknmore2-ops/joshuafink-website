'use client'

import { useEffect, useState } from 'react'

/**
 * Shared spam traps for every lead form.
 *
 * The honeypot is a text field (not type=hidden — dumb bots skip those)
 * parked off-screen, out of tab order, and hidden from assistive tech.
 * Autocomplete is off so a password manager is less likely to fill it.
 * Humans never see it. A non-empty value is quarantined server-side.
 *
 * `_loaded` is the millisecond timestamp of when this form mounted in the
 * browser. It is set in an effect, never during render: these pages are
 * statically prerendered, and a render-time Date.now() would bake the build
 * clock into the HTML (that bug caught zero bots and, after an error
 * re-render, dropped real sellers). The effect deps are empty so a failed
 * submit does not reset the clock. A missing value is not, by itself, spam.
 */
export default function LeadFormGuards() {
  const [startedAt, setStartedAt] = useState('')

  useEffect(() => {
    setStartedAt(String(Date.now()))
  }, [])

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          height: 0,
          width: 0,
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-hidden="true"
          defaultValue=""
          data-1p-ignore="true"
          data-lpignore="true"
        />
      </div>
      <input type="hidden" name="_loaded" value={startedAt} autoComplete="off" />
    </>
  )
}
