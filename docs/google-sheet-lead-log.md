# Google Sheet Lead Log (free CRM)

Every website lead (contact, sell, cash-offer, buyer, neighborhood, etc.) is
appended as a row to a Google Sheet tab named **CRM**. No paid CRM, no OAuth —
the site POSTs each lead to a Google Apps Script Web App bound to the sheet.

Submissions the spam filter quarantines are logged too, but to a separate
**Blocked** tab (auto-created, with the block reason) — sheet-only, no
Pushover and no email, so bots stay silent. That covers the honeypot, a form
sent in under 3 seconds, and a high content score (the Russian "перевод /
руб" leads with an off-site link are the current example). A single weak
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
the current header row. Columns A–L stay where they are. The `Blocked` and
`System` tabs are auto-created on the first submission that needs them.

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
  'page_url'
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
  'page_url'
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
last_wbraid · last_fbclid · last_referrer · last_landing_page · page_url`

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
  visitor filled them in.

### Headers on a sheet that already has rows

The script appends missing headers itself the next time a lead arrives. You
do not type them in. A tab that already has `traffic_source` through
`bathrooms` keeps those columns and gains the utm, click-id, last-touch, and
`page_url` columns after them. Older rows stay blank in the new columns.

The **Blocked** tab has the same columns except `status` is replaced by
`blocked_reason` (e.g. `honeypot`, `too_fast`, or
`non_latin+spam_phrase+spam_url`). Nothing else fires for these rows — no
Pushover or email — so the tab is skim-at-your-leisure. The site sends
`blocked_reason` for every quarantined row. The script already in this file
routes that field to this tab, so no redeploy is required for the spam
filter. A row only lands on CRM if this field is absent.

The **System** tab has the same columns as CRM and holds one row per weekday
from the morning healthcheck's test lead — proof the sheet channel is alive,
never something to act on.

## How it connects (code)

`app/api/contact/route.ts` → `pushToSheet(lead)` POSTs the lead JSON to
`GOOGLE_SHEET_WEBHOOK_URL`. It runs on every non-spam submission and no-ops
safely when the env var is unset, so it's harmless to deploy before setup.
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
