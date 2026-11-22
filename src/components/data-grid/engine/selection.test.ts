import { describe, expect, it } from 'vitest';
import {
  addKeys,
  rangeKeys,
  removeKeys,
  sameKeySet,
  sameKeys,
  scopeState,
  toggleKey,
} from './selection';

// What the grid does with the keys of the chosen rows (spec phase 6 §6.3, "Chọn dòng"): pure
// functions over arrays of keys, so the state an app saves stays plain JSON.

const rows = ['a', 'b', 'c', 'd', 'e'].map((key) => ({ key }));

describe('sameKeys', () => {
  it('is true for the same keys in the same order, whatever the arrays', () => {
    expect(sameKeys(['a', 1], ['a', 1])).toBe(true);
    expect(sameKeys([], [])).toBe(true);
  });
  it('is false for another order, another length or a number that is not the text', () => {
    expect(sameKeys(['a', 'b'], ['b', 'a'])).toBe(false);
    expect(sameKeys(['a'], ['a', 'b'])).toBe(false);
    expect(sameKeys([1], ['1'])).toBe(false);
  });
});

describe('sameKeySet', () => {
  it('is true for the same keys in any order, and a key that comes twice is one', () => {
    expect(sameKeySet(['a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameKeySet(['a', 'a', 'b'], ['b', 'a'])).toBe(true);
    expect(sameKeySet([], [])).toBe(true);
  });
  it('is false for another key, however many there are, and for a number that is not the text', () => {
    expect(sameKeySet(['a', 'a', 'b'], ['a', 'b', 'b', 'c'])).toBe(false);
    expect(sameKeySet(['a', 'b'], ['a', 'c'])).toBe(false);
    expect(sameKeySet([1], ['1'])).toBe(false);
  });
});

describe('addKeys, removeKeys and toggleKey', () => {
  it('adds the keys that are not there, after the ones that are, once each', () => {
    expect(addKeys(['b'], ['a', 'b', 'c', 'a'])).toEqual(['b', 'a', 'c']);
  });
  it('removes the keys it is given and keeps the rest in their order', () => {
    expect(removeKeys(['a', 'b', 'c', 'x'], ['c', 'a', 'nothing'])).toEqual(['b', 'x']);
  });
  it('toggles: a key that is there goes, one that is not comes last', () => {
    expect(toggleKey(['a', 'b'], 'a')).toEqual(['b']);
    expect(toggleKey(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });
  it('never changes what it was given', () => {
    const current = Object.freeze(['a']);
    expect(addKeys(current, ['b'])).toEqual(['a', 'b']);
    expect(toggleKey(current, 'a')).toEqual([]);
    expect(current).toEqual(['a']);
  });
});

describe('rangeKeys', () => {
  it('is the rows from the anchor to the row, both included, in the order shown', () => {
    expect(rangeKeys(rows, 'b', 'd')).toEqual(['b', 'c', 'd']);
  });
  it('is the same range backwards, still in the order shown', () => {
    expect(rangeKeys(rows, 'd', 'a')).toEqual(['a', 'b', 'c', 'd']);
  });
  it('is the row alone when it is the anchor, when there is no anchor, or when the anchor is not shown', () => {
    expect(rangeKeys(rows, 'c', 'c')).toEqual(['c']);
    expect(rangeKeys(rows, null, 'c')).toEqual(['c']);
    expect(rangeKeys(rows, 'gone', 'c')).toEqual(['c']);
  });
  it('is the row alone when the row is not shown either', () => {
    expect(rangeKeys(rows, 'a', 'gone')).toEqual(['gone']);
  });
});

describe('scopeState', () => {
  it('is empty and disabled for a scope of no rows, whatever is chosen', () => {
    expect(scopeState([], ['a'])).toEqual({ checked: false, indeterminate: false, disabled: true });
  });
  it('is neither checked nor mixed when none of the scope is chosen (keys outside it do not count)', () => {
    expect(scopeState(['a', 'b'], ['z'])).toEqual({
      checked: false,
      indeterminate: false,
      disabled: false,
    });
  });
  it('is mixed when part of the scope is chosen', () => {
    expect(scopeState(['a', 'b'], ['b', 'z'])).toEqual({
      checked: false,
      indeterminate: true,
      disabled: false,
    });
  });
  it('is checked when every row of the scope is chosen', () => {
    expect(scopeState(['a', 'b'], ['b', 'a', 'z'])).toEqual({
      checked: true,
      indeterminate: false,
      disabled: false,
    });
  });
});
