'use client'

import { useState, FormEvent } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function CashOfferForm() {
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
      <div className="bg-white text-black p-8 rounded-2xl text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-black mb-3">We Got It!</h2>
        <p className="text-neutral-500 text-sm leading-relaxed mb-6">
          Joshua will call you within 24 hours with your cash offer. For faster response, call him directly at{' '}
          <a href="tel:6155512727" className="text-black font-semibold underline">
            615-551-2727
          </a>
          .
        </p>
        <button
          onClick={() => setState('idle')}
          className="inline-flex items-center justify-center border border-neutral-300 text-black text-sm font-semibold px-6 py-2 rounded-full tracking-wide transition-all duration-200 hover:border-black"
        >
          Submit Another
        </button>
      </div>
    )
  }

  return (
    <div id="cash-offer-form" className="bg-white text-black p-8 rounded-2xl">
      <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase mb-2">
        Get Your Cash Offer
      </p>
      <h2 className="text-2xl font-black text-black mb-6">
        Free. No Obligation. 24 Hours.
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="lead_type" value="sell" />
        <input type="hidden" name="subject" value="sell" />
        <input type="hidden" name="source" value="cash-offer" />

        <div>
          <input
            type="text" name="name" required placeholder="Your Name *"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
          />
        </div>
        <div>
          <input
            type="tel" name="phone" required placeholder="Your Phone Number *"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
          />
        </div>
        <div>
          <input
            type="email" name="email" placeholder="Email (optional)"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
          />
        </div>
        <div>
          <input
            type="text" name="property_address" required placeholder="Property Address *"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
          />
        </div>
        <div>
          <select
            name="situation"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors duration-150 appearance-none"
          >
            <option value="">My Situation (optional)</option>
            <option value="behind_payments">Behind on Payments</option>
            <option value="foreclosure">Facing Foreclosure</option>
            <option value="inherited">Inherited Property</option>
            <option value="divorce">Going Through Divorce</option>
            <option value="move_fast">Need to Move Fast</option>
            <option value="repairs">Major Repairs Needed</option>
            <option value="downsizing">Downsizing</option>
            <option value="landlord">Done Being a Landlord</option>
            <option value="other">Other</option>
          </select>
        </div>

        {state === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={state === 'submitting'}
          className="w-full bg-black text-white text-base font-black py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === 'submitting' ? 'Sending…' : 'Get My Cash Offer →'}
        </button>
        <p className="text-xs text-neutral-400 text-center">
          No spam. No obligation. Joshua calls you personally.
        </p>
      </form>
    </div>
  )
}
