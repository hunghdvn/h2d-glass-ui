import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { toastStore } from './store';
import { toast } from './toast';

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
});
