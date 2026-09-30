// Canonical Google Sheet lead-log columns.
//
// Columns A–L are the original CRM header row and must stay in this order.
// Everything in SHEET_APPENDED_COLUMNS is added to the right. The Apps Script
// in docs/google-sheet-lead-log.md mirrors these arrays; lib/sheet-lead-columns.test.ts
// fails if the pasted script drifts.

export const SHEET_BASE_COLUMNS = [
  'received_at',
  'status',
  'name',
  'phone',
  'email',
  'lead_type',
  'suburb',
  'source',
  'property_address',
  'situation',
  'timeline',
  'body',
] as const

/** Same shape as the CRM base, with status replaced by the block reason. */
export const SHEET_BLOCKED_BASE_COLUMNS = [
  'received_at',
  'blocked_reason',
  'name',
  'phone',
  'email',
  'lead_type',
  'suburb',
  'source',
  'property_address',
  'situation',
  'timeline',
  'body',
] as const

// Appended after column L. Order is the order a sheet that only has A–L gains
// them. traffic_source / landing_page / referrer / suspected_spam / budget /
// bedrooms / bathrooms were already collected; the utm, click-id, last-touch,
// and page_url columns are the first-touch attribution fields.
export const SHEET_APPENDED_COLUMNS = [
  'traffic_source',
  'landing_page',
  'referrer',
  'suspected_spam',
  'budget',
  'bedrooms',
  'bathrooms',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'last_utm_source',
  'last_utm_medium',
  'last_utm_campaign',
  'last_utm_term',
  'last_utm_content',
  'last_gclid',
  'last_gbraid',
  'last_wbraid',
  'last_fbclid',
  'last_referrer',
  'last_landing_page',
  'page_url',
] as const

export const SHEET_CRM_COLUMNS = [...SHEET_BASE_COLUMNS, ...SHEET_APPENDED_COLUMNS] as const

export const SHEET_BLOCKED_COLUMNS = [
  ...SHEET_BLOCKED_BASE_COLUMNS,
  ...SHEET_APPENDED_COLUMNS,
] as const
