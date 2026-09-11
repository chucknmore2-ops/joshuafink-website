/**
 * Unit tests for the daily-tasks Pushover calendar gate.
 * Run: node --test scripts/should-send-daily-tasks.test.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  usFederalHolidayName,
  chicagoCivilDate,
  dailyTasksSkipReason,
  shouldSendDailyTasks,
} from './should-send-daily-tasks.mjs';

function utc(iso) {
  return new Date(iso);
}

/** OPM-published dates: https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/ */
const OPM = {
  2024: [
    [1, 1, "New Year's Day"],
    [1, 15, 'Birthday of Martin Luther King, Jr.'],
    [2, 19, "Washington's Birthday"],
    [5, 27, 'Memorial Day'],
    [6, 19, 'Juneteenth National Independence Day'],
    [7, 4, 'Independence Day'],
    [9, 2, 'Labor Day'],
    [10, 14, 'Columbus Day'],
    [11, 11, 'Veterans Day'],
    [11, 28, 'Thanksgiving Day'],
    [12, 25, 'Christmas Day'],
  ],
  2025: [
    [1, 1, "New Year's Day"],
    [1, 20, 'Birthday of Martin Luther King, Jr.'],
    [2, 17, "Washington's Birthday"],
    [5, 26, 'Memorial Day'],
    [6, 19, 'Juneteenth National Independence Day'],
    [7, 4, 'Independence Day'],
    [9, 1, 'Labor Day'],
    [10, 13, 'Columbus Day'],
    [11, 11, 'Veterans Day'],
    [11, 27, 'Thanksgiving Day'],
    [12, 25, 'Christmas Day'],
  ],
  2026: [
    [1, 1, "New Year's Day"],
    [1, 19, 'Birthday of Martin Luther King, Jr.'],
    [2, 16, "Washington's Birthday"],
    [5, 25, 'Memorial Day'],
    [6, 19, 'Juneteenth National Independence Day'],
    [7, 3, 'Independence Day (observed)'],
    [9, 7, 'Labor Day'],
    [10, 12, 'Columbus Day'],
    [11, 11, 'Veterans Day'],
    [11, 26, 'Thanksgiving Day'],
    [12, 25, 'Christmas Day'],
  ],
};

for (const [year, days] of Object.entries(OPM)) {
  test(`matches OPM federal holidays for ${year}`, () => {
    for (const [month, day, name] of days) {
      assert.equal(
        usFederalHolidayName(Number(year), month, day),
        name,
        `${year}-${month}-${day} should be ${name}`,
      );
    }
  });
}

test('ordinary weekdays are not federal holidays', () => {
  assert.equal(usFederalHolidayName(2026, 9, 8), null); // Tue after Labor Day
  assert.equal(usFederalHolidayName(2026, 4, 3), null); // Good Friday 2026 — not federal
  assert.equal(usFederalHolidayName(2026, 10, 13), null); // Tue after Columbus Day
});

test('observed Friday when the holiday is Saturday', () => {
  // 2022-01-01 was Saturday → observed Fri 2021-12-31
  assert.equal(usFederalHolidayName(2021, 12, 31), "New Year's Day (observed)");
  // 2021-12-25 was Saturday → observed Fri 2021-12-24
  assert.equal(usFederalHolidayName(2021, 12, 24), 'Christmas Day (observed)');
  // 2023-11-11 was Saturday → observed Fri 2023-11-10
  assert.equal(usFederalHolidayName(2023, 11, 10), 'Veterans Day (observed)');
});

test('observed Monday when the holiday is Sunday', () => {
  // 2022-06-19 was Sunday → observed Mon 2022-06-20
  assert.equal(usFederalHolidayName(2022, 6, 20), 'Juneteenth National Independence Day (observed)');
  // 2021-07-04 was Sunday → observed Mon 2021-07-05
  assert.equal(usFederalHolidayName(2021, 7, 5), 'Independence Day (observed)');
  // 2022-12-25 was Sunday → observed Mon 2022-12-26
  assert.equal(usFederalHolidayName(2022, 12, 26), 'Christmas Day (observed)');
});

test('the Saturday/Sunday holiday date itself still counts as the holiday', () => {
  assert.equal(usFederalHolidayName(2026, 7, 4), 'Independence Day');
  assert.equal(usFederalHolidayName(2022, 1, 1), "New Year's Day");
  assert.equal(usFederalHolidayName(2022, 6, 19), 'Juneteenth National Independence Day');
});

test('chicagoCivilDate uses America/Chicago, not UTC', () => {
  // 2026-01-17 05:00 UTC = Fri 2026-01-16 23:00 CST
  const fridayInChicago = chicagoCivilDate(utc('2026-01-17T05:00:00Z'));
  assert.deepEqual(
    { year: fridayInChicago.year, month: fridayInChicago.month, day: fridayInChicago.day, weekday: fridayInChicago.weekday },
    { year: 2026, month: 1, day: 16, weekday: 5 },
  );

  // Same UTC Saturday after Chicago midnight
  const saturdayInChicago = chicagoCivilDate(utc('2026-01-17T12:00:00Z'));
  assert.deepEqual(
    { year: saturdayInChicago.year, month: saturdayInChicago.month, day: saturdayInChicago.day, weekday: saturdayInChicago.weekday },
    { year: 2026, month: 1, day: 17, weekday: 6 },
  );
});

test('skips Saturday and Sunday in America/Chicago', () => {
  assert.match(dailyTasksSkipReason(utc('2026-01-17T12:00:00Z')), /weekend \(Saturday 2026-01-17/);
  assert.match(dailyTasksSkipReason(utc('2026-01-18T12:00:00Z')), /weekend \(Sunday 2026-01-18/);
  assert.equal(shouldSendDailyTasks(utc('2026-01-17T12:00:00Z')), false);
});

test('does not treat a UTC Saturday as a weekend while it is still Friday in Chicago', () => {
  assert.equal(dailyTasksSkipReason(utc('2026-01-17T05:00:00Z')), null);
  assert.equal(shouldSendDailyTasks(utc('2026-01-17T05:00:00Z')), true);
});

test('skips a weekday US federal holiday at the scheduled 12:00 UTC slot', () => {
  // Labor Day 2026-09-07, 12:00 UTC = 07:00 CDT
  const reason = dailyTasksSkipReason(utc('2026-09-07T12:00:00Z'));
  assert.match(reason, /US federal holiday: Labor Day \(2026-09-07 America\/Chicago\)/);
  assert.equal(shouldSendDailyTasks(utc('2026-09-07T12:00:00Z')), false);
});

test('skips an observed Friday when the office/market is closed', () => {
  const reason = dailyTasksSkipReason(utc('2026-07-03T12:00:00Z'));
  assert.match(reason, /Independence Day \(observed\)/);
  assert.equal(shouldSendDailyTasks(utc('2026-07-03T12:00:00Z')), false);
});

test('sends on an ordinary weekday at the scheduled 12:00 UTC slot', () => {
  // Tuesday 2026-09-08
  assert.equal(dailyTasksSkipReason(utc('2026-09-08T12:00:00Z')), null);
  assert.equal(shouldSendDailyTasks(utc('2026-09-08T12:00:00Z')), true);
});
