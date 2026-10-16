import { expectTypeOf, test } from 'vitest';
import type { ToastOptions } from './store';
import { toast } from './toast';
import type { ToasterProps } from './Toaster';

test('Toaster takes only the documented positions', () => {
  expectTypeOf<ToasterProps['position']>().toEqualTypeOf<
    | 'bottom-center'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'top-right'
    | 'top-left'
    | undefined
  >();
  // @ts-expect-error 'center' is not a position
  const unknown: ToasterProps = { position: 'center' };
  expectTypeOf(unknown).toBeObject();
});

test('a toast takes only the documented statuses, and the helpers set their own', () => {
  expectTypeOf<ToastOptions['status']>().toEqualTypeOf<
    'info' | 'success' | 'warning' | 'error' | undefined
  >();
  // @ts-expect-error 'danger' is a Badge variant, not a toast status
  const danger: ToastOptions = { title: 'Failed', status: 'danger' };
  expectTypeOf(danger).toBeObject();
  // @ts-expect-error toast.success sets the status itself
  toast.success({ title: 'Saved', status: 'error' });
  expectTypeOf(toast('Saved')).toEqualTypeOf<string>();
});
