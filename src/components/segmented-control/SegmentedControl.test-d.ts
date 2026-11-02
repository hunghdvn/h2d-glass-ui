import { expectTypeOf, test } from 'vitest';
import type { SegmentedControlProps } from './SegmentedControl';
import type { SegmentedControlItemProps } from './SegmentedControlItem';

test('SegmentedControl accepts only the sizes that have a look', () => {
  expectTypeOf<SegmentedControlProps['size']>().toEqualTypeOf<'sm' | 'md' | undefined>();
  // @ts-expect-error there is no large segmented control
  const large: SegmentedControlProps = { size: 'lg' };
  expectTypeOf(large).toBeObject();
});

test('SegmentedControl takes null for no selection, and reports a string', () => {
  expectTypeOf<SegmentedControlProps['value']>().toEqualTypeOf<string | null | undefined>();
  expectTypeOf<SegmentedControlProps['onValueChange']>().toEqualTypeOf<
    ((value: string) => void) | undefined
  >();
});

test('SegmentedControlItem requires a value and content, and leaves the selection to the group', () => {
  expectTypeOf<SegmentedControlItemProps['value']>().toEqualTypeOf<string>();
  // @ts-expect-error an item without a value cannot be selected
  const noValue: SegmentedControlItemProps = { children: 'Grid' };
  expectTypeOf(noValue).toBeObject();
  // @ts-expect-error the group owns the selection
  const checked: SegmentedControlItemProps = { value: 'a', children: 'A', checked: true };
  expectTypeOf(checked).toBeObject();
});
