import type { PostLogRow } from "@/lib/admin-db";

const channelEmoji: Record<string, string> = {
  facebook: "📘",
  instagram: "📷",
  linkedin: "💼",
  youtube: "▶️",
  gbp: "🟦",
};

const statusBadge: Record<string, string> = {
  posted: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  dry_run: "bg-slate-100 text-slate-700",
};

function fmtTimeCt(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export default function RecentActivity({ rows }: { rows: PostLogRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No posts logged yet. The first deploy of the autoposter (even in
        dry-run mode) will populate this table.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <Th>When</Th>
            <Th>Channel</Th>
            <Th>Job</Th>
            <Th>Reference</Th>
            <Th>Status</Th>
            <Th>Link</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              <Td>
                <span className="whitespace-nowrap text-slate-700">
                  {fmtTimeCt(row.posted_at)}
                </span>
              </Td>
              <Td>
                <span title={row.channel}>
                  {channelEmoji[row.channel] ?? "•"} {row.channel}
                </span>
              </Td>
              <Td>
                <span className="font-mono text-xs text-slate-600">
                  {row.job_name}
                </span>
              </Td>
              <Td>
                <span className="block max-w-[18rem] truncate" title={row.ref_key}>
                  {row.ref_key}
                </span>
                {row.error_message && (
                  <span className="block max-w-[18rem] truncate text-xs text-red-600">
                    {row.error_message}
                  </span>
                )}
              </Td>
              <Td>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusBadge[row.status] ?? "bg-slate-100 text-slate-700"
                  }`}
                >
                  {row.status}
                </span>
              </Td>
              <Td>
                {row.external_post_id ? (
                  <span className="font-mono text-xs text-slate-500">
                    {row.external_post_id.split("_").pop()}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
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
