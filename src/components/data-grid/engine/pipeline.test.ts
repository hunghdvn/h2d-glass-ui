import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DataGridColumn,
  DataGridExpandedGroups,
  DataGridFilter,
  DataGridGroupItem,
  DataGridSortItem,
  DataGridSummaryItem,
} from '../types';
import { resolveColumns } from './columns';
import { EMPTY_FILTER, filterRows, searchRows } from './filter';
import { flattenRows, flattenTree } from './flatten';
import { groupRows } from './group';
import { countRows } from './page';
import { createPipeline } from './pipeline';
import type { PipelineInput } from './pipeline';
import { sortRows } from './sort';
import { computeSummary, resolveSummaryItems } from './summary';
import { createTextCache } from './values';

// The real `sortRows`, counted, to show which runs of the pipeline sort again.
vi.mock('./sort', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./sort')>();
  return { ...actual, sortRows: vi.fn(actual.sortRows) };
});

// Likewise the group step, the totals and the two steps of the flattening.
vi.mock('./group', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./group')>();
  return { ...actual, groupRows: vi.fn(actual.groupRows) };
});
vi.mock('./summary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./summary')>();
  return { ...actual, computeSummary: vi.fn(actual.computeSummary) };
});
vi.mock('./flatten', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./flatten')>();
  return {
    ...actual,
    flattenRows: vi.fn(actual.flattenRows),
    flattenTree: vi.fn(actual.flattenTree),
  };
});

// Likewise the search and the filter, counted, to show which runs of the pipeline run them again.
vi.mock('./filter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./filter')>();
  return {
    ...actual,
    searchRows: vi.fn(actual.searchRows),
    filterRows: vi.fn(actual.filterRows),
  };
});

interface Order {
  id: string;
  qty: number;
}

const COLUMNS: DataGridColumn<Order>[] = [{ field: 'id' }, { field: 'qty', dataType: 'number' }];
const OPTIONS = {
  locale: 'en-US',
  timeZone: 'UTC',
  yes: 'Yes',
  no: 'No',
  allowSorting: true,
  allowResizing: true,
  allowReordering: true,
  allowPinning: true,
  allowHiding: true,
  allowFiltering: true,
  allowHeaderFiltering: true,
  allowGrouping: true,
};
const resolved = resolveColumns(COLUMNS, OPTIONS);

const DATA: readonly Order[] = Array.from({ length: 30 }, (_, index) => ({
  id: `DH-${index + 1}`,
  qty: (index * 7) % 11,
}));

const getKey = (row: Order) => row.id;
const ALL_OPEN: DataGridExpandedGroups = { allExpanded: true, except: [] };
const read = createTextCache<Order>();

function input(patch: Partial<PipelineInput<Order>> = {}): PipelineInput<Order> {
  return {
    data: DATA,
    columns: resolved,
    getKey,
    sort: [],
    page: null,
    remote: false,
    totalCount: undefined,
    locale: 'en-US',
    filter: EMPTY_FILTER,
    filterColumns: resolved,
    read,
    grouping: [],
    groupColumns: resolved,
    summary: null,
    expanded: ALL_OPEN,
    expandedRows: [],
    hasDetail: undefined,
    ...patch,
  };
}

const qtyAsc: DataGridSortItem[] = [{ field: 'qty', direction: 'asc' }];
const sorts = vi.mocked(sortRows);
const searches = vi.mocked(searchRows);
const filters = vi.mocked(filterRows);
const groups = vi.mocked(groupRows);
const totals = vi.mocked(computeSummary);
const keyedRows = vi.mocked(flattenRows);
const flattenings = vi.mocked(flattenTree);

