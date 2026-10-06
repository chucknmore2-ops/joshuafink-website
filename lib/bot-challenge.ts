// Optional later hook for an invisible bot challenge.
//
// LEAD_BOT_CHALLENGE=off (default) | turnstile | botid
//
// Nothing on the forms renders a widget, and the contact route does not
// reject a lead because of this flag. Turning it on is a no-op until a
// Cloudflare Turnstile or Vercel BotID check is actually wired up. Spam
// scoring in lib/classify-lead.ts is what runs today.

export type BotChallengeMode = 'off' | 'turnstile' | 'botid'

export function botChallengeMode(): BotChallengeMode {
  const raw = (process.env.LEAD_BOT_CHALLENGE || 'off').trim().toLowerCase()
  if (raw === 'turnstile' || raw === 'botid') return raw
  return 'off'
}
