const DAY_MS = 86_400_000;

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
  disabled: boolean;
}

export function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(value: Date, months: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

export function monthIndex(value: Date): number {
  return value.getFullYear() * 12 + value.getMonth();
}

/** Whole calendar days from `from` to `to`, ignoring daylight-saving shifts. */
export function dayDifference(from: Date, to: Date): number {
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / DAY_MS);
}

/** Weeks (Sunday first) covering the month of `month`; days outside `min`..`max` are disabled. */
export function buildMonthGrid(month: Date, min: Date, max: Date): CalendarCell[][] {
  const year = month.getFullYear();
  const monthNumber = month.getMonth();
  const leadingDays = new Date(year, monthNumber, 1).getDay();
  const daysInMonth = new Date(year, monthNumber + 1, 0).getDate();
  const weekCount = Math.ceil((leadingDays + daysInMonth) / 7);
  const minTime = startOfDay(min).getTime();
  const maxTime = startOfDay(max).getTime();

  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(year, monthNumber, 1 - leadingDays + week * 7 + weekday);
      const time = date.getTime();
      return {
        date,
        inMonth: date.getMonth() === monthNumber,
        disabled: time < minTime || time > maxTime,
      };
    }),
  );
}
