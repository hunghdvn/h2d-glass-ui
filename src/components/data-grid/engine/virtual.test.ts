import { describe, expect, it } from 'vitest';
import { computeOffsets, findWindow, rowsThatFit, splitWindow } from './virtual';
import type { WindowPart } from './virtual';

const uniform = (count: number, height = 10) => computeOffsets(count, () => height);

describe('computeOffsets', () => {
  it('holds the top of each row, and the total at the end', () => {
    const heights = [10, 20, 30, 40];
    const offsets = computeOffsets(4, (index) => heights[index]!);
    expect(Array.from(offsets)).toEqual([0, 10, 30, 60, 100]);
    expect(offsets).toBeInstanceOf(Float64Array);
  });

  it('is [0] for no rows', () => {
    expect(Array.from(computeOffsets(0, () => 41))).toEqual([0]);
  });

  it('asks for each height once', () => {
    let calls = 0;
    computeOffsets(100, () => {
      calls += 1;
      return 41;
    });
    expect(calls).toBe(100);
  });
});

describe('findWindow', () => {
  const offsets = uniform(100);

  it('finds the rows that meet the viewport', () => {
    expect(findWindow(offsets, 0, 35, 0)).toEqual({ start: 0, end: 4 });
    expect(findWindow(offsets, 25, 20, 0)).toEqual({ start: 2, end: 5 });
  });

  it('leaves out a row that only touches the viewport at an edge', () => {
    // Row 2 ends at 30, where the viewport begins; row 4 begins at 40, where it ends.
    expect(findWindow(offsets, 30, 10, 0)).toEqual({ start: 3, end: 4 });
    expect(findWindow(offsets, 0, 40, 0)).toEqual({ start: 0, end: 4 });
  });

  it('widens the window by the overscan on each side, inside the list', () => {
    expect(findWindow(offsets, 250, 30, 3)).toEqual({ start: 22, end: 31 });
    expect(findWindow(offsets, 0, 35, 2)).toEqual({ start: 0, end: 6 });
    expect(findWindow(offsets, 950, 100, 3)).toEqual({ start: 92, end: 100 });
  });

  it('finds the last rows at the end of the list, and none beyond it', () => {
    expect(findWindow(offsets, 900, 100, 0)).toEqual({ start: 90, end: 100 });
    expect(findWindow(offsets, 5000, 100, 0)).toEqual({ start: 100, end: 100 });
    expect(findWindow(offsets, 5000, 100, 2)).toEqual({ start: 98, end: 100 });
  });

  it('treats a scroll above the top as the top', () => {
    expect(findWindow(offsets, -50, 35, 0)).toEqual({ start: 0, end: 4 });
  });

  it('follows rows of different heights', () => {
    const heights = [50, 10, 10, 100, 10];
    const mixed = computeOffsets(5, (index) => heights[index]!);
    // 0-50, 50-60, 60-70, 70-170, 170-180
    expect(findWindow(mixed, 55, 20, 0)).toEqual({ start: 1, end: 4 });
    expect(findWindow(mixed, 100, 10, 0)).toEqual({ start: 3, end: 4 });
  });

  it('gives an empty window for no rows', () => {
    expect(
      findWindow(
        computeOffsets(0, () => 10),
        0,
        100,
        6,
      ),
    ).toEqual({ start: 0, end: 0 });
  });

  it('is found by binary search, not by walking the rows', () => {
    const big = uniform(1_000_000);
    let reads = 0;
    const watched = new Proxy(big, {
      get(target, property) {
        if (typeof property === 'string' && /^\d+$/.test(property)) reads += 1;
        return Reflect.get(target, property);
      },
    });
    // Row 500 000 starts at 5 000 000; the 800px viewport shows 80 rows.
    expect(findWindow(watched, 5_000_000, 800, 6)).toEqual({ start: 499_994, end: 500_086 });
    expect(reads).toBeLessThan(100);
  });
});

