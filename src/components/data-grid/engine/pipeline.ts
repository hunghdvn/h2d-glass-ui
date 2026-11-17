import type { DataGridKey, DataGridPage, DataGridSortItem } from '../types';
import type { ResolvedColumn } from './columns';
import { flattenRows } from './flatten';
import type { FlatRow } from './flatten';
import { clampPageIndex, pageCount, pageRows } from './page';
import { sortRows } from './sort';

export interface PipelineInput<TRow> {
  data: readonly TRow[];
  columns: readonly ResolvedColumn<TRow>[];
  /** The key of a row, from the row and its index in the sorted list. */
  getKey: (row: TRow, index: number) => DataGridKey;
  sort: readonly DataGridSortItem[];
  /** `null` is not paged: every row is one page. */
  page: DataGridPage | null;
  /** Server mode: `data` is already sorted and is the page; only the count is the grid's to work out. */
  remote: boolean;
  totalCount: number | undefined;
  locale: string;
}

export interface PipelineResult<TRow> {
  /** All the rows after sorting, before paging. */
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
 * The steps of spec 3.5 that Plan B has: sort, flatten, page. Each step remembers its result by the
 * identity of its inputs, so a new page runs only the page step and the same inputs give back the
 * same objects. The sort is compared by value (`field` and `direction` of each item), since an
 * app writes it as a new array on every render. A new `getKey` with the same rows reads the keys
 * again and keeps the flat list when they are the same (`flattenRows`), since an app writes a
 * `rowKey` function as a new one on every render too. In server mode the sort and the page are
 * skipped. The virtual window is not a step: only the scroll knows it, and it reads `flat`.
 */
export function createPipeline<TRow>() {
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
      getKey,
      sort,
      page,
      remote,
      totalCount,
      locale,
    }: PipelineInput<TRow>): PipelineResult<TRow> {
      const signature = sort.map((item) => `${item.field}\u0001${item.direction}`).join('\u0002');
      const rows = sorted([remote, data, columns, locale, signature], () =>
        remote ? data : sortRows(data, sort, columns, locale),
      );
      if (flattened?.rows !== rows || flattened.getKey !== getKey) {
        // The list made from the same rows is offered back, and kept when the keys are the same.
        const previous = flattened?.rows === rows ? flattened.value : undefined;
        flattened = { rows, getKey, value: flattenRows(rows, getKey, previous) };
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

      return whole([rows, flat, visible, total, pages, pageIndex], () => ({
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
