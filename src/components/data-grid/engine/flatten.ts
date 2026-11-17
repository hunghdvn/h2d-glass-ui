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
 * each row. `previous` is the list made before from the same rows (the same array), with another key
 * function: when every key is the same it is given back, the same object, so that a key function
 * that is new but says the same (one written in the JSX) draws no row again.
 */
export function flattenRows<TRow>(
  rows: readonly TRow[],
  getKey: (row: TRow, index: number) => DataGridKey,
  previous?: readonly FlatRow<TRow>[],
): readonly FlatRow<TRow>[] {
  const keys = rows.map((row, index) => getKey(row, index));
  if (
    previous?.length === keys.length &&
    keys.every((key, index) => previous[index]!.key === key)
  ) {
    return previous;
  }
  return rows.map((row, index) => ({ kind: 'data', key: keys[index]!, row, index }));
}
