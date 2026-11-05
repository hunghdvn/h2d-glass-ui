/** Pure date helpers shared by Calendar and DatePicker (and any future date control). */

const dateTimeCache = new Map<string, Intl.DateTimeFormat>();

function cacheKey(locale: string, options: Intl.DateTimeFormatOptions | undefined): string {
  return `${locale}\u0001${JSON.stringify(options ?? null)}`;
}

function getFormatter(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = cacheKey(locale, options);
  let formatter = dateTimeCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeCache.set(key, formatter);
  }
  return formatter;
}

// The instant of a calendar date at UTC midnight. `Date.UTC(y, …)` would read years 0–99 as
// 1900–1999, and parsing an ISO string would depend on the engine; `setUTCFullYear` takes the year
// as written. Every date is handled in UTC, so no time zone or daylight saving shifts a day.
function utc(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getTime();
}

// Day 0 of the next month is the last day of this one.
function daysInMonth(year: number, month: number): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month, 0);
  return date.getUTCDate();
}

function readDate(instant: number): { year: number; month: number; day: number } {
  const date = new Date(instant);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

// 'YYYY-MM' from a month or a date.
function isoMonthOf(iso: string): string {
  return iso.slice(0, 7);
}

/** A real calendar date written 'YYYY-MM-DD', year 0001–9999 ('2026-02-29' is false). */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

/** A month written 'YYYY-MM', year 0001–9999, month 01–12. */
export function isIsoMonth(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  if (year < 1 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  return true;
}

/** The parts of a valid ISO date, or null when `isIsoDate` is false. */
export function parseIso(iso: string): { year: number; month: number; day: number } | null {
  if (!isIsoDate(iso)) return null;
  return {
    year: Number(iso.slice(0, 4)),
    month: Number(iso.slice(5, 7)),
    day: Number(iso.slice(8, 10)),
  };
}

/** Writes the parts as 'YYYY-MM-DD', zero-padded (year to 4 digits). No validation. */
export function toIso(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function addDays(iso: string, days: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const instant = utc(parts.year, parts.month, parts.day) + days * 86400000;
  const next = readDate(instant);
  return toIso(next.year, next.month, next.day);
}

/** Adds months and keeps the day when it exists; otherwise the last day of the month (31 Jan + 1 → 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const total = parts.year * 12 + (parts.month - 1) + months;
  const newYear = Math.floor(total / 12);
  const newMonth = (((total % 12) + 12) % 12) + 1;
  const maxDay = daysInMonth(newYear, newMonth);
  const newDay = Math.min(parts.day, maxDay);
  return toIso(newYear, newMonth, newDay);
}

/** addMonths by 12 × years (29 Feb + 1 year → 28 Feb). */
export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

/** -1, 0 or 1. Works on two dates or on two months. */
export function compareIso(a: string, b: string): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** `min` when iso is before it, else `max` when iso is after it, else iso. `min` is checked first. */
export function clampIso(iso: string, min?: string, max?: string): string {
  if (min !== undefined && compareIso(iso, min) < 0) return min;
  if (max !== undefined && compareIso(iso, max) > 0) return max;
  return iso;
}

/** Same year and month. Each side may be a date or a month. */
export function isSameMonth(a: string, b: string): boolean {
  return isoMonthOf(a) === isoMonthOf(b);
}

/** The last date on or before iso whose weekday (0 = Sunday … 6 = Saturday) is weekStartsOn. */
export function startOfWeek(iso: string, weekStartsOn: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const instant = utc(parts.year, parts.month, parts.day);
  const weekday = new Date(instant).getUTCDay();
  const diff = (weekday - weekStartsOn + 7) % 7;
  return addDays(iso, -diff);
}

/** startOfWeek + 6 days. */
export function endOfWeek(iso: string, weekStartsOn: number): string {
  return addDays(startOfWeek(iso, weekStartsOn), 6);
}

/** 6 rows × 7 cells from startOfWeek(the 1st of the month); `month` is 'YYYY-MM' (a full date uses its month). */
export function monthGrid(
  month: string,
  weekStartsOn: number,
): { date: string; inMonth: boolean }[][] {
  const monthStr = isoMonthOf(month);
  const monthParts = monthStr.split('-');
  const year = Number(monthParts[0]!);
  const monthNum = Number(monthParts[1]!);
  const firstOfMonth = toIso(year, monthNum, 1);
  let cursor = startOfWeek(firstOfMonth, weekStartsOn);
  const rows: { date: string; inMonth: boolean }[][] = [];
  for (let r = 0; r < 6; r++) {
    const row: { date: string; inMonth: boolean }[] = [];
    for (let c = 0; c < 7; c++) {
      row.push({ date: cursor, inMonth: isoMonthOf(cursor) === monthStr });
      cursor = addDays(cursor, 1);
    }
    rows.push(row);
  }
  return rows;
}

// The typed-text form. Some locales default to another calendar (th-TH is Buddhist, fa-IR Persian)
// or to non-Latin digits (ar-EG, bn-BD, mr-IN, ne-NP); the year would then drift when parseDate reads
// it back, and `d` could not read the digits at all. Spec §2 leaves both out of scope, so pin them.
const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  calendar: 'gregory',
  numberingSystem: 'latn',
};

/** The month's long name and year in the locale ('November 2026'). `month` may be a date. */
export function formatMonthYear(month: string, locale: string): string {
  const monthStr = isoMonthOf(month);
  const monthParts = monthStr.split('-');
  const year = Number(monthParts[0]!);
  const monthNum = Number(monthParts[1]!);
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    year: 'numeric',
    calendar: 'gregory',
    timeZone: 'UTC',
  };
  return getFormatter(locale, options).format(utc(year, monthNum, 1));
}

/** Seven weekday names starting at weekStartsOn. */
export function weekdayNames(
  locale: string,
  weekStartsOn: number,
  width: 'short' | 'narrow' | 'long',
): string[] {
  const options: Intl.DateTimeFormatOptions = {
    weekday: width,
    calendar: 'gregory',
    timeZone: 'UTC',
  };
  const formatter = getFormatter(locale, options);
  const base = utc(2026, 11, 1);
  const names: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dayIndex = (weekStartsOn + i) % 7;
    names.push(formatter.format(new Date(base + dayIndex * 86400000)));
  }
  return names;
}

