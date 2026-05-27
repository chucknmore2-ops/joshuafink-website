import { env } from "../env.ts";
import { log } from "../log.ts";
import { logPost } from "../db.ts";
import { postToFacebookPage } from "../channels/facebook.ts";
import { testimonials } from "../content/testimonials.ts";
import { marketStats } from "../content/market-stats.ts";
import { tipsPosts } from "../content/tips.ts";
import { engagementPosts } from "../content/engagement.ts";

export type ContentKind = "market-stats" | "testimonial" | "tips" | "engagement";

const CHANNEL = "facebook";

function pickRotating<T>(arr: T[]): T {
  const day = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  return arr[day % arr.length];
}

function buildMessage(kind: ContentKind): { message: string; link?: string; refKey: string } {
  switch (kind) {
    case "testimonial": {
      const t = pickRotating(testimonials);
      return {
        message: `⭐⭐⭐⭐⭐ CLIENT REVIEW

"${t.text}"

— ${t.reviewer}, ${t.location}

Join 218+ satisfied clients across Middle Tennessee. Ready to work together?

📲 615-551-2727
✉️ joshua@joshuafink.com
🌐 joshuafink.com

#ClientReview #NashvilleRealEstate #JoshuaFinkGroup #CompassRealEstate #MiddleTennessee #Testimonial`,
        link: "https://www.zillow.com/profile/JoshuaFinkGroup",
        refKey: t.reviewer,
      };
    }
    case "market-stats": {
      const s = pickRotating(marketStats);
      return {
        message: `📊 MIDDLE TENNESSEE MARKET UPDATE

📈 ${s.stat}

💡 ${s.insight}

Have questions about what this means for you? I'm here to help!

📲 615-551-2727
✉️ joshua@joshuafink.com
🌐 joshuafink.com

#RealEstateMarket #NashvilleRealEstate #MiddleTennessee #MarketUpdate #JoshuaFinkGroup #CompassRealEstate`,
        refKey: s.stat,
      };
    }
    case "tips": {
      const message = pickRotating(tipsPosts);
      return { message, refKey: message.split("\n")[0].slice(0, 60) };
    }
    case "engagement": {
      const message = pickRotating(engagementPosts);
      return { message, refKey: message.split("\n")[0].slice(0, 60) };
    }
  }
}

export async function runContentRotator(kind: ContentKind): Promise<void> {
  const jobName = `content-${kind}`;
  const { message, link, refKey } = buildMessage(kind);

  log.info(`Job: ${jobName}`);
  log.info(`--- PREVIEW ---\n${message}\n---------------`);

  if (env.dryRun) {
    await logPost({
      channel: CHANNEL,
      jobName,
      payloadKind: "content",
      refKey,
      messagePreview: message.slice(0, 280),
      link: link ?? null,
      status: "dry_run",
      dryRun: true,
    });
    log.info("DRY RUN — no API call made.");
    return;
  }

  const result = await postToFacebookPage({ message, link });
  if (result.id) {
    log.info(`Posted ✅ FB post ID: ${result.id}`);
    await logPost({
      channel: CHANNEL,
      jobName,
      payloadKind: "content",
      refKey,
      messagePreview: message.slice(0, 280),
      link: link ?? null,
      externalPostId: result.id,
      status: "posted",
      dryRun: false,
    });
  } else {
    const err = result.error?.message ?? "unknown error";
    log.error(`Post failed: ${err}`);
    await logPost({
      channel: CHANNEL,
      jobName,
      payloadKind: "content",
      refKey,
      messagePreview: message.slice(0, 280),
      link: link ?? null,
      status: "failed",
      errorMessage: err,
      dryRun: false,
    });
    process.exitCode = 1;
  }
}
