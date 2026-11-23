import { describe, expect, it } from 'vitest';
import { detailIdOf } from './use-detail-ids';

describe('detailIdOf', () => {
  it('is the same id for the same key, in any call', () => {
    expect(detailIdOf('g', 'DH-1')).toBe(detailIdOf('g', 'DH-1'));
  });

  it('tells the number 1 from the text "1", and one grid from another', () => {
    expect(detailIdOf('g', 1)).not.toBe(detailIdOf('g', '1'));
    expect(detailIdOf('g', 1)).not.toBe(detailIdOf('h', 1));
  });

  it('is one token for a key with spaces, quotes or a slash', () => {
    for (const key of ['DH 4 "x"', 'a/b', 'tab\there']) {
      expect(detailIdOf('g', key)).not.toMatch(/[\s"/]/);
    }
  });
});
