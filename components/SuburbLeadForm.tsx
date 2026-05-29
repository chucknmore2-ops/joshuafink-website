'use client'

import { useState, FormEvent, ReactNode } from 'react'

type Props = {
  children: ReactNode
  successTitle: string
  successMessage: ReactNode
  resetLabel: string
}

export default function SuburbLeadForm({ children, successTitle, successMessage, resetLabel }: Props) {
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'submitting') return
    setState('submitting')
    setErrorMsg('')

    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setState('success')
        form.reset()
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
      <div className="border border-[#E8E8E8] p-10 text-center">
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
      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      <fieldset disabled={state === 'submitting'} className="space-y-5 border-0 p-0 m-0 min-w-0 disabled:opacity-70">
        {children}
      </fieldset>
    </form>
  )
}
