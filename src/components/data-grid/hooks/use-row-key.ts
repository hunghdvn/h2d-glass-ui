import { useMemo } from 'react';
import { readRowKey, usableKey } from '../row-keys';
import type { RowKey } from '../row-keys';
import type { DataGridKey } from '../types';

/**
 * The function the pipeline reads a row's key with: the `rowKey` of this render. A property name is
 * a value, so its function is the same from render to render. A function written in the JSX is a new
 * one on every render, and so is this: the flatten step reads the keys again with it and keeps its
 * rows when they are the same (`flattenRows`), so it costs one pass of reads and no row is drawn
 * again. A row with no usable key is known by its place in the list; the warnings are `checkKeys`',
 * which the grid runs after the commit on the list the pipeline made, and only in development.
 */
export function useRowKey<TRow>(rowKey: RowKey<TRow>): (row: TRow, index: number) => DataGridKey {
  return useMemo(() => (row, index) => usableKey(readRowKey(rowKey, row)) ?? index, [rowKey]);
}
