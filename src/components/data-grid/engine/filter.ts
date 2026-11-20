import { isIsoDate } from '../../../internal/date';
import { collator, numberFormat } from '../../../internal/intl';
import { isNumber, parseNumber } from '../../../internal/number';
import { containsFolded, foldText } from '../../../internal/text-fold';
import type { DataGridColumnFilter, DataGridFilter, DataGridFilterOperator } from '../types';
import { isDataColumn } from './columns';
import type { ResolvedColumn } from './columns';
import { operatorsFor } from './operators';
import { compareKeys } from './sort';
import type { Comparable } from './values';
import { isBlank } from './values';

export { operatorsFor };

/** The filter of a grid that filters nothing. It is frozen and shared: write a new one to change it. */
export const EMPTY_FILTER: DataGridFilter = Object.freeze({});

/** How many values the header filter lists before it says there are more (spec phase 6 §6.3). */
export const DISTINCT_LIMIT = 500;

/**
 * The texts of the cells, as the cache of `createTextCache` keeps them: what the search, the filter
 * row and the lists read, so a cell is written and folded once for every step that wants it.
 */
export interface TextReader<TRow> {
  text(row: TRow, column: { id: string; text(row: TRow): string }): string;
  folded(row: TRow, column: { id: string; text(row: TRow): string }): string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * A number typed in a filter cell, read the way the grid's locale writes it ("1,000.5" in `en-US`,
 * "1.000,5" in `vi-VN`); `null` for text that is no number and for no text. The one read of a typed
 * number: the cell, the `between` editor and the engine agree on it.
 */
export function parseFilterNumber(text: string, locale: string): number | null {
  const number = parseNumber(text, locale);
  return Number.isNaN(number) ? null : number;
}

/**
 * A number as a filter cell shows it for the user to edit: the way the grid's locale types it, with no
 * grouping and every digit, so `parseFilterNumber` reads it back to the same number.
 */
export function formatFilterNumber(value: number, locale: string): string {
  return numberFormat(locale, { useGrouping: false, maximumFractionDigits: 20 }).format(value);
}

/**
 * The condition the filter holds for a column id. `columns` is a record keyed by ids, so it is read as
 * an own property: a column whose id is `constructor` or `toString` has no condition by inheritance.
 */
export function conditionOf(filter: DataGridFilter, id: string): DataGridColumnFilter | undefined {
  const columns: unknown = filter.columns;
  if (!isRecord(columns) || !Object.hasOwn(columns, id)) return undefined;
  const condition = columns[id];
  return isRecord(condition) ? condition : undefined;
}

// The condition of a column that has a filter at all: the column of boxes has none.
function conditionOfColumn<TRow>(
  filter: DataGridFilter,
  column: ResolvedColumn<TRow>,
): DataGridColumnFilter | undefined {
  return isDataColumn(column) ? conditionOf(filter, column.id) : undefined;
}

// Whether `value` is `[from, to]` with at least one end that `reads` accepts.
function hasEnd(value: unknown, reads: (end: unknown) => boolean): boolean {
  return Array.isArray(value) && (reads(value[0]) || reads(value[1]));
}

// The operator a row condition uses: its own, or the first one the column offers.
function operatorOf<TRow>(
  column: ResolvedColumn<TRow>,
  condition: DataGridColumnFilter,
): DataGridFilterOperator | undefined {
  return condition.operator ?? column.operators[0];
}

// Whether the value is one the column reads with this operator: a string for a string column, a
// finite number for a number, an ISO day for a date and a datetime, a boolean, and for a lookup any
// value that is not blank. `between` needs `[from, to]` with at least one end of that kind.
function isUsable<TRow>(
  column: ResolvedColumn<TRow>,
  operator: DataGridFilterOperator,
  value: unknown,
): boolean {
  if (column.choices) return !isBlank(value);
  const between = operator === 'between';
  switch (column.dataType) {
    case 'string':
      return typeof value === 'string' && value !== '';
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return between ? hasEnd(value, isNumber) : isNumber(value);
    case 'date':
    case 'datetime':
      return between ? hasEnd(value, isIsoDate) : isIsoDate(value);
  }
}

/**
 * The operator a filter cell shows for a column: the one the condition holds when the column offers it, else
 * the column's first (a held operator the column does not offer filters nothing, so the cell does not show it).
 * `undefined` for a column with no operator.
 */
export function shownOperator<TRow>(
  column: ResolvedColumn<TRow>,
  condition: DataGridColumnFilter | undefined,
): DataGridFilterOperator | undefined {
  const held = condition?.operator;
  return held !== undefined && column.operators.includes(held) ? held : column.operators[0];
}

