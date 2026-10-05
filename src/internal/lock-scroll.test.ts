import { afterEach, describe, expect, it, vi } from 'vitest';
import { lockScroll } from './lock-scroll';

const root = document.documentElement;

function withScrollbar(width: number) {
  vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000);
  vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(1000 - width);
}

describe('lockScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    root.removeAttribute('style');
  });

  it('hides the overflow of <html> and keeps the scrollbar space while locked', () => {
    withScrollbar(15);
    const release = lockScroll();
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.scrollbarGutter).toBe('stable');
    release();
    expect(root.style.overflow).toBe('');
    expect(root.style.scrollbarGutter).toBe('');
  });

  it('adds no gutter when the page shows no classic scrollbar', () => {
    withScrollbar(0);
    const release = lockScroll();
    expect(root.style.overflow).toBe('hidden');
    expect(root.style.scrollbarGutter).toBe('');
    release();
  });

  it('stays locked until the last of several locks is released', () => {
    withScrollbar(15);
    const first = lockScroll();
    const second = lockScroll();
    first();
    expect(root.style.overflow).toBe('hidden');
    second();
    expect(root.style.overflow).toBe('');
  });

  it('ignores a release called twice, and restores the inline style the page had', () => {
    withScrollbar(15);
    root.style.overflow = 'scroll';
    const first = lockScroll();
    const second = lockScroll();
    first();
    first();
    expect(root.style.overflow).toBe('hidden');
    second();
    expect(root.style.overflow).toBe('scroll');
  });
});
