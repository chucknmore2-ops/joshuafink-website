interface ChannelStatus {
  channel: string;
  emoji: string;
  configured: boolean;
  detail: string;
  warningDays?: number;
}

function linkedinTokenWarning(): { detail: string; warningDays?: number } {
  // LinkedIn tokens expire ~60 days after issue. Last refresh recorded
  // 2026-03-21, expires ~2026-05-20. Surface a warning at <14 days.
  const expiry = new Date("2026-05-20T00:00:00Z");
  const daysLeft = Math.floor((expiry.getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0)
    return {
      detail: `Token expired ${Math.abs(daysLeft)}d ago — re-auth at /api/linkedin/auth`,
      warningDays: daysLeft,
    };
  if (daysLeft <= 14)
    return {
      detail: `Token expires in ${daysLeft}d — re-auth at /api/linkedin/auth`,
      warningDays: daysLeft,
    };
  return { detail: `Token healthy (${daysLeft}d left)` };
}

export default function ChannelHealth() {
  const li = linkedinTokenWarning();

  const channels: ChannelStatus[] = [
    {
      channel: "Facebook (Page)",
      emoji: "📘",
      configured: true,
      detail: "Page token in Railway shared variables",
    },
    {
      channel: "LinkedIn",
      emoji: "💼",
      configured: true,
      detail: li.detail,
      warningDays: li.warningDays,
    },
    {
      channel: "Google Business Profile",
      emoji: "🟦",
      configured: false,
      detail: "Awaiting Google Cloud quota increase + GBP_* env vars",
    },
    {
      channel: "Instagram",
      emoji: "📷",
      configured: false,
      detail: "Pending Business/Creator account confirmation",
    },
    {
      channel: "YouTube",
      emoji: "▶️",
      configured: false,
      detail: "Walkthrough pipeline not built yet (Phase 4)",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((c) => {
        const warn = c.warningDays != null && c.warningDays <= 14;
        const tone = !c.configured
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : warn
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-emerald-200 bg-emerald-50 text-emerald-900";
        return (
          <div
            key={c.channel}
            className={`rounded-lg border p-3 text-sm ${tone}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {c.emoji} {c.channel}
              </span>
              <span className="text-xs">
                {c.configured ? (warn ? "⚠ warning" : "● live") : "○ pending"}
              </span>
            </div>
            <div className="mt-1 text-xs">{c.detail}</div>
          </div>
        );
      })}
    </div>
  );
}
