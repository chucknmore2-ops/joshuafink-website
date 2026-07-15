# Post-Close Nurture Sequence — Joshua Fink Group

**Why:** repeat clients and referrals are the cheapest, highest-converting leads there are — and *"failing to stay in touch is the #1 reason agents lose repeat business"* (Compass *AI Prompt Playbook*). This sequences the site assets we own (the `/review` page, the review-request templates, market content) with the reminders Joshua runs in Compass AI, so every closed client turns into a review, a referral source, and a future repeat deal.

**How to read the "owner" column:**
- **Site** = an asset in this repo (already built).
- **Compass AI** = a reminder/field Joshua sets in Compass AI / Business Tracker (it has the "deal closed" trigger; our site doesn't).
- **Manual** = a human touch (call, gift, handwritten note).

---

## The sequence

| When | Touch | Owner | Asset / prompt |
|---|---|---|---|
| **Day 0 (close)** | Congrats + closing-details email | Compass AI | *"Draft an email to [client] with key closing dates and details."* Warm, per [`brand-voice-profile.md`](./brand-voice-profile.md). |
| **Day 1–3** | **Review request** (text + email) | **Site + Manual** | Send the **`/review`** page (`joshuafink.com/review`) using the review-request text/email templates in [`offsite-authority-plan.md`](./offsite-authority-plan.md) (see the "Ready-to-paste copy" section). This is the highest-leverage moment — they're happiest right after closing, and Google reviews drive the map pack + AI citations. |
| **Day 7** | Closing gift + handwritten note | Manual | Compass AI reminder: *"Set a task reminder to send a gift."* |
| **~Day 30** | "Settling in?" check-in call/text | Manual | Genuine, no ask. Keeps the relationship warm. |
| **Set at close** | Capture **Home Anniversary** + **Birthday** | Compass AI | Update contact fields at close so the annual triggers below fire. If birthday's unknown, run the playbook's *"Draft an email to capture recently-closed clients' birthdays"* (agents who do this keep a ~40% higher touch-rate). |
| **Annual — 7 days before Home Anniversary** | **Portfolio review / CMA** ("what your home is worth now") | Compass AI + Manual | *"Set a task reminder to send a portfolio review (CMA) 7 days before their Home Anniversary."* A CMA is a natural, valuable reason to reconnect — and surfaces would-be sellers. |
| **Annual — 7 days before Birthday** | Birthday gift/greeting | Compass AI + Manual | *"Set a task reminder to send a gift 7 days before their Birthday."* |
| **Quarterly** | Market update to the whole sphere | Site + Manual | Share the auto-generated market-update posts (`/market/[suburb]`, market blog posts) as a short newsletter/social push. Keeps Joshua top-of-mind between the personal touches. |

---

## What the site owns vs. what Compass AI owns

- **Owned here (ready now):** the `/review` share page, the review-request text/email templates, and the market-update content to recycle quarterly. Use these inside the cadence above.
- **Run in Compass AI:** the reminders, Business Tracker timeline, Home-Anniversary/Birthday fields, and CMA generation — Compass has the close trigger and the CRM, so the *scheduling* lives there.

## Future automation (optional, needs a trigger)

Fully automating the Day-0 → Day-3 emails **from the site** would require a "deal closed" signal the site doesn't have today (Compass has it internally). If Joshua ever wants site-driven post-close emails, the lightweight path is an admin action or webhook that marks a client "closed" and kicks off the same `/api/contact`-style send + a scheduled review-request follow-up. Not built — flagged so it's a known option, not a gap.

---

*Cross-refs: [`brand-voice-profile.md`](./brand-voice-profile.md) (tone for every message) · [`offsite-authority-plan.md`](./offsite-authority-plan.md) (review templates) · [`growth-playbook-daily.md`](./growth-playbook-daily.md) (daily cadence).*
