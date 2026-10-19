// Seller/buyer lean from median days on market and the year-over-year price
// change. The market report summary, FAQ, and any context sentence that names
// the market's condition all use this, so a city cannot be labeled one way in
// the headline and another in the body.

export type MarketLeanInput = {
  avgDaysOnMarket: number
  yoyChange: string
}

export type MarketTone = '#A0A0A0' | '#16a34a' | '#0A1628'

export function marketLean(s: MarketLeanInput | null | undefined): { lean: string; tone: MarketTone } {
  if (!s) return { lean: 'Balanced', tone: '#A0A0A0' }
  const yoy = parseFloat(s.yoyChange.replace('%', '').replace('+', '')) || 0
  if (s.avgDaysOnMarket <= 22 && yoy >= 4) return { lean: 'Strong Seller Market', tone: '#16a34a' }
  if (s.avgDaysOnMarket <= 30 && yoy >= 3) return { lean: 'Seller-Favored', tone: '#16a34a' }
  if (s.avgDaysOnMarket >= 40 || yoy < 2) return { lean: 'Balanced / Buyer-Friendly', tone: '#0A1628' }
  return { lean: 'Healthy / Balanced', tone: '#0A1628' }
}

// Placeholder swapped for `marketConditionSentence` after the suburb record
// exists, so the sentence reads that record's own days on market and YoY.
export const MARKET_CONDITION = '{{marketCondition}}'

// Prose for the context paragraph. The summary badge keeps `marketLean().lean`
// (including the slash). These phrases are the same labels written as a sentence.
const MARKET_PHRASE: Record<string, string> = {
  'Strong Seller Market': "a strong seller's market",
  'Seller-Favored': 'a seller-favoring market',
  'Balanced / Buyer-Friendly': 'a balanced to buyer-friendly market',
  'Healthy / Balanced': 'a healthy, balanced market',
  Balanced: 'a balanced market',
}

export function marketConditionPhrase(lean: string): string {
  const phrase = MARKET_PHRASE[lean]
  if (!phrase) throw new Error(`No prose phrase for market label: ${lean}`)
  return phrase
}

/** One sentence for the context paragraph. No extra stats, no slash label. */
export function marketConditionSentence(s: MarketLeanInput & { name: string }): string {
  return `${s.name} is currently ${marketConditionPhrase(marketLean(s).lean)}.`
}

export function applyMarketConditionSentence<
  T extends MarketLeanInput & { description: string; name: string },
>(suburb: T): T {
  if (!suburb.description.includes(MARKET_CONDITION)) return suburb
  suburb.description = suburb.description.split(MARKET_CONDITION).join(marketConditionSentence(suburb))
  return suburb
}
