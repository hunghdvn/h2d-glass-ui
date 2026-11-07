import { describe, expect, it } from 'vitest';
import { childKeys } from './child-keys';

describe('childKeys', () => {
  it('keeps an own key and falls back to the index for a child without one', () => {
    expect(childKeys(['a', null, 'c'])).toEqual(['$a', '#1', '$c']);
  });

  it('keeps own keys and index fallbacks apart, so a key that looks like an index does not collide', () => {
    expect(childKeys([null, '0', 0, null])).toEqual(['#0', '$0', '#2', '#3']);
  });

  it('falls back to the index for an own key that repeats', () => {
    expect(childKeys(['a', 'a', 'a'])).toEqual(['$a', '#1', '#2']);
  });

  it('is empty for no children', () => {
    expect(childKeys([])).toEqual([]);
  });
});
