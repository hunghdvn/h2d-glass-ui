import { expectTypeOf, test } from 'vitest';
import type { ThemeMenuGroupProps, ThemeScriptProps, ThemeSwitchProps, ThemeValue } from './index';

test('the theme is one of three words', () => {
  expectTypeOf<ThemeValue>().toEqualTypeOf<'light' | 'dark' | 'system'>();
  expectTypeOf<ThemeSwitchProps['value']>().toEqualTypeOf<ThemeValue | undefined>();
  expectTypeOf<ThemeSwitchProps['defaultValue']>().toEqualTypeOf<ThemeValue | undefined>();
  expectTypeOf<ThemeMenuGroupProps['value']>().toEqualTypeOf<ThemeValue | undefined>();
  expectTypeOf<ThemeSwitchProps['onValueChange']>().toEqualTypeOf<
    ((value: ThemeValue) => void) | undefined
  >();
  // @ts-expect-error a theme the library does not know
  const sepia: ThemeSwitchProps = { value: 'sepia' };
  // @ts-expect-error nor as the theme of the menu group
  const sepiaGroup: ThemeMenuGroupProps = { defaultValue: 'sepia' };
  expectTypeOf(sepia).toBeObject();
  expectTypeOf(sepiaGroup).toBeObject();
});

test('the name of the switch is made by labels.trigger, never passed in', () => {
  // @ts-expect-error the name of the button comes from labels.trigger
  const label: ThemeSwitchProps = { 'aria-label': 'Theme' };
  // @ts-expect-error nor from another element
  const labelledby: ThemeSwitchProps = { 'aria-labelledby': 'x' };
  expectTypeOf(label).toBeObject();
  expectTypeOf(labelledby).toBeObject();
});

test('the content of the switch is its three icons, and it is not a slot', () => {
  // @ts-expect-error the icons are the library's
  const children: ThemeSwitchProps = { children: 'Theme' };
  // @ts-expect-error a slot would replace the button that the icons are in
  const asChild: ThemeSwitchProps = { asChild: true };
  expectTypeOf(children).toBeObject();
  expectTypeOf(asChild).toBeObject();
});

test('the words of the switch and of the menu group are all optional, and some are functions', () => {
  expectTypeOf<NonNullable<ThemeSwitchProps['labels']>['trigger']>().toEqualTypeOf<
    ((current: string) => string) | undefined
  >();
  expectTypeOf<NonNullable<ThemeSwitchProps['labels']>['tooltip']>().toEqualTypeOf<
    ((current: string, next: string) => string) | undefined
  >();
  expectTypeOf<NonNullable<ThemeSwitchProps['labels']>['hint']>().toEqualTypeOf<
    ((next: string) => string) | undefined
  >();
  expectTypeOf<NonNullable<ThemeMenuGroupProps['labels']>['group']>().toEqualTypeOf<
    string | undefined
  >();
});

test('the menu group has its own items', () => {
  // @ts-expect-error the three items are the library's
  const children: ThemeMenuGroupProps = { children: null };
  expectTypeOf(children).toBeObject();
});

test('ThemeScript takes a key and a nonce, and nothing else', () => {
  expectTypeOf<ThemeScriptProps>().toEqualTypeOf<{ storageKey?: string; nonce?: string }>();
});
