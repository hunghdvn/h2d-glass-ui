import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  clampIso,
  compareIso,
  datePattern,
  formatDate,
  formatMonthYear,
  isIsoDate,
  isIsoMonth,
  isSameMonth,
  monthGrid,
  parseDate,
  parseIso,
  startOfWeek,
  endOfWeek,
  toIso,
  todayIso,
  weekdayNames,
} from './date';

describe('isIsoDate', () => {
  it('is true for valid dates including leap day and bounds', () => {
    expect(isIsoDate('2026-11-14')).toBe(true);
    expect(isIsoDate('2024-02-29')).toBe(true);
    expect(isIsoDate('0001-01-01')).toBe(true);
    expect(isIsoDate('9999-12-31')).toBe(true);
  });

  it('is false for invalid dates, shapes and non-strings', () => {
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-00-10')).toBe(false);
    expect(isIsoDate('2026-11-31')).toBe(false);
    expect(isIsoDate('2026-1-05')).toBe(false);
    expect(isIsoDate('26-11-14')).toBe(false);
    expect(isIsoDate('2026-11-14T00:00')).toBe(false);
    expect(isIsoDate(' 2026-11-14')).toBe(false);
    expect(isIsoDate('0000-01-01')).toBe(false);
    expect(isIsoDate(20261114)).toBe(false);
    expect(isIsoDate(null)).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
});

describe('isIsoMonth', () => {
  it('is true for valid months and false otherwise', () => {
    expect(isIsoMonth('2026-11')).toBe(true);
    expect(isIsoMonth('0001-01')).toBe(true);
    expect(isIsoMonth('2026-13')).toBe(false);
    expect(isIsoMonth('2026-00')).toBe(false);
    expect(isIsoMonth('2026-1')).toBe(false);
    expect(isIsoMonth('2026-11-01')).toBe(false);
    expect(isIsoMonth('0000-05')).toBe(false);
    expect(isIsoMonth(202611)).toBe(false);
  });
});

describe('parseIso', () => {
  it('returns parts for a valid date and null otherwise', () => {
    expect(parseIso('2026-11-14')).toEqual({ year: 2026, month: 11, day: 14 });
    expect(parseIso('2026-02-30')).toBeNull();
  });
});

describe('toIso', () => {
  it('zero-pads the parts', () => {
    expect(toIso(2026, 1, 5)).toBe('2026-01-05');
    expect(toIso(5, 1, 2)).toBe('0005-01-02');
  });
});

describe('addDays', () => {
  it('adds and subtracts days across month and year boundaries', () => {
    expect(addDays('2026-11-14', 1)).toBe('2026-11-15');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-11-14', 0)).toBe('2026-11-14');
    expect(addDays('2026-11-14', 7)).toBe('2026-11-21');
    expect(addDays('2026-11-14', -14)).toBe('2026-10-31');
  });

  it('handles years below 100', () => {
    expect(addDays('0099-12-31', 1)).toBe('0100-01-01');
    expect(addDays('0050-03-01', -1)).toBe('0050-02-28');
  });
});

describe('addMonths', () => {
  it('adds months and clamps the day', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-05-31', 1)).toBe('2026-06-30');
    expect(addMonths('2026-11-14', 2)).toBe('2027-01-14');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(addMonths('2026-11-14', 0)).toBe('2026-11-14');
    expect(addMonths('2026-11-14', 24)).toBe('2028-11-14');
    expect(addMonths('2026-11-14', -13)).toBe('2025-10-14');
  });

  it('handles years below 100', () => {
    expect(addMonths('0050-01-31', 1)).toBe('0050-02-28');
  });
});

describe('addYears', () => {
  it('adds years and handles 29 February', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2024-02-29', 4)).toBe('2028-02-29');
    expect(addYears('2026-11-14', -1)).toBe('2025-11-14');
  });
});

describe('compareIso', () => {
  it('compares dates and months', () => {
    expect(compareIso('2026-11-14', '2026-11-15')).toBe(-1);
    expect(compareIso('2026-11-14', '2026-11-14')).toBe(0);
    expect(compareIso('2027-01-01', '2026-12-31')).toBe(1);
    expect(compareIso('2026-11', '2026-12')).toBe(-1);
  });
});

describe('clampIso', () => {
  it('clamps to min or max, min checked first', () => {
    expect(clampIso('2026-11-14', '2026-11-20')).toBe('2026-11-20');
    expect(clampIso('2026-11-14', undefined, '2026-11-10')).toBe('2026-11-10');
    expect(clampIso('2026-11-14')).toBe('2026-11-14');
    expect(clampIso('2026-11-14', '2026-11-10', '2026-11-20')).toBe('2026-11-14');
    expect(clampIso('2026-11-14', '2026-11-20', '2026-11-10')).toBe('2026-11-20');
  });
});

