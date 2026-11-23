import { describe, expect, it, vi } from 'vitest';
import type { DataGridColumn, DataGridSummaryItem } from '../types';
import { resolveColumns } from './columns';
import {
  computeSummary,
  remoteSummaryText,
  resolveSummaryItems,
  sameSummary,
  summaryText,
} from './summary';
import type { ResolvedSummaryItem } from './summary';
import { createTextCache } from './values';

interface Order {
  id: string;
  qty: number | null;
  total: number | null;
  placed: string | null;
  at: number | null;
  note: string | null;
}

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'id' },
  { field: 'qty', dataType: 'number' },
  { field: 'total', dataType: 'number', format: { style: 'currency', currency: 'USD' } },
  { field: 'placed', dataType: 'date' },
  { field: 'at', dataType: 'datetime' },
  { field: 'note' },
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
  qty: null,
  total: null,
  placed: null,
  at: null,
  note: null,
  ...patch,
});

const ROWS: Order[] = [
  row('a', { qty: 4, total: 10.5, placed: '2026-11-06', at: Date.UTC(2026, 10, 6, 9), note: 'x' }),
  row('b', { qty: 2, total: 20, placed: '2026-11-04', at: Date.UTC(2026, 10, 4, 9) }),
  row('c', { qty: null, total: 30, placed: null, at: null }),
  row('d', { qty: 10, total: null, placed: '2026-11-05', at: Date.UTC(2026, 10, 5, 9) }),
];

// The items, resolved, in the order of the definitions.
function resolve(...definitions: DataGridSummaryItem<Order>[]): ResolvedSummaryItem<Order>[] {
  return resolveSummaryItems(definitions, resolved).items;
}
function compute(...definitions: DataGridSummaryItem<Order>[]) {
  return computeSummary(ROWS, resolve(...definitions));
}
function text(definition: DataGridSummaryItem<Order>, rows: readonly Order[] = ROWS): string {
  const [item] = resolve(definition);
  const entry = computeSummary(rows, [item!]).get(item!.id);
  return summaryText(item!, entry, { locale: 'en-US', read });
}

describe('resolveSummaryItems', () => {
  it('gives each item an id: its own, else the type and the field, else "custom" and the field', () => {
    const fn = (rows: readonly Order[]) => rows.length;
    const { items } = resolveSummaryItems(
      [
        { column: 'qty', type: 'sum' },
        { column: 'total', field: 'qty', type: 'avg' },
        { id: 'mine', column: 'qty', type: 'max' },
        { column: 'id', field: 'qty', type: fn },
      ],
      resolved,
    );
    expect(items.map((item) => item.id)).toEqual(['sum:qty', 'avg:qty', 'mine', 'custom:qty']);
  });

  it('says the column an item shows in and the column it reads, which is its own by default', () => {
    const { items } = resolveSummaryItems(
      [
        { column: 'qty', type: 'sum' },
        { column: 'total', field: 'qty', type: 'avg', label: 'Mean' },
      ],
      resolved,
    );
    expect(items.map((item) => [item.column, item.source.id])).toEqual([
      ['qty', 'qty'],
      ['total', 'qty'],
    ]);
    expect(items[1]).toMatchObject({ type: 'avg', label: 'Mean', format: undefined });
    expect(items[0]!.source).toBe(resolved.find((column) => column.id === 'qty'));
  });

  it('leaves out an item whose column or field is no column of the grid, and says which', () => {
    const lost = { column: 'nothing', type: 'sum' } as const;
    const lostField = { column: 'qty', field: 'nothing', type: 'sum' } as const;
    const { items, leftOut } = resolveSummaryItems(
      [lost, { column: 'qty', type: 'count' }, lostField],
      resolved,
    );
    expect(items.map((item) => item.id)).toEqual(['count:qty']);
    expect(leftOut).toEqual([lost, lostField]);
  });

  it('says why each item is left out: no column, no usable type, a field that holds no data', () => {
    const noColumn = { column: 'nothing', type: 'sum' } as const;
    const noType = { column: 'qty', type: 'median' } as unknown as DataGridSummaryItem<Order>;
    const noData = { column: 'qty', field: 'flg:select', type: 'sum' } as const;
    const withService = [
      ...resolved,
      { ...resolved[0]!, id: 'flg:select', service: 'select' as const },
    ];
    const { items, leftOut, why } = resolveSummaryItems([noColumn, noType, noData], withService);
    expect(items).toEqual([]);
    expect(leftOut).toEqual([noColumn, noType, noData]);
    expect(why).toEqual({ column: [noColumn], type: [noType], field: [noData] });
  });

  it('keeps the first of two items with one id and leaves the later one out, and says which', () => {
    const first = { id: 'n', column: 'qty', type: 'sum' } as const;
    const later = { id: 'n', column: 'total', type: 'max' } as const;
    // The id a type and a field make is an id like any other.
    const same = { column: 'qty', type: 'count' } as const;
    const { items, leftOut, repeated } = resolveSummaryItems(
      [first, later, same, { ...same, label: 'Again' }],
      resolved,
    );
    expect(items.map((item) => [item.id, item.column])).toEqual([
      ['n', 'qty'],
      ['count:qty', 'qty'],
    ]);
    expect(repeated).toEqual([later, { ...same, label: 'Again' }]);
    expect(leftOut).toEqual([]);
  });

  it('gives nothing for no items, and does not warn itself', () => {
    expect(resolveSummaryItems([], resolved)).toEqual({
      items: [],
      leftOut: [],
      why: { column: [], type: [], field: [] },
      repeated: [],
    });
  });
});

