'use client'

import { useEffect, useRef } from 'react'
import {
  isSlowTurnstileClient,
  turnstileTokenStale,
  turnstileWaitMs,
  waitForTurnstileToken,
} from '@/lib/turnstile-token'

// Invisible / managed Turnstile. The widget type (Invisible vs Managed) is
// chosen in the Cloudflare dashboard with the sitekey. `appearance:
// interaction-only` keeps a Managed widget from reserving a 65px box, so the
// form does not shift. Invisible sitekeys never paint anything.
//
// The script is injected only after this component mounts, and only once a
// form is near the viewport. It is not in the root layout. No sitekey means
// the component renders nothing and no request is made.
//
// Tokens expire after 300 seconds. On submit, a missing, expired, or aging
// token is reset and the form waits for a fresh one (longer on a phone)
// before posting. A fresh token is reused so a normal submit does not pause.

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const TOKEN_FIELD = 'cf-turnstile-response'

function siteKey(): string {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim()
}

type TurnstileRenderOptions = {
  sitekey: string
  appearance?: 'always' | 'execute' | 'interaction-only'
  execution?: 'render' | 'execute'
  theme?: 'auto' | 'light' | 'dark'
  action?: string
  tabindex?: number
  'response-field'?: boolean
  'response-field-name'?: string
  callback?: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
}

interface TurnstileApi {
  ready: (callback: () => void) => void
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  remove: (widgetId: string) => void
  reset?: (widgetId: string) => void
  execute?: (widgetId: string) => void
  isExpired?: (widgetId: string) => boolean
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

type Slot = {
  container: HTMLDivElement
  siteKey: string
  widgetId: string | null
  renderPromise: Promise<void> | null
  cancelled: boolean
  token: string
  tokenAt: number | null
}

const slots = new Set<Slot>()
let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => {
        scriptPromise = null
        reject(new Error('turnstile script failed'))
      }, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    // Dynamic insertion is already after first paint. Cloudflare's ready
    // helper throws when the tag is async, so this tag stays blocking for
    // its own fetch only — it is not in the document head at page load.
    script.async = false
    script.dataset.turnstile = 'true'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => {
      scriptPromise = null
      script.remove()
      reject(new Error('turnstile script failed'))
    }, { once: true })
    document.head.appendChild(script)
  })
  return scriptPromise
}

function renderSlot(slot: Slot): Promise<void> {
  if (slot.widgetId || slot.cancelled) return Promise.resolve()
  if (slot.renderPromise) return slot.renderPromise
  slot.renderPromise = (async () => {
    try {
      await loadTurnstileScript()
    } catch (err) {
      slot.renderPromise = null
      throw err
    }
    if (slot.cancelled || slot.widgetId || !slot.container.isConnected) return
    const api = window.turnstile
    if (!api) return
    if (slot.cancelled || slot.widgetId || !slot.container.isConnected) return
    // Call render directly. Cloudflare's ready helper throws if the script
    // tag was async, and the load event already means the API is on the page.
    slot.widgetId = api.render(slot.container, {
      sitekey: slot.siteKey,
      appearance: 'interaction-only',
      execution: 'render',
      theme: 'light',
      action: 'lead',
      tabindex: -1,
      'response-field': true,
      'response-field-name': TOKEN_FIELD,
      callback: (token: string) => {
        if (slot.cancelled) return
        slot.token = token
        slot.tokenAt = Date.now()
      },
      'expired-callback': () => {
        slot.token = ''
        slot.tokenAt = null
      },
      'error-callback': () => {
        slot.token = ''
        slot.tokenAt = null
      },
    })
  })()
  return slot.renderPromise
}

function readFieldToken(form: HTMLFormElement): string {
  const fields = form.querySelectorAll<HTMLInputElement>(`input[name="${TOKEN_FIELD}"]`)
  for (let i = 0; i < fields.length; i++) {
    const value = fields[i].value.trim()
    if (value) return value
  }
  return ''
}

function clearFieldToken(form: HTMLFormElement): void {
  const fields = form.querySelectorAll<HTMLInputElement>(`input[name="${TOKEN_FIELD}"]`)
  for (let i = 0; i < fields.length; i++) fields[i].value = ''
}

function slotExpired(slot: Slot | undefined): boolean {
  if (!slot?.widgetId) return false
  const api = window.turnstile
  if (!api?.isExpired) return false
  try {
    return api.isExpired(slot.widgetId) === true
  } catch {
    return false
  }
}

function refreshSlot(form: HTMLFormElement, slot: Slot | undefined): void {
  clearFieldToken(form)
  if (!slot) return
  slot.token = ''
  slot.tokenAt = null
  const api = window.turnstile
  if (!slot.widgetId || !api) return
  if (typeof api.reset === 'function') {
    api.reset(slot.widgetId)
    return
  }
  if (typeof api.execute === 'function') api.execute(slot.widgetId)
}

function mediaMatches(query: string): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  try {
    return window.matchMedia(query).matches
  } catch {
    return false
  }
}

function slowClient(): boolean {
  return isSlowTurnstileClient({
    coarsePointer: mediaMatches('(pointer: coarse)'),
    narrowViewport: mediaMatches('(max-width: 768px)'),
    userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent || '',
  })
}

/**
 * Resolve the Turnstile token for this form before the POST body is built.
 * Returns '' when the sitekey is unset, the script fails, or the widget does
 * not answer in time. A missing or likely-expired token is reset first.
 * Phones wait longer than desktops before the token is treated as missing.
 * The server treats an empty token as a skip when the keys are unset, and as
 * turnstile_missing when they are set.
 */
export async function ensureTurnstileToken(form: HTMLFormElement): Promise<string> {
  if (!siteKey()) return ''
  const slot = Array.from(slots).find((candidate) => form.contains(candidate.container))
  if (slot) {
    try {
      await renderSlot(slot)
    } catch {
      return ''
    }
  }

  const readToken = () => (slot?.token || readFieldToken(form)).trim()
  const stale = (token: string) => turnstileTokenStale({
    token,
    issuedAt: slot?.tokenAt ?? null,
    now: Date.now(),
    expired: slotExpired(slot),
  })

  return waitForTurnstileToken({
    readToken,
    stale,
    refresh: () => refreshSlot(form, slot),
    shouldRefresh: stale(readToken()),
    waitMs: turnstileWaitMs(slowClient()),
  })
}

export default function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const key = siteKey()
    if (!container || !key) return
    const form = container.closest('form')
    const slot: Slot = {
      container,
      siteKey: key,
      widgetId: null,
      renderPromise: null,
      cancelled: false,
      token: '',
      tokenAt: null,
    }
    slots.add(slot)

    let restorePosition: (() => void) | undefined
    if (form && window.getComputedStyle(form).position === 'static') {
      form.style.position = 'relative'
      restorePosition = () => {
        if (form.style.position === 'relative') form.style.position = ''
      }
    }

    const start = () => {
      void renderSlot(slot).catch(() => undefined)
    }

    let observer: IntersectionObserver | undefined
    const target = form ?? container
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start()
          observer?.disconnect()
        }
      }, { rootMargin: '600px' })
      observer.observe(target)
    } else {
      start()
    }

    return () => {
      slot.cancelled = true
      observer?.disconnect()
      if (slot.widgetId && window.turnstile) {
        window.turnstile.remove(slot.widgetId)
        slot.widgetId = null
      }
      slots.delete(slot)
      restorePosition?.()
    }
  }, [])

  if (!siteKey()) return null

  return (
    <div
      ref={containerRef}
      data-turnstile-host=""
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        overflow: 'visible',
        zIndex: 20,
      }}
    />
  )
}
