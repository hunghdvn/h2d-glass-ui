import { describe, expect, it } from 'vitest';
import type { DataGridGroupItem } from '../types';
import { insertLevel, levelTarget, moveItem, regroupLevels, slotAt } from './group-panel';

const asc = (field: string): DataGridGroupItem => ({ field, direction: 'asc' });

describe('slotAt', () => {
  // Three chips whose middles are at 100, 200 and 300.
  const centers = [100, 200, 300];

  it('is the number of middles left of the pointer', () => {
    expect(slotAt(centers, 10)).toBe(0);
    expect(slotAt(centers, 99)).toBe(0);
    expect(slotAt(centers, 101)).toBe(1);
    expect(slotAt(centers, 250)).toBe(2);
    expect(slotAt(centers, 301)).toBe(3);
    expect(slotAt(centers, 5000)).toBe(3);
  });

  it('is 0 for a panel with no chip', () => {
    expect(slotAt([], 50)).toBe(0);
  });
});

describe('levelTarget', () => {
  it('moves a chip to the place its slot is, counted without the chip itself', () => {
    // Chips 0 1 2 3: dropping chip 1 before chip 3 (slot 3) puts it at 2; before chip 0 puts it at 0.
    expect(levelTarget(1, 3)).toBe(2);
    expect(levelTarget(1, 0)).toBe(0);
    expect(levelTarget(1, 4)).toBe(3);
  });

  it('is no move at the two slots beside the chip', () => {
    expect(levelTarget(1, 1)).toBeNull();
    expect(levelTarget(1, 2)).toBeNull();
    expect(levelTarget(0, 0)).toBeNull();
    expect(levelTarget(0, 1)).toBeNull();
    expect(levelTarget(2, 3)).toBeNull();
  });
});

describe('moveItem', () => {
  it('takes an item out and puts it in, as a new list', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(moveItem(list, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(list, 3, 0)).toEqual(['d', 'a', 'b', 'c']);
    expect(list).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('regroupLevels', () => {
  it('moves a level in a held grouping that is only levels', () => {
    const held = [asc('a'), asc('b'), asc('c')];
    expect(regroupLevels(held, held, 0, 2)).toEqual([asc('b'), asc('c'), asc('a')]);
  });

  it('keeps the items that do not group where they are', () => {
    // `x` names no column, so the levels are a and b.
    const held = [asc('a'), asc('x'), asc('b')];
    expect(regroupLevels(held, [asc('a'), asc('b')], 0, 1)).toEqual([asc('b'), asc('x'), asc('a')]);
  });

  it('moves the item that groups when an inert item of the same field comes first', () => {
    // The state holds `a` three times over: with a direction that is none, and then as it groups. The level
    // is the second, so moving it writes that slot and leaves the inert one where it is.
    const inert = { field: 'a', direction: 'bogus' } as unknown as DataGridGroupItem;
    const held = [inert, asc('b'), asc('a')];
    expect(regroupLevels(held, [asc('b'), asc('a')], 1, 0)).toEqual([inert, asc('a'), asc('b')]);
  });

  it('keeps the direction of each level with it', () => {
    const held: DataGridGroupItem[] = [asc('a'), { field: 'b', direction: 'desc' }];
    expect(regroupLevels(held, held, 1, 0)).toEqual([{ field: 'b', direction: 'desc' }, asc('a')]);
  });
});

describe('insertLevel', () => {
  const levels = [asc('a'), asc('b')];

  it('adds a level at a slot, before the level that is there', () => {
    expect(insertLevel(levels, levels, asc('c'), 0)).toEqual([asc('c'), asc('a'), asc('b')]);
    expect(insertLevel(levels, levels, asc('c'), 1)).toEqual([asc('a'), asc('c'), asc('b')]);
  });

  it('adds it at the end past the last level', () => {
    expect(insertLevel(levels, levels, asc('c'), 2)).toEqual([asc('a'), asc('b'), asc('c')]);
  });

  it('puts it before the held item of the level, among items that do not group', () => {
    const held = [asc('a'), asc('x'), asc('b')];
    expect(insertLevel(held, levels, asc('c'), 1)).toEqual([
      asc('a'),
      asc('x'),
      asc('c'),
      asc('b'),
    ]);
  });
});
