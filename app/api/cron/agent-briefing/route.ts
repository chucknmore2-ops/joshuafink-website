import { NextResponse } from 'next/server'
import { activityCounts, recentPosts, isDbConfigured } from '@/lib/admin-db'
import { AGENT_02_SYSTEM_PROMPT } from '@/lib/agent-prompts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Weekly Agent Briefing — Phase 1 of the agent autopilot plan.
//
// Fires every Monday at 7am CT (12:00 UTC). Pulls last 7 days of autoposter
// activity from /admin Postgres, formats a markdown briefing covering all
// five JFG agents (see marketing/agent-prompts/), and emails it to Chuck
// via SendGrid + posts a short summary to #joshpersonal Slack.
//
// Phase 1 (reminder mode): when ANTHROPIC_API_KEY is NOT set, Chuck gets
// the prefilled prompt bodies and runs them through a Claude Project /
// custom GPT manually.
//
// Phase 2 (autopilot mode): when ANTHROPIC_API_KEY IS set, this route
// calls Anthropic directly for any agent that has fully auto-pullable
// data inputs (currently just Agent 02 — AI Operations Lead). The AI's
// response replaces the agent's checklist body in the email. Other
// agents stay in reminder mode until their data sources are also
// auto-pullable.
//
// Required env vars (already in Vercel from the contact-form integration):
//   CRON_SECRET            — bearer auth on /api/cron/*
//   SENDGRID_API_KEY       — email delivery
//   SLACK_BOT_TOKEN        — Slack post (optional, gracefully degrades)
//   DATABASE_URL           — Postgres for autoposter activity (optional)
//
// Optional env var for Phase 2 (autopilot):
//   ANTHROPIC_API_KEY      — sk-ant-... key from console.anthropic.com.
//                            When present, route auto-runs Agent 02
//                            against the activity data and emails the
//                            AI report instead of the raw prompt.
//
// Optional env var for ClickUp delivery:
//   CLICKUP_API_TOKEN      — pk_... personal token from ClickUp.
//                            Settings → Apps → API Token → Generate.
//                            When set, route also creates a task in the
//                            JFG ClickUp list each week so Chuck can mark
//                            done / comment / discuss.

const TO_EMAIL = 'chucknmore2@gmail.com'
const FROM_EMAIL = 'leads@joshuafink.com'
const SLACK_CHANNEL = 'C0APH84LFG8' // #joshpersonal — same channel as contact-form leads
const CLICKUP_LIST_ID = '901415978281' // JFG agent-briefing list (workspace 90141200625)

const AGENTS = [
  {
    n: '01',
    title: 'Chief Strategy Officer',
    file: 'marketing/agent-prompts/01-chief-strategy-officer.md',
    needsInput:
      'Closed deals, lead counts, top 3 objections, what shipped this week, GBP/LI/IG/FB engagement deltas',
  },
  {
    n: '02',
    title: 'AI Operations Lead',
    file: 'marketing/agent-prompts/02-ai-operations-lead.md',
    needsInput:
      'Auto-prefilled below from /admin Postgres — paste the activity summary into the "outputs sample" + "errors" sections',
  },
  {
    n: '03',
    title: 'Market Intelligence Analyst',
    file: 'marketing/agent-prompts/03-market-intelligence-analyst.md',
    needsInput:
      'This week\'s competitor posts (Matt Ward, top Compass agents), industry news links, MLS stats',
  },
  {
    n: '04',
    title: 'Pre-Mortem Skeptical Advisor',
    file: 'marketing/agent-prompts/04-pre-mortem-skeptical-advisor.md',
    needsInput:
      'Quarterly cadence — only run when setting a new 90-day goal. Skip most weeks.',
  },
  {
    n: '05',
    title: 'Voice of Customer Analyst',
    file: 'marketing/agent-prompts/05-voice-of-customer-analyst.md',
    needsInput:
      'New Zillow reviews, contact-form submissions, /sell + /cash-offer leads, social DMs from the past week',
  },
]

