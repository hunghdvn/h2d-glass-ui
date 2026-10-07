import { expectTypeOf, test } from 'vitest';
import type { SelectMultipleProps, SelectProps, SelectSingleProps } from './Select';

test('a multiple Select takes only string arrays; a single one only a string or null', () => {
  expectTypeOf<SelectMultipleProps['value']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<SelectMultipleProps['onValueChange']>().toEqualTypeOf<
    ((value: string[]) => void) | undefined
  >();
  expectTypeOf<SelectSingleProps['value']>().toEqualTypeOf<string | null | undefined>();
  // @ts-expect-error a multiple Select's value is an array
  const multipleWithString: SelectProps = { multiple: true, value: 'a', children: null };
  // @ts-expect-error a single Select's value is not an array
  const singleWithArray: SelectProps = { value: ['a'], children: null };
  expectTypeOf(multipleWithString).toBeObject();
  expectTypeOf(singleWithArray).toBeObject();
});
