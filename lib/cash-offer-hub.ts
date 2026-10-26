import { cashOfferHubLastUpdated } from '@/lib/cash-offer-cities'
import { formatCloseMonthYear } from '@/lib/closings'
import {
  formatStatsDate,
  getSuburb,
  marketStatsSource,
  suburbStatsAsOf,
} from '@/lib/suburbs'

export type CashOfferHubFaq = { q: string; a: string }

/** "Updated October 2026" — month and year of the hub content date, no day. */
export function cashOfferHubUpdatedLabel(): string {
  return formatCloseMonthYear(cashOfferHubLastUpdated)
}

/**
 * How a Nashville cash offer is calculated. Reuses the 70–85% after-repair
 * framing and the live Redfin city median already published on the site.
 * Does not invent a percentage, a dollar figure, or an as-of date.
 */
export function nashvilleCashOfferCalculationAnswer(): string {
  const nashville = getSuburb('nashville-tn')
  if (!nashville) throw new Error('nashville suburb missing')
  const asOf = formatStatsDate(suburbStatsAsOf(nashville))
  return [
    'An investor cash offer is typically 70–85% of after-repair market value.',
    'Where yours falls inside that range depends on condition, not on a formula — the less work the house needs, the closer the offer should sit to the top of the range.',
    `Nashville's ${nashville.medianPrice} median (${marketStatsSource}, as of ${asOf}) is a citywide midpoint that blends updated East Nashville bungalows with dated homes in Madison, Antioch, and Donelson.`,
    "A fair offer on your house should be tied to comps near your address and to your home's condition, not to the citywide number.",
  ].join(' ')
}

/** Concise hub FAQ. Every sentence is a claim already published on the site. */
export function cashOfferHubFaqs(): CashOfferHubFaq[] {
  return [
    {
      q: 'How fast is a cash offer if I want to sell my house fast in Nashville?',
      a: "You'll have a fair, no-obligation cash offer within 24 hours. If you accept, you pick the closing date — as fast as 7 days, or on your own timeline.",
    },
    {
      q: 'How is a Nashville cash offer calculated?',
      a: nashvilleCashOfferCalculationAnswer(),
    },
    {
      q: 'How does a cash offer compare with listing my Nashville house?',
      a: 'A cash sale trades a portion of retail price for speed, certainty, and zero repairs. If you want full market value and can wait 30–90 days, Joshua can list the home traditionally. He gives you a written cash offer and a traditional-listing estimate side by side, so you choose the path that fits.',
    },
    {
      q: 'Are there fees or commissions on a cash offer?',
      a: 'Zero. No agent commissions, no closing costs, no hidden fees. The cash offer you receive is the amount you walk away with. We cover all closing costs.',
    },
    {
      q: 'Do I have to repair the house before a cash offer?',
      a: "No. We buy houses completely as-is. No cleaning, no repairs, no staging, no showings. Leave what you don't want — we'll handle it.",
    },
    {
      q: 'Which areas do you buy houses in?',
      a: "All of Middle Tennessee including Nashville, Franklin, Brentwood, Spring Hill, Columbia, Murfreesboro, Gallatin, Hendersonville, Mount Juliet, Lebanon, Smyrna, La Vergne, Nolensville, Thompson's Station, and surrounding areas.",
    },
    {
      q: 'How can I tell if a Nashville cash offer is fair?',
      a: "Ask for the math. A fair offer shows the after-repair value, the comps behind it, and the repair estimate, so you can check each piece yourself. Joshua puts that in writing next to a traditional-listing estimate, because he also lists homes with Compass. If an offer comes with no comps and no repair breakdown, compare it against a second opinion before you sign — you're never obligated to accept.",
    },
  ]
}
