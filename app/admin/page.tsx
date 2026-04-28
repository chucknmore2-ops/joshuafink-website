import {
  activityCounts,
  isDbConfigured,
  lastPostPerListing,
  recentPosts,
} from "@/lib/admin-db";
import { upcomingSchedule } from "@/lib/admin-schedule";
import { listings } from "@/lib/listings";
import RecentActivity from "./components/RecentActivity";
import ListingsTable from "./components/ListingsTable";
import ScheduleCard from "./components/ScheduleCard";
import ChannelHealth from "./components/ChannelHealth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminDashboard() {
  const dbReady = isDbConfigured();
  const [recent, perListing, counts] = dbReady
    ? await Promise.all([
        recentPosts(50),
        lastPostPerListing(),
        activityCounts(),
      ])
    : [[], [], { posted_7d: 0, failed_7d: 0, dry_run_7d: 0 }];

  const upcoming = upcomingSchedule().slice(0, 7);

  return (
    <div className="space-y-8">
      {!dbReady && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>DATABASE_URL is not set.</strong> Add the Railway Postgres
          public connection string to Vercel project env vars
          (Settings → Environment Variables) so this dashboard can read{" "}
          <code>post_log</code>. Until then, only the schedule + listings
          tables show.
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Posted (7d)" value={counts.posted_7d} tone="green" />
        <Stat label="Dry runs (7d)" value={counts.dry_run_7d} tone="slate" />
        <Stat label="Failed (7d)" value={counts.failed_7d} tone="red" />
        <Stat label="Active listings" value={listings.length} tone="navy" />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Upcoming schedule (next 7 jobs)
        </h2>
        <ScheduleCard upcoming={upcoming} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Listings
        </h2>
        <ListingsTable listings={listings} lastPostsByRef={perListing} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Recent activity
        </h2>
        <RecentActivity rows={recent} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Channel health
        </h2>
        <ChannelHealth />
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "red" | "slate" | "navy";
}) {
  const toneClass = {
    green: "text-emerald-700",
    red: "text-red-700",
    slate: "text-slate-700",
    navy: "text-slate-900",
  }[tone];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
