# Google Sheet Lead Log (free CRM)

Every website lead (contact, sell, cash-offer, buyer, neighborhood, etc.) is
appended as a row to a Google Sheet tab named **CRM**. No paid CRM, no OAuth —
the site POSTs each lead to a Google Apps Script Web App bound to the sheet.

Submissions the honeypot blocks are logged too, but to a separate **Blocked**
tab (auto-created, with the block reason) — sheet-only, no Slack/Pushover/email,
so bots stay silent. The honeypot can misfire on a real person whose browser
autofills the hidden field, so skim the Blocked tab weekly for anything human.

The daily healthcheck's SYSTEM TEST lead is routed the same way: it arrives
tagged `system_test` and files into an auto-created **System** tab, so the CRM
tab only ever holds real leads.

This replaced the retired Monday.com integration. Leads still also arrive via
Slack (#joshpersonal) and email — the Sheet is the durable, trackable record.

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

## One-time re-paste (Blocked + System tab update)

If the script was already deployed before the Blocked or System tab existed,
re-paste it once. The old script ignores the `blocked_reason` and `system_test`
tags, so until it's updated, blocked bot junk and the daily SYSTEM TEST row
keep landing in the main CRM tab looking like real leads — annoying, but
nothing is lost, so there's no ordering constraint.

1. Open the sheet → **Extensions → Apps Script**, select everything, and paste
   the script below over it. Save (💾).
2. **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy.**
   This keeps the same `/exec` URL, so nothing in Vercel changes.

The `Blocked` and `System` tabs are auto-created on the first submission that
needs them — no need to make them yourself.

## Optional: shared secret (extra spam protection)

The Web App URL is public. The site's spam filter already blocks bots before a
lead is logged, so this is optional. For belt-and-suspenders: set the same
random string as `SHEET_WEBHOOK_SECRET` in Vercel **and** in the `SECRET` var at
the top of the script — the script then rejects any POST without it.

## The Apps Script

```javascript
// Appends each website lead as a row in the "CRM" tab. Honeypot-blocked
// submissions arrive tagged with `blocked_reason` and go to a "Blocked" tab
// instead (auto-created) — skim it weekly for real people the trap caught.
// The daily healthcheck's test lead arrives tagged `system_test` and goes to
// a "System" tab (auto-created), keeping the CRM tab real-leads-only.
// If you set SHEET_WEBHOOK_SECRET in Vercel, put the SAME value here; else ''.
var SECRET = '';

var HEADERS = [
  'received_at', 'status', 'name', 'phone', 'email', 'lead_type',
  'suburb', 'source', 'property_address', 'situation', 'timeline', 'body'
];

var BLOCKED_HEADERS = [
  'received_at', 'blocked_reason', 'name', 'phone', 'email', 'lead_type',
  'suburb', 'source', 'property_address', 'situation', 'timeline', 'body'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (SECRET && data.secret !== SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }

    var blocked = data.blocked_reason != null && data.blocked_reason !== '';
    var systemTest = data.system_test != null && data.system_test !== '';
    var headers = blocked ? BLOCKED_HEADERS : HEADERS;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var name = blocked ? 'Blocked' : (systemTest ? 'System' : 'CRM');
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var row = headers.map(function (h) {
      if (h === 'status') return 'New';
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

`received_at · status · name · phone · email · lead_type · suburb · source ·
property_address · situation · timeline · body`

- **status** defaults to `New`. This is your tracking column — change it to
  `Called`, `Showing`, `Under Contract`, `Closed`, `Dead`, etc.
- **source** tells you which page produced the lead (e.g. `buy-hub`,
  `cash-offer`, `listings`) — useful for seeing what's actually converting.

The **Blocked** tab has the same columns except `status` is replaced by
`blocked_reason` (e.g. `honeypot`). Nothing else fires for these rows — no
Slack, Pushover, or email — so the tab is skim-at-your-leisure.

The **System** tab has the same columns as CRM and holds one row per weekday
from the morning healthcheck's test lead — proof the sheet channel is alive,
never something to act on.

## How it connects (code)

`app/api/contact/route.ts` → `pushToSheet(lead)` POSTs the lead JSON to
`GOOGLE_SHEET_WEBHOOK_URL`. It runs on every non-spam submission and no-ops
safely when the env var is unset, so it's harmless to deploy before setup.
Honeypot-blocked submissions call `pushToSheet(lead, reason)` — the extra
`blocked_reason` field is what routes the row to the Blocked tab. The daily
healthcheck lead calls `pushToSheet(lead, undefined, true)` — the resulting
`system_test` field routes its row to the System tab the same way.
