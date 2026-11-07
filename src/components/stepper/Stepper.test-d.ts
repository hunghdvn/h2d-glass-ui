import { createRef } from 'react';
import type { ComponentProps } from 'react';
import { expectTypeOf, test } from 'vitest';
import type { StepProps, StepperLabels, StepperProps } from './Stepper';
import { Step, Stepper } from './Stepper';

test('a Stepper takes only the documented variants and orientations', () => {
  expectTypeOf<StepperProps['variant']>().toEqualTypeOf<
    'circles' | 'compact' | 'bars' | undefined
  >();
  expectTypeOf<StepperProps['orientation']>().toEqualTypeOf<
    'horizontal' | 'vertical' | undefined
  >();
  // @ts-expect-error an unknown variant
  const unknownVariant: StepperProps = { value: 0, children: null, variant: 'dots' };
  // @ts-expect-error the variant of another component
  const otherVariant: StepperProps = { value: 0, children: null, variant: 'inset' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(otherVariant).toBeObject();
});

test('a Stepper needs a value', () => {
  expectTypeOf<StepperProps['value']>().toEqualTypeOf<number>();
  // @ts-expect-error `value` is required: there is no uncontrolled form
  const missing: StepperProps = { children: null };
  expectTypeOf(missing).toBeObject();
});

test('onValueChange reports the index of the step', () => {
  expectTypeOf<NonNullable<StepperProps['onValueChange']>>().parameters.toEqualTypeOf<[number]>();
});

test('labels may be given in part, and two of them are functions', () => {
  expectTypeOf<NonNullable<StepperProps['labels']>>().toEqualTypeOf<Partial<StepperLabels>>();
  expectTypeOf<StepperLabels['step']>().toEqualTypeOf<(n: number, total: number) => string>();
  expectTypeOf<StepperLabels['caption']>().toEqualTypeOf<(n: number) => string>();
  expectTypeOf<keyof StepperLabels>().toEqualTypeOf<
    | 'step'
    | 'stepSeparator'
    | 'separator'
    | 'caption'
    | 'completed'
    | 'current'
    | 'notStarted'
    | 'error'
  >();
  expectTypeOf<StepperLabels['stepSeparator']>().toEqualTypeOf<string>();
  expectTypeOf<StepperLabels['separator']>().toEqualTypeOf<string>();
});

test('a Stepper takes a ref to its <ol>', () => {
  expectTypeOf(createRef<HTMLOListElement>()).toExtend<ComponentProps<typeof Stepper>['ref']>();
});

test('a Step has a title, takes only the two statuses, and takes no ref', () => {
  expectTypeOf<StepProps['status']>().toEqualTypeOf<'complete' | 'error' | undefined>();
  // @ts-expect-error `title` is required
  const untitled: StepProps = { description: 'x' };
  // @ts-expect-error `upcoming` is a place, not a status
  const place: StepProps = { title: 'x', status: 'upcoming' };
  expectTypeOf(untitled).toBeObject();
  expectTypeOf(place).toBeObject();
  expectTypeOf<ComponentProps<typeof Step>>().not.toHaveProperty('ref');
});
