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
 * One level of the grouping: the rows are grouped by the values of the column `field` (its id), and the
 * groups of the level come in `direction`. The first item is the outermost level.
 */
export interface DataGridGroupItem {
  field: string;
  direction: DataGridSortDirection;
}

/**
 * Which groups are open. The keys are group keys: the JSON text of the `[field, value]` steps from the
 * outermost level down to the group, the value being the one the filter holds for the column (a day as
 * `YYYY-MM-DD` for a date and a datetime, a lookup's raw value, `null` for the blank group). Every group
 * is open when `allExpanded` is `true` except the ones in `except`, and closed when it is `false` except
 * the ones in `except`. A key no group has is ignored and stays.
 */
export interface DataGridExpandedGroups {
  allExpanded: boolean;
  except: readonly string[];
}

/**
 * A total the grid computes over rows and shows under the column `column`: on a group row or in the
 * footer. `type` is `count` (the rows), `sum` or `avg` (the finite numbers of `field`), `min` or `max` (the
 * least or greatest number, date or datetime of `field`), or a function of the rows whose result is shown.
 */
export interface DataGridSummaryItem<TRow> {
  /** What the item is known by; `${type}:${field}` for a named type and `custom:${field}` for a function. */
  id?: string;
  /** The id of the column the total is shown under. */
  column: string;
  /** The id of the column the values are read from; `column` when left out. */
  field?: string;
  type: 'count' | 'sum' | 'avg' | 'min' | 'max' | ((rows: readonly TRow[]) => unknown);
  /** The words before the value; the grid's own word for the type when left out. */
  label?: string;
  /**
   * How the value is written: Intl number options, or a function of the value. A `count` is always a
   * whole number, and `min` and `max` write the text of the row that holds the value, when this is left out.
   */
  format?: Intl.NumberFormatOptions | ((value: unknown) => string);
}

