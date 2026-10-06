import { env } from "../env.ts";
import { log } from "../log.ts";
import { hasPostedRef, logPost } from "../db.ts";
import { postToFacebookPage } from "../channels/facebook.ts";

const CHANNEL = "facebook";
const JOB_NAME = "monthly-market-update";
const PAYLOAD_KIND = "market";

const SOURCE_URL =
  process.env.MARKET_FACEBOOK_URL ??
  "https://www.joshuafink.com/api/market-update/facebook";

interface MarketFacebookPost {
  month: string;
  message: string;
  link: string;
}

/**
 * Publish the current month to the Facebook Page using this service's
 * FB_PAGE_ID / FB_PAGE_TOKEN. The site composes the copy. post_log dedupes
 * on (facebook, monthly-market-update, YYYY-MM), which is the row the
 * morning healthcheck reads.
 */
export async function runMonthlyMarketUpdate(): Promise<void> {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    log.error(`Market copy fetch failed: HTTP ${res.status} ${SOURCE_URL}`);
    return;
  }
  const body = (await res.json()) as { post?: MarketFacebookPost | null };
  const post = body.post;
  if (!post?.month || !post.message || !post.link) {
    log.info("No current market snapshot to publish.");
    return;
  }

  if (await hasPostedRef({ channel: CHANNEL, jobName: JOB_NAME, refKey: post.month })) {
    log.info(`Already posted ${post.month}.`);
    return;
  }

  log.info(`Publishing ${post.month} to Facebook.`);
  if (env.dryRun) {
    await logPost({
      channel: CHANNEL,
      jobName: JOB_NAME,
      payloadKind: PAYLOAD_KIND,
      refKey: post.month,
      messagePreview: post.message.slice(0, 280),
      link: post.link,
      status: "dry_run",
      dryRun: true,
    });
    log.info("DRY RUN — monthly market post was not sent.");
    return;
  }

  const result = await postToFacebookPage({ message: post.message, link: post.link });
  if (result.id) {
    log.info(`Posted ✅ FB post ID: ${result.id}`);
    await logPost({
      channel: CHANNEL,
      jobName: JOB_NAME,
      payloadKind: PAYLOAD_KIND,
      refKey: post.month,
      messagePreview: post.message.slice(0, 280),
      link: post.link,
      externalPostId: result.id,
      status: "posted",
      dryRun: false,
    });
    return;
  }

  const err = result.error?.message ?? "unknown error";
  log.error(`Monthly market post failed: ${err}`);
  await logPost({
    channel: CHANNEL,
    jobName: JOB_NAME,
    payloadKind: PAYLOAD_KIND,
    refKey: post.month,
    messagePreview: post.message.slice(0, 280),
    link: post.link,
    status: "failed",
    errorMessage: err,
    dryRun: false,
  });
  throw new Error(err);
}
