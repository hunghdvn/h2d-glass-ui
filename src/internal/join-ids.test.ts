import { describe, expect, it } from 'vitest';
import { joinIds } from './join-ids';

describe('joinIds', () => {
  it('joins the ids with a space', () => {
    expect(joinIds('a', 'b', 'c')).toBe('a b c');
  });

  it('leaves out what is not an id', () => {
    expect(joinIds('a', undefined, null, false, '', 'b')).toBe('a b');
  });

  it('is undefined when there is none', () => {
    expect(joinIds()).toBeUndefined();
    expect(joinIds(undefined, false, null, '')).toBeUndefined();
  });
});
