import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../../internal/warn';
import type { DataGridColumn, DataGridSortItem } from '../types';
import { resolveColumns } from './columns';
import { effectiveSort, nextSort, sortRows } from './sort';

interface Row {
  id: string;
  name: string | null;
  qty: number | null;
  day: string | null;
  paid: boolean | null;
  status: number | null;
}

const STATUSES = [
  { code: 1, name: 'Processing' },
  { code: 2, name: 'Delivered' },
  { code: 3, name: 'New' },
];

const COLUMNS: DataGridColumn<Row>[] = [
  { field: 'id' },
  { field: 'name' },
  { field: 'qty', dataType: 'number' },
  { field: 'day', dataType: 'date' },
  { field: 'paid', dataType: 'boolean' },
  {
    field: 'status',
    dataType: 'number',
    lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
  },
  { field: 'qty', id: 'locked', dataType: 'number', allowSorting: false },
  { id: 'len', value: (row) => row.name, sortValue: (row) => row.name?.length },
];

const resolved = resolveColumns(COLUMNS, {
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
});

function row(id: string, patch: Partial<Row> = {}): Row {
  return { id, name: id, qty: 0, day: null, paid: null, status: null, ...patch };
}

const sort = (rows: readonly Row[], ...items: DataGridSortItem[]) =>
  sortRows(rows, items, resolved, 'en-US');
const ids = (rows: readonly Row[]) => rows.map((r) => r.id);
const asc = (field: string): DataGridSortItem => ({ field, direction: 'asc' });
const desc = (field: string): DataGridSortItem => ({ field, direction: 'desc' });