describe('splitWindow', () => {
  const offsets = uniform(100);
  const spacer = (height: number): WindowPart => ({ kind: 'spacer', height });
  const rows = (start: number, end: number): WindowPart => ({ kind: 'rows', start, end });

  it('puts a spacer above and below the rows of the window', () => {
    expect(splitWindow(offsets, { start: 10, end: 20 })).toEqual([
      spacer(100),
      rows(10, 20),
      spacer(800),
    ]);
  });

  it('has no spacer where the window touches an end of the list', () => {
    expect(splitWindow(offsets, { start: 0, end: 20 })).toEqual([rows(0, 20), spacer(800)]);
    expect(splitWindow(offsets, { start: 80, end: 100 })).toEqual([spacer(800), rows(80, 100)]);
    expect(splitWindow(offsets, { start: 0, end: 100 })).toEqual([rows(0, 100)]);
  });

  it('draws the kept row at its own place when it is above the window', () => {
    expect(splitWindow(offsets, { start: 10, end: 20 }, 3)).toEqual([
      spacer(30),
      rows(3, 4),
      spacer(60),
      rows(10, 20),
      spacer(800),
    ]);
  });

  it('draws the kept row at its own place when it is below the window', () => {
    expect(splitWindow(offsets, { start: 10, end: 20 }, 90)).toEqual([
      spacer(100),
      rows(10, 20),
      spacer(700),
      rows(90, 91),
      spacer(90),
    ]);
  });

  it('joins the kept row to the window when they are next to each other, and at the ends', () => {
    expect(splitWindow(offsets, { start: 10, end: 20 }, 9)).toEqual([
      spacer(90),
      rows(9, 20),
      spacer(800),
    ]);
    expect(splitWindow(offsets, { start: 10, end: 20 }, 20)).toEqual([
      spacer(100),
      rows(10, 21),
      spacer(790),
    ]);
    expect(splitWindow(offsets, { start: 10, end: 20 }, 0)).toEqual([
      rows(0, 1),
      spacer(90),
      rows(10, 20),
      spacer(800),
    ]);
    expect(splitWindow(offsets, { start: 10, end: 20 }, 99)).toEqual([
      spacer(100),
      rows(10, 20),
      spacer(790),
      rows(99, 100),
    ]);
  });

  it('leaves the window alone when the kept row is inside it or is not a row', () => {
    const plain = splitWindow(offsets, { start: 10, end: 20 });
    expect(splitWindow(offsets, { start: 10, end: 20 }, 15)).toEqual(plain);
    for (const keep of [-1, 100, 250, 3.5, Number.NaN, undefined]) {
      expect(splitWindow(offsets, { start: 10, end: 20 }, keep)).toEqual(plain);
    }
  });

  it('holds the whole height in one spacer when the window is empty', () => {
    expect(splitWindow(offsets, { start: 0, end: 0 })).toEqual([spacer(1000)]);
    expect(splitWindow(offsets, { start: 100, end: 100 })).toEqual([spacer(1000)]);
    expect(splitWindow(offsets, { start: 100, end: 100 }, 40)).toEqual([
      spacer(400),
      rows(40, 41),
      spacer(590),
    ]);
  });

  it('gives no part for no rows', () => {
    expect(
      splitWindow(
        computeOffsets(0, () => 10),
        { start: 0, end: 0 },
      ),
    ).toEqual([]);
  });

  it('never makes a spacer of no height, and the parts add up to the whole list', () => {
    for (const [start, end, keep] of [
      [0, 20, 20],
      [0, 20, 21],
      [50, 60, 0],
      [50, 60, 99],
      [0, 100, 50],
      [30, 30, 29],
    ] as const) {
      const parts = splitWindow(offsets, { start, end }, keep);
      let total = 0;
      for (const part of parts) {
        if (part.kind === 'spacer') {
          expect(part.height).toBeGreaterThan(0);
          total += part.height;
        } else {
          expect(part.end).toBeGreaterThan(part.start);
          total += offsets[part.end]! - offsets[part.start]!;
        }
      }
      expect(total).toBe(1000);
    }
  });

  it('keeps several rows, each at its own place, with a spacer between', () => {
    expect(splitWindow(offsets, { start: 50, end: 60 }, [5, 80])).toEqual([
      spacer(50),
      rows(5, 6),
      spacer(440),
      rows(50, 60),
      spacer(200),
      rows(80, 81),
      spacer(190),
    ]);
  });

  it('joins kept rows that touch each other or the window, and ignores repeats and strangers', () => {
    expect(splitWindow(offsets, { start: 50, end: 60 }, [49, 5, 5, 6, -1, 100])).toEqual([
      spacer(50),
      rows(5, 7),
      spacer(420),
      rows(49, 60),
      spacer(400),
    ]);
  });
});

describe('rowsThatFit', () => {
  const heights = [33, 41, 41, 41, 33, 41, 41, 41, 33, 41];
  const heightOf = (index: number) => heights[index]!;

  it('counts the rows from a place down that fit in the room, over their own heights', () => {
    // 33 + 3 * 41 + 33 + 3 * 41 + 33 = 345 fit in 359px; the next row, 41px, does not.
    expect(rowsThatFit(heightOf, 10, 0, 1, 359)).toBe(9);
    // Counted at one height of 41px the same room would hold 8.
    expect(Math.floor(359 / 41)).toBe(8);
  });

  it('counts the rows above a place going up', () => {
    expect(rowsThatFit(heightOf, 10, 9, -1, 359)).toBe(9);
    expect(rowsThatFit(heightOf, 10, 9, -1, 100)).toBe(2);
  });

  it('stops at the end of the list', () => {
    expect(rowsThatFit(heightOf, 10, 7, 1, 10_000)).toBe(3);
    expect(rowsThatFit(heightOf, 10, 2, -1, 10_000)).toBe(2);
  });

  it('starts at the first row from a place above it, as from the heading', () => {
    expect(rowsThatFit(heightOf, 10, -1, 1, 74)).toBe(2);
  });

  it('is one row at least', () => {
    expect(rowsThatFit(heightOf, 10, 3, 1, 0)).toBe(1);
    expect(rowsThatFit(heightOf, 10, 3, -1, -5)).toBe(1);
    expect(rowsThatFit(heightOf, 0, 0, 1, 400)).toBe(1);
  });
});
