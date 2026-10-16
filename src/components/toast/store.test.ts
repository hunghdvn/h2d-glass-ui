import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { createToastStore } from './store';
import type { ToastEntry } from './store';

const entry = (id: string, extra: Partial<ToastEntry> = {}): ToastEntry => ({
  id,
  title: `Toast ${id}`,
  description: undefined,
  status: 'info',
  action: undefined,
  duration: undefined,
  ...extra,
});
const ids = (list: readonly ToastEntry[]) => list.map((item) => item.id);

describe('toast store', () => {
  beforeEach(() => {
    // The default fakes `performance` too, which the store reads as its clock.
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps toasts until a Toaster shows them, then shows the first `max`, oldest first', () => {
    const store = createToastStore();
    store.add(entry('a'));
    store.add(entry('b'));
    store.add(entry('c'));
    expect(ids(store.getState().toasts)).toEqual(['a', 'b', 'c']);
    expect(store.getState().shown).toEqual([]);
    store.attach({ max: 2, duration: 5000 });
    expect(ids(store.getState().shown)).toEqual(['a', 'b']);
    // One closes: the waiting one moves up.
    store.dismiss('a');
    expect(ids(store.getState().shown)).toEqual(['b', 'c']);
  });

  it('closes a toast after its time, counted from when it shows, not from when it was added', () => {
    const store = createToastStore();
    store.attach({ max: 1, duration: 5000 });
    store.add(entry('a'));
    store.add(entry('b'));
    vi.advanceTimersByTime(4000);
    expect(ids(store.getState().toasts)).toEqual(['a', 'b']);
    vi.advanceTimersByTime(1000);
    expect(ids(store.getState().shown)).toEqual(['b']);
    // b waited 5000 ms already; its own 5000 ms start now.
    vi.advanceTimersByTime(4999);
    expect(ids(store.getState().shown)).toEqual(['b']);
    vi.advanceTimersByTime(1);
    expect(store.getState().toasts).toEqual([]);
  });

  it("takes the Toaster's time by default, keeps a toast with an action, and honours its own", () => {
    const store = createToastStore();
    store.attach({ max: 5, duration: 1000 });
    store.add(entry('default'));
    store.add(entry('action', { action: { label: 'Undo', onClick: () => {} } }));
    store.add(entry('own', { duration: 3000 }));
    store.add(entry('forever', { duration: Infinity }));
    vi.advanceTimersByTime(1000);
    expect(ids(store.getState().toasts)).toEqual(['action', 'own', 'forever']);
    vi.advanceTimersByTime(2000);
    expect(ids(store.getState().toasts)).toEqual(['action', 'forever']);
    vi.advanceTimersByTime(60_000);
    expect(ids(store.getState().toasts)).toEqual(['action', 'forever']);
  });

  it('updates a toast with the same id in place and starts its time again', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: 1000 });
    store.add(entry('a'));
    store.add(entry('b'));
    vi.advanceTimersByTime(800);
    store.add(entry('a', { title: 'Saved', status: 'success' }));
    expect(ids(store.getState().shown)).toEqual(['a', 'b']);
    expect(store.getState().shown[0]).toMatchObject({ title: 'Saved', status: 'success' });
    vi.advanceTimersByTime(200);
    expect(ids(store.getState().shown)).toEqual(['a']);
    vi.advanceTimersByTime(800);
    expect(store.getState().shown).toEqual([]);
  });

  it('stands still while any reason pauses it, and runs on with the time that was left', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: 1000 });
    store.add(entry('a'));
    vi.advanceTimersByTime(600);
    store.pause('hover');
    store.pause('focus');
    vi.advanceTimersByTime(10_000);
    store.resume('hover');
    vi.advanceTimersByTime(10_000);
    expect(ids(store.getState().shown)).toEqual(['a']);
    store.resume('focus');
    vi.advanceTimersByTime(399);
    expect(ids(store.getState().shown)).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(store.getState().shown).toEqual([]);
  });

  it('stops the time while no Toaster shows the toasts, and runs on when one does', () => {
    const store = createToastStore();
    const detach = store.attach({ max: 3, duration: 1000 });
    store.add(entry('a'));
    vi.advanceTimersByTime(700);
    detach();
    expect(store.getState().shown).toEqual([]);
    vi.advanceTimersByTime(10_000);
    store.attach({ max: 3, duration: 1000 });
    vi.advanceTimersByTime(299);
    expect(ids(store.getState().shown)).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(store.getState().shown).toEqual([]);
  });

  it('treats a duration above what setTimeout can count as Infinity', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: 1000 });
    store.add(entry('long', { duration: Number.MAX_SAFE_INTEGER }));
    store.add(entry('edge', { duration: 2147483647 }));
    vi.advanceTimersByTime(2147483647);
    expect(ids(store.getState().shown)).toEqual(['long']);
  });

  it('takes a new `max` or `duration` without hiding the toasts in between', () => {
    const store = createToastStore();
    store.configure({ max: 1, duration: 1000 });
    store.add(entry('a'));
    store.add(entry('b'));
    // Nothing to configure before a Toaster attaches.
    expect(store.getState().shown).toEqual([]);
    const detach = store.attach({ max: 3, duration: 1000 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.configure({ max: 1, duration: 1000 });
    expect(ids(store.getState().shown)).toEqual(['a']);
    // One change: not empty first, then full again.
    expect(listener).toHaveBeenCalledOnce();
    // A detach from an earlier attach does nothing once another has attached.
    store.attach({ max: 2, duration: 1000 });
    detach();
    expect(ids(store.getState().shown)).toEqual(['a', 'b']);
  });

  it('closes one toast by id, or all of them', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: Infinity });
    store.add(entry('a'));
    store.add(entry('b'));
    store.add(entry('c'));
    store.dismiss('b');
    expect(ids(store.getState().toasts)).toEqual(['a', 'c']);
    store.dismiss('missing');
    expect(ids(store.getState().toasts)).toEqual(['a', 'c']);
    store.dismiss();
    expect(store.getState().toasts).toEqual([]);
  });

  it('tells its listeners about a change, and keeps the same state object without one', () => {
    const store = createToastStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const before = store.getState();
    store.attach({ max: 3, duration: 1000 });
    store.pause('hover');
    store.resume('hover');
    expect(store.getState()).toBe(before);
    expect(listener).not.toHaveBeenCalled();
    store.add(entry('a'));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.dismiss();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('lets one Toaster at a time show the toasts, and hands over to the next that waits', () => {
    const store = createToastStore();
    const first = {};
    const second = {};
    const third = {};
    const granted: string[] = [];
    expect(store.claim(first, () => granted.push('first'))).toBe(true);
    expect(store.claim(first, () => granted.push('first'))).toBe(true);
    expect(store.claim(second, () => granted.push('second'))).toBe(false);
    expect(store.claim(third, () => granted.push('third'))).toBe(false);
    // Asking again does not queue twice.
    expect(store.claim(second, () => granted.push('second'))).toBe(false);
    expect(granted).toEqual([]);
    // The owner leaves: the one that waited longest takes over, once.
    store.release(first);
    expect(granted).toEqual(['second']);
    // A Toaster that waits and unmounts is dropped from the line.
    store.release(third);
    store.release(second);
    expect(granted).toEqual(['second']);
    expect(store.claim(third, () => granted.push('third'))).toBe(true);
  });

  describe('checks `max` and `duration`', () => {
    beforeEach(() => {
      resetDevWarnings();
    });

    it('makes `max` an integer of at least 1, and says so', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const store = createToastStore();
      store.add(entry('a'));
      store.add(entry('b'));
      store.add(entry('c'));
      store.attach({ max: -1, duration: 5000 });
      expect(ids(store.getState().shown)).toEqual(['a']);
      store.configure({ max: 0, duration: 5000 });
      expect(ids(store.getState().shown)).toEqual(['a']);
      store.configure({ max: 2.7, duration: 5000 });
      expect(ids(store.getState().shown)).toEqual(['a', 'b']);
      store.configure({ max: Number.NaN, duration: 5000 });
      expect(ids(store.getState().shown)).toEqual(['a', 'b', 'c']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('max'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('-1'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('NaN'));
      warn.mockRestore();
    });

    it('lets `max` be Infinity, which means no limit, without a warning', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const store = createToastStore();
      store.attach({ max: Infinity, duration: 5000 });
      store.add(entry('a'));
      store.add(entry('b'));
      expect(ids(store.getState().shown)).toEqual(['a', 'b']);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });

    it('falls back to 5000 for a Toaster `duration` that is not a positive number', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      for (const bad of [Number.NaN, 0, -100]) {
        const store = createToastStore();
        store.attach({ max: 3, duration: bad });
        store.add(entry('a'));
        vi.advanceTimersByTime(4999);
        expect(ids(store.getState().shown)).toEqual(['a']);
        vi.advanceTimersByTime(1);
        expect(store.getState().shown).toEqual([]);
      }
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('duration'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('-100'));
      // Infinity stays valid.
      const store = createToastStore();
      store.attach({ max: 3, duration: Infinity });
      store.add(entry('a'));
      vi.advanceTimersByTime(60_000);
      expect(ids(store.getState().shown)).toEqual(['a']);
      warn.mockRestore();
    });

    it("falls back to the Toaster's time for a toast's own `duration` that is not positive", () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const store = createToastStore();
      store.attach({ max: 3, duration: 2000 });
      store.add(entry('nan', { duration: Number.NaN }));
      store.add(entry('zero', { duration: 0 }));
      store.add(entry('negative', { duration: -5 }));
      vi.advanceTimersByTime(1999);
      expect(ids(store.getState().shown)).toEqual(['nan', 'zero', 'negative']);
      vi.advanceTimersByTime(1);
      expect(store.getState().shown).toEqual([]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('-5'));
      warn.mockRestore();
    });
  });

  it('keeps time with a clock that does not jump when the system clock does', () => {
    const store = createToastStore();
    store.attach({ max: 3, duration: 1000 });
    store.add(entry('a'));
    vi.advanceTimersByTime(400);
    // The system clock jumps forward, as after a sleep or a clock correction.
    vi.setSystemTime(Date.now() + 60_000);
    store.pause('hover');
    store.resume('hover');
    vi.advanceTimersByTime(599);
    expect(ids(store.getState().shown)).toEqual(['a']);
    vi.advanceTimersByTime(1);
    expect(store.getState().shown).toEqual([]);
  });
});
