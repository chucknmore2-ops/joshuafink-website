export interface ScheduledJob {
  service: string;
  channel: string;
  jobName: string;
  cronUtc: string;
  humanCt: string;
  description: string;
  source: "railway" | "vercel" | "github-actions";
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
    // Fired by .github/workflows/monthly-market-update.yml, which hits
    // /api/cron/facebook-post, /api/cron/linkedin-post?kind=market and
    // /api/cron/gbp-post?kind=market together. All three read the month's
    // figures from lib/market-snapshot.ts — the same numbers as the blog post.
    // Facebook is the one listed here: it's the freshness canary for the whole
    // monthly job in scripts/morning_healthcheck.py.
    //
    // Replaces the four Railway `autoposter-*` content services (market-stats,
    // testimonial, tips, engagement) that were listed here for months but were
    // never actually created in Railway — they only ever showed as permanent
    // [GAP]s in the morning healthcheck.
    service: "github-actions-monthly-market",
    channel: "facebook",
    jobName: "monthly-market-update",
    cronUtc: "0 14 5 * *",
    humanCt: "5th of each month, 9:00am CT",
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
    // Fired by .github/workflows/social-autopost.yml, not Vercel Cron.
    service: "github-actions-instagram",
    channel: "instagram",
    jobName: "instagram-post",
    cronUtc: "0 14 * * 3",
    humanCt: "Wed 9:00am CT",
    description: "Instagram alternating blog/listing",
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
    .map((job) => {
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
