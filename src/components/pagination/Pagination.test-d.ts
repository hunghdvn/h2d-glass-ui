import type { ReactElement } from 'react';
import { expectTypeOf, test } from 'vitest';
import type { PaginationLinkProps, PaginationProps } from '../../index';

test('PaginationLinkProps is exported, so renderLink can be a separate typed function', () => {
  type RenderLink = (props: PaginationLinkProps, page: number) => ReactElement;
  expectTypeOf<RenderLink>().toEqualTypeOf<NonNullable<PaginationProps['renderLink']>>();
  expectTypeOf<PaginationLinkProps['href']>().toEqualTypeOf<string>();
});
