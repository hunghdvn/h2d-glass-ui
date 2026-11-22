import { isIsoDate } from '../../../internal/date';
import type { ResolvedColumn } from './columns';
import type { TextReader } from './filter';
import { compareKeys } from './sort';
import type { Comparable } from './values';

/**
 * One value of a column as a list of values writes it: the header filter's list and the groups of a
 * grouping both list the values of a column, so they read each value this one way.
 */
export interface ListedValue {
  /** What the filter holds of the value: `null` for a blank (see `filterKey` of the column). */
  key: unknown;
  text: string;
  /** What the value is ordered by; `null` is a blank, which comes last. */
  sortKey: Comparable;
}

/**
 * What a value that no row holds is ordered by, as the column orders its rows: a lookup by its text, a
 * day by its time, a number as a number. A column with a `sortValue` may order the rows another way; a
 * value with no row cannot follow it.
 */
export function keySortKey<TRow>(
  column: ResolvedColumn<TRow>,
  key: unknown,
  text: string,
): Comparable {
  if (column.choices) return text === '' ? null : text;
  if (typeof key === 'number') return key;
  if (typeof key === 'boolean') return Number(key);
  if (isIsoDate(key)) return Date.parse(`${key}T00:00:00Z`);
  return typeof key === 'string' ? key : null;
}

/**
 * The value of `row` in `column` as a list writes it. The key is the one the filter holds, read from
 * the cache (a datetime's day in the zone its cells are shown in). The text is the cell's, but a
 * datetime is listed by its day, so its text is that day's, and an empty text is the key as the column
 * writes it. The order is the column's `sortKey` of the row, so a `sortValue` orders the values and a
 * lookup is ordered by its text; a datetime's is its day, since a list of days cannot follow the
 * instants of a `sortValue`.
 */
export function listedValue<TRow>(
  row: TRow,
  column: ResolvedColumn<TRow>,
  read: TextReader<TRow>,
): ListedValue {
  const key = read.key(row, column);
  const isDatetime = column.dataType === 'datetime';
  let text = isDatetime ? '' : read.text(row, column);
  if (text === '') text = column.keyText(key);
  return { key, text, sortKey: isDatetime ? keySortKey(column, key, text) : column.sortKey(row) };
}

/**
 * Orders two sort keys of listed values: numbers before strings, as the sort does, and a blank after
 * every other value. Two equal keys are 0: the caller breaks the tie by the place of first appearance.
 */
export function compareListed(
  a: Comparable,
  b: Comparable,
  compareText: (a: string, b: string) => number,
): number {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return compareKeys(a, b, compareText);
}
