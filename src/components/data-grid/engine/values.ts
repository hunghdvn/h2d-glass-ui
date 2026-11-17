import { formatDate, isIsoDate, toIso } from '../../../internal/date';
import { dateTimeFormat, numberFormat } from '../../../internal/intl';
import { devWarn } from '../../../internal/warn';
import type { DataGridDataType } from '../types';

const DAY = 86_400_000;

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
      else if (typeof value === 'number' && Number.isFinite(value)) result = String(value);
      else if (typeof value === 'bigint') result = String(value);
      break;
    case 'number':
      if (typeof value === 'number' && Number.isFinite(value)) result = value;
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
      else if (typeof value === 'number' && Number.isFinite(value)) result = value;
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
    case 'date': {
      const day = new Date(parsed as number);
      const iso = toIso(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate());
      return formatDate(
        iso,
        locale,
        (options as Intl.DateTimeFormatOptions | undefined) ?? {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        },
      );
    }
    case 'datetime':
      return dateTimeFormat(
        locale,
        options
          ? { timeZone, ...(options as Intl.DateTimeFormatOptions) }
          : { dateStyle: 'short', timeStyle: 'short', timeZone },
      ).format(parsed as number);
  }
}

/**
 * Remembers the text of each cell: one per row object and per resolved column, so a sort, a search
 * and the cell itself write it once. Rows are immutable data (a new row is a new object), so there
 * is nothing to invalidate. The column is the key, not its id, because a new locale or a new
 * `format` makes a new resolved column, and its texts differ. A row that is not an object cannot be
 * a key; its text is written each time.
 */
export function createTextCache<TRow>() {
  const cache = new WeakMap<object, WeakMap<object, string>>();
  return {
    text(row: TRow, column: { id: string; text(row: TRow): string }): string {
      if (typeof row !== 'object' || row === null) return column.text(row);
      let columns = cache.get(row);
      if (!columns) {
        columns = new WeakMap();
        cache.set(row, columns);
      }
      let text = columns.get(column);
      if (text === undefined) {
        text = column.text(row);
        columns.set(column, text);
      }
      return text;
    },
  };
}
