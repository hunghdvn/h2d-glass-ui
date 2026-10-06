import type { ReactEventHandler } from 'react';
import { expectTypeOf, test } from 'vitest';
import type { DialogContentProps } from './Dialog';

test('DialogContent accepts only the documented sizes', () => {
  expectTypeOf<DialogContentProps['size']>().toEqualTypeOf<'sm' | 'md' | 'lg' | undefined>();
  // @ts-expect-error 'xl' is not a Dialog size
  const unknownSize: DialogContentProps = { size: 'xl' };
  expectTypeOf(unknownSize).toBeObject();
});

test('DialogContent takes the onCancel that can refuse Esc', () => {
  expectTypeOf<DialogContentProps['onCancel']>().toEqualTypeOf<
    ReactEventHandler<HTMLDialogElement> | undefined
  >();
});
