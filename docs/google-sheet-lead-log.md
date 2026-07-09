# Google Sheet Lead Log (free CRM)

Every website lead (contact, sell, cash-offer, buyer, neighborhood, etc.) is
appended as a row to a Google Sheet tab named **CRM**. No paid CRM, no OAuth —
the site POSTs each lead to a Google Apps Script Web App bound to the sheet.

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

## Optional: shared secret (extra spam protection)

The Web App URL is public. The site's spam filter already blocks bots before a
lead is logged, so this is optional. For belt-and-suspenders: set the same
random string as `SHEET_WEBHOOK_SECRET` in Vercel **and** in the `SECRET` var at
the top of the script — the script then rejects any POST without it.

## The Apps Script

```javascript
// Appends each website lead as a row in the "CRM" tab.
// If you set SHEET_WEBHOOK_SECRET in Vercel, put the SAME value here; else ''.
var SECRET = '';

var HEADERS = [
  'received_at', 'status', 'name', 'phone', 'email', 'lead_type',
  'suburb', 'source', 'property_address', 'situation', 'timeline', 'body'
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (SECRET && data.secret !== SECRET) {
      return json({ ok: false, error: 'bad secret' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('CRM') || ss.insertSheet('CRM');

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var row = HEADERS.map(function (h) {
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

## How it connects (code)

`app/api/contact/route.ts` → `pushToSheet(lead)` POSTs the lead JSON to
`GOOGLE_SHEET_WEBHOOK_URL`. It runs on every non-spam submission and no-ops
safely when the env var is unset, so it's harmless to deploy before setup.
