import { expectTypeOf, test } from 'vitest';
import type { ButtonProps } from './Button';

test('Button accepts only the documented variants and sizes', () => {
  expectTypeOf<ButtonProps['variant']>().toEqualTypeOf<
    'primary' | 'secondary' | 'ghost' | 'danger' | undefined
  >();
  expectTypeOf<ButtonProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'link' is not a Button variant
  const unknownVariant: ButtonProps = { variant: 'link' };
  // @ts-expect-error 'xl' is not a Button size
  const unknownSize: ButtonProps = { size: 'xl' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(unknownSize).toBeObject();
});