/**
 * Whether a row condition filters: the column offers its operator (the first one when it names none)
 * and its value is one the column reads. A condition that does not is held in the state and ignored.
 * Whether it filters does not depend on `allowFiltering`: that is about the cell.
 */
export function rowConditionFilters<TRow>(
  column: ResolvedColumn<TRow>,
  condition: DataGridColumnFilter | undefined,
): boolean {
  if (!condition) return false;
  const operator = operatorOf(column, condition);
  return (
    operator !== undefined &&
    column.operators.includes(operator) &&
    isUsable(column, operator, condition.value)
  );
}

/**
 * Whether a header condition filters: it holds a list of values. An empty list keeps no row, as a
 * user who cleared every box asked; `exclude` with no value keeps every row, so it filters nothing.
 */
export function headerConditionFilters(condition: DataGridColumnFilter | undefined): boolean {
  if (!condition || !Array.isArray(condition.values)) return false;
  return !(condition.exclude === true && condition.values.length === 0);
}

/** Whether the column has a condition that filters, of either part. */
export function columnFilters<TRow>(filter: DataGridFilter, column: ResolvedColumn<TRow>): boolean {
  const condition = conditionOfColumn(filter, column);
  return rowConditionFilters(column, condition) || headerConditionFilters(condition);
}

/**
 * The search as it is looked for: trimmed and folded, and `''` when there is none or nothing is left
 * of it. The one reading of a search: the search step, the marks in the cells and "is the grid
 * filtering" all ask it, so what is looked for, what is marked and what is said cannot differ.
 */
export function foldedSearch(search: string | undefined): string {
  return typeof search === 'string' ? foldText(search.trim()) : '';
}

/**
 * Whether the grid is filtering: there is a search, or the conditions are enabled and some column has
 * a condition that filters. Every part that asks "is it filtered" (the empty state, the announcement,
 * the funnel's fill) asks this and `columnFilters`.
 */
export function isFiltering<TRow>(
  filter: DataGridFilter,
  columns: readonly ResolvedColumn<TRow>[],
): boolean {
  if (foldedSearch(filter.search) !== '') return true;
  return filter.enabled !== false && columns.some((column) => columnFilters(filter, column));
}

type RowTest<TRow> = (row: TRow) => boolean;

// A comparison of the key of a row with the value, by each ordered operator.
function ordered<T extends number | string>(
  operator: DataGridFilterOperator,
  value: T,
): ((key: T) => boolean) | undefined {
  switch (operator) {
    case '=':
      return (key) => key === value;
    case '<>':
      return (key) => key !== value;
    case '<':
      return (key) => key < value;
    case '>':
      return (key) => key > value;
    case '<=':
      return (key) => key <= value;
    case '>=':
      return (key) => key >= value;
    default:
      return undefined;
  }
}

// `[from, to]` as the ends that `read` accepts; an end that is not one is `undefined`, which is open.
function endsOf<T extends number | string>(
  value: unknown,
  read: (end: unknown) => end is T,
): [T | undefined, T | undefined] {
  const [from, to]: unknown[] = Array.isArray(value) ? value : [];
  return [read(from) ? from : undefined, read(to) ? to : undefined];
}

// `[from, to]` as the test of a key between its ends, both included.
function range<T extends number | string>(
  value: unknown,
  read: (end: unknown) => end is T,
): (key: T) => boolean {
  const [low, high] = endsOf(value, read);
  return (key) => (low === undefined || key >= low) && (high === undefined || key <= high);
}

/**
 * The two ends of the value of a `between` condition as the column reads them: a number for a number column,
 * an ISO day for a date or a datetime; an end that is no such value, or is missing, is `undefined` and open.
 * The filter reads its ends with this, and so do the cell and the editor that show them.
 */
export function rangeEnds<TRow>(
  column: ResolvedColumn<TRow>,
  value: unknown,
): [number | string | undefined, number | string | undefined] {
  return column.dataType === 'number' ? endsOf(value, isNumber) : endsOf(value, isIsoDate);
}