describe('sameSummary', () => {
  const fn = (rows: readonly Order[]) => rows.length;
  it('is the same for items that say the same, functions by identity', () => {
    const a = { total: [{ column: 'qty', type: 'sum', format: { minimumFractionDigits: 1 } }] };
    const b = { total: [{ column: 'qty', type: 'sum', format: { minimumFractionDigits: 1 } }] };
    expect(sameSummary(a as never, b as never)).toBe(true);
    expect(
      sameSummary({ group: [{ column: 'id', type: fn }] }, { group: [{ column: 'id', type: fn }] }),
    ).toBe(true);
    expect(sameSummary(undefined, undefined)).toBe(true);
    expect(sameSummary({}, { total: [], group: [] })).toBe(true);
  });

  it('is not the same when a field, a function, a list or an Intl option differs', () => {
    const base = { total: [{ column: 'qty', type: 'sum' }] } as const;
    expect(sameSummary(base, { total: [{ column: 'total', type: 'sum' }] })).toBe(false);
    expect(sameSummary(base, { total: [{ column: 'qty', type: 'sum', label: 'T' }] })).toBe(false);
    expect(sameSummary(base, { group: base.total })).toBe(false);
    expect(
      sameSummary(
        { group: [{ column: 'id', type: fn }] },
        { group: [{ column: 'id', type: (r) => r.length }] },
      ),
    ).toBe(false);
    expect(
      sameSummary(
        { total: [{ column: 'qty', type: 'sum', format: { style: 'percent' } }] },
        { total: [{ column: 'qty', type: 'sum', format: { style: 'decimal' } }] },
      ),
    ).toBe(false);
    expect(sameSummary(base, undefined)).toBe(false);
  });
});

