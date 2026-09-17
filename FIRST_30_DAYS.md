# First 30 days — operating joshuafink.com

Written for whoever runs the site day to day. `HANDOFF.md` explains how the
system works; this is the recurring checklist. Nothing here needs Claude.

---

## Every Monday (about 20 minutes)

**1. Check the morning healthcheck Action.** It runs Mon–Fri. A red X
means something failed — open the workflow log, not the inbox. Email is
opt-in only (no mail on schedule or default dispatch). To force one:

```bash
gh workflow run morning_healthcheck.yml -f always_email=true
```

**2. Reconcile leads. This is how "are we getting leads?" gets answered.**

| Source | Where | What to note |
|---|---|---|
| GA4 `generate_lead` | GA4 → Reports → Engagement → Events, last 7 days | count |
| CRM rows | the lead sheet's **CRM** tab | count of rows with `received_at` in the last 7 days |
| Blocked | the sheet's **Blocked** tab | any row that looks like a real person |
| Inbox | Joshua's mail, **including Junk** | real new-lead emails only — the weekday SYSTEM TEST does not send mail |

They should roughly agree. What a mismatch means:

- **GA4 > CRM rows** → a delivery channel is failing. Check the healthcheck's
  lead-pipeline line, then `HANDOFF.md` Runbook 2.
- **CRM rows > GA4** → fine; GA4 misses ad-blocked visitors.
- **A real person in Blocked** → the honeypot misfired. Call them, then say so,
  because the rule may need changing.
- **Both near zero** → it's a traffic/conversion problem, not a plumbing one.
  The plumbing is proven daily by the System tab's test row (sheet +
  Pushover). The test lead does not email the inbox.

**3. Check `post_log` on /admin.** https://www.joshuafink.com/admin — "Posted
(7d)" should show Facebook, Instagram (Wed), LinkedIn (Thu) and GBP (Tue). A
channel at zero for two weeks is dead, not quiet.

**4. Skim the GEO card** on /admin. The score moves slowly; what matters is the
list of competitors cited instead of Joshua (HomeLight, FastExpert, Redfin,
Yelp). Free profiles on those sites are the lever.

---

## Every month

- **5th:** confirm the monthly market update posted (`post_log`, job
  `monthly-market-update`).
- **Token check** on /admin → Channel health. LinkedIn expires ~every 60 days;
  Instagram and GBP tokens are long-lived but not permanent.
- **Listings spot-check:** open https://www.joshuafink.com/listings and compare
  with Compass. They should match within a day.
- **Ask Joshua for 2–3 reviews.** Reviews beat links for local ranking, and the
  site already has a share page at `/review`.

---

## Calendar (put these in a real calendar)

| Date | Thing |
|---|---|
| ~1 year from rotation | `SYNC_PAT` expires — `HANDOFF.md` Runbook 1 |
| Every ~60 days | LinkedIn token — Runbook 3 |
| 5th monthly | Market update post |

---

## Parked work

Real improvements, none urgent. Roughly by value.

**Lead capture and follow-up**

- Use the sheet's `status` column: alert when a lead is still `New` after 30–60
  minutes, and put weekly lead counts in the agent briefing. Only worth building
  if the status column actually gets updated.
- Build the written 6-email seller drip (`docs/seller-email-sequence.md`) on
  Resend + Railway Postgres + a scheduled GitHub Action. The n8n hooks it was
  designed for point at localhost and are skipped.
- Write undelivered leads to Postgres instead of relying on Vercel's short log
  retention.
- Relax the "both phone and email required" rule on the remaining ~14 forms, if
  the three already changed (homepage, /buy, /sell) convert better.

**Content and SEO**

- Sold-listing pages tag leads as buyers. Add a home-value call to action and a
  "recently sold by Joshua in {suburb}" section to the seller pages.
- Publish the 107 Overlook Trail tour video (`HANDOFF.md` §7).
- Review, publish or delete the 31 unpublished drafts in
  `content_engine/output/approved`. The generator needs Ollama, which is not
  installed, so treat these as text to edit by hand.
- Work the free-profile list from the GEO audit (HomeLight, FastExpert, Yelp).

**Housekeeping**

- ~30 open bot PRs sit in the queue. Merge the good ones, close the rest:
  `gh pr list`, then `gh pr view <n>` / `gh pr merge <n> --squash`.
- Prune the old remote branches (`git branch -a`) once those PRs are resolved.
- Test the GA4 endpoints before switching the CSP from report-only to enforced
  (`next.config.mjs`).
- Delete the retired keys named at the top of `HANDOFF.md`.
