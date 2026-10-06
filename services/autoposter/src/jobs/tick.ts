import { log } from "../log.ts";
import { listingRanThisWindow } from "../db.ts";
import { inListingWindow } from "../schedule.ts";
import { runListingSpotlight } from "./listing-spotlight.ts";
import { runMonthlyMarketUpdate } from "./monthly-market-update.ts";

/**
 * One cron wake. Listing spotlight stays on Mon/Wed/Fri ~14:00 UTC.
 * The monthly market post is attempted every wake and no-ops when that
 * month is already in post_log.
 */
export async function runAutoposterTick(now: Date = new Date()): Promise<void> {
  let failed = false;
  try {
    if (!inListingWindow(now)) {
      log.info("Listing spotlight not due.");
    } else if (await listingRanThisWindow(6)) {
      log.info("Listing spotlight already ran in this window.");
    } else {
      await runListingSpotlight();
    }
  } catch (err) {
    failed = true;
    log.error("Listing spotlight failed", err);
  }

  try {
    await runMonthlyMarketUpdate();
  } catch (err) {
    failed = true;
    log.error("Monthly market update failed", err);
  }

  if (failed) process.exitCode = 1;
}
