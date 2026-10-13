import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('lets one Toaster at a time show the toasts', () => {
    const store = createToastStore();
    const first = {};
    const second = {};
    expect(store.claim(first)).toBe(true);
    expect(store.claim(first)).toBe(true);
    expect(store.claim(second)).toBe(false);
    store.release(second);
    expect(store.claim(second)).toBe(false);
    store.release(first);
    expect(store.claim(second)).toBe(true);
  });
});
