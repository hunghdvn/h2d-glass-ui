import { describe, expect, it } from 'vitest';
import { resolveWidths } from './layout';

const flexible = (minWidth = 60) => ({ width: undefined, minWidth });
const fixed = (width: number, minWidth = 60) => ({ width, minWidth });
const sum = (widths: readonly number[]) => widths.reduce((total, width) => total + width, 0);

describe('resolveWidths', () => {
  it('gives a fixed width as it is', () => {
    expect(resolveWidths([fixed(100), fixed(250.5)], 1000)).toEqual([100, 250.5]);
  });

  it('keeps a fixed width that is under the minimum of its column', () => {
    expect(resolveWidths([fixed(40, 120)], 1000)).toEqual([40]);
  });

  it('shares what is left among the flexible columns equally', () => {
    expect(resolveWidths([flexible(), flexible()], 1000)).toEqual([500, 500]);
    expect(resolveWidths([fixed(100), flexible(), flexible()], 1000)).toEqual([100, 450, 450]);
  });

  it('gives whole pixels, the remainder going to the last flexible columns', () => {
    expect(resolveWidths([flexible(), flexible()], 1001)).toEqual([500, 501]);
    expect(resolveWidths([flexible(10), flexible(10), flexible(10)], 100)).toEqual([33, 33, 34]);
    expect(resolveWidths([flexible(10), flexible(10), flexible(10)], 101)).toEqual([33, 34, 34]);
    expect(resolveWidths([flexible(10), fixed(50), flexible(10), flexible(10)], 100)).toEqual([
      16, 50, 17, 17,
    ]);
  });

  it('holds a column at its minimum and leaves the rest to the others', () => {
    // An equal share of 300 is 150 each, which is under the 200 of the second.
    expect(resolveWidths([flexible(60), flexible(200)], 300)).toEqual([100, 200]);
    // Two columns held at 200 leave 100 for the first.
    expect(resolveWidths([flexible(60), flexible(200), flexible(200)], 500)).toEqual([
      100, 200, 200,
    ]);
  });

  it('is the sum of the minimums when nothing is left to share', () => {
    expect(resolveWidths([flexible(60), flexible(200)], 100)).toEqual([60, 200]);
    expect(resolveWidths([fixed(100), flexible(60), flexible(80)], 150)).toEqual([100, 60, 80]);
  });

  it('adds up to the available width, or to fixed plus minimums when that is more', () => {
    const minimums = [100, 60, 200, 75];
    const columns = [fixed(100), flexible(60), flexible(200), flexible(75)];
    for (const available of [0, 99, 100, 257, 640, 1280, 1919]) {
      const widths = resolveWidths(columns, available);
      expect(sum(widths)).toBe(Math.max(available, sum(minimums)));
      widths.forEach((width, index) => expect(width).toBeGreaterThanOrEqual(minimums[index]!));
    }
  });

  it('leaves the table narrower than the frame when no column is flexible', () => {
    expect(resolveWidths([fixed(100), fixed(200)], 1000)).toEqual([100, 200]);
  });

  it('reads a fractional minimum as the next whole pixel, so the sum stays whole', () => {
    expect(resolveWidths([flexible(60.2), flexible(60.2)], 100)).toEqual([61, 61]);
  });

  it('takes an available width that is not a number, or is negative, as 0', () => {
    expect(resolveWidths([flexible(60)], Number.NaN)).toEqual([60]);
    expect(resolveWidths([flexible(60)], -10)).toEqual([60]);
  });

  it('gives nothing for no columns', () => {
    expect(resolveWidths([], 500)).toEqual([]);
  });
});
