# Switching outbound email to Resend

**Status as of 2026-08-20: LIVE.** Resend account created under chucknmore2@gmail.com,
`send.joshuafink.com` verified via GoDaddy Domain Connect, `RESEND_API_KEY` set in Vercel
(Preview + Production).

**Why a subdomain and not the root:** joshuafink.com's single SPF record belongs to
Microsoft 365 (`v=spf1 include:spf.protection.outlook.com -all`, MX
`joshuafink-com.mail.protection.outlook.com`). Only one SPF record is permitted per
domain, so verifying the root would have meant editing the record Joshua's real business
email depends on. `send.joshuafink.com` carries its own SPF/DKIM and cannot collide.
Verified after setup: the root SPF and MX are unchanged.

## Why

The SendGrid account is dead and had been for months without anyone noticing.
The key still authenticates, so nothing looked broken — but the account is on the
free plan with a hard credit limit that reset to zero:

```
GET /v3/user/credits  →  {"total":0,"remain":0,"is_hard_limit":true,"last_reset":"2026-05-01"}
POST /v3/mail/send    →  401 {"errors":[{"message":"Maximum credits exceeded"}]}
GET /v3/stats         →  0 requests, 0 delivered — June, July and August
```

Two things had been silently failing that whole time:

- the **auto-reply to every lead** — someone fills in a form, sees a success
  screen, and never gets the "thanks, I'll be in touch" email
- the **new-lead email to Joshua**, and the weekly agent briefing

No lead was ever lost: `/api/contact` treats email as one channel of several, and
Pushover plus the Google Sheet carried every one. But the person who filled in
the form heard nothing, which is a conversion problem rather than a delivery one.

## What shipped

`lib/send-email.ts` — one `sendEmail()` used by both the contact route and the
agent briefing. It picks whichever provider is configured, **Resend first**:

| Env var | Effect |
|---|---|
| `RESEND_API_KEY` | Preferred. Set this and mail starts flowing through Resend. |
| `SENDGRID_API_KEY` | Legacy fallback, used only when the Resend key is absent. |
| `EMAIL_FROM` | Sending address; defaults to `leads@send.joshuafink.com`. |

Because Resend wins whenever its key is present, **the cutover is one env var** —
no code change, no redeploy path to think about, and removing the key falls back.
`lib/send-email.test.ts` pins that ordering.

Until `RESEND_API_KEY` exists, behaviour is exactly what it is today: the
provider resolves to `sendgrid`, sends fail, and the lead still reaches Joshua by
Pushover and the Sheet.

## What Josh needs to do (~10 minutes)

1. Create a free account at **https://resend.com** — 3,000 emails/month, 100/day.
   This site sends nowhere near that.
2. **Add and verify the domain `joshuafink.com`.** Resend gives you DNS records
   (DKIM, and an SPF/return-path entry) to add wherever joshuafink.com's DNS
   lives. Verification usually completes in minutes.
   - The sending address must be on the verified domain. `leads@joshuafink.com`
     is what the code uses, and it does not need to be a real inbox — replies go
     to the `reply_to` address, which is already set to the lead (for Joshua's
     copy) or to Joshua (for the lead's auto-reply).
3. Create an **API key** with send permission.
4. Add it in Vercel → Settings → Environment Variables as `RESEND_API_KEY`, for
   Production (and Preview if you want to test there), then redeploy.

## Verifying it worked

Submit a real test enquiry through any form on the site with your own email
address. You should get the branded auto-reply, and the `🏡 New Lead` email
should arrive at `joshua@joshuafink.com`. Resend's dashboard shows every send
with its delivery status, which is the check SendGrid never gave us.

If nothing arrives, the Vercel function logs name the provider and the failure:
`Auto-reply email failed via resend: HTTP 403 ...` — a 403 almost always means
the domain is not verified yet.

## Afterwards

Once Resend is confirmed working, `SENDGRID_API_KEY` can be deleted from Vercel
and from `.env.local`. There is no reason to keep a dead key around, and leaving
it means a future reader has to rediscover which one is live.
