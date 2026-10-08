import { describe, expect, it } from 'vitest';
import { getPaginationRange } from './pagination-range';
import type { PaginationItem } from './pagination-range';

const range = (count: number, page: number, siblingCount = 1, boundaryCount = 1) =>
  getPaginationRange({ count, page, siblingCount, boundaryCount })
    .map((item) => (typeof item === 'number' ? String(item) : '…'))
    .join(' ');

describe('getPaginationRange', () => {
  it('shows the mockup: page 5 of 12', () => {
    expect(range(12, 5)).toBe('1 … 4 5 6 … 12');
  });

  it('keeps the number of slots near the ends', () => {
    expect(range(12, 1)).toBe('1 2 3 4 5 … 12');
    expect(range(12, 3)).toBe('1 2 3 4 5 … 12');
    expect(range(12, 4)).toBe('1 2 3 4 5 … 12');
    expect(range(12, 9)).toBe('1 … 8 9 10 11 12');
    expect(range(12, 12)).toBe('1 … 8 9 10 11 12');
  });

  it('shows the page itself where a gap would hide only one', () => {
    expect(range(7, 4)).toBe('1 2 3 4 5 6 7');
    expect(range(8, 4)).toBe('1 2 3 4 5 … 8');
    expect(range(9, 5)).toBe('1 … 4 5 6 … 9');
  });

  it('shows every page when there are few', () => {
    expect(range(1, 1)).toBe('1');
    expect(range(3, 2)).toBe('1 2 3');
    expect(range(5, 5)).toBe('1 2 3 4 5');
  });

  it('follows siblingCount and boundaryCount', () => {
    expect(range(20, 10, 2)).toBe('1 … 8 9 10 11 12 … 20');
    expect(range(20, 10, 0)).toBe('1 … 10 … 20');
    expect(range(20, 10, 1, 2)).toBe('1 2 … 9 10 11 … 19 20');
    expect(range(20, 10, 1, 0)).toBe('… 9 10 11 …');
  });

  it('clamps what it is given', () => {
    expect(range(0, 1)).toBe('1');
    expect(range(-3, 2)).toBe('1');
    expect(range(12, 99)).toBe(range(12, 12));
    expect(range(12, -1)).toBe(range(12, 1));
    expect(range(12, 4.6)).toBe(range(12, 4));
    expect(range(12, 5, -2, -1)).toBe(range(12, 5, 0, 0));
  });

  it('holds its rules for every page of every small count', () => {
    for (let count = 1; count <= 30; count += 1) {
      for (let page = 1; page <= count; page += 1) {
        for (const [siblings, boundary] of [
          [1, 1],
          [0, 1],
          [2, 1],
          [1, 2],
          [1, 0],
        ] as const) {
          const items = getPaginationRange({
            count,
            page,
            siblingCount: siblings,
            boundaryCount: boundary,
          });
          const numbers = items.filter((item): item is number => typeof item === 'number');
          const where = `count ${count}, page ${page}, siblings ${siblings}, boundary ${boundary}`;
          // In order, each once, within range, and the current page among them.
          expect(numbers, where).toEqual([...new Set(numbers)].sort((a, b) => a - b));
          expect(
            numbers.every((n) => n >= 1 && n <= count),
            where,
          ).toBe(true);
          expect(numbers, where).toContain(page);
          // The pages at the ends and around the current one.
          for (let n = 1; n <= Math.min(boundary, count); n += 1)
            expect(numbers, where).toContain(n);
          for (let n = count - boundary + 1; n <= count; n += 1) {
            if (n >= 1) expect(numbers, where).toContain(n);
          }
          for (let n = page - siblings; n <= page + siblings; n += 1) {
            if (n >= 1 && n <= count) expect(numbers, where).toContain(n);
          }
          // An ellipsis stands for two pages or more, never for a single one.
          items.forEach((item: PaginationItem, index) => {
            if (typeof item === 'number') return;
            const before = index > 0 ? (items[index - 1] as number) : 0;
            const after = index < items.length - 1 ? (items[index + 1] as number) : count + 1;
            expect(after - before - 1, where).toBeGreaterThanOrEqual(2);
          });
          // A fixed number of slots once the count is large enough.
          const slots = 2 * boundary + 2 * siblings + 3;
          if (count >= slots) expect(items, where).toHaveLength(slots);
        }
      }
    }
  });
});
