import { formatDate, isIsoDate, toIso } from '../../../internal/date';
import { dateTimeFormat, numberFormat } from '../../../internal/intl';
import { isNumber } from '../../../internal/number';
import { foldText } from '../../../internal/text-fold';
import { devWarn } from '../../../internal/warn';
import type { DataGridDataType } from '../types';

const DAY = 86_400_000;
// The latest instant a `Date` holds: past it `Intl` throws.
const MAX_INSTANT = 8.64e15;

/** What a value is compared by: a number or a string, and `null` for a blank, which sorts last. */
export type Comparable = number | string | null;

/** What `formatValue` needs besides the value: the grid's locale and zone, the words of a boolean. */
export interface FormatOptions {
  locale: string;
  timeZone: string;
  /** The text of `true` and of `false`; the cell draws the icon, search and CSV read these. */
  yes: string;
  no: string;
  /** The Intl options of the column (`format`), already tried once by `resolveColumns`. */
  options?: object;
}

/** A value with nothing to show: `null`, `undefined`, `''`, `NaN` and an invalid `Date`. */
export function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'number' && Number.isNaN(value)) ||
    (value instanceof Date && Number.isNaN(value.getTime()))
  );
}

// Each type has one warning, in words that hold no value: `devWarn` prints a message once, and a
// grid of 10 000 rows with a bad column would otherwise fill the console.
const REFUSED: Record<DataGridDataType, string> = {
  string:
    '<DataGrid> a string column has a value that is not a string or a number; it is shown blank.',
  number: '<DataGrid> a number column has a value that is not a finite number; it is shown blank.',
  date: '<DataGrid> a date column has a value that is not a Date or a YYYY-MM-DD string; it is shown blank.',
  datetime:
    '<DataGrid> a datetime column has a value that is not a Date, a number of milliseconds or an ISO 8601 date-time with an offset (Z or +hh:mm); it is shown blank.',
  boolean: '<DataGrid> a boolean column has a value that is not true or false; it is shown blank.',
};

// ISO 8601 with an offset, and nothing else. Without one, JavaScript would read the text in the zone
// of the machine, and a server in UTC would write a different time from a browser in Hanoi (§3.9).
const DATETIME =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(?:(Z)|([+-])(\d{2}):(\d{2}))$/;

/** The instant of an ISO 8601 date-time with an offset, or `null` when it is not a real moment. */
function parseDateTime(text: string): number | null {
  const match = DATETIME.exec(text);
  if (!match) return null;
  const [, day, hour, minute, second = '0', fraction = '0', zulu, sign, offsetHour, offsetMinute] =
    match;
  if (!isIsoDate(day)) return null;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null;
  let offset = 0;
  if (!zulu) {
    if (Number(offsetHour) > 23 || Number(offsetMinute) > 59) return null;
    offset = (Number(offsetHour) * 60 + Number(offsetMinute)) * 60_000 * (sign === '-' ? -1 : 1);
  }
  // The fraction is cut to milliseconds, so the text handed to `Date.parse` is the one form every
  // engine reads the same way.
  const millis = fraction.padEnd(3, '0').slice(0, 3);
  const utc = Date.parse(`${day}T${hour}:${minute}:${second.padStart(2, '0')}.${millis}Z`);
  return Number.isNaN(utc) ? null : utc - offset;
}

/** The UTC midnight of a `Date`'s calendar day, or `null` when that day is outside years 1 to 9999. */
function dayOfDate(date: Date): number | null {
  const instant = date.getTime();
  const day = instant - (((instant % DAY) + DAY) % DAY);
  const year = new Date(day).getUTCFullYear();
  return year >= 1 && year <= 9999 ? day : null;
}

