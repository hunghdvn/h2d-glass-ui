import { describe, expect, it } from 'vitest';
import type { DataGridColumn, DataGridGroupItem } from '../types';
import { resolveColumns, selectColumn } from './columns';
import type { ResolvedColumn } from './columns';
import { effectiveGrouping, groupKey, groupRows, groupedRows, rowPlaces } from './group';
import type { GroupNode } from './group';
import { resolveSummaryItems } from './summary';
import { createTextCache } from './values';

interface Order {
  id: string;
  status: number | null;
  assignee: string | null;
  qty: number | null;
  placed: string | null;
  at: number | null;
  paid: boolean | null;
}

const STATUSES = [
  { code: 1, name: 'New' },
  { code: 2, name: 'Delivered' },
  { code: 3, name: 'Cancelled' },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id' },
  {
    field: 'status',
    dataType: 'number',
    lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
  },
  { field: 'assignee' },
  { field: 'qty', dataType: 'number' },
  { field: 'placed', dataType: 'date' },
  { field: 'at', dataType: 'datetime' },
  { field: 'paid', dataType: 'boolean' },
];

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

const resolved = resolveColumns<Order>(COLUMNS, OPTIONS);
const read = createTextCache<Order>();

const row = (id: string, patch: Partial<Order> = {}): Order => ({
  id,
  status: 1,
  assignee: 'An',
  qty: 1,
  placed: null,
  at: null,
  paid: null,
  ...patch,
});

const asc = (field: string): DataGridGroupItem => ({ field, direction: 'asc' });
const desc = (field: string): DataGridGroupItem => ({ field, direction: 'desc' });

const ROWS: Order[] = [
  row('1', { status: 2, assignee: 'Bình', qty: 4 }),
  row('2', { status: 1, assignee: 'An', qty: 2 }),
  row('3', { status: 2, assignee: 'An', qty: 10 }),
  row('4', { status: 3, assignee: null, qty: 7 }),
  row('5', { status: 1, assignee: 'Bình', qty: 3 }),
  row('6', { status: 2, assignee: 'Bình', qty: 5 }),
];

function group(
  grouping: DataGridGroupItem[],
  rows: readonly Order[] = ROWS,
  columns: readonly ResolvedColumn<Order>[] = resolved,
) {
  return groupRows(rows, grouping, columns, read, 'en-US');
}
const ids = (rows: readonly Order[]) => rows.map((r) => r.id);
const texts = (nodes: readonly GroupNode<Order>[]) => nodes.map((node) => node.text);

describe('effectiveGrouping', () => {
  it('keeps the items that group, in order, and drops the rest without a word', () => {
    const columns = [
      ...resolveColumns<Order>(
        [
          { field: 'id', allowGrouping: false },
          { field: 'status', dataType: 'number' },
          { field: 'assignee' },
        ],
        OPTIONS,
      ),
      selectColumn<Order>(),
    ];
    const items = [
      asc('assignee'),
      asc('nothing'),
      asc('id'),
      asc('flg:select'),
      { field: 'status', direction: 'up' } as unknown as DataGridGroupItem,
      desc('assignee'),
      desc('status'),
    ];
    expect(effectiveGrouping(items, columns)).toEqual([asc('assignee'), desc('status')]);
  });

  it('gives nothing for no items, and does not change the items it is given', () => {
    const items = [asc('assignee'), asc('assignee')];
    expect(effectiveGrouping([], resolved)).toEqual([]);
    effectiveGrouping(items, resolved);
    expect(items).toHaveLength(2);
  });
});

describe('groupKey', () => {
  it('is the JSON of the [field, value] steps from the outermost level down', () => {
    expect(groupKey([{ field: 'status', value: 2 }])).toBe('[["status",2]]');
    expect(
      groupKey([
        { field: 'status', value: 2 },
        { field: 'assignee', value: 'Bình' },
      ]),
    ).toBe('[["status",2],["assignee","Bình"]]');
    expect(groupKey([{ field: 'assignee', value: null }])).toBe('[["assignee",null]]');
  });

  it('differs when a level is added and when the levels are in another order', () => {
    const status = { field: 'status', value: 2 };
    const assignee = { field: 'assignee', value: 'An' };
    expect(groupKey([status])).not.toBe(groupKey([status, assignee]));
    expect(groupKey([status, assignee])).not.toBe(groupKey([assignee, status]));
  });

  it('writes a value JSON cannot write, and never throws', () => {
    expect(groupKey([{ field: 'big', value: 10n }])).toBe('[["big","10"]]');
    const loop: Record<string, unknown> = {};
    loop.self = loop;
    expect(() => groupKey([{ field: 'x', value: loop }])).not.toThrow();
  });
});

