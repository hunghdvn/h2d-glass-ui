import { describe, expect, it } from 'vitest';
import { getNextIndex } from './roving';

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
