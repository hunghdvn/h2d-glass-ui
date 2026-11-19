import { describe, expect, it } from 'vitest';
import type { FlatRow } from './flatten';
import { clampPageIndex, pageCount, pageRows } from './page';

function flat(count: number): FlatRow<{ n: number }>[] {
  return Array.from({ length: count }, (_, index) => ({
    kind: 'data' as const,
    key: index,
    row: { n: index },
    index,
  }));
}

describe('pageCount', () => {
  it('rounds up', () => {
    expect(pageCount(135, 12)).toBe(12);
    expect(pageCount(120, 12)).toBe(10);
    expect(pageCount(121, 12)).toBe(11);
    expect(pageCount(1, 20)).toBe(1);
  });

  it('is at least 1, even with no rows', () => {
    expect(pageCount(0, 20)).toBe(1);
  });

  it('is 1 for a size that is not a number above 0', () => {
    for (const size of [0, -5, Number.NaN, Infinity]) expect(pageCount(50, size)).toBe(1);
  });

  it('reads a fractional size as its whole part', () => {
    expect(pageCount(10, 2.9)).toBe(5);
  });
});

describe('clampPageIndex', () => {
  it('keeps an index that is in range', () => {
    expect(clampPageIndex(0, 135, 12)).toBe(0);
    expect(clampPageIndex(5, 135, 12)).toBe(5);
    expect(clampPageIndex(11, 135, 12)).toBe(11);
  });

  it('brings an index past the end back to the last page, and one below 0 to 0', () => {
    expect(clampPageIndex(12, 135, 12)).toBe(11);
    expect(clampPageIndex(1000, 135, 12)).toBe(11);
    expect(clampPageIndex(-3, 135, 12)).toBe(0);
  });

  it('gives a whole number: a fraction is cut, anything not finite is 0', () => {
    expect(clampPageIndex(2.8, 135, 12)).toBe(2);
    for (const index of [Number.NaN, Infinity, -Infinity]) {
      expect(clampPageIndex(index, 135, 12)).toBe(0);
    }
  });

  it('is 0 when there are no rows', () => {
    expect(clampPageIndex(4, 0, 12)).toBe(0);
  });
});

describe('pageRows', () => {
  it('cuts the rows of a page, with their place in the whole list', () => {
    const page = pageRows(flat(30), { index: 1, size: 12 });
    expect(page).toHaveLength(12);
    expect(page[0]!.index).toBe(12);
    expect(page.at(-1)!.index).toBe(23);
  });

  it('gives a short last page', () => {
    expect(pageRows(flat(30), { index: 2, size: 12 })).toHaveLength(6);
  });

  it('cuts the clamped page, so a page past the end shows the last one', () => {
    expect(pageRows(flat(30), { index: 9, size: 12 })[0]!.index).toBe(24);
    expect(pageRows(flat(30), { index: -1, size: 12 })[0]!.index).toBe(0);
  });

  it('gives nothing for no rows', () => {
    expect(pageRows([], { index: 3, size: 10 })).toEqual([]);
  });

  it('gives every row for a size that is not a number above 0', () => {
    expect(pageRows(flat(5), { index: 0, size: 0 })).toHaveLength(5);
    expect(pageRows(flat(5), { index: 2, size: Number.NaN })).toHaveLength(5);
  });

  it('does not change what it is given', () => {
    const rows = flat(30);
    pageRows(rows, { index: 1, size: 12 });
    expect(rows).toHaveLength(30);
  });
});
