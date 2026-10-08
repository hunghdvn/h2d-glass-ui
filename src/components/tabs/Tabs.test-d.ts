import { expectTypeOf, test } from 'vitest';
import type { TabsProps, TabsTriggerProps } from './Tabs';

test('Tabs take only the documented variants, orientations and activation modes', () => {
  expectTypeOf<TabsProps['variant']>().toEqualTypeOf<
    'underline' | 'segmented' | 'pill' | undefined
  >();
  expectTypeOf<TabsProps['orientation']>().toEqualTypeOf<'vertical' | 'horizontal' | undefined>();
  expectTypeOf<TabsProps['activationMode']>().toEqualTypeOf<'automatic' | 'manual' | undefined>();
  // @ts-expect-error an unknown variant
  const unknownVariant: TabsProps = { variant: 'boxed' };
  // @ts-expect-error a tab needs the value that ties it to its panel
  const noValue: TabsTriggerProps = { children: 'Overview' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(noValue).toBeObject();
});
