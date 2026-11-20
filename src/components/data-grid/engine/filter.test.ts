import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { resetDevWarnings } from '../../../internal/warn';
import type { DataGridColumn, DataGridColumnFilter, DataGridFilter } from '../types';
import { resolveColumns } from './columns';
import type { ResolvedColumn } from './columns';
import {
  EMPTY_FILTER,
  columnFilters,
  conditionOf,
  distinctValues,
  filterRows,
  foldedSearch,
  formatFilterNumber,
  headerConditionFilters,
  headerSelection,
  isFiltering,
  matchesHeader,
  matchesRow,
  operatorsFor,
  parseFilterNumber,
  rangeEnds,
  rowConditionFilters,
  sameFilter,
  searchRows,
  withHeaderCondition,
  withRowCondition,
} from './filter';
import { createTextCache } from './values';

interface Order {
  id: string;
  customer: string | null;
  status: number | null;
  total: number | null;
  placed: string | Date | null;
  at: number | null;
  paid: boolean | null;
}

const STATUSES = [
  { code: 1, name: 'New' },
  { code: 2, name: 'Delivered' },
  { code: 3, name: 'Cancelled' },
];

const COLUMNS: DataGridColumn<Order>[] = [
  { field: 'customer' },
  {
    field: 'status',
    dataType: 'number',
    lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
  },
  { field: 'total', dataType: 'number' },
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
};

function columnsIn(timeZone = 'UTC', locale = 'en-US') {
  return resolveColumns(COLUMNS, { ...OPTIONS, timeZone, locale });
}

const RESOLVED = columnsIn();
const byId = (columns: readonly ResolvedColumn<Order>[], id: string) =>
  columns.find((column) => column.id === id)!;
const customer = byId(RESOLVED, 'customer');
const status = byId(RESOLVED, 'status');
const total = byId(RESOLVED, 'total');
const placed = byId(RESOLVED, 'placed');
const at = byId(RESOLVED, 'at');
const paid = byId(RESOLVED, 'paid');

const A: Order = {
  id: 'a',
  customer: 'Nguyễn Minh Anh',
  status: 1,
  total: 100,
  placed: '2026-11-05',
  at: Date.UTC(2026, 10, 5, 20, 30),
  paid: true,
};
const B: Order = {
  id: 'b',
  customer: 'Trần Văn Bình',
  status: 2,
  total: 500,
  placed: '2026-11-06',
  at: Date.UTC(2026, 10, 6, 12, 0),
  paid: false,
};
const C: Order = {
  id: 'c',
  customer: 'Đường Minh',
  status: 3,
  total: 1000,
  placed: new Date(Date.UTC(2026, 10, 7, 23, 59)),
  at: Date.UTC(2026, 10, 7, 23, 59),
  paid: true,
};
// A row with nothing in it: every column is blank.
const D: Order = {
  id: 'd',
  customer: null,
  status: null,
  total: null,
  placed: null,
  at: null,
  paid: null,
};
const ROWS: readonly Order[] = [A, B, C, D];

const read = createTextCache<Order>();
const ids = (rows: readonly Order[]) => rows.map((row) => row.id);
// The ids of the rows a single row condition keeps, through `matchesRow`.
function keeps(
  column: ResolvedColumn<Order>,
  condition: DataGridColumnFilter,
  rows: readonly Order[] = ROWS,
) {
  return ids(rows.filter((row) => matchesRow(column, row, condition, read)));
}
const filterOf = (columns: Record<string, DataGridColumnFilter>): DataGridFilter => ({ columns });

