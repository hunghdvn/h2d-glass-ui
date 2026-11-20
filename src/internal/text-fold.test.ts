import { describe, expect, it } from 'vitest';
import {
  containsFolded,
  findMatchFolded,
  findMatches,
  findMatchesFolded,
  foldText,
  foldWithMap,
  includesFolded,
} from './text-fold';

describe('foldText', () => {
  it('lower cases, removes diacritics, and turns đ into d', () => {
    expect(foldText('Đường Hà Nội')).toBe('duong ha noi');
    expect(foldText('ĐÀ NẴNG')).toBe('da nang');
  });
});

describe('the Greek sigma', () => {
  it('folds the final sigma and ς to σ, the same in the whole string and in a match', () => {
    expect(foldText('ΟΔΟΣ')).toBe('οδοσ');
    expect(foldText('οδος')).toBe('οδοσ');
    expect(foldText('οδοσ')).toBe('οδοσ');
  });

  it('finds ΟΔΟΣ by οδος and by οδοσ, and the range covers it', () => {
    for (const query of ['οδος', 'οδοσ']) {
      expect(includesFolded('ΟΔΟΣ', query)).toBe(true);
      expect(findMatches('ΟΔΟΣ', query)).toEqual([{ start: 0, end: 4 }]);
    }
  });
});

describe('containsFolded', () => {
  it('matches an empty query, and else asks the folded text to contain the folded query', () => {
    expect(containsFolded('ha noi', '')).toBe(true);
    expect(containsFolded('ha noi', 'noi')).toBe(true);
    expect(containsFolded('ha noi', 'hue')).toBe(false);
  });
});

describe('includesFolded', () => {
  it('finds Vietnamese text with a folded query', () => {
    expect(includesFolded('Hà Nội', 'ha noi')).toBe(true);
    expect(includesFolded('Đà Nẵng', 'da nang')).toBe(true);
    expect(includesFolded('Đà Nẵng', 'DA')).toBe(true);
    expect(includesFolded('Huế', 'huê')).toBe(true);
  });

  it('folds the text and the query the same way, NFC or NFD', () => {
    expect(includesFolded('Đường', 'duong')).toBe(true);
    expect(includesFolded('Đường'.normalize('NFD'), 'duong')).toBe(true);
    expect(includesFolded('duong', 'Đường'.normalize('NFD'))).toBe(true);
  });

  it('is true for an empty query and for a query of only combining marks', () => {
    expect(includesFolded('Hà Nội', '')).toBe(true);
    expect(includesFolded('Hà Nội', '\u0301')).toBe(true);
    expect(includesFolded('Hà Nội', 'xyz')).toBe(false);
    expect(includesFolded('', 'a')).toBe(false);
  });
});

describe('findMatches', () => {
  it('returns the matches as UTF-16 ranges of the original text', () => {
    expect(findMatches('Hà Nội', 'ha')).toEqual([{ start: 0, end: 2 }]);
    expect(findMatches('Thành phố Hà Nội', 'ha noi')).toEqual([{ start: 10, end: 16 }]);
    expect(findMatches('Đà Nẵng', 'nang')).toEqual([{ start: 3, end: 7 }]);
  });

  it('returns every match of "minh" in "Minh Minh", left to right', () => {
    expect(findMatches('Minh Minh', 'minh')).toEqual([
      { start: 0, end: 4 },
      { start: 5, end: 9 },
    ]);
    expect(findMatches('Nguyễn Minh Anh', 'MINH')).toEqual([{ start: 7, end: 11 }]);
  });

  it('finds "duong" in "Đường", precomposed and decomposed', () => {
    expect(findMatches('Đường', 'duong')).toEqual([{ start: 0, end: 5 }]);
    // D + U+0111 is one letter; Đ has no decomposition, the rest does: ườ is u + two marks.
    const decomposed = 'Đường'.normalize('NFD');
    expect(findMatches(decomposed, 'duong')).toEqual([{ start: 0, end: decomposed.length }]);
  });

  it('does not overlap: "a" in "aaa" is three matches, "aa" in "aaa" one', () => {
    expect(findMatches('aaa', 'a')).toEqual([
      { start: 0, end: 1 },
      { start: 1, end: 2 },
      { start: 2, end: 3 },
    ]);
    expect(findMatches('aaa', 'aa')).toEqual([{ start: 0, end: 2 }]);
  });

  it('takes the combining marks that follow the last matched character', () => {
    expect(findMatches('Ha\u0300 Noi', 'ha')).toEqual([{ start: 0, end: 3 }]);
    // A match that ends before a mark takes it, the next one starts after it.
    expect(findMatches('a\u0301a', 'a')).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 3 },
    ]);
  });

  it('keeps indices right when a surrogate pair precedes or sits in the text', () => {
    expect(findMatches('😀 Hà', 'ha')).toEqual([{ start: 3, end: 5 }]);
    expect(findMatches('😀a😀a', 'a')).toEqual([
      { start: 2, end: 3 },
      { start: 5, end: 6 },
    ]);
    expect(findMatches('a😀b', '😀')).toEqual([{ start: 1, end: 3 }]);
  });

  it('returns nothing for an empty query, a query of only marks, and no occurrence', () => {
    expect(findMatches('Hà Nội', '')).toEqual([]);
    expect(findMatches('Hà Nội', '\u0301')).toEqual([]);
    expect(findMatches('Hà Nội', 'xyz')).toEqual([]);
    expect(findMatches('', 'a')).toEqual([]);
  });
});

