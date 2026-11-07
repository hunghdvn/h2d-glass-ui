import { expectTypeOf, test } from 'vitest';
import type { MouseEvent, ReactNode } from 'react';
import type { AlertLabels, AlertProps, AlertTitleProps } from './Alert';

test('an Alert takes only the documented variants and statuses', () => {
  expectTypeOf<AlertProps['variant']>().toEqualTypeOf<'stripe' | 'tinted' | 'plain' | undefined>();
  expectTypeOf<AlertProps['status']>().toEqualTypeOf<
    'info' | 'success' | 'warning' | 'error' | undefined
  >();
  // @ts-expect-error an unknown variant
  const unknownVariant: AlertProps = { variant: 'solid' };
  // @ts-expect-error the variant of another component
  const otherVariant: AlertProps = { variant: 'inset' };
  // @ts-expect-error an unknown status
  const unknownStatus: AlertProps = { status: 'danger' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(otherVariant).toBeObject();
  expectTypeOf(unknownStatus).toBeObject();
});

test('the icon is a node or false, and a dismissal reports the click', () => {
  expectTypeOf<AlertProps['icon']>().toEqualTypeOf<ReactNode | false>();
  expectTypeOf<NonNullable<AlertProps['onDismiss']>>().parameters.toEqualTypeOf<
    [MouseEvent<HTMLButtonElement>]
  >();
});

test('labels may be given in part, with a name for each status and the button', () => {
  expectTypeOf<NonNullable<AlertProps['labels']>>().toEqualTypeOf<Partial<AlertLabels>>();
  expectTypeOf<keyof AlertLabels>().toEqualTypeOf<
    'info' | 'success' | 'warning' | 'error' | 'dismiss'
  >();
});

test('only the title can render as its child', () => {
  expectTypeOf<AlertTitleProps['asChild']>().toEqualTypeOf<boolean | undefined>();
});
