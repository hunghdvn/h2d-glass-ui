import { describe, expect, it } from 'vitest';
import type { DataGridColumn, DataGridFilter, DataGridSortItem } from '../types';
import { resolveColumns } from './columns';
import { filterRows, searchRows } from './filter';
import { flattenRows } from './flatten';
import { pageRows } from './page';
import { createPipeline } from './pipeline';
import { sortRows } from './sort';
import { createTextCache } from './values';
import { computeOffsets, findWindow } from './virtual';

// The targets of spec 3.5 for 10 000 rows by 9 columns on a mid-range laptop. CI is slower and
// noisier, so the test asks for under three times each; the real figures are measured on the
// owner's machine and go in the PR description.
const SORT_TARGET_MS = 50;
const SEARCH_TARGET_MS = 30;
const FILTER_TARGET_MS = 20;
const WINDOW_TARGET_MS = 5;
const SLACK = 3;
const RUNS = 5;

interface Order {
  id: string;
  customer: string;
  assignee: number;
  placed: string;
  at: number;
  status: number;
  channel: string;
  qty: number;
  total: number;
  paid: boolean;
}

// Mulberry32: a small generator with a seed, so every run sorts the same rows. `Math.random` would
// make a slow run impossible to repeat.
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Châu', 'Phạm Quốc Dũng', 'Đỗ Thu Hà'];
const CHANNELS = ['Store', 'Website', 'Phone'];
const STATUSES = [
  { code: 0, name: 'New' },
  { code: 1, name: 'Processing' },
  { code: 2, name: 'Delivered' },
  { code: 3, name: 'Cancelled' },
];
const PEOPLE = NAMES.map((name, index) => ({ code: index, name }));

function makeOrders(count: number): Order[] {
  const random = seeded(2026);
  return Array.from({ length: count }, (_, index) => ({
    id: `DH-${1000 + index}`,
    customer: NAMES[Math.floor(random() * NAMES.length)]!,
    assignee: Math.floor(random() * PEOPLE.length),
    placed: `2026-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}`,
    at: Date.UTC(2026, 0, 1) + Math.floor(random() * 300 * 86_400_000),
    status: Math.floor(random() * STATUSES.length),
    channel: CHANNELS[Math.floor(random() * CHANNELS.length)]!,
    qty: 1 + Math.floor(random() * 20),
    total: Math.floor(random() * 50_000_000),
    paid: random() > 0.5,
  }));
}

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id' },
  { field: 'customer' },
  {
    field: 'assignee',
    dataType: 'number',
    lookup: { items: PEOPLE, valueField: 'code', displayField: 'name' },
  },
  { field: 'placed', dataType: 'date' },
  { field: 'at', dataType: 'datetime' },
  {
    field: 'status',
    dataType: 'number',
    lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
  },
  { field: 'qty', dataType: 'number' },
  { field: 'total', dataType: 'number' },
  { field: 'paid', dataType: 'boolean' },
];

const OPTIONS = {
  locale: 'vi-VN',
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
};

const resolved = resolveColumns(COLUMNS, OPTIONS);

function time(run: () => void): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

function median(run: () => void): number {
  const times: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    run();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(RUNS / 2)]!;
}

