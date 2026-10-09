import { afterEach, describe, expect, it, vi } from 'vitest';
import { focusNext, getNextIndex } from './roving';

const items = (...disabled: boolean[]) => disabled.map((value) => ({ disabled: value }));
const vertical = { orientation: 'vertical', loop: true } as const;

describe('getNextIndex', () => {
  it('moves down and up, wrapping at the ends when looping', () => {
    const list = items(false, false, false);
    expect(getNextIndex(list, 0, 'ArrowDown', vertical)).toBe(1);
    expect(getNextIndex(list, 2, 'ArrowDown', vertical)).toBe(0);
    expect(getNextIndex(list, 0, 'ArrowUp', vertical)).toBe(2);
  });

  it('stays at the ends without looping', () => {
    const list = items(false, false);
    const options = { orientation: 'vertical', loop: false } as const;
    expect(getNextIndex(list, 1, 'ArrowDown', options)).toBe(1);
    expect(getNextIndex(list, 0, 'ArrowUp', options)).toBe(0);
  });

  it('skips disabled items, also for Home and End', () => {
    const list = items(true, false, true, false, true);
    expect(getNextIndex(list, 1, 'ArrowDown', vertical)).toBe(3);
    expect(getNextIndex(list, 3, 'ArrowDown', vertical)).toBe(1);
    expect(getNextIndex(list, 3, 'Home', vertical)).toBe(1);
    expect(getNextIndex(list, 1, 'End', vertical)).toBe(3);
  });

  it('starts at the first or the last item when nothing has focus', () => {
    const list = items(false, false, false);
    expect(getNextIndex(list, -1, 'ArrowDown', vertical)).toBe(0);
    expect(getNextIndex(list, -1, 'ArrowUp', vertical)).toBe(2);
  });

  it('uses the arrows of its orientation and ignores the others', () => {
    const list = items(false, false);
    const horizontal = { orientation: 'horizontal', loop: true } as const;
    expect(getNextIndex(list, 0, 'ArrowRight', horizontal)).toBe(1);
    expect(getNextIndex(list, 1, 'ArrowLeft', horizontal)).toBe(0);
    expect(getNextIndex(list, 0, 'ArrowDown', horizontal)).toBeNull();
    expect(getNextIndex(list, 0, 'ArrowRight', vertical)).toBeNull();
    expect(getNextIndex(list, 0, 'a', vertical)).toBeNull();
  });

  it('returns null when every item is disabled', () => {
    expect(getNextIndex(items(true, true), 0, 'ArrowDown', vertical)).toBeNull();
  });
});

describe('focusNext', () => {
  afterEach(() => document.body.replaceChildren());

  const buttons = (count: number) =>
    Array.from({ length: count }, (_, index) => {
      const button = document.createElement('button');
      button.textContent = String(index);
      document.body.append(button);
      return button;
    });
  const keydown = (
    key: string,
    modifiers: Partial<Record<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>> = {},
  ) => ({
    key,
    ...modifiers,
    preventDefault: vi.fn(),
  });

  it('moves focus for a navigation key and reports it', () => {
    const list = buttons(3);
    list[0]?.focus();
    const event = keydown('ArrowDown');
    expect(focusNext(event, list, vertical)).toBe(true);
    expect(document.activeElement).toBe(list[1]);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('leaves a key with Alt, Ctrl or Meta to the browser and the system', () => {
    const list = buttons(3);
    list[0]?.focus();
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
      for (const key of ['ArrowDown', 'End']) {
        const event = keydown(key, { [modifier]: true });
        expect(focusNext(event, list, vertical)).toBe(false);
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    }
    expect(document.activeElement).toBe(list[0]);
    // Shift alone changes nothing a list does with these keys.
    expect(focusNext(keydown('ArrowDown', { shiftKey: true }), list, vertical)).toBe(true);
  });

  it('moves from the item it is given instead of the focused one', () => {
    const list = buttons(3);
    list[0]?.focus();
    expect(focusNext(keydown('ArrowDown'), list, vertical, list[1])).toBe(true);
    expect(document.activeElement).toBe(list[2]);
  });
});
