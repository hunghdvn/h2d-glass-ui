import type { DataGridKey } from '../types';

/**
 * A row of the list the grid shows. Only data rows exist now; group, detail and form rows join the
 * union in later plans, with a level each.
 */
export interface FlatRow<TRow> {
  kind: 'data';
  key: DataGridKey;
  row: TRow;
  /** The place in the whole flat list, not in its page. */
  index: number;
}

/**
 * One data row for each row, in order. `getKey` reads the key from the row and its index, once for
 * each row. `previous` is the list made the last time: each of its rows whose row object, key and
 * place are the ones of now is given back as it was, so an immutable edit of one row (a new `data`
 * array with one new object) makes one new data row and draws one row again, and a key function
 * that is new but says the same (one written in the JSX) makes none. When every row is the one of
 * before, the list itself is given back.
 */
export function flattenRows<TRow>(
  rows: readonly TRow[],
  getKey: (row: TRow, index: number) => DataGridKey,
  previous?: readonly FlatRow<TRow>[],
): readonly FlatRow<TRow>[] {
  let same = previous?.length === rows.length;
  const flat = rows.map((row, index): FlatRow<TRow> => {
    const key = getKey(row, index);
    const before = previous?.[index];
    if (before && before.row === row && before.key === key) return before;
    same = false;
    return { kind: 'data', key, row, index };
  });
  return same && previous ? previous : flat;
}