describe('createPipeline', () => {
  // Braces: a function returned from a hook is run as its cleanup, and mockClear returns the mock.
  beforeEach(() => {
    sorts.mockClear();
    searches.mockClear();
    filters.mockClear();
    groups.mockClear();
    totals.mockClear();
    keyedRows.mockClear();
    flattenings.mockClear();
  });

  describe('what it gives', () => {
    it('gives every row as one page, in the order of the data, when there is no sort and no paging', () => {
      const result = createPipeline<Order>().run(input());
      expect(result.rows).toBe(DATA);
      expect(result.flat).toHaveLength(30);
      expect(result.visible).toBe(result.flat);
      expect(result.total).toBe(30);
      expect(result.pageCount).toBe(1);
      expect(result.pageIndex).toBe(0);
      expect(result.flat[4]).toEqual({
        kind: 'data',
        key: 'DH-5',
        row: DATA[4],
        level: 1,
        groups: [],
        setsize: 0,
        posinset: 0,
      });
    });

    it('sorts, then cuts the page, and numbers the rows by their place in the whole list', () => {
      const result = createPipeline<Order>().run(
        input({ sort: qtyAsc, page: { index: 1, size: 12 } }),
      );
      expect(result.rows.map((row) => row.qty)).toEqual(
        [...DATA].map((row) => row.qty).sort((a, b) => a - b),
      );
      expect(result.flat).toHaveLength(30);
      expect(result.visible).toHaveLength(12);
      expect(result.visible[0]).toBe(result.keyed[12]);
      expect(result.total).toBe(30);
      expect(result.pageCount).toBe(3);
      expect(result.pageIndex).toBe(1);
    });

    it('shows a page past the end as the last page, and says which page that is', () => {
      const result = createPipeline<Order>().run(input({ page: { index: 99, size: 12 } }));
      expect(result.pageIndex).toBe(2);
      expect(result.visible).toHaveLength(6);
    });

    it('does not change the data, nor the sort items', () => {
      const data = [...DATA];
      const sort = [...qtyAsc];
      createPipeline<Order>().run(input({ data, sort }));
      expect(data).toEqual(DATA);
      expect(sort).toEqual(qtyAsc);
    });

    it('gives nothing for no data, with one page', () => {
      const result = createPipeline<Order>().run(input({ data: [], page: { index: 0, size: 10 } }));
      expect(result.flat).toEqual([]);
      expect(result.visible).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.pageCount).toBe(1);
    });
  });

  describe('server mode', () => {
    it('neither sorts nor pages: the data is the page', () => {
      const result = createPipeline<Order>().run(
        input({ remote: true, sort: qtyAsc, page: { index: 3, size: 12 }, totalCount: 135 }),
      );
      expect(sorts).not.toHaveBeenCalled();
      expect(result.rows).toBe(DATA);
      expect(result.visible).toBe(result.flat);
      expect(result.visible).toHaveLength(30);
    });

    it('counts totalCount, and the pages from it', () => {
      const result = createPipeline<Order>().run(
        input({ remote: true, page: { index: 3, size: 12 }, totalCount: 135 }),
      );
      expect(result.total).toBe(135);
      expect(result.pageCount).toBe(12);
      expect(result.pageIndex).toBe(3);
    });

    it('counts the data when totalCount is missing, and clamps the page to what it counts', () => {
      const result = createPipeline<Order>().run(
        input({ remote: true, page: { index: 9, size: 12 }, totalCount: undefined }),
      );
      expect(result.total).toBe(30);
      expect(result.pageCount).toBe(3);
      expect(result.pageIndex).toBe(2);
    });

    it('leaves the page index at 0 without paging', () => {
      const result = createPipeline<Order>().run(input({ remote: true, totalCount: 135 }));
      expect(result.pageCount).toBe(1);
      expect(result.pageIndex).toBe(0);
    });
  });

  describe('what it remembers', () => {
    it('gives the same objects for the same inputs', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ sort: qtyAsc, page: { index: 0, size: 12 } }));
      const second = pipeline.run(input({ sort: qtyAsc, page: { index: 0, size: 12 } }));
      expect(second).toBe(first);
      expect(sorts).toHaveBeenCalledTimes(1);
    });

    it('reads a sort by its value: a new array with the same items is the same sort', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ sort: [{ field: 'qty', direction: 'asc' }] }));
      const second = pipeline.run(input({ sort: [{ field: 'qty', direction: 'asc' }] }));
      expect(second.rows).toBe(first.rows);
      expect(second.flat).toBe(first.flat);
      expect(sorts).toHaveBeenCalledTimes(1);
    });

    it('does not sort again for a new page: only the page step runs', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ sort: qtyAsc, page: { index: 0, size: 12 } }));
      const second = pipeline.run(input({ sort: qtyAsc, page: { index: 1, size: 12 } }));
      expect(sorts).toHaveBeenCalledTimes(1);
      expect(second.rows).toBe(first.rows);
      expect(second.flat).toBe(first.flat);
      expect(second.visible).not.toBe(first.visible);
      expect(second.visible[0]).toBe(second.flat[12]);
      // A new page size is a new page too.
      const third = pipeline.run(input({ sort: qtyAsc, page: { index: 1, size: 6 } }));
      expect(sorts).toHaveBeenCalledTimes(1);
      expect(third.visible).toHaveLength(6);
    });

    it('sorts again for a new sort', () => {
      const pipeline = createPipeline<Order>();
      pipeline.run(input({ sort: qtyAsc }));
      const desc = pipeline.run(input({ sort: [{ field: 'qty', direction: 'desc' }] }));
      expect(sorts).toHaveBeenCalledTimes(2);
      expect(desc.rows[0]!.qty).toBe(10);
    });

    it('sorts again, and numbers the rows again, for new data', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ sort: qtyAsc }));
      const second = pipeline.run(input({ sort: qtyAsc, data: DATA.slice(0, 10) }));
      expect(sorts).toHaveBeenCalledTimes(2);
      expect(second.flat).not.toBe(first.flat);
      expect(second.total).toBe(10);
    });

    it('sorts again for a new column the sort names or a new locale, which change what a key is', () => {
      const pipeline = createPipeline<Order>();
      pipeline.run(input({ sort: qtyAsc }));
      pipeline.run(input({ sort: qtyAsc, locale: 'vi-VN' }));
      expect(sorts).toHaveBeenCalledTimes(2);
      // The columns resolved again (a new config, a new locale of the grid) are new objects.
      const again = resolveColumns(COLUMNS, { ...OPTIONS, locale: 'vi-VN' });
      pipeline.run(input({ sort: qtyAsc, locale: 'vi-VN', columns: again }));
      expect(sorts).toHaveBeenCalledTimes(3);
    });

    it('does not sort again when a column the sort does not name is hidden or shown', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ sort: qtyAsc }));
      // The id column hidden, then shown again: the shown columns are another list each time.
      const hidden = pipeline.run(input({ sort: qtyAsc, columns: [resolved[1]!] }));
      const shown = pipeline.run(input({ sort: qtyAsc, columns: [...resolved] }));
      expect(sorts).toHaveBeenCalledTimes(1);
      expect(hidden.rows).toBe(first.rows);
      expect(shown.rows).toBe(first.rows);
      // Hiding the column it sorts by does sort again: it sorts nothing now.
      const unsorted = pipeline.run(input({ sort: qtyAsc, columns: [resolved[0]!] }));
      expect(sorts).toHaveBeenCalledTimes(2);
      expect(unsorted.rows).toBe(DATA);
    });

    it('does not sort at all when no sort item is in effect, and keeps the data as the rows', () => {
      const pipeline = createPipeline<Order>();
      const result = pipeline.run(input({ sort: [{ field: 'gone', direction: 'asc' }] }));
      expect(result.rows).toBe(DATA);
    });

    it('numbers the rows again for a new getKey, since a key may depend on it', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input());
      const second = pipeline.run(input({ getKey: (row) => `#${row.id}` }));
      expect(second.flat).not.toBe(first.flat);
      expect(second.flat[0]!.key).toBe('#DH-1');
      expect(second.rows).toBe(first.rows);
    });

    it('keeps its rows for a new getKey that gives the same keys, after reading each once', () => {
      const pipeline = createPipeline<Order>();
      const page = { index: 0, size: 10 };
      const first = pipeline.run(input({ page }));
      const sameKeys = vi.fn((row: Order) => row.id);
      const second = pipeline.run(input({ getKey: sameKeys, page }));
      expect(sameKeys).toHaveBeenCalledTimes(DATA.length);
      expect(second.flat).toBe(first.flat);
      expect(second).toBe(first);
      // The new function is the one remembered: run with it again, it reads nothing.
      pipeline.run(input({ getKey: sameKeys, page }));
      expect(sameKeys).toHaveBeenCalledTimes(DATA.length);
    });

    it('keeps the rows of a new data array that an immutable edit of one row made', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input());
      const edited = DATA.map((row, index) => (index === 3 ? { ...row, qty: row.qty + 1 } : row));
      const second = pipeline.run(input({ data: edited }));
      expect(second.flat).not.toBe(first.flat);
      second.flat.forEach((flat, index) => {
        if (index === 3) expect(flat).not.toBe(first.flat[3]);
        else expect(flat).toBe(first.flat[index]);
      });
    });

    it('keeps each pipeline to itself', () => {
      const a = createPipeline<Order>();
      const b = createPipeline<Order>();
      a.run(input({ sort: qtyAsc }));
      b.run(input({ sort: qtyAsc }));
      expect(sorts).toHaveBeenCalledTimes(2);
    });
  });

  describe('search and filter', () => {
    // The id is searched, the quantity is not: hiding the quantity cannot change a search.
    const columns = resolveColumns<Order>(
      [{ field: 'id' }, { field: 'qty', dataType: 'number', allowSearch: false }],
      OPTIONS,
    );
    const idColumn = columns[0]!;
    const qtyColumn = columns[1]!;
    const dh2: DataGridFilter = { search: 'DH-2' };
    const qtyOver5: DataGridFilter = { columns: { qty: { operator: '>', value: 5 } } };
    const run = (patch: Partial<PipelineInput<Order>> = {}) =>
      input({ columns, filterColumns: columns, ...patch });

    it('searches before it filters, and gives the rows that are left, counted and paged', () => {
      const result = createPipeline<Order>().run(
        run({
          filter: { search: 'DH-1', columns: { qty: { operator: '>', value: 5 } } },
          page: { index: 0, size: 3 },
        }),
      );
      // DH-1 and DH-10 to DH-19 hold "dh-1"; of those the quantity over 5 stays.
      const searched = DATA.filter((row) => row.id.startsWith('DH-1'));
      expect(searched).toHaveLength(11);
      expect(result.searched).toEqual(searched);
      const kept = searched.filter((row) => row.qty > 5);
      expect(kept.length).toBeGreaterThan(3);
      expect(kept.length).toBeLessThan(11);
      expect(result.rows).toEqual(kept);
      expect(result.total).toBe(kept.length);
      expect(result.pageCount).toBe(Math.ceil(kept.length / 3));
      expect(result.visible).toHaveLength(3);
    });

    it('does not run either step with no search and no condition, and keeps the data as the rows', () => {
      const result = createPipeline<Order>().run(run());
      expect(searches).not.toHaveBeenCalled();
      expect(filters).not.toHaveBeenCalled();
      expect(result.searched).toBe(DATA);
      expect(result.rows).toBe(DATA);
    });

    it('does not run the filter for a search alone, nor the search for a condition alone', () => {
      createPipeline<Order>().run(run({ filter: dh2 }));
      expect(searches).toHaveBeenCalledTimes(1);
      expect(filters).not.toHaveBeenCalled();
      const only = createPipeline<Order>().run(run({ filter: qtyOver5 }));
      expect(searches).toHaveBeenCalledTimes(1);
      expect(filters).toHaveBeenCalledTimes(1);
      expect(only.searched).toBe(DATA);
    });

    it('does not run the filter for a condition that filters nothing or of a column it does not have', () => {
      const idle: DataGridFilter = {
        columns: {
          id: { operator: 'contains', value: '' },
          gone: { value: 'x' },
          qty: { operator: '>' },
        },
      };
      const result = createPipeline<Order>().run(run({ filter: idle }));
      expect(filters).not.toHaveBeenCalled();
      expect(result.rows).toBe(DATA);
    });

    it('puts the conditions aside with enabled false, and not the search', () => {
      const pipeline = createPipeline<Order>();
      const off = pipeline.run(run({ filter: { ...dh2, ...qtyOver5, enabled: false } }));
      expect(filters).not.toHaveBeenCalled();
      expect(off.rows).toHaveLength(11);
      const on = pipeline.run(run({ filter: { ...dh2, ...qtyOver5 } }));
      expect(filters).toHaveBeenCalledTimes(1);
      expect(on.rows.length).toBeLessThan(11);
    });

    it('skips both steps in server mode: the page is already filtered', () => {
      const result = createPipeline<Order>().run(
        run({ remote: true, totalCount: 90, filter: { search: 'zzz', ...qtyOver5 } }),
      );
      expect(searches).not.toHaveBeenCalled();
      expect(filters).not.toHaveBeenCalled();
      expect(result.searched).toBe(DATA);
      expect(result.rows).toBe(DATA);
      expect(result.total).toBe(90);
    });

    it('gives the same objects, and runs each step once, for the same filter written as a new object', () => {
      const pipeline = createPipeline<Order>();
      const make = (): DataGridFilter => ({
        search: 'DH-2',
        columns: { qty: { operator: '>', value: 5 } },
      });
      const first = pipeline.run(run({ filter: make(), sort: qtyAsc }));
      const second = pipeline.run(run({ filter: make(), sort: qtyAsc }));
      expect(second).toBe(first);
      expect(searches).toHaveBeenCalledTimes(1);
      expect(filters).toHaveBeenCalledTimes(1);
      expect(sorts).toHaveBeenCalledTimes(1);
    });

    it('does not run the filter again for a change that cannot change it', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(run({ filter: qtyOver5 }));
      // A condition that filters nothing, and one of a column the grid does not have.
      const noise: DataGridFilter = {
        columns: {
          qty: { operator: '>', value: 5 },
          id: { operator: 'contains', value: '' },
          gone: { values: [1] },
        },
      };
      const second = pipeline.run(run({ filter: noise }));
      expect(filters).toHaveBeenCalledTimes(1);
      expect(second.rows).toBe(first.rows);
    });

    it('runs only the filter for a new condition, and the search and then the filter for a new search', () => {
      const pipeline = createPipeline<Order>();
      pipeline.run(run({ filter: { ...dh2, ...qtyOver5 } }));
      const other: DataGridFilter = { columns: { qty: { operator: '<', value: 5 } } };
      pipeline.run(run({ filter: { ...dh2, ...other } }));
      expect(searches).toHaveBeenCalledTimes(1);
      expect(filters).toHaveBeenCalledTimes(2);
      pipeline.run(run({ filter: { search: 'DH-1', ...other } }));
      expect(searches).toHaveBeenCalledTimes(2);
      // The rows the search keeps changed, so the filter reads them again.
      expect(filters).toHaveBeenCalledTimes(3);
    });

    it('reads a search by its trimmed, folded text: spaces and case are the same search', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(run({ filter: { search: 'DH-2' } }));
      const second = pipeline.run(run({ filter: { search: '  dh-2 ' } }));
      expect(searches).toHaveBeenCalledTimes(1);
      expect(second.rows).toBe(first.rows);
    });

    it('does not sort again when the filter keeps every row, and sorts the rows that are left otherwise', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(run({ sort: qtyAsc }));
      const all = pipeline.run(
        run({ sort: qtyAsc, filter: { columns: { qty: { operator: '>=', value: 0 } } } }),
      );
      expect(filters).toHaveBeenCalledTimes(1);
      expect(sorts).toHaveBeenCalledTimes(1);
      expect(all.rows).toBe(first.rows);
      const some = pipeline.run(run({ sort: qtyAsc, filter: qtyOver5 }));
      expect(sorts).toHaveBeenCalledTimes(2);
      expect(some.rows.map((row) => row.qty)).toEqual(
        DATA.map((row) => row.qty)
          .filter((qty) => qty > 5)
          .sort((a, b) => a - b),
      );
    });

    it('runs neither step again for a hide, a show or a reorder of columns that cannot change them', () => {
      const pipeline = createPipeline<Order>();
      const idDesc: DataGridSortItem[] = [{ field: 'id', direction: 'desc' }];
      const filter: DataGridFilter = { search: 'DH-2', ...qtyOver5 };
      const first = pipeline.run(run({ filter, sort: idDesc }));
      // The quantity is not searched and not sorted, but it filters: its condition reads every resolved
      // column, so it still does when the grid hides it.
      const hidden = pipeline.run(run({ filter, sort: idDesc, columns: [idColumn] }));
      const shown = pipeline.run(run({ filter, sort: idDesc, columns: [idColumn, qtyColumn] }));
      const reordered = pipeline.run(run({ filter, sort: idDesc, columns: [qtyColumn, idColumn] }));
      expect(searches).toHaveBeenCalledTimes(1);
      expect(filters).toHaveBeenCalledTimes(1);
      expect(sorts).toHaveBeenCalledTimes(1);
      for (const result of [hidden, shown, reordered]) {
        expect(result.searched).toBe(first.searched);
        expect(result.rows).toBe(first.rows);
        expect(result.flat).toBe(first.flat);
      }
    });

    it('runs the search again when a searched column is hidden, since it changes what is searched', () => {
      const pipeline = createPipeline<Order>();
      const filter: DataGridFilter = { search: 'DH-2' };
      const first = pipeline.run(run({ filter }));
      expect(first.rows).toHaveLength(11);
      // Hidden, nothing is searched: no row has the text in a column that is shown.
      const hidden = pipeline.run(run({ filter, columns: [qtyColumn] }));
      expect(searches).toHaveBeenCalledTimes(2);
      expect(hidden.rows).toHaveLength(0);
      const shown = pipeline.run(run({ filter, columns: [idColumn, qtyColumn] }));
      expect(searches).toHaveBeenCalledTimes(3);
      expect(shown.rows).toHaveLength(11);
    });

    it('filters by a column the grid hides, and again when that column is made again', () => {
      const pipeline = createPipeline<Order>();
      const hidden = pipeline.run(run({ filter: qtyOver5, columns: [idColumn] }));
      expect(hidden.rows.length).toBeLessThan(DATA.length);
      expect(hidden.rows.every((row) => row.qty > 5)).toBe(true);
      // Resolved again (a new locale or format): new column objects, new texts and keys.
      const again = resolveColumns<Order>(
        [{ field: 'id' }, { field: 'qty', dataType: 'number' }],
        OPTIONS,
      );
      pipeline.run(run({ filter: qtyOver5, columns: [again[0]!], filterColumns: again }));
      expect(filters).toHaveBeenCalledTimes(2);
    });

    it('does not change the filter, the data or the columns it is given', () => {
      const filter: DataGridFilter = { search: 'DH-2', ...qtyOver5 };
      const copy = JSON.stringify(filter);
      const data = [...DATA];
      createPipeline<Order>().run(run({ filter, data }));
      expect(JSON.stringify(filter)).toBe(copy);
      expect(data).toEqual(DATA);
    });
  });
});

