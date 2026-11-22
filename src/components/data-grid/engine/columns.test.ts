import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../../internal/warn';
import { dataGridColumn } from '../data-grid-column';
import type { DataGridColumn } from '../types';
import {
  GROUP_INDENT_WIDTH,
  checkFields,
  groupedOut,
  indentColumn,
  isDataColumn,
  isPlaceColumn,
  resolveColumns,
  selectColumn,
} from './columns';
import type { ResolvedColumn } from './columns';

interface Order {
  id: string;
  customer: string;
  status: number | null;
  total: number | null;
  placed: string | null;
  at: number | null;
  paid: boolean;
  qty: number;
}

const ROW: Order = {
  id: 'DH-1',
  customer: 'An',
  status: 2,
  total: 1250000,
  placed: '2026-11-05',
  at: Date.UTC(2026, 10, 5, 20, 30),
  paid: true,
  qty: 3,
};

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
  { code: 1, name: 'New' },
  { code: 2, name: 'Delivered' },
];

function resolve(columns: readonly DataGridColumn<Order>[], options = {}) {
  return resolveColumns(columns, { ...OPTIONS, ...options });
}

function only(columns: readonly DataGridColumn<Order>[], options = {}): ResolvedColumn<Order> {
  const resolved = resolve(columns, options);
  expect(resolved).toHaveLength(1);
  return resolved[0]!;
}

function warnings(spy: MockInstance): string[] {
  return spy.mock.calls.map(([message]) => String(message));
}

