import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DataGridColumn, DataGridSortItem } from '../types';
import { resolveColumns } from './columns';
import { createPipeline } from './pipeline';
import type { PipelineInput } from './pipeline';
import { sortRows } from './sort';

// The real `sortRows`, counted, to show which runs of the pipeline sort again.
vi.mock('./sort', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./sort')>();
  return { ...actual, sortRows: vi.fn(actual.sortRows) };
});

interface Order {
  id: string;
  qty: number;
}

const COLUMNS: DataGridColumn<Order>[] = [{ field: 'id' }, { field: 'qty', dataType: 'number' }];
const resolved = resolveColumns(COLUMNS, {
  locale: 'en-US',
  timeZone: 'UTC',
  yes: 'Yes',
  no: 'No',
  allowSorting: true,
});

const DATA: readonly Order[] = Array.from({ length: 30 }, (_, index) => ({
  id: `DH-${index + 1}`,
  qty: (index * 7) % 11,
}));

const getKey = (row: Order) => row.id;

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
    ...patch,
  };
}

const qtyAsc: DataGridSortItem[] = [{ field: 'qty', direction: 'asc' }];
const sorts = vi.mocked(sortRows);

describe('createPipeline', () => {
  // Braces: a function returned from a hook is run as its cleanup, and mockClear returns the mock.
  beforeEach(() => {
    sorts.mockClear();
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
      expect(result.flat[4]).toEqual({ kind: 'data', key: 'DH-5', row: DATA[4], index: 4 });
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
      expect(result.visible[0]!.index).toBe(12);
      expect(result.visible[0]!.row).toBe(result.rows[12]);
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
      expect(second.visible[0]!.index).toBe(12);
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

    it('sorts again for new columns or a new locale, which change what a key is', () => {
      const pipeline = createPipeline<Order>();
      pipeline.run(input({ sort: qtyAsc }));
      pipeline.run(input({ sort: qtyAsc, locale: 'vi-VN' }));
      expect(sorts).toHaveBeenCalledTimes(2);
      pipeline.run(input({ sort: qtyAsc, locale: 'vi-VN', columns: [...resolved] }));
      expect(sorts).toHaveBeenCalledTimes(3);
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
});
