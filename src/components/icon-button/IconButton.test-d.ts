import { expectTypeOf, test } from 'vitest';
import type { IconButtonProps } from './IconButton';

test('IconButton requires an accessible name', () => {
  const withLabel: IconButtonProps = { 'aria-label': 'Close' };
  const withLabelledBy: IconButtonProps = { 'aria-labelledby': 'close-label' };
  // @ts-expect-error an IconButton without aria-label or aria-labelledby has no accessible name
  const unnamed: IconButtonProps = {};
  expectTypeOf(withLabel).toBeObject();
  expectTypeOf(withLabelledBy).toBeObject();
  expectTypeOf(unnamed).toBeObject();
});