describe('groupRows', () => {
  it('groups by one level: each value once, in order, the rows of a group in the order they came', () => {
    const tree = group([asc('assignee')]);
    expect(texts(tree)).toEqual(['An', 'Bình', '']);
    expect(tree.map((node) => ids(node.rows))).toEqual([['2', '3'], ['1', '5', '6'], ['4']]);
    expect(tree.map((node) => node.key)).toEqual([
      '[["assignee","An"]]',
      '[["assignee","Bình"]]',
      '[["assignee",null]]',
    ]);
    expect(tree[0]).toMatchObject({
      field: 'assignee',
      level: 1,
      value: 'An',
      children: null,
      totals: null,
      path: [{ field: 'assignee', value: 'An' }],
    });
  });

  it('puts the blank group last in both directions', () => {
    expect(texts(group([desc('assignee')]))).toEqual(['Bình', 'An', '']);
    expect(group([desc('assignee')]).at(-1)!.value).toBeNull();
  });

  it('groups by two levels: the groups of a level are inside the group of the level above', () => {
    const tree = group([asc('status'), asc('assignee')]);
    // A lookup is ordered by its text: Cancelled, Delivered, New.
    expect(texts(tree)).toEqual(['Cancelled', 'Delivered', 'New']);
    expect(tree.map((node) => node.value)).toEqual([3, 2, 1]);
    const delivered = tree[1]!;
    expect(ids(delivered.rows)).toEqual(['1', '3', '6']);
    expect(texts(delivered.children!)).toEqual(['An', 'Bình']);
    expect(delivered.children!.map((node) => node.level)).toEqual([2, 2]);
    expect(delivered.children!.map((node) => ids(node.rows))).toEqual([['3'], ['1', '6']]);
    expect(delivered.children![1]!.key).toBe('[["status",2],["assignee","Bình"]]');
    expect(delivered.children![1]!.children).toBeNull();
    expect(delivered.children![1]!.path).toEqual([
      { field: 'status', value: 2 },
      { field: 'assignee', value: 'Bình' },
    ]);
  });

  it('orders each level by its own direction', () => {
    const tree = group([desc('status'), desc('assignee')]);
    expect(texts(tree)).toEqual(['New', 'Delivered', 'Cancelled']);
    expect(texts(tree[1]!.children!)).toEqual(['Bình', 'An']);
  });

  it('orders numbers as numbers, and a column by its sortValue when it has one', () => {
    const rows = [row('a', { qty: 10 }), row('b', { qty: 2 }), row('c', { qty: 10 })];
    expect(group([asc('qty')], rows).map((node) => node.value)).toEqual([2, 10]);
    const byCode = resolveColumns<Order>(
      [
        {
          field: 'status',
          dataType: 'number',
          lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
          sortValue: (r) => r.status,
        },
      ],
      OPTIONS,
    );
    expect(texts(group([asc('status')], ROWS, byCode))).toEqual(['New', 'Delivered', 'Cancelled']);
  });

  it('keeps the first appearance first when two values are ordered the same', () => {
    const flat = resolveColumns<Order>([{ field: 'assignee', sortValue: () => 0 }], OPTIONS);
    expect(texts(group([asc('assignee')], ROWS, flat))).toEqual(['Bình', 'An', '']);
    expect(texts(group([desc('assignee')], ROWS, flat))).toEqual(['Bình', 'An', '']);
  });

  it('groups a date by its day, written as the cells write it', () => {
    const rows = [
      row('a', { placed: '2026-11-06' }),
      row('b', { placed: '2026-11-05' }),
      row('c', { placed: '2026-11-06' }),
    ];
    const tree = group([asc('placed')], rows);
    expect(tree.map((node) => node.value)).toEqual(['2026-11-05', '2026-11-06']);
    expect(texts(tree)).toEqual(['11/05/2026', '11/06/2026']);
    expect(tree[0]!.key).toBe('[["placed","2026-11-05"]]');
  });

  it('groups a datetime by its day in the zone of its cells', () => {
    // Three instants of the 5th UTC: one day in UTC, two in Hanoi (UTC+7: 10:00 on the 5th, then 00:30
    // and 06:30 on the 6th) and two in Los Angeles (UTC-8: 19:00 on the 4th, then 09:30 and 15:30).
    const rows = [
      row('a', { at: Date.UTC(2026, 10, 5, 23, 30) }),
      row('b', { at: Date.UTC(2026, 10, 5, 17, 30) }),
      row('c', { at: Date.UTC(2026, 10, 5, 3, 0) }),
    ];
    const inZone = (timeZone: string) =>
      group(
        [asc('at')],
        rows,
        resolveColumns<Order>([{ field: 'at', dataType: 'datetime' }], { ...OPTIONS, timeZone }),
      );
    const utc = inZone('UTC');
    expect(utc.map((node) => node.value)).toEqual(['2026-11-05']);
    expect(ids(utc[0]!.rows)).toEqual(['a', 'b', 'c']);
    const hanoi = inZone('Asia/Ho_Chi_Minh');
    expect(hanoi.map((node) => node.value)).toEqual(['2026-11-05', '2026-11-06']);
    expect(hanoi.map((node) => ids(node.rows))).toEqual([['c'], ['a', 'b']]);
    expect(texts(hanoi)).toEqual(['11/05/2026', '11/06/2026']);
    const losAngeles = inZone('America/Los_Angeles');
    expect(losAngeles.map((node) => ids(node.rows))).toEqual([['c'], ['a', 'b']]);
    expect(losAngeles.map((node) => node.value)).toEqual(['2026-11-04', '2026-11-05']);
  });

  it('orders a datetime by its day, whatever the sortValue of its instant says', () => {
    const backwards = resolveColumns<Order>(
      [{ field: 'at', dataType: 'datetime', sortValue: (r) => -(r.at ?? 0) }],
      OPTIONS,
    );
    const rows = [
      row('a', { at: Date.UTC(2026, 10, 7, 1) }),
      row('b', { at: Date.UTC(2026, 10, 5, 1) }),
    ];
    expect(group([asc('at')], rows, backwards).map((node) => node.value)).toEqual([
      '2026-11-05',
      '2026-11-07',
    ]);
  });

  it('groups a boolean with false first, and writes it as the words of the grid', () => {
    const rows = [row('a', { paid: true }), row('b', { paid: false }), row('c', { paid: true })];
    const tree = group([asc('paid')], rows);
    expect(tree.map((node) => node.value)).toEqual([false, true]);
    expect(texts(tree)).toEqual(['No', 'Yes']);
  });

  it('writes the text of a group as the cell of its first row writes it', () => {
    const upper = resolveColumns<Order>(
      [{ field: 'assignee', format: (value: string | null) => `${value ?? ''}!`.toUpperCase() }],
      OPTIONS,
    );
    expect(texts(group([asc('assignee')], ROWS, upper))).toEqual(['AN!', 'BÌNH!', '']);
  });

  it('groups by a column the layout hides, since it is given every resolved column', () => {
    const [assignee] = resolveColumns<Order>([{ field: 'assignee', visible: false }], OPTIONS);
    expect(texts(group([asc('assignee')], ROWS, [assignee!]))).toEqual(['An', 'Bình', '']);
  });

  it('groups by nothing that does not group: the tree is empty', () => {
    expect(group([])).toEqual([]);
    expect(group([asc('nothing')])).toEqual([]);
  });

  it('gives no group for no rows, and does not change the rows', () => {
    expect(group([asc('assignee')], [])).toEqual([]);
    const copy = [...ROWS];
    group([asc('status'), asc('assignee')]);
    expect(ROWS).toEqual(copy);
  });

  it('computes the totals of each group over its rows when it is given items', () => {
    const { items } = resolveSummaryItems(
      [
        { column: 'id', type: 'count' },
        { column: 'qty', type: 'sum' },
      ],
      resolved,
    );
    const tree = groupRows(ROWS, [asc('status'), asc('assignee')], resolved, read, 'en-US', items);
    const delivered = tree[1]!;
    expect(delivered.totals!.get('count:id')!.value).toBe(3);
    expect(delivered.totals!.get('sum:qty')!.value).toBe(19);
    // The total of a level is of every row inside it, the groups of the level below included.
    expect(delivered.children![1]!.totals!.get('sum:qty')!.value).toBe(9);
  });
});