// The test of a row condition, made once for a whole list: the query folded, the number and the days
// read. A blank cell passes `<>` and `notContains` alone (spec phase 6 §6.3).
function rowTest<TRow>(
  column: ResolvedColumn<TRow>,
  condition: DataGridColumnFilter | undefined,
  read: TextReader<TRow>,
): RowTest<TRow> | undefined {
  if (!condition || !rowConditionFilters(column, condition)) return undefined;
  const operator = operatorOf(column, condition)!;
  const value = condition.value;

  if (column.choices || column.dataType === 'boolean') {
    return (row) => column.filterKey(row) === value;
  }

  if (column.dataType === 'string') {
    const query = foldText(value as string);
    switch (operator) {
      case 'contains':
        return (row) => read.folded(row, column).includes(query);
      case 'notContains':
        return (row) => !read.folded(row, column).includes(query);
      case 'startsWith':
        return (row) => read.folded(row, column).startsWith(query);
      case 'endsWith':
        return (row) => read.folded(row, column).endsWith(query);
      case '=':
        return (row) => read.folded(row, column) === query;
      default:
        return (row) => read.folded(row, column) !== query;
    }
  }

  if (column.dataType === 'number') {
    const test =
      operator === 'between' ? range(value, isNumber) : ordered(operator, value as number)!;
    return (row) => {
      const key = column.filterKey(row);
      return typeof key === 'number' ? test(key) : operator === '<>';
    };
  }

  // A date and a datetime: ISO days, which compare as text.
  const test =
    operator === 'between' ? range(value, isIsoDate) : ordered(operator, value as string)!;
  return (row) => {
    const key = column.filterKey(row);
    return typeof key === 'string' ? test(key) : operator === '<>';
  };
}

// The test of a header condition: the key of the row is in the values (or is not, with `exclude`).
function headerTest<TRow>(
  column: ResolvedColumn<TRow>,
  condition: DataGridColumnFilter | undefined,
): RowTest<TRow> | undefined {
  if (!condition || !headerConditionFilters(condition)) return undefined;
  // `null` is the blank; a blank that came through a form of JSON that drops it is `undefined`.
  const values = new Set<unknown>(
    (condition.values as unknown[]).map((v) => (v === undefined ? null : v)),
  );
  return condition.exclude === true
    ? (row) => !values.has(column.filterKey(row))
    : (row) => values.has(column.filterKey(row));
}

/**
 * Whether the row passes the row condition of its column: strings on the column's text, folded
 * (`contains`, `notContains`, `startsWith`, `endsWith`, `=`, `<>`); numbers on the number; dates and
 * datetimes on their calendar day; `between` includes both ends, and an end that is blank is open;
 * a lookup and a boolean `=` on the value. A blank cell passes `<>` and `notContains` and nothing else.
 * A condition that does not filter (`rowConditionFilters`) passes every row.
 */
export function matchesRow<TRow>(
  column: ResolvedColumn<TRow>,
  row: TRow,
  condition: DataGridColumnFilter,
  read: TextReader<TRow>,
): boolean {
  return rowTest(column, condition, read)?.(row) ?? true;
}

/**
 * Whether the row passes the header condition of its column: its filter key is in `values`, or with
 * `exclude` is not. A condition that does not filter (`headerConditionFilters`) passes every row.
 */
export function matchesHeader<TRow>(
  column: ResolvedColumn<TRow>,
  row: TRow,
  condition: DataGridColumnFilter,
): boolean {
  return headerTest(column, condition)?.(row) ?? true;
}

/**
 * The rows with the query in the text of at least one of `columns`, case and diacritics aside
 * (`foldText`). The caller gives the columns that are shown and allow searching. The query is trimmed,
 * and with nothing to look for the very array comes back.
 */
export function searchRows<TRow>(
  rows: readonly TRow[],
  columns: readonly ResolvedColumn<TRow>[],
  query: string,
  read: TextReader<TRow>,
): readonly TRow[] {
  const folded = foldedSearch(query);
  if (folded === '') return rows;
  return rows.filter((row) =>
    columns.some((column) => containsFolded(read.folded(row, column), folded)),
  );
}

/**
 * The rows that pass every condition of every column given (all the resolved ones, the hidden too),
 * the row part and the header part of a column joined by "and". Nothing is filtered with `enabled:
 * false`; `except` leaves the conditions of one column out, which is how the header filter lists the
 * values of a column narrowed by the others. When no condition filters, or no row is left out, the very
 * array comes back. The search is not a condition: `searchRows` does it.
 */
export function filterRows<TRow>(
  rows: readonly TRow[],
  columns: readonly ResolvedColumn<TRow>[],
  filter: DataGridFilter,
  read: TextReader<TRow>,
  except?: string,
): readonly TRow[] {
  if (filter.enabled === false) return rows;
  const tests: RowTest<TRow>[] = [];
  for (const column of columns) {
    if (column.id === except) continue;
    const condition = conditionOfColumn(filter, column);
    if (!condition) continue;
    const onRow = rowTest(column, condition, read);
    if (onRow) tests.push(onRow);
    const onHeader = headerTest(column, condition);
    if (onHeader) tests.push(onHeader);
  }
  if (tests.length === 0) return rows;
  const kept = rows.filter((row) => tests.every((test) => test(row)));
  return kept.length === rows.length ? rows : kept;
}