describe('the filter engine', () => {
  let warn: MockInstance;
  beforeEach(() => {
    resetDevWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  describe('operatorsFor', () => {
    it('gives the operators of the type with the default first, and = alone for a boolean or a lookup', () => {
      expect(operatorsFor('string', false)).toEqual([
        'contains',
        'notContains',
        'startsWith',
        'endsWith',
        '=',
        '<>',
      ]);
      for (const type of ['number', 'date', 'datetime'] as const) {
        expect(operatorsFor(type, false)).toEqual(['=', '<>', '<', '>', '<=', '>=', 'between']);
      }
      expect(operatorsFor('boolean', false)).toEqual(['=']);
      expect(operatorsFor('string', true)).toEqual(['=']);
      expect(operatorsFor('number', true)).toEqual(['=']);
    });
  });

  describe('parseFilterNumber', () => {
    it('reads a number the way its locale writes it', () => {
      expect(parseFilterNumber('1,000.5', 'en-US')).toBe(1000.5);
      expect(parseFilterNumber('1.000,5', 'vi-VN')).toBe(1000.5);
      expect(parseFilterNumber(' -3 ', 'en-US')).toBe(-3);
      expect(parseFilterNumber('0', 'en-US')).toBe(0);
    });

    it('gives null for text that is no number, and for nothing', () => {
      expect(parseFilterNumber('abc', 'en-US')).toBeNull();
      expect(parseFilterNumber('12abc', 'en-US')).toBeNull();
      expect(parseFilterNumber('', 'en-US')).toBeNull();
      expect(parseFilterNumber('   ', 'en-US')).toBeNull();
    });
  });

  describe('formatFilterNumber', () => {
    it('writes a number as its locale types it, with no grouping, and parseFilterNumber reads it back', () => {
      expect(formatFilterNumber(1000.5, 'en-US')).toBe('1000.5');
      expect(formatFilterNumber(1000.5, 'vi-VN')).toBe('1000,5');
      expect(formatFilterNumber(-3, 'en-US')).toBe('-3');
      expect(formatFilterNumber(0, 'en-US')).toBe('0');
      for (const locale of ['en-US', 'vi-VN', 'de-DE']) {
        for (const value of [0, 5, -3.25, 1234567.891, 0.000001]) {
          expect(parseFilterNumber(formatFilterNumber(value, locale), locale)).toBe(value);
        }
      }
    });
  });

  describe('rangeEnds', () => {
    it('reads each end as the column reads it, and an end it cannot read is open', () => {
      expect(rangeEnds(total, [5, 9])).toEqual([5, 9]);
      expect(rangeEnds(total, [5, ''])).toEqual([5, undefined]);
      expect(rangeEnds(total, [null, 9])).toEqual([undefined, 9]);
      expect(rangeEnds(total, ['5', 9])).toEqual([undefined, 9]);
      expect(rangeEnds(total, 5)).toEqual([undefined, undefined]);
      expect(rangeEnds(placed, ['2026-11-05', 'x'])).toEqual(['2026-11-05', undefined]);
      expect(rangeEnds(at, [undefined, '2026-11-06'])).toEqual([undefined, '2026-11-06']);
    });
  });

  describe('conditionOf', () => {
    it('reads an own property of the columns of the filter', () => {
      const condition = { operator: '=' as const, value: 'x' };
      expect(conditionOf(filterOf({ customer: condition }), 'customer')).toBe(condition);
      expect(conditionOf(filterOf({ customer: condition }), 'total')).toBeUndefined();
      expect(conditionOf({}, 'customer')).toBeUndefined();
    });

    it('gives no condition to a column whose id is a property every object has', () => {
      const filter = filterOf({ customer: { value: 'x' } });
      for (const id of ['constructor', 'toString', 'hasOwnProperty', '__proto__']) {
        expect(conditionOf(filter, id)).toBeUndefined();
      }
      // An own property of that name, as JSON.parse makes it, is a condition.
      const parsed = JSON.parse(
        '{"columns":{"constructor":{"value":"x"},"__proto__":{"value":"y"}}}',
      );
      expect(conditionOf(parsed as DataGridFilter, 'constructor')).toEqual({ value: 'x' });
      expect(conditionOf(parsed as DataGridFilter, '__proto__')).toEqual({ value: 'y' });
    });

    it('gives nothing for a condition that is not an object', () => {
      const wrong: unknown = { customer: 'x', total: null, paid: [] };
      const filter = { columns: wrong } as DataGridFilter;
      expect(conditionOf(filter, 'customer')).toBeUndefined();
      expect(conditionOf(filter, 'total')).toBeUndefined();
    });
  });

  describe('rowConditionFilters', () => {
    it('is true for an offered operator and a usable value, and takes the default operator when there is none', () => {
      expect(rowConditionFilters(customer, { operator: 'startsWith', value: 'a' })).toBe(true);
      expect(rowConditionFilters(customer, { value: 'a' })).toBe(true);
      expect(rowConditionFilters(total, { value: 5 })).toBe(true);
      expect(rowConditionFilters(total, { operator: '>=', value: 0 })).toBe(true);
      expect(rowConditionFilters(paid, { operator: '=', value: false })).toBe(true);
      expect(rowConditionFilters(status, { operator: '=', value: 0 })).toBe(true);
    });

    it('is false with no condition, no value, a value of another kind, or an operator the column does not offer', () => {
      expect(rowConditionFilters(customer, undefined)).toBe(false);
      for (const value of ['', null, undefined]) {
        expect(rowConditionFilters(customer, { operator: 'contains', value })).toBe(false);
        expect(rowConditionFilters(total, { operator: '=', value })).toBe(false);
      }
      expect(rowConditionFilters(customer, { operator: '>', value: 'a' })).toBe(false);
      expect(rowConditionFilters(total, { operator: 'contains', value: '5' })).toBe(false);
      expect(rowConditionFilters(paid, { operator: '<>', value: true })).toBe(false);
      expect(rowConditionFilters(status, { operator: '<>', value: 1 })).toBe(false);
      // A number column reads numbers, a string column strings, a date an ISO day, a boolean a boolean.
      expect(rowConditionFilters(total, { operator: '=', value: '5' })).toBe(false);
      expect(rowConditionFilters(total, { operator: '=', value: Number.NaN })).toBe(false);
      expect(rowConditionFilters(customer, { operator: 'contains', value: 5 })).toBe(false);
      expect(rowConditionFilters(placed, { operator: '=', value: 'tomorrow' })).toBe(false);
      expect(rowConditionFilters(placed, { operator: '=', value: '2026-02-30' })).toBe(false);
      expect(rowConditionFilters(placed, { operator: '=', value: new Date() })).toBe(false);
      expect(rowConditionFilters(paid, { operator: '=', value: 'true' })).toBe(false);
    });

    it('needs at least one end for between, and an end that is blank is open', () => {
      expect(rowConditionFilters(total, { operator: 'between', value: [1, 5] })).toBe(true);
      expect(rowConditionFilters(total, { operator: 'between', value: [1, null] })).toBe(true);
      expect(rowConditionFilters(total, { operator: 'between', value: [undefined, 5] })).toBe(true);
      expect(rowConditionFilters(total, { operator: 'between', value: [null, null] })).toBe(false);
      expect(rowConditionFilters(total, { operator: 'between', value: [] })).toBe(false);
      expect(rowConditionFilters(total, { operator: 'between', value: 5 })).toBe(false);
      expect(rowConditionFilters(total, { operator: 'between', value: ['a', 'b'] })).toBe(false);
      const days = ['2026-11-05', null];
      expect(rowConditionFilters(placed, { operator: 'between', value: days })).toBe(true);
      expect(rowConditionFilters(placed, { operator: 'between', value: ['x', null] })).toBe(false);
    });

    it('lets the allowFiltering of the column be: a condition of a column with no filter cell still filters', () => {
      const [quiet] = resolveColumns<Order>(
        [{ field: 'customer', allowFiltering: false }],
        OPTIONS,
      );
      expect(rowConditionFilters(quiet!, { value: 'a' })).toBe(true);
    });
  });

  describe('headerConditionFilters', () => {
    it('is true for a list of values, even an empty one, which keeps no row', () => {
      expect(headerConditionFilters({ values: ['a'] })).toBe(true);
      expect(headerConditionFilters({ values: [] })).toBe(true);
      expect(headerConditionFilters({ values: ['a'], exclude: true })).toBe(true);
      expect(headerConditionFilters({ values: [null], exclude: false })).toBe(true);
    });

    it('is false for no list, a value that is no list, and exclude with nothing to exclude', () => {
      expect(headerConditionFilters(undefined)).toBe(false);
      expect(headerConditionFilters({})).toBe(false);
      expect(headerConditionFilters({ operator: '=', value: 1 })).toBe(false);
      const wrong: unknown = 'a';
      expect(headerConditionFilters({ values: wrong as string[] })).toBe(false);
      expect(headerConditionFilters({ values: [], exclude: true })).toBe(false);
    });
  });

  describe('columnFilters and isFiltering', () => {
    it('says a column has a condition that filters, by either part', () => {
      const filter = filterOf({
        customer: { value: 'a' },
        status: { values: [1] },
        total: { operator: '>' },
        paid: { values: [], exclude: true },
      });
      expect(columnFilters(filter, customer)).toBe(true);
      expect(columnFilters(filter, status)).toBe(true);
      expect(columnFilters(filter, total)).toBe(false);
      expect(columnFilters(filter, paid)).toBe(false);
      expect(columnFilters(filter, placed)).toBe(false);
      expect(columnFilters({}, customer)).toBe(false);
    });

    it('says the grid is filtering for a search or a condition that filters while the filter is enabled', () => {
      expect(isFiltering({}, RESOLVED)).toBe(false);
      expect(isFiltering({ search: '' }, RESOLVED)).toBe(false);
      expect(isFiltering({ search: '   ' }, RESOLVED)).toBe(false);
      expect(isFiltering({ search: 'minh' }, RESOLVED)).toBe(true);
      expect(isFiltering(filterOf({ customer: { value: 'a' } }), RESOLVED)).toBe(true);
      expect(isFiltering(filterOf({ status: { values: [] } }), RESOLVED)).toBe(true);
      // A condition that filters nothing, or of a column the grid does not have, is not filtering.
      expect(
        isFiltering(filterOf({ customer: { value: '' }, zzz: { value: 'a' } }), RESOLVED),
      ).toBe(false);
    });

    it('puts the conditions aside with enabled false, and not the search', () => {
      const off = { enabled: false, columns: { customer: { value: 'a' } } };
      expect(isFiltering(off, RESOLVED)).toBe(false);
      expect(isFiltering({ ...off, search: 'x' }, RESOLVED)).toBe(true);
      expect(isFiltering({ ...off, enabled: true }, RESOLVED)).toBe(true);
    });
  });

  describe('matchesRow: strings', () => {
    it('matches the formatted text, folded, by each operator', () => {
      expect(keeps(customer, { operator: 'contains', value: 'MINH' })).toEqual(['a', 'c']);
      expect(keeps(customer, { operator: 'contains', value: 'duong' })).toEqual(['c']);
      expect(keeps(customer, { operator: 'startsWith', value: 'nguyen' })).toEqual(['a']);
      expect(keeps(customer, { operator: 'endsWith', value: 'binh' })).toEqual(['b']);
      expect(keeps(customer, { operator: '=', value: 'tran van binh' })).toEqual(['b']);
      expect(keeps(customer, { operator: '=', value: 'tran van' })).toEqual([]);
    });

    it('keeps the blank row for <> and notContains only', () => {
      expect(keeps(customer, { operator: 'notContains', value: 'minh' })).toEqual(['b', 'd']);
      expect(keeps(customer, { operator: '<>', value: 'tran van binh' })).toEqual(['a', 'c', 'd']);
      for (const operator of ['contains', 'startsWith', 'endsWith', '='] as const) {
        expect(keeps(customer, { operator, value: 'a' })).not.toContain('d');
      }
    });

    it('matches the text the column shows, not the value: a lookup by its name, a format function by its output', () => {
      const [shown] = resolveColumns<Order>(
        [{ field: 'total', dataType: 'number', format: (value) => `${value} đ` }],
        OPTIONS,
      );
      // A number column still compares numbers: its operators are the number's.
      expect(keeps(shown!, { operator: '>', value: 100 })).toEqual(['b', 'c']);
      const named = resolveColumns<Order>(
        [{ field: 'customer', format: (value) => `Khách ${String(value)}` }],
        OPTIONS,
      )[0]!;
      expect(keeps(named, { operator: 'startsWith', value: 'khach tran' })).toEqual(['b']);
    });
  });

  describe('matchesRow: numbers', () => {
    it('compares the number with each operator, and a blank is kept by <> alone', () => {
      expect(keeps(total, { operator: '=', value: 500 })).toEqual(['b']);
      expect(keeps(total, { operator: '<>', value: 500 })).toEqual(['a', 'c', 'd']);
      expect(keeps(total, { operator: '<', value: 500 })).toEqual(['a']);
      expect(keeps(total, { operator: '>', value: 500 })).toEqual(['c']);
      expect(keeps(total, { operator: '<=', value: 500 })).toEqual(['a', 'b']);
      expect(keeps(total, { operator: '>=', value: 500 })).toEqual(['b', 'c']);
    });

    it('takes both ends of between, and lets a missing end leave that side free', () => {
      expect(keeps(total, { operator: 'between', value: [100, 500] })).toEqual(['a', 'b']);
      expect(keeps(total, { operator: 'between', value: [101, 999] })).toEqual(['b']);
      expect(keeps(total, { operator: 'between', value: [null, 500] })).toEqual(['a', 'b']);
      expect(keeps(total, { operator: 'between', value: [500, undefined] })).toEqual(['b', 'c']);
      // The blank row is in no range.
      expect(keeps(total, { operator: 'between', value: [null, 5000] })).not.toContain('d');
    });
  });

  describe('matchesRow: dates and datetimes', () => {
    it('compares the calendar day of a date, from a string or from a Date', () => {
      expect(keeps(placed, { operator: '=', value: '2026-11-05' })).toEqual(['a']);
      expect(keeps(placed, { operator: '=', value: '2026-11-07' })).toEqual(['c']);
      expect(keeps(placed, { operator: '<', value: '2026-11-06' })).toEqual(['a']);
      expect(keeps(placed, { operator: '>=', value: '2026-11-06' })).toEqual(['b', 'c']);
      expect(keeps(placed, { operator: '<>', value: '2026-11-06' })).toEqual(['a', 'c', 'd']);
      expect(keeps(placed, { operator: 'between', value: ['2026-11-06', '2026-11-07'] })).toEqual([
        'b',
        'c',
      ]);
      expect(keeps(placed, { operator: 'between', value: [null, '2026-11-05'] })).toEqual(['a']);
      expect(keeps(placed, { operator: 'between', value: ['2026-11-07', null] })).toEqual(['c']);
    });

    it('compares the day of a datetime in the zone of the grid, so near midnight the zone decides', () => {
      // A is 20:30 UTC on 5 November: 3:30 on 6 November at UTC+7. C is 23:59 UTC on 7 November.
      expect(keeps(at, { operator: '=', value: '2026-11-05' })).toEqual(['a']);
      const hanoi = byId(columnsIn('Asia/Ho_Chi_Minh'), 'at');
      expect(keeps(hanoi, { operator: '=', value: '2026-11-05' })).toEqual([]);
      expect(keeps(hanoi, { operator: '=', value: '2026-11-06' })).toEqual(['a', 'b']);
      expect(keeps(hanoi, { operator: '=', value: '2026-11-08' })).toEqual(['c']);
      const newYork = byId(columnsIn('America/New_York'), 'at');
      expect(keeps(newYork, { operator: '=', value: '2026-11-05' })).toEqual(['a']);
      expect(keeps(newYork, { operator: '=', value: '2026-11-06' })).toEqual(['b']);
      expect(keeps(newYork, { operator: '=', value: '2026-11-07' })).toEqual(['c']);
      expect(keeps(hanoi, { operator: '<', value: '2026-11-06' })).toEqual([]);
      expect(keeps(hanoi, { operator: '>=', value: '2026-11-08' })).toEqual(['c']);
    });
  });

  describe('matchesRow: booleans and lookups', () => {
    it('matches a boolean by its value, and never a blank', () => {
      expect(keeps(paid, { operator: '=', value: true })).toEqual(['a', 'c']);
      expect(keeps(paid, { operator: '=', value: false })).toEqual(['b']);
    });

    it('matches a lookup by the value of the item, not by its text, and never a blank', () => {
      expect(keeps(status, { operator: '=', value: 1 })).toEqual(['a']);
      expect(keeps(status, { operator: '=', value: 3 })).toEqual(['c']);
      expect(keeps(status, { operator: '=', value: 99 })).toEqual([]);
      expect(keeps(status, { operator: '=', value: 'New' })).toEqual([]);
    });

    it('keeps every row for a condition that filters nothing', () => {
      expect(keeps(customer, { operator: 'contains', value: '' })).toEqual(['a', 'b', 'c', 'd']);
      expect(keeps(total, { operator: '>', value: 'x' })).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('matchesHeader', () => {
    const header = (column: ResolvedColumn<Order>, condition: DataGridColumnFilter, rows = ROWS) =>
      ids(rows.filter((row) => matchesHeader(column, row, condition)));

    it('keeps the rows whose filter key is in the values, null being the blank', () => {
      expect(header(status, { values: [1, 3] })).toEqual(['a', 'c']);
      expect(header(status, { values: [null] })).toEqual(['d']);
      expect(header(status, { values: [3, null] })).toEqual(['c', 'd']);
      expect(header(customer, { values: ['Trần Văn Bình'] })).toEqual(['b']);
      expect(header(placed, { values: ['2026-11-05', '2026-11-07'] })).toEqual(['a', 'c']);
      expect(header(paid, { values: [false] })).toEqual(['b']);
      expect(header(total, { values: [100, 1000] })).toEqual(['a', 'c']);
    });

    it('takes a string exactly: the header filter lists what the column holds, case and accents included', () => {
      expect(header(customer, { values: ['trần văn bình'] })).toEqual([]);
    });

    it('keeps the rows that are not in the values with exclude, the blank row too unless it is named', () => {
      expect(header(status, { values: [1], exclude: true })).toEqual(['b', 'c', 'd']);
      expect(header(status, { values: [1, null], exclude: true })).toEqual(['b', 'c']);
    });

    it('keeps no row for an empty list, and every row for exclude with an empty list', () => {
      expect(header(status, { values: [] })).toEqual([]);
      expect(header(status, { values: [], exclude: true })).toEqual(['a', 'b', 'c', 'd']);
    });

    it('reads a datetime by its day in the zone', () => {
      const hanoi = byId(columnsIn('Asia/Ho_Chi_Minh'), 'at');
      expect(header(hanoi, { values: ['2026-11-06'] })).toEqual(['a', 'b']);
    });
  });

  describe('searchRows', () => {
    it('keeps the rows with the folded query in the folded text of at least one column given', () => {
      expect(ids(searchRows(ROWS, RESOLVED, 'minh', read))).toEqual(['a', 'c']);
      expect(ids(searchRows(ROWS, RESOLVED, 'MINH', read))).toEqual(['a', 'c']);
      expect(ids(searchRows(ROWS, RESOLVED, 'duong', read))).toEqual(['c']);
      // Another column's text: the lookup's name, a formatted number, a formatted date.
      expect(ids(searchRows(ROWS, RESOLVED, 'delivered', read))).toEqual(['b']);
      expect(ids(searchRows(ROWS, RESOLVED, '1,000', read))).toEqual(['c']);
      expect(ids(searchRows(ROWS, RESOLVED, '11/06/2026', read))).toEqual(['b']);
      expect(ids(searchRows(ROWS, RESOLVED, 'zzz', read))).toEqual([]);
    });

    it('trims the query, and an empty one keeps every row, the very array', () => {
      expect(ids(searchRows(ROWS, RESOLVED, '  Minh  ', read))).toEqual(['a', 'c']);
      expect(searchRows(ROWS, RESOLVED, '', read)).toBe(ROWS);
      expect(searchRows(ROWS, RESOLVED, '   ', read)).toBe(ROWS);
      // A query of only combining marks folds to nothing.
      expect(searchRows(ROWS, RESOLVED, '́', read)).toBe(ROWS);
    });

    it('reads only the columns it is given', () => {
      expect(ids(searchRows(ROWS, [total], 'minh', read))).toEqual([]);
      expect(ids(searchRows(ROWS, [customer, total], 'minh', read))).toEqual(['a', 'c']);
      expect(ids(searchRows(ROWS, [], 'minh', read))).toEqual([]);
    });
  });

  describe('filterRows', () => {
    it('gives the very array when no condition filters', () => {
      expect(filterRows(ROWS, RESOLVED, {}, read)).toBe(ROWS);
      expect(filterRows(ROWS, RESOLVED, EMPTY_FILTER, read)).toBe(ROWS);
      expect(filterRows(ROWS, RESOLVED, filterOf({ customer: { value: '' } }), read)).toBe(ROWS);
      expect(filterRows(ROWS, RESOLVED, { search: 'minh' }, read)).toBe(ROWS);
    });

    it('gives the very array when a condition filters and keeps every row', () => {
      const all = filterOf({ customer: { operator: 'notContains', value: 'zzz' } });
      expect(filterRows(ROWS, RESOLVED, all, read)).toBe(ROWS);
    });

    it('joins every condition of every column, and the two parts of a column, by "and"', () => {
      const filter = filterOf({
        customer: { operator: 'contains', value: 'minh' },
        total: { operator: '>', value: 100 },
      });
      expect(ids(filterRows(ROWS, RESOLVED, filter, read))).toEqual(['c']);
      const both = filterOf({
        total: { operator: '>', value: 100, values: [100, 500] },
      });
      expect(ids(filterRows(ROWS, RESOLVED, both, read))).toEqual(['b']);
      const header = filterOf({ status: { values: [1, 2, 3], exclude: false } });
      expect(ids(filterRows(ROWS, RESOLVED, header, read))).toEqual(['a', 'b', 'c']);
    });

    it('puts every condition aside with enabled false, and no more than that', () => {
      const filter: DataGridFilter = {
        enabled: false,
        search: 'minh',
        columns: { total: { operator: '>', value: 100 } },
      };
      expect(filterRows(ROWS, RESOLVED, filter, read)).toBe(ROWS);
      const on = { ...filter, enabled: true };
      expect(ids(filterRows(ROWS, RESOLVED, on, read))).toEqual(['b', 'c']);
    });

    it('leaves the conditions of the column named by except out, and keeps the others', () => {
      const filter = filterOf({
        customer: { value: 'minh' },
        status: { values: [3] },
      });
      expect(ids(filterRows(ROWS, RESOLVED, filter, read))).toEqual(['c']);
      expect(ids(filterRows(ROWS, RESOLVED, filter, read, 'status'))).toEqual(['a', 'c']);
      expect(ids(filterRows(ROWS, RESOLVED, filter, read, 'customer'))).toEqual(['c']);
      expect(
        filterRows(ROWS, RESOLVED, filterOf({ status: { values: [3] } }), read, 'status'),
      ).toBe(ROWS);
    });

    it('filters by the condition of a column that is hidden, since it gets every resolved column', () => {
      // The grid shows only the customer; the filter of the total still holds.
      const filter = filterOf({ total: { operator: '>=', value: 500 } });
      expect(ids(filterRows(ROWS, RESOLVED, filter, read))).toEqual(['b', 'c']);
    });

    it('ignores, and keeps the rows for, an unknown column, an operator the column lacks, and a value of another kind', () => {
      const ignored = filterOf({
        zzz: { operator: '=', value: 'a' },
        customer: { operator: 'like' as never, value: 'a' },
        total: { operator: '=', value: 'five' },
        paid: { operator: '<>', value: true },
        status: { values: 'a' as never },
      });
      expect(filterRows(ROWS, RESOLVED, ignored, read)).toBe(ROWS);
    });

    it('gives no condition to a column whose id is constructor or toString by inheritance', () => {
      const columns = resolveColumns<Order>(
        [
          { field: 'customer' },
          { id: 'constructor', value: (row: Order) => row.total, dataType: 'number' },
          { id: 'toString', value: (row: Order) => row.total, dataType: 'number' },
        ],
        OPTIONS,
      );
      const filter = filterOf({ customer: { value: 'minh' } });
      expect(ids(filterRows(ROWS, columns, filter, read))).toEqual(['a', 'c']);
      expect(columnFilters(filter, columns[1]!)).toBe(false);
      expect(columnFilters(filter, columns[2]!)).toBe(false);
      // The same ids, owned, do filter.
      const owned = JSON.parse('{"columns":{"constructor":{"operator":">","value":500}}}');
      expect(ids(filterRows(ROWS, columns, owned as DataGridFilter, read))).toEqual(['c']);
    });

    it('does not change its input', () => {
      const rows = [...ROWS];
      const filter = filterOf({ total: { operator: '>', value: 100 } });
      const frozen = JSON.stringify(filter);
      filterRows(rows, RESOLVED, filter, read);
      expect(rows).toEqual(ROWS);
      expect(JSON.stringify(filter)).toBe(frozen);
    });
  });

  describe('distinctValues', () => {
    const rows: Order[] = [
      { ...A, id: '1', customer: 'Bình', status: 2, total: 20, placed: '2026-11-06' },
      { ...A, id: '2', customer: 'An', status: 1, total: 3, placed: '2026-11-05' },
      { ...A, id: '3', customer: 'Bình', status: 2, total: 100, placed: '2026-11-06' },
      { ...A, id: '4', customer: null, status: null, total: null, placed: null },
      { ...A, id: '5', customer: 'ấn', status: 3, total: 20, placed: '2026-11-04' },
    ];
    const items = (
      column: ResolvedColumn<Order>,
      options: Parameters<typeof distinctValues>[2] = {},
      from: readonly Order[] = rows,
    ) => distinctValues(from, column, options, read);

    it('lists each value once with the text of its first row, in the order of the column, the blank last', () => {
      expect(items(customer)).toEqual({
        items: [
          { value: 'An', text: 'An' },
          { value: 'ấn', text: 'ấn' },
          { value: 'Bình', text: 'Bình' },
          { value: null, text: '' },
        ],
        total: 4,
      });
      expect(items(total).items.map((item) => item.value)).toEqual([3, 20, 100, null]);
      expect(items(total).items.map((item) => item.text)).toEqual(['3', '20', '100', '']);
      expect(items(placed).items).toEqual([
        { value: '2026-11-04', text: '11/04/2026' },
        { value: '2026-11-05', text: '11/05/2026' },
        { value: '2026-11-06', text: '11/06/2026' },
        { value: null, text: '' },
      ]);
    });

    it('writes a datetime as its day, whichever time the first row had', () => {
      const day = [
        { ...A, id: 'x', at: Date.UTC(2026, 10, 5, 20, 30) },
        { ...A, id: 'y', at: Date.UTC(2026, 10, 5, 1, 0) },
      ];
      expect(items(at, {}, day)).toEqual({
        items: [{ value: '2026-11-05', text: '11/05/2026' }],
        total: 1,
      });
    });

    it('sorts a lookup by its text, and by the sortValue of the column when it has one', () => {
      const byText = items(status).items.map((item) => item.text);
      expect(byText).toEqual(['Cancelled', 'Delivered', 'New', '']);
      expect(items(status).items.map((item) => item.value)).toEqual([3, 2, 1, null]);
      const [ordered] = resolveColumns<Order>(
        [
          {
            field: 'status',
            dataType: 'number',
            lookup: { items: STATUSES, valueField: 'code', displayField: 'name' },
            sortValue: (row) => row.status,
          },
        ],
        OPTIONS,
      );
      expect(items(ordered!).items.map((item) => item.text)).toEqual([
        'New',
        'Delivered',
        'Cancelled',
        '',
      ]);
    });

    it('writes the value of a lookup that no item has as itself', () => {
      const unknown = [{ ...A, status: 7 }];
      expect(items(status, {}, unknown).items).toEqual([{ value: 7, text: '7' }]);
    });

    it('lists the blank only when a row is blank, or the condition names it', () => {
      const noBlank = rows.filter((row) => row.status !== null);
      expect(items(status, {}, noBlank).items.map((item) => item.value)).toEqual([3, 2, 1]);
      expect(items(status, { named: [null] }, noBlank).items.map((item) => item.value)).toEqual([
        3,
        2,
        1,
        null,
      ]);
    });

    it('adds the values the condition names that the rows do not hold, in their place, once', () => {
      const result = items(status, { named: [1, 99, 2, undefined] });
      expect(result.items.map((item) => item.value)).toEqual([99, 3, 2, 1, null]);
      expect(result.items.find((item) => item.value === 99)).toEqual({ value: 99, text: '99' });
      const dated = items(placed, { named: ['2026-11-01'] });
      expect(dated.items[0]).toEqual({ value: '2026-11-01', text: '11/01/2026' });
      expect(dated.total).toBe(5);
      // A lookup writes a named value with the text of its item.
      const named = items(status, { named: [3] }, [A]);
      expect(named.items).toEqual([
        { value: 3, text: 'Cancelled' },
        { value: 1, text: 'New' },
      ]);
    });

    it('narrows by a search that folds the text, and counts only what it kept', () => {
      expect(items(customer, { search: 'an' }).items.map((item) => item.value)).toEqual([
        'An',
        'ấn',
      ]);
      expect(items(customer, { search: 'AN' }).total).toBe(2);
      expect(items(customer, { search: 'zzz' })).toEqual({ items: [], total: 0 });
      expect(items(customer, { search: '' }).total).toBe(4);
    });

    it('cuts the list at the limit, 500 by default, and says how many there are', () => {
      const many = Array.from({ length: 600 }, (_, index) => ({
        ...A,
        id: String(index),
        total: index,
      }));
      const cut = items(total, {}, many);
      expect(cut.items).toHaveLength(500);
      expect(cut.total).toBe(600);
      expect(cut.items[0]!.value).toBe(0);
      expect(cut.items[499]!.value).toBe(499);
      const small = items(total, { limit: 10 }, many);
      expect(small.items).toHaveLength(10);
      expect(small.total).toBe(600);
      // A search narrows what is counted: the list says how many are left to find.
      const narrowed = items(total, { search: '59' }, many);
      expect(narrowed.total).toBe(16);
      expect(narrowed.items).toHaveLength(16);
    });

    it('lists the values of the column when it has its own, in their order, with the search and the named', () => {
      const [remote] = resolveColumns<Order>(
        [
          {
            field: 'customer',
            headerFilter: {
              values: [
                { value: 'z', text: 'Zed' },
                { value: 'a', text: 'Ann' },
                { value: null, text: '(none)' },
              ],
            },
          },
        ],
        OPTIONS,
      );
      // The rows of a page are not the values of a server: they are not read.
      const own = items(remote!, {}, rows);
      expect(own.items).toEqual([
        { value: 'z', text: 'Zed' },
        { value: 'a', text: 'Ann' },
        { value: null, text: '(none)' },
      ]);
      expect(own.total).toBe(3);
      expect(items(remote!, { search: 'AN' }, rows).items).toEqual([{ value: 'a', text: 'Ann' }]);
      expect(items(remote!, { named: ['q'] }, rows).items.map((item) => item.value)).toEqual([
        'z',
        'a',
        null,
        'q',
      ]);
      expect(items(remote!, { limit: 2 }, rows)).toEqual({
        items: [
          { value: 'z', text: 'Zed' },
          { value: 'a', text: 'Ann' },
        ],
        total: 3,
      });
    });
  });

  describe('headerSelection', () => {
    const all = ['a', 'b', 'c', 'd'];

    it('is no condition when every value is checked', () => {
      expect(headerSelection(all, all)).toBeUndefined();
      expect(headerSelection(all, ['d', 'c', 'b', 'a'])).toBeUndefined();
      expect(headerSelection([], [])).toBeUndefined();
    });

    it('lists the values that are checked when half or fewer are', () => {
      expect(headerSelection(all, ['b'])).toEqual({ values: ['b'], exclude: false });
      expect(headerSelection(all, ['c', 'a'])).toEqual({ values: ['a', 'c'], exclude: false });
    });

    it('lists the values that are not checked, with exclude, when more than half are', () => {
      expect(headerSelection(all, ['a', 'b', 'c'])).toEqual({ values: ['d'], exclude: true });
      expect(headerSelection(['a', 'b', 'c'], ['a', 'b'])).toEqual({
        values: ['c'],
        exclude: true,
      });
    });

    it('is a condition that keeps no row when none is checked, as the user asked', () => {
      expect(headerSelection(all, [])).toEqual({ values: [], exclude: false });
    });

    it('takes the blank as a value, and leaves out what the list does not hold', () => {
      expect(headerSelection([1, null, 2], [null])).toEqual({ values: [null], exclude: false });
      expect(headerSelection([1, null, 2], [1, 2])).toEqual({ values: [null], exclude: true });
      expect(headerSelection(all, ['b', 'zzz'])).toEqual({ values: ['b'], exclude: false });
      expect(headerSelection(all, ['zzz'])).toEqual({ values: [], exclude: false });
    });
  });

  describe('sameFilter', () => {
    it('holds an empty filter and one that says its defaults to be the same', () => {
      expect(sameFilter({}, {})).toBe(true);
      expect(sameFilter({}, { search: '', enabled: true, columns: {} })).toBe(true);
      expect(sameFilter({ search: 'a' }, { search: 'a' })).toBe(true);
      expect(sameFilter({ search: 'a' }, { search: 'b' })).toBe(false);
      expect(sameFilter({ enabled: false }, {})).toBe(false);
      expect(sameFilter({ enabled: false }, { enabled: false })).toBe(true);
    });

    it('compares the conditions of a column by value', () => {
      const a = filterOf({ total: { operator: 'between', value: [1, 5] } });
      const b = filterOf({ total: { operator: 'between', value: [1, 5] } });
      expect(sameFilter(a, b)).toBe(true);
      expect(sameFilter(a, filterOf({ total: { operator: 'between', value: [1, 6] } }))).toBe(
        false,
      );
      expect(sameFilter(a, filterOf({ total: { operator: '>', value: [1, 5] } }))).toBe(false);
      expect(sameFilter(filterOf({ a: { exclude: false } }), filterOf({ a: {} }))).toBe(true);
      expect(sameFilter(filterOf({ a: { exclude: true } }), filterOf({ a: {} }))).toBe(false);
    });

    it('compares the values of a header filter as sets, both ways, so repeated values cannot fool it', () => {
      const same = (a: unknown[], b: unknown[]) =>
        sameFilter(filterOf({ s: { values: a } }), filterOf({ s: { values: b } }));
      expect(same(['a', 'b'], ['b', 'a'])).toBe(true);
      expect(same(['a', 'a'], ['a'])).toBe(true);
      expect(same(['a', 'a'], ['a', 'b'])).toBe(false);
      expect(same(['a', 'b'], ['a', 'a'])).toBe(false);
      expect(same([], ['a'])).toBe(false);
      expect(same([1], ['1'])).toBe(false);
      expect(same([null], [undefined])).toBe(false);
      expect(sameFilter(filterOf({ s: { values: [] } }), filterOf({ s: {} }))).toBe(false);
    });

    it('compares the columns by their own keys, both ways', () => {
      const one = filterOf({ a: { value: 1 } });
      const two = filterOf({ a: { value: 1 }, b: { value: 2 } });
      expect(sameFilter(one, two)).toBe(false);
      expect(sameFilter(two, one)).toBe(false);
      expect(sameFilter(filterOf({ a: { value: 1 } }), filterOf({ b: { value: 1 } }))).toBe(false);
      // A key every object has is not a column that the other holds.
      expect(sameFilter(filterOf({ constructor: { value: 1 } }), filterOf({}))).toBe(false);
      expect(sameFilter(filterOf({}), filterOf({ constructor: { value: 1 } }))).toBe(false);
      const same = filterOf({ constructor: { value: 1 } });
      expect(sameFilter(same, filterOf({ constructor: { value: 1 } }))).toBe(true);
      expect(sameFilter(same, same)).toBe(true);
    });
  });

  describe('withRowCondition', () => {
    it('writes the operator and the value of one column and leaves the rest of the filter', () => {
      const start: DataGridFilter = { search: 'x', columns: { status: { values: [1] } } };
      const next = withRowCondition(start, 'customer', 'contains', 'minh');
      expect(next).toEqual({
        search: 'x',
        columns: { status: { values: [1] }, customer: { operator: 'contains', value: 'minh' } },
      });
      expect(start).toEqual({ search: 'x', columns: { status: { values: [1] } } });
    });

    it('keeps the header part of the column and replaces the row part', () => {
      const start = filterOf({ total: { operator: '>', value: 1, values: [5], exclude: true } });
      expect(withRowCondition(start, 'total', '<', 9)).toEqual(
        filterOf({ total: { operator: '<', value: 9, values: [5], exclude: true } }),
      );
    });

    it('does not store an empty value: it takes the value away and keeps an operator that is named', () => {
      const start = filterOf({ customer: { operator: 'contains', value: 'minh' } });
      expect(withRowCondition(start, 'customer', 'contains', '')).toEqual(
        filterOf({ customer: { operator: 'contains' } }),
      );
      expect(withRowCondition(start, 'customer', '=', null)).toEqual(
        filterOf({ customer: { operator: '=' } }),
      );
      expect(withRowCondition(start, 'total', undefined, [null, undefined])).toBe(start);
    });

    it('removes a column left with no part, and the columns record left with no column', () => {
      const start = filterOf({ customer: { operator: 'contains', value: 'minh' } });
      expect(withRowCondition(start, 'customer', undefined, '')).toEqual({});
      expect(withRowCondition(start, 'customer', undefined, undefined)).not.toHaveProperty(
        'columns',
      );
      const two = filterOf({
        customer: { value: 'a' },
        status: { values: [1] },
      });
      expect(withRowCondition(two, 'customer', undefined, '')).toEqual(
        filterOf({ status: { values: [1] } }),
      );
    });

    it('gives back the very filter when nothing changes', () => {
      const start = filterOf({ customer: { operator: 'contains', value: 'minh' } });
      expect(withRowCondition(start, 'customer', 'contains', 'minh')).toBe(start);
      expect(withRowCondition(EMPTY_FILTER, 'customer', undefined, '')).toBe(EMPTY_FILTER);
    });

    it('writes a between range, and a column whose id is constructor as an own key', () => {
      const next = withRowCondition({}, 'total', 'between', [1, null]);
      expect(next.columns!.total).toEqual({ operator: 'between', value: [1, null] });
      const odd = withRowCondition({}, 'constructor', '=', 5);
      expect(Object.hasOwn(odd.columns!, 'constructor')).toBe(true);
      expect(conditionOf(odd, 'constructor')).toEqual({ operator: '=', value: 5 });
      expect(Object.getPrototypeOf(odd.columns)).toBe(Object.prototype);
    });
  });

  describe('withHeaderCondition', () => {
    it('writes the values of one column, with exclude only when it is true, and keeps the row part', () => {
      const start = filterOf({ status: { operator: '=', value: 1 } });
      expect(withHeaderCondition(start, 'status', [2, null], false)).toEqual(
        filterOf({ status: { operator: '=', value: 1, values: [2, null] } }),
      );
      expect(withHeaderCondition(start, 'status', [3], true)).toEqual(
        filterOf({ status: { operator: '=', value: 1, values: [3], exclude: true } }),
      );
    });

    it('removes the part that filters nothing: no values, or exclude with no value', () => {
      const start = filterOf({ status: { values: [1], exclude: true }, total: { value: 1 } });
      expect(withHeaderCondition(start, 'status', undefined, false)).toEqual(
        filterOf({ total: { value: 1 } }),
      );
      expect(withHeaderCondition(start, 'status', [], true)).toEqual(
        filterOf({ total: { value: 1 } }),
      );
      // None checked is a condition that keeps no row, and stays.
      expect(withHeaderCondition({}, 'status', [], false)).toEqual(
        filterOf({ status: { values: [] } }),
      );
    });

    it('removes a column left with no part, and gives back the very filter when nothing changes', () => {
      const only = filterOf({ status: { values: [1] } });
      expect(withHeaderCondition(only, 'status', undefined, false)).toEqual({});
      expect(withHeaderCondition(only, 'status', [1], false)).toBe(only);
      expect(withHeaderCondition(only, 'status', [1, 1], false)).toBe(only);
      expect(withHeaderCondition(EMPTY_FILTER, 'status', undefined, false)).toBe(EMPTY_FILTER);
    });

    it('does not change its input, and writes a copy of the values', () => {
      const values = [1, 2];
      const start: DataGridFilter = Object.freeze({ search: 'x' });
      const next = withHeaderCondition(start, 'status', values, false);
      expect(start).toEqual({ search: 'x' });
      values.push(3);
      expect(next.columns!.status!.values).toEqual([1, 2]);
    });
  });

  describe('EMPTY_FILTER', () => {
    it('is an empty filter that no one can change', () => {
      expect(EMPTY_FILTER).toEqual({});
      expect(Object.isFrozen(EMPTY_FILTER)).toBe(true);
      expect(isFiltering(EMPTY_FILTER, RESOLVED)).toBe(false);
    });
  });

  it('does not warn for any of this', () => {
    filterRows(ROWS, RESOLVED, filterOf({ customer: { value: 'a' }, total: { value: 5 } }), read);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('foldedSearch', () => {
  // The one reading of a search: the search, the highlight and the "is it filtered" of the grid all ask it.
  it('trims and folds the search, and reads no search as nothing to look for', () => {
    expect(foldedSearch(undefined)).toBe('');
    expect(foldedSearch('')).toBe('');
    expect(foldedSearch('   ')).toBe('');
    expect(foldedSearch('  Minh  ')).toBe('minh');
    expect(foldedSearch('Đường')).toBe('duong');
  });

  it('says the grid is not filtering for a search that folds to nothing', () => {
    expect(foldedSearch('\u0301')).toBe('');
    expect(isFiltering({ search: '\u0301' }, RESOLVED)).toBe(false);
  });
});
