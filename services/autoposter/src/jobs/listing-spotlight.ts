import { env } from "../env.ts";
import { log } from "../log.ts";
import { logPost, recentlyPosted } from "../db.ts";
import { loadListings, type Listing } from "../listings.ts";
import { postToFacebookPage } from "../channels/facebook.ts";

const CHANNEL = "facebook";
const JOB_NAME = "listing-spotlight";
const PAYLOAD_KIND = "listing";

function isEligible(l: Listing): boolean {
  return !l.status.toLowerCase().includes("under contract");
}

function formatPrice(price: number): string {
  return "$" + price.toLocaleString("en-US");
}

function statusTag(status: string): string {
  if (status === "Active") return "🟢 Available Now";
  if (status === "New") return "🆕 Just Listed";
  if (status.toLowerCase().includes("under contract")) return "🔴 Under Contract";
  if (status.toLowerCase().includes("open")) return `🏠 ${status}`;
  return status;
}

function buildCaption(listing: Listing): string {
  const parts = [
    listing.beds ? `${listing.beds} bed` : "",
    listing.baths ? `${listing.baths} bath` : "",
    listing.sqft ? `${listing.sqft.toLocaleString()} sqft` : "",
  ].filter(Boolean);
  const details = parts.join(" | ");
  const cityTag = listing.city.split(",")[0].replace(/\s+/g, "");
  // Dedupe: Nashville listings derive "#NashvilleRealEstate" as their city tag,
  // which collides with the hardcoded one and doubled it in every caption.
  const hashtags = Array.from(
    new Set([
      `#${cityTag}RealEstate`,
      "#NashvilleRealEstate",
      "#MiddleTennessee",
      "#CompassRealEstate",
      "#JoshuaFinkGroup",
      "#HomesForSale",
      "#TennesseeRealEstate",
      "#JustListed",
    ]),
  ).join(" ");

  return [
    statusTag(listing.status),
    "",
    `🏡 ${listing.address}`,
    `📍 ${listing.city}`,
    `💰 ${formatPrice(listing.price)}`,
    details ? `📐 ${details}` : "",
    listing.note ? `📝 ${listing.note}` : "",
    "",
    "Ready to make a move? Contact Joshua Fink today!",
    "📲 615-551-2727",
    "🌐 joshuafink.com",
    "✉️ joshua@joshuafink.com",
    "",
    hashtags,
  ]
    .filter((line) => line !== "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

export async function runListingSpotlight(): Promise<void> {
  let listings: Listing[];
  try {
    listings = await loadListings();
  } catch (err) {
    // Without this row the fetch failure writes nothing to post_log, so the
    // morning healthcheck sees a bare STALE with no reason — only Railway's
    // crash email carries the cause.
    const message = err instanceof Error ? err.message : String(err);
    log.error(`Listings fetch failed: ${message}`);
    await logPost({
      channel: CHANNEL,
      jobName: JOB_NAME,
      payloadKind: PAYLOAD_KIND,
      refKey: "listings-fetch",
      status: "failed",
      errorMessage: message,
      dryRun: env.dryRun,
    });
    throw err;
  }
  log.info(`Loaded ${listings.length} listings from disk`);

  const eligible: Listing[] = [];
  for (const l of listings) {
    if (!isEligible(l)) continue;
    const onCooldown = await recentlyPosted({
      channel: CHANNEL,
      payloadKind: PAYLOAD_KIND,
      refKey: l.address,
      withinDays: env.listingCooldownDays,
    });
    if (!onCooldown) eligible.push(l);
  }

  log.info(`${eligible.length} listings eligible (not on cooldown)`);
  if (eligible.length === 0) {
    // Without this row a quiet run (everything on cooldown / under contract)
    // and a cron that never fired look identical in /admin. payload_kind
    // "none" keeps it out of the per-listing rotation view.
    await logPost({
      channel: CHANNEL,
      jobName: JOB_NAME,
      payloadKind: "none",
      refKey: "no-eligible-listings",
      messagePreview: "Ran — nothing to post today (no eligible listings off cooldown)",
      status: "dry_run",
      dryRun: env.dryRun,
    });
    log.info("Nothing to post — exiting clean.");
    return;
  }

  const listing = eligible[0];
  const caption = buildCaption(listing);
  log.info(`Selected: ${listing.address}`);
  log.info(`--- PREVIEW ---\n${caption}\n---------------`);

  if (env.dryRun) {
    await logPost({
      channel: CHANNEL,
      jobName: JOB_NAME,
      payloadKind: PAYLOAD_KIND,
      refKey: listing.address,
      messagePreview: caption.slice(0, 280),
      link: listing.compassUrl,
      status: "dry_run",
      dryRun: true,
    });
    log.info("DRY RUN — no API call made.");
    return;
  }

  const result = await postToFacebookPage({
    message: caption,
    link: listing.compassUrl,
  });

  if (result.id) {
    log.info(`Posted ✅ FB post ID: ${result.id}`);
    await logPost({
      channel: CHANNEL,
      jobName: JOB_NAME,
      payloadKind: PAYLOAD_KIND,
      refKey: listing.address,
      messagePreview: caption.slice(0, 280),
      link: listing.compassUrl,
      externalPostId: result.id,
      status: "posted",
      dryRun: false,
    });
  } else {
    const err = result.error?.message ?? "unknown error";
    log.error(`Post failed: ${err}`);
    await logPost({
      channel: CHANNEL,
      jobName: JOB_NAME,
      payloadKind: PAYLOAD_KIND,
      refKey: listing.address,
      messagePreview: caption.slice(0, 280),
      link: listing.compassUrl,
      status: "failed",
      errorMessage: err,
      dryRun: false,
    });
    process.exitCode = 1;
  }
}
