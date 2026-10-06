// Caption and link for the Mon/Wed/Fri Facebook spotlight.
//
// The link is Josh's own listing page (the same address slug as
// lib/listing-detail.ts listingSlug), not compass.com. #JustListed is only
// for a home first seen within the last 14 days. Older Active homes are
// "Featured listing". Other statuses use their own wording.

import type { Listing } from "./listings-parse.ts";

const SITE = "https://www.joshuafink.com";

/** 14 days. A home first synced longer ago is not "Just Listed". */
export const JUST_LISTED_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function listingPageSlug(listing: Pick<Listing, "address" | "city">): string {
  const locality = listing.city.split("|")[0].split(",")[0];
  return `${listing.address} ${locality}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** joshuafink.com listing page with the Facebook spotlight UTM tags. */
export function spotlightListingUrl(listing: Pick<Listing, "address" | "city">): string {
  const url = new URL(`${SITE}/listings/${listingPageSlug(listing)}`);
  url.searchParams.set("utm_source", "facebook");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "listing");
  return url.toString();
}

export function isRecentlyFirstSeen(
  firstSeen: string | undefined,
  now: Date,
): boolean {
  if (!firstSeen) return false;
  const seen = Date.parse(firstSeen);
  if (Number.isNaN(seen)) return false;
  const age = now.getTime() - seen;
  return age >= 0 && age <= JUST_LISTED_WINDOW_MS;
}

export type SpotlightHeadline =
  | "Just Listed"
  | "Featured listing"
  | "Under contract"
  | "Coming soon"
  | "Open house";

export function spotlightHeadline(listing: Pick<Listing, "status" | "firstSeen">, now: Date): string {
  const status = listing.status.trim();
  if (/coming\s*soon/i.test(status)) return "Coming soon";
  if (/under\s*contract|\bpending\b/i.test(status)) return "Under contract";
  if (/open\s*house/i.test(status)) return "Open house";
  if (/^active$/i.test(status) || /^new$/i.test(status)) {
    return isRecentlyFirstSeen(listing.firstSeen, now) ? "Just Listed" : "Featured listing";
  }
  return status;
}

function statusHashtag(headline: string): string | null {
  if (headline === "Just Listed") return "#JustListed";
  if (headline === "Coming soon") return "#ComingSoon";
  if (headline === "Under contract") return "#UnderContract";
  if (headline === "Open house") return "#OpenHouse";
  return null;
}

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("en-US");
}

export function buildSpotlightCaption(listing: Listing, now: Date = new Date()): string {
  const headline = spotlightHeadline(listing, now);
  const parts = [
    listing.beds ? `${listing.beds} bed` : "",
    listing.baths ? `${listing.baths} bath` : "",
    listing.sqft ? `${listing.sqft.toLocaleString("en-US")} sqft` : "",
  ].filter(Boolean);
  const details = parts.join(" | ");
  const cityTag = listing.city.split(",")[0].replace(/\s+/g, "");
  const tags = [
    `#${cityTag}RealEstate`,
    "#NashvilleRealEstate",
    "#MiddleTennessee",
    "#CompassRealEstate",
    "#JoshuaFinkGroup",
    "#HomesForSale",
    "#TennesseeRealEstate",
  ];
  const statusTag = statusHashtag(headline);
  if (statusTag) tags.push(statusTag);
  const hashtags = Array.from(new Set(tags)).join(" ");
  const link = spotlightListingUrl(listing);

  return [
    headline,
    "",
    `🏡 ${listing.address}`,
    `📍 ${listing.city}`,
    `💰 ${formatPrice(listing.price)}`,
    details ? `📐 ${details}` : "",
    listing.note ? `📝 ${listing.note}` : "",
    "",
    "Ready to make a move? Contact Joshua Fink today!",
    "📲 615-551-2727",
    `🌐 ${link}`,
    "✉️ joshua@joshuafink.com",
    "",
    hashtags,
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
