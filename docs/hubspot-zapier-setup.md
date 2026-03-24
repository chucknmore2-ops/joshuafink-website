# HubSpot + Zapier Setup Guide — Joshua Fink Group
**Goal:** Every seller lead from joshuafink.com/sell (and the suburb landing pages) automatically flows into HubSpot CRM as a contact, gets tagged, and triggers the 6-email seller nurture sequence.

---

## Overview of the Flow

```
Formspree form submission
        ↓
Zapier (Webhook trigger)
        ↓
HubSpot — Create/Update Contact
        ↓
HubSpot — Enroll in Seller Nurture Workflow
        ↓
Email 1 sends immediately → sequence runs over 42 days
```

---

## Part 1: HubSpot Setup

### Step 1: Create Your Free HubSpot Account
1. Go to [hubspot.com](https://hubspot.com) and sign up for the free CRM
2. Complete onboarding — you can skip the paid features for now
3. Go to **Settings → Account Defaults** and set your timezone to **Central Time (US & Canada)**

### Step 2: Set Up Contact Properties
HubSpot needs to know about the suburb field from your forms.

1. Go to **Settings → Properties → Contact Properties**
2. Click **Create property**
3. Fill in:
   - **Label:** Lead Source Suburb
   - **Internal name:** `lead_source_suburb`
   - **Field type:** Single-line text
4. Click **Create**
5. Also verify these built-in properties exist (they should): `firstname`, `lastname`, `email`, `phone`, `address`

### Step 3: Create a Contact List for Seller Leads
1. Go to **Contacts → Lists**
2. Click **Create list** → **Active list**
3. Name it: `Seller Leads — joshuafink.com`
4. Set filter: Contact property → `lead_type` equals `seller`
   *(You'll add this property in Step 4 below)*
5. Save

### Step 4: Create the Lead Type Property
1. **Settings → Properties → Contact Properties → Create property**
2. Label: `Lead Type`
3. Internal name: `lead_type`
4. Field type: **Dropdown select**
5. Options: `seller`, `buyer`, `cash-offer`, `other`
6. Save

### Step 5: Import the 6-Email Sequence as a Workflow

> **Note:** Automated email sequences require HubSpot Starter ($20/mo) or higher. The free plan allows manual email sends but not automated sequences. If you're on free, Zapier can trigger individual emails via Gmail instead.

1. Go to **Automation → Workflows**
2. Click **Create workflow → Start from scratch → Contact-based**
3. Name it: `Seller Nurture Sequence — joshuafink.com`
4. Set enrollment trigger: **Contact property → lead_type equals seller**
5. Turn on **Re-enrollment** if the same contact submits again

**Add these actions in sequence:**

| Delay | Action |
|-------|--------|
| Immediately | Send Email: **Email 1 — Instant** |
| Wait 3 days | Send Email: **Email 2 — Day 3** |
| Wait 4 more days (Day 7) | Send Email: **Email 3 — Day 7** |
| Wait 7 more days (Day 14) | Send Email: **Email 4 — Day 14** |
| Wait 7 more days (Day 21) | Send Email: **Email 5 — Day 21** |
| Wait 21 more days (Day 42) | Send Email: **Email 6 — Day 42** |

6. Set emails to send **Mon–Fri, 9 AM – 5 PM Central** to avoid weekend sends
7. Save and **turn on** the workflow

### Step 6: Create the 6 Emails in HubSpot
1. Go to **Marketing → Email → Create email → Regular**
2. Paste each email from `seller-email-sequence.md`
3. Set **From name:** Joshua Fink
4. Set **From email:** joshua@joshuafink.com (you'll need to verify this domain)
5. Name each email clearly: `Seller Nurture — Email 1 (Instant)`, etc.
6. Save as draft (the workflow will activate them)

### Step 7: Verify Your Sending Domain
1. **Settings → Email → Sending Domains**
2. Click **Connect a domain** → enter `joshuafink.com`
3. HubSpot will give you DNS records (DKIM, SPF) to add at your DNS provider
4. Add the records, then click **Verify**
5. This ensures emails land in inbox, not spam

---

## Part 2: Zapier Setup (Formspree → HubSpot)

### Step 1: Create a Zapier Account
1. Go to [zapier.com](https://zapier.com) — free plan allows 100 tasks/month
2. Sign up with your Gmail or email

### Step 2: Create the Zap

**Trigger: Formspree New Submission**
1. Click **Create Zap**
2. Trigger app: Search **Formspree**
3. Trigger event: **New Submission**
4. Connect your Formspree account (you'll need your Formspree API key from [formspree.io/account](https://formspree.io/account))
5. Select your form: `xjgazeqa`
6. Test trigger — submit a test form at joshuafink.com/sell to generate sample data

**Action: HubSpot Create/Update Contact**
1. Action app: **HubSpot**
2. Action event: **Create or Update Contact**
3. Connect your HubSpot account
4. Map the fields:

| HubSpot Field | Formspree Field |
|---------------|-----------------|
| Email | `email` |
| First Name | Parse from `name` (use Zapier's formatter) |
| Last Name | Parse from `name` (second word) |
| Phone | `phone` |
| Street Address | `property_address` |
| Lead Type | `lead_type` (will be "seller") |
| Lead Source Suburb | `suburb` |
| Lead Source | Set to: `joshuafink.com` |

5. For **First/Last Name split**: Add a Zapier **Formatter** step before the HubSpot action:
   - Action: **Text → Split Text**
   - Input: `name` field
   - Separator: space
   - Use output `[0]` for First Name, `[1]` for Last Name

**Action 2: HubSpot Enroll in Workflow (optional)**
If you want Zapier to trigger the workflow directly:
1. Add second action: HubSpot → **Add Contact to List**
2. Select your `Seller Leads — joshuafink.com` list
3. This enrollment triggers the HubSpot workflow automatically

### Step 3: Test the Zap
1. Submit a test form at [joshuafink.com/sell](https://joshuafink.com/sell)
2. In Zapier, check **Task History** — should show success
3. In HubSpot **Contacts**, verify the new contact appeared with all fields populated
4. Check the **Workflow** in HubSpot to confirm enrollment

### Step 4: Turn On the Zap
1. Toggle the Zap to **On**
2. You'll now get a new HubSpot contact for every form submission

---

## Part 3: HubSpot Deal Tracking (Optional but Recommended)

Track your sellers as they move through your pipeline:

1. Go to **CRM → Deals → Pipelines → Edit pipeline**
2. Create a pipeline called `Seller Pipeline` with these stages:
   - Lead Received
   - Valuation Sent
   - Listing Appointment Set
   - Listed on MLS
   - Under Contract
   - Closed

3. When a new lead comes in, create a Deal tied to the contact and move it through stages
4. This lets you track revenue per lead source over time

---

## Quick Reference

| Item | Value |
|------|-------|
| Formspree endpoint | `https://formspree.io/f/xjgazeqa` |
| Formspree form ID | `xjgazeqa` |
| HubSpot workflow name | Seller Nurture Sequence — joshuafink.com |
| HubSpot contact list | Seller Leads — joshuafink.com |
| Lead type tag | `seller` |
| Suburb field internal name | `lead_source_suburb` |

---

## Troubleshooting

**Leads not appearing in HubSpot:**
- Check Zapier Task History for errors
- Verify Formspree API key is correct in Zapier
- Make sure the email field is being passed (required by HubSpot)

**Emails going to spam:**
- Verify your sending domain (SPF/DKIM records)
- Avoid spam trigger words in subject lines
- Make sure unsubscribe link is in every email

**Workflow not triggering:**
- Confirm the workflow is turned ON
- Check that the contact has `lead_type = seller` populated
- Check re-enrollment settings if testing with the same email

---

*Last updated: March 2026 · Questions? Call Joshua at 615-551-2727*
