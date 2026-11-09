// Shared honeypot field names. The rendered input lives in
// components/LeadFormGuards.tsx. `website` is a real autofill token (contact
// cards fill it even with autocomplete=off), so the field the browser paints
// uses a name that is not an address, phone, email, name, company, or URL.
// Direct posts and cached HTML can still send `website`; that stays a trap.

export const HONEYPOT_FIELD = 'hp_confirm'
export const LEGACY_HONEYPOT_FIELD = 'website'

export const HONEYPOT_FIELDS = [HONEYPOT_FIELD, LEGACY_HONEYPOT_FIELD] as const

export function isHoneypotField(key: string): boolean {
  return (HONEYPOT_FIELDS as readonly string[]).includes(key)
}

export function honeypotFilled(lead: Record<string, string>): boolean {
  return HONEYPOT_FIELDS.some((key) => (lead[key] || '').trim() !== '')
}
