import { expectTypeOf, test } from 'vitest';
import type { NumberInputProps } from './NumberInput';

test('NumberInput takes null for no value, and reports a number or null', () => {
  expectTypeOf<NumberInputProps['value']>().toEqualTypeOf<number | null | undefined>();
  expectTypeOf<NumberInputProps['defaultValue']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<NumberInputProps['onValueChange']>().toEqualTypeOf<
    ((value: number | null) => void) | undefined
  >();
});

test('NumberInput accepts only the sizes of Input', () => {
  expectTypeOf<NumberInputProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'xl' is not a size
  const unknownSize: NumberInputProps = { size: 'xl' };
  expectTypeOf(unknownSize).toBeObject();
});

test('NumberInput takes numbers for min, max and step, not the strings of a native input', () => {
  // @ts-expect-error min is a number
  const text: NumberInputProps = { min: '0' };
  expectTypeOf(text).toBeObject();
  // @ts-expect-error the input is always text with the spinbutton role
  const typed: NumberInputProps = { type: 'number' };
  expectTypeOf(typed).toBeObject();
});

test('NumberInput labels name only the two buttons', () => {
  expectTypeOf<NumberInputProps['labels']>().toEqualTypeOf<
    { increment?: string; decrement?: string } | undefined
  >();
});
