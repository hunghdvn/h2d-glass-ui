import { expectTypeOf, test } from 'vitest';
import { dataAttr } from './data-attr';

test('dataAttr returns a bare-attribute value or nothing', () => {
  expectTypeOf(dataAttr(true)).toEqualTypeOf<'' | undefined>();
});