/** One value of the header filter's list and what is written for it; `null` is the blank. */
export interface DistinctItem {
  value: unknown;
  text: string;
}

export interface DistinctOptions {
  /** Keeps the items whose text has this text in it, case and diacritics aside. */
  search?: string;
  /** Values to list that the rows may not hold: the ones the column's condition names. */
  named?: readonly unknown[];
  /** The most items to give; 500 when left out. */
  limit?: number;
  /** The locale the order of the text is by, as the grid's sort has it; `'en-US'` when left out. */
  locale?: string;
}

// What a value that no row holds is sorted by, as the column sorts its rows: a lookup by its text, a
// day by its time, a number as a number. A column with a `sortValue` may order the rows another way;
// a value with no row cannot follow it.
function sortKeyOf<TRow>(column: ResolvedColumn<TRow>, key: unknown, text: string): Comparable {
  if (column.choices) return text === '' ? null : text;
  if (typeof key === 'number') return key;
  if (typeof key === 'boolean') return Number(key);
  if (isIsoDate(key)) return Date.parse(`${key}T00:00:00Z`);
  return typeof key === 'string' ? key : null;
}

/**
 * The values the header filter lists for a column: the column's filter keys on `rows`, each once, with
 * the text of its first row, in the order the column sorts (its `sortKey` of that row, so a `sortValue`
 * orders them, and a lookup is ordered by its text), and the blank last as `null` with no text of its
 * own. A datetime is listed by its day. `named` adds the values a condition names that no row holds.
 * `search` keeps the items that have it in their text; `total` counts those, and `items` are the
 * first `limit` of them. A column with its own list (`headerFilter.values`, for a server grid) lists
 * that, in its order, and reads no row.
 */
export function distinctValues<TRow>(
  rows: readonly TRow[],
  column: ResolvedColumn<TRow>,
  options: DistinctOptions,
  read: TextReader<TRow>,
): { items: DistinctItem[]; total: number } {
  const { search, named = [], limit = DISTINCT_LIMIT, locale = 'en-US' } = options;
  // `null` is the blank; a blank that came through a form of JSON that drops it is `undefined`.
  const namedKeys = named.map((value) => (value === undefined ? null : value));

  let items: DistinctItem[];
  if (column.headerValues) {
    items = column.headerValues.map(({ value, text }) => ({ value, text }));
    const listed = new Set(items.map((item) => item.value));
    for (const value of namedKeys) {
      if (listed.has(value)) continue;
      listed.add(value);
      items.push({ value, text: column.keyText(value) });
    }
  } else {
    const found = new Map<unknown, { text: string; sortKey: Comparable }>();
    let blank = false;
    for (const row of rows) {
      const key = column.filterKey(row);
      if (key === null) {
        blank = true;
      } else if (!found.has(key)) {
        // A datetime is listed by its day, so its text is the day's and not the first row's time.
        let text = column.dataType === 'datetime' ? '' : read.text(row, column);
        if (text === '') text = column.keyText(key);
        found.set(key, { text, sortKey: column.sortKey(row) });
      }
    }
    for (const value of namedKeys) {
      if (value === null) blank = true;
      else if (!found.has(value)) {
        const text = column.keyText(value);
        found.set(value, { text, sortKey: sortKeyOf(column, value, text) });
      }
    }
    const compareText = collator(locale, { numeric: true }).compare;
    const order = [...found].map(([value, { text, sortKey }], index) => ({
      item: { value, text },
      sortKey,
      index,
    }));
    order.sort((a, b) => {
      // A value with no key to sort by comes after those that have one.
      if (a.sortKey === null || b.sortKey === null) {
        return a.sortKey === b.sortKey ? a.index - b.index : a.sortKey === null ? 1 : -1;
      }
      return compareKeys(a.sortKey, b.sortKey, compareText) || a.index - b.index;
    });
    items = order.map(({ item }) => item);
    // The blank is always the last, whatever the others sort by.
    if (blank) items.push({ value: null, text: '' });
  }

  const query = search === undefined ? '' : foldText(search);
  if (query !== '') items = items.filter((item) => containsFolded(foldText(item.text), query));
  return { items: items.slice(0, limit), total: items.length };
}

