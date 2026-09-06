/**
 * Calendar gate for the daily-tasks Pushover reminder.
 *
 * Scheduled runs skip Saturdays, Sundays, and US federal holidays, including
 * OPM observed dates (Friday if the holiday is Saturday; Monday if Sunday).
 * Calendar day is always America/Chicago — not UTC.
 *
 * Holiday calendar: 5 U.S.C. 6103 / OPM federal holidays
 *   New Year's Day, Birthday of Martin Luther King, Jr., Washington's Birthday,
 *   Memorial Day, Juneteenth National Independence Day, Independence Day,
 *   Labor Day, Columbus Day, Veterans Day, Thanksgiving Day, Christmas Day.
 *
 * Inauguration Day (DC-only) is not included. Good Friday is not a federal
 * holiday and is not skipped.
 *
 * CLI: prints `SEND` or `SKIP<tab>reason` and exits 0. A crash exits non-zero
 * so the workflow fails closed instead of silently dropping a weekday send.
 */

import { pathToFileURL } from 'node:url';

const TIME_ZONE = 'America/Chicago';

const FIXED_HOLIDAYS = [
  [1, 1, "New Year's Day"],
  [6, 19, 'Juneteenth National Independence Day'],
  [7, 4, 'Independence Day'],
  [11, 11, 'Veterans Day'],
  [12, 25, 'Christmas Day'],
];

/** weekday: 0 = Sunday … 6 = Saturday (JS / Date.UTC). month: 1–12. */
function nthWeekday(year, month, weekday, n) {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const offset = (weekday - firstDow + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

function lastWeekday(year, month, weekday) {
  const last = new Date(Date.UTC(year, month, 0));
  const lastDate = last.getUTCDate();
  const lastDow = last.getUTCDay();
  return lastDate - ((lastDow - weekday + 7) % 7);
}

function addDays(year, month, day, delta) {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function floatingHolidays(year) {
  return [
    [1, nthWeekday(year, 1, 1, 3), 'Birthday of Martin Luther King, Jr.'],
    [2, nthWeekday(year, 2, 1, 3), "Washington's Birthday"],
    [5, lastWeekday(year, 5, 1), 'Memorial Day'],
    [9, nthWeekday(year, 9, 1, 1), 'Labor Day'],
    [10, nthWeekday(year, 10, 1, 2), 'Columbus Day'],
    [11, nthWeekday(year, 11, 4, 4), 'Thanksgiving Day'],
  ];
}

function fixedHolidayName(year, month, day) {
  for (const [m, d, name] of FIXED_HOLIDAYS) {
    if (m === month && d === day) return name;
  }
  return null;
}

export function usFederalHolidayName(year, month, day) {
  for (const [m, d, name] of floatingHolidays(year)) {
    if (m === month && d === day) return name;
  }
  const exact = fixedHolidayName(year, month, day);
  if (exact) return exact;

  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  if (dow === 5) {
    const next = addDays(year, month, day, 1);
    const name = fixedHolidayName(next.year, next.month, next.day);
    if (name) return `${name} (observed)`;
  }
  if (dow === 1) {
    const prev = addDays(year, month, day, -1);
    const name = fixedHolidayName(prev.year, prev.month, prev.day);
    if (name) return `${name} (observed)`;
  }
  return null;
}

export function chicagoCivilDate(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
      .formatToParts(now)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

export function formatYmd({ year, month, day }) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function dailyTasksSkipReason(now = new Date()) {
  const cal = chicagoCivilDate(now);
  const ymd = formatYmd(cal);
  if (cal.weekday === 0 || cal.weekday === 6) {
    const label = cal.weekday === 0 ? 'Sunday' : 'Saturday';
    return `weekend (${label} ${ymd} America/Chicago)`;
  }
  const holiday = usFederalHolidayName(cal.year, cal.month, cal.day);
  if (holiday) {
    return `US federal holiday: ${holiday} (${ymd} America/Chicago)`;
  }
  return null;
}

export function shouldSendDailyTasks(now = new Date()) {
  return dailyTasksSkipReason(now) == null;
}

function main() {
  const reason = dailyTasksSkipReason();
  if (reason) {
    console.log(`SKIP\t${reason}`);
    return;
  }
  console.log('SEND');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
