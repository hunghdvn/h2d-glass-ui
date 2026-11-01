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

test('Toaster does not accept children, since it renders its own', () => {
  // @ts-expect-error children are not part of ToasterProps
  const withChildren: ToasterProps = { children: 'x' };
  expectTypeOf(withChildren).toBeObject();
});

test('Toaster does not accept dangerouslySetInnerHTML, which React rejects beside children', () => {
  // @ts-expect-error dangerouslySetInnerHTML is not part of ToasterProps
  const withHtml: ToasterProps = { dangerouslySetInnerHTML: { __html: 'x' } };
  expectTypeOf(withHtml).toBeObject();
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

test('Toaster does not accept the props the library keeps for itself', () => {
  // @ts-expect-error the library names the region
  const label: ToasterProps = { 'aria-label': 'Alerts' };
  // @ts-expect-error the library names the region
  const labelledBy: ToasterProps = { 'aria-labelledby': 'h' };
  // @ts-expect-error the region has no role of its own to change
  const role: ToasterProps = { role: 'status' };
  // @ts-expect-error the region is a manual popover
  const popover: ToasterProps = { popover: 'auto' };
  // @ts-expect-error the region is focused from a script, never by Tab
  const tabIndex: ToasterProps = { tabIndex: 0 };
  expectTypeOf([label, labelledBy, role, popover, tabIndex]).toBeArray();
});
