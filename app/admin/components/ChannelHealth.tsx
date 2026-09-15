interface ChannelStatus {
  channel: string;
  emoji: string;
  configured: boolean;
  detail: string;
  warningDays?: number;
}

// Statuses are derived from the same env vars the crons read, so this card
// can't drift the way the hard-coded version did — it showed Google Business
// Profile and Instagram as "pending" months after both went live, and counted
// LinkedIn down to an expiry date from May.

function linkedinStatus(): Pick<ChannelStatus, "configured" | "detail" | "warningDays"> {
  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    return { configured: false, detail: "LINKEDIN_ACCESS_TOKEN not set — authorize at /api/linkedin/auth" };
  }
  const expiresAt = Number(process.env.LINKEDIN_TOKEN_EXPIRES_AT_MS ?? 0);
  if (!expiresAt) {
    // Unknown is treated as a warning: the token lasts ~60 days and nothing
    // can say how many of them are left.
    return {
      configured: true,
      detail: "Expiry unknown — re-auth at /api/linkedin/auth and save LINKEDIN_TOKEN_EXPIRES_AT_MS",
      warningDays: 0,
    };
  }
  const daysLeft = Math.floor((expiresAt - Date.now()) / 86_400_000);
  if (daysLeft < 0)
    return {
      detail: `Token expired ${Math.abs(daysLeft)}d ago — re-auth at /api/linkedin/auth`,
      configured: true,
      warningDays: daysLeft,
    };
  if (daysLeft <= 14)
    return {
      detail: `Token expires in ${daysLeft}d — re-auth at /api/linkedin/auth`,
      configured: true,
      warningDays: daysLeft,
    };
  return { configured: true, detail: `Token healthy (${daysLeft}d left) — posts Thursdays` };
}

export default function ChannelHealth() {
  const li = linkedinStatus();
  const gbpReady = Boolean(process.env.GBP_REFRESH_TOKEN && process.env.GBP_LOCATION_ID);
  const igReady = Boolean(process.env.IG_ACCESS_TOKEN && process.env.IG_BUSINESS_ACCOUNT_ID);

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
      ...li,
    },
    {
      channel: "Google Business Profile",
      emoji: "🟦",
      configured: gbpReady,
      detail: gbpReady ? "Posts Tuesdays" : "GBP_REFRESH_TOKEN / GBP_LOCATION_ID not set",
    },
    {
      channel: "Instagram",
      emoji: "📷",
      configured: igReady,
      detail: igReady ? "Posts Wednesdays" : "IG_BUSINESS_ACCOUNT_ID / IG_ACCESS_TOKEN not set",
    },
    {
      channel: "YouTube",
      emoji: "▶️",
      configured: false,
      detail: "Walkthrough videos are generated locally; the upload step isn't built yet",
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
