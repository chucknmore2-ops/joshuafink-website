import { trackAdsConversion } from './ads'

// Client-side helpers shared by the lead forms (SuburbLeadForm, SellForm,
// ContactForm, CashOfferForm).

type Gtag = (...args: unknown[]) => void

export const MISSING_CONTACT_MESSAGE =
  'Please add a phone number or an email address so Joshua can reach you.'

/**
 * True when a form offers phone and/or email fields and the visitor filled in
 * neither. Forms no longer demand BOTH (each extra required field costs
 * conversions), but a lead with no way to reply is not a lead. Checked in the
 * browser only: the server deliberately does not reject contact-less
 * submissions, because the morning healthcheck's test lead has neither.
 */
export function missingContact(form: HTMLFormElement): boolean {
  const phone = form.elements.namedItem('phone') as HTMLInputElement | null
  const email = form.elements.namedItem('email') as HTMLInputElement | null
  if (!phone && !email) return false
  return !(phone?.value.trim() || email?.value.trim())
}

/**
 * GA4 `lead_form_error`: a visitor tried to send a lead and it didn't go
 * through. Pairs with `generate_lead` so a spike in failures is visible in GA4
 * instead of only as fewer leads. Never pass field values — GA4 event params
 * are not a PII-safe place for names, phones, emails or addresses.
 */
/**
 * GA4 `generate_lead` and the Google Ads lead conversion. Call this only
 * after the server receipt says the lead was accepted into the CRM. A quiet
 * 200 for a quarantined submit must not count.
 */
export function trackAcceptedLead(category: string, label: string): void {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  if (typeof gtag === 'function') {
    gtag('event', 'generate_lead', {
      event_category: category,
      event_label: label,
      value: 1,
    })
  }
  trackAdsConversion(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL)
}

export function trackLeadFormError(formLabel: string, errorType: string): void {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  if (!gtag) return
  gtag('event', 'lead_form_error', {
    event_category: 'lead_form',
    event_label: formLabel,
    error_type: errorType,
  })
}
