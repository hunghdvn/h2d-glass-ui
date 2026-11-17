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

/** One data row for each row, in order. `getKey` reads the key from the row and its index. */
export function flattenRows<TRow>(
  rows: readonly TRow[],
  getKey: (row: TRow, index: number) => DataGridKey,
): FlatRow<TRow>[] {
  return rows.map((row, index) => ({ kind: 'data', key: getKey(row, index), row, index }));
}
