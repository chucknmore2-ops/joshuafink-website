# Google Sheet Lead Log (free CRM)

Every website lead (contact, sell, cash-offer, buyer, neighborhood, etc.) is
appended as a row to a Google Sheet tab named **CRM**. No paid CRM, no OAuth —
the site POSTs each lead to a Google Apps Script Web App bound to the sheet.

Submissions the spam filter quarantines are logged too, but to a separate
**Blocked** tab (auto-created, with the block reason) — sheet-only, no
Pushover and no email, so bots stay silent. That covers the honeypot, a form
sent in under 3 seconds, a high content score (the Russian "перевод /
руб" leads with an off-site link are the current example), an obviously fake
phone (`fake_phone`: country code +7, `79990000000`, or 10 zeros in a row),
a name that is exactly "test" with a blank or "test" message
(`test_submission`), more than 3 submissions in 10 minutes from one IP
or one email (`ip_rate_limit`, `email_rate_limit`), and a missing or
rejected Cloudflare Turnstile token (`turnstile_failed`, only once both
Turnstile env vars are set). A single weak
signal does not land here: those leads still go to **CRM**, tagged in
`suspected_spam`, and still email and Pushover. The honeypot can misfire on
a real person whose browser autofills the hidden field, and a fast human can
trip `too_fast`, so skim the Blocked tab for anything that looks like a
person.

The daily healthcheck's SYSTEM TEST lead is routed the same way: it arrives
tagged `system_test` and files into an auto-created **System** tab, so the CRM
tab only ever holds real leads.

This replaced the retired Monday.com integration. Leads arrive via email,
Pushover, and this Sheet — ClickUp is not a lead destination unless
`CLICKUP_LEADS_ENABLED=true` is set. The Sheet is the durable, trackable record.

Columns **A–L** are the original lead fields and never move. Attribution and
the other fields collected since then are appended to the right. The script
below adds any missing header automatically, so a tab that already has rows
does not need those names typed in by hand.

## One-time setup (~5 min)

1. **Make the sheet.** Create (or open) a Google Sheet. Add a tab named exactly
   `CRM`. (The script auto-creates it if missing, but making it yourself means
   you know where to look.)
2. **Add the script.** In the sheet: **Extensions → Apps Script**. Delete the
   sample `function myFunction()`, paste the script below, and Save (💾).
3. **Deploy as a Web App.** Click **Deploy → New deployment**. Click the gear →
   **Web app**. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
   Click **Deploy**, then authorize (it's your own script — approve it).
4. **Copy the Web app URL** (ends in `/exec`) and set it in Vercel as
   `GOOGLE_SHEET_WEBHOOK_URL`, then redeploy. That's it — new leads flow in.

## Re-paste when the script changes

If the script was already deployed, paste the current one over it. An older
script only writes columns A–L (`received_at` through `body`) and drops
everything else in the POST, including traffic source. Nothing already in the
sheet is lost.

1. Open the sheet → **Extensions → Apps Script**, select everything, and paste
   the script below over it. Save (💾).
2. **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy.**
   This keeps the same `/exec` URL, so nothing in Vercel changes.

The first lead after that deploy appends any missing headers to the right of
the current header row, including `lead_id`. Columns A–L stay where they are.
Until that version is deployed, a retry that timed out after the row was
actually written can append a second copy. The `Blocked` and `System` tabs
are auto-created on the first submission that needs them.

## Optional: shared secret (extra spam protection)

The Web App URL is public. The site's spam filter already blocks bots before a
lead is logged, so this is optional. For belt-and-suspenders: set the same
random string as `SHEET_WEBHOOK_SECRET` in Vercel **and** in the `SECRET` var at
the top of the script — the script then rejects any POST without it.

## Final Apps Script

Paste this whole script over the Apps Script project. It is the script to deploy.

```javascript
// Appends each website lead as a row in the "CRM" tab. Quarantined
// submissions (honeypot, too-fast, or a high spam score) arrive tagged with
// `blocked_reason` and go to a "Blocked" tab instead (auto-created) — skim
// it for real people the filter caught. No redeploy is required for that;
// any non-empty blocked_reason already takes this path.
// The daily healthcheck's test lead arrives tagged `system_test` and goes to
// a "System" tab (auto-created), keeping the CRM tab real-leads-only.
//
// Each row carries lead_id. A retry or the backfill job sends the same id.
// If that id is already in the tab, the script returns ok without appending,
// so a write that succeeded after our fetch timed out is not stored twice.
//
// Columns A–L are the original header and are never reordered or inserted
// into. On a tab that already has a header row, any name in the lists below
// that is not already present is appended to the right. An empty tab gets
// the full header row.
//
// If you set SHEET_WEBHOOK_SECRET in Vercel, put the SAME value here; else ''.
var SECRET = '';

// Original CRM columns A–L. Do not insert anything in front of or between these.
var CRM_HEADERS = [
  'received_at', 'status', 'name', 'phone', 'email', 'lead_type',
  'suburb', 'source', 'property_address', 'situation', 'timeline', 'body',
  'traffic_source', 'landing_page', 'referrer', 'suspected_spam',
  'budget', 'bedrooms', 'bathrooms',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'gbraid', 'wbraid', 'fbclid',
  'last_utm_source', 'last_utm_medium', 'last_utm_campaign', 'last_utm_term', 'last_utm_content',
  'last_gclid', 'last_gbraid', 'last_wbraid', 'last_fbclid',
  'last_referrer', 'last_landing_page',
  'page_url',
  'alert_opt_in',
  'lead_id'
];

// Blocked tab: column B is blocked_reason instead of status. Every other
// column matches CRM, including the attribution fields.
var BLOCKED_HEADERS = [
  'received_at', 'blocked_reason', 'name', 'phone', 'email', 'lead_type',
  'suburb', 'source', 'property_address', 'situation', 'timeline', 'body',
  'traffic_source', 'landing_page', 'referrer', 'suspected_spam',
  'budget', 'bedrooms', 'bathrooms',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'gbraid', 'wbraid', 'fbclid',
  'last_utm_source', 'last_utm_medium', 'last_utm_campaign', 'last_utm_term', 'last_utm_content',
  'last_gclid', 'last_gbraid', 'last_wbraid', 'last_fbclid',
  'last_referrer', 'last_landing_page',
  'page_url',
  'alert_opt_in',
  'lead_id'
];

function ensureHeaders(sheet, desired) {
  // Empty tab: write the full header row. Existing tab: keep every current
  // header where it is (columns A–L stay A–L) and append any desired header
  // that is not already present.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(desired);
    sheet.getRange(1, 1, 1, desired.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return desired;
  }

  var width = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (cell) {
    return String(cell || '').trim();
  });
  while (existing.length && existing[existing.length - 1] === '') existing.pop();

  // A tab that already has rows but no received_at header is not relabeled
  // in place — that would shift real data. Leave it alone.
  if (existing.indexOf('received_at') === -1) return existing;

  var have = {};
  existing.forEach(function (name) {
    if (name) have[name] = true;
  });
  var missing = [];
  desired.forEach(function (name) {
    if (!have[name]) missing.push(name);
  });
  if (missing.length) {
    var startCol = existing.length + 1;
    var range = sheet.getRange(1, startCol, 1, missing.length);
    range.setValues([missing]);
    range.setFontWeight('bold');
    existing = existing.concat(missing);
  }
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
  return existing;
}

function leadAlreadyLogged(sheet, headers, leadId) {
  if (leadId == null || String(leadId) === '') return false;
  var col = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === 'lead_id') { col = i; break; }
  }
  if (col < 0) return false;
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var values = sheet.getRange(2, col + 1, last - 1, 1).getValues();
  for (var r = 0; r < values.length; r++) {
    if (String(values[r][0] || '') === String(leadId)) return true;
  }
  return false;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (SECRET && data.secret !== SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }

    var blocked = data.blocked_reason != null && data.blocked_reason !== '';
    var systemTest = data.system_test != null && data.system_test !== '';
    var desired = blocked ? BLOCKED_HEADERS : CRM_HEADERS;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var name = blocked ? 'Blocked' : (systemTest ? 'System' : 'CRM');
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = ensureHeaders(sheet, desired);
    if (leadAlreadyLogged(sheet, headers, data.lead_id)) {
      return json({ ok: true, duplicate: true });
    }

    var row = headers.map(function (h) {
      if (!h) return '';
      if (h === 'status' && (data.status == null || data.status === '')) return 'New';
      return data[h] != null ? String(data[h]) : '';
    });
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Read CRM email addresses for the one-time listing-alert invite.
// Refuses to answer unless SECRET is set and matches the request. The site
// calls this as GET ?action=crm-emails&secret=... and only sends the invite
// when that route is explicitly taken out of dry-run.
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    if (params.action !== 'crm-emails') {
      return json({ ok: false, error: 'unknown action' });
    }
    if (!SECRET) {
      return json({ ok: false, error: 'SECRET is empty; refusing to list CRM emails' });
    }
    if (params.secret !== SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('CRM');
    if (!sheet || sheet.getLastRow() < 2) return json({ ok: true, emails: [] });
    var width = Math.max(sheet.getLastColumn(), 1);
    var headers = sheet.getRange(1, 1, 1, width).getValues()[0];
    var emailCol = -1;
    for (var i = 0; i < headers.length; i++) {
      if (String(headers[i] || '').trim() === 'email') emailCol = i;
    }
    if (emailCol < 0) return json({ ok: false, error: 'email column missing' });
    var values = sheet.getRange(2, emailCol + 1, sheet.getLastRow() - 1, 1).getValues();
    var seen = {};
    var emails = [];
    values.forEach(function (row) {
      var email = String(row[0] || '').trim().toLowerCase();
      if (!email || email.indexOf('@') < 1 || seen[email]) return;
      seen[email] = true;
      emails.push(email);
    });
    return json({ ok: true, emails: emails });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Columns

Columns A–L, unchanged:

`received_at · status · name · phone · email · lead_type · suburb · source ·
property_address · situation · timeline · body`

Appended after column L, in this order:

`traffic_source · landing_page · referrer · suspected_spam · budget · bedrooms ·
bathrooms · utm_source · utm_medium · utm_campaign · utm_term · utm_content ·
gclid · gbraid · wbraid · fbclid · last_utm_source · last_utm_medium ·
last_utm_campaign · last_utm_term · last_utm_content · last_gclid · last_gbraid ·
last_wbraid · last_fbclid · last_referrer · last_landing_page · page_url ·
alert_opt_in · lead_id`

- **status** defaults to `New`. This is your tracking column — change it to
  `Called`, `Showing`, `Under Contract`, `Closed`, `Dead`, etc.
- **source** tells you which page produced the lead (e.g. `buy-hub`,
  `cash-offer`, `listings`) — useful for seeing what's actually converting.
- **traffic_source / landing_page / referrer** are the first touch:
  `utm_source`, else `google` / `facebook` when a click id is present, else
  the referring host, else `direct`, plus the first page URL and the inbound
  referrer. `landing_page` still contains the original query string.
- **utm_source / utm_medium / utm_campaign / utm_term / utm_content** and
  **gclid / gbraid / wbraid / fbclid** are that same first touch, split into
  their own columns so a campaign can be filtered without parsing the URL.
- **last_utm_***, **last_gclid / last_gbraid / last_wbraid / last_fbclid**,
  **last_referrer / last_landing_page** are the most recent campaign touch
  inside the 90-day window. They match the first-touch columns until the
  visitor comes back through a different link.
- **page_url** is the page the form was submitted from, which is often not
  the landing page.
- **suspected_spam** holds a heuristic's reason (e.g. `url_in_field`) when one
  fired but the lead was still delivered on every channel — judge it yourself.
  Empty for normal leads. It is not how quarantined spam is marked.
- **budget / bedrooms / bathrooms** come from the buy and sell forms when the
  visitor filled them in. Listing-alert signups put the optional price range
  in **budget** and the city in **suburb**.
- **alert_opt_in** is `yes` when the visitor checked the listing-email box.
  Anything else means they were not added to the email list.
- **lead_id** is a stable id the site generates once per submission. Retries
  and the backfill job send the same value. If it is already in the tab, the
  script answers `{ok:true, duplicate:true}` and does not append again.

## If the sheet write fails

The site retries a transient failure (timeout, HTTP 429/5xx, or a
Spreadsheet service error) with a short exponential backoff. That budget
stays inside the contact function's 30 second limit. Email and Pushover
are sent in parallel with those retries, including when the append never
confirms.

If the append still does not confirm, the lead is inserted into the
existing Railway Postgres (`DATABASE_URL`, table `sheet_lead_queue`). The
webhook secret is not stored in that row. Honeypot, too-fast, Turnstile,
and other Blocked-tab leads are queued the same way and still do not email
or Pushover.

`GET /api/cron/sheet-lead-backfill` (Bearer `CRON_SECRET`) writes queued
rows once the sheet answers `{ok:true}`. Each lead gets one 20 second
attempt. That is long enough for the Apps Script cold start and the
`lead_id` scan. A timeout or a dropped connection puts that row back and
the job continues with the next one. An HTTP 404 is Google's front door,
not the script, and it is treated as that one row: the job keeps going,
and the row is marked failed only after it has been claimed three times.
A bad secret, an HTML page, or any other HTTP error releases the current
row and stops, so a dead sheet is not hammered. The response includes
`detail` (no lead fields) when a row did not confirm. A row already
claimed by another run is skipped (`FOR UPDATE SKIP LOCKED`). The same
`lead_id` makes a second append a no-op after the Apps Script above is
deployed, including when the first attempt timed out after the row had
already landed. Backfill does not send email or Pushover.

A contact whose own append confirms in under 8 seconds also writes one
queued row before the response returns. A slower append skips that so
the contact function stays inside its 30 second limit. That extra write
does not send email or Pushover.

Vercel Hobby only keeps two cron slots, and both are taken, so this route
is called by GitHub Actions
(`.github/workflows/sheet-lead-backfill.yml`), not by a third Vercel cron.
The Action runs at :10 and :40. Each run may call the route up to three
times, which is enough for a short queue to finish when one call runs out
of time. The Action fails when the queue is non-empty and the run wrote
nothing. A later pass that only has a single 404 left does not fail the
job if an earlier pass already wrote rows.

`GET /api/healthcheck` includes `sheetQueue.queued` and `sheetQueue.failed`.
`queued` is rows not yet confirmed in the sheet. `failed` is rows the
script rejected and backfill stopped retrying. An outage stays in `queued`.
`configured: false` means `DATABASE_URL` is unset. The uptime check still
only requires `status: ok`. The morning test lead still pages when the
sheet channel itself fails.

### Headers on a sheet that already has rows

The script appends missing headers itself the next time a lead arrives. You
do not type them in. A tab that already has `traffic_source` through
`bathrooms` keeps those columns and gains the utm, click-id, last-touch, and
`page_url` columns after them. Older rows stay blank in the new columns.

The **Blocked** tab has the same columns except `status` is replaced by
`blocked_reason` (e.g. `honeypot`, `too_fast`, `fake_phone`,
`test_submission`, `ip_rate_limit`, `email_rate_limit`,
`turnstile_failed`, or `non_latin+spam_phrase+spam_url`). Nothing else fires for these rows — no
Pushover or email, and no auto-reply to the address on the row — so the tab
is skim-at-your-leisure. The site sends
`blocked_reason` for every quarantined row. The script already in this file
routes that field to this tab, so no redeploy is required for the spam
filter. A row only lands on CRM if this field is absent.

The **System** tab has the same columns as CRM and holds one row per weekday
from the morning healthcheck's test lead — proof the sheet channel is alive,
never something to act on.

## How it connects (code)

`app/api/contact/route.ts` → `pushToSheet(lead)` POSTs the lead JSON to
`GOOGLE_SHEET_WEBHOOK_URL` (`lib/sheet-lead-write.ts` does the retry). It
runs on every non-spam submission and no-ops safely when the env var is
unset, so it's harmless to deploy before setup. A confirmed failure is
saved by `lib/sheet-lead-queue.ts` and replayed by
`/api/cron/sheet-lead-backfill`.
Honeypot, too-fast, and high-score spam all call `pushToSheet(lead, reason)` —
the extra `blocked_reason` field is what routes the row to the Blocked tab.
The payload also includes `status: "spam"` so an older script that ignores
`blocked_reason` and always appends to CRM still marks the row. The daily
healthcheck lead calls `pushToSheet(lead, undefined, true)` — the resulting
`system_test` field routes its row to the System tab the same way.

The browser (`lib/attribution.ts`) stores first-touch and last-touch for 90
days and every lead form sends those fields, plus `page_url`, on submit. The
route forwards them on the lead email, this sheet payload, ClickUp (when
enabled), Pushover, and the buyer-lead webhook. `secret` and `system_test`
are routing metadata, not columns.
