import { describe, expect, it } from 'vitest';
import { askOfMove, isPlacedAs, pagePlaces, placeAfterMove, rowDrop } from './row-reorder';
import type { RowBlock } from './row-reorder';

// What a move of a row asks (spec phase 6 §6.3 "Kéo dòng"), where it puts the row, and where a drop at a point
// goes (§3.8): the pure rules, which the keys, the menu and the drag all use.

const KEYS = ['a', 'b', 'c', 'd'];

describe('askOfMove', () => {
  it('asks up before the row above, down after the row below', () => {
    expect(askOfMove(KEYS, 'c', 'up')).toEqual({ toKey: 'b', position: 'before' });
    expect(askOfMove(KEYS, 'b', 'down')).toEqual({ toKey: 'c', position: 'after' });
  });

  it('asks top before the first row and bottom after the last', () => {
    expect(askOfMove(KEYS, 'c', 'top')).toEqual({ toKey: 'a', position: 'before' });
    expect(askOfMove(KEYS, 'b', 'bottom')).toEqual({ toKey: 'd', position: 'after' });
    // The second row goes before the first, which is a move: the menu's top is not "already there".
    expect(askOfMove(KEYS, 'b', 'top')).toEqual({ toKey: 'a', position: 'before' });
  });

  it('asks nothing at an edge, where the row cannot go that way', () => {
    expect(askOfMove(KEYS, 'a', 'up')).toBeNull();
    expect(askOfMove(KEYS, 'a', 'top')).toBeNull();
    expect(askOfMove(KEYS, 'd', 'down')).toBeNull();
    expect(askOfMove(KEYS, 'd', 'bottom')).toBeNull();
    expect(askOfMove(KEYS, 'a', 'down')).not.toBeNull();
    expect(askOfMove(KEYS, 'd', 'up')).not.toBeNull();
  });

  it('asks nothing for a row that is not among the keys, or for the only row', () => {
    expect(askOfMove(KEYS, 'x', 'up')).toBeNull();
    expect(askOfMove(['a'], 'a', 'down')).toBeNull();
    expect(askOfMove([], 'a', 'up')).toBeNull();
  });

  it('compares numbers and strings as they are', () => {
    expect(askOfMove([1, '1', 2], '1', 'up')).toEqual({ toKey: 1, position: 'before' });
    expect(askOfMove([1, 2], '2', 'up')).toBeNull();
  });
});

describe('placeAfterMove', () => {
  it('counts from 1 the place the row has once it has moved', () => {
    expect(placeAfterMove(KEYS, 'c', { toKey: 'b', position: 'before' })).toBe(2);
    expect(placeAfterMove(KEYS, 'b', { toKey: 'c', position: 'after' })).toBe(3);
    expect(placeAfterMove(KEYS, 'c', { toKey: 'a', position: 'before' })).toBe(1);
    expect(placeAfterMove(KEYS, 'a', { toKey: 'd', position: 'after' })).toBe(4);
    expect(placeAfterMove(KEYS, 'a', { toKey: 'c', position: 'before' })).toBe(2);
  });

  it('is 0 where nothing moves: itself, a row that is not there, a row that is not asked for', () => {
    expect(placeAfterMove(KEYS, 'b', { toKey: 'b', position: 'after' })).toBe(0);
    expect(placeAfterMove(KEYS, 'x', { toKey: 'b', position: 'after' })).toBe(0);
    expect(placeAfterMove(KEYS, 'b', { toKey: 'x', position: 'after' })).toBe(0);
  });
});

describe('isPlacedAs', () => {
  it('holds when the row is right before or right after the row it was moved to', () => {
    expect(isPlacedAs(['a', 'c', 'b', 'd'], 'c', { toKey: 'b', position: 'before' })).toBe(true);
    expect(isPlacedAs(['a', 'b', 'c', 'd'], 'c', { toKey: 'b', position: 'after' })).toBe(true);
  });

  it('does not hold for rows in another order, or a row that is gone', () => {
    expect(isPlacedAs(KEYS, 'c', { toKey: 'b', position: 'before' })).toBe(false);
    expect(isPlacedAs(['b', 'a', 'c', 'd'], 'c', { toKey: 'b', position: 'before' })).toBe(false);
    expect(isPlacedAs(['a', 'b'], 'c', { toKey: 'b', position: 'after' })).toBe(false);
    expect(isPlacedAs(KEYS, 'c', { toKey: 'x', position: 'after' })).toBe(false);
  });
});

describe('pagePlaces', () => {
  it('numbers the data rows of the page and skips the others', () => {
    const places = pagePlaces([
      { kind: 'data', key: 'a' },
      { kind: 'detail', key: 'a' },
      { kind: 'data', key: 'b' },
      { kind: 'group', key: 'g' },
      { kind: 'data', key: 'c' },
    ]);
    expect([...places]).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });

  it('keeps the first place of a key that two rows have', () => {
    const places = pagePlaces([
      { kind: 'data', key: 'a' },
      { kind: 'data', key: 'a' },
      { kind: 'data', key: 'b' },
    ]);
    expect([...places]).toEqual([
      ['a', 0],
      ['b', 1],
    ]);
  });
});

describe('rowDrop', () => {
  // Four rows of 30px from y 100, the second with a detail of 60px under it.
  const blocks: RowBlock[] = [
    { key: 'a', place: 0, top: 100, middle: 115, bottom: 130 },
    { key: 'b', place: 1, top: 130, middle: 145, bottom: 220 },
    { key: 'c', place: 2, top: 220, middle: 235, bottom: 250 },
    { key: 'd', place: 3, top: 250, middle: 265, bottom: 280 },
  ];

  it('drops before the row in its upper half, after it in its lower half, the line on the boundary', () => {
    expect(rowDrop(blocks, 0, 255)).toEqual({
      ask: { toKey: 'd', position: 'before' },
      y: 250,
    });
    expect(rowDrop(blocks, 0, 275)).toEqual({ ask: { toKey: 'd', position: 'after' }, y: 280 });
  });

  it('puts the line of a drop after a row that has its detail open under the detail', () => {
    expect(rowDrop(blocks, 3, 160)).toEqual({ ask: { toKey: 'b', position: 'after' }, y: 220 });
  });

  it('moves nothing beside the row: before and after itself, and next to it', () => {
    // The row `c` (place 2): before itself, after itself, after `b` and before `d` are its own place.
    expect(rowDrop(blocks, 2, 225)).toBeNull();
    expect(rowDrop(blocks, 2, 245)).toBeNull();
    expect(rowDrop(blocks, 2, 200)).toBeNull();
    expect(rowDrop(blocks, 2, 255)).toBeNull();
    expect(rowDrop(blocks, 2, 135)).not.toBeNull();
    expect(rowDrop(blocks, 2, 275)).not.toBeNull();
  });

  it('works from the place of a row that is not drawn (a virtual window scrolled past it)', () => {
    // The source is the row at place 10, above every block: every drop is before it or beyond.
    expect(rowDrop(blocks, 10, 105)).toEqual({ ask: { toKey: 'a', position: 'before' }, y: 100 });
  });

  it('is nothing outside the rows', () => {
    expect(rowDrop(blocks, 0, 99)).toBeNull();
    expect(rowDrop(blocks, 0, 280)).toBeNull();
    expect(rowDrop([], 0, 120)).toBeNull();
  });
});
