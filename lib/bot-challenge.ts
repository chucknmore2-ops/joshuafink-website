// Optional flag kept so an old LEAD_BOT_CHALLENGE value does not change
// behavior. Turnstile is gated by NEXT_PUBLIC_TURNSTILE_SITE_KEY and
// TURNSTILE_SECRET_KEY (see lib/turnstile.ts), not by this flag. BotID is
// still unwired. Spam scoring in lib/classify-lead.ts always runs.

export type BotChallengeMode = 'off' | 'turnstile' | 'botid'

export function botChallengeMode(): BotChallengeMode {
  const raw = (process.env.LEAD_BOT_CHALLENGE || 'off').trim().toLowerCase()
  if (raw === 'turnstile' || raw === 'botid') return raw
  return 'off'
}
