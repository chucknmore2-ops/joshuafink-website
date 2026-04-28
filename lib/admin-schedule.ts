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
    service: "autoposter-stats",
    channel: "facebook",
    jobName: "content-market-stats",
    cronUtc: "0 15 * * 2",
    humanCt: "Tue 10:00am CT",
    description: "Middle TN market stats",
    source: "railway",
  },
  {
    service: "autoposter-testimonial",
    channel: "facebook",
    jobName: "content-testimonial",
    cronUtc: "0 15 * * 3",
    humanCt: "Wed 10:00am CT",
    description: "Client testimonial",
    source: "railway",
  },
  {
    service: "autoposter-tips",
    channel: "facebook",
    jobName: "content-tips",
    cronUtc: "0 15 * * 4",
    humanCt: "Thu 10:00am CT",
    description: "Real estate tips",
    source: "railway",
  },
  {
    service: "autoposter-engagement",
    channel: "facebook",
    jobName: "content-engagement",
    cronUtc: "0 15 * * 5",
    humanCt: "Fri 10:00am CT",
    description: "Engagement post",
    source: "railway",
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
  const [m, h, _dom, _mon, dow] = cronUtc.split(" ");
  const minute = Number(m);
  const hour = Number(h);
  const allowedDays = new Set(
    dow === "*" ? [0, 1, 2, 3, 4, 5, 6] : dow.split(",").map(Number)
  );
  const candidate = new Date(from);
  candidate.setUTCSeconds(0, 0);
  for (let add = 0; add < 14; add++) {
    const d = new Date(candidate);
    d.setUTCDate(candidate.getUTCDate() + add);
    d.setUTCHours(hour, minute, 0, 0);
    if (d <= from) continue;
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
