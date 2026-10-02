import { expectTypeOf, test } from 'vitest';
import type { InputProps } from './Input';

test('Input accepts only the documented sizes', () => {
  expectTypeOf<InputProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'xl' is not an Input size
  const unknownSize: InputProps = { size: 'xl' };
  expectTypeOf(unknownSize).toBeObject();
});
