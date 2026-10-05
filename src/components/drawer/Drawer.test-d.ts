import { expectTypeOf, test } from 'vitest';
import type { DrawerContentProps } from './Drawer';

test('DrawerContent accepts only the documented sides and variants', () => {
  expectTypeOf<DrawerContentProps['side']>().toEqualTypeOf<
    'right' | 'left' | 'top' | 'bottom' | undefined
  >();
  expectTypeOf<DrawerContentProps['variant']>().toEqualTypeOf<'flush' | 'floating' | undefined>();
  // @ts-expect-error 'start' is not a side
  const unknownSide: DrawerContentProps = { side: 'start' };
  // @ts-expect-error 'inset' is not a variant
  const unknownVariant: DrawerContentProps = { variant: 'inset' };
  expectTypeOf(unknownSide).toBeObject();
  expectTypeOf(unknownVariant).toBeObject();
});
