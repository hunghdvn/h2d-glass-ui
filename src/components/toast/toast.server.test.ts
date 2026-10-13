// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { toastStore } from './store';
import { toast } from './toast';

describe('toast on the server', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resetDevWarnings();
  });

  it('does nothing but warn, so no toast carries over into the next request', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(typeof window).toBe('undefined');
    expect(toast({ id: 'saved', title: 'Saved' })).toBe('saved');
    expect(toast.error('Failed')).toMatch(/^flg-toast-\d+$/);
    expect(toastStore.getState().toasts).toEqual([]);
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '[fl-glass-ui] toast() was called on the server, where it does nothing. Call it from code ' +
        'that runs in the browser, such as an event handler or an effect.',
    );
  });
});
