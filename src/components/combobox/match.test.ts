import { describe, expect, it } from 'vitest';
import { defaultFilter, findMatch, foldText } from './match';

describe('foldText', () => {
  it('lower cases, removes diacritics, and turns đ into d', () => {
    expect(foldText('Đường Hà Nội')).toBe('duong ha noi');
    expect(foldText('ĐÀ NẴNG')).toBe('da nang');
  });
});

describe('defaultFilter', () => {
  it('finds Vietnamese text with a folded query', () => {
    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, 'ha noi')).toBe(true);
    expect(defaultFilter({ value: 'dn', textValue: 'Đà Nẵng' }, 'da nang')).toBe(true);
    expect(defaultFilter({ value: 'da', textValue: 'Đà Nẵng' }, 'DA')).toBe(true);
    expect(defaultFilter({ value: 'hue', textValue: 'Huế' }, 'huê')).toBe(true);
  });

  it('is true for an empty input and for an input of only combining marks', () => {
    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, '')).toBe(true);
    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, '\u0301')).toBe(true);
    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, 'xyz')).toBe(false);
  });

  it('compares textValue, not value', () => {
    expect(defaultFilter({ value: 'hn', textValue: 'Hà Nội' }, 'hn')).toBe(false);
  });
});

describe('findMatch', () => {
  it('returns the first match as UTF-16 indices into the original text', () => {
    expect(findMatch('Hà Nội', 'ha')).toEqual({ start: 0, end: 2 });
    expect(findMatch('Thành phố Hà Nội', 'ha noi')).toEqual({ start: 10, end: 16 });
    expect(findMatch('Đà Nẵng', 'nang')).toEqual({ start: 3, end: 7 });
  });

  it('the first occurrence wins', () => {
    expect(findMatch('Ha Ha', 'ha')).toEqual({ start: 0, end: 2 });
  });

  it('covers combining marks that follow the last matched character', () => {
    expect(findMatch('Ha\u0300 Noi', 'ha')).toEqual({ start: 0, end: 3 });
  });

  it('keeps indices right when a surrogate pair precedes the match', () => {
    expect(findMatch('😀 Hà', 'ha')).toEqual({ start: 3, end: 5 });
  });

  it('returns null for an empty query, a query of only marks, and no occurrence', () => {
    expect(findMatch('Hà Nội', '')).toBeNull();
    expect(findMatch('Hà Nội', '\u0301')).toBeNull();
    expect(findMatch('Hà Nội', 'xyz')).toBeNull();
  });
});
