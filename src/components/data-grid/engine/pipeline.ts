import type { DataGridFilter, DataGridKey, DataGridPage, DataGridSortItem } from '../types';
import { isDataColumn } from './columns';
import type { ResolvedColumn } from './columns';
import {
  conditionOf,
  filterRows,
  foldedSearch,
  headerConditionFilters,
  rowConditionFilters,
  searchRows,
} from './filter';
import type { TextReader } from './filter';
import { flattenRows } from './flatten';
import type { FlatRow } from './flatten';
import { clampPageIndex, pageCount, pageRows } from './page';
import { sortRows } from './sort';

export interface PipelineInput<TRow> {
  data: readonly TRow[];
  /** The columns that are shown: the sort reads the ones its items name, the search the ones it reads. */
  columns: readonly ResolvedColumn<TRow>[];
  /** The filter: the search, and the conditions of the columns. */
  filter: DataGridFilter;
  /** Every resolved column, the hidden ones too: a condition of a hidden column still filters. */
  filterColumns: readonly ResolvedColumn<TRow>[];
  /** The texts of the cells, written and folded once for the search and the filter. */
  read: TextReader<TRow>;
  /** The key of a row, from the row and its index in the sorted list. */
  getKey: (row: TRow, index: number) => DataGridKey;
  sort: readonly DataGridSortItem[];
  /** `null` is not paged: every row is one page. */
  page: DataGridPage | null;
  /**
   * Server mode: `data` is already searched, filtered and sorted and is the page; only the count is
   * the grid's to work out.
   */
  remote: boolean;
  totalCount: number | undefined;
  locale: string;
}

export interface PipelineResult<TRow> {
  /** The rows the search keeps, before the conditions of the columns: the header filter's list narrows from them. */
  searched: readonly TRow[];
  /** All the rows after searching, filtering and sorting, before paging. */
  rows: readonly TRow[];
  /** `rows` as the flat list the grid draws from; the whole list, not a page. */
  flat: readonly FlatRow<TRow>[];
  /** The count of rows the pager counts: `flat.length`, or `totalCount` in server mode. */
  total: number;
  pageCount: number;
  /** The index of the page shown, which may differ from the one asked for. */
  pageIndex: number;
  /** The page: the flat rows to draw. */
  visible: readonly FlatRow<TRow>[];
}

// A value as text that tells it from another, for a signature. A value JSON cannot write is written
// by `String`, so a signature never throws.
function written(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, part: unknown) =>
      typeof part === 'bigint' ? String(part) : part,
    );
  } catch {
    return String(value);
  }
}

// The conditions of the filter that filter, written as one text, and the columns they name. A
// condition that filters nothing, of a column the grid does not have, or put aside by `enabled:
// false` is not in it, so a change to one of those runs no step again.
function filterSignature<TRow>(
  filter: DataGridFilter,
  columns: readonly ResolvedColumn<TRow>[],
): { signature: string; named: ResolvedColumn<TRow>[] } {
  const named: ResolvedColumn<TRow>[] = [];
  const parts: string[] = [];
  if (filter.enabled === false) return { signature: '', named };
  for (const column of columns) {
    if (!isDataColumn(column)) continue;
    const condition = conditionOf(filter, column.id);
    if (!condition) continue;
    const onRow = rowConditionFilters(column, condition);
    const onHeader = headerConditionFilters(condition);
    if (!onRow && !onHeader) continue;
    named.push(column);
    parts.push(
      written([
        column.id,
        onRow ? [condition.operator ?? column.operators[0], condition.value] : null,
        onHeader ? [condition.values, condition.exclude === true] : null,
      ]),
    );
  }
  return { signature: parts.join('\u0002'), named };
}

// Remembers the last result of one step by the identity of what it was computed from.
function memo<T>() {
  let last: { deps: readonly unknown[]; value: T } | undefined;
  return (deps: readonly unknown[], compute: () => T): T => {
    if (
      last &&
      last.deps.length === deps.length &&
      deps.every((d, i) => Object.is(d, last!.deps[i]))
    ) {
      return last.value;
    }
    const value = compute();
    last = { deps, value };
    return value;
  };
}