/** The `summary` prop: the totals of the footer (`total`) and of the group rows (`group`). */
export interface DataGridSummaryProp<TRow> {
  /** The totals of the footer, which sticks at the bottom of a grid with a `height`: every row after the filter. */
  total?: readonly DataGridSummaryItem<TRow>[];
  /** The totals of the group rows: the rows of the group. Not drawn in server mode. */
  group?: readonly DataGridSummaryItem<TRow>[];
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
  /**
   * The grouping as the grid holds it, outermost level first. An item of a field the grid has not, of a
   * column that does not allow grouping or that repeats a field is ignored and stays in it.
   */
  grouping: readonly DataGridGroupItem[];
  /** Which groups are open, as the grid holds it: a key no group has is ignored and stays in it. */
  expandedGroups: DataGridExpandedGroups;
  /**
   * The keys of the rows whose detail is open, in the order they were opened: a key that no row has, or
   * of a row with no detail, is ignored and stays in it.
   */
  expandedRows: readonly DataGridKey[];
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
   * Whether rows can be grouped by this column; the grid's `allowGrouping` when left out. It is about the
   * ways the user and the state group by it: a grouping item of a column that does not allow it groups
   * nothing.
   */
  allowGrouping?: boolean;
  /**
   * Whether the column stays in the heading and the body while the rows are grouped by it; `false` when
   * left out, since each group row already says its value.
   */
  showWhenGrouped?: boolean;
  /**
   * The operators the filter row offers, narrowed from the column's type, in the type's order and
   * with the type's first as the default. None of them being of the type: all of the type's.
   */
  filterOperators?: readonly DataGridFilterOperator[];
  /**
   * The values the header filter lists, with their text. A column that has them lists these, in their
   * order, in a client grid too: no row is read, and neither the search nor the other columns narrow
   * them. Without them a client grid lists the values of its rows, and a server grid (`remote`), which
   * holds one page only, those of the page and warns.
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
  /** The words of the operators, in the button of a filter cell and in its menu. */
  operators: Record<DataGridFilterOperator, string>;
  /**
   * The words of the operators in the sentence of the filter panel (`filterPanel`), after the caption of the
   * column: "Qty > 5", "Customer contains ‘ltd’". `between` has none: a range with both ends is `range` and
   * one with an open end is `>=` or `<=` with the end, as the cell of `between` says it too.
   */
  panelOperators: Record<Exclude<DataGridFilterOperator, 'between'>, string>;
  /** A text a condition looks for, as the filter panel quotes it: "‘ltd’". */
  quoted(text: string): string;
  /** The words of the choice that takes a condition of a Select cell away: its placeholder and its first item. */
  all: string;
  /** The placeholder of the cell of a range (`between`), which opens the editor of its two ends. */
  between: string;
  /** The name of the first end of a range, in the editor of `between`. */
  from: string;
  /** The name of the second end of a range. */
  to: string;
  /**
   * A range with both ends as the cell of `between` and the filter panel show it, each end written as the
   * column writes it. A range with one open end is not this: it is `panelOperators['>=']` or `['<=']` and the end.
   */
  range(from: string, to: string): string;
  /**
   * The name of the funnel on a title, and of the popover it opens: `active` is whether the column has a
   * condition from that popover (the funnel is filled). The popover's own name is the one for `false`.
   */
  filterColumn(caption: string, active: boolean): string;
  /** The hint of the search field of the header filter, which narrows the list of values. */
  searchValues: string;
  /** The name of that search field, for the technology that reads names. */
  searchValuesName: string;
  /** The first line of the header filter's list: it checks every value the search shows. */
  selectAllValues: string;
  /** The value of the cells that are blank, in the header filter's list. */
  blank: string;
  /** The line under a list of more values than are drawn: `shown` are drawn of `total` that match. */
  moreValues(shown: number, total: number): string;
  /** Between two conditions in the sentence of the filter panel. */
  and: string;
  /** A header condition that lists values to keep, in the filter panel: "Status is any of (New, Done)". */
  isAnyOf: string;
  /** A header condition that lists values to leave out: "Status is none of (Cancelled)". */
  isNoneOf: string;
  /** The name of the switch of the filter panel that turns the conditions on and off. */
  applyFilter: string;
  /** The button of the filter popover that applies what it holds. */
  ok: string;
  /** The button of the filter popover that closes it and changes nothing. */
  cancel: string;
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
  /** The count of rows a group row says after its value, "(4)". */
  groupCount(count: number): string;
  /** What a group row says when it repeats the group at the top of a page that starts inside it. */
  continued: string;
  /** The hidden name of the title cell that spans the indent columns of the groups and the column of the details. */
  groupsAndDetails: string;
  /** What a group row says before its value: the column's caption and a colon, "Status:". */
  groupColumn(caption: string): string;
  /** The name of the group panel, the tray in the toolbar that holds the chips of the grouping. */
  groupPanel: string;
  /** The word before the chips of the panel, "Group by". */
  groupBy: string;
  /** What the empty panel says: how to group by a column. */
  groupPanelHint: string;
  /**
   * The name of the button of a chip that turns the direction of its level; `next` is the direction it
   * would turn to, "Sort Status groups descending".
   */
  groupDirection(caption: string, next: DataGridSortDirection): string;
  /** The name of the button of a chip that takes its level out of the grouping. */
  ungroup(caption: string): string;
  /** The item of the column menu that groups by the column. */
  groupByColumn: string;
  /** What is said after a column was grouped by, from its menu or by a drag into the panel. */
  announceGrouped(caption: string): string;
  /** What is said after a level was taken out of the grouping, from its chip or by a drag out of the panel. */
  announceUngrouped(caption: string): string;
  /** What is said after a level was moved, by keys or by a drag: its place among the levels, from 1. */
  announceGroupMoved(caption: string, level: number, count: number): string;
  /**
   * The words before the value of a total whose item has no `label`, by type: `count`, `sum`, `avg`, `min`
   * and `max`. A `sum` of the footer is written without one. Merged one level deep, as `operators`.
   */
  summary: Record<'count' | 'sum' | 'avg' | 'min' | 'max', string>;
  /** The label of a total as it stands before the value, "Total:"; `label` is the item's or the type's word. */
  summaryLabel(label: string): string;
  /**
   * The hidden words before a total that has no visible label, so that it reads alone: `type` is the word
   * of the type (`summary.sum`) and `caption` the column's, "Total of Amount".
   */
  summaryOf(type: string, caption: string): string;
  /** The name of the button that opens the detail of a row; `name` is the row's header text, else its key. */
  showDetails(name: string): string;
  /** The name of the button that closes the detail of a row that is open. */
  hideDetails(name: string): string;
}

