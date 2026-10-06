import { expectTypeOf, test } from 'vitest';
import type { PopoverContentProps } from './Popover';

test('PopoverContent accepts only the documented sides and alignments', () => {
  expectTypeOf<PopoverContentProps['side']>().toEqualTypeOf<
    'top' | 'right' | 'bottom' | 'left' | undefined
  >();
  expectTypeOf<PopoverContentProps['align']>().toEqualTypeOf<
    'start' | 'center' | 'end' | undefined
  >();
  // @ts-expect-error 'above' is not a side
  const unknownSide: PopoverContentProps = { side: 'above' };
  // @ts-expect-error 'middle' is not an alignment
  const unknownAlign: PopoverContentProps = { align: 'middle' };
  expectTypeOf(unknownSide).toBeObject();
  expectTypeOf(unknownAlign).toBeObject();
});
