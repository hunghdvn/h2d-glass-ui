import type { ReactNode } from 'react';

/** What a row is known by: a string or a number, as the `key` of a React element. */
export type DataGridKey = string | number;

export type DataGridDataType = 'string' | 'number' | 'date' | 'datetime' | 'boolean';

export type DataGridSortDirection = 'asc' | 'desc';

// The state types hold only what JSON can carry, so an app can keep them in `localStorage` or send
// them to a server. `field` is the id of a column.
export interface DataGridSortItem {
  field: string;
  direction: DataGridSortDirection;
}

/** The page is counted from 0. */
export interface DataGridPage {
  index: number;
  size: number;
}

/** What a custom cell may know about its column. */
export interface DataGridColumnInfo {
  readonly id: string;
  readonly caption: string;
  readonly dataType: DataGridDataType;
  readonly align: 'start' | 'center' | 'end';
}

export interface DataGridCellContext<TRow, V> {
  row: TRow;
  rowKey: DataGridKey;
  value: V;
  /** The value as the grid shows it: formatted, or the lookup's display text. */
  text: string;
  column: DataGridColumnInfo;
  selected: boolean;
}

export interface DataGridLookup {
  items: readonly object[];
  /** The property of an item that a row's value is compared with. */
  valueField: string;
  /** The property of the matching item that is shown. */
  displayField: string;
}

// The functions are declared with method syntax on purpose: it makes their parameters bivariant, so a
// column computed with a concrete `V` still fits `DataGridColumn<TRow>[]` (see `dataGridColumn`).
export interface DataGridColumnBase<TRow, V> {
  /** The title of the column; the id when left out. */
  caption?: string;
  /** How the value is read, compared and shown; `'string'` when left out. */
  dataType?: DataGridDataType;
  /** Intl options for the column's type, or a function that writes the text of a value. */
  format?:
    Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | ((value: V, row: TRow) => string);
  cell?(ctx: DataGridCellContext<TRow, V>): ReactNode;
  align?: 'start' | 'center' | 'end';
  /** A fixed width in pixels; the column is flexible when left out. */
  width?: number;
  /** The least width of a flexible column in pixels; 60 when left out. */
  minWidth?: number;
  rowHeader?: boolean;
  allowSorting?: boolean;
  sortValue?(row: TRow): string | number | boolean | Date | null | undefined;
  lookup?: DataGridLookup;
}

/**
 * A column that reads a property of the row. The union is by design: it is what lets `cell` and
 * `format` of `{ field: 'total' }` take `value: TRow['total']`.
 */
export type DataGridFieldColumn<TRow> = {
  [K in keyof TRow & string]: DataGridColumnBase<TRow, TRow[K]> & {
    field: K;
    id?: string;
    value?: never;
  };
}[keyof TRow & string];

/** A column that computes its value; it needs an `id`, since there is no field to name it. */
export type DataGridValueColumn<TRow, V = unknown> = DataGridColumnBase<TRow, V> & {
  id: string;
  value(row: TRow): V;
  field?: never;
};

// `any` here is deliberate: a column list holds columns of different `V`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataGridColumn<TRow> = DataGridFieldColumn<TRow> | DataGridValueColumn<TRow, any>;