function formatActivitySection(
  counts: { posted_7d: number; failed_7d: number; dry_run_7d: number },
  recent: Array<{
    channel: string
    job_name: string
    status: string
    posted_at: string
    error_message: string | null
    message_preview: string | null
  }>,
): string {
  const total = counts.posted_7d + counts.failed_7d + counts.dry_run_7d
  if (total === 0 && recent.length === 0) {
    return [
      '### Last 7 days — no autoposter activity in /admin Postgres',
      '',
      'Either DATABASE_URL is not configured for this Vercel deployment,',
      'no crons fired this week, or all rows have aged out. Worth checking',
      'Railway autoposter logs and /admin Channel Health directly before',
      'concluding the channels went dark.',
    ].join('\n')
  }

  const byChannel: Record<string, { posted: number; failed: number; dry: number }> = {}
  for (const row of recent) {
    const c = (byChannel[row.channel] = byChannel[row.channel] ?? {
      posted: 0,
      failed: 0,
      dry: 0,
    })
    if (row.status === 'posted') c.posted++
    else if (row.status === 'failed') c.failed++
    else if (row.status === 'dry_run') c.dry++
  }
  const errors = recent
    .filter((r) => r.status === 'failed' && r.error_message)
    .slice(0, 5)
    .map((r) => `- **${r.channel}/${r.job_name}** — ${r.error_message}`)

  const channelLines = Object.entries(byChannel)
    .map(
      ([ch, c]) =>
        `- **${ch}**: ${c.posted} posted · ${c.failed} failed · ${c.dry} dry-run`,
    )
    .join('\n')

  return [
    '### Last 7 days — autoposter activity',
    '',
    `**Totals:** ${counts.posted_7d} posted · ${counts.failed_7d} failed · ${counts.dry_run_7d} dry-run`,
    '',
    '**By channel:**',
    channelLines || '- (no rows in window)',
    '',
    errors.length > 0 ? '**Errors worth reviewing:**' : '',
    errors.join('\n'),
  ]
    .filter(Boolean)
    .join('\n')
}

function buildBriefing(
  activitySection: string,
  autopilot: { agent02Report: string | null },
): { subject: string; markdown: string; html: string } {
  const date = new Date().toISOString().slice(0, 10)
  const autopilotMode = autopilot.agent02Report !== null
  const subject = autopilotMode
    ? `Weekly Agent Briefing · ${date} · autopilot`
    : `Weekly Agent Briefing · ${date}`

  const agentSection = (a: (typeof AGENTS)[number]) => {
    if (a.n === '02' && autopilot.agent02Report) {
      return [
        `### ${a.n} — ${a.title} · 🤖 autopilot ran`,
        '',
        autopilot.agent02Report,
        '',
      ]
    }
    return [
      `### ${a.n} — ${a.title}`,
      `**File:** \`${a.file}\``,
      `**You need to provide:** ${a.needsInput}`,
      '',
    ]
  }

  const md = [
    `# ${subject}`,
    '',
    autopilotMode
      ? 'Auto-generated by the JFG agent-briefing cron. Agent 02 ran on autopilot — its report is inline below. The other agents still need your manual input via Claude Project / custom GPT (each prompt lives in `marketing/agent-prompts/`).'
      : 'Auto-generated by the JFG agent-briefing cron. Each section below maps to a system prompt in `marketing/agent-prompts/`. Open the file, copy the prompt block, paste into Claude Project / custom GPT, fill the bracketed inputs, then send.',
    '',
    activitySection,
    '',
    '---',
    '',
    "## This week's agent run-list",
    '',
    ...AGENTS.flatMap(agentSection),
    '---',
    '',
    autopilotMode
      ? '## Want more agents on autopilot?'
      : '## Phase 2 promotion',
    '',
    autopilotMode
      ? 'Currently only Agent 02 (AI Operations Lead) runs on autopilot because its data is fully auto-pullable from /admin Postgres. The other four agents need inputs that live outside our systems — competitor news (03), strategic context (01), quarterly bets (04), customer feedback (05). When those data sources become automatable, more agents promote to autopilot. Until then, run them manually as needed.'
      : [
          'Once we know which of these agents you actually run weekly, we promote',
          'them to full autopilot by adding `ANTHROPIC_API_KEY` to Vercel and',
          'extending this route to call the Anthropic API directly.',
          '',
          '**Where to put the key when ready:**',
          '1. Vercel → joshuafink-website → Settings → Environment Variables',
          '2. Add `ANTHROPIC_API_KEY` with your key value',
          '3. Check all 3 environments (Production, Preview, Development)',
          '4. Save → Redeploy latest production',
          '',
          'Once present, this cron will fan out: pull data → call Anthropic per',
          'agent → write each report to `/admin/reports/<date>-<agent>.md` →',
          'email you the report URLs instead of the raw prompts.',
        ].join('\n'),
  ].join('\n')

  const html = md
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
  const wrappedHtml = `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:680px;margin:0 auto;padding:24px;line-height:1.55"><p>${html}</p></div>`

  return { subject, markdown: md, html: wrappedHtml }
}

