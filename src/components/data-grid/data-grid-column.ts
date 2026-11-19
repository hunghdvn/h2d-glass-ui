import type { DataGridValueColumn } from './types';

/**
 * Keeps the type `V` of a computed column. A plain object literal in a `DataGridColumn<TRow>[]`
 * would give its `cell` and `format` `value: any`; this reads `V` from `value`:
 * `dataGridColumn<Order>()({ id: 'total', value: (row) => row.qty * row.price })`. It returns the
 * column as it came.
 */
export function dataGridColumn<TRow>() {
  return <V>(column: DataGridValueColumn<TRow, V>): DataGridValueColumn<TRow, V> => column;
}
