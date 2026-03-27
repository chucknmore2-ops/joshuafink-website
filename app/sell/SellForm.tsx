'use client'

import { useState, FormEvent } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function SellForm() {
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
      setErrorMsg('Network error — please try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="border border-neutral-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-black mb-3">Request Sent!</h2>
        <p className="text-neutral-500 text-base leading-relaxed mb-6">
          Joshua will reach out within a few hours with your free home valuation. For faster response, call{' '}
          <a href="tel:6155512727" className="text-black font-semibold underline">
            615-551-2727
          </a>
          .
        </p>
        <button
          onClick={() => setState('idle')}
          className="inline-flex items-center justify-center border border-neutral-300 text-black text-sm font-semibold px-6 py-2.5 rounded-full tracking-wide transition-all duration-200 hover:border-black"
        >
          Submit Another
        </button>
      </div>
    )
  }

  const inputClass = "w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
  const selectClass = "w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors duration-150 appearance-none"
  const labelClass = "block text-xs font-semibold text-black tracking-widest uppercase mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="lead_type" value="seller" />
      <input type="hidden" name="subject" value="sell" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className={labelClass}>Full Name *</label>
          <input type="text" id="name" name="name" required placeholder="Jane Smith" className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone *</label>
          <input type="tel" id="phone" name="phone" required placeholder="615-555-0000" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email Address *</label>
        <input type="email" id="email" name="email" required placeholder="you@example.com" className={inputClass} />
      </div>

      <div>
        <label htmlFor="property_address" className={labelClass}>Property Address *</label>
        <input
          type="text" id="property_address" name="property_address" required
          placeholder="123 Main St, Nashville, TN 37201"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <label htmlFor="bedrooms" className={labelClass}>Bedrooms</label>
          <select id="bedrooms" name="bedrooms" className={selectClass}>
            <option value="">—</option>
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
          </select>
        </div>
        <div>
          <label htmlFor="bathrooms" className={labelClass}>Bathrooms</label>
          <select id="bathrooms" name="bathrooms" className={selectClass}>
            <option value="">—</option>
            <option>1</option><option>1.5</option><option>2</option><option>2.5</option><option>3</option><option>3.5+</option>
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className={labelClass}>Timeline</label>
          <select id="timeline" name="timeline" className={selectClass}>
            <option value="">—</option>
            <option value="asap">ASAP</option>
            <option value="1-3mo">1–3 months</option>
            <option value="3-6mo">3–6 months</option>
            <option value="6mo+">6+ months</option>
            <option value="just-curious">Just curious</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="body" className={labelClass}>Anything Else? (optional)</label>
        <textarea
          id="body" name="body" rows={4}
          placeholder="Condition of the home, recent updates, situation you're working through — anything helps..."
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150 resize-y"
        />
      </div>

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <p className="text-xs text-neutral-400">
        * Joshua responds same-day. No spam, no pressure. Just real numbers.
      </p>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white text-sm font-bold px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? 'Sending…' : 'Get My Free Valuation →'}
      </button>
    </form>
  )
}
