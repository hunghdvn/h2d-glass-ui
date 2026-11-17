import type { HTMLAttributes, ReactNode } from 'react';
import type { TableVariant } from '../table/Table';

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

export type DataGridSortMode = 'single' | 'multiple';

/** Whether rows can be chosen, and how many at once. */
export type DataGridSelectionMode = 'none' | 'single' | 'multiple';

/** What "select all" is about: the rows of the page that is shown, or every row after sorting. */
export type DataGridSelectAllMode = 'page' | 'all';

/**
 * What the grid keeps for an app to save: the sort, the page and the chosen rows. It holds only what
 * JSON can carry. Later plans add the rest of the state (the filter, the layout of the columns).
 */
export interface DataGridState {
  sort: readonly DataGridSortItem[];
  page: DataGridPage;
  /** The keys of the chosen rows, in the order they were chosen. */
  selectedKeys: readonly DataGridKey[];
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

export type DataGridDensity = 'compact' | 'standard' | 'comfortable';

/**
 * Every word the grid says that is not the caller's: hidden text, and later the names of its
 * controls and what it announces. All of them have an English default.
 */
export interface DataGridLabels {
  /** The words of a boolean `true`, hidden next to its check, and of a `false`. */
  yes: string;
  no: string;
  /**
   * Hidden words in the button of a sorted column, after its title: the first level is said by
   * `aria-sort`, so with one column sorted there is nothing to add (the default is `''`), and with
   * several the default is ", sorted descending, 2 of 3".
   */
  sortState(direction: DataGridSortDirection, level: number, count: number): string;
  /** What is said after a press on a title: the whole sort, in order, with the captions. */
  announceSort(sorted: readonly { caption: string; direction: DataGridSortDirection }[]): string;
  /** What is said when a press leaves no sort. */
  announceSortCleared: string;
  /** The count in the pager: the first and the last row of the page, and how many there are. */
  pageInfo(from: number, to: number, total: number): string;
  /** The name of the choice of how many rows a page holds. */
  rowsPerPage: string;
  /** An item of that choice. */
  pageSize(size: number): string;
  /** The name of the pages, and of the buttons that go to one. */
  pagination: string;
  previousPage: string;
  nextPage: string;
  page(page: number): string;
  /** The name of the box in the title of the selection column when it is about the page. */
  selectAllOnPage: string;
  /** The name of that box when it is about every row. */
  selectAll: string;
  /** The name of the box of a row; `name` is the text of its row header, or its key. */
  selectRow(name: string): string;
  /** What is said after a select all or a range: how many rows are chosen now. */
  announceSelected(count: number): string;
}

// The root always has children of its own, so `children` and `dangerouslySetInnerHTML` (which may
// not go with children) are not props; `onChange` is left to the controlled state of later plans.
// This is an object type, so an app can `extend` it.
export type DataGridProps<TRow> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'dangerouslySetInnerHTML'
> & {
  /** The rows. Rows are read, never changed; a changed row is a new object. */
  data: readonly TRow[];
  /** The key of a row: the name of a property, or a function of the row. Keys must be unique. */
  rowKey: (keyof TRow & string) | ((row: TRow) => DataGridKey);
  /** The columns. A stable array: a module constant or `useMemo`, not one written in the JSX. */
  columns: readonly DataGridColumn<TRow>[];
  /** The title of the grid, shown above it; it is the grid's name. */
  caption?: ReactNode;
  /** What the grid is about, under the caption; it describes the grid. */
  description?: ReactNode;
  captionAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  variant?: TableVariant;
  density?: DataGridDensity;
  /** The height of a row in pixels, over the one the density and variant give. */
  rowHeight?: number;
  /** The language of the numbers, dates and order of the text; `'en-US'` when left out. */
  locale?: string;
  /** The zone a `datetime` column is shown in; `'UTC'` when left out. */
  timeZone?: string;
  /**
   * The height of the whole grid: a number of pixels or any CSS length. With a height the rows
   * scroll under a heading that stays in place; without one the grid is as tall as its rows.
   */
  height?: number | string;
  /** A class for the row of a data row. */
  rowClassName?: (row: TRow) => string | undefined;
  /**
   * The default of `allowSorting` of every column; a column's own wins. `true` when left out. A column
   * that sorts has a button for a title.
   */
  allowSorting?: boolean;
  /** `'multiple'` (default): Shift or ⌘ or Ctrl with a press adds a level. `'single'`: one column. */
  sortMode?: DataGridSortMode;
  /** The sort, in order: each item is a column id and a direction. Pass it with `onSortChange`. */
  sort?: readonly DataGridSortItem[];
  defaultSort?: readonly DataGridSortItem[];
  onSortChange?: (sort: readonly DataGridSortItem[]) => void;
  /**
   * The pages: how many rows one holds, and the sizes the pager offers. `{ pageSize: 20, pageSizes:
   * [10, 20, 50, 100] }` when left out; `false` is one page of every row. With no `pageSizes` there
   * is no choice of size in the pager.
   */
  paging?: false | { pageSize?: number; pageSizes?: readonly number[] };
  /** The page, counted from 0. Pass it with `onPageChange`. */
  page?: DataGridPage;
  defaultPage?: DataGridPage;
  onPageChange?: (page: DataGridPage) => void;
  /**
   * Called after `onSortChange` or `onPageChange`, with the whole state the press asks for, and the
   * name of the part that changed: one function to save the state with. Called from what the user
   * does, never from a render, so a controlled value that changes from outside does not call it.
   */
  onStateChange?: (state: DataGridState, changed: keyof DataGridState) => void;
  /**
   * Server mode: `data` is the page and is already sorted. The grid sorts and pages nothing; it counts
   * `totalCount` rows in the pager and calls `onSortChange` and `onPageChange` for the app to load again.
   */
  remote?: boolean;
  /** How many rows there are in all, in server mode. Without it the rows of `data` are counted. */
  totalCount?: number;
  /**
   * A row is activated by Enter on a cell that holds no control of its own, or by a double press on
   * a cell that is not a control: to open the page of the row, for instance.
   */
  onRowActivate?: (row: TRow, key: DataGridKey) => void;
  /**
   * Whether rows can be chosen: `'single'` (one row; a press on a row, or Space, chooses it) or
   * `'multiple'` (a column of boxes; Shift with a press or Space chooses a range, mod+A all of them).
   * `'none'` when left out.
   */
  selectionMode?: DataGridSelectionMode;
  /**
   * What the box in the title of the selection column, and mod+A, choose: `'page'` (default) the rows
   * of the page shown, `'all'` every row after sorting. In server mode only the page is known, so
   * `'all'` is `'page'` there.
   */
  selectAllMode?: DataGridSelectAllMode;
  /**
   * Whether a press on a row chooses it: `true` when `selectionMode` is `'single'`, `false` when it is
   * `'multiple'`, where only the box does. A press on a control in a cell never chooses the row.
   */
  selectOnRowClick?: boolean;
  /** The keys of the chosen rows. Pass it with `onSelectedKeysChange`. */
  selectedKeys?: readonly DataGridKey[];
  defaultSelectedKeys?: readonly DataGridKey[];
  onSelectedKeysChange?: (keys: readonly DataGridKey[]) => void;
  labels?: Partial<DataGridLabels>;
};

/** What a ref to a `DataGrid` holds: the grid's commands, not an element. */
export interface DataGridHandle {
  /** The element the grid is drawn in, `null` before it is mounted. */
  readonly element: HTMLDivElement | null;
  /** The state the grid shows: the sort, and the page as drawn (a page out of range is the nearest). */
  getState(): DataGridState;
  /** Moves the keyboard focus to the active cell, and scrolls it into view. */
  focus(): void;
}
