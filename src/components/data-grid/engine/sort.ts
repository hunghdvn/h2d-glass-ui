import { collator } from '../../../internal/intl';
import type { DataGridSortItem } from '../types';
import type { ResolvedColumn } from './columns';

// Numbers before strings, so a `sortValue` that gives both still sorts the same way every time.
function compare(
  a: number | string,
  b: number | string,
  compareText: (a: string, b: string) => number,
) {
  if (typeof a === 'number') return typeof b === 'number' ? a - b : -1;
  return typeof b === 'string' ? compareText(a, b) : 1;
}

/**
 * The rows in the order of the sort items, as a new array; the input is not changed. Stable: rows
 * that are equal keep their order. Strings compare with `Intl.Collator` and `numeric`, so "DH-2"
 * comes before "DH-10"; numbers, dates and booleans compare as numbers; a lookup column by the
 * text it shows. A blank is last in both directions. The key of each row is read once per item,
 * not once per comparison.
 *
 * An item whose field is not a column that sorts, or whose direction is not `asc` or `desc`, is
 * ignored without a word, since a state may come from the end user's storage. With no item left
 * the very array that came in comes back, so what depends on its identity holds.
 */
export function sortRows<TRow>(
  rows: readonly TRow[],
  items: readonly DataGridSortItem[],
  columns: readonly ResolvedColumn<TRow>[],
  locale: string,
): readonly TRow[] {
  const levels: Array<{ column: ResolvedColumn<TRow>; sign: 1 | -1 }> = [];
  for (const item of items) {
    const column = columns.find((candidate) => candidate.id === item.field);
    const sign = item.direction === 'asc' ? 1 : item.direction === 'desc' ? -1 : undefined;
    if (!column?.allowSorting || sign === undefined) continue;
    if (levels.some((level) => level.column === column)) continue;
    levels.push({ column, sign });
  }
  if (levels.length === 0) return rows;

  const compareText = collator(locale, { numeric: true }).compare;
  const keys = levels.map(({ column }) => rows.map((row) => column.sortKey(row)));
  const order = rows.map((_, index) => index);
  order.sort((a, b) => {
    for (let level = 0; level < levels.length; level++) {
      const left = keys[level]![a]!;
      const right = keys[level]![b]!;
      if (left === right) continue;
      // A blank is last whichever way the column sorts.
      if (left === null) return 1;
      if (right === null) return -1;
      const result = compare(left, right, compareText);
      if (result !== 0) return result * levels[level]!.sign;
    }
    return a - b;
  });
  return order.map((index) => rows[index]!);
}
