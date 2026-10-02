import { expectTypeOf, test } from 'vitest';
import type { RadioProps } from './Radio';
import type { RadioGroupProps } from './RadioGroup';

test('RadioGroup accepts only the documented orientations', () => {
  expectTypeOf<RadioGroupProps['orientation']>().toEqualTypeOf<
    'vertical' | 'horizontal' | undefined
  >();
  // @ts-expect-error 'diagonal' is not an orientation
  const unknownOrientation: RadioGroupProps = { orientation: 'diagonal' };
  expectTypeOf(unknownOrientation).toBeObject();
});

test('Radio requires a value', () => {
  expectTypeOf<RadioProps['value']>().toEqualTypeOf<string>();
  // @ts-expect-error a Radio without a value cannot be selected
  const noValue: RadioProps = {};
  expectTypeOf(noValue).toBeObject();
});
