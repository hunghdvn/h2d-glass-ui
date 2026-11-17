import { useEffect, useMemo } from 'react';
import { checkKeys, readRowKey, usableKey } from '../row-keys';
import type { RowKey } from '../row-keys';
import type { DataGridKey } from '../types';

/**
 * The function the pipeline reads a row's key with: the `rowKey` of this render. A property name is
 * a value, so its function is the same from render to render. A function written in the JSX is a new
 * one on every render, and so is this: the flatten step reads the keys again with it and keeps its
 * rows when they are the same (`flattenRows`), so it costs one pass of reads and no row is drawn
 * again. A row with no usable key is known by its place in the list; the warning is `checkKeys`',
 * after the commit, when `data` or `rowKey` changes, and only in development.
 */
export function useRowKey<TRow>(
  rowKey: RowKey<TRow>,
  data: readonly TRow[],
): (row: TRow, index: number) => DataGridKey {
  useEffect(() => {
    if (typeof rowKey === 'string' || typeof rowKey === 'function') checkKeys(data, rowKey);
  }, [data, rowKey]);

  return useMemo(() => (row, index) => usableKey(readRowKey(rowKey, row)) ?? index, [rowKey]);
}
