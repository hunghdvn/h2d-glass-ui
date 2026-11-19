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

/** The side of the grid a column is pinned to. */
export type DataGridPin = 'left' | 'right';

/**
 * How the columns are laid out, by column id: the order, the widths in pixels, the hidden columns
 * and the pinned ones. It holds only what JSON can carry, so an app can keep it as the user left it.
 * The grid shows what it knows of it: an id of no column is left out, and a column it has none of
 * (a new one) is laid out by its own `width`, `visible` and `pinned`.
 */
export interface DataGridColumnLayout {
  /** Every data column, in order; the pinned ones in their zone, left, middle and right. */
  order: readonly string[];
  /** The width in pixels of a column that has one; a column with none is flexible. */
  widths: Readonly<Record<string, number>>;
  hidden: readonly string[];
  pinned: Readonly<Record<string, DataGridPin>>;
}

/**
 * What the grid keeps for an app to save: the sort, the page, the chosen rows and the layout of the
 * columns. It holds only what JSON can carry. Later plans add the rest of the state (the filter).
 */
export interface DataGridState {
  sort: readonly DataGridSortItem[];
  page: DataGridPage;
  /** The keys of the chosen rows, in the order they were chosen. */
  selectedKeys: readonly DataGridKey[];
  /** The layout as the grid shows it: new columns appended, ids of no column dropped. */
  columnLayout: DataGridColumnLayout;
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
  /**
   * The side this column is pinned to when the layout does not know it yet; a column the layout
   * knows is pinned as the layout says.
   */
  pinned?: DataGridPin;
  /** `false` hides the column when the layout does not know it yet, as `columnLayout.hidden` does. */
  visible?: boolean;
  rowHeader?: boolean;
  allowSorting?: boolean;
  /** Whether the column's width can be changed (by its handle and by keys); the grid's `allowResizing` when left out. */
  allowResizing?: boolean;
  /**
   * Whether the column can be moved, by dragging its title or with `mod+Shift+←` and `mod+Shift+→`; the
   * grid's `allowReordering` when left out. Other columns still move past a column that cannot.
   */
  allowReordering?: boolean;
  /**
   * Whether the column can be pinned and unpinned from its menu; the grid's `allowPinning` when left
   * out. A column that is pinned by `pinned` or by the layout stays pinned either way.
   */
  allowPinning?: boolean;
  /**
   * Whether the column can be hidden from its menu and from the column chooser; the grid's
   * `allowHiding` when left out. A column hidden by `visible: false` or by the layout stays hidden.
   */
  allowHiding?: boolean;
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
  /** What is said when the grid starts loading, and the hidden words of the spinner over the rows. */
  loading: string;
  /** What the grid says when it has no row to show. */
  noData: string;
  /** The width in the label that follows a column that is being resized, such as "180 px". */
  columnWidth(px: number): string;
  /** What is said, a moment after the last key, when a column's width was changed by keys. */
  announceResized(caption: string, px: number): string;
  /** What is said after a column was moved, by keys or by a drag: its place among the shown columns, from 1. */
  announceMoved(caption: string, position: number, count: number): string;
  /** The name of the button that opens the menu of a column. */
  columnMenu(caption: string): string;
  /** The items of the column menu. */
  sortAscending: string;
  sortDescending: string;
  clearSorting: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  moveLeft: string;
  moveRight: string;
  autoFit: string;
  hideColumn: string;
  /** What is said after a column was pinned from its menu, and after it was unpinned. */
  announcePinned(caption: string, side: DataGridPin): string;
  announceUnpinned(caption: string): string;
  /** What is said after a column was hidden, from its menu or from the column chooser. */
  announceHidden(caption: string): string;
  /** What is said after a column was shown again from the column chooser. */
  announceShown(caption: string): string;
  /** The title of the column chooser, and the name of its button. */
  columnChooser: string;
  /** What a box in the chooser that cannot be cleared says for its column, which is always shown. */
  lockedColumn: string;
  /** What a box in the chooser that cannot be cleared says when its column is the only one shown. */
  lastShownColumn: string;
}

/**
 * What a `toolbar` function is given: the items the toolbar draws by default, each a node to place, or
 * `null` when its feature is off; the spacer is always there. The toolbar gets an item for each part
 * of the grid that has a button: only the ones of this version are here.
 */
