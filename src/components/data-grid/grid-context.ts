import { createContext, useContext } from 'react';
import type { ResolvedColumn } from './engine/columns';
import type { FlatRow } from './engine/flatten';
import type { DataGridLabels } from './types';
import type { TableVariant } from '../table/Table';

/** What the parts of one grid share. Internal: nothing of it is exported. */
export interface GridContextValue<TRow = unknown> {
  columns: readonly ResolvedColumn<TRow>[];
  labels: DataGridLabels;
  variant: TableVariant;
  /** The rows to draw, in order: the page now, and later the window of a virtual list. */
  rows: readonly FlatRow<TRow>[];
  /** A unique React key for each of `rows`, in the same order. */
  rowReactKeys: readonly string[];
  /** The text of a cell, written once for a row and a column. */
  textOf: (row: TRow, column: ResolvedColumn<TRow>) => string;
  rowClassName: ((row: TRow) => string | undefined) | undefined;
}

export const GridContext = createContext<GridContextValue | null>(null);

/**
 * The context of the grid the part is in. The parts are internal and always inside a grid, so a
 * missing context is a mistake of the library's own, not of a caller; it is the one place that throws.
 */
export function useGridContext<TRow>(): GridContextValue<TRow> {
  const context = useContext(GridContext);
  if (!context) throw new Error('A part of the DataGrid was used outside a DataGrid.');
  return context as GridContextValue<TRow>;
}
