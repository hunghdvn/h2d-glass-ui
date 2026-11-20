import { describe, expect, it } from 'vitest';
import { isMenuKey } from './menu-key';

const key = (
  name: string,
  held: Partial<Record<'shift' | 'ctrl' | 'alt' | 'meta', true>> = {},
) => ({
  key: name,
  shiftKey: held.shift === true,
  ctrlKey: held.ctrl === true,
  altKey: held.alt === true,
  metaKey: held.meta === true,
});

describe('isMenuKey', () => {
  it('is true for the ContextMenu key', () => {
    expect(isMenuKey(key('ContextMenu'))).toBe(true);
  });

  it('is true for the ContextMenu key whatever is held with it', () => {
    expect(isMenuKey(key('ContextMenu', { shift: true, ctrl: true, alt: true, meta: true }))).toBe(
      true,
    );
  });

  it('is true for Shift+F10 held with nothing else', () => {
    expect(isMenuKey(key('F10', { shift: true }))).toBe(true);
  });

  it.each([
    ['F10 alone', key('F10')],
    ['Ctrl+Shift+F10', key('F10', { shift: true, ctrl: true })],
    ['Alt+Shift+F10', key('F10', { shift: true, alt: true })],
    ['Meta+Shift+F10', key('F10', { shift: true, meta: true })],
    ['Shift+F9', key('F9', { shift: true })],
    ['Enter', key('Enter')],
  ])('is false for %s', (_name, event) => {
    expect(isMenuKey(event)).toBe(false);
  });
});