describe('groupedRows', () => {
  it('gives the rows in the order the tree shows them, the leaves in group order', () => {
    expect(ids(groupedRows(group([asc('status')])))).toEqual(['4', '1', '3', '6', '2', '5']);
    expect(ids(groupedRows(group([asc('status'), desc('assignee')])))).toEqual([
      '4',
      '1',
      '6',
      '3',
      '5',
      '2',
    ]);
  });

  it('gives nothing for an empty tree', () => {
    expect(groupedRows([])).toEqual([]);
  });
});

describe('rowPlaces', () => {
  it('says, for each row in the order of groupedRows, its level, its groups and its place among its siblings', () => {
    const tree = group([asc('status'), asc('assignee')]);
    const places = rowPlaces(tree);
    const rows = groupedRows(tree);
    expect(places).toHaveLength(rows.length);
    // Delivered > Bình holds rows 1 and 6: the second of two.
    const six = rows.findIndex((r) => r.id === '6');
    expect(places[six]).toEqual({
      level: 3,
      groups: [tree[1]!.key, tree[1]!.children![1]!.key],
      setsize: 2,
      posinset: 2,
    });
    expect(places.every((place) => place.level === 3 && place.groups.length === 2)).toBe(true);
  });

  it('puts the rows of a single level at level 2, and gives none for an empty tree', () => {
    const tree = group([asc('status')]);
    expect(rowPlaces(tree).map((place) => place.level)).toEqual([2, 2, 2, 2, 2, 2]);
    expect(rowPlaces([])).toEqual([]);
  });
});
