import { createElement, Fragment } from 'react';
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

  it('does not count an array or a fragment with nothing in it', () => {
    expect(hasContent([])).toBe(false);
    expect(hasContent([null, false])).toBe(false);
    expect(hasContent(createElement(Fragment))).toBe(false);
    expect(hasContent(createElement(Fragment, null, null))).toBe(false);
    expect(hasContent([createElement(Fragment, null, '')])).toBe(false);
  });

  it('counts an array or a fragment with something in it', () => {
    expect(hasContent([0])).toBe(true);
    expect(hasContent([null, 'x'])).toBe(true);
    expect(hasContent(createElement(Fragment, null, 'x'))).toBe(true);
    expect(hasContent(createElement(Fragment, null, null, createElement('b')))).toBe(true);
  });
});
