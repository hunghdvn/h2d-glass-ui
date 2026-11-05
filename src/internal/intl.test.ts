import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dateTimeFormat, numberFormat } from './intl';
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
});
