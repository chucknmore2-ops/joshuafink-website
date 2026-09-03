// Google Business Profile LocalPost call-to-action.
//
// Official docs: CallToAction.url "should be left unset for Call CTA."
// Sending `url: "tel:…"` is rejected as HTTP 400 INVALID_ARGUMENT.

export type CtaWithUrl = {
  actionType: 'LEARN_MORE' | 'ORDER' | 'BOOK' | 'SIGN_UP'
  url: string
}

export type CallCta = { actionType: 'CALL' }

export type CTA = CallCta | CtaWithUrl

export const CALL_CTA: CallCta = { actionType: 'CALL' }

export function serializeCallToAction(
  cta: CTA,
): { actionType: CTA['actionType']; url?: string } {
  if (cta.actionType === 'CALL' || !('url' in cta) || !cta.url) {
    return { actionType: cta.actionType }
  }
  return { actionType: cta.actionType, url: cta.url }
}

export function gbpCreatePayload(post: {
  summary: string
  cta?: CTA
  photoUrl?: string
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    languageCode: 'en-US',
    summary: post.summary,
    topicType: 'STANDARD',
  }
  if (post.cta) payload.callToAction = serializeCallToAction(post.cta)
  if (post.photoUrl) {
    payload.media = [{ mediaFormat: 'PHOTO', sourceUrl: post.photoUrl }]
  }
  return payload
}

export function ctaLink(cta: CTA | undefined): string | null {
  return cta && 'url' in cta ? cta.url : null
}
