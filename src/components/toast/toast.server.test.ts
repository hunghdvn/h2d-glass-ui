// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WARN_PREFIX, resetDevWarnings } from '../../internal/warn';
import { toastStore } from './store';
import { toast } from './toast';

describe('toast during the server render of a client component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetDevWarnings();
  });

  it('does nothing but warn when a client component calls it on the server, so no toast leaks', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(typeof window).toBe('undefined');
    expect(toast({ id: 'saved', title: 'Saved' })).toBe('saved');
    expect(toast.error('Failed')).toMatch(/^flg-toast-\d+$/);
    expect(toastStore.getState().toasts).toEqual([]);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      WARN_PREFIX +
        ' toast() was called on the server, where it does nothing. Call it from code ' +
        'that runs in the browser, such as an event handler or an effect.',
    );
  });
});
