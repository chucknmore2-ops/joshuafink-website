import { listingCtaKind, listingStatusLabel } from './listing-cta.ts'

export type ListingQuestion = { q: string; a: string }

export type ListingQuestionInput = {
  address: string
  city: string
  status: string
  priceLabel: string
  specLine?: string
  suburbName?: string
  hasSimilar: boolean
}

function availabilityAnswer(input: ListingQuestionInput): string {
  const place = `${input.address} in ${input.city}`
  switch (listingCtaKind(input.status)) {
    case 'sold':
      return `${place} has sold. The price on this page, ${input.priceLabel}, is the sold price stored from Joshua Fink Group's Compass inventory. Closing date and which side Joshua represented are not in this record. Use the form to ask about a similar home, or call 615-551-2727.`
    case 'coming-soon':
      return `${place} is Coming Soon on Compass, listed at ${input.priceLabel}. It is not open for showings yet. Use the form on this page to be notified when it is, or call 615-551-2727.`
    case 'under-contract':
      return `${place} is under contract, so it is not available for a new offer. The price shown, ${input.priceLabel}, is the list price on the Compass record. Ask Joshua about similar homes, or use the alert form on this page. Call 615-551-2727.`
    default:
      return `${place} is an active Compass listing at ${input.priceLabel}. Use the form on this page or call 615-551-2727 to schedule a showing.`
  }
}

/** Questions a buyer can answer from the listing record alone. No extra stats. */
export function listingQuestions(input: ListingQuestionInput): ListingQuestion[] {
  const specs = input.specLine?.trim()
  const facts = specs
    ? `${input.address} is ${input.priceLabel} — ${specs} — in ${input.city}.`
    : `${input.address} is ${input.priceLabel} in ${input.city}.`
  const suburb = input.suburbName
    ? ` The ${input.suburbName} homes-for-sale page and market report are linked on this listing.`
    : ''

  const questions: ListingQuestion[] = [
    {
      q: `Is ${input.address} still available?`,
      a: availabilityAnswer(input),
    },
    {
      q: `How do I ask a question or schedule a showing for ${input.address}?`,
      a: 'Call or text 615-551-2727, or use the form on this page. Joshua answers same-day.',
    },
    {
      q: `What is listed for ${input.address}?`,
      a: `${facts} Status: ${listingStatusLabel(input.status)}. Photos on this page are not behind a form. MLS documents are on Compass, with Joshua as your agent.${suburb}`,
    },
  ]

  if (input.hasSimilar) {
    questions.push({
      q: `Are there homes similar to ${input.address}?`,
      a: `Yes. This page lists other Compass homes in ${input.city} or a similar price. If none of them fit, the alert form will email you when Joshua lists one.`,
    })
  }

  return questions
}