describe('isSameMonth', () => {
  it('compares year and month', () => {
    expect(isSameMonth('2026-11-01', '2026-11-30')).toBe(true);
    expect(isSameMonth('2026-11-30', '2026-12-01')).toBe(false);
    expect(isSameMonth('2026-11', '2026-11-14')).toBe(true);
    expect(isSameMonth('2025-11-14', '2026-11-14')).toBe(false);
  });
});

describe('startOfWeek', () => {
  it('returns the start of the week', () => {
    expect(startOfWeek('2026-11-14', 0)).toBe('2026-11-08');
    expect(startOfWeek('2026-11-14', 1)).toBe('2026-11-09');
    expect(startOfWeek('2026-11-14', 6)).toBe('2026-11-14');
    expect(startOfWeek('2026-11-01', 0)).toBe('2026-11-01');
    expect(startOfWeek('2026-11-01', 1)).toBe('2026-10-26');
    expect(startOfWeek('2027-01-01', 1)).toBe('2026-12-28');
  });
});

describe('endOfWeek', () => {
  it('returns the end of the week', () => {
    expect(endOfWeek('2026-11-14', 0)).toBe('2026-11-14');
    expect(endOfWeek('2026-11-14', 1)).toBe('2026-11-15');
    expect(endOfWeek('2026-11-14', 6)).toBe('2026-11-20');
  });
});

