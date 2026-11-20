import type {
  DataGridColumn,
  DataGridColumnLayout,
  DataGridKey,
  DataGridPage,
  DataGridProps,
  DataGridSortItem,
} from './types';

/** The size of a page when `paging` says none. */
export const DEFAULT_PAGE_SIZE = 20;

/** A whole number above 0: the size of a page. */
export const isWhole = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isArray = (value: unknown): value is readonly unknown[] => Array.isArray(value);

const isSortItem = (value: unknown): value is DataGridSortItem => isObject(value);

const isKey = (value: unknown): value is DataGridKey =>
  typeof value === 'string' || typeof value === 'number';

/**
 * What the grid says, once each and in development, when a prop has a shape its type forbids. The
 * words name the prop and never hold its value, so `devWarn` folds the repeats.
 */
const MALFORMED = {
  data: '<DataGrid> data is not an array; no row is shown.',
  columns: '<DataGrid> columns is not an array; no column is shown.',
  paging: '<DataGrid> paging is neither false nor an object; the default paging is used.',
  pageSize: '<DataGrid> paging.pageSize is not a number; the default size is used.',
  pageSizes: '<DataGrid> paging.pageSizes is not an array; the default sizes are offered.',
  sort: '<DataGrid> sort is not an array of sort items; what is not one is left out.',
  defaultSort: '<DataGrid> defaultSort is not an array of sort items; what is not one is left out.',
  page: '<DataGrid> page is not an object of a number index and size; the first page, or the size of paging, is used.',
  defaultPage:
    '<DataGrid> defaultPage is not an object of a number index and size; the first page, or the size of paging, is used.',
  selectedKeys:
    '<DataGrid> selectedKeys is not an array of strings and numbers; what is not one is left out.',
  defaultSelectedKeys:
    '<DataGrid> defaultSelectedKeys is not an array of strings and numbers; what is not one is left out.',
  columnLayout:
    '<DataGrid> columnLayout is not an object of order, widths, hidden and pinned; what is not of its kind is left out.',
  defaultColumnLayout:
    '<DataGrid> defaultColumnLayout is not an object of order, widths, hidden and pinned; what is not of its kind is left out.',
} as const;

type Malformed = keyof typeof MALFORMED;

/** The props `normalizeProps` reads, as they came. */
export type GivenProps<TRow> = Pick<
  DataGridProps<TRow>,
  | 'data'
  | 'columns'
  | 'paging'
  | 'sort'
  | 'defaultSort'
  | 'page'
  | 'defaultPage'
  | 'selectedKeys'
  | 'defaultSelectedKeys'
  | 'columnLayout'
  | 'defaultColumnLayout'
>;

/** The same props in shapes the grid can use, and the warnings about the ones that were not. */
export interface SafeProps<TRow> extends GivenProps<TRow> {
  /** The size of a page that `paging` gives, or the default. */
  pageSize: number;
  /** The words of the dev warnings, one for each prop that was not of its shape. */
  warnings: readonly string[];
}

/**
 * Turns the props of the grid that hold its data or its state into shapes it can use, so that a
 * value its type forbids, from JavaScript or from a state a person saved (spec phase 6 §5), never
 * throws: a list that is not an array is empty, the items of a list that are not of its kind are
 * left out, and an object that is not one is the default. Each such prop gives one warning. What §5
 * says to ignore without a word is not looked at here, and is left to the steps that use it: an
 * unknown column or direction in a sort, a key that names no row, a page out of range or not whole.
 * A prop of its shape is given back as it came, the same object, so nothing that depends on it is
 * done again. The layout of the columns is read part by part: a part of the wrong kind is empty (or
 * left out of a default layout, which then keeps the columns' own), a width that is no number and a
 * hidden id that is no string are left out, and the prop warns once. What a layout holds that is of
 * its kind but fits no column (an unknown id, a pin that is no pin, a width out of range) is no
 * shape, and is cleaned without a word where the layout is applied. Later plans add `filter`.
 */
