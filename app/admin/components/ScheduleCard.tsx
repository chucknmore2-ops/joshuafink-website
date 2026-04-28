import type { UpcomingPost } from "@/lib/admin-schedule";

const channelEmoji: Record<string, string> = {
  facebook: "📘",
  instagram: "📷",
  linkedin: "💼",
  youtube: "▶️",
  gbp: "🟦",
};

const sourceLabel: Record<UpcomingPost["source"], string> = {
  railway: "Railway",
  vercel: "Vercel Cron",
  "github-actions": "GitHub Actions",
};

export default function ScheduleCard({
  upcoming,
}: {
  upcoming: UpcomingPost[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <Th>When</Th>
            <Th>Channel</Th>
            <Th>What</Th>
            <Th>Hosted on</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {upcoming.map((u) => (
            <tr key={u.service + u.nextRun.toISOString()} className="hover:bg-slate-50">
              <Td>
                <span className="whitespace-nowrap font-medium text-slate-900">
                  {u.nextRunLabel}
                </span>
              </Td>
              <Td>
                <span title={u.channel}>
                  {channelEmoji[u.channel] ?? "•"} {u.channel}
                </span>
              </Td>
              <Td>
                <div className="text-slate-700">{u.description}</div>
                <div className="font-mono text-xs text-slate-400">
                  {u.jobName}
                </div>
              </Td>
              <Td>
                <span className="text-xs text-slate-500">
                  {sourceLabel[u.source]}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 align-top">{children}</td>;
}
