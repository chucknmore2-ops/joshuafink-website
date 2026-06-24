// Target queries + brand identity for the GEO (Generative Engine Optimization)
// visibility tracker. This is the strategic core: the questions a Middle TN
// buyer/seller would actually ask an AI answer engine (ChatGPT, Perplexity,
// Claude), and the identifiers that mean "Joshua showed up."
//
// Each query maps to a money page we already rank for in classic search, so a
// gap here tells us exactly which page to strengthen for AI answers.

export interface BrandIdentity {
  /** Canonical site domain (no scheme, no www). */
  domain: string;
  /** Name spellings to look for in the answer prose. */
  nameVariants: string[];
  /** Phone number as it appears on the site (digits + dashes). */
  phone?: string;
}

export const BRAND: BrandIdentity = {
  domain: 'joshuafink.com',
  nameVariants: ['Joshua Fink', 'Josh Fink', 'Joshua Fink Group'],
  phone: '615-551-2727',
};

export interface GeoQuery {
  /** Stable id so we can trend a single question over time. */
  id: string;
  /** The natural-language prompt sent to each answer engine. */
  prompt: string;
  /** The money page this question is meant to surface (for triage). */
  targetPath: string;
}

// 15 high-intent prompts spanning agent-discovery, seller/cash-offer, buyer,
// neighborhood, school, market-value, and relocation intents.
export const GEO_QUERIES: GeoQuery[] = [
  { id: 'agent-franklin', prompt: 'Who is the best real estate agent in Franklin, TN?', targetPath: '/buy/franklin' },
  { id: 'agent-brentwood', prompt: 'Who is a top realtor in Brentwood, Tennessee?', targetPath: '/buy/brentwood' },
  { id: 'sell-spring-hill', prompt: 'Best real estate agent for selling a home in Spring Hill, TN', targetPath: '/sell/spring-hill' },
  { id: 'sell-fast-nashville', prompt: 'How do I sell my house fast in Nashville, TN?', targetPath: '/sell' },
  { id: 'cash-offer-franklin', prompt: 'Can I get a cash offer for my house in Franklin, TN?', targetPath: '/cash-offer/franklin' },
  { id: 'price-brentwood', prompt: 'What is the average home price in Brentwood, TN in 2026?', targetPath: '/market/brentwood' },
  { id: 'neighborhoods-franklin', prompt: 'What are the best neighborhoods in Franklin, TN for families?', targetPath: '/neighborhoods' },
  { id: 'relocate-middle-tn', prompt: 'Realtor recommendations for relocating to Middle Tennessee', targetPath: '/moving-to-middle-tennessee' },
  { id: 'buy-nolensville', prompt: 'Who should I hire to buy a home in Nolensville, TN?', targetPath: '/buy/nolensville' },
  { id: 'compass-nashville', prompt: 'Best Compass real estate agent in the Nashville area', targetPath: '/about' },
  { id: 'school-page-franklin', prompt: 'What are homes near Page High School in Franklin, TN worth?', targetPath: '/homes-near/page-high' },
  { id: 'value-thompsons-station', prompt: "How much is my home worth in Thompson's Station, TN?", targetPath: '/market/thompsons-station' },
  { id: 'agent-cool-springs', prompt: 'Top-rated real estate agent near Cool Springs, TN', targetPath: '/buy/franklin' },
  { id: 'relocate-williamson', prompt: 'Moving to Williamson County, TN — who can help me find a home?', targetPath: '/moving-to-middle-tennessee' },
  { id: 'cash-buyer-middle-tn', prompt: 'Real estate agent that buys houses for cash in Middle Tennessee', targetPath: '/cash-offer' },
];