describe('computeSummary', () => {
  it('counts the rows, blanks included', () => {
    expect(compute({ column: 'qty', type: 'count' }).get('count:qty')).toEqual({
      value: 4,
      row: undefined,
    });
  });

  it('sums the numbers of the field and skips the rest', () => {
    expect(compute({ column: 'qty', type: 'sum' }).get('sum:qty')!.value).toBe(16);
    // A string column holds no number to sum.
    expect(compute({ column: 'note', type: 'sum' }).get('sum:note')!.value).toBe(0);
  });

  it('gives 0 for the sum of no number, and no value for the average of none', () => {
    const none = [row('a'), row('b')];
    const items = resolve({ column: 'qty', type: 'sum' }, { column: 'qty', type: 'avg' });
    const values = computeSummary(none, items);
    expect(values.get('sum:qty')!.value).toBe(0);
    expect(values.get('avg:qty')!.value).toBeNull();
    expect(computeSummary([], items).get('sum:qty')!.value).toBe(0);
  });

  it('averages the numbers that are there, not all the rows', () => {
    expect(compute({ column: 'qty', type: 'avg' }).get('avg:qty')!.value).toBeCloseTo(16 / 3);
  });

  it('finds the least and the greatest number, and keeps the row that holds it', () => {
    const values = compute({ column: 'qty', type: 'min' }, { column: 'qty', type: 'max' });
    expect(values.get('min:qty')).toEqual({ value: 2, row: ROWS[1] });
    expect(values.get('max:qty')).toEqual({ value: 10, row: ROWS[3] });
  });

  it('finds the least and the greatest date and datetime, and keeps the row', () => {
    const values = compute(
      { column: 'placed', type: 'min' },
      { column: 'placed', type: 'max' },
      { column: 'at', type: 'max' },
    );
    expect(values.get('min:placed')).toEqual({ value: Date.UTC(2026, 10, 4), row: ROWS[1] });
    expect(values.get('max:placed')).toEqual({ value: Date.UTC(2026, 10, 6), row: ROWS[0] });
    expect(values.get('max:at')).toEqual({ value: Date.UTC(2026, 10, 6, 9), row: ROWS[0] });
  });

  it('keeps the first row that holds the value when two do', () => {
    const rows = [row('a', { qty: 3 }), row('b', { qty: 3 })];
    const [min, max] = resolve({ column: 'qty', type: 'min' }, { column: 'qty', type: 'max' });
    const values = computeSummary(rows, [min!, max!]);
    expect(values.get('min:qty')!.row).toBe(rows[0]);
    expect(values.get('max:qty')!.row).toBe(rows[0]);
  });

  it('has no value and no row for the least of nothing, or of a column that has no order of numbers', () => {
    const items = resolve({ column: 'qty', type: 'min' }, { column: 'note', type: 'max' });
    const empty = computeSummary([row('a')], items);
    expect(empty.get('min:qty')).toEqual({ value: null, row: undefined });
    // A string column has no least or greatest to total.
    expect(computeSummary(ROWS, items).get('max:note')).toEqual({ value: null, row: undefined });
  });

  it('calls a function type with every row, and keeps what it returns', () => {
    const fn = vi.fn((rows: readonly Order[]) => `${rows.length} rows`);
    const [item] = resolve({ column: 'id', type: fn });
    const values = computeSummary(ROWS, [item!]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0]![0]).toEqual(ROWS);
    expect(values.get('custom:id')).toEqual({ value: '4 rows', row: undefined });
  });

  it('computes every item over one set of rows, each under its id', () => {
    const values = compute(
      { column: 'qty', type: 'count' },
      { column: 'qty', type: 'sum' },
      { column: 'total', type: 'max' },
    );
    expect([...values.keys()]).toEqual(['count:qty', 'sum:qty', 'max:total']);
  });

  it('does not change the rows', () => {
    const copy = [...ROWS];
    compute({ column: 'qty', type: 'sum' });
    expect(ROWS).toEqual(copy);
  });
});

