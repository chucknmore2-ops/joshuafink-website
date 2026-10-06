export interface ScheduledJob {
  service: string;
  channel: string;
  jobName: string;
  cronUtc: string;
  humanCt: string;
  description: string;
  /**
   * Fires when something else lands (not on a clock). `upcomingSchedule`
   * shows `humanCt` instead of computing a next run from `cronUtc`.
   */
  eventDriven?: boolean;
  source: "railway" | "vercel" | "github-actions";
  /** Documented but not upcoming, and not freshness-monitored. */
  paused?: boolean;
}

export const scheduledJobs: ScheduledJob[] = [
  {
    service: "autoposter-listing",
    channel: "facebook",
    jobName: "listing-spotlight",
    cronUtc: "0 14 * * 1,3,5",
    humanCt: "Mon/Wed/Fri 9:00am CT",
    description: "Listing spotlight rotator",
    source: "railway",
  },
  {
    // Fired by .github/workflows/monthly-market-update.yml after
    // fetch-gnar-snapshot.yml merges a new month into lib/market-snapshot.ts.
    // That workflow posts LinkedIn and Google Business. Facebook is published
    // by the Railway autoposter, which reads /api/market-update/facebook and
    // dedupes on post_log (facebook, monthly-market-update, YYYY-MM). That
    // Facebook row is the freshness canary in scripts/morning_healthcheck.py.
    //
    // Replaces the four Railway `autoposter-*` content services (market-stats,
    // testimonial, tips, engagement) that were listed here for months but were
    // never actually created in Railway — they only ever showed as permanent
    // [GAP]s in the morning healthcheck.
    service: "github-actions-monthly-market",
    channel: "facebook",
    jobName: "monthly-market-update",
    cronUtc: "on-snapshot",
    eventDriven: true,
    humanCt: "When the GNAR month lands (typically the 6th–8th)",
    description: "Monthly Middle TN market update (FB + LinkedIn + GBP)",
    source: "github-actions",
  },
  {
    service: "vercel-cron-linkedin",
    channel: "linkedin",
    jobName: "linkedin-post",
    cronUtc: "0 14 * * 4",
    humanCt: "Thu 9:00am CT",
    description: "LinkedIn alternating blog/listing",
    source: "vercel",
  },
  {
    // Live via Buffer Free (IG_AUTOPOST=buffer). Graph publish stays off.
    // Freshness is a post_log row (channel instagram, job instagram-post).
    service: "github-actions-instagram",
    channel: "instagram",
    jobName: "instagram-post",
    cronUtc: "0 14 * * 3",
    humanCt: "Wed 9:00am CT",
    description: "Instagram feed photo via Buffer (Graph off)",
    source: "github-actions",
  },
  {
    service: "vercel-cron-gbp",
    channel: "gbp",
    jobName: "gbp-post",
    cronUtc: "0 14 * * 2",
    humanCt: "Tue 9:00am CT",
    description: "Google Business Profile rotator",
    source: "vercel",
  },
];

const dayMap: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function nextOccurrence(cronUtc: string, from: Date): Date {
  const [m, h, dom, _mon, dow] = cronUtc.split(" ");
  const minute = Number(m);
  const hour = Number(h);
  const allowedDays = new Set(
    dow === "*" ? [0, 1, 2, 3, 4, 5, 6] : dow.split(",").map(Number)
  );
  // Day-of-month, for monthly jobs like "0 14 5 * *". Without this a monthly
  // cron reads as daily (dow "*") and /admin shows tomorrow as its next run.
  const allowedDates =
    dom === "*" ? null : new Set(dom.split(",").map(Number));
  const candidate = new Date(from);
  candidate.setUTCSeconds(0, 0);
  // Scan far enough ahead to clear a full month for the monthly jobs.
  for (let add = 0; add < 40; add++) {
    const d = new Date(candidate);
    d.setUTCDate(candidate.getUTCDate() + add);
    d.setUTCHours(hour, minute, 0, 0);
    if (d <= from) continue;
    if (allowedDates && !allowedDates.has(d.getUTCDate())) continue;
    if (allowedDays.has(d.getUTCDay())) return d;
  }
  return candidate;
}

export interface UpcomingPost extends ScheduledJob {
  nextRun: Date;
  nextRunLabel: string;
}

export function upcomingSchedule(now = new Date()): UpcomingPost[] {
  return scheduledJobs
    .filter((job) => !job.paused)
    .map((job) => {
      if (job.eventDriven) {
        return {
          ...job,
          nextRun: new Date("2099-01-01T00:00:00Z"),
          nextRunLabel: job.humanCt,
        };
      }
      const nextRun = nextOccurrence(job.cronUtc, now);
      return {
        ...job,
        nextRun,
        nextRunLabel: formatCt(nextRun),
      };
    })
    .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
}

function formatCt(d: Date): string {
  const ct = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return ct + " CT";
}
