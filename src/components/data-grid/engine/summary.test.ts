import { describe, expect, it, vi } from 'vitest';
import type { DataGridColumn, DataGridSummaryItem } from '../types';
import { resolveColumns } from './columns';
import { computeSummary, resolveSummaryItems, summaryText } from './summary';
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

  it('gives nothing for no items, and does not warn itself', () => {
    expect(resolveSummaryItems([], resolved)).toEqual({ items: [], leftOut: [] });
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
});