describe('sortRows', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('sorts numbers up and down', () => {
    const rows = [row('a', { qty: 5 }), row('b', { qty: -2 }), row('c', { qty: 30 })];
    expect(ids(sort(rows, asc('qty')))).toEqual(['b', 'a', 'c']);
    expect(ids(sort(rows, desc('qty')))).toEqual(['c', 'a', 'b']);
  });

  it('puts "DH-2" before "DH-10": strings compare by the numbers inside', () => {
    const rows = [row('DH-10'), row('DH-2'), row('DH-1')];
    expect(ids(sort(rows, asc('id')))).toEqual(['DH-1', 'DH-2', 'DH-10']);
    expect(ids(sort(rows, desc('id')))).toEqual(['DH-10', 'DH-2', 'DH-1']);
  });

  it('compares strings with the collator of the locale', () => {
    const rows = [row('z', { name: 'Zoe' }), row('a', { name: 'Ân' }), row('b', { name: 'Bình' })];
    expect(ids(sort(rows, asc('name')))).toEqual(['a', 'b', 'z']);
  });

  it('sorts dates by day and booleans false before true', () => {
    const days = [
      row('a', { day: '2026-11-05' }),
      row('b', { day: '2025-12-31' }),
      row('c', { day: '2026-01-02' }),
    ];
    expect(ids(sort(days, asc('day')))).toEqual(['b', 'c', 'a']);
    const flags = [row('a', { paid: true }), row('b', { paid: false }), row('c', { paid: true })];
    expect(ids(sort(flags, asc('paid')))).toEqual(['b', 'a', 'c']);
    expect(ids(sort(flags, desc('paid')))).toEqual(['a', 'c', 'b']);
  });

  it('sorts a lookup column by the text it shows, not by its value', () => {
    const rows = [row('a', { status: 1 }), row('b', { status: 2 }), row('c', { status: 3 })];
    // Processing, Delivered, New by code; Delivered, New, Processing by text.
    expect(ids(sort(rows, asc('status')))).toEqual(['b', 'c', 'a']);
    expect(ids(sort(rows, desc('status')))).toEqual(['a', 'c', 'b']);
  });

  it('uses the sortValue of the column in place of the value', () => {
    const rows = [row('a', { name: 'bbb' }), row('b', { name: 'c' }), row('c', { name: 'aa' })];
    expect(ids(sort(rows, asc('len')))).toEqual(['b', 'c', 'a']);
  });

  it('puts blanks last in both directions', () => {
    const rows = [
      row('a', { qty: null }),
      row('b', { qty: 2 }),
      row('c', { qty: Number.NaN }),
      row('d', { qty: 1 }),
    ];
    expect(ids(sort(rows, asc('qty')))).toEqual(['d', 'b', 'a', 'c']);
    expect(ids(sort(rows, desc('qty')))).toEqual(['b', 'd', 'a', 'c']);
    const names = [row('a', { name: null }), row('b', { name: 'x' }), row('c', { name: '' })];
    expect(ids(sort(names, desc('name')))).toEqual(['b', 'a', 'c']);
    const lookup = [row('a', { status: 99 }), row('b', { status: 2 })];
    expect(ids(sort(lookup, asc('status')))).toEqual(['b', 'a']);
    expect(ids(sort(lookup, desc('status')))).toEqual(['b', 'a']);
  });

  it('is stable: equal rows keep their order, in both directions', () => {
    const rows = [
      row('a', { qty: 1 }),
      row('b', { qty: 1 }),
      row('c', { qty: 0 }),
      row('d', { qty: 1 }),
    ];
    expect(ids(sort(rows, asc('qty')))).toEqual(['c', 'a', 'b', 'd']);
    expect(ids(sort(rows, desc('qty')))).toEqual(['a', 'b', 'd', 'c']);
  });

  it('sorts by a second item inside the equal runs of the first', () => {
    const rows = [
      row('a', { day: '2026-11-05', qty: 30 }),
      row('b', { day: '2026-11-06', qty: 10 }),
      row('c', { day: '2026-11-05', qty: 10 }),
      row('d', { day: '2026-11-06', qty: 20 }),
    ];
    expect(ids(sort(rows, desc('day'), asc('qty')))).toEqual(['b', 'd', 'c', 'a']);
    expect(ids(sort(rows, asc('day'), desc('qty')))).toEqual(['a', 'c', 'd', 'b']);
  });

  it('puts numbers before strings when a sortValue gives both, so the order is the same every time', () => {
    const mixed = resolveColumns<Row>(
      [{ id: 'm', value: () => 0, sortValue: (r) => (r.id === 'b' ? r.id : r.qty) }],
      {
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
        allowGrouping: true,
        allowHeaderFiltering: true,
      },
    );
    const rows = [row('a', { qty: 3 }), row('b'), row('c', { qty: 1 })];
    expect(ids(sortRows(rows, [asc('m')], mixed, 'en-US'))).toEqual(['c', 'a', 'b']);
    expect(ids(sortRows(rows, [desc('m')], mixed, 'en-US'))).toEqual(['b', 'a', 'c']);
  });

  it('ignores, silently, items it cannot use', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = [row('a', { qty: 2 }), row('b', { qty: 1 })];
    // An unknown column, a column that does not sort, and a direction that is neither.
    expect(sort(rows, asc('gone'))).toBe(rows);
    expect(sort(rows, asc('locked'))).toBe(rows);
    expect(sort(rows, { field: 'qty', direction: 'up' as 'asc' })).toBe(rows);
    expect(sort(rows, { field: 'gone', direction: 'asc' }, asc('qty')).map((r) => r.id)).toEqual([
      'b',
      'a',
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('uses the first item of a field that appears twice', () => {
    const rows = [row('a', { qty: 2 }), row('b', { qty: 1 })];
    expect(ids(sort(rows, asc('qty'), desc('qty')))).toEqual(['b', 'a']);
  });

  it('returns the very array it was given when no item is in effect', () => {
    const rows = [row('b'), row('a')];
    expect(sort(rows)).toBe(rows);
    expect(sort(rows, asc('gone'))).toBe(rows);
  });

  it('does not change its input, and returns a new array otherwise', () => {
    const rows = [row('a', { qty: 2 }), row('b', { qty: 1 })];
    const before = [...rows];
    const sorted = sort(rows, asc('qty'));
    expect(rows).toEqual(before);
    expect(sorted).not.toBe(rows);
    expect(Object.isFrozen(rows)).toBe(false);
    const frozen = Object.freeze([row('a', { qty: 2 }), row('b', { qty: 1 })]);
    expect(() => sort(frozen, asc('qty'))).not.toThrow();
  });

  it('reads the key of each row once per item, however many comparisons it makes', () => {
    const calls = vi.fn((r: Row) => r.qty);
    const counted = resolveColumns<Row>([{ field: 'qty', dataType: 'number', sortValue: calls }], {
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
      allowGrouping: true,
      allowHeaderFiltering: true,
    });
    const rows = Array.from({ length: 200 }, (_, index) =>
      row(String(index), { qty: (index * 7) % 13 }),
    );
    sortRows(rows, [asc('qty')], counted, 'en-US');
    expect(calls).toHaveBeenCalledTimes(200);
  });

  it('sorts an empty list', () => {
    expect(sort([], asc('qty'))).toEqual([]);
  });
});

describe('nextSort', () => {
  const item = (field: string, direction: 'asc' | 'desc'): DataGridSortItem => ({
    field,
    direction,
  });

  it('turns a column that is not sorted ascending, then descending, then off', () => {
    const first = nextSort([], 'qty', false, 'multiple');
    expect(first).toEqual([item('qty', 'asc')]);
    const second = nextSort(first, 'qty', false, 'multiple');
    expect(second).toEqual([item('qty', 'desc')]);
    expect(nextSort(second, 'qty', false, 'multiple')).toEqual([]);
  });

  it('makes the pressed column the only one when the press is plain', () => {
    expect(nextSort([item('name', 'desc'), item('day', 'asc')], 'qty', false, 'multiple')).toEqual([
      item('qty', 'asc'),
    ]);
    // A column that is one of several goes on from its own direction and drops the others.
    expect(nextSort([item('name', 'desc'), item('qty', 'asc')], 'qty', false, 'multiple')).toEqual([
      item('qty', 'desc'),
    ]);
    expect(nextSort([item('name', 'desc'), item('qty', 'desc')], 'qty', false, 'multiple')).toEqual(
      [],
    );
  });

  it('adds the column, turns it where it is, and removes it after descending, when the press adds', () => {
    const two = nextSort([item('name', 'desc')], 'qty', true, 'multiple');
    expect(two).toEqual([item('name', 'desc'), item('qty', 'asc')]);
    const turned = nextSort([item('qty', 'asc'), item('name', 'desc')], 'qty', true, 'multiple');
    expect(turned).toEqual([item('qty', 'desc'), item('name', 'desc')]);
    expect(nextSort(turned, 'qty', true, 'multiple')).toEqual([item('name', 'desc')]);
  });

  it('ignores the modifiers in single mode', () => {
    expect(nextSort([item('name', 'desc')], 'qty', true, 'single')).toEqual([item('qty', 'asc')]);
  });

  it('does not change the items it is given', () => {
    const items = Object.freeze([item('name', 'asc')]);
    expect(nextSort(items, 'qty', true, 'multiple')).toEqual([
      item('name', 'asc'),
      item('qty', 'asc'),
    ]);
    expect(items).toEqual([item('name', 'asc')]);
  });
});

describe('effectiveSort', () => {
  it('keeps the items that sort, in order, and drops the rest without a word', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const items = [
      { field: 'qty', direction: 'desc' },
      { field: 'nope', direction: 'asc' },
      { field: 'locked', direction: 'asc' },
      { field: 'name', direction: 'sideways' },
      { field: 'qty', direction: 'asc' },
      { field: 'name', direction: 'asc' },
    ] as DataGridSortItem[];
    expect(effectiveSort(items, resolved)).toEqual([
      { field: 'qty', direction: 'desc' },
      { field: 'name', direction: 'asc' },
    ]);
    expect(warn).not.toHaveBeenCalled();
  });
});
