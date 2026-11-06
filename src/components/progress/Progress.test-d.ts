import { expectTypeOf, test } from 'vitest';
import type { ProgressLabels, ProgressProps } from './Progress';

test('a Progress takes only the documented variants, statuses and sizes', () => {
  expectTypeOf<ProgressProps['variant']>().toEqualTypeOf<'thin' | 'glow' | 'inline' | undefined>();
  expectTypeOf<ProgressProps['status']>().toEqualTypeOf<
    'default' | 'success' | 'error' | undefined
  >();
  expectTypeOf<ProgressProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
  // @ts-expect-error an unknown variant
  const unknownVariant: ProgressProps = { variant: 'thick' };
  // @ts-expect-error the variant of another component
  const otherVariant: ProgressProps = { variant: 'stripe' };
  // @ts-expect-error `info` is a status of Alert, not of Progress
  const otherStatus: ProgressProps = { status: 'info' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(otherVariant).toBeObject();
  expectTypeOf(otherStatus).toBeObject();
});

test('the value is a number or null, and may be left out', () => {
  expectTypeOf<ProgressProps['value']>().toEqualTypeOf<number | null | undefined>();
  const indeterminate: ProgressProps = { value: null };
  const unknownAmount: ProgressProps = {};
  expectTypeOf(indeterminate).toBeObject();
  expectTypeOf(unknownAmount).toBeObject();
});

test('a Progress has a role of its own and takes none', () => {
  // @ts-expect-error the root is always a progressbar
  const role: ProgressProps = { role: 'meter' };
  // @ts-expect-error the content is made by the component
  const children: ProgressProps = { children: 'x' };
  expectTypeOf(role).toBeObject();
  expectTypeOf(children).toBeObject();
});

test('getValueText reads the value and the maximum, and the labels may be given in part', () => {
  expectTypeOf<NonNullable<ProgressProps['getValueText']>>().toEqualTypeOf<
    (value: number, max: number) => string
  >();
  expectTypeOf<NonNullable<ProgressProps['labels']>>().toEqualTypeOf<Partial<ProgressLabels>>();
  expectTypeOf<keyof ProgressLabels>().toEqualTypeOf<'success' | 'error'>();
});
