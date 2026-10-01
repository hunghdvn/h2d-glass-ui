import { describe, expect, it } from 'vitest';
import { dataAttr } from './data-attr';

describe('dataAttr', () => {
  it('returns an empty string for true so React renders a bare attribute', () => {
    expect(dataAttr(true)).toBe('');
  });

  it('returns undefined for false or undefined so React omits the attribute', () => {
    expect(dataAttr(false)).toBeUndefined();
    expect(dataAttr(undefined)).toBeUndefined();
  });
});