describe('performance of the engine on 10 000 rows by 9 columns', () => {
  const orders = makeOrders(10_000);

  it('makes the same rows every time (the generator has a seed)', () => {
    expect(makeOrders(3)).toEqual(makeOrders(3));
    expect(orders).toHaveLength(10_000);
    expect(resolved).toHaveLength(9);
  });

  it(`sorts on two levels in under ${SORT_TARGET_MS * SLACK} ms`, () => {
    // A lookup by its text, then a number, so the keys are the costly kind.
    const items: DataGridSortItem[] = [
      { field: 'status', direction: 'asc' },
      { field: 'total', direction: 'desc' },
    ];
    const sorted = sortRows(orders, items, resolved, 'vi-VN');
    expect(sorted).toHaveLength(10_000);
    // Cancelled, Delivered, New, Processing by text; the biggest total first inside each.
    expect(sorted[0]!.status).toBe(3);
    expect(sorted.at(-1)!.status).toBe(1);
    expect(sorted[1]!.total).toBeLessThanOrEqual(sorted[0]!.total);
    const ms = median(() => sortRows(orders, items, resolved, 'vi-VN'));
    console.log(
      `sort, two levels, 10 000 rows: median of ${RUNS} runs ${ms.toFixed(1)} ms (target ${SORT_TARGET_MS} ms)`,
    );
    expect(ms).toBeLessThan(SORT_TARGET_MS * SLACK);
  });

  it(`flattens, pages and finds a window in under ${WINDOW_TARGET_MS * SLACK} ms`, () => {
    const run = () => {
      const flat = flattenRows(orders, (row) => row.id);
      pageRows(flat, { index: 3, size: 100 });
      const offsets = computeOffsets(flat.length, () => 41);
      return findWindow(offsets, 200_000, 800, 6);
    };
    expect(run()).toEqual({ start: 4_872, end: 4_904 });
    const ms = median(run);
    console.log(
      `flatten + page + offsets + window, 10 000 rows: median of ${RUNS} runs ${ms.toFixed(1)} ms (target ${WINDOW_TARGET_MS} ms)`,
    );
    expect(ms).toBeLessThan(WINDOW_TARGET_MS * SLACK);
  });

  it(`searches "minh" in under ${SEARCH_TARGET_MS * SLACK} ms once the texts are remembered`, () => {
    const read = createTextCache<Order>();
    const cold = time(() => searchRows(orders, resolved, 'minh', read));
    const found = searchRows(orders, resolved, 'minh', read);
    // Three of the five names hold no "minh" and neither does a number or a date.
    expect(found.length).toBeGreaterThan(1_000);
    expect(found.length).toBeLessThan(10_000);
    const ms = median(() => searchRows(orders, resolved, 'minh', read));
    console.log(
      `search "minh", 10 000 rows by 9 columns: cold run ${cold.toFixed(1)} ms, median of ${RUNS} warm runs ${ms.toFixed(1)} ms (target ${SEARCH_TARGET_MS} ms)`,
    );
    expect(ms).toBeLessThan(SEARCH_TARGET_MS * SLACK);
  });

  it(`filters by three conditions in under ${FILTER_TARGET_MS * SLACK} ms`, () => {
    const filter: DataGridFilter = {
      columns: {
        customer: { operator: 'contains', value: 'van' },
        total: { operator: '>', value: 10_000_000 },
        status: { values: [1, 2] },
      },
    };
    const read = createTextCache<Order>();
    const cold = time(() => filterRows(orders, resolved, filter, read));
    const kept = filterRows(orders, resolved, filter, read);
    expect(kept.length).toBeGreaterThan(0);
    expect(kept.length).toBeLessThan(2_500);
    expect(
      kept.every(
        (row) =>
          row.customer.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().includes('van') &&
          row.total > 10_000_000 &&
          (row.status === 1 || row.status === 2),
      ),
    ).toBe(true);
    const ms = median(() => filterRows(orders, resolved, filter, read));
    console.log(
      `filter, three conditions, 10 000 rows by 9 columns: cold run ${cold.toFixed(1)} ms, median of ${RUNS} warm runs ${ms.toFixed(1)} ms (target ${FILTER_TARGET_MS} ms)`,
    );
    expect(ms).toBeLessThan(FILTER_TARGET_MS * SLACK);
  });

  it('gives the same rows for a hide or a reorder of columns the search does not read', () => {
    const pipeline = createPipeline<Order>();
    const read = createTextCache<Order>();
    // The paid column is not searched, so hiding it cannot change what the search finds.
    const columns = resolveColumns(
      COLUMNS.map((column) =>
        column.field === 'paid' ? { ...column, allowSearch: false } : column,
      ),
      OPTIONS,
    );
    const filter: DataGridFilter = {
      search: 'minh',
      columns: { total: { operator: '>', value: 10_000_000 } },
    };
    const run = (shown: typeof columns) =>
      pipeline.run({
        data: orders,
        columns: shown,
        getKey: (row) => row.id,
        sort: [{ field: 'total', direction: 'desc' }],
        page: { index: 0, size: 100 },
        remote: false,
        totalCount: undefined,
        locale: 'vi-VN',
        filter,
        filterColumns: columns,
        read,
      });
    const first = run(columns);
    expect(first.rows.length).toBeGreaterThan(0);
    expect(first.rows.length).toBeLessThan(orders.length);
    const hidden = run(columns.filter((column) => column.id !== 'paid'));
    const reordered = run([...columns].reverse());
    const shown = run(columns);
    expect(hidden.rows).toBe(first.rows);
    expect(reordered.rows).toBe(first.rows);
    expect(shown.rows).toBe(first.rows);
    expect(shown.searched).toBe(first.searched);
  });
});