describe('resolveColumns', () => {
  let warn: MockInstance;
  beforeEach(() => {
    resetDevWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  describe('what a column becomes', () => {
    it('keeps the side it is pinned to and whether it is hidden, the start of its layout', () => {
      expect(only([{ field: 'customer', pinned: 'left' }]).pinned).toBe('left');
      expect(only([{ field: 'customer', pinned: 'right' }]).pinned).toBe('right');
      expect(only([{ field: 'customer', visible: false }]).visible).toBe(false);
      expect(only([{ field: 'customer', visible: true }]).visible).toBe(true);
    });

    it('takes a pin outside the union for none and a visible that is not false for shown, silently', () => {
      const odd = [
        { field: 'customer', pinned: 'top', visible: 'no' },
      ] as unknown as DataGridColumn<Order>[];
      expect(only(odd).pinned).toBeUndefined();
      expect(only(odd).visible).toBe(true);
      expect(warn).not.toHaveBeenCalled();
    });

    it('takes the id from the field, and the caption from the id', () => {
      const column = only([{ field: 'customer' }]);
      expect(column.id).toBe('customer');
      expect(column.caption).toBe('customer');
      expect(column.dataType).toBe('string');
      expect(column.minWidth).toBe(60);
      expect(column.width).toBeUndefined();
      expect(column.rowHeader).toBe(false);
      expect(column.pinned).toBeUndefined();
      expect(column.visible).toBe(true);
      expect(column.info).toEqual({
        id: 'customer',
        caption: 'customer',
        dataType: 'string',
        align: 'start',
      });
      expect(warn).not.toHaveBeenCalled();
    });

    it('lets a field column carry an id of its own, so one field can be shown twice', () => {
      const resolved = resolve([
        { field: 'total', caption: 'Total' },
        { field: 'total', id: 'total-copy', caption: 'Copy' },
      ]);
      expect(resolved.map((column) => column.id)).toEqual(['total', 'total-copy']);
      expect(resolved[1]!.value(ROW)).toBe(1250000);
    });

    it('reads a computed column by its value function', () => {
      const column = only([{ id: 'amount', value: (row) => row.qty * 2, dataType: 'number' }]);
      expect(column.id).toBe('amount');
      expect(column.value(ROW)).toBe(6);
      expect(column.text(ROW)).toBe('6');
    });

    it('keeps the caller object, the cell function and the given sizes', () => {
      const cell = () => null;
      const given: DataGridColumn<Order> = {
        field: 'customer',
        caption: 'Customer',
        width: 248,
        minWidth: 120,
        cell,
      };
      const column = only([given]);
      expect(column.column).toBe(given);
      expect(column.cell).toBe(cell);
      expect(column.caption).toBe('Customer');
      expect(column.width).toBe(248);
      expect(column.minWidth).toBe(120);
    });

    it('aligns by type: numbers to the end, booleans to the centre, the rest to the start', () => {
      const align = (column: DataGridColumn<Order>) => only([column]).align;
      expect(align({ field: 'total', dataType: 'number' })).toBe('end');
      expect(align({ field: 'paid', dataType: 'boolean' })).toBe('center');
      expect(align({ field: 'customer' })).toBe('start');
      expect(align({ field: 'placed', dataType: 'date' })).toBe('start');
      expect(align({ field: 'at', dataType: 'datetime' })).toBe('start');
      // A lookup shows words, even over a number.
      expect(
        align({
          field: 'status',
          dataType: 'number',
          lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
        }),
      ).toBe('start');
      // The column's own align wins.
      expect(align({ field: 'total', dataType: 'number', align: 'center' })).toBe('center');
    });

    it('takes a data type outside the union as a string, without a cast', () => {
      const column = only([
        { field: 'total', dataType: 'money' } as unknown as DataGridColumn<Order>,
      ]);
      expect(column.dataType).toBe('string');
      expect(column.info.dataType).toBe('string');
    });

    it('lets the column decide whether it sorts, and the grid decide when it does not', () => {
      const given = resolve([{ field: 'customer' }, { field: 'qty', allowSorting: false }]);
      expect(given.map((column) => column.allowSorting)).toEqual([true, false]);
      const off = resolve([{ field: 'customer' }, { field: 'qty', allowSorting: true }], {
        allowSorting: false,
      });
      expect(off.map((column) => column.allowSorting)).toEqual([false, true]);
    });

    it('lets the column decide whether it groups, and the grid decide when it does not', () => {
      const given = resolve([{ field: 'customer' }, { field: 'qty', allowGrouping: false }]);
      expect(given.map((column) => column.allowGrouping)).toEqual([true, false]);
      const off = resolve([{ field: 'customer' }, { field: 'qty', allowGrouping: true }], {
        allowGrouping: false,
      });
      expect(off.map((column) => column.allowGrouping)).toEqual([false, true]);
    });

    it('keeps a grouped column shown only when it says so with true', () => {
      const [plain, shown, odd] = resolve([
        { field: 'customer' },
        { field: 'qty', showWhenGrouped: true },
        { field: 'total', showWhenGrouped: 'yes' } as unknown as DataGridColumn<Order>,
      ]);
      expect([plain!.showWhenGrouped, shown!.showWhenGrouped, odd!.showWhenGrouped]).toEqual([
        false,
        true,
        false,
      ]);
    });

    it('lets the column decide whether it resizes, and the grid decide when it does not', () => {
      const given = resolve([{ field: 'customer' }, { field: 'qty', allowResizing: false }]);
      expect(given.map((column) => column.allowResizing)).toEqual([true, false]);
      const off = resolve([{ field: 'customer' }, { field: 'qty', allowResizing: true }], {
        allowResizing: false,
      });
      expect(off.map((column) => column.allowResizing)).toEqual([false, true]);
    });

    it('takes a value that is no boolean for no answer of the column', () => {
      const [column] = resolve([
        { field: 'customer', allowResizing: 'no' } as unknown as DataGridColumn<Order>,
      ]);
      expect(column!.allowResizing).toBe(true);
    });

    it('lets the column decide whether it moves, and the grid decide when it does not', () => {
      const given = resolve([{ field: 'customer' }, { field: 'qty', allowReordering: false }]);
      expect(given.map((column) => column.allowReordering)).toEqual([true, false]);
      const off = resolve([{ field: 'customer' }, { field: 'qty', allowReordering: true }], {
        allowReordering: false,
      });
      expect(off.map((column) => column.allowReordering)).toEqual([false, true]);
    });

    it('takes a value that is no boolean for no answer of the column to move', () => {
      const [column] = resolve([
        { field: 'customer', allowReordering: 'no' } as unknown as DataGridColumn<Order>,
      ]);
      expect(column!.allowReordering).toBe(true);
    });

    it('lets the column decide whether it is pinned from the menu, and the grid decide when it does not', () => {
      const given = resolve([{ field: 'customer' }, { field: 'qty', allowPinning: false }]);
      expect(given.map((column) => column.allowPinning)).toEqual([true, false]);
      const off = resolve([{ field: 'customer' }, { field: 'qty', allowPinning: true }], {
        allowPinning: false,
      });
      expect(off.map((column) => column.allowPinning)).toEqual([false, true]);
    });

    it('lets the column decide whether it can be hidden, and the grid decide when it does not', () => {
      const given = resolve([{ field: 'customer' }, { field: 'qty', allowHiding: false }]);
      expect(given.map((column) => column.allowHiding)).toEqual([true, false]);
      const off = resolve([{ field: 'customer' }, { field: 'qty', allowHiding: true }], {
        allowHiding: false,
      });
      expect(off.map((column) => column.allowHiding)).toEqual([false, true]);
    });

    it('takes a value that is no boolean for no answer of the column to pin or hide', () => {
      const [column] = resolve([
        {
          field: 'customer',
          allowPinning: 'no',
          allowHiding: 'no',
        } as unknown as DataGridColumn<Order>,
      ]);
      expect([column!.allowPinning, column!.allowHiding]).toEqual([true, true]);
    });

    it('treats the first row header as the one, and warns about the others', () => {
      const resolved = resolve([
        { field: 'id', rowHeader: true },
        { field: 'customer', rowHeader: true },
      ]);
      expect(resolved.map((column) => column.rowHeader)).toEqual([true, false]);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> more than one column is a row header; only the first is.`,
      ]);
    });
  });

  describe('columns it leaves out', () => {
    it('drops a column with neither a field nor an id with a value, with one warning', () => {
      const resolved = resolve([
        { field: 'customer' },
        { id: 'broken' } as unknown as DataGridColumn<Order>,
        { value: () => 1 } as unknown as DataGridColumn<Order>,
        null as unknown as DataGridColumn<Order>,
      ]);
      expect(resolved.map((column) => column.id)).toEqual(['customer']);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a column has neither a field nor an id with a value function; it is left out.`,
      ]);
    });

    it('drops the second of two columns with the same id', () => {
      const first: DataGridColumn<Order> = { field: 'customer', caption: 'First' };
      const resolved = resolve([first, { field: 'customer', caption: 'Second' }]);
      expect(resolved).toHaveLength(1);
      expect(resolved[0]!.column).toBe(first);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> two columns have the same id; the second is left out.`,
      ]);
    });

    it('drops a column whose id starts with flg:, which is the grid’s own', () => {
      const resolved = resolve([
        { id: 'flg:select', value: () => 1 },
        { field: 'customer', id: 'flg:mine' },
        { field: 'qty' },
      ]);
      expect(resolved.map((column) => column.id)).toEqual(['qty']);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a column id starts with "flg:", which is for the grid's own columns; the column is left out.`,
      ]);
    });

    it('does not touch what it is given', () => {
      const columns: DataGridColumn<Order>[] = [{ field: 'customer' }, { field: 'customer' }];
      const copy = [...columns];
      resolve(columns);
      expect(columns).toEqual(copy);
    });
  });

  describe('widths', () => {
    it('makes a column flexible, with a warning, when its width is not a number above 0', () => {
      for (const width of [0, -10, Number.NaN, Infinity, '120' as unknown as number]) {
        expect(only([{ field: 'customer', width }]).width).toBeUndefined();
      }
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a column width is not a finite number above 0; the column is flexible.`,
      ]);
    });

    it('uses 60 for a minWidth that is not a number above 0, with a warning', () => {
      expect(only([{ field: 'customer', minWidth: -5 }]).minWidth).toBe(60);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a column minWidth is not a finite number above 0; 60 is used.`,
      ]);
    });
  });

  describe('text', () => {
    it('writes each type as its default format does, in the locale', () => {
      const column = (field: keyof Order, dataType: DataGridColumn<Order>['dataType']) =>
        only([{ field, dataType } as DataGridColumn<Order>]);
      expect(column('customer', 'string').text(ROW)).toBe('An');
      expect(column('total', 'number').text(ROW)).toBe(
        new Intl.NumberFormat('en-US').format(1250000),
      );
      expect(column('placed', 'date').text(ROW)).toBe('11/05/2026');
      expect(column('at', 'datetime').text(ROW)).toBe(
        new Intl.DateTimeFormat('en-US', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'UTC',
        }).format(ROW.at!),
      );
      expect(column('paid', 'boolean').text(ROW)).toBe('Yes');
      expect(column('paid', 'boolean').text({ ...ROW, paid: false })).toBe('No');
    });

    it('writes in vi-VN, and a datetime in the zone it is given', () => {
      const vi = { locale: 'vi-VN', timeZone: 'Asia/Ho_Chi_Minh' };
      expect(only([{ field: 'placed', dataType: 'date' }], vi).text(ROW)).toBe('05/11/2026');
      expect(only([{ field: 'at', dataType: 'datetime' }], vi).text(ROW)).toBe(
        new Intl.DateTimeFormat('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
          timeZone: 'Asia/Ho_Chi_Minh',
        }).format(ROW.at!),
      );
    });

    it('applies the Intl options of the column', () => {
      const options = { style: 'currency', currency: 'VND' } as const;
      const column = only([{ field: 'total', dataType: 'number', format: options }], {
        locale: 'vi-VN',
      });
      expect(column.text(ROW)).toBe(new Intl.NumberFormat('vi-VN', options).format(1250000));
    });

    it('is empty for a blank value and never calls a format function on one', () => {
      const format = vi.fn((value: number | null) => `#${value}`);
      const column = only([{ field: 'total', dataType: 'number', format }]);
      expect(column.text({ ...ROW, total: null })).toBe('');
      expect(format).not.toHaveBeenCalled();
      expect(column.text(ROW)).toBe('#1250000');
    });

    it('calls a format function with the raw value and the row', () => {
      const format = vi.fn((value: number | null, row: Order) => `${row.id}=${value}`);
      expect(only([{ field: 'total', dataType: 'number', format }]).text(ROW)).toBe('DH-1=1250000');
      expect(format).toHaveBeenCalledWith(1250000, ROW);
    });

    it('writes the text of a value the type refuses as blank', () => {
      const column = only([{ field: 'total', dataType: 'number' }]);
      expect(column.text({ ...ROW, total: 'abc' as unknown as number })).toBe('');
    });
  });

  describe('Intl options the constructor rejects', () => {
    it('falls back to the default format with one warning, however many cells it writes', () => {
      const column = only([{ field: 'total', dataType: 'number', format: { style: 'currency' } }]);
      const text = new Intl.NumberFormat('en-US').format(1250000);
      for (let i = 0; i < 5; i++) expect(column.text(ROW)).toBe(text);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a column format is not valid Intl options; the default format is used.`,
      ]);
    });

    it('does the same for a date and a datetime column', () => {
      const date = only([
        { field: 'placed', dataType: 'date', format: { dateStyle: 'nope' } },
      ] as never);
      const datetime = only([
        { field: 'at', dataType: 'datetime', format: { dateStyle: 'short', hour: 'numeric' } },
      ]);
      expect(date.text(ROW)).toBe('11/05/2026');
      expect(datetime.text(ROW)).not.toBe('');
      expect(warnings(warn)).toHaveLength(1);
    });

    it('uses UTC, with a warning, for a time zone Intl does not know', () => {
      const column = only([{ field: 'at', dataType: 'datetime' }], { timeZone: 'Mars/Olympus' });
      expect(column.text(ROW)).toBe(only([{ field: 'at', dataType: 'datetime' }]).text(ROW));
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> timeZone is not a time zone Intl knows; "UTC" is used.`,
      ]);
    });
  });

  describe('lookup', () => {
    const lookup = { items: STATUSES, valueField: 'code', displayField: 'name' };

    it('shows the display field of the item whose value field equals the value', () => {
      const column = only([{ field: 'status', dataType: 'number', lookup }]);
      expect(column.text(ROW)).toBe('Delivered');
      expect(column.text({ ...ROW, status: 1 })).toBe('New');
    });

    it('shows nothing, and says nothing, for a value that no item has', () => {
      const column = only([{ field: 'status', dataType: 'number', lookup }]);
      expect(column.text({ ...ROW, status: 99 })).toBe('');
      expect(column.text({ ...ROW, status: null })).toBe('');
      expect(warn).not.toHaveBeenCalled();
    });

    it('lets a format function win over the lookup, and ignores Intl options', () => {
      const withFormat = only([
        { field: 'status', dataType: 'number', lookup, format: (value) => `code ${value}` },
      ]);
      expect(withFormat.text(ROW)).toBe('code 2');
      const withOptions = only([
        {
          field: 'status',
          dataType: 'number',
          lookup,
          format: { style: 'currency', currency: 'VND' },
        },
      ]);
      expect(withOptions.text(ROW)).toBe('Delivered');
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns when the first item lacks the value field or the display field', () => {
      only([
        {
          field: 'status',
          lookup: { items: [{ code: 1 }], valueField: 'code', displayField: 'name' },
        },
      ]);
      only([
        {
          field: 'status',
          lookup: { items: [{ name: 'x' }], valueField: 'code', displayField: 'name' },
        },
      ]);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> the first item of a lookup lacks its valueField or its displayField.`,
      ]);
    });

    it('says nothing for an empty list of items, which an app may fill later', () => {
      expect(
        only([
          { field: 'status', lookup: { items: [], valueField: 'code', displayField: 'name' } },
        ]).text(ROW),
      ).toBe('');
      expect(warn).not.toHaveBeenCalled();
    });

    it('reads a display field that is a number as its text', () => {
      const column = only([
        {
          field: 'status',
          lookup: { items: [{ code: 2, name: 7 }], valueField: 'code', displayField: 'name' },
        },
      ]);
      expect(column.text(ROW)).toBe('7');
    });
  });

  describe('sortKey', () => {
    it('is the comparable of the value for each type', () => {
      expect(only([{ field: 'customer' }]).sortKey(ROW)).toBe('An');
      expect(only([{ field: 'total', dataType: 'number' }]).sortKey(ROW)).toBe(1250000);
      expect(only([{ field: 'paid', dataType: 'boolean' }]).sortKey(ROW)).toBe(1);
      expect(only([{ field: 'placed', dataType: 'date' }]).sortKey(ROW)).toBe(
        Date.UTC(2026, 10, 5),
      );
      expect(only([{ field: 'at', dataType: 'datetime' }]).sortKey(ROW)).toBe(ROW.at);
      expect(
        only([{ field: 'total', dataType: 'number' }]).sortKey({ ...ROW, total: null }),
      ).toBeNull();
    });

    it('is the lookup text for a lookup column, and null for a value no item has', () => {
      const column = only([
        {
          field: 'status',
          dataType: 'number',
          lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
        },
      ]);
      expect(column.sortKey(ROW)).toBe('Delivered');
      expect(column.sortKey({ ...ROW, status: 99 })).toBeNull();
    });

    it('is the sortValue of the column when there is one, read as a comparable', () => {
      const sortValue = (row: Order) => row.customer.length;
      expect(only([{ field: 'customer', sortValue }]).sortKey(ROW)).toBe(2);
      const byType = (value: unknown) =>
        only([{ field: 'customer', sortValue: () => value as string }]).sortKey(ROW);
      expect(byType(true)).toBe(1);
      expect(byType(false)).toBe(0);
      expect(byType(new Date(5))).toBe(5);
      expect(byType('x')).toBe('x');
      for (const blank of [null, undefined, '', Number.NaN, new Date('nope'), {}]) {
        expect(byType(blank)).toBeNull();
      }
    });

    it('prefers the sortValue to the lookup', () => {
      const column = only([
        {
          field: 'status',
          lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
          sortValue: (row) => row.qty,
        },
      ]);
      expect(column.sortKey(ROW)).toBe(3);
    });
  });

  describe('what filtering reads', () => {
    const lookup = { items: STATUSES, valueField: 'code', displayField: 'name' };

    it('lets a column filter, header filter and be searched, as the grid says and as it says', () => {
      const [on] = resolve([{ field: 'customer' }]);
      expect(on).toMatchObject({
        allowFiltering: true,
        allowHeaderFiltering: true,
        allowSearch: true,
      });
      const [grid] = resolve([{ field: 'customer' }], {
        allowFiltering: false,
        allowHeaderFiltering: false,
      });
      expect(grid).toMatchObject({ allowFiltering: false, allowHeaderFiltering: false });
      // The column's own word wins over the grid's, and `allowSearch` is the column's alone.
      const [own] = resolve(
        [
          {
            field: 'customer',
            allowFiltering: true,
            allowHeaderFiltering: true,
            allowSearch: false,
          },
        ],
        { allowFiltering: false, allowHeaderFiltering: false },
      );
      expect(own).toMatchObject({
        allowFiltering: true,
        allowHeaderFiltering: true,
        allowSearch: false,
      });
    });

    it('takes a value that is not a boolean for no word at all', () => {
      const wrong: unknown = 'no';
      const [column] = resolve([
        {
          field: 'customer',
          allowFiltering: wrong as boolean,
          allowHeaderFiltering: wrong as boolean,
          allowSearch: wrong as boolean,
        },
      ]);
      expect(column).toMatchObject({
        allowFiltering: true,
        allowHeaderFiltering: true,
        allowSearch: true,
      });
    });

    it('offers the operators of the type, the default first', () => {
      const text = ['contains', 'notContains', 'startsWith', 'endsWith', '=', '<>'];
      const ordered = ['=', '<>', '<', '>', '<=', '>=', 'between'];
      expect(only([{ field: 'customer' }]).operators).toEqual(text);
      expect(only([{ field: 'total', dataType: 'number' }]).operators).toEqual(ordered);
      expect(only([{ field: 'placed', dataType: 'date' }]).operators).toEqual(ordered);
      expect(only([{ field: 'at', dataType: 'datetime' }]).operators).toEqual(ordered);
      expect(only([{ field: 'paid', dataType: 'boolean' }]).operators).toEqual(['=']);
      expect(only([{ field: 'status', dataType: 'number', lookup }]).operators).toEqual(['=']);
    });

    it('narrows the operators to filterOperators, in the type order', () => {
      const column = only([
        { field: 'total', dataType: 'number', filterOperators: ['between', '>', '='] },
      ]);
      expect(column.operators).toEqual(['=', '>', 'between']);
      // Operators of another type are not of this one.
      const text = only([{ field: 'customer', filterOperators: ['startsWith', '>', 'contains'] }]);
      expect(text.operators).toEqual(['contains', 'startsWith']);
      expect(warn).not.toHaveBeenCalled();
    });

    it('offers all of the type, and warns once, when filterOperators has none of them', () => {
      const wrong: unknown = ['like'];
      const columns = resolve([
        { field: 'customer', filterOperators: ['>', 'between'] },
        { field: 'total', dataType: 'number', filterOperators: wrong as ['='] },
        { field: 'qty', dataType: 'number', filterOperators: [] },
      ]);
      expect(columns[0]!.operators).toHaveLength(6);
      expect(columns[1]!.operators).toHaveLength(7);
      expect(columns[2]!.operators).toHaveLength(7);
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a column's filterOperators has none of its type's operators; all of them are offered.`,
      ]);
    });

    it('keeps the one operator of a boolean and of a lookup whatever filterOperators says', () => {
      expect(
        only([{ field: 'paid', dataType: 'boolean', filterOperators: ['<>'] }]).operators,
      ).toEqual(['=']);
      expect(only([{ field: 'status', lookup, filterOperators: ['<>'] }]).operators).toEqual(['=']);
      expect(warn).not.toHaveBeenCalled();
    });

    it('lists a lookup as choices in its order, the first of a repeated value only', () => {
      const repeated = [...STATUSES, { code: 1, name: 'Again' }, { code: 3, name: 'Cancelled' }];
      const column = only([
        {
          field: 'status',
          dataType: 'number',
          lookup: { items: repeated, valueField: 'code', displayField: 'name' },
        },
      ]);
      expect(column.choices).toEqual([
        { value: 1, text: 'New' },
        { value: 2, text: 'Delivered' },
        { value: 3, text: 'Cancelled' },
      ]);
      expect(only([{ field: 'customer' }]).choices).toBeUndefined();
    });

    it('lists the headerFilter values it can read, and leaves out the rest', () => {
      type Values = { value: string; text: string }[];
      const values: unknown = [
        { value: 'a', text: 'A' },
        { value: 1 },
        null,
        'x',
        { text: 'no value' },
        { value: null, text: 'None' },
      ];
      const column = only([{ field: 'customer', headerFilter: { values: values as Values } }]);
      expect(column.headerValues).toEqual([
        { value: 'a', text: 'A' },
        { value: null, text: 'None' },
      ]);
      expect(only([{ field: 'customer' }]).headerValues).toBeUndefined();
      // A value listed twice keeps its first item: one box in the list.
      const twice = only([
        {
          field: 'customer',
          headerFilter: {
            values: [
              { value: 'a', text: 'First' },
              { value: 'b', text: 'B' },
              { value: 'a', text: 'Second' },
              { value: null, text: 'None' },
              { value: null, text: 'Nothing' },
            ],
          },
        },
      ]);
      expect(twice.headerValues).toEqual([
        { value: 'a', text: 'First' },
        { value: 'b', text: 'B' },
        { value: null, text: 'None' },
      ]);
      const notAList: unknown = 'abc';
      const bad = only([{ field: 'customer', headerFilter: { values: notAList as Values } }]);
      expect(bad.headerValues).toBeUndefined();
    });

    describe('filterKey', () => {
      it('is the string of a string column, null for a blank, and the text of what a string cannot be', () => {
        const column = only([{ field: 'customer' }]);
        expect(column.filterKey({ ...ROW, customer: 'An' })).toBe('An');
        expect(column.filterKey({ ...ROW, customer: '' })).toBeNull();
        const computed = only([
          {
            id: 'who',
            value: () => ({ name: 'An' }),
            format: (value: { name: string }) => value.name,
          },
        ]);
        expect(computed.filterKey(ROW)).toBe('An');
      });

      it('is the number, the boolean, and null for a blank', () => {
        const total = only([{ field: 'total', dataType: 'number' }]);
        expect(total.filterKey(ROW)).toBe(1250000);
        expect(total.filterKey({ ...ROW, total: null })).toBeNull();
        const paid = only([{ field: 'paid', dataType: 'boolean' }]);
        expect(paid.filterKey(ROW)).toBe(true);
        expect(paid.filterKey({ ...ROW, paid: false })).toBe(false);
      });

      it('is the raw value of a lookup, null for a blank, and the value even when no item has it', () => {
        const column = only([{ field: 'status', dataType: 'number', lookup }]);
        expect(column.filterKey(ROW)).toBe(2);
        expect(column.filterKey({ ...ROW, status: 99 })).toBe(99);
        expect(column.filterKey({ ...ROW, status: null })).toBeNull();
      });

      it('is the ISO day of a date, from a string or from a Date', () => {
        const column = only([{ field: 'placed', dataType: 'date' }]);
        expect(column.filterKey(ROW)).toBe('2026-11-05');
        expect(column.filterKey({ ...ROW, placed: null })).toBeNull();
        const asDate = only([
          { id: 'day', value: () => new Date(Date.UTC(2026, 10, 5, 18)), dataType: 'date' },
        ]);
        expect(asDate.filterKey(ROW)).toBe('2026-11-05');
      });

      it('is the ISO day of a datetime in the grid zone, so near midnight the zone decides', () => {
        // 20:30 UTC on 5 November is 03:30 on 6 November in Ho Chi Minh City (UTC+7).
        const utc = only([{ field: 'at', dataType: 'datetime' }]);
        expect(utc.filterKey(ROW)).toBe('2026-11-05');
        const hanoi = only([{ field: 'at', dataType: 'datetime' }], {
          timeZone: 'Asia/Ho_Chi_Minh',
        });
        expect(hanoi.filterKey(ROW)).toBe('2026-11-06');
        const newYork = only([{ field: 'at', dataType: 'datetime' }], {
          timeZone: 'America/New_York',
        });
        expect(newYork.filterKey({ ...ROW, at: Date.UTC(2026, 10, 5, 3, 0) })).toBe('2026-11-04');
        expect(utc.filterKey({ ...ROW, at: null })).toBeNull();
      });
    });

    describe('keyText', () => {
      it('writes a filter key as the column shows it: a lookup text, a day, a number, a boolean', () => {
        const status = only([{ field: 'status', dataType: 'number', lookup }]);
        expect(status.keyText(2)).toBe('Delivered');
        expect(status.keyText(99)).toBe('99');
        expect(only([{ field: 'placed', dataType: 'date' }]).keyText('2026-11-05')).toBe(
          '11/05/2026',
        );
        expect(only([{ field: 'at', dataType: 'datetime' }]).keyText('2026-11-05')).toBe(
          '11/05/2026',
        );
        expect(only([{ field: 'total', dataType: 'number' }]).keyText(1250000)).toBe('1,250,000');
        expect(only([{ field: 'paid', dataType: 'boolean' }]).keyText(true)).toBe('Yes');
        expect(only([{ field: 'paid', dataType: 'boolean' }]).keyText(false)).toBe('No');
        expect(only([{ field: 'customer' }]).keyText('An')).toBe('An');
        expect(only([{ field: 'customer' }]).keyText(null)).toBe('');
      });
    });
  });

  describe('the value', () => {
    it('reads the property of a field column, and nothing from a row that is not an object', () => {
      const column = only([{ field: 'qty' }]);
      expect(column.value(ROW)).toBe(3);
      expect(column.value(null as unknown as Order)).toBeUndefined();
    });

    it('keeps the type of a computed column made with dataGridColumn', () => {
      const amount = dataGridColumn<Order>()({ id: 'amount', value: (row) => row.qty * 2 });
      expect(only([amount]).value(ROW)).toBe(6);
    });
  });
});

