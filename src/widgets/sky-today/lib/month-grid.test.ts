import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { addMonths, buildMonthGrid, dayDifference, isSameDay, monthIndex } from './month-grid.ts';

const NOV_1 = new Date(2026, 10, 1);
const NOV_10 = new Date(2026, 10, 10);
const MAX = new Date(2027, 10, 9);

describe('buildMonthGrid', () => {
  it('lays out November 2026 (starts on a Sunday) in five Sunday-first weeks', () => {
    const grid = buildMonthGrid(NOV_1, NOV_10, MAX);

    assert.equal(grid.length, 5);
    assert.ok(grid.every((week) => week.length === 7));
    assert.ok(isSameDay(grid[0]![0]!.date, new Date(2026, 10, 1)));
    assert.ok(isSameDay(grid[4]![6]!.date, new Date(2026, 11, 5)));
    assert.equal(grid[4]![6]!.inMonth, false);
  });

  it('pads the first week with the previous month', () => {
    // December 2026 starts on a Tuesday.
    const grid = buildMonthGrid(new Date(2026, 11, 1), NOV_10, MAX);

    assert.ok(isSameDay(grid[0]![0]!.date, new Date(2026, 10, 29)));
    assert.equal(grid[0]![0]!.inMonth, false);
    assert.ok(isSameDay(grid[0]![2]!.date, new Date(2026, 11, 1)));
  });

  it('disables days outside the allowed range', () => {
    const grid = buildMonthGrid(NOV_1, NOV_10, MAX).flat();
    const byDay = (day: number) => grid.find((cell) => cell.inMonth && cell.date.getDate() === day);

    assert.equal(byDay(9)?.disabled, true);
    assert.equal(byDay(10)?.disabled, false);
    assert.equal(byDay(30)?.disabled, false);
  });

  it('disables days after the maximum date', () => {
    const grid = buildMonthGrid(new Date(2027, 10, 1), NOV_10, MAX).flat();
    const byDay = (day: number) => grid.find((cell) => cell.inMonth && cell.date.getDate() === day);

    assert.equal(byDay(9)?.disabled, false);
    assert.equal(byDay(10)?.disabled, true);
  });
});

describe('date helpers', () => {
  it('moves across year boundaries when adding months', () => {
    assert.equal(
      monthIndex(addMonths(new Date(2026, 11, 15), 1)),
      monthIndex(new Date(2027, 0, 1)),
    );
    assert.equal(addMonths(new Date(2026, 0, 31), -1).getMonth(), 11);
  });

  it('counts whole calendar days', () => {
    assert.equal(dayDifference(new Date(2026, 10, 1, 23, 0), new Date(2026, 10, 3, 1, 0)), 2);
    assert.equal(dayDifference(new Date(2026, 10, 10), new Date(2026, 10, 10)), 0);
  });
});