describe('findMatchesFolded and findMatchFolded', () => {
  it('give the same ranges as findMatches on a text and a query folded once', () => {
    const text = 'Minh gặp Minh ở Đường Minh';
    const folded = foldWithMap(text);
    const query = foldText('MINH');
    expect(findMatchesFolded(text, folded, query)).toEqual(findMatches(text, 'MINH'));
    expect(findMatchesFolded(text, folded, query)).toHaveLength(3);
  });

  it('findMatchFolded is the first of them, and null when there is none', () => {
    const text = 'Ha Ha';
    const folded = foldWithMap(text);
    expect(findMatchFolded(text, folded, 'ha')).toEqual({ start: 0, end: 2 });
    expect(findMatchFolded(text, folded, 'xyz')).toBeNull();
    expect(findMatchFolded(text, folded, '')).toBeNull();
  });
});

describe('foldText folds a whole string and agrees with the fold of each code point', () => {
  // `foldWithMap` folds one code point at a time, which is what a highlight maps back through.
  const perCodePoint = (text: string) => foldWithMap(text).folded;

  it('gives for every BMP code point (lone surrogates apart) what the per-code-point fold gives', () => {
    const differing: string[] = [];
    for (let code = 0; code <= 0xffff; code++) {
      if (code >= 0xd800 && code <= 0xdfff) continue;
      const ch = String.fromCharCode(code);
      if (foldText(ch) !== perCodePoint(ch)) differing.push(code.toString(16));
    }
    expect(differing).toEqual([]);
  });

  it('gives the same for a sample of astral code points', () => {
    const differing: string[] = [];
    for (let code = 0x10000; code <= 0x10ffff; code += 97) {
      const ch = String.fromCodePoint(code);
      if (foldText(ch) !== perCodePoint(ch)) differing.push(code.toString(16));
    }
    expect(differing).toEqual([]);
  });

  const corpus = [
    '',
    'Nguyễn Minh Anh 123',
    'Đường Hà Nội, ĐÀ NẴNG đ Đ',
    'Nguyễn Minh Anh'.normalize('NFD'),
    'Đường Hà Nội'.normalize('NFD'),
    'ΟΔΟΣ',
    'οδος',
    'Σ',
    'ΣΑΣ ΣΟΦΟΣ. ΑΣ',
    'İstanbul ISTANBUL ıi',
    'a\u0301\u0323 e\u0302\u0301 ạ\u0301',
    '\u0301 lone mark',
    '😀 Hà 😀a👨‍👩‍👧',
    'ǅ ǆ ẞ ß ﬁ ① Å K',
    '한국어 ﾊﾝｸﾞﾙ',
  ];

  it('gives for each string of a corpus the joined per-code-point folds, and the text foldWithMap gives', () => {
    for (const text of corpus) {
      const joined = [...text].map((ch) => foldText(ch)).join('');
      expect(foldText(text), text).toBe(joined);
      expect(foldText(text), text).toBe(perCodePoint(text));
    }
  });
});
