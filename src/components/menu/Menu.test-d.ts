import { expectTypeOf, test } from 'vitest';
import type { MenuCheckboxItemProps, MenuItemProps, MenuRadioItemProps } from './Menu';

test('MenuItem takes the documented variants; a checkbox item takes none', () => {
  expectTypeOf<MenuItemProps['variant']>().toEqualTypeOf<'default' | 'danger' | undefined>();
  expectTypeOf<MenuItemProps['onSelect']>().toEqualTypeOf<((event: Event) => void) | undefined>();
  // @ts-expect-error a checkbox item has no variant
  const checkbox: MenuCheckboxItemProps = { variant: 'danger' };
  expectTypeOf(checkbox).toBeObject();
});

test('MenuRadioItem needs a value', () => {
  expectTypeOf<MenuRadioItemProps['value']>().toEqualTypeOf<string>();
  // @ts-expect-error value is required
  const radio: MenuRadioItemProps = {};
  expectTypeOf(radio).toBeObject();
});