/**
 * The condition that the OK of the header filter stores, from the keys of every item of the list and
 * the keys that are checked. All checked is no condition (`undefined`); more than half is `exclude`
 * with the ones that are not checked, which is shorter to keep; else the ones that are checked.
 * None checked is `values: []`, a condition that keeps no row, as the user asked. A checked key the
 * list does not hold is left out; the values come in the order of the list.
 */
export function headerSelection(
  all: readonly unknown[],
  checked: readonly unknown[],
): { values: unknown[]; exclude: boolean } | undefined {
  const on = new Set(checked);
  const checkedKeys = all.filter((key) => on.has(key));
  if (checkedKeys.length === all.length) return undefined;
  if (checkedKeys.length * 2 > all.length) {
    return { values: all.filter((key) => !on.has(key)), exclude: true };
  }
  return { values: checkedKeys, exclude: false };
}

// Two values of a condition: primitives and dates by value, a list item by item (a `between` range).
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  }
  return false;
}

// Two lists of values as sets, both ways: `['a', 'a']` is not `['a', 'b']`. No list is not an empty one.
function sameSet(a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return a.every((item) => b.includes(item)) && b.every((item) => a.includes(item));
}

function sameCondition(a: DataGridColumnFilter, b: DataGridColumnFilter): boolean {
  return (
    a.operator === b.operator &&
    sameValue(a.value, b.value) &&
    sameSet(a.values, b.values) &&
    (a.exclude ?? false) === (b.exclude ?? false)
  );
}

/**
 * Whether two filters are the same: the search and `enabled` (their defaults being `''` and `true`),
 * and for each column its operator, value, values as sets and `exclude`. The columns are compared by
 * their own keys, both ways, so a column that one holds and the other lacks is a difference.
 */
export function sameFilter(a: DataGridFilter, b: DataGridFilter): boolean {
  if (a === b) return true;
  if ((a.search ?? '') !== (b.search ?? '')) return false;
  if ((a.enabled ?? true) !== (b.enabled ?? true)) return false;
  const left = a.columns ?? {};
  const right = b.columns ?? {};
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every((key) => Object.hasOwn(right, key) && sameCondition(left[key]!, right[key]!));
}

// A value a row condition can hold: not blank, and for a range at least one end that is not.
function hasValue(value: unknown): boolean {
  return Array.isArray(value) ? value.some((end) => !isBlank(end)) : !isBlank(value);
}

// The filter with the condition of one column replaced; no part left in it removes the column, and
// no column left removes `columns`. The very filter comes back when nothing changed.
function withCondition(
  filter: DataGridFilter,
  id: string,
  condition: DataGridColumnFilter,
): DataGridFilter {
  const columns = filter.columns ?? {};
  let next: DataGridFilter;
  if (Object.keys(condition).length > 0) {
    next = { ...filter, columns: { ...columns, [id]: condition } };
  } else {
    const rest = Object.fromEntries(Object.entries(columns).filter(([key]) => key !== id));
    next = { ...filter };
    if (Object.keys(rest).length > 0) next.columns = rest;
    else delete next.columns;
  }
  return sameFilter(filter, next) ? filter : next;
}

/**
 * The filter with the row condition of one column written: the operator the caller names, and the
 * value when it is not blank (a range needs one end). A blank value is not stored, but an operator
 * the user chose stays, so the cell still shows it; no operator and no value takes the row part away.
 * The header part of the column stays, and a column left with no part is removed.
 */
export function withRowCondition(
  filter: DataGridFilter,
  id: string,
  operator: DataGridFilterOperator | undefined,
  value: unknown,
): DataGridFilter {
  const { values, exclude } = conditionOf(filter, id) ?? {};
  const next: DataGridColumnFilter = {};
  if (operator !== undefined) next.operator = operator;
  if (hasValue(value)) next.value = value;
  if (values !== undefined) next.values = values;
  if (exclude !== undefined) next.exclude = exclude;
  return withCondition(filter, id, next);
}

/**
 * The filter with the header condition of one column written: `values`, and `exclude` when it is true.
 * No values, or `exclude` with none, takes the header part away. The row part of the column stays,
 * and a column left with no part is removed. The values are copied.
 */
export function withHeaderCondition(
  filter: DataGridFilter,
  id: string,
  values: readonly unknown[] | undefined,
  exclude: boolean,
): DataGridFilter {
  const { operator, value } = conditionOf(filter, id) ?? {};
  const next: DataGridColumnFilter = {};
  if (operator !== undefined) next.operator = operator;
  if (value !== undefined) next.value = value;
  if (values !== undefined && !(exclude && values.length === 0)) {
    next.values = [...values];
    if (exclude) next.exclude = true;
  }
  return withCondition(filter, id, next);
}
