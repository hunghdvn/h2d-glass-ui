import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../../internal/warn';
import { createTextCache, formatValue, isBlank, toComparable } from './values';

const DAY = 86_400_000;
const NOV_5 = Date.UTC(2026, 10, 5);
const OPTIONS = { locale: 'en-US', timeZone: 'UTC', yes: 'Yes', no: 'No' };

function warnings(spy: MockInstance): string[] {
  return spy.mock.calls.map(([message]) => String(message));
}

describe('values', () => {
  let warn: MockInstance;
  beforeEach(() => {
    resetDevWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  describe('isBlank', () => {
    it('is true for null, undefined, an empty string, NaN and an invalid date', () => {
      for (const value of [null, undefined, '', Number.NaN, new Date('nope')]) {
        expect(isBlank(value)).toBe(true);
      }
    });

    it('is false for everything that is a value, 0, false and a space included', () => {
      for (const value of [0, false, ' ', 'x', -1, Infinity, new Date(0), [], {}]) {
        expect(isBlank(value)).toBe(false);
      }
    });
  });

  describe('toComparable', () => {
    it('gives null for a blank value of every type', () => {
      for (const dataType of ['string', 'number', 'date', 'datetime', 'boolean'] as const) {
        for (const value of [null, undefined, '', Number.NaN, new Date('nope')]) {
          expect(toComparable(value, dataType)).toBeNull();
        }
      }
      expect(warn).not.toHaveBeenCalled();
    });

    it('takes a string as it is, and a number or bigint as its text', () => {
      expect(toComparable('DH-1', 'string')).toBe('DH-1');
      expect(toComparable(42, 'string')).toBe('42');
      expect(toComparable(10n, 'string')).toBe('10');
    });

    it('takes a number as it is', () => {
      expect(toComparable(-3.5, 'number')).toBe(-3.5);
      expect(toComparable(0, 'number')).toBe(0);
    });

    it('turns a boolean into 0 or 1', () => {
      expect(toComparable(false, 'boolean')).toBe(0);
      expect(toComparable(true, 'boolean')).toBe(1);
    });

    it('reads a date as its UTC calendar day', () => {
      expect(toComparable('2026-11-05', 'date')).toBe(NOV_5);
      expect(toComparable(new Date(NOV_5), 'date')).toBe(NOV_5);
      // The time of day does not move the day, and the zone of the machine does not either.
      expect(toComparable(new Date(NOV_5 + DAY - 1), 'date')).toBe(NOV_5);
      expect(toComparable(new Date(NOV_5 + 23 * 3_600_000), 'date')).toBe(NOV_5);
      expect(
        Number(toComparable('2026-11-06', 'date')) - Number(toComparable('2026-11-05', 'date')),
      ).toBe(DAY);
    });

    it('reads a datetime as an instant: a Date, milliseconds or an ISO string with an offset', () => {
      const instant = Date.UTC(2026, 10, 5, 20, 30);
      expect(toComparable(new Date(instant), 'datetime')).toBe(instant);
      expect(toComparable(instant, 'datetime')).toBe(instant);
      expect(toComparable('2026-11-05T20:30:00Z', 'datetime')).toBe(instant);
      expect(toComparable('2026-11-05T20:30Z', 'datetime')).toBe(instant);
      expect(toComparable('2026-11-05T20:30:00.250Z', 'datetime')).toBe(instant + 250);
      expect(toComparable('2026-11-06T03:30:00+07:00', 'datetime')).toBe(instant);
      expect(toComparable('2026-11-05T15:00:00-05:30', 'datetime')).toBe(instant);
    });

    it('refuses a datetime string without an offset, so no machine zone is ever read', () => {
      expect(toComparable('2026-11-05T20:30:00', 'datetime')).toBeNull();
      expect(toComparable('2026-11-05', 'datetime')).toBeNull();
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a datetime column has a value that is not a Date, a number of milliseconds or an ISO 8601 date-time with an offset (Z or +hh:mm); it is shown blank.`,
      ]);
    });

    it('refuses a datetime string that is not a real moment', () => {
      for (const text of [
        '2026-13-05T20:30:00Z',
        '2026-02-30T20:30:00Z',
        '2026-11-05T24:00:00Z',
        '2026-11-05T20:60:00Z',
        '2026-11-05T20:30:60Z',
        '2026-11-05T20:30:00+24:00',
        'not a date',
      ]) {
        expect(toComparable(text, 'datetime')).toBeNull();
      }
    });

    it('refuses what a date column cannot read, and never reads a string with new Date()', () => {
      expect(toComparable('2026-02-30', 'date')).toBeNull();
      expect(toComparable('11/05/2026', 'date')).toBeNull();
      expect(toComparable('November 5, 2026', 'date')).toBeNull();
      expect(toComparable('2026-11-05T10:00:00Z', 'date')).toBeNull();
      expect(toComparable(NOV_5, 'date')).toBeNull();
      expect(toComparable(true, 'date')).toBeNull();
    });

    it('refuses what a number or a boolean column cannot read', () => {
      expect(toComparable('12', 'number')).toBeNull();
      expect(toComparable(Infinity, 'number')).toBeNull();
      expect(toComparable(true, 'number')).toBeNull();
      expect(toComparable(1, 'boolean')).toBeNull();
      expect(toComparable('true', 'boolean')).toBeNull();
    });

    it('refuses an object in a string column', () => {
      expect(toComparable({}, 'string')).toBeNull();
      expect(toComparable(true, 'string')).toBeNull();
    });

    it('warns once per type, in words that hold no value', () => {
      toComparable('12', 'number');
      toComparable('34', 'number');
      toComparable('nope', 'date');
      toComparable('nope again', 'date');
      toComparable('yes', 'boolean');
      toComparable({ secret: 'value' }, 'string');
      expect(warnings(warn)).toEqual([
        `${WARN_PREFIX} <DataGrid> a number column has a value that is not a finite number; it is shown blank.`,
        `${WARN_PREFIX} <DataGrid> a date column has a value that is not a Date or a YYYY-MM-DD string; it is shown blank.`,
        `${WARN_PREFIX} <DataGrid> a boolean column has a value that is not true or false; it is shown blank.`,
        `${WARN_PREFIX} <DataGrid> a string column has a value that is not a string or a number; it is shown blank.`,
      ]);
    });
  });

  describe('formatValue', () => {
    it('gives an empty text for a blank value, and for one the type refuses', () => {
      expect(formatValue(null, 'string', OPTIONS)).toBe('');
      expect(formatValue('', 'number', OPTIONS)).toBe('');
      expect(formatValue(Number.NaN, 'number', OPTIONS)).toBe('');
      expect(formatValue('abc', 'number', OPTIONS)).toBe('');
      expect(formatValue('2026-02-30', 'date', OPTIONS)).toBe('');
      expect(formatValue('2026-11-05T10:00:00', 'datetime', OPTIONS)).toBe('');
    });

    it('writes a string as it is', () => {
      expect(formatValue('Nguyễn Văn An', 'string', OPTIONS)).toBe('Nguyễn Văn An');
    });

    it('writes a number in the locale, as Intl does', () => {
      expect(formatValue(1234567.891, 'number', OPTIONS)).toBe(
        new Intl.NumberFormat('en-US').format(1234567.891),
      );
      expect(formatValue(1234567.891, 'number', { ...OPTIONS, locale: 'vi-VN' })).toBe(
        new Intl.NumberFormat('vi-VN').format(1234567.891),
      );
    });

    it('applies the Intl options of the column to a number', () => {
      const options = { style: 'currency', currency: 'VND' } as const;
      expect(formatValue(1250000, 'number', { ...OPTIONS, locale: 'vi-VN', options })).toBe(
        new Intl.NumberFormat('vi-VN', options).format(1250000),
      );
    });

    it('writes a date as day, month and year in the order of the locale', () => {
      expect(formatValue('2026-11-05', 'date', OPTIONS)).toBe('11/05/2026');
      expect(formatValue('2026-11-05', 'date', { ...OPTIONS, locale: 'vi-VN' })).toBe('05/11/2026');
      expect(formatValue(new Date(NOV_5), 'date', OPTIONS)).toBe('11/05/2026');
    });

    it('keeps the calendar day of a date whatever the zone of the grid is', () => {
      const late = new Date(NOV_5 + 23 * 3_600_000);
      expect(formatValue(late, 'date', { ...OPTIONS, timeZone: 'Asia/Ho_Chi_Minh' })).toBe(
        '11/05/2026',
      );
      expect(formatValue(late, 'date', { ...OPTIONS, timeZone: 'America/Los_Angeles' })).toBe(
        '11/05/2026',
      );
    });

    it('applies the Intl options of the column to a date', () => {
      const options = { dateStyle: 'medium' } as const;
      expect(formatValue('2026-11-05', 'date', { ...OPTIONS, options })).toBe(
        new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(NOV_5),
      );
    });

    it('writes a datetime in the zone of the grid', () => {
      const instant = Date.UTC(2026, 10, 5, 20, 30);
      const short = { dateStyle: 'short', timeStyle: 'short' } as const;
      const utc = formatValue(instant, 'datetime', OPTIONS);
      const hcm = formatValue(instant, 'datetime', { ...OPTIONS, timeZone: 'Asia/Ho_Chi_Minh' });
      expect(utc).toBe(
        new Intl.DateTimeFormat('en-US', { ...short, timeZone: 'UTC' }).format(instant),
      );
      expect(hcm).toBe(
        new Intl.DateTimeFormat('en-US', { ...short, timeZone: 'Asia/Ho_Chi_Minh' }).format(
          instant,
        ),
      );
      // 20:30 UTC is already the next day at UTC+7.
      expect(hcm).not.toBe(utc);
      expect(hcm).toContain('11/6/26');
    });

    it('lets the Intl options of a datetime column replace the two styles, and keeps the zone', () => {
      const instant = Date.UTC(2026, 10, 5, 20, 30);
      const options = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const;
      expect(
        formatValue(instant, 'datetime', { ...OPTIONS, timeZone: 'Asia/Ho_Chi_Minh', options }),
      ).toBe(
        new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'Asia/Ho_Chi_Minh' }).format(
          instant,
        ),
      );
      // A zone named by the column's own options wins over the grid's.
      expect(
        formatValue(instant, 'datetime', {
          ...OPTIONS,
          timeZone: 'Asia/Ho_Chi_Minh',
          options: { ...options, timeZone: 'UTC' },
        }),
      ).toBe(new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(instant));
    });

    it('writes a boolean as the words it is given, for search and CSV to read', () => {
      expect(formatValue(true, 'boolean', OPTIONS)).toBe('Yes');
      expect(formatValue(false, 'boolean', OPTIONS)).toBe('No');
      expect(formatValue(true, 'boolean', { ...OPTIONS, yes: 'Có', no: 'Không' })).toBe('Có');
    });
  });

  describe('createTextCache', () => {
    function column(id: string) {
      return { id, text: vi.fn((row: { n: number }) => `${id}:${row.n}`) };
    }

    it('writes the text of a cell once per row object and column', () => {
      const cache = createTextCache<{ n: number }>();
      const a = column('a');
      const row = { n: 1 };
      expect(cache.text(row, a)).toBe('a:1');
      expect(cache.text(row, a)).toBe('a:1');
      expect(a.text).toHaveBeenCalledTimes(1);
    });

    it('keeps a text apart per column and per row', () => {
      const cache = createTextCache<{ n: number }>();
      const a = column('a');
      const b = column('b');
      const first = { n: 1 };
      const second = { n: 2 };
      expect(cache.text(first, a)).toBe('a:1');
      expect(cache.text(first, b)).toBe('b:1');
      expect(cache.text(second, a)).toBe('a:2');
      expect(a.text).toHaveBeenCalledTimes(2);
      expect(b.text).toHaveBeenCalledTimes(1);
    });

    it('writes the text again for a new row object, as immutable data asks', () => {
      const cache = createTextCache<{ n: number }>();
      const a = column('a');
      cache.text({ n: 1 }, a);
      cache.text({ n: 1 }, a);
      expect(a.text).toHaveBeenCalledTimes(2);
    });

    it('writes the text again for a new resolved column of the same id, since its locale may differ', () => {
      const cache = createTextCache<{ n: number }>();
      const row = { n: 1 };
      expect(cache.text(row, { id: 'a', text: () => 'en' })).toBe('en');
      expect(cache.text(row, { id: 'a', text: () => 'vi' })).toBe('vi');
    });

    it('gives the text of a row that cannot be remembered', () => {
      const cache = createTextCache<number | null>();
      const a = { id: 'a', text: vi.fn((row: number | null) => `a:${String(row)}`) };
      expect(cache.text(5, a)).toBe('a:5');
      expect(cache.text(null, a)).toBe('a:null');
      expect(a.text).toHaveBeenCalledTimes(2);
    });
    describe('folded', () => {
      function named(id: string) {
        return { id, text: vi.fn((row: { name: string }) => row.name) };
      }

      it('gives the text folded: lower case, without accents, đ as d', () => {
        const cache = createTextCache<{ name: string }>();
        expect(cache.folded({ name: 'Đường Hà Nội' }, named('a'))).toBe('duong ha noi');
      });

      it('folds a cell once per row object and column, and reads its text from the same cache', () => {
        const cache = createTextCache<{ name: string }>();
        const a = named('a');
        const row = { name: 'Minh' };
        expect(cache.folded(row, a)).toBe('minh');
        expect(cache.folded(row, a)).toBe('minh');
        expect(cache.text(row, a)).toBe('Minh');
        // The first call wrote the text, the second read it, the third read it again.
        expect(a.text).toHaveBeenCalledTimes(1);
      });

      it('keeps the folded text apart per column and per row, and again for a new column object', () => {
        const cache = createTextCache<{ name: string }>();
        const first = { name: 'Ánh' };
        const second = { name: 'Bình' };
        expect(cache.folded(first, named('a'))).toBe('anh');
        expect(cache.folded(second, named('a'))).toBe('binh');
        const old = { id: 'a', text: () => 'EN' };
        const next = { id: 'a', text: () => 'VI' };
        expect(cache.folded(first, old)).toBe('en');
        expect(cache.folded(first, next)).toBe('vi');
      });

      it('gives the folded text of a row that cannot be remembered', () => {
        const cache = createTextCache<string>();
        expect(cache.folded('Đà', { id: 'a', text: (row) => row })).toBe('da');
      });
    });
  });
});
