'use client'

import { useState, useEffect, useRef, FormEvent, ReactNode } from 'react'

type Props = {
  children: ReactNode
  successTitle: string
  successMessage: ReactNode
  resetLabel: string
}

export default function SuburbLeadForm({ children, successTitle, successMessage, resetLabel }: Props) {
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  // The submit button is supplied by each page as `children`, so its label can
  // only be swapped through the DOM. Every call site renders a plain text-only
  // button, so saving/restoring textContent is lossless.
  const submitBtn = useRef<{ el: HTMLElement; label: string } | null>(null)

  // /api/contact fans out to Slack, SendGrid, the Sheet and Pushover before it
  // answers, so the wait is seconds long — the outcome has to come to the
  // visitor rather than wait to be scrolled up to.
  useEffect(() => {
    if (state === 'submitting') return

    const saved = submitBtn.current
    if (saved) {
      saved.el.textContent = saved.label
      submitBtn.current = null
    }

    if (state === 'error') {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      errorRef.current?.focus()
    } else if (state === 'success') {
      successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [state])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    const btn = form.querySelector<HTMLElement>('button[type="submit"]')
    if (btn) {
      submitBtn.current = { el: btn, label: btn.textContent ?? '' }
      btn.textContent = 'Sending…'
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setState('success')
        form.reset()
        // Fire a GA4 conversion event so lead-form submissions are measurable.
        // No-ops safely when gtag isn't loaded (NEXT_PUBLIC_GA_ID unset).
        if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
          ;(window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', 'generate_lead', {
            event_category: 'lead_form',
            event_label: (data.source as string) || (data.suburb as string) || 'suburb_lead_form',
            value: 1,
          })
        }
      } else {
        const json = await res.json().catch(() => ({}))
        setErrorMsg(json.error || 'Something went wrong. Please try again.')
        setState('error')
      }
    } catch {
      setErrorMsg('Network error — please check your connection and try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div ref={successRef} className="border border-[#E8E8E8] p-10 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-black mb-3">{successTitle}</h2>
        <div className="text-[#6B6B6B] text-base leading-relaxed mb-6">{successMessage}</div>
        <button
          onClick={() => setState('idle')}
          className="inline-flex items-center justify-center border border-[#E8E8E8] text-black text-sm font-semibold px-6 py-2.5 tracking-wide transition-colors hover:border-black"
        >
          {resetLabel}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={state === 'submitting'}>
      {/* Honeypot — invisible to humans, bots auto-fill it. /api/contact drops
          any submission where this is non-empty. Living here rather than at
          each call site means every page using SuburbLeadForm gets bot
          protection, which is what lets the server-side heuristics stay
          conservative instead of guessing from name/message shape. */}
      <input
        type="text"
        name="website"
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
      />
      {state === 'error' && (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 focus:outline-none"
        >
          {errorMsg}
        </div>
      )}
      <fieldset disabled={state === 'submitting'} className="space-y-5 border-0 p-0 m-0 min-w-0 disabled:opacity-70">
        {children}
      </fieldset>
    </form>
  )
}
