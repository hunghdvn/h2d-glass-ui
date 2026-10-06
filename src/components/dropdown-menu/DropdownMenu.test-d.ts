import { expectTypeOf, test } from 'vitest';
import type { DropdownMenuContentProps, DropdownMenuTriggerProps } from './DropdownMenu';

test('DropdownMenuContent accepts only the documented sides and alignments', () => {
  expectTypeOf<DropdownMenuContentProps['side']>().toEqualTypeOf<
    'top' | 'right' | 'bottom' | 'left' | undefined
  >();
  expectTypeOf<DropdownMenuContentProps['align']>().toEqualTypeOf<
    'start' | 'center' | 'end' | undefined
  >();
});

test('the trigger and the panel take their ids from the menu', () => {
  // @ts-expect-error the trigger's id names the menu
  const trigger: DropdownMenuTriggerProps = { id: 'x' };
  // @ts-expect-error the panel's id is what aria-controls points at
  const content: DropdownMenuContentProps = { id: 'x' };
  expectTypeOf(trigger).toBeObject();
  expectTypeOf(content).toBeObject();
});
