function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  facebook: {
    pageId: required("FB_PAGE_ID"),
    pageToken: required("FB_PAGE_TOKEN"),
  },
  dryRun: process.env.AUTOPOSTER_DRY_RUN === "1",
  listingCooldownDays: Number(process.env.LISTING_COOLDOWN_DAYS ?? 7),
  listingsTsPath: process.env.LISTINGS_TS_PATH ?? "../../lib/listings.ts",
};
