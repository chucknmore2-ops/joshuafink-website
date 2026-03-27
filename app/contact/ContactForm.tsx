'use client'

import { useState, FormEvent } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactForm() {
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
      setErrorMsg('Network error — please check your connection and try again.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="border border-neutral-200 rounded-2xl p-10 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-black mb-3">Message Sent!</h2>
        <p className="text-neutral-500 text-base leading-relaxed mb-6">
          Thanks for reaching out — Joshua will be in touch shortly. For anything urgent, call{' '}
          <a href="tel:6155512727" className="text-black font-semibold underline">
            615-551-2727
          </a>
          .
        </p>
        <button
          onClick={() => setState('idle')}
          className="inline-flex items-center justify-center border border-neutral-300 text-black text-sm font-semibold px-6 py-2.5 rounded-full tracking-wide transition-all duration-200 hover:border-black"
        >
          Send Another Message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
          >
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Jane Smith"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
          >
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="615-555-0000"
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
        >
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150"
        />
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
        >
          I&apos;m Looking To
        </label>
        <select
          id="subject"
          name="subject"
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black bg-white focus:outline-none focus:border-black transition-colors duration-150 appearance-none"
        >
          <option value="">Select an option...</option>
          <option value="buy">Buy a Home</option>
          <option value="sell">Sell a Home</option>
          <option value="both">Buy &amp; Sell</option>
          <option value="invest">Investment Property</option>
          <option value="rent">Rental / Landlord</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-xs font-semibold text-black tracking-widest uppercase mb-2"
        >
          Message *
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          placeholder="Tell Joshua what you're looking for, your timeline, budget, or any questions you have..."
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm text-black placeholder-neutral-400 focus:outline-none focus:border-black transition-colors duration-150 resize-y"
        />
      </div>

      <input type="hidden" name="source" value="contact-page" />

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <p className="text-xs text-neutral-400">
        * Messages go directly to joshua@joshuafink.com. For immediate response, call{' '}
        <a href="tel:6155512727" className="underline text-black">
          615-551-2727
        </a>
        .
      </p>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full sm:w-auto inline-flex items-center justify-center bg-black text-white text-sm font-bold px-10 py-4 rounded-full tracking-wide transition-all duration-200 hover:bg-neutral-800 hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