export interface DataGridToolbarItems {
  /** An element that takes the room between the items before it and the items after it. */
  spacer: ReactNode;
  /** The button that opens the column chooser; `null` without `columnChooser`. */
  columnChooser: ReactNode;
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
  /**
   * The row above the grid: the caption, then the items of the grid's buttons (`spacer`,
   * `columnChooser`). `false` takes the items away and keeps the caption, which names the grid and the
   * pager. A function is given the items, and what it returns is drawn after the caption instead of
   * them: place them in the order you like and add your own. The row is not drawn when it holds no
   * caption, no description and no item.
   */
  toolbar?: false | ((items: DataGridToolbarItems) => ReactNode);
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
  /**
   * `'virtual'` draws only the rows near what is seen, for a long list in one scroll: it needs
   * `height` (as a number or a length), has no pages (`paging` is ignored) and is not for server mode
   * (`remote`); without `height`, or with `remote`, the grid scrolls as usual. `'standard'` when left
   * out.
   */
  scrolling?: 'standard' | 'virtual';
  /**
   * Whether the data is being loaded. With no row to show, a page of skeleton rows stands in the place
   * of the rows; with rows, they stay under a layer with a spinner. Either way the table is `aria-busy`
   * and the grid says `labels.loading` once.
   */
  loading?: boolean;
  /** A class for the row of a data row. */
  rowClassName?: (row: TRow) => string | undefined;
  /**
   * The default of `allowSorting` of every column; a column's own wins. `true` when left out. A column
   * that sorts has a button for a title.
   */
  allowSorting?: boolean;
  /**
   * The default of `allowResizing` of every column; a column's own wins. `true` when left out. A
   * column that can be resized has a handle on the right edge of its title, and `Alt+Shift+←` and
   * `Alt+Shift+→` change its width by 10px.
   */
  allowResizing?: boolean;
  /**
   * The default of `allowReordering` of every column; a column's own wins. `true` when left out. A
   * column that can be moved is dragged by its title (mouse and pen), within its zone, and
   * `mod+Shift+←` and `mod+Shift+→` move it one place.
   */
  allowReordering?: boolean;
  /**
   * The default of `allowPinning` of every column; a column's own wins. `true` when left out. A column
   * that can be pinned has "Pin to the left" and "Pin to the right" in its menu (and "Unpin" when it is).
   */
  allowPinning?: boolean;
  /**
   * The default of `allowHiding` of every column; a column's own wins. `true` when left out. A column
   * that can be hidden has "Hide column" in its menu, unless it is the last one shown.
   */
  allowHiding?: boolean;
  /** `'multiple'` (default): Shift or ⌘ or Ctrl with a press adds a level. `'single'`: one column. */
  sortMode?: DataGridSortMode;
  /** The sort, in order: each item is a column id and a direction. Pass it with `onSortChange`. */
  sort?: readonly DataGridSortItem[];
  defaultSort?: readonly DataGridSortItem[];
  onSortChange?: (sort: readonly DataGridSortItem[]) => void;
  /**
   * The pages: how many rows one holds at first, and the sizes the pager offers. `{ pageSize:
   * 20, pageSizes: [10, 20, 50, 100] }` when left out; `false` is one page of every row.
   * `pageSize` is the size a page the grid holds starts at: after that it is the one the user
   * chooses, and a controlled `page` says its own. An empty `pageSizes` offers no choice of size.
   */
  paging?: false | { pageSize?: number; pageSizes?: readonly number[] };
  /** The page, counted from 0. Pass it with `onPageChange`. */
  page?: DataGridPage;
  defaultPage?: DataGridPage;
  onPageChange?: (page: DataGridPage) => void;
  /**
   * Called after `onSortChange`, `onPageChange`, `onSelectedKeysChange` or `onColumnLayoutChange`,
   * with the whole state and the name of the part that changed: one function to save the state
   * with. The state is the one `getState()` gives (the page as drawn), with the part the press asks
   * for in its place. Called from what the user does, never from a render, so a controlled value that changes from outside
   * does not call it; the one exception is the page that server mode asks for when `totalCount`
   * leaves the page it holds past the last.
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
  /**
   * The layout of the columns: order, widths, hidden and pinned. Pass it with `onColumnLayoutChange`.
   * A column that is not in `order` is new: it goes to the end of its zone with its own `width`,
   * `visible` and `pinned`.
   */
  columnLayout?: DataGridColumnLayout;
  /** Where an uncontrolled layout starts; each part given replaces that part of the columns' own. */
  defaultColumnLayout?: Partial<DataGridColumnLayout>;
  onColumnLayoutChange?: (layout: DataGridColumnLayout) => void;
  /**
   * Adds a button to the toolbar that opens a list with a box for each column, to show and hide them
   * (`false` when left out). A column that says `allowHiding: false` has a locked box, and the only
   * column shown has a box that cannot be cleared. A box changes the layout at once.
   */
  columnChooser?: boolean;
  labels?: Partial<DataGridLabels>;
};

/** What a ref to a `DataGrid` holds: the grid's commands, not an element. */
export interface DataGridHandle {
  /** The element the grid is drawn in, `null` before it is mounted. */
  readonly element: HTMLDivElement | null;
  /**
   * The state the grid shows, as its last commit left it, so from its first commit on: the sort,
   * the page as drawn (a page out of range is the nearest), the chosen keys and the layout of the
   * columns as shown.
   */
  getState(): DataGridState;
  /** Moves the keyboard focus to the active cell, and scrolls it into view. */
  focus(): void;
  /**
   * Scrolls the row with this key into view, the least it takes: to its page first when the grid
   * has pages. It does not move the keyboard. `false` when no row has the key. A virtual grid moves
   * only its frame; a grid with pages, or one that scrolls as usual, uses the browser's scroll into
   * view, which scrolls the page too when the row is out of its sight.
   */
  scrollToRow(key: DataGridKey): boolean;
}
