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

/**
 * What a filter condition does with a value. The row of filters offers the ones of the column's type:
 * a string column `contains` (the default), `notContains`, `startsWith`, `endsWith`, `=` and `<>`; a
 * number, a date or a datetime `=` (the default), `<>`, `<`, `>`, `<=`, `>=` and `between`; a
 * boolean or a column with a lookup only `=`.
 */
export type DataGridFilterOperator =
  | '='
  | '<>'
  | '<'
  | '>'
  | '<='
  | '>='
  | 'between'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith';

/**
 * What one column filters by. A column has two conditions that do not mirror each other, joined by
 * "and": the one of the filter row (`operator` and `value`) and the one of the header filter
 * (`values` and `exclude`). Every value is JSON: a string for a string column, a number for a number
 * column, an ISO day `YYYY-MM-DD` for a date and for a datetime (the calendar day in the grid's
 * `timeZone`), a boolean, and for a column with a lookup the value of the lookup item.
 */
export interface DataGridColumnFilter {
  /** The filter row's operator; the first of the column's operators when left out. */
  operator?: DataGridFilterOperator;
  /** The filter row's value; with `'between'` it is `[from, to]`, and an end that is blank is open. */
  value?: unknown;
  /**
   * The header filter's values, in the form the column filters by (a lookup's value, an ISO day, a
   * string, a number); `null` stands for the blank cells.
   */
  values?: readonly unknown[];
  /** The header filter keeps the rows that are NOT in `values`. */
  exclude?: boolean;
}

/**
 * What the grid filters by, and what an app can keep. `columns` is by column id; an id the grid does
 * not have (yet), an operator the column does not offer and a value the column cannot read are
 * ignored and stay where they are.
 */
