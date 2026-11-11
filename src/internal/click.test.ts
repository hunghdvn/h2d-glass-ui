import { describe, expect, it, vi } from 'vitest';
import { blockActivation, isPlainClick } from './click';

const click = (init: Partial<Parameters<typeof isPlainClick>[0]> = {}) => ({
  button: 0,
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  defaultPrevented: false,
  ...init,
});

describe('isPlainClick', () => {
  it('is a click of the main button, with no key held, that no handler has taken', () => {
    expect(isPlainClick(click())).toBe(true);
  });

  it.each([['ctrlKey'], ['metaKey'], ['shiftKey'], ['altKey']] as const)(
    'is not one with %s: the browser opens the link elsewhere, or downloads it',
    (key) => {
      expect(isPlainClick(click({ [key]: true }))).toBe(false);
    },
  );

  it('is not one of another button, nor one that a handler cancelled', () => {
    expect(isPlainClick(click({ button: 1 }))).toBe(false);
    expect(isPlainClick(click({ defaultPrevented: true }))).toBe(false);
  });
});

describe('blockActivation', () => {
  it('cancels the event and stops it where it is', () => {
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
    blockActivation(event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });
});