describe('monthGrid', () => {
  it('has the expected first and last cells for weekStartsOn 0', () => {
    const grid = monthGrid('2026-11', 0);
    expect(grid).toHaveLength(6);
    grid.forEach((row) => expect(row).toHaveLength(7));
    expect(grid[0]![0]!).toEqual({ date: '2026-11-01', inMonth: true });
    expect(grid[5]![6]!).toEqual({ date: '2026-12-12', inMonth: false });
  });

  it('has the expected first and last cells for weekStartsOn 1', () => {
    const grid = monthGrid('2026-11', 1);
    expect(grid[0]![0]!).toEqual({ date: '2026-10-26', inMonth: false });
    expect(grid[0]![6]!).toEqual({ date: '2026-11-01', inMonth: true });
    expect(grid[5]![6]!).toEqual({ date: '2026-12-06', inMonth: false });
  });

  it('covers every month 2024-2027 for weekStartsOn 0 and 1', () => {
    for (let y = 2024; y <= 2027; y++) {
      for (let m = 1; m <= 12; m++) {
        for (const ws of [0, 1]) {
          const month = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`;
          const grid = monthGrid(month, ws);
          expect(grid).toHaveLength(6);
          grid.forEach((row) => expect(row).toHaveLength(7));
          const first = grid[0]![0]!.date;
          const firstParts = first.split('-');
          const fy = Number(firstParts[0]!);
          const fm = Number(firstParts[1]!);
          const fd = Number(firstParts[2]!);
          expect(new Date(Date.UTC(fy, fm - 1, fd)).getUTCDay()).toBe(ws);
          const firstOfMonth = `${month}-01`;
          let foundRow = -1;
          for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 7; c++) {
              if (grid[r]![c]!.date === firstOfMonth) foundRow = r;
            }
          }
          expect(foundRow).toBe(0);
          const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
          const inMonthDates = grid
            .flat()
            .filter((c) => c.inMonth)
            .map((c) => c.date);
          expect(inMonthDates).toHaveLength(n);
          for (let d = 1; d <= n; d++) {
            expect(inMonthDates[d - 1]!).toBe(`${month}-${String(d).padStart(2, '0')}`);
          }
          // Consecutive days, checked without the helpers under test.
          const flat = grid.flat().map((c) => c.date);
          for (let i = 1; i < flat.length; i++) {
            const [py, pm, pd] = flat[i - 1]!.split('-').map(Number);
            const next = new Date(Date.UTC(py!, pm! - 1, pd! + 1)).toISOString().slice(0, 10);
            expect(flat[i]!).toBe(next);
          }
        }
      }
    }
  });

  it('uses the month of a full date', () => {
    expect(monthGrid('2026-11-14', 0)).toEqual(monthGrid('2026-11', 0));
  });
});

describe('formatMonthYear', () => {
  it('formats the month and year', () => {
    expect(formatMonthYear('2026-11', 'en-US')).toBe('November 2026');
    expect(formatMonthYear('2026-11', 'de-DE')).toBe('November 2026');
    expect(formatMonthYear('2026-11', 'vi-VN')).toBe('tháng 11 năm 2026');
    expect(formatMonthYear('2026-11-14', 'en-US')).toBe('November 2026');
  });

  it('stays Gregorian whatever the locale default calendar is', () => {
    expect(formatMonthYear('2026-11', 'th-TH')).toContain('2026');
    expect(formatMonthYear('2026-11', 'th-TH')).not.toContain('2569');
  });
});

describe('weekdayNames', () => {
  it('returns weekday names for the given start', () => {
    expect(weekdayNames('en-US', 0, 'short')).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);
    expect(weekdayNames('en-US', 1, 'short')).toEqual([
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]);
    expect(weekdayNames('en-US', 0, 'narrow')).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
    expect(weekdayNames('en-US', 1, 'long')).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(weekdayNames('vi-VN', 1, 'short')).toEqual([
      'Thứ 2',
      'Thứ 3',
      'Thứ 4',
      'Thứ 5',
      'Thứ 6',
      'Thứ 7',
      'CN',
    ]);
    expect(weekdayNames('de-DE', 6, 'short')).toEqual(['Sa', 'So', 'Mo', 'Di', 'Mi', 'Do', 'Fr']);
  });
});

describe('formatDate', () => {
  it('uses the default numeric form', () => {
    expect(formatDate('2026-11-14', 'en-US')).toBe('11/14/2026');
    expect(formatDate('2026-11-14', 'vi-VN')).toBe('14/11/2026');
    expect(formatDate('2026-11-14', 'de-DE')).toBe('14.11.2026');
    expect(formatDate('2026-01-05', 'en-US')).toBe('01/05/2026');
  });

  it('replaces fields with options', () => {
    expect(
      formatDate('2026-11-14', 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    ).toBe('Saturday, November 14, 2026');
    expect(
      formatDate('2026-11-14', 'vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    ).toBe('Thứ Bảy, 14 tháng 11, 2026');
  });

  it('always uses UTC', () => {
    expect(
      formatDate('2026-11-14', 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Pacific/Kiritimati',
      }),
    ).toBe('11/14/2026');
    expect(
      formatDate('2026-11-14', 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'America/Los_Angeles',
      }),
    ).toBe('11/14/2026');
  });
});

describe('datePattern', () => {
  it('returns the typing placeholder', () => {
    expect(datePattern('en-US')).toBe('mm/dd/yyyy');
    expect(datePattern('vi-VN')).toBe('dd/mm/yyyy');
    expect(datePattern('de-DE')).toBe('dd.mm.yyyy');
    expect(datePattern('ko-KR')).toBe('yyyy. mm. dd.');
  });
});

describe('parseDate', () => {
  it('parses en-US text in locale order', () => {
    expect(parseDate('11/14/2026', 'en-US')).toBe('2026-11-14');
    expect(parseDate('11-14-2026', 'en-US')).toBe('2026-11-14');
    expect(parseDate('11.14.2026', 'en-US')).toBe('2026-11-14');
    expect(parseDate(' 11 14 2026 ', 'en-US')).toBe('2026-11-14');
    expect(parseDate('1/5/2026', 'en-US')).toBe('2026-01-05');
  });

  it('parses other locales', () => {
    expect(parseDate('14/11/2026', 'vi-VN')).toBe('2026-11-14');
    expect(parseDate('14.11.2026', 'de-DE')).toBe('2026-11-14');
    expect(parseDate('2026. 11. 14.', 'ko-KR')).toBe('2026-11-14');
  });

  it('handles two-digit years', () => {
    expect(parseDate('11/14/26', 'en-US')).toBe('2026-11-14');
    expect(parseDate('1/1/99', 'en-US')).toBe('2099-01-01');
    expect(parseDate('1/1/00', 'en-US')).toBe('2000-01-01');
  });

  it('returns null for invalid text', () => {
    expect(parseDate('2/30/2026', 'en-US')).toBeNull();
    expect(parseDate('13/01/2026', 'en-US')).toBeNull();
    expect(parseDate('0/10/2026', 'en-US')).toBeNull();
    expect(parseDate('11/14', 'en-US')).toBeNull();
    expect(parseDate('11/14/2026/1', 'en-US')).toBeNull();
    expect(parseDate('11/14/202', 'en-US')).toBeNull();
    expect(parseDate('11/14/02026', 'en-US')).toBeNull();
    expect(parseDate('111/14/2026', 'en-US')).toBeNull();
    expect(parseDate('11/14/0000', 'en-US')).toBeNull();
    expect(parseDate('', 'en-US')).toBeNull();
    expect(parseDate('abc', 'en-US')).toBeNull();
  });

  it('round trips formatDate output', () => {
    for (const locale of ['en-US', 'vi-VN', 'de-DE', 'th-TH', 'fa-IR', 'ar-EG']) {
      for (const d of ['2026-01-05', '2024-02-29', '2026-12-31']) {
        expect(parseDate(formatDate(d, locale), locale)).toBe(d);
      }
    }
  });
});

describe('todayIso', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the local date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 14, 23, 59));
    expect(todayIso()).toBe('2026-11-14');
    vi.setSystemTime(new Date(2026, 0, 1, 0, 0));
    expect(todayIso()).toBe('2026-01-01');
  });
});
