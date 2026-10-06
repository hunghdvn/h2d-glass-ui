import { describe, expect, it, vi } from 'vitest';
import { getTopModal, registerModal, subscribeModals } from './modal-stack';

const entry = () => ({
  dialog: document.createElement('dialog'),
  host: document.createElement('div'),
});

describe('modal stack', () => {
  it('returns the modal opened last, and the one below once it closes', () => {
    const first = entry();
    const second = entry();
    const removeFirst = registerModal(first);
    const removeSecond = registerModal(second);
    expect(getTopModal()).toBe(second);
    removeSecond();
    expect(getTopModal()).toBe(first);
    removeFirst();
    expect(getTopModal()).toBeUndefined();
  });

  it('lets a modal below the top one close first', () => {
    const first = entry();
    const second = entry();
    const removeFirst = registerModal(first);
    const removeSecond = registerModal(second);
    removeFirst();
    expect(getTopModal()).toBe(second);
    removeSecond();
  });

  it('notifies subscribers on every change, and not after they unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeModals(listener);
    const remove = registerModal(entry());
    remove();
    remove();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    registerModal(entry())();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