/**
 * The `labels` a caller passes: any of the labels, and of `operators` and `panelOperators` any of their
 * words. The records are merged one level deep, so `{ operators: { contains: 'Chứa' } }` keeps the other
 * operators' defaults.
 */
export type DataGridLabelsInput = Partial<
  Omit<DataGridLabels, 'operators' | 'panelOperators' | 'summary'>
> & {
  operators?: Partial<DataGridLabels['operators']>;
  summary?: Partial<DataGridLabels['summary']>;
  panelOperators?: Partial<DataGridLabels['panelOperators']>;
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
  /** The tray with the chips of the grouping; `null` without `groupPanel` (and in server mode). */
  groupPanel: ReactNode;
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
   * The row above the grid: the caption, then the items of the grid (`groupPanel`, `spacer`, `search`,
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
   * Called after `onSortChange`, `onFilterChange`, `onPageChange`, `onSelectedKeysChange`,
   * `onColumnLayoutChange`, `onGroupingChange` or `onExpandedGroupsChange`,
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
   * Adds the group panel to the toolbar, before the search field (`false` when left out; any value that
   * is not `true` is `false`): a tray that holds a chip for each level of the grouping, in order. A chip
   * has a button that turns the direction of its level and one that takes it out; `mod+Shift+←` and
   * `mod+Shift+→` on either button move the level, and so does a drag of the chip, with a mouse, a pen or
   * a finger. A column header dragged into the tray (mouse and pen) groups by that column at the place
   * of the drop; a chip dragged out of the tray onto the headings ungroups. It also puts "Group by this
   * column" in the column menu. The panel needs the toolbar to draw it (`toolbar` is not `false` and a
   * `toolbar` function places `items.groupPanel`). A server grid (`remote`) groups nothing: it draws no
   * panel and warns.
   */
  groupPanel?: boolean;
  /**
   * The totals the grid computes: `total` in the footer (a row under the body that sticks at the bottom of
   * a grid with a `height`, and is a row of the keyboard), over every row after the search and the filter,
   * of every page, and `group` on the group rows, over the rows of each group. An item names the column it
   * is shown under; one that names no column (or a column that is not shown) draws nothing, and the first of
   * two items with one `id` is the one that stays. Pass a stable value (a module constant or `useMemo`):
   * it is kept while it says the same, and functions count by identity. In server mode only `total` is
   * drawn, from `totalSummary`.
   */
  summary?: DataGridSummaryProp<TRow>;
  /**
   * Server mode: the values of the footer's totals as the server computed them, by the `id` of each item
   * (the `id` it has, else `${type}:${field}`). An id with no value is blank. Read with `remote` only.
   */
  totalSummary?: Readonly<Record<string, unknown>>;
  /**
   * Draws the detail of a row: with it the grid has a column of buttons that open and close a row under
   * the row, and `renderDetail(row)` is what that row holds. The detail row spans the columns after the
   * button, and its content stays in sight when the frame is scrolled sideways. A grid with details
   * scrolls as usual: `scrolling="virtual"` is not used with it, since a detail has no fixed height. Pass a
   * stable function (a module function or `useCallback`): it is read by every row. A control the detail
   * draws is a stop of its own cell, as a control of a custom cell is.
   */
  renderDetail?: (row: TRow) => ReactNode;
  /**
   * Whether a row has a detail; without it every row has one when `renderDetail` is given. A row that has
   * none draws an empty cell where the button is, and its key in `expandedRows` does nothing.
   */
  rowHasDetail?: (row: TRow) => boolean;
  /** The keys of the rows whose detail is open. Pass it with `onExpandedRowsChange`. */
  expandedRows?: readonly DataGridKey[];
  /** Where the open details start when `expandedRows` is not given; none when left out. It counts for rows that come later too. */
  defaultExpandedRows?: readonly DataGridKey[];
  /**
   * Called when the user opens or closes a detail, with the keys of the rows that are open now: once for
   * each change, never for a render or for an `expandedRows` that changes from outside.
   */
  onExpandedRowsChange?: (keys: readonly DataGridKey[]) => void;
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
   * that is not `true` is `false`): an input with the operator's button for a string, an input for a
   * number (read by the grid's `locale`), a DatePicker for a `date` and a `datetime`, a Select for a
   * boolean and for a lookup, and for `between` a read-only range field that opens a popover with the two
   * ends. What is typed becomes the column's condition in `filter.columns` 400 ms after the last key, at
   * once for Enter and when the input is left; a choice of a Select, a day or an operator is at once. A
   * column whose `allowFiltering` is `false` has an empty cell.
   */
  filterRow?: boolean;
  /**
   * The default of `allowFiltering` of every column; a column's own wins. `true` when left out. It is
   * about the cell of the filter row: a condition in the filter state filters either way.
   */
  allowFiltering?: boolean;
  /**
   * Adds a funnel to the title of each column that has one (`false` when left out; any value that is not
   * `true` is `false`). It opens a popover with the column's distinct values, each with a box, and a
   * search field that narrows the list; OK stores what is checked as the column's header condition in
   * `filter.columns` (`values`, and `exclude` when more than half is checked): all checked is no condition,
   * none is a condition that keeps no row. The list is narrowed by the search and by the conditions of the
   * other columns. The funnel is filled while the column has a header condition. With `remote` the list is
   * the column's `headerFilter.values`, which a column lists in a client grid too.
   */
  headerFilter?: boolean;
  /**
   * The default of `allowHeaderFiltering` of every column; a column's own wins. `true` when left out. It
   * is about the funnel: a header condition in the filter state filters either way.
   */
  allowHeaderFiltering?: boolean;
  /**
   * Adds a bar under the grid that says the conditions of the columns in words and holds the button that
   * clears the filter and the switch that turns the conditions off (`false` when left out; any value that
   * is not `true` is `false`). It is drawn while some column has a condition that filters, even when the
   * switch has turned them off, and not for a search alone. "Clear filter" clears the search and every
   * condition; "Apply filter" is `filter.enabled`: off, the grid shows every row the search keeps, and the
   * filter cells and funnels go on showing their conditions.
   */
  filterPanel?: boolean;
  /**
   * The grouping: the rows are grouped by the values of the columns it names, outermost first, in the
   * direction of each item. Pass it with `onGroupingChange`. Each group is a row of its own with a
   * button to open and close it, and the table becomes a `treegrid`. An item whose field is no column of
   * the grid, whose column does not allow grouping, whose direction is no direction, or whose field
   * came before is ignored without a word and stays in the state, so a grouping from a saved state,
   * or ahead of its columns, does no harm. A grouped column leaves the heading and the rows (unless
   * its `showWhenGrouped` says otherwise) but its conditions still filter. With `remote` the grid does
   * not group: the grouping is held, and the app groups on the server.
   */
  grouping?: readonly DataGridGroupItem[];
  /** Where an uncontrolled grouping starts; none when left out. It counts for a column that comes later too. */
  defaultGrouping?: readonly DataGridGroupItem[];
  /**
   * Called when the user changes the grouping, with the new one: once for each change, never for a render
   * or for a `grouping` that changes from outside, and never for a grouping that says what is held.
   * A change takes the grid to its first page, which calls `onPageChange` once more when the page was
   * not the first.
   */
  onGroupingChange?: (grouping: readonly DataGridGroupItem[]) => void;
  /** Which groups are open. Pass it with `onExpandedGroupsChange`. See `DataGridExpandedGroups`. */
  expandedGroups?: DataGridExpandedGroups;
  /** Where uncontrolled groups start; it wins over `autoExpandAll`. */
  defaultExpandedGroups?: DataGridExpandedGroups;
  /**
   * Called when the user opens or closes a group, or every group at once, with the groups that are open
   * now: once for each change, never for a render or for an `expandedGroups` that changes from outside.
   */
  onExpandedGroupsChange?: (expanded: DataGridExpandedGroups) => void;
  /**
   * Whether every group starts open (`true` when left out; any value that is not `false` is `true`).
   * It is read once, as a default: it sets where an uncontrolled `expandedGroups` starts when
   * `defaultExpandedGroups` is not given.
   */
  autoExpandAll?: boolean;
  /**
   * The default of `allowGrouping` of every column; a column's own wins. `true` when left out. It is
   * about the grouping the user asks for: a grouping in the state groups by a column that allows it.
   */
  allowGrouping?: boolean;
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
  /** Opens every group: `onExpandedGroupsChange` and `onStateChange` are called. Nothing happens when they are open. */
  expandAllGroups(): void;
  /** Closes every group the same way. Nothing happens when they are closed. */
  collapseAllGroups(): void;
}