// The value as its type reads it: a string, a finite number, a boolean, the UTC midnight of a day
// (`date`) or an instant (`datetime`); `null` for a blank, and for a value the type refuses, which
// warns. Strict on purpose: no `new Date(string)`, no `Number('12')`.
function read(value: unknown, dataType: DataGridDataType): string | number | boolean | null {
  if (isBlank(value)) return null;
  let result: string | number | boolean | null = null;
  switch (dataType) {
    case 'string':
      if (typeof value === 'string') result = value;
      else if (isNumber(value)) result = String(value);
      else if (typeof value === 'bigint') result = String(value);
      break;
    case 'number':
      if (isNumber(value)) result = value;
      break;
    case 'boolean':
      if (typeof value === 'boolean') result = value;
      break;
    case 'date':
      if (value instanceof Date) result = dayOfDate(value);
      else if (isIsoDate(value)) result = Date.parse(`${value}T00:00:00Z`);
      break;
    case 'datetime':
      if (value instanceof Date) result = value.getTime();
      else if (isNumber(value)) result = value;
      else if (typeof value === 'string') result = parseDateTime(value);
      break;
  }
  if (result === null) devWarn(REFUSED[dataType]);
  return result;
}

/**
 * What the value is compared by in a sort. A date is its UTC calendar day and a datetime its
 * instant, both in milliseconds, so the zone of the grid never changes an order; a boolean is 0 or
 * 1, `false` first. `null` is a blank, which the sort puts last in both directions.
 */
export function toComparable(value: unknown, dataType: DataGridDataType): Comparable {
  const parsed = read(value, dataType);
  return typeof parsed === 'boolean' ? Number(parsed) : parsed;
}

// The calendar day of an instant in a time zone, as an ISO day; `null` outside years 1 to 9999.
function dayInZone(instant: number, timeZone: string): string | null {
  if (Math.abs(instant) > MAX_INSTANT) return null;
  // Gregorian and Latin digits, whatever the locale: only the three numbers are read back.
  const parts = dateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(instant);
  let year = 0;
  let month = 0;
  let day = 0;
  for (const part of parts) {
    if (part.type === 'year') year = Number(part.value);
    else if (part.type === 'month') month = Number(part.value);
    else if (part.type === 'day') day = Number(part.value);
  }
  return year >= 1 && year <= 9999 ? toIso(year, month, day) : null;
}

// The ISO day of the UTC midnight that `read` gives for a `date`: the one rule for a day written back.
function isoDayOf(midnight: number): string {
  const day = new Date(midnight);
  return toIso(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate());
}

/**
 * What a filter holds of a value, as JSON (spec phase 6 §6.1): the string, the number or the boolean as
 * the type reads it, and for a `date` its ISO day, for a `datetime` the ISO day it falls on in
 * `timeZone`. `null` for a blank, and for a value the type refuses, which warns as every other read
 * does.
 */
export function toFilterKey(
  value: unknown,
  dataType: DataGridDataType,
  timeZone: string,
): string | number | boolean | null {
  const parsed = read(value, dataType);
  if (parsed === null) return null;
  switch (dataType) {
    case 'date':
      return isoDayOf(parsed as number);
    case 'datetime':
      return dayInZone(parsed as number, timeZone);
    default:
      return parsed;
  }
}

/**
 * The text of a value: the Intl format of its type (or the one in `options`), '' when it is blank
 * or the type refuses it. A `date` is shown as the calendar day it is, in UTC, whatever the zone;
 * a `datetime` is shown in the grid's `timeZone` unless the options name another.
 */
export function formatValue(
  value: unknown,
  dataType: DataGridDataType,
  { locale, timeZone, yes, no, options }: FormatOptions,
): string {
  const parsed = read(value, dataType);
  if (parsed === null) return '';
  switch (dataType) {
    case 'string':
      return String(parsed);
    case 'boolean':
      return parsed ? yes : no;
    case 'number':
      return numberFormat(locale, options as Intl.NumberFormatOptions | undefined).format(
        parsed as number,
      );
    case 'date':
      return formatDate(
        isoDayOf(parsed as number),
        locale,
        (options as Intl.DateTimeFormatOptions | undefined) ?? {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        },
      );
    case 'datetime':
      return dateTimeFormat(
        locale,
        options
          ? { timeZone, ...(options as Intl.DateTimeFormatOptions) }
          : { dateStyle: 'short', timeStyle: 'short', timeZone },
      ).format(parsed as number);
  }
}

