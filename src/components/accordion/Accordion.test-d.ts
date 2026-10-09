import { expectTypeOf, test } from 'vitest';
import type { AccordionMultipleProps, AccordionProps, AccordionSingleProps } from './Accordion';

test('a multiple Accordion takes only string arrays; a single one only a string or null', () => {
  expectTypeOf<AccordionMultipleProps['value']>().toEqualTypeOf<string[] | undefined>();
  expectTypeOf<AccordionMultipleProps['onValueChange']>().toEqualTypeOf<
    ((value: string[]) => void) | undefined
  >();
  expectTypeOf<AccordionSingleProps['value']>().toEqualTypeOf<string | null | undefined>();
  // @ts-expect-error a multiple Accordion's value is an array
  const multipleWithString: AccordionProps = { type: 'multiple', value: 'a' };
  // @ts-expect-error a single Accordion's value is not an array
  const singleWithArray: AccordionProps = { value: ['a'] };
  expectTypeOf(multipleWithString).toBeObject();
  expectTypeOf(singleWithArray).toBeObject();
});
