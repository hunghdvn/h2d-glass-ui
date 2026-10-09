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

test('a controlled Tabs takes null for no tab, and reports only tabs', () => {
  expectTypeOf<TabsProps['value']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<TabsProps['defaultValue']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<NonNullable<TabsProps['onValueChange']>>().parameters.toEqualTypeOf<[string]>();
});
