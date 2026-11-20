import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { foldText } from '../../internal/text-fold';
import { highlightText } from './highlight';

// The marks of a search (spec phase 6 §4.3 F1 "Tô sáng của tìm kiếm", §6.3): the text of a cell with a
// `mark` around every match of the folded query, in the characters the text has.

const drawn = (node: ReactNode) => {
  const { container } = render(<p>{node}</p>);
  return {
    text: container.textContent,
    marks: Array.from(container.querySelectorAll('mark'), (mark) => mark.textContent),
    classes: Array.from(container.querySelectorAll('mark'), (mark) => mark.className),
  };
};
const mark = (text: string, query: string) => drawn(highlightText(text, foldText(query)));

describe('highlightText', () => {
  it('gives back the very text when there is nothing to look for', () => {
    expect(highlightText('Minh Minh', '')).toBe('Minh Minh');
  });

  it('gives back the very text when nothing matches', () => {
    expect(highlightText('Lê Quang Huy', foldText('minh'))).toBe('Lê Quang Huy');
  });

  it('returns one element that holds the parts, so a flex or grid parent sees one item', () => {
    const { container } = render(<p>{highlightText('Nguyễn Minh Anh', foldText('minh'))}</p>);
    const paragraph = container.firstElementChild!;
    expect(paragraph.childNodes).toHaveLength(1);
    expect(paragraph.firstElementChild!.tagName).toBe('SPAN');
    expect(paragraph.textContent).toBe('Nguyễn Minh Anh');
    expect(paragraph.querySelectorAll('span > mark')).toHaveLength(1);
  });

  it('marks every match of "minh" in "Minh Minh", and keeps the text whole', () => {
    const result = mark('Minh Minh', 'minh');
    expect(result.marks).toEqual(['Minh', 'Minh']);
    expect(result.text).toBe('Minh Minh');
    expect(result.classes).toEqual(['flg-data-grid-match', 'flg-data-grid-match']);
  });

  it('marks the match in the middle of "Nguyễn Minh Anh" and keeps the words around it', () => {
    const result = mark('Nguyễn Minh Anh', 'minh');
    expect(result.marks).toEqual(['Minh']);
    expect(result.text).toBe('Nguyễn Minh Anh');
  });

  it('marks the letters as they are written when the query has no diacritics: "duong" in "Đường"', () => {
    expect(mark('Đường', 'duong').marks).toEqual(['Đường']);
  });

  it('does the same for a text with its marks apart (NFD)', () => {
    const decomposed = 'Đường'.normalize('NFD');
    expect(decomposed).not.toBe('Đường');
    const result = mark(decomposed, 'duong');
    expect(result.marks).toEqual([decomposed]);
    expect(result.text).toBe(decomposed);
  });

  it('finds a query with diacritics in a text without them', () => {
    expect(mark('Duong', 'đường').marks).toEqual(['Duong']);
  });

  it('marks matches that do not overlap, left to right', () => {
    expect(mark('aaa', 'aa').marks).toEqual(['aa']);
  });

  it('keeps a surrogate pair whole', () => {
    const result = mark('a😀b😀c', 'b');
    expect(result.marks).toEqual(['b']);
    expect(result.text).toBe('a😀b😀c');
  });

  it('marks the whole text when it is the match', () => {
    const result = mark('minh', 'MINH');
    expect(result.marks).toEqual(['minh']);
    expect(result.text).toBe('minh');
  });
});
