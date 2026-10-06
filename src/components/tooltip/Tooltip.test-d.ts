import { createElement } from 'react';
import type { ReactElement } from 'react';
import { expectTypeOf, test } from 'vitest';
import type { TooltipContentProps, TooltipTriggerProps } from './Tooltip';

const button: ReactElement = createElement('button', { type: 'button' }, 'Settings');

test('TooltipTrigger takes exactly one element', () => {
  const one: TooltipTriggerProps = { children: button };
  // @ts-expect-error a string is not an element that can take focus
  const text: TooltipTriggerProps = { children: 'Settings' };
  // @ts-expect-error two elements are not one
  const two: TooltipTriggerProps = { children: [button, button] };
  expectTypeOf(one).toBeObject();
  expectTypeOf(text).toBeObject();
  expectTypeOf(two).toBeObject();
});

test('TooltipContent accepts only the documented sides and alignments', () => {
  expectTypeOf<TooltipContentProps['side']>().toEqualTypeOf<
    'top' | 'right' | 'bottom' | 'left' | undefined
  >();
  expectTypeOf<TooltipContentProps['align']>().toEqualTypeOf<
    'start' | 'center' | 'end' | undefined
  >();
  // @ts-expect-error 'above' is not a side
  const unknownSide: TooltipContentProps = { side: 'above' };
  // @ts-expect-error 'middle' is not an alignment
  const unknownAlign: TooltipContentProps = { align: 'middle' };
  expectTypeOf(unknownSide).toBeObject();
  expectTypeOf(unknownAlign).toBeObject();
});
