import { expectTypeOf, test } from 'vitest';
import type { ComboboxProps } from './Combobox';

test('a Combobox takes null for no value, and reports a string or null', () => {
  expectTypeOf<ComboboxProps['value']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<ComboboxProps['defaultValue']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<ComboboxProps['onValueChange']>().toEqualTypeOf<
    ((value: string | null) => void) | undefined
  >();
  const cleared: ComboboxProps = { value: null, children: null };
  expectTypeOf(cleared).toBeObject();
});

test('a Combobox accepts only the sizes of Input', () => {
  expectTypeOf<ComboboxProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'xl' is not a size
  const unknownSize: ComboboxProps = { size: 'xl', children: null };
  expectTypeOf(unknownSize).toBeObject();
});

test('the filter is a function of the item and the text, or false', () => {
  expectTypeOf<ComboboxProps['filter']>().toEqualTypeOf<
    | ((item: { value: string; textValue: string }, inputValue: string) => boolean)
    | false
    | undefined
  >();
  // @ts-expect-error true is not a filter: leave it out for the default
  const on: ComboboxProps = { filter: true, children: null };
  expectTypeOf(on).toBeObject();
});

test('the text is a string, and is reported as one', () => {
  expectTypeOf<ComboboxProps['inputValue']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<ComboboxProps['onInputValueChange']>().toEqualTypeOf<
    ((text: string) => void) | undefined
  >();
});
