import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findTypeaheadMatch, TYPEAHEAD_TIMEOUT, useTypeahead } from './use-typeahead';

const FRUIT = ['Apple', 'Banana', 'Blueberry', 'Cherry', 'Blackberry'];

describe('findTypeaheadMatch', () => {
  it('finds the first item that starts with the search, ignoring case', () => {
    expect(findTypeaheadMatch(FRUIT, -1, 'b')).toBe(1);
    expect(findTypeaheadMatch(FRUIT, -1, 'CH')).toBe(3);
    expect(findTypeaheadMatch(FRUIT, -1, 'z')).toBe(-1);
  });

  it('moves on to the next item with the same first letter, and wraps', () => {
    expect(findTypeaheadMatch(FRUIT, 1, 'b')).toBe(2);
    expect(findTypeaheadMatch(FRUIT, 4, 'b')).toBe(1);
  });

  it('treats a repeated letter as cycling through that letter', () => {
    expect(findTypeaheadMatch(FRUIT, 1, 'bb')).toBe(2);
    expect(findTypeaheadMatch(FRUIT, 2, 'bbb')).toBe(4);
  });

  it('keeps the current item while a longer search still matches it', () => {
    expect(findTypeaheadMatch(FRUIT, 2, 'blu')).toBe(2);
    expect(findTypeaheadMatch(FRUIT, 2, 'bla')).toBe(4);
  });
});

function list(...labels: string[]) {
  const root = document.createElement('div');
  for (const label of labels) {
    const el = document.createElement('div');
    el.tabIndex = -1;
    el.textContent = label;
    root.append(el);
  }
  document.body.append(root);
  return Array.from(root.children) as HTMLElement[];
}

const key = (k: string) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  preventDefault: vi.fn(),
});

describe('useTypeahead', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('builds a search from keys typed within 500ms, then starts over', () => {
    const items = list('Rename', 'Remove', 'Share');
    const onMatch = vi.fn((el: HTMLElement) => el.focus());
    const { result } = renderHook(() => useTypeahead(() => items, onMatch));
    result.current(key('r'));
    result.current(key('e'));
    result.current(key('m'));
    expect(onMatch).toHaveBeenLastCalledWith(items[1]);
    vi.advanceTimersByTime(TYPEAHEAD_TIMEOUT);
    result.current(key('s'));
    expect(onMatch).toHaveBeenLastCalledWith(items[2]);
  });

  it('leaves a lone Space and modified keys alone, but counts a Space inside a search', () => {
    const items = list('Save as', 'Save', 'Settings');
    const onMatch = vi.fn((el: HTMLElement) => el.focus());
    const { result } = renderHook(() => useTypeahead(() => items, onMatch));
    expect(result.current(key(' '))).toBe(false);
    expect(result.current({ ...key('s'), ctrlKey: true })).toBe(false);
    expect(result.current(key('ArrowDown'))).toBe(false);
    for (const k of ['s', 'a', 'v', 'e', ' ']) result.current(key(k));
    expect(onMatch).toHaveBeenLastCalledWith(items[0]);
  });

  it('skips disabled items and uses data-text-value when set', () => {
    const items = list('Delete', 'Duplicate', 'Download');
    items[0]?.setAttribute('aria-disabled', 'true');
    if (items[2]) items[2].dataset.textValue = 'Export';
    const onMatch = vi.fn();
    const { result } = renderHook(() => useTypeahead(() => items, onMatch));
    result.current(key('d'));
    expect(onMatch).toHaveBeenLastCalledWith(items[1]);
    vi.advanceTimersByTime(TYPEAHEAD_TIMEOUT);
    result.current(key('e'));
    expect(onMatch).toHaveBeenLastCalledWith(items[2]);
  });
});
