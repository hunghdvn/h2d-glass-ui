import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { hasContent } from './has-content';

describe('hasContent', () => {
  it('counts 0, text and elements as content', () => {
    expect(hasContent(0)).toBe(true);
    expect(hasContent('0')).toBe(true);
    expect(hasContent('x')).toBe(true);
    expect(hasContent(createElement('b'))).toBe(true);
  });

  it('does not count nothing, booleans or the empty string', () => {
    expect(hasContent(undefined)).toBe(false);
    expect(hasContent(null)).toBe(false);
    expect(hasContent(false)).toBe(false);
    expect(hasContent(true)).toBe(false);
    expect(hasContent('')).toBe(false);
  });
});
