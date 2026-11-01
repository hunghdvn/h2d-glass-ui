import { createElement } from 'react';
import { createPortal } from 'react-dom';
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { toastStore } from './store';
import { toast } from './toast';
import { Toaster } from './Toaster';

const last = () => toastStore.getState().toasts.at(-1);

describe('toast', () => {
  afterEach(() => toast.dismiss());

  it('shows an info toast from a title, and returns its id', () => {
    const id = toast('Saved');
    expect(id).toMatch(/^flg-toast-\d+$/);
    expect(last()).toEqual({
      id,
      title: 'Saved',
      description: undefined,
      status: 'info',
      action: undefined,
      duration: undefined,
    });
    // A React element is a title too, not options.
    const title = createElement('strong', null, 'Done');
    toast(title);
    expect(last()?.title).toBe(title);
  });

  it('takes options, and an id that updates the toast with it', () => {
    const onClick = () => {};
    const id = toast({
      id: 'upload',
      title: 'Uploading',
      description: '3 files',
      status: 'warning',
      action: { label: 'Cancel', onClick },
      duration: 2000,
    });
    expect(id).toBe('upload');
    expect(last()).toEqual({
      id: 'upload',
      title: 'Uploading',
      description: '3 files',
      status: 'warning',
      action: { label: 'Cancel', onClick },
      duration: 2000,
    });
    toast.success({ id: 'upload', title: 'Uploaded' });
    expect(toastStore.getState().toasts).toHaveLength(1);
    expect(last()).toMatchObject({ id: 'upload', title: 'Uploaded', status: 'success' });
  });

  it('sets the status with toast.success, .error, .warning and .info', () => {
    toast.success('a');
    expect(last()?.status).toBe('success');
    toast.error({ title: 'b' });
    expect(last()?.status).toBe('error');
    toast.warning('c');
    expect(last()?.status).toBe('warning');
    toast.info('d');
    expect(last()?.status).toBe('info');
  });

  it('closes one toast by id, or all of them', () => {
    const a = toast('a');
    toast('b');
    toast.dismiss(a);
    expect(toastStore.getState().toasts.map((item) => item.title)).toEqual(['b']);
    toast.dismiss();
    expect(toastStore.getState().toasts).toEqual([]);
  });

  it('takes a portal, a Set and a promise as the title, with no warning', () => {
    resetDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const portal = createPortal(createElement('b'), document.createElement('div'));
    const set = new Set(['a', 'b']);
    const promise = Promise.resolve('x');
    for (const title of [portal, set, promise]) {
      toast(title as unknown as Parameters<typeof toast>[0]);
      expect(last()?.title).toBe(title);
    }
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('takes a class instance, or an object that inherits its title, as options', () => {
    resetDevWarnings();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    class Message {
      title = 'From a class';
      description = 'x';
    }
    toast(new Message());
    expect(last()).toMatchObject({ title: 'From a class', description: 'x' });
    toast(Object.create({ title: 'Inherited' }) as Parameters<typeof toast>[0]);
    expect(last()?.title).toBe('Inherited');
    // Still not options: an iterable or a promise that happens to carry a title.
    const set = Object.assign(new Set(['a']), { title: 'x' });
    toast(set as unknown as Parameters<typeof toast>[0]);
    expect(last()?.title).toBe(set);
    const promise = Object.assign(Promise.resolve('y'), { title: 'x' });
    toast(promise as unknown as Parameters<typeof toast>[0]);
    expect(last()?.title).toBe(promise);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('treats an options object with no title as options, warns once, and renders', () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resetDevWarnings();
    const id = toast({ description: 'x' } as unknown as Parameters<typeof toast>[0]);
    expect(id).toMatch(/^flg-toast-\d+$/);
    expect(toastStore.getState().toasts.at(-1)).toMatchObject({
      title: undefined,
      description: 'x',
    });
    expect(warn).toHaveBeenCalledTimes(1);
    const { unmount } = render(createElement(Toaster));
    act(() => {
      vi.advanceTimersByTime(0);
    });
    unmount();
    vi.useRealTimers();
    warn.mockRestore();
  });

  it('does not consume a generated number when a toast is given an id', () => {
    const seed = toast('seed');
    const n = Number(seed.split('-').pop());
    toast({ id: 'a', title: 'A' } as unknown as Parameters<typeof toast>[0]);
    expect(toast('B')).toBe(`flg-toast-${n + 1}`);
  });
});
