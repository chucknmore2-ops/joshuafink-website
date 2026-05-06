# Joshua Fink Group — AI Agent Prompts

Five system-prompt templates customized for Joshua Fink Group operations.
Each is a complete, copy-pasteable system prompt for an LLM agent (Claude
Project, custom GPT, or any chat interface that accepts a system prompt).

## How to use

1. Pick the agent that matches the task you're running (strategy review,
   AI ops audit, market scan, pre-mortem, or VOC analysis).
2. Copy the entire file contents into your tool's system prompt slot.
3. Fill in the `[BRACKETED]` placeholders before sending the first
   message — those are the inputs that change week-to-week.
4. Send your data as the first user message; the agent will return the
   structured output specified in the FORMAT section.

## The five agents

| File | Use when |
|---|---|
| [01-chief-strategy-officer.md](01-chief-strategy-officer.md) | Weekly strategy review — pattern-spotting, idea generation, what to stop doing |
| [02-ai-operations-lead.md](02-ai-operations-lead.md) | Auditing the autoposter, content engine, and CI workflows for output quality |
| [03-market-intelligence-analyst.md](03-market-intelligence-analyst.md) | Tracking competitors (Matt Ward, top Compass agents, iBuyers) and Middle TN market shifts |
| [04-pre-mortem-skeptical-advisor.md](04-pre-mortem-skeptical-advisor.md) | Stress-testing 90-day plans before betting on them |
| [05-voice-of-customer-analyst.md](05-voice-of-customer-analyst.md) | Pulling signal from Zillow reviews, contact forms, DMs, and call notes |

## Conventions baked into every prompt

- **TREC compliance is non-negotiable** — no MLS scraping, no compass.com
  scraping, no fictitious listing claims, no fair-housing-risk phrasing.
  Each prompt instructs the agent to flag anything that needs Joshua's
  TREC sign-off separately from technical/marketing changes.
- **Buyer funnels go to Compass agent profile** — every recommendation
  routes prospects to https://www.compass.com/agents/joshua-fink/ so
  Joshua remains the attributed agent.
- **Solo operator reality** — agents assume one licensed agent (Joshua)
  + one technical operator (Chuck). Recommendations should not assume
  a content team or full-time admin.
- **Concrete over vague** — every QA section pushes the agent to make
  recommendations specific enough to ship Monday.

## Editing

These prompts will need updates as the business changes. Common edits:

- Add new automations to Agent 2's workflow list (e.g., when YouTube
  walkthroughs come online, when a new Haiku content engine ships)
- Add new competitors to Agent 3 as they emerge
- Update Agent 1's "constraints" section if budget or team size changes
- Update Agent 4's "top 3 bets" each quarter

If the prompt structure itself proves unhelpful in practice, edit
freely — these are tools, not contracts.

## Autopilot status (Phase 2 active)

A weekly cron (`/api/cron/agent-briefing`, Mon 7am CT) delivers a
briefing every Monday covering all 5 JFG agents.

**Phase 2 active** when `ANTHROPIC_API_KEY` is set in Vercel:
- Agent 02 (AI Operations Lead) auto-runs on Anthropic with last
  week's autoposter activity as input. The AI report replaces the
  checklist body in the email.
- Other 4 agents stay in reminder mode until their data sources are
  also auto-pullable (the agents need inputs that live outside our
  systems — competitor news, strategic context, customer feedback).

**Phase 1 (reminder-only)** is the fallback: when `ANTHROPIC_API_KEY`
is absent, all 5 agents stay in checklist mode and Chuck runs them
manually via Claude Project / custom GPT.

## Delivery destinations

The weekly cron writes to all of these in parallel — each gracefully
degrades if its credential is missing:

| Channel | Env var | What lands there |
|---|---|---|
| Email | `SENDGRID_API_KEY` | Full markdown briefing to `chucknmore2@gmail.com` |
| Slack `#joshpersonal` | `SLACK_BOT_TOKEN` | One-line summary with ClickUp task URL |
| ClickUp | `CLICKUP_API_TOKEN` | Task in JFG list (ID `901415978281`, workspace `90141200625`) — title and full markdown body, tagged `agent-briefing` + `autopilot` |

**To get a ClickUp API token:** ClickUp → top-left avatar → **Settings** → **Apps** → click **Generate** under API Token. Paste into Vercel as `CLICKUP_API_TOKEN` (check all 3 environments) → redeploy.
