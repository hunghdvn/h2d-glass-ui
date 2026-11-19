import { expectTypeOf, test } from 'vitest';
import type { SkeletonProps, SkeletonTextProps } from './Skeleton';

test('a Skeleton takes only the documented variants and shapes', () => {
  expectTypeOf<SkeletonProps['variant']>().toEqualTypeOf<
    'pulse' | 'shimmer' | 'glass' | undefined
  >();
  expectTypeOf<SkeletonTextProps['variant']>().toEqualTypeOf<SkeletonProps['variant']>();
  expectTypeOf<SkeletonProps['shape']>().toEqualTypeOf<'rect' | 'circle' | 'text' | undefined>();
  // @ts-expect-error an unknown variant
  const unknownVariant: SkeletonProps = { variant: 'wave' };
  // @ts-expect-error the variant of another component
  const otherVariant: SkeletonProps = { variant: 'stripe' };
  // @ts-expect-error an unknown shape
  const unknownShape: SkeletonProps = { shape: 'square' };
  expectTypeOf(unknownVariant).toBeObject();
  expectTypeOf(otherVariant).toBeObject();
  expectTypeOf(unknownShape).toBeObject();
});

test('the sizes are numbers or CSS strings', () => {
  expectTypeOf<SkeletonProps['width']>().toEqualTypeOf<number | string | undefined>();
  expectTypeOf<SkeletonProps['height']>().toEqualTypeOf<number | string | undefined>();
  expectTypeOf<SkeletonProps['size']>().toEqualTypeOf<number | string | undefined>();
  expectTypeOf<SkeletonTextProps['lines']>().toEqualTypeOf<number | undefined>();
});

test('a Skeleton is empty: it takes no children', () => {
  // @ts-expect-error the block is drawn by the component
  const children: SkeletonProps = { children: 'x' };
  // @ts-expect-error the lines are drawn by the component
  const textChildren: SkeletonTextProps = { children: 'x' };
  expectTypeOf(children).toBeObject();
  expectTypeOf(textChildren).toBeObject();
});