describe('summaryText', () => {
  it('writes a count as a whole number, in the grid locale', () => {
    expect(text({ column: 'qty', type: 'count' })).toBe('4');
    const many = Array.from({ length: 1234 }, (_, index) => row(String(index)));
    expect(text({ column: 'qty', type: 'count' }, many)).toBe('1,234');
  });

  it('writes a sum as the column writes a number: with its Intl options, else the locale default', () => {
    expect(text({ column: 'total', type: 'sum' })).toBe('$60.50');
    expect(text({ column: 'qty', type: 'sum' })).toBe('16');
    expect(text({ column: 'qty', type: 'avg' })).toBe('5.333');
  });

  it('writes a sum with the Intl options or the function of the item when it has one', () => {
    expect(text({ column: 'qty', type: 'sum', format: { minimumFractionDigits: 2 } })).toBe(
      '16.00',
    );
    expect(text({ column: 'qty', type: 'sum', format: (value) => `${String(value)} pcs` })).toBe(
      '16 pcs',
    );
  });

  it('writes a least or greatest as the text of the row that holds it', () => {
    expect(text({ column: 'total', type: 'max' })).toBe('$30.00');
    expect(text({ column: 'placed', type: 'min' })).toBe('11/04/2026');
    expect(text({ column: 'qty', type: 'max' })).toBe('10');
  });

  it('writes a least or greatest with the format of the item when it has one', () => {
    expect(text({ column: 'qty', type: 'max', format: (value) => `<${String(value)}>` })).toBe(
      '<10>',
    );
  });

  it('writes the value of a function type with the format of the item, else as a string', () => {
    expect(text({ column: 'id', type: (rows) => rows.length })).toBe('4');
    expect(
      text({ column: 'id', type: (rows) => rows.length, format: (v) => `n=${String(v)}` }),
    ).toBe('n=4');
    expect(text({ column: 'id', type: () => null })).toBe('');
  });

  it('writes nothing for a blank: the average or least of no number, and a missing value', () => {
    const none = [row('a')];
    expect(text({ column: 'qty', type: 'avg' }, none)).toBe('');
    expect(text({ column: 'qty', type: 'min' }, none)).toBe('');
    const [item] = resolve({ column: 'qty', type: 'sum' });
    expect(summaryText(item!, undefined, { locale: 'en-US', read })).toBe('');
  });

  it('never throws on Intl options it cannot use: the number is written as the locale writes it', () => {
    const bad = { style: 'currency' } as Intl.NumberFormatOptions;
    expect(text({ column: 'qty', type: 'sum', format: bad })).toBe('16');
  });

  it('writes the total of a column whose format is a function as the locale, or by the format of the item', () => {
    // A function needs a row, and a total has none: the column's own words cannot write it.
    const own = resolveColumns<Order>(
      [{ field: 'total', dataType: 'number', format: (value) => `<${String(value)}>` }],
      OPTIONS,
    );
    const [item] = resolveSummaryItems([{ column: 'total', type: 'sum' }], own).items;
    const [formatted] = resolveSummaryItems(
      [{ column: 'total', type: 'sum', format: (value) => `= ${String(value)}` }],
      own,
    ).items;
    const entry = { value: 1234.5, row: undefined };
    expect(summaryText(item!, entry, { locale: 'en-US', read })).toBe('1,234.5');
    expect(summaryText(formatted!, entry, { locale: 'en-US', read })).toBe('= 1234.5');
  });
});

describe('remoteSummaryText', () => {
  const item = (definition: DataGridSummaryItem<Order>) => resolve(definition)[0]!;
  const written = (definition: DataGridSummaryItem<Order>, value: unknown) =>
    remoteSummaryText(item(definition), value, 'en-US');

  it('writes the value the server gave as the item, else the column, writes a value', () => {
    expect(written({ column: 'total', type: 'sum' }, 60.5)).toBe('$60.50');
    expect(written({ column: 'qty', type: 'count' }, 1234)).toBe('1,234');
    expect(written({ column: 'qty', type: 'sum', format: (value) => `#${String(value)}` }, 3)).toBe(
      '#3',
    );
    expect(written({ column: 'placed', type: 'min' }, '2026-11-04')).toBe('11/04/2026');
  });

  it('writes a value of a function type as a string, and nothing for a blank', () => {
    expect(written({ column: 'id', type: () => 0 }, 'many')).toBe('many');
    expect(written({ column: 'qty', type: 'sum' }, null)).toBe('');
    expect(written({ column: 'qty', type: 'sum' }, undefined)).toBe('');
  });
});
