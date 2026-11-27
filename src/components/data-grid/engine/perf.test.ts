import { describe, expect, it } from 'vitest';
import { mergeLabels } from '../labels';
import type { DataGridColumn, DataGridFilter, DataGridGroupItem, DataGridSortItem } from '../types';
import { resolveColumns } from './columns';
import { applyChanges } from './edit';
import type { PendingChange } from './edit';
import { filterRows, searchRows } from './filter';
import { flattenRows, flattenTree } from './flatten';
import type { FlatDataRow } from './flatten';
import { groupRows, groupedRows, rowPlaces } from './group';
import { csvColumns, toCsv } from './csv';
import { countRows, pageRows } from './page';
import { createPipeline } from './pipeline';
import { sortRows } from './sort';
import { resolveSummaryItems } from './summary';
import { validateRow } from './validate';
import { createTextCache } from './values';
import { computeOffsets, findWindow } from './virtual';

// The targets of spec 3.5 for 10 000 rows by 9 columns on a mid-range laptop. CI is slower and
// noisier, so the test asks for under three times each; the real figures are measured on the
// owner's machine and go in the PR description.
const SORT_TARGET_MS = 50;
const SEARCH_TARGET_MS = 30;
const FILTER_TARGET_MS = 20;
const GROUP_TARGET_MS = 30;
const LIST_TARGET_MS = 5;
// The CSV: the medians measured on the author's machine were 10 ms (the texts in the cache) and 29 ms (raw, which
// reads each value again); the budget is three times each.
const CSV_TARGET_MS = 10;
const CSV_RAW_TARGET_MS = 30;
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
  allowGrouping: true,
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

  it(`filters by four conditions in under ${FILTER_TARGET_MS * SLACK} ms`, () => {
    const filter: DataGridFilter = {
      columns: {
        customer: { operator: 'contains', value: 'van' },
        total: { operator: '>', value: 10_000_000 },
        status: { values: [1, 2] },
        // A datetime's key is a formatToParts per row: the warm runs read it from the cache.
        at: { operator: '>=', value: '2026-03-01' },
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
          (row.status === 1 || row.status === 2) &&
          row.at >= Date.UTC(2026, 2, 1),
      ),
    ).toBe(true);
    const ms = median(() => filterRows(orders, resolved, filter, read));
    console.log(
      `filter, four conditions, 10 000 rows by 9 columns: cold run ${cold.toFixed(1)} ms, median of ${RUNS} warm runs ${ms.toFixed(1)} ms (target ${FILTER_TARGET_MS} ms)`,
    );
    expect(ms).toBeLessThan(FILTER_TARGET_MS * SLACK);
  });

  describe('the groups', () => {
    const grouping: DataGridGroupItem[] = [
      { field: 'status', direction: 'asc' },
      { field: 'assignee', direction: 'asc' },
    ];
    // A sum and a count in each group, so the totals are part of what is measured.
    const { items } = resolveSummaryItems<Order>(
      [
        { column: 'total', type: 'sum' },
        { column: 'id', type: 'count' },
      ],
      resolved,
    );
    const group = (read: ReturnType<typeof createTextCache<Order>>) =>
      groupRows(orders, grouping, resolved, read, 'vi-VN', items);

    it(`groups on two levels with a sum and a count in each group in under ${GROUP_TARGET_MS * SLACK} ms`, () => {
      const read = createTextCache<Order>();
      const cold = time(() => group(read));
      const tree = group(read);
      // Four statuses, each with the five assignees; the groups of a level are named by their text.
      expect(tree.map((node) => node.text)).toEqual([
        'Cancelled',
        'Delivered',
        'New',
        'Processing',
      ]);
      expect(tree.every((node) => node.children!.length === 5)).toBe(true);
      expect(tree.reduce((count, node) => count + node.rows.length, 0)).toBe(10_000);
      const delivered = tree[1]!;
      expect(delivered.totals!.get('count:id')!.value).toBe(delivered.rows.length);
      expect(delivered.totals!.get('sum:total')!.value).toBe(
        delivered.rows.reduce((sum, row) => sum + row.total, 0),
      );
      const ms = median(() => group(read));
      console.log(
        `group, two levels with a sum and a count, 10 000 rows by 9 columns: cold run ${cold.toFixed(1)} ms, median of ${RUNS} warm runs ${ms.toFixed(1)} ms (target ${GROUP_TARGET_MS} ms)`,
      );
      expect(ms).toBeLessThan(GROUP_TARGET_MS * SLACK);
    });

    it(`groups by a datetime and a lookup in under ${GROUP_TARGET_MS * SLACK} ms once its days are remembered`, () => {
      const read = createTextCache<Order>();
      const byDay: DataGridGroupItem[] = [
        { field: 'at', direction: 'desc' },
        { field: 'status', direction: 'asc' },
      ];
      const run = () => groupRows(orders, byDay, resolved, read, 'vi-VN');
      const cold = time(run);
      const tree = run();
      // The instants span 300 days: at most that many groups, the latest first.
      expect(tree.length).toBeGreaterThan(200);
      expect(tree.length).toBeLessThanOrEqual(300);
      expect(String(tree[0]!.value) > String(tree[1]!.value)).toBe(true);
      const ms = median(run);
      console.log(
        `group, a datetime then a lookup, 10 000 rows by 9 columns: cold run ${cold.toFixed(1)} ms (a day is a formatToParts per row), median of ${RUNS} warm runs ${ms.toFixed(1)} ms (target ${GROUP_TARGET_MS} ms)`,
      );
      expect(ms).toBeLessThan(GROUP_TARGET_MS * SLACK);
    });

    it(`flattens all open groups and pages in under ${LIST_TARGET_MS * SLACK} ms`, () => {
      const tree = group(createTextCache<Order>());
      const keyed = flattenRows(
        groupedRows(tree),
        (row) => row.id,
        undefined,
        rowPlaces(tree),
      ) as FlatDataRow<Order>[];
      const run = () => {
        const flat = flattenTree({
          tree,
          keyed,
          expanded: { allExpanded: true, except: [] },
          expandedRows: new Set(),
          hasDetail: undefined,
        });
        return { flat, page: pageRows(flat, { index: 400, size: 20 }) };
      };
      const { flat, page } = run();
      // 4 groups, 20 inside them, and the 10 000 rows.
      expect(flat).toHaveLength(10_024);
      expect(countRows(page)).toBe(20);
      expect(page[0]).toMatchObject({ kind: 'group', continued: true });
      const ms = median(run);
      console.log(
        `flatten (all open) + page 400 of 20, 10 000 rows in 2 levels: median of ${RUNS} runs ${ms.toFixed(1)} ms (target ${LIST_TARGET_MS} ms)`,
      );
      expect(ms).toBeLessThan(LIST_TARGET_MS * SLACK);
    });
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
        grouping: [],
        groupColumns: columns,
        summary: null,
        expanded: { allExpanded: true, except: [] },
        expandedRows: [],
        hasDetail: undefined,
        changes: null,
        newRowPosition: 'first',
        form: null,
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

// The targets of spec 3.5 for the steps editing adds, on the same 10 000 rows: the rows over the saved ones
// (step 2) with 200 changes, the whole pipeline from step 2 for a committed change, and the validation of
// 100 changed rows. Proposed by the plan: the same 3 times of slack, medians of 5 and the cold run logged.
const CHANGES_TARGET_MS = 5;
const COMMIT_TARGET_MS = 5;
const VALIDATE_TARGET_MS = 5;

describe('performance of editing on 10 000 rows by 9 columns', () => {
  const orders = makeOrders(10_000);
  const columns = resolveColumns(
    COLUMNS.map((column) =>
      column.field === 'customer'
        ? { ...column, validationRules: [{ type: 'required' as const }] }
        : column.field === 'qty'
          ? {
              ...column,
              validationRules: [
                { type: 'required' as const },
                { type: 'range' as const, min: 1, max: 20 },
              ],
            }
          : column.field === 'placed'
            ? {
                ...column,
                validationRules: [{ type: 'range' as const, min: '2026-01-01', max: '2026-12-31' }],
              }
            : column,
    ),
    OPTIONS,
  );
  const getKey = (row: Order) => row.id;
  const read = createTextCache<Order>();

  // 200 updates spread over the rows, each of a new `data` object when `round` changes.
  const updates = (round: number): Map<string, PendingChange<Order>> =>
    new Map(
      Array.from({ length: 200 }, (_, index): [string, PendingChange<Order>] => {
        const row = orders[index * 50]!;
        return [row.id, { type: 'update', key: row.id, row, data: { qty: round + index } }];
      }),
    );

  it('puts 200 changes over 10 000 rows, and reads them back as shown rows', () => {
    let round = 0;
    const run = () => applyChanges(orders, updates(round++), getKey);
    const cold = time(run);
    const shown = run();
    expect(shown.pinned.size).toBe(200);
    expect(shown.pinnedRows.size).toBe(200);
    expect(shown.shown(orders[0]!, orders[0]!.id).qty).toBe(round - 1);
    const ms = median(run);
    console.log(
      `applyChanges, 200 changes over 10 000 rows: cold ${cold.toFixed(1)} ms, median of ${RUNS} runs ${ms.toFixed(1)} ms (target ${CHANGES_TARGET_MS} ms)`,
    );
    expect(ms).toBeLessThan(CHANGES_TARGET_MS * SLACK);
  });

  it('runs the pipeline from step 2 for a committed change: the changes and the steps that read them', () => {
    const pipeline = createPipeline<Order>();
    const filter: DataGridFilter = { search: 'minh' };
    let round = 0;
    const run = () =>
      pipeline.run({
        data: orders,
        columns,
        getKey,
        sort: [{ field: 'total', direction: 'desc' }],
        page: { index: 3, size: 100 },
        remote: false,
        totalCount: undefined,
        locale: 'vi-VN',
        filter,
        filterColumns: columns,
        read,
        grouping: [],
        groupColumns: columns,
        summary: {
          total: resolveSummaryItems([{ column: 'total', type: 'sum' }], columns).items,
          group: [],
        },
        expanded: { allExpanded: true, except: [] },
        expandedRows: [],
        hasDetail: undefined,
        changes: applyChanges(orders, updates(round++), getKey),
        newRowPosition: 'first',
        form: null,
      });
    // The first run sorts and searches; the runs after it are commits of the same 200 rows.
    const first = run();
    expect(first.rows.length).toBeGreaterThan(0);
    const cold = time(run);
    const ms = median(run);
    console.log(
      `pipeline from step 2, a commit over 200 changed rows (search, sort, total, page): cold ${cold.toFixed(1)} ms, median of ${RUNS} runs ${ms.toFixed(1)} ms (target ${COMMIT_TARGET_MS} ms)`,
    );
    expect(run().rows).toBe(first.rows);
    expect(ms).toBeLessThan(COMMIT_TARGET_MS * SLACK);
  });

  it('validates 100 changed rows by 9 columns', () => {
    const labels = mergeLabels(undefined);
    const rows = orders
      .slice(0, 100)
      .map((row, index) => ({ ...row, qty: index % 3 === 0 ? 0 : row.qty }));
    const run = () => rows.map((row) => validateRow(row, columns, labels));
    const cold = time(run);
    const errors = run();
    expect(errors.filter((one) => one.size > 0)).toHaveLength(34);
    const ms = median(run);
    console.log(
      `validateRow, 100 rows by 9 columns: cold ${cold.toFixed(1)} ms, median of ${RUNS} runs ${ms.toFixed(1)} ms (target ${VALIDATE_TARGET_MS} ms)`,
    );
    expect(ms).toBeLessThan(VALIDATE_TARGET_MS * SLACK);
  });
});

describe('performance of the CSV export on 10 000 rows by 9 columns', () => {
  const orders = makeOrders(10_000);

  it(`writes the formatted CSV in under ${CSV_TARGET_MS * SLACK} ms`, () => {
    // One text cache across the runs, as the grid has: the first run writes each text, the next read them.
    const cache = createTextCache<Order>();
    const columns = csvColumns(resolved, 'formatted', (row, column) => cache.text(row, column));
    const run = () => toCsv(orders, columns, { separator: ',', bom: true, escapeFormulas: true });
    const cold = time(run);
    const text = run();
    // The BOM and the heading, 10 000 records and the CRLF that ends the last.
    expect(text.split('\r\n')).toHaveLength(10_002);
    const ms = median(run);
    console.log(
      `CSV, 10 000 rows by 9 columns: cold ${cold.toFixed(1)} ms, median of ${RUNS} runs ${ms.toFixed(1)} ms (budget ${CSV_TARGET_MS * SLACK} ms)`,
    );
    expect(ms).toBeLessThan(CSV_TARGET_MS * SLACK);
  });

  it(`writes the raw CSV in under ${CSV_RAW_TARGET_MS * SLACK} ms`, () => {
    const cache = createTextCache<Order>();
    const columns = csvColumns(resolved, 'raw', (row, column) => cache.text(row, column));
    const run = () => toCsv(orders, columns, { separator: ',', bom: true, escapeFormulas: true });
    const text = run();
    expect(text.split('\r\n')).toHaveLength(10_002);
    const ms = median(run);
    console.log(
      `CSV raw, 10 000 rows by 9 columns: median of ${RUNS} runs ${ms.toFixed(1)} ms (budget ${CSV_RAW_TARGET_MS * SLACK} ms)`,
    );
    expect(ms).toBeLessThan(CSV_RAW_TARGET_MS * SLACK);
  });
});