/** What a text cache needs of a column: its id, and how it writes the text of a row. */
interface TextSource<TRow> {
  id: string;
  text(row: TRow): string;
}

/** What the cache needs of a column to remember the key a row is filtered by. */
interface KeySource<TRow> {
  id: string;
  filterKey(row: TRow): unknown;
}

/**
 * Remembers the text of each cell, its folded form and the key it is filtered by (a `datetime`'s key is a
 * `formatToParts` per row): one per row object and per resolved column, so a sort, a search, a filter and
 * the cell itself write it once, and a search folds it once.
 * Rows are immutable data (a new row is a new object), so there is nothing to invalidate. The column
 * is the key, not its id, because a new locale or a new `format` makes a new resolved column, and its
 * texts differ. A row that is not an object cannot be a key; its text is written each time.
 */
export function createTextCache<TRow>() {
  const texts = new WeakMap<object, WeakMap<object, string>>();
  const foldeds = new WeakMap<object, WeakMap<object, string>>();
  // The keys are of any type, `null` (blank) included, so they are told from missing by `has`.
  const keys = new WeakMap<object, WeakMap<object, unknown>>();

  // The value of one (row, column) cell in a store, made once by `make`.
  function remember(
    store: WeakMap<object, WeakMap<object, string>>,
    row: object,
    column: object,
    make: () => string,
  ): string {
    let columns = store.get(row);
    if (!columns) {
      columns = new WeakMap();
      store.set(row, columns);
    }
    let value = columns.get(column);
    if (value === undefined) {
      value = make();
      columns.set(column, value);
    }
    return value;
  }

  function text(row: TRow, column: TextSource<TRow>): string {
    if (typeof row !== 'object' || row === null) return column.text(row);
    return remember(texts, row, column, () => column.text(row));
  }

  return {
    text,
    /** The key the cell is filtered by (`filterKey` of the column), `null` for a blank. */
    key(row: TRow, column: KeySource<TRow>): unknown {
      if (typeof row !== 'object' || row === null) return column.filterKey(row);
      let columns = keys.get(row);
      if (!columns) {
        columns = new WeakMap();
        keys.set(row, columns);
      }
      if (columns.has(column)) return columns.get(column);
      const value = column.filterKey(row);
      columns.set(column, value);
      return value;
    },
    /** The text of the cell folded for matching (`foldText`: lower case, no diacritics, đ as d). */
    folded(row: TRow, column: TextSource<TRow>): string {
      if (typeof row !== 'object' || row === null) return foldText(column.text(row));
      return remember(foldeds, row, column, () => foldText(text(row, column)));
    },
  };
}

/** What `createTextCache` gives: the text of a cell, its folded form and its filter key, each made once. */
export type TextCache<TRow> = ReturnType<typeof createTextCache<TRow>>;

/**
 * What a CSV writes of a value in `raw` (spec phase 6 §6.3 "Xuất CSV"): the value as its type reads it, in a form no
 * locale changes. A number is its digits with a dot, a `date` its ISO day, a `datetime` its instant in UTC with a
 * `Z`, a boolean `true` or `false`, a string itself. `''` for a blank, for a value the type refuses (which warns as
 * every read does), and for an instant a `Date` cannot hold.
 */
export function rawText(value: unknown, dataType: DataGridDataType): string {
  const parsed = read(value, dataType);
  if (parsed === null) return '';
  switch (dataType) {
    case 'date':
      return isoDayOf(parsed as number);
    case 'datetime':
      return Math.abs(parsed as number) > MAX_INSTANT
        ? ''
        : new Date(parsed as number).toISOString();
    default:
      return String(parsed);
  }
}