export interface DataGridFilter {
  /** Rows that have this text in a shown column that allows searching; case and accents do not count. */
  search?: string;
  columns?: Readonly<Record<string, DataGridColumnFilter>>;
  /** `false` puts the conditions of the columns aside: the rows the search keeps are all shown. */
  enabled?: boolean;
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
 * What the grid keeps for an app to save: the sort, the filter, the page, the chosen rows and the
 * layout of the columns. It holds only what JSON can carry. Later plans add the rest of the state.
 */
export interface DataGridState {
  sort: readonly DataGridSortItem[];
  /**
   * The search and the conditions of the columns, as the grid holds them: a condition of a column the
   * grid does not have (yet) stays in it. `{}` filters nothing.
   */
  filter: DataGridFilter;
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
  /**
   * Marks what the grid's search found in a text the cell shows, as the grid marks the text of its own
   * cells: with a match the text comes back as one `<span>` that holds it with a `<mark>` around each
   * match (one item, so a flex or grid box of yours does not space its parts), and as it is when there is
   * no match, no search or the column has `allowSearch: false`. Pass the text you draw (`text` or a part of it).
   */
  highlight(text: string): ReactNode;
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
  /**
   * Whether the column's width can be changed (by its handle and by keys); the grid's `allowResizing`
   * when left out.
   */
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
  /**
   * Whether the column has a cell in the filter row; the grid's `allowFiltering` when left out. It is
   * about the cell only: a condition of the column in the filter state filters either way.
   */
  allowFiltering?: boolean;
  /**
   * Whether the column has a funnel that lists its values; the grid's `allowHeaderFiltering` when
   * left out. It is about the funnel only: a header condition in the filter state filters either way.
   */
  allowHeaderFiltering?: boolean;
  /**
   * Whether the grid's search looks in this column, when it is shown; `true` when left out. The search
   * reads the text the column shows.
   */
  allowSearch?: boolean;
  /**
   * The operators the filter row offers, narrowed from the column's type, in the type's order and
   * with the type's first as the default. None of them being of the type: all of the type's.
   */
  filterOperators?: readonly DataGridFilterOperator[];
  /**
   * The values the header filter lists, with their text. A client grid lists the values of its rows
   * and needs none; a server grid (`remote`) lists these, since it holds one page only.
   */
  headerFilter?: { values?: readonly { value: unknown; text: string }[] };
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
  /** The name of the search field in the toolbar (`searchPanel`). */
  search: string;
  /** The placeholder of the search field, unless `searchPanel` brings its own. */
  searchPlaceholder: string;
  /** What the grid says when it has no row to show. */
  noData: string;
  /** What the grid says when the filter leaves no row to show. */
  noMatches: string;
  /** The button of that empty grid, which clears the search and every condition. */
  clearFilter: string;
  /** The name of the cell of the filter row (its input or its Select) of a column. */
  filterCell(caption: string): string;
  /** The name of the button of a filter cell that opens the menu of operators; `name` is the operator's, in `operators`. */
  operator(name: string): string;
  /** The words of the operators, in the button, in its menu and in the filter bar. */
  operators: Record<DataGridFilterOperator, string>;
  /** The words of the choice that takes a condition of a Select cell away: its placeholder and its first item. */
  all: string;
  /**
   * What is said after the search or a condition changed, a moment after the last change: how many rows
   * the filter keeps (the rows of every page, and with `remote` the `totalCount`).
   */
  announceRowsFound(count: number): string;
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
 * The `labels` a caller passes: any of the labels, and of `operators` any of its words. The record is
 * merged one level deep, so `{ operators: { contains: 'Chứa' } }` keeps the other operators' defaults.
 */
export type DataGridLabelsInput = Partial<Omit<DataGridLabels, 'operators'>> & {
  operators?: Partial<DataGridLabels['operators']>;
};

/**
 * What a `toolbar` function is given: the items the toolbar draws by default, each a node to place, or
 * `null` when its feature is off; the spacer is always there. The toolbar gets an item for each part
 * of the grid that has a button: only the ones of this version are here.
 */
export interface DataGridToolbarItems {
  /** An element that takes the room between the items before it and the items after it. */
  spacer: ReactNode;
  /** The search field; `null` without `searchPanel`. */
  search: ReactNode;
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
   * The row above the grid: the caption, then the items of the grid (`spacer`, `search`,
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
   * The search and the conditions of the columns, by column id. Pass it with `onFilterChange`. The
   * grid shows a filter as it is given: an id of no column (yet), an operator the column does not
   * offer and a value it cannot read filter nothing and stay in the state, so a filter that came from
   * a saved state, or ahead of its columns, does no harm. A part of the wrong kind (a `search` that is
   * no string) is left out, and the prop warns once. With `remote` the grid filters nothing itself.
   */
  filter?: DataGridFilter;
  /** Where an uncontrolled filter starts; `{}` when left out. It counts for a column that comes later too. */
  defaultFilter?: DataGridFilter;
  /**
   * Called when the user changes the filter, with the new one: once for each change, never for a render
   * or for a `filter` that changes from outside. A change takes the grid to its first page, which calls
   * `onPageChange` once more when the page was not the first.
   */
  onFilterChange?: (filter: DataGridFilter) => void;
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
   * Called after `onSortChange`, `onFilterChange`, `onPageChange`, `onSelectedKeysChange` or
   * `onColumnLayoutChange`,
   * with the whole state and the name of the part that changed: one function to save the state
   * with. The state is the one `getState()` gives (the page as drawn), with the part the press asks
   * for in its place. Called from what the user does, never from a render, so a controlled value that
   * changes from outside does not call it; the one exception is the page that server mode asks for when `totalCount`
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
   * A column that is not in `order` is new: it goes to the end of its zone, by what `hidden`,
   * `pinned` and `widths` say of its id, and by its own `visible`, `pinned` and `width` for the rest.
   */
  columnLayout?: DataGridColumnLayout;
  /**
   * Where an uncontrolled layout starts; each part given replaces that part of the columns' own. It
   * counts for a column that comes after the first render too.
   */
  defaultColumnLayout?: Partial<DataGridColumnLayout>;
  onColumnLayoutChange?: (layout: DataGridColumnLayout) => void;
  /**
   * Adds a button to the toolbar that opens a list with a box for each column, to show and hide them
   * (`false` when left out). A column that says `allowHiding: false` has a locked box, and the only
   * column shown has a box that cannot be cleared. A box changes the layout at once.
   */
  columnChooser?: boolean;
  /**
   * Adds a search field to the toolbar, between the spacer and the column chooser (`false` when left
   * out; any value that is neither `true` nor an object is `false`). What is typed becomes `filter.search`
   * 300 ms after the last key, at once for Enter, for Esc, for the clear button and when the field is left.
   * The search reads the text of the shown columns, whose `allowSearch` is not `false`, without regard
   * to case or diacritics (`đ` is `d`), and the grid marks every match in its cells. `placeholder` is
   * the field's hint, `labels.searchPlaceholder` when left out. With `remote` the grid only reports the
   * search (`onFilterChange`) and marks the page it is given.
   */
  searchPanel?: boolean | { placeholder?: string };
  /**
   * Adds a row under the titles with a cell for each column that filters (`false` when left out; any value
   * that is not `true` is `false`): an input with the operator's button for a string, a Select for a
   * boolean and for a lookup. What is typed becomes the column's condition in `filter.columns` 400 ms after
   * the last key, at once for Enter and when the input is left; a choice of a Select or of an operator is
   * at once. A column whose `allowFiltering` is `false` has an empty cell.
   */
  filterRow?: boolean;
  /**
   * The default of `allowFiltering` of every column; a column's own wins. `true` when left out. It is
   * about the cell of the filter row: a condition in the filter state filters either way.
   */
  allowFiltering?: boolean;
  labels?: DataGridLabelsInput;
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
  /**
   * Clears the search and every condition, as the button of an empty grid does: `onFilterChange` and
   * `onStateChange` are called, the grid goes to its first page, and the rows found are said. `enabled`
   * goes back to its default too. Nothing happens when the grid has no filter.
   */
  clearFilter(): void;
}
