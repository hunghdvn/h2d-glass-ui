import { expectTypeOf, test } from 'vitest';
import type { BreadcrumbProps } from './Breadcrumb';

test('Breadcrumb takes only the documented separators', () => {
  expectTypeOf<BreadcrumbProps['separator']>().toEqualTypeOf<'chevron' | 'slash' | undefined>();
  // @ts-expect-error an unknown separator
  const unknown: BreadcrumbProps = { separator: 'arrow' };
  expectTypeOf(unknown).toBeObject();
});
