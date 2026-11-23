import { describe, expect, it } from 'vitest';
import { collator } from '../../../internal/intl';
import type { DataGridColumn } from '../types';
import { resolveColumns } from './columns';
import { compareListed, keySortKey, listedValue } from './listing';
import { createTextCache } from './values';

interface Order {
  id: string;
  customer: string | null;
  status: number | null;
  total: number | null;
  placed: string | null;
  at: number | null;
  paid: boolean | null;
}

const STATUSES = [
  { code: 1, name: 'New' },
  { code: 2, name: 'Delivered' },
  { code: 3, name: 'Cancelled' },
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

const ROW: Order = {
  id: 'DH-1',
  customer: 'Bình',
  status: 2,
  total: 1234,
  placed: '2026-11-05',
  at: Date.UTC(2026, 10, 5, 20, 30),
  paid: true,
};

// One column of the given definition, resolved in the given zone.
function column(definition: DataGridColumn<Order>, timeZone = 'UTC') {
  return resolveColumns<Order>([definition], { ...OPTIONS, timeZone })[0]!;
}

const read = createTextCache<Order>();
const listed = (row: Order, definition: DataGridColumn<Order>, timeZone?: string) =>
  listedValue(row, column(definition, timeZone), read);

describe('listedValue', () => {
  it('lists a string by itself: its key, its text and its order', () => {
    expect(listed(ROW, { field: 'customer' })).toEqual({
      key: 'Bình',
      text: 'Bình',
      sortKey: 'Bình',
    });
  });

  it('lists a number by its value, written as the cells write it', () => {
    expect(listed(ROW, { field: 'total', dataType: 'number' })).toEqual({
      key: 1234,
      text: '1,234',
      sortKey: 1234,
    });
  });

  it('lists a date by its ISO day, written as the cells write it, and orders it by its time', () => {
    expect(listed(ROW, { field: 'placed', dataType: 'date' })).toEqual({
      key: '2026-11-05',
      text: '11/05/2026',
      sortKey: Date.UTC(2026, 10, 5),
    });
  });

  it('lists a datetime by the day it falls on in the zone of its cells, written as that day', () => {
    const definition: DataGridColumn<Order> = { field: 'at', dataType: 'datetime' };
    // 20:30 UTC on the 5th is 03:30 on the 6th in Hanoi, and 12:30 on the 5th in Los Angeles.
    expect(listed(ROW, definition, 'Asia/Ho_Chi_Minh')).toEqual({
      key: '2026-11-06',
      text: '11/06/2026',
      sortKey: Date.UTC(2026, 10, 6),
    });
    expect(listed(ROW, definition, 'America/Los_Angeles')).toEqual({
      key: '2026-11-05',
      text: '11/05/2026',
      sortKey: Date.UTC(2026, 10, 5),
    });
  });

  it('orders a datetime by its day, and not by the sortValue of its instant', () => {
    const backwards: DataGridColumn<Order> = {
      field: 'at',
      dataType: 'datetime',
      sortValue: (row) => -(row.at ?? 0),
    };
    expect(listed(ROW, backwards).sortKey).toBe(Date.UTC(2026, 10, 5));
  });

  it('lists a boolean by its value, written as the words of the grid, and orders false first', () => {
    expect(listed(ROW, { field: 'paid', dataType: 'boolean' })).toEqual({
      key: true,
      text: 'Yes',
      sortKey: 1,
    });
    expect(listed({ ...ROW, paid: false }, { field: 'paid', dataType: 'boolean' })).toEqual({
      key: false,
      text: 'No',
      sortKey: 0,
    });
  });

  it('lists a lookup by the raw value, written as its text, and orders it by that text', () => {
    const lookup: DataGridColumn<Order> = {
      field: 'status',
      dataType: 'number',
      lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
    };
    expect(listed(ROW, lookup)).toEqual({ key: 2, text: 'Delivered', sortKey: 'Delivered' });
  });

  it('orders a column by its sortValue when it has one', () => {
    const lookup: DataGridColumn<Order> = {
      field: 'status',
      dataType: 'number',
      lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
      sortValue: (row) => row.status,
    };
    expect(listed(ROW, lookup)).toEqual({ key: 2, text: 'Delivered', sortKey: 2 });
  });

  it('writes the key when the text of a value is empty', () => {
    const silent: DataGridColumn<Order> = { field: 'customer', format: () => '' };
    expect(listed(ROW, silent)).toEqual({ key: 'Bình', text: 'Bình', sortKey: 'Bình' });
  });

  it('lists a blank by no key, no text and no place in the order', () => {
    expect(listed({ ...ROW, customer: null }, { field: 'customer' })).toEqual({
      key: null,
      text: '',
      sortKey: null,
    });
    expect(listed({ ...ROW, at: null }, { field: 'at', dataType: 'datetime' })).toEqual({
      key: null,
      text: '',
      sortKey: null,
    });
  });
});

describe('keySortKey', () => {
  it('orders a value no row holds as the column orders its rows', () => {
    expect(keySortKey(column({ field: 'total', dataType: 'number' }), 7, '7')).toBe(7);
    expect(keySortKey(column({ field: 'paid', dataType: 'boolean' }), false, 'No')).toBe(0);
    expect(keySortKey(column({ field: 'placed', dataType: 'date' }), '2026-11-05', '')).toBe(
      Date.UTC(2026, 10, 5),
    );
    expect(keySortKey(column({ field: 'customer' }), 'An', 'An')).toBe('An');
    const lookup = column({
      field: 'status',
      dataType: 'number',
      lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
    });
    expect(keySortKey(lookup, 3, 'Cancelled')).toBe('Cancelled');
    expect(keySortKey(lookup, 9, '')).toBeNull();
  });
});

describe('compareListed', () => {
  const compareText = collator('en-US', { numeric: true }).compare;

  it('orders numbers as numbers and strings by the collator', () => {
    expect(compareListed(2, 10, compareText)).toBeLessThan(0);
    expect(compareListed('DH-10', 'DH-2', compareText)).toBeGreaterThan(0);
    expect(compareListed('a', 'a', compareText)).toBe(0);
  });

  it('puts numbers before strings, so a mixed column orders the same way every time', () => {
    expect(compareListed(5, 'a', compareText)).toBeLessThan(0);
    expect(compareListed('a', 5, compareText)).toBeGreaterThan(0);
  });

  it('puts a blank after every other value and ties two blanks', () => {
    expect(compareListed(null, 1, compareText)).toBeGreaterThan(0);
    expect(compareListed('z', null, compareText)).toBeLessThan(0);
    expect(compareListed(null, null, compareText)).toBe(0);
  });
});
