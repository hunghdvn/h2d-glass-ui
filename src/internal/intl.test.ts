import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collator, dateTimeFormat, numberFormat } from './intl';
import { WARN_PREFIX, resetDevWarnings } from './warn';

describe('intl', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('gives the same formatter for the same locale and options', () => {
    expect(dateTimeFormat('vi-VN', { month: 'long' })).toBe(
      dateTimeFormat('vi-VN', { month: 'long' }),
    );
    expect(numberFormat('de-DE')).toBe(numberFormat('de-DE'));
    expect(numberFormat('de-DE')).not.toBe(numberFormat('de-DE', { style: 'percent' }));
  });

  it('keeps dates and numbers apart under the same locale and options', () => {
    expect(dateTimeFormat('en-US')).toBeInstanceOf(Intl.DateTimeFormat);
    expect(numberFormat('en-US')).toBeInstanceOf(Intl.NumberFormat);
  });

  it('falls back to en-US for a locale Intl cannot read, with one warning, and never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const locale of ['vi_VN', 'en_US', '', 'not a locale']) {
      expect(() => dateTimeFormat(locale)).not.toThrow();
      expect(dateTimeFormat(locale).resolvedOptions().locale).toBe('en-US');
      expect(numberFormat(locale, { style: 'percent' }).resolvedOptions().locale).toBe('en-US');
    }
    dateTimeFormat('vi_VN', { year: 'numeric' });
    expect(warn).toHaveBeenCalledWith(
      `${WARN_PREFIX} locale "vi_VN" is not a language tag Intl can read (write "vi-VN"); "en-US" is used.`,
    );
    expect(warn.mock.calls.filter(([message]) => String(message).includes('"vi_VN"'))).toHaveLength(
      1,
    );
  });

  it('says nothing for a locale it can read, even one it has no data for', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dateTimeFormat('vi-VN');
    numberFormat('zz-ZZ');
    expect(warn).not.toHaveBeenCalled();
  });

  describe('collator', () => {
    it('gives the same collator for the same locale and options', () => {
      expect(collator('vi-VN', { numeric: true })).toBe(collator('vi-VN', { numeric: true }));
      expect(collator('vi-VN', { numeric: true })).not.toBe(collator('vi-VN'));
      expect(collator('en-US')).toBeInstanceOf(Intl.Collator);
    });

    it('reads numbers inside text as numbers when asked to', () => {
      const words = ['DH-10', 'DH-2', 'DH-1'];
      expect([...words].sort(collator('en-US', { numeric: true }).compare)).toEqual([
        'DH-1',
        'DH-2',
        'DH-10',
      ]);
      expect([...words].sort(collator('en-US').compare)).toEqual(['DH-1', 'DH-10', 'DH-2']);
    });

    it('keeps a collator apart from a number or date formatter of the same locale', () => {
      expect(collator('en-US')).not.toBe(numberFormat('en-US') as unknown);
      expect(collator('en-US', {})).not.toBe(dateTimeFormat('en-US', {}) as unknown);
    });

    it('falls back to en-US for a locale Intl cannot read, with one warning, and never throws', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => collator('vi_VN')).not.toThrow();
      expect(collator('vi_VN').resolvedOptions().locale).toBe('en-US');
      collator('vi_VN', { numeric: true });
      expect(
        warn.mock.calls.filter(([message]) => String(message).includes('"vi_VN"')),
      ).toHaveLength(1);
    });
  });
});
