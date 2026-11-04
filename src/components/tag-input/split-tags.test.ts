import { describe, expect, it } from 'vitest';
import { splitTags } from './split-tags';

describe('splitTags', () => {
  it('splits on every one-character separator, trims and drops empties', () => {
    expect(splitTags('a, b,,c ', ['Enter', ','])).toEqual(['a', 'b', 'c']);
  });

  it('line breaks split only when "Enter" is a separator', () => {
    expect(splitTags('a\nb\r\nc\rd', ['Enter', ','])).toEqual(['a', 'b', 'c', 'd']);
    expect(splitTags('a\nb\r\nc\rd', [','])).toEqual(['a\nb\r\nc\rd']);
  });

  it('splits on multiple separators', () => {
    expect(splitTags('x y;z', [';', ' '])).toEqual(['x', 'y', 'z']);
  });

  it('regex-special characters split literally', () => {
    expect(splitTags('a.b|c\\d', ['.', '|', '\\'])).toEqual(['a', 'b', 'c', 'd']);
  });

  it('ignores multi-character entries', () => {
    expect(splitTags('xaby', ['ab'])).toEqual(['xaby']);
  });

  it('works with a non-BMP separator and a non-ASCII one', () => {
    expect(splitTags('a😀b', ['😀'])).toEqual(['a', 'b']);
    expect(splitTags('đỏ、xanh', ['、'])).toEqual(['đỏ', 'xanh']);
  });

  it('returns [] when there is nothing to add', () => {
    expect(splitTags('', [','])).toEqual([]);
    expect(splitTags(' , ,, ', [','])).toEqual([]);
  });

  it('keeps duplicates and order', () => {
    expect(splitTags('b,a,b', [','])).toEqual(['b', 'a', 'b']);
  });

  it('keeps whitespace inside a tag and trims the ends, NBSP included', () => {
    expect(splitTags('\u00A0New York\u00A0,LA', [','])).toEqual(['New York', 'LA']);
  });
});