/**
 * The steps of spec 3.5 that Plans B and D have: search, filter, sort, flatten, page. Each step
 * remembers its result by the identity of its inputs, so a new page runs only the page step and the
 * same inputs give back the same objects. The sort is compared by value (`field` and `direction` of
 * each item), since an app writes it as a new array on every render, and of the columns only those
 * its items name count, so a column hidden or shown sorts again only when the sort is by it.
 *
 * The search keeps the rows with the query in a shown column that allows searching; it is remembered
 * by the folded query and by those columns taken as a set, so a reorder, a width, or the hide of a
 * column the search does not read runs it no more. The filter keeps the rows that pass every condition
 * that filters, of every resolved column, the hidden ones too; it is remembered by the rows the search
 * kept and by a signature of those conditions, so a condition that filters nothing, a new object with
 * the same conditions, and any hide or reorder run it no more. A step that leaves every row gives back
 * its input, so the steps after it see the same array. The sort works on the filtered rows.
 *
 * New rows or a new `getKey` read the keys again, and keep each data row that is the same as before,
 * and the flat list when they all are (`flattenRows`): an app writes a `rowKey` function as a new one
 * on every render, and edits one row by making a new `data` array. In server mode the search, the
 * filter, the sort and the page are skipped. The virtual window is not a step: only the scroll knows
 * it, and it reads `flat`.
 */
export function createPipeline<TRow>() {
  const searched = memo<readonly TRow[]>();
  const filtered = memo<readonly TRow[]>();
  const sorted = memo<readonly TRow[]>();
  let flattened:
    | {
        rows: readonly TRow[];
        getKey: PipelineInput<TRow>['getKey'];
        value: readonly FlatRow<TRow>[];
      }
    | undefined;
  const paged = memo<readonly FlatRow<TRow>[]>();
  const whole = memo<PipelineResult<TRow>>();

  return {
    run({
      data,
      columns,
      filter,
      filterColumns,
      read,
      getKey,
      sort,
      page,
      remote,
      totalCount,
      locale,
    }: PipelineInput<TRow>): PipelineResult<TRow> {
      // Step 3, the search. The columns it reads are the shown ones that allow it, in the order of
      // their ids so that a reorder is the same set.
      const query = remote ? '' : foldedSearch(filter.search);
      let afterSearch = data;
      if (query !== '') {
        const searchable = columns
          .filter((column) => isDataColumn(column) && column.allowSearch)
          .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        afterSearch = searched([data, read, query, ...searchable], () =>
          searchRows(data, searchable, query, read),
        );
      }

      // Step 4, the conditions of the columns.
      let afterFilter = afterSearch;
      if (!remote) {
        const { signature, named } = filterSignature(filter, filterColumns);
        if (signature !== '') {
          afterFilter = filtered([afterSearch, read, signature, ...named], () =>
            filterRows(afterSearch, filterColumns, filter, read),
          );
        }
      }

      const sortSignature = sort
        .map((item) => `${item.field}\u0001${item.direction}`)
        .join('\u0002');
      // The sort reads only the columns its items name, among the shown ones: hiding or showing
      // another column gives another `columns` and sorts nothing again.
      const sortNamed = sort.flatMap((item) => {
        const column = columns.find((candidate) => candidate.id === item.field);
        return column ? [column] : [];
      });
      const rows = sorted([remote, afterFilter, locale, sortSignature, ...sortNamed], () =>
        remote ? data : sortRows(afterFilter, sort, columns, locale),
      );
      if (flattened?.rows !== rows || flattened.getKey !== getKey) {
        // The list made last is offered back: each of its rows that is the same is kept.
        flattened = { rows, getKey, value: flattenRows(rows, getKey, flattened?.value) };
      }
      const flat = flattened.value;

      const total = remote ? (totalCount ?? data.length) : flat.length;
      const pageIndex = page ? clampPageIndex(page.index, total, page.size) : 0;
      const pages = page ? pageCount(total, page.size) : 1;
      // Server mode shows what it was given.
      const size = page && !remote ? page.size : undefined;
      const visible = paged([flat, pageIndex, size], () =>
        size === undefined ? flat : pageRows(flat, { index: pageIndex, size }),
      );

      return whole([afterSearch, rows, flat, visible, total, pages, pageIndex], () => ({
        searched: afterSearch,
        rows,
        flat,
        total,
        pageCount: pages,
        pageIndex,
        visible,
      }));
    },
  };
}