describe('the column of boxes', () => {
  it('has no filter cell, no funnel, no search, no operator and no filter key', () => {
    const column = selectColumn<Order>();
    expect(column).toMatchObject({
      allowFiltering: false,
      allowHeaderFiltering: false,
      allowSearch: false,
      allowGrouping: false,
      showWhenGrouped: false,
      operators: [],
      choices: undefined,
      headerValues: undefined,
    });
    expect(column.filterKey(ROW)).toBeNull();
    expect(column.keyText('x')).toBe('');
  });
});

describe('checkFields', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const columns = (...definitions: DataGridColumn<Order>[]) => resolveColumns(definitions, OPTIONS);
  const rows = (count: number, build: (index: number) => object = () => ROW): Order[] =>
    Array.from({ length: count }, (_, index) => build(index) as Order);

  it('warns when no row has the property of a field column', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    checkFields(columns({ field: 'custmer' as 'customer' }), rows(5));
    expect(warnings(warn)).toEqual([
      `${WARN_PREFIX} <DataGrid> no row has the property a column names as its field; check its spelling.`,
    ]);
  });

  it('is quiet when a row has it, even with the value undefined or null', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    checkFields(
      columns({ field: 'total' }),
      rows(3, () => ({ total: null })),
    );
    checkFields(
      columns({ field: 'total' }),
      rows(3, () => ({ total: undefined })),
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('looks at the first 20 rows only', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const late = rows(25, (index) => (index === 20 ? ROW : { id: 'x' }));
    checkFields(columns({ field: 'customer' }), late);
    expect(warn).toHaveBeenCalledTimes(1);
    resetDevWarnings();
    const edge = rows(25, (index) => (index === 19 ? ROW : { id: 'x' }));
    checkFields(columns({ field: 'customer' }), edge);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('says nothing about no rows, and nothing about a value column', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    checkFields(columns({ field: 'customer' }), []);
    checkFields(columns({ id: 'amount', value: () => 1 }), rows(3));
    expect(warn).not.toHaveBeenCalled();
  });

  it('is not computed in production: the rows are not even read', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let reads = 0;
    const watched = new Proxy(rows(5), {
      get(target, property, receiver) {
        reads += 1;
        return Reflect.get(target, property, receiver);
      },
    });
    checkFields(columns({ field: 'custmer' as 'customer' }), watched);
    expect(reads).toBe(0);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('the indent columns of a grouping', () => {
  it('are service columns of 28px that are no data column and no place of the keyboard', () => {
    const indent = indentColumn<unknown>(2);
    expect(indent).toMatchObject({
      id: 'flg:indent-2',
      service: 'indent',
      width: GROUP_INDENT_WIDTH,
      minWidth: GROUP_INDENT_WIDTH,
      allowGrouping: false,
    });
    expect(GROUP_INDENT_WIDTH).toBe(28);
    expect(isDataColumn(indent)).toBe(false);
    expect(isPlaceColumn(indent)).toBe(false);
    // The column of boxes is no data column either, but it is a place of the keyboard.
    expect(isPlaceColumn(selectColumn())).toBe(true);
    expect(isPlaceColumn({})).toBe(true);
  });
});

describe('groupedOut', () => {
  const resolve = (columns: DataGridColumn<{ a: string; b: string; c: string }>[]) =>
    resolveColumns(columns as DataGridColumn<unknown>[], {
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

  it('takes out the columns of the grouping, in its order, but those with showWhenGrouped', () => {
    const shown = resolve([
      { field: 'a', caption: 'A' },
      { field: 'b', caption: 'B', showWhenGrouped: true },
      { field: 'c', caption: 'C' },
    ]);
    expect(groupedOut(shown, ['c', 'b', 'a']).map((column) => column.id)).toEqual(['c', 'a']);
    expect(groupedOut(shown, [])).toEqual([]);
    expect(groupedOut(shown, ['nothing'])).toEqual([]);
  });

  it('keeps the first grouped column shown when the grouping would leave none', () => {
    const shown = resolve([
      { field: 'a', caption: 'A' },
      { field: 'b', caption: 'B' },
    ]);
    expect(groupedOut(shown, ['b', 'a']).map((column) => column.id)).toEqual(['a']);
    expect(groupedOut(shown, ['b']).map((column) => column.id)).toEqual(['b']);
  });
});
