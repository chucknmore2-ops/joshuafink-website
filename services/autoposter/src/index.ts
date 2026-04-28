import { log } from "./log.ts";
import { pool } from "./db.ts";
import { applySchema } from "./schema.ts";
import { runListingSpotlight } from "./jobs/listing-spotlight.ts";
import { runContentRotator } from "./jobs/content-rotator.ts";

const JOBS = {
  "listing-spotlight": () => runListingSpotlight(),
  "content-market-stats": () => runContentRotator("market-stats"),
  "content-testimonial": () => runContentRotator("testimonial"),
  "content-tips": () => runContentRotator("tips"),
  "content-engagement": () => runContentRotator("engagement"),
} as const satisfies Record<string, () => Promise<void>>;

type JobName = keyof typeof JOBS;

function isJobName(s: string): s is JobName {
  return s in JOBS;
}

async function main() {
  const jobName = process.argv[2] ?? process.env.JOB_NAME;
  if (!jobName || jobName === "help") {
    log.info("Usage: tsx src/index.ts <job-name>");
    log.info("Jobs: " + Object.keys(JOBS).join(", "));
    process.exit(jobName === "help" ? 0 : 2);
  }
  if (!isJobName(jobName)) {
    log.error(`Unknown job: ${jobName}`);
    log.info("Jobs: " + Object.keys(JOBS).join(", "));
    process.exit(2);
  }

  log.info(`Starting job: ${jobName}`);
  try {
    await applySchema();
    await JOBS[jobName]();
    log.info(`Job complete: ${jobName}`);
  } catch (err) {
    log.error(`Job failed: ${jobName}`, err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
