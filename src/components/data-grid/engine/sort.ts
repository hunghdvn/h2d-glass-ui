import { collator } from '../../../internal/intl';
import type { DataGridSortItem, DataGridSortMode } from '../types';
import type { ResolvedColumn } from './columns';

/**
 * Two sort keys that are not blank: numbers before strings, so a `sortValue` that gives both still
 * sorts the same way every time. The one comparison of the sort and of the lists of the header filter.
 */
export function compareKeys(
  a: number | string,
  b: number | string,
  compareText: (a: string, b: string) => number,
) {
  if (typeof a === 'number') return typeof b === 'number' ? a - b : -1;
  return typeof b === 'string' ? compareText(a, b) : 1;
}

/**
 * The items that sort, in their order: an item whose field is not a column that sorts, or whose
 * direction is not `asc` or `desc`, or whose field came before, is dropped without a word, since a
 * state may come from the end user's storage (spec phase 6 §5). The first item of a field wins.
 */
export function effectiveSort<TRow>(
  items: readonly DataGridSortItem[],
  columns: readonly ResolvedColumn<TRow>[],
): DataGridSortItem[] {
  const kept: DataGridSortItem[] = [];
  for (const item of items) {
    const column = columns.find((candidate) => candidate.id === item.field);
    if (!column?.allowSorting) continue;
    if (item.direction !== 'asc' && item.direction !== 'desc') continue;
    if (kept.some((other) => other.field === item.field)) continue;
    kept.push({ field: item.field, direction: item.direction });
  }
  return kept;
}

/**
 * The sort after a press on the title of `field`. A plain press makes the column the only sort, at
 * its next direction (not sorted, ascending, descending, not sorted). A press that adds (Shift, or
 * ⌘ or Ctrl) keeps the other columns and adds this one ascending, turns it where it is, or removes
 * it after descending. In `'single'` mode the press never adds. The items are the effective ones
 * (`effectiveSort`); a new array comes back and the one that came in is not changed.
 */
export function nextSort(
  items: readonly DataGridSortItem[],
  field: string,
  additive: boolean,
  sortMode: DataGridSortMode,
): DataGridSortItem[] {
  const current = items.find((item) => item.field === field)?.direction;
  const next = current === undefined ? 'asc' : current === 'asc' ? 'desc' : undefined;
  if (!additive || sortMode === 'single') return next ? [{ field, direction: next }] : [];
  if (current === undefined) return [...items, { field, direction: 'asc' }];
  return next
    ? items.map((item) => (item.field === field ? { field, direction: next } : item))
    : items.filter((item) => item.field !== field);
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
  const levels = effectiveSort(items, columns).map((item) => ({
    column: columns.find((candidate) => candidate.id === item.field)!,
    sign: item.direction === 'asc' ? (1 as const) : (-1 as const),
  }));
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
      const result = compareKeys(left, right, compareText);
      if (result !== 0) return result * levels[level]!.sign;
    }
    return a - b;
  });
  return order.map((index) => rows[index]!);
}
