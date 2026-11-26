import { describe, expect, it } from 'vitest';
import type { DataGridColumn } from '../types';
import { resolveColumns } from './columns';
import { editorKind, fromEditorValue, toEditorValue } from './editor-values';

interface Order {
  id: string;
  customer: string | null;
  qty: number | null;
  placed: string | Date | null;
  paid: boolean;
  status: number | null;
  channel: string | null;
}

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
const STATUSES = [
  { id: 1, name: 'New' },
  { id: 2, name: 'Processing' },
  { id: 3, name: 'Delivered' },
];
const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'customer' },
  { field: 'qty', dataType: 'number' },
  { field: 'placed', dataType: 'date' },
  { field: 'paid', dataType: 'boolean' },
  { field: 'status', lookup: { items: STATUSES, valueField: 'id', displayField: 'name' } },
];
const [customer, qty, placed, paid, status] = resolveColumns(COLUMNS, OPTIONS);
const ROW: Order = {
  id: 'a',
  customer: 'An',
  qty: 3,
  placed: '2026-11-05',
  paid: true,
  status: 2,
  channel: null,
};

describe('editorKind', () => {
  it('picks the editor by the type of the column and by its lookup', () => {
    expect(editorKind(customer!)).toBe('string');
    expect(editorKind(qty!)).toBe('number');
    expect(editorKind(placed!)).toBe('date');
    expect(editorKind(paid!)).toBe('boolean');
    expect(editorKind(status!)).toBe('select');
  });

  it('is a Combobox above twenty items, and searchable forces one or the other', () => {
    const items = Array.from({ length: 21 }, (_, index) => ({ id: index, name: `Item ${index}` }));
    const make = (searchable?: boolean) =>
      resolveColumns<Order>(
        [
          {
            field: 'status',
            lookup: { items, valueField: 'id', displayField: 'name', searchable },
          },
        ],
        OPTIONS,
      )[0]!;
    expect(editorKind(make())).toBe('combobox');
    expect(editorKind(make(false))).toBe('select');
    const few = resolveColumns<Order>(
      [
        {
          field: 'status',
          lookup: { items: STATUSES, valueField: 'id', displayField: 'name', searchable: true },
        },
      ],
      OPTIONS,
    )[0]!;
    expect(editorKind(few)).toBe('combobox');
    const twenty = resolveColumns<Order>(
      [
        {
          field: 'status',
          lookup: { items: items.slice(0, 20), valueField: 'id', displayField: 'name' },
        },
      ],
      OPTIONS,
    )[0]!;
    expect(editorKind(twenty)).toBe('select');
  });

  it('is none for a datetime, which has an editor of the caller or none', () => {
    const [at] = resolveColumns<Order>(
      [{ id: 'at', dataType: 'datetime', value: () => 0 }],
      OPTIONS,
    );
    expect(editorKind(at!)).toBeNull();
  });
});

describe('toEditorValue', () => {
  it('writes a string as the string, and a blank as the empty string', () => {
    expect(toEditorValue(customer!, ROW)).toBe('An');
    expect(toEditorValue(customer!, { ...ROW, customer: null })).toBe('');
  });

  it('writes a number as the number, and a blank as null', () => {
    expect(toEditorValue(qty!, ROW)).toBe(3);
    expect(toEditorValue(qty!, { ...ROW, qty: null })).toBeNull();
  });

  it('writes a date as its ISO day, from a string or from a Date', () => {
    expect(toEditorValue(placed!, ROW)).toBe('2026-11-05');
    expect(toEditorValue(placed!, { ...ROW, placed: new Date(Date.UTC(2026, 10, 5)) })).toBe(
      '2026-11-05',
    );
    expect(toEditorValue(placed!, { ...ROW, placed: null })).toBeNull();
  });

  it('writes a boolean as a boolean, and a blank as false', () => {
    expect(toEditorValue(paid!, ROW)).toBe(true);
    expect(toEditorValue(paid!, { ...ROW, paid: false })).toBe(false);
  });

  it('writes a lookup value as the string of the item value, and a value no item has as null', () => {
    expect(toEditorValue(status!, ROW)).toBe('2');
    expect(toEditorValue(status!, { ...ROW, status: null })).toBeNull();
  });
});

describe('fromEditorValue', () => {
  it('gives a string and a number back as they are', () => {
    expect(fromEditorValue(customer!, 'Bình', ROW)).toBe('Bình');
    expect(fromEditorValue(qty!, 7, ROW)).toBe(7);
    expect(fromEditorValue(qty!, null, ROW)).toBeNull();
  });

  it('gives a day back as an ISO day when the row held a string, and null for none', () => {
    expect(fromEditorValue(placed!, '2026-12-01', ROW)).toBe('2026-12-01');
    expect(fromEditorValue(placed!, null, ROW)).toBeNull();
  });

  it('gives a day back as a Date when the row held a Date: the midnight of the day the cells show (UTC)', () => {
    const held = { ...ROW, placed: new Date(Date.UTC(2026, 10, 5)) };
    const back = fromEditorValue(placed!, '2026-12-01', held);
    expect(back).toBeInstanceOf(Date);
    expect((back as Date).getTime()).toBe(Date.UTC(2026, 11, 1));
    // The cell reads it as the same day: no zone moves it.
    expect(toEditorValue(placed!, { ...ROW, placed: back as Date })).toBe('2026-12-01');
  });

  it('gives a lookup string back as the value the item has, whatever its type', () => {
    expect(fromEditorValue(status!, '3', ROW)).toBe(3);
    expect(fromEditorValue(status!, null, ROW)).toBeNull();
    expect(fromEditorValue(status!, 'nope', ROW)).toBeNull();
  });
});