export function normalizeProps<TRow>(given: GivenProps<TRow>): SafeProps<TRow> {
  const problems = new Set<Malformed>();
  const none = (name: Malformed): [] => {
    problems.add(name);
    return [];
  };
  // A list given back as it came when every item is of its kind; `undefined` stays (uncontrolled).
  function list<T>(
    name: Malformed,
    value: unknown,
    isItem: (item: unknown) => item is T,
  ): readonly T[] | undefined {
    if (value === undefined) return undefined;
    if (!isArray(value)) return none(name);
    if (value.every(isItem)) return value as readonly T[];
    problems.add(name);
    return value.filter(isItem);
  }

  const data: readonly TRow[] = isArray(given.data) ? given.data : none('data');
  const columns: readonly DataGridColumn<TRow>[] = isArray(given.columns)
    ? given.columns
    : none('columns');

  let paging: unknown = given.paging;
  if (paging !== undefined && paging !== false && !isObject(paging)) {
    problems.add('paging');
    paging = undefined;
  }
  if (isObject(paging) && paging.pageSize !== undefined && typeof paging.pageSize !== 'number') {
    problems.add('pageSize');
    paging = { ...paging, pageSize: undefined };
  }
  if (isObject(paging) && paging.pageSizes !== undefined && !isArray(paging.pageSizes)) {
    problems.add('pageSizes');
    paging = { ...paging, pageSizes: undefined };
  }
  const pageSize =
    isObject(paging) && isWhole(paging.pageSize) ? paging.pageSize : DEFAULT_PAGE_SIZE;

  // A layout object: each part of its kind is kept as it came, the others are the empty part of a
  // controlled layout, or no part of a default one. The same object comes back when nothing was wrong.
  function layout(name: Malformed, value: unknown, whole: true): DataGridColumnLayout | undefined;
  function layout(
    name: Malformed,
    value: unknown,
    whole: false,
  ): Partial<DataGridColumnLayout> | undefined;
  function layout(
    name: Malformed,
    value: unknown,
    whole: boolean,
  ): Partial<DataGridColumnLayout> | undefined {
    if (value === undefined) return undefined;
    if (!isObject(value)) {
      problems.add(name);
      return whole ? { order: [], widths: {}, hidden: [], pinned: {} } : {};
    }
    const strings = (part: unknown): readonly string[] | undefined => {
      if (part === undefined) return whole ? [] : undefined;
      if (!isArray(part)) {
        problems.add(name);
        return whole ? [] : undefined;
      }
      if (part.every((item) => typeof item === 'string')) return part as readonly string[];
      problems.add(name);
      return part.filter((item): item is string => typeof item === 'string');
    };
    const record = <T>(part: unknown, isItem: (item: unknown) => boolean) => {
      if (part === undefined) return whole ? {} : undefined;
      if (!isObject(part)) {
        problems.add(name);
        return whole ? {} : undefined;
      }
      const entries = Object.entries(part);
      if (entries.every(([, item]) => isItem(item))) return part as Readonly<Record<string, T>>;
      problems.add(name);
      return Object.fromEntries(entries.filter(([, item]) => isItem(item))) as Readonly<
        Record<string, T>
      >;
    };
    const order = strings(value.order);
    const hidden = strings(value.hidden);
    const widths = record<number>(value.widths, (item) => typeof item === 'number');
    // A pin is checked where the layout is applied: a pin that is no pin is a state, not a shape.
    const pinned = record<DataGridColumnLayout['pinned'][string]>(value.pinned, () => true);
    const parts = { order, widths, hidden, pinned };
    const same =
      order === value.order &&
      hidden === value.hidden &&
      widths === value.widths &&
      pinned === value.pinned;
    if (same && (!whole || Object.values(parts).every((part) => part !== undefined))) {
      return value as unknown as Partial<DataGridColumnLayout>;
    }
    return Object.fromEntries(Object.entries(parts).filter(([, part]) => part !== undefined));
  }

  // The part of a page that is a number is kept: a NaN or a page out of range is clamped later.
  function page(name: Malformed, value: unknown): DataGridPage | undefined {
    if (value === undefined) return undefined;
    if (isObject(value) && typeof value.index === 'number' && typeof value.size === 'number') {
      return value as unknown as DataGridPage;
    }
    problems.add(name);
    const parts = isObject(value) ? value : {};
    return {
      index: typeof parts.index === 'number' ? parts.index : 0,
      size: typeof parts.size === 'number' ? parts.size : pageSize,
    };
  }

  const safe = {
    data,
    columns,
    paging: paging as DataGridProps<TRow>['paging'],
    pageSize,
    sort: list('sort', given.sort, isSortItem),
    defaultSort: list('defaultSort', given.defaultSort, isSortItem),
    page: page('page', given.page),
    defaultPage: page('defaultPage', given.defaultPage),
    selectedKeys: list('selectedKeys', given.selectedKeys, isKey),
    defaultSelectedKeys: list('defaultSelectedKeys', given.defaultSelectedKeys, isKey),
    columnLayout: layout('columnLayout', given.columnLayout, true),
    defaultColumnLayout: layout('defaultColumnLayout', given.defaultColumnLayout, false),
  };
  const order = Object.keys(MALFORMED) as Malformed[];
  return { ...safe, warnings: order.filter((name) => problems.has(name)).map((n) => MALFORMED[n]) };
}