describe('createPipeline with groups, totals and details', () => {
  beforeEach(() => {
    sorts.mockClear();
    groups.mockClear();
    totals.mockClear();
    keyedRows.mockClear();
    flattenings.mockClear();
  });

  const byQty: DataGridGroupItem[] = [{ field: 'qty', direction: 'asc' }];
  // Thirty rows with the quantities 0 to 10: eleven groups.
  const QUANTITIES = [...new Set(DATA.map((row) => row.qty))].sort((a, b) => a - b);
  const summary = (
    total: DataGridSummaryItem<Order>[],
    group: DataGridSummaryItem<Order>[] = [],
  ) => ({
    total: resolveSummaryItems(total, resolved).items,
    group: resolveSummaryItems(group, resolved).items,
  });
  const sumQty: DataGridSummaryItem<Order>[] = [{ column: 'qty', type: 'sum' }];

  describe('what it gives', () => {
    it('groups the sorted rows: the tree, the data rows in the order shown, and the list with group rows', () => {
      const result = createPipeline<Order>().run(input({ grouping: byQty }));
      expect(QUANTITIES).toHaveLength(11);
      expect(result.tree!.map((node) => node.value)).toEqual(QUANTITIES);
      expect(result.keyed).toHaveLength(30);
      expect(result.keyed.map((row) => row.row.qty)).toEqual(
        QUANTITIES.flatMap((qty) => DATA.filter((row) => row.qty === qty).map(() => qty)),
      );
      expect(result.keyed[0]).toMatchObject({ level: 2, posinset: 1 });
      expect(result.flat).toHaveLength(11 + 30);
      expect(result.flat[0]).toMatchObject({ kind: 'group', level: 1, expanded: true });
      // The rows the group step takes are the sorted ones, which stay as they are.
      expect(result.rows).toBe(DATA);
    });

    it('counts group rows and data rows in the total, and pages them together', () => {
      const result = createPipeline<Order>().run(
        input({ grouping: byQty, page: { index: 1, size: 10 } }),
      );
      expect(result.total).toBe(41);
      expect(result.pageCount).toBe(5);
      expect(result.pageIndex).toBe(1);
      expect(countRows(result.visible)).toBe(10);
    });

    it('starts a page inside a group with the group repeated as continued', () => {
      const result = createPipeline<Order>().run(
        input({ grouping: byQty, page: { index: 1, size: 5 } }),
      );
      // The sixth row counted is the first data row of the second group.
      expect(result.visible[0]).toMatchObject({ kind: 'group', continued: true, level: 1 });
      expect(countRows(result.visible)).toBe(5);
    });

    it('draws a closed group as its row only, and opens one through allExpanded and except', () => {
      const closed = createPipeline<Order>().run(
        input({ grouping: byQty, expanded: { allExpanded: false, except: [] } }),
      );
      expect(closed.flat).toHaveLength(11);
      const key = closed.tree![2]!.key;
      const one = createPipeline<Order>().run(
        input({ grouping: byQty, expanded: { allExpanded: false, except: [key] } }),
      );
      expect(one.flat).toHaveLength(11 + closed.tree![2]!.rows.length);
      // Every row is still keyed: what a selection reads does not shrink with a closed group.
      expect(one.keyed).toHaveLength(30);
    });

    it('ignores the items that do not group, and groups by a column the layout hides', () => {
      const none = createPipeline<Order>().run(
        input({ grouping: [{ field: 'gone', direction: 'asc' }] }),
      );
      expect(none.tree).toBeNull();
      expect(none.flat).toBe(none.keyed);
      // groupColumns is every resolved column, not the shown ones.
      const hidden = createPipeline<Order>().run(
        input({ grouping: byQty, columns: [resolved[0]!] }),
      );
      expect(hidden.tree).toHaveLength(11);
    });

    it('puts a detail row after the open masters, and keeps it with its master on a page', () => {
      const result = createPipeline<Order>().run(
        input({
          expandedRows: ['DH-1', 'DH-2', 'nope'],
          hasDetail: (row) => row.id === 'DH-1',
          page: { index: 0, size: 2 },
        }),
      );
      expect(result.flat).toHaveLength(31);
      expect(result.flat[1]).toMatchObject({ kind: 'detail', key: 'DH-1', level: 1 });
      expect(result.total).toBe(30);
      expect(result.visible.map((row) => row.kind)).toEqual(['data', 'detail', 'data']);
    });

    it('has no totals without items, and no total on a group without group items', () => {
      const bare = createPipeline<Order>().run(input({ grouping: byQty }));
      expect(bare.totals).toBeNull();
      expect(bare.tree![0]!.totals).toBeNull();
      expect(totals).not.toHaveBeenCalled();
    });

    it('totals every row after the search and the filter, whatever the page', () => {
      const result = createPipeline<Order>().run(
        input({
          summary: summary(sumQty),
          filter: { columns: { qty: { operator: '>', value: 5 } } },
          page: { index: 1, size: 3 },
        }),
      );
      const kept = DATA.filter((row) => row.qty > 5);
      expect(result.totals!.get('sum:qty')!.value).toBe(kept.reduce((n, row) => n + row.qty, 0));
    });

    it('totals each group over its rows when it has group items', () => {
      const result = createPipeline<Order>().run(
        input({ grouping: byQty, summary: summary([], [{ column: 'id', type: 'count' }]) }),
      );
      const counts = result.tree!.map((node) => node.totals!.get('count:id')!.value);
      expect(counts).toEqual(QUANTITIES.map((qty) => DATA.filter((row) => row.qty === qty).length));
      expect(result.totals).toBeNull();
    });
  });

  describe('server mode', () => {
    it('does not group and does not total: the data is the page, and the totals are of the app', () => {
      const result = createPipeline<Order>().run(
        input({
          remote: true,
          totalCount: 90,
          grouping: byQty,
          summary: summary(sumQty, [{ column: 'id', type: 'count' }]),
        }),
      );
      expect(groups).not.toHaveBeenCalled();
      expect(totals).not.toHaveBeenCalled();
      expect(result.tree).toBeNull();
      expect(result.totals).toBeNull();
      expect(result.flat).toBe(result.keyed);
      expect(result.total).toBe(90);
    });

    it('still puts the detail rows of the page after their masters', () => {
      const result = createPipeline<Order>().run(
        input({ remote: true, totalCount: 90, expandedRows: ['DH-3'], hasDetail: () => true }),
      );
      expect(result.flat).toHaveLength(31);
      expect(result.flat[3]).toMatchObject({ kind: 'detail', key: 'DH-3' });
      expect(result.total).toBe(90);
    });
  });

  describe('what it remembers', () => {
    it('groups once for the same inputs, and for a grouping written as a new array', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ grouping: [{ field: 'qty', direction: 'asc' }] }));
      const second = pipeline.run(input({ grouping: [{ field: 'qty', direction: 'asc' }] }));
      expect(second).toBe(first);
      expect(groups).toHaveBeenCalledTimes(1);
    });

    it('does not group again for an item that does not group, nor for a hide of columns it does not name', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ grouping: byQty }));
      const idle: DataGridGroupItem[] = [...byQty, { field: 'gone', direction: 'desc' }];
      const second = pipeline.run(input({ grouping: idle }));
      const hidden = pipeline.run(input({ grouping: byQty, columns: [resolved[0]!] }));
      expect(groups).toHaveBeenCalledTimes(1);
      expect(second.tree).toBe(first.tree);
      expect(hidden).toBe(first);
    });

    it('groups again for another level, another direction or other columns the grouping names', () => {
      const pipeline = createPipeline<Order>();
      pipeline.run(input({ grouping: byQty }));
      pipeline.run(input({ grouping: [{ field: 'qty', direction: 'desc' }] }));
      expect(groups).toHaveBeenCalledTimes(2);
      const two: DataGridGroupItem[] = [...byQty, { field: 'id', direction: 'asc' }];
      pipeline.run(input({ grouping: two }));
      expect(groups).toHaveBeenCalledTimes(3);
      const again = resolveColumns(COLUMNS, { ...OPTIONS, locale: 'vi-VN' });
      pipeline.run(input({ grouping: two, groupColumns: again, locale: 'vi-VN' }));
      expect(groups).toHaveBeenCalledTimes(4);
    });

    it('runs steps 8 and 9 only for a toggle of a group, and keeps the tree, the keyed rows and the totals', () => {
      const pipeline = createPipeline<Order>();
      const held = { summary: summary(sumQty), grouping: byQty };
      const first = pipeline.run(input(held));
      const key = first.tree![0]!.key;
      const toggled = pipeline.run(
        input({ ...held, expanded: { allExpanded: true, except: [key] } }),
      );
      expect(groups).toHaveBeenCalledTimes(1);
      expect(totals).toHaveBeenCalledTimes(1);
      expect(sorts).toHaveBeenCalledTimes(1);
      expect(keyedRows).toHaveBeenCalledTimes(1);
      expect(flattenings).toHaveBeenCalledTimes(2);
      expect(toggled.tree).toBe(first.tree);
      expect(toggled.keyed).toBe(first.keyed);
      expect(toggled.totals).toBe(first.totals);
      expect(toggled.flat).not.toBe(first.flat);
      expect(toggled.flat).toHaveLength(first.flat.length - first.tree![0]!.rows.length);
    });

    it('reads the exceptions and the open rows as sets: the same members in another order is no toggle', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ grouping: byQty }));
      const [a, b] = [first.tree![0]!.key, first.tree![1]!.key];
      const hasDetail = () => true;
      const run = (except: string[], expandedRows: string[], detail = hasDetail) =>
        pipeline.run(
          input({
            grouping: byQty,
            hasDetail: detail,
            expanded: { allExpanded: true, except },
            expandedRows,
          }),
        );
      run([a, b], ['DH-1', 'DH-2']);
      const count = flattenings.mock.calls.length;
      run([b, a], ['DH-2', 'DH-1']);
      expect(flattenings).toHaveBeenCalledTimes(count);
      // A function that is another function is another list, as the grid warns it may be.
      run([b, a], ['DH-2', 'DH-1'], () => true);
      expect(flattenings).toHaveBeenCalledTimes(count + 1);
    });

    it('does not group, total or flatten again for a new page', () => {
      const pipeline = createPipeline<Order>();
      const held = { summary: summary(sumQty), grouping: byQty };
      const first = pipeline.run(input({ ...held, page: { index: 0, size: 10 } }));
      const second = pipeline.run(input({ ...held, page: { index: 2, size: 10 } }));
      expect(groups).toHaveBeenCalledTimes(1);
      expect(totals).toHaveBeenCalledTimes(1);
      expect(flattenings).toHaveBeenCalledTimes(1);
      expect(second.flat).toBe(first.flat);
      expect(second.visible).not.toBe(first.visible);
    });

    it('runs no total again for a sort but groups the new order again; a search runs them from step 3', () => {
      const pipeline = createPipeline<Order>();
      const held = { summary: summary(sumQty), grouping: byQty };
      const idDesc: DataGridSortItem[] = [{ field: 'id', direction: 'desc' }];
      pipeline.run(input(held));
      pipeline.run(input({ ...held, sort: idDesc }));
      expect(sorts).toHaveBeenCalledTimes(2);
      expect(totals).toHaveBeenCalledTimes(1);
      expect(groups).toHaveBeenCalledTimes(2);
      pipeline.run(input({ ...held, sort: idDesc, filter: { search: 'DH-2' } }));
      expect(totals).toHaveBeenCalledTimes(2);
      expect(groups).toHaveBeenCalledTimes(3);
    });

    it('runs none of the steps 5 to 8 for a hide or a reorder of columns they do not name', () => {
      const pipeline = createPipeline<Order>();
      const held = { summary: summary(sumQty), grouping: byQty, sort: qtyAsc };
      const first = pipeline.run(input(held));
      const reordered = pipeline.run(input({ ...held, columns: [resolved[1]!, resolved[0]!] }));
      // The quantity is the one column the sort names, so it stays: hide the id.
      const fewer = pipeline.run(input({ ...held, columns: [resolved[1]!] }));
      expect(sorts).toHaveBeenCalledTimes(1);
      expect(groups).toHaveBeenCalledTimes(1);
      expect(totals).toHaveBeenCalledTimes(1);
      expect(keyedRows).toHaveBeenCalledTimes(1);
      expect(flattenings).toHaveBeenCalledTimes(1);
      expect(reordered).toBe(first);
      expect(fewer).toBe(first);
    });

    it('keeps the data rows that did not change when one row is edited, and draws the groups from the new tree', () => {
      const pipeline = createPipeline<Order>();
      const held = { grouping: byQty };
      const first = pipeline.run(input(held));
      const edited = DATA.map((row) => (row.id === 'DH-2' ? { ...row } : row));
      const second = pipeline.run(input({ ...held, data: edited }));
      const kept = second.flat.filter((row) => row.kind === 'data' && first.flat.includes(row));
      expect(kept).toHaveLength(29);
    });

    it('gives back the same keyed rows and list for a new getKey that says the same', () => {
      const pipeline = createPipeline<Order>();
      const first = pipeline.run(input({ grouping: byQty }));
      const second = pipeline.run(input({ grouping: byQty, getKey: (row) => row.id }));
      expect(second.keyed).toBe(first.keyed);
      expect(second.flat).toBe(first.flat);
    });
  });
});