async function sendEmail(subject: string, html: string, plain: string): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY
  if (!key) return false
  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL }] }],
        from: { email: FROM_EMAIL, name: 'JFG Agent Briefing' },
        subject,
        content: [
          { type: 'text/plain', value: plain },
          { type: 'text/html', value: html },
        ],
      }),
    })
    return res.ok
  } catch (err) {
    console.error('[agent-briefing] sendgrid error', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// Phase 2 — Anthropic autopilot
// ---------------------------------------------------------------------------

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const AUTOPILOT_MODEL = 'claude-sonnet-4-6'

type AnthropicResult =
  | { ok: true; report: string }
  | { ok: false; error: string }

async function runAgent02Autopilot(activitySection: string): Promise<AnthropicResult> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return { ok: false, error: 'no_key' }

  const userMessage =
    `Here is this week's autoposter activity from /admin Postgres. ` +
    `Run the audit per the FORMAT section.\n\n${activitySection}`

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: AUTOPILOT_MODEL,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: AGENT_02_SYSTEM_PROMPT,
            // Cache the large system prompt across weekly invocations to
            // cut cost ~85% on repeat runs.
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!res.ok) {
      const snippet = await res
        .text()
        .then((t) => t.slice(0, 200).replace(/[^\w\s.:,\-]/g, ''))
        .catch(() => '')
      console.error('[agent-briefing] anthropic upstream', res.status, snippet)
      return { ok: false, error: `upstream_${res.status}` }
    }
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>
    }
    const report = (data.content || [])
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('\n')
      .trim()
    if (!report) return { ok: false, error: 'empty_response' }
    return { ok: true, report }
  } catch (err) {
    console.error('[agent-briefing] anthropic network', err)
    return { ok: false, error: 'network' }
  }
}

async function postSlackSummary(activityLine: string): Promise<boolean> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return false
  try {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: SLACK_CHANNEL,
        text: `🤖 Weekly Agent Briefing emailed to Chuck. ${activityLine}`,
      }),
    })
    return res.ok
  } catch (err) {
    console.error('[agent-briefing] slack error', err)
    return false
  }
}

// ---------------------------------------------------------------------------
// ClickUp — create a task per weekly briefing so Chuck can mark done / discuss
// ---------------------------------------------------------------------------

async function createClickUpTask(
  title: string,
  markdownDescription: string,
): Promise<{ ok: boolean; taskId?: string; url?: string; error?: string }> {
  const token = process.env.CLICKUP_API_TOKEN
  if (!token) return { ok: false, error: 'no_token' }

  // ClickUp's task description supports markdown when sent via
  // `markdown_content`. Plain `description` strips formatting on the
  // API side. Sending both keeps email/Slack in sync as plaintext while
  // the ClickUp UI renders markdown.
  try {
    const res = await fetch(
      `https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task`,
      {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title,
          markdown_content: markdownDescription,
          description: markdownDescription,
          tags: ['agent-briefing', 'autopilot'],
          notify_all: false,
        }),
      },
    )
    if (!res.ok) {
      const snippet = await res
        .text()
        .then((t) => t.slice(0, 200).replace(/[^\w\s.:,\-]/g, ''))
        .catch(() => '')
      console.error('[agent-briefing] clickup error', res.status, snippet)
      return { ok: false, error: `upstream_${res.status}` }
    }
    const data = (await res.json()) as { id?: string; url?: string }
    return { ok: true, taskId: data.id, url: data.url }
  } catch (err) {
    console.error('[agent-briefing] clickup network', err)
    return { ok: false, error: 'network' }
  }
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'agent-briefing cron not configured (missing CRON_SECRET)' },
      { status: 500 },
    )
  }
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (bearer !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const counts = isDbConfigured()
    ? await activityCounts()
    : { posted_7d: 0, failed_7d: 0, dry_run_7d: 0 }
  const recent = isDbConfigured() ? await recentPosts(100) : []
  const activitySection = formatActivitySection(counts, recent)

  // Phase 2 — if ANTHROPIC_API_KEY is set, run Agent 02 on autopilot.
  let agent02Report: string | null = null
  let autopilotError: string | null = null
  if (process.env.ANTHROPIC_API_KEY) {
    const result = await runAgent02Autopilot(activitySection)
    if (result.ok) {
      agent02Report = result.report
    } else {
      autopilotError = result.error
    }
  }

  const { subject, markdown, html } = buildBriefing(activitySection, {
    agent02Report,
  })
  const emailed = await sendEmail(subject, html, markdown)
  const clickup = await createClickUpTask(subject, markdown)
  const autopilotLine = agent02Report
    ? '🤖 Agent 02 autopilot ran. '
    : autopilotError
      ? `⚠️ Autopilot attempted, error: ${autopilotError}. `
      : ''
  const clickupLine = clickup.ok && clickup.url
    ? ` · ClickUp task: ${clickup.url}`
    : ''
  const slacked = await postSlackSummary(
    `${autopilotLine}${counts.posted_7d}/7d posted · ${counts.failed_7d} failed · ${counts.dry_run_7d} dry-run${clickupLine}`,
  )

  return NextResponse.json({
    sent: true,
    emailed,
    slacked,
    clickup: clickup.ok
      ? { ok: true, taskId: clickup.taskId, url: clickup.url }
      : { ok: false, error: clickup.error },
    autopilot: agent02Report
      ? 'agent_02_ran'
      : autopilotError
        ? `error_${autopilotError}`
        : 'reminder_only',
    activity: counts,
    recentRowCount: recent.length,
    at: new Date().toISOString(),
  })
}