/**
 * The date in the locale. Without options: the locale's numeric form with two-digit day and month
 * ({ year: 'numeric', month: '2-digit', day: '2-digit' }), and a four-digit year ('11/14/0050').
 * Options replace those fields. The time zone
 * is always UTC, whatever `options.timeZone` says, so the day never shifts.
 */
export function formatDate(
  iso: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const finalOptions: Intl.DateTimeFormatOptions = {
    ...(options ?? DEFAULT_DATE_OPTIONS),
    // Pinned after the spread so it holds when `options` is passed: the grid is Gregorian. Digits stay
    // the locale's there (the full-date aria-label); only the typed-text default is Latin.
    calendar: 'gregory',
    timeZone: 'UTC',
  };
  const formatter = getFormatter(locale, finalOptions);
  const instant = utc(parts.year, parts.month, parts.day);
  if (options) return formatter.format(instant);
  // `year: 'numeric'` writes year 50 as "50", which parseDate reads back as 2050, and year 123 as
  // "123", which it refuses: the typed form always has four digits of year, as an ISO date has.
  return formatter
    .formatToParts(instant)
    .map((part) => (part.type === 'year' ? part.value.padStart(4, '0') : part.value))
    .join('');
}

/** The placeholder for typing a date: formatDate's default form with yyyy, mm, dd ('mm/dd/yyyy'). */
export function datePattern(locale: string): string {
  const formatter = getFormatter(locale, { ...DEFAULT_DATE_OPTIONS, timeZone: 'UTC' });
  const parts = formatter.formatToParts(utc(2026, 11, 14));
  return parts
    .map((part) => {
      if (part.type === 'year') return 'yyyy';
      if (part.type === 'month') return 'mm';
      if (part.type === 'day') return 'dd';
      return part.value;
    })
    .join('');
}

/** Reads typed text in the locale's day, month, year order; null when it is not a real date. */
export function parseDate(text: string, locale: string): string | null {
  const formatter = getFormatter(locale, { ...DEFAULT_DATE_OPTIONS, timeZone: 'UTC' });
  const order = formatter
    .formatToParts(utc(2026, 11, 14))
    .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map((part) => part.type);

  const groups = text.match(/\d+/g);
  if (!groups || groups.length !== 3) return null;

  const values: Record<string, string> = {};
  order.forEach((type, index) => {
    values[type] = groups[index]!;
  });

  const dayStr = values.day;
  const monthStr = values.month;
  const yearStr = values.year;
  if (!dayStr || !monthStr || !yearStr) return null;
  if (dayStr.length < 1 || dayStr.length > 2) return null;
  if (monthStr.length < 1 || monthStr.length > 2) return null;
  if (yearStr.length !== 2 && yearStr.length !== 4) return null;

  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = yearStr.length === 2 ? 2000 + Number(yearStr) : Number(yearStr);
  const iso = toIso(year, month, day);
  if (!isIsoDate(iso)) return null;
  return iso;
}

/** Today on the user's machine (local time, not UTC), as 'YYYY-MM-DD'. */
export function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
